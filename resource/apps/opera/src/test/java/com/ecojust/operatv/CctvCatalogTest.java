package com.ecojust.operatv;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class CctvCatalogTest {
    private final String guid = "d5198f0ae8834a03b4dc6d95628d1cc6";
    private JSONObject row(int index) throws Exception {
        return new JSONObject().put("guid",String.format(java.util.Locale.ROOT,"%032x",index))
                .put("title","节目 " + index).put("url","https://tv.cctv.com/2026/11/10/episode" + index + ".shtml")
                .put("image","https://p1.img.cctvpic.com/example.jpg");
    }
    private String listing(JSONArray rows, int total) throws Exception {
        return new JSONObject().put("data",new JSONObject().put("total",total).put("list",rows)).toString();
    }
    private OperaItem item() { return new OperaItem("cctv:"+guid,"节目","","","cctv",guid,"https://tv.cctv.com/example.shtml"); }
    private JSONObject publicVideo() throws Exception {
        return new JSONObject().put("ack","yes").put("public","1").put("play","1")
                .put("is_protected","0").put("is_invalid_copyright","0").put("is_preview","0")
                .put("hls_url","https://hls.cntv.cdn20.com/example/main.m3u8?temporary=1");
    }
    @Test public void requestsOnlyRegisteredColumnsAndBoundedPages() throws Exception {
        List<String> calls = new ArrayList<>();
        CctvCatalog catalog = new CctvCatalog(url -> { calls.add(url); return "{\"data\":{\"total\":0,\"list\":[]}}"; });
        assertEquals(5,CctvCatalog.columns().size());
        catalog.load(CctvCatalog.columns().get(0).id,2);
        assertTrue(calls.get(0).startsWith("https://api.cntv.cn/NewVideo/getVideoListByColumn?id=TOPC"));
        assertTrue(calls.get(0).contains("&n=20&sort=desc&p=2&"));
        try { catalog.load("https://untrusted.example/",1); fail(); } catch (IOException expected) { }
        try { catalog.load(CctvCatalog.columns().get(0).id,0); fail(); } catch (IOException expected) { }
        assertEquals(1,calls.size());
    }
    @Test public void paginationDoesNotLoopForEmptyOrPartialPages() throws Exception {
        JSONArray full = new JSONArray(); for(int i=0;i<20;i++) full.put(row(i));
        CctvCatalog.Column column=CctvCatalog.columns().get(0);
        assertTrue(CctvCatalog.parsePage(listing(full,43),column,1).hasMore);
        assertTrue(CctvCatalog.parsePage(listing(full,43),column,2).hasMore);
        assertFalse(CctvCatalog.parsePage(listing(new JSONArray().put(row(40)),43),column,3).hasMore);
        assertFalse(CctvCatalog.parsePage(listing(new JSONArray(),1000),column,1).hasMore);
        assertFalse(CctvCatalog.parsePage(listing(full,10000),column,50).hasMore);
    }
    @Test public void skipsMalformedRowsAndDeduplicatesValidReferences() throws Exception {
        JSONArray rows=new JSONArray().put(JSONObject.NULL).put(row(1)).put(row(1))
                .put(row(2).put("url","https://tv.cctv.com.evil.example/a"))
                .put(row(3).put("title",new JSONObject()))
                .put(row(4).put("image","javascript:alert(1)"));
        CctvCatalog.Page page=CctvCatalog.parsePage(listing(rows,6),CctvCatalog.columns().get(0),1);
        assertEquals(2,page.items.size()); assertEquals("",page.items.get(1).imageUrl);
        try {page.items.clear(); fail();} catch (UnsupportedOperationException expected) { }
    }
    @Test public void nullInvalidAndEntirelyMalformedCatalogsFailWithReadableErrors() throws Exception {
        String[] bad={"","null","<html>error</html>","{\"data\":null}","{\"data\":{\"list\":[]}}",
                listing(new JSONArray().put(row(1).put("guid","invalid")),1)};
        for(String json:bad) {
            try {CctvCatalog.parsePage(json,CctvCatalog.columns().get(0),1);fail(json);}
            catch(IOException expected){assertNotNull(expected.getMessage());}
        }
    }
    @Test public void rejectsDeepOrTrailingJsonBeforeRecursiveParsing() throws Exception {
        StringBuilder deep=new StringBuilder("{\"data\":");
        for(int i=0;i<100;i++)deep.append('[');
        deep.append('0');for(int i=0;i<100;i++)deep.append(']');deep.append('}');
        for(String json:new String[]{deep.toString(),"{\"data\":{\"total\":0,\"list\":[]}}{}"}){
            try{CctvCatalog.parsePage(json,CctvCatalog.columns().get(0),1);fail();}
            catch(IOException expected){assertTrue(expected.getMessage().contains("JSON"));}
        }
    }
    @Test public void resolvesPublicVideoAtEachPlayWithoutCachingSignedAddresses() throws Exception {
        List<String> requests=new ArrayList<>();
        String json=publicVideo().toString();
        CctvCatalog catalog=new CctvCatalog(url->{requests.add(url);return json;});
        CctvCatalog.PlaybackSource source=catalog.resolve(item()); catalog.resolve(item());
        assertEquals(2,requests.size()); assertTrue(requests.get(0).endsWith("?pid="+guid));
        assertTrue(source.url.startsWith("https://")); assertEquals(item().pageUrl,source.headers.get("Referer"));
    }
    @Test public void respectsPublicPlaybackRestrictionsAndMissingFlags() throws Exception {
        for(String flag:new String[]{"public","play","is_protected","is_invalid_copyright","is_preview"}) {
            JSONObject json=publicVideo(); json.put(flag,flag.equals("public")||flag.equals("play")?"0":"1");
            rejectPlayback(json.toString());
            json=publicVideo();json.remove(flag);rejectPlayback(json.toString());
        }
        rejectPlayback("{}");rejectPlayback(publicVideo().put("hls_url",JSONObject.NULL).toString());
        rejectPlayback(publicVideo().put("hls_url","http://example.com/insecure.m3u8").toString());
        rejectPlayback(publicVideo().put("hls_url","https://user:pass@example.com/a").toString());
    }
    @Test public void directAndDocumentReferencesDoNotInvokePublicCatalog() throws Exception {
        CctvCatalog catalog=new CctvCatalog(url->{throw new AssertionError("Network must not be called");});
        for(String uri:new String[]{"http://192.168.1.9/video.mp4","content://com.example.documents/video/1"}) {
            CctvCatalog.PlaybackSource resolved=catalog.resolve(OperaItem.direct("Test",uri,""));
            assertEquals(uri,resolved.url);assertTrue(resolved.headers.isEmpty());
        }
    }
    private void rejectPlayback(String json) throws Exception {
        try{new CctvCatalog(url->json).resolve(item());fail(json);}catch(IOException expected){assertNotNull(expected.getMessage());}
    }
}
