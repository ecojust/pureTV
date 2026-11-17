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
    private boolean occupyDefaultPort;
    private ServerSocket occupiedDefaultPort;
    private static final String CLIENT_STATUS_SCRIPT = "(function controllerClientDom() {\n  function rect(node) {\n    var r = node.getBoundingClientRect();\n    return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};\n  }\n  function visible(node) {\n    if (!node || !node.isConnected) return false;\n    var bounds = rect(node);\n    if (bounds.width <= 0 || bounds.height <= 0) return false;\n    for (var parent = node; parent; parent = parent.parentElement) {\n      var style = getComputedStyle(parent);\n      if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse' || Number(style.opacity) === 0) return false;\n    }\n    return true;\n  }\n  function clip(node) {\n    var box = {left:0,top:0,right:innerWidth,bottom:innerHeight};\n    for (var parent = node.parentElement; parent; parent = parent.parentElement) {\n      var style = getComputedStyle(parent), bounds = rect(parent);\n      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowX)) {\n        box.left = Math.max(box.left,bounds.left + parent.clientLeft);\n        box.right = Math.min(box.right,bounds.left + parent.clientLeft + parent.clientWidth);\n      }\n      if (/^(hidden|clip|auto|scroll)$/.test(style.overflowY)) {\n        box.top = Math.max(box.top,bounds.top + parent.clientTop);\n        box.bottom = Math.min(box.bottom,bounds.top + parent.clientTop + parent.clientHeight);\n      }\n    }\n    return box;\n  }\n  return {containers:Array.prototype.map.call(document.querySelectorAll('[data-puretv-clients]'),function(container) {\n    return {visible:visible(container),hiddenAttribute:container.hidden,rect:rect(container),clip:clip(container),rows:Array.prototype.map.call(container.querySelectorAll('[data-puretv-controller-id]'),function(row) {\n      var id = row.querySelector('[data-puretv-controller-id-text]') || row.querySelector('.ptv-client-id'),icon = row.querySelector('svg');\n      var ranges = [];\n      if (id) {\n        var range = document.createRange();range.selectNodeContents(id);\n        ranges = Array.prototype.map.call(range.getClientRects(),function(r) { return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; });\n      }\n      return {controllerId:row.getAttribute('data-puretv-controller-id'),playerId:Number(row.getAttribute('data-player-id')),text:row.textContent,idText:id ? id.textContent : null,visible:visible(row),rect:rect(row),clip:clip(row),idRect:id ? rect(id) : null,idClip:id ? clip(id) : null,idTextRects:ranges,idClientWidth:id ? id.clientWidth : 0,idScrollWidth:id ? id.scrollWidth : 0,idClientHeight:id ? id.clientHeight : 0,idScrollHeight:id ? id.scrollHeight : 0,iconVisible:visible(icon),iconRect:icon ? rect(icon) : null};\n    })};\n  })};\n})()";
    private static final String SCRIPT = "JSON.stringify((function(){var names=['PureGameHost','MarioHost','BombJackHost','AdventureHost','TetrisHost','JewelHost','JackalHost','TankHost','CozyIslandHost','CoastKartHost','AlienShooterHost','UsedCarHost'],info=null;for(var i=0;i<names.length;i++){var b=window[names[i]];if(b&&b.getInfo){try{info=JSON.parse(b.getInfo());}catch(e){}break;}}return {game:window.JoystickGameQA&&window.JoystickGameQA.snapshot?window.JoystickGameQA.snapshot():null,info:info,page:{url:location.href,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,hidden:document.hidden,focused:document.hasFocus(),canvases:Array.prototype.map.call(document.querySelectorAll('canvas'),function(c){var r=c.getBoundingClientRect();var s=getComputedStyle(c);return {width:c.width,height:c.height,clientWidth:r.width,clientHeight:r.height,visible:r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};}),controllerClients:" + CLIENT_STATUS_SCRIPT + "}};})())";

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        if (args != null && args.containsKey("diagnosticPort")) port = Integer.parseInt(args.getString("diagnosticPort"));
        occupyDefaultPort = args != null && "true".equals(args.getString("occupyDefaultPort"));
        if (port < 1024 || port > 65535) throw new IllegalArgumentException("Invalid diagnostic port");
        start();
    }

    @Override public void onStart() {
        super.onStart();
        try {
            // Optional launch fixture: occupy the preferred endpoint before the
            // unchanged target starts. No game input or model state is written.
            if (occupyDefaultPort) occupiedDefaultPort = new ServerSocket(63485, 1, InetAddress.getByName("0.0.0.0"));
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
                    value.put("windowFocused", activity != null && activity.hasWindowFocus());
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
