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
    private final Context context;
    private LanGameServer phone;
    private WifiControllerServer wifi;
    private final WifiControllerDiscovery discovery;
    private final ConnectivityManager connectivity;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private int phonePort, wifiPort;
    private boolean phoneConnected, wifiConnected;
    private volatile String discoveryState = "";

    HostedControllerRoom(Context context) {
        this.context = context;
        connectivity = context.getSystemService(ConnectivityManager.class);
        discovery = new WifiControllerDiscovery(context, (state, name, port, error) -> discoveryState = state);
    }

    void start() {
        if (phone != null) return;
        LanGameServer newPhone = new LanGameServer(name -> context.getAssets().open(name));
        WifiControllerServer newWifi = new WifiControllerServer();
        phone = newPhone;
        wifi = newWifi;
        // Startup and shutdown share a queue so a resumed room can reclaim the default TCP port.
        worker.execute(() -> {
            int http = 0, tcp = 0;
            try { http = newPhone.start(); } catch (IOException ignored) { }
            try { tcp = newWifi.start(); } catch (IOException ignored) { }
            final int httpPort = http, tcpPort = tcp;
            main.post(() -> {
                if (phone != newPhone) return;
                phonePort = httpPort;
                wifiPort = tcpPort;
                if (wifiPort > 0) {
                    String name = context.getApplicationInfo().loadLabel(context.getPackageManager()).toString();
                    discovery.start(name, wifiPort);
                }
            });
        });
    }

    void stop() {
        if (phone == null) return;
        LanGameServer oldPhone = phone;
        WifiControllerServer oldWifi = wifi;
        phone = null;
        wifi = null;
        phonePort = wifiPort = 0;
        phoneConnected = wifiConnected = false;
        discovery.stop();
        worker.execute(() -> { oldPhone.close(); oldWifi.close(); });
    }

    String phoneUrl() {
        if (phonePort == 0) return "";
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
        String wifiStatus = wifiConnected ? "已连接" : wifiPort > 0
                ? ("available".equals(discoveryState) ? "等待连接" : "可手动连接") + " · TCP " + wifiPort
                : "未就绪";
        return "手机手柄 " + phoneStatus + "　Wi-Fi 手柄 " + wifiStatus;
    }

    JSONObject readPhone() {
        JSONObject player = phonePort > 0 ? firstPlayer(phone.snapshot()) : null;
        phoneConnected = player != null && player.optBoolean("connected");
        return player;
    }
    JSONObject readWifi() {
        JSONObject player = wifiPort > 0 ? firstPlayer(wifi.snapshot()) : null;
        wifiConnected = player != null && player.optBoolean("connected");
        return player;
    }

    private static JSONObject firstPlayer(String snapshot) {
        try { return new JSONObject(snapshot).getJSONArray("players").getJSONObject(0); }
        catch (org.json.JSONException invalid) { return null; }
    }

    @Override public void close() {
        stop();
        worker.shutdown();
    }
}
