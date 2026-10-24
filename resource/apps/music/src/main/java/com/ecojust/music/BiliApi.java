package com.ecojust.music;

import android.text.Html;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Public Bilibili endpoints only. Authentication/verification failures are surfaced, never bypassed. */
final class BiliApi {
    private static final BiliApi INSTANCE = new BiliApi();
    private static final int[] MIX = {46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52};
    static final String AGENT = "Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 Chrome/120.0 Safari/537.36";
    private String key = "";
    private volatile String cookies = "";
    private long keyTime;
    interface Responses { JSONObject get(String url) throws IOException; }
    private final Responses responses;
    BiliApi() { this(null); }
    BiliApi(Responses responses) { this.responses = responses; }
    static BiliApi get() { return INSTANCE; }

    List<Track> search(String input) throws IOException {
        String bv = Track.extractBv(input.trim());
        if (bv != null) { List<Track> one = new ArrayList<>(); one.add(view(bv)); return one; }
        Map<String, String> params = new TreeMap<>();
        params.put("search_type", "video"); params.put("keyword", input.trim());
        params.put("tids", "3"); params.put("page", "1"); params.put("page_size", "12");
        try { return parseSearch(request("https://api.bilibili.com/x/web-interface/wbi/search/type?" + signed(params))); }
        catch (JSONException e) { throw new IOException("搜索响应无法解析", e); }
    }

    Track view(String bv) throws IOException {
        try {
            return parseView(bv, request("https://api.bilibili.com/x/web-interface/view?bvid=" + encode(bv)));
        } catch (JSONException e) { throw new IOException("视频信息无法解析", e); }
    }

    String audio(Track track) throws IOException {
        return audioSources(track, stage -> {}).get(0);
    }

    List<String> audioSources(Track track, java.util.function.Consumer<String> stage) throws IOException {
        try {
            stage.accept("正在获取音频分段…");
            JSONObject pages = request("https://api.bilibili.com/x/player/pagelist?bvid=" + encode(track.id));
            Map<String, String> params = playParams(track.id, pageCid(pages));
            stage.accept("正在请求音轨…");
            // Same public DASH request flow used by BiliMusic; keep our native low-bandwidth player.
            JSONObject response = request("https://api.bilibili.com/x/player/playurl?" + query(params));
            // Try the signed variant once for a parameter error, never for login/verification failures.
            if (response.optInt("code") == -400)
                response = request("https://api.bilibili.com/x/player/wbi/playurl?" + signed(params));
            return parseAudioSources(response);
        } catch (JSONException e) { throw new IOException("音频信息无法解析", e); }
    }

    static long pageCid(JSONObject response) throws IOException, JSONException {
        checkCode(response);
        JSONArray pages = response.optJSONArray("data");
        JSONObject first = pages == null ? null : pages.optJSONObject(0);
        long cid = first == null ? 0 : first.optLong("cid");
        if (cid <= 0) throw new IOException("没有可播放的音频分段");
        return cid;
    }

    static Track parseView(String bv, JSONObject response) throws IOException, JSONException {
        JSONObject data = checked(response);
        return new Track(bv, data.optString("title", bv), data.optJSONObject("owner") == null ? "" : data.getJSONObject("owner").optString("name"),
                data.optString("pic"), "", data.optLong("duration"));
    }
    static long videoCid(JSONObject data) throws IOException {
        long cid = data.optLong("cid");
        JSONArray pages = data.optJSONArray("pages");
        if (cid <= 0 && pages != null && pages.optJSONObject(0) != null) cid = pages.optJSONObject(0).optLong("cid");
        if (cid <= 0) throw new IOException("没有可播放的音频分段");
        return cid;
    }
    static Map<String,String> playParams(String bv, long cid) {
        Map<String,String> params = new TreeMap<>();
        params.put("bvid", bv); params.put("cid", String.valueOf(cid));
        params.put("qn", "0"); params.put("fnver", "0"); params.put("fnval", "16"); params.put("fourk", "1");
        return params;
    }
    private static String query(Map<String,String> params) {
        StringBuilder result = new StringBuilder();
        for (Map.Entry<String,String> entry : params.entrySet()) {
            if (result.length() > 0) result.append('&');
            result.append(encode(entry.getKey())).append('=').append(encode(entry.getValue()));
        }
        return result.toString();
    }

