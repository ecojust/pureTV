package com.ecojust.controller;

import android.content.Context;
import com.ecojust.gamekit.WifiControllerDiscovery;
import com.ecojust.gamekit.WifiControllerServer;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/** One native integration for the older games; the wire protocol remains shared with Game Kit. */
public final class LegacyWifiController implements AutoCloseable {
    private static final String EMPTY = "{\"players\":[],\"connections\":0}";
    private final WifiControllerServer server;
    private final WifiControllerDiscovery discovery;
    private volatile List<String> addresses = Collections.emptyList();
    private volatile String state = "stopped", serviceName = "";
    private volatile int discoveryError;
    private volatile boolean inputActive;
    private boolean usingWifi;

    public LegacyWifiController(Context context, int seats) {
        // Legacy games need SELECT: A/X = action A, B = action B, Y = SELECT.
        server = new WifiControllerServer(seats, true);
        server.setInputActive(false);
        discovery = new WifiControllerDiscovery(context, (status, name, port, error) -> {
            state = status; serviceName = name; discoveryError = error;
        });
    }

    /** Called on the activity worker. Network changes refresh discovery, never the TCP listener. */
    public synchronized void start(String name, List<String> currentAddresses) {
        boolean changed = !addresses.equals(currentAddresses);
        addresses = Collections.unmodifiableList(new ArrayList<>(currentAddresses));
        serviceName = name;
        try {
            boolean first = server.getPort() == 0;
            int port = server.start();
            server.setInputActive(inputActive);
            if (addresses.isEmpty()) {
                discovery.stop(); state = "unavailable"; discoveryError = -1;
            } else if (first || changed || "stopped".equals(state) || "unavailable".equals(state)) {
                discovery.start(name, port);
            }
        } catch (Exception failure) {
            state = "unavailable"; discoveryError = -1;
        }
    }

    /** Focus loss only isolates input. Existing connections, ACKs and advertised port stay alive. */
    public void setInputActive(boolean active) {
        inputActive = active;
        server.setInputActive(active);
    }

    public String information(String phoneInformation) {
        try {
            JSONObject info = new JSONObject(phoneInformation);
            info.put("wifiController", new JSONObject().put("state", state)
                .put("serviceName", serviceName).put("port", server.getPort())
                .put("serviceType", WifiControllerDiscovery.SERVICE_TYPE).put("version", "1")
                .put("addresses", new JSONArray(addresses)).put("error", discoveryError)
                .put("connected", server.hasController()).put("inputActive", inputActive));
            return info.toString();
        } catch (Exception invalidInformation) { return phoneInformation; }
    }

    /** Exactly one consuming Wi-Fi snapshot per call; retain its disconnect edge before phone fallback. */
    public synchronized String snapshot(String phoneSnapshot, boolean suspended) {
        if (suspended) return EMPTY;
        String sample = server.snapshot();
        try {
            if (new JSONObject(sample).optInt("connections", 0) > 0) {
                usingWifi = true;
                return sample;
            }
        } catch (Exception impossible) { /* The server serializes its own JSON. */ }
        if (usingWifi) { usingWifi = false; return sample; }
        return phoneSnapshot;
    }

    public synchronized void stop() {
        setInputActive(false);
        discovery.stop();
        server.stop();
        usingWifi = false;
        state = "stopped";
    }
    @Override public void close() { stop(); }
}
