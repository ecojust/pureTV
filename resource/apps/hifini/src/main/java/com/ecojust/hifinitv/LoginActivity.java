package com.ecojust.hifinitv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.graphics.Color;
import android.net.http.SslError;
import android.os.Bundle;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebStorage;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

/** Official website login with an optional, device-encrypted account supplied by the user. */
public class LoginActivity extends Activity {
    private WebView browser;
    private TextView status;
    private TextView accountStatus;
    private Button back;
    private ProgressBar progress;
    private boolean pageFailed;
    private CredentialStore credentialStore;
    private CredentialStore.Credentials remembered;
    private EditText username, password;
    private String filledPage;
    private boolean pageLoading, pendingLogin, sessionConfirmed, nativeLoginAttempted;
    private long pendingLoginUntil;
    private ImageView registrationCode;

    @SuppressLint("SetJavaScriptEnabled") // The official site's forms/verification run normally in its WebView.
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        // Credentials never enter activity saved state, platform autofill, screenshots or backups.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        credentialStore = new CredentialStore(this);
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(0xff101416); root.setPadding(dp(18), dp(12), dp(18), dp(12));
        LinearLayout toolbar = new LinearLayout(this); toolbar.setGravity(Gravity.CENTER_VERTICAL);
        TextView title = new TextView(this); title.setText(R.string.hifini_login_title);
        title.setTextColor(0xfff1f0e8); title.setTextSize(18);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(48), 1));
        back = button(R.string.hifini_web_back, () -> { if (browser != null && browser.canGoBack()) browser.goBack(); });
        back.setEnabled(false); toolbar.addView(back);
        toolbar.addView(button(R.string.hifini_open_login, () -> { if (browser != null) browser.loadUrl(HifiniSession.LOGIN); }));
        toolbar.addView(button(R.string.hifini_web_reload, () -> { if (browser != null) browser.reload(); }));
        Button done = button(R.string.hifini_login_done, this::finish); toolbar.addView(done);
        root.addView(toolbar, new LinearLayout.LayoutParams(-1, -2));
        status = new TextView(this); status.setText(R.string.hifini_login_explanation);
        status.setTextSize(14); status.setTextColor(0xffc5e4d2); status.setPadding(0, dp(6), 0, dp(8));
        root.addView(status, new LinearLayout.LayoutParams(-1, -2));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100); root.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        LinearLayout body = new LinearLayout(this); body.setPadding(0, dp(8), 0, 0);
        root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout.LayoutParams accountSize = new LinearLayout.LayoutParams(dp(300), -1); accountSize.rightMargin = dp(14);
        body.addView(accountPanel(), accountSize);
        try {
            remembered = credentialStore.load();
            if (remembered != null) { username.setText(remembered.username); password.setText(remembered.password); }
        } catch (Exception unavailableKey) { accountStatus.setText(R.string.hifini_storage_failed); }
        setContentView(root);
        try {
            browser = new WebView(this); browser.setBackgroundColor(Color.WHITE);
            browser.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
            browser.setFocusable(true); browser.setFocusableInTouchMode(true);
            WebSettings settings = browser.getSettings();
            settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(false); settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false); settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setJavaScriptCanOpenWindowsAutomatically(false); settings.setSupportMultipleWindows(false);
            settings.setSaveFormData(false); settings.setSavePassword(false);
            settings.setMediaPlaybackRequiresUserGesture(true); settings.setSafeBrowsingEnabled(true);
            settings.setUserAgentString(HifiniApi.AGENT);
            CookieManager cookies = CookieManager.getInstance(); cookies.setAcceptCookie(true);
            cookies.setAcceptThirdPartyCookies(browser, false);
            browser.setWebViewClient(new SiteClient());
            browser.setWebChromeClient(new WebChromeClient() {
                @Override public void onProgressChanged(WebView view, int value) {
                    progress.setProgress(value); progress.setVisibility(value < 100 ? View.VISIBLE : View.INVISIBLE);
                }
            });
            body.addView(browser, new LinearLayout.LayoutParams(0, -1, 1));
            browser.loadUrl(HifiniSession.LOGIN);
            registrationCode.requestFocus();
        } catch (RuntimeException unavailableWebView) {
            status.setText(R.string.hifini_webview_unavailable); progress.setVisibility(View.INVISIBLE);
            done.requestFocus();
        }
    }

    private ScrollView accountPanel() {
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.setOverScrollMode(View.OVER_SCROLL_NEVER);
        scroll.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(0xff19231f); background.setCornerRadius(dp(14)); scroll.setBackground(background);
        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setPadding(dp(14), dp(10), dp(14), dp(10));
        scroll.addView(card, new ScrollView.LayoutParams(-1, -2));
        TextView title = new TextView(this); title.setText(R.string.hifini_registration_title);
        title.setTextColor(0xfff1f0e8); title.setTextSize(16); title.setGravity(Gravity.CENTER);
        card.addView(title, new LinearLayout.LayoutParams(-1, dp(24)));
        registrationCode = new ImageView(this); registrationCode.setContentDescription(getString(R.string.hifini_registration_qr));
        registrationCode.setFocusable(true);
        registrationCode.setImageBitmap(RegistrationQrCode.create(dp(128))); registrationCode.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        LinearLayout.LayoutParams qrSize = new LinearLayout.LayoutParams(dp(128), dp(128)); qrSize.gravity = Gravity.CENTER_HORIZONTAL;
        qrSize.topMargin = dp(4); card.addView(registrationCode, qrSize);
        TextView link = new TextView(this); link.setText(HifiniSession.REGISTER); link.setTextSize(10); link.setGravity(Gravity.CENTER);
        link.setTextColor(0xffa9b7af); card.addView(link, new LinearLayout.LayoutParams(-1, dp(20)));
        TextView hint = new TextView(this); hint.setText(R.string.hifini_registration_hint); hint.setTextSize(12);
        hint.setGravity(Gravity.CENTER); hint.setTextColor(0xffc5e4d2); hint.setPadding(0, 0, 0, dp(4));
        card.addView(hint, new LinearLayout.LayoutParams(-1, -2));
        username = field(R.string.hifini_username, InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        password = field(R.string.hifini_password, InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        username.setId(View.generateViewId()); password.setId(View.generateViewId()); username.setNextFocusDownId(password.getId());
        registrationCode.setNextFocusDownId(username.getId());
        card.addView(username, new LinearLayout.LayoutParams(-1, dp(40)));
        card.addView(password, new LinearLayout.LayoutParams(-1, dp(40)));
        Button login = button(R.string.hifini_remember, this::remember); login.setId(View.generateViewId());
        password.setNextFocusDownId(login.getId()); login.setNextFocusUpId(password.getId());
        card.addView(login, new LinearLayout.LayoutParams(-1, dp(44)));
        LinearLayout secondary = new LinearLayout(this);
        Button forget = button(R.string.hifini_forget, this::forget), logout = button(R.string.hifini_sign_out, this::confirmSignOut);
        for (Button action : new Button[]{forget, logout}) { action.setTextSize(12); action.setMinWidth(0); action.setMinimumWidth(0); secondary.addView(action, new LinearLayout.LayoutParams(0, dp(36), 1)); }
        card.addView(secondary, new LinearLayout.LayoutParams(-1, -2));
        accountStatus = new TextView(this); accountStatus.setTextColor(0xffc5e4d2); accountStatus.setTextSize(12);
        accountStatus.setPadding(0, dp(3), 0, 0); accountStatus.setText(R.string.hifini_account_privacy);
        card.addView(accountStatus, new LinearLayout.LayoutParams(-1, -2));
        return scroll;
    }

    private final class SiteClient extends WebViewClient {
        private boolean block(String address) {
            if (HifiniSession.allows(address)) return false;
            status.setText(R.string.hifini_login_blocked); return true;
        }
        @Override public boolean shouldOverrideUrlLoading(WebView view, String address) { return block(address); }
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return request.isForMainFrame() && block(request.getUrl().toString());
        }
        @Override public void onPageStarted(WebView view, String address, android.graphics.Bitmap favicon) {
            if (!HifiniSession.allows(address)) { view.stopLoading(); pageFailed = true; status.setText(R.string.hifini_login_blocked); return; }
            pageFailed = false; pageLoading = true; filledPage = null; status.setText(R.string.hifini_login_loading);
        }
        @Override public void onPageFinished(WebView view, String address) {
            pageLoading = false; back.setEnabled(view.canGoBack()); HifiniSession.flush();
            if (!pageFailed && HifiniSession.allows(address)) {
                status.setText(R.string.hifini_login_explanation); inspectWebsiteSession(address);
            }
        }
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && !HifiniSession.allows(request.getUrl().toString())) {
                return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", java.util.Collections.emptyMap(),
                        new java.io.ByteArrayInputStream(new byte[0]));
            }
            return null;
        }
        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) { pageFailed = true; pageLoading = false; pendingLogin = false; status.setText(R.string.hifini_login_failed); }
        }
        @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame()) { pageFailed = true; pageLoading = false; pendingLogin = false; status.setText(R.string.hifini_login_failed); }
        }
        @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel(); pageFailed = true; pageLoading = false; pendingLogin = false; status.setText(R.string.hifini_login_tls_error);
        }
    }

    private void inspectWebsiteSession(String address) {
        if (browser == null || sessionConfirmed || !HifiniSession.allows(address) || !address.equals(browser.getUrl())) return;
        browser.evaluateJavascript(HifiniSession.authenticatedPageScript(), result -> {
            if (browser == null || pageFailed || sessionConfirmed || !address.equals(browser.getUrl())) return;
            if ("true".equals(result)) {
                sessionConfirmed = true; pendingLogin = false; HifiniSession.flush();
                accountStatus.setText(R.string.hifini_signed_in);
                if (nativeLoginAttempted) {
                    nativeLoginAttempted = false;
                    android.widget.Toast.makeText(this, R.string.hifini_signed_in, android.widget.Toast.LENGTH_SHORT).show(); finish();
                }
            } else fillRemembered(address);
        });
    }

    private EditText field(int hint, int type) {
        EditText field = new EditText(this); field.setHint(hint); field.setContentDescription(getString(hint));
        field.setTextColor(0xfff1f0e8); field.setHintTextColor(0xffa9b7af); field.setTextSize(14);
        field.setSingleLine(true); field.setInputType(type); field.setSaveEnabled(false);
        field.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(hint == R.string.hifini_username ? 256 : 4096)});
        field.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO);
        field.setImeOptions(android.view.inputmethod.EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING);
        return field;
    }

    private void remember() {
        pendingLogin = false; nativeLoginAttempted = false;
        CredentialStore.Credentials entered = new CredentialStore.Credentials(username.getText().toString().trim(), password.getText().toString());
        if (!entered.valid()) { accountStatus.setText(R.string.hifini_enter_credentials); return; }
        try {
            credentialStore.save(entered); remembered = entered; filledPage = null;
            nativeLoginAttempted = true; sessionConfirmed = false;
            pendingLogin = true; pendingLoginUntil = android.os.SystemClock.elapsedRealtime() + 30000;
            accountStatus.setText(R.string.hifini_credentials_saved);
            if (browser != null) {
                String address = browser.getUrl();
                if (!pageFailed && HifiniSession.allows(address) && java.net.URI.create(address).getPath().matches("/user-login(?:\\.htm)?/?")) {
                    if (!pageLoading) fillRemembered(address);
                }
                else browser.loadUrl(HifiniSession.LOGIN);
            }
        } catch (Exception unavailableKey) { accountStatus.setText(R.string.hifini_storage_failed); }
    }

    private void fillRemembered(String address) {
        if (remembered == null || browser == null || pageFailed || pageLoading || !HifiniSession.allows(address)
                || !address.equals(browser.getUrl()) || address.equals(filledPage)) return;
        filledPage = address;
        boolean submit = pendingLogin && android.os.SystemClock.elapsedRealtime() <= pendingLoginUntil;
        pendingLogin = false;
        // Both native navigation and the script check the top-level origin and POST login form.
        // Default restoration only fills. A single explicit native login may invoke normal form validation/submission.
        browser.evaluateJavascript(LoginAutofill.script(remembered, submit), result -> {
            if (browser == null || !address.equals(browser.getUrl()) || pageFailed) return;
            if ("\"filled\"".equals(result)) status.setText(R.string.hifini_credentials_filled);
            else if ("\"submitted\"".equals(result)) status.setText(R.string.hifini_credentials_submitted);
            else if (submit) status.setText(R.string.hifini_login_manual);
        });
    }

    private void forget() {
        pendingLogin = false; nativeLoginAttempted = false;
        try {
            credentialStore.forget(); remembered = null; pendingLogin = false; username.setText(""); password.setText(""); filledPage = null;
            if (browser != null) browser.reload();
            accountStatus.setText(R.string.hifini_credentials_forgotten);
        } catch (Exception storageFailure) { accountStatus.setText(R.string.hifini_storage_failed); }
    }

    private void confirmSignOut() {
        new AlertDialog.Builder(this).setTitle(R.string.hifini_sign_out)
                .setMessage(R.string.hifini_sign_out_confirm)
                .setNegativeButton(android.R.string.cancel, null)
                .setPositiveButton(R.string.hifini_sign_out, (dialog, which) -> signOut()).show();
    }

    private void signOut() {
        pendingLogin = false; nativeLoginAttempted = false; sessionConfirmed = false;
        try { credentialStore.forget(); }
        catch (Exception storageFailure) { accountStatus.setText(R.string.hifini_storage_failed); return; }
        remembered = null; pendingLogin = false; username.setText(""); password.setText(""); filledPage = null;
        if (browser != null) { browser.stopLoading(); browser.clearCache(true); browser.clearHistory(); browser.clearFormData(); }
        try { WebStorage.getInstance().deleteAllData(); }
        catch (RuntimeException unavailableWebView) { accountStatus.setText(R.string.hifini_sign_out_failed); return; }
        HifiniSession.signOut(success -> {
            if (isFinishing() || isDestroyed()) return;
            accountStatus.setText(success ? R.string.hifini_signed_out : R.string.hifini_sign_out_failed);
            if (success && browser != null) browser.loadUrl(HifiniSession.HOME);
        });
    }

    private Button button(int label, Runnable action) {
        Button result = new Button(this); result.setText(label); result.setTextSize(14); result.setAllCaps(false);
        result.setOnClickListener(view -> action.run()); return result;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onBackPressed() { if (browser != null && browser.canGoBack()) browser.goBack(); else super.onBackPressed(); }
    @Override protected void onResume() { super.onResume(); if (browser != null) browser.onResume(); }
    @Override protected void onPause() { HifiniSession.flush(); if (browser != null) browser.onPause(); super.onPause(); }
    @Override protected void onDestroy() {
        remembered = null; pendingLogin = false;
        if (username != null) username.setText("");
        if (password != null) password.setText("");
        if (browser != null) {
            browser.stopLoading();
            if (browser.getParent() instanceof ViewGroup) ((ViewGroup)browser.getParent()).removeView(browser);
            browser.destroy(); browser = null;
        }
        super.onDestroy();
    }
}