    static List<Track> parseSearch(JSONObject response) throws JSONException, IOException {
        JSONArray array = checked(response).optJSONArray("result");
        List<Track> tracks = new ArrayList<>();
        if (array == null) return tracks;
        for (int i = 0; i < array.length() && tracks.size() < 12; i++) {
            JSONObject item = array.optJSONObject(i);
            if (item == null) continue;
            String bv = item.optString("bvid");
            if (!bv.matches("BV[0-9A-Za-z]{10}") || MusicStore.contains(tracks, bv)) continue;
            String title = Html.fromHtml(item.optString("title", bv), Html.FROM_HTML_MODE_LEGACY).toString();
            String cover = item.optString("pic");
            if (cover.startsWith("//")) cover = "https:" + cover;
            tracks.add(new Track(bv, title, item.optString("author"), cover, "", Track.seconds(item.optString("duration"))));
        }
        return tracks;
    }

    static String parseAudio(JSONObject response) throws JSONException, IOException {
        return parseAudioSources(response).get(0);
    }

    static List<String> parseAudioSources(JSONObject response) throws JSONException, IOException {
        JSONObject data = checked(response);
        JSONObject dash = data.optJSONObject("dash");
        Object raw = dash == null ? null : dash.opt("audio");
        JSONArray audio = raw instanceof JSONArray ? (JSONArray) raw : raw instanceof JSONObject ? new JSONArray().put(raw) : null;
        JSONObject chosen = null;
        boolean chosenLc = false;
        long smallest = Long.MAX_VALUE;
        if (audio != null) for (int i = 0; i < audio.length(); i++) {
            JSONObject item = audio.optJSONObject(i);
            if (item == null) continue;
            String codec = item.optString("codecs");
            int id = item.optInt("id");
            boolean knownAac = codec.startsWith("mp4a") || codec.isEmpty()
                    && "audio/mp4".equals(item.optString("mimeType", item.optString("mime_type")))
                    && (id == 30216 || id == 30232 || id == 30280);
            if (!knownAac) continue;
            String url = audioUrl(item.optString("baseUrl"));
            if (url == null) url = audioUrl(item.optString("base_url"));
            if (url == null) {
                JSONArray backups = item.optJSONArray("backupUrl");
                if (backups == null) backups = item.optJSONArray("backup_url");
                if (backups != null) for (int j = 0; j < backups.length() && url == null; j++) url = audioUrl(backups.optString(j));
            }
            long bandwidth = item.optLong("bandwidth", Long.MAX_VALUE);
            if (bandwidth <= 0) bandwidth = Long.MAX_VALUE;
            boolean lc = "mp4a.40.2".equals(codec) || codec.isEmpty() && id == 30216;
            if (url != null && (chosen == null || lc && !chosenLc || lc == chosenLc && bandwidth < smallest)) {
                chosen = item; smallest = bandwidth; chosenLc = lc;
            }
        }
        if (chosen == null) throw new IOException("此内容没有可直接播放的 AAC 音轨，可能需要登录或授权");
        List<String> urls = new ArrayList<>();
        addAudioUrl(urls, chosen.optString("baseUrl"));
        addAudioUrl(urls, chosen.optString("base_url"));
        for (String field : new String[]{"backupUrl", "backup_url"}) {
            JSONArray backups = chosen.optJSONArray(field);
            if (backups != null) for (int i = 0; i < backups.length() && urls.size() < 3; i++) addAudioUrl(urls, backups.optString(i));
        }
        return urls;
    }
    private static void addAudioUrl(List<String> urls, String value) {
        String url = audioUrl(value);
        if (url != null && urls.size() < 3 && !urls.contains(url)) urls.add(url);
    }

    private static String audioUrl(String value) {
        if (value.startsWith("http://")) value = "https://" + value.substring(7);
        try {
            java.net.URI uri = new java.net.URI(value);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null ? uri.toASCIIString() : null;
        } catch (java.net.URISyntaxException e) { return null; }
    }

    static JSONObject checked(JSONObject response) throws IOException, JSONException {
        checkCode(response);
        JSONObject data = response.optJSONObject("data");
        if (data == null) throw new IOException("B 站没有返回内容");
        return data;
    }
    private static void checkCode(JSONObject response) throws IOException {
        int code = response.optInt("code", -1);
        if (code == -400) throw new IOException("B 站拒绝请求（-400：请求错误），请重试或换用其他内容");
        if (code != 0) throw new IOException(code == -412 || code == -352 ? "B 站要求验证，请稍后或换用本地音频" : "B 站返回 " + code + "：" + response.optString("message", "内容不可用"));
    }

