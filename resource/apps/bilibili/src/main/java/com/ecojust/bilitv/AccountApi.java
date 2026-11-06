package com.ecojust.bilitv;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.IOException;
import java.net.URI;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Normal website sign-in and explicitly requested account operations. All methods block. */
public class AccountApi {
    private static final String API = "https://api.bilibili.com";
    private static final String PASSPORT = "https://passport.bilibili.com";
    private final BiliHttp http;
    private final SessionStore session;

    public AccountApi(BiliHttp http, SessionStore session) { this.http = http; this.session = session; }

    public static final class Profile {
        public final long mid;
        public final String name, avatar;
        public Profile(long mid, String name, String avatar) { this.mid = mid; this.name = name; this.avatar = avatar; }
    }
    public static final class QrTicket {
        public final String key, url;
        public final long createdAt, generation;
        public QrTicket(String key, String url, long createdAt, long generation) {
            this.key = key; this.url = url; this.createdAt = createdAt; this.generation = generation;
        }
    }
    public enum Status { WAITING, SCANNED, EXPIRED, SUCCESS }
    public static final class QrState {
        public final Status status;
        public final Profile profile;
        public QrState(Status status, Profile profile) { this.status = status; this.profile = profile; }
    }
    public static final class Folder {
        public final long id;
        public final String title;
        public final int count;
        public final boolean selected;
        public Folder(long id, String title, int count, boolean selected) { this.id = id; this.title = title; this.count = count; this.selected = selected; }
    }
    public static final class HistoryPage {
        public final List<VideoApi.Video> videos;
        public final long nextMax, nextViewAt;
        public final boolean hasMore;
        public HistoryPage(List<VideoApi.Video> videos, long nextMax, long nextViewAt, boolean hasMore) {
            this.videos = Collections.unmodifiableList(new ArrayList<>(videos)); this.nextMax = nextMax; this.nextViewAt = nextViewAt; this.hasMore = hasMore;
        }
    }

    public Profile profile() throws IOException { return profile(session.generation()); }

    private Profile profile(long generation) throws IOException {
        JSONObject data = data(http.get(API + "/x/web-interface/nav", params(), generation));
        long mid = data.optLong("mid", 0);
        if (!data.optBoolean("isLogin", false) || mid <= 0) throw auth();
        return new Profile(mid, text(data.optString("uname", ""), 100), image(data.optString("face", "")));
    }

    public QrTicket startQr() throws IOException {
        session.clear(); // A new sign-in must never reuse a previous account as evidence of QR success.
        long generation = session.generation();
        JSONObject data = data(http.get(PASSPORT + "/x/passport-login/web/qrcode/generate", params(), generation));
        String key = data.optString("qrcode_key", ""), url = data.optString("url", "");
        try {
            URI uri = URI.create(url);
            if (!key.matches("[A-Za-z0-9_-]{16,256}") || !"https".equalsIgnoreCase(uri.getScheme())
                    || !"passport.bilibili.com".equalsIgnoreCase(uri.getHost()) || uri.getUserInfo() != null
                    || (uri.getPort() != -1 && uri.getPort() != 443)) throw new IllegalArgumentException();
        } catch (IllegalArgumentException invalid) { throw invalid("Invalid login QR response"); }
        checkGeneration(generation);
        return new QrTicket(key, url, System.currentTimeMillis(), generation);
    }

