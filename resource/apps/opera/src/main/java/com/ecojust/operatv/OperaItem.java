package com.ecojust.operatv;

import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/** A media reference, not a claim that the referenced media is currently playable. */
public final class OperaItem {
    public final String id, title, group, imageUrl, kind, uri, pageUrl;

    public OperaItem(String id, String title, String group, String imageUrl,
                     String kind, String uri, String pageUrl) {
        this.title = text(title, 240, "title", false);
        this.group = text(group, 80, "group", true);
        this.kind = text(kind, 16, "kind", false);
        this.uri = address(uri);
        this.imageUrl = imageUrl == null || imageUrl.isEmpty() ? "" : networkUri(imageUrl);
        this.pageUrl = pageUrl == null || pageUrl.isEmpty() ? "" : officialPage(pageUrl);
        final String expected;
        if ("cctv".equals(this.kind)) {
            if (!this.uri.matches("[0-9a-f]{32}")) throw invalid("Invalid CCTV video ID");
            expected = "cctv:" + this.uri;
        } else if ("direct".equals(this.kind)) {
            networkUri(this.uri);
            expected = hash(this.uri);
        } else if ("document".equals(this.kind)) {
            URI parsed = parse(this.uri);
            if (!"content".equals(parsed.getScheme()) || parsed.getRawAuthority() == null
                    || parsed.getRawAuthority().isEmpty() || parsed.getUserInfo() != null
                    || parsed.getFragment() != null) throw invalid("Invalid document URI");
            expected = hash(this.uri);
        } else throw invalid("Unsupported media kind");
        if (id != null && !id.isEmpty() && !expected.equals(id)) throw invalid("Media ID does not match its source");
        this.id = expected;
    }

    public JSONObject toJson() {
        JSONObject value = new JSONObject();
        try {
            value.put("id", id).put("title", title).put("group", group).put("imageUrl", imageUrl)
                    .put("kind", kind).put("uri", uri).put("pageUrl", pageUrl);
        } catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        return value;
    }

    public static OperaItem fromJson(JSONObject value) throws JSONException {
        if (value == null) throw new JSONException("Missing media item");
        try {
            return new OperaItem(string(value, "id", false), string(value, "title", false),
                    string(value, "group", true), string(value, "imageUrl", true),
                    string(value, "kind", false), string(value, "uri", false), string(value, "pageUrl", true));
        } catch (IllegalArgumentException invalid) { throw new JSONException(invalid.getMessage()); }
    }

    public static OperaItem direct(String title, String uri, String group) {
        String source = address(uri);
        String kind = "content".equals(parse(source).getScheme()) ? "document" : "direct";
        return new OperaItem(null, title, group, "", kind, source, "");
    }

    /** Shared validation for user-entered network URLs; LAN HTTP is intentionally supported. */
    public static String networkUri(String value) {
        String source = address(value);
        URI parsed = parse(source);
        String scheme = parsed.getScheme();
        if (!("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))
                || parsed.getHost() == null || parsed.getHost().isEmpty() || parsed.getUserInfo() != null
                || (parsed.getPort() != -1 && (parsed.getPort() < 1 || parsed.getPort() > 65535))) {
            throw invalid("Use an HTTP or HTTPS URL without embedded credentials");
        }
        return source;
    }

    static String officialPage(String value) {
        String source = networkUri(value);
        URI parsed = parse(source);
        if (!"https".equalsIgnoreCase(parsed.getScheme()) || !"tv.cctv.com".equalsIgnoreCase(parsed.getHost())
                || (parsed.getPort() != -1 && parsed.getPort() != 443)) throw invalid("Invalid CCTV page URL");
        return source;
    }

    private static String string(JSONObject object, String key, boolean optional) throws JSONException {
        Object value = object.opt(key);
        if (value == null || value == JSONObject.NULL) {
            if (optional) return "";
            throw new JSONException("Missing " + key);
        }
        if (!(value instanceof String)) throw new JSONException("Invalid " + key);
        return (String) value;
    }

    private static String text(String value, int max, String label, boolean optional) {
        String result = value == null ? "" : value.replaceAll("[\\p{Cntrl}\\s]+", " ").trim();
        if ((!optional && result.isEmpty()) || result.length() > max) throw invalid("Invalid " + label);
        return result;
    }

    private static String address(String value) {
        if (value == null || value.trim().isEmpty() || value.length() > 8192
                || value.matches("(?s).*[\\p{Cntrl}].*")) throw invalid("Invalid media address");
        return value.trim();
    }

    private static URI parse(String value) {
        try { return new URI(value); }
        catch (URISyntaxException invalid) { throw invalid("Invalid media address"); }
    }

    private static String hash(String value) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(64);
            for (byte b : bytes) out.append(String.format(Locale.ROOT, "%02x", b & 255));
            return out.toString();
        } catch (NoSuchAlgorithmException impossible) { throw new IllegalStateException(impossible); }
    }

    private static IllegalArgumentException invalid(String message) { return new IllegalArgumentException(message); }
}
