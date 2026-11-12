package com.ecojust.gamekit;

import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.Assert.*;

/** Real loopback TCP/JSON tests. These do not claim ESP32 or physical Wi-Fi validation. */
@RunWith(RobolectricTestRunner.class) @Config(sdk = 28, manifest = Config.NONE)
public class WifiControllerServerTest {
    private WifiControllerServer server;
    private int port;
    private final List<Socket> sockets = new ArrayList<>();
    private static final String DEVICE = "esp32-001122334455";

    @Before public void start() throws Exception { server = new WifiControllerServer(); port = server.start(0); }
    @After public void stop() throws Exception { server.stop(); for (Socket socket : sockets) socket.close(); }

    @Test public void allNineKeysAreMappedAndAcknowledgedWithTheSameSequence() throws Exception {
        Socket socket = socket();
        String[] keys = {"UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"};
        String[] fields = {"y", "y", "x", "x", "start", "a", "b", "a", "b"};
        int[] values = {-1, 1, -1, 1};
        for (int i = 0; i < keys.length; i++) {
            JSONObject ack = send(socket, message(i * 2, DEVICE, keys[i], true, "down"));
            assertEquals("ack", ack.getString("type")); assertEquals(i * 2, ack.getLong("seq"));
            assertEquals(2, ack.length());
            JSONObject p = player();
            assertEquals("wifi", p.getString("transport")); assertEquals(DEVICE, p.getString("controllerId"));
            if (i < 4) assertEquals(values[i], p.getDouble(fields[i]), 0);
            else assertTrue(keys[i], p.getBoolean(fields[i]));
            send(socket, message(i * 2 + 1, DEVICE, keys[i], false, "tap"));
            p = player();
            if (i < 4) assertEquals(0, p.getDouble(fields[i]), 0);
            else assertFalse(keys[i], p.getBoolean(fields[i]));
        }
        assertEquals(1, new JSONObject(server.snapshot()).getInt("connections"));
    }

    @Test public void fastDownThenTapSurvivesOneSnapshotButTapAloneDoesNotInventAPress() throws Exception {
        Socket socket = socket();
        send(socket, message(0, DEVICE, "A", false, "tap")); assertFalse(player().getBoolean("a"));
        send(socket, message(1, DEVICE, "A", true, "down"));
        send(socket, message(2, DEVICE, "A", false, "tap"));
        assertTrue(player().getBoolean("a")); assertFalse(player().getBoolean("a"));
        send(socket, message(3, DEVICE, "START", true, "down"));
        send(socket, message(4, DEVICE, "START", false, "tap"));
        assertTrue(player().getBoolean("start")); assertFalse(player().getBoolean("start"));
        send(socket, message(5, DEVICE, "RIGHT", true, "down"));
        send(socket, message(6, DEVICE, "RIGHT", false, "tap"));
        assertEquals(1, player().getDouble("x"), 0); assertEquals(0, player().getDouble("x"), 0);
    }

    @Test public void longPressContinuesAHoldAndNeverAddsASecondPulse() throws Exception {
        Socket socket = socket();
        send(socket, message(1, DEVICE, "B", true, "down")); assertTrue(player().getBoolean("b"));
        send(socket, message(2, DEVICE, "B", true, "long_press")); assertTrue(player().getBoolean("b"));
        send(socket, message(3, DEVICE, "B", true, "long_press"));
        send(socket, message(4, DEVICE, "B", false, "long_release")); assertFalse(player().getBoolean("b"));
        send(socket, message(5, DEVICE, "START", true, "long_press")); assertFalse(player().getBoolean("start"));
        send(socket, message(6, DEVICE, "START", false, "long_release")); assertFalse(player().getBoolean("start"));
    }

    @Test public void aliasesAndOpposingDirectionsAreMergedWithoutPrematureRelease() throws Exception {
        Socket socket = socket(); long seq = 0;
        for (String[] pair : new String[][] {{"A", "X", "a"}, {"B", "Y", "b"}}) {
            send(socket, message(seq++, DEVICE, pair[0], true, "down")); assertTrue(player().getBoolean(pair[2]));
            send(socket, message(seq++, DEVICE, pair[1], true, "down")); assertTrue(player().getBoolean(pair[2]));
            send(socket, message(seq++, DEVICE, pair[0], false, "tap")); assertTrue(player().getBoolean(pair[2]));
            send(socket, message(seq++, DEVICE, pair[1], false, "tap")); assertFalse(player().getBoolean(pair[2]));
        }
        send(socket, message(seq++, DEVICE, "LEFT", true, "down")); player();
        send(socket, message(seq++, DEVICE, "RIGHT", true, "down")); assertEquals(0, player().getDouble("x"), 0);
        send(socket, message(seq++, DEVICE, "RIGHT", false, "tap")); assertEquals(-1, player().getDouble("x"), 0);
    }

