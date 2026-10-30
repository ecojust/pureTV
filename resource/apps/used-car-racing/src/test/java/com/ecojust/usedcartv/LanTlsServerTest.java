package com.ecojust.usedcartv;

import org.json.JSONObject;
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.ConscryptMode;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyStore;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLException;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManagerFactory;

import static org.junit.Assert.*;

/** Exercises real TLS and WSS with a locally trusted test CA, without disabling certificate validation. */
@RunWith(RobolectricTestRunner.class) @Config(sdk = 28, manifest = Config.NONE)
// Keep one JVM TLS provider: mixing Robolectric's injected Conscrypt with SunJSSE
// can break JDK 17 named-group initialization before any socket is accepted.
@ConscryptMode(ConscryptMode.Mode.OFF)
public class LanTlsServerTest {
    private static final String TEST_PASSWORD = "local-test-only";
    private static Path temporary;
    private static byte[] certificate;
    private static final byte[] PROFILE = "<plist><dict>test public CA profile</dict></plist>".getBytes(StandardCharsets.UTF_8);
    private static String fingerprint;
    private static SSLContext serverContext;
    private static SSLContext clientContext;
    private LanGameServer server;
    private int httpPort;
    private int httpsPort;
    private final List<Socket> clients = new ArrayList<>();

