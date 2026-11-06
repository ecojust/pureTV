package com.ecojust.bilitv;

import android.content.Context;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.util.Arrays;
import java.util.Collections;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class SessionStoreTest {
    private Context context;
    private SessionStore session;
    @Before public void prepare() {
        context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("bilitv.session", Context.MODE_PRIVATE).edit().clear().commit();
        session = new SessionStore(context);
    }
    private void receive(String... cookies) {
        session.acceptCookies("https://passport.bilibili.com/x/passport-login/web/qrcode/poll", Arrays.asList(cookies), session.generation());
    }
    @Test public void sessionSurvivesRestartButNeverLeavesOfficialHttpsOrigins() {
        receive("SESSDATA=session-test; Domain=.bilibili.com; Path=/; Secure; HttpOnly", "bili_jct=csrf-test; Domain=.bilibili.com; Path=/");
        assertTrue(session.hasSession()); assertTrue(new SessionStore(context).hasSession());
        assertEquals("csrf-test", session.getCookie("bili_jct"));
        assertTrue(session.cookieHeader("https://api.bilibili.com/x/web-interface/nav").contains("SESSDATA=session-test"));
        for (String url : new String[]{"http://api.bilibili.com/", "https://cdn.bilivideo.com/", "https://api.bilibili.com.evil.test/", "https://i0.hdslb.com/", "https://api.bilibili.com:444/", "https://user@api.bilibili.com/"}) assertEquals(url, "", session.cookieHeader(url));
    }
    @Test public void logoutAndReplacementQrRejectOldCookieResponses() {
        long old = session.generation(); session.clear();
        session.acceptCookies("https://passport.bilibili.com/", Arrays.asList("SESSDATA=stale; Domain=.bilibili.com; Path=/", "bili_jct=stale; Domain=.bilibili.com; Path=/"), old);
        assertFalse(session.hasSession()); assertFalse(new SessionStore(context).hasSession());
        old = session.generation(); session.invalidateRequests();
        session.acceptCookies("https://passport.bilibili.com/", Collections.singletonList("SESSDATA=late; Domain=.bilibili.com; Path=/"), old);
        assertEquals("", session.getCookie("SESSDATA"));
    }
    @Test public void hostOnlyPathAndExpiryAreRespected() {
        receive("only=passport; Path=/x/passport-login", "SESSDATA=value; Domain=.bilibili.com; Path=/; Max-Age=60", "bili_jct=token; Domain=.bilibili.com; Path=/; Max-Age=60");
        assertTrue(session.cookieHeader("https://passport.bilibili.com/x/passport-login/web/qrcode/poll").contains("only=passport"));
        assertFalse(session.cookieHeader("https://api.bilibili.com/x/passport-login").contains("only="));
        assertFalse(session.cookieHeader("https://passport.bilibili.com/x/passport-login-evil").contains("only="));
        receive("SESSDATA=; Domain=.bilibili.com; Path=/; Max-Age=0");
        assertFalse(session.hasSession()); assertEquals("", new SessionStore(context).getCookie("SESSDATA"));
    }
    @Test public void invalidOriginDomainAndHeaderInjectionCannotCreateCredentials() {
        session.acceptCookies("https://other.example/", Collections.singletonList("SESSDATA=x; Domain=.bilibili.com; Path=/"), session.generation());
        receive("SESSDATA=x; Domain=.com; Path=/", "SESSDATA=x; Domain=.bilibili.com.evil.test; Path=/", "SESSDATA=x\r\nInjected: y; Domain=.bilibili.com; Path=/");
        assertEquals("", session.cookieHeader("https://api.bilibili.com/"));
    }
    @Test public void separateActivityInstancesShareLogoutAndRejectLateResponses() {
        receive("SESSDATA=session-test; Domain=.bilibili.com; Path=/", "bili_jct=csrf-test; Domain=.bilibili.com; Path=/");
        SessionStore player = new SessionStore(context); long before = player.generation();
        assertTrue(player.hasSession()); session.clear();
        assertFalse(player.hasSession()); assertTrue(player.generation() > before);
        player.acceptCookies("https://passport.bilibili.com/", Arrays.asList("SESSDATA=old; Domain=.bilibili.com; Path=/", "bili_jct=old; Domain=.bilibili.com; Path=/"), before);
        assertFalse(session.hasSession()); assertFalse(player.hasSession());
    }
    @Test public void damagedPrivateStorageFallsBackToSignedOut() {
        context.getSharedPreferences("bilitv.session", Context.MODE_PRIVATE).edit().putString("account.cookies", "not-json").commit();
        assertFalse(new SessionStore(context).hasSession());
    }
}
