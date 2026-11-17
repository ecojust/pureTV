package com.ecojust.operatv;

import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

/** Platform decoder with bounded resolution, lifecycle ownership and local resume state. */
public class PlaybackActivity extends Activity {
    interface Events {
        void prepared();
        void seeked();
        void buffering(boolean waiting);
        void completed();
        void error();
        void size(int width, int height);
    }

    interface Player {
        void prepare(CctvCatalog.PlaybackSource source) throws IOException;
        void play();
        void pause();
        void seek(int positionMs);
        int position();
        int duration();
        boolean playing();
        void release();
    }

    /** Kept behind a narrow interface so offline tests never pretend to decode real media. */
    private static final class PlatformPlayer implements Player {
        private final Context context;
        private final MediaPlayer media = new MediaPlayer();

        PlatformPlayer(Context context, SurfaceView surface, Events events) {
            this.context = context;
            media.setAudioStreamType(AudioManager.STREAM_MUSIC);
            media.setDisplay(surface.getHolder());
            media.setOnPreparedListener(player -> events.prepared());
            media.setOnSeekCompleteListener(player -> events.seeked());
            media.setOnCompletionListener(player -> events.completed());
            media.setOnVideoSizeChangedListener((player, width, height) -> events.size(width, height));
            media.setOnErrorListener((player, what, extra) -> { events.error(); return true; });
            media.setOnInfoListener((player, what, extra) -> {
                if (what == MediaPlayer.MEDIA_INFO_BUFFERING_START) events.buffering(true);
                if (what == MediaPlayer.MEDIA_INFO_BUFFERING_END) events.buffering(false);
                return false;
            });
        }

        @Override public void prepare(CctvCatalog.PlaybackSource source) throws IOException {
            media.setDataSource(context, Uri.parse(source.url), source.headers);
            media.prepareAsync();
        }
        @Override public void play() { media.start(); }
        @Override public void pause() { media.pause(); }
        @Override public void seek(int at) { media.seekTo(at); }
        @Override public int position() { return media.getCurrentPosition(); }
        @Override public int duration() { return media.getDuration(); }
        @Override public boolean playing() { return media.isPlaying(); }
        @Override public void release() {
            media.setOnPreparedListener(null);
            media.setOnSeekCompleteListener(null);
            media.setOnCompletionListener(null);
            media.setOnVideoSizeChangedListener(null);
            media.setOnErrorListener(null);
            media.setOnInfoListener(null);
            media.release();
        }
    }

    protected CctvCatalog createCatalog() { return new CctvCatalog(); }
    protected Player createPlayer(SurfaceView surface, Events events) {
        return new PlatformPlayer(this, surface, events);
    }
    protected boolean surfaceReady() { return surfaceAvailable; }