    public QrState pollQr(QrTicket ticket) throws IOException {
        if (ticket == null) throw invalid("Missing login QR");
        checkGeneration(ticket.generation);
        if (System.currentTimeMillis() - ticket.createdAt >= 180000) return new QrState(Status.EXPIRED, null);
        JSONObject data = data(http.get(PASSPORT + "/x/passport-login/web/qrcode/poll", params("qrcode_key", ticket.key), ticket.generation));
        checkGeneration(ticket.generation);
        int code = data.optInt("code", Integer.MIN_VALUE);
        if (code == 86101) return new QrState(Status.WAITING, null);
        if (code == 86090) return new QrState(Status.SCANNED, null);
        if (code == 86038) return new QrState(Status.EXPIRED, null);
        if (code != 0) throw new BiliHttp.ApiException(BiliHttp.Kind.INVALID_RESPONSE, code, "Login status unavailable");
        // A successful polling code is insufficient: cookies and the current account must agree.
        if (!session.hasSession()) throw invalid("Login completed without session cookies; scan again");
        Profile profile = profile(ticket.generation);
        checkGeneration(ticket.generation);
        return new QrState(Status.SUCCESS, profile);
    }

    public List<Folder> folders(long mid) throws IOException { return folders(mid, 0); }

    /** With aid, selected identifies which folders currently contain that video. */
    public List<Folder> folders(long mid, long aid) throws IOException {
        long generation = session.generation();
        requireSession(); positive(mid, "user");
        Map<String, String> query = params("up_mid", mid);
        if (aid > 0) { query.put("rid", Long.toString(aid)); query.put("type", "2"); }
        JSONObject data = data(http.get(API + "/x/v3/fav/folder/created/list-all", query, generation));
        JSONArray entries = data.optJSONArray("list");
        List<Folder> result = new ArrayList<>();
        if (entries != null) for (int i = 0; i < entries.length() && result.size() < 1000; i++) {
            JSONObject item = entries.optJSONObject(i);
            if (item == null || item.optLong("id", 0) <= 0) continue;
            result.add(new Folder(item.optLong("id"), text(item.optString("title", ""), 200),
                    Math.max(0, item.optInt("media_count", 0)), item.optInt("fav_state", 0) == 1));
        }
        return Collections.unmodifiableList(result);
    }

    public VideoApi.SearchPage favorites(long folderId, int page) throws IOException {
        long generation = session.generation();
        requireSession(); positive(folderId, "folder"); page = checkedPage(page);
        JSONObject data = data(http.get(API + "/x/v3/fav/resource/list", params("media_id", folderId, "pn", page,
                "ps", 20, "order", "mtime", "type", 0, "tid", 0, "platform", "web"), generation));
        JSONArray entries = data.optJSONArray("medias");
        List<VideoApi.Video> videos = new ArrayList<>();
        if (entries != null) for (int i = 0; i < entries.length() && videos.size() < 20; i++) {
            JSONObject item = entries.optJSONObject(i);
            if (item == null || item.optInt("type", 2) != 2 || (item.optInt("attr", 0) & 1) != 0) continue;
            String bvid = item.optString("bvid", item.optString("bv_id", ""));
            long aid = item.optLong("id", 0);
            if (!validBvid(bvid) || aid <= 0) continue;
            JSONObject owner = item.optJSONObject("upper");
            videos.add(new VideoApi.Video(bvid, aid, text(item.optString("title", ""), 500),
                    owner == null ? "" : text(owner.optString("name", ""), 100), image(item.optString("cover", "")),
                    Math.max(0, item.optInt("duration", 0))));
        }
        return new VideoApi.SearchPage(videos, page, data.optBoolean("has_more", false));
    }

