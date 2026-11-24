package com.ecojust.putrtvstore;

import java.io.ByteArrayOutputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Socket;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Locale;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** HTTPS market transport. Validate the host and path before every request and redirect. */
public final class StoreNetwork {
    static final String SOURCE = "https://apps.b14f.com";
    private static final Pattern MODIFIED = Pattern.compile("(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun), (?:0[1-9]|[12][0-9]|3[01]) (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) [0-9]{4} (?:[01][0-9]|2[0-3]):[0-5][0-9]:(?:[0-5][0-9]|60) GMT");
    private static final long TRANSFER_TIMEOUT_MS = 15L * 60 * 1000;
    private static SSLSocketFactory marketTls;
    private StoreNetwork() { }

    // A stable TLS factory allows HttpsURLConnection to reuse connections across refresh requests.
    static synchronized SSLSocketFactory tlsFactory() throws IOException {
        if (marketTls == null) {
            try {
                SSLContext context = SSLContext.getInstance("TLS");
                context.init(null, null, null);
                marketTls = new EnabledTlsFactory(context.getSocketFactory());
            } catch (java.security.GeneralSecurityException unavailable) {
                throw new IOException("TLS is unavailable on this device", unavailable);
            }
        }
        return marketTls;
    }

    public static URL market(String path) throws IOException {
        if (!validPath(path)) throw new IOException("Invalid market path");
        try {
            return new URL(new URI("https", "apps.b14f.com", "/" + path, null).toASCIIString());
        } catch (URISyntaxException e) { throw new IOException("Invalid market path", e); }
    }

    static boolean validPath(String path) {
        if (path == null || path.length() > 2048 || path.indexOf('\\') >= 0) return false;
        String[] segments = path.split("/", -1);
        if (segments.length < 2 || !Arrays.asList("game", "launcher", "media").contains(segments[0])) return false;
        for (int i = 1; i < segments.length; i++) {
            String part = segments[i];
            if (part.length() > 255 || part.equals(".") || part.equals("..") || (part.isEmpty() && i != segments.length - 1)) return false;
            for (int j = 0; j < part.length(); j++) if (Character.isISOControl(part.charAt(j))) return false;
        }
        return true;
    }

    static boolean validApkPath(String path) {
        return validPath(path) && path.toLowerCase(Locale.ROOT).endsWith(".apk") && path.split("/").length <= 3;
    }

    static void validate(URL url) throws IOException {
        if (!"https".equals(url.getProtocol()) || !"apps.b14f.com".equalsIgnoreCase(url.getHost()) ||
                (url.getPort() != -1 && url.getPort() != 443) || url.getUserInfo() != null || url.getRef() != null || url.getQuery() != null)
            throw new IOException("Untrusted market URL");
        try {
            URI uri = url.toURI();
            String raw = uri.getRawPath().toLowerCase(Locale.ROOT);
            if (raw.contains("%2f") || raw.contains("%5c") || !raw.startsWith("/") || !validPath(uri.getPath().substring(1)))
                throw new IOException("Invalid market URL path");
        } catch (URISyntaxException e) { throw new IOException("Invalid market URL", e); }
    }

    static boolean strongEtag(String value) {
        if (value == null || value.length() < 2 || value.length() > 512 || value.charAt(0) != '"' || value.charAt(value.length() - 1) != '"') return false;
        for (int i = 1; i < value.length() - 1; i++) {
            char c = value.charAt(i);
            if (c < 33 || c == 127 || c == '"') return false;
        }
        return true;
    }

    static boolean validModified(String value) { return value != null && MODIFIED.matcher(value).matches(); }

    static MarketDirectory.Metadata head(URL url, Cancellation cancellation) throws IOException {
        HttpsURLConnection connection = connect(url, "HEAD", null, cancellation);
        try { return metadata(connection); } finally { connection.disconnect(); }
    }

