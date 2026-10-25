package com.ecojust.hifinitv;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Binder;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import java.util.ArrayList;
import java.util.Collection;
import java.io.File;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.Locale;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Resolve, download into the bounded local library, then decode saved audio with native media controls. */
public class PlaybackService extends Service {
    private static final String CHANNEL = "music_playback", START = "start", TOGGLE = "toggle", NEXT = "next", PREVIOUS = "previous", STOP = "stop";
    private static final int NOTIFICATION = 11;
    final class LocalBinder extends Binder { PlaybackService player() { return PlaybackService.this; } }
    private final LocalBinder binder = new LocalBinder();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor resolver = new ThreadPoolExecutor(2, 2, 0, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(2), new ThreadPoolExecutor.AbortPolicy());
    private final List<Track> queue = new ArrayList<>();
    static final int QUEUE_LIMIT = 50;
    private boolean refreshedSource, downloadSlotPrepared, localOnlyQueue, currentAudioPersistent;
    private LocalLibrary library;
    private MediaPlayer player;
    private MediaSession session;
    private AudioManager audio;
    private AudioFocusRequest focus;
    private Future<?> pending, downloadPending;
    private AudioDownloader downloader;
    private File currentAudioFile;
    private final Object filesLock = new Object();
    private final Set<File> completedDownloads = new HashSet<>();
    private int index = -1;
    private volatile int generation, downloadAttempt;
    private volatile boolean destroyed;
    private boolean prepared, loading, resumeAfterFocus;
    private String error = "", attemptedAudioUrl = "", libraryError = "";
    private Runnable listener, prepareTimeout, resolveTimeout, downloadTimeout;
    private final PlaybackOrder order = new PlaybackOrder();
    private List<String> sources = new ArrayList<>();
    private int sourceIndex;
    private long loadDeadline;
    private String stage = "";

