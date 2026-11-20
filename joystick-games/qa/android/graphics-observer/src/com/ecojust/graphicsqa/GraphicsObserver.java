package com.ecojust.graphicsqa;

import android.app.Activity;
import android.app.Application;
import android.app.Instrumentation;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.InputDevice;
import android.view.KeyCharacterMap;
import android.view.KeyEvent;
import android.os.SystemClock;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;

/** Separate test APK. Reads the unchanged target. A fixed, stage-only comparison can deliver two upstream P key presses. */
public final class GraphicsObserver extends Instrumentation {
    public static final String TARGET="com.ecojust.joystick.backroadrally";
    private volatile Activity activity;
    private volatile String activityState="not-started";
    private volatile boolean consoleAttached;
    private int port=63487;
    private String graphicsScript;
    private final BoundedEvents events=new BoundedEvents();

    @Override public void onCreate(Bundle args){
        super.onCreate(args);
        if(args!=null&&args.containsKey("diagnosticPort"))port=Integer.parseInt(args.getString("diagnosticPort"));
        if(port<1024||port>65535)throw new IllegalArgumentException("Invalid diagnostic port");
        start();
    }
    private WebView find(View view){
        if(view instanceof WebView)return (WebView)view;
        if(view instanceof ViewGroup){ViewGroup g=(ViewGroup)view;for(int i=0;i<g.getChildCount();i++){WebView w=find(g.getChildAt(i));if(w!=null)return w;}}
        return null;
    }
    private void created(Activity a){
        if(!TARGET.equals(a.getPackageName()))return;
        activity=a;activityState="created";consoleAttached=false;
    }
    @Override public void callActivityOnCreate(Activity a,Bundle state){
        // Activity.onCreate dispatches lifecycle callbacks from super.onCreate,
        // before this target creates its WebView. Wait for the whole override.
        super.callActivityOnCreate(a,state);
        if(!TARGET.equals(a.getPackageName()))return;
        try{attachConsole(a);}catch(RuntimeException error){events.add("console-unavailable",error.toString(),"",0);}
    }
    private void attachConsole(Activity a){
        WebView web=find(a.getWindow().getDecorView());
        if(web==null){events.add("console-unavailable","No WebView after Activity.onCreate returned","",0);return;}
        // This frozen target starts loadUrl in startRoom/onStart after onCreate.
        // Do not replace an application's existing chrome client or WebViewClient.
        if(web.getWebChromeClient()!=null){events.add("console-unavailable","Existing WebChromeClient preserved","",0);return;}
        if(web.getUrl()!=null){events.add("console-unavailable","Document already started; refusing late instrumentation",web.getUrl(),0);return;}
        web.setWebChromeClient(new WebChromeClient(){
            @Override public boolean onConsoleMessage(ConsoleMessage message){
                events.add("console-"+message.messageLevel().name(),message.message(),message.sourceId(),message.lineNumber());
                return false; // Retain default handling; no JS/DOM/input mutation.
            }
        });
        consoleAttached=true;events.add("console-attached","after Activity.onCreate returned; before target onStart/loadUrl","",0);
    }
    private String script() throws Exception {
        try(InputStream input=getContext().getAssets().open("graphics.js")){
            ByteArrayOutputStream bytes=new ByteArrayOutputStream();byte[] chunk=new byte[4096];int n;
            while((n=input.read(chunk))!=-1){if(bytes.size()+n>65536)throw new IllegalStateException("Oversized diagnostic script");bytes.write(chunk,0,n);}
            return "JSON.stringify("+new String(bytes.toByteArray(),StandardCharsets.UTF_8)+")";
        }
    }
    @Override public void onStart(){
        super.onStart();
        try{
            if(!TARGET.equals(getTargetContext().getPackageName()))throw new IllegalStateException("Wrong target package");
            graphicsScript=script();
            Application app=(Application)getTargetContext().getApplicationContext();
            app.registerActivityLifecycleCallbacks(new Application.ActivityLifecycleCallbacks(){
                public void onActivityCreated(Activity a,Bundle b){created(a);}
                public void onActivityStarted(Activity a){if(TARGET.equals(a.getPackageName())){activity=a;activityState="started";events.add("lifecycle","started","",0);}}
                public void onActivityResumed(Activity a){if(TARGET.equals(a.getPackageName())){activity=a;activityState="resumed";events.add("lifecycle","resumed","",0);}}
                public void onActivityPaused(Activity a){if(activity==a){activityState="paused";events.add("lifecycle","paused","",0);}}
                public void onActivityStopped(Activity a){if(activity==a)activityState="stopped";}
                public void onActivitySaveInstanceState(Activity a,Bundle b){}
                public void onActivityDestroyed(Activity a){if(activity==a){activity=null;activityState="destroyed";consoleAttached=false;}}
            });
            android.content.Intent launch=getTargetContext().getPackageManager().getLaunchIntentForPackage(TARGET);
            if(launch==null)throw new IllegalStateException("No target launch activity");
            activity=startActivitySync(launch.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK));
            try(ServerSocket server=new ServerSocket(port,4,InetAddress.getByName("127.0.0.1"))){
                Bundle ready=new Bundle();ready.putString("observer","graphics-ready");ready.putInt("diagnosticPort",port);sendStatus(0,ready);
                while(!Thread.currentThread().isInterrupted()){
                    try(Socket client=server.accept()){try{handle(client);}catch(Exception error){events.add("request-error",error.toString(),"",0);}}
                }
            }
        }catch(Throwable error){Bundle failed=new Bundle();failed.putString("observerError",error.toString());finish(Activity.RESULT_CANCELED,failed);}
    }
    private JSONObject status() throws Exception {
        return new JSONObject().put("readonly",false).put("fixedTestInput","stage-only upstream P, at most twice").put("targetPackage",TARGET).put("activityState",activityState)
            .put("consoleAttachedBeforeLoad",consoleAttached).put("diagnosticPort",port)
            .put("targetApkChanged",false).put("modelWrites",false).put("nativeInputPolls",false).put("glCapabilitiesEndpoint",true);
    }
    private String graphics(final boolean capabilities) throws Exception {
        final AtomicReference<String> result=new AtomicReference<String>();final CountDownLatch done=new CountDownLatch(1);
        final AtomicBoolean expired=new AtomicBoolean(false);final Handler main=new Handler(Looper.getMainLooper());
        final Runnable observation=new Runnable(){public void run(){
            if(expired.get())return;
            try{
            Activity a=activity;WebView web=a==null?null:find(a.getWindow().getDecorView());
            if(web==null){result.set("{\"error\":\"No target WebView\"}");done.countDown();return;}
            web.evaluateJavascript("(function(backroadGlObservation){return "+graphicsScript+";})("+capabilities+")",new android.webkit.ValueCallback<String>(){public void onReceiveValue(String encoded){
                try{Object value=new JSONTokener(encoded).nextValue();if(!(value instanceof String)||((String)value).length()>262144)throw new IllegalStateException("Invalid/big graphics snapshot");
                    JSONObject data=new JSONObject((String)value);data.put("activityState",activityState);data.put("windowFocused",activity!=null&&activity.hasWindowFocus());data.put("consoleAttachedBeforeLoad",consoleAttached);result.set(data.toString());
                }catch(Exception error){result.set("{\"error\":\"Graphics snapshot decode failed\"}");}
                done.countDown();
            }});
            }catch(RuntimeException error){result.set("{\"error\":\"Readonly graphics dispatch failed\"}");done.countDown();}
        }};
        if(!main.post(observation))throw new IllegalStateException("Main observation queue unavailable");
        if(!done.await(10,TimeUnit.SECONDS)){expired.set(true);main.removeCallbacks(observation);throw new IllegalStateException("Readonly graphics observation timed out");}
        return result.get();
    }
    private static final String STAGE = "https://game-kit.invalid/tv.html?mode=quick&stage=finland&car=swift&cond=stage&weather=stage";
    private int postKeys;
    private String postKey() throws Exception {
        JSONObject before = new JSONObject(graphics(false));
        JSONObject game = before.optJSONObject("cachedGame");
        if (postKeys >= 2 || game == null || !STAGE.equals(before.optString("url")) ||
                !"playing".equals(game.optString("stage")) || game.optBoolean("paused", true) ||
                !"running".equals(game.getJSONObject("gameplay").optString("phase"))) {
            throw new IllegalStateException("Original active racing stage required");
        }
        ++postKeys; // Do not replay input after an uncertain result.
        final AtomicBoolean delivered = new AtomicBoolean(false);
        runOnMainSync(() -> {
            Activity current = activity;
            WebView web = current == null ? null : find(current.getWindow().getDecorView());
            if (web == null || !STAGE.equals(web.getUrl()) || !current.hasWindowFocus()) return;
            long now = SystemClock.uptimeMillis();
            // The Activity maps physical P to the remote START button. This test targets
            // Chromium's existing keyboard listener directly, using the Android scan code for P.
            for (int action : new int[]{KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP}) {
                web.dispatchKeyEvent(new KeyEvent(now, SystemClock.uptimeMillis(), action, KeyEvent.KEYCODE_P,
                    0, 0, KeyCharacterMap.VIRTUAL_KEYBOARD, 25, 0, InputDevice.SOURCE_KEYBOARD));
            }
            delivered.set(true);
        });
        return new JSONObject().put("dispatched", delivered.get()).put("count", postKeys).toString();
    }

    private String console() throws Exception {
        JSONArray list=new JSONArray();for(BoundedEvents.Event e:events.snapshot())list.put(new JSONObject()
            .put("sequence",e.sequence).put("wallTime",e.wallTime).put("kind",e.kind).put("message",e.message).put("source",e.source).put("line",e.line));
        return status().put("events",list).put("dropped",events.dropped()).put("storedPayloadBytes",events.bytes()).toString();
    }
    private void handle(Socket socket) throws Exception {
        socket.setSoTimeout(12000);BufferedReader input=new BufferedReader(new InputStreamReader(socket.getInputStream(),StandardCharsets.US_ASCII));
        int[] budget={8192};long deadline=System.nanoTime()+TimeUnit.SECONDS.toNanos(12);
        String request=headerLine(input,budget,deadline),header;
        while((header=headerLine(input,budget,deadline))!=null&&!header.isEmpty()){}
        String body,code="200 OK";
        if("GET /status HTTP/1.1".equals(request)||"GET /status HTTP/1.0".equals(request))body=status().toString();
        else if("POST /post-key HTTP/1.1".equals(request)||"POST /post-key HTTP/1.0".equals(request))body=postKey();
        else if("GET /console HTTP/1.1".equals(request)||"GET /console HTTP/1.0".equals(request))body=console();
        else if("GET /graphics HTTP/1.1".equals(request)||"GET /graphics HTTP/1.0".equals(request))body=graphics(false);
        else if("GET /capabilities HTTP/1.1".equals(request)||"GET /capabilities HTTP/1.0".equals(request))body=graphics(true);
        else{body="{\"error\":\"Read-only route not found\"}";code="404 Not Found";}
        byte[] data=body.getBytes(StandardCharsets.UTF_8);OutputStream output=socket.getOutputStream();
        output.write(("HTTP/1.1 "+code+"\r\nContent-Type: application/json; charset=utf-8\r\nCache-Control: no-store\r\nConnection: close\r\nContent-Length: "+data.length+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));output.write(data);output.flush();
    }
    private static String headerLine(BufferedReader input,int[] budget) throws Exception {
        return headerLine(input,budget,System.nanoTime()+TimeUnit.SECONDS.toNanos(12));
    }
    private static String headerLine(BufferedReader input,int[] budget,long deadline) throws Exception {
        StringBuilder line=new StringBuilder();int c;
        while(true){if(System.nanoTime()>=deadline)throw new IllegalArgumentException("Header deadline expired");
            c=input.read();if(c==-1)break;if(--budget[0]<0)throw new IllegalArgumentException("Request too large");if(c=='\n')return line.toString();if(c!='\r')line.append((char)c);}
        return line.length()==0?null:line.toString();
    }
}
