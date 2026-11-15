package com.ecojust.controllerqa;

import android.app.Activity;
import android.app.Application;
import android.app.Instrumentation;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

/** Test APK only. Reads actual target WebView state; exposes no input or model mutation route. */
public final class Observer extends Instrumentation {
    private volatile Activity activity;
    private volatile String activityState = "not-started";
    private int port = 63486;
    private static final String SCRIPT = "JSON.stringify((function(){var names=['PureGameHost','MarioHost','BombJackHost','AdventureHost','TetrisHost','JewelHost','JackalHost','TankHost','CozyIslandHost','CoastKartHost','AlienShooterHost','UsedCarHost'],info=null;for(var i=0;i<names.length;i++){var b=window[names[i]];if(b&&b.getInfo){try{info=JSON.parse(b.getInfo());}catch(e){}break;}}return {game:window.PureTVQA&&window.PureTVQA.snapshot?window.PureTVQA.snapshot():null,info:info,page:{url:location.href,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,hidden:document.hidden,focused:document.hasFocus()}};})())";

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        if (args != null && args.containsKey("diagnosticPort")) port = Integer.parseInt(args.getString("diagnosticPort"));
        if (port < 1024 || port > 65535) throw new IllegalArgumentException("Invalid diagnostic port");
        start();
    }

    @Override public void onStart() {
        super.onStart();
        try {
            Application app = (Application) getTargetContext().getApplicationContext();
            app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks() {
                public void onActivityCreated(Activity a, Bundle b) { activity = a; activityState = "created"; }
                public void onActivityStarted(Activity a) { activity = a; activityState = "started"; }
                public void onActivityResumed(Activity a) { activity = a; activityState = "resumed"; }
                public void onActivityPaused(Activity a) { if (activity == a) activityState = "paused"; }
                public void onActivityStopped(Activity a) { if (activity == a) activityState = "stopped"; }
                public void onActivitySaveInstanceState(Activity a, Bundle b) { }
                public void onActivityDestroyed(Activity a) { if (activity == a) { activityState = "destroyed"; activity = null; } }
            });
            android.content.Intent launch = getTargetContext().getPackageManager().getLaunchIntentForPackage(getTargetContext().getPackageName());
            if (launch == null) throw new IllegalStateException("No launch activity");
            activity = startActivitySync(launch.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
            ServerSocket server = new ServerSocket(port, 4, InetAddress.getByName("127.0.0.1"));
            Bundle ready = new Bundle(); ready.putString("observer", "ready"); ready.putInt("diagnosticPort", server.getLocalPort()); sendStatus(0, ready);
            while (!Thread.currentThread().isInterrupted()) {
                try (Socket socket = server.accept()) {
                    try { handle(socket); }
                    catch (Exception requestError) {
                        // A host poll may close while WebView is rendering its first frame.
                        // Keep the already launched game and observer alive for the next poll.
                        android.util.Log.w("PureTVQA", "Readonly diagnostic request ended", requestError);
                    }
                }
            }
            server.close();
        } catch (Throwable error) {
            Bundle failed = new Bundle(); failed.putString("observerError", error.toString()); finish(Activity.RESULT_CANCELED, failed);
        }
    }

    private WebView findWebView(View view) {
        if (view instanceof WebView) return (WebView) view;
        if (view instanceof ViewGroup) { ViewGroup group = (ViewGroup) view; for (int i=0;i<group.getChildCount();i++) { WebView found = findWebView(group.getChildAt(i)); if (found != null) return found; } }
        return null;
    }

    private String snapshot() throws Exception {
        CountDownLatch completed = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>();
        runOnMainSync(new Runnable() { public void run() {
            Activity current = activity;
            WebView web = current == null ? null : findWebView(current.getWindow().getDecorView());
            if (web == null) { result.set("{\"game\":null,\"error\":\"No target WebView\"}"); completed.countDown(); return; }
            web.evaluateJavascript(SCRIPT, new android.webkit.ValueCallback<String>() { public void onReceiveValue(String encoded) {
                try {
                    Object decoded = new JSONTokener(encoded).nextValue();
                    JSONObject value = new JSONObject(decoded instanceof String ? (String) decoded : "{}");
                    value.put("activityState", activityState); value.put("targetPackage", getTargetContext().getPackageName());
                    result.set(value.toString());
                } catch (Exception error) { result.set("{\"game\":null,\"error\":\"Invalid readonly snapshot\"}"); }
                completed.countDown();
            }});
        }});
        if (!completed.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("WebView snapshot timed out");
        return result.get();
    }

    private void handle(Socket socket) throws Exception {
        socket.setSoTimeout(12000);
        BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.US_ASCII));
        String request = in.readLine(); int bytes = request == null ? 0 : request.length();
        String header; while ((header = in.readLine()) != null && !header.isEmpty()) { bytes += header.length(); if (bytes > 8192) throw new IllegalArgumentException("Request too large"); }
        String body; String status;
        if ("GET /snapshot HTTP/1.1".equals(request) || "GET /snapshot HTTP/1.0".equals(request)) { body = snapshot(); status = "200 OK"; }
        else if ("GET /status HTTP/1.1".equals(request) || "GET /status HTTP/1.0".equals(request)) { body = new JSONObject().put("readonly",true).put("targetPackage",getTargetContext().getPackageName()).put("activityState",activityState).put("port",port).toString(); status = "200 OK"; }
        else { body = "{\"error\":\"Read-only route not found\"}"; status = "404 Not Found"; }
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        OutputStream out = socket.getOutputStream();
        out.write(("HTTP/1.1 " + status + "\r\nContent-Type: application/json; charset=utf-8\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: " + payload.length + "\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
        out.write(payload); out.flush();
    }
}
