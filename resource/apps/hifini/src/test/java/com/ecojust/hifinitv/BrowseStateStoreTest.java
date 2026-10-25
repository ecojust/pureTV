package com.ecojust.hifinitv;

import android.content.Context;
import android.content.SharedPreferences;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class BrowseStateStoreTest {
    private SharedPreferences preferences;
    private BrowseStateStore store;

    @Before public void prepare() {
        preferences = RuntimeEnvironment.getApplication().getSharedPreferences("browse-state-test", Context.MODE_PRIVATE);
        preferences.edit().clear().commit();
        store = new BrowseStateStore(preferences);
    }

    @Test public void reopenedStoreAndBundleRestoreQueryResultsAndBothListPositions() throws Exception {
        BrowseStateStore.State state = example();
        store.save(state);
        BrowseStateStore.State restored = new BrowseStateStore(preferences).load();
        assertExample(restored);
        assertExample(BrowseStateStore.deserialize(BrowseStateStore.serialize(state)));
        assertEquals(1, preferences.getAll().size());
        JSONObject document = new JSONObject(preferences.getString(BrowseStateStore.RECORD, ""));
        assertFalse(document.has("status"));
        assertFalse(document.has("localTracks"));
        assertFalse(document.has("selectedIds"));
        assertFalse(document.has("focus"));
        // Saved metadata is an independent snapshot, not the Activity's mutable list.
        state.tracks.clear();
        assertEquals(2, store.load().tracks.size());
    }

    @Test public void contextConstructorUsesAnIndependentPrivatePreferenceFile() {
        Context context = RuntimeEnvironment.getApplication();
        SharedPreferences actual = context.getSharedPreferences(BrowseStateStore.PREFERENCES, Context.MODE_PRIVATE);
        actual.edit().clear().commit();
        SharedPreferences unrelated = context.getSharedPreferences("other-feature", Context.MODE_PRIVATE);
        unrelated.edit().putString(BrowseStateStore.RECORD, "keep this value").commit();
        new BrowseStateStore(context).save(example());
        assertExample(new BrowseStateStore(context).load());
        assertEquals("keep this value", unrelated.getString(BrowseStateStore.RECORD, ""));
        assertEquals(1, actual.getAll().size());
    }

    @Test public void missingCorruptOversizedAndUnsupportedDocumentsReturnSafeDefaults() {
        assertDefault(store.load());
        String[] invalid = {
                null, "", "not JSON", "[1,2]", "{", "{\"version\":1} trailing", "{\"version\":2,\"localMode\":false}",
                "{\"version\":\"1\",\"localMode\":false}", "{\"version\":1,\"query\":\"" + "x".repeat(BrowseStateStore.MAX_BYTES) + "\"}",
                "{\"version\":1,\"query\":\"" + "界".repeat(BrowseStateStore.MAX_BYTES / 3 + 1) + "\"}",
                "{\"version\":1,\"tracks\":" + "[".repeat(3000) + "]".repeat(3000) + "}"
        };
        for (String value : invalid) assertDefault(BrowseStateStore.deserialize(value));
        preferences.edit().putInt(BrowseStateStore.RECORD, 42).commit();
        assertDefault(store.load());
    }

    @Test public void metadataAndPositionsAreBoundedBeforePersisting() throws Exception {
        BrowseStateStore.State state = example();
        state.query = "a".repeat(99) + "🎵";
        state.searchPosition.selectedId = "https://media.example.test/song?token=private";
        state.searchPosition.firstId = "wrong-source:123";
        state.searchPosition.selectedIndex = Integer.MAX_VALUE;
        state.searchPosition.firstIndex = Integer.MIN_VALUE;
        state.searchPosition.selectedOffset = Integer.MAX_VALUE;
        state.searchPosition.firstOffset = Integer.MIN_VALUE;
        state.tracks = new ArrayList<>();
        for (int i = 0; i < 60; i++) state.tracks.add(new Track(String.valueOf(1000 + i), "界".repeat(240), "界".repeat(160), "界".repeat(4096), 240));
        String json = BrowseStateStore.serialize(state);
        assertTrue(json.getBytes(StandardCharsets.UTF_8).length <= BrowseStateStore.MAX_BYTES);
        BrowseStateStore.State result = BrowseStateStore.deserialize(json);
        assertEquals("a".repeat(99), result.query);
        assertTrue(result.tracks.size() > 0);
        assertTrue(result.tracks.size() <= TrackMetadataCodec.MAX_TRACKS);
        assertEquals("1000", result.tracks.get(0).id);
        assertEquals("", result.searchPosition.selectedId);
        assertEquals("", result.searchPosition.firstId);
        assertEquals(49, result.searchPosition.selectedIndex);
        assertEquals(0, result.searchPosition.firstIndex);
        assertTrue(Math.abs(result.searchPosition.selectedOffset) <= 16384);
        assertTrue(Math.abs(result.searchPosition.firstOffset) <= 16384);
    }

    @Test public void malformedFieldsAndRowsDoNotLoseTheirValidNeighbors() throws Exception {
        JSONObject document = new JSONObject(BrowseStateStore.serialize(example()));
        document.put("query", new JSONObject().put("audioUrl", "https://private.example.test/audio"));
        document.put("localMode", "false");
        document.put("localTracks", new JSONArray().put("must not restore a local library snapshot"));
        document.put("selectedIds", new JSONArray().put("netease:123"));
        document.put("searchPosition", new JSONObject().put("selectedIndex", "3").put("firstOffset", 1.5).put("selectedId", "netease:123"));
        document.getJSONArray("tracks").put(new JSONObject().put("source", "invalid"));
        BrowseStateStore.State restored = BrowseStateStore.deserialize(document.toString());
        assertEquals("", restored.query);
        assertTrue(restored.localMode);
        assertEquals(2, restored.tracks.size());
        assertEquals(-1, restored.searchPosition.selectedIndex);
        assertEquals(0, restored.searchPosition.firstOffset);
        assertEquals("netease:123", restored.searchPosition.selectedId);
        String clean = BrowseStateStore.serialize(restored);
        assertFalse(clean.contains("audioUrl"));
        assertFalse(clean.contains("selectedIds"));
        assertFalse(clean.contains("localTracks"));
    }

    @Test public void nullStateAndNullableFieldsRemainUsable() {
        assertDefault(BrowseStateStore.deserialize(BrowseStateStore.serialize(null)));
        BrowseStateStore.State state = new BrowseStateStore.State();
        state.query = null; state.tracks = null; state.searchPosition = null; state.localPosition = null;
        store.save(state);
        assertDefault(store.load());
        BrowseStateStore.State restored = store.load();
        restored.tracks.add(new Track("42", "New song", "", "", 0));
        assertEquals(1, restored.tracks.size());
        assertEquals(Collections.emptyList(), store.load().tracks);
    }

    private static BrowseStateStore.State example() {
        BrowseStateStore.State state = new BrowseStateStore.State();
        state.query = "  Night 夜曲  "; state.localMode = false;
        state.tracks = new ArrayList<>(Arrays.asList(Track.catalog("netease", "123", "0", "Night Star", "Forest Guest", "", 226), new Track("456", "夜航", "慢岛乐队", "", 240)));
        state.searchPosition.selectedId = "netease:123"; state.searchPosition.firstId = "456";
        state.searchPosition.selectedIndex = 1; state.searchPosition.firstIndex = 0;
        state.searchPosition.selectedOffset = 97; state.searchPosition.firstOffset = -7;
        state.localPosition.selectedId = "kuwo:789"; state.localPosition.firstId = "kuwo:700";
        state.localPosition.selectedIndex = 12; state.localPosition.firstIndex = 10;
        state.localPosition.selectedOffset = 71; state.localPosition.firstOffset = -13;
        return state;
    }

    private static void assertExample(BrowseStateStore.State state) {
        assertEquals("  Night 夜曲  ", state.query); assertFalse(state.localMode);
        assertEquals(2, state.tracks.size()); assertEquals("netease:123", state.tracks.get(0).id); assertEquals("456", state.tracks.get(1).id);
        assertEquals("netease:123", state.searchPosition.selectedId); assertEquals("456", state.searchPosition.firstId);
        assertEquals(1, state.searchPosition.selectedIndex); assertEquals(0, state.searchPosition.firstIndex);
        assertEquals(97, state.searchPosition.selectedOffset); assertEquals(-7, state.searchPosition.firstOffset);
        assertEquals("kuwo:789", state.localPosition.selectedId); assertEquals("kuwo:700", state.localPosition.firstId);
        assertEquals(12, state.localPosition.selectedIndex); assertEquals(10, state.localPosition.firstIndex);
        assertEquals(71, state.localPosition.selectedOffset); assertEquals(-13, state.localPosition.firstOffset);
    }

    private static void assertDefault(BrowseStateStore.State state) {
        assertNotNull(state); assertTrue(state.localMode); assertEquals("", state.query); assertTrue(state.tracks.isEmpty());
        assertEquals("", state.searchPosition.selectedId); assertEquals(-1, state.searchPosition.selectedIndex);
        assertEquals("", state.localPosition.firstId); assertEquals(0, state.localPosition.firstIndex);
    }
}