    @BeforeClass public static void independentTestCertificates() throws Exception {
        // These keys only exist in the temporary test directory. Issuance is independent of the app's certificate helper.
        temporary = Files.createTempDirectory("puretv-lan-tls-test-");
        keytool("-genkeypair", "-alias", "root", "-keystore", "root.p12", "-storetype", "PKCS12",
                "-keyalg", "RSA", "-keysize", "2048", "-dname", "CN=PureTV Test CA", "-validity", "365",
                "-ext", "bc:critical=ca:true,pathlen:0", "-ext", "ku:critical=keyCertSign,cRLSign");
        keytool("-exportcert", "-alias", "root", "-keystore", "root.p12", "-file", "root.crt");
        keytool("-genkeypair", "-alias", "server", "-keystore", "server.p12", "-storetype", "PKCS12",
                "-keyalg", "RSA", "-keysize", "2048", "-dname", "CN=PureTV Test Server", "-validity", "30");
        keytool("-certreq", "-alias", "server", "-keystore", "server.p12", "-file", "server.csr");
        keytool("-gencert", "-alias", "root", "-keystore", "root.p12", "-infile", "server.csr", "-outfile", "server.crt",
                "-validity", "30", "-ext", "SAN=ip:127.0.0.1", "-ext", "EKU=serverAuth", "-ext", "KU:critical=digitalSignature");
        keytool("-importcert", "-noprompt", "-alias", "root", "-keystore", "server.p12", "-file", "root.crt");
        keytool("-importcert", "-alias", "server", "-keystore", "server.p12", "-file", "server.crt");
        certificate = Files.readAllBytes(temporary.resolve("root.crt"));
        StringBuilder hex = new StringBuilder();
        for (byte value : MessageDigest.getInstance("SHA-256").digest(certificate)) hex.append(String.format("%02x", value & 255));
        fingerprint = hex.toString();
        KeyStore keys = KeyStore.getInstance("PKCS12");
        try (InputStream input = Files.newInputStream(temporary.resolve("server.p12"))) { keys.load(input, TEST_PASSWORD.toCharArray()); }
        KeyManagerFactory managers = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        managers.init(keys, TEST_PASSWORD.toCharArray());
        serverContext = SSLContext.getInstance("TLS");
        serverContext.init(managers.getKeyManagers(), null, new SecureRandom());
        X509Certificate ca = (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(certificate));
        KeyStore trust = KeyStore.getInstance(KeyStore.getDefaultType()); trust.load(null, null); trust.setCertificateEntry("television", ca);
        TrustManagerFactory trustManagers = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); trustManagers.init(trust);
        clientContext = SSLContext.getInstance("TLS"); clientContext.init(null, trustManagers.getTrustManagers(), new SecureRandom());
    }

    @AfterClass public static void removeTestKeys() throws Exception {
        if (temporary != null) try (java.util.stream.Stream<Path> files = Files.walk(temporary)) {
            for (Path path : files.sorted(Comparator.reverseOrder()).toList()) Files.deleteIfExists(path);
        }
    }

    private static void keytool(String... arguments) throws Exception {
        ArrayList<String> command = new ArrayList<>();
        command.add(Path.of(System.getProperty("java.home"), "bin", "keytool").toString());
        command.addAll(Arrays.asList(arguments)); command.add("-storepass"); command.add(TEST_PASSWORD);
        Process process = new ProcessBuilder(command).directory(temporary.toFile()).redirectErrorStream(true).start();
        byte[] output = process.getInputStream().readAllBytes();
        assertTrue("Test certificate creation timed out", process.waitFor(30, TimeUnit.SECONDS));
        assertEquals("Test certificate creation failed: " + new String(output, StandardCharsets.UTF_8), 0, process.exitValue());
    }

    @Before public void start() throws Exception {
        server = new LanGameServer(name -> new ByteArrayInputStream(("asset:" + name).getBytes(StandardCharsets.UTF_8)),
                new LanGameServer.TlsConfig(serverContext, certificate, PROFILE, fingerprint, "PureTV Test CA"));
        httpPort = server.start(); httpsPort = server.httpsPort();
        assertTrue(httpsPort > 0); assertNotEquals(httpPort, httpsPort);
    }

    @After public void stop() throws Exception {
        if (server != null) server.stop();
        for (Socket socket : clients) socket.close();
    }

    @Test public void pairingConfigurationAndDownloadsAreBoundToTheRoomAndCurrentOrigin() throws Exception {
        for (boolean secure : new boolean[]{false, true}) {
            int port = secure ? httpsPort : httpPort;
            String origin = (secure ? "https://" : "http://") + "127.0.0.1:" + port;
            Response info = request(secure, "/connection.json?room=" + server.roomToken(), "127.0.0.1:" + port);
            assertTrue(info.headers.startsWith("HTTP/1.1 200"));
            JSONObject json = new JSONObject(new String(info.body, StandardCharsets.UTF_8));
            assertEquals(server.roomToken(), json.getString("room"));
            assertEquals("https://127.0.0.1:" + httpsPort + "/?room=" + server.roomToken(), json.getString("secureUrl"));
            assertEquals("http://127.0.0.1:" + httpPort + "/?room=" + server.roomToken(), json.getString("localUrl"));
            assertEquals(origin + "/ca.crt?room=" + server.roomToken(), json.getString("certificateUrl"));
            assertEquals(origin + "/ca.mobileconfig?room=" + server.roomToken(), json.getString("profileUrl"));
            assertEquals(fingerprint, json.getString("certificateSha256"));
            assertEquals("PureTV Test CA", json.getString("certificateName"));
            assertFalse(info.headers.toLowerCase().contains("access-control-allow-origin"));
            Response ca = request(secure, "/ca.crt?room=" + server.roomToken(), "127.0.0.1:" + port);
            assertArrayEquals(certificate, ca.body);
            assertTrue(ca.headers.contains("Content-Type: application/x-x509-ca-cert"));
            assertTrue(ca.headers.contains("Content-Disposition: attachment; filename=\"puretv-lan-ca.crt\""));
            Response profile = request(secure, "/ca.mobileconfig?room=" + server.roomToken(), "127.0.0.1:" + port);
            assertArrayEquals(PROFILE, profile.body);
            assertTrue(profile.headers.contains("Content-Type: application/x-apple-aspen-config"));
            for (String path : new String[]{"/connection.json", "/ca.crt", "/ca.mobileconfig"}) {
                assertTrue(request(secure, path + "?room=wrong", "127.0.0.1:" + port).headers.startsWith("HTTP/1.1 403"));
                assertTrue(request(secure, path + "?room=" + server.roomToken() + "&room=" + server.roomToken(), "127.0.0.1:" + port).headers.startsWith("HTTP/1.1 403"));
            }
        }
    }

    @Test public void tlsRequiresAnExplicitlyTrustedCaAndMatchingIpCertificate() throws Exception {
        try (SSLSocket socket = tls(clientContext, "127.0.0.1")) {
            assertTrue(socket.getSession().getProtocol().equals("TLSv1.3") || socket.getSession().getProtocol().equals("TLSv1.2"));
            assertArrayEquals(certificate, socket.getSession().getPeerCertificates()[1].getEncoded());
        }
        try { tls(SSLContext.getDefault(), "127.0.0.1"); fail("A fresh phone must reject the untrusted CA"); }
        catch (SSLException expected) { /* The default trust store does not trust this television. */ }
        try { tls(clientContext, "wrong.example"); fail("Installing the CA does not disable hostname verification"); }
        catch (SSLException expected) { /* IP SAN cannot authenticate another hostname. */ }
        try (SSLSocket socket = rawTls(clientContext, "127.0.0.1")) {
            socket.setEnabledProtocols(new String[]{"TLSv1.2"}); socket.startHandshake();
            assertEquals("TLSv1.2", socket.getSession().getProtocol());
            assertTrue(socket.getSession().getCipherSuite().startsWith("TLS_ECDHE_RSA_WITH_"));
            assertTrue(socket.getSession().getCipherSuite().contains("GCM") || socket.getSession().getCipherSuite().contains("CHACHA20"));
        }
    }

    @Test public void secureControllerAssetsUseWssAndStrictHosts() throws Exception {
        Response controller = request(true, "/?room=" + server.roomToken(), "127.0.0.1:" + httpsPort);
        assertTrue(controller.headers.startsWith("HTTP/1.1 200"));
        assertTrue(controller.headers.contains("connect-src 'self' wss://127.0.0.1:" + httpsPort + ";"));
        assertFalse(controller.headers.contains(" ws://"));
        assertTrue(controller.headers.contains("Permissions-Policy: accelerometer=(self), gyroscope=(self), magnetometer=(self)"));
        assertEquals("asset:controller.html", new String(controller.body, StandardCharsets.UTF_8));
        for (String asset : new String[]{"controller.css", "controller.js", "steering.js", "secure-controller.js"}) {
            Response response = request(true, "/" + asset, "127.0.0.1:" + httpsPort);
            assertEquals("asset:" + asset, new String(response.body, StandardCharsets.UTF_8));
        }
        assertTrue(request(true, "/?room=" + server.roomToken(), "attacker.example:" + httpsPort).headers.startsWith("HTTP/1.1 403"));
        assertTrue(request(true, "/", "127.0.0.1:" + httpsPort).headers.startsWith("HTTP/1.1 403"));
        for (String path : new String[]{"/private.key", "/ca.p12", "/server.p12", "/../ca.crt", "/%63a.crt", "/tv.html"}) {
            assertTrue(path, request(true, path + "?room=" + server.roomToken(), "127.0.0.1:" + httpsPort).headers.startsWith("HTTP/1.1 404"));
        }
    }

    @Test public void websocketOriginMustMatchBothProtocolAndListenerPort() throws Exception {
        for (String origin : new String[]{"http://127.0.0.1:" + httpsPort, "https://127.0.0.1:" + httpPort, "https://attacker.example", null}) {
            assertTrue(handshake(tls(clientContext, "127.0.0.1"), true, server.roomToken(), origin).startsWith("HTTP/1.1 403"));
        }
        assertTrue(handshake(plain(httpPort), false, server.roomToken(), "https://127.0.0.1:" + httpPort).startsWith("HTTP/1.1 403"));
        assertTrue(handshake(tls(clientContext, "127.0.0.1"), true, "wrong", "https://127.0.0.1:" + httpsPort).startsWith("HTTP/1.1 403"));
        assertTrue(handshake(tls(clientContext, "127.0.0.1"), true, server.roomToken(), "https://127.0.0.1:" + httpsPort).startsWith("HTTP/1.1 101"));
    }

    @Test public void httpToHttpsTransferKeepsTheSamePlayerAndReleasesHeldControls() throws Exception {
        Socket old = websocket(false); send(old, "{\"type\":\"hello\"}");
        JSONObject first = message(old, "welcome");
        send(old, "{\"type\":\"input\",\"seq\":0,\"x\":1,\"y\":0,\"a\":true,\"b\":true}");
        await(() -> player(0).getBoolean("a"));
        Socket secure = websocket(true);
        send(secure, new JSONObject().put("type", "hello").put("session", first.getString("session")).toString());
        JSONObject resumed = message(secure, "welcome");
        assertEquals(first.getInt("player"), resumed.getInt("player"));
        assertEquals(first.getString("session"), resumed.getString("session"));
        assertFalse(player(0).getBoolean("a")); assertFalse(player(0).getBoolean("b")); assertEquals(0, player(0).getDouble("x"), 0);
        Socket second = websocket(false); send(second, "{\"type\":\"hello\"}"); assertEquals(2, message(second, "welcome").getInt("player"));
        Socket third = websocket(true); send(third, "{\"type\":\"hello\"}"); assertEquals("room_full", message(third, "error").getString("code"));
        send(secure, "{\"type\":\"input\",\"seq\":1,\"x\":-0.75,\"y\":0,\"a\":true,\"b\":false}");
        await(() -> player(0).getBoolean("a")); assertEquals(-.75, player(0).getDouble("x"), 0);
        assertEquals(2, new JSONObject(server.snapshot()).getInt("connections"));
    }

    @Test public void stalledHandshakesHaveATimeLimitAndShareTheConnectionBudget() throws Exception {
        long started = System.nanoTime();
        Socket stalled = plain(httpsPort); stalled.setSoTimeout(8000);
        // JSSE may send a final TLS alert before EOF; no application data is sent during pairing failure.
        assertTrue(stalled.getInputStream().readAllBytes().length <= 64);
        assertTrue("An unfinished TLS handshake must not retain a worker", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started) < 7500);
        for (int i = 0; i < 12; i++) plain(httpsPort);
        java.lang.reflect.Field active = LanGameServer.class.getDeclaredField("sockets"); active.setAccessible(true);
        java.lang.reflect.Field lock = LanGameServer.class.getDeclaredField("lock"); lock.setAccessible(true);
        await(() -> { synchronized (lock.get(server)) { return ((Set<?>) active.get(server)).size() == 12; } });
        Socket excess = plain(httpPort); excess.setSoTimeout(1500); assertEquals(-1, excess.getInputStream().read());
        java.lang.reflect.Field pool = LanGameServer.class.getDeclaredField("workers"); pool.setAccessible(true);
        assertTrue(((ThreadPoolExecutor) pool.get(server)).getLargestPoolSize() <= 12);
        server.stop();
        assertPortReleased(httpPort); assertPortReleased(httpsPort);
        await(() -> Thread.getAllStackTraces().keySet().stream().noneMatch(thread -> thread.isAlive() && thread.getName().startsWith("used-car-racing-lan-")));
    }

    @Test public void pairingBytesAreDefensivelyCopiedAndFingerprintMustMatch() throws Exception {
        byte[] source = certificate.clone(), profile = PROFILE.clone();
        LanGameServer.TlsConfig config = new LanGameServer.TlsConfig(serverContext, source, profile, fingerprint, "TV");
        source[0] ^= 1; profile[0] ^= 1;
        assertArrayEquals(certificate, config.certificateDer()); assertArrayEquals(PROFILE, config.mobileConfig());
        config.certificateDer()[0] ^= 1; config.mobileConfig()[0] ^= 1;
        assertArrayEquals(certificate, config.certificateDer()); assertArrayEquals(PROFILE, config.mobileConfig());
        try { new LanGameServer.TlsConfig(serverContext, source, profile, fingerprint, "TV"); fail("CA metadata must match its bytes"); }
        catch (IllegalArgumentException expected) { }
    }

    private Socket plain(int port) throws Exception {
        Socket socket = new Socket("127.0.0.1", port); socket.setSoTimeout(4000); clients.add(socket); return socket;
    }
    private SSLSocket rawTls(SSLContext context, String expectedHost) throws Exception {
        Socket connection = plain(httpsPort);
        SSLSocket socket = (SSLSocket) context.getSocketFactory().createSocket(connection, expectedHost, httpsPort, true);
        SSLParameters parameters = socket.getSSLParameters(); parameters.setEndpointIdentificationAlgorithm("HTTPS"); socket.setSSLParameters(parameters);
        clients.add(socket); return socket;
    }
    private SSLSocket tls(SSLContext context, String expectedHost) throws Exception { SSLSocket socket = rawTls(context, expectedHost); socket.startHandshake(); return socket; }
    private Response request(boolean secure, String path, String host) throws Exception {
        Socket socket = secure ? tls(clientContext, "127.0.0.1") : plain(httpPort);
        socket.getOutputStream().write(("GET " + path + " HTTP/1.1\r\nHost: " + host + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
        String headers = headers(socket.getInputStream());
        return new Response(headers, socket.getInputStream().readAllBytes());
    }
    private Socket websocket(boolean secure) throws Exception {
        Socket socket = secure ? tls(clientContext, "127.0.0.1") : plain(httpPort);
        int port = secure ? httpsPort : httpPort;
        assertTrue(handshake(socket, secure, server.roomToken(), (secure ? "https://" : "http://") + "127.0.0.1:" + port).startsWith("HTTP/1.1 101"));
        return socket;
    }
    private String handshake(Socket socket, boolean secure, String room, String origin) throws Exception {
        int port = secure ? httpsPort : httpPort;
        String request = "GET /ws?room=" + room + " HTTP/1.1\r\nHost: 127.0.0.1:" + port
                + "\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
                + (origin == null ? "" : "Origin: " + origin + "\r\n") + "\r\n";
        socket.getOutputStream().write(request.getBytes(StandardCharsets.US_ASCII)); return headers(socket.getInputStream());
    }
    private static String headers(InputStream input) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); String value;
        do { int next = input.read(); if (next < 0) throw new AssertionError("Missing HTTP response"); out.write(next); value = out.toString("US-ASCII"); } while (!value.endsWith("\r\n\r\n"));
        return value;
    }
    private static void send(Socket socket, String text) throws Exception {
        byte[] data = text.getBytes(StandardCharsets.UTF_8), mask = {1, 2, 3, 4}; OutputStream out = socket.getOutputStream();
        out.write(0x81); if (data.length < 126) out.write(0x80 | data.length); else { out.write(0xfe); out.write(data.length >> 8); out.write(data.length & 255); }
        out.write(mask); for (int i = 0; i < data.length; i++) out.write(data[i] ^ mask[i & 3]); out.flush();
    }
    private static JSONObject message(Socket socket, String type) throws Exception {
        InputStream input = socket.getInputStream();
        for (int i = 0; i < 30; i++) {
            int opcode = input.read(); if (opcode < 0) throw new AssertionError("WebSocket closed before " + type);
            int size = input.read(); if (size == 126) size = (input.read() << 8) | input.read();
            byte[] bytes = input.readNBytes(size); assertEquals(size, bytes.length);
            if ((opcode & 15) != 1) continue;
            JSONObject frame = new JSONObject(new String(bytes, StandardCharsets.UTF_8)); if (type.equals(frame.optString("type"))) return frame;
        }
        throw new AssertionError("Missing WebSocket message " + type);
    }
    private JSONObject player(int index) throws Exception { return new JSONObject(server.snapshot()).getJSONArray("players").getJSONObject(index); }
    private interface Condition { boolean matches() throws Exception; }
    private static void await(Condition condition) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(3);
        while (!condition.matches()) { if (System.nanoTime() > deadline) fail("Timed out waiting for transport state"); Thread.sleep(10); }
    }
    private static void assertPortReleased(int port) throws Exception {
        try (ServerSocket socket = new ServerSocket()) { socket.setReuseAddress(true); socket.bind(new InetSocketAddress("0.0.0.0", port)); }
    }
    private static final class Response {
        final String headers; final byte[] body;
        Response(String headers, byte[] body) { this.headers = headers; this.body = body; }
    }
}
