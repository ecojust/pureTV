package com.ecojust.hostedgames;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.os.Handler;
import android.os.Looper;

import com.ecojust.gamekit.LanGameServer;
import com.ecojust.gamekit.WifiControllerDiscovery;
import com.ecojust.gamekit.WifiControllerServer;

import java.io.IOException;
import java.net.Inet4Address;
import java.net.InetAddress;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.json.JSONObject;

/** Game Kit's two local transports. Neither socket nor the room token is exposed to the WebView. */
final class HostedControllerRoom implements AutoCloseable {
    private final LanGameServer phone;
    private final WifiControllerServer wifi = new WifiControllerServer();
    private final WifiControllerDiscovery discovery;
    private final ConnectivityManager connectivity;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private volatile boolean closed;
    private volatile int phonePort, wifiPort;
    private boolean phoneReady, wifiReady, phoneConnected, wifiConnected;
    private volatile String discoveryState = "";

    HostedControllerRoom(Context context) {
        connectivity = context.getSystemService(ConnectivityManager.class);
        phone = new LanGameServer(name -> context.getAssets().open(name));
        discovery = new WifiControllerDiscovery(context, (state, name, port, error) -> discoveryState = state);
        worker.execute(() -> {
            try { phonePort = phone.start(); } catch (IOException ignored) { }
            try { wifiPort = wifi.start(); } catch (IOException ignored) { }
            main.post(() -> {
                if (closed) return;
                phoneReady = phonePort > 0;
                wifiReady = wifiPort > 0;
                if (wifiReady) discovery.start("pureTV 在线游戏", wifiPort);
            });
        });
    }

    String phoneUrl() {
        if (!phoneReady) return "";
        LinkProperties links = connectivity.getLinkProperties(connectivity.getActiveNetwork());
        if (links == null) return "";
        for (LinkAddress link : links.getLinkAddresses()) {
            InetAddress address = link.getAddress();
            if (address instanceof Inet4Address && !address.isLoopbackAddress() && !address.isLinkLocalAddress())
                return "http://" + address.getHostAddress() + ":" + phonePort + "/?room=" + phone.roomToken();
        }
        return "";
    }

    String status() {
        String phoneStatus = phoneConnected ? "已连接" : phoneUrl().isEmpty() ? "等待局域网" : "同一网络扫码连接";
        String wifiStatus = wifiConnected ? "已连接" : wifiReady
                ? ("available".equals(discoveryState) ? "等待连接" : "可手动连接") + " · TCP " + wifiPort
                : "未就绪";
        return "手机手柄 " + phoneStatus + "　Wi-Fi 手柄 " + wifiStatus;
    }

    JSONObject readPhone() {
        JSONObject player = phoneReady ? firstPlayer(phone.snapshot()) : null;
        phoneConnected = player != null && player.optBoolean("connected");
        return player;
    }
    JSONObject readWifi() {
        JSONObject player = wifiReady ? firstPlayer(wifi.snapshot()) : null;
        wifiConnected = player != null && player.optBoolean("connected");
        return player;
    }

    private static JSONObject firstPlayer(String snapshot) {
        try { return new JSONObject(snapshot).getJSONArray("players").getJSONObject(0); }
        catch (org.json.JSONException invalid) { return null; }
    }

    @Override public void close() {
        closed = true;
        discovery.close();
        worker.execute(() -> { phone.close(); wifi.close(); });
        worker.shutdown();
    }
}
