package com.ecojust.putrtvstore;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Future;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Fixture catalog and package states rendered by actual Android Views. No real TV is implied. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "zh-rCN-w960dp-h540dp-land-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class StoreUiTest {
    private static boolean stale, fail, installedNow, permissionAllowed, settingsOpened;
    private static CountDownLatch downloadEntered, downloadCancelled;
    static List<StoreEntry> entries() {
        List<StoreEntry> entries = new ArrayList<>();
        String[] zh = {"pureTV", "Nova", "Sol", "Forma", "Moss", "Aster", "Mono", "Pixel", "Circuit", "Drift", "BiliTV", "电视音乐", "四则二十四", "putrtv商城"};
        String[] en = {"pureTV", "Nova", "Sol", "Forma", "Moss", "Aster", "Mono", "Pixel", "Circuit", "Drift", "BiliTV", "TV Music", "Twenty Four", "putrtv Store"};
        for (int i = 0; i < zh.length; i++) entries.add(new StoreEntry("fixture" + i, zh[i], en[i], "为电视遥控器设计，轻松发现大屏应用。", "Designed for your remote. Discover more on your TV.", i < 10 ? "launcher" : i < 12 ? "media" : i == 12 ? "game" : "tools", "com.example.app" + i, "0.5.1", "resource/apps/fixture/fixture.apk", "", "", repeat('a', 64), repeat('b', 64), repeat('c', 40), 3, 820000 + i * 31000, 19));
        return entries;
    }
    static String repeat(char c, int n) { StringBuilder s = new StringBuilder(); while (n-- > 0) s.append(c); return s.toString(); }
    public static class TestActivity extends MainActivity {
        @Override protected ApkInstaller createInstaller() { return new ApkInstaller(this) {
            @Override public boolean canInstall() { return permissionAllowed; }
            @Override public void openPermissionSettings() { settingsOpened = true; }
        }; }
        @Override protected StoreDownloader createDownloader() { return new StoreDownloader(this) {
            @Override public File download(StoreCatalog catalog, StoreEntry entry, Cancellation cancellation, Progress progress) throws IOException {
                downloadEntered.countDown();
                try { while (!cancellation.isCancelled()) { try { Thread.sleep(10); } catch (InterruptedException ignored) { } } cancellation.check(); throw new AssertionError("Cancelled download returned"); }
                finally { downloadCancelled.countDown(); }
            }
        }; }
        @Override protected boolean enableNetworkArtwork() { return false; }
        @Override protected CatalogRepository createRepository() { return new CatalogRepository(this) {
            @Override public StoreCatalog load(boolean force, Cancellation cancellation) throws IOException { if (fail) throw new IOException("fixture offline"); return new StoreCatalog(repeat('d', 40), stale ? "bundled" : "network", "", 1794013200000L, stale, entries()); }
        }; }
        @Override protected InstalledApps createInstalledApps() { return new InstalledApps(this) {
            @Override public Status inspect(StoreEntry entry) {
                if (entry.id.equals("fixture0")) return new Status(installedNow ? State.CURRENT : State.UPDATE_AVAILABLE, installedNow ? 3 : 2, installedNow ? "0.5.1" : "0.5.0", true);
                if (entry.id.equals("fixture1")) return new Status(State.CURRENT, 3, "0.5.1", true);
                return new Status(State.NOT_INSTALLED, 0, "", false);
            }
            @Override public Intent launchIntent(StoreEntry entry) { return entry.id.equals("fixture0") ? new Intent("fixture.OPEN").setPackage(entry.packageName) : null; }
        }; }
    }
    @Before public void before() { stale = fail = installedNow = permissionAllowed = settingsOpened = false; downloadEntered = new CountDownLatch(1); downloadCancelled = new CountDownLatch(1); new android.app.Instrumentation().setInTouchMode(false); }
    static Object field(MainActivity a, String name) throws Exception { Field f = MainActivity.class.getDeclaredField(name); f.setAccessible(true); return f.get(a); }
    static View root(MainActivity a) { return a.getWindow().getDecorView(); }
    static View tag(MainActivity a, String name) { View v = root(a).findViewWithTag(name); assertNotNull(name, v); return v; }
    static String text(View v) { StringBuilder out = new StringBuilder(); if (v instanceof TextView) out.append(((TextView) v).getText()).append('\n'); if (v instanceof ViewGroup) for (int i = 0; i < ((ViewGroup) v).getChildCount(); i++) out.append(text(((ViewGroup) v).getChildAt(i))); return out.toString(); }
    static void flush(MainActivity a) throws Exception { for (int i = 0; i < 6; i++) { shadowOf(Looper.getMainLooper()).idle(); Future<?> future = (Future<?>) field(a, "pending"); if (future != null && !future.isCancelled()) future.get(4, TimeUnit.SECONDS); shadowOf(Looper.getMainLooper()).idle(); if (field(a, "pending") == null) return; } throw new AssertionError("UI work did not settle"); }
    static void layout(View v, int w, int h) { v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY)); v.layout(0, 0, w, h); }
    static Dialog modal(MainActivity a) throws Exception { return (Dialog) field(a, "modal"); }
    @Test public void remoteSearchUpdatesAndInstallStateRefresh() throws Exception {
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible().windowFocusChanged(true)) {
            TestActivity a = c.get(); flush(a); layout(root(a), 960, 540);
            assertTrue(text(tag(a, "tab-launcher")).contains("10")); assertTrue(text(tag(a, "tab-updates")).contains("1"));
            tag(a, "tab-updates").performClick(); layout(root(a), 960, 540);
            View card = tag(a, "card-0"); assertTrue(card.requestFocus()); assertSame(card, root(a).findFocus());
            a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_CENTER)); a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DPAD_CENTER));
            Dialog detail = modal(a); assertNotNull(detail); assertTrue(text(detail.getWindow().getDecorView()).contains("下载更新"));
            detail.getWindow().getDecorView().findViewWithTag("open-app").performClick(); assertEquals("com.example.app0", shadowOf(a).getNextStartedActivity().getPackage());
            a.onBackPressed(); assertNull(modal(a)); installedNow = true; c.pause().stop().start().resume(); assertTrue(text(root(a)).contains("未发现可用更新"));
            ((EditText) tag(a, "search-input")).setText("bili"); tag(a, "search-submit").performClick(); assertTrue(text(tag(a, "card-0")).contains("BiliTV"));
            ((EditText) tag(a, "search-input")).setText("missing app"); tag(a, "search-submit").performClick(); assertTrue(text(root(a)).contains("没有找到应用"));
        }
    }
    @Test public void pagingKeepsEveryAppReachableWithoutLoadingEntireCatalog() throws Exception {
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible().windowFocusChanged(true)) {
            TestActivity a = c.get(); flush(a); layout(root(a), 960, 540); assertNull(root(a).findViewWithTag("card-9"));
            tag(a, "next-page").performClick(); assertTrue(text(tag(a, "card-0")).contains("Drift")); assertTrue(tag(a, "card-0").hasFocus());
            tag(a, "previous-page").performClick(); assertTrue(text(tag(a, "card-0")).contains("pureTV"));
        }
    }
    @Test public void offlineCatalogNeverClaimsApplicationsAreCurrentAndCanRecover() throws Exception {
        stale = true;
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity a = c.get(); flush(a); assertTrue(text(tag(a, "sync-status")).contains("离线目录")); installedNow = true; tag(a, "refresh").performClick(); flush(a); tag(a, "tab-updates").performClick(); assertTrue(text(root(a)).contains("缓存中没有可用更新"));
            stale = false; tag(a, "refresh").performClick(); flush(a); assertTrue(text(tag(a, "sync-status")).contains("检查时间"));
        }
    }
    @Test public void unavailableCatalogOffersRefreshWithoutFalseSuccess() throws Exception {
        fail = true;
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity a = c.get(); flush(a); assertTrue(text(root(a)).contains("暂时无法读取目录")); assertTrue(tag(a, "refresh").isEnabled()); fail = false; tag(a, "refresh").performClick(); flush(a); assertNotNull(tag(a, "card-0"));
        }
    }
    @Test public void sourcePermissionRequiresExplicitSettingsAndNeverStartsDownload() throws Exception {
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity a = c.get(); flush(a); tag(a, "card-0").performClick(); modal(a).getWindow().getDecorView().findViewWithTag("install").performClick();
            assertTrue(text(modal(a).getWindow().getDecorView()).contains("允许商城安装应用")); assertFalse(settingsOpened); assertEquals(1, downloadEntered.getCount());
            modal(a).getWindow().getDecorView().findViewWithTag("install-permission").performClick(); assertTrue(settingsOpened); assertEquals(1, downloadEntered.getCount());
        }
    }
    @Test public void leavingDuringDownloadCancelsItAndReturnsToActionableDetails() throws Exception {
        permissionAllowed = true;
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity a = c.get(); flush(a); tag(a, "card-0").performClick(); modal(a).getWindow().getDecorView().findViewWithTag("install").performClick(); assertTrue(downloadEntered.await(2, TimeUnit.SECONDS));
            c.pause().stop(); assertTrue(downloadCancelled.await(2, TimeUnit.SECONDS)); c.start().resume(); shadowOf(Looper.getMainLooper()).idle();
            assertNotNull(modal(a)); assertNotNull(modal(a).getWindow().getDecorView().findViewWithTag("install")); assertNull(shadowOf(a).getNextStartedActivity());
        }
    }
    @Test public void chinesePreviewsAndRemoteFocus() throws Exception { capture(960, 540, ""); }
    @Test @Config(qualifiers = "en-rUS-w960dp-h540dp-land-mdpi") public void englishPreviewsAndRemoteFocus() throws Exception { capture(960, 540, ".en"); }
    @Test @Config(qualifiers = "zh-rCN-w1280dp-h720dp-land-mdpi") public void largePreviewsAndRemoteFocus() throws Exception { capture(1280, 720, "-1280"); }
    @Test @Config(sdk = 19) @GraphicsMode(GraphicsMode.Mode.LEGACY) public void android44CanBrowseAndOpenDetails() throws Exception {
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible().windowFocusChanged(true)) {
            TestActivity a = c.get(); flush(a); layout(root(a), 960, 540); tag(a, "card-0").performClick(); assertNotNull(modal(a)); assertTrue(text(modal(a).getWindow().getDecorView()).contains("下载更新"));
        }
    }
    private void capture(int w, int h, String suffix) throws Exception {
        try (ActivityController<TestActivity> c = Robolectric.buildActivity(TestActivity.class).setup().visible().windowFocusChanged(true)) {
            TestActivity a = c.get(); flush(a); layout(root(a), w, h); tag(a, "tab-launcher").requestFocus();
            bounds(tag(a, "search-input"), w, h); bounds(tag(a, "refresh"), w, h); bounds(tag(a, "card-0"), w, h); bounds(tag(a, "tab-updates"), w, h);
            assertNotNull(root(a).findFocus()); assertTrue(root(a).findFocus().isShown()); if (a.english()) assertFalse(text(root(a)).matches("(?s).*\\p{IsHan}.*"));
            save(root(a), w, h, "putrtv-store" + suffix + ".png");
            tag(a, "tab-updates").performClick(); layout(root(a), w, h); save(root(a), w, h, "putrtv-store-updates" + suffix + ".png");
            tag(a, "card-0").performClick(); View dialog = modal(a).getWindow().getDecorView(); int dw = Math.min(a.dp(600), w - a.dp(48)), dh = Math.min(a.dp(470), h - a.dp(42)); save(dialog, dw, dh, "putrtv-store-detail" + suffix + ".png");
        }
    }
    static void bounds(View v, int w, int h) { int[] position = new int[2]; v.getLocationOnScreen(position); assertTrue(v.getTag() + " left", position[0] >= 0); assertTrue(v.getTag() + " top", position[1] >= 0); assertTrue(v.getTag() + " right", position[0] + v.getWidth() <= w); assertTrue(v.getTag() + " bottom", position[1] + v.getHeight() <= h); }
    static void save(View v, int w, int h, String name) throws Exception { layout(v, w, h); String folder = System.getenv("PUTRTV_STORE_UI_CAPTURE_DIR"); if (folder == null) return; File directory = new File(folder); directory.mkdirs(); Bitmap bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888); v.draw(new Canvas(bitmap)); try (FileOutputStream out = new FileOutputStream(new File(directory, name))) { bitmap.compress(Bitmap.CompressFormat.PNG, 100, out); } bitmap.recycle(); }
}
