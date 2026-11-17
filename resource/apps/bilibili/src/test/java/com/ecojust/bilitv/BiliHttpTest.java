package com.ecojust.bilitv;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class BiliHttpTest {
    static final class Jar implements BiliHttp.CookieJar {
        long epoch; int accepted;
        public long generation() { return epoch; }
        public String cookieHeader(String url) { return "SESSDATA=test-only"; }
        public void acceptCookies(String url, List<String> cookies, long expected) { if (epoch == expected) accepted += cookies.size(); }
    }
    static BiliHttp.Response json(String text) throws Exception { return new BiliHttp.Response(200, null, text.getBytes("UTF-8")); }
    @Test public void foreignAndCleartextEndpointsNeverReceiveCookies() throws Exception {
        int[] requests = {0}; Jar jar = new Jar();
        BiliHttp http = new BiliHttp(jar, request -> { requests[0]++; return new BiliHttp.Response(200, null, new byte[0]); });
        for (String url : new String[]{"http://api.bilibili.com/x", "https://api.bilibili.com.evil.invalid/x", "https://api.bilibili.com@evil.invalid/x", "https://api.bilibili.com:444/x", "https://127.0.0.1/x"}) {
            try { http.get(url, Collections.emptyMap()); fail(url); } catch (BiliHttp.ApiException error) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE,error.kind); }
        }
        assertEquals(0, requests[0]);
    }
    @Test public void unsafeRedirectIsRejectedBeforeNextRequest() throws Exception {
        int[] requests = {0};
        BiliHttp http = new BiliHttp(new Jar(), request -> { requests[0]++; return new BiliHttp.Response(302, Collections.singletonMap("Location",Collections.singletonList("https://other.invalid/steal")), new byte[0]); });
        try { http.get("/x/test", Collections.emptyMap()); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE, expected.kind); }
        assertEquals(1, requests[0]);
    }
    @Test public void mutationIsNotReplayedOnRedirect() throws Exception {
        int[] requests = {0};
        BiliHttp http = new BiliHttp(new Jar(), request -> { requests[0]++; return new BiliHttp.Response(307, Collections.singletonMap("Location",Collections.singletonList("https://api.bilibili.com/x/other")), new byte[0]); });
        try { http.post("/x/test", BiliHttp.params("csrf","fixture")); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE, expected.kind); }
        assertEquals(1, requests[0]);
    }
    @Test public void logoutDiscardsInflightResponseAndItsCookies() throws Exception {
        Jar jar = new Jar();
        BiliHttp http = new BiliHttp(jar, request -> { jar.epoch++; return new BiliHttp.Response(200, Collections.singletonMap("Set-Cookie",Collections.singletonList("SESSDATA=stale; Domain=.bilibili.com; Secure")), "{\"code\":0}".getBytes("UTF-8")); });
        try { http.get("/x/test", Collections.emptyMap()); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.CANCELLED, expected.kind); }
        assertEquals(0, jar.accepted);
    }
    @Test public void explicitlyStaleTicketDoesNotStartARequest() throws Exception {
        Jar jar = new Jar(); jar.epoch = 3; int[] requests = {0};
        BiliHttp http = new BiliHttp(jar, request -> { requests[0]++; return new BiliHttp.Response(200,null,new byte[0]); });
        try { http.get("https://passport.bilibili.com/x/test", Collections.emptyMap(),2); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.CANCELLED, expected.kind); }
        assertEquals(0, requests[0]);
    }
    @Test public void rateLimitAndExpiredSessionHaveDifferentKinds() throws Exception {
        BiliHttp limited = new BiliHttp(new Jar(), request -> new BiliHttp.Response(412,null,new byte[0]));
        try { limited.get("/x/test", Collections.emptyMap()); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.RATE_LIMITED, expected.kind); assertEquals(412,expected.code); }
        BiliHttp expired = new BiliHttp(new Jar(), request -> new BiliHttp.Response(200,null,"{\"code\":-101,\"message\":\"untrusted text\"}".getBytes("UTF-8")));
        try { expired.get("/x/test",Collections.emptyMap()); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.AUTH_REQUIRED,expected.kind); assertFalse(expected.getMessage().contains("untrusted")); }
    }
    @Test public void malformedAndOversizedResponsesDoNotBecomeEmptySuccesses() throws Exception {
        for (byte[] body : new byte[][]{"<html>error</html>".getBytes("UTF-8"),new byte[BiliHttp.MAX_BODY+1]}) {
            BiliHttp http = new BiliHttp(new Jar(), request -> new BiliHttp.Response(200,null,body));
            try { http.get("/x/test",Collections.emptyMap()); fail(); } catch (BiliHttp.ApiException expected) { assertEquals(BiliHttp.Kind.INVALID_RESPONSE,expected.kind); }
        }
    }
    @Test public void formEscapesUntrustedCharactersWithoutLosingText() throws Exception {
        List<BiliHttp.Request> seen = new ArrayList<>();
        BiliHttp http = new BiliHttp(new Jar(), request -> { seen.add(request); return new BiliHttp.Response(200,null,"{\"code\":0}".getBytes("UTF-8")); });
        http.post("https://passport.bilibili.com/x/test",BiliHttp.params("keyword","a & 中文+", "csrf","fixture"));
        assertEquals("POST",seen.get(0).method);
        assertEquals("keyword=a%20%26%20%E4%B8%AD%E6%96%87%2B&csrf=fixture",new String(seen.get(0).body,"UTF-8"));
        assertEquals("SESSDATA=test-only",seen.get(0).headers.get("Cookie"));
    }
    @Test public void wbiSignatureMatchesKnownCanonicalQuery() throws Exception {
        Map<String,String> values = BiliHttp.signedParameters(BiliHttp.params("foo","114","bar","514","baz","1919810"),"ea1db124af3c7062474693fa704f4ff8",1702204169L);
        assertEquals("6149fdadf571698ca7e6a567265cd0ee",values.get("w_rid"));
        assertEquals("1702204169",values.get("wts"));
        assertEquals("hello",BiliHttp.signedParameters(BiliHttp.params("q","he!l'l(o)*"),"fixture",1).get("q"));
    }
}
