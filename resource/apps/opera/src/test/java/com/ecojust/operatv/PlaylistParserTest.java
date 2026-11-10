package com.ecojust.operatv;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

import java.io.IOException;
import java.util.List;

import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 19)
public class PlaylistParserTest {
    @Test public void extendedM3uRetainsUnicodeAndQuotedCommasAndResolvesRelativeMedia() throws Exception {
        String text = "\ufeff#EXTM3U\r\n#EXTINF:-1 group-title=\"京剧,名段\",贵妃醉酒,选段\r\n../media/a.mp4\n"
                + "#EXTINF:-1,黄梅戏\n#EXTGRP:黄梅戏专场\nhttps://example.org/b.m3u8\n";
        List<OperaItem> items = PlaylistParser.parse(text, "https://example.org/lists/today.m3u");
        assertEquals(2, items.size());
        assertEquals("贵妃醉酒,选段", items.get(0).title);
        assertEquals("京剧,名段", items.get(0).group);
        assertEquals("https://example.org/media/a.mp4", items.get(0).uri);
        assertEquals("黄梅戏专场", items.get(1).group);
    }

    @Test public void jsonSupportsDocumentedEnvelopeAndDeduplicatesWithoutMovingFirstPosition() throws Exception {
        List<OperaItem> items = PlaylistParser.parse("{\"items\":["
                + "{\"title\":\"old\",\"url\":\"https://example.org/a.mp4\"},"
                + "{\"title\":\"second\",\"url\":\"https://example.org/b.mp4\"},"
                + "{\"title\":\"renamed\",\"group\":\"精选\",\"url\":\"https://example.org/a.mp4\"}]}", null);
        assertEquals(2, items.size());
        assertEquals("renamed", items.get(0).title);
        assertEquals("second", items.get(1).title);
        assertEquals("精选", items.get(0).group);
    }

    @Test public void networkHlsMediaAndMasterAreOneSourceRatherThanSegments() throws Exception {
        for (String manifest : new String[]{
                "#EXTM3U\n#EXT-X-TARGETDURATION:10\n#EXTINF:10,\nchunk1.ts\n#EXTINF:10,\nchunk2.ts\n#EXT-X-ENDLIST",
                "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1200000\nlow.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2400000\nhigh.m3u8"}) {
            List<OperaItem> items = PlaylistParser.parse(manifest, "https://example.org/live/master.m3u8");
            assertEquals(1, items.size());
            assertEquals("https://example.org/live/master.m3u8", items.get(0).uri);
            assertEquals("direct", items.get(0).kind);
            assertThrows(IOException.class, () -> PlaylistParser.parse(manifest, null));
        }
    }

    @Test public void localListsCannotGrantAccessToContentOrFilesystemAndInvalidUrisFailWholeImport() {
        for (String address : new String[]{"file:///sdcard/movie.mp4", "content://documents/1", "javascript:alert(1)",
                "data:video/mp4;base64,a", "ftp://example.org/a.mp4", "https://name:password@example.org/a.mp4",
                "https:///missing-host", "https://example.org:70000/a", "https://example.org/a#part", "movie.mp4"}) {
            assertThrows(address, IOException.class, () -> PlaylistParser.parse("#EXTM3U\nhttps://example.org/good.mp4\n" + address, null));
        }
    }

    @Test public void malformedJsonAndDanglingM3uEntriesDoNotProducePartialResults() {
        for (String text : new String[]{"", "#EXTM3U", "{\"items\":null}", "[{\"url\":42}]", "[{\"url\":\"https://example.org/a\",\"title\":null}]",
                "[\"https://example.org/a\"]", "[{\"url\":\"https://example.org/a\"}] trailing", "#EXTINF:-1,title",
                "#EXTINF:-1,title\n#EXTINF:-1,next\nhttps://example.org/a", "<html>not a playlist</html>"}) {
            assertThrows(text, IOException.class, () -> PlaylistParser.parse(text, null));
        }
    }

    @Test public void sizeAndEntryLimitsCountActualBytesAndInputItems() {
        String unicode = new String(new char[400000]).replace('\0', '曲');
        assertThrows(IOException.class, () -> PlaylistParser.parse(unicode, null));
        StringBuilder many = new StringBuilder("#EXTM3U\n");
        for (int i = 0; i <= 500; i++) many.append("https://example.org/same.mp4\n");
        assertThrows(IOException.class, () -> PlaylistParser.parse(many.toString(), null));
        String nested = new String(new char[100]).replace('\0', '[') + "0" + new String(new char[100]).replace('\0', ']');
        assertThrows(IOException.class, () -> PlaylistParser.parse(nested, null));
    }

    @Test public void lanHttpIsAllowedOnlyAsAnExplicitNetworkMediaReference() throws Exception {
        List<OperaItem> items = PlaylistParser.parse("[{\"url\":\"clip.mp4\"}]", "http://192.168.1.20:8080/opera/list.json");
        assertEquals("http://192.168.1.20:8080/opera/clip.mp4", items.get(0).uri);
        assertEquals("clip.mp4", items.get(0).title);
    }
}
