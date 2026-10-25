package com.ecojust.hifinitv;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/** A bounded, private, one-at-a-time audio download. Completed files belong to the caller. */
final class AudioDownloader implements AutoCloseable {
    static final long MAX_BYTES = 64L * 1024 * 1024, TIMEOUT_MS = 90000;
    private static final int CONNECT_TIMEOUT_MS = 10000, READ_TIMEOUT_MS = 15000, MAX_REDIRECTS = 5;
    private static final String DIRECTORY = "hifini-audio", PREFIX = "audio-";
    private static final ScheduledThreadPoolExecutor WATCHDOG = new ScheduledThreadPoolExecutor(1, runnable -> {
        Thread thread = new Thread(runnable, "hifini-download-timeout"); thread.setDaemon(true); return thread;
    });
    static { WATCHDOG.setRemoveOnCancelPolicy(true); }

    enum Failure { CANCELLED, TIMEOUT, TOO_LARGE, LOGIN_REQUIRED, HTTP_STATUS, INVALID_AUDIO, UNSUPPORTED_URL, CACHE_IO }
    static final class DownloadException extends IOException {
        final Failure failure;
        final int statusCode;
        DownloadException(Failure failure) { this(failure, 0); }
        DownloadException(Failure failure, int statusCode) {
            super("Audio download: " + failure + (statusCode == 0 ? "" : " (" + statusCode + ")"));
            this.failure = failure; this.statusCode = statusCode;
        }
    }
    static final class Progress {
        final long downloaded, total;
        Progress(long downloaded, long total) { this.downloaded = downloaded; this.total = total; }
    }
    interface Connections { HttpURLConnection open(URL url) throws IOException; }
    interface Session {
        long epoch();
        String cookie(String url, long epoch);
        void accept(String url, List<String> cookies, long epoch);
    }
    private static final Session OFFICIAL_SESSION = new Session() {
        public long epoch() { return HifiniSession.epoch(); }
        public String cookie(String url, long epoch) { return HifiniSession.cookieHeader(url, epoch); }
        public void accept(String url, List<String> cookies, long epoch) { HifiniSession.acceptCookies(url, cookies, epoch); }
    };
    private static final class Request {
        volatile boolean cancelled, timedOut;
        volatile HttpURLConnection connection;
        volatile InputStream input;
        volatile File part;
    }
    private final File directory;
    private final Connections connections;
    private final Session session;
    private final long maximumBytes, timeoutMs;
    private final Object lock = new Object();
    private Request active;
    private boolean closed;

    AudioDownloader(File cacheDir) {
        this(cacheDir, url -> (HttpURLConnection) url.openConnection(), OFFICIAL_SESSION, MAX_BYTES, TIMEOUT_MS);
    }
    // The transport seam keeps tests on a real local HTTP server, without contacting a music provider.
    AudioDownloader(File cacheDir, Connections connections, Session session, long maximumBytes, long timeoutMs) {
        this.directory = new File(cacheDir, DIRECTORY); this.connections = connections; this.session = session;
        if (maximumBytes <= 0 || maximumBytes > MAX_BYTES || timeoutMs <= 0 || timeoutMs > TIMEOUT_MS) throw new IllegalArgumentException();
        this.maximumBytes = maximumBytes; this.timeoutMs = timeoutMs;
    }

    /** Call once at service startup, before any downloader or decoder owns files in this directory. */
    static void cleanCache(File cacheDir) {
        File[] files = new File(cacheDir, DIRECTORY).listFiles();
        if (files == null) return;
        for (File file : files) if (file.isFile() && file.getName().startsWith(PREFIX)
                && (file.getName().endsWith(".part") || file.getName().endsWith(".audio"))) file.delete();
    }

