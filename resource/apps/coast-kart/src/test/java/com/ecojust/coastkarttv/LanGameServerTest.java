package com.ecojust.coastkarttv;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk = 28, manifest = Config.NONE)
public class LanGameServerTest {
    private LanGameServer server;
    private int port;
    private final List<Socket> sockets = new ArrayList<>();

    @Before public void start() throws Exception {
        server = new LanGameServer(name -> new ByteArrayInputStream(("asset:" + name).getBytes(StandardCharsets.UTF_8)));
        port = server.start();
    }
    @After public void stop() throws Exception {
        server.stop();
        for (Socket socket : sockets) socket.close();
    }

    @Test public void httpOnlyServesExplicitAssetsAndRequiresRoomForEntry() throws Exception {
        assertTrue(http("/?room=" + server.roomToken(), "127.0.0.1:" + port).contains("asset:controller.html"));
        assertTrue(http("/?room=" + server.roomToken(), "127.0.0.1:" + port)
                .contains("connect-src 'self' ws://127.0.0.1:" + port + ";"));
        assertTrue(http("/controller.js", "127.0.0.1:" + port).contains("application/javascript"));
        assertTrue(http("/controller.css", "127.0.0.1:" + port).contains("asset:controller.css"));
        assertTrue(http("/", "127.0.0.1:" + port).startsWith("HTTP/1.1 403"));
        assertTrue(http("/../secret", "127.0.0.1:" + port).startsWith("HTTP/1.1 404"));
        for (String asset : new String[] {"tv.html", "tv.css", "bootstrap.js", "game.js", "game-model.js", "runtime.js", "renderer.js", "audio.js", "world.js", "tracks.js"}) {
            assertTrue("TV assets never cross onto the phone server", http("/" + asset, "127.0.0.1:" + port).startsWith("HTTP/1.1 404"));
        }

        assertTrue(http("/?room=" + server.roomToken(), "attacker.example:" + port).startsWith("HTTP/1.1 403"));
    }

    @Test public void websocketAuthenticatesRoomAndOrigin() throws Exception {
        assertTrue(handshake(socket(), "wrong", "http://127.0.0.1:" + port).startsWith("HTTP/1.1 403"));
        assertTrue(handshake(socket(), server.roomToken(), "https://attacker.example").startsWith("HTTP/1.1 403"));
        assertTrue(handshake(socket(), server.roomToken(), null).startsWith("HTTP/1.1 403"));
        assertTrue(handshake(socket(), server.roomToken(), "http://127.0.0.1:" + port).startsWith("HTTP/1.1 101"));
    }

    @Test public void twoPlayersJoinAndThirdCannotTakeTheirSlots() throws Exception {
        Socket one = websocket(), two = websocket(), three = websocket();
        send(one, "{\"type\":\"hello\"}");
        JSONObject first = message(one, "welcome");
        send(two, "{\"type\":\"hello\",\"session\":\"not-a-session\"}");
        JSONObject second = message(two, "welcome");
        assertEquals(1, first.getInt("player")); assertEquals(2, second.getInt("player"));
        assertNotEquals(first.getString("session"), second.getString("session"));
        send(three, "{\"type\":\"hello\"}");
        assertEquals("room_full", message(three, "error").getString("code"));
        assertEquals(2, new JSONObject(server.snapshot()).getInt("connections"));
        send(one, input(1, 1, 0, true, false));
        send(two, input(1, -1, 1, false, true));
        await(() -> {
            org.json.JSONArray players = new JSONObject(server.snapshot()).getJSONArray("players");
            return players.getJSONObject(0).getBoolean("a") && players.getJSONObject(1).getBoolean("b");
        });
        org.json.JSONArray live = new JSONObject(server.snapshot()).getJSONArray("players");
        assertEquals(1, live.getJSONObject(0).getDouble("x"), 0);
        assertEquals(-1, live.getJSONObject(1).getDouble("x"), 0);

    }

