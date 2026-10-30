package com.ecojust.usedcartv;

import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Bundle;
import android.os.Looper;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.WindowManager;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.ConscryptMode;
import org.robolectric.annotation.GraphicsMode;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowWebView;
import org.robolectric.util.ReflectionHelpers;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManagerFactory;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Verifies the actual Android host boundary and room lifetime, not a simulated browser bridge. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
// Keep this JVM's real TLS provider consistent instead of mixing Android's
// injected Conscrypt with SunJSSE. Device TLS is tested separately on Android.
@ConscryptMode(ConscryptMode.Mode.OFF)
public class MainActivityTest {
    public static class TestActivity extends MainActivity {
        private static KeyPair caKeys, serverKeys;
        private static X509Certificate ca;
        boolean terminated, failTls, failReset, blockReset, resetOnMain, networkAvailable = true;
        String networkAddress = "192.168.1.45";
        int tlsConfigurations, resetCalls;
        final CountDownLatch resetStarted = new CountDownLatch(1), resetContinue = new CountDownLatch(1);
        LanGameServer.TlsConfig lastTls;
        @Override public void onCreate(Bundle state) { setTheme(R.style.UsedCarTheme); super.onCreate(state); }
        @Override List<String> lanAddresses() { return networkAvailable ? Collections.singletonList(networkAddress) : Collections.emptyList(); }
        @Override void terminateProcess() { terminated = true; }
        @Override LanGameServer.TlsConfig createTlsConfiguration(List<String> addresses) throws Exception {
            tlsConfigurations++;
            if (failTls) throw new java.security.GeneralSecurityException("Injected unavailable device Keystore");
            if (caKeys == null) {
                KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048);
                caKeys = generator.generateKeyPair(); serverKeys = generator.generateKeyPair();
                ca = LanCertificates.createAuthority(caKeys, new Date());
            }
            List<String> testAddresses = new ArrayList<>(addresses); testAddresses.add("127.0.0.1");
            X509Certificate certificate = LanCertificates.createServer(ca, caKeys.getPrivate(), serverKeys.getPublic(), testAddresses, new Date());
            lastTls = new LanGameServer.TlsConfig(LanCertificates.serverContext(serverKeys.getPrivate(), certificate, ca),
                ca.getEncoded(), LanCertificates.mobileConfig(ca), LanCertificates.fingerprint(ca), LanCertificates.displayName(caKeys.getPublic()));
            return lastTls;
        }
        @Override void resetTlsIdentity() throws Exception {
            resetCalls++; resetOnMain = Looper.myLooper() == Looper.getMainLooper(); resetStarted.countDown();
            if (blockReset) resetContinue.await(10, TimeUnit.SECONDS);
            if (failReset) throw new java.security.GeneralSecurityException("Injected reset failure");
            caKeys = serverKeys = null; ca = null;
        }
    }

    private static final String[] TEXTURE_ASSETS={
        "asphalt-color.jpg",
        "asphalt-normal.jpg",
        "asphalt-specular.jpg",
        "concrete-color.jpg",
        "concrete-normal.jpg",
        "container-color.jpg",
        "container-normal.jpg",
        "facade-color.jpg",
        "foliage-color.png",
        "grass-color.jpg",
        "grass-normal.jpg",
        "rock-color.jpg",
        "rock-normal.jpg",
        "sand-color.jpg",
        "sand-normal.jpg",
        "solar-color.jpg",
        "solar-specular.jpg",
        "vehicle-atlas-color.jpg",
        "vehicle-atlas-normal.jpg",
        "vehicle-atlas-specular.jpg",
    };

    private ActivityController<TestActivity> controller;
    private TestActivity activity;
    private boolean started, destroyed;

    @Before public void create() {
        controller = Robolectric.buildActivity(TestActivity.class).create();
        activity = controller.get();
        // The test has a deterministic LAN address and does not subscribe to the host machine's network.
        ReflectionHelpers.setField(activity,"connectivity",null);
        assertNotNull(web());
    }
    @After public void close() {
        if (!destroyed) {
            if (started) { controller.pause().stop(); started=false; }
            controller.destroy();
        }
    }
    private WebView web() { return ReflectionHelpers.getField(activity,"web"); }
    private ShadowWebView browser() { return shadowOf(web()); }
    private LanGameServer server() { return ReflectionHelpers.getField(activity,"server"); }
    private MainActivity.HostBridge bridge() { return (MainActivity.HostBridge) browser().getJavascriptInterface("UsedCarHost"); }
    private void finishWorker() throws Exception {
        // AlertDialog posts its click listener to the paused main looper. Run
        // that listener before placing a worker barrier, or the barrier can
        // finish before the operation it is intended to wait for is queued.
        shadowOf(Looper.getMainLooper()).idle();
        ((ExecutorService)ReflectionHelpers.getField(activity,"worker")).submit(() -> {}).get(10,TimeUnit.SECONDS);
        shadowOf(Looper.getMainLooper()).idle();
    }
    private void start() throws Exception {
        controller.start().resume(); started=true;
        // Wait for QR generation/server startup, then dispatch the posted main-thread attachment.
        ExecutorService worker=ReflectionHelpers.getField(activity,"worker");
        worker.submit(() -> {}).get(10,TimeUnit.SECONDS);
        shadowOf(Looper.getMainLooper()).idle();
        assertNotNull(server());
        assertEquals(MainActivity.GAME_URL,browser().getLastLoadedUrl());
    }
    private int port() throws Exception { return Uri.parse(new JSONObject(bridge().getInfo()).getString("url")).getPort(); }
    private String trustedGet(int port, String path) throws Exception {
        KeyStore trusted = KeyStore.getInstance(KeyStore.getDefaultType()); trusted.load(null);
        trusted.setCertificateEntry("this-tv-only", CertificateFactory.getInstance("X.509").generateCertificate(
            new java.io.ByteArrayInputStream(activity.lastTls.certificateDer())));
        TrustManagerFactory trust = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); trust.init(trusted);
        SSLContext context = SSLContext.getInstance("TLS"); context.init(null, trust.getTrustManagers(), null);
        try (SSLSocket socket = (SSLSocket) context.getSocketFactory().createSocket("127.0.0.1", port)) {
            socket.setSoTimeout(5000);
            SSLParameters parameters = socket.getSSLParameters(); parameters.setEndpointIdentificationAlgorithm("HTTPS"); socket.setSSLParameters(parameters);
            socket.startHandshake();
            socket.getOutputStream().write(("GET "+path+" HTTP/1.1\r\nHost: 127.0.0.1:"+port+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
            return new String(socket.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        }
    }
    private String get(int port,String path) throws Exception {
        try (Socket socket=new Socket("127.0.0.1",port)) {
            socket.setSoTimeout(2000);
            socket.getOutputStream().write(("GET "+path+" HTTP/1.1\r\nHost: 127.0.0.1:"+port+"\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
            return new String(socket.getInputStream().readAllBytes(),StandardCharsets.UTF_8);
        }
    }
    private void assertClosed(int port) throws Exception {
        try (Socket probe=new Socket()) {
            try { probe.connect(new InetSocketAddress("127.0.0.1",port),500); fail("LAN listener survived its activity"); }
            catch (java.net.ConnectException expected) { }
        }
    }
    private Socket controllerClient(int port,String room) throws Exception {
        Socket socket=new Socket("127.0.0.1",port);socket.setSoTimeout(2000);
        String request="GET /ws?room="+room+" HTTP/1.1\r\nHost: 127.0.0.1:"+port+"\r\nOrigin: http://127.0.0.1:"+port+"\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n";
        socket.getOutputStream().write(request.getBytes(StandardCharsets.US_ASCII));
        ByteArrayOutputStream header=new ByteArrayOutputStream();
        while (!header.toString(StandardCharsets.US_ASCII).endsWith("\r\n\r\n")) {
            int value=socket.getInputStream().read();assertTrue(value>=0);header.write(value);
        }
        assertTrue(header.toString(StandardCharsets.US_ASCII).startsWith("HTTP/1.1 101"));
        byte[] hello="{\"type\":\"hello\"}".getBytes(StandardCharsets.UTF_8),mask={1,2,3,4};
        ByteArrayOutputStream frame=new ByteArrayOutputStream();frame.write(0x81);frame.write(0x80|hello.length);frame.write(mask);
        for (int i=0;i<hello.length;i++) frame.write(hello[i]^mask[i%4]);
        socket.getOutputStream().write(frame.toByteArray());socket.getOutputStream().flush();
        assertEquals(0x81,socket.getInputStream().read());
        int length=socket.getInputStream().read();
        if (length==126) length=(socket.getInputStream().read()<<8)|socket.getInputStream().read();
        byte[] payload=socket.getInputStream().readNBytes(length);
        assertEquals("welcome",new JSONObject(new String(payload,StandardCharsets.UTF_8)).getString("type"));
        return socket;
    }
    private void assertDisconnected(Socket socket) throws Exception {
        try {
            // Buffered state frames may arrive first; reaching EOF proves the accepted client was closed.
            while (socket.getInputStream().read()!=-1) { }
        } catch (java.net.SocketException reset) { /* An OS TCP reset also proves closure. */ }
        finally { socket.close(); }
    }

    private AlertDialog pairingConfirmation() {
        activity.onBackPressed();
        AlertDialog exit=ReflectionHelpers.getField(activity,"exitDialog");assertNotNull(exit);
        exit.getButton(AlertDialog.BUTTON_NEUTRAL).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        AlertDialog pairing=ReflectionHelpers.getField(activity,"pairingDialog");assertNotNull(pairing);
        return pairing;
    }

    @Test public void gameBridgeIsIsolatedFromExternalPagesAndDeviceFiles() {
        WebSettings settings=web().getSettings();
        assertTrue(settings.getJavaScriptEnabled());
        assertEquals("https://used-car-racing.invalid/tv.html", MainActivity.GAME_URL);
        assertTrue("The fixed local origin retains high scores across app updates",settings.getDomStorageEnabled());
        assertFalse(settings.getAllowFileAccess());
        assertFalse(settings.getAllowContentAccess());
        assertFalse(settings.getAllowFileAccessFromFileURLs());
        assertFalse(settings.getAllowUniversalAccessFromFileURLs());
        assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW,settings.getMixedContentMode());
        assertFalse(settings.supportMultipleWindows());
        assertNotNull(bridge());
        assertNull(browser().getJavascriptInterface("Android"));
        assertFalse(browser().getWebViewClient().shouldOverrideUrlLoading(web(),MainActivity.GAME_URL));
        for (String url:new String[]{"https://outside.example/","http://used-car-racing.invalid/tv.html","file:///sdcard/secret","content://private","https://used-car-racing.invalid/controller.html","https://used-car-racing.invalid/tv.html?external=1"})
            assertTrue(url,browser().getWebViewClient().shouldOverrideUrlLoading(web(),url));
    }

    @Test public void onlyBundledGameAssetsAreReadable() throws Exception {
        String[] names={"tv.html","tv.css","tracks.js","vehicle-models.js","game-model.js","renderer-3d.js","game.js","audio.js","three.min.js","materials.js"};
        String[] mimes={"text/html","text/css","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript"};
        java.util.Set<String> packaged = new java.util.HashSet<>(java.util.Arrays.asList(activity.getAssets().list("")));
        packaged.removeAll(java.util.Arrays.asList("controller.html", "controller.css", "controller.js", "steering.js", "secure-controller.js", "THREE-LICENSE.txt", "TEXTURE-LICENSE.txt", "textures"));
        // Robolectric may flatten descendant filenames into list(""); remove only
        // the exact texture inventory also checked through its own directory below.
        for (String texture:TEXTURE_ASSETS) packaged.remove("textures/"+texture);
        packaged.remove("textures/manifest.json");
        // Robolectric merges these exact Android framework assets into the app's AssetManager.
        // Keep unknown files in the comparison, including any new files under these directories.
        String[] frameworkAssets = {
            "images", "webkit", "images/android-logo-mask.png", "images/android-logo-shine.png",
            "images/clock_font.png", "webkit/android-weberror.png"
        };
        for (String frameworkAsset : frameworkAssets) {
            WebResourceResponse blocked = activity.localAsset(Uri.parse("https://used-car-racing.invalid/" + frameworkAsset));
            assertEquals("Framework assets must not enter the native bridge origin: " + frameworkAsset, 403, blocked.getStatusCode());
            assertEquals(-1, blocked.getData().read());
            blocked.getData().close();
        }
        packaged.removeAll(java.util.Arrays.asList(frameworkAssets));
        assertEquals("Every packaged TV asset must have an explicit native route", new java.util.HashSet<>(java.util.Arrays.asList(names)), packaged);
        for (int i=0;i<names.length;i++) {
            WebResourceResponse response=activity.localAsset(Uri.parse("https://used-car-racing.invalid/"+names[i]));
            assertEquals(names[i],200,response.getStatusCode());
            assertEquals(mimes[i],response.getMimeType());
            assertEquals("nosniff",response.getResponseHeaders().get("X-Content-Type-Options"));
            byte[] bytes=response.getData().readAllBytes();
            assertTrue("Bundled asset must not be empty: " + names[i], bytes.length > 0);
            try (java.io.InputStream bundled = activity.getAssets().open(names[i])) {
                assertArrayEquals("Native route must serve the exact bundled asset: " + names[i], bundled.readAllBytes(), bytes);
            }
            assertEquals("UTF-8",response.getEncoding());
            response.getData().close();
        }
        for (String url:new String[]{
            "https://used-car-racing.invalid/controller.js","https://used-car-racing.invalid/steering.js","https://used-car-racing.invalid/secure-controller.js","https://used-car-racing.invalid/THREE-LICENSE.txt","https://used-car-racing.invalid/TEXTURE-LICENSE.txt","https://used-car-racing.invalid/../private",
            "https://used-car-racing.invalid/secret","https://used-car-racing.invalid:443/game.js",
            "https://evil.example/game.js","http://used-car-racing.invalid/game.js",
            "file:///android_asset/game.js","content://private/data",
            "https://used-car-racing.invalid/game.js?other=1","https://used-car-racing.invalid/game.js#fragment",
            "https://user@used-car-racing.invalid/game.js","https://used-car-racing.invalid/%67ame.js",
            "https://used-car-racing.invalid/audio/../game.js","https://used-car-racing.invalid/data/../../game.js",
            "https://used-car-racing.invalid/audio/%2e%2e/game.js","https://used-car-racing.invalid/audio/not-bundled.ogg",
            "https://used-car-racing.invalid/data/stage-7.json","https://used-car-racing.invalid/art/unknown.png"
        }) {
            WebResourceResponse blocked=activity.localAsset(Uri.parse(url));
            assertEquals(url,403,blocked.getStatusCode());
            assertEquals(-1,blocked.getData().read());
            blocked.getData().close();
        }
    }

    @Test public void bundledMaterialTexturesHaveExactBinaryRoutesAndBoundedDimensions() throws Exception {
        String[] names=TEXTURE_ASSETS;
        java.util.Set<String> packaged = new java.util.HashSet<>(java.util.Arrays.asList(activity.getAssets().list("textures")));
        assertTrue("The texture manifest must be packaged for provenance",packaged.remove("manifest.json"));
        assertEquals("Every texture needs a deliberately named native route",new java.util.HashSet<>(java.util.Arrays.asList(names)),packaged);
        for (String name:names) {
            String path="textures/"+name;
            WebResourceResponse response=activity.localAsset(Uri.parse("https://used-car-racing.invalid/"+path));
            assertEquals(path,200,response.getStatusCode());
            String mime=name.endsWith(".png")?"image/png":"image/jpeg";
            assertEquals(path,mime,response.getMimeType());
            assertNull("Binary image data must not have a character encoding",response.getEncoding());
            assertEquals("nosniff",response.getResponseHeaders().get("X-Content-Type-Options"));
            byte[] bytes=response.getData().readAllBytes();
            response.getData().close();
            assertTrue(path,bytes.length>0);
            try (java.io.InputStream bundled=activity.getAssets().open(path)) {
                assertArrayEquals("The bridge route must preserve image bytes: "+path,bundled.readAllBytes(),bytes);
            }
            BitmapFactory.Options bounds=new BitmapFactory.Options();
            bounds.inJustDecodeBounds=true;
            BitmapFactory.decodeByteArray(bytes,0,bytes.length,bounds);
            assertEquals(path,mime,bounds.outMimeType);
            assertTrue("Texture width must be bounded for WebGL 1: "+path,bounds.outWidth>0 && bounds.outWidth<=1024);
            assertTrue("Texture height must be bounded for WebGL 1: "+path,bounds.outHeight>0 && bounds.outHeight<=1024);
            assertEquals("Repeating textures need power-of-two width: "+path,0,bounds.outWidth&(bounds.outWidth-1));
            assertEquals("Repeating textures need power-of-two height: "+path,0,bounds.outHeight&(bounds.outHeight-1));
        }
        for (String url:new String[]{
            "https://used-car-racing.invalid/textures/manifest.json",
            "https://used-car-racing.invalid/textures/unknown.jpg",
            "https://used-car-racing.invalid/textures/paint-color.jpg",
            "https://used-car-racing.invalid/textures/lamp-normal.jpg",
            "https://used-car-racing.invalid/textures/asphalt-color.png",
            "https://used-car-racing.invalid/textures/ASPHALT-color.jpg",
            "https://used-car-racing.invalid/textures/asphalt-color.jpg/",
            "https://used-car-racing.invalid/textures/../textures/asphalt-color.jpg",
            "https://used-car-racing.invalid/textures/%61sphalt-color.jpg",
            "https://used-car-racing.invalid/textures%2fasphalt-color.jpg",
            "https://used-car-racing.invalid/textures/asphalt-color.jpg?external=1",
            "https://used-car-racing.invalid/textures/asphalt-color.jpg#fragment",
            "https://used-car-racing.invalid:443/textures/asphalt-color.jpg",
            "https://user@used-car-racing.invalid/textures/asphalt-color.jpg",
            "https://outside.example/textures/asphalt-color.jpg",
            "http://used-car-racing.invalid/textures/asphalt-color.jpg",
            "file:///android_asset/textures/asphalt-color.jpg"
        }) {
            WebResourceResponse blocked=activity.localAsset(Uri.parse(url));
            assertEquals(url,403,blocked.getStatusCode());
            assertEquals(-1,blocked.getData().read());
            blocked.getData().close();
        }
    }

    @Test public void everyHtmlDependencyCanLoadThroughTheActualWebViewBoundary() throws Exception {
        WebResourceResponse page=activity.localAsset(Uri.parse(MainActivity.GAME_URL));
        String html=new String(page.getData().readAllBytes(),StandardCharsets.UTF_8);
        page.getData().close();
        java.util.regex.Matcher dependencies=java.util.regex.Pattern.compile("(?:src|href)=[\"']([^\"']+)[\"']").matcher(html);
        int count=0;
        java.util.Set<String> loaded = new java.util.HashSet<>();
        while (dependencies.find()) {
            String dependency=dependencies.group(1);
            if (dependency.startsWith("data:") || dependency.startsWith("#")) continue;
            loaded.add(dependency);
            WebResourceResponse response=activity.localAsset(Uri.parse(new java.net.URI(MainActivity.GAME_URL).resolve(dependency).toString()));
            assertEquals("HTML dependency: "+dependency,200,response.getStatusCode());
            assertTrue(response.getData().readAllBytes().length>0);
            response.getData().close();count++;
        }
        assertTrue("The test must inspect the real script and stylesheet dependencies",count>=7);
        assertTrue("The TV page must load bundled Three.js",loaded.contains("three.min.js"));
        assertTrue("The TV page must load its WebGL renderer",loaded.contains("renderer-3d.js"));
        assertTrue("Physics and graphics must share the bundled tracks",loaded.contains("tracks.js"));
        assertTrue("Vehicle geometry must be local",loaded.contains("vehicle-models.js"));
        assertTrue("Surface textures must use the local shared material library",loaded.contains("materials.js"));
    }

    @Test public void phoneScriptsAndStylesAreServedFromTheBundledOfflineController() throws Exception {
        start();
        int roomPort=port();
        String response=get(roomPort,"/?room="+server().roomToken());
        assertTrue(response.startsWith("HTTP/1.1 200"));
        String html=response.substring(response.indexOf("\r\n\r\n")+4);
        java.util.regex.Matcher dependencies=java.util.regex.Pattern.compile("(?:src|href)=[\"']([^\"']+)[\"']").matcher(html);
        java.util.Set<String> loaded=new java.util.HashSet<>();
        java.net.URI pageUri=java.net.URI.create("http://127.0.0.1:"+roomPort+"/?room="+server().roomToken());
        while(dependencies.find()) {
            String reference=dependencies.group(1);
            // The explicit empty favicon is inline and makes no network request.
            if ("data:,".equals(reference)) continue;
            java.net.URI dependency=pageUri.resolve(reference);
            assertEquals("Initial phone dependencies must use the LAN page scheme: "+reference,pageUri.getScheme(),dependency.getScheme());
            assertEquals("Initial phone dependencies must remain on the LAN origin: "+reference,pageUri.getRawAuthority(),dependency.getRawAuthority());
            assertNull("Bundled dependency has no query: "+reference,dependency.getRawQuery());
            assertNull("Bundled dependency has no fragment: "+reference,dependency.getRawFragment());
            String path=dependency.getRawPath();
            String assetResponse=get(roomPort,path);
            assertTrue(path,assetResponse.startsWith("HTTP/1.1 200"));
            assertTrue("Client requests cannot open cross-origin network access",assetResponse.contains("connect-src 'self' ws://127.0.0.1:"+roomPort+";"));
            String body=assetResponse.substring(assetResponse.indexOf("\r\n\r\n")+4);
            try(java.io.InputStream bundled=activity.getAssets().open(path.substring(1))) {
                assertEquals("Serve exact offline client asset: "+path,new String(bundled.readAllBytes(),StandardCharsets.UTF_8),body);
            }
            loaded.add(path);
        }
        assertEquals(new java.util.HashSet<>(java.util.Arrays.asList("/controller.css","/controller.js","/steering.js","/secure-controller.js")),loaded);
        for(String path:new String[]{"/materials.js","/game.js","/textures/vehicle-atlas-color.jpg","/secure-controller.html","/unknown-controller.js","/%73teering.js","/../steering.js"}) {
            assertTrue(path,get(roomPort,path).startsWith("HTTP/1.1 404"));
        }
    }

    @Test public void generatedPngQrDecodesToExactJoinUrl() throws Exception {
        String url="http://192.168.1.45:49152/?room=0123456789abcdef0123456789abcdef";
        String data=MainActivity.qrData(url);
        assertQr(url,data);
    }

    private void assertQr(String url, String data) throws Exception {
        assertTrue(data.startsWith("data:image/png;base64,"));
        byte[] png=Base64.decode(data.substring(data.indexOf(',')+1),Base64.NO_WRAP);
        Bitmap bitmap=BitmapFactory.decodeByteArray(png,0,png.length);
        assertNotNull(bitmap); assertEquals(320,bitmap.getWidth()); assertEquals(320,bitmap.getHeight());
        int[] pixels=new int[320*320];bitmap.getPixels(pixels,0,320,0,0,320,320);
        String decoded=new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(320,320,pixels)))).getText();
        assertEquals(url,decoded);
        assertEquals(0xffffffff,pixels[0]);
        bitmap.recycle();
    }

    @Test public void roomOffersLocalSetupAndTrustedHttpsWithMatchingCertificate() throws Exception {
        start();
        JSONObject info = new JSONObject(bridge().getInfo());
        assertTrue(info.getString("url").startsWith("http://192.168.1.45:"));
        assertTrue(info.getString("secureUrl").startsWith("https://192.168.1.45:"));
        assertEquals(server().httpsPort(), Uri.parse(info.getString("secureUrl")).getPort());
        assertEquals(server().roomToken(), Uri.parse(info.getString("secureUrl")).getQueryParameter("room"));
        assertEquals(activity.lastTls.fingerprint, info.getString("certificateFingerprint"));
        assertEquals(activity.lastTls.displayName, info.getString("certificateName"));
        assertEquals("", info.getString("secureError"));
        assertQr(info.getString("url"), info.getString("qr"));
        assertQr(info.getString("secureUrl"), info.getString("secureQr"));
        String response = trustedGet(server().httpsPort(), "/controller.js");
        assertTrue(response.startsWith("HTTP/1.1 200"));
        assertTrue(response.contains("connect-src 'self' wss://127.0.0.1:"+server().httpsPort()+";"));
        response = trustedGet(server().httpsPort(), "/connection.json?room="+server().roomToken());
        JSONObject connection = new JSONObject(response.substring(response.indexOf("\r\n\r\n")+4));
        assertEquals(info.getString("certificateFingerprint"), connection.getString("certificateSha256"));
        assertEquals(info.getString("certificateName"), connection.getString("certificateName"));
        assertEquals(1, activity.tlsConfigurations);
    }

    @Test public void missingNetworkDoesNotGenerateAnInvalidIpCertificate() throws Exception {
        activity.networkAvailable = false; start();
        JSONObject info = new JSONObject(bridge().getInfo());
        assertEquals(0, activity.tlsConfigurations);
        assertEquals(0, server().httpsPort());
        assertEquals("", info.getString("url"));
        assertEquals("", info.getString("secureUrl"));
        assertEquals("", info.getString("certificateFingerprint"));
        assertEquals(activity.getString(R.string.no_network), info.getString("error"));
    }

    @Test public void unavailableKeystoreKeepsJoystickButReportsMissingSecureControls() throws Exception {
        activity.failTls = true; start();
        JSONObject info = new JSONObject(bridge().getInfo());
        assertEquals(0, server().httpsPort());
        assertEquals("", info.getString("secureUrl"));
        assertEquals("", info.getString("certificateFingerprint"));
        assertEquals(activity.getString(R.string.secure_server_error), info.getString("secureError"));
        assertTrue(get(port(), "/controller.js").startsWith("HTTP/1.1 200"));
    }

    @Test public void networkChangeClosesBothListenersAndKeepsTheTelevisionAuthority() throws Exception {
        start();
        int oldHttp = port(), oldHttps = server().httpsPort();
        JSONObject before = new JSONObject(bridge().getInfo());
        activity.networkAddress = "192.168.1.46";
        ReflectionHelpers.callInstanceMethod(activity, "startRoom");
        ((ExecutorService)ReflectionHelpers.getField(activity,"worker")).submit(() -> {}).get(10,TimeUnit.SECONDS);
        shadowOf(Looper.getMainLooper()).idle();
        JSONObject after = new JSONObject(bridge().getInfo());
        assertClosed(oldHttp); assertClosed(oldHttps);
        assertTrue(after.getString("secureUrl").startsWith("https://192.168.1.46:"));
        assertNotEquals(Uri.parse(before.getString("url")).getQueryParameter("room"),server().roomToken());
        assertEquals(before.getString("certificateFingerprint"),after.getString("certificateFingerprint"));
        assertEquals(2,activity.tlsConfigurations);
        assertTrue(trustedGet(server().httpsPort(),"/controller.js").startsWith("HTTP/1.1 200"));
    }

    @Test public void cancellingPairingResetKeepsTheRoomCertificateAndConnectedPhones() throws Exception {
        start();
        String oldInfo=bridge().getInfo(), token=server().roomToken();
        try(Socket client=controllerClient(port(),token)) {
            AlertDialog dialog=pairingConfirmation();
            assertTrue((boolean)ReflectionHelpers.getField(activity,"suspended"));
            dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();
            shadowOf(Looper.getMainLooper()).idle();
            assertEquals(0,activity.resetCalls);
            assertEquals(token,server().roomToken());
            assertEquals(oldInfo,bridge().getInfo());
            assertEquals(1,new JSONObject(server().snapshot()).getInt("connections"));
            assertFalse((boolean)ReflectionHelpers.getField(activity,"suspended"));
        }
    }

    @Test public void confirmedPairingResetRunsOffMainClosesAllClientsAndCreatesANewAuthority() throws Exception {
        start();
        int oldHttp=port(),oldHttps=server().httpsPort();
        JSONObject before=new JSONObject(bridge().getInfo());
        Socket client=controllerClient(oldHttp,server().roomToken());
        pairingConfirmation().getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        finishWorker(); // Certificate reset posts the new room startup back to the main thread.
        finishWorker(); // The new room then completes its own worker task and attachment.
        assertEquals(1,activity.resetCalls);assertFalse(activity.resetOnMain);
        assertClosed(oldHttp);assertClosed(oldHttps);assertDisconnected(client);
        JSONObject after=new JSONObject(bridge().getInfo());
        assertNotEquals(before.getString("certificateFingerprint"),after.getString("certificateFingerprint"));
        assertNotEquals(Uri.parse(before.getString("url")).getQueryParameter("room"),server().roomToken());
        assertEquals("",after.getString("secureError"));
        assertTrue(trustedGet(server().httpsPort(),"/controller.js").startsWith("HTTP/1.1 200"));
        assertTrue(web().getSettings().getDomStorageEnabled());
        assertEquals(MainActivity.GAME_URL,browser().getLastLoadedUrl());
    }

    @Test public void failedPairingResetShowsAnErrorWithoutAutomaticallyIssuingAnotherCertificate() throws Exception {
        start();activity.failReset=true;
        LanGameServer previous=server();
        int oldHttp=port(),oldHttps=previous.httpsPort();
        assertTrue(oldHttps>0);
        pairingConfirmation().getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        finishWorker();finishWorker();
        JSONObject info=new JSONObject(bridge().getInfo());
        assertEquals(1,activity.resetCalls);assertEquals(1,activity.tlsConfigurations);
        assertNotSame("The fallback room must be attached before checking its metadata",previous,server());
        assertClosed(oldHttp);assertClosed(oldHttps);
        assertEquals("",info.getString("secureUrl"));assertEquals(0,server().httpsPort());
        assertEquals(activity.getString(R.string.reset_certificate_error),info.getString("secureError"));
        assertTrue(get(port(),"/controller.js").startsWith("HTTP/1.1 200"));
        activity.networkAddress="192.168.1.46";
        ReflectionHelpers.callInstanceMethod(activity,"startRoom");finishWorker();
        assertEquals("A network change must not silently retry the failed reset",1,activity.tlsConfigurations);
        assertEquals(0,server().httpsPort());
    }

    @Test public void leavingDuringPairingResetCannotReopenTheRoomOrReviveTheWebView() throws Exception {
        start();activity.blockReset=true;
        int oldHttp=port(),oldHttps=server().httpsPort();
        pairingConfirmation().getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertTrue(activity.resetStarted.await(5,TimeUnit.SECONDS));
        controller.pause().stop();started=false;
        activity.resetContinue.countDown();
        assertTrue(((ExecutorService)ReflectionHelpers.getField(activity,"worker")).awaitTermination(5,TimeUnit.SECONDS));
        shadowOf(Looper.getMainLooper()).idle();
        assertNull(server());assertNull(web());assertTrue(activity.terminated);
        assertClosed(oldHttp);assertClosed(oldHttps);
    }

    @Test public void networkChangeDuringPairingResetWaitsAndUsesTheNewAddress() throws Exception {
        start();activity.blockReset=true;
        pairingConfirmation().getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertTrue(activity.resetStarted.await(5,TimeUnit.SECONDS));
        activity.networkAddress="192.168.1.46";
        ((Runnable)ReflectionHelpers.getField(activity,"checkNetwork")).run();
        assertNull("Network changes must not open a room using the identity being reset",server());
        assertEquals(1,activity.tlsConfigurations);
        activity.resetContinue.countDown();finishWorker();finishWorker();
        assertEquals(1,activity.resetCalls);assertEquals(2,activity.tlsConfigurations);
        assertFalse((boolean)ReflectionHelpers.getField(activity,"pairingResetting"));
        assertTrue(new JSONObject(bridge().getInfo()).getString("secureUrl").startsWith("https://192.168.1.46:"));
        activity.onBackPressed();
        AlertDialog exit=ReflectionHelpers.getField(activity,"exitDialog");assertNotNull(exit);
        exit.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();shadowOf(Looper.getMainLooper()).idle();
    }

    @Test public void pressingHomeClosesBothClientsAndDestroysBrowserWorkerAndOwnProcess() throws Exception {
        start();
        int oldPort=port(),oldSecurePort=server().httpsPort();WebView oldWeb=web();MainActivity.HostBridge oldBridge=bridge();
        Socket first=controllerClient(oldPort,server().roomToken()),second=controllerClient(oldPort,server().roomToken());
        assertTrue(get(oldPort,"/controller.js").startsWith("HTTP/1.1 200"));
        assertTrue((activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0);
        controller.pause().stop();started=false;
        assertNull(server());assertClosed(oldPort);assertClosed(oldSecurePort);
        assertDisconnected(first);assertDisconnected(second);
        assertEquals(0,new JSONObject(oldBridge.snapshot()).getInt("connections"));
        assertEquals(0,activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        assertTrue(activity.isFinishing());assertTrue(activity.terminated);
        assertTrue(shadowOf(oldWeb).wasOnPauseCalled());
        assertTrue(shadowOf(oldWeb).wasDestroyCalled());
        assertNull(shadowOf(oldWeb).getJavascriptInterface("UsedCarHost"));
        assertNull(web());
        assertTrue(((ExecutorService)ReflectionHelpers.getField(activity,"worker")).isShutdown());
    }

    @Test public void confirmedExitDestroysBrowserServerAndOwnProcess() throws Exception {
        start();int oldPort=port(),oldSecurePort=server().httpsPort();WebView oldWeb=web();
        Socket first=controllerClient(oldPort,server().roomToken()),second=controllerClient(oldPort,server().roomToken());
        assertEquals(2,new JSONObject(server().snapshot()).getInt("connections"));
        activity.onBackPressed();
        AlertDialog dialog=ReflectionHelpers.getField(activity,"exitDialog");assertNotNull(dialog);
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertTrue(activity.isFinishing());
        assertClosed(oldPort);assertClosed(oldSecurePort);
        assertDisconnected(first);assertDisconnected(second);
        controller.pause().stop().destroy();started=false;destroyed=true;
        assertTrue(activity.terminated);
        assertTrue(shadowOf(oldWeb).wasDestroyCalled());
        assertNull(shadowOf(oldWeb).getJavascriptInterface("UsedCarHost"));
        assertNull(web());
        assertTrue(((ExecutorService)ReflectionHelpers.getField(activity,"worker")).isShutdown());
    }

    @Test public void stoppingBeforeQueuedStartupAttachesStillClosesItsPendingListener() throws Exception {
        controller.start().resume();started=true;
        ExecutorService worker=ReflectionHelpers.getField(activity,"worker");
        worker.submit(() -> {}).get(10,TimeUnit.SECONDS);
        // The worker has started a room but its main-thread attachment has not run yet.
        assertNull(server());
        LanGameServer pending=ReflectionHelpers.getField(activity,"pendingServer");assertNotNull(pending);
        int pendingPort=pending.start();
        int pendingSecurePort=pending.httpsPort();
        assertTrue(get(pendingPort,"/controller.js").startsWith("HTTP/1.1 200"));
        controller.pause().stop();started=false;
        assertClosed(pendingPort);assertClosed(pendingSecurePort);
        assertNull(ReflectionHelpers.getField(activity,"pendingServer"));
        shadowOf(Looper.getMainLooper()).idle();
        assertNull(server());assertClosed(pendingPort);
    }

    @Test public void cancelledExitRestoresInputWithoutTogglingPlayerPause() throws Exception {
        start();String token=server().roomToken();
        activity.onBackPressed();
        assertTrue((boolean)ReflectionHelpers.getField(activity,"suspended"));
        assertTrue(browser().getLastEvaluatedJavascript().contains("suspend(true)"));
        AlertDialog dialog=ReflectionHelpers.getField(activity,"exitDialog");
        String message=((android.widget.TextView)dialog.findViewById(android.R.id.message)).getText().toString();
        JSONObject info=new JSONObject(bridge().getInfo());
        assertTrue(message.contains(info.getString("certificateName")));
        assertTrue(message.contains(activity.getString(R.string.certificate_dialog_check)));
        String displayedFingerprint=message.substring(message.indexOf("SHA-256\n")+8);
        assertEquals(4,displayedFingerprint.split("\n").length);
        assertEquals(info.getString("certificateFingerprint").toUpperCase(java.util.Locale.ROOT),displayedFingerprint.replaceAll("\\s", ""));
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertFalse((boolean)ReflectionHelpers.getField(activity,"suspended"));
        assertTrue(browser().getLastEvaluatedJavascript().contains("suspend(false)"));
        assertEquals(token,server().roomToken());
        assertFalse(activity.isFinishing());
    }

    @Test public void renderProcessCrashClosesRoomAndDestroysTheFailedWebView() throws Exception {
        start();int oldPort=port(),oldSecurePort=server().httpsPort();WebView oldWeb=web();
        assertTrue(browser().getWebViewClient().onRenderProcessGone(oldWeb,null));
        assertNull(server());assertClosed(oldPort);assertClosed(oldSecurePort);
        assertTrue(shadowOf(oldWeb).wasDestroyCalled());
        assertNull(web());
    }

    @Test public void tvRemoteSendsPressAndReleaseToGameWithoutRepeatedPresses() {
        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_LEFT));
        assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"ArrowLeft\",true)"));
        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_DPAD_LEFT));
        assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"ArrowLeft\",false)"));
        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_CENTER));
        assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"Enter\",true)"));
        activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_MENU));
        assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"b\",false)"));
        for (int code : new int[] {KeyEvent.KEYCODE_BUTTON_A, KeyEvent.KEYCODE_Z}) {
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
            assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"z\",true)"));
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
            assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"z\",false)"));
        }
        for (int code : new int[] {KeyEvent.KEYCODE_BUTTON_START, KeyEvent.KEYCODE_BUTTON_SELECT}) {
            String name = code == KeyEvent.KEYCODE_BUTTON_START ? "Start" : "Select";
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
            assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"" + name + "\",true)"));
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
            assertTrue(browser().getLastEvaluatedJavascript().contains("key(\"" + name + "\",false)"));
        }
        String released = browser().getLastEvaluatedJavascript();
        activity.dispatchKeyEvent(new KeyEvent(0, 0, KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_BUTTON_START, 1));
        assertEquals("A held Start key must not send repeated presses", released, browser().getLastEvaluatedJavascript());
    }
}
