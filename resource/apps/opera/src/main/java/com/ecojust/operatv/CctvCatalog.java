package com.ecojust.operatv;

import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Public CCTV column listings and on-demand playback resolution; call off the UI thread. */
public class CctvCatalog {
    static final int PAGE_SIZE = 20, MAX_PAGES = 50, MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
    private static final List<Column> COLUMNS = Collections.unmodifiableList(Arrays.asList(
            new Column("TOPC1451558856402351", "空中剧院", "Opera Theatre"),
            new Column("TOPC1508747509633692", "角儿来了", "Opera Stars"),
            new Column("TOPC1451558178940505", "跟我学", "Learn Opera"),
            new Column("TOPC1451558484007800", "梨园闯关我挂帅", "Opera Challenge"),
            new Column("TOPC1579401761622774", "名家书场", "Storytelling Masters")));

    interface Fetcher { String get(String url) throws IOException; }
    private final Fetcher fetcher;
    public CctvCatalog() { this(url -> OperaHttp.get(url, MAX_RESPONSE_BYTES)); }
    CctvCatalog(Fetcher fetcher) { this.fetcher = fetcher; }

    public static final class Column {
        public final String id, title, titleEn;
        public Column(String id, String title, String titleEn) { this.id = id; this.title = title; this.titleEn = titleEn; }
    }
    public static final class Page {
        public final List<OperaItem> items;
        public final boolean hasMore;
        public Page(List<OperaItem> items, boolean hasMore) {
            this.items = Collections.unmodifiableList(new ArrayList<>(items)); this.hasMore = hasMore;
        }
    }
    public static final class PlaybackSource {
        public final String url;
        public final Map<String,String> headers;
        public PlaybackSource(String url, Map<String,String> headers) {
            this.url = url; this.headers = Collections.unmodifiableMap(new LinkedHashMap<>(headers));
        }
    }

    public static List<Column> columns() { return COLUMNS; }

    public Page load(String columnId, int page) throws IOException {
        Column selected = null;
        for (Column column : COLUMNS) if (column.id.equals(columnId)) selected = column;
        if (selected == null) throw new IOException("Unknown opera column");
        if (page < 1 || page > MAX_PAGES) throw new IOException("Invalid catalog page");
        String url = "https://api.cntv.cn/NewVideo/getVideoListByColumn?id=" + selected.id
                + "&n=" + PAGE_SIZE + "&sort=desc&p=" + page + "&mode=0&serviceId=tvcctv";
        return parsePage(fetcher.get(url), selected, page);
    }

