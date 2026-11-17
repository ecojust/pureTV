package com.ecojust.putrtvstore;

import java.io.ByteArrayOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Socket;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** Public repository transport. Every redirect is checked before opening a connection. */
public final class StoreNetwork {
    public static final String REF_URL = "https://api.github.com/repos/ecojust/pureTV/git/ref/heads/master";
    private static final String RAW_PREFIX = "/ecojust/pureTV/";
    private static final Pattern REVISION = Pattern.compile("[a-f0-9]{40}");
    private static final Pattern RESOURCE = Pattern.compile("resource/(?:[A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+");
    private static final long TRANSFER_TIMEOUT_MS = 15L * 60 * 1000;
    private StoreNetwork() { }

    public static URL raw(String revision, String path) throws IOException {
        if (!validRevision(revision) || !validPath(path)) throw new IOException("Invalid repository asset path");
        return new URL("https://raw.githubusercontent.com" + RAW_PREFIX + revision + "/" + path);
    }

    static boolean validRevision(String revision) { return revision != null && REVISION.matcher(revision).matches(); }
    static boolean validPath(String path) {
        if (path == null || path.length() > 512 || !RESOURCE.matcher(path).matches()) return false;
        for (String segment : path.split("/")) if (segment.equals(".") || segment.equals("..")) return false;
        return true;
    }

    static void validate(URL url) throws IOException {
        if (!url.getProtocol().equals("https") || url.getUserInfo() != null || url.getRef() != null
                || url.getQuery() != null || (url.getPort() != -1 && url.getPort() != 443))
            throw new IOException("Untrusted repository URL");
        if (url.getHost().equals("api.github.com")
                && url.getPath().equals("/repos/ecojust/pureTV/git/ref/heads/master")) return;
        if (url.getHost().equals("raw.githubusercontent.com") && url.getPath().startsWith(RAW_PREFIX)) {
            String tail = url.getPath().substring(RAW_PREFIX.length());
            int slash = tail.indexOf('/');
            if (slash == 40 && validRevision(tail.substring(0, slash)) && validPath(tail.substring(slash + 1))) return;
        }
        throw new IOException("Untrusted repository URL");
    }

