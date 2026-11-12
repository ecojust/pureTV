package com.ecojust.gamekit;

import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;
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
import java.net.ServerSocket;
import java.io.BufferedReader;
import java.io.InputStreamReader;
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
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi", shadows=WifiControllerDiscoveryTest.RecordingNsdShadow.class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class MainActivityTest {
    public static class TestActivity extends MainActivity {
        boolean terminated;
        @Override public void onCreate(Bundle state) { setTheme(R.style.PureGameTheme); super.onCreate(state); }
        @Override List<String> lanAddresses() { return Collections.singletonList("192.168.1.45"); }
        @Override void terminateProcess() { terminated = true; }
    }

    private ActivityController<TestActivity> controller;
    private TestActivity activity;
    private boolean started, destroyed;

    @Before public void create() {
        WifiControllerDiscoveryTest.RecordingNsdShadow.reset();
        WifiControllerDiscoveryTest.RecordingNsdShadow.autoRegister=true;
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
    private WifiControllerServer wifiServer() { return ReflectionHelpers.getField(activity,"wifiServer"); }
    private MainActivity.HostBridge bridge() { return (MainActivity.HostBridge) browser().getJavascriptInterface("PureGameHost"); }
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
        assertEquals("https://game-kit.invalid/tv.html", MainActivity.GAME_URL);
        assertTrue("The fixed local origin retains high scores and campaign settings across app updates",settings.getDomStorageEnabled());
        assertFalse(settings.getAllowFileAccess());
        assertFalse(settings.getAllowContentAccess());
        assertFalse(settings.getAllowFileAccessFromFileURLs());
        assertFalse(settings.getAllowUniversalAccessFromFileURLs());
        assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW,settings.getMixedContentMode());
        assertFalse(settings.supportMultipleWindows());
        assertNotNull(bridge());
        assertNull(browser().getJavascriptInterface("Android"));
        assertFalse(browser().getWebViewClient().shouldOverrideUrlLoading(web(),MainActivity.GAME_URL));
        for (String url:new String[]{"https://outside.example/","http://game-kit.invalid/tv.html","file:///sdcard/secret","content://private","https://game-kit.invalid/controller.html","https://game-kit.invalid/tv.html?external=1"})
            assertTrue(url,browser().getWebViewClient().shouldOverrideUrlLoading(web(),url));
    }

    @Test public void onlyBuildIndexedAssetsAreReadable() throws Exception {
        String[] names={"tv.html","tv.css","game.js","game-config.json","texture.png"};
        for (String name:names) {
            WebResourceResponse response=activity.localAsset(Uri.parse("https://game-kit.invalid/"+name));
            assertEquals(name,200,response.getStatusCode());
            assertEquals("nosniff",response.getResponseHeaders().get("X-Content-Type-Options"));
            try (java.io.InputStream bundled=activity.getAssets().open(name)) {
                assertArrayEquals(bundled.readAllBytes(),response.getData().readAllBytes());
            }
            if(name.endsWith(".png")) assertNull(response.getEncoding());
            response.getData().close();
        }
        for(String url:new String[]{
            "https://game-kit.invalid/controller.js","https://game-kit.invalid/assets-index.json",
            "https://game-kit.invalid/unindexed.js","https://game-kit.invalid/images/android-logo-mask.png",
            "https://game-kit.invalid/../private","https://game-kit.invalid:443/game.js",
            "https://evil.example/game.js","http://game-kit.invalid/game.js",
            "file:///android_asset/game.js","content://private/data",
            "https://game-kit.invalid/game.js?other=1","https://game-kit.invalid/game.js#fragment",
            "https://user@game-kit.invalid/game.js","https://game-kit.invalid/%67ame.js",
            "https://game-kit.invalid/audio/../game.js","https://game-kit.invalid/audio/%2e%2e/game.js"
        }) {
            WebResourceResponse response=activity.localAsset(Uri.parse(url));
            assertEquals(url,403,response.getStatusCode());assertEquals(-1,response.getData().read());response.getData().close();
        }
    }

    @Test public void indexedPngRetainsItsCompleteBytesAndDecodes() throws Exception {
        WebResourceResponse response=activity.localAsset(Uri.parse("https://game-kit.invalid/texture.png"));
        assertEquals("image/png",response.getMimeType());assertNull(response.getEncoding());
        byte[] bytes=response.getData().readAllBytes();response.getData().close();
        Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length);assertNotNull(bitmap);
        assertEquals(1,bitmap.getWidth());assertEquals(1,bitmap.getHeight());bitmap.recycle();
    }

    @Test public void everyFixtureHtmlDependencyUsesTheActualNativeBoundary() throws Exception {
        WebResourceResponse response=activity.localAsset(Uri.parse(MainActivity.GAME_URL));
        String html=new String(response.getData().readAllBytes(),StandardCharsets.UTF_8);response.getData().close();
        assertTrue(html.contains("game.js"));assertTrue(html.contains("tv.css"));
        for(String name:new String[]{"game.js","tv.css"}) {
            WebResourceResponse asset=activity.localAsset(Uri.parse("https://game-kit.invalid/"+name));
            assertEquals(200,asset.getStatusCode());assertTrue(asset.getData().readAllBytes().length>0);asset.getData().close();
        }
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

    @Test public void pressingHomeClosesControllerAndPendingClientAndDestroysBrowserWorkerAndOwnProcess() throws Exception {
        start();
        int oldPort=port();WebView oldWeb=web();MainActivity.HostBridge oldBridge=bridge();
        Socket first=controllerClient(oldPort,server().roomToken()),second=new Socket("127.0.0.1",oldPort);
        second.setSoTimeout(2000);
        assertTrue(get(oldPort,"/controller.js").startsWith("HTTP/1.1 200"));
        assertTrue((activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0);
        controller.pause().stop();started=false;
        assertNull(server());assertClosed(oldPort);
        assertDisconnected(first);assertDisconnected(second);
        assertEquals(0,new JSONObject(oldBridge.snapshot()).getInt("connections"));
        assertEquals(0,activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        assertTrue(activity.isFinishing());assertTrue(activity.terminated);
        assertTrue(shadowOf(oldWeb).wasOnPauseCalled());
        assertTrue(shadowOf(oldWeb).wasDestroyCalled());
        assertNull(shadowOf(oldWeb).getJavascriptInterface("PureGameHost"));
        assertNull(web());
        assertTrue(((ExecutorService)ReflectionHelpers.getField(activity,"worker")).isShutdown());
    }

    @Test public void confirmedExitDestroysBrowserServerAndOwnProcess() throws Exception {
        start();int oldPort=port();WebView oldWeb=web();
        Socket first=controllerClient(oldPort,server().roomToken()),second=new Socket("127.0.0.1",oldPort);
        second.setSoTimeout(2000);
        assertEquals(1,new JSONObject(server().snapshot()).getInt("connections"));
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
        assertNull(shadowOf(oldWeb).getJavascriptInterface("PureGameHost"));
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
        WifiControllerServer pendingWifi=ReflectionHelpers.getField(activity,"pendingWifiServer");assertNotNull(pendingWifi);
        int wifiPort=pendingWifi.getPort();assertTrue(wifiPort>0);
        assertTrue("Pending listeners must not be advertised before the activity accepts them",WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.isEmpty());
        int pendingPort=pending.start();
        assertTrue(get(pendingPort,"/controller.js").startsWith("HTTP/1.1 200"));
        controller.pause().stop();started=false;
        assertClosed(pendingPort);
        assertNull(ReflectionHelpers.getField(activity,"pendingServer"));
        shadowOf(Looper.getMainLooper()).idle();
        assertNull(server());assertClosed(pendingPort);assertClosed(wifiPort);
        assertNull(wifiServer());assertNull(ReflectionHelpers.getField(activity,"pendingWifiServer"));
        assertTrue(WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.isEmpty());
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

    private Socket wifiClient() throws Exception {
        Socket socket=new Socket("127.0.0.1",wifiServer().getPort());socket.setSoTimeout(2000);return socket;
    }
    private JSONObject wifiButton(Socket socket,long seq,String key,boolean pressed,String action) throws Exception {
        JSONObject message=new JSONObject().put("type","button").put("seq",seq).put("controller_id","esp32-host-fixture")
                .put("key",key).put("pressed",pressed).put("action",action).put("duration_ms",0);
        socket.getOutputStream().write((message+"\n").getBytes(StandardCharsets.UTF_8));socket.getOutputStream().flush();
        JSONObject ack=new JSONObject(new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.UTF_8)).readLine());
        assertEquals("ack",ack.getString("type"));assertEquals(seq,ack.getLong("seq"));return ack;
    }
    private void phoneInput(Socket socket,int seq,int x,boolean a) throws Exception {
        byte[] payload=new JSONObject().put("type","input").put("seq",seq).put("x",x).put("y",0).put("a",a).put("b",false).toString().getBytes(StandardCharsets.UTF_8);
        assertTrue(payload.length<126);byte[] mask={1,2,3,4};ByteArrayOutputStream frame=new ByteArrayOutputStream();
        frame.write(0x81);frame.write(0x80|payload.length);frame.write(mask);for(int i=0;i<payload.length;i++)frame.write(payload[i]^mask[i%4]);
        socket.getOutputStream().write(frame.toByteArray());socket.getOutputStream().flush();
    }
    private interface BridgeCondition { boolean satisfied() throws Exception; }
    private void awaitBridge(BridgeCondition condition) throws Exception {
        long deadline=System.nanoTime()+2_000_000_000L;
        while(!condition.satisfied()){if(System.nanoTime()>deadline)fail("Timed out waiting for native input");Thread.sleep(10);}
    }
    private JSONObject bridgePlayer() throws Exception { return new JSONObject(bridge().snapshot()).getJSONArray("players").getJSONObject(0); }

    @Test public void wifiServiceAnnouncesTheAlreadyListeningTcpPortAndVersion() throws Exception {
        final boolean[] connectedBeforeRegistration={false};
        WifiControllerDiscoveryTest.RecordingNsdShadow.onRegister=service->{
            try(Socket probe=new Socket("127.0.0.1",service.getPort())){connectedBeforeRegistration[0]=true;}
            catch(Exception failure){throw new AssertionError("NSD was published before TCP was listening",failure);}
        };
        start();assertTrue(connectedBeforeRegistration[0]);assertNotNull(wifiServer());
        WifiControllerDiscoveryTest.Registration registration=WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.get(0);
        assertEquals("_puretv._tcp",registration.service.getServiceType());assertEquals(NsdManager.PROTOCOL_DNS_SD,registration.protocol);
        assertEquals(activity.getString(R.string.app_name),registration.service.getServiceName());
        assertEquals(wifiServer().getPort(),registration.service.getPort());assertNotEquals(port(),registration.service.getPort());
        assertEquals("1",new String(registration.service.getAttributes().get("version"),StandardCharsets.UTF_8));
        JSONObject info=new JSONObject(bridge().getInfo());assertEquals("available",info.getJSONObject("wifiController").getString("state"));
        assertEquals(wifiServer().getPort(),info.getJSONObject("wifiController").getInt("port"));assertFalse(info.getString("qr").isEmpty());
    }

    @Test public void busyDefaultPortAdvertisesItsActualFallback() throws Exception {
        try(ServerSocket occupied=new ServerSocket()){
            occupied.setReuseAddress(true);occupied.bind(new InetSocketAddress("0.0.0.0",8765));
            start();assertNotEquals(8765,wifiServer().getPort());assertTrue(wifiServer().getPort()>0);
            assertEquals(wifiServer().getPort(),WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.get(0).service.getPort());
        }
    }

    @Test public void discoveryFailureLeavesGameQrAndTcpAvailable() throws Exception {
        WifiControllerDiscoveryTest.RecordingNsdShadow.registrationError=NsdManager.FAILURE_INTERNAL_ERROR;
        start();JSONObject info=new JSONObject(bridge().getInfo());assertEquals("unavailable",info.getJSONObject("wifiController").getString("state"));
        assertEquals(MainActivity.GAME_URL,browser().getLastLoadedUrl());assertFalse(info.getString("qr").isEmpty());
        assertTrue(get(port(),"/controller.js").startsWith("HTTP/1.1 200"));
        try(Socket client=wifiClient()){wifiButton(client,1,"RIGHT",true,"down");assertEquals(1,bridgePlayer().getDouble("x"),0);}
    }

    @Test public void wifiAndPhoneInputsNeverMixAndDisconnectReturnsToThePhone() throws Exception {
        start();try(Socket phone=controllerClient(port(),server().roomToken());Socket wifi=wifiClient()){
            phoneInput(phone,1,1,true);awaitBridge(()->bridgePlayer().getDouble("x")==1);
            wifiButton(wifi,1,"LEFT",true,"down");JSONObject selected=bridgePlayer();
            assertEquals("wifi",selected.getString("transport"));assertEquals(-1,selected.getDouble("x"),0);assertFalse(selected.getBoolean("a"));
            String session=selected.getString("session");assertTrue(session.startsWith("wifi-"));
            wifi.close();awaitBridge(()->!wifiServer().hasController());
            phoneInput(phone,2,1,true);awaitBridge(()->bridgePlayer().getDouble("x")==1);
            assertNotEquals(session,bridgePlayer().optString("session"));assertFalse("wifi".equals(bridgePlayer().optString("transport")));
        }
    }

    @Test public void exitDialogCancelsBothInputsAndHeldWifiActionMustBeReleased() throws Exception {
        start();try(Socket phone=controllerClient(port(),server().roomToken());Socket wifi=wifiClient()){
            phoneInput(phone,1,1,true);awaitBridge(()->bridgePlayer().getDouble("x")==1);
            wifiButton(wifi,1,"A",true,"down");assertTrue(bridgePlayer().getBoolean("a"));activity.onBackPressed();
            assertEquals(0,new JSONObject(bridge().snapshot()).getInt("connections"));
            assertFalse(new JSONObject(wifiServer().snapshot()).getJSONArray("players").getJSONObject(0).getBoolean("a"));
            assertFalse(new JSONObject(server().snapshot()).getJSONArray("players").getJSONObject(0).getBoolean("a"));
            AlertDialog dialog=ReflectionHelpers.getField(activity,"exitDialog");dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();shadowOf(Looper.getMainLooper()).idle();
            assertFalse(bridgePlayer().getBoolean("a"));wifiButton(wifi,2,"A",true,"long_press");assertFalse(bridgePlayer().getBoolean("a"));
            wifiButton(wifi,3,"A",false,"long_release");wifiButton(wifi,4,"A",true,"down");assertTrue(bridgePlayer().getBoolean("a"));
        }
    }

    @Test public void homeClosesWifiOwnersPendingSocketsAndWithdrawsItsNsdListener() throws Exception {
        start();int tcpPort=wifiServer().getPort();MainActivity.HostBridge oldBridge=bridge();
        NsdManager.RegistrationListener registration=WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.get(0).listener;
        Socket owner=wifiClient(),pending=wifiClient();pending.setSoTimeout(2000);wifiButton(owner,1,"RIGHT",true,"down");
        controller.pause().stop();started=false;assertNull(wifiServer());assertClosed(tcpPort);assertDisconnected(owner);assertDisconnected(pending);
        assertTrue(WifiControllerDiscoveryTest.RecordingNsdShadow.unregisters.contains(registration));assertEquals(0,new JSONObject(oldBridge.snapshot()).getInt("connections"));
    }

    @Test public void renderCrashWithdrawsWifiAndClosesAcceptedController() throws Exception {
        start();int tcpPort=wifiServer().getPort();Socket owner=wifiClient();wifiButton(owner,1,"LEFT",true,"down");
        NsdManager.RegistrationListener registration=WifiControllerDiscoveryTest.RecordingNsdShadow.registrations.get(0).listener;
        assertTrue(browser().getWebViewClient().onRenderProcessGone(web(),null));assertClosed(tcpPort);assertDisconnected(owner);assertNull(wifiServer());
        assertTrue(WifiControllerDiscoveryTest.RecordingNsdShadow.unregisters.contains(registration));
    }


    @Test public void freshWifiButtonsPressedBehindExitDialogCannotQueueActionsOnResume() throws Exception {
        start();try(Socket wifi=wifiClient()){
            wifiButton(wifi,1,"RIGHT",true,"down");activity.onBackPressed();
            wifiButton(wifi,2,"A",true,"down");wifiButton(wifi,3,"B",true,"down");wifiButton(wifi,4,"START",true,"down");
            assertEquals(0,new JSONObject(bridge().snapshot()).getInt("connections"));
            AlertDialog dialog=ReflectionHelpers.getField(activity,"exitDialog");dialog.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();shadowOf(Looper.getMainLooper()).idle();
            JSONObject resumed=bridgePlayer();assertFalse(resumed.getBoolean("a"));assertFalse(resumed.getBoolean("b"));assertFalse(resumed.getBoolean("start"));
            assertEquals(0,resumed.getDouble("x"),0);
            wifiButton(wifi,5,"A",false,"tap");wifiButton(wifi,6,"A",true,"down");assertTrue(bridgePlayer().getBoolean("a"));
            wifiButton(wifi,7,"B",false,"tap");wifiButton(wifi,8,"START",false,"tap");
            wifiButton(wifi,9,"B",true,"down");wifiButton(wifi,10,"START",true,"down");
            JSONObject fresh=bridgePlayer();assertTrue(fresh.getBoolean("b"));assertTrue(fresh.getBoolean("start"));
        }
    }

}
