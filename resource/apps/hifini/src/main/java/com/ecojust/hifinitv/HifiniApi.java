package com.ecojust.hifinitv;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Reads HiFiNi pages with the official-site session and literal metadata; never executes JavaScript. */
final class HifiniApi {
    static final String ORIGIN = "https://www.hifini.net";
    static final String AGENT = "Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
    static final String STAGE_PAGE = "page", STAGE_AUDIO = "audio";
    static final int MAX_RESULTS = 50, MAX_HTML_BYTES = 1024 * 1024;
    private static final Pattern THREAD = Pattern.compile("^/thread-([1-9][0-9]{0,11})\\.htm$");
    private static final Pattern TITLE = Pattern.compile("^(.{1,100}?)\\s*[《「『](.{1,160}?)[》」』]");
    private static final Pattern MUSIC_FORMAT = Pattern.compile("(?i)[\\[【(（][^\\]】)）]{0,80}\\b(?:mp3|flac|aac|m4a|wav|ape|ogg|dsd)\\b[^\\]】)）]{0,80}[\\]】)）]");
    private static final HifiniApi INSTANCE = new HifiniApi();
    interface Responses { String get(String url, String referer, int maximumBytes) throws IOException; }
    private final Responses responses;
    HifiniApi() { this(HifiniApi::fetch); }
    HifiniApi(Responses responses) { this.responses = responses; }
    static HifiniApi get() { return INSTANCE; }

    static final class Resolved {
        final Track track;
        final List<String> audioUrls;
        Resolved(Track track, List<String> audioUrls) {
            this.track = track;
            this.audioUrls = Collections.unmodifiableList(new ArrayList<>(audioUrls));
        }
    }

    List<Track> search(String input) throws IOException {
        String query = input == null ? "" : input.trim();
        if (query.isEmpty() || query.codePointCount(0, query.length()) > 100 || containsControl(query))
            throw new MusicError(R.string.invalid_search);
        if (query.startsWith("https://") || query.startsWith("http://")) {
            String id = threadId(query, ORIGIN + "/");
            if (id == null) throw new MusicError(R.string.unsupported_link);
            // Keep only stable metadata; playback must read the page again for a fresh URL.
            return Collections.singletonList(resolve(new Track(id, id, "", "", 0), value -> {}).track);
        }
        String page = buildSearchUrl(query);
        return parseCatalog(read(page, ORIGIN + "/", MAX_HTML_BYTES), page);
    }

    List<Track> forumSearch(String query) throws IOException {
        String page = buildForumSearchUrl(query);
        return parseList(read(page, ORIGIN + "/", MAX_HTML_BYTES), page);
    }

    static String buildSearchUrl(String query) throws IOException {
        return ORIGIN + "/musicparse-search.htm?keyword=" + encodeKeyword(query, '%');
    }

    static String buildForumSearchUrl(String query) throws IOException {
        return ORIGIN + "/search-" + encodeKeyword(query, '_') + "-1.htm";
    }

    private static String encodeKeyword(String query, char escape) throws IOException {
        String input = query == null ? "" : query.trim();
        if (input.isEmpty() || input.codePointCount(0, input.length()) > 100 || containsControl(input))
            throw new MusicError(R.string.invalid_search);
        StringBuilder encoded = new StringBuilder();
        for (byte value : input.getBytes(StandardCharsets.UTF_8)) {
            int b = value & 255;
            if (b >= 'a' && b <= 'z' || b >= 'A' && b <= 'Z' || b >= '0' && b <= '9') encoded.append((char) b);
            else encoded.append(escape).append("0123456789ABCDEF".charAt(b >>> 4)).append("0123456789ABCDEF".charAt(b & 15));
        }
        return encoded.toString();
    }

    /** Public front-page candidates, not a claim to enumerate the entire site's catalogue. */
    List<Track> discover() throws IOException {
        return parseList(read(ORIGIN + "/", ORIGIN + "/", MAX_HTML_BYTES), ORIGIN + "/");
    }

