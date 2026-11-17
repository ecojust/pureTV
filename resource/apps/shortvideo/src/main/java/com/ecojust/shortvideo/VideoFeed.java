package com.ecojust.shortvideo;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;

/** Small public JSON requests only. No credentials, video downloads or on-disk cache. */
final class VideoFeed implements FeedController.Loader {
    enum Source {
        KULEU(R.string.source_kuleu, "https://api.kuleu.com/api/MP4_xiaojiejie?type=json"),
        DWO(R.string.source_dwo, "https://openapi.dwo.cc/api/4qb_sp");
        final int label;
        final String endpoint;
        Source(int label, String endpoint) { this.label = label; this.endpoint = endpoint; }
        static Source from(String name) {
            try { return valueOf(name); } catch (IllegalArgumentException | NullPointerException e) { return KULEU; }
        }
    }
    /** The UI resolves this resource using its current locale, without exposing platform errors. */
    static final class FeedException extends IOException {
        final int message;
        final Object[] arguments;
        FeedException(int message, Object... arguments) {
            super("Video source error (resource " + message + ")");
            this.message = message; this.arguments = arguments;
        }
    }
    static final class Clip {
        final String url;
        final Source source;
        Clip(String url, Source source) throws IOException {
            this.url = safeUrl(url); this.source = source;
        }
        String key() {
            // The configured providers identify the MP4 by its CDN host/path, not cache query parameters.
            URI uri = URI.create(url); return uri.getHost() + uri.getRawPath();
        }
    }
    interface Connections { HttpURLConnection open(String url) throws IOException; }
    private final Connections connections;
    private volatile HttpURLConnection connection;
    VideoFeed() { this(address -> (HttpURLConnection) new URL(address).openConnection()); }
    VideoFeed(Connections connections) { this.connections = connections; }

    @Override public Clip fetch(Source source) throws IOException {
        try { return parse(source, request(source.endpoint)); }
        catch (JSONException e) { throw new FeedException(R.string.feed_invalid_json); }
    }
    static Clip parse(Source source, JSONObject response) throws IOException {
        if (response.optInt("code") != 200) throw new FeedException(R.string.feed_error);
        String url;
        if (source == Source.KULEU) url = response.optString("mp4_video");
        else {
            JSONObject data = response.optJSONObject("data");
            JSONObject video = data == null ? null : data.optJSONObject("video");
            url = video == null ? "" : video.optString("url");
        }
        return new Clip(url, source);
    }
    static String safeUrl(String value) throws IOException {
        if (value == null || value.isEmpty() || value.length() > 8192) throw new FeedException(R.string.feed_invalid_url);
        try {
            URI uri = new URI(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null)
                throw new FeedException(R.string.feed_unsafe_url);
            return uri.toASCIIString();
        } catch (URISyntaxException e) { throw new FeedException(R.string.feed_malformed_url); }
    }
    private JSONObject request(String address) throws IOException, JSONException {
        for (int redirects = 0; redirects <= 3; redirects++) {
            checkCancelled();
            HttpURLConnection current = connections.open(safeUrl(address));
            connection = current;
            current.setConnectTimeout(8000); current.setReadTimeout(8000); current.setInstanceFollowRedirects(false);
            current.setRequestProperty("User-Agent", "ShortVideoTV/0.1.0 (Android)");
            current.setRequestProperty("Accept", "application/json"); current.setRequestProperty("Cache-Control", "no-cache");
            long deadline = System.nanoTime() + 16_000_000_000L;
            try {
                checkCancelled(); int status = current.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = current.getHeaderField("Location");
                    if (location == null) throw new FeedException(R.string.feed_invalid_redirect);
                    address = new URL(current.getURL(), location).toString(); continue;
                }
                if (status != 200) throw status == 429 ? new FeedException(R.string.feed_rate_limited) : new FeedException(R.string.feed_http_error, status);
                if (current.getContentLengthLong() > 65536) throw new FeedException(R.string.feed_too_large);
                try (InputStream input = current.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[4096]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        checkCancelled();
                        if (System.nanoTime() > deadline) throw new FeedException(R.string.feed_timeout);
                        if (output.size() + count > 65536) throw new FeedException(R.string.feed_too_large);
                        output.write(buffer, 0, count);
                    }
                    return new JSONObject(output.toString("UTF-8"));
                }
            } finally { if (connection == current) connection = null; current.disconnect(); }
        }
        throw new FeedException(R.string.feed_too_many_redirects);
    }
    private static void checkCancelled() throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new FeedException(R.string.feed_cancelled);
    }
    @Override public void cancel() { HttpURLConnection current = connection; if (current != null) current.disconnect(); }
}
