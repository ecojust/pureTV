package com.ecojust.hifinitv;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JsResult;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

/** Native account screen backed by the official website's normal login form. */
public class LoginActivity extends Activity {
    private static final long POLL_MS = 500, LOGIN_TIMEOUT_MS = 30000, SUCCESS_DELAY_MS = 1500;
    private WebView browser;
    private TextView status, accountStatus;
    private ProgressBar progress;
    private Button login;
    private CredentialStore credentialStore;
    private CredentialStore.Credentials remembered;
    private EditText username, password;
    private ImageView registrationCode;
    private boolean resumed, destroyed, browserReady, pageFailed, loginActive, pendingLogin, polling, successPending;
    private int generation;
    private long deadline;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable poll = this::pollWebsite;
    private final Runnable timeout = () -> { if (loginActive) failAttempt(R.string.hifini_login_timeout); };
    private final Runnable returnAfterSuccess = () -> {
        if (successPending && resumed && !destroyed && !isFinishing()) { successPending = false; finish(); }
    };

    @SuppressLint("SetJavaScriptEnabled") // Only the official website's own login and verification code runs.
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        credentialStore = new CredentialStore(this);
        FrameLayout root = new FrameLayout(this); root.setBackgroundColor(0xff101416); root.setPadding(dp(16), dp(12), dp(16), dp(12));
        int available = Math.max(240, getResources().getConfiguration().screenWidthDp - 32);
        root.addView(accountPanel(), new FrameLayout.LayoutParams(dp(Math.min(360, available)), -2, Gravity.CENTER));
        try {
            remembered = credentialStore.load();
            if (remembered != null) { username.setText(remembered.username); password.setText(remembered.password); }
        } catch (Exception unavailableKey) { accountStatus.setText(R.string.hifini_storage_failed); }
        setContentView(root);
        try {
            browser = new WebView(this);
            browser.setVisibility(View.INVISIBLE); browser.setFocusable(false); browser.setFocusableInTouchMode(false);
            browser.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS);
            browser.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
            WebSettings settings = browser.getSettings();
            settings.setJavaScriptEnabled(true); settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(false); settings.setAllowContentAccess(false);
            settings.setAllowFileAccessFromFileURLs(false); settings.setAllowUniversalAccessFromFileURLs(false);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
            settings.setJavaScriptCanOpenWindowsAutomatically(false); settings.setSupportMultipleWindows(false);
            settings.setSaveFormData(false); settings.setSavePassword(false);
            settings.setMediaPlaybackRequiresUserGesture(true); settings.setSafeBrowsingEnabled(true);
            settings.setUserAgentString(HifiniApi.AGENT);
            CookieManager cookies = CookieManager.getInstance(); cookies.setAcceptCookie(true); cookies.setAcceptThirdPartyCookies(browser, false);
            browser.setWebViewClient(new SiteClient());
            browser.setWebChromeClient(new WebChromeClient() {
                @Override public boolean onJsAlert(WebView view, String address, String message, JsResult result) {
                    int failure = alertFailure(message);
                    if (loginActive && HifiniSession.allows(address) && failure != 0) failAttempt(failure);
                    result.confirm(); return true;
                }
                @Override public boolean onJsConfirm(WebView view, String address, String message, JsResult result) {
                    int failure = alertFailure(message);
                    if (loginActive) failAttempt(failure != 0 ? failure : R.string.hifini_login_unsupported);
                    result.cancel(); return true;
                }
            });
            // Keep a real viewport for website layout/validation, without displaying or focusing it.
            root.addView(browser, 0, new FrameLayout.LayoutParams(-1, -1));
        } catch (RuntimeException unavailableWebView) {
            if (browser != null) { browser.destroy(); browser = null; }
            showStatus(R.string.hifini_webview_unavailable); login.setEnabled(false);
        }
        registrationCode.requestFocus();
    }

    private ScrollView accountPanel() {
        ScrollView scroll = new ScrollView(this); scroll.setOverScrollMode(View.OVER_SCROLL_NEVER);
        scroll.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
        android.graphics.drawable.GradientDrawable background = new android.graphics.drawable.GradientDrawable();
        background.setColor(0xff19231f); background.setCornerRadius(dp(14)); scroll.setBackground(background);
        LinearLayout card = new LinearLayout(this); card.setOrientation(LinearLayout.VERTICAL); card.setPadding(dp(18), dp(12), dp(18), dp(12));
        scroll.addView(card, new ScrollView.LayoutParams(-1, -2));
        TextView title = new TextView(this); title.setText(R.string.hifini_registration_title); title.setTextColor(0xfff1f0e8);
        title.setTextSize(16); title.setGravity(Gravity.CENTER); card.addView(title, new LinearLayout.LayoutParams(-1, dp(24)));
        registrationCode = new ImageView(this); registrationCode.setContentDescription(getString(R.string.hifini_registration_qr)); registrationCode.setFocusable(true);
        registrationCode.setImageBitmap(RegistrationQrCode.create(dp(128))); registrationCode.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        LinearLayout.LayoutParams qrSize = new LinearLayout.LayoutParams(dp(128), dp(128)); qrSize.gravity = Gravity.CENTER_HORIZONTAL; qrSize.topMargin = dp(4);
        card.addView(registrationCode, qrSize);
        TextView link = new TextView(this); link.setText(HifiniSession.REGISTER); link.setTextSize(10); link.setGravity(Gravity.CENTER); link.setTextColor(0xffa9b7af);
        card.addView(link, new LinearLayout.LayoutParams(-1, dp(20)));
        TextView hint = new TextView(this); hint.setText(R.string.hifini_registration_hint); hint.setTextSize(12); hint.setGravity(Gravity.CENTER);
        hint.setTextColor(0xffc5e4d2); hint.setPadding(0, 0, 0, dp(4)); card.addView(hint, new LinearLayout.LayoutParams(-1, -2));
        username = field(R.string.hifini_username, InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS);
        password = field(R.string.hifini_password, InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_PASSWORD);
        username.setId(View.generateViewId()); password.setId(View.generateViewId()); username.setNextFocusDownId(password.getId()); registrationCode.setNextFocusDownId(username.getId());
        card.addView(username, new LinearLayout.LayoutParams(-1, dp(40))); card.addView(password, new LinearLayout.LayoutParams(-1, dp(40)));
        login = button(R.string.hifini_remember, this::remember); login.setId(View.generateViewId()); password.setNextFocusDownId(login.getId()); login.setNextFocusUpId(password.getId());
        card.addView(login, new LinearLayout.LayoutParams(-1, dp(44)));
        status = new TextView(this); status.setTextColor(0xffc5e4d2); status.setTextSize(14); status.setGravity(Gravity.CENTER);
        status.setAccessibilityLiveRegion(View.ACCESSIBILITY_LIVE_REGION_POLITE); status.setPadding(0, dp(3), 0, dp(3)); status.setText(R.string.hifini_login_explanation);
        card.addView(status, new LinearLayout.LayoutParams(-1, -2));
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal); progress.setIndeterminate(true); progress.setVisibility(View.GONE);
        card.addView(progress, new LinearLayout.LayoutParams(-1, dp(3)));
        LinearLayout secondary = new LinearLayout(this);
        for (Button action : new Button[]{button(R.string.hifini_forget, this::forget), button(R.string.hifini_sign_out, this::confirmSignOut)}) {
            action.setTextSize(12); action.setMinWidth(0); action.setMinimumWidth(0); secondary.addView(action, new LinearLayout.LayoutParams(0, dp(36), 1));
        }
        card.addView(secondary, new LinearLayout.LayoutParams(-1, -2));
        accountStatus = new TextView(this); accountStatus.setTextColor(0xffa9b7af); accountStatus.setTextSize(12);
        accountStatus.setPadding(0, dp(3), 0, 0); accountStatus.setText(R.string.hifini_account_privacy); card.addView(accountStatus, new LinearLayout.LayoutParams(-1, -2));
        return scroll;
    }

    private final class SiteClient extends WebViewClient {
        private boolean block(String address) {
            if (HifiniSession.allows(address)) return false;
            pageFailed = true; failAttempt(R.string.hifini_login_blocked); return true;
        }
        @Override public boolean shouldOverrideUrlLoading(WebView view, String address) { return block(address); }
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return request.isForMainFrame() && block(request.getUrl().toString()); }
        @Override public void onPageStarted(WebView view, String address, android.graphics.Bitmap favicon) {
            if (destroyed || block(address)) { view.stopLoading(); return; }
            browserReady = false; pageFailed = false; polling = false;
        }
        @Override public void onPageFinished(WebView view, String address) {
            if (destroyed || pageFailed || !HifiniSession.allows(address) || !address.equals(view.getUrl())) return;
            browserReady = true; HifiniSession.flush();
            if (!resumed || successPending) return;
            if (loginActive) pollWebsite(); else inspectExistingSession();
        }
        @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && !HifiniSession.allows(request.getUrl().toString())) return new WebResourceResponse("text/plain", "UTF-8", 403, "Blocked", java.util.Collections.emptyMap(), new java.io.ByteArrayInputStream(new byte[0]));
            return null;
        }
        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame() && !destroyed) { pageFailed = true; browserReady = false; failAttempt(R.string.hifini_login_failed); }
        }
        @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame() && !destroyed) { pageFailed = true; browserReady = false; failAttempt(response.getStatusCode() == 403 ? R.string.hifini_login_verification : R.string.hifini_login_failed); }
        }
        @Override public void onReceivedSslError(WebView view, SslErrorHandler ssl, SslError error) {
            ssl.cancel(); pageFailed = true; browserReady = false; if (!destroyed) failAttempt(R.string.hifini_login_tls_error);
        }
    }

    private void remember() {
        if (!resumed || destroyed) return;
        cancelWork();
        CredentialStore.Credentials entered = new CredentialStore.Credentials(username.getText().toString().trim(), password.getText().toString());
        if (!entered.valid()) { showStatus(R.string.hifini_enter_credentials); return; }
        try { credentialStore.save(entered); remembered = entered; accountStatus.setText(R.string.hifini_credentials_saved); }
        catch (Exception unavailableKey) { showStatus(R.string.hifini_storage_failed); return; }
        if (browser == null) { showStatus(R.string.hifini_webview_unavailable); return; }
        loginActive = true; pendingLogin = true; deadline = SystemClock.uptimeMillis() + LOGIN_TIMEOUT_MS;
        setBusy(true); showStatus(R.string.hifini_login_submitting); handler.postDelayed(timeout, LOGIN_TIMEOUT_MS);
        // A fresh official page clears any validation errors from an earlier attempt.
        pageFailed = false; browserReady = false; browser.stopLoading(); browser.loadUrl(HifiniSession.LOGIN);
    }

    private boolean callbackAllowed(int token, String address) {
        return resumed && !destroyed && !isFinishing() && token == generation && browser != null && !pageFailed
                && HifiniSession.allows(address) && address.equals(browser.getUrl());
    }

    private void pollWebsite() {
        handler.removeCallbacks(poll);
        if (!loginActive || !resumed || destroyed || browser == null || polling) return;
        if (SystemClock.uptimeMillis() >= deadline) { failAttempt(R.string.hifini_login_timeout); return; }
        if (!browserReady) { handler.postDelayed(poll, POLL_MS); return; }
        final int token = generation; final String address = browser.getUrl();
        if (!HifiniSession.allows(address)) { failAttempt(R.string.hifini_login_blocked); return; }
        polling = true;
        browser.evaluateJavascript(LoginAutofill.stateScript(), result -> {
            if (!callbackAllowed(token, address)) return;
            polling = false;
            if (!loginActive) return;
            if ("\"authenticated\"".equals(result)) { loginSucceeded(); return; }
            if ("\"verification\"".equals(result)) { failAttempt(R.string.hifini_login_verification); return; }
            if ("\"rejected\"".equals(result)) { failAttempt(R.string.hifini_login_rejected); return; }
            if ("\"blocked\"".equals(result)) { failAttempt(R.string.hifini_login_blocked); return; }
            if ("\"ready\"".equals(result) && pendingLogin) { pendingLogin = false; submitOfficialForm(token, address); return; }
            handler.postDelayed(poll, POLL_MS);
        });
    }

    private void submitOfficialForm(int token, String address) {
        if (!callbackAllowed(token, address) || !loginActive || remembered == null) return;
        browser.evaluateJavascript(LoginAutofill.script(remembered, true), result -> {
            if (!callbackAllowed(token, address) || !loginActive) return;
            if ("\"submitted\"".equals(result)) { showStatus(R.string.hifini_login_submitting); handler.postDelayed(poll, POLL_MS); }
            else if ("\"verification\"".equals(result)) failAttempt(R.string.hifini_login_verification);
            else if ("\"rejected\"".equals(result)) failAttempt(R.string.hifini_login_rejected);
            else failAttempt(R.string.hifini_login_unsupported);
        });
    }

    private void inspectExistingSession() {
        if (browser == null || !browserReady || !resumed || loginActive || successPending) return;
        final int token = generation; final String address = browser.getUrl();
        if (!HifiniSession.allows(address)) return;
        browser.evaluateJavascript(LoginAutofill.stateScript(), result -> {
            if (!callbackAllowed(token, address) || loginActive || successPending) return;
            if ("\"authenticated\"".equals(result)) { HifiniSession.flush(); showStatus(R.string.hifini_signed_in); }
        });
    }

    private void loginSucceeded() {
        cancelWork(); HifiniSession.flush(); successPending = true; setBusy(true); progress.setVisibility(View.GONE);
        showStatus(R.string.hifini_login_success); status.setTextSize(18);
        handler.postDelayed(returnAfterSuccess, SUCCESS_DELAY_MS);
    }
    private void failAttempt(int reason) { cancelWork(); if (!destroyed) showStatus(reason); }
    private void showStatus(int message) { status.setTextSize(14); status.setText(message); }
    private void setBusy(boolean busy) {
        login.setEnabled(!busy && browser != null); username.setEnabled(!busy); password.setEnabled(!busy);
        progress.setVisibility(busy ? View.VISIBLE : View.GONE);
    }
    private void cancelWork() {
        generation++; loginActive = false; pendingLogin = false; polling = false; successPending = false;
        handler.removeCallbacks(poll); handler.removeCallbacks(timeout); handler.removeCallbacks(returnAfterSuccess);
        if (login != null) setBusy(false);
    }
    static int alertFailure(String value) {
        if (value == null) return 0;
        String lower = value.toLowerCase(java.util.Locale.ROOT);
        if (lower.contains("验证码") || lower.contains("人机") || lower.contains("captcha") || lower.contains("verification")) return R.string.hifini_login_verification;
        for (String marker : new String[]{"登录失败", "密码错误", "账号或密码", "账户或密码", "用户不存在", "invalid password", "incorrect password", "wrong password", "invalid credentials", "login failed", "sign-in failed", "account not found"})
            if (lower.contains(marker)) return R.string.hifini_login_rejected;
        return 0;
    }

    private EditText field(int hint, int type) {
        EditText field = new EditText(this); field.setHint(hint); field.setContentDescription(getString(hint));
        field.setTextColor(0xfff1f0e8); field.setHintTextColor(0xffa9b7af); field.setTextSize(14); field.setSingleLine(true); field.setInputType(type); field.setSaveEnabled(false);
        field.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(hint == R.string.hifini_username ? 256 : 4096)});
        field.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO); field.setImeOptions(android.view.inputmethod.EditorInfo.IME_FLAG_NO_PERSONALIZED_LEARNING); return field;
    }
    private void forget() {
        cancelWork();
        try { credentialStore.forget(); remembered = null; username.setText(""); password.setText(""); showStatus(R.string.hifini_credentials_forgotten); }
        catch (Exception storageFailure) { showStatus(R.string.hifini_storage_failed); }
    }
    private void confirmSignOut() {
        new AlertDialog.Builder(this).setTitle(R.string.hifini_sign_out).setMessage(R.string.hifini_sign_out_confirm)
                .setNegativeButton(android.R.string.cancel, null).setPositiveButton(R.string.hifini_sign_out, (dialog, which) -> signOut()).show();
    }
    private void signOut() {
        cancelWork(); final int token = generation;
        try { credentialStore.forget(); } catch (Exception storageFailure) { showStatus(R.string.hifini_storage_failed); return; }
        remembered = null; username.setText(""); password.setText(""); browserReady = false;
        if (browser != null) { browser.stopLoading(); browser.clearCache(true); browser.clearHistory(); browser.clearFormData(); }
        try { WebStorage.getInstance().deleteAllData(); } catch (RuntimeException unavailableWebView) { showStatus(R.string.hifini_sign_out_failed); return; }
        HifiniSession.signOut(success -> {
            if (destroyed || !resumed || isFinishing() || token != generation) return;
            showStatus(success ? R.string.hifini_signed_out : R.string.hifini_sign_out_failed);
            if (success && browser != null) browser.loadUrl(HifiniSession.LOGIN);
        });
    }
    private Button button(int label, Runnable action) {
        Button result = new Button(this); result.setText(label); result.setTextSize(14); result.setAllCaps(false); result.setOnClickListener(view -> action.run()); return result;
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    @Override public void onBackPressed() { cancelWork(); super.onBackPressed(); }
    @Override protected void onResume() {
        super.onResume(); resumed = true; if (browser != null) { browser.onResume(); if (browserReady) inspectExistingSession(); else browser.loadUrl(HifiniSession.LOGIN); }
    }
    @Override protected void onPause() {
        boolean interrupted = loginActive; resumed = false; cancelWork(); if (interrupted) showStatus(R.string.hifini_login_interrupted);
        HifiniSession.flush(); if (browser != null) { browser.stopLoading(); browser.onPause(); } super.onPause();
    }
    @Override protected void onDestroy() {
        destroyed = true; resumed = false; cancelWork(); remembered = null;
        if (username != null) username.setText(""); if (password != null) password.setText("");
        if (browser != null) { browser.stopLoading(); if (browser.getParent() instanceof ViewGroup) ((ViewGroup)browser.getParent()).removeView(browser); browser.destroy(); browser = null; }
        super.onDestroy();
    }
}
