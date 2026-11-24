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

    @Test public void catalogKeepsEveryMarketCategoryAndFileInOrder() {
        List<StoreEntry> source = new ArrayList<>(Arrays.asList(entry("launcher/puretv.apk", "launcher"),
                entry("game/puzzle.apk", "game"), entry("media/tv-2.0.apk", "media"), entry("media/tv-1.0.apk", "media")));
        StoreCatalog catalog = new StoreCatalog("revision", "saved", "", 0, true, source);
        assertEquals(source, catalog.entries);
        source.clear(); assertEquals(4, catalog.entries.size());
        try { catalog.entries.clear(); fail("Catalog must remain immutable"); }
        catch (UnsupportedOperationException expected) { }
    }
}
