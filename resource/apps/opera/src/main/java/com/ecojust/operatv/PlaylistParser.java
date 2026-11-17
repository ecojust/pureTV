package com.ecojust.operatv;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Parses a bounded user-selected catalogue. HLS is a media source, not a catalogue. */
public final class PlaylistParser {
    public static final int MAX_BYTES = 1024 * 1024;
    public static final int MAX_ITEMS = 500;
    private static final int MAX_LINE = 8192;
    private static final Pattern GROUP = Pattern.compile("(?:^|\\s)group-title=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE);

    private PlaylistParser() {}

    public static List<OperaItem> parse(String text, String baseUrl) throws IOException {
        if (text == null || text.length() > MAX_BYTES || text.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw error("片单超过 1 MiB，未导入。", "Playlist exceeds 1 MiB; nothing was imported.");
        }
        String source = text.startsWith("\ufeff") ? text.substring(1) : text;
        source = source.trim();
        if (source.isEmpty()) throw error("片单内容为空。", "The playlist is empty.");
        if (source.indexOf('\0') >= 0) throw error("片单不是有效的 UTF-8 文本。", "The playlist is not valid UTF-8 text.");
        if (isHls(source)) {
            if (!source.startsWith("#EXTM3U\n") && !source.startsWith("#EXTM3U\r\n")) {
                throw error("HLS 媒体清单缺少有效的 EXTM3U 标记。", "The HLS manifest is missing a valid EXTM3U header.");
            }
            if (baseUrl == null || baseUrl.isEmpty()) {
                throw error("这是本地 HLS 媒体清单，请添加它的网络 m3u8 地址。", "This is a local HLS manifest. Add its online m3u8 address instead.");
            }
            String address = resolveUrl(baseUrl, null);
            List<OperaItem> one = new ArrayList<>();
            one.add(makeItem(nameFromUrl(address), address, localGroup()));
            return one;
        }
        return source.startsWith("[") || source.startsWith("{") ? parseJson(source, baseUrl) : parseM3u(source, baseUrl);
    }

    static boolean isHls(String text) {
        for (String line : text.split("\\r?\\n")) {
            if (line.trim().startsWith("#EXT-X-")) return true;
        }
        return false;
    }

    private static List<OperaItem> parseJson(String text, String baseUrl) throws IOException {
        checkJsonDepth(text);
        try {
            JSONTokener tokener = new JSONTokener(text);
            Object value = tokener.nextValue();
            if (tokener.nextClean() != 0) throw new JSONException("Trailing JSON content");
            JSONArray array;
            if (value instanceof JSONArray) array = (JSONArray) value;
            else if (value instanceof JSONObject && ((JSONObject) value).opt("items") instanceof JSONArray) {
                array = ((JSONObject) value).getJSONArray("items");
            } else throw new JSONException("Expected an array or an items array");
            if (array.length() > MAX_ITEMS) throw error("每次最多导入 500 个节目。", "Import at most 500 items at a time.");
            LinkedHashMap<String, OperaItem> result = new LinkedHashMap<>();
            for (int index = 0; index < array.length(); index++) {
                Object row = array.get(index);
                if (!(row instanceof JSONObject)) throw new JSONException("Each item must be an object");
                JSONObject item = (JSONObject) row;
                String url = string(item, "url", true);
                String address = resolveUrl(url, baseUrl);
                String title = string(item, "title", false);
                String group = string(item, "group", false);
                OperaItem parsed = makeItem(title.isEmpty() ? nameFromUrl(address) : title, address,
                        group.isEmpty() ? localGroup() : group);
                result.put(parsed.id, parsed);
            }
            return nonempty(result);
        } catch (JSONException | IllegalArgumentException invalid) {
            throw error("JSON 片单格式有误；每项需有字符串 url，可选 title 和 group。", "Invalid JSON playlist. Each item needs a string url; title and group are optional strings.");
        }
    }

    static void checkJsonDepth(String text) throws IOException {
        int depth = 0;
        boolean quoted = false, escaped = false;
        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (quoted) {
                if (escaped) escaped = false;
                else if (c == '\\') escaped = true;
                else if (c == '"') quoted = false;
            } else if (c == '"') quoted = true;
            else if (c == '[' || c == '{') {
                if (++depth > 24) throw error("JSON 片单嵌套过深，未导入。", "The JSON playlist is nested too deeply; nothing was imported.");
            } else if (c == ']' || c == '}') {
                if (--depth < 0) throw error("JSON 片单格式有误，未导入。", "The JSON playlist is malformed; nothing was imported.");
            }
        }
    }

    private static String string(JSONObject item, String key, boolean required) throws JSONException {
        if (!item.has(key)) {
            if (required) throw new JSONException("Missing " + key);
            return "";
        }
        Object value = item.get(key);
        if (!(value instanceof String)) throw new JSONException("Expected string " + key);
        return ((String) value).trim();
    }