    public static InputStream open(URL url, Cancellation cancellation) throws IOException {
        final long deadline = android.os.SystemClock.elapsedRealtime() + TRANSFER_TIMEOUT_MS;
        for (int redirects = 0; redirects <= 3; redirects++) {
            cancellation.check(); validate(url);
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            connection.setConnectTimeout(10000); connection.setReadTimeout(10000);
            connection.setInstanceFollowRedirects(false); connection.setUseCaches(false);
            connection.setRequestProperty("User-Agent", "putrtv-store/0.1");
            connection.setRequestProperty("Accept-Encoding", "identity");
            connection.setRequestProperty("Accept", "application/json, application/octet-stream, image/png");
            // Android 4.4 supports TLS 1.2 but does not enable it for all default HTTPS sockets.
            // Keep the platform trust store and hostname verifier; never accept invalid certificates.
            try {
                SSLContext tls = SSLContext.getInstance("TLS");
                tls.init(null, null, null);
                connection.setSSLSocketFactory(new EnabledTlsFactory(tls.getSocketFactory()));
                int status = connection.getResponseCode();
                cancellation.check();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = connection.getHeaderField("Location");
                    if (location == null || redirects == 3) throw new IOException("Too many repository redirects");
                    URL next = new URL(url, location); validate(next);
                    connection.disconnect(); url = next; continue;
                }
                if (status != HttpURLConnection.HTTP_OK) throw new IOException("Repository HTTP " + status);
                String encoding = connection.getContentEncoding();
                if (encoding != null && !encoding.equalsIgnoreCase("identity"))
                    throw new IOException("Unexpected response encoding");
                final HttpsURLConnection active = connection;
                return new FilterInputStream(connection.getInputStream()) {
                    private void check() throws IOException {
                        cancellation.check();
                        if (android.os.SystemClock.elapsedRealtime() > deadline) throw new IOException("Repository transfer timed out");
                    }
                    @Override public int read() throws IOException { check(); return super.read(); }
                    @Override public int read(byte[] bytes, int offset, int count) throws IOException {
                        check(); return in.read(bytes, offset, count);
                    }
                    @Override public void close() throws IOException { try { super.close(); } finally { active.disconnect(); } }
                };
            } catch (Exception failure) {
                connection.disconnect();
                if (failure instanceof IOException) throw (IOException) failure;
                throw new IOException("HTTPS is unavailable on this device", failure);
            }
        }
        throw new IOException("Too many repository redirects");
    }

    /** Android 4.4 aliases TLS context names and still creates SSLv3/TLSv1-only
     * sockets by default. Configure each delegated socket before its handshake.
     * The delegate retains the platform trust manager and enabled cipher suites;
     * HttpsURLConnection retains its default hostname verifier.
     */
    static final class EnabledTlsFactory extends SSLSocketFactory {
        private final SSLSocketFactory delegate;
        EnabledTlsFactory(SSLSocketFactory delegate) { this.delegate = delegate; }
        @Override public String[] getDefaultCipherSuites() { return delegate.getDefaultCipherSuites(); }
        @Override public String[] getSupportedCipherSuites() { return delegate.getSupportedCipherSuites(); }

        private Socket enable(Socket socket) throws IOException {
            try {
                if (!(socket instanceof SSLSocket)) throw new IOException("HTTPS did not create a TLS socket");
                SSLSocket ssl = (SSLSocket) socket;
                List<String> supported = Arrays.asList(ssl.getSupportedProtocols());
                List<String> enabled = new ArrayList<>();
                if (supported.contains("TLSv1.3")) enabled.add("TLSv1.3");
                if (supported.contains("TLSv1.2")) enabled.add("TLSv1.2");
                if (enabled.isEmpty()) throw new IOException("This device does not support TLS 1.2 or newer");
                ssl.setEnabledProtocols(enabled.toArray(new String[0]));
                return ssl;
            } catch (IOException | RuntimeException failure) {
                try { if (socket != null) socket.close(); } catch (IOException ignored) { }
                if (failure instanceof IOException) throw (IOException) failure;
                throw new IOException("Cannot enable secure TLS protocols", failure);
            }
        }
        @Override public Socket createSocket() throws IOException { return enable(delegate.createSocket()); }
        @Override public Socket createSocket(Socket socket, String host, int port, boolean close) throws IOException {
            return enable(delegate.createSocket(socket, host, port, close));
        }
        @Override public Socket createSocket(String host, int port) throws IOException {
            return enable(delegate.createSocket(host, port));
        }
        @Override public Socket createSocket(String host, int port, InetAddress local, int localPort) throws IOException {
            return enable(delegate.createSocket(host, port, local, localPort));
        }
        @Override public Socket createSocket(InetAddress host, int port) throws IOException {
            return enable(delegate.createSocket(host, port));
        }
        @Override public Socket createSocket(InetAddress host, int port, InetAddress local, int localPort) throws IOException {
            return enable(delegate.createSocket(host, port, local, localPort));
        }
    }

    public static byte[] read(URL url, int maxBytes, Cancellation cancellation) throws IOException {
        if (maxBytes < 1 || maxBytes > 16 * 1024 * 1024) throw new IOException("Invalid response size limit");
        try (InputStream stream = open(url, cancellation)) { return readBounded(stream, maxBytes, cancellation); }
    }

    static byte[] readBounded(InputStream stream, int maxBytes, Cancellation cancellation) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream(Math.min(maxBytes, 8192));
        byte[] buffer = new byte[8192]; int count;
        while ((count = stream.read(buffer)) != -1) {
            cancellation.check();
            if (count > maxBytes - bytes.size()) throw new IOException("Repository response exceeds size limit");
            bytes.write(buffer, 0, count);
        }
        cancellation.check(); return bytes.toByteArray();
    }
}
