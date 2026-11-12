package com.ecojust.gamekit;

import android.content.Context;
import android.net.nsd.NsdManager;
import android.net.nsd.NsdServiceInfo;

/** Advertises the already-listening TCP input service, never the QR HTTP port. */
public final class WifiControllerDiscovery implements AutoCloseable {
    public static final String SERVICE_TYPE = "_puretv._tcp";
    public interface Listener { void onState(String state, String name, int port, int error); }
    private final NsdManager manager;
    private final Listener listener;
    private Registration current;

    public WifiControllerDiscovery(Context context, Listener listener) {
        manager = (NsdManager) context.getSystemService(Context.NSD_SERVICE);
        this.listener = listener;
    }

    public synchronized void start(String name, int port) {
        stop();
        if (port < 1 || port > 65535) throw new IllegalArgumentException("TCP listener port required");
        if (manager == null) { listener.onState("unavailable", name, port, -1); return; }
        Registration registration = new Registration(name, port);
        current = registration;
        NsdServiceInfo service = new NsdServiceInfo();
        service.setServiceType(SERVICE_TYPE);
        service.setServiceName(name);
        service.setPort(port);
        service.setAttribute("version", "1");
        listener.onState("registering", name, port, 0);
        try { manager.registerService(service, NsdManager.PROTOCOL_DNS_SD, registration); }
        catch (RuntimeException failure) {
            if (current == registration) {
                current = null;
                listener.onState("unavailable", name, port, -1);
            }
        }
    }

    public synchronized void stop() {
        Registration old = current;
        current = null;
        if (old != null) {
            unregister(old);
            listener.onState("stopped", old.name, old.port, 0);
        }
    }

    @Override public void close() { stop(); }

    private void unregister(Registration registration) {
        try { manager.unregisterService(registration); }
        catch (RuntimeException ignored) {
            // Registration may still be pending. A late success retries this
            // exact listener, without cancelling a newer registration.
        }
    }

    private final class Registration implements NsdManager.RegistrationListener {
        final String name;
        final int port;
        Registration(String name, int port) { this.name = name; this.port = port; }
        @Override public void onServiceRegistered(NsdServiceInfo service) {
            synchronized (WifiControllerDiscovery.this) {
                if (current != this) { unregister(this); return; }
                listener.onState("available", service.getServiceName(), port, 0);
            }
        }
        @Override public void onRegistrationFailed(NsdServiceInfo service, int error) {
            synchronized (WifiControllerDiscovery.this) {
                if (current != this) return;
                current = null;
                listener.onState("unavailable", name, port, error);
            }
        }
        @Override public void onServiceUnregistered(NsdServiceInfo service) {
            synchronized (WifiControllerDiscovery.this) {
                if (current != this) return;
                current = null;
                listener.onState("stopped", name, port, 0);
            }
        }
        @Override public void onUnregistrationFailed(NsdServiceInfo service, int error) {
            // Do not re-register a service whose TCP listener has stopped.
        }
    }
}