    private final Handler main = new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor resolver = new ThreadPoolExecutor(1, 1, 10, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1), task -> {
                Thread thread = new Thread(task, "opera-media-resolver");
                thread.setDaemon(true);
                return thread;
            }, new ThreadPoolExecutor.DiscardOldestPolicy());
    private Future<?> pending;
    private CctvCatalog catalog;
    private CctvCatalog.PlaybackSource resolved;
    private OperaStore store;
    private OperaItem item;
    private Player player;
    private AudioManager audio;
    private FrameLayout root;
    private SurfaceView surface;
    private LinearLayout top, controls, messagePanel;
    private TextView status, message, position;
    private Button toggle, retry, back;
    private SeekBar seek;
    private int generation, resumeMs, videoWidth = 16, videoHeight = 9, lastPosition = -1;
    private long lastSavedAt;
    private boolean active, surfaceAvailable, prepared, advanced, seeking, playAfterSeek, ended;
    private boolean showing = true, dragging, hasAudioFocus;
    private Runnable timeout;

    private final AudioManager.OnAudioFocusChangeListener audioListener = change -> {
        if (change < 0 && active && prepared && player != null) {
            try {
                if (player.playing()) player.pause();
                playAfterSeek = false;
                hasAudioFocus = false;
                showPaused();
                remember(false);
            } catch (RuntimeException ignored) { failPlayback(); }
        }
    };
    private final Runnable ticker = new Runnable() {
        @Override public void run() {
            if (!active) return;
            refreshProgress();
            main.postDelayed(this, 500);
        }
    };
    private final Runnable hideControls = () -> {
        if (active && prepared && player != null && !dragging && !seeking) {
            try { if (player.playing()) showControls(false); }
            catch (RuntimeException ignored) { failPlayback(); }
        }
    };

    private String text(String zh, String en) {
        return getResources().getConfiguration().locale.getLanguage().equals("zh") ? zh : en;
    }
    private int dp(float value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        setVolumeControlStream(AudioManager.STREAM_MUSIC);
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        catalog = createCatalog();
        store = new OperaStore(this);
        try {
            String payload = getIntent().getStringExtra("item");
            if (payload == null || payload.length() > 32768) throw new IOException("Invalid media item");
            item = OperaItem.fromJson(new JSONObject(payload));
            resumeMs = state == null ? store.position(item.id) : Math.max(0, state.getInt("position", 0));
        } catch (Exception invalid) { item = null; }
        buildUi();
    }

    private TextView label(String value, int size) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(size);
        view.setTextColor(0xFFF4EBDD);
        return view;
    }

    private GradientDrawable background(boolean focus) {
        GradientDrawable result = new GradientDrawable();
        result.setColor(focus ? 0xFFE4B96B : 0xEE302923);
        result.setCornerRadius(dp(8));
        result.setStroke(dp(2), focus ? 0xFFFFE2AA : 0xFF75634D);
        return result;
    }

    private Button button(String caption, String id, Runnable action) {
        Button button = new Button(this);
        button.setText(caption);
        button.setTextSize(16);
        button.setAllCaps(false);
        button.setFocusable(true);
        button.setFocusableInTouchMode(true);
        button.setContentDescription(id);
        button.setTextColor(0xFFF4EBDD);
        button.setMinWidth(dp(82));
        button.setMinimumWidth(dp(82));
        button.setMinHeight(dp(44));
        button.setMinimumHeight(dp(44));
        button.setPadding(dp(14), dp(4), dp(14), dp(4));
        button.setBackground(background(false));
        button.setOnFocusChangeListener((view, focus) -> {
            button.setBackground(background(focus));
            button.setTextColor(focus ? 0xFF211A12 : 0xFFF4EBDD);
        });
        button.setOnClickListener(view -> { action.run(); armHide(); });
        return button;
    }

    private void buildUi() {
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);
        setContentView(root);
        surface = new SurfaceView(this);
        surface.setContentDescription("player-video");
        root.addView(surface, new FrameLayout.LayoutParams(-1, -1, Gravity.CENTER));
        surface.getHolder().addCallback(new SurfaceHolder.Callback() {
            @Override public void surfaceCreated(SurfaceHolder holder) {
                surfaceAvailable = true;
                if (active && item != null && resolved == null && pending == null) resolve();
                else maybeStart();
            }
            @Override public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) { fitVideo(); }
            @Override public void surfaceDestroyed(SurfaceHolder holder) {
                surfaceAvailable = false;
                stopSession();
            }
        });
        root.addOnLayoutChangeListener((view, l, t, r, b, ol, ot, or, ob) -> { fitVideo(); restoreFocus(); });

        top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(24), dp(14), dp(24), dp(14));
        top.setBackgroundColor(0xD91E1915);
        back = button(text("返回", "Back"), "player-back", this::finish);
        top.addView(back, new LinearLayout.LayoutParams(-2, dp(46)));
        TextView title = label(item == null ? text("梨园 TV", "Opera TV") : item.title, 21);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setSingleLine(true);
        title.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams titleSize = new LinearLayout.LayoutParams(0, -2, 1);
        titleSize.leftMargin = dp(18);
        top.addView(title, titleSize);
        root.addView(top, new FrameLayout.LayoutParams(-1, -2, Gravity.TOP));

        messagePanel = new LinearLayout(this);
        messagePanel.setOrientation(LinearLayout.VERTICAL);
        messagePanel.setGravity(Gravity.CENTER);
        messagePanel.setPadding(dp(28), dp(20), dp(28), dp(20));
        messagePanel.setBackgroundColor(0xE828211A);
        message = label(text("正在准备…", "Preparing…"), 19);
        message.setGravity(Gravity.CENTER);
        message.setContentDescription("player-message");
        messagePanel.addView(message, new LinearLayout.LayoutParams(-1, -2));
        retry = button(text("重试", "Retry"), "player-retry", this::resolve);
        retry.setVisibility(View.GONE);
        LinearLayout.LayoutParams retrySize = new LinearLayout.LayoutParams(-2, dp(46));
        retrySize.topMargin = dp(14);
        messagePanel.addView(retry, retrySize);
        FrameLayout.LayoutParams panelSize = new FrameLayout.LayoutParams(-1, -2, Gravity.CENTER);
        panelSize.leftMargin = dp(58);
        panelSize.rightMargin = dp(58);
        root.addView(messagePanel, panelSize);

        controls = new LinearLayout(this);
        controls.setOrientation(LinearLayout.VERTICAL);
        controls.setPadding(dp(24), dp(12), dp(24), dp(16));
        controls.setBackgroundColor(0xE91E1915);
        LinearLayout progress = new LinearLayout(this);
        progress.setGravity(Gravity.CENTER_VERTICAL);
        seek = new SeekBar(this);
        seek.setContentDescription("player-seek");
        seek.setMax(1000);
        seek.setEnabled(false);
        progress.addView(seek, new LinearLayout.LayoutParams(0, dp(40), 1));
        position = label("00:00 / --:--", 15);
        position.setContentDescription("player-position");
        position.setPadding(dp(14), 0, 0, 0);
        progress.addView(position, new LinearLayout.LayoutParams(-2, -2));
        controls.addView(progress);
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override public void onProgressChanged(SeekBar bar, int value, boolean user) {
                if (user && !dragging && prepared && player != null) seekToFraction(value);
            }
            @Override public void onStartTrackingTouch(SeekBar bar) { dragging = true; main.removeCallbacks(hideControls); }
            @Override public void onStopTrackingTouch(SeekBar bar) { dragging = false; seekToFraction(bar.getProgress()); armHide(); }
        });
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        toggle = button(text("播放", "Play"), "player-toggle", this::togglePlayback);
        toggle.setEnabled(false);
        row.addView(toggle, new LinearLayout.LayoutParams(-2, dp(46)));
        addAction(row, button(text("后退10秒", "−10s"), "player-rewind", () -> jump(-10000)));
        addAction(row, button(text("前进10秒", "+10s"), "player-forward", () -> jump(10000)));
        status = label(text("正在准备", "Preparing"), 15);
        status.setContentDescription("player-status");
        status.setPadding(dp(18), 0, 0, 0);
        status.setMaxLines(2);
        row.addView(status, new LinearLayout.LayoutParams(0, -2, 1));
        controls.addView(row);
        root.addView(controls, new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM));
        back.requestFocus();
    }

    private void addAction(LinearLayout row, Button button) {
        LinearLayout.LayoutParams size = new LinearLayout.LayoutParams(-2, dp(46));
        size.leftMargin = dp(10);
        row.addView(button, size);
    }

    private void fitVideo() {
        int width = root.getWidth(), height = root.getHeight();
        if (width < 1 || height < 1) return;
        float scale = Math.min(width / (float) videoWidth, height / (float) videoHeight);
        FrameLayout.LayoutParams size = (FrameLayout.LayoutParams) surface.getLayoutParams();
        int w = Math.round(videoWidth * scale), h = Math.round(videoHeight * scale);
        if (size.width != w || size.height != h) { size.width = w; size.height = h; surface.setLayoutParams(size); }
    }

    @Override protected void onResume() {
        super.onResume();
        active = true;
        main.post(ticker);
        if (item == null) fail(text("视频信息无效，请返回重新选择。", "Invalid video information. Go back and choose another item."), false);
        else resolve();
    }

    private void resolve() {
        if (!active || item == null) return;
        stopSession();
        int request = ++generation;
        ended = false;
        advanced = false;
        lastPosition = -1;
        status.setText(text("获取视频中", "Loading video"));
        message.setText(text("正在获取播放地址…", "Loading the media address…"));
        messagePanel.setVisibility(View.VISIBLE);
        retry.setVisibility(View.GONE);
        toggle.setEnabled(false);
        seek.setEnabled(false);
        showControls(true);
        pending = resolver.submit(() -> {
            try {
                CctvCatalog.PlaybackSource source = catalog.resolve(item);
                if (source == null || source.url == null || source.url.isEmpty()) throw new IOException("Empty media address");
                main.post(() -> {
                    if (!active || request != generation) return;
                    pending = null;
                    resolved = source;
                    maybeStart();
                });
            } catch (Exception failure) {
                main.post(() -> {
                    if (active && request == generation) fail(text(
                            "节目暂不可用或无法获取地址。请检查网络，或重新授权导入的文件后重试。",
                            "The video is unavailable or could not be loaded. Check the connection or grant file access, then retry."), true);
                });
            }
        });
        armTimeout(request);
    }

    private void maybeStart() {
        if (!active || resolved == null || player != null || !surfaceReady()) return;
        final int request = generation;
        status.setText(text("缓冲中", "Buffering"));
        message.setText(text("正在缓冲…", "Buffering…"));
        try {
            player = createPlayer(surface, new Events() {
                private boolean valid() { return active && generation == request && player != null; }
                @Override public void prepared() {
                    if (!valid()) return;
                    prepared = true;
                    toggle.setEnabled(true);
                    int duration = safeDuration();
                    int resume = resumeMs > 0 && duration > 0 && resumeMs < duration - 1500 ? resumeMs : 0;
                    if (resume > 0) seekTo(resume, true);
                    else startPlayback();
                    refreshProgress();
                }
                @Override public void seeked() {
                    if (!valid() || !prepared) return;
                    seeking = false;
                    lastPosition = -1;
                    if (playAfterSeek) startPlayback();
                    else { cancelTimeout(); showPaused(); }
                    refreshProgress();
                }
                @Override public void buffering(boolean waiting) {
                    if (!valid() || !prepared) return;
                    if (waiting) {
                        status.setText(text("缓冲中", "Buffering"));
                        message.setText(text("正在缓冲…", "Buffering…"));
                        messagePanel.setVisibility(View.VISIBLE);
                        armTimeout(request);
                    } else if (!seeking) {
                        cancelTimeout();
                        messagePanel.setVisibility(View.GONE);
                        try { if (player.playing()) showPlaying(); else showPaused(); }
                        catch (RuntimeException failure) { failPlayback(); }
                    }
                }
                @Override public void completed() {
                    if (!valid() || !prepared) return;
                    ended = true;
                    remember(true);
                    cancelTimeout();
                    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                    toggle.setText(text("重播", "Replay"));
                    status.setText(text("播放完毕", "Finished"));
                    message.setText(text("播放完毕", "Playback finished"));
                    messagePanel.setVisibility(View.VISIBLE);
                    showControls(true);
                    toggle.requestFocus();
                    refreshProgress();
                }
                @Override public void error() { if (valid()) failPlayback(); }
                @Override public void size(int width, int height) {
                    if (valid() && width > 0 && height > 0) { videoWidth = width; videoHeight = height; fitVideo(); }
                }
            });
            player.prepare(resolved);
        } catch (IOException | RuntimeException failure) { failPlayback(); }
    }

    private boolean focusAudio() {
        if (audio == null || hasAudioFocus) return true;
        hasAudioFocus = audio.requestAudioFocus(audioListener, AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN) == AudioManager.AUDIOFOCUS_REQUEST_GRANTED;
        return hasAudioFocus;
    }

    private void startPlayback() {
        if (!active || !prepared || player == null) return;
        try {
            if (!focusAudio()) { cancelTimeout(); showPaused(); return; }
            player.play();
            if (!player.playing()) throw new IllegalStateException("Player did not start");
            cancelTimeout();
            ended = false;
            lastPosition = Math.max(0, player.position());
            messagePanel.setVisibility(View.GONE);
            showPlaying();
            if (!back.hasFocus() && !toggle.hasFocus()) restoreFocus();
            armHide();
        } catch (RuntimeException failure) { failPlayback(); }
    }

    private void showPlaying() {
        toggle.setText(text("暂停", "Pause"));
        status.setText(text("正在播放", "Playing"));
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void showPaused() {
        cancelTimeout();
        toggle.setText(text("播放", "Play"));
        status.setText(text("已暂停", "Paused"));
        messagePanel.setVisibility(View.GONE);
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        showControls(true);
    }

    private void togglePlayback() {
        if (!active || !prepared || player == null) return;
        try {
            if (seeking) { playAfterSeek = !playAfterSeek; return; }
            if (ended) { ended = false; advanced = false; seekTo(0, true); }
            else if (player.playing()) { player.pause(); remember(false); showPaused(); }
            else startPlayback();
        } catch (RuntimeException failure) { failPlayback(); }
    }

    private void jump(int delta) {
        if (!prepared || player == null || seeking) return;
        try { seekTo((int) Math.max(0, Math.min(Integer.MAX_VALUE, (long) player.position() + delta)), player.playing()); }
        catch (RuntimeException failure) { failPlayback(); }
    }

    private void seekToFraction(int fraction) {
        if (!prepared || player == null || seeking) return;
        try { seekTo((int) ((long) safeDuration() * fraction / 1000), player.playing()); }
        catch (RuntimeException failure) { failPlayback(); }
    }

    private void seekTo(int at, boolean playAfter) {
        if (!prepared || player == null) return;
        int duration = safeDuration();
        if (duration <= 0) return;
        int bounded = Math.max(0, Math.min(Math.max(0, duration - 500), at));
        try {
            seeking = true;
            playAfterSeek = playAfter;
            lastPosition = -1;
            if (player.playing()) player.pause();
            status.setText(text("定位中", "Seeking"));
            showControls(true);
            armTimeout(generation);
            player.seek(bounded);
        } catch (RuntimeException failure) { failPlayback(); }
    }

    private int safeDuration() {
        if (player == null || !prepared) return 0;
        try { return Math.max(0, player.duration()); }
        catch (RuntimeException ignored) { return 0; }
    }

    private void refreshProgress() {
        if (!prepared || player == null) return;
        try {
            int at = Math.max(0, player.position()), duration = safeDuration();
            if (duration > 0) at = Math.min(at, duration);
            String elapsed = stamp(at) + " / " + (duration > 0 ? stamp(duration) : "--:--");
            boolean changed = !TextUtils.equals(position.getText(), elapsed);
            if (changed) position.setText(elapsed);
            seek.setEnabled(duration > 0);
            if (!dragging && changed) seek.setProgress(duration == 0 ? 0 : (int) Math.min(1000, (long) at * 1000 / duration));
            if (!seeking && player.playing()) {
                // A seek/resume jump is not proof of watched media. Require observed clock advancement.
                if (lastPosition >= 0 && at > lastPosition && at - lastPosition <= 2000) advanced = true;
                lastPosition = at;
                if (advanced && SystemClock.elapsedRealtime() - lastSavedAt >= 10000) remember(false);
            }
        } catch (RuntimeException failure) { failPlayback(); }
    }

    static String stamp(int milliseconds) {
        long seconds = Math.max(0, milliseconds / 1000L);
        return seconds >= 3600 ? String.format(Locale.US, "%d:%02d:%02d", seconds / 3600, seconds / 60 % 60, seconds % 60)
                : String.format(Locale.US, "%02d:%02d", seconds / 60, seconds % 60);
    }

    private void remember(boolean complete) {
        if (!prepared || player == null || item == null) return;
        try {
            if (!seeking) resumeMs = complete ? 0 : Math.max(0, player.position());
            if (advanced && !seeking) {
                int duration = safeDuration();
                store.record(item, complete ? duration : resumeMs, duration);
                lastSavedAt = SystemClock.elapsedRealtime();
            }
        } catch (RuntimeException ignored) { /* Preserve the previous durable position on device/storage failure. */ }
    }

    private void failPlayback() {
        fail(text("播放失败。请检查网络或文件访问权限后重试；此设备也可能不支持该视频编码。",
                "Playback failed. Check the connection or file access and retry; this device may not support the video codec."), true);
    }

    private void fail(String explanation, boolean canRetry) {
        stopSession();
        status.setText(text("播放失败", "Playback failed"));
        message.setText(explanation);
        messagePanel.setVisibility(View.VISIBLE);
        retry.setVisibility(canRetry ? View.VISIBLE : View.GONE);
        toggle.setEnabled(false);
        seek.setEnabled(false);
        showControls(true);
        if (canRetry) retry.requestFocus(); else back.requestFocus();
    }

    private void armTimeout(int request) {
        if (timeout != null) return;
        timeout = () -> {
            timeout = null;
            if (active && request == generation) fail(text("视频加载超时，请检查网络后重试。",
                    "Video loading timed out. Check the connection and retry."), true);
        };
        main.postDelayed(timeout, 30000);
    }
    private void cancelTimeout() { if (timeout != null) main.removeCallbacks(timeout); timeout = null; }

    private void showControls(boolean visible) {
        showing = visible;
        top.setVisibility(visible ? View.VISIBLE : View.GONE);
        controls.setVisibility(visible ? View.VISIBLE : View.GONE);
        main.removeCallbacks(hideControls);
        if (visible) restoreFocus();
    }
    private void restoreFocus() {
        if (!showing || root == null || !root.hasWindowFocus()) return;
        View focused = root.findFocus();
        if (focused != null && focused.isShown() && focused.isEnabled()) return;
        if (retry.isShown()) retry.requestFocus();
        else if (toggle.isEnabled()) toggle.requestFocus();
        else back.requestFocus();
    }
    private void armHide() { main.removeCallbacks(hideControls); if (active) main.postDelayed(hideControls, 6000); }
    @Override public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) restoreFocus();
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (event.getAction() == KeyEvent.ACTION_DOWN) {
            switch (event.getKeyCode()) {
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                case KeyEvent.KEYCODE_MEDIA_PLAY:
                case KeyEvent.KEYCODE_MEDIA_PAUSE:
                    if (event.getRepeatCount() == 0) {
                        if (event.getKeyCode() == KeyEvent.KEYCODE_MEDIA_PLAY) startPlayback();
                        else if (event.getKeyCode() == KeyEvent.KEYCODE_MEDIA_PAUSE) {
                            if (prepared && player != null) try { if (player.playing()) player.pause(); remember(false); showPaused(); }
                            catch (RuntimeException failure) { failPlayback(); }
                        } else togglePlayback();
                    }
                    return true;
                case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: jump(10000); return true;
                case KeyEvent.KEYCODE_MEDIA_REWIND: jump(-10000); return true;
                case KeyEvent.KEYCODE_MENU: showControls(true); armHide(); return true;
                case KeyEvent.KEYCODE_DPAD_LEFT:
                case KeyEvent.KEYCODE_DPAD_RIGHT:
                    if (!showing) { jump(event.getKeyCode() == KeyEvent.KEYCODE_DPAD_LEFT ? -10000 : 10000); showControls(true); armHide(); return true; }
                    break;
                case KeyEvent.KEYCODE_DPAD_CENTER:
                case KeyEvent.KEYCODE_ENTER:
                    if (!showing) { if (event.getRepeatCount() == 0) togglePlayback(); showControls(true); armHide(); return true; }
                    break;
                case KeyEvent.KEYCODE_DPAD_UP:
                case KeyEvent.KEYCODE_DPAD_DOWN:
                    if (!showing) { showControls(true); armHide(); return true; }
                    break;
                default: break;
            }
            if (showing) armHide();
        }
        return super.dispatchKeyEvent(event);
    }

    @Override public void onBackPressed() { finish(); }
    @Override protected void onSaveInstanceState(Bundle state) {
        remember(false);
        state.putInt("position", resumeMs);
        super.onSaveInstanceState(state);
    }
    private void stopSession() {
        remember(ended);
        generation++;
        if (pending != null) pending.cancel(true);
        pending = null;
        resolver.purge();
        cancelTimeout();
        main.removeCallbacks(hideControls);
        Player previous = player;
        player = null;
        resolved = null;
        prepared = false;
        seeking = false;
        playAfterSeek = false;
        if (previous != null) try { previous.release(); } catch (RuntimeException ignored) { }
        if (audio != null) audio.abandonAudioFocus(audioListener);
        hasAudioFocus = false;
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    @Override protected void onPause() {
        active = false;
        main.removeCallbacks(ticker);
        stopSession();
        super.onPause();
    }
    @Override protected void onStop() { stopSession(); super.onStop(); }
    @Override protected void onDestroy() {
        active = false;
        stopSession();
        main.removeCallbacksAndMessages(null);
        resolver.shutdownNow();
        super.onDestroy();
    }
}