    @Test public void oldAndDuplicateSequencesAreAcknowledgedButNeverReplayed() throws Exception {
        Socket socket = socket();
        send(socket, message(12, DEVICE, "B", true, "down")); assertTrue(player().getBoolean("b"));
        send(socket, message(13, DEVICE, "B", false, "tap")); assertFalse(player().getBoolean("b"));
        for (int seq : new int[] {12, 13, 0}) {
            JSONObject ack = send(socket, message(seq, DEVICE, "B", true, "down"));
            assertEquals("ack", ack.getString("type")); assertEquals(seq, ack.getInt("seq")); assertFalse(player().getBoolean("b"));
        }
    }

    @Test public void syncUpdatesDirectionsButHeldActionAndStartNeedReleaseThenFreshDown() throws Exception {
        Socket socket = socket(); long seq = 0;
        send(socket, message(seq++, DEVICE, "RIGHT", true, "sync")); assertEquals(1, player().getDouble("x"), 0);
        for (String[] mapping : new String[][] {{"A","a"},{"X","a"},{"B","b"},{"Y","b"},{"START","start"}}) {
            send(socket, message(seq++, DEVICE, mapping[0], true, "sync")); assertFalse(mapping[0], player().getBoolean(mapping[1]));
            send(socket, message(seq++, DEVICE, mapping[0], true, "sync")); assertFalse(player().getBoolean(mapping[1]));
            send(socket, message(seq++, DEVICE, mapping[0], true, "long_press")); assertFalse(player().getBoolean(mapping[1]));
            send(socket, message(seq++, DEVICE, mapping[0], false, "sync")); assertFalse(player().getBoolean(mapping[1]));
            send(socket, message(seq++, DEVICE, mapping[0], true, "down")); assertTrue(player().getBoolean(mapping[1]));
            send(socket, message(seq++, DEVICE, mapping[0], false, "tap")); assertFalse(player().getBoolean(mapping[1]));
        }
    }

    @Test public void pauseCancellationClearsPulsesAndQuarantinesHeldKeysUntilRelease() throws Exception {
        Socket socket = socket();
        send(socket, message(0, DEVICE, "A", true, "down"));
        send(socket, message(1, DEVICE, "START", true, "down"));
        send(socket, message(2, DEVICE, "RIGHT", true, "down"));
        long before = player().getLong("cancelSeq");
        server.releaseInputs(); JSONObject cancelled = player();
        assertTrue(cancelled.getLong("cancelSeq") > before); assertFalse(cancelled.getBoolean("a"));
        assertFalse(cancelled.getBoolean("start")); assertEquals(0, cancelled.getDouble("x"), 0);
        send(socket, message(3, DEVICE, "A", true, "sync")); assertFalse(player().getBoolean("a"));
        send(socket, message(4, DEVICE, "A", false, "tap")); assertFalse(player().getBoolean("a"));
        send(socket, message(5, DEVICE, "A", true, "down")); assertTrue(player().getBoolean("a"));
    }

    @Test public void disconnectClearsEverythingAndReconnectAllowsSequenceRestart() throws Exception {
        Socket first = socket();
        send(first, message(100, DEVICE, "LEFT", true, "down"));
        send(first, message(101, DEVICE, "A", true, "down"));
        JSONObject active = player(); String session = active.getString("session");
        first.close(); await(() -> !server.hasController());
        JSONObject disconnected = player(); assertFalse(disconnected.getBoolean("a"));
        assertEquals(0, disconnected.getDouble("x"), 0); assertTrue(disconnected.getLong("cancelSeq") > active.getLong("cancelSeq"));
        Socket second = socket();
        send(second, message(0, DEVICE, "START", true, "sync"));
        JSONObject reconnected = player(); assertNotEquals(session, reconnected.getString("session"));
        assertFalse(reconnected.getBoolean("start")); assertFalse(reconnected.getBoolean("a"));
        send(second, message(1, DEVICE, "START", false, "sync"));
        send(second, message(2, DEVICE, "START", true, "down")); assertTrue(player().getBoolean("start"));
    }

