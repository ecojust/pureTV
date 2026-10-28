package com.ecojust.jeweltv;

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
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.TimeUnit;

/** Small, bounded LAN-only controller transport. The game itself remains on the TV. */
public final class LanGameServer implements AutoCloseable {
    public interface AssetSource { InputStream open(String name) throws IOException; }

    private static final int MAX_HTTP = 8192;
    private static final int MAX_FRAME = 2048;
    private static final long STALE_INPUT_MS = 750;
    private static final long RESUME_MS = 15_000;
    private final AssetSource assets;
    private final String room = randomToken();
    private final Object lock = new Object();
    private final Player[] players = {new Player(1), new Player(2)};
    private final Set<Socket> sockets = new HashSet<>();
    private volatile ServerSocket listener;
    private volatile boolean running;
    private volatile String published = "{\"type\":\"state\",\"phase\":\"lobby\"}";
    private ThreadPoolExecutor workers;
    private ScheduledExecutorService broadcaster;
    private Thread acceptor;

    public LanGameServer(AssetSource assets) { this.assets = assets; }

    public synchronized int start() throws IOException {
        if (running) return listener.getLocalPort();
        listener = new ServerSocket();
        listener.setReuseAddress(true);
        listener.bind(new InetSocketAddress(InetAddress.getByName("0.0.0.0"), 0), 12);
        running = true;
        workers = new ThreadPoolExecutor(0, 12, 15, TimeUnit.SECONDS,
                new SynchronousQueue<>(), task -> daemon(task, "jewel-lan-client"),
                new ThreadPoolExecutor.AbortPolicy());
        broadcaster = Executors.newScheduledThreadPool(2, task -> daemon(task, "jewel-lan-state"));
        broadcaster.scheduleWithFixedDelay(this::broadcast, 200, 200, TimeUnit.MILLISECONDS);
        broadcaster.scheduleWithFixedDelay(this::closeSlowWriters, 500, 500, TimeUnit.MILLISECONDS);
        acceptor = daemon(this::acceptLoop, "jewel-lan-listen");
        acceptor.start();
        return listener.getLocalPort();
    }