    private static List<OperaItem> parseM3u(String text, String baseUrl) throws IOException {
        LinkedHashMap<String, OperaItem> result = new LinkedHashMap<>();
        String title = "", group = "";
        boolean pending = false;
        int entries = 0;
        for (String raw : text.split("\\r?\\n")) {
            String line = raw.trim();
            if (line.length() > MAX_LINE) throw error("片单单行过长，未导入。", "A playlist line is too long; nothing was imported.");
            if (line.isEmpty()) continue;
            if (line.startsWith("#EXTINF:")) {
                if (pending) throw error("片单中有节目缺少播放地址。", "An item in the playlist has no media address.");
                int comma = unquotedComma(line);
                if (comma < 0) throw error("EXTINF 行缺少节目名称分隔符。", "An EXTINF line is missing its title separator.");
                title = line.substring(comma + 1).trim();
                Matcher matcher = GROUP.matcher(line.substring(0, comma));
                group = matcher.find() ? matcher.group(1).trim() : "";
                pending = true;
                continue;
            }
            if (line.startsWith("#EXTGRP:")) {
                group = line.substring(8).trim();
                continue;
            }
            if (line.startsWith("#")) continue;
            if (++entries > MAX_ITEMS) throw error("每次最多导入 500 个节目。", "Import at most 500 items at a time.");
            String address = resolveUrl(line, baseUrl);
            OperaItem item = makeItem(title.isEmpty() ? nameFromUrl(address) : title, address,
                    group.isEmpty() ? localGroup() : group);
            result.put(item.id, item);
            title = ""; group = ""; pending = false;
        }
        if (pending) throw error("片单最后一个节目缺少播放地址。", "The final playlist item has no media address.");
        return nonempty(result);
    }

    private static int unquotedComma(String line) {
        boolean quoted = false;
        for (int i = 0; i < line.length(); i++) {
            if (line.charAt(i) == '"') quoted = !quoted;
            else if (line.charAt(i) == ',' && !quoted) return i;
        }
        return -1;
    }

    private static OperaItem makeItem(String title, String url, String group) throws IOException {
        try {
            if (title.length() > 200 || group.length() > 100) throw new IllegalArgumentException("Long label");
            return OperaItem.direct(title, url, group);
        } catch (IllegalArgumentException invalid) {
            throw error("节目名称、分组或播放地址无效。", "An item title, group or media address is invalid.");
        }
    }

    static String resolveUrl(String text, String baseUrl) throws IOException {
        try {
            if (text == null || text.trim().isEmpty() || text.length() > 4096) throw new URISyntaxException("", "Invalid URL length");
            URI uri = new URI(text.trim());
            if (!uri.isAbsolute()) {
                if (baseUrl == null || baseUrl.isEmpty()) {
                    throw error("本地片单中的节目必须使用完整的 http 或 https 地址。", "Items in a local playlist need complete http or https addresses.");
                }
                URI base = new URI(baseUrl);
                validateHttp(base);
                uri = base.resolve(uri);
            }
            validateHttp(uri);
            return uri.toASCIIString();
        } catch (URISyntaxException | IllegalArgumentException invalid) {
            throw error("播放地址只支持有效的 http 或 https 链接。", "Media addresses must be valid http or https links.");
        }
    }

    private static void validateHttp(URI uri) throws URISyntaxException {
        String scheme = uri.getScheme();
        if (!("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                || uri.getHost() == null || uri.getHost().isEmpty() || uri.getRawUserInfo() != null
                || uri.getRawFragment() != null || uri.getPort() < -1 || uri.getPort() > 65535) {
            throw new URISyntaxException("", "Unsupported media URI");
        }
    }

    static String nameFromUrl(String address) {
        try {
            String path = new URI(address).getPath();
            if (path != null && !path.isEmpty() && !path.endsWith("/")) {
                String name = path.substring(path.lastIndexOf('/') + 1);
                return name.length() > 160 ? name.substring(0, 160) : name;
            }
        } catch (URISyntaxException ignored) { /* The caller validates the address. */ }
        return localized("我的视频", "My video");
    }

    private static List<OperaItem> nonempty(LinkedHashMap<String, OperaItem> items) throws IOException {
        if (items.isEmpty()) throw error("片单中没有可导入的节目。", "The playlist contains no items to import.");
        return new ArrayList<>(items.values());
    }

    static String localGroup() { return localized("我的片单", "My playlist"); }
    static String localized(String chinese, String english) {
        return Locale.getDefault().getLanguage().equals("zh") ? chinese : english;
    }
    static IOException error(String chinese, String english) { return new IOException(localized(chinese, english)); }
}