    @Test public void inputsClampIgnoreOldSequencesAndExpireWithoutSticking() throws Exception {
        Socket socket = websocket(); send(socket, "{\"type\":\"hello\"}"); message(socket, "welcome");
        send(socket, new JSONObject(input(1, 4, -4, true, true)).put("start", true).put("select", true).toString());
        await(() -> player().optBoolean("a"));
        JSONObject active = player();
        assertEquals(1, active.getDouble("x"), 0); assertEquals(-1, active.getDouble("y"), 0);
        assertTrue(active.getBoolean("start")); assertTrue(active.getBoolean("select"));
        send(socket, input(0, 0, 0, false, false));
        send(socket, "{\"type\":\"ping\"}"); message(socket, "pong");
        assertTrue(player().getBoolean("a"));
        Thread.sleep(800);
        assertEquals(0, player().getDouble("x"), 0); assertFalse(player().getBoolean("a"));
        assertTrue(player().getBoolean("connected"));
        assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
    }

    @Test public void reconnectRequiresSessionAndClearsHeldInputs() throws Exception {
        Socket first = websocket(); send(first, "{\"type\":\"hello\"}");
        JSONObject welcome = message(first, "welcome");
        send(first, new JSONObject(input(90, 1, 0, true, false)).put("start", true).put("select", true).toString()); await(() -> player().optBoolean("start"));
        first.close(); await(() -> !player().optBoolean("connected"));
        assertFalse(player().getBoolean("a"));
        assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
        Socket second = websocket(); send(second, new JSONObject().put("type", "hello").put("session", welcome.getString("session")).toString());
        JSONObject resumed = message(second, "welcome");
        assertEquals(1, resumed.getInt("player")); assertEquals(welcome.getString("session"), resumed.getString("session"));
        send(second, input(0, -1, 0, false, true)); await(() -> player().optBoolean("b"));
        assertEquals(-1, player().getDouble("x"), 0);
    }

    @Test public void broadcastDeliversGameStateAndReleaseClearsInputs() throws Exception {
        Socket socket = websocket(); send(socket, "{\"type\":\"hello\"}"); message(socket, "welcome");
        server.publish("{\"phase\":\"playing\",\"stage\":3}");
        JSONObject state;
        do { state = message(socket, "state"); } while (!"playing".equals(state.optString("phase")));
        assertEquals(3, state.getInt("stage"));
        JSONObject ownState = new JSONObject().put("id", 1).put("joined", true).put("active", true).put("stageLabel", "A long local place name").put("score", 42)
                .put("lap", 2).put("rank", 3).put("item", "boost").put("tool", "rod").put("bagCount", 7).put("bagCapacity", 12);
        JSONObject secondState = new JSONObject().put("id", 2).put("joined", true).put("active", true).put("score", 18);
        server.publish(new JSONObject().put("phase", "playing").put("coins", 42).put("players", new org.json.JSONArray().put(ownState).put(secondState)).toString());
        do { state = message(socket, "state"); } while (!state.has("players"));
        assertTrue(state.getJSONArray("players").getJSONObject(0).getBoolean("active"));
        assertTrue(state.getJSONArray("players").getJSONObject(1).getBoolean("active"));
        assertEquals("boost", state.getJSONArray("players").getJSONObject(0).getString("item"));
        assertEquals(7, state.getJSONArray("players").getJSONObject(0).getInt("bagCount"));
        java.lang.reflect.Field published = LanGameServer.class.getDeclaredField("published");
        published.setAccessible(true);
        String accepted = (String) published.get(server);
        assertTrue(accepted.getBytes(StandardCharsets.UTF_8).length <= 4096);
        server.publish("invalid");
        server.publish(new JSONObject().put("label", "岛".repeat(2000)).toString());
        server.publish(new JSONObject().put("label", "x".repeat(4100)).toString());
        assertEquals("Malformed or oversized bridge updates retain the last valid state", accepted, published.get(server));

        send(socket, new JSONObject(input(0, 1, 1, true, true)).put("start", true).put("select", true).toString()); await(() -> player().optBoolean("start"));
        server.releaseInputs();
        assertFalse(player().getBoolean("a")); assertFalse(player().getBoolean("b"));
        assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
        assertEquals(0, player().getDouble("y"), 0);
    }

