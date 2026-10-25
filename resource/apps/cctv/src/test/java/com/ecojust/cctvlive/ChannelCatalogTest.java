package com.ecojust.cctvlive;

import android.content.Context;
import android.content.res.Configuration;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="zh-rCN")
public class ChannelCatalogTest {
    private List<ChannelCatalog.Channel> parse(String body) throws IOException {
        return ChannelCatalog.parse(body.getBytes(StandardCharsets.UTF_8));
    }
    private String record(String id, String url) {
        return record(id, url, "https://tv.cctv.com/live/cctv1/");
    }
    private String record(String id, String url, String pageUrl) {
        return "#EXTINF:-1 tvg-id=\"" + id + "\" page-url=\"" + pageUrl + "\",频道\n" + url + "\n";
    }
    private void rejects(String body) throws Exception {
        try { parse(body); fail("Catalog should be rejected"); } catch (IOException expected) { assertFalse(expected.getMessage().isEmpty()); }
    }

    @Test public void mergesRepeatedIdsInFirstAppearanceOrderAndDeduplicatesRoutes() throws Exception {
        List<ChannelCatalog.Channel> channels = parse("\uFEFF#EXTM3U\r\n"
                + "#EXTINF:-1 tvg-id=\"one\" page-url=\"https://tv.cctv.com/live/cctv1/\" tvg-name-en=\"One, HD\" route-name=\"主线路\" route-name-en=\"Primary\",频道一,高清\r\nhttps://example.com/one.m3u8\r\n"
                + record("two", "https://example.com/two.m3u8", "https://tv.cctv.com/live/cctv2/")
                + "#EXTINF:-1 tvg-id='one' page-url='https://tv.cctv.com/live/cctv1/' route-name='备用线路' route-name-en='Backup',不同显示名\nhttps://example.org/one.m3u8\n"
                + record("one", "https://example.com/one.m3u8")
                + "# 备用注释 https://example.org/not-a-route.m3u8\nhttps://example.org/bare-url.m3u8\n");
        assertEquals(2, channels.size()); assertEquals("one", channels.get(0).id); assertEquals("two", channels.get(1).id);
        ChannelCatalog.Channel first = channels.get(0);
        assertEquals("频道一,高清", first.name); assertEquals("One, HD", first.englishName); assertEquals(2, first.routes.size());
        assertEquals("主线路", first.routes.get(0).label); assertEquals("Backup", first.routes.get(1).englishLabel);
        assertEquals("https://example.org/one.m3u8", first.routes.get(1).url);
        assertEquals("https://tv.cctv.com/live/cctv1/", first.pageUrl);
        assertEquals("https://tv.cctv.com/live/cctv2/", channels.get(1).pageUrl);
        try { channels.clear(); fail(); } catch (UnsupportedOperationException expected) {}
        try { first.routes.clear(); fail(); } catch (UnsupportedOperationException expected) {}
    }

