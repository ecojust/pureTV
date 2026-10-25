package com.ecojust.hifinitv;

import org.junit.Test;
import static org.junit.Assert.*;

public class TrackTest {
    @Test public void catalogIdentityDoesNotInventAForumTopic() {
        Track catalog = Track.catalog("netease", "2057626026", "0", "Song", "Artist", "", 233);
        assertEquals("netease:2057626026", catalog.id); assertEquals("", catalog.threadId);
        assertEquals("https://www.hifini.net/", catalog.pageUrl());
        Track linked = Track.catalog("kuwo", "84721098", "242691", "Song", "Artist", "", 241);
        assertEquals("https://www.hifini.net/thread-242691.htm", linked.pageUrl());
        Track resolved = linked.withMetadata("Resolved song", "Resolved artist", "https://example.invalid/art.png");
        assertEquals(linked.id, resolved.id); assertEquals(linked.sourceId, resolved.sourceId);
        assertEquals(linked.threadId, resolved.threadId); assertEquals(241, resolved.duration);
        assertNotEquals(Track.catalog("netease", "84721098", null, "Song", "Artist", "", 0).id, linked.id);
    }
    @Test public void sourceIdentityIsAStableThreadAndNeverAnExpiringMediaUrl() {
        Track song = new Track("123456", "夜行星", "林间来客", "https://covers.example.org/song.png", 226);
        assertEquals("https://www.hifini.net/thread-123456.htm", song.pageUrl());
        assertEquals("夜行星", song.title); assertEquals("林间来客", song.artist);
        for (String invalid : new String[]{"", "0", "-1", "01", "../123", "123?token=abc", "https://audio.example.org/song?token=123", "1234567890123"}) {
            try { new Track(invalid, "Song", "", "", 0); fail("Must reject non-thread identity: " + invalid); }
            catch (IllegalArgumentException expected) { }
        }
    }
}