    static Page parsePage(String json, Column column, int page) throws IOException {
        JSONObject root = object(json);
        JSONObject data = root.optJSONObject("data");
        JSONArray rows = data == null ? null : data.optJSONArray("list");
        if (rows == null) throw new IOException("The program service did not return a catalog");
        if (rows.length() > PAGE_SIZE) throw new IOException("The program service returned too many items");
        long total = data.optLong("total", -1);
        if (total < 0) throw new IOException("The program service returned an invalid catalog count");
        Map<String,OperaItem> valid = new LinkedHashMap<>();
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row == null) continue;
            try {
                String guid = requiredString(row, "guid").toLowerCase(Locale.ROOT);
                String pageUrl = OperaItem.officialPage(requiredString(row, "url"));
                String image = optionalString(row, "image");
                if (!image.isEmpty()) {
                    try {
                        URI imageUri = URI.create(OperaItem.networkUri(image));
                        String host = imageUri.getHost().toLowerCase(Locale.ROOT);
                        if (!"https".equalsIgnoreCase(imageUri.getScheme()) || !host.endsWith(".cctvpic.com")) image = "";
                    } catch (IllegalArgumentException ignored) { image = ""; }
                }
                OperaItem item = new OperaItem("cctv:" + guid, requiredString(row, "title"), column.title,
                        image, "cctv", guid, pageUrl);
                valid.put(item.id, item);
            } catch (IllegalArgumentException | JSONException invalid) { /* Skip malformed individual entries, never construct null items. */ }
        }
        if (rows.length() > 0 && valid.isEmpty()) throw new IOException("The program service returned no valid programs");
        boolean hasMore = page < MAX_PAGES && rows.length() == PAGE_SIZE && (long) page * PAGE_SIZE < total;
        return new Page(new ArrayList<>(valid.values()), hasMore);
    }

    public PlaybackSource resolve(OperaItem item) throws IOException {
        if (item == null) throw new IOException("No program was selected");
        if (!"cctv".equals(item.kind)) {
            // Revalidate serialized references before returning them to the native player.
            try { OperaItem.fromJson(item.toJson()); }
            catch (JSONException invalid) { throw new IOException("Invalid media source", invalid); }
            return new PlaybackSource(item.uri, Collections.emptyMap());
        }
        if (!item.uri.matches("[0-9a-f]{32}")) throw new IOException("Invalid CCTV video ID");
        JSONObject video = object(fetcher.get("https://vdn.apps.cntv.cn/api/getHttpVideoInfo.do?pid=" + item.uri));
        // These public API flags are present in the verified response. Missing flags fail closed.
        if (!"yes".equals(video.optString("ack")) || !"1".equals(flag(video, "public"))
                || !"1".equals(flag(video, "play")) || !"0".equals(flag(video, "is_protected"))
                || !"0".equals(flag(video, "is_invalid_copyright")) || !"0".equals(flag(video, "is_preview"))) {
            throw new IOException("This program is currently unavailable for public playback");
        }
        final String stream;
        try {
            stream = OperaItem.networkUri(requiredString(video, "hls_url"));
            URI parsed = URI.create(stream);
            if (!"https".equalsIgnoreCase(parsed.getScheme())) throw new IllegalArgumentException("HTTPS required");
            if (parsed.getFragment() != null) throw new IllegalArgumentException("Invalid stream fragment");
        } catch (IllegalArgumentException | JSONException invalid) {
            throw new IOException("The program service did not provide a secure playback address", invalid);
        }
        Map<String,String> headers = new LinkedHashMap<>();
        headers.put("Referer", item.pageUrl.isEmpty() ? "https://tv.cctv.com/" : item.pageUrl);
        headers.put("User-Agent", "OperaTV/0.1.0 (Android)");
        return new PlaybackSource(stream, headers);
    }

    private static JSONObject object(String json) throws IOException {
        if (json == null || json.trim().isEmpty() || json.length() > MAX_RESPONSE_BYTES)
            throw new IOException("The program service returned an empty or oversized response");
        int depth = 0;
        boolean quoted = false, escaped = false;
        for (int i = 0; i < json.length(); i++) {
            char c = json.charAt(i);
            if (quoted) {
                if (escaped) escaped = false;
                else if (c == '\\') escaped = true;
                else if (c == '"') quoted = false;
            } else if (c == '"') quoted = true;
            else if (c == '{' || c == '[') {
                if (++depth > 32) throw new IOException("The program service returned excessively nested JSON");
            } else if (c == '}' || c == ']') {
                if (--depth < 0) throw new IOException("The program service returned invalid JSON");
            }
        }
        if (quoted || depth != 0) throw new IOException("The program service returned incomplete JSON");
        try {
            JSONTokener parser = new JSONTokener(json);
            Object value = parser.nextValue();
            if (!(value instanceof JSONObject) || parser.nextClean() != 0) throw new JSONException("Expected a single JSON object");
            return (JSONObject) value;
        }
        catch (JSONException malformed) { throw new IOException("The program service returned invalid JSON", malformed); }
    }
    private static String requiredString(JSONObject object, String name) throws JSONException {
        Object value = object.opt(name);
        if (!(value instanceof String) || ((String) value).trim().isEmpty()) throw new JSONException("Missing " + name);
        return (String) value;
    }
    private static String optionalString(JSONObject object, String name) {
        Object value = object.opt(name);
        return value instanceof String ? (String) value : "";
    }
    private static String flag(JSONObject object, String name) {
        Object value = object.opt(name);
        return value instanceof String || value instanceof Number ? value.toString() : "";
    }
}