    @Test public void bundledCatalogRetainsAllTwentyOneChannelsAndExactPrimaryAndBackupAddresses() throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        byte[] bytes = ChannelCatalog.read(context.getAssets().open("channels.m3u"));
        List<ChannelCatalog.Channel> channels = ChannelCatalog.load(context);
        assertTrue(bytes.length < 20 * 1024); assertEquals(21, channels.size());
        String[] ids = {"cctv1","cctv2","cctv3","cctv4","cctv5","cctv5plus","cctv6","cctv7","cctv8","cctv9","cctv10","cctv11","cctv12","cctv13","cctv14","cctv15","cctv16","cctv17","cctveurope","cctvamerica","cctv4k"};
        String[] names = {"CCTV-1 综合","CCTV-2 财经","CCTV-3 综艺","CCTV-4 中文国际（亚）","CCTV-5 体育","CCTV-5+ 体育赛事","CCTV-6 电影","CCTV-7 国防军事","CCTV-8 电视剧","CCTV-9 纪录","CCTV-10 科教","CCTV-11 戏曲","CCTV-12 社会与法","CCTV-13 新闻","CCTV-14 少儿","CCTV-15 音乐","CCTV-16 奥林匹克","CCTV-17 农业农村","CCTV-4 中文国际（欧）","CCTV-4 中文国际（美）","CCTV-4K 超高清"};
        String[] pages = {
                "https://tv.cctv.com/live/cctv1/", "https://tv.cctv.com/live/cctv2/", "https://tv.cctv.com/live/cctv3/",
                "https://tv.cctv.com/live/cctv4/", "https://tv.cctv.com/live/cctv5/", "https://tv.cctv.com/live/cctv5plus/",
                "https://tv.cctv.com/live/cctv6/", "https://tv.cctv.com/live/cctv7/", "https://tv.cctv.com/live/cctv8/",
                "https://tv.cctv.com/live/cctvjilu/", "https://tv.cctv.com/live/cctv10/", "https://tv.cctv.com/live/cctv11/",
                "https://tv.cctv.com/live/cctv12/", "https://tv.cctv.com/live/cctv13/", "https://tv.cctv.com/live/cctvchild/",
                "https://tv.cctv.com/live/cctv15/", "https://tv.cctv.com/live/cctv16/", "https://tv.cctv.com/live/cctv17/",
                "https://tv.cctv.com/live/cctveurope/", "https://tv.cctv.com/live/cctvamerica/", ""};
        int routes = 0;
        for (int i = 0; i < ids.length; i++) {
            String id = ids[i]; ChannelCatalog.Channel channel = channels.get(i);
            assertEquals(id + ".cn", channel.id); assertEquals(names[i], channel.name); assertFalse(channel.englishName.isEmpty());
            assertEquals(pages[i], channel.pageUrl);
            if (!channel.pageUrl.isEmpty()) assertEquals(pages[i], ChannelCatalog.safePageUrl(channel.pageUrl));
            String prefix = Arrays.asList("cctv1", "cctv13").contains(id) ? "ldn"
                    : Arrays.asList("cctv5", "cctv5plus", "cctv16").contains(id) ? "ld" : "ldo";
            assertEquals("https://" + prefix + "cctvwbcdtxy.liveplay.myqcloud.com/" + prefix + "cctvwbcd/cdrmld" + id + "_1/index.m3u8", channel.routes.get(0).url);
            assertEquals("主线路", channel.routes.get(0).label); assertEquals("Primary", channel.routes.get(0).englishLabel);
            boolean backup = !Arrays.asList("cctv3", "cctv6", "cctv8").contains(id);
            assertEquals(backup ? 2 : 1, channel.routes.size());
            if (backup) {
                assertEquals("https://" + prefix + "cctvwbcdcnc.v.wscdns.com/" + prefix + "cctvwbcd/cdrmld" + id + "_1_1080P/playlist.m3u8?wsApp=HLS", channel.routes.get(1).url);
                assertEquals("备用线路", channel.routes.get(1).label); assertEquals("Backup", channel.routes.get(1).englishLabel);
            }
            routes += channel.routes.size();
        }
        assertEquals(39, routes);
    }

    @Test public void displayNamesUseEnglishMetadataAndFallBackWhenAbsent() throws Exception {
        Context chinese = RuntimeEnvironment.getApplication(); Configuration config = new Configuration(chinese.getResources().getConfiguration());
        config.setLocale(Locale.US); Context english = chinese.createConfigurationContext(config);
        ChannelCatalog.Channel channel = ChannelCatalog.load(chinese).get(0);
        assertEquals("CCTV-1 综合", channel.displayName(chinese)); assertEquals("CCTV-1 General", channel.displayName(english));
        assertEquals("主线路", channel.routes.get(0).displayName(chinese)); assertEquals("Primary", channel.routes.get(0).displayName(english));
        ChannelCatalog.Channel fallback = parse("#EXTM3U\n" + record("fallback", "https://example.com/live.m3u8")).get(0);
        assertEquals(fallback.name, fallback.displayName(english)); assertEquals("Route 1", fallback.routes.get(0).displayName(english));
    }

    @Test public void preservesNonWhitelistedIdsAndBothHttpSchemes() throws Exception {
        List<ChannelCatalog.Channel> channels = parse("#EXTM3U\n"
                + record("future-cctv", "http://192.168.1.10/live.m3u8")
                + record("second", "https://example.com/live.m3u8?wsApp=HLS&token=a%2Fb"));
        assertEquals("future-cctv", channels.get(0).id); assertEquals(2, channels.size());
        assertEquals("https://example.com/live.m3u8?wsApp=HLS&token=a%2Fb", channels.get(1).routes.get(0).url);
    }

    @Test public void rejectsOversizedCatalogsAndExcessChannelsOrRoutesWithoutSilentTruncation() throws Exception {
        try { ChannelCatalog.parse(new byte[ChannelCatalog.MAX_BYTES + 1]); fail(); } catch (IOException expected) {}
        StringBuilder channels = new StringBuilder("#EXTM3U\n");
        for (int i = 0; i < 100; i++) channels.append(record("channel-" + i, "https://example.com/" + i + ".m3u8"));
        assertEquals(100, parse(channels.toString()).size());
        rejects(channels.append(record("over-limit", "https://example.com/extra.m3u8")).toString());
        StringBuilder routes = new StringBuilder("#EXTM3U\n");
        for (int i = 0; i < 4; i++) routes.append(record("one", "https://example.com/" + i + ".m3u8"));
        assertEquals(4, parse(routes.toString()).get(0).routes.size());
        rejects(routes.append(record("one", "https://example.com/extra.m3u8")).toString());
    }

    @Test public void rejectsHlsHtmlMissingUrlsMalformedUtf8AndUnsafeAddresses() throws Exception {
        for (String body : new String[]{"<html>error</html>", "#EXTM3U\n#EXT-X-TARGETDURATION:6\nsegment.ts", "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=20\nstream.m3u8", "#EXTM3U\n#EXTINF:-1,频道\n", "#EXTM3U\n#EXTINF:-1 tvg-id=\"broken,频道\nhttps://example.com/live.m3u8"}) rejects(body);
        try { ChannelCatalog.parse(new byte[]{(byte)0xc3, (byte)0x28}); fail(); } catch (IOException expected) {}
        for (String url : new String[]{"file:///x", "content://media/1", "udp://239.1.1.1:1234", "https://user:password@example.com/live", "https://example.com/live#fragment", "https://example.com/live|User-Agent=x", "https://example.com:65536/live", "javascript:alert(1)"}) {
            try { ChannelCatalog.safeUrl(url); fail(url); } catch (IOException expected) {}
        }
        assertEquals("http://[::1]:8080/live.m3u8", ChannelCatalog.safeUrl("http://[::1]:8080/live.m3u8"));
    }

    @Test public void rejectsMissingUnsafeAndConflictingOfficialPagesBeforeDeduplicatingRoutes() throws Exception {
        rejects("#EXTM3U\n#EXTINF:-1 tvg-id=\"one\",频道\nhttps://example.com/one.m3u8\n");
        for (String page : new String[]{"", "http://tv.cctv.com/live/cctv1/", "https://example.com/live/cctv1/",
                "https://tv.cctv.com.evil.example/live/cctv1/", "https://evil.tv.cctv.com/live/cctv1/",
                "https://tv.cctv.com/video/cctv1/", "https://tv.cctv.com/live/", "https://tv.cctv.com/livestream/cctv1/",
                "https://tv.cctv.com/live/../video/", "https://tv.cctv.com/live/%2e%2e/video/", "https://tv.cctv.com/live/cctv1%2f..%2f..%2fvideo/",
                "https://user:password@tv.cctv.com/live/cctv1/", "https://tv.cctv.com:8443/live/cctv1/",
                "https://tv.cctv.com/live/cctv1/#fragment", "file:///live/cctv1/", "javascript:alert(1)"}) {
            rejects("#EXTM3U\n" + record("one", "https://example.com/one.m3u8", page));
            try { ChannelCatalog.safePageUrl(page); fail(page); } catch (IOException expected) {}
        }
        try { ChannelCatalog.safePageUrl(null); fail(); } catch (IOException expected) {}
        for (String stream : new String[]{"https://example.com/one.m3u8", "https://example.com/backup.m3u8"}) {
            rejects("#EXTM3U\n" + record("one", "https://example.com/one.m3u8", "https://tv.cctv.com/live/cctv1/")
                    + record("one", stream, "https://tv.cctv.com/live/cctv2/"));
        }
        assertEquals("https://tv.cctv.com/live/future-channel/", ChannelCatalog.safePageUrl("https://tv.cctv.com/live/future-channel/"));
        assertEquals("https://tv.cctv.com/live/cctv1/index.shtml", ChannelCatalog.safePageUrl("https://tv.cctv.com/live/cctv1/index.shtml"));
        assertEquals("https://tv.cctv.com/live/cctv1/m/", ChannelCatalog.safePageUrl("https://tv.cctv.com/live/cctv1/m/"));
    }

    @Test public void explicitUnavailablePagesRemainVisibleButCannotConflictWithPlayableMetadata() throws Exception {
        String unavailable = "#EXTINF:-1 tvg-id=\"one\" page-unavailable=\"true\",暂未提供官网播放页\nhttps://example.com/one.m3u8\n";
        List<ChannelCatalog.Channel> channels = parse("#EXTM3U\n" + unavailable + unavailable);
        assertEquals(1, channels.size()); assertEquals("", channels.get(0).pageUrl); assertEquals(1, channels.get(0).routes.size());
        for (String invalid : new String[]{unavailable.replace("page-unavailable=\"true\"", "page-unavailable=\"false\""),
                unavailable.replace("page-unavailable=\"true\"", "page-unavailable=\"unknown\""),
                unavailable.replace("page-unavailable=\"true\"", "page-unavailable=\"true\" page-url=\"\""),
                unavailable.replace("page-unavailable=\"true\"", "page-unavailable=\"true\" page-url=\"https://tv.cctv.com/live/cctv1/\"")}) {
            rejects("#EXTM3U\n" + invalid);
        }
        String playable = record("one", "https://example.com/one.m3u8");
        rejects("#EXTM3U\n" + unavailable + playable);
        rejects("#EXTM3U\n" + playable + unavailable);
    }

    @Test public void boundedReadsCloseTheInputEvenOnFailure() throws Exception {
        final boolean[] closed = {false};
        ByteArrayInputStream stream = new ByteArrayInputStream(new byte[ChannelCatalog.MAX_BYTES + 1]) {
            @Override public void close() { closed[0] = true; }
        };
        try { ChannelCatalog.read(stream); fail(); } catch (IOException expected) { assertTrue(closed[0]); }
    }
}
