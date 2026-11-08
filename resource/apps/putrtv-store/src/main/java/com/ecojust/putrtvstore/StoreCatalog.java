package com.ecojust.putrtvstore;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class StoreCatalog {
    public final String revision, source, warning;
    public final long fetchedAt;
    public final boolean stale;
    public final List<StoreEntry> entries;

    public StoreCatalog(String revision, String source, String warning, long fetchedAt,
            boolean stale, List<StoreEntry> entries) {
        this.revision = revision; this.source = source; this.warning = warning;
        this.fetchedAt = fetchedAt; this.stale = stale;
        // Older online feeds, saved caches and bundled snapshots can still contain launchers.
        // Filter at the shared boundary so listings, searches and update counts agree.
        List<StoreEntry> apps = new ArrayList<>();
        for (StoreEntry entry : entries) {
            if (!"launcher".equals(entry.category) && !entry.id.startsWith("launcher/")) apps.add(entry);
        }
        this.entries = Collections.unmodifiableList(apps);
    }
}
