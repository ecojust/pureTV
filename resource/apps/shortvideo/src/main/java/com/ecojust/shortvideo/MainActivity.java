package com.ecojust.shortvideo;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.widget.*;
import java.util.HashMap;
import java.util.Locale;

/** One native video decoder and surface; no background playback or video cache. */
public class MainActivity extends Activity implements SurfaceHolder.Callback, FeedController.Events {
    private final Handler main = new Handler(Looper.getMainLooper());
    private FeedController feed;
    private SharedPreferences settings;
    private FrameLayout root, stage;
    private SurfaceView surface;
    private LinearLayout header, footer, messagePanel;
    private TextView sourceLabel, modeLabel, message, counter, elapsed;
    private ProgressBar spinner, progress;
    private Button previous, toggle, retry;
    private MediaPlayer player;
    private AudioManager audio;
    private AudioFocusRequest focus;
    private MediaSession mediaSession;
    private AlertDialog sourceDialog;
    private boolean active, surfaceReady, prepared, preparing, buffering, fetching;
    private boolean wantPlay = true, resumeAfterFocus, resumePending, controlsVisible = true;
    private int videoWidth = 9, videoHeight = 16, decoderGeneration;
    private long savedPosition;
    private String currentUrl = "", error = "";
    private Runnable timeout;
    private final Runnable hideControls = () -> { if (isPlaying() && sourceDialog == null && !buffering) showControls(false, false); };
    private final Runnable tick = new Runnable() {
        @Override public void run() { if (active) { updateProgress(); main.postDelayed(this, 1000); } }
    };