    @Override public void onCreate() {
        super.onCreate();
        AudioDownloader.cleanCache(getCacheDir());
        try { library = new LocalLibrary(getFilesDir()); }
        catch (IOException unavailableStorage) { library = null; error = libraryError = getString(R.string.library_unavailable); }
        // Playback queues and temporary media links stay in this session only.
        order.shuffle(getSharedPreferences("music_playback", 0).getBoolean("shuffle", true));
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attributes)
                .setOnAudioFocusChangeListener(change -> {
                    if (change == AudioManager.AUDIOFOCUS_LOSS) pause(false);
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) { resumeAfterFocus = playing(); pause(true); }
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK && player != null) player.setVolume(.2f, .2f);
                    else if (change == AudioManager.AUDIOFOCUS_GAIN) {
                        if (player != null) player.setVolume(1f, 1f);
                        if (resumeAfterFocus && prepared) { resumeAfterFocus = false; resume(); }
                    }
                }, main).build();
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(
                new NotificationChannel(CHANNEL, getString(R.string.playback_channel), NotificationManager.IMPORTANCE_LOW));
        session = new MediaSession(this, "HIFINiTV");
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { resume(); }
            @Override public void onPause() { pause(false); }
            @Override public void onSkipToNext() { next(); }
            @Override public void onSkipToPrevious() { previous(); }
            @Override public void onSeekTo(long position) { seek(position); }
            @Override public void onStop() { stopPlayback(); }
        });
        session.setActive(true);
        updateState();
    }
    @Override public IBinder onBind(Intent intent) { return binder; }
    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent == null ? START : intent.getAction();
        if (TOGGLE.equals(action)) toggle();
        else if (NEXT.equals(action)) next();
        else if (PREVIOUS.equals(action)) previous();
        else if (STOP.equals(action)) stopPlayback();
        else if (loading || playing()) startForeground(NOTIFICATION, notification());
        else stopSelf();
        return START_NOT_STICKY;
    }
    void listen(Runnable callback) { listener = callback; }
    List<Track> queue() { return new ArrayList<>(queue); }
    List<Track> localTracks() { return library == null ? new ArrayList<>() : library.tracks(); }
    long libraryRevision() { return library == null ? 0 : library.revision(); }
    String libraryError() { return libraryError; }
    /** Main-thread operation. Returns the actual deletion count, or -1 with a localized storage error. */
    int deleteLocalTracks(Collection<String> requestedIds) {
        libraryError = "";
        if (library == null) { libraryError = getString(R.string.library_unavailable); changed(); return -1; }
        Set<String> requested = requestedIds == null ? new HashSet<>() : new HashSet<>(requestedIds);
        Set<String> removing = new HashSet<>();
        for (Track track : library.tracks()) if (requested.contains(track.id)) removing.add(track.id);
        if (removing.isEmpty()) { changed(); return 0; }
        String playingId = current() == null ? "" : current().id;
        boolean removingCurrent = removing.contains(playingId);
        if (removingCurrent) stopPlayback();
        boolean failed = false;
        try { library.removeAll(removing); }
        catch (IOException unavailableStorage) { libraryError = getString(R.string.library_unavailable); failed = true; }
        // A committed index can outlive a failed retired-file cleanup. Reconcile the actual library even on error.
        Set<String> removed = new HashSet<>(removing);
        for (Track retained : library.tracks()) removed.remove(retained.id);
        if (!removed.isEmpty()) {
            // Search results remain in the UI, but automatic next/previous must not redownload deleted songs.
            queue.removeIf(track -> removed.contains(track.id));
            index = -1;
            if (!removed.contains(playingId)) for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(playingId)) { index = i; break; }
            if (removed.contains(playingId)) { attemptedAudioUrl = ""; error = ""; sources.clear(); }
            order.clear();
            if (index >= 0) order.record(index, queue.size());
        }
        changed(); return failed ? -1 : removed.size();
    }
    Track current() { return index >= 0 && index < queue.size() ? queue.get(index) : null; }
    int currentIndex() { return index; }
    boolean loading() { return loading; }
    String stage() { return stage; }
    boolean shuffled() { return order.shuffled(); }
    void shuffle(boolean enabled) {
        order.shuffle(enabled);
        getSharedPreferences("music_playback", 0).edit().putBoolean("shuffle", enabled).apply();
        changed();
    }
    void playList(List<Track> tracks, boolean shuffled) { playList(tracks, shuffled, false); }
    void playLocalList(List<Track> tracks, boolean shuffled) { playList(tracks, shuffled, true); }
    private void playList(List<Track> tracks, boolean shuffled, boolean localOnly) {
        if (tracks.isEmpty()) return;
        List<Track> copy = new ArrayList<>(tracks);
        clearQueue(); localOnlyQueue = localOnly;
        for (Track track : copy) { if (!add(track, false)) break; }
        shuffle(shuffled);
        play(shuffled ? order.next(-1, queue.size()) : 0);
    }
    void playListAt(List<Track> tracks, int startIndex) { playListAt(tracks, startIndex, false); }
    void playLocalListAt(List<Track> tracks, int startIndex) { playListAt(tracks, startIndex, true); }
    private void playListAt(List<Track> tracks, int startIndex, boolean localOnly) {
        if (startIndex < 0 || startIndex >= tracks.size()) return;
        String selected = tracks.get(startIndex).id;
        List<Track> copy = new ArrayList<>(tracks);
        clearQueue(); localOnlyQueue = localOnly;
        for (Track track : copy) { if (!add(track, false)) break; }
        shuffle(false);
        for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(selected)) { play(i); return; }
    }
    String error() { return error; }
    /** Remote download URL or canonical catalog link; never exposes the private local playback path. */
    String audioUrl() { return attemptedAudioUrl; }
    boolean playing() { try { return player != null && prepared && player.isPlaying(); } catch (IllegalStateException ignored) { return false; } }
    long position() { try { return player != null && prepared ? Math.max(0, player.getCurrentPosition()) : 0; } catch (IllegalStateException ignored) { return 0; } }
    long duration() { try { return player != null && prepared ? Math.max(0, player.getDuration()) : 0; } catch (IllegalStateException ignored) { return 0; } }

    boolean add(Track track, boolean playNow) {
        int found = -1;
        for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(track.id)) { found = i; break; }
        if (found < 0) {
            if (queue.size() >= QUEUE_LIMIT) return false;
            queue.add(track); found = queue.size() - 1;
        }
        if (playNow) play(found); else changed();
        return true;
    }
    void play(int position) {
        if (position < 0 || position >= queue.size() || destroyed) return;
        cancelResolve(); releasePlayer(); clearAudioFile();
        index = position; order.record(index, queue.size()); error = ""; attemptedAudioUrl = ""; loading = true; resumeAfterFocus = false;
        refreshedSource = false; downloadSlotPrepared = false; sources = new ArrayList<>();
        stage = getString(R.string.fetch_detail);
        loadDeadline = SystemClock.elapsedRealtime() + 120000;
        startForegroundService(new Intent(this, PlaybackService.class).setAction(START));
        startForeground(NOTIFICATION, notification());
        changed();
        if (library == null) { fail(getString(R.string.library_unavailable)); return; }
        try {
            File saved = library.find(current().id);
            if (saved != null) {
                for (Track stored : library.tracks()) if (stored.id.equals(current().id)) { queue.set(index, stored); break; }
                // Local replay does not contact HiFiNi or update insertion order. Never expose a private path in the QR.
                try { attemptedAudioUrl = current().source.isEmpty() ? "" : HifiniApi.buildPlaybackUrl(current()); }
                catch (IOException unavailableLink) { attemptedAudioUrl = ""; }
                prepareLocal(saved, generation, true); return;
            }
        } catch (IOException unavailableStorage) { fail(getString(R.string.library_unavailable)); return; }
        if (localOnlyQueue) { fail(getString(R.string.local_audio_missing)); return; }
        changed(); // A missing library file may have been pruned by find().
        resolveCurrent(generation);
    }
    private void resolveCurrent(int ticket) {
        Track track = current();
        if (track == null || destroyed || ticket != generation) return;
        long remaining = loadDeadline - SystemClock.elapsedRealtime();
        if (remaining <= 0) { fail(getString(R.string.resolve_timeout)); return; }
        resolveTimeout = () -> { if (ticket == generation && loading) fail(getString(R.string.resolve_timeout)); };
        main.postDelayed(resolveTimeout, Math.min(20000, remaining));
        try { pending = resolver.submit(() -> {
            try {
                HifiniApi.Resolved resolved = resolveTrack(track, message -> main.post(() -> {
                    if (!destroyed && ticket == generation && loading && !refreshedSource) {
                        stage = getString(HifiniApi.STAGE_PAGE.equals(message) ? R.string.fetch_detail : R.string.request_audio); changed();
                    }
                }));
                if (resolved == null || resolved.track == null || !track.id.equals(resolved.track.id)
                        || resolved.audioUrls == null || resolved.audioUrls.isEmpty() || resolved.audioUrls.size() > 3)
                    throw new MusicError(R.string.link_unavailable);
                main.post(() -> {
                    if (!destroyed && ticket == generation) {
                        if (resolveTimeout != null) main.removeCallbacks(resolveTimeout);
                        resolveTimeout = null;
                        queue.set(index, resolved.track);
                        sources = new ArrayList<>(resolved.audioUrls); sourceIndex = 0;
                        downloadSource(sources.get(0), ticket);
                    }
                });
            } catch (Exception e) {
                String message = MusicError.display(this,e);
                main.post(() -> { if (!destroyed && ticket == generation) fail(stage + " " + message); });
            }
        }); } catch (java.util.concurrent.RejectedExecutionException e) { fail(getString(R.string.request_busy)); }
    }
    HifiniApi.Resolved resolveTrack(Track track, java.util.function.Consumer<String> progress) throws java.io.IOException {
        return HifiniApi.get().resolve(track, progress);
    }
    private void retryDownload(int ticket, String message, boolean mayRefresh) {
        if (ticket != generation || destroyed) return;
        if (sourceIndex + 1 < sources.size() && SystemClock.elapsedRealtime() < loadDeadline) {
            downloadSource(sources.get(++sourceIndex), ticket);
        } else if (mayRefresh && !refreshedSource && SystemClock.elapsedRealtime() < loadDeadline) {
            // A signed media URL may have expired. Refresh only once after a download failure.
            refreshedSource = true; cancelDownload(); releasePlayer(); clearAudioFile(); loading = true;
            stage = getString(R.string.refreshing_audio); changed(); resolveCurrent(ticket);
        } else fail(message);
    }
    private void downloadSource(String source, int ticket) {
        if (destroyed || ticket != generation) return;
        cancelDownload(); releasePlayer(); clearAudioFile(); loading = true;
        long remaining = loadDeadline - SystemClock.elapsedRealtime();
        if (remaining <= 0) { fail(getString(R.string.download_timeout)); return; }
        if (!downloadSlotPrepared) {
            try {
                library.prepareDownload(current()); downloadSlotPrepared = true;
                changed(); // Publish FIFO eviction before opening a network download.
            } catch (IOException unavailableStorage) { fail(getString(R.string.library_unavailable)); return; }
        }
        if (destroyed || ticket != generation) return;
        attemptedAudioUrl = source; stage = getString(R.string.download_start); changed();
        if (destroyed || ticket != generation) return;
        remaining = Math.max(1, loadDeadline - SystemClock.elapsedRealtime());
        final int attempt = downloadAttempt;
        final AudioDownloader transfer = new AudioDownloader(getCacheDir());
        final String referer = current().pageUrl();
        downloader = transfer;
        downloadTimeout = () -> {
            if (activeDownload(ticket, attempt)) retryDownload(ticket, getString(R.string.download_timeout), false);
        };
        main.postDelayed(downloadTimeout, Math.min(90000, remaining));
        try { downloadPending = resolver.submit(() -> {
            try {
                File file = downloadAudio(transfer, source, referer, progress -> main.post(() -> {
                    if (!activeDownload(ticket, attempt) || downloader != transfer || !loading) return;
                    stage = progress.total > 0
                            ? getString(R.string.download_progress_percent, (int)Math.min(100, progress.downloaded * 100 / progress.total))
                            : getString(R.string.download_progress_size, readableBytes(progress.downloaded));
                    changed();
                }));
                if (file == null || !file.isFile() || file.length() == 0) { deleteFile(file); throw new IOException("No completed audio file"); }
                synchronized (filesLock) {
                    if (!activeDownload(ticket, attempt)) { deleteFile(file); return; }
                    completedDownloads.add(file);
                }
                main.post(() -> {
                    synchronized (filesLock) { completedDownloads.remove(file); }
                    if (!activeDownload(ticket, attempt)) { deleteFile(file); return; }
                    if (downloadTimeout != null) main.removeCallbacks(downloadTimeout);
                    downloadTimeout = null; downloadPending = null; downloader = null;
                    try {
                        stage = getString(R.string.saving_audio); changed();
                        if (!activeDownload(ticket, attempt)) { deleteFile(file); return; }
                        File saved = library.save(current(), file);
                        prepareLocal(saved, ticket, true);
                    } catch (IOException unavailableStorage) {
                        deleteFile(file); fail(getString(R.string.library_unavailable));
                    }
                });
            } catch (Exception failure) {
                String message = downloadFailure(failure);
                main.post(() -> {
                    if (!activeDownload(ticket, attempt)) return;
                    // Logout changes the request epoch. Cancellation must never continue on a backup URL.
                    if (failure instanceof AudioDownloader.DownloadException
                            && ((AudioDownloader.DownloadException)failure).failure == AudioDownloader.Failure.CANCELLED) fail(message);
                    else retryDownload(ticket, message, retryableDownload(failure));
                });
            } finally { transfer.close(); }
        }); } catch (java.util.concurrent.RejectedExecutionException busy) { transfer.close(); fail(getString(R.string.request_busy)); }
    }
    File downloadAudio(AudioDownloader transfer, String source, String referer,
            java.util.function.Consumer<AudioDownloader.Progress> progress) throws IOException {
        return transfer.download(source, referer, progress);
    }
    private boolean activeDownload(int ticket, int attempt) {
        return !destroyed && ticket == generation && attempt == downloadAttempt;
    }
    private static String readableBytes(long bytes) {
        return bytes >= 1024 * 1024 ? String.format(Locale.ROOT, "%.1f MB", bytes / (1024d * 1024))
                : String.format(Locale.ROOT, "%d KB", Math.max(0, bytes) / 1024);
    }
    private String downloadFailure(Exception failure) {
        String detail;
        if (failure instanceof AudioDownloader.DownloadException) {
            AudioDownloader.DownloadException download = (AudioDownloader.DownloadException)failure;
            switch (download.failure) {
                case TIMEOUT: detail = getString(R.string.download_timeout); break;
                case TOO_LARGE: detail = getString(R.string.audio_download_too_large); break;
                case LOGIN_REQUIRED: detail = getString(R.string.source_login_required); break;
                case HTTP_STATUS: detail = getString(R.string.source_unavailable, download.statusCode); break;
                case INVALID_AUDIO: detail = getString(R.string.audio_download_invalid); break;
                case UNSUPPORTED_URL: detail = getString(R.string.unsupported_link); break;
                case CANCELLED: detail = getString(R.string.playback_cancelled); break;
                default: detail = getString(R.string.audio_download_failed); break;
            }
        } else detail = MusicError.display(this, failure);
        return getString(R.string.download_failed_detail, detail);
    }
    private static boolean retryableDownload(Exception failure) {
        if (!(failure instanceof AudioDownloader.DownloadException)) return failure instanceof IOException;
        AudioDownloader.Failure kind = ((AudioDownloader.DownloadException)failure).failure;
        return kind == AudioDownloader.Failure.HTTP_STATUS || kind == AudioDownloader.Failure.TIMEOUT;
    }
    private void prepareLocal(File file, int ticket, boolean persistent) {
        releasePlayer(); clearAudioFile(); currentAudioFile = file; currentAudioPersistent = persistent; loading = true;
        stage = getString(R.string.preparing_audio); changed();
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            // URL suffixes and streaming-server quirks no longer reach the system decoder.
            player.setDataSource(file.getAbsolutePath());
            player.setOnPreparedListener(value -> {
                if (destroyed || ticket != generation || value != player) return;
                prepared = true; loading = false;
                if (prepareTimeout != null) main.removeCallbacks(prepareTimeout);
                prepareTimeout = null; resume();
            });
            player.setOnCompletionListener(value -> {
                if (ticket != generation || value != player) return;
                if (order.shuffled() || index + 1 < queue.size()) next();
                else { pause(false); seek(0); }
            });
            player.setOnErrorListener((value, what, extra) -> {
                if (ticket == generation && value == player) fail(getString(R.string.decoder_error, what, extra));
                return true;
            });
            player.prepareAsync();
            prepareTimeout = () -> {
                if (ticket == generation && loading) fail(getString(R.string.local_prepare_timeout));
            };
            main.postDelayed(prepareTimeout, Math.max(1, Math.min(10000, loadDeadline - SystemClock.elapsedRealtime())));
        } catch (Exception failure) { fail(getString(R.string.playback_error_detail, nativeFailureDetail(failure))); }
    }
    private String nativeFailureDetail(Exception error) {
        // Native setDataSource errors often carry a useful status code. Do not display arbitrary
        // exception messages: they can contain signed media URLs or other request details.
        String diagnostic = error.getClass().getSimpleName();
        String message = error.getMessage();
        if (message != null) {
            java.util.regex.Matcher status = java.util.regex.Pattern.compile("(?i)\\bstatus\\s*=\\s*(?:0x[0-9a-f]{1,8}|-?[0-9]{1,10})\\b").matcher(message);
            if (status.find()) diagnostic += "; " + status.group().replaceAll("\\s+", "");
        }
        return MusicError.display(this, error) + " (" + diagnostic + ")";
    }
    void toggle() {
        if (loading) pause(false);
        else if (playing()) pause(false);
        else resume();
    }
    void resume() {
        if (!prepared || player == null) { if (index >= 0) play(index); return; }
        if (audio.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { fail(getString(R.string.focus_denied)); return; }
        startForegroundService(new Intent(this, PlaybackService.class).setAction(START));
        player.start(); resumeAfterFocus = false;
        startForeground(NOTIFICATION, notification()); changed();
    }
    void pause(boolean transientLoss) {
        if (loading) { cancelResolve(); releasePlayer(); clearAudioFile(); loading = false; }
        if (playing()) player.pause();
        if (!transientLoss) {
            resumeAfterFocus = false; audio.abandonAudioFocusRequest(focus);
            stopForeground(STOP_FOREGROUND_REMOVE); stopSelf();
        } else updateNotification();
        changed();
    }
    void next() { if (!queue.isEmpty()) play(order.next(index, queue.size())); }
    void previous() {
        if (position() > 3000) seek(0);
        else if (!queue.isEmpty()) play(order.previous(index, queue.size()));
    }
    void seek(long position) {
        if (player != null && prepared) {
            player.seekTo(Math.min(Math.max(0, position), duration()), MediaPlayer.SEEK_CLOSEST);
            updateState();
        }
    }
    void clearQueue() {
        attemptedAudioUrl = ""; stopPlayback(); queue.clear(); order.clear(); index = -1; localOnlyQueue = false; changed();
    }
    private void fail(String message) { error = message; loading = false; cancelResolve(); releasePlayer(); clearAudioFile(); audio.abandonAudioFocusRequest(focus); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); changed(); }
    private void stopPlayback() {
        cancelResolve(); loading = false; releasePlayer(); clearAudioFile(); resumeAfterFocus = false;
        audio.abandonAudioFocusRequest(focus); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); changed();
    }
    private void cancelResolve() {
        if (resolveTimeout != null) main.removeCallbacks(resolveTimeout);
        resolveTimeout = null; generation++;
        if (pending != null) pending.cancel(true);
        pending = null; cancelDownload(); resolver.purge();
    }
    private void cancelDownload() {
        downloadAttempt++;
        if (downloadTimeout != null) main.removeCallbacks(downloadTimeout);
        downloadTimeout = null;
        if (downloader != null) downloader.cancel();
        downloader = null;
        if (downloadPending != null) downloadPending.cancel(true);
        downloadPending = null;
        synchronized (filesLock) {
            for (File file : completedDownloads) deleteFile(file);
            completedDownloads.clear();
        }
        resolver.purge();
    }
    private void clearAudioFile() {
        if (!currentAudioPersistent) deleteFile(currentAudioFile);
        currentAudioFile = null; currentAudioPersistent = false;
    }
    private static void deleteFile(File file) { if (file != null) file.delete(); }
    private void releasePlayer() { if (prepareTimeout != null) main.removeCallbacks(prepareTimeout); prepareTimeout = null; prepared = false; if (player != null) { player.release(); player = null; } }
    private void changed() { updateState(); if (listener != null) listener.run(); }
    private void updateState() {
        int state = loading ? PlaybackState.STATE_BUFFERING : playing() ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED;
        session.setPlaybackState(new PlaybackState.Builder().setState(state, position(), playing() ? 1f : 0f)
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_SEEK_TO | PlaybackState.ACTION_STOP).build());
        Track track = current();
        if (track != null) session.setMetadata(new android.media.MediaMetadata.Builder()
                .putString(android.media.MediaMetadata.METADATA_KEY_TITLE, track.title)
                .putString(android.media.MediaMetadata.METADATA_KEY_ARTIST, track.artist)
                .putLong(android.media.MediaMetadata.METADATA_KEY_DURATION, duration()).build());
    }
    private PendingIntent command(String action, int request) {
        return PendingIntent.getService(this, request, new Intent(this, PlaybackService.class).setAction(action), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }
    private Notification notification() {
        Track track = current();
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class)
                .addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP), PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        return new Notification.Builder(this, CHANNEL).setSmallIcon(R.drawable.ic_music)
                .setContentTitle(track == null ? getString(R.string.app_name) : track.title)
                .setContentText(loading ? stage : track == null ? "" : track.artist)
                .setContentIntent(open).setOnlyAlertOnce(true).setOngoing(playing() || loading)
                .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_previous, getString(R.string.previous), command(PREVIOUS, 1)).build())
                .addAction(new Notification.Action.Builder(playing() ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        getString(playing() ? R.string.pause : R.string.play), command(TOGGLE, 2)).build())
                .addAction(new Notification.Action.Builder(android.R.drawable.ic_media_next, getString(R.string.next), command(NEXT, 3)).build())
                .addAction(new Notification.Action.Builder(android.R.drawable.ic_menu_close_clear_cancel, getString(R.string.stop), command(STOP, 4)).build())
                .setStyle(new Notification.MediaStyle().setMediaSession(session.getSessionToken()).setShowActionsInCompactView(0, 1, 2)).build();
    }
    private void updateNotification() { ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).notify(NOTIFICATION, notification()); }
    @Override public void onTaskRemoved(Intent rootIntent) { stopPlayback(); super.onTaskRemoved(rootIntent); }
    @Override public void onDestroy() {
        destroyed = true; listener = null; cancelResolve(); resolver.shutdownNow(); main.removeCallbacksAndMessages(null);
        releasePlayer(); clearAudioFile(); if (audio != null) audio.abandonAudioFocusRequest(focus);
        if (session != null) { session.setActive(false); session.release(); }
        super.onDestroy();
    }
}
