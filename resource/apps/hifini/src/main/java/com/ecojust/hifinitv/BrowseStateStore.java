package com.ecojust.hifinitv;

import android.content.Context;
import android.content.SharedPreferences;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Private browser continuity, containing search metadata but no playback URLs or local audio index. */
final class BrowseStateStore {
    static final int MAX_BYTES = 256 * 1024;
    static final String PREFERENCES = "hifini-browse-state", RECORD = "state";
    private static final int MAX_QUERY = 100, MAX_OFFSET = 16384;
    private final SharedPreferences preferences;

    static final class State {
        String query = "";
        boolean localMode = true;
        List<Track> tracks = new ArrayList<>();
        Position searchPosition = new Position(), localPosition = new Position();
    }

    static final class Position {
        String selectedId = "", firstId = "";
        int selectedIndex = -1, firstIndex, selectedOffset, firstOffset;
    }

    BrowseStateStore(Context context) {
        this(context.getApplicationContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE));
    }

    BrowseStateStore(SharedPreferences preferences) { this.preferences = preferences; }

    void save(State state) { preferences.edit().putString(RECORD, serialize(state)).apply(); }

    State load() {
        try { return deserialize(preferences.getString(RECORD, null)); }
        catch (ClassCastException corruptPreference) { return new State(); }
    }

    /** Also used by the Activity Bundle, with the same limits as persistent preferences. */
    static String serialize(State state) {
        State value = state == null ? new State() : state;
        try {
            JSONObject document = new JSONObject();
            document.put("version", 1);
            document.put("query", query(value.query));
            document.put("localMode", value.localMode);
            document.put("searchPosition", encodePosition(value.searchPosition));
            document.put("localPosition", encodePosition(value.localPosition));
            JSONArray kept = new JSONArray();
            document.put("tracks", kept);
            int remaining = MAX_BYTES - utf8Length(document.toString());
            JSONArray candidates = TrackMetadataCodec.encode(value.tracks);
            for (int i = 0; i < candidates.length(); i++) {
                JSONObject row = candidates.getJSONObject(i);
                int bytes = utf8Length(row.toString()) + (kept.length() == 0 ? 0 : 1);
                if (bytes > remaining) break;
                kept.put(row);
                remaining -= bytes;
            }
            return document.toString();
        } catch (JSONException impossibleMetadata) {
            return "{\"version\":1,\"localMode\":true,\"tracks\":[]}";
        }
    }

    static State deserialize(String json) {
        State result = new State();
        if (!boundedDocument(json)) return result;
        try {
            JSONTokener parser = new JSONTokener(json);
            Object root = parser.nextValue();
            if (!(root instanceof JSONObject) || parser.nextClean() != 0) return result;
            JSONObject document = (JSONObject) root;
            Object version = document.opt("version");
            if (!(version instanceof Integer) && !(version instanceof Long)
                    || ((Number) version).longValue() != 1) return result;
            result.query = query(string(document, "query"));
            Object localMode = document.opt("localMode");
            if (localMode instanceof Boolean) result.localMode = (Boolean) localMode;
            result.tracks = TrackMetadataCodec.decode(document.optJSONArray("tracks"));
            result.searchPosition = decodePosition(document.optJSONObject("searchPosition"));
            result.localPosition = decodePosition(document.optJSONObject("localPosition"));
            return result;
        } catch (JSONException | IllegalArgumentException corruptDocument) {
            return new State();
        }
    }

    private static JSONObject encodePosition(Position position) throws JSONException {
        Position value = position == null ? new Position() : position;
        JSONObject result = new JSONObject();
        result.put("selectedId", identity(value.selectedId));
        result.put("firstId", identity(value.firstId));
        result.put("selectedIndex", clamp(value.selectedIndex, -1, TrackMetadataCodec.MAX_TRACKS - 1));
        result.put("firstIndex", clamp(value.firstIndex, 0, TrackMetadataCodec.MAX_TRACKS - 1));
        result.put("selectedOffset", clamp(value.selectedOffset, -MAX_OFFSET, MAX_OFFSET));
        result.put("firstOffset", clamp(value.firstOffset, -MAX_OFFSET, MAX_OFFSET));
        return result;
    }

    private static Position decodePosition(JSONObject document) {
        Position result = new Position();
        if (document == null) return result;
        result.selectedId = identity(string(document, "selectedId"));
        result.firstId = identity(string(document, "firstId"));
        result.selectedIndex = integer(document, "selectedIndex", -1, -1, TrackMetadataCodec.MAX_TRACKS - 1);
        result.firstIndex = integer(document, "firstIndex", 0, 0, TrackMetadataCodec.MAX_TRACKS - 1);
        result.selectedOffset = integer(document, "selectedOffset", 0, -MAX_OFFSET, MAX_OFFSET);
        result.firstOffset = integer(document, "firstOffset", 0, -MAX_OFFSET, MAX_OFFSET);
        return result;
    }

    private static int integer(JSONObject object, String name, int fallback, int min, int max) {
        Object value = object.opt(name);
        return value instanceof Integer || value instanceof Long ? clamp(((Number) value).longValue(), min, max) : fallback;
    }

    private static int clamp(long value, int min, int max) { return (int) Math.max(min, Math.min(max, value)); }
    private static String string(JSONObject object, String name) { Object value = object.opt(name); return value instanceof String ? (String) value : ""; }
    private static String identity(String value) {
        return value != null && value.length() <= 28
                && value.matches("(?:(?:netease|kuwo):[1-9][0-9]{0,19}|[1-9][0-9]{0,11})") ? value : "";
    }
    private static String query(String value) {
        if (value == null) return "";
        int length = Math.min(MAX_QUERY, value.length());
        if (length < value.length() && length > 0 && Character.isHighSurrogate(value.charAt(length - 1))) length--;
        return value.substring(0, length);
    }
    private static int utf8Length(String value) { return value.getBytes(StandardCharsets.UTF_8).length; }

    private static boolean boundedDocument(String value) {
        if (value == null || value.isEmpty() || value.length() > MAX_BYTES || utf8Length(value) > MAX_BYTES) return false;
        // Bound parser recursion as well as bytes; corrupt preferences can otherwise contain deep arrays.
        int depth = 0;
        char quote = 0;
        boolean escaped = false;
        for (int i = 0; i < value.length(); i++) {
            char character = value.charAt(i);
            if (quote != 0) {
                if (escaped) escaped = false;
                else if (character == '\\') escaped = true;
                else if (character == quote) quote = 0;
            } else if (character == '"') quote = character;
            else if (character == '\'' || character == '/') return false;
            else if (character == '{' || character == '[') { if (++depth > 8) return false; }
            else if (character == '}' || character == ']') { if (--depth < 0) return false; }
        }
        return depth == 0 && quote == 0;
    }
}