    private synchronized String signingKey() throws IOException {
        if (!key.isEmpty() && System.currentTimeMillis() - keyTime < 30 * 60_000L) return key;
        try {
            JSONObject response = request("https://api.bilibili.com/x/web-interface/nav");
            JSONObject data = response.optJSONObject("data");
            JSONObject images = data == null ? null : data.optJSONObject("wbi_img");
            if (images == null) throw new IOException("无法取得公开请求参数，请稍后重试");
            String combined = basename(images.getString("img_url")) + basename(images.getString("sub_url"));
            if (combined.length() < 64) throw new IOException("请求参数无效");
            StringBuilder mixed = new StringBuilder();
            for (int i = 0; i < 32; i++) mixed.append(combined.charAt(MIX[i]));
            key = mixed.toString(); keyTime = System.currentTimeMillis();
            return key;
        } catch (JSONException e) { throw new IOException("公开请求参数无法解析", e); }
    }
    private String signed(Map<String, String> params) throws IOException {
        String mix = signingKey();
        return sign(params, mix, System.currentTimeMillis() / 1000L);
    }
    static String sign(Map<String, String> params, String mix, long timestamp) throws IOException {
        Map<String, String> sorted = new TreeMap<>(params);
        sorted.put("wts", String.valueOf(timestamp));
        StringBuilder query = new StringBuilder();
        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            if (query.length() > 0) query.append('&');
            query.append(encode(entry.getKey())).append('=').append(encode(entry.getValue().replaceAll("[!'()*]", "")));
        }
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest((query.toString() + mix).getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte value : digest) hash.append(String.format(java.util.Locale.ROOT, "%02x", value & 255));
            return query + "&w_rid=" + hash;
        } catch (java.security.NoSuchAlgorithmException e) { throw new IOException(e); }
    }
    private static String basename(String url) {
        int slash = url.lastIndexOf('/'), dot = url.lastIndexOf('.');
        return dot > slash ? url.substring(slash + 1, dot) : "";
    }
    private static String encode(String value) { try { return URLEncoder.encode(value, "UTF-8").replace("+", "%20"); } catch (java.io.UnsupportedEncodingException e) { throw new AssertionError(e); } }

    private JSONObject request(String url) throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new IOException("请求已取消");
        if (responses != null) return responses.get(url);
        HttpURLConnection connection = (HttpURLConnection) new URL(url).openConnection();
        connection.setConnectTimeout(8000); connection.setReadTimeout(8000);
        connection.setRequestProperty("User-Agent", AGENT);
        connection.setRequestProperty("Referer", "https://www.bilibili.com/");
        if (!cookies.isEmpty()) connection.setRequestProperty("Cookie", cookies);
        try {
            int status = connection.getResponseCode();
            if (status != 200) throw new IOException(status == 412 || status == 403 ? "B 站暂时拒绝访问，请稍后或换用本地音频（HTTP " + status + "）" : "网络请求失败（HTTP " + status + "）");
            List<String> set = null;
            for (Map.Entry<String,List<String>> header : connection.getHeaderFields().entrySet())
                if ("Set-Cookie".equalsIgnoreCase(header.getKey())) { set = header.getValue(); break; }
            if (set != null) {
                StringBuilder value = new StringBuilder();
                for (String cookie : set) { if (value.length() > 0) value.append("; "); value.append(cookie.split(";", 2)[0]); }
                if (value.length() < 8192) cookies = value.toString();
            }
            try (InputStream input = connection.getInputStream()) {
                ByteArrayOutputStream bytes = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192]; int count;
                while ((count = input.read(buffer)) != -1) {
                    if (Thread.currentThread().isInterrupted()) throw new IOException("请求已取消");
                    if (bytes.size() + count > 1024 * 1024) throw new IOException("响应过大，已停止加载");
                    bytes.write(buffer, 0, count);
                }
                return new JSONObject(bytes.toString("UTF-8"));
            } catch (JSONException e) { throw new IOException("服务没有返回有效数据", e); }
        } finally { connection.disconnect(); }
    }
}