    @Test public void rebuildingTheServerNeverReusesItsPreviousRuntimeIdentity() throws Exception {
        Socket first = socket(); send(first, message(0, DEVICE, "A", true, "down"));
        String previousSession = player().getString("session");
        server.stop(); assertClosed(first);
        server = new WifiControllerServer(); port = server.start(0);
        Socket rebuilt = socket(); send(rebuilt, message(0, DEVICE, "START", true, "sync"));
        JSONObject current = player(); assertNotEquals(previousSession, current.getString("session"));
        assertFalse(current.getBoolean("start")); assertFalse(current.getBoolean("a"));
    }

    @Test public void sameIdReplacesHalfOpenConnectionWithoutOldFinalizerClearingNewOwner() throws Exception {
        Socket first = socket(); send(first, message(99, DEVICE, "A", true, "down"));
        JSONObject original = player();
        Socket replacement = socket(); send(replacement, message(0, DEVICE, "RIGHT", true, "sync"));
        JSONObject current = player(); assertNotEquals(original.getString("session"), current.getString("session"));
        assertFalse(current.getBoolean("a")); assertEquals(1, current.getDouble("x"), 0);
        assertClosed(first);
        send(replacement, message(1, DEVICE, "B", true, "down"));
        assertTrue(player().getBoolean("b")); assertTrue(server.hasController());
    }

    @Test public void anotherControllerCannotTakeTheSeatOrReleaseTheOwnersKeys() throws Exception {
        Socket first = socket(); send(first, message(1, DEVICE, "A", true, "down")); JSONObject original = player();
        Socket other = socket(); JSONObject rejected = send(other, message(0, "esp32-other", "A", false, "sync"));
        assertEquals("error", rejected.getString("type")); assertEquals("controller_busy", rejected.getString("message"));
        assertEquals(0, rejected.getInt("seq")); assertClosed(other);
        JSONObject retained = player(); assertTrue(retained.getBoolean("a"));
        assertEquals(original.getString("session"), retained.getString("session"));
        assertEquals(original.getLong("cancelSeq"), retained.getLong("cancelSeq"));
    }

    @Test public void identityCannotChangeInsideAnEstablishedStream() throws Exception {
        Socket socket = socket(); send(socket, message(0, DEVICE, "RIGHT", true, "down")); player();
        JSONObject rejected = send(socket, message(1, "esp32-spoofed", "LEFT", true, "down"));
        assertEquals("controller_id_changed", rejected.getString("message")); assertEquals("error", rejected.getString("type"));
        assertClosed(socket); await(() -> !server.hasController()); assertEquals(0, player().getDouble("x"), 0);
    }

    @Test public void longHoldsDoNotRequireAnUndocumentedHeartbeat() throws Exception {
        Socket socket = socket(); send(socket, message(0, DEVICE, "LEFT", true, "down")); player();
        Thread.sleep(850);
        assertTrue(server.hasController()); assertEquals(-1, player().getDouble("x"), 0);
        send(socket, message(1, DEVICE, "LEFT", true, "long_press")); assertEquals(-1, player().getDouble("x"), 0);
    }

