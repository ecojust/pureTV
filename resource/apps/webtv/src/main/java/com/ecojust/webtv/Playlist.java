package com.ecojust.webtv;

import java.io.*;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.*;

/** Bounded extended-M3U parser. A channel may have up to four HTTP(S) routes. */
final class Playlist {
    static final int MAX_BYTES = 512 * 1024, MAX_CHANNELS = 300, MAX_ROUTES = 4;
    static final String SATELLITE = "卫视", CCTV = "央视", OTHER = "其他";
    private static final Pattern ATTRIBUTE = Pattern.compile("([\\w-]+)=(?:\"([^\"]*)\"|'([^']*)'|([^\\s,]+))");
    static final Map<String,String> DEFAULT_NAMES = new LinkedHashMap<>();
    static {
        String[][] names = {
            {"GuangdongSatelliteTV.cn","广东卫视"},{"HunanTV.cn","湖南卫视"},{"BeijingSatelliteTV.cn","北京卫视"},
            {"ZhejiangSatelliteTV.cn","浙江卫视"},{"JiangsuSatelliteTV.cn","江苏卫视"},{"DragonTVInternational.cn","东方卫视国际版"},
            {"ShenzhenSatelliteTV.cn","深圳卫视"},{"AnhuiTV.cn","安徽卫视"},{"ShandongSatelliteTV.cn","山东卫视"},
            {"ShandongTV.cn","山东卫视"},{"SichuanSatelliteTV.cn","四川卫视"},{"TianjinTV.cn","天津卫视"},
            {"LiaoningTV.cn","辽宁卫视"},{"HeilongjiangTV.cn","黑龙江卫视"},{"HebeiTV.cn","河北卫视"},
            {"JiangxiTV.cn","江西卫视"},{"GuizhouTV.cn","贵州卫视"},{"QinghaiTV.cn","青海卫视"},
            {"YunnanSatelliteTV.cn","云南卫视"},{"NingxiaSatelliteChannel.cn","宁夏卫视"},{"YanbianSatelliteTV.cn","延边卫视"},
            {"BingtuanSatelliteTV.cn","兵团卫视"}
        };
        for (String[] pair : names) DEFAULT_NAMES.put(pair[0], pair[1]);
        for (int n : new int[]{1,2,7,9,10,11,12,13,14,15,17}) DEFAULT_NAMES.put("CCTV"+n+".cn", "CCTV-"+n);
    }
    static final class Channel {
        final String id, name, group;
        final List<String> urls;
        Channel(String id, String name, String group, List<String> urls) {
            this.id = id; this.name = name; this.group = group;
            this.urls = Collections.unmodifiableList(new ArrayList<>(urls));
        }
    }
    static List<Channel> parse(byte[] bytes, boolean defaults) throws IOException {
        if (bytes.length > MAX_BYTES) throw new UiError(R.string.list_size_limit);
        String text = new String(bytes, StandardCharsets.UTF_8).replace("\uFEFF", "");
        if (text.contains("#EXT-X-TARGETDURATION") || text.contains("#EXT-X-STREAM-INF"))
            throw new UiError(R.string.list_is_hls);
        Map<String,Builder> found = new LinkedHashMap<>();
        Map<String,String> attributes = null; String name = null;
        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (Thread.currentThread().isInterrupted()) throw new UiError(R.string.list_cancelled);
                line = line.trim();
                if (line.startsWith("#EXTINF:")) {
                    attributes = new HashMap<>(); Matcher matcher = ATTRIBUTE.matcher(line);
                    while (matcher.find()) attributes.put(matcher.group(1), matcher.group(2) != null ? matcher.group(2) : matcher.group(3) != null ? matcher.group(3) : matcher.group(4));
                    int comma = titleComma(line); name = comma < 0 ? "" : line.substring(comma + 1).trim();
                    continue;
                }
                if (line.isEmpty() || line.startsWith("#")) continue;
                if (attributes == null) continue;
                String url;
                try { url = safeUrl(line); } catch (IOException e) { attributes = null; continue; }
                String originalId = attributes.getOrDefault("tvg-id", "").split("@", 2)[0];
                if (defaults) {
                    name = DEFAULT_NAMES.get(originalId);
                    if (name == null || line.toLowerCase(Locale.ROOT).contains("accountinfo=")) { attributes = null; continue; }
                } else if (name == null || name.isEmpty()) name = attributes.getOrDefault("tvg-name", "");
                if (name == null || name.isEmpty()) { attributes = null; continue; }
                name = bounded(name, 120);
                String id = bounded(originalId.isEmpty() ? name.toLowerCase(Locale.ROOT) : originalId, 160);
                // Merge equivalent SD/HD and duplicate-name variants into one channel row.
                if (defaults) for (Builder old : found.values()) if (old.name.equals(name)) { id = old.id; break; }
                String category = attributes.getOrDefault("group-title", "");
                String group = name.toUpperCase(Locale.ROOT).startsWith("CCTV") || category.contains("央视") ? CCTV
                        : name.contains("卫视") || category.contains("卫视") || category.toLowerCase(Locale.ROOT).contains("satellite") ? SATELLITE : OTHER;
                Builder entry = found.get(id);
                if (entry == null && found.size() < MAX_CHANNELS) { entry = new Builder(id, name, group); found.put(id, entry); }
                if (entry != null && entry.urls.size() < MAX_ROUTES && !entry.urls.contains(url)) entry.urls.add(url);
                attributes = null;
            }
        }
        List<Channel> result = new ArrayList<>();
        for (Builder entry : found.values()) result.add(new Channel(entry.id, entry.name, entry.group, entry.urls));
        if (result.isEmpty()) throw new UiError(R.string.list_no_channels);
        if (defaults) result.sort(Comparator.comparingInt(channel -> order(channel.id)));
        return result;
    }
    private static int order(String id) {
        int index = 0; for (String key : DEFAULT_NAMES.keySet()) { if (key.equals(id)) return index; index++; } return index;
    }
    private static int titleComma(String line) {
        char quote = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if ((c == '\'' || c == '"') && (quote == 0 || quote == c)) quote = quote == 0 ? c : 0;
            if (c == ',' && quote == 0) return i;
        }
        return -1;
    }
    static String safeUrl(String address) throws IOException {
        if (address == null || address.isEmpty() || address.length() > 8192) throw new UiError(R.string.url_empty);
        try {
            URI uri = new URI(address.trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null)
                throw new UiError(R.string.url_unsupported);
            return uri.toASCIIString();
        } catch (URISyntaxException e) { UiError error = new UiError(R.string.url_invalid); error.initCause(e); throw error; }
    }
    static byte[] read(InputStream input) throws IOException {
        try (InputStream stream = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = stream.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) throw new UiError(R.string.list_cancelled);
                if (output.size() + count > MAX_BYTES) throw new UiError(R.string.list_size_limit);
                output.write(buffer, 0, count);
            }
            return output.toByteArray();
        }
    }
    private static String bounded(String value, int max) { return value.length() > max ? value.substring(0, max) : value; }
    private static final class Builder {
        final String id, name, group; final List<String> urls = new ArrayList<>();
        Builder(String id, String name, String group) { this.id = id; this.name = name; this.group = group; }
    }
}
