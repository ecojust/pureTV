package com.ecojust.putrtvstore;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.junit.Test;
import static org.junit.Assert.*;

public class StoreCatalogTest {
    private static StoreEntry entry(String id, String category) {
        return new StoreEntry(id, id, id, "", "", category, "com.example.app", "1.0", "", "", "", "", "", "", 1, 1, 19);
    }

    @Test public void catalogExcludesLauncherByEitherCategoryOrIdentityAndPreservesAppOrder() {
        StoreEntry media = entry("apps/media", "media"), game = entry("apps/game", "game"), tool = entry("apps/tool", "tools");
        List<StoreEntry> source = new ArrayList<>(Arrays.asList(entry("launcher/puretv", "launcher"), media,
                entry("apps/old-launcher", "launcher"), game, entry("launcher/old-category", "tools"), tool));
        StoreCatalog catalog = new StoreCatalog("revision", "saved", "", 0, true, source);
        assertEquals(Arrays.asList(media, game, tool), catalog.entries);
        source.clear(); assertEquals(3, catalog.entries.size());
        try { catalog.entries.add(entry("launcher/late", "launcher")); fail("Catalog must remain immutable"); }
        catch (UnsupportedOperationException expected) { }
    }
}
