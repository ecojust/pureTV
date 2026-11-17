package com.ecojust.bilitv;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;
import java.net.HttpCookie;
import java.net.URI;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.WeakHashMap;

/** Private, origin-scoped cookie jar. Credentials are never sent to image or media CDNs. */
public final class SessionStore implements BiliHttp.CookieJar {
    private static final String STORAGE = "account.cookies";
    private static final int MAX_COOKIES = 64;
    private final SharedPreferences preferences;
    private static final Map<SharedPreferences, State> STATES = new WeakHashMap<>();
    private static final class State {
        final List<Cookie> cookies = new ArrayList<>();
        long epoch;
        String persisted;
    }
    private final State state;

    public SessionStore(Context context) {
        preferences = context.getApplicationContext().getSharedPreferences("bilitv.session", Context.MODE_PRIVATE);
        synchronized (STATES) {
            State shared = STATES.get(preferences);
            if (shared == null) { shared = new State(); STATES.put(preferences, shared); }
            state = shared;
        }
        synchronized (state) {
        String saved = preferences.getString(STORAGE, "[]");
        if (saved.equals(state.persisted)) return;
        state.epoch++;
        state.cookies.clear();
        state.persisted = saved;
        try {
            if (saved.length() > 65536) throw new IllegalArgumentException("Oversized session");
            JSONArray values = new JSONArray(saved);
            for (int i = 0; i < values.length() && state.cookies.size() < MAX_COOKIES; i++) {
                JSONObject value = values.getJSONObject(i);
                Cookie cookie = new Cookie(value.getString("name"), value.getString("value"), value.getString("domain"),
                        value.optString("path", "/"), value.optBoolean("hostOnly", false), value.optLong("expires", -1));
                if (cookie.valid() && !cookie.expired()) state.cookies.add(cookie);
            }
        } catch (Exception ignored) {
            state.cookies.clear();
            preferences.edit().remove(STORAGE).apply();
            state.persisted = "[]";
        }
        }
    }

    @Override public long generation() { synchronized (state) { return state.epoch; } }

    /** Invalidates in-flight responses, for example when replacing a QR code. */
    public long invalidateRequests() { synchronized (state) { return ++state.epoch; } }

    public void clear() { synchronized (state) {
        state.epoch++;
        state.cookies.clear();
        state.persisted = "[]";
        preferences.edit().remove(STORAGE).commit();
    } }

    public boolean hasSession() { synchronized (state) {
        return !getCookie("SESSDATA").isEmpty() && !getCookie("bili_jct").isEmpty();
    } }

    public boolean isLoggedIn() { synchronized (state) { return hasSession(); } }

    public String getCookie(String name) { synchronized (state) {
        for (Cookie cookie : state.cookies) {
            if (cookie.name.equals(name) && !cookie.expired() && cookie.matches("api.bilibili.com", "/")) return cookie.value;
        }
        return "";
    } }

    @Override public String cookieHeader(String requestUrl) { synchronized (state) {
        URI uri = trusted(requestUrl);
        if (uri == null) return "";
        String host = uri.getHost().toLowerCase(Locale.ROOT), path = uri.getPath();
        if (path == null || path.isEmpty()) path = "/";
        StringBuilder header = new StringBuilder();
        for (Cookie cookie : state.cookies) {
            if (!cookie.expired() && cookie.matches(host, path)) {
                if (header.length() > 0) header.append("; ");
                header.append(cookie.name).append('=').append(cookie.value);
            }
        }
        return header.toString();
    } }

    @Override public void acceptCookies(String requestUrl, List<String> setCookies, long expectedGeneration) { synchronized (state) {
        URI uri = trusted(requestUrl);
        if (uri == null || expectedGeneration != state.epoch || setCookies == null) return;
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        boolean changed = false;
        for (String header : setCookies) {
            if (header == null || header.length() > 8192 || header.indexOf('\r') >= 0 || header.indexOf('\n') >= 0) continue;
            List<HttpCookie> parsed;
            try { parsed = HttpCookie.parse(header); } catch (IllegalArgumentException ignored) { continue; }
            for (HttpCookie item : parsed) {
                boolean hostOnly = item.getDomain() == null || item.getDomain().isEmpty();
                String domain = hostOnly ? host : item.getDomain().toLowerCase(Locale.ROOT);
                while (domain.startsWith(".")) domain = domain.substring(1);
                if (!officialDomain(domain) || !(host.equals(domain) || host.endsWith("." + domain))) continue;
                String path = item.getPath();
                if (path == null || !path.startsWith("/")) path = "/";
                long maxAge = item.getMaxAge();
                // Cap saved credentials to one year even if the server uses an unbounded lifetime.
                long expires = maxAge < 0 ? -1 : System.currentTimeMillis() + Math.min(maxAge, 366L * 86400) * 1000;
                Cookie cookie = new Cookie(item.getName(), item.getValue(), domain, path, hostOnly, expires);
                if (!cookie.valid()) continue;
                for (Iterator<Cookie> iterator = state.cookies.iterator(); iterator.hasNext();) {
                    Cookie old = iterator.next();
                    if (old.name.equals(cookie.name) && old.domain.equals(domain) && old.path.equals(path)) iterator.remove();
                }
                if (maxAge != 0 && !cookie.expired() && state.cookies.size() < MAX_COOKIES) state.cookies.add(cookie);
                changed = true;
            }
        }
        if (changed) save();
    } }

    private void save() {
        JSONArray values = new JSONArray();
        try {
            for (Cookie cookie : state.cookies) {
                if (cookie.expired()) continue;
                JSONObject value = new JSONObject();
                value.put("name", cookie.name); value.put("value", cookie.value); value.put("domain", cookie.domain);
                value.put("path", cookie.path); value.put("hostOnly", cookie.hostOnly); value.put("expires", cookie.expires);
                values.put(value);
            }
            state.persisted = values.toString();
            preferences.edit().putString(STORAGE, state.persisted).apply();
        } catch (Exception ignored) { /* An unusable session can always be replaced by scanning again. */ }
    }

    private static URI trusted(String address) {
        try {
            URI uri = URI.create(address);
            return "https".equalsIgnoreCase(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    && (uri.getPort() == -1 || uri.getPort() == 443) && officialDomain(uri.getHost().toLowerCase(Locale.ROOT)) ? uri : null;
        } catch (IllegalArgumentException ignored) { return null; }
    }
    private static boolean officialDomain(String host) { return host.equals("bilibili.com") || host.endsWith(".bilibili.com"); }

    private static final class Cookie {
        final String name, value, domain, path;
        final boolean hostOnly;
        final long expires;
        Cookie(String name, String value, String domain, String path, boolean hostOnly, long expires) {
            this.name = name; this.value = value; this.domain = domain; this.path = path; this.hostOnly = hostOnly; this.expires = expires;
        }
        boolean valid() {
            return name.matches("[A-Za-z0-9_.$-]{1,80}") && value.length() <= 4096 && value.indexOf(';') < 0
                    && value.matches("[\\x21-\\x3a\\x3c-\\x7e]*") && officialDomain(domain) && path.startsWith("/");
        }
        boolean expired() { return expires >= 0 && expires <= System.currentTimeMillis(); }
        boolean matches(String host, String requestPath) {
            boolean domainMatches = hostOnly ? host.equals(domain) : host.equals(domain) || host.endsWith("." + domain);
            return domainMatches && (requestPath.equals(path) || requestPath.startsWith(path.endsWith("/") ? path : path + "/"));
        }
    }
}