    protected FeedController.Loader createLoader() { return new VideoFeed(); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        settings = getSharedPreferences("shortvideo", MODE_PRIVATE);
        feed = new FeedController(createLoader(), this, VideoFeed.Source.from(settings.getString("source", "KULEU")));
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build();
        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attributes)
                .setOnAudioFocusChangeListener(change -> {
                    if (!active) return;
                    if (change == AudioManager.AUDIOFOCUS_LOSS) { wantPlay = false; resumeAfterFocus = false; pausePlayer(); }
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) { resumeAfterFocus = isPlaying(); pausePlayer(); }
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK && player != null) player.setVolume(.2f, .2f);
                    else if (change == AudioManager.AUDIOFOCUS_GAIN) {
                        if (player != null) player.setVolume(1f, 1f);
                        if (resumeAfterFocus && wantPlay && sourceDialog == null) { resumeAfterFocus = false; startPlayer(); }
                    }
                }, main).build();
        buildUi();
    }
    private void buildUi() {
        root = new FrameLayout(this); root.setBackgroundColor(0xff111319); root.setFocusableInTouchMode(true);
        stage = new FrameLayout(this); root.addView(stage, new FrameLayout.LayoutParams(-1, -1));
        surface = new SurfaceView(this); surface.setContentDescription(getString(R.string.app_name));
        stage.addView(surface, new FrameLayout.LayoutParams(1, 1, Gravity.CENTER));
        surface.getHolder().addCallback(this);
        stage.addOnLayoutChangeListener((v, l, t, r, b, ol, ot, or, ob) -> layoutVideo());
        header = column(); header.setPadding(dp(26), dp(18), dp(12), 0);
        header.addView(text(getString(R.string.app_name), 25));
        sourceLabel = text(getString(R.string.source_label, getString(feed.source().label)), 15); sourceLabel.setTextColor(0xffa9acb6); header.addView(sourceLabel);
        counter = text("", 14); counter.setTextColor(0xffa9acb6); header.addView(counter);
        root.addView(header, new FrameLayout.LayoutParams(-2, -2, Gravity.TOP | Gravity.START));
        modeLabel = text(getString(R.string.auto_play), 15); modeLabel.setPadding(0, dp(25), dp(26), 0);
        root.addView(modeLabel, new FrameLayout.LayoutParams(-2, -2, Gravity.TOP | Gravity.END));
        messagePanel = column(); messagePanel.setGravity(Gravity.CENTER); messagePanel.setPadding(dp(30), dp(20), dp(30), dp(80));
        spinner = new ProgressBar(this); messagePanel.addView(spinner, new LinearLayout.LayoutParams(dp(32), dp(32)));
        message = text(getString(R.string.loading_feed), 18); message.setGravity(Gravity.CENTER); message.setMaxLines(3); message.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams msg = new LinearLayout.LayoutParams(-1, -2); msg.topMargin = dp(12); msg.bottomMargin = dp(14); messagePanel.addView(message, msg);
        retry = button(R.string.retry, () -> { wantPlay = true; feed.fresh(); }); messagePanel.addView(retry, new LinearLayout.LayoutParams(dp(140), dp(48)));
        retry.setVisibility(View.GONE); root.addView(messagePanel, new FrameLayout.LayoutParams(-1, -1));
        footer = column(); footer.setGravity(Gravity.CENTER_HORIZONTAL); footer.setPadding(dp(24), dp(6), dp(24), dp(10)); footer.setBackgroundColor(0xe6111319);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); progress.setMax(1000); footer.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        elapsed = text("0:00 / 0:00", 13); elapsed.setGravity(Gravity.CENTER); footer.addView(elapsed, new LinearLayout.LayoutParams(-1, dp(22)));
        LinearLayout actions = new LinearLayout(this); actions.setGravity(Gravity.CENTER); actions.setOrientation(LinearLayout.HORIZONTAL);
        previous = button(R.string.previous, this::previous); toggle = button(R.string.pause, this::toggle);
        Button next = button(R.string.next, this::next), sources = button(R.string.sources, this::sources);
        for (Button action : new Button[]{previous, toggle, next, sources}) {
            LinearLayout.LayoutParams item = new LinearLayout.LayoutParams(dp(100), dp(48)); item.setMargins(dp(4), dp(4), dp(4), dp(4)); actions.addView(action, item);
        }
        footer.addView(actions); TextView hints = text(getString(R.string.hints), 12); hints.setGravity(Gravity.CENTER); hints.setTextColor(0xffa9acb6); footer.addView(hints, new LinearLayout.LayoutParams(-1, dp(22)));
        root.addView(footer, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        setContentView(root); toggle.requestFocus(); updateControls();
    }
    @Override protected void onStart() {
        super.onStart(); active = true; createMediaSession(); feed.activate(); main.post(tick);
        if (surfaceReady && player == null) feed.start();
    }
    @Override protected void onStop() {
        active = false; feed.suspend(); main.removeCallbacks(tick); main.removeCallbacks(hideControls);
        if (sourceDialog != null) sourceDialog.dismiss();
        releasePlayer(true); root.setKeepScreenOn(false);
        if (mediaSession != null) { mediaSession.setActive(false); mediaSession.release(); mediaSession = null; }
        super.onStop();
    }
    @Override protected void onDestroy() {
        feed.close(); surface.getHolder().removeCallback(this); main.removeCallbacksAndMessages(null); super.onDestroy();
    }
    @Override public void surfaceCreated(SurfaceHolder holder) { surfaceReady = true; if (active && player == null) feed.start(); }
    @Override public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) { layoutVideo(); }
    @Override public void surfaceDestroyed(SurfaceHolder holder) { surfaceReady = false; releasePlayer(true); }

    @Override public void loading() {
        releasePlayer(false); fetching = true; error = ""; showControls(true, false); setMessage(getString(R.string.loading_feed), true); updateControls();
    }
    @Override public void clip(VideoFeed.Clip clip) {
        if (!active || !surfaceReady) return;
        long restore = resumePending && clip.url.equals(currentUrl) ? savedPosition : 0;
        releasePlayer(false); savedPosition = restore; resumePending = false; currentUrl = clip.url;
        fetching = false; preparing = true; buffering = false; error = "";
        sourceLabel.setText(getString(R.string.source_label, getString(clip.source.label))); counter.setText(getString(R.string.clip_number, feed.index() + 1));
        showControls(true, false); setMessage(getString(R.string.loading_video), true); updateControls();
        int ticket = decoderGeneration;
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build());
            player.setDisplay(surface.getHolder());
            player.setOnVideoSizeChangedListener((value, width, height) -> {
                if (value != player || ticket != decoderGeneration) return;
                if (width > 0 && height > 0) { videoWidth = width; videoHeight = height; layoutVideo(); }
            });
            player.setOnPreparedListener(value -> {
                if (!validDecoder(value, ticket)) return;
                prepared = true; preparing = false; buffering = false; cancelTimeout(); messagePanel.setVisibility(View.GONE);
                if (value.getVideoWidth() > 0 && value.getVideoHeight() > 0) { videoWidth = value.getVideoWidth(); videoHeight = value.getVideoHeight(); layoutVideo(); }
                if (savedPosition > 0) { value.seekTo(Math.min(savedPosition, Math.max(0, value.getDuration() - 1)), MediaPlayer.SEEK_CLOSEST); savedPosition = 0; }
                if (wantPlay && sourceDialog == null) startPlayer(); else updateControls();
            });
            player.setOnCompletionListener(value -> { if (validDecoder(value, ticket)) { if (wantPlay) next(); else updateControls(); } });
            player.setOnErrorListener((value, what, extra) -> { if (validDecoder(value, ticket)) fail(getString(R.string.decoder_error, what, extra)); return true; });
            player.setOnInfoListener((value, what, extra) -> {
                if (!validDecoder(value, ticket)) return false;
                if (what == MediaPlayer.MEDIA_INFO_BUFFERING_START) { buffering = true; setMessage(getString(R.string.buffering), true); armTimeout(ticket); showControls(true, false); updateControls(); }
                else if (what == MediaPlayer.MEDIA_INFO_BUFFERING_END) { buffering = false; cancelTimeout(); messagePanel.setVisibility(View.GONE); scheduleHide(); updateControls(); }
                return false;
            });
            HashMap<String,String> headers = new HashMap<>(); headers.put("User-Agent", "Mozilla/5.0 (Linux; Android 9)");
            player.setDataSource(this, android.net.Uri.parse(clip.url), headers); player.prepareAsync(); armTimeout(ticket);
        } catch (Exception e) { fail(getString(R.string.network_error)); }
    }
    @Override public void error(int message, Object... arguments) { fetching = false; fail(getString(message, arguments)); }
    private boolean validDecoder(MediaPlayer value, int ticket) { return active && surfaceReady && value == player && ticket == decoderGeneration; }
    private void armTimeout(int ticket) {
        cancelTimeout(); timeout = () -> { if (active && ticket == decoderGeneration) fail(getString(R.string.load_timeout)); }; main.postDelayed(timeout, 25000);
    }
    private void cancelTimeout() { if (timeout != null) main.removeCallbacks(timeout); timeout = null; }
    private void releasePlayer(boolean remember) {
        if (remember && prepared && player != null) { savedPosition = player.getCurrentPosition(); resumePending = true; }
        decoderGeneration++; cancelTimeout(); resumeAfterFocus = false; if (root != null) root.setKeepScreenOn(false); prepared = false; preparing = false; buffering = false;
        if (player != null) { player.setDisplay(null); player.release(); player = null; }
        if (audio != null) audio.abandonAudioFocusRequest(focus);
    }
    private void startPlayer() {
        if (!active || !prepared || player == null || sourceDialog != null || !wantPlay) return;
        if (audio.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { fail(getString(R.string.focus_denied)); return; }
        try { player.start(); updateControls(); scheduleHide(); }
        catch (IllegalStateException e) { fail(getString(R.string.network_error)); }
    }
    private void pausePlayer() {
        if (isPlaying()) player.pause(); main.removeCallbacks(hideControls); showControls(true, false); updateControls();
    }
    private boolean isPlaying() { return player != null && prepared && player.isPlaying(); }
    private void toggle() {
        if (!error.isEmpty()) { wantPlay = true; feed.fresh(); return; }
        wantPlay = !wantPlay;
        if (wantPlay) { if (prepared) startPlayer(); else if (!fetching && !preparing) feed.start(); }
        else { resumeAfterFocus = false; pausePlayer(); audio.abandonAudioFocusRequest(focus); }
        updateControls(); showControls(true, false);
    }
    private void next() { wantPlay = true; resumePending = false; if (active) feed.next(); }
    private void previous() {
        if (!feed.hasPrevious() && !feed.loading()) { Toast.makeText(this, R.string.no_previous, Toast.LENGTH_SHORT).show(); return; }
        wantPlay = true; resumePending = false; feed.previous();
    }
    private void fail(String value) {
        releasePlayer(false); fetching = false; error = value; resumeAfterFocus = false;
        setMessage(value, false); showControls(true, false); updateControls(); retry.requestFocus();
    }
    private void setMessage(String value, boolean busy) {
        message.setText(value); messagePanel.setVisibility(View.VISIBLE); spinner.setVisibility(busy ? View.VISIBLE : View.GONE);
        retry.setVisibility(busy ? View.GONE : View.VISIBLE);
    }
    private void updateControls() {
        if (toggle == null) return;
        toggle.setText(wantPlay && error.isEmpty() ? R.string.pause : R.string.play);
        modeLabel.setText(wantPlay ? R.string.auto_play : R.string.paused);
        previous.setEnabled(feed.hasPrevious() || feed.loading() && feed.current() != null); previous.setAlpha(previous.isEnabled() ? 1f : .45f);
        root.setKeepScreenOn(active && wantPlay && (isPlaying() || preparing || fetching || buffering)); updateProgress(); updateMediaState();
    }
    private void createMediaSession() {
        mediaSession = new MediaSession(this, "ShortVideoTV");
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { wantPlay = true; if (!error.isEmpty()) feed.fresh(); else if (prepared) startPlayer(); else if (!fetching && !preparing) feed.start(); updateControls(); }
            @Override public void onPause() { wantPlay = false; resumeAfterFocus = false; pausePlayer(); audio.abandonAudioFocusRequest(focus); }
            @Override public void onSkipToNext() { next(); }
            @Override public void onSkipToPrevious() { previous(); }
            @Override public void onStop() { onPause(); }
            @Override public void onSeekTo(long position) {
                if (prepared && player != null) player.seekTo(Math.max(0, Math.min(player.getDuration(), position)), MediaPlayer.SEEK_CLOSEST);
                updateControls();
            }
        }, main);
    }
    private void updateMediaState() {
        if (mediaSession == null) return;
        boolean playing = isPlaying();
        int state = !error.isEmpty() ? PlaybackState.STATE_ERROR : fetching || preparing || buffering ? PlaybackState.STATE_BUFFERING
                : playing ? PlaybackState.STATE_PLAYING : prepared ? PlaybackState.STATE_PAUSED : PlaybackState.STATE_STOPPED;
        long position = prepared && player != null ? player.getCurrentPosition() : 0;
        PlaybackState.Builder playback = new PlaybackState.Builder().setState(state, position, playing ? 1f : 0f)
                .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE
                        | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS | PlaybackState.ACTION_SEEK_TO | PlaybackState.ACTION_STOP);
        if (!error.isEmpty()) playback.setErrorMessage(error);
        mediaSession.setPlaybackState(playback.build()); mediaSession.setActive(active && (prepared || preparing || fetching));
    }
    private void updateProgress() {
        long duration = prepared && player != null ? Math.max(0, player.getDuration()) : 0;
        long position = prepared && player != null ? player.getCurrentPosition() : 0;
        progress.setProgress(duration > 0 ? (int)(position * 1000 / duration) : 0);
        elapsed.setText(time(position) + " / " + time(duration));
    }
    private void showControls(boolean show, boolean focusToggle) {
        controlsVisible = show; footer.setVisibility(show ? View.VISIBLE : View.GONE); header.setVisibility(show ? View.VISIBLE : View.GONE); modeLabel.setVisibility(show ? View.VISIBLE : View.GONE);
        if (show) { if (focusToggle) toggle.requestFocus(); scheduleHide(); }
        else root.requestFocus();
    }
    private void scheduleHide() {
        main.removeCallbacks(hideControls);
        if (active && isPlaying() && controlsVisible && sourceDialog == null && !buffering) main.postDelayed(hideControls, 4500);
    }
    private void sources() {
        if (sourceDialog != null) return;
        main.removeCallbacks(hideControls); boolean wasPlaying = isPlaying();
        if (wasPlaying) pausePlayer();
        VideoFeed.Source[] values = VideoFeed.Source.values(); String[] labels = new String[values.length];
        for (int i = 0; i < values.length; i++) labels[i] = getString(values[i].label);
        final boolean[] switched = {false};
        sourceDialog = new AlertDialog.Builder(this).setTitle(R.string.sources)
                .setSingleChoiceItems(labels, feed.source().ordinal(), (dialog, position) -> {
                    if (values[position] != feed.source()) {
                        switched[0] = true; wantPlay = true; resumePending = false;
                        settings.edit().putString("source", values[position].name()).apply(); feed.select(values[position]);
                    }
                    dialog.dismiss();
                }).setNegativeButton(R.string.close, null).create();
        sourceDialog.setOnDismissListener(dialog -> { sourceDialog = null; if (active && wasPlaying && !switched[0] && wantPlay) startPlayer(); showControls(true, true); });
        sourceDialog.show();
    }
    private void layoutVideo() {
        if (stage == null || surface == null) return;
        int[] size = fit(stage.getWidth(), stage.getHeight(), videoWidth, videoHeight);
        FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) surface.getLayoutParams();
        if (params.width != size[0] || params.height != size[1]) { params.width = size[0]; params.height = size[1]; surface.setLayoutParams(params); }
    }
    static int[] fit(int availableWidth, int availableHeight, int width, int height) {
        if (availableWidth <= 0 || availableHeight <= 0 || width <= 0 || height <= 0) return new int[]{1,1};
        double scale = Math.min((double)availableWidth / width, (double)availableHeight / height);
        return new int[]{Math.max(1, (int)Math.round(width * scale)), Math.max(1, (int)Math.round(height * scale))};
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        int key = event.getKeyCode();
        boolean wereHidden = !controlsVisible;
        boolean handled = key == KeyEvent.KEYCODE_DPAD_UP || key == KeyEvent.KEYCODE_DPAD_DOWN || key == KeyEvent.KEYCODE_MENU
                || key == KeyEvent.KEYCODE_MEDIA_NEXT || key == KeyEvent.KEYCODE_MEDIA_PREVIOUS || key == KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE
                || key == KeyEvent.KEYCODE_MEDIA_PLAY || key == KeyEvent.KEYCODE_MEDIA_PAUSE || key == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || key == KeyEvent.KEYCODE_MEDIA_REWIND;
        boolean confirm = key == KeyEvent.KEYCODE_DPAD_CENTER || key == KeyEvent.KEYCODE_ENTER;
        if (handled || confirm && !controlsVisible) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                if (key == KeyEvent.KEYCODE_DPAD_UP || key == KeyEvent.KEYCODE_MEDIA_PREVIOUS) previous();
                else if (key == KeyEvent.KEYCODE_DPAD_DOWN || key == KeyEvent.KEYCODE_MEDIA_NEXT) next();
                else if (key == KeyEvent.KEYCODE_MENU) sources();
                else if (key == KeyEvent.KEYCODE_MEDIA_PLAY) { wantPlay = true; if (!error.isEmpty()) feed.fresh(); else if (prepared) startPlayer(); else if (!fetching && !preparing) feed.start(); }
                else if (key == KeyEvent.KEYCODE_MEDIA_PAUSE) { wantPlay = false; resumeAfterFocus = false; pausePlayer(); audio.abandonAudioFocusRequest(focus); }
                else if (key == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || key == KeyEvent.KEYCODE_MEDIA_REWIND) {
                    if (prepared && player != null) player.seekTo(Math.max(0, Math.min(player.getDuration(), player.getCurrentPosition() + (key == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD ? 10000 : -10000))), MediaPlayer.SEEK_CLOSEST);
                } else toggle();
                updateControls(); showControls(true, confirm || wereHidden);
            }
            return true;
        }
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            if (!controlsVisible && (key == KeyEvent.KEYCODE_DPAD_LEFT || key == KeyEvent.KEYCODE_DPAD_RIGHT)) { showControls(true, true); return true; }
            scheduleHide();
        }
        return super.dispatchKeyEvent(event);
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private LinearLayout column() { LinearLayout view = new LinearLayout(this); view.setOrientation(LinearLayout.VERTICAL); return view; }
    private TextView text(String value, int size) { TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(0xffececf0); return view; }
    private Button button(int label, Runnable click) {
        Button view = new Button(this); view.setText(label); view.setTextSize(17); view.setAllCaps(false); view.setTextColor(0xffececf0);
        view.setFocusableInTouchMode(true); view.setBackgroundResource(R.drawable.focus); view.setPadding(dp(10), dp(6), dp(10), dp(6)); view.setOnClickListener(v -> { click.run(); scheduleHide(); }); return view;
    }
    private static String time(long ms) { long seconds = Math.max(0, ms / 1000); return String.format(Locale.ROOT, "%d:%02d", seconds / 60, seconds % 60); }
}
