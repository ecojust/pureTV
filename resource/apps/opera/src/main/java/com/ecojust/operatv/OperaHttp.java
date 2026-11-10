package com.ecojust.operatv;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.Socket;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;

/** Bounded HTTP text reads. No permissive trust manager or hostname verifier is installed. */
public final class OperaHttp {
    private static final int MAX_REDIRECTS = 4, IO_TIMEOUT_MS = 12000;
    private static final long TOTAL_TIMEOUT_NANOS = 45000000000L;
    private OperaHttp() { }

    public static final class Response {
        public final String text, url, contentType;
        Response(String text, String url, String contentType) {
            this.text = text; this.url = url; this.contentType = contentType == null ? "" : contentType;
        }
    }

    public static String get(String address, int maxBytes) throws IOException {
        return fetch(address, maxBytes).text;
    }

    public static Response fetch(String address, int maxBytes) throws IOException {
        if (maxBytes < 1 || maxBytes > 4 * 1024 * 1024) throw new IOException("Invalid response size limit");
        URL current = checked(address);
        boolean requireHttps = "https".equalsIgnoreCase(current.getProtocol());
        long deadline = System.nanoTime() + TOTAL_TIMEOUT_NANOS;
        for (int redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
            checkCancelled(deadline);
            HttpURLConnection connection = (HttpURLConnection) current.openConnection();
            try {
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout(timeout(deadline));
                connection.setReadTimeout(timeout(deadline));
                connection.setUseCaches(false);
                connection.setRequestProperty("User-Agent", "OperaTV/0.1.0 (Android)");
                connection.setRequestProperty("Accept", "application/json,application/vnd.apple.mpegurl,text/plain,*/*;q=0.5");
                connection.setRequestProperty("Accept-Encoding", "identity");
                if (isCctvHost(current.getHost())) connection.setRequestProperty("Referer", "https://tv.cctv.com/");
                if (connection instanceof HttpsURLConnection) {
                    HttpsURLConnection secure = (HttpsURLConnection) connection;
                    secure.setSSLSocketFactory(new ModernTlsFactory(secure.getSSLSocketFactory()));
                }
                int status = connection.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = connection.getHeaderField("Location");
                    if (redirects == MAX_REDIRECTS || location == null || location.trim().isEmpty())
                        throw new IOException("Invalid or excessive HTTP redirects");
                    URL next = checked(new URL(current, location).toExternalForm());
                    if (requireHttps && !"https".equalsIgnoreCase(next.getProtocol()))
                        throw new IOException("HTTPS redirect to an insecure address was refused");
                    requireHttps |= "https".equalsIgnoreCase(next.getProtocol());
                    current = next;
                    continue;
                }
                if (status < 200 || status >= 300) throw new IOException("Server returned HTTP " + status);
                String length = connection.getHeaderField("Content-Length");
                if (length != null) {
                    try { if (Long.parseLong(length) > maxBytes) throw new IOException("Response is too large"); }
                    catch (NumberFormatException ignored) { /* Enforce the bound while reading regardless. */ }
                }
                try (InputStream raw = connection.getInputStream();
                     InputStream stream = "gzip".equalsIgnoreCase(connection.getContentEncoding()) ? new GZIPInputStream(raw) : raw) {
                    ByteArrayOutputStream out = new ByteArrayOutputStream(Math.min(maxBytes, 16384));
                    byte[] buffer = new byte[8192];
                    int count;
                    while (true) {
                        checkCancelled(deadline);
                        connection.setReadTimeout(timeout(deadline));
                        count = stream.read(buffer);
                        if (count == -1) break;
                        if (out.size() > maxBytes - count) throw new IOException("Response is too large");
                        out.write(buffer, 0, count);
                    }
                    final String decoded;
                    try {
                        decoded = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                                .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(out.toByteArray())).toString();
                    } catch (CharacterCodingException malformed) { throw new IOException("Response is not valid UTF-8 text", malformed); }
                    String body = decoded;
                    if (!body.isEmpty() && body.charAt(0) == '\uFEFF') body = body.substring(1);
                    if (body.trim().isEmpty()) throw new IOException("Server returned an empty response");
                    return new Response(body, current.toExternalForm(), connection.getContentType());
                }
            } finally { connection.disconnect(); }
        }
        throw new IOException("Too many HTTP redirects");
    }

    private static URL checked(String address) throws IOException {
        try { return new URL(OperaItem.networkUri(address)); }
        catch (IllegalArgumentException invalid) { throw new IOException(invalid.getMessage(), invalid); }
    }

    private static int timeout(long deadline) throws IOException {
        checkCancelled(deadline);
        return (int) Math.max(1, Math.min(IO_TIMEOUT_MS, (deadline - System.nanoTime()) / 1000000));
    }

    private static void checkCancelled(long deadline) throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new IOException("Request cancelled");
        if (System.nanoTime() >= deadline) throw new IOException("Network request timed out");
    }

    private static boolean isCctvHost(String host) {
        return "api.cntv.cn".equalsIgnoreCase(host) || "vdn.apps.cntv.cn".equalsIgnoreCase(host);
    }

    /** Android 4.4 supports TLS 1.2 but does not enable it on all default client sockets. */
    static final class ModernTlsFactory extends SSLSocketFactory {
        private final SSLSocketFactory delegate;
        ModernTlsFactory(SSLSocketFactory delegate) { this.delegate = delegate; }
        private Socket configure(Socket socket) throws IOException {
            if (socket instanceof SSLSocket) {
                SSLSocket tls = (SSLSocket) socket;
                List<String> protocols = new ArrayList<>();
                for (String supported : tls.getSupportedProtocols())
                    if ("TLSv1.2".equals(supported) || "TLSv1.3".equals(supported)) protocols.add(supported);
                if (protocols.isEmpty()) { socket.close(); throw new IOException("TLS 1.2 is not available on this device"); }
                tls.setEnabledProtocols(protocols.toArray(new String[0]));
            }
            return socket;
        }
        @Override public String[] getDefaultCipherSuites() { return delegate.getDefaultCipherSuites(); }
        @Override public String[] getSupportedCipherSuites() { return delegate.getSupportedCipherSuites(); }
        @Override public Socket createSocket() throws IOException { return configure(delegate.createSocket()); }
        @Override public Socket createSocket(Socket s, String h, int p, boolean c) throws IOException { return configure(delegate.createSocket(s,h,p,c)); }
        @Override public Socket createSocket(String h, int p) throws IOException { return configure(delegate.createSocket(h,p)); }
        @Override public Socket createSocket(String h, int p, InetAddress a, int l) throws IOException { return configure(delegate.createSocket(h,p,a,l)); }
        @Override public Socket createSocket(InetAddress h, int p) throws IOException { return configure(delegate.createSocket(h,p)); }
        @Override public Socket createSocket(InetAddress h, int p, InetAddress a, int l) throws IOException { return configure(delegate.createSocket(h,p,a,l)); }
    }
}