    Resolved resolve(Track track, Consumer<String> stage) throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new MusicError(R.string.playback_cancelled);
        if (track == null) throw new MusicError(R.string.source_changed);
        if (!track.source.isEmpty()) {
            stage.accept(STAGE_AUDIO);
            return new Resolved(track, Collections.singletonList(buildPlaybackUrl(track)));
        }
        if (track.threadId.isEmpty()) throw new MusicError(R.string.source_changed);
        stage.accept(STAGE_PAGE);
        String page = track.pageUrl();
        Document document = document(read(page, ORIGIN + "/", MAX_HTML_BYTES), page);
        Map<String, String> player = new LinkedHashMap<>();
        for (Element script : document.select("script:not([src])")) {
            player = PlayerLiteral.parse(script.data());
            if (!player.isEmpty()) break;
        }
        String audio = mediaUrl(player.get("url"), page);
        if (audio == null) {
            Element element = document.selectFirst("audio[src], audio source[src]");
            if (element != null) audio = mediaUrl(element.attr("src"), page);
        }
        if (audio == null) {
            if (requiresLogin(document)) throw new MusicError(R.string.source_login_required);
            if (restricted(document)) throw new MusicError(R.string.source_verification);
            throw new MusicError(R.string.no_playable_audio);
        }
        stage.accept(STAGE_AUDIO);
        String pageTitle = "", pageArtist = "";
        Element heading = document.selectFirst("h1");
        if (heading != null) {
            pageTitle = heading.text().trim();
            Matcher song = TITLE.matcher(pageTitle);
            if (song.find()) { pageArtist = song.group(1).trim(); pageTitle = song.group(2).trim(); }
        }
        String title = first(player.get("name"), player.get("title"), pageTitle, track.title);
        String artist = first(player.get("artist"), player.get("author"), pageArtist, track.artist);
        String cover = imageUrl(first(player.get("cover"), player.get("pic"), track.cover), page);
        return new Resolved(track.withMetadata(bounded(title, 200), bounded(artist, 120), cover == null ? "" : cover),
                Collections.singletonList(audio));
    }

    static String buildPlaybackUrl(Track track) throws IOException {
        if (track == null || !("netease".equals(track.source) || "kuwo".equals(track.source))
                || !track.sourceId.matches("[1-9][0-9]{0,19}")) throw new MusicError(R.string.unsupported_link);
        return ORIGIN + "/musicparse-play.htm?source=" + track.source + "&id=" + track.sourceId;
    }

    static List<Track> parseCatalog(String html, String page) throws IOException {
        Document document = document(html, page);
        if (requiresLogin(document)) throw new MusicError(R.string.source_login_required);
        if (restricted(document)) throw new MusicError(R.string.source_verification);
        Map<String, Object> data = null;
        for (Element element : document.select("pre, .card-title")) {
            try { data = PhpArray.parse(element.wholeText()); break; }
            catch (IllegalArgumentException ignored) { /* Try the next observed result container. */ }
        }
        if (data == null) {
            try { data = PhpArray.parse(document.wholeText()); }
            catch (IllegalArgumentException error) { throw new MusicError(R.string.source_changed, error); }
        }
        Map<String, Track> result = new LinkedHashMap<>();
        boolean catalogue = false;
        for (String provider : new String[]{"netease", "kuwo"}) {
            Object group = data.get(provider);
            if (!(group instanceof Map)) continue;
            catalogue = true;
            for (Object entry : ((Map<?, ?>) group).values()) {
                if (!(entry instanceof Map)) continue;
                Map<?, ?> row = (Map<?, ?>) entry;
                String source = scalar(row, "source"), id = scalar(row, "source_id"), title = scalar(row, "title");
                if (!provider.equals(source) || !id.matches("[1-9][0-9]{0,19}") || title.isEmpty()) continue;
                String linkedThread = scalar(row, "tid"), topicUrl = scalar(row, "topic_url");
                if (!linkedThread.matches("[1-9][0-9]{0,11}")) linkedThread = "";
                if (!topicUrl.isEmpty()) {
                    String fromUrl = threadId(topicUrl, page);
                    if (fromUrl == null || !linkedThread.isEmpty() && !linkedThread.equals(fromUrl)) linkedThread = "";
                    else linkedThread = fromUrl;
                }
                long duration = 0;
                String seconds = scalar(row, "duration");
                if (seconds.matches("[0-9]{1,7}")) duration = Long.parseLong(seconds);
                String cover = imageUrl(scalar(row, "cover_url"), page);
                Track track = Track.catalog(source, id, linkedThread, title, scalar(row, "artist"), cover == null ? "" : cover, duration);
                if (!result.containsKey(track.id)) result.put(track.id, track);
                if (result.size() >= MAX_RESULTS) return new ArrayList<>(result.values());
            }
        }
        if (!catalogue) throw new MusicError(R.string.source_changed);
        return new ArrayList<>(result.values());
    }

    private static String scalar(Map<?, ?> row, String key) {
        Object value = row.get(key);
        return value instanceof String ? ((String) value).trim() : "";
    }

    static String imageUrl(String value, String page) {
        if (value != null) {
            try {
                URI uri = new URI(value.trim());
                if ("http".equalsIgnoreCase(uri.getScheme()) && "p1.music.126.net".equalsIgnoreCase(uri.getHost())
                        && uri.getUserInfo() == null && uri.getFragment() == null && (uri.getPort() == -1 || uri.getPort() == 80)) {
                    // HTTPS was verified for the user's actual NetEase cover; do not rewrite other HTTP hosts.
                    value = new URI("https", null, uri.getHost(), -1, uri.getPath(), uri.getQuery(), null).toASCIIString();
                }
            } catch (Exception ignored) { return null; }
        }
        return mediaUrl(value, page);
    }

    private String read(String url, String referer, int maximumBytes) throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new MusicError(R.string.playback_cancelled);
        String text = responses.get(url, referer, maximumBytes);
        if (text == null || text.getBytes(StandardCharsets.UTF_8).length > maximumBytes)
            throw new MusicError(R.string.response_too_large);
        if (Thread.currentThread().isInterrupted()) throw new MusicError(R.string.playback_cancelled);
        return text;
    }

    static List<Track> parseList(String html, String page) throws IOException {
        Document document = document(html, page);
        Map<String, Track> tracks = new LinkedHashMap<>();
        for (Element anchor : document.select(".subject a[href]")) {
            String id = threadId(anchor.attr("href"), page);
            if (id == null || tracks.containsKey(id)) continue;
            String label = anchor.text().trim();
            if (label.isEmpty()) continue;
            String title = label, artist = "";
            Matcher split = TITLE.matcher(label);
            boolean songTitle = split.find();
            // Forum notices and navigation links are not random-play candidates.
            if (!songTitle && !MUSIC_FORMAT.matcher(label).find()) continue;
            if (songTitle) { artist = split.group(1).trim(); title = split.group(2).trim(); }
            tracks.put(id, new Track(id, bounded(title, 200), bounded(artist, 120), "", 0));
            if (tracks.size() >= MAX_RESULTS) break;
        }
        if (tracks.isEmpty() && requiresLogin(document)) throw new MusicError(R.string.source_login_required);
        if (tracks.isEmpty() && restricted(document)) throw new MusicError(R.string.source_verification);
        if (tracks.isEmpty() && document.select(".threadlist, .thread-list, .list-unstyled, .search-results, .empty, .no-results").isEmpty()
                && !document.text().matches("(?s).*(没有找到|暂无相关|无搜索结果|No results|No matching).*"))
            throw new MusicError(R.string.source_changed);
        return new ArrayList<>(tracks.values());
    }

    static String threadId(String value, String page) {
        try {
            URI uri = new URI(page).resolve(value.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || !sourceHost(uri.getHost()) || uri.getUserInfo() != null
                    || uri.getRawQuery() != null || uri.getPort() != -1 && uri.getPort() != 443) return null;
            Matcher matcher = THREAD.matcher(uri.getPath());
            return matcher.matches() ? matcher.group(1) : null;
        } catch (Exception ignored) { return null; }
    }

    static String mediaUrl(String value, String page) {
        if (value == null || value.trim().isEmpty() || value.length() > 8192 || containsControl(value)) return null;
        try {
            URI uri = new URI(page).resolve(value.trim());
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null) return null;
            return uri.toASCIIString();
        } catch (Exception ignored) { return null; }
    }

    private static Document document(String html, String page) throws IOException {
        if (html == null || html.getBytes(StandardCharsets.UTF_8).length > MAX_HTML_BYTES) throw new MusicError(R.string.response_too_large);
        Document document = Jsoup.parse(html, page);
        String title = document.title().toLowerCase(Locale.ROOT);
        if (title.contains("just a moment") || title.contains("access denied") || title.contains("verification required")
                || !document.select("#challenge-form, #challenge-running, script[src*=challenge-platform]").isEmpty())
            throw new MusicError(R.string.source_verification);
        return document;
    }

    private static boolean requiresLogin(Document document) {
        String title = document.title().toLowerCase(Locale.ROOT);
        if (title.contains("登录") || title.contains("log in") || title.contains("login") || title.contains("sign in")) return true;
        if (!document.select("form input[type=password]").isEmpty()) return true;
        for (Element element : document.select(".alert, .message, .notice, .card-body")) {
            if (element.text().matches("(?is).*(请先登录|登录后才能|需要登录|登录后查看|登录后搜索|sign in to view|login required|sign in to search).*")) return true;
        }
        return false;
    }

    static boolean loginPageUrl(String value) {
        try {
            URI uri = new URI(value);
            if (!"https".equalsIgnoreCase(uri.getScheme()) || !sourceHost(uri.getHost())) return false;
            String path = uri.getPath().toLowerCase(Locale.ROOT);
            return path.equals("/user-login.htm") || path.equals("/login.htm") || path.equals("/login");
        } catch (Exception ignored) { return false; }
    }

    private static boolean restricted(Document document) {
        for (Element element : document.select(".alert, .message, .notice, .card-body")) {
            if (element.text().matches("(?s).*(回复后可见|权限不足|访问验证|验证码|verification required).*")) return true;
        }
        return false;
    }

    private static String fetch(String address, String referer, int maximumBytes) throws IOException {
        long sessionEpoch = HifiniSession.epoch();
        String current = address;
        boolean siteRequest = sourceHost(new URL(address).getHost());
        for (int redirect = 0; redirect <= 4; redirect++) {
            if (Thread.currentThread().isInterrupted()) throw new MusicError(R.string.playback_cancelled);
            HttpURLConnection connection = (HttpURLConnection) new URL(current).openConnection();
            connection.setInstanceFollowRedirects(false);
            connection.setConnectTimeout(8000); connection.setReadTimeout(8000);
            connection.setRequestProperty("User-Agent", AGENT);
            connection.setRequestProperty("Referer", referer);
            connection.setRequestProperty("Accept", "text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.5");
            connection.setRequestProperty("Accept-Encoding", "identity");
            String cookie = siteRequest ? HifiniSession.cookieHeader(current, sessionEpoch) : "";
            if (!cookie.isEmpty()) connection.setRequestProperty("Cookie", cookie);
            try {
                int code = connection.getResponseCode();
                for (Map.Entry<String, List<String>> header : connection.getHeaderFields().entrySet()) {
                    if (siteRequest && "Set-Cookie".equalsIgnoreCase(header.getKey())) HifiniSession.acceptCookies(current, header.getValue(), sessionEpoch);
                }
                if (code >= 300 && code < 400) {
                    String location = mediaUrl(connection.getHeaderField("Location"), current);
                    if (location == null || siteRequest && !sourceHost(new URL(location).getHost())) throw new MusicError(R.string.unsupported_link);
                    if (siteRequest && loginPageUrl(location)) throw new MusicError(R.string.source_login_required);
                    current = location; continue;
                }
                if (code == 401) throw new MusicError(R.string.source_login_required);
                if (code == 403) throw new MusicError(R.string.source_verification);
                if (code != 200) throw new MusicError(R.string.source_unavailable, code);
                if (connection.getContentLengthLong() > maximumBytes) throw new MusicError(R.string.response_too_large);
                try (InputStream input = connection.getInputStream(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        if (Thread.currentThread().isInterrupted()) throw new MusicError(R.string.playback_cancelled);
                        if (output.size() + count > maximumBytes) throw new MusicError(R.string.response_too_large);
                        output.write(buffer, 0, count);
                    }
                    return new String(output.toByteArray(), StandardCharsets.UTF_8);
                }
            } finally { connection.disconnect(); }
        }
        throw new MusicError(R.string.source_changed);
    }

    private static boolean sourceHost(String host) { return "hifini.net".equalsIgnoreCase(host) || "www.hifini.net".equalsIgnoreCase(host); }
    private static boolean containsControl(String value) { for (int i=0;i<value.length();i++) if (Character.isISOControl(value.charAt(i))) return true; return false; }
    private static String bounded(String value, int length) { return value.length() <= length ? value : value.substring(0, length); }
    private static String first(String... values) { for (String value : values) if (value != null && !value.trim().isEmpty()) return value.trim(); return ""; }
}