    @Test public void systemMenuButtonsReachSnapshotAndLegacyInputReleasesThem() throws Exception {
        Socket socket = websocket(); send(socket, "{\"type\":\"hello\"}"); message(socket, "welcome");
        assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
        send(socket, new JSONObject(input(1, 0, 0, false, false)).put("start", true).put("select", true).toString());
        await(() -> player().optBoolean("start") && player().optBoolean("select"));
        assertFalse(player().getBoolean("a")); assertFalse(player().getBoolean("b"));
        send(socket, input(2, 0, 0, true, false));
        await(() -> player().optBoolean("a"));
        assertFalse("A legacy snapshot releases Start", player().getBoolean("start"));
        assertFalse("A legacy snapshot releases Select", player().getBoolean("select"));
    }

    @Test public void optionalMenuButtonsRejectNonBooleanValues() throws Exception {
        String session = null;
        for (String key : new String[] {"start", "select"}) {
            for (Object invalid : new Object[] {"true", 1, JSONObject.NULL}) {
                Socket socket = websocket();
                JSONObject hello = new JSONObject().put("type", "hello");
                if (session != null) hello.put("session", session);
                send(socket, hello.toString()); session = message(socket, "welcome").getString("session");
                send(socket, new JSONObject(input(0, 0, 0, false, false)).put(key, invalid).toString());
                assertEquals(key, "protocol_error", message(socket, "error").getString("code"));
                await(() -> !player().optBoolean("connected"));
                assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
            }
        }
    }

    @Test public void malformedOrUnmaskedFramesCannotChangeInputs() throws Exception {
        Socket one = websocket(); send(one, "{\"type\":\"hello\"}"); message(one, "welcome");
        send(one, "{\"type\":\"input\",\"seq\":1,\"x\":0,\"y\":0,\"a\":\"yes\",\"b\":false}");
        assertEquals("protocol_error", message(one, "error").getString("code"));
        Socket two = websocket();
        two.getOutputStream().write(new byte[] {(byte) 0x81, 2, '{', '}'}); two.getOutputStream().flush();
        assertEquals("protocol_error", message(two, "error").getString("code"));
        Socket oversized = websocket();
        oversized.getOutputStream().write(new byte[] {(byte) 0x81, (byte) 0xfe, 0x10, 0});
        oversized.getOutputStream().flush();
        assertEquals("protocol_error", message(oversized, "error").getString("code"));
        assertFalse(player().getBoolean("a"));
    }

    @Test public void stopDisconnectsClientsAndPortCanBeReleased() throws Exception {
        Socket client = websocket(); send(client, "{\"type\":\"hello\"}"); message(client, "welcome");
        Socket second = websocket(); send(second, "{\"type\":\"hello\"}"); message(second, "welcome");
        send(client, new JSONObject(input(0, 1, 0, true, true)).put("start", true).put("select", true).toString()); await(() -> player().optBoolean("start"));
        server.stop();
        assertEquals(0, new JSONObject(server.snapshot()).getInt("connections"));
        assertFalse(player().getBoolean("a"));
        assertFalse(player().getBoolean("start")); assertFalse(player().getBoolean("select"));
        for (Socket phone : new Socket[] {client, second}) {
            phone.setSoTimeout(1000);
            // Drain any already-buffered state; both phones must then observe a closed socket.
            byte[] buffered = new byte[4096];
            int total = 0, count;
            while ((count = phone.getInputStream().read(buffered)) != -1) {
                total += count;
                assertTrue("No further state should be produced after stop", total < 65536);
            }
        }
        try (java.net.ServerSocket rebound = new java.net.ServerSocket()) {
            rebound.setReuseAddress(true);
            rebound.bind(new java.net.InetSocketAddress("0.0.0.0", port));
            assertEquals(port, rebound.getLocalPort());
        }
        await(() -> Thread.getAllStackTraces().keySet().stream().noneMatch(thread ->
                thread.isAlive() && thread.getName().startsWith("coast-kart-lan-")));
    }

