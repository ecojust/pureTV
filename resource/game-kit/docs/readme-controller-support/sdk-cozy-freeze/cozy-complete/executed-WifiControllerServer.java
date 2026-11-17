package com.ecojust.gamekit;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.BindException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.SocketTimeoutException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** ESP32 pureTV v1: newline-delimited UTF-8 JSON over TCP, not a WebSocket. */
public final class WifiControllerServer implements AutoCloseable {
    public static final int DEFAULT_PORT = 63485;
    private static final int MAX_LINE_BYTES = 1024;
    private static final int MAX_CLIENTS = 4;
    private static final long FRAME_DEADLINE_MS = 5000;
    static final long IDLE_TIMEOUT_MS = 20_000;
    private final long idleTimeoutMs;
    private static final long MAX_JSON_INTEGER = 9_007_199_254_740_991L;
    private static final String[] KEYS = {"UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"};
    private final Object lock = new Object();
    private final String instanceId = java.util.UUID.randomUUID().toString();
    private final Set<Peer> peers = new HashSet<>();
    private volatile ServerSocket listener;
    private volatile boolean running;
    private ThreadPoolExecutor workers;
    private ScheduledExecutorService watchdog;
    private Thread acceptor;
    private final Seat[] seats;
    private final boolean ySelect;
    private boolean inputActive = true;
    private long sessionCounter;
    private static final long RECONNECT_SEAT_MS = 15_000;

    private static final class Seat {
        Peer owner;
        String controllerId = "", session = "";
        long cancelSeq, disconnectedAt;
    }

    public WifiControllerServer() { this(IDLE_TIMEOUT_MS, 1, false); }

    /** Legacy games may expose two seats and use Y for their SELECT action. */
    public WifiControllerServer(int maxPlayers, boolean ySelect) { this(IDLE_TIMEOUT_MS, maxPlayers, ySelect); }

    // Package-private deadline for real-socket liveness tests; production allows four 5s ping intervals.
    WifiControllerServer(long idleTimeoutMs) { this(idleTimeoutMs, 1, false); }

    private WifiControllerServer(long idleTimeoutMs, int maxPlayers, boolean ySelect) {
        if (idleTimeoutMs < 500) throw new IllegalArgumentException("Heartbeat timeout too short");
        if (maxPlayers < 1 || maxPlayers > 2) throw new IllegalArgumentException("Expected one or two players");
        this.idleTimeoutMs = idleTimeoutMs;
        this.ySelect = ySelect;
        seats = new Seat[maxPlayers];
        for (int i = 0; i < seats.length; i++) seats[i] = new Seat();
    }

    public int start() throws IOException { return start(DEFAULT_PORT); }

    /** The returned port, including fallback, must be the port advertised by NSD. */
    public synchronized int start(int preferredPort) throws IOException {
        if (running) return getPort();
        if (preferredPort < 0 || preferredPort > 65535) throw new IllegalArgumentException("Invalid TCP port");
        ServerSocket created;
        try { created = bind(preferredPort); }
        catch (BindException occupied) {
            if (preferredPort == 0) throw occupied;
            created = bind(0);
        }
        listener = created;
        running = true;
        workers = new ThreadPoolExecutor(0, MAX_CLIENTS, 15, TimeUnit.SECONDS,
                new SynchronousQueue<>(), task -> daemon(task, "puretv-wifi-client"),
                new ThreadPoolExecutor.AbortPolicy());
        watchdog = Executors.newSingleThreadScheduledExecutor(task -> daemon(task, "puretv-wifi-watchdog"));
        watchdog.scheduleWithFixedDelay(this::closeSlowWriters, 250, 250, TimeUnit.MILLISECONDS);
        ServerSocket current = created;
        acceptor = daemon(() -> acceptLoop(current), "puretv-wifi-listen");
        acceptor.start();
        return created.getLocalPort();
    }

