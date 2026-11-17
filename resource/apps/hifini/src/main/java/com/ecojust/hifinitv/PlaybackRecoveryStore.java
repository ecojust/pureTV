package com.ecojust.hifinitv;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

/** Small restart checkpoint containing song identities, never a resolved audio URL or credentials. */
final class PlaybackRecoveryStore {
    static final int MAX_BYTES = 256 * 1024;
    static final String FILE_NAME = "playback-recovery.json";
    private static final int MAX_ASYNC_PATHS = 8;
    private static final Object WRITER_LOCK = new Object();
    private static final Map<String, State> LATEST = new LinkedHashMap<>();
    private static final Map<String, Pending> PENDING = new LinkedHashMap<>();
    private static final HashSet<String> DURABLE = new HashSet<>();
    private static Thread writer;
    private static String writingPath;
    // Rejected requests are coalesced too, so overload cannot create an unbounded callback queue.
    private static Pending rejected;
    private final File directory, file;
    private final String path;
    private final BeforeCommit beforeCommit;
    interface BeforeCommit { void run() throws IOException; }

    static final class State {
        final List<Track> queue;
        final int index;
        final boolean localOnly, shuffled, interrupted;
        State(List<Track> queue, int index, boolean localOnly, boolean shuffled, boolean interrupted) {
            this.queue = Collections.unmodifiableList(new ArrayList<>(queue));
            this.index = index; this.localOnly = localOnly; this.shuffled = shuffled; this.interrupted = interrupted;
        }
        static State empty() { return new State(Collections.emptyList(), -1, false, false, false); }
    }

    PlaybackRecoveryStore(File filesDir) { this(filesDir, () -> {}); }
    PlaybackRecoveryStore(File filesDir, BeforeCommit beforeCommit) {
        directory = filesDir; file = new File(filesDir, FILE_NAME); this.beforeCommit = beforeCommit;
        path = file.toPath().toAbsolutePath().normalize().toString();
    }

    private static final class Pending {
        final PlaybackRecoveryStore store;
        final State state;
        final Consumer<IOException> onFailure;
        final IOException failure;
        Pending(PlaybackRecoveryStore store, State state, Consumer<IOException> onFailure, IOException failure) {
            this.store = store; this.state = state; this.onFailure = onFailure; this.failure = failure;
        }
    }

    /** Returns queued metadata immediately when a Service is recreated in the same process. */
    State readLatest() {
        synchronized (WRITER_LOCK) {
            State latest = LATEST.get(path);
            if (latest != null) return latest;
        }
        return read();
    }

    /**
     * Copies immutable metadata and queues work without disk access on the caller's thread.
     * A newer pending request for the same path replaces the older one. Failure callbacks run
     * on the writer thread; callbacks of requests superseded before execution are discarded.
     */
    void writeAsync(List<Track> queue, int index, boolean localOnly, boolean shuffled,
            boolean interrupted, Consumer<IOException> onFailure) {
        State snapshot = null;
        IOException failure = null;
        if (queue == null || queue.size() > 50 || index < -1 || index >= queue.size() || interrupted && index < 0) {
            failure = new IOException("Invalid playback checkpoint");
        } else {
            HashSet<String> identities = new HashSet<>();
            for (Track track : queue) {
                if (track == null || !identities.add(track.id)) { failure = new IOException("Invalid playback song metadata"); break; }
            }
            if (failure == null) snapshot = new State(queue, index, localOnly, shuffled, interrupted);
        }
        synchronized (WRITER_LOCK) {
            if (failure == null && !LATEST.containsKey(path) && LATEST.size() >= MAX_ASYNC_PATHS) {
                // An idle, successfully saved snapshot can be read from disk after eviction.
                // Failed or queued snapshots remain in memory for Service recreation.
                Iterator<String> paths = LATEST.keySet().iterator();
                while (paths.hasNext()) {
                    String candidate = paths.next();
                    if (DURABLE.contains(candidate) && !PENDING.containsKey(candidate) && !candidate.equals(writingPath)) {
                        paths.remove(); DURABLE.remove(candidate); break;
                    }
                }
                if (LATEST.size() >= MAX_ASYNC_PATHS) failure = new IOException("Playback checkpoint writer capacity reached");
            }
            Pending request = new Pending(this, snapshot, onFailure, failure);
            if (failure != null) rejected = request;
            else {
                LATEST.put(path, snapshot);
                DURABLE.remove(path);
                PENDING.put(path, request);
            }
            if (writer == null) {
                writer = new Thread(PlaybackRecoveryStore::runWriter, "hifini-playback-checkpoint");
                writer.setDaemon(true); writer.start();
            }
            WRITER_LOCK.notifyAll();
        }
    }

    private static void runWriter() {
        while (true) {
            Pending request;
            synchronized (WRITER_LOCK) {
                while (PENDING.isEmpty() && rejected == null) {
                    try { WRITER_LOCK.wait(); } catch (InterruptedException ignored) { /* Process-owned writer stays available. */ }
                }
                if (!PENDING.isEmpty()) {
                    String key = PENDING.keySet().iterator().next();
                    request = PENDING.remove(key); writingPath = key;
                } else { request = rejected; rejected = null; writingPath = request.store.path; }
            }
            IOException failure = request.failure;
            try {
                if (failure == null) {
                    State state = request.state;
                    request.store.write(state.queue, state.index, state.localOnly, state.shuffled, state.interrupted);
                }
            } catch (IOException problem) { failure = problem; }
            catch (RuntimeException problem) { failure = new IOException("Playback checkpoint could not be saved", problem); }
            try {
                if (failure != null && request.onFailure != null) request.onFailure.accept(failure);
            } catch (RuntimeException ignored) { /* A notification must not stop subsequent persistence. */ }
            finally {
                synchronized (WRITER_LOCK) {
                    if (failure == null && LATEST.get(request.store.path) == request.state) DURABLE.add(request.store.path);
                    writingPath = null; WRITER_LOCK.notifyAll();
                }
            }
        }
    }

