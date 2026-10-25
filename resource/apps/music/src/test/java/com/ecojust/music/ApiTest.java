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
public class ApiTest {
    @Test public void searchStripsMarkupDeduplicatesAndLimitsResults() throws Exception {
        JSONArray results = new JSONArray();
        for (int i=0; i<20; i++) results.put(new JSONObject().put("bvid",LibraryTest.track(i).id).put("title","<em>钢琴</em> &amp; Live").put("duration","03:42").put("pic","//example.com/cover.jpg"));
        results.put(results.getJSONObject(0));
        List<Track> tracks = BiliApi.parseSearch(new JSONObject().put("code",0).put("data",new JSONObject().put("result", results)));
        assertEquals(12, tracks.size()); assertEquals("钢琴 & Live", tracks.get(0).title); assertEquals(222,tracks.get(0).duration); assertEquals("https://example.com/cover.jpg",tracks.get(0).cover);
    }
    @Test public void choosesLowestBandwidthAacAndNeverDownloadsVideo() throws Exception {
        JSONObject response = new JSONObject("{\"code\":0,\"data\":{\"dash\":{\"audio\":[{\"codecs\":\"flac\",\"bandwidth\":1,\"baseUrl\":\"https://example.com/flac\"},{\"codecs\":\"mp4a.40.2\",\"bandwidth\":128000,\"baseUrl\":\"https://example.com/high\"},{\"codecs\":\"mp4a.40.2\",\"bandwidth\":64000,\"base_url\":\"http://example.com/low\"}]}}}");
        assertEquals("https://example.com/low", BiliApi.parseAudio(response));
    }
    @Test public void refusesUnavailableOrProtectedAudio() throws Exception {
        try { BiliApi.parseAudio(new JSONObject("{\"code\":0,\"data\":{\"durl\":[{\"url\":\"https://example.com/video\"}]}}")); fail(); }
        catch (IOException expected) { assertEquals(R.string.no_aac, ((MusicError)expected).resource); }
    }
    @Test public void verificationFailuresAreVisible() throws Exception {
        try { BiliApi.checked(new JSONObject("{\"code\":-352,\"message\":\"verify\"}")); fail(); }
        catch (IOException expected) { assertEquals(R.string.verification, ((MusicError)expected).resource); }
    }
    @Test public void wbiCanonicalizesWithoutMutatingParameters() throws Exception {
        Map<String,String> params = new HashMap<>(); params.put("keyword", "a b!'()*");
        String signed = BiliApi.sign(params,"test",1700000000);
        assertEquals("keyword=a%20b&wts=1700000000&w_rid=c7c83e10e633862d6646475a3c93246e",signed);
        assertEquals(1,params.size());
    }
    @Test @Config(qualifiers="en-rUS") public void englishErrorsKeepCodesAndDoNotExposeRemoteLanguage() throws Exception {
        android.content.Context context=org.robolectric.RuntimeEnvironment.getApplication();
        for(int code:new int[]{-400,-352,-412,-404}) {
            try{BiliApi.checked(new JSONObject().put("code",code).put("message","中文上游错误"));fail();}
            catch(IOException error){String text=MusicError.display(context,error);assertFalse(text.matches("(?s).*[\\p{IsHan}].*"));assertFalse(text.isEmpty());if(code==-404)assertTrue(text.contains("-404"));if(code==-400)assertTrue(text.contains("-400"));}
        }
        assertEquals(context.getString(R.string.network_timeout),MusicError.display(context,new java.net.SocketTimeoutException()));
        assertEquals(context.getString(R.string.request_failed),MusicError.display(context,new IOException("中文外部错误")));
    }
}
