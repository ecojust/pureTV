package com.ecojust.bilitv;

import android.text.Html;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

/** Search and playback use the viewer's normal Bilibili session and granted qualities. */
public class VideoApi {
    public static final class Video {
        public final String bvid, title, author, cover;
        public final long aid, cid, positionSeconds;
        public final int durationSeconds;
        public Video(String bvid, long aid, String title, String author, String cover, int durationSeconds) {
            this(bvid, aid, title, author, cover, durationSeconds, 0, 0);
        }
        public Video(String bvid, long aid, String title, String author, String cover, int durationSeconds, long cid, long positionSeconds) {
            this.bvid = bvid; this.aid = aid; this.title = title; this.author = author; this.cover = cover;
            this.durationSeconds = Math.max(0, durationSeconds); this.cid = Math.max(0, cid); this.positionSeconds = Math.max(0, positionSeconds);
        }
    }
    public static final class SearchPage {
        public final List<Video> items;
        public final int page;
        public final boolean hasMore;
        public SearchPage(List<Video> items, int page, boolean hasMore) {
            this.items = Collections.unmodifiableList(new ArrayList<>(items)); this.page = page; this.hasMore = hasMore;
        }
    }
    public static final class Part {
        public final long cid;
        public final int page, durationSeconds;
        public final String title;
        public Part(long cid, int page, String title, int durationSeconds) { this.cid = cid; this.page = page; this.title = title; this.durationSeconds = Math.max(0, durationSeconds); }
    }
    public static final class Detail {
        public final Video video;
        public final String description;
        public final List<Part> parts;
        public Detail(Video video, String description, List<Part> parts) {
            this.video = video; this.description = description; this.parts = Collections.unmodifiableList(new ArrayList<>(parts));
        }
    }
    public static final class Segment {
        public final String url;
        public final List<String> backupUrls;
        public final long durationMs;
        public Segment(String url, List<String> backupUrls, long durationMs) {
            this.url = url; this.backupUrls = Collections.unmodifiableList(new ArrayList<>(backupUrls)); this.durationMs = Math.max(0, durationMs);
        }
    }
    public static final class Playback {
        public final List<Segment> segments;
        public final String videoUrl, audioUrl;
        public final int quality;
        public final long durationMs;
        public final Map<String,String> headers;
        public Playback(List<Segment> segments, String videoUrl, String audioUrl, int quality, long durationMs) {
            this.segments = Collections.unmodifiableList(new ArrayList<>(segments));
            this.videoUrl = videoUrl; this.audioUrl = audioUrl; this.quality = quality; this.durationMs = Math.max(0, durationMs);
            this.headers = Collections.unmodifiableMap(BiliHttp.params("User-Agent", BiliHttp.USER_AGENT, "Referer", BiliHttp.REFERER));
        }
    }
    private final BiliHttp http;
    public VideoApi(BiliHttp http) { this.http = http; }
    public SearchPage search(String query, int page) throws IOException {
        if (query == null || query.trim().isEmpty() || query.length() > 256 || page < 1) throw BiliHttp.invalid();
        JSONObject root = http.get("/x/web-interface/search/type", BiliHttp.params("search_type", "video", "keyword", query.trim(), "page", Integer.toString(page), "page_size", "20", "order", "totalrank"));
        return parseSearch(root, page);
    }
    public Detail detail(String bvid) throws IOException {
        requireBvid(bvid);
        return parseDetail(http.get("/x/web-interface/view", BiliHttp.params("bvid", bvid)));
    }
    public Playback play(String bvid, long cid, int quality) throws IOException {
        requireBvid(bvid); if (cid <= 0) throw BiliHttp.invalid();
        // Ask for ordinary AVC/AAC delivery. The service, not the client, grants the actual quality.
        int requested = quality <= 0 ? 64 : quality;
        JSONObject root = http.getWbi("/x/player/wbi/playurl", BiliHttp.params("bvid", bvid, "cid", Long.toString(cid),
            "qn", Integer.toString(requested), "fnval", "0", "fnver", "0", "fourk", "0"));
        JSONObject data = data(root);
        rejectPreview(data);
        JSONArray progressive = data.optJSONArray("durl");
        if ((progressive == null || progressive.length() == 0) && data.optJSONObject("dash") == null) {
            // Some videos only expose DASH; this is a format negotiation, never a quality/auth bypass.
            root = http.getWbi("/x/player/wbi/playurl", BiliHttp.params("bvid", bvid, "cid", Long.toString(cid),
                "qn", Integer.toString(requested), "fnval", "16", "fnver", "0", "fourk", "0"));
        }
        return parsePlayback(root, requested);
    }
    static SearchPage parseSearch(JSONObject root, int requestedPage) throws IOException {
        JSONObject data = data(root); JSONArray result = data.optJSONArray("result");
        if (result == null && data.optInt("numResults", -1) != 0) throw BiliHttp.invalid();
        List<Video> items = new ArrayList<>();
        if (result != null) for (int i = 0; i < result.length(); i++) {
            JSONObject item = result.optJSONObject(i);
            if (item == null || !"video".equals(item.optString("type", "video")) || advertised(item)) continue;
            String bvid = item.optString("bvid");
            if (!validBvid(bvid)) continue;
            items.add(new Video(bvid, item.optLong("aid", item.optLong("id")), text(item.optString("title")),
                text(item.optString("author")), coverUrl(item.optString("pic")), duration(item.optString("duration"))));
        }
        int page = Math.max(1, data.optInt("page", requestedPage));
        int totalPages = data.optInt("numPages", -1);
        boolean more = totalPages >= 0 ? page < totalPages : result != null && result.length() >= data.optInt("pagesize", 20);
        return new SearchPage(items, page, more);
    }
    static Detail parseDetail(JSONObject root) throws IOException {
        JSONObject item = data(root);
        String bvid = item.optString("bvid"); requireBvid(bvid);
        JSONObject owner = item.optJSONObject("owner");
        Video video = new Video(bvid, item.optLong("aid"), text(item.optString("title")), owner == null ? "" : text(owner.optString("name")),
            coverUrl(item.optString("pic")), item.optInt("duration"), item.optLong("cid"), 0);
        JSONArray pages = item.optJSONArray("pages"); List<Part> parts = new ArrayList<>();
        if (pages != null) for (int i = 0; i < pages.length(); i++) {
            JSONObject part = pages.optJSONObject(i);
            if (part != null && part.optLong("cid") > 0) parts.add(new Part(part.optLong("cid"), part.optInt("page", i + 1), text(part.optString("part")), part.optInt("duration")));
        }
        if (parts.isEmpty() && video.cid > 0) parts.add(new Part(video.cid, 1, video.title, video.durationSeconds));
        if (parts.isEmpty()) throw BiliHttp.invalid();
        return new Detail(video, text(item.optString("desc")), parts);
    }
    static Playback parsePlayback(JSONObject root, int requested) throws IOException {
        JSONObject value = data(root);
        rejectPreview(value);
        List<Segment> segments = new ArrayList<>(); JSONArray urls = value.optJSONArray("durl");
        if (urls != null && urls.length() > 0) {
            if (urls.length() > 128) throw BiliHttp.invalid();
            for (int i = 0; i < urls.length(); i++) {
                JSONObject part = urls.optJSONObject(i); if (part == null) throw BiliHttp.invalid();
                List<String> backups = new ArrayList<>(); JSONArray alternate = part.optJSONArray("backup_url");
                if (alternate != null) for (int j = 0; j < Math.min(8, alternate.length()); j++) {
                    try { backups.add(mediaUrl(alternate.optString(j))); } catch (IOException ignored) { /* Optional unusable backup. */ }
                }
                segments.add(new Segment(mediaUrl(part.optString("url")), backups, part.optLong("length")));
            }
            return new Playback(segments, "", "", value.optInt("quality", requested), value.optLong("timelength"));
        }
        JSONObject dash = value.optJSONObject("dash"); if (dash == null) throw BiliHttp.invalid();
        JSONObject video = selectTrack(dash.optJSONArray("video"), requested, true);
        JSONObject audio = selectTrack(dash.optJSONArray("audio"), requested, false);
        if (video == null || audio == null) throw new BiliHttp.ApiException(BiliHttp.Kind.RESTRICTED, 0, "No compatible AVC/AAC stream is available");
        long durationMs = value.optLong("timelength", (long)(dash.optDouble("duration", 0) * 1000));
        return new Playback(segments, trackUrl(video), trackUrl(audio), video.optInt("id", requested), durationMs);
    }
    private static JSONObject selectTrack(JSONArray tracks, int requested, boolean video) {
        JSONObject best = null; if (tracks == null) return null;
        for (int i = 0; i < tracks.length(); i++) {
            JSONObject track = tracks.optJSONObject(i); if (track == null) continue;
            String codecs = track.optString("codecs", "").toLowerCase(java.util.Locale.US);
            if (video && !(codecs.startsWith("avc1") || (codecs.isEmpty() && track.optInt("codecid") == 7))) continue;
            if (!video && !codecs.startsWith("mp4a")) continue;
            int quality = track.optInt("id");
            if (video && quality > requested) continue;
            if (best == null || (video && quality > best.optInt("id")) ||
                ((!video || quality == best.optInt("id")) && track.optLong("bandwidth") > best.optLong("bandwidth"))) best = track;
        }
        return best;
    }
    private static String trackUrl(JSONObject track) throws IOException { return mediaUrl(track.optString("baseUrl", track.optString("base_url"))); }
    private static void rejectPreview(JSONObject value) throws IOException {
        if (value.optBoolean("is_preview") || value.optInt("is_preview") == 1)
            throw new BiliHttp.ApiException(BiliHttp.Kind.RESTRICTED, 0, "Only a preview is available for this account");
    }
    private static JSONObject data(JSONObject root) throws IOException {
        BiliHttp.checked(root); JSONObject result = root.optJSONObject("data"); if (result == null) throw BiliHttp.invalid(); return result;
    }
    static boolean advertised(JSONObject value) {
        return value.optBoolean("is_ad") || value.optInt("is_ad") == 1 || value.optBoolean("is_ad_loc") || value.optInt("is_ad_loc") == 1
            || (value.has("ad_info") && !value.isNull("ad_info"));
    }
    static String text(String input) { return Html.fromHtml(input == null ? "" : input).toString().replace('\u00a0', ' ').trim(); }
    static int duration(String input) {
        if (input == null || !input.matches("[0-9]{1,6}(:[0-9]{1,2}){0,2}")) return 0;
        long seconds = 0; for (String part : input.split(":")) seconds = seconds * 60 + Integer.parseInt(part);
        return (int)Math.min(Integer.MAX_VALUE, seconds);
    }
    static boolean validBvid(String bvid) { return bvid != null && bvid.matches("BV[0-9A-Za-z]{10}"); }
    static void requireBvid(String bvid) throws IOException { if (!validBvid(bvid)) throw BiliHttp.invalid(); }
    static String coverUrl(String url) {
        if (url.startsWith("//")) url = "https:" + url;
        if (url.startsWith("http://")) url = "https://" + url.substring(7);
        try {
            URI uri = new URI(url); String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getUserInfo() != null || host == null || uri.getFragment() != null
                || (uri.getPort() != -1 && uri.getPort() != 443)) return "";
            host = host.toLowerCase(java.util.Locale.US);
            return host.endsWith(".hdslb.com") || host.endsWith(".biliimg.com") ? uri.toASCIIString() : "";
        } catch (URISyntaxException error) { return ""; }
    }
    public static String mediaUrl(String url) throws IOException {
        if (url == null || url.length() > 16384) throw BiliHttp.invalid();
        try {
            URI uri = new URI(url); String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null || uri.getUserInfo() != null || uri.getFragment() != null
                || (uri.getPort() != -1 && uri.getPort() != 443)) throw BiliHttp.invalid();
            host = host.toLowerCase(java.util.Locale.US);
            if (!(host.endsWith(".bilivideo.com") || host.endsWith(".bilivideo.cn") || host.endsWith(".akamaized.net")
                || host.endsWith(".hdslb.com") || host.endsWith(".bcache.com"))) throw BiliHttp.invalid();
            return uri.toASCIIString();
        } catch (URISyntaxException error) { throw BiliHttp.invalid(); }
    }
}
