package com.ecojust.cctvlive;

import android.content.Context;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Looper;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.time.Duration;
import java.util.Collections;
import java.util.Map;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadow.api.Shadow;
import org.robolectric.util.ReflectionHelpers;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class CctvWebPlayerTest {
    private static final String PAGE = "https://tv.cctv.com/live/cctv1/";
    private Context context;
    private CctvWebPlayer player;

    @Before public void create() {
        context = RuntimeEnvironment.getApplication();
        player = new CctvWebPlayer(context, () -> { });
        player.activate();
    }

    @After public void close() { player.close(); }

    private WebViewClient client() { return shadowOf(player.view()).getWebViewClient(); }

    private ValueCallback<String> finished() {
        client().onPageFinished(player.view(), player.pageUrl());
        return shadowOf(player.view()).getLastEvaluatedJavascriptCallback();
    }

    @Test public void enablesOfficialPlayerButDisablesLocalFilesAndMixedContent() {
        assertNotNull(player.view());
        WebSettings settings = player.view().getSettings();
        assertTrue(settings.getJavaScriptEnabled());
        assertTrue(settings.getDomStorageEnabled());
        assertFalse(settings.getAllowFileAccess());
        assertFalse(settings.getAllowContentAccess());
        assertFalse(settings.getAllowFileAccessFromFileURLs());
        assertFalse(settings.getAllowUniversalAccessFromFileURLs());
        assertFalse(settings.getMediaPlaybackRequiresUserGesture());
        assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW, settings.getMixedContentMode());
        assertNull(shadowOf(player.view()).getJavascriptInterface("Android"));
    }

    @Test public void keepsNavigationOnSelectedOfficialChannelAndAllowsHttpsPlayerResources() {
        player.load(PAGE);
        assertFalse(client().shouldOverrideUrlLoading(player.view(), request(PAGE + "index.shtml", true)));
        assertFalse(client().shouldOverrideUrlLoading(player.view(), request(PAGE + "m/", true)));
        assertTrue(client().shouldOverrideUrlLoading(player.view(), request("https://tv.cctv.com/live/cctv2/", true)));
        assertTrue(client().shouldOverrideUrlLoading(player.view(), request("https://tv.cctv.com.evil.example/live/cctv1/", true)));
        assertTrue(client().shouldOverrideUrlLoading(player.view(), request("intent://player", true)));
        assertTrue(client().shouldOverrideUrlLoading(player.view(), request("file:///sdcard/private", true)));
        assertNull(client().shouldInterceptRequest(player.view(), request("https://cdn.example/media.m3u8", false)));
        assertNull(client().shouldInterceptRequest(player.view(), request("blob:https://tv.cctv.com/video", false)));
        assertNotNull(client().shouldInterceptRequest(player.view(), request("http://cdn.example/player.js", false)));
        assertNotNull(client().shouldInterceptRequest(player.view(), request("content://private/data", false)));
        assertNotNull(client().shouldInterceptRequest(player.view(), request("https://outside.example/", true)));
    }

    @Test public void rejectsCertificateErrorsWithoutProceeding() {
        player.load(PAGE);
        SslErrorHandler handler = ReflectionHelpers.callConstructor(SslErrorHandler.class);
        // This callback only reads the failing URL; avoid Android's unavailable certificate parser.
        SslError failure = Shadow.newInstanceOf(SslError.class);
        ReflectionHelpers.setField(failure, "mUrl", PAGE);
        client().onReceivedSslError(player.view(), handler, failure);
        assertTrue(shadowOf(handler).wasCancelCalled());
        assertFalse(shadowOf(handler).wasProceedCalled());
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(PAGE, player.pageUrl());
    }

    @Test public void finishedDocumentIsNotReadyUntilScriptFindsPlayer() {
        player.load(PAGE);
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        ValueCallback<String> callback = finished();
        assertNotNull(callback);
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        assertEquals(0f, player.view().getAlpha(), 0f);
        callback.onReceiveValue("{\"found\":false,\"playing\":false}");
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(751));
        shadowOf(player.view()).getLastEvaluatedJavascriptCallback().onReceiveValue("{\"found\":true,\"playing\":false}");
        assertEquals(CctvWebPlayer.State.READY, player.state());
        assertEquals(1f, player.view().getAlpha(), 0f);
        assertEquals("", player.error());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(30));
        assertEquals(CctvWebPlayer.State.READY, player.state());
    }

    @Test public void supportsStringifiedScriptResultAndIgnoresOldChannelCallbacks() {
        player.load(PAGE);
        ValueCallback<String> first = finished();
        player.load("https://tv.cctv.com/live/cctv2/");
        first.onReceiveValue("{\"found\":true,\"playing\":true}");
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        finished().onReceiveValue(JSONObject.quote("{\"found\":true,\"playing\":false}"));
        assertEquals(CctvWebPlayer.State.READY, player.state());
    }

    @Test public void sameChannelWebsiteNavigationHidesAndCropsTheNewDocumentAgain() {
        player.load(PAGE);
        ValueCallback<String> previousDocument = finished();
        previousDocument.onReceiveValue("{\"found\":true,\"playing\":true}");
        assertEquals(CctvWebPlayer.State.READY, player.state());
        client().onPageStarted(player.view(), PAGE + "m/", null);
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        assertEquals(0f, player.view().getAlpha(), 0f);
        previousDocument.onReceiveValue("{\"found\":true,\"playing\":true}");
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        client().onPageFinished(player.view(), PAGE + "m/");
        shadowOf(player.view()).getLastEvaluatedJavascriptCallback().onReceiveValue("{\"found\":true,\"playing\":false}");
        assertEquals(CctvWebPlayer.State.READY, player.state());
        assertEquals(1f, player.view().getAlpha(), 0f);
    }

    @Test public void suspendingBlanksMediaAndDiscardsPendingCallbacksThenRestoresChannel() {
        player.load(PAGE);
        WebView view = player.view();
        ValueCallback<String> callback = finished();
        player.suspend();
        assertEquals("about:blank", shadowOf(view).getLastLoadedUrl());
        assertTrue(shadowOf(view).wasOnPauseCalled());
        callback.onReceiveValue("{\"found\":true,\"playing\":true}");
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(30));
        assertEquals(CctvWebPlayer.State.IDLE, player.state());
        assertEquals(PAGE, player.pageUrl());
        assertEquals("about:blank", shadowOf(view).getLastLoadedUrl());
        player.activate();
        assertEquals(PAGE, shadowOf(view).getLastLoadedUrl());
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
    }

    @Test public void missingPlayerTimesOutWithoutClosingAndAllowsExplicitReload() {
        player.load(PAGE);
        ValueCallback<String> callback = finished();
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(26));
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(context.getString(R.string.web_player_missing), player.error());
        assertEquals("about:blank", shadowOf(player.view()).getLastLoadedUrl());
        callback.onReceiveValue("{\"found\":true,\"playing\":true}");
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(PAGE, player.pageUrl());
        player.reload();
        assertEquals(CctvWebPlayer.State.LOADING, player.state());
        assertEquals(PAGE, shadowOf(player.view()).getLastLoadedUrl());
    }

    @Test public void repeatedlyMissingPlayerHasBoundedProbes() {
        player.load(PAGE);
        finished();
        for (int i = 0; i < 26 && player.state() == CctvWebPlayer.State.LOADING; i++) {
            shadowOf(player.view()).getLastEvaluatedJavascriptCallback().onReceiveValue("{\"found\":false}");
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(751));
        }
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(context.getString(R.string.web_player_missing), player.error());
    }

    @Test public void unavailableChannelAndUntrustedUrlStopOldMediaWithoutExternalNavigation() {
        player.load(PAGE);
        player.load("");
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(context.getString(R.string.web_page_unavailable), player.error());
        assertEquals("", player.pageUrl());
        assertEquals("about:blank", shadowOf(player.view()).getLastLoadedUrl());
        player.load("https://example.com/live/cctv1/");
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals("", player.pageUrl());
        assertEquals("about:blank", shadowOf(player.view()).getLastLoadedUrl());
    }

    @Test public void brokenSystemWebViewIsReportedInsteadOfCrashing() {
        player.close();
        player = new CctvWebPlayer(context, () -> { }, ignored -> {
            throw new IllegalStateException("WebView provider missing");
        });
        assertNull(player.view());
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
        assertEquals(context.getString(R.string.web_unavailable), player.error());
        player.load(PAGE);
        player.activate();
        assertEquals(CctvWebPlayer.State.ERROR, player.state());
    }

    @Test public void closeDestroysWebViewAndCannotRestartOrAcceptStaleReady() {
        player.load(PAGE);
        WebView old = player.view();
        ValueCallback<String> callback = finished();
        player.close();
        assertTrue(shadowOf(old).wasDestroyCalled());
        assertNull(player.view());
        callback.onReceiveValue("{\"found\":true,\"playing\":true}");
        player.activate();
        player.reload();
        assertNull(player.view());
        assertEquals(CctvWebPlayer.State.IDLE, player.state());
    }

    private static WebResourceRequest request(String address, boolean main) {
        return new WebResourceRequest() {
            @Override public Uri getUrl() { return Uri.parse(address); }
            @Override public boolean isForMainFrame() { return main; }
            @Override public boolean isRedirect() { return false; }
            @Override public boolean hasGesture() { return false; }
            @Override public String getMethod() { return "GET"; }
            @Override public Map<String, String> getRequestHeaders() { return Collections.emptyMap(); }
        };
    }
}
