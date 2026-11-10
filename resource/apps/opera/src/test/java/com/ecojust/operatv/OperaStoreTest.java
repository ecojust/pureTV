package com.ecojust.operatv;

import android.content.Context;
import android.content.SharedPreferences;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = {19, 28})
public class OperaStoreTest {
    private Context context;
    private SharedPreferences preferences;
    private OperaStore store;

    @Before public void setup() {
        context = RuntimeEnvironment.getApplication();
        preferences = context.getSharedPreferences(OperaStore.PREFERENCES, Context.MODE_PRIVATE);
        preferences.edit().clear().commit();
        store = new OperaStore(context);
    }

    private OperaItem item(int number) { return OperaItem.direct("节目 " + number, "https://example.org/" + number + ".mp4", "我的片单"); }

    @Test public void importFavoriteAndResumeSurviveRecreationWithoutConflatingCollections() throws Exception {
        OperaItem one = item(1), two = item(2);
        assertEquals(2, store.importItems(Arrays.asList(one, two)));
        assertTrue(store.toggleFavorite(one));
        store.record(two, 35000, 300000);
        OperaStore reopened = new OperaStore(context);
        assertEquals(2, reopened.imported().size());
        assertEquals(one.id, reopened.favorites().get(0).id);
        assertEquals(two.id, reopened.history().get(0).id);
        assertEquals(35000, reopened.position(two.id));
        reopened.removeImported(one.id);
        assertEquals(1, store.imported().size());
        assertTrue(store.isFavorite(one.id));
        assertEquals(35000, store.position(two.id));
    }

    @Test public void separateActivityStoresDoNotOverwriteEachOthersNewerState() throws Exception {
        OperaStore player = new OperaStore(context);
        store.importItems(Collections.singletonList(item(1)));
        player.record(item(1), 12000, 100000);
        store.toggleFavorite(item(2));
        player.record(item(1), 22000, 100000);
        assertEquals(1, player.imported().size());
        assertEquals(1, player.favorites().size());
        assertEquals(22000, store.position(item(1).id));
    }

    @Test public void duplicateImportRenamesInPlaceAndReportsOnlyNewUniqueItems() throws Exception {
        store.importItems(Arrays.asList(item(1), item(2)));
        OperaItem renamed = OperaItem.direct("新名称", item(1).uri, "新分组");
        assertEquals(1, store.importItems(Arrays.asList(renamed, item(3), item(3))));
        assertEquals(3, store.imported().size());
        assertEquals("新名称", store.imported().get(0).title);
        assertEquals(item(2).id, store.imported().get(1).id);
    }

    @Test public void invalidOrOverCapacityImportsPreserveTheExactSavedSnapshot() throws Exception {
        List<OperaItem> full = new ArrayList<>();
        for (int i = 0; i < 500; i++) full.add(item(i));
        store.importItems(full);
        String before = preferences.getString(OperaStore.SNAPSHOT, "");
        assertThrows(IOException.class, () -> store.importItems(Collections.singletonList(item(999))));
        assertEquals(before, preferences.getString(OperaStore.SNAPSHOT, ""));
        assertThrows(IOException.class, () -> store.importItems(Arrays.asList(item(1001), null)));
        assertEquals(before, preferences.getString(OperaStore.SNAPSHOT, ""));
    }

    @Test public void completedAndLivePlaybackAreNotResumedAndUnplayedClicksDoNotCreateHistory() {
        store.record(item(1), 0, 10000);
        assertTrue(store.history().isEmpty());
        store.record(item(1), 6000, 10000);
        assertEquals(6000, store.position(item(1).id));
        store.record(item(1), 10000, 10000);
        assertEquals(0, store.position(item(1).id));
        store.record(item(2), 2000, -1);
        assertEquals(0, store.position(item(2).id));
        assertEquals(item(2).id, store.history().get(0).id);
    }

    @Test public void historyEvictsOldestAndClearHistoryPreservesFavoritesAndImports() throws Exception {
        store.importItems(Collections.singletonList(item(0)));
        store.toggleFavorite(item(0));
        for (int i = 0; i <= 100; i++) store.record(item(i), 5000, 100000);
        assertEquals(100, store.history().size());
        assertEquals(item(100).id, store.history().get(0).id);
        assertEquals(0, store.position(item(0).id));
        store.clearHistory();
        assertTrue(new OperaStore(context).history().isEmpty());
        assertTrue(store.isFavorite(item(0).id));
        assertEquals(1, store.imported().size());
    }

    @Test public void corruptedOrUnknownStorageRemainsUntouchedAndBlocksOverwritingWrites() {
        for (String raw : new String[]{"not json", "{\"version\":2,\"imported\":[],\"favorites\":[],\"history\":[],\"positions\":{}}"}) {
            preferences.edit().putString(OperaStore.SNAPSHOT, raw).commit();
            OperaStore damaged = new OperaStore(context);
            assertTrue(damaged.imported().isEmpty());
            assertFalse(damaged.problem().isEmpty());
            assertThrows(IOException.class, () -> damaged.importItems(Collections.singletonList(item(1))));
            damaged.record(item(1), 5000, 100000);
            assertEquals(raw, preferences.getString(OperaStore.SNAPSHOT, ""));
        }
    }
}