    private static MarketDirectory.Metadata metadata(HttpsURLConnection connection) throws IOException {
        String length = connection.getHeaderField("Content-Length");
        long bytes;
        try { bytes = Long.parseLong(length); } catch (NumberFormatException e) { throw new IOException("Missing market file size", e); }
        String etag = connection.getHeaderField("ETag"), date = connection.getHeaderField("Last-Modified");
        if (bytes <= 0 || bytes > StoreDownloader.MAX_APK_BYTES || (!strongEtag(etag) && !validModified(date)))
            throw new IOException("Missing or invalid market file metadata");
        return new MarketDirectory.Metadata(bytes, strongEtag(etag) ? etag : "", validModified(date) ? date : "");
    }

    static void verifyResponse(StoreEntry entry, String length, String etag, String modified) throws IOException {
        if (length != null) {
            try {
                if (Long.parseLong(length) != entry.bytes) throw new IOException("Market APK size changed");
            } catch (NumberFormatException e) { throw new IOException("Invalid market APK size", e); }
        }
        boolean matches = strongEtag(entry.etag) ? entry.etag.equals(etag)
                : validModified(entry.lastModified) && entry.lastModified.equals(modified);
        if (!matches) throw new IOException("Market APK changed. Refresh the catalog.");
    }

    private static HttpsURLConnection connect(URL url, String method, StoreEntry entry, Cancellation cancellation) throws IOException {
        for (int redirects = 0; redirects <= 3; redirects++) {
            cancellation.check(); validate(url);
            HttpsURLConnection connection = (HttpsURLConnection) url.openConnection();
            try {
                connection.setRequestMethod(method);
                connection.setConnectTimeout(10000); connection.setReadTimeout(10000);
                connection.setInstanceFollowRedirects(false); connection.setUseCaches(false);
                connection.setRequestProperty("User-Agent", "putrtv-store");
                connection.setRequestProperty("Accept-Encoding", "identity");
                if (entry != null) {
                    if (strongEtag(entry.etag)) connection.setRequestProperty("If-Match", entry.etag);
                    else if (validModified(entry.lastModified)) connection.setRequestProperty("If-Unmodified-Since", entry.lastModified);
                    else throw new IOException("Missing APK validator");
                }
                connection.setSSLSocketFactory(tlsFactory());
                int status = connection.getResponseCode(); cancellation.check();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = connection.getHeaderField("Location");
                    if (location == null || redirects == 3) throw new IOException("Too many market redirects");
                    url = new URL(url, location); connection.disconnect(); continue;
                }
                if (status != HttpURLConnection.HTTP_OK) throw new IOException("Market HTTP " + status);
                String encoding = connection.getContentEncoding();
                if (encoding != null && !encoding.equalsIgnoreCase("identity")) throw new IOException("Unexpected market response encoding");
                if (entry != null) verifyResponse(entry, connection.getHeaderField("Content-Length"),
                        connection.getHeaderField("ETag"), connection.getHeaderField("Last-Modified"));
                return connection;
            } catch (Exception failure) {
                connection.disconnect();
                if (failure instanceof IOException) throw (IOException) failure;
                throw new IOException("Cannot connect to APK market", failure);
            }
        }
        throw new IOException("Too many market redirects");
    }

    static InputStream openApk(StoreEntry entry, Cancellation cancellation) throws IOException {
        if (!validApkPath(entry.apkPath)) throw new IOException("Invalid market APK");
        return stream(connect(market(entry.apkPath), "GET", entry, cancellation), cancellation);
    }

    public static InputStream open(URL url, Cancellation cancellation) throws IOException {
        return stream(connect(url, "GET", null, cancellation), cancellation);
    }

    private static InputStream stream(final HttpsURLConnection active, final Cancellation cancellation) throws IOException {
        final long deadline = android.os.SystemClock.elapsedRealtime() + TRANSFER_TIMEOUT_MS;
        try {
            return new FilterInputStream(active.getInputStream()) {
                private void check() throws IOException {
                    cancellation.check();
                    if (android.os.SystemClock.elapsedRealtime() > deadline) throw new IOException("Market transfer timed out");
                }
                @Override public int read() throws IOException { check(); return super.read(); }
                @Override public int read(byte[] bytes, int offset, int count) throws IOException { check(); return in.read(bytes, offset, count); }
                @Override public void close() throws IOException { try { super.close(); } finally { active.disconnect(); } }
            };
        } catch (IOException e) { active.disconnect(); throw e; }
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
