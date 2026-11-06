package com.ecojust.bilitv;

import android.os.Build;
import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.util.Arrays;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** KitKat supports TLS 1.2 but does not enable it for every default HTTPS socket. */
public final class LegacyTls {
    private LegacyTls() {}
    public static synchronized void installIfNeeded() {
        if (Build.VERSION.SDK_INT < 19 || Build.VERSION.SDK_INT > 20) return;
        SSLSocketFactory current = HttpsURLConnection.getDefaultSSLSocketFactory();
        if (!(current instanceof EnabledFactory)) HttpsURLConnection.setDefaultSSLSocketFactory(new EnabledFactory(current));
        // Preserve the platform trust store, certificate checks and hostname verifier.
    }
    static final class EnabledFactory extends SSLSocketFactory {
        private final SSLSocketFactory delegate;
        EnabledFactory(SSLSocketFactory delegate) { this.delegate = delegate; }
        private Socket enable(Socket socket) throws IOException {
            if (!(socket instanceof SSLSocket)) { socket.close(); throw new IOException("HTTPS requires an SSL socket"); }
            SSLSocket ssl = (SSLSocket)socket;
            if (!Arrays.asList(ssl.getSupportedProtocols()).contains("TLSv1.2")) {
                ssl.close(); throw new IOException("This device does not support TLS 1.2");
            }
            ssl.setEnabledProtocols(new String[]{"TLSv1.2"});
            return ssl;
        }
        @Override public String[] getDefaultCipherSuites() { return delegate.getDefaultCipherSuites(); }
        @Override public String[] getSupportedCipherSuites() { return delegate.getSupportedCipherSuites(); }
        @Override public Socket createSocket() throws IOException { return enable(delegate.createSocket()); }
        @Override public Socket createSocket(Socket socket, String host, int port, boolean autoClose) throws IOException { return enable(delegate.createSocket(socket,host,port,autoClose)); }
        @Override public Socket createSocket(String host, int port) throws IOException { return enable(delegate.createSocket(host,port)); }
        @Override public Socket createSocket(String host, int port, InetAddress local, int localPort) throws IOException { return enable(delegate.createSocket(host,port,local,localPort)); }
        @Override public Socket createSocket(InetAddress host, int port) throws IOException { return enable(delegate.createSocket(host,port)); }
        @Override public Socket createSocket(InetAddress host, int port, InetAddress local, int localPort) throws IOException { return enable(delegate.createSocket(host,port,local,localPort)); }
    }
}
