package com.ecojust.music;

import org.json.*;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.io.IOException;
import java.util.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class PlaybackApiTest {
    private static final String PAGES="{\"code\":0,\"data\":[{\"cid\":137649199,\"part\":\"Never Gonna Give You Up\",\"duration\":213}]}";
    private static final String AUDIO="{\"code\":0,\"data\":{\"dash\":{\"audio\":[{\"id\":30216,\"codecs\":\"mp4a.40.2\",\"bandwidth\":64000,\"baseUrl\":\"https://cdn.example.com/audio.m4s\"}]}}}";
    private Track track() {return new Track("BV1GJ411x7h7","Rick Astley","Artist","","",213);}
    private JSONObject json(String text) throws IOException {try{return new JSONObject(text);}catch(JSONException e){throw new IOException(e);}}
    @Test public void bvLookupUsesDefaultPageWithoutFullVideoDetails() throws Exception {
        List<String> urls = new ArrayList<>();
        BiliApi api = new BiliApi(url -> { urls.add(url); return json(PAGES); });
        Track track = api.search("https://www.bilibili.com/video/BV1GJ411x7h7/").get(0);
        assertEquals(213, track.duration); assertEquals("Never Gonna Give You Up", track.title);
        assertEquals("BV1GJ411x7h7", track.id); assertEquals(1, urls.size());
        assertTrue(urls.get(0).contains("/pagelist?"));
    }
    @Test public void fullPublicDashRequestIncludesFnverWithoutRequiringWbiNav() throws Exception {
        List<String> urls=new ArrayList<>();
        BiliApi api=new BiliApi(url->{urls.add(url);return json(url.contains("/pagelist?")?PAGES:AUDIO);});
        assertEquals("https://cdn.example.com/audio.m4s",api.audio(track()));assertEquals(2,urls.size());
        String play=urls.get(1);assertTrue(play.startsWith("https://api.bilibili.com/x/player/playurl?"));
        for(String value:new String[]{"bvid=BV1GJ411x7h7","cid=137649199","fnver=0","fnval=16","qn=0","fourk=1"})assertTrue(play,play.contains(value));
        assertFalse(play.contains("w_rid"));
    }
    @Test public void suppliedMinus400FallsBackToSignedRequestOnlyOnce() throws Exception {
        List<String> urls=new ArrayList<>();
        BiliApi api=new BiliApi(url->{
            urls.add(url);
            if(url.contains("/pagelist?"))return json(PAGES);
            if(url.endsWith("/nav"))return json("{\"code\":-101,\"data\":{\"wbi_img\":{\"img_url\":\"https://example.com/01234567890123456789012345678901.png\",\"sub_url\":\"https://example.com/01234567890123456789012345678901.png\"}}}");
            return json("{\"code\":-400,\"message\":\"请求错误\",\"ttl\":1}");
        });
        try{api.audio(track());fail();}catch(IOException expected){assertEquals(R.string.bad_request, ((MusicError)expected).resource);}
        assertEquals(4,urls.size());assertTrue(urls.get(3).contains("/wbi/playurl?"));assertTrue(urls.get(3).contains("w_rid="));assertTrue(urls.get(3).contains("fnver=0"));
    }
    @Test public void verificationFailureDoesNotTryOtherEndpoints() throws Exception {
        List<String> urls=new ArrayList<>();
        BiliApi api=new BiliApi(url->{urls.add(url);return json(url.contains("/pagelist?")?PAGES:"{\"code\":-352,\"message\":\"verify\"}");});
        try{api.audio(track());fail();}catch(IOException expected){assertEquals(R.string.verification, ((MusicError)expected).resource);}
        assertEquals(2,urls.size());
    }
    @Test public void singletonAudioAndBackupUrlWithoutBandwidthRemainPlayable() throws Exception {
        JSONObject response=json("{\"code\":0,\"data\":{\"dash\":{\"audio\":{\"id\":30216,\"mimeType\":\"audio/mp4\",\"baseUrl\":\"\",\"backup_url\":[\"file:///bad\",\"https://cdn.example.com/backup.m4s\"]}}}}");
        assertEquals("https://cdn.example.com/backup.m4s",BiliApi.parseAudio(response));
    }
    @Test public void playbackUsesPublicPagesWithoutFetchingFullView() throws Exception {
        List<String> urls = new ArrayList<>();
        BiliApi api = new BiliApi(url -> {
            urls.add(url);
            if (url.contains("/view?")) throw new IOException("HTTP 412");
            return json(url.contains("/pagelist?") ? PAGES : AUDIO);
        });
        assertEquals("https://cdn.example.com/audio.m4s", api.audio(track()));
        assertTrue(urls.get(0).contains("/pagelist?bvid=BV1GJ411x7h7"));
    }
    @Test public void lcAudioAndBoundedBackupListImproveTvCompatibility() throws Exception {
        JSONObject response = json("{\"code\":0,\"data\":{\"dash\":{\"audio\":[{\"codecs\":\"mp4a.40.5\",\"bandwidth\":32000,\"baseUrl\":\"https://cdn.example.com/he\"},{\"codecs\":\"mp4a.40.2\",\"bandwidth\":64000,\"baseUrl\":\"https://cdn.example.com/lc\",\"backup_url\":[\"file:///bad\",\"https://cdn.example.com/lc\",\"https://backup.example.com/1\",\"https://backup.example.com/2\",\"https://backup.example.com/3\"]}]}}}");
        List<String> urls = BiliApi.parseAudioSources(response);
        assertEquals(3, urls.size()); assertEquals("https://cdn.example.com/lc", urls.get(0));
        assertEquals("https://backup.example.com/1", urls.get(1));
    }
    @Test public void unavailablePagesStopBeforeRequestingAudio() throws Exception {
        List<String> urls = new ArrayList<>();
        BiliApi api = new BiliApi(url -> { urls.add(url); return json("{\"code\":-352,\"message\":\"verify\"}"); });
        try { api.audio(track()); fail(); } catch (IOException e) { assertEquals(R.string.verification, ((MusicError)e).resource); }
        assertEquals(1, urls.size());
        try { BiliApi.pageCid(json("{\"code\":0,\"data\":[]}")); fail(); }
        catch (IOException e) { assertEquals(R.string.no_segments, ((MusicError)e).resource); }
    }
}