    private static ServerSocket bind(int port) throws IOException {
        ServerSocket socket = new ServerSocket();
        try {
            socket.setReuseAddress(true);
            socket.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), port), MAX_CLIENTS);
            return socket;
        } catch (IOException failure) { closeQuietly(socket); throw failure; }
    }

    public int getPort() { ServerSocket current = listener; return current == null || current.isClosed() ? 0 : current.getLocalPort(); }
    public boolean hasController() {
        synchronized (lock) { for (Seat seat : seats) if (seat.owner != null && !seat.owner.closed) return true; return false; }
    }

    /** Deep JSON snapshot; each physical controller has a stable independent seat. */
    public String snapshot() {
        synchronized (lock) {
            try {
                JSONArray players = new JSONArray();
                int connections = 0;
                for (int i = 0; i < seats.length; i++) {
                    Seat seat = seats[i]; Peer p = seat.owner;
                    boolean connected = p != null && !p.closed;
                    if (connected) connections++;
                    JSONObject buttons = new JSONObject();
                    for (int k = 0; k < KEYS.length; k++) buttons.put(KEYS[k], connected && p.input(k));
                    JSONObject player = new JSONObject().put("id", i + 1).put("transport", "wifi")
                            .put("controllerId", seat.controllerId).put("session", seat.session)
                            .put("connected", connected).put("cancelSeq", seat.cancelSeq).put("inputActive", inputActive)
                            .put("x", connected ? (p.input(3) ? 1 : 0) - (p.input(2) ? 1 : 0) : 0)
                            .put("y", connected ? (p.input(1) ? 1 : 0) - (p.input(0) ? 1 : 0) : 0)
                            .put("aimX", 0).put("aimY", 0)
                            .put("a", connected && (p.input(5) || p.input(7)))
                            .put("b", connected && (p.input(6) || (!ySelect && p.input(8))))
                            .put("start", connected && p.input(4)).put("select", connected && ySelect && p.input(8))
                            .put("buttons", buttons);
                    players.put(player);
                    if (connected) p.clearPulses();
                }
                return new JSONObject().put("players", players).put("connections", connections).put("inputActive", inputActive).toString();
            } catch (JSONException impossible) { return "{\"players\":[],\"connections\":0}"; }
        }
    }

    /** Focus/dialog input isolation never closes or rebinds the TCP listener. */
    public void setInputActive(boolean value) {
        synchronized (lock) {
            if (inputActive == value) return;
            inputActive = value;
            cancelInputsLocked();
        }
    }

    /** Pause/background cancellation must not turn a held key into a fresh action. */
    public void releaseInputs() { synchronized (lock) { cancelInputsLocked(); } }

    private void cancelInputsLocked() {
        for (Peer peer : peers) peer.cancelInputs();
        for (Seat seat : seats) seat.cancelSeq++;
    }

    private Seat availableSeat(String id) {
        for (Seat seat : seats) if (id.equals(seat.controllerId)) return seat;
        for (Seat seat : seats) if (seat.controllerId.isEmpty()) return seat;
        for (Seat seat : seats) if (seat.owner == null && (seats.length == 1 || now() - seat.disconnectedAt >= RECONNECT_SEAT_MS)) return seat;
        return null;
    }

    @Override public void close() { stop(); }

    public synchronized void stop() {
        running = false;
        closeQuietly(listener);
        listener = null;
        synchronized (lock) {
            for (Peer peer : new ArrayList<>(peers)) peer.disconnect();
            peers.clear();
            for (Seat seat : seats) seat.cancelSeq++;
        }
        if (workers != null) workers.shutdownNow();
        if (watchdog != null) watchdog.shutdownNow();
        Thread old = acceptor;
        acceptor = null;
        if (old != null && old != Thread.currentThread()) {
            try { old.join(250); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        }
    }

    private void acceptLoop(ServerSocket current) {
        while (running && listener == current) {
            Socket socket = null;
            try {
                socket = current.accept();
                socket.setTcpNoDelay(true);
                socket.setKeepAlive(true);
                socket.setSoTimeout(250);
                socket.setSendBufferSize(2048);
                Peer peer = new Peer(socket);
                synchronized (lock) {
                    if (!running || listener != current || peers.size() >= MAX_CLIENTS) { closeQuietly(socket); continue; }
                    peers.add(peer);
                }
                try { workers.execute(peer::run); }
                catch (RuntimeException rejected) { peer.disconnect(); }
            } catch (IOException failed) { closeQuietly(socket); }
        }
    }

    private void closeSlowWriters() {
        synchronized (lock) {
            long time = now();
            for (Peer peer : new ArrayList<>(peers)) {
                if ((peer.writeStarted != 0 && time - peer.writeStarted > FRAME_DEADLINE_MS)
                        || (peer.identified && time - peer.lastMessageAt > idleTimeoutMs)) peer.disconnect();
            }
        }
    }

    private final class Peer {
        final Socket socket;
        final boolean[] held = new boolean[KEYS.length];
        final boolean[] blocked = new boolean[KEYS.length];
        final boolean[] pulse = new boolean[KEYS.length];
        volatile boolean closed;
        volatile long writeStarted;
        String controllerId;
        long lastSeq = -1;
        long lastMessageAt;
        boolean identified;
        Seat seat;

        Peer(Socket socket) { this.socket = socket; }
        boolean input(int key) { return inputActive && !blocked[key] && (held[key] || pulse[key]); }
        void clearPulses() { java.util.Arrays.fill(pulse, false); }
        void cancelInputs() {
            for (int i = 0; i < held.length; i++) { blocked[i] |= held[i]; pulse[i] = false; }
        }

        void run() {
            try {
                InputStream input = socket.getInputStream();
                OutputStream output = socket.getOutputStream();
                while (running && !closed) {
                    String line = readLine(input);
                    if (line == null) return;
                    JSONObject object;
                    try {
                        JSONTokener tokenizer = new JSONTokener(line);
                        Object parsed = tokenizer.nextValue();
                        if (!(parsed instanceof JSONObject) || tokenizer.nextClean() != 0) throw new JSONException("Expected one JSON object");
                        object = (JSONObject) parsed;
                    }
                    catch (JSONException invalid) { send(output, error(-1, "invalid_json")); return; }
                    long seq = integer(object, "seq");
                    Message message = parse(object);
                    if (message == null) { send(output, error(seq, "invalid_message")); return; }
                    String failure = null;
                    synchronized (lock) {
                        if (closed || !running) return;
                        if (identified && !controllerId.equals(message.id)) failure = "controller_id_changed";
                        else if (!identified && availableSeat(message.id) == null) failure = "controller_busy";
                        else {
                            if (!identified) {
                                // Same device may reconnect before its old TCP socket detects
                                // Wi-Fi loss. The ID distinguishes peers; it is not authentication.
                                seat = availableSeat(message.id);
                                if (seat.owner != null && seat.owner != this) seat.owner.disconnect();
                                identified = true; controllerId = message.id; seat.owner = this;
                                seat.controllerId = controllerId;
                                seat.session = "wifi-" + instanceId + "-" + (++sessionCounter);
                                seat.cancelSeq++;
                            }
                            lastMessageAt = now();
                            if (message.seq > lastSeq) {
                                update(message); lastSeq = message.seq;
                            }
                        }
                    }
                    if (failure != null) { send(output, error(message.seq, failure)); return; }
                    send(output, new JSONObject().put("type", "ack").put("seq", message.seq));
                }
            } catch (IOException | JSONException invalidOrClosed) { /* EOF and malformed peers only cancel this connection. */ }
            finally { disconnect(); }
        }

        private void update(Message m) {
            // hello/ping acknowledge the connection and liveness without changing held keys.
            if (!"button".equals(m.kind)) return;
            int key = m.key;
            boolean before = held[key];
            if (!m.pressed) { held[key] = false; blocked[key] = false; return; }
            held[key] = true;
            if (!inputActive) { blocked[key] = true; pulse[key] = false; return; }
            if ("sync".equals(m.action)) {
                // Directions are continuous; action/start held across reconnect
                // must be released before they may produce an edge or drift reward.
                if (key >= 4 && !before) blocked[key] = true;
            } else if ("down".equals(m.action)) {
                if (!before && !blocked[key]) pulse[key] = true;
            } else if (!before) {
                // long_press is a continuation, not a new press when down is absent.
                blocked[key] = true;
            }
        }

        private String readLine(InputStream input) throws IOException {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            long began = now();
            boolean started = false;
            while (running && !closed) {
                if ((!identified || started) && now() - began > FRAME_DEADLINE_MS) throw new IOException("Incomplete frame");
                int value;
                try { value = input.read(); }
                catch (SocketTimeoutException pending) { continue; }
                if (value == -1) {
                    if (bytes.size() != 0) throw new IOException("Truncated frame");
                    return null;
                }
                if (!started) { started = true; began = now(); }
                if (value == '\n') {
                    byte[] data = bytes.toByteArray();
                    int count = data.length;
                    if (count > 0 && data[count - 1] == '\r') count--;
                    try {
                        return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(data, 0, count)).toString();
                    } catch (CharacterCodingException invalid) { throw new IOException("Invalid UTF-8", invalid); }
                }
                if (bytes.size() >= MAX_LINE_BYTES) throw new IOException("Oversized frame");
                bytes.write(value);
            }
            return null;
        }

        private void send(OutputStream output, JSONObject message) throws IOException {
            writeStarted = now();
            try { output.write((message.toString() + "\n").getBytes(StandardCharsets.UTF_8)); output.flush(); }
            finally { writeStarted = 0; }
        }

        void disconnect() {
            synchronized (lock) {
                if (closed) return;
                closed = true;
                cancelInputs();
                if (seat != null && seat.owner == this) { seat.owner = null; seat.cancelSeq++; seat.disconnectedAt = now(); }
                peers.remove(this);
            }
            closeQuietly(socket);
        }
    }

    private static JSONObject error(long seq, String code) throws JSONException {
        JSONObject result = new JSONObject().put("type", "error").put("message", code);
        if (seq >= 0) result.put("seq", seq);
        return result;
    }

    private static Message parse(JSONObject value) {
        if (!(value.opt("type") instanceof String) || !(value.opt("controller_id") instanceof String)) return null;
        long seq = integer(value, "seq");
        String kind = (String) value.opt("type"), id = (String) value.opt("controller_id");
        if (seq < 0 || !id.matches("[A-Za-z0-9][A-Za-z0-9:._-]{0,95}")) return null;
        if ("hello".equals(kind) || "ping".equals(kind)) return new Message(kind, seq, id, -1, false, "");
        if (!"button".equals(kind) || !(value.opt("key") instanceof String)
                || !(value.opt("action") instanceof String) || !(value.opt("pressed") instanceof Boolean)) return null;
        long duration = integer(value, "duration_ms");
        String key = (String) value.opt("key"), action = (String) value.opt("action");
        boolean pressed = (Boolean) value.opt("pressed");
        if (duration < 0) return null;
        int index = -1;
        for (int i = 0; i < KEYS.length; i++) if (KEYS[i].equals(key)) index = i;
        if (index == -1) return null;
        if ("down".equals(action)) { if (!pressed || duration != 0) return null; }
        else if ("long_press".equals(action)) { if (!pressed) return null; }
        else if ("tap".equals(action) || "long_release".equals(action)) { if (pressed) return null; }
        else if ("sync".equals(action)) { if (duration != 0) return null; }
        else return null;
        return new Message(kind, seq, id, index, pressed, action);
    }

    private static long integer(JSONObject value, String field) {
        Object number = value.opt(field);
        if (!(number instanceof Number)) return -1;
        double d = ((Number) number).doubleValue();
        if (Double.isNaN(d) || Double.isInfinite(d) || d < 0 || d > MAX_JSON_INTEGER || d != Math.floor(d)) return -1;
        return ((Number) number).longValue();
    }

    private static final class Message {
        final long seq;
        final String kind;
        final String id;
        final int key;
        final boolean pressed;
        final String action;
        Message(String kind, long seq, String id, int key, boolean pressed, String action) {
            this.kind = kind; this.seq = seq; this.id = id; this.key = key; this.pressed = pressed; this.action = action;
        }
    }

    private static long now() { return System.nanoTime() / 1_000_000L; }
    private static Thread daemon(Runnable action, String name) { Thread t = new Thread(action, name); t.setDaemon(true); return t; }
    private static void closeQuietly(AutoCloseable value) { if (value != null) try { value.close(); } catch (Exception ignored) { } }
}
