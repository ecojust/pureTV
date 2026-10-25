package com.ecojust.cctvlive;

import android.annotation.SuppressLint;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.webkit.PermissionRequest;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;
import org.json.JSONTokener;

/** Displays the selected official live page, cropped in place by the bundled script. */
final class CctvWebPlayer {
    interface Events { void changed(); }
    interface WebViewFactory { WebView create(Context context); }
    enum State { IDLE, LOADING, READY, ERROR }

    private static final long LOAD_TIMEOUT_MS = 25000, PROBE_INTERVAL_MS = 750;
    private static final int MAX_PROBES = 24, MAX_SCRIPT_BYTES = 256 * 1024;
    private final Context context;
    private final Events events;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private WebView web;
    private String focusScript = "";
    private volatile String requestedUrl = "";
    private State state = State.IDLE;
    private String error = "";
    private boolean active, closed, documentFinished;
    private volatile int generation;
    private int probes, evaluation;
    private Runnable scheduledProbe, deadline;

    CctvWebPlayer(Context context, Events events) { this(context, events, WebView::new); }

    // Factory injection keeps a missing/broken system WebView testable without a native bridge.
    CctvWebPlayer(Context context, Events events, WebViewFactory factory) {
        this.context = context;
        this.events = events;
        try {
            focusScript = readScript(context);
            web = factory.create(context);
            configure();
        } catch (IOException | RuntimeException | LinkageError unavailable) {
            disposeView();
            state = State.ERROR;
            error = context.getString(R.string.web_unavailable);
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configure() {
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setAllowFileAccessFromFileURLs(false);
        settings.setAllowUniversalAccessFromFileURLs(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setGeolocationEnabled(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        String agent = settings.getUserAgentString();
        if (agent != null && !agent.isEmpty()) {
            // Preserve the installed Chromium version while requesting the desktop player.
            settings.setUserAgentString(agent.replaceFirst("\\([^)]*\\)", "(X11; Linux x86_64)")
                    .replace(" Version/4.0", "").replace(" Mobile", ""));
        }
        web.setBackgroundColor(Color.BLACK);
        web.setFocusable(true);
        web.setFocusableInTouchMode(true);
        web.setAlpha(0f); // Never flash the untrimmed website while the player is locating.
        web.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        web.setHorizontalScrollBarEnabled(false);
        web.setVerticalScrollBarEnabled(false);
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(PermissionRequest request) { request.deny(); }
        });
        web.setDownloadListener((url, agentString, disposition, mime, length) -> { });
        web.setWebViewClient(new PageClient(generation));
    }

    WebView view() { return web; }
    State state() { return state; }
    String error() { return error; }
    String pageUrl() { return requestedUrl; }

    void load(String url) {
        if (closed) return;
        stopDocument();
        requestedUrl = "";
        if ("".equals(url)) {
            setError(R.string.web_page_unavailable);
            return;
        }
        try { requestedUrl = ChannelCatalog.safePageUrl(url); }
        catch (IOException invalid) { setError(R.string.web_failed); return; }
        if (web == null) { setError(R.string.web_unavailable); return; }
        if (!active) { update(State.IDLE, ""); return; }
        startDocument();
    }

    void reload() {
        if (!closed) load(requestedUrl);
    }

    void activate() {
        if (closed || active) return;
        active = true;
        if (web == null) { setError(R.string.web_unavailable); return; }
        if (!requestedUrl.isEmpty()) startDocument();
    }

    void suspend() {
        if (closed) return;
        active = false;
        stopDocument();
        update(State.IDLE, "");
    }

    void close() {
        if (closed) return;
        active = false;
        stopDocument();
        closed = true;
        disposeView();
        state = State.IDLE;
        error = "";
    }

    private void startDocument() {
        if (closed || !active || web == null || requestedUrl.isEmpty()) return;
        int run = ++generation;
        try {
            web.setWebViewClient(new PageClient(run));
            web.onResume();
            beginProbeSession(run);
            web.loadUrl(requestedUrl);
            scheduleProbe(run);
        } catch (RuntimeException | LinkageError unavailable) {
            fail(run, R.string.web_unavailable);
        }
    }

    private void beginProbeSession(int run) {
        cancelWork();
        ++evaluation;
        probes = 0;
        documentFinished = false;
        web.setAlpha(0f);
        update(State.LOADING, "");
        deadline = () -> {
            if (current(run) && state == State.LOADING) {
                fail(run, documentFinished ? R.string.web_player_missing : R.string.web_failed);
            }
        };
        handler.postDelayed(deadline, LOAD_TIMEOUT_MS);
    }

    private void stopDocument() {
        ++generation;
        ++evaluation;
        cancelWork();
        if (web == null) return;
        try {
            web.setAlpha(0f);
            web.stopLoading();
            // Replacing the document stops audio, JS observers and media requests too.
            web.loadUrl("about:blank");
            web.onPause();
            web.clearHistory();
        } catch (RuntimeException | LinkageError unavailable) { disposeView(); }
    }

    private void scheduleProbe(int run) {
        if (!current(run) || state != State.LOADING) return;
        if (scheduledProbe != null) handler.removeCallbacks(scheduledProbe);
        scheduledProbe = () -> probe(run);
        handler.postDelayed(scheduledProbe, PROBE_INTERVAL_MS);
    }

    private void probe(int run) {
        if (!current(run) || state != State.LOADING) return;
        if (!selectedPage(web.getUrl())) { scheduleProbe(run); return; }
        if (++probes > MAX_PROBES) { fail(run, R.string.web_player_missing); return; }
        int callback = ++evaluation;
        String script = "(function(){try{if(!window.__puretvCctvFocus||"
                + "typeof window.__puretvCctvFocus.refresh!=='function'){\n" + focusScript
                + "\n}return window.__puretvCctvFocus?window.__puretvCctvFocus.refresh():"
                + "{found:false,playing:false};}catch(e){return {found:false,playing:false};}})()";
        try {
            web.evaluateJavascript(script, value -> {
                if (!current(run) || callback != evaluation || state != State.LOADING
                        || !selectedPage(web.getUrl())) return;
                if (foundPlayer(value)) {
                    cancelWork();
                    web.setAlpha(1f);
                    // READY means the real player area exists, not that the broadcast is playing.
                    update(State.READY, "");
                } else scheduleProbe(run);
            });
        } catch (RuntimeException | LinkageError unavailable) { fail(run, R.string.web_unavailable); }
    }

    private static boolean foundPlayer(String value) {
        try {
            Object result = new JSONTokener(value == null ? "null" : value).nextValue();
            if (result instanceof String) result = new JSONTokener((String) result).nextValue();
            return result instanceof JSONObject && Boolean.TRUE.equals(((JSONObject) result).opt("found"));
        } catch (Exception invalid) { return false; }
    }

    private boolean current(int run) { return !closed && active && web != null && generation == run; }

    private boolean selectedPage(String url) {
        if (requestedUrl.isEmpty()) return false;
        try {
            String checked = ChannelCatalog.safePageUrl(url);
            // Permit the same channel's desktop/mobile index redirects, never a different page.
            return Uri.parse(checked).getPathSegments().get(1)
                    .equals(Uri.parse(requestedUrl).getPathSegments().get(1));
        } catch (IOException | RuntimeException invalid) { return false; }
    }

    private void fail(int run, int message) {
        if (!current(run)) return;
        stopDocument();
        setError(message);
    }

    private void setError(int message) { update(State.ERROR, context.getString(message)); }

    private void update(State next, String message) {
        state = next;
        error = message;
        if (events != null) events.changed();
    }

    private void cancelWork() {
        if (scheduledProbe != null) handler.removeCallbacks(scheduledProbe);
        if (deadline != null) handler.removeCallbacks(deadline);
        scheduledProbe = null;
        deadline = null;
    }

    private void disposeView() {
        if (web == null) return;
        try {
            if (web.getParent() instanceof ViewGroup) ((ViewGroup) web.getParent()).removeView(web);
            web.destroy();
        } catch (RuntimeException | LinkageError ignored) { }
        web = null;
    }

    private static String readScript(Context context) throws IOException {
        try (InputStream input = context.getAssets().open("player-focus.js");
                ByteArrayOutputStream bytes = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int count;
            while ((count = input.read(buffer)) != -1) {
                if (bytes.size() + count > MAX_SCRIPT_BYTES) throw new IOException("Player script is too large");
                bytes.write(buffer, 0, count);
            }
            if (bytes.size() == 0) throw new IOException("Player script is empty");
            return new String(bytes.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private static WebResourceResponse blockedResource() {
        return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", null,
                new ByteArrayInputStream(new byte[0]));
    }

    private final class PageClient extends WebViewClient {
        private final int run;
        PageClient(int run) { this.run = run; }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return request.isForMainFrame() ? !current(run) || !selectedPage(request.getUrl().toString())
                    : !allowedResource(request.getUrl());
        }

        @Override public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return !current(run) || !selectedPage(url);
        }

        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame()) {
                if ("about:blank".equals(request.getUrl().toString())) return null;
                return current(run) && selectedPage(request.getUrl().toString()) ? null : blockedResource();
            }
            // HTTPS CDN/media resources use the normal WebView stack and its normal origin rules.
            return allowedResource(request.getUrl()) ? null : blockedResource();
        }

        @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
            if (!current(run) || "about:blank".equals(url)) return;
            if (!selectedPage(url)) { fail(run, R.string.web_failed); return; }
            // A same-channel redirect or website reload replaces the cropped DOM too.
            beginProbeSession(run);
            scheduleProbe(run);
        }

        @Override public void onPageFinished(WebView view, String url) {
            if (!current(run) || !selectedPage(url) || state != State.LOADING) return;
            documentFinished = true;
            probe(run);
        }

        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError failure) {
            if (request.isForMainFrame()) fail(run, R.string.web_failed);
        }

        @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame()) fail(run, R.string.web_failed);
        }

        @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError failure) {
            handler.cancel();
            if (failure != null && selectedPage(failure.getUrl())) fail(run, R.string.web_failed);
        }

        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            if (web == view) {
                ++generation;
                cancelWork();
                disposeView();
                setError(R.string.web_unavailable);
            }
            return true;
        }
    }

    private static boolean allowedResource(Uri uri) {
        String scheme = uri.getScheme();
        return "https".equalsIgnoreCase(scheme) || "data".equalsIgnoreCase(scheme) || "blob".equalsIgnoreCase(scheme);
    }
}
