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
import android.net.Uri;
import android.os.Binder;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.SystemClock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** One native decoder, bounded resolving work, native audio focus and foreground media controls. */
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
    private boolean refreshedSource;
    private long resumePosition;
    private MediaPlayer player;
    private MediaSession session;
    private AudioManager audio;
    private AudioFocusRequest focus;
    private Future<?> pending;
    private int index = -1, generation;
    private boolean prepared, loading, destroyed, resumeAfterFocus;
    private String error = "";
    private Runnable listener, prepareTimeout, resolveTimeout;
    private final PlaybackOrder order = new PlaybackOrder();
    private List<String> sources = new ArrayList<>();
    private int sourceIndex;
    private long loadDeadline;
    private String stage = "";

    @Override public void onCreate() {
        super.onCreate();
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
    void playList(List<Track> tracks, boolean shuffled) {
        if (tracks.isEmpty()) return;
        List<Track> copy = new ArrayList<>(tracks);
        clearQueue();
        for (Track track : copy) { if (!add(track, false)) break; }
        shuffle(shuffled);
        play(shuffled ? order.next(-1, queue.size()) : 0);
    }
    void playListAt(List<Track> tracks, int startIndex) {
        if (startIndex < 0 || startIndex >= tracks.size()) return;
        String selected = tracks.get(startIndex).id;
        List<Track> copy = new ArrayList<>(tracks);
        clearQueue();
        for (Track track : copy) { if (!add(track, false)) break; }
        shuffle(false);
        for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(selected)) { play(i); return; }
    }
    String error() { return error; }
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
        cancelResolve(); releasePlayer();
        index = position; order.record(index, queue.size()); error = ""; loading = true; resumeAfterFocus = false;
        refreshedSource = false; resumePosition = 0; sources = new ArrayList<>();
        stage = getString(R.string.fetch_detail);
        loadDeadline = SystemClock.elapsedRealtime() + 45000;
        startForegroundService(new Intent(this, PlaybackService.class).setAction(START));
        startForeground(NOTIFICATION, notification());
        changed();
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
                        prepare(sources.get(0), ticket);
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
    private void retrySource(int ticket, String message, boolean mayRefresh) {
        if (ticket != generation || destroyed) return;
        if (!loading) { resumePosition = position(); loadDeadline = SystemClock.elapsedRealtime() + 45000; }
        if (sourceIndex + 1 < sources.size() && SystemClock.elapsedRealtime() < loadDeadline) {
            prepare(sources.get(++sourceIndex), ticket);
        } else if (mayRefresh && !refreshedSource && SystemClock.elapsedRealtime() < loadDeadline) {
            // The thread is stable but its media URL may expire. Refresh once, never reuse it from disk.
            refreshedSource = true; releasePlayer(); loading = true;
            stage = getString(R.string.refreshing_audio); changed(); resolveCurrent(ticket);
        } else fail(message);
    }
    private void prepare(String source, int ticket) {
        releasePlayer(); loading = true;
        stage = getString(R.string.connecting_audio, sourceIndex + 1, sources.size());
        changed();
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            HashMap<String, String> headers = new HashMap<>();
            headers.put("Referer", current().pageUrl());
            headers.put("User-Agent", HifiniApi.AGENT);
            player.setDataSource(this, Uri.parse(source), headers);
            player.setOnPreparedListener(value -> {
                if (destroyed || ticket != generation || value != player) return;
                prepared = true; loading = false;
                if (prepareTimeout != null) main.removeCallbacks(prepareTimeout);
                if (resumePosition > 0) { seek(resumePosition); resumePosition = 0; }
                resume();
            });
            player.setOnCompletionListener(value -> {
                if (ticket != generation || value != player) return;
                if (order.shuffled() || index + 1 < queue.size()) next();
                else { pause(false); seek(0); }
            });
            player.setOnErrorListener((value, what, extra) -> {
                if (ticket == generation && value == player) retrySource(ticket, getString(R.string.decoder_error, what, extra), true);
                return true;
            });
            player.prepareAsync();
            prepareTimeout = () -> { if (ticket == generation && loading) retrySource(ticket, getString(R.string.connect_timeout), false); };
            main.postDelayed(prepareTimeout, Math.max(1, Math.min(10000, loadDeadline - SystemClock.elapsedRealtime())));
        } catch (Exception e) { retrySource(ticket, getString(R.string.playback_error_detail, MusicError.display(this,e)), true); }
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
        if (loading) { cancelResolve(); releasePlayer(); loading = false; }
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
        stopPlayback(); queue.clear(); order.clear(); index = -1; changed();
    }
    private void fail(String message) { error = message; loading = false; cancelResolve(); releasePlayer(); audio.abandonAudioFocusRequest(focus); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); changed(); }
    private void stopPlayback() {
        cancelResolve(); loading = false; releasePlayer(); resumeAfterFocus = false;
        audio.abandonAudioFocusRequest(focus); stopForeground(STOP_FOREGROUND_REMOVE); stopSelf(); changed();
    }
    private void cancelResolve() { if (resolveTimeout != null) main.removeCallbacks(resolveTimeout); resolveTimeout = null; generation++; if (pending != null) pending.cancel(true); pending = null; resolver.purge(); }
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
        releasePlayer(); if (audio != null) audio.abandonAudioFocusRequest(focus);
        if (session != null) { session.setActive(false); session.release(); }
        super.onDestroy();
    }
}