    @Test public void framingAcceptsFragmentedUtf8AndCrLfWithoutCombiningMessages() throws Exception {
        Socket socket = socket(); JSONObject m = message(0, DEVICE, "B", true, "down").put("note", "电视");
        byte[] bytes = (m.toString() + "\r\n").getBytes(StandardCharsets.UTF_8);
        for (byte value : bytes) socket.getOutputStream().write(value);
        socket.getOutputStream().flush(); assertEquals(0, ack(socket).getLong("seq")); assertTrue(player().getBoolean("b"));
        String two = message(1, DEVICE, "B", false, "tap") + "\n" + message(2, DEVICE, "A", true, "down") + "\n";
        socket.getOutputStream().write(two.getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush();
        assertEquals(1, ack(socket).getInt("seq")); assertEquals(2, ack(socket).getInt("seq"));
        JSONObject p = player(); assertTrue(p.getBoolean("a")); assertFalse(p.getBoolean("b"));
    }

    @Test public void malformedMessageTypesAndInconsistentStatesCannotBecomeInput() throws Exception {
        List<JSONObject> invalid = new ArrayList<>();
        invalid.add(message(0, DEVICE, "left", true, "down"));
        invalid.add(message(1, DEVICE, "A", false, "down"));
        invalid.add(message(2, DEVICE, "A", true, "tap"));
        invalid.add(message(3, DEVICE, "A", true, "sync").put("duration_ms", 1));
        invalid.add(message(4, DEVICE, "A", true, "down").put("seq", "4"));
        invalid.add(message(5, DEVICE, "A", true, "down").put("seq", 5.5));
        invalid.add(message(6, DEVICE, "A", true, "down").put("pressed", "true"));
        invalid.add(message(7, "", "A", true, "down"));
        invalid.add(message(8, DEVICE, "A", true, "down").put("type", "state"));
        invalid.add(message(9, DEVICE, "A", true, "down").put("duration_ms", -1));
        for (JSONObject m : invalid) {
            Socket socket = socket(); assertEquals("error", send(socket, m).getString("type")); assertClosed(socket);
            assertFalse(server.hasController()); assertFalse(player().getBoolean("a"));
        }
    }

    @Test public void invalidUtf8OversizedOrTrailingJsonClosesOnlyThatPeer() throws Exception {
        Socket invalidUtf8 = socket(); invalidUtf8.getOutputStream().write(new byte[] {(byte)0xc3, (byte)0x28, '\n'}); invalidUtf8.getOutputStream().flush(); assertClosed(invalidUtf8);
        Socket oversized = socket(); oversized.getOutputStream().write(new byte[1100]); oversized.getOutputStream().flush(); assertClosed(oversized);
        Socket trailing = socket(); trailing.getOutputStream().write((message(0, DEVICE, "A", true, "down")+"{}\n").getBytes(StandardCharsets.UTF_8));
        trailing.getOutputStream().flush(); assertEquals("error", ack(trailing).getString("type")); assertClosed(trailing);
        Socket valid = socket(); assertEquals("ack", send(valid, message(0, DEVICE, "A", true, "down")).getString("type")); assertTrue(player().getBoolean("a"));
    }

    @Test public void incompleteFrameTimesOutAndCancelsButIdleEstablishedStreamRemainsValid() throws Exception {
        Socket socket = socket(); send(socket, message(0, DEVICE, "A", true, "down")); player();
        socket.getOutputStream().write("{\"type\":".getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush();
        socket.setSoTimeout(6500); assertClosed(socket); await(() -> !server.hasController()); assertFalse(player().getBoolean("a"));
    }

    @Test public void occupiedPortFallsBackAndStopReleasesSocketsAndAllowsRestart() throws Exception {
        Socket first = socket(); send(first, message(0, DEVICE, "B", true, "down")); player();
        int oldPort = port; server.stop(); assertEquals(0, server.getPort()); assertFalse(server.hasController()); assertClosed(first);
        try (ServerSocket occupied = new ServerSocket(oldPort)) {
            port = server.start(oldPort); assertNotEquals(oldPort, port); assertEquals(port, server.getPort());
            Socket next = socket(); assertEquals("ack", send(next, message(0, DEVICE, "A", true, "down")).getString("type"));
        }
        server.stop(); server.stop();
    }

    @Test public void sdkHelloNineSyncAndPingReceiveExactSameSequenceAcks() throws Exception {
        Socket socket = socket(); long seq = 1;
        JSONObject hello = send(socket, control("hello", seq++, DEVICE));
        assertEquals("ack", hello.getString("type")); assertEquals(1, hello.getLong("seq")); assertEquals(2, hello.length());
        assertTrue(server.hasController());
        for (String key : new String[] {"UP", "DOWN", "LEFT", "RIGHT", "START", "A", "B", "X", "Y"}) {
            JSONObject ack = send(socket, message(seq, DEVICE, key, false, "sync"));
            assertEquals("ack", ack.getString("type")); assertEquals(seq++, ack.getLong("seq")); assertEquals(2, ack.length());
        }
        JSONObject before = player(); JSONObject ping = send(socket, control("ping", seq, DEVICE));
        assertEquals("ack", ping.getString("type")); assertEquals(seq, ping.getLong("seq"));
        assertEquals(before.toString(), player().toString());
    }

    @Test public void repeatedHelloAndPingKeepHeldKeysAndNeverGenerateStartOrActionPulses() throws Exception {
        Socket socket = socket(); send(socket, control("hello", 1, DEVICE));
        send(socket, message(2, DEVICE, "A", true, "down")); JSONObject before = player();
        for (String kind : new String[] {"hello", "ping"}) {
            send(socket, control(kind, "hello".equals(kind) ? 3 : 4, DEVICE));
            JSONObject current = player(); assertTrue(current.getBoolean("a")); assertFalse(current.getBoolean("start"));
            assertEquals(before.getString("session"), current.getString("session")); assertEquals(before.getLong("cancelSeq"), current.getLong("cancelSeq"));
        }
        send(socket, message(5, DEVICE, "A", false, "tap")); assertFalse(player().getBoolean("a"));
        send(socket, control("ping", 6, DEVICE)); assertFalse(player().getBoolean("a"));
    }

    @Test public void helloReconnectReplacesOldSocketAndResyncDoesNotReplayHeldStart() throws Exception {
        Socket first = socket(); send(first, control("hello", 40, DEVICE));
        send(first, message(41, DEVICE, "START", true, "down")); String oldSession = player().getString("session");
        Socket second = socket(); assertEquals("ack", send(second, control("hello", 1, DEVICE)).getString("type"));
        assertClosed(first); assertNotEquals(oldSession, player().getString("session"));
        send(second, message(2, DEVICE, "START", true, "sync")); assertFalse(player().getBoolean("start"));
    }

    @Test public void pingsKeepLongHoldsLiveAndMissingHeartbeatCancelsTheConnection() throws Exception {
        assertEquals(20_000, WifiControllerServer.IDLE_TIMEOUT_MS);
        server.stop(); server = new WifiControllerServer(1200); port = server.start(0);
        Socket socket = socket(); send(socket, control("hello", 1, DEVICE));
        send(socket, message(2, DEVICE, "RIGHT", true, "down")); JSONObject original = player();
        for (int i = 0; i < 5; i++) {
            Thread.sleep(350); send(socket, control("ping", i + 3, DEVICE));
            assertTrue(server.hasController()); assertEquals(1, player().getDouble("x"), 0);
        }
        socket.setSoTimeout(2500); assertClosed(socket); await(() -> !server.hasController());
        JSONObject cancelled = player(); assertEquals(0, cancelled.getDouble("x"), 0);
        assertTrue(cancelled.getLong("cancelSeq") > original.getLong("cancelSeq"));
    }

    private static JSONObject control(String kind, long seq, String id) throws Exception {
        return new JSONObject().put("type", kind).put("seq", seq).put("controller_id", id);
    }

    private Socket socket() throws Exception { Socket value = new Socket("127.0.0.1", port); value.setSoTimeout(2000); sockets.add(value); return value; }
    private JSONObject player() throws Exception { return new JSONObject(server.snapshot()).getJSONArray("players").getJSONObject(0); }
    private static JSONObject message(long seq, String id, String key, boolean pressed, String action) throws Exception {
        return new JSONObject().put("type", "button").put("seq", seq).put("controller_id", id).put("key", key)
                .put("pressed", pressed).put("action", action).put("duration_ms", "down".equals(action) || "sync".equals(action) ? 0 : 1400);
    }
    private static JSONObject send(Socket socket, JSONObject object) throws Exception {
        socket.getOutputStream().write((object.toString()+"\n").getBytes(StandardCharsets.UTF_8)); socket.getOutputStream().flush(); return ack(socket);
    }
    private static JSONObject ack(Socket socket) throws Exception {
        InputStream in = socket.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream(); int b;
        while ((b=in.read())!=-1 && b!='\n') { assertTrue(out.size()<2048); out.write(b); }
        assertEquals("ACK must be newline delimited", '\n', b); return new JSONObject(out.toString("UTF-8"));
    }
    private static void assertClosed(Socket socket) throws Exception {
        try { assertEquals(-1, socket.getInputStream().read()); }
        catch (java.net.SocketException closed) { /* TCP reset also closes the stream. */ }
    }
    private interface Check { boolean get() throws Exception; }
    private static void await(Check check) throws Exception { long end=System.nanoTime()+2_000_000_000L; while(!check.get()&&System.nanoTime()<end)Thread.sleep(10); assertTrue(check.get()); }
}
