package com.ecojust.hifinitv;

import android.content.ComponentName;
import android.content.pm.ApplicationInfo;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ScrollView;
import android.widget.TextView;
import java.util.Map;
import java.time.Duration;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28, qualifiers="en-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class LoginActivityTest {
    private static <T extends View>T find(View root, Class<T> type) {
        if (type.isInstance(root)) return type.cast(root);
        if (root instanceof ViewGroup) for (int i=0;i<((ViewGroup)root).getChildCount();i++) {
            T result=find(((ViewGroup)root).getChildAt(i),type); if(result!=null)return result;
        }
        return null;
    }
    private static WebResourceRequest request(String address, boolean main) {
        return new WebResourceRequest() {
            public Uri getUrl(){return Uri.parse(address);} public boolean isForMainFrame(){return main;}
            public boolean isRedirect(){return false;} public boolean hasGesture(){return true;}
            public String getMethod(){return "GET";} public Map<String,String>getRequestHeaders(){return Map.of();}
        };
    }
    private static TextView text(View root,String value) {
        if(root instanceof TextView&&value.contentEquals(((TextView)root).getText()))return (TextView)root;
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){TextView found=text(((ViewGroup)root).getChildAt(i),value);if(found!=null)return found;}
        return null;
    }
    @SuppressWarnings("unchecked") private static <T>T field(LoginActivity activity,String name)throws Exception {
        java.lang.reflect.Field field=LoginActivity.class.getDeclaredField(name);field.setAccessible(true);return(T)field.get(activity);
    }
    private static void layout(View root) {
        for(int i=0;i<2;i++){
            root.measure(View.MeasureSpec.makeMeasureSpec(1920,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(1080,View.MeasureSpec.EXACTLY));
            root.layout(0,0,1920,1080);shadowOf(android.os.Looper.getMainLooper()).idle();
        }
    }
    private static WebView startAttempt(LoginActivity activity)throws Exception {
        javax.crypto.SecretKey key=javax.crypto.KeyGenerator.getInstance("AES").generateKey();
        CredentialStore store=new CredentialStore(activity.getSharedPreferences("login-click-test",0),()->key);
        java.lang.reflect.Field storeField=LoginActivity.class.getDeclaredField("credentialStore");storeField.setAccessible(true);storeField.set(activity,store);
        EditText username=field(activity,"username"),password=field(activity,"password");username.setText("fixture-user");password.setText("fixture-password");
        text(activity.getWindow().getDecorView(),activity.getString(R.string.hifini_remember)).performClick();
        assertEquals("fixture-user",store.load().username);return field(activity,"browser");
    }
    private static void pageReady(WebView browser) {
        browser.getWebViewClient().onPageStarted(browser,HifiniSession.LOGIN,null);
        browser.getWebViewClient().onPageFinished(browser,HifiniSession.LOGIN);
    }
    private static void reply(WebView browser,String state) { shadowOf(browser).getLastEvaluatedJavascriptCallback().onReceiveValue("\""+state+"\""); }
    private static void advance(long milliseconds) { shadowOf(android.os.Looper.getMainLooper()).idleFor(Duration.ofMillis(milliseconds)); }
    @Test public void loginUsesOfficialPageAndHardenedWebViewWithoutAJavaScriptBridge() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get(); WebView web=find(a.getWindow().getDecorView(),WebView.class); assertNotNull(web);
            assertEquals(HifiniSession.LOGIN,shadowOf(web).getLastLoadedUrl());
            WebSettings settings=web.getSettings(); assertTrue(settings.getJavaScriptEnabled()); assertTrue(settings.getDomStorageEnabled());
            assertFalse(settings.getAllowFileAccess()); assertFalse(settings.getAllowContentAccess());
            assertEquals(WebSettings.MIXED_CONTENT_NEVER_ALLOW,settings.getMixedContentMode());
            assertFalse(settings.getJavaScriptCanOpenWindowsAutomatically()); assertFalse(settings.getSaveFormData());
            assertEquals(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS, web.getImportantForAutofill());
            assertEquals(View.INVISIBLE,web.getVisibility());assertFalse(web.isShown());assertFalse(web.isFocusable());
            assertEquals(View.IMPORTANT_FOR_ACCESSIBILITY_NO_HIDE_DESCENDANTS,web.getImportantForAccessibility());
            for(int label:new int[]{R.string.hifini_web_back,R.string.hifini_web_reload,R.string.hifini_open_login,R.string.hifini_login_done})
                assertNull(text(a.getWindow().getDecorView(),a.getString(label)));
            assertNull(shadowOf(web).getJavascriptInterface("Android"));
            assertFalse(a.getPackageManager().getActivityInfo(new ComponentName(a,LoginActivity.class),0).exported);
            assertEquals(0,a.getApplicationInfo().flags&ApplicationInfo.FLAG_ALLOW_BACKUP);
            assertNotEquals(0,a.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_SECURE);
        }
    }
    @Test public void blocksOffsiteTopLevelNavigationAndInterceptsItWithoutSendingCredentials() {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            WebView web=find(controller.get().getWindow().getDecorView(),WebView.class);
            for(String address:new String[]{"https://example.invalid/login","http://www.hifini.net/","file:///data/local/file","javascript:alert(1)","https://hifini.net:444/"}) {
                assertTrue(web.getWebViewClient().shouldOverrideUrlLoading(web,request(address,true)));
                assertNotNull(web.getWebViewClient().shouldInterceptRequest(web,request(address,true)));
            }
            assertFalse(web.getWebViewClient().shouldOverrideUrlLoading(web,request(HifiniSession.LOGIN,true)));
            assertNull(shadowOf(web).getLastEvaluatedJavascript());
        }
    }
    @Test public void nativeAccountFieldsDoNotEnterSavedStateOrPlatformAutofill() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();
            for(String name:new String[]{"username","password"}) {
                java.lang.reflect.Field f=LoginActivity.class.getDeclaredField(name);f.setAccessible(true);EditText input=(EditText)f.get(a);
                assertFalse(input.isSaveEnabled());assertEquals(View.IMPORTANT_FOR_AUTOFILL_NO,input.getImportantForAutofill());
                if(name.equals("password"))assertTrue(input.getTransformationMethod() instanceof android.text.method.PasswordTransformationMethod);
            }
            java.lang.reflect.Field f=LoginActivity.class.getDeclaredField("accountStatus");f.setAccessible(true);TextView feedback=(TextView)f.get(a);
            assertEquals(a.getString(R.string.hifini_account_privacy),feedback.getText().toString());
        }
    }
    @Test public void registrationQrPrecedesAccountFieldsAndPrimaryLoginFitsTheTvViewport() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup().visible()) {
            LoginActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root);
            ImageView qr=field(a,"registrationCode");EditText username=field(a,"username"),password=field(a,"password");
            TextView login=text(root,a.getString(R.string.hifini_remember));assertNotNull(login);
            assertEquals(0,find(root,ScrollView.class).getScrollY());
            int[] qrPosition=new int[2],userPosition=new int[2],passwordPosition=new int[2],loginPosition=new int[2];
            qr.getLocationOnScreen(qrPosition);username.getLocationOnScreen(userPosition);password.getLocationOnScreen(passwordPosition);login.getLocationOnScreen(loginPosition);
            assertTrue(qrPosition[1]+qr.getHeight()<=userPosition[1]);assertTrue(userPosition[1]+username.getHeight()<=passwordPosition[1]);
            assertTrue(passwordPosition[1]+password.getHeight()<=loginPosition[1]);assertTrue(loginPosition[1]+login.getHeight()<=1080);
            android.graphics.Rect visible=new android.graphics.Rect();assertTrue(qr.getGlobalVisibleRect(visible));assertEquals(qr.getHeight(),visible.height());
            assertNotNull(text(root,HifiniSession.REGISTER));
            android.graphics.Bitmap bitmap=((android.graphics.drawable.BitmapDrawable)qr.getDrawable()).getBitmap();int width=bitmap.getWidth(),height=bitmap.getHeight();int[] pixels=new int[width*height];bitmap.getPixels(pixels,0,width,0,0,width,height);
            String decoded=new com.google.zxing.qrcode.QRCodeReader().decode(new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(new com.google.zxing.RGBLuminanceSource(width,height,pixels)))).getText();
            assertEquals("https://www.hifini.net/user-create.htm",decoded);
            String capture=System.getenv("HIFINI_UI_CAPTURE_DIR");
            if(capture!=null){java.io.File directory=new java.io.File(capture);directory.mkdirs();android.graphics.Bitmap preview=android.graphics.Bitmap.createBitmap(1920,1080,android.graphics.Bitmap.Config.ARGB_8888);root.draw(new android.graphics.Canvas(preview));try(java.io.FileOutputStream output=new java.io.FileOutputStream(new java.io.File(directory,"hifini-login-native-en.png"))){preview.compress(android.graphics.Bitmap.CompressFormat.PNG,100,output);}preview.recycle();}
        }
    }
    @Test public void explicitLoginWaitsForTheFormSubmitsOnceAndShowsSuccessFor1500ms() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=startAttempt(a);assertNull(shadowOf(browser).getLastEvaluatedJavascript());
            pageReady(browser);assertEquals(LoginAutofill.stateScript(),shadowOf(browser).getLastEvaluatedJavascript());reply(browser,"ready");
            assertTrue(shadowOf(browser).getLastEvaluatedJavascript().endsWith("})(true)"));reply(browser,"submitted");
            assertFalse((Boolean)field(a,"pendingLogin"));assertFalse(a.isFinishing());
            advance(500);assertEquals(LoginAutofill.stateScript(),shadowOf(browser).getLastEvaluatedJavascript());reply(browser,"ready");
            assertEquals(LoginAutofill.stateScript(),shadowOf(browser).getLastEvaluatedJavascript());
            advance(500);reply(browser,"authenticated");
            TextView status=field(a,"status");assertEquals(a.getString(R.string.hifini_login_success),status.getText().toString());
            assertFalse(a.isFinishing());advance(1499);assertFalse(a.isFinishing());advance(1);assertTrue(a.isFinishing());
        }
    }
    @Test public void anExistingSessionKeepsAccountControlsOpenWithoutANewNativeLoginAttempt() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=field(a,"browser");
            HifiniSession.acceptCookies(HifiniSession.HOME,java.util.List.of("fixture=present; Path=/"));assertFalse(a.isFinishing());
            pageReady(browser);reply(browser,"ready");assertFalse(a.isFinishing());
            pageReady(browser);reply(browser,"authenticated");assertFalse(a.isFinishing());advance(1500);assertFalse(a.isFinishing());
            TextView feedback=field(a,"status");assertEquals(a.getString(R.string.hifini_signed_in),feedback.getText().toString());
            assertNotNull(text(a.getWindow().getDecorView(),a.getString(R.string.hifini_sign_out)));
            assertNotNull(text(a.getWindow().getDecorView(),a.getString(R.string.hifini_forget)));
        }
    }
    @Test public void explicitLoginCanReuseAConfirmedSessionWithoutSubmittingCredentials() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=startAttempt(a);pageReady(browser);reply(browser,"authenticated");
            assertEquals(LoginAutofill.stateScript(),shadowOf(browser).getLastEvaluatedJavascript());assertFalse(a.isFinishing());
            advance(1500);assertTrue(a.isFinishing());
        }
    }
    @Test public void rejectedAndVerificationResponsesRestoreTheButtonAndNeverExit() throws Exception {
        for(String state:new String[]{"rejected","verification"})try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=startAttempt(a);pageReady(browser);reply(browser,"ready");reply(browser,"submitted");advance(500);
            android.webkit.ValueCallback<String> late=shadowOf(browser).getLastEvaluatedJavascriptCallback();reply(browser,state);
            TextView feedback=field(a,"status");assertEquals(a.getString(state.equals("verification")?R.string.hifini_login_verification:R.string.hifini_login_rejected),feedback.getText().toString());
            assertTrue(text(a.getWindow().getDecorView(),a.getString(R.string.hifini_remember)).isEnabled());
            late.onReceiveValue("\"authenticated\"");advance(30000);assertFalse(a.isFinishing());
        }
    }
    @Test public void unsupportedSubmissionAndAStalledPageReturnUsableNativeErrors() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=startAttempt(a);pageReady(browser);reply(browser,"ready");reply(browser,"filled");
            TextView feedback=field(a,"status");assertEquals(a.getString(R.string.hifini_login_unsupported),feedback.getText().toString());assertFalse(a.isFinishing());
            startAttempt(a);advance(29999);assertFalse(text(a.getWindow().getDecorView(),a.getString(R.string.hifini_remember)).isEnabled());
            advance(1);assertTrue(text(a.getWindow().getDecorView(),a.getString(R.string.hifini_remember)).isEnabled());
            assertEquals(a.getString(R.string.hifini_login_timeout),feedback.getText().toString());assertFalse(a.isFinishing());
        }
    }
    @Test public void leavingTheScreenCancelsSuccessDelayAndStaleJavascriptCallbacks() throws Exception {
        try(ActivityController<LoginActivity> controller=Robolectric.buildActivity(LoginActivity.class).setup()) {
            LoginActivity a=controller.get();WebView browser=startAttempt(a);pageReady(browser);
            android.webkit.ValueCallback<String> stale=shadowOf(browser).getLastEvaluatedJavascriptCallback();controller.pause();stale.onReceiveValue("\"authenticated\"");advance(1500);assertFalse(a.isFinishing());
            controller.resume();browser=startAttempt(a);pageReady(browser);reply(browser,"authenticated");advance(1000);controller.pause();advance(1000);assertFalse(a.isFinishing());
            controller.resume();advance(2000);assertFalse(a.isFinishing());
        }
    }
    @Test public void siteAlertsNeverTreatSuccessOrUnknownTextAsLoginFailureOrAuthentication() {
        assertEquals(0,LoginActivity.alertFailure("登录成功"));assertEquals(0,LoginActivity.alertFailure("Welcome back"));
        assertEquals(R.string.hifini_login_rejected,LoginActivity.alertFailure("账号或密码错误"));
        assertEquals(R.string.hifini_login_verification,LoginActivity.alertFailure("请先完成验证码"));
    }
}
