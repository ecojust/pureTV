package com.ecojust.bilitv;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class VideoApiTest {
    private JSONObject root(String data) throws Exception { return new JSONObject("{\"code\":0,\"data\":"+data+"}"); }
    @Test public void searchUsesRealVideoRowsAndFiltersExplicitAds() throws Exception {
        VideoApi.SearchPage page = VideoApi.parseSearch(root("{\"page\":1,\"numPages\":2,\"result\":[{\"type\":\"video\",\"bvid\":\"BV1GJ411x7h7\",\"aid\":1,\"title\":\"A <em>video</em> &amp; text\",\"author\":\"Uploader\",\"pic\":\"//i0.hdslb.com/a.jpg\",\"duration\":\"01:02:03\"},{\"bvid\":\"BV1GJ411x7h8\",\"is_ad\":1},{\"type\":\"live_room\",\"bvid\":\"BV1GJ411x7h9\"},{\"bvid\":\"invalid\"}]}"),1);
        assertEquals(1,page.items.size()); assertTrue(page.hasMore); assertEquals("A video & text",page.items.get(0).title);
        assertEquals(3723,page.items.get(0).durationSeconds); assertEquals("https://i0.hdslb.com/a.jpg",page.items.get(0).cover);
    }
    @Test public void legitimateEmptySearchIsDifferentFromMalformedData() throws Exception {
        assertTrue(VideoApi.parseSearch(root("{\"numResults\":0,\"numPages\":0}"),1).items.isEmpty());
        try { VideoApi.parseSearch(root("{}"),1); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE,expected.kind); }
    }
    @Test public void detailPreservesEachPartAndDoesNotInventMissingCid() throws Exception {
        VideoApi.Detail detail = VideoApi.parseDetail(root("{\"bvid\":\"BV1GJ411x7h7\",\"aid\":2,\"title\":\"Two parts\",\"cid\":10,\"pages\":[{\"cid\":10,\"page\":1,\"part\":\"One\",\"duration\":60},{\"cid\":20,\"page\":2,\"part\":\"Two\",\"duration\":70}]}"));
        assertEquals(2,detail.parts.size()); assertEquals(20,detail.parts.get(1).cid); assertEquals(2,detail.parts.get(1).page);
        try { VideoApi.parseDetail(root("{\"bvid\":\"BV1GJ411x7h7\"}")); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE,expected.kind); }
    }
    @Test public void progressiveSegmentsStayOrderedAndKeepServiceQuality() throws Exception {
        VideoApi.Playback play = VideoApi.parsePlayback(root("{\"quality\":32,\"timelength\":3000,\"durl\":[{\"url\":\"https://test.bilivideo.com/one.mp4?token=fixture\",\"length\":1000,\"backup_url\":[\"http://bad.invalid/a\",\"https://backup.bilivideo.com/one.mp4\"]},{\"url\":\"https://test.bilivideo.com/two.mp4\",\"length\":2000}]}"),64);
        assertEquals(2,play.segments.size()); assertEquals(1000,play.segments.get(0).durationMs); assertEquals(32,play.quality);
        assertEquals(1,play.segments.get(0).backupUrls.size()); assertFalse(play.headers.containsKey("Cookie")); assertEquals("",play.videoUrl);
    }
    @Test public void dashSelectsAvcAndAacWithinRequestedQuality() throws Exception {
        VideoApi.Playback play = VideoApi.parsePlayback(root("{\"dash\":{\"duration\":12,\"video\":[{\"id\":80,\"codecs\":\"avc1.640028\",\"baseUrl\":\"https://test.bilivideo.com/1080.m4s\"},{\"id\":64,\"codecs\":\"hev1\",\"baseUrl\":\"https://test.bilivideo.com/hevc.m4s\"},{\"id\":64,\"codecs\":\"avc1.640028\",\"base_url\":\"https://test.bilivideo.com/720.m4s\"}],\"audio\":[{\"id\":30280,\"codecs\":\"mp4a.40.2\",\"baseUrl\":\"https://test.bilivideo.com/audio.m4s\"}]}}"),64);
        assertTrue(play.segments.isEmpty()); assertTrue(play.videoUrl.endsWith("/720.m4s")); assertTrue(play.audioUrl.endsWith("/audio.m4s")); assertEquals(12000,play.durationMs);
    }
    @Test public void previewAndUnsupportedCodecsAreExplicitFailures() throws Exception {
        for (String value : new String[]{"{\"is_preview\":1,\"durl\":[]}","{\"dash\":{\"video\":[{\"id\":64,\"codecs\":\"av01\"}],\"audio\":[]}}"}) {
            try { VideoApi.parsePlayback(root(value),64); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.RESTRICTED,expected.kind); }
        }
    }
    @Test public void mediaAndCoversCannotBecomeArbitraryLocalRequests() throws Exception {
        for (String value : new String[]{"http://test.bilivideo.com/a", "https://test.bilivideo.com.evil.invalid/a", "file:///sdcard/a", "https://127.0.0.1/a"}) {
            try { VideoApi.mediaUrl(value); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE,expected.kind); }
        }
        assertEquals("",VideoApi.coverUrl("https://unrelated.invalid/a.jpg"));
        assertEquals("https://i0.hdslb.com/a.jpg",VideoApi.coverUrl("http://i0.hdslb.com/a.jpg"));
    }
}