    /** Test-only barrier. Production callers must never wait for disk writes. */
    static void awaitWritesForTest() throws InterruptedException {
        long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(10);
        synchronized (WRITER_LOCK) {
            while (writingPath != null || !PENDING.isEmpty() || rejected != null) {
                long remaining = deadline - System.nanoTime();
                if (remaining <= 0) throw new AssertionError("Playback checkpoint writer did not finish");
                java.util.concurrent.TimeUnit.NANOSECONDS.timedWait(WRITER_LOCK, remaining);
            }
        }
    }

    /** Simulates losing process memory after the test barrier; never removes disk or audio files. */
    static void resetMemoryForTest(File filesDir) {
        String key = new File(filesDir, FILE_NAME).toPath().toAbsolutePath().normalize().toString();
        synchronized (WRITER_LOCK) {
            if (key.equals(writingPath) || PENDING.containsKey(key)) throw new IllegalStateException("Checkpoint write still pending");
            LATEST.remove(key);
            DURABLE.remove(key);
        }
    }

    /** Corrupt checkpoints are ignored. Completed audio and its library index are never touched. */
    synchronized State read() {
        if (Files.isSymbolicLink(directory.toPath())
                || !Files.isRegularFile(file.toPath(), LinkOption.NOFOLLOW_LINKS)
                || file.length() <= 0 || file.length() > MAX_BYTES) return State.empty();
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            try (FileInputStream input = new FileInputStream(file)) {
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    if (bytes.size() + count > MAX_BYTES) return State.empty();
                    bytes.write(buffer, 0, count);
                }
            }
            JSONTokener parser = new JSONTokener(new String(bytes.toByteArray(), StandardCharsets.UTF_8));
            Object root = parser.nextValue();
            if (!(root instanceof JSONObject) || parser.nextClean() != 0) return State.empty();
            JSONObject document = (JSONObject) root;
            Object version = document.get("version");
            if (!(version instanceof Integer || version instanceof Long) || ((Number) version).longValue() != 1) return State.empty();
            boolean localOnly = flag(document, "localOnly"), shuffled = flag(document, "shuffled"), interrupted = flag(document, "interrupted");
            Object selection = document.get("currentId");
            if (!(selection instanceof String) || ((String) selection).length() > 128) return State.empty();
            String currentId = (String) selection;
            JSONArray rows = document.getJSONArray("queue");
            if (rows.length() > 50) return State.empty();
            List<Track> queue = TrackMetadataCodec.decode(rows);
            int index = -1;
            for (int i = 0; i < queue.size(); i++) if (queue.get(i).id.equals(currentId)) { index = i; break; }
            // Decode may discard an invalid non-current row. Stable identity prevents switching songs.
            if (!currentId.isEmpty() && index < 0 || interrupted && index < 0) return State.empty();
            return new State(queue, index, localOnly, shuffled, interrupted);
        } catch (IOException | JSONException | IllegalArgumentException invalid) { return State.empty(); }
    }

    synchronized void write(List<Track> queue, int index, boolean localOnly, boolean shuffled, boolean interrupted) throws IOException {
        if (queue == null || queue.size() > 50 || index < -1 || index >= queue.size() || interrupted && index < 0)
            throw new IOException("Invalid playback checkpoint");
        if (queue.isEmpty()) { clear(); return; }
        byte[] bytes;
        try {
            JSONArray encoded = TrackMetadataCodec.encode(queue);
            List<Track> decoded = TrackMetadataCodec.decode(encoded);
            if (decoded.size() != queue.size()) throw new IOException("Invalid playback song metadata");
            for (int i = 0; i < queue.size(); i++) {
                if (queue.get(i) == null || !decoded.get(i).id.equals(queue.get(i).id)) throw new IOException("Invalid playback song identity");
            }
            JSONObject document = new JSONObject(); document.put("version", 1);
            document.put("queue", encoded); document.put("currentId", index < 0 ? "" : queue.get(index).id);
            document.put("localOnly", localOnly); document.put("shuffled", shuffled); document.put("interrupted", interrupted);
            bytes = document.toString().getBytes(StandardCharsets.UTF_8);
        } catch (JSONException | IllegalArgumentException invalid) { throw new IOException("Invalid playback checkpoint", invalid); }
        if (bytes.length > MAX_BYTES) throw new IOException("Playback checkpoint exceeds limit");
        if (Files.isSymbolicLink(directory.toPath()) || !directory.isDirectory() && !directory.mkdirs())
            throw new IOException("Playback checkpoint directory unavailable");
        File temporary = File.createTempFile(".playback-recovery-", ".tmp", directory);
        try {
            try (FileOutputStream output = new FileOutputStream(temporary)) { output.write(bytes); output.getFD().sync(); }
            beforeCommit.run();
            Files.move(temporary.toPath(), file.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } finally { temporary.delete(); }
    }

    synchronized void clear() throws IOException {
        if (Files.isSymbolicLink(directory.toPath())) throw new IOException("Playback checkpoint directory unavailable");
        if (Files.exists(file.toPath(), LinkOption.NOFOLLOW_LINKS)
                && !Files.isRegularFile(file.toPath(), LinkOption.NOFOLLOW_LINKS)) throw new IOException("Playback checkpoint unavailable");
        Files.deleteIfExists(file.toPath());
    }

    private static boolean flag(JSONObject document, String key) throws JSONException {
        Object value = document.get(key);
        if (!(value instanceof Boolean)) throw new JSONException("Invalid checkpoint flag");
        return (Boolean) value;
    }
}
