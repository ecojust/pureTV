package com.ecojust.hifinitv;

import android.os.Looper;
import android.webkit.CookieManager;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class HifiniSessionTest {
    public static class DelayedCookieManager extends android.webkit.RoboCookieManager {
        android.webkit.ValueCallback<Boolean> pending;
        int flushes;
        @Override public void removeAllCookies(android.webkit.ValueCallback<Boolean> callback) { pending = callback; }
        @Override public void flush() { flushes++; super.flush(); }
        void completeClear() { android.webkit.ValueCallback<Boolean> callback = pending; pending = null; super.removeAllCookies(callback); }
    }
    @Before public void clearCookies() { CookieManager.getInstance().setAcceptCookie(true); CookieManager.getInstance().removeAllCookies(null); shadowOf(Looper.getMainLooper()).idle(); }
    @Test public void cookiesAreScopedToOfficialHttpsOrigins() {
        for (String address : new String[]{HifiniSession.HOME, HifiniSession.LOGIN, "https://hifini.net:443/thread-1.htm", "https://WWW.HIFINI.NET/"}) assertTrue(address, HifiniSession.allows(address));
        for (String address : new String[]{"http://www.hifini.net/", "https://hifini.net:444/", "https://hifini.net.evil.invalid/", "https://cdn.hifini.net/", "https://user@hifini.net/", "https://hifini.net@evil.invalid/", "file:///user-login.htm", "javascript:alert(1)", "//www.hifini.net/", null}) assertFalse(address, HifiniSession.allows(address));
        HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=fixture-session; Path=/; Secure; HttpOnly"));
        assertTrue(HifiniSession.cookieHeader(HifiniSession.LOGIN).contains("sid=fixture-session"));
        assertEquals("", HifiniSession.cookieHeader("https://cdn.hifini.net/audio.mp3"));
        assertEquals("", HifiniSession.cookieHeader("https://media.example.invalid/audio.mp3"));
        assertEquals("", HifiniSession.cookieHeader("http://www.hifini.net/"));
    }
    @Test public void rejectsForeignResponseCookiesAndHeaderInjection() {
        HifiniSession.acceptCookies("https://media.example.invalid/", List.of("sid=foreign; Domain=www.hifini.net"));
        HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=fixture\r\nInjected: value", "sid=" + "x".repeat(8193)));
        assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME));
    }
    @Test public void logoutClearsCookiesAndRejectsResponsesFromAnEarlierSession() {
        long epoch = HifiniSession.epoch();
        HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=old; Path=/"), epoch);
        AtomicReference<Boolean> result = new AtomicReference<>(); HifiniSession.signOut(result::set); shadowOf(Looper.getMainLooper()).idle();
        assertEquals(Boolean.TRUE, result.get()); assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME));
        HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=late-response; Path=/"), epoch);
        assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME));
        HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=new; Path=/"), HifiniSession.epoch());
        assertTrue(HifiniSession.cookieHeader(HifiniSession.HOME).contains("sid=new"));
        assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME, epoch));
    }
    @Test public void asynchronousClearBlocksNewRequestsFromReadingOrRestoringTheOldSession() throws Exception {
        java.lang.reflect.Field field = org.robolectric.shadows.ShadowCookieManager.class.getDeclaredField("cookieManager");
        field.setAccessible(true); Object original = field.get(null);
        DelayedCookieManager delayed = new DelayedCookieManager(); field.set(null, delayed);
        try {
            delayed.setAcceptCookie(true); delayed.setCookie(HifiniSession.HOME, "sid=old; Path=/");
            AtomicReference<Boolean> result = new AtomicReference<>(); HifiniSession.signOut(result::set);
            long duringClear = HifiniSession.epoch();
            assertNull(result.get()); assertTrue(delayed.getCookie(HifiniSession.HOME).contains("sid=old"));
            assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME, duringClear));
            HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=late; Path=/"), duringClear);
            assertTrue(delayed.getCookie(HifiniSession.HOME).contains("sid=old"));
            delayed.completeClear(); shadowOf(Looper.getMainLooper()).idle();
            assertEquals(Boolean.TRUE, result.get()); assertEquals("", HifiniSession.cookieHeader(HifiniSession.HOME));
            int previousFlushes = delayed.flushes;
            HifiniSession.acceptCookies(HifiniSession.HOME, List.of("sid=new; Path=/", "other=value; Path=/"), HifiniSession.epoch());
            assertTrue(HifiniSession.cookieHeader(HifiniSession.HOME).contains("sid=new"));
            assertEquals(previousFlushes + 1, delayed.flushes);
        } finally {
            if (delayed.pending != null) { delayed.completeClear(); shadowOf(Looper.getMainLooper()).idle(); }
            field.set(null, original);
        }
    }
}
