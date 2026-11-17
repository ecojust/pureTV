package com.ecojust.webtv;

import android.content.Context;
import android.media.*;
import android.media.session.*;
import android.net.Uri;
import android.os.*;
import android.view.SurfaceHolder;
import java.util.HashMap;

/** Exactly one native decoder. Resume reconnects at the live edge; there is no timeshift cache. */
final class LivePlayer implements AutoCloseable {
    enum State { STOPPED, LOADING, PLAYING, PAUSED, ERROR }
    interface Events { void changed(); void size(int width, int height); void next(); void previous(); }
    private final Context context;
    private final Events events;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final AudioManager audio;
    private final AudioFocusRequest focus;
    private SurfaceHolder surface;
    private MediaPlayer player;
    private MediaSession session;
    private State state = State.STOPPED;
    private String url = "", error = "";
    private boolean active, prepared, wantPlay, resumeAfterFocus;
    private int generation;
    private Runnable timeout;
    LivePlayer(Context context, Events events) {
        this.context = context.getApplicationContext(); this.events = events;
        audio = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        focus = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN).setAudioAttributes(attributes())
                .setOnAudioFocusChangeListener(change -> {
                    if (!active) return;
                    if (change == AudioManager.AUDIOFOCUS_LOSS) pause();
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) { boolean resume = wantPlay; releaseDecoder(); resumeAfterFocus = resume; state = State.PAUSED; changed(); }
                    else if (change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK && player != null) player.setVolume(.2f, .2f);
                    else if (change == AudioManager.AUDIOFOCUS_GAIN) {
                        if (player != null) player.setVolume(1f, 1f);
                        if (resumeAfterFocus && wantPlay) { resumeAfterFocus = false; resume(); }
                    }
                }, main).build();
    }
    private static AudioAttributes attributes() { return new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MOVIE).build(); }
    State state() { return state; }
    String error() { return error; }
    String url() { return url; }
    void activate() {
        if (active) return; active = true; session = new MediaSession(context, "WebTV");
        session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        session.setCallback(new MediaSession.Callback() {
            @Override public void onPlay() { resume(); }
            @Override public void onPause() { pause(); }
            @Override public void onStop() { pause(); }
            @Override public void onSkipToNext() { events.next(); }
            @Override public void onSkipToPrevious() { events.previous(); }
        }, main);
        if (wantPlay && surface != null && !url.isEmpty()) prepare(); else changed();
    }
    void surface(SurfaceHolder holder) {
        surface = holder;
        if (holder == null) { releaseDecoder(); audio.abandonAudioFocusRequest(focus); state = State.STOPPED; changed(); }
        else if (active && wantPlay && player == null && !url.isEmpty()) prepare();
    }
    void play(String value) {
        releaseDecoder(); url = value; error = ""; wantPlay = true;
        if (active && surface != null) prepare(); else { state = State.STOPPED; changed(); }
    }
    void pause() {
        wantPlay = false; resumeAfterFocus = false; releaseDecoder(); audio.abandonAudioFocusRequest(focus); state = State.PAUSED; changed();
    }
    void resume() {
        if (url.isEmpty() || !active || state == State.PLAYING || state == State.LOADING) return;
        wantPlay = true; error = ""; if (surface != null) prepare();
    }
    private void prepare() {
        if (!active || surface == null || url.isEmpty()) return;
        releaseDecoder(); state = State.LOADING; error = ""; changed(); int ticket = generation;
        try {
            player = new MediaPlayer(); player.setAudioAttributes(attributes()); player.setDisplay(surface);
            player.setOnVideoSizeChangedListener((value, width, height) -> { if (valid(value,ticket) && width > 0 && height > 0) events.size(width,height); });
            player.setOnPreparedListener(value -> {
                if (!valid(value,ticket)) return;
                cancelTimeout(); prepared = true;
                if (value.getVideoWidth() > 0 && value.getVideoHeight() > 0) events.size(value.getVideoWidth(),value.getVideoHeight());
                if (audio.requestAudioFocus(focus) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { fail(context.getString(R.string.focus_denied)); return; }
                try { value.start(); state = State.PLAYING; changed(); } catch (IllegalStateException e) { fail(context.getString(R.string.network_error)); }
            });
            player.setOnErrorListener((value, what, extra) -> { if (valid(value,ticket)) fail(context.getString(R.string.decoder_error,what,extra)); return true; });
            player.setOnCompletionListener(value -> { if (valid(value,ticket)) fail(context.getString(R.string.ended)); });
            player.setOnInfoListener((value, what, extra) -> {
                if (!valid(value,ticket)) return false;
                if (what == MediaPlayer.MEDIA_INFO_BUFFERING_START) { state = State.LOADING; armTimeout(ticket); changed(); }
                else if (what == MediaPlayer.MEDIA_INFO_BUFFERING_END && prepared) { cancelTimeout(); state = State.PLAYING; changed(); }
                return false;
            });
            HashMap<String,String> headers = new HashMap<>(); headers.put("User-Agent","Mozilla/5.0 (Linux; Android 9)");
            player.setDataSource(context,Uri.parse(Playlist.safeUrl(url)),headers); player.prepareAsync(); armTimeout(ticket);
        } catch (Exception e) { fail(context.getString(R.string.network_error)); }
    }
    private boolean valid(MediaPlayer value, int ticket) { return active && surface != null && value == player && ticket == generation; }
    private void armTimeout(int ticket) { cancelTimeout(); timeout = () -> { if (active && ticket == generation) fail(context.getString(R.string.load_timeout)); }; main.postDelayed(timeout,25000); }
    private void cancelTimeout() { if (timeout != null) main.removeCallbacks(timeout); timeout = null; }
    private void fail(String message) { releaseDecoder(); audio.abandonAudioFocusRequest(focus); state = State.ERROR; error = message; changed(); }
    private void releaseDecoder() {
        generation++; cancelTimeout(); prepared = false; resumeAfterFocus = false;
        if (player != null) { player.setDisplay(null); player.release(); player = null; }
    }
    private void changed() {
        if (session != null) {
            int value = state == State.LOADING ? PlaybackState.STATE_BUFFERING : state == State.PLAYING ? PlaybackState.STATE_PLAYING
                    : state == State.ERROR ? PlaybackState.STATE_ERROR : state == State.PAUSED ? PlaybackState.STATE_PAUSED : PlaybackState.STATE_STOPPED;
            PlaybackState.Builder builder = new PlaybackState.Builder().setState(value,0,state == State.PLAYING ? 1f : 0f)
                    .setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE | PlaybackState.ACTION_PLAY_PAUSE | PlaybackState.ACTION_STOP | PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS);
            if (state == State.ERROR) builder.setErrorMessage(error);
            session.setPlaybackState(builder.build()); session.setActive(active && state != State.ERROR && !url.isEmpty());
        }
        events.changed();
    }
    void suspend() {
        active = false; releaseDecoder(); audio.abandonAudioFocusRequest(focus); state = State.STOPPED;
        if (session != null) { session.setActive(false); session.release(); session = null; }
        changed();
    }
    @Override public void close() { suspend(); main.removeCallbacksAndMessages(null); surface = null; }
}
