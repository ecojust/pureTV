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
        this.entries = Collections.unmodifiableList(new ArrayList<>(entries));
    }
}
