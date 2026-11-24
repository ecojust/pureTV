package com.ecojust.usedcartv;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URI;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLServerSocket;
import javax.net.ssl.SSLSocket;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;

/** Small, bounded LAN-only controller transport. The game itself remains on the TV. */
public final class LanGameServer implements AutoCloseable {
    public interface AssetSource { InputStream open(String name) throws IOException; }

    /** Only public pairing material crosses the HTTP boundary. Private keys stay in the TLS context. */
    public static final class TlsConfig {
        public final SSLContext context;
        public final String fingerprint;
        public final String displayName;
        private final byte[] certificateDer;
        private final byte[] mobileConfig;

        public TlsConfig(SSLContext context, byte[] certificateDer, byte[] mobileConfig,
                         String fingerprint, String displayName) {
            if (context == null || certificateDer == null || certificateDer.length == 0 || certificateDer.length > 65536
                    || mobileConfig == null || mobileConfig.length == 0 || mobileConfig.length > 131072
                    || fingerprint == null || !fingerprint.matches("[0-9a-f]{64}")
                    || displayName == null || displayName.isEmpty() || displayName.length() > 120) {
                throw new IllegalArgumentException("Invalid local TLS configuration");
            }
            try {
                byte[] digest = MessageDigest.getInstance("SHA-256").digest(certificateDer);
                StringBuilder actual = new StringBuilder(64);
                for (byte value : digest) actual.append(String.format(Locale.ROOT, "%02x", value & 255));
                if (!fingerprint.equals(actual.toString())) throw new IllegalArgumentException("CA fingerprint mismatch");
            } catch (java.security.NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
            this.context = context;
            this.certificateDer = certificateDer.clone();
            this.mobileConfig = mobileConfig.clone();
            this.fingerprint = fingerprint;
            this.displayName = displayName;
        }

        public byte[] certificateDer() { return certificateDer.clone(); }
        public byte[] mobileConfig() { return mobileConfig.clone(); }
    }

    private static final int MAX_HTTP = 8192;
    private static final int MAX_FRAME = 2048;
    private static final long STALE_INPUT_MS = 750;
    private static final long RESUME_MS = 15_000;
    private final AssetSource assets;
    private final TlsConfig tls;
    private final String room = randomToken();
    private final Object lock = new Object();
    private final Player[] players = {new Player(1), new Player(2)};
    private final Set<Socket> sockets = new HashSet<>();
    private final Map<Socket, Long> handshakes = new HashMap<>();
    private volatile ServerSocket listener;
    private volatile SSLServerSocket tlsListener;
    private volatile boolean running;
    private volatile String published = "{\"type\":\"state\",\"phase\":\"lobby\"}";
    private ThreadPoolExecutor workers;
    private ScheduledExecutorService broadcaster;
    private Thread acceptor;
    private Thread tlsAcceptor;

    public LanGameServer(AssetSource assets) { this(assets, null); }

    public LanGameServer(AssetSource assets, TlsConfig tls) {
        if (assets == null) throw new IllegalArgumentException("Missing bundled assets");
        this.assets = assets; this.tls = tls;
    }