    private JSONObject player() throws Exception { return new JSONObject(server.snapshot()).getJSONArray("players").getJSONObject(0); }
    private interface Condition { boolean test() throws Exception; }
    private void await(Condition check) throws Exception {
        long deadline = System.nanoTime() + 2_000_000_000L;
        while (!check.test()) { if (System.nanoTime() > deadline) fail("Timed out waiting for state"); Thread.sleep(10); }
    }
    private String input(int seq, double x, double y, boolean a, boolean b) {
        return "{\"type\":\"input\",\"seq\":" + seq + ",\"x\":" + x + ",\"y\":" + y + ",\"a\":" + a + ",\"b\":" + b + "}";
    }
    private Socket socket() throws Exception {
        Socket socket = new Socket("127.0.0.1", port); socket.setSoTimeout(3000); sockets.add(socket); return socket;
    }
    private Socket websocket() throws Exception {
        Socket socket = socket(); assertTrue(handshake(socket, server.roomToken(), "http://127.0.0.1:" + port).startsWith("HTTP/1.1 101")); return socket;
    }
    private String handshake(Socket socket, String room, String origin) throws Exception {
        String request = "GET /ws?room=" + room + " HTTP/1.1\r\nHost: 127.0.0.1:" + port
                + "\r\nUpgrade: websocket\r\nConnection: keep-alive, Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
                + (origin == null ? "" : "Origin: " + origin + "\r\n") + "\r\n";
        socket.getOutputStream().write(request.getBytes(StandardCharsets.US_ASCII)); socket.getOutputStream().flush();
        return headers(socket.getInputStream());
    }
    private String http(String path, String host) throws Exception {
        Socket socket = socket();
        socket.getOutputStream().write(("GET " + path + " HTTP/1.1\r\nHost: " + host + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
        ByteArrayOutputStream out = new ByteArrayOutputStream(); byte[] bytes = new byte[1024]; int n;
        while ((n = socket.getInputStream().read(bytes)) != -1) out.write(bytes, 0, n);
        return out.toString("UTF-8");
    }
    private String headers(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); String value;
        do { int b = in.read(); if (b < 0) throw new AssertionError("No handshake"); out.write(b); value = out.toString("US-ASCII"); } while (!value.endsWith("\r\n\r\n"));
        return value;
    }
    private void send(Socket socket, String text) throws Exception {
        byte[] data = text.getBytes(StandardCharsets.UTF_8), mask = {1, 2, 3, 4};
        OutputStream out = socket.getOutputStream(); out.write(0x81);
        if (data.length < 126) out.write(0x80 | data.length);
        else { out.write(0xfe); out.write(data.length >> 8); out.write(data.length & 255); }
        out.write(mask);
        for (int i = 0; i < data.length; i++) out.write(data[i] ^ mask[i & 3]); out.flush();
    }
    private JSONObject message(Socket socket, String type) throws Exception {
        InputStream in = socket.getInputStream();
        for (int attempt = 0; attempt < 30; attempt++) {
            int op = in.read(); if (op == -1) throw new AssertionError("Connection closed before " + type);
            int size = in.read(); if (size == 126) size = (in.read() << 8) | in.read();
            byte[] bytes = new byte[size]; int read = 0;
            while (read < size) { int n = in.read(bytes, read, size - read); if (n < 0) throw new AssertionError("Truncated frame"); read += n; }
            if ((op & 15) != 1) continue;
            JSONObject object = new JSONObject(new String(bytes, StandardCharsets.UTF_8));
            if (type.equals(object.optString("type"))) return object;
        }
        throw new AssertionError("Missing message " + type);
    }
}