    File download(String source, String referer, Consumer<Progress> progress) throws IOException {
        String current = checkedUrl(source, null);
        final Request request = new Request();
        synchronized (lock) {
            if (closed) throw new DownloadException(Failure.CANCELLED);
            if (active != null) throw new IOException("An audio download is already active");
            active = request;
        }
        final long epoch = session.epoch();
        // Once a chain becomes anonymous, a redirect back cannot reacquire site credentials.
        boolean officialChain = HifiniSession.allows(current);
        ScheduledFuture<?> watchdog = WATCHDOG.schedule(() -> abort(request, true), timeoutMs, TimeUnit.MILLISECONDS);
        boolean committed = false;
        try {
            check(request, epoch);
            if (!directory.isDirectory() && !directory.mkdirs()) throw new DownloadException(Failure.CACHE_IO);
            for (int redirect = 0; redirect <= MAX_REDIRECTS; redirect++) {
                check(request, epoch);
                HttpURLConnection connection = connections.open(new URL(current));
                request.connection = connection;
                check(request, epoch);
                connection.setInstanceFollowRedirects(false);
                connection.setConnectTimeout((int) Math.min(CONNECT_TIMEOUT_MS, timeoutMs));
                connection.setReadTimeout((int) Math.min(READ_TIMEOUT_MS, timeoutMs));
                connection.setRequestProperty("User-Agent", HifiniApi.AGENT);
                connection.setRequestProperty("Accept", "audio/*,application/octet-stream;q=0.9,*/*;q=0.5");
                connection.setRequestProperty("Accept-Encoding", "identity");
                if (HifiniSession.allows(referer)) connection.setRequestProperty("Referer", referer);
                boolean officialHop = officialChain && HifiniSession.allows(current);
                String cookie = officialHop ? session.cookie(current, epoch) : "";
                if (!cookie.isEmpty()) connection.setRequestProperty("Cookie", cookie);
                int code = connection.getResponseCode();
                check(request, epoch);
                if (officialHop) for (Map.Entry<String, List<String>> header : connection.getHeaderFields().entrySet()) {
                    if ("Set-Cookie".equalsIgnoreCase(header.getKey())) session.accept(current, header.getValue(), epoch);
                }
                if (code == 301 || code == 302 || code == 303 || code == 307 || code == 308) {
                    if (redirect == MAX_REDIRECTS) throw new DownloadException(Failure.UNSUPPORTED_URL);
                    String next = checkedUrl(connection.getHeaderField("Location"), current);
                    if (HifiniApi.loginPageUrl(next)) throw new DownloadException(Failure.LOGIN_REQUIRED);
                    if (!HifiniSession.allows(next)) officialChain = false;
                    connection.disconnect(); request.connection = null; current = next; continue;
                }
                if (code == 401) throw new DownloadException(Failure.LOGIN_REQUIRED);
                if (code != 200) throw new DownloadException(Failure.HTTP_STATUS, code);
                long total = connection.getContentLengthLong();
                if (total > maximumBytes) throw new DownloadException(Failure.TOO_LARGE);
                if (total == 0) throw new DownloadException(Failure.INVALID_AUDIO);
                if (total < 0) total = -1;
                String encoding = connection.getContentEncoding();
                if (encoding != null && !encoding.isEmpty() && !encoding.equalsIgnoreCase("identity")) throw new DownloadException(Failure.INVALID_AUDIO);
                try { request.part = File.createTempFile(PREFIX, ".part", directory); }
                catch (IOException disk) { throw new DownloadException(Failure.CACHE_IO); }
                report(progress, 0, total);
                try (InputStream input = connection.getInputStream(); FileOutputStream output = new FileOutputStream(request.part)) {
                    request.input = input;
                    byte[] buffer = new byte[16384], prefix = new byte[512];
                    long downloaded = 0, lastReport = 0;
                    int prefixSize = 0, count;
                    while ((count = input.read(buffer)) != -1) {
                        check(request, epoch);
                        if (count == 0) continue;
                        if (downloaded + count > maximumBytes) throw new DownloadException(Failure.TOO_LARGE);
                        int copied = Math.min(count, prefix.length - prefixSize);
                        if (copied > 0) { System.arraycopy(buffer, 0, prefix, prefixSize, copied); prefixSize += copied; }
                        if (textResponse(prefix, prefixSize)) throw new DownloadException(Failure.INVALID_AUDIO);
                        output.write(buffer, 0, count); downloaded += count;
                        // At most roughly five UI updates/sec, plus the mandatory initial/final update.
                        long now = System.nanoTime();
                        if (now - lastReport >= TimeUnit.MILLISECONDS.toNanos(200)) { report(progress, downloaded, total); lastReport = now; }
                    }
                    check(request, epoch);
                    if (downloaded == 0 || total >= 0 && downloaded != total) throw new DownloadException(Failure.INVALID_AUDIO);
                    report(progress, downloaded, total);
                } finally { request.input = null; }
                check(request, epoch);
                if (!supportedAudio(request.part)) throw new DownloadException(Failure.INVALID_AUDIO);
                File complete = new File(directory, request.part.getName().replace(".part", ".audio"));
                synchronized (lock) {
                    check(request, epoch);
                    if (!request.part.renameTo(complete)) throw new DownloadException(Failure.CACHE_IO);
                    request.part = null; committed = true;
                }
                return complete;
            }
            throw new DownloadException(Failure.UNSUPPORTED_URL);
        } catch (IOException failure) {
            check(request, epoch);
            if (failure instanceof java.net.SocketTimeoutException) throw new DownloadException(Failure.TIMEOUT);
            throw failure;
        } finally {
            watchdog.cancel(false);
            HttpURLConnection connection = request.connection; request.connection = null;
            if (connection != null) connection.disconnect();
            if (!committed && request.part != null) request.part.delete();
            synchronized (lock) { if (active == request) active = null; }
        }
    }