    public HistoryPage history(long max, long viewAt) throws IOException {
        long generation = session.generation();
        requireSession();
        if (max < 0 || viewAt < 0) throw invalid("Invalid history cursor");
        JSONObject data = data(http.get(API + "/x/web-interface/history/cursor", params("type", "archive", "ps", 20, "max", max, "view_at", viewAt), generation));
        JSONArray entries = data.optJSONArray("list");
        List<VideoApi.Video> videos = new ArrayList<>();
        if (entries != null) for (int i = 0; i < entries.length() && videos.size() < 20; i++) {
            JSONObject item = entries.optJSONObject(i), history = item == null ? null : item.optJSONObject("history");
            if (history == null || !"archive".equals(history.optString("business", ""))) continue;
            String bvid = history.optString("bvid", ""); long aid = history.optLong("oid", 0);
            if (!validBvid(bvid) || aid <= 0) continue;
            long progress = item.optLong("progress", 0); // -1 means completed; restart completed videos at zero.
            videos.add(new VideoApi.Video(bvid, aid, text(item.optString("title", ""), 500),
                    text(item.optString("author_name", ""), 100), image(item.optString("cover", "")),
                    Math.max(0, item.optInt("duration", 0)), Math.max(0, history.optLong("cid", 0)), Math.max(0, progress)));
        }
        JSONObject cursor = data.optJSONObject("cursor");
        long nextMax = cursor == null ? 0 : Math.max(0, cursor.optLong("max", 0));
        long nextView = cursor == null ? 0 : Math.max(0, cursor.optLong("view_at", 0));
        boolean hasMore = entries != null && entries.length() > 0 && nextMax > 0 && (nextMax != max || nextView != viewAt);
        return new HistoryPage(videos, nextMax, nextView, hasMore);
    }

    /** Called only after an explicit add/remove choice for one known folder. */
    public void favorite(long aid, long folderId, boolean add) throws IOException {
        long generation = session.generation();
        requireSession(); positive(aid, "video"); positive(folderId, "folder");
        http.post(API + "/x/v3/fav/resource/deal", params("rid", aid, "type", 2,
                "add_media_ids", add ? Long.toString(folderId) : "", "del_media_ids", add ? "" : Long.toString(folderId),
                "csrf", session.getCookie("bili_jct")), generation);
    }

    /** Report only real watched progress; the player controls cadence and lifecycle. */
    public void heartbeat(String bvid, long cid, long positionSeconds, boolean ended) throws IOException {
        long generation = session.generation();
        requireSession();
        if (!validBvid(bvid) || cid <= 0 || positionSeconds < 0) throw invalid("Invalid playback progress");
        http.post(API + "/x/click-interface/web/heartbeat", params("bvid", bvid, "cid", cid, "type", 3,
                "played_time", ended ? -1 : positionSeconds, "csrf", session.getCookie("bili_jct")), generation);
    }

    private void requireSession() throws IOException { if (!session.hasSession()) throw auth(); }
    private void checkGeneration(long generation) throws IOException {
        if (session.generation() != generation) throw new BiliHttp.ApiException(BiliHttp.Kind.CANCELLED, 0, "Account request cancelled");
    }
    private static BiliHttp.ApiException auth() { return new BiliHttp.ApiException(BiliHttp.Kind.AUTH_REQUIRED, -101, "Please sign in again"); }
    private static BiliHttp.ApiException invalid(String message) { return new BiliHttp.ApiException(BiliHttp.Kind.INVALID_RESPONSE, 0, message); }
    private static JSONObject data(JSONObject response) throws IOException {
        JSONObject data = response.optJSONObject("data");
        if (data == null) throw invalid("Missing account response data");
        return data;
    }
    private static void positive(long value, String kind) throws IOException { if (value <= 0) throw invalid("Invalid " + kind); }
    private static int checkedPage(int page) throws IOException { if (page < 1 || page > 10000) throw invalid("Invalid page"); return page; }
    private static boolean validBvid(String bvid) { return bvid != null && bvid.matches("BV[A-Za-z0-9]{10}"); }
    private static String text(String value, int limit) { return value.length() <= limit ? value : value.substring(0, limit); }
    private static String image(String value) {
        if (value.startsWith("//")) value = "https:" + value;
        try {
            URI uri = URI.create(value);
            String host = uri.getHost();
            if ("https".equalsIgnoreCase(uri.getScheme()) && host != null && uri.getUserInfo() == null
                    && (host.equals("hdslb.com") || host.endsWith(".hdslb.com"))) return value;
        } catch (IllegalArgumentException ignored) { }
        return "";
    }
    private static Map<String, String> params(Object... pairs) {
        Map<String, String> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put(pairs[i].toString(), pairs[i + 1].toString());
        return result;
    }
}
