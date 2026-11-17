package com.ecojust.hifinitv;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class TrackMetadataCodecTest {
    @Test public void catalogAndForumMetadataRoundTripWithStableIdentities() {
        List<Track> originals = Arrays.asList(
                new Track("124", "夜行星", "林间来客", "https://covers.example.invalid/night.png", 226),
                Track.catalog("netease", "905813", "", "Night Star", "Forest Guest", "", 0),
                Track.catalog("kuwo", "905813", "125", "Night Voyage", "Slow Island", "", 86400));
        List<Track> restored = TrackMetadataCodec.decode(TrackMetadataCodec.encode(originals));
        assertEquals(originals.size(), restored.size());
        for (int i = 0; i < originals.size(); i++) {
            Track expected = originals.get(i), actual = restored.get(i);
            assertEquals(expected.id, actual.id); assertEquals(expected.source, actual.source);
            assertEquals(expected.sourceId, actual.sourceId); assertEquals(expected.threadId, actual.threadId);
            assertEquals(expected.title, actual.title); assertEquals(expected.artist, actual.artist);
            assertEquals(expected.cover, actual.cover); assertEquals(expected.duration, actual.duration);
        }
        restored.clear(); assertEquals(3, originals.size());
    }

    @Test public void onlyTheSevenMetadataFieldsSurviveStorage() throws Exception {
        JSONObject row = row("123");
        row.put("audioUrl", "https://media.example.invalid/audio?token=private-playback-token");
        row.put("cookie", "private-account-cookie");
        row.put("headers", new JSONObject().put("Authorization", "private-authentication-value"));
        JSONArray encoded = TrackMetadataCodec.encode(TrackMetadataCodec.decode(new JSONArray().put(row)));
        assertEquals(1, encoded.length());
        JSONObject metadata = encoded.getJSONObject(0); Set<String> keys = new HashSet<>();
        for (Iterator<String> iterator = metadata.keys(); iterator.hasNext();) keys.add(iterator.next());
        assertEquals(new HashSet<>(Arrays.asList("source", "sourceId", "threadId", "title", "artist", "cover", "duration")), keys);
        assertFalse(encoded.toString().contains("private-playback-token"));
        assertFalse(encoded.toString().contains("private-account-cookie"));
        assertFalse(encoded.toString().contains("private-authentication-value"));
    }

    @Test public void invalidEntriesAndDuplicatesLeaveValidNeighborsInTheirOriginalOrder() throws Exception {
        JSONArray rows = new JSONArray().put(JSONObject.NULL).put("invalid")
                .put(row("11")).put(row("11").put("title", "Duplicate must not replace the first"))
                .put(row("12").put("threadId", "../12")).put(row("13"));
        List<Track> restored = TrackMetadataCodec.decode(rows);
        assertEquals(2, restored.size()); assertEquals("11", restored.get(0).id); assertEquals("13", restored.get(1).id);
        assertEquals("Song 11", restored.get(0).title);
        JSONArray encoded = TrackMetadataCodec.encode(Arrays.asList(null, restored.get(0), restored.get(0), restored.get(1)));
        assertEquals(2, encoded.length());
    }

    @Test public void fieldTypesLengthsAndIdentityAreCheckedBeforeConstructingTracks() throws Exception {
        JSONArray malformed = new JSONArray();
        for (Object invalid : new Object[]{"22", true, 1.5, -1, 86401, JSONObject.NULL}) malformed.put(row("21").put("duration", invalid));
        malformed.put(row("22").put("title", new JSONObject()))
                .put(row("23").put("title", "a".repeat(241)))
                .put(row("24").put("artist", "a".repeat(161)))
                .put(row("25").put("cover", "a".repeat(4097)))
                .put(row("26").put("sourceId", "26"))
                .put(row("27").put("source", "unknown").put("sourceId", "27"))
                .put(row("28").put("source", "netease").put("sourceId", "https://media.example.invalid/audio"))
                .put(row("29").put("source", "kuwo").put("sourceId", "00029"))
                .put(new JSONObject()).put(row("30"));
        List<Track> restored = TrackMetadataCodec.decode(malformed);
        assertEquals(1, restored.size()); assertEquals("30", restored.get(0).id);
    }

    @Test public void outputsAreLimitedToFiftySongsAndInputScanningIsBounded() throws Exception {
        List<Track> tracks = new ArrayList<>(); JSONArray rows = new JSONArray();
        for (int i = 1; i <= 60; i++) { Track track = new Track(String.valueOf(i), "Song " + i, "Artist", "", i); tracks.add(track); rows.put(row(String.valueOf(i))); }
        JSONArray encoded = TrackMetadataCodec.encode(tracks);
        assertEquals(50, encoded.length()); assertEquals("50", encoded.getJSONObject(49).getString("threadId"));
        List<Track> decoded = TrackMetadataCodec.decode(rows);
        assertEquals(50, decoded.size()); assertEquals("50", decoded.get(49).id);
        JSONArray excessive = new JSONArray(); List<Track> excessiveTracks = new ArrayList<>();
        for (int i = 0; i < 200; i++) { excessive.put(JSONObject.NULL); excessiveTracks.add(null); }
        excessive.put(row("999")); excessiveTracks.add(new Track("999", "Beyond bounded input", "", "", 0));
        assertTrue(TrackMetadataCodec.decode(excessive).isEmpty()); assertEquals(0, TrackMetadataCodec.encode(excessiveTracks).length());
    }

    @Test public void nullInputsProduceIndependentEmptyResults() {
        assertEquals(0, TrackMetadataCodec.encode(null).length());
        List<Track> first = TrackMetadataCodec.decode(null); first.add(new Track("1", "Song", "", "", 0));
        assertTrue(TrackMetadataCodec.decode(null).isEmpty());
    }

    private static JSONObject row(String threadId) throws Exception {
        return new JSONObject().put("source", "").put("sourceId", "").put("threadId", threadId)
                .put("title", "Song " + threadId).put("artist", "Artist").put("cover", "").put("duration", 200);
    }
}
