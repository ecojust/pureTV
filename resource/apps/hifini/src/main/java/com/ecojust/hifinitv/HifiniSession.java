package com.ecojust.hifinitv;

import android.webkit.CookieManager;
import java.net.URI;
import java.util.List;

/** Shares the user's official-site WebView session with same-origin native requests only. */
final class HifiniSession {
    static final String HOME = "https://www.hifini.net/";
    static final String LOGIN = HOME + "user-login.htm";
    static final String REGISTER = HOME + "user-create.htm";
    private static final int MAX_COOKIE_HEADER = 32768, MAX_SET_COOKIE = 8192;
    private static long sessionEpoch;
    private static boolean clearingSession;

    private HifiniSession() { }

    /** Reads only official navigation state, never the account name, password or token. */
    static String authenticatedPageScript() {
        return "(function(){if(window.top!==window||location.protocol!=='https:'||!['www.hifini.net','hifini.net'].includes(location.hostname)"
                + "||(location.port&&location.port!=='443')||location.username||location.password)return false;"
                + "function has(selector,path){return Array.from(document.querySelectorAll(selector)).some(function(a){"
                + "try{var u=new URL(a.href,document.baseURI);return u.origin===location.origin&&u.pathname===path&&!u.username&&!u.password;}catch(e){return false;}});}"
                + "return has('.navbar li.username > a','/my.htm')&&has('.navbar a','/user-logout.htm');})()";
    }

    static boolean allows(String address) {
        if (address == null || address.length() > 8192) return false;
        try {
            URI uri = new URI(address);
            String host = uri.getHost();
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getUserInfo() == null
                    && uri.getFragment() == null && (uri.getPort() == -1 || uri.getPort() == 443)
                    && ("www.hifini.net".equalsIgnoreCase(host) || "hifini.net".equalsIgnoreCase(host));
        } catch (Exception invalidAddress) { return false; }
    }

    /** Empty does not prove signed-out; a cookie's presence does not prove signed-in. */
    static String cookieHeader(String address) { return cookieHeader(address, epoch()); }

    static synchronized String cookieHeader(String address, long requestEpoch) {
        if (clearingSession || requestEpoch != sessionEpoch || !allows(address)) return "";
        try {
            String value = CookieManager.getInstance().getCookie(address);
            return safeHeader(value, MAX_COOKIE_HEADER) ? value : "";
        } catch (RuntimeException unavailableWebView) { return ""; }
    }

    static synchronized long epoch() { return sessionEpoch; }

    static void acceptCookies(String address, List<String> headers) { acceptCookies(address, headers, epoch()); }

    static synchronized void acceptCookies(String address, List<String> headers, long requestEpoch) {
        if (clearingSession || requestEpoch != sessionEpoch) return;
        if (!allows(address) || headers == null) return;
        try {
            CookieManager manager = CookieManager.getInstance();
            int accepted = 0, bytes = 0;
            for (String header : headers) {
                if (!safeHeader(header, MAX_SET_COOKIE)) continue;
                if (++accepted > 32 || (bytes += header.length()) > MAX_COOKIE_HEADER) break;
                // With no callback Android permits this call from a worker without a Looper.
                // CookieManager applies standard origin, Domain, Path and expiry rules.
                manager.setCookie(address, header);
            }
            if (accepted > 0) manager.flush();
        } catch (RuntimeException unavailableWebView) { /* Request can still report the site's login requirement. */ }
    }

    static void flush() {
        try { CookieManager.getInstance().flush(); }
        catch (RuntimeException unavailableWebView) { /* No fabricated session or fallback cookie store. */ }
    }

    static synchronized void signOut(java.util.function.Consumer<Boolean> completed) {
        final long clearingEpoch = ++sessionEpoch;
        clearingSession = true;
        try {
            CookieManager manager = CookieManager.getInstance();
            manager.removeAllCookies(removed -> {
                try {
                    manager.flush();
                    synchronized (HifiniSession.class) { if (sessionEpoch == clearingEpoch) clearingSession = false; }
                    completed.accept(true);
                }
                catch (RuntimeException storageFailure) { completed.accept(false); }
            });
        } catch (RuntimeException unavailableWebView) { completed.accept(false); }
    }

    private static boolean safeHeader(String value, int maximum) {
        if (value == null || value.isEmpty() || value.length() > maximum) return false;
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c == '\r' || c == '\n' || c == 0) return false;
        }
        return true;
    }
}
