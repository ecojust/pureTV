package com.ecojust.jackaltv;

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
import org.robolectric.annotation.GraphicsMode;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowWebView;
import org.robolectric.util.ReflectionHelpers;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Verifies the actual Android host boundary and room lifetime, not a simulated browser bridge. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class MainActivityTest {
    public static class TestActivity extends MainActivity {
        boolean terminated;
        @Override public void onCreate(Bundle state) { setTheme(R.style.JackalTheme); super.onCreate(state); }
        @Override List<String> lanAddresses() { return Collections.singletonList("192.168.1.45"); }
        @Override void terminateProcess() { terminated = true; }
    }

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
    private MainActivity.HostBridge bridge() { return (MainActivity.HostBridge) browser().getJavascriptInterface("JackalHost"); }
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

    @Test public void gameBridgeIsIsolatedFromExternalPagesAndDeviceFiles() {
        WebSettings settings=web().getSettings();
        assertTrue(settings.getJavaScriptEnabled());
        assertFalse(settings.getDomStorageEnabled());
        assertFalse(settings.getAllowFileAccess());
        assertFalse(settings.getAllowContentAccess());
        assertFalse(settings.getAllowFileAccessFromFileURLs());
        assertFalse(settings.getAllowUniversalAccessFromFileURLs());
        assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW,settings.getMixedContentMode());
        assertFalse(settings.supportMultipleWindows());
        assertNotNull(bridge());
        assertNull(browser().getJavascriptInterface("Android"));
        assertFalse(browser().getWebViewClient().shouldOverrideUrlLoading(web(),MainActivity.GAME_URL));
        for (String url:new String[]{"https://outside.example/","http://jackal.invalid/tv.html","file:///sdcard/secret","content://private","https://jackal.invalid/controller.html","https://jackal.invalid/tv.html?external=1"})
            assertTrue(url,browser().getWebViewClient().shouldOverrideUrlLoading(web(),url));
    }

    @Test public void onlyBundledGameAssetsAreReadable() throws Exception {
        String[] names={"tv.html","tv.css","game.js","game-model.js","levels.js","runtime.js","nes-renderer.js","enemies.js","nes-audio.js","data/entities.json","data/destruction.json","data/stage-1.json","data/stage-2.json","data/stage-3.json","data/stage-4.json","data/stage-5.json","data/stage-6.json"};
        String[] mimes={"text/html","text/css","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/javascript","application/json","application/json","application/json","application/json","application/json","application/json","application/json","application/json"};
        for (int i=0;i<names.length;i++) {
            WebResourceResponse response=activity.localAsset(Uri.parse("https://jackal.invalid/"+names[i]));
            assertEquals(names[i],200,response.getStatusCode());
            assertEquals(mimes[i],response.getMimeType());
            assertEquals("nosniff",response.getResponseHeaders().get("X-Content-Type-Options"));
            byte[] bytes=response.getData().readAllBytes();
            assertTrue(names[i],bytes.length>100);
            if (mimes[i].equals("audio/ogg")) {
                assertNull(response.getEncoding());
                assertEquals("OggS",new String(bytes,0,4,StandardCharsets.US_ASCII));
            } else assertEquals("UTF-8",response.getEncoding());
            response.getData().close();
        }
        for (String url:new String[]{
            "https://jackal.invalid/controller.js","https://jackal.invalid/../private",
            "https://jackal.invalid/secret","https://jackal.invalid:443/game.js",
            "https://evil.example/game.js","http://jackal.invalid/game.js",
            "file:///android_asset/game.js","content://private/data",
            "https://jackal.invalid/game.js?other=1","https://jackal.invalid/game.js#fragment",
            "https://user@jackal.invalid/game.js","https://jackal.invalid/%67ame.js",
            "https://jackal.invalid/audio/../game.js","https://jackal.invalid/data/../../game.js",
            "https://jackal.invalid/audio/%2e%2e/game.js","https://jackal.invalid/audio/not-bundled.ogg",
            "https://jackal.invalid/data/stage-7.json","https://jackal.invalid/art/unknown.png"
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
        java.util.regex.Matcher dependencies=java.util.regex.Pattern.compile("(?:src|href)=\"([^\"]+)\"").matcher(html);
        int count=0;
        while (dependencies.find()) {
            String dependency=dependencies.group(1);
            if (dependency.startsWith("data:") || dependency.startsWith("#")) continue;
            WebResourceResponse response=activity.localAsset(Uri.parse("https://jackal.invalid/"+dependency));
            assertEquals("HTML dependency: "+dependency,200,response.getStatusCode());
            assertTrue(response.getData().readAllBytes().length>0);
            response.getData().close();count++;
        }
        assertTrue("The test must inspect the real script and stylesheet dependencies",count>=7);
    }

    @Test public void futureArtworkRoutesAreRestrictedToTheRendererManifest() {
        assertEquals("application/javascript",MainActivity.bundledAssetMime("/nes-audio.js"));
        assertEquals("application/json",MainActivity.bundledAssetMime("/art/levels/sprites.json"));
        assertEquals("application/json",MainActivity.bundledAssetMime("/art/boss_patches.json"));
        assertEquals("application/json",MainActivity.bundledAssetMime("/art/data/audio-score.json"));
        assertEquals("image/png",MainActivity.bundledAssetMime("/art/fonts/hud.png"));
        for (int stage=1;stage<=6;stage++) {
            assertEquals("image/png",MainActivity.bundledAssetMime("/art/textures/stage_0"+stage+"_tiles.png"));
            assertEquals("image/png",MainActivity.bundledAssetMime("/art/textures/stage_0"+stage+"_sprites.png"));
            assertEquals("application/json",MainActivity.bundledAssetMime("/art/cinematics/stage_load_0"+stage+"/timeline.json"));
        }
        assertEquals("image/png",MainActivity.bundledAssetMime("/art/cinematics/title_1p/tiles.png"));
        for (String path:new String[]{"/art/textures/stage_00_tiles.png","/art/textures/stage_07_tiles.png",
            "/art/cinematics/stage_clear_06/timeline.json","/art/cinematics/private/tiles.png",
            "/art/cinematics/title_1p/other.json","/art/levels/../secret.json","/data/other.json",
            "/data/audio-score.json","/art/data/other.json"})
            assertNull(path,MainActivity.bundledAssetMime(path));
    }

    @Test public void generatedPngQrDecodesToExactJoinUrl() throws Exception {
        String url="http://192.168.1.45:49152/?room=0123456789abcdef0123456789abcdef";
        String data=MainActivity.qrData(url);
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

    @Test public void leavingGameClosesRoomAndReturningCreatesNewRoom() throws Exception {
        start();
        int oldPort=port();
        String oldToken=server().roomToken();
        assertTrue(get(oldPort,"/controller.js").startsWith("HTTP/1.1 200"));
        assertTrue((activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0);
        controller.pause().stop(); started=false;
        assertNull(server());assertClosed(oldPort);
        assertTrue(browser().wasOnPauseCalled());
        assertEquals(0,new JSONObject(bridge().snapshot()).getInt("connections"));
        assertEquals(0,activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        start();
        assertNotEquals(oldToken,server().roomToken());
        assertTrue(get(port(),"/controller.js").startsWith("HTTP/1.1 200"));
    }

    @Test public void confirmedExitDestroysBrowserServerAndOwnProcess() throws Exception {
        start();int oldPort=port();WebView oldWeb=web();
        Socket first=controllerClient(oldPort,server().roomToken()),second=controllerClient(oldPort,server().roomToken());
        assertEquals(2,new JSONObject(server().snapshot()).getInt("connections"));
        activity.onBackPressed();
        AlertDialog dialog=ReflectionHelpers.getField(activity,"exitDialog");assertNotNull(dialog);
        dialog.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertTrue(activity.isFinishing());
        assertClosed(oldPort);
        assertDisconnected(first);assertDisconnected(second);
        controller.pause().stop().destroy();started=false;destroyed=true;
        assertTrue(activity.terminated);
        assertTrue(shadowOf(oldWeb).wasDestroyCalled());
        assertNull(shadowOf(oldWeb).getJavascriptInterface("JackalHost"));
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
        assertTrue(get(pendingPort,"/controller.js").startsWith("HTTP/1.1 200"));
        controller.pause().stop();started=false;
        assertClosed(pendingPort);
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
        dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();
        shadowOf(Looper.getMainLooper()).idle();
        assertFalse((boolean)ReflectionHelpers.getField(activity,"suspended"));
        assertTrue(browser().getLastEvaluatedJavascript().contains("suspend(false)"));
        assertEquals(token,server().roomToken());
        assertFalse(activity.isFinishing());
    }

    @Test public void renderProcessCrashClosesRoomAndDestroysTheFailedWebView() throws Exception {
        start();int oldPort=port();WebView oldWeb=web();
        assertTrue(browser().getWebViewClient().onRenderProcessGone(oldWeb,null));
        assertNull(server());assertClosed(oldPort);
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
