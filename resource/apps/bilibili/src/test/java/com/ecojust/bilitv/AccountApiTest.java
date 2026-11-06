package com.ecojust.bilitv;

import android.content.Context;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.IOException;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class AccountApiTest {
    private SessionStore session;
    private Stub transport;
    private AccountApi account;
    private static final String QR = "{\"code\":0,\"data\":{\"url\":\"https://passport.bilibili.com/test-only-qr\",\"qrcode_key\":\"fixture-key-only-12345\"}}";
    private static final String NAV = "{\"code\":0,\"data\":{\"isLogin\":true,\"mid\":12,\"uname\":\"Test viewer\",\"face\":\"https://i0.hdslb.com/avatar.png\"}}";
    private static final List<String> COOKIES = Arrays.asList("SESSDATA=test-session; Domain=.bilibili.com; Path=/", "bili_jct=test-csrf; Domain=.bilibili.com; Path=/");
    static final class Stub implements BiliHttp.Transport {
        final ArrayDeque<BiliHttp.Response> replies = new ArrayDeque<>();
        final List<BiliHttp.Request> requests = new ArrayList<>();
        Runnable during;
        void add(String json) throws Exception { add(json, Collections.<String,List<String>>emptyMap()); }
        void add(String json, Map<String,List<String>> headers) throws Exception { replies.add(new BiliHttp.Response(200, headers, json.getBytes("UTF-8"))); }
        @Override public BiliHttp.Response execute(BiliHttp.Request request) throws IOException {
            requests.add(request); if (during != null) during.run();
            if (replies.isEmpty()) throw new AssertionError("Unexpected network request");
            return replies.remove();
        }
    }
    @Before public void prepare() {
        Context context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("bilitv.session", Context.MODE_PRIVATE).edit().clear().commit();
        session = new SessionStore(context); transport = new Stub(); account = new AccountApi(new BiliHttp(session, transport), session);
    }
    private void login() { session.acceptCookies("https://passport.bilibili.com/", COOKIES, session.generation()); }
    private static void error(BiliHttp.Kind kind, Action action) throws Exception {
        try { action.run(); fail("Expected error"); } catch (BiliHttp.ApiException expected) { assertEquals(kind, expected.kind); }
    }
    interface Action { void run() throws Exception; }

    @Test public void qrWaitingScannedAndExpiredNeverClaimSuccessfulLogin() throws Exception {
        transport.add(QR); AccountApi.QrTicket ticket = account.startQr();
        for (int code : new int[]{86101,86090,86038}) transport.add("{\"code\":0,\"data\":{\"code\":" + code + "}}");
        assertEquals(AccountApi.Status.WAITING, account.pollQr(ticket).status);
        assertEquals(AccountApi.Status.SCANNED, account.pollQr(ticket).status);
        assertEquals(AccountApi.Status.EXPIRED, account.pollQr(ticket).status);
        assertFalse(session.hasSession());
    }
    @Test public void qrSuccessRequiresFreshCookiesAndAuthenticatedProfile() throws Exception {
        login(); transport.add(QR); AccountApi.QrTicket ticket = account.startQr();
        assertFalse("Previous credentials cannot certify this QR", session.hasSession());
        transport.add("{\"code\":0,\"data\":{\"code\":0}}");
        error(BiliHttp.Kind.INVALID_RESPONSE, () -> account.pollQr(ticket));
        transport.add("{\"code\":0,\"data\":{\"code\":0}}", Collections.singletonMap("Set-Cookie", COOKIES)); transport.add(NAV);
        AccountApi.QrState state = account.pollQr(ticket);
        assertEquals(AccountApi.Status.SUCCESS, state.status); assertEquals(12, state.profile.mid); assertTrue(session.hasSession());
        assertTrue(transport.requests.get(transport.requests.size()-1).url.endsWith("/x/web-interface/nav"));
    }
    @Test public void staleOrCancelledQrCannotRestoreCredentials() throws Exception {
        transport.add(QR); AccountApi.QrTicket firstTicket = account.startQr(); session.invalidateRequests();
        error(BiliHttp.Kind.CANCELLED, () -> account.pollQr(firstTicket)); assertEquals(1, transport.requests.size());
        transport.add(QR); AccountApi.QrTicket ticket = account.startQr();
        transport.add("{\"code\":0,\"data\":{\"code\":0}}", Collections.singletonMap("Set-Cookie", COOKIES)); transport.during = session::clear;
        final AccountApi.QrTicket current = ticket;
        error(BiliHttp.Kind.CANCELLED, () -> account.pollQr(current)); assertFalse(session.hasSession());
    }
    @Test public void expiredLocalQrAndUnexpectedQrDestinationAreRejected() throws Exception {
        AccountApi.QrTicket expired = new AccountApi.QrTicket("fixture", "https://passport.bilibili.com/", System.currentTimeMillis()-181000, session.generation());
        assertEquals(AccountApi.Status.EXPIRED, account.pollQr(expired).status); assertTrue(transport.requests.isEmpty());
        transport.add(QR.replace("passport.bilibili.com", "untrusted.example"));
        error(BiliHttp.Kind.INVALID_RESPONSE, () -> account.startQr());
    }
    @Test public void foldersPreserveMembershipAndFavoritesSkipUnavailableOrNonVideoEntries() throws Exception {
        login(); transport.add("{\"code\":0,\"data\":{\"list\":[{\"id\":9,\"title\":\"Watch later\",\"media_count\":3,\"fav_state\":1}]}}");
        AccountApi.Folder folder = account.folders(12,42).get(0);
        assertEquals(9, folder.id); assertTrue(folder.selected); assertEquals(3, folder.count);
        assertTrue(transport.requests.get(0).url.contains("rid=42"));
        transport.add("{\"code\":0,\"data\":{\"has_more\":true,\"medias\":[{\"id\":42,\"bvid\":\"BV1234567890\",\"type\":2,\"title\":\"Video\",\"duration\":123,\"upper\":{\"name\":\"Author\"}},{\"id\":44,\"bvid\":\"BV1234567892\",\"type\":2,\"attr\":1},{\"id\":43,\"bvid\":\"BV1234567891\",\"type\":12}]}}");
        VideoApi.SearchPage videos = account.favorites(9,2);
        assertEquals(1,videos.items.size()); assertEquals(2,videos.page); assertTrue(videos.hasMore); assertEquals("Author",videos.items.get(0).author);
    }
    @Test public void historyCarriesPartProgressAndCursorWhileIgnoringNonArchiveEntries() throws Exception {
        login(); transport.add("{\"code\":0,\"data\":{\"cursor\":{\"max\":43,\"view_at\":1000},\"list\":[{\"title\":\"Resume\",\"progress\":80,\"duration\":300,\"history\":{\"oid\":42,\"bvid\":\"BV1234567890\",\"cid\":200,\"business\":\"archive\"}},{\"title\":\"Done\",\"progress\":-1,\"history\":{\"oid\":43,\"bvid\":\"BV1234567891\",\"cid\":201,\"business\":\"archive\"}},{\"history\":{\"business\":\"live\"}}]}}");
        AccountApi.HistoryPage history = account.history(0,0);
        assertEquals(2,history.videos.size()); assertEquals(200,history.videos.get(0).cid); assertEquals(80,history.videos.get(0).positionSeconds);
        assertEquals(0,history.videos.get(1).positionSeconds); assertTrue(history.hasMore); assertEquals(43,history.nextMax); assertEquals(1000,history.nextViewAt);
        transport.add("{\"code\":0,\"data\":{\"cursor\":{\"max\":43,\"view_at\":1000},\"list\":[]}}");
        assertFalse(account.history(43,1000).hasMore);
    }
    @Test public void mutationsRequireSessionUseFormCsrfAndChangeOnlyExplicitFolder() throws Exception {
        error(BiliHttp.Kind.AUTH_REQUIRED, () -> account.favorite(42,9,true));
        error(BiliHttp.Kind.AUTH_REQUIRED, () -> account.heartbeat("BV1234567890",200,90,false)); assertTrue(transport.requests.isEmpty());
        login(); transport.add("{\"code\":0}"); account.favorite(42,9,true);
        BiliHttp.Request add = transport.requests.get(0); String form = new String(add.body,"UTF-8");
        assertEquals("POST",add.method); assertTrue(form.contains("add_media_ids=9")); assertTrue(form.contains("del_media_ids=")); assertTrue(form.contains("csrf=test-csrf"));
        transport.add("{\"code\":0}"); account.favorite(42,9,false);
        assertTrue(new String(transport.requests.get(1).body,"UTF-8").contains("del_media_ids=9"));
        transport.add("{\"code\":0}"); account.heartbeat("BV1234567890",200,90,false);
        assertTrue(new String(transport.requests.get(2).body,"UTF-8").contains("played_time=90"));
        transport.add("{\"code\":0}"); account.heartbeat("BV1234567890",200,300,true);
        assertTrue(new String(transport.requests.get(3).body,"UTF-8").contains("played_time=-1"));
        transport.add("{\"code\":-101}"); error(BiliHttp.Kind.AUTH_REQUIRED, () -> account.favorite(42,9,true));
    }
}