    void cancel() {
        Request request;
        synchronized (lock) { request = active; }
        if (request != null) abort(request, false);
    }
    @Override public void close() { synchronized (lock) { closed = true; } cancel(); }
    private static void abort(Request request, boolean timedOut) {
        if (timedOut) request.timedOut = true; else request.cancelled = true;
        HttpURLConnection connection = request.connection;
        if (connection != null) connection.disconnect();
        InputStream input = request.input;
        if (input != null) try { input.close(); } catch (IOException ignored) { }
        File part = request.part; if (part != null) part.delete();
    }
    private void check(Request request, long epoch) throws DownloadException {
        if (request.timedOut) throw new DownloadException(Failure.TIMEOUT);
        if (request.cancelled || Thread.currentThread().isInterrupted() || session.epoch() != epoch)
            throw new DownloadException(Failure.CANCELLED);
    }
    private static void report(Consumer<Progress> consumer, long downloaded, long total) {
        if (consumer != null) consumer.accept(new Progress(downloaded, total));
    }

    static String checkedUrl(String value, String base) throws DownloadException {
        if (value == null || value.isEmpty() || value.length() > 8192) throw new DownloadException(Failure.UNSUPPORTED_URL);
        try {
            URI parsed = new URI(value);
            URI uri = parsed;
            if (base != null) {
                URI parent = new URI(base);
                // Java URI.resolve treats a query-only location as a sibling directory. HTTP
                // redirects instead retain this resource path; raw components preserve signatures.
                uri = value.startsWith("?")
                        ? new URI(parent.getScheme() + "://" + parent.getRawAuthority() + parent.getRawPath() + value)
                        : parent.resolve(parsed);
            }
            String host = uri.getHost(), scheme = uri.getScheme();
            if (host == null || uri.getUserInfo() != null || uri.getFragment() != null || host.equalsIgnoreCase("localhost")
                    || host.equals("127.0.0.1") || host.equals("[::1]")) throw new IllegalArgumentException();
            boolean secure = "https".equalsIgnoreCase(scheme) && (uri.getPort() == -1 || uri.getPort() == 443);
            boolean providerHttp = base != null && "http".equalsIgnoreCase(scheme) && (uri.getPort() == -1 || uri.getPort() == 80)
                    && (providerHost(host, "music.126.net") || providerHost(host, "kuwo.cn"));
            if (!secure && !providerHttp) throw new IllegalArgumentException();
            return uri.toASCIIString(); // Preserve raw escaped paths and signed query bytes.
        } catch (Exception invalid) { throw new DownloadException(Failure.UNSUPPORTED_URL); }
    }
    private static boolean providerHost(String host, String provider) {
        String lower = host.toLowerCase(java.util.Locale.ROOT);
        return lower.equals(provider) || lower.endsWith("." + provider);
    }
    private static boolean textResponse(byte[] bytes, int length) {
        int start = length >= 3 && (bytes[0] & 255) == 239 && (bytes[1] & 255) == 187 && (bytes[2] & 255) == 191 ? 3 : 0;
        while (start < length && (bytes[start] == ' ' || bytes[start] == '\n' || bytes[start] == '\r' || bytes[start] == '\t')) start++;
        if (start >= length) return false;
        int first = bytes[start] & 255;
        if (first == '<' || first == '{' || first == '[') return true;
        String text = new String(bytes, start, length - start, StandardCharsets.US_ASCII);
        return text.startsWith("#EXTM3U") || text.startsWith("#EXTINF") || text.startsWith("[playlist]");
    }