    public synchronized int start() throws IOException {
        if (running) return listener.getLocalPort();
        try {
            listener = new ServerSocket();
            listener.setReuseAddress(true);
            listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), 0), 12);
            if (tls != null) {
                tlsListener = (SSLServerSocket) tls.context.getServerSocketFactory().createServerSocket();
                configureTls(tlsListener);
                tlsListener.setReuseAddress(true);
                tlsListener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), 0), 12);
            }
            workers = new ThreadPoolExecutor(0, 12, 15, TimeUnit.SECONDS,
                    new SynchronousQueue<>(), task -> daemon(task, "used-car-racing-lan-client"),
                    new ThreadPoolExecutor.AbortPolicy());
            broadcaster = Executors.newScheduledThreadPool(2, task -> daemon(task, "used-car-racing-lan-state"));
            running = true;
            broadcaster.scheduleWithFixedDelay(this::broadcast, 200, 200, TimeUnit.MILLISECONDS);
            broadcaster.scheduleWithFixedDelay(this::closeSlowWriters, 500, 500, TimeUnit.MILLISECONDS);
            final ServerSocket httpServer = listener;
            acceptor = daemon(() -> acceptLoop(httpServer), "used-car-racing-lan-listen");
            acceptor.start();
            if (tlsListener != null) {
                final SSLServerSocket httpsServer = tlsListener;
                tlsAcceptor = daemon(() -> acceptLoop(httpsServer), "used-car-racing-lan-tls-listen");
                tlsAcceptor.start();
            }
            return listener.getLocalPort();
        } catch (IOException | RuntimeException failure) {
            stop();
            throw failure;
        }
    }

    public String roomToken() { return room; }
    public int httpsPort() { SSLServerSocket current = tlsListener; return current == null ? 0 : current.getLocalPort(); }

    private static void configureTls(SSLServerSocket socket) throws IOException {
        Set<String> supportedProtocols = new HashSet<>(Arrays.asList(socket.getSupportedProtocols()));
        ArrayList<String> protocols = new ArrayList<>();
        for (String protocol : new String[]{"TLSv1.3", "TLSv1.2"}) if (supportedProtocols.contains(protocol)) protocols.add(protocol);
        Set<String> supportedCiphers = new HashSet<>(Arrays.asList(socket.getSupportedCipherSuites()));
        ArrayList<String> ciphers = new ArrayList<>();
        // The Android Keystore server key signs ECDHE/TLS 1.3 exchanges; it cannot decrypt RSA key exchanges.
        for (String cipher : new String[]{"TLS_AES_128_GCM_SHA256", "TLS_AES_256_GCM_SHA384", "TLS_CHACHA20_POLY1305_SHA256",
                "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256", "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
                "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256"}) if (supportedCiphers.contains(cipher)) ciphers.add(cipher);
        if (!protocols.contains("TLSv1.2") || !ciphers.contains("TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256")) {
            throw new IOException("This device does not support the required TLS 1.2 cipher");
        }
        socket.setUseClientMode(false);
        socket.setNeedClientAuth(false);
        socket.setEnabledProtocols(protocols.toArray(new String[0]));
        socket.setEnabledCipherSuites(ciphers.toArray(new String[0]));
    }

    /** No UI or network work here; safe to call for each animation frame. */
    public String snapshot() {
        synchronized (lock) {
            JSONArray list = new JSONArray();
            int connected = 0;
            long now = now();
            try {
                for (Player p : players) {
                    boolean live = p.peer != null && !p.peer.closed;
                    if (live) connected++;
                    if (!live || now - p.inputAt > STALE_INPUT_MS) p.clear();
                    list.put(new JSONObject().put("id", p.id).put("connected", live)
                            .put("x", p.x).put("y", p.y).put("a", p.a).put("b", p.b)
                            .put("start", p.start).put("select", p.select).put("cancelSeq", p.cancelSeq)
                            .put("startSeq", p.startSeq).put("selectSeq", p.selectSeq)
                            .put("selectMs", p.selectDuration(now)));
                }
                return new JSONObject().put("players", list).put("connections", connected).toString();
            } catch (JSONException impossible) { return "{\"players\":[],\"connections\":0}"; }
        }
    }

    public void publish(String status) {
        if (status == null || status.length() > 4096) return;
        try {
            JSONObject object = new JSONObject(status);
            object.put("type", "state");
            String encoded = object.toString();
            if (encoded.getBytes(StandardCharsets.UTF_8).length <= 4096) published = encoded;
        } catch (JSONException ignored) { /* Ignore an invalid bridge update. */ }
    }

    public void releaseInputs() {
        synchronized (lock) { for (Player p : players) p.clear(); }
    }

    @Override public void close() { stop(); }

    public synchronized void stop() {
        running = false;
        closeQuietly(listener);
        closeQuietly(tlsListener);
        synchronized (lock) {
            for (Socket socket : new ArrayList<>(sockets)) closeQuietly(socket);
            sockets.clear();
            handshakes.clear();
            for (Player p : players) { p.clear(p.peer != null); p.peer = null; p.session = null; p.disconnectedAt = 0; }
        }
        if (broadcaster != null) broadcaster.shutdownNow();
        if (workers != null) workers.shutdownNow();
        listener = null;
        tlsListener = null;
        // On some JVMs close() wakes accept() before its native listener FD is released.
        // Let that short unwind complete so returning from stop also releases the port.
        Thread stoppedAcceptor = acceptor;
        Thread stoppedTlsAcceptor = tlsAcceptor;
        acceptor = null;
        tlsAcceptor = null;
        for (Thread thread : new Thread[]{stoppedAcceptor, stoppedTlsAcceptor}) {
            if (thread != null && thread != Thread.currentThread()) {
                try { thread.join(250); }
                catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
            }
        }
    }

    private static Thread daemon(Runnable task, String name) {
        Thread thread = new Thread(task, name); thread.setDaemon(true); return thread;
    }

    private void acceptLoop(ServerSocket server) {
        while (running && (server == listener || server == tlsListener)) {
            Socket socket = null;
            try {
                socket = server.accept();
                socket.setSoTimeout(5000);
                socket.setTcpNoDelay(true);
                socket.setSendBufferSize(8192);
                synchronized (lock) {
                    if (!running || sockets.size() >= 12) { socket.close(); continue; }
                    sockets.add(socket);
                    if (socket instanceof SSLSocket) handshakes.put(socket, now());
                }
                final Socket client = socket;
                try { workers.execute(() -> handle(client)); }
                catch (RuntimeException rejected) {
                    synchronized (lock) { sockets.remove(client); handshakes.remove(client); }
                    closeQuietly(client);
                }
            } catch (IOException ignored) { if (socket != null) closeQuietly(socket); }
        }
    }

    private void handle(Socket socket) {
        Peer peer = null;
        try {
            boolean secure = socket instanceof SSLSocket;
            if (secure) {
                ((SSLSocket) socket).startHandshake();
                synchronized (lock) { handshakes.remove(socket); }
            }
            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();
            Request request = readRequest(in);
            if (!"GET".equals(request.method)) { http(out, 405, "text/plain", "GET only".getBytes(StandardCharsets.UTF_8)); return; }
            String host = request.headers.get("host");
            if (!validHost(host, socket)) { http(out, 403, "text/plain", new byte[0]); return; }
            URI uri = URI.create(request.target);
            if (uri.isAbsolute() || uri.getRawAuthority() != null || uri.getRawFragment() != null || !request.target.startsWith("/")) throw new IOException("Bad target");
            String path = uri.getRawPath();
            if ("/ws".equals(path)) {
                if (!room.equals(query(uri.getRawQuery(), "room")) || !sameOrigin(request.headers.get("origin"), host, secure)) {
                    http(out, 403, "text/plain", new byte[0]); return;
                }
                String key = request.headers.get("sec-websocket-key");
                if (!"websocket".equalsIgnoreCase(request.headers.get("upgrade"))
                        || !hasToken(request.headers.get("connection"), "upgrade")
                        || !"13".equals(request.headers.get("sec-websocket-version")) || !validKey(key)) {
                    http(out, 400, "text/plain", new byte[0]); return;
                }
                String accept = Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-1")
                        .digest((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").getBytes(StandardCharsets.US_ASCII)));
                out.write(("HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: "
                        + accept + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                out.flush();
                peer = new Peer(socket, in, out);
                peer.run();
                return;
            }
            if ("/connection.json".equals(path) || "/ca.crt".equals(path) || "/ca.mobileconfig".equals(path)) {
                if (!room.equals(query(uri.getRawQuery(), "room"))) { http(out, 403, "text/plain", new byte[0]); return; }
                if ("/connection.json".equals(path)) {
                    http(out, 200, "application/json; charset=utf-8", connectionInfo(socket).getBytes(StandardCharsets.UTF_8), host, secure, null);
                } else if (tls == null) { http(out, 404, "text/plain", new byte[0]); }
                else if ("/ca.crt".equals(path)) {
                    http(out, 200, "application/x-x509-ca-cert", tls.certificateDer(), host, secure, "puretv-lan-ca.crt");
                } else {
                    http(out, 200, "application/x-apple-aspen-config", tls.mobileConfig(), host, secure, "puretv-lan-ca.mobileconfig");
                }
                return;
            }
            String asset;
            String mime;
            if ("/".equals(path)) {
                if (!room.equals(query(uri.getRawQuery(), "room"))) { http(out, 403, "text/plain", new byte[0]); return; }
                asset = "controller.html"; mime = "text/html; charset=utf-8";
            } else if ("/controller.js".equals(path)) { asset = "controller.js"; mime = "application/javascript; charset=utf-8";
            } else if ("/steering.js".equals(path)) { asset = "steering.js"; mime = "application/javascript; charset=utf-8";
            } else if ("/secure-controller.js".equals(path)) { asset = "secure-controller.js"; mime = "application/javascript; charset=utf-8";
            } else if ("/controller.css".equals(path)) { asset = "controller.css"; mime = "text/css; charset=utf-8";
            } else { http(out, 404, "text/plain", new byte[0]); return; }
            try (InputStream file = assets.open(asset)) { http(out, 200, mime, readLimited(file, 512 * 1024), host, secure, null); }
        } catch (Exception ignored) { /* Bad, slow and disconnected LAN clients must not take down the TV. */ }
        finally {
            if (peer != null) peer.disconnect();
            closeQuietly(socket);
            synchronized (lock) { sockets.remove(socket); handshakes.remove(socket); }
        }
    }

    private String connectionInfo(Socket socket) throws JSONException {
        String address = socket.getLocalAddress().getHostAddress();
        ServerSocket httpServer = listener;
        String httpOrigin = "http://" + address + ":" + (httpServer == null ? 0 : httpServer.getLocalPort());
        int securePort = httpsPort();
        String httpsOrigin = securePort == 0 ? "" : "https://" + address + ":" + securePort;
        String pairingOrigin = socket instanceof SSLSocket ? httpsOrigin : httpOrigin;
        return new JSONObject().put("room", room)
                .put("secureUrl", securePort == 0 ? "" : httpsOrigin + "/?room=" + room)
                .put("localUrl", httpOrigin + "/?room=" + room)
                .put("certificateUrl", tls == null ? "" : pairingOrigin + "/ca.crt?room=" + room)
                .put("profileUrl", tls == null ? "" : pairingOrigin + "/ca.mobileconfig?room=" + room)
                .put("certificateSha256", tls == null ? "" : tls.fingerprint)
                .put("certificateName", tls == null ? "" : tls.displayName).toString();
    }

    private void broadcast() {
        if (!running) return;
        Peer[] peers = new Peer[2];
        synchronized (lock) { for (int i = 0; i < players.length; i++) peers[i] = players[i].peer; }
        for (Peer peer : peers) {
            if (peer == null || peer.closed) continue;
            try { peer.text(published); } catch (IOException ignored) { peer.disconnect(); }
        }
    }

    private void closeSlowWriters() {
        Peer[] peers = new Peer[2];
        ArrayList<Socket> expiredHandshakes = new ArrayList<>();
        synchronized (lock) {
            for (int i = 0; i < players.length; i++) peers[i] = players[i].peer;
            for (Map.Entry<Socket, Long> entry : handshakes.entrySet()) {
                if (now() - entry.getValue() > 5000) expiredHandshakes.add(entry.getKey());
            }
        }
        // SO_TIMEOUT alone bounds one read; this also bounds clients that trickle TLS handshake bytes.
        for (Socket socket : expiredHandshakes) closeQuietly(socket);
        for (Peer peer : peers) if (peer != null && peer.writeStartedAt != 0
                && now() - peer.writeStartedAt > 2000) peer.disconnect();
    }

    private Player join(Peer peer, String resume) {
        synchronized (lock) {
            long now = now();
            Player chosen = null;
            if (resume != null && resume.length() <= 64) {
                for (Player p : players) if (resume.equals(p.session)
                        && (p.peer != null || now - p.disconnectedAt < RESUME_MS)) { chosen = p; break; }
            }
            if (chosen == null) {
                for (Player p : players) if (p.peer == null && (p.session == null || now - p.disconnectedAt >= RESUME_MS)) {
                    chosen = p; chosen.session = randomToken();
                    chosen.startInput = false; chosen.selectInput = false; break;
                }
            }
            if (chosen == null) return null;
            Peer previous = chosen.peer;
            chosen.clear(previous != null); chosen.peer = peer; chosen.inputAt = now; peer.player = chosen;
            if (previous != null) { previous.closed = true; closeQuietly(previous.socket); }
            return chosen;
        }
    }

    private final class Peer {
        final Socket socket;
        final InputStream in;
        final OutputStream out;
        volatile boolean closed;
        volatile long writeStartedAt;
        Player player;
        long sequence = -1;
        long rateAt = now();
        int rate;

        Peer(Socket socket, InputStream in, OutputStream out) { this.socket = socket; this.in = in; this.out = out; }

        void run() throws IOException {
            long helloDeadline = now() + 5000;
            while (running && !closed) {
                if (player == null && now() > helloDeadline) throw new IOException("Hello timeout");
                socket.setSoTimeout(5000);
                int first = in.read();
                if (first < 0) break;
                long frameDeadline = Math.min(now() + 5000, player == null ? helloDeadline : Long.MAX_VALUE);
                int second = frameByte(frameDeadline);
                boolean fin = (first & 0x80) != 0;
                int opcode = first & 0x0f;
                if ((first & 0x70) != 0 || !fin || (second & 0x80) == 0) { fail("protocol_error"); break; }
                int length = second & 0x7f;
                if (length == 126) length = (frameByte(frameDeadline) << 8) | frameByte(frameDeadline);
                else if (length == 127) { fail("protocol_error"); break; }
                if (length > MAX_FRAME || (opcode >= 8 && length > 125)) { fail("protocol_error"); break; }
                byte[] mask = frameBytes(4, frameDeadline);
                byte[] bytes = frameBytes(length, frameDeadline);
                for (int i = 0; i < bytes.length; i++) bytes[i] ^= mask[i & 3];
                if (now() - rateAt >= 1000) { rateAt = now(); rate = 0; }
                if (++rate > 120) { fail("protocol_error"); break; }
                if (opcode == 8) { frame(8, bytes); break; }
                if (opcode == 9) { frame(10, bytes); continue; }
                if (opcode == 10) continue;
                if (opcode != 1) { fail("protocol_error"); break; }
                String content;
                try { content = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                        .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString(); }
                catch (CharacterCodingException badUtf8) { fail("protocol_error"); break; }
                try {
                    JSONObject message = new JSONObject(content);
                    String type = message.optString("type");
                    if ("hello".equals(type) && player == null) {
                        Player joined = join(this, message.optString("session", null));
                        if (joined == null) { fail("room_full"); break; }
                        text(new JSONObject().put("type", "welcome").put("player", joined.id)
                                .put("session", joined.session).put("heartbeatMs", 250).toString());
                        text(published);
                    } else if ("input".equals(type) && player != null) {
                        Object seqObject = message.opt("seq");
                        double seqNumber = message.optDouble("seq", -1);
                        if (!(seqObject instanceof Number) || !Double.isFinite(seqNumber) || seqNumber < 0
                                || seqNumber != Math.floor(seqNumber) || seqNumber > 9_007_199_254_740_991d) { fail("protocol_error"); break; }
                        long seq = (long) seqNumber;
                        if (seq <= sequence) continue;
                        double x = message.getDouble("x"), y = message.getDouble("y");
                        if (!Double.isFinite(x) || !Double.isFinite(y)
                                || !(message.opt("a") instanceof Boolean) || !(message.opt("b") instanceof Boolean)
                                || (message.has("start") && !(message.opt("start") instanceof Boolean))
                                || (message.has("select") && !(message.opt("select") instanceof Boolean))) { fail("protocol_error"); break; }
                        Object cancelObject = message.opt("cancelSeq");
                        double cancelNumber = message.has("cancelSeq") ? message.optDouble("cancelSeq", -1) : 0;
                        if ((message.has("cancelSeq") && !(cancelObject instanceof Number))
                                || !Double.isFinite(cancelNumber) || cancelNumber < 0
                                || cancelNumber != Math.floor(cancelNumber) || cancelNumber > 9_007_199_254_740_991d) { fail("protocol_error"); break; }
                        sequence = seq;
                        synchronized (lock) {
                            if (player.peer != this) break;
                            long clientCancelSeq = (long) cancelNumber;
                            if (clientCancelSeq != player.lastClientCancelSeq) {
                                player.lastClientCancelSeq = clientCancelSeq;
                                player.cancelInput();
                            }
                            player.x = Math.max(-1, Math.min(1, x)); player.y = Math.max(-1, Math.min(1, y));
                            player.a = message.getBoolean("a"); player.b = message.getBoolean("b");
                            // Older phone controllers omit the system menu buttons.
                            long receivedAt = now();
                            player.menuInput(message.optBoolean("start", false),
                                    message.optBoolean("select", false), receivedAt);
                            player.inputAt = receivedAt;
                        }
                    } else if ("ping".equals(type) && player != null) { text("{\"type\":\"pong\"}"); }
                    else { fail("protocol_error"); break; }
                } catch (JSONException badJson) { fail("protocol_error"); break; }
            }
        }

        void fail(String code) throws IOException {
            text("{\"type\":\"error\",\"code\":\"" + code + "\"}");
            frame(8, new byte[] {3, (byte) 240}); // 1008: policy/protocol violation.
        }
        private void frameTimeout(long deadline) throws IOException {
            long remaining = deadline - now();
            if (remaining <= 0) throw new IOException("Frame timeout");
            socket.setSoTimeout((int) Math.min(5000, remaining));
        }
        private int frameByte(long deadline) throws IOException {
            frameTimeout(deadline); return required(in);
        }
        private byte[] frameBytes(int count, long deadline) throws IOException {
            byte[] bytes = new byte[count]; int offset = 0;
            while (offset < count) {
                frameTimeout(deadline);
                int read = in.read(bytes, offset, count - offset);
                if (read < 0) throw new IOException("End of stream");
                offset += read;
            }
            return bytes;
        }
        void text(String value) throws IOException { frame(1, value.getBytes(StandardCharsets.UTF_8)); }
        synchronized void frame(int opcode, byte[] data) throws IOException {
            if (closed) throw new IOException("Closed");
            writeStartedAt = now();
            try {
                int header = data.length < 126 ? 2 : 4;
                byte[] packet = new byte[header + data.length];
                packet[0] = (byte) (0x80 | opcode);
                packet[1] = (byte) (header == 2 ? data.length : 126);
                if (header == 4) { packet[2] = (byte) (data.length >> 8); packet[3] = (byte) data.length; }
                System.arraycopy(data, 0, packet, header, data.length);
                // A single write avoids making each tiny WebSocket header field its own TLS record.
                out.write(packet); out.flush();
            } finally { writeStartedAt = 0; }
        }
        void disconnect() {
            closed = true; closeQuietly(socket);
            synchronized (lock) {
                if (player != null && player.peer == this) { player.clear(true); player.peer = null; player.disconnectedAt = now(); }
            }
        }
    }

    private static final class Player {
        final int id;
        String session;
        Peer peer;
        long disconnectedAt;
        long inputAt;
        long cancelSeq, lastClientCancelSeq;
        long startSeq, selectSeq, selectPressedAt, selectMs;
        double x, y;
        boolean a, b, start, select, startInput, selectInput, selectTiming;
        Player(int id) { this.id = id; }
        void menuInput(boolean nextStart, boolean nextSelect, long receivedAt) {
            // Counters outlive a press/release pair between two TV snapshots.
            if (nextStart && !startInput) startSeq = Math.min(9_007_199_254_740_991L, startSeq + 1);
            if (nextSelect && !selectInput) {
                selectSeq = Math.min(9_007_199_254_740_991L, selectSeq + 1);
                selectPressedAt = receivedAt; selectMs = 0; selectTiming = true;
            } else if (!nextSelect && selectInput) {
                selectMs = selectDuration(receivedAt); selectTiming = false;
            }
            startInput = start = nextStart; selectInput = select = nextSelect;
        }
        long selectDuration(long at) {
            return select && selectTiming ? Math.max(0, at - selectPressedAt) : selectMs;
        }
        void cancelInput() {
            cancelSeq = cancelSeq >= 9_007_199_254_740_991L ? 0 : cancelSeq + 1;
            // A cancelled held SELECT must not become a completed tap on release.
            selectMs = 0; selectTiming = false;
        }
        void clear() { clear(false); }
        void clear(boolean forceCancel) {
            if (forceCancel || a || b || x != 0 || y != 0 || start || select) cancelInput();
            // Keep raw menu edges until a real release arrives. A late held
            // heartbeat after a timeout is not a new press.
            x = 0; y = 0; a = false; b = false; start = false; select = false;
        }
    }

    private static final class Request {
        String method, target;
        final Map<String, String> headers = new HashMap<>();
    }

    private static Request readRequest(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int matched = 0;
        long started = now();
        byte[] end = {'\r', '\n', '\r', '\n'};
        while (buffer.size() < MAX_HTTP) {
            if (now() - started > 5000) throw new IOException("Header timeout");
            int b = required(in); buffer.write(b);
            matched = b == end[matched] ? matched + 1 : (b == '\r' ? 1 : 0);
            if (matched == 4) break;
        }
        if (matched != 4) throw new IOException("Headers too large");
        String[] lines = buffer.toString(StandardCharsets.US_ASCII.name()).split("\r\n");
        String[] first = lines[0].split(" ");
        if (first.length != 3 || !"HTTP/1.1".equals(first[2])) throw new IOException("Bad request");
        Request request = new Request(); request.method = first[0]; request.target = first[1];
        for (int i = 1; i < lines.length; i++) {
            int colon = lines[i].indexOf(':');
            if (colon <= 0 || Character.isWhitespace(lines[i].charAt(0))) throw new IOException("Bad header");
            String key = lines[i].substring(0, colon).toLowerCase(Locale.ROOT);
            if (!key.matches("[a-z0-9-]+") || request.headers.containsKey(key)) throw new IOException("Bad header");
            request.headers.put(key, lines[i].substring(colon + 1).trim());
        }
        if (request.headers.containsKey("transfer-encoding") || !"0".equals(request.headers.getOrDefault("content-length", "0"))) throw new IOException("No request body");
        return request;
    }

    private static boolean validHost(String host, Socket socket) {
        if (host == null) return false;
        // A numeric local Host prevents browser DNS-rebinding access from an unrelated domain.
        return host.equals(socket.getLocalAddress().getHostAddress() + ":" + socket.getLocalPort());
    }
    private static boolean sameOrigin(String origin, String host, boolean secure) { return ((secure ? "https://" : "http://") + host).equals(origin); }
    private static boolean validKey(String key) {
        if (key == null || key.length() > 32) return false;
        try { return Base64.getDecoder().decode(key).length == 16; } catch (IllegalArgumentException bad) { return false; }
    }
    private static boolean hasToken(String value, String token) {
        if (value == null) return false;
        for (String item : value.split(",")) if (token.equalsIgnoreCase(item.trim())) return true;
        return false;
    }
    private static String query(String query, String key) {
        if (query == null) return null;
        String result = null;
        for (String pair : query.split("&")) {
            if (!pair.startsWith(key + "=")) continue;
            if (result != null) return null;
            result = pair.substring(key.length() + 1);
        }
        return result;
    }
    private static void http(OutputStream out, int status, String mime, byte[] body) throws IOException {
        http(out, status, mime, body, null, false, null);
    }
    private static void http(OutputStream out, int status, String mime, byte[] body, String verifiedHost, boolean secure, String attachment) throws IOException {
        // Safari does not consistently include ws: in connect-src 'self'. Host was matched
        // exactly to this socket's numeric local address and port before reaching here.
        String websocketOrigin = verifiedHost == null ? "" : (secure ? " wss://" : " ws://") + verifiedHost;
        String headers = "HTTP/1.1 " + status + " " + (status == 200 ? "OK" : "Error")
                + "\r\nContent-Type: " + mime + "\r\nContent-Length: " + body.length
                + "\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff"
                + (attachment == null ? "" : "\r\nContent-Disposition: attachment; filename=\"" + attachment + "\"")
                + "\r\nPermissions-Policy: accelerometer=(self), gyroscope=(self), magnetometer=(self)"
                + "\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'self'; connect-src 'self'" + websocketOrigin
                + "; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; frame-ancestors 'none'; base-uri 'none'\r\n\r\n";
        out.write(headers.getBytes(StandardCharsets.US_ASCII)); out.write(body); out.flush();
    }
    private static int required(InputStream in) throws IOException {
        int value = in.read(); if (value < 0) throw new IOException("End of stream"); return value;
    }
    private static byte[] readLimited(InputStream in, int max) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] bytes = new byte[4096]; int count;
        while ((count = in.read(bytes)) != -1) { if (out.size() + count > max) throw new IOException("Asset too large"); out.write(bytes, 0, count); }
        return out.toByteArray();
    }
    private static String randomToken() {
        byte[] bytes = new byte[24]; new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
    private static long now() { return System.nanoTime() / 1_000_000; }
    private static void closeQuietly(AutoCloseable resource) { if (resource != null) try { resource.close(); } catch (Exception ignored) {} }
}
