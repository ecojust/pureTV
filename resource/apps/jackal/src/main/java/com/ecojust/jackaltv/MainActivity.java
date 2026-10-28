package com.ecojust.jackaltv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.TextView;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.common.BitMatrix;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Enumeration;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Hosts an offline game screen and a short-lived LAN controller room. */
public class MainActivity extends Activity {
    static final String GAME_URL = "https://jackal.invalid/tv.html";
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Object roomLock = new Object();
    private volatile LanGameServer server;
    private LanGameServer pendingServer;
    private volatile String info = "{}";
    private volatile boolean suspended = true;
    private WebView web;
    private FrameLayout root;
    private TextView status;
    private boolean active, destroyed;
    private int generation;
    private AlertDialog exitDialog;
    private ConnectivityManager connectivity;
    private ConnectivityManager.NetworkCallback networkCallback;
    private List<String> lastAddresses = Collections.emptyList();
    private volatile java.util.Set<String> sceneAssetPaths;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(11,17,22));
        status = new TextView(this);
        status.setText(R.string.starting);
        status.setTextColor(Color.rgb(245,190,91));
        status.setTextSize(22);
        status.setGravity(android.view.Gravity.CENTER);
        try {
            web = createWebView();
            root.addView(web, new FrameLayout.LayoutParams(-1,-1));
        } catch (RuntimeException missingWebView) {
            status.setText(R.string.web_error);
        }
        root.addView(status, new FrameLayout.LayoutParams(-1,-1));
        setContentView(root);
        connectivity = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private WebView createWebView() {
        WebView value = new WebView(this);
        value.setBackgroundColor(Color.rgb(11,17,22));
        value.setOverScrollMode(View.OVER_SCROLL_NEVER);
        value.setHorizontalScrollBarEnabled(false);
        value.setVerticalScrollBarEnabled(false);
        value.setFocusable(true);
        value.setFocusableInTouchMode(true);
        WebSettings settings = value.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        value.addJavascriptInterface(new HostBridge(), "JackalHost");
        value.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !GAME_URL.equals(request.getUrl().toString());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return !GAME_URL.equals(url);
            }
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return localAsset(request.getUrl());
            }
            @Override public void onPageFinished(WebView view, String url) {
                if (GAME_URL.equals(url) && active) {
                    status.setVisibility(View.GONE);
                    view.requestFocus();
                }
            }
            @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
                closeRoom();
                root.removeView(view);
                view.destroy();
                web = null;
                status.setText(R.string.web_error);
                status.setVisibility(View.VISIBLE);
                return true;
            }
        });
        return value;
    }

    /** Only named, bundled game resources may share the native bridge origin. */
    static String bundledAssetMime(String path) {
        if (path == null) return null;
        switch (path) {
            case "/tv.html": return "text/html";
            case "/tv.css": return "text/css";
            case "/bootstrap.js":
            case "/game.js":
            case "/game-model.js":
            case "/levels.js":
            case "/runtime.js":
            case "/nes-renderer.js":
            case "/nes-audio.js":
            case "/enemies.js":
            case "/scene-updates.js":
                return "application/javascript";
            case "/data/entities.json":
            case "/data/destruction.json":
            case "/data/stage-1.json":
            case "/data/stage-2.json":
            case "/data/stage-3.json":
            case "/data/stage-4.json":
            case "/data/stage-5.json":
            case "/data/stage-6.json":
                return "application/json";
            case "/art/levels/sprites.json": return "application/json";
            case "/art/boss_patches.json": return "application/json";
            case "/art/data/audio-score.json": return "application/json";
            case "/art/fonts/hud.png": return "image/png";
            default: break;
        }
        // Reserved for the reviewed renderer manifest. Missing artwork stays unavailable;
        // no directory wildcard, external download, or arbitrary asset-file access is allowed.
        if (path.matches("/art/textures/stage_0[1-6]_(tiles|sprites)\\.png")) return "image/png";
        String scene = "/art/cinematics/(title_[12]p|intro_[12]p|attract|continue_(yes|no)|game_over|ending(_restart)?|stage_clear_0[1-5]|(stage|continue)_load_0[1-6])/";
        if (path.matches(scene + "timeline\\.json")) return "application/json";
        if (path.matches(scene + "tiles\\.png")) return "image/png";
        return null;
    }

    /** The bundled manifest lists exact optional preview images; it cannot open arbitrary files. */
    private java.util.Set<String> sceneAssetPaths() {
        if (sceneAssetPaths != null) return sceneAssetPaths;
        synchronized (this) {
            if (sceneAssetPaths != null) return sceneAssetPaths;
            java.util.Set<String> paths = new java.util.HashSet<>();
            try (java.io.InputStream stream = getAssets().open("scene-update-paths.json")) {
                ByteArrayOutputStream output = new ByteArrayOutputStream();
                byte[] buffer = new byte[4096];
                int count;
                while ((count = stream.read(buffer)) != -1) {
                    output.write(buffer,0,count);
                    if (output.size() > 65536) throw new IOException("Scene asset manifest is too large");
                }
                JSONArray manifest = new JSONArray(new String(output.toByteArray(),java.nio.charset.StandardCharsets.UTF_8));
                for (int i=0;i<manifest.length();i++) {
                    String path = manifest.getString(i);
                    if (!path.matches("textures/[a-z0-9_/]+\\.png") || path.contains("//"))
                        throw new IOException("Invalid scene asset path");
                    paths.add("/art/" + path);
                }
            } catch (IOException | org.json.JSONException invalid) { paths.clear(); }
            sceneAssetPaths = Collections.unmodifiableSet(paths);
            return sceneAssetPaths;
        }
    }

    WebResourceResponse localAsset(Uri uri) {
        String name = uri.getPath();
        String mime = bundledAssetMime(name);
        if (mime == null && sceneAssetPaths().contains(name)) mime = "image/png";
        if ("https".equals(uri.getScheme()) && "jackal.invalid".equals(uri.getEncodedAuthority())
            && uri.getQuery() == null && uri.getFragment() == null && name != null
            && name.equals(uri.getEncodedPath()) && mime != null) {
            String encoding = mime.startsWith("audio/") || mime.startsWith("image/") ? null : "UTF-8";
            Map<String,String> headers = new java.util.HashMap<>();
            headers.put("Cache-Control","no-store");
            headers.put("X-Content-Type-Options","nosniff");
            try { return new WebResourceResponse(mime,encoding,200,"OK",headers,getAssets().open(name.substring(1))); }
            catch (IOException ignored) { }
        }
        return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));
    }

    @Override protected void onStart() {
        super.onStart();
        active = true;
        suspended = false;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (web != null) {
            web.onResume();
            web.resumeTimers();
            startRoom();
        }
        if (connectivity != null) {
            networkCallback = new ConnectivityManager.NetworkCallback() {
                @Override public void onLinkPropertiesChanged(Network network, LinkProperties properties) { scheduleNetworkCheck(); }
                @Override public void onLost(Network network) { scheduleNetworkCheck(); }
            };
            try { connectivity.registerDefaultNetworkCallback(networkCallback); }
            catch (RuntimeException ignored) { networkCallback = null; }
        }
    }

    private void scheduleNetworkCheck() {
        main.post(() -> {
            if (!active || destroyed) return;
            main.removeCallbacks(checkNetwork);
            main.postDelayed(checkNetwork, 800);
        });
    }
    private final Runnable checkNetwork = () -> {
        if (active && web != null && !lastAddresses.equals(lanAddresses())) startRoom();
    };

    private void startRoom() {
        closeRoom();
        if (!active || destroyed || web == null) return;
        final int expected = generation;
        lastAddresses = lanAddresses();
        final List<String> addresses = new ArrayList<>(lastAddresses);
        status.setText(R.string.starting);
        status.setVisibility(View.VISIBLE);
        worker.execute(() -> {
            LanGameServer created = new LanGameServer(name -> getAssets().open(name));
            String payload;
            try {
                int port;
                synchronized (roomLock) {
                    if (generation != expected || !active || destroyed) return;
                    pendingServer = created;
                    port = created.start();
                }
                String url = addresses.isEmpty() ? "" : "http://" + addresses.get(0) + ":" + port + "/?room=" + created.roomToken();
                payload = roomInfo(url, addresses, addresses.isEmpty() ? getString(R.string.no_network) : "");
            } catch (Exception failure) {
                created.stop();
                payload = roomInfo("", addresses, getString(R.string.server_error));
            }
            final String ready = payload;
            main.post(() -> {
                if (!active || destroyed || generation != expected || web == null) { created.stop(); return; }
                synchronized (roomLock) { server = created; pendingServer = null; }
                info = ready;
                suspended = false;
                web.loadUrl(GAME_URL);
            });
        });
    }

    private String roomInfo(String url, List<String> addresses, String error) {
        try {
            return new JSONObject().put("url",url).put("qr",url.isEmpty() ? "" : qrData(url))
                .put("addresses",new JSONArray(addresses)).put("error",error)
                .put("language",getResources().getConfiguration().getLocales().get(0).getLanguage().equals("zh") ? "zh" : "en").toString();
        } catch (Exception failedQr) {
            // A readable URL still allows joining if a QR encoder ever fails.
            try { return new JSONObject().put("url",url).put("qr","").put("addresses",new JSONArray(addresses)).put("error",error).put("language","en").toString(); }
            catch (Exception impossible) { return "{}"; }
        }
    }

    static String qrData(String url) throws Exception {
        BitMatrix bits = new MultiFormatWriter().encode(url, BarcodeFormat.QR_CODE, 320, 320,
            Collections.singletonMap(EncodeHintType.MARGIN, 3));
        int[] pixels = new int[320 * 320];
        for (int y=0;y<320;y++) for (int x=0;x<320;x++) pixels[y*320+x] = bits.get(x,y) ? Color.BLACK : Color.WHITE;
        Bitmap bitmap = Bitmap.createBitmap(pixels,320,320,Bitmap.Config.ARGB_8888);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG,100,output);
        bitmap.recycle();
        return "data:image/png;base64," + Base64.encodeToString(output.toByteArray(),Base64.NO_WRAP);
    }

    List<String> lanAddresses() {
        LinkedHashSet<String> result = new LinkedHashSet<>();
        if (connectivity != null) try {
            LinkProperties properties = connectivity.getLinkProperties(connectivity.getActiveNetwork());
            if (properties != null) for (LinkAddress address : properties.getLinkAddresses()) addLanAddress(result,address.getAddress());
        } catch (RuntimeException ignored) { }
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            if (interfaces != null) while (interfaces.hasMoreElements()) {
                NetworkInterface nic = interfaces.nextElement();
                if (!nic.isUp() || nic.isLoopback() || nic.isVirtual() || nic.getName().startsWith("tun")) continue;
                for (InetAddress address : Collections.list(nic.getInetAddresses())) addLanAddress(result,address);
            }
        } catch (Exception ignored) { }
        return new ArrayList<>(result);
    }
    private static void addLanAddress(LinkedHashSet<String> target, InetAddress address) {
        if (address instanceof Inet4Address && address.isSiteLocalAddress() && !address.isLoopbackAddress()) target.add(address.getHostAddress());
    }

    final class HostBridge {
        @JavascriptInterface public String getInfo() { return info; }
        @JavascriptInterface public String snapshot() {
            LanGameServer current = server;
            return current == null || suspended ? "{\"players\":[],\"connections\":0}" : current.snapshot();
        }
        @JavascriptInterface public void publish(String state) {
            LanGameServer current = server;
            if (current != null && !suspended && state != null && state.length() <= 4096) current.publish(state);
        }
        @JavascriptInterface public void exit() { main.post(MainActivity.this::onBackPressed); }
    }

    private void closeRoom() {
        synchronized (roomLock) {
            generation++;
            suspended = true;
            LanGameServer old = server;
            server = null;
            if (old != null) old.stop();
            if (pendingServer != null) { pendingServer.stop(); pendingServer = null; }
        }
    }

    @Override protected void onStop() {
        active = false;
        closeRoom();
        main.removeCallbacksAndMessages(null);
        if (networkCallback != null && connectivity != null) {
            try { connectivity.unregisterNetworkCallback(networkCallback); } catch (RuntimeException ignored) { }
            networkCallback = null;
        }
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (web != null) { web.onPause(); web.pauseTimers(); }
        if (exitDialog != null) { exitDialog.dismiss(); exitDialog = null; }
        super.onStop();
    }

    @Override protected void onDestroy() {
        boolean terminate = isFinishing() && !isChangingConfigurations();
        destroyed = true;
        closeRoom();
        main.removeCallbacksAndMessages(null);
        worker.shutdownNow();
        if (web != null) {
            web.removeJavascriptInterface("JackalHost");
            web.stopLoading();
            root.removeView(web);
            web.destroy();
            web = null;
        }
        super.onDestroy();
        if (terminate) terminateProcess();
    }
    void terminateProcess() { android.os.Process.killProcess(android.os.Process.myPid()); }

    @Override public void onBackPressed() {
        if (exitDialog != null || destroyed) return;
        suspended = true;
        if (server != null) server.releaseInputs();
        if (web != null) web.evaluateJavascript("window.JackalTV && window.JackalTV.suspend && window.JackalTV.suspend(true)",null);
        exitDialog = new AlertDialog.Builder(this).setTitle(R.string.exit_title).setMessage(R.string.exit_message)
            .setPositiveButton(R.string.exit,(dialog,which) -> { closeRoom(); finishAndRemoveTask(); })
            .setNegativeButton(R.string.cancel,(dialog,which) -> { })
            .create();
        exitDialog.setOnDismissListener(dialog -> {
            exitDialog = null;
            if (active && !isFinishing()) {
                suspended = false;
                if (web != null) web.evaluateJavascript("window.JackalTV && window.JackalTV.suspend && window.JackalTV.suspend(false)",null);
            }
        });
        exitDialog.show();
    }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        if (exitDialog != null || web == null) return super.dispatchKeyEvent(event);
        String key;
        switch (event.getKeyCode()) {
            case KeyEvent.KEYCODE_DPAD_UP: key="ArrowUp"; break;
            case KeyEvent.KEYCODE_DPAD_DOWN: key="ArrowDown"; break;
            case KeyEvent.KEYCODE_DPAD_LEFT: key="ArrowLeft"; break;
            case KeyEvent.KEYCODE_DPAD_RIGHT: key="ArrowRight"; break;
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_SPACE:
            case KeyEvent.KEYCODE_BUTTON_A: key="Enter"; break;
            case KeyEvent.KEYCODE_MENU:
            case KeyEvent.KEYCODE_B:
            case KeyEvent.KEYCODE_BUTTON_B: key="b"; break;
            case KeyEvent.KEYCODE_BUTTON_START: key="Start"; break;
            case KeyEvent.KEYCODE_BUTTON_SELECT: key="Select"; break;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_P: key="p"; break;
            default: return super.dispatchKeyEvent(event);
        }
        if (event.getRepeatCount() == 0) web.evaluateJavascript("window.JackalTV && window.JackalTV.key && window.JackalTV.key("+JSONObject.quote(key)+","+(event.getAction()==KeyEvent.ACTION_DOWN)+")",null);
        return true;
    }
}
