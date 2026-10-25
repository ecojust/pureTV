package com.ecojust.hifinitv;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Bounded, metadata-only storage shared by browsing and playback state. */
final class TrackMetadataCodec {
    static final int MAX_TRACKS = 50;
    private static final int MAX_INPUT_ITEMS = 200;

    private TrackMetadataCodec() { }

    static JSONArray encode(List<Track> tracks) {
        JSONArray result = new JSONArray();
        if (tracks == null) return result;
        Set<String> ids = new HashSet<>();
        int inspected = 0;
        for (Track track : tracks) {
            if (inspected++ >= MAX_INPUT_ITEMS || result.length() >= MAX_TRACKS) break;
            if (track == null || !ids.add(track.id)) continue;
            try {
                JSONObject row = new JSONObject();
                row.put("source", track.source);
                row.put("sourceId", track.sourceId);
                row.put("threadId", track.threadId);
                row.put("title", track.title);
                row.put("artist", track.artist);
                row.put("cover", track.cover);
                row.put("duration", track.duration);
                result.put(row);
            } catch (JSONException invalidMetadata) {
                // One malformed record must not discard the other saved search results.
            }
        }
        return result;
    }

    static List<Track> decode(JSONArray rows) {
        List<Track> result = new ArrayList<>();
        if (rows == null) return result;
        Set<String> ids = new HashSet<>();
        int count = Math.min(rows.length(), MAX_INPUT_ITEMS);
        for (int i = 0; i < count && result.size() < MAX_TRACKS; i++) {
            JSONObject row = rows.optJSONObject(i);
            if (row == null) continue;
            try {
                String source = text(row, "source", 7), sourceId = text(row, "sourceId", 20);
                String threadId = text(row, "threadId", 12);
                String title = text(row, "title", 240), artist = text(row, "artist", 160);
                String cover = text(row, "cover", 4096);
                Object seconds = row.get("duration");
                if (!(seconds instanceof Integer) && !(seconds instanceof Long)) continue;
                long duration = ((Number) seconds).longValue();
                if (duration < 0 || duration > 86400) continue;
                if (!threadId.isEmpty() && !threadId.matches("[1-9][0-9]{0,11}")) continue;
                if (source.isEmpty() && !sourceId.isEmpty()) continue;
                Track track = source.isEmpty() ? new Track(threadId, title, artist, cover, duration)
                        : Track.catalog(source, sourceId, threadId, title, artist, cover, duration);
                if (ids.add(track.id)) result.add(track);
            } catch (JSONException | IllegalArgumentException invalidMetadata) {
                // Validate each entry independently and never restore a media URL as an identity.
            }
        }
        return result;
    }

    private static String text(JSONObject object, String key, int limit) throws JSONException {
        Object value = object.get(key);
        if (!(value instanceof String) || ((String) value).length() > limit)
            throw new JSONException("Invalid song metadata");
        return (String) value;
    }
}
