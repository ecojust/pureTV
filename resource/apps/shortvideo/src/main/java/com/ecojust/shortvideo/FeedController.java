package com.ecojust.shortvideo;

import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** A maximum of ten ephemeral addresses and one network worker, independent of the decoder. */
final class FeedController implements AutoCloseable {
    interface Loader { VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException; void cancel(); }
    interface Events { void loading(); void clip(VideoFeed.Clip clip); void error(int message, Object... arguments); }
    static final int HISTORY_LIMIT = 10;
    static final long REQUEST_INTERVAL_MS = 1500; // <= 40 requests/minute across both sources.
    private final Loader loader;
    private final Events events;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor worker = new ThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1), new ThreadPoolExecutor.AbortPolicy());
    private final List<VideoFeed.Clip> history = new ArrayList<>();
    private Future<?> pending;
    private VideoFeed.Source source;
    private int index = -1, generation;
    private long nextRequestAt;
    private boolean loading, closed;
    private volatile boolean suspended = true;

    FeedController(Loader loader, Events events, VideoFeed.Source source) {
        this.loader = loader; this.events = events; this.source = source; worker.allowCoreThreadTimeOut(true);
    }
    VideoFeed.Source source() { return source; }
    VideoFeed.Clip current() { return index < 0 ? null : history.get(index); }
    int index() { return index; }
    int size() { return history.size(); }
    boolean loading() { return loading; }
    boolean hasPrevious() { return index > 0; }
    void activate() { if (!closed) suspended = false; }
    void start() {
        if (closed || suspended || loading) return;
        if (current() == null) fresh(); else events.clip(current());
    }
    void next() {
        if (closed || suspended) return;
        if (index + 1 < history.size()) { cancel(); index++; events.clip(current()); }
        else fresh();
    }
    void previous() {
        if (closed || suspended) return;
        cancel();
        if (index > 0) index--;
        if (current() != null) events.clip(current());
    }
    void select(VideoFeed.Source value) {
        if (value == source) return;
        cancel(); source = value; history.clear(); index = -1;
        if (!closed && !suspended) fresh();
    }
    void fresh() {
        if (closed || suspended) return;
        cancel(); loading = true; events.loading(); schedule(generation, 0);
    }
    private void schedule(int ticket, int attempt) {
        long delay = Math.max(0, nextRequestAt - SystemClock.elapsedRealtime());
        main.postDelayed(() -> {
            if (!valid(ticket)) return;
            nextRequestAt = SystemClock.elapsedRealtime() + REQUEST_INTERVAL_MS;
            VideoFeed.Source requested = source;
            pending = worker.submit(() -> {
                try {
                    VideoFeed.Clip clip = loader.fetch(requested);
                    if (suspended || Thread.currentThread().isInterrupted()) return;
                    main.post(() -> accept(ticket, attempt, clip));
                } catch (Exception e) {
                    // Platform exception messages are not localized for the Activity's locale.
                    int message = e instanceof VideoFeed.FeedException ? ((VideoFeed.FeedException)e).message : R.string.network_error;
                    Object[] arguments = e instanceof VideoFeed.FeedException ? ((VideoFeed.FeedException)e).arguments : new Object[0];
                    if (!suspended && !Thread.currentThread().isInterrupted()) main.post(() -> {
                        if (valid(ticket)) { loading = false; events.error(message, arguments); }
                    });
                }
            });
        }, delay);
    }
    private void accept(int ticket, int attempt, VideoFeed.Clip clip) {
        if (!valid(ticket)) return;
        for (VideoFeed.Clip old : history) if (old.key().equals(clip.key())) {
            if (attempt == 0) schedule(ticket, 1);
            else { loading = false; events.error(R.string.feed_repeated); }
            return;
        }
        while (history.size() > index + 1) history.remove(history.size() - 1);
        history.add(clip);
        if (history.size() > HISTORY_LIMIT) history.remove(0);
        index = history.size() - 1; loading = false; events.clip(clip);
    }
    private boolean valid(int ticket) { return !closed && !suspended && ticket == generation; }
    private void cancel() {
        generation++; loading = false; main.removeCallbacksAndMessages(null);
        if (pending != null) pending.cancel(true); pending = null; loader.cancel(); worker.purge();
    }
    void suspend() { suspended = true; cancel(); }
    @Override public void close() { suspended = true; closed = true; cancel(); worker.shutdownNow(); history.clear(); index = -1; }
}