    public String roomToken() { return room; }

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
                            .put("start", p.start).put("select", p.select));
                }
                return new JSONObject().put("players", list).put("connections", connected).toString();
            } catch (JSONException impossible) { return "{\"players\":[],\"connections\":0}"; }
        }
    }

    public void publish(String status) {
        if (status == null || status.length() > 16_384) return;
        try {
            JSONObject object = new JSONObject(status);
            object.put("type", "state");
            String encoded = object.toString();
            if (encoded.getBytes(StandardCharsets.UTF_8).length <= 16_384) published = encoded;
        } catch (JSONException ignored) { /* Ignore an invalid bridge update. */ }
    }

    public void releaseInputs() {
        synchronized (lock) { for (Player p : players) p.clear(); }
    }

    @Override public void close() { stop(); }

    public synchronized void stop() {
        running = false;
        closeQuietly(listener);
        synchronized (lock) {
            for (Socket socket : new ArrayList<>(sockets)) closeQuietly(socket);
            sockets.clear();
            for (Player p : players) { p.clear(); p.peer = null; p.session = null; p.disconnectedAt = 0; }
        }
        if (broadcaster != null) broadcaster.shutdownNow();
        if (workers != null) workers.shutdownNow();
        listener = null;
        // On some JVMs close() wakes accept() before its native listener FD is released.
        // Let that short unwind complete so returning from stop also releases the port.
        Thread stoppedAcceptor = acceptor;
        acceptor = null;
        if (stoppedAcceptor != null && stoppedAcceptor != Thread.currentThread()) {
            try { stoppedAcceptor.join(250); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        }
    }

    private static Thread daemon(Runnable task, String name) {
        Thread thread = new Thread(task, name); thread.setDaemon(true); return thread;
    }

    private void acceptLoop() {
        ServerSocket server = listener;
        while (running && server == listener) {
            Socket socket = null;
            try {
                socket = server.accept();
                socket.setSoTimeout(5000);
                socket.setTcpNoDelay(true);
                socket.setSendBufferSize(8192);
                synchronized (lock) {
                    if (!running || sockets.size() >= 12) { socket.close(); continue; }
                    sockets.add(socket);
                }
                final Socket client = socket;
                try { workers.execute(() -> handle(client)); }
                catch (RuntimeException rejected) {
                    synchronized (lock) { sockets.remove(client); }
                    closeQuietly(client);
                }
            } catch (IOException ignored) { if (socket != null) closeQuietly(socket); }
        }
    }

    private void handle(Socket socket) {
        Peer peer = null;
        try {
            InputStream in = socket.getInputStream();
            OutputStream out = socket.getOutputStream();
            Request request = readRequest(in);
            if (!"GET".equals(request.method)) { http(out, 405, "text/plain", "GET only".getBytes(StandardCharsets.UTF_8)); return; }
            String host = request.headers.get("host");
            if (!validHost(host, socket)) { http(out, 403, "text/plain", new byte[0]); return; }
            URI uri = URI.create(request.target);
            if (uri.isAbsolute() || uri.getRawFragment() != null || !request.target.startsWith("/")) throw new IOException("Bad target");
            String path = uri.getRawPath();
            if ("/ws".equals(path)) {
                if (!room.equals(query(uri.getRawQuery(), "room")) || !sameOrigin(request.headers.get("origin"), host)) {
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
            String asset;
            String mime;
            if ("/".equals(path)) {
                if (!room.equals(query(uri.getRawQuery(), "room"))) { http(out, 403, "text/plain", new byte[0]); return; }
                asset = "controller.html"; mime = "text/html; charset=utf-8";
            } else if ("/controller.js".equals(path)) { asset = "controller.js"; mime = "application/javascript; charset=utf-8";
            } else if ("/controller.css".equals(path)) { asset = "controller.css"; mime = "text/css; charset=utf-8";
            } else { http(out, 404, "text/plain", new byte[0]); return; }
            try (InputStream file = assets.open(asset)) { http(out, 200, mime, readLimited(file, 512 * 1024), host); }
        } catch (Exception ignored) { /* Bad, slow and disconnected LAN clients must not take down the TV. */ }
        finally {
            if (peer != null) peer.disconnect();
            closeQuietly(socket);
            synchronized (lock) { sockets.remove(socket); }
        }
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
        synchronized (lock) { for (int i = 0; i < players.length; i++) peers[i] = players[i].peer; }
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
                    chosen = p; chosen.session = randomToken(); break;
                }
            }
            if (chosen == null) return null;
            Peer previous = chosen.peer;
            chosen.clear(); chosen.peer = peer; chosen.inputAt = now; peer.player = chosen;
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
                        sequence = seq;
                        synchronized (lock) {
                            if (player.peer != this) break;
                            player.x = Math.max(-1, Math.min(1, x)); player.y = Math.max(-1, Math.min(1, y));
                            player.a = message.getBoolean("a"); player.b = message.getBoolean("b");
                            // Older phone controllers omit the NES menu buttons.
                            player.start = message.optBoolean("start", false);
                            player.select = message.optBoolean("select", false); player.inputAt = now();
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
                out.write(0x80 | opcode);
                if (data.length < 126) out.write(data.length);
                else { out.write(126); out.write(data.length >> 8); out.write(data.length & 255); }
                out.write(data); out.flush();
            } finally { writeStartedAt = 0; }
        }
        void disconnect() {
            closed = true; closeQuietly(socket);
            synchronized (lock) {
                if (player != null && player.peer == this) { player.clear(); player.peer = null; player.disconnectedAt = now(); }
            }
        }
    }

    private static final class Player {
        final int id;
        String session;
        Peer peer;
        long disconnectedAt;
        long inputAt;
        double x, y;
        boolean a, b, start, select;
        Player(int id) { this.id = id; }
        void clear() { x = 0; y = 0; a = false; b = false; start = false; select = false; }
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
    private static boolean sameOrigin(String origin, String host) { return ("http://" + host).equals(origin); }
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
        http(out, status, mime, body, null);
    }
    private static void http(OutputStream out, int status, String mime, byte[] body, String verifiedHost) throws IOException {
        // Safari does not consistently include ws: in connect-src 'self'. Host was matched
        // exactly to this socket's numeric local address and port before reaching here.
        String websocketOrigin = verifiedHost == null ? "" : " ws://" + verifiedHost;
        String headers = "HTTP/1.1 " + status + " " + (status == 200 ? "OK" : "Error")
                + "\r\nContent-Type: " + mime + "\r\nContent-Length: " + body.length
                + "\r\nConnection: close\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff"
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