    /** Validate container/frame signatures, not URL suffixes or sometimes inaccurate response MIME. */
    static boolean supportedAudio(File file) throws IOException {
        try (RandomAccessFile input = new RandomAccessFile(file, "r")) {
            long length = input.length();
            if (length < 12) return false;
            byte[] header = new byte[(int) Math.min(64, length)]; input.readFully(header);
            if (ascii(header, 0, "fLaC")) return length >= 42 && (header[4] & 127) == 0 && header[5] == 0 && header[6] == 0 && header[7] == 34;
            if (ascii(header, 0, "RIFF") && ascii(header, 8, "WAVE")) return length >= 44;
            if (ascii(header, 4, "ftyp")) {
                long box = (header[0] & 255L) << 24 | (header[1] & 255L) << 16 | (header[2] & 255L) << 8 | header[3] & 255L;
                return box >= 16 && box <= length;
            }
            if (ascii(header, 0, "OggS") && header[4] == 0 && length >= 28) {
                int segments = header[26] & 255; long packet = 27L + segments;
                if (segments == 0 || packet + 8 > length) return false;
                byte[] signature = new byte[8]; input.seek(packet); input.readFully(signature);
                return ascii(signature, 0, "OpusHead") || signature[0] == 1 && ascii(signature, 1, "vorbis") || ascii(signature, 0, "Speex   ");
            }
            if (ascii(header, 0, "#!AMR\n") || ascii(header, 0, "#!AMR-WB\n")) return true;
            long audioOffset = 0;
            if (ascii(header, 0, "ID3")) {
                if (header[3] < 2 || header[3] > 4 || header[4] == (byte) 255) return false;
                long tag = 0;
                for (int i = 6; i < 10; i++) { if ((header[i] & 128) != 0) return false; tag = tag << 7 | header[i] & 127; }
                long offset = 10 + tag + (header[3] == 4 && (header[5] & 16) != 0 ? 10 : 0);
                if (offset + 7 > length) return false;
                audioOffset = offset; input.seek(offset); input.readFully(header, 0, 7);
            }
            return mpegFrame(header, length - audioOffset) || adtsFrame(header, length - audioOffset);
        }
    }
    private static boolean mpegFrame(byte[] bytes, long remaining) {
        int b1 = bytes[1] & 255, b2 = bytes[2] & 255, version = b1 >> 3 & 3, layer = b1 >> 1 & 3, bitrateIndex = b2 >> 4;
        if ((bytes[0] & 255) != 255 || (b1 & 224) != 224 || version == 1 || layer == 0
                || bitrateIndex == 0 || bitrateIndex == 15 || (b2 >> 2 & 3) == 3) return false;
        int[][] mpeg1 = {{32,40,48,56,64,80,96,112,128,160,192,224,256,320},
                {32,48,56,64,80,96,112,128,160,192,224,256,320,384},
                {32,64,96,128,160,192,224,256,288,320,352,384,416,448}};
        int[] lowLayer1 = {32,48,56,64,80,96,112,128,144,160,176,192,224,256};
        int[] lowOther = {8,16,24,32,40,48,56,64,80,96,112,128,144,160};
        int bitrate = (version == 3 ? mpeg1[layer - 1] : layer == 3 ? lowLayer1 : lowOther)[bitrateIndex - 1] * 1000;
        int sampleRate = new int[]{44100,48000,32000}[b2 >> 2 & 3] / (version == 3 ? 1 : version == 2 ? 2 : 4);
        int padding = b2 >> 1 & 1;
        int frame = layer == 3 ? (12 * bitrate / sampleRate + padding) * 4
                : (layer == 1 && version != 3 ? 72 : 144) * bitrate / sampleRate + padding;
        return frame >= 4 && remaining >= frame;
    }
    private static boolean adtsFrame(byte[] bytes, long remaining) {
        int frame = (bytes[3] & 3) << 11 | (bytes[4] & 255) << 3 | (bytes[5] & 224) >> 5;
        int headerSize = (bytes[1] & 1) != 0 ? 7 : 9;
        return (bytes[0] & 255) == 255 && (bytes[1] & 246) == 240 && (bytes[2] >> 2 & 15) < 13
                && frame >= headerSize && remaining >= frame;
    }
    private static boolean ascii(byte[] bytes, int start, String value) {
        if (start + value.length() > bytes.length) return false;
        for (int i = 0; i < value.length(); i++) if ((bytes[start + i] & 255) != value.charAt(i)) return false;
        return true;
    }
}
