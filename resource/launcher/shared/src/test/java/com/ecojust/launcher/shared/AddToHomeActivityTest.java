package com.ecojust.launcher.shared;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.Shadows;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "zh-rCN-w960dp-h540dp-land-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class AddToHomeActivityTest {
    private static final String APP = "com.example.storevideo";
    private static final String SVG = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"#24A0CC\" d=\"M3 3h18v18H3Z\"/></svg>";
    private Context ctx;
    private File file;
    private JSONObject baseline;

    @Before public void setup() throws Exception {
        new android.app.Instrumentation().setInTouchMode(false);
        ctx = RuntimeEnvironment.getApplication(); file = new File(ctx.getFilesDir(), "layout.json");
        clear(); install(APP, false);
        try (java.io.InputStream input = ctx.getAssets().open("layout.json")) {
            baseline = new JSONObject(new String(input.readAllBytes(), StandardCharsets.UTF_8));
        }
        baseline.getJSONObject("home").put("users", new JSONArray());
        baseline.getJSONObject("apps").put("users", new JSONArray());
        write(baseline);
    }
    @After public void clear() {
        if (file != null) { file.delete(); new File(file + ".bak").delete(); }
    }
    private void install(String pkg, boolean system) {
        PackageInfo info = new PackageInfo(); info.packageName = pkg; info.applicationInfo = new ApplicationInfo();
        info.applicationInfo.packageName = pkg; info.applicationInfo.enabled = true; info.applicationInfo.nonLocalizedLabel = "极简影院";
        info.applicationInfo.flags = ApplicationInfo.FLAG_INSTALLED | (system ? ApplicationInfo.FLAG_SYSTEM : 0);
        info.applicationInfo.icon = android.R.drawable.sym_def_app_icon;
        Shadows.shadowOf(ctx.getPackageManager()).installPackage(info);
        ResolveInfo resolve = new ResolveInfo(); resolve.activityInfo = new ActivityInfo();
        resolve.activityInfo.packageName = pkg; resolve.activityInfo.name = pkg + ".MainActivity";
        resolve.activityInfo.applicationInfo = info.applicationInfo; resolve.activityInfo.enabled = true; resolve.activityInfo.exported = true;
        for (String category : new String[]{Intent.CATEGORY_LAUNCHER, Intent.CATEGORY_LEANBACK_LAUNCHER}) {
            Intent query = new Intent(Intent.ACTION_MAIN).addCategory(category);
            Shadows.shadowOf(ctx.getPackageManager()).addResolveInfoForIntent(query, resolve);
            Shadows.shadowOf(ctx.getPackageManager()).addResolveInfoForIntent(new Intent(query).setPackage(pkg), resolve);
        }
    }
    private void write(JSONObject layout) throws Exception {
        try (FileOutputStream out = new FileOutputStream(file)) { out.write(layout.toString().getBytes(StandardCharsets.UTF_8)); }
    }
    private JSONObject read() throws Exception { return new JSONObject(Files.readString(file.toPath())); }
    private String bytes() throws Exception { return Files.readString(file.toPath()); }
    private Intent request(String pkg) { return new Intent(ConfirmHomeActivity.ACTION).putExtra("packageName", pkg).putExtra("logoSvg", SVG); }
    private ActivityController<? extends ConfirmHomeActivity> start(Intent intent) throws Exception {
        Class<? extends ConfirmHomeActivity> type = Class.forName(ctx.getPackageName() + ".AddToHomeActivity").asSubclass(ConfirmHomeActivity.class);
        ActivityController<? extends ConfirmHomeActivity> controller = Robolectric.buildActivity(type, intent).setup().visible().windowFocusChanged(true);
        View root = controller.get().getWindow().getDecorView();
        root.measure(View.MeasureSpec.makeMeasureSpec(960, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(540, View.MeasureSpec.EXACTLY));
        root.layout(0, 0, 960, 540); Shadows.shadowOf(Looper.getMainLooper()).idle(); return controller;
    }
    private View tagged(Activity activity, String tag) { return activity.getWindow().getDecorView().findViewWithTag(tag); }
    private String reason(Activity activity) { return Shadows.shadowOf(activity).getResultIntent().getStringExtra("reason"); }
    private JSONObject node(String pkg, Rect frame) throws Exception {
        JSONObject clean = new JSONObject(baseline.toString());
        return HomePlacement.append(clean, pkg, "Existing", SVG, frame).getJSONObject("home").getJSONArray("users").getJSONObject(0);
    }

    @Test public void remoteFocusSelectionAndExplicitConfirmationAppendOneRealTile() throws Exception {
        String before = bytes();
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            ConfirmHomeActivity activity = controller.get(); View preview = tagged(activity, "home-preview");
            assertNotNull(preview); preview.requestFocus();
            assertSame(preview, activity.getWindow().getDecorView().findFocus());
            assertEquals(before, bytes());
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_RIGHT));
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DPAD_RIGHT));
            assertEquals(before, bytes());
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_DPAD_CENTER));
            activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_DPAD_CENTER));
            assertSame(tagged(activity, "home-confirm"), activity.getWindow().getDecorView().findFocus());
            assertEquals(before, bytes());
            capture(activity);
            tagged(activity, "home-confirm").performClick();
            assertEquals(Activity.RESULT_OK, Shadows.shadowOf(activity).getResultCode()); assertEquals("added", reason(activity));
            JSONObject saved = read(); JSONObject added = HomePlacement.find(saved, APP);
            assertNotNull(added); assertEquals("极简影院", added.getString("text")); assertEquals("#FFFFFF", added.getString("textColor"));
            assertEquals(SVG, added.getString("icon")); assertTrue(added.getBoolean("visible"));
            assertEquals(baseline.getJSONObject("apps").toString(), saved.getJSONObject("apps").toString());
            assertEquals(baseline.getJSONObject("home").getJSONArray("system").toString(), saved.getJSONObject("home").getJSONArray("system").toString());
            assertTrue(HomePlacement.free(baseline, HomePlacement.frame(added)));
        }
    }
    @Test public void cancelNeverWrites() throws Exception {
        String before = bytes(); try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            tagged(controller.get(), "home-cancel").performClick(); assertEquals("cancelled", reason(controller.get())); assertEquals(before, bytes());
        }
    }
    @Test public void missingSystemAndInvalidSvgAreRejectedBeforeAnyWrite() throws Exception {
        install("com.example.system", true); String before = bytes();
        for (Intent intent : new Intent[]{request("com.example.missing"), request("com.example.system"), request(APP).putExtra("logoSvg", "<svg><script/></svg>")}) {
            try (ActivityController<? extends ConfirmHomeActivity> controller = start(intent)) {
                assertTrue(controller.get().isFinishing()); assertEquals(Activity.RESULT_CANCELED, Shadows.shadowOf(controller.get()).getResultCode()); assertEquals(before, bytes());
            }
        }
    }
    @Test public void duplicateVisibleAndHiddenBlocksArePreservedWithDifferentReasons() throws Exception {
        Rect position = HomePlacement.candidates(baseline).get(0);
        for (boolean visible : new boolean[]{true, false}) {
            JSONObject draft = new JSONObject(baseline.toString());
            draft.getJSONObject("home").getJSONArray("users").put(node(APP, position).put("visible", visible)); write(draft);
            String before = bytes(); try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
                assertEquals(visible ? "already_present" : "already_hidden", reason(controller.get())); assertEquals(before, bytes());
            }
        }
    }
    @Test public void fullHomeOffersExplicitAppsConfirmationWithoutRearranging() throws Exception {
        install("com.example.blocker", false); JSONObject full = new JSONObject(baseline.toString());
        JSONObject blocker = node("com.example.blocker", HomePlacement.candidates(baseline).get(0));
        blocker.put("frame", new JSONObject().put("x", 0).put("y", 0).put("width", full.getJSONObject("screen").getInt("width")).put("height", full.getJSONObject("screen").getInt("height")));
        full.getJSONObject("home").getJSONArray("users").put(blocker); write(full); String before = bytes();
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            assertEquals(before, bytes()); assertNotNull(tagged(controller.get(), "home-preview"));
            tagged(controller.get(), "home-confirm").performClick(); assertEquals("added", reason(controller.get()));
            assertEquals("apps", Shadows.shadowOf(controller.get()).getResultIntent().getStringExtra("page"));
            assertEquals(full.getJSONObject("home").toString(), read().getJSONObject("home").toString());
            assertNotNull(HomePlacement.find(read(), "apps", APP));
        }
        full.getJSONObject("apps").getJSONArray("users").put(new JSONObject(blocker.toString())); write(full); before = bytes();
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) { assertEquals("no_space", reason(controller.get())); assertEquals(before, bytes()); }
    }
    @Test public void latestIndependentEditsSurviveConfirmation() throws Exception {
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            JSONObject changed = new JSONObject(baseline.toString()); changed.getJSONObject("apps").getJSONObject("background").put("color", "#112233"); write(changed);
            tagged(controller.get(), "home-confirm").performClick(); assertEquals("added", reason(controller.get()));
            assertEquals(changed.getJSONObject("apps").toString(), read().getJSONObject("apps").toString());
        }
    }
    @Test public void remoteCanChooseAppsAndHomeRemainsUnchanged() throws Exception {
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            tagged(controller.get(), "page-apps").performClick();
            assertSame(tagged(controller.get(), "home-preview"), controller.get().getWindow().getDecorView().findFocus());
            tagged(controller.get(), "home-confirm").performClick(); assertEquals("added", reason(controller.get()));
            assertEquals(baseline.getJSONObject("home").toString(), read().getJSONObject("home").toString());
            assertNotNull(HomePlacement.find(read(), "apps", APP));
        }
    }
    @Test public void realDefaultLayoutHasFreeHomeSpaceOrAlreadyListsTheInstalledApp() throws Exception {
        for (int i = 0; i < 6; i++) install("com.example.default" + i, false);
        file.delete();
        Class<?> type = Class.forName(ctx.getPackageName() + ".LauncherLayout");
        java.lang.reflect.Method defaults = type.getDeclaredMethod("defaults", Context.class); defaults.setAccessible(true);
        Object value = defaults.invoke(null, ctx); java.lang.reflect.Field field = type.getDeclaredField("json"); field.setAccessible(true);
        JSONObject actual = (JSONObject)field.get(value);
        int spaces = HomePlacement.candidates(actual).size();
        assertTrue("The installed app must be reachable without rearranging existing tiles", spaces > 0 || HomePlacement.find(actual, "apps", APP) != null);
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            if (spaces == 0) assertEquals("already_in_apps", reason(controller.get()));
            else assertNotNull(tagged(controller.get(), "home-preview"));
            assertFalse("Opening the request must not persist a default layout", file.exists());
        }
    }
    @Test public void occupiedSelectionRequiresAnotherExplicitConfirmation() throws Exception {
        install("com.example.blocker", false);
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            JSONObject changed = HomePlacement.append(baseline, "com.example.blocker", "Existing", SVG, HomePlacement.candidates(baseline).get(0)); write(changed);
            tagged(controller.get(), "home-confirm").performClick();
            assertFalse(controller.get().isFinishing()); assertNull(HomePlacement.find(read(), APP));
            assertSame(tagged(controller.get(), "home-preview"), controller.get().getWindow().getDecorView().findFocus());
            tagged(controller.get(), "home-confirm").performClick(); assertEquals("added", reason(controller.get()));
            assertEquals(HomePlacement.find(changed, "com.example.blocker").toString(), HomePlacement.find(read(), "com.example.blocker").toString());
        }
    }
    @Test public void staleUninstalledBlockIsNeverDeletedOrReportedAsSuccess() throws Exception {
        JSONObject stale = HomePlacement.append(baseline, "com.example.removed", "Keep my tile", SVG, HomePlacement.candidates(baseline).get(0)); write(stale); String before = bytes();
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            tagged(controller.get(), "home-confirm").performClick(); assertEquals("invalid_existing_layout", reason(controller.get()));
            assertEquals(Activity.RESULT_CANCELED, Shadows.shadowOf(controller.get()).getResultCode()); assertEquals(before, bytes());
        }
    }
    @Test public void malformedSavedLayoutIsNotReplacedWithDefaults() throws Exception {
        try (FileOutputStream output = new FileOutputStream(file)) { output.write("{broken user layout".getBytes(StandardCharsets.UTF_8)); }
        String before = bytes();
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            assertEquals("invalid_layout", reason(controller.get())); assertEquals(before, bytes());
        }
    }
    @Test public void staleSnapshotCannotOverwriteAConcurrentManagerWrite() throws Exception {
        try (ActivityController<? extends ConfirmHomeActivity> controller = start(request(APP))) {
            JSONObject changed = new JSONObject(baseline.toString()); changed.getJSONObject("apps").getJSONObject("background").put("color", "#112233"); write(changed);
            JSONObject proposed = HomePlacement.append(baseline, APP, "New", SVG, HomePlacement.candidates(baseline).get(0));
            java.lang.reflect.Method save = controller.get().getClass().getDeclaredMethod("writeLayout", JSONObject.class, JSONObject.class); save.setAccessible(true);
            try { save.invoke(controller.get(), baseline, proposed); fail("Stale snapshot must be rejected"); }
            catch (java.lang.reflect.InvocationTargetException expected) { assertTrue(expected.getCause() instanceof ConfirmHomeActivity.LayoutChangedException); }
            assertEquals(changed.toString(), read().toString());
        }
    }
    @Test public void protocolIsExportedButFullLayoutProviderRemainsShellProtected() throws Exception {
        Intent intent = new Intent(ConfirmHomeActivity.ACTION).setPackage(ctx.getPackageName()).addCategory(Intent.CATEGORY_DEFAULT);
        ResolveInfo resolve = ctx.getPackageManager().resolveActivity(intent, 0); assertNotNull(resolve); assertTrue(resolve.activityInfo.exported);
        android.content.pm.ProviderInfo provider = ctx.getPackageManager().resolveContentProvider(ctx.getPackageName() + ".layout", 0);
        assertEquals("android.permission.DUMP", provider.readPermission); assertEquals("android.permission.DUMP", provider.writePermission);
    }
    private void capture(Activity activity) throws Exception {
        String dir = System.getenv("ADD_TO_HOME_CAPTURE_DIR"); if (dir == null || dir.isEmpty()) return;
        File output = new File(dir); output.mkdirs(); View root = activity.getWindow().getDecorView();
        Bitmap bitmap = Bitmap.createBitmap(root.getWidth(), root.getHeight(), Bitmap.Config.ARGB_8888); root.draw(new Canvas(bitmap));
        try (FileOutputStream stream = new FileOutputStream(new File(output, "add-to-home.png"))) { bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream); }
        bitmap.recycle();
    }
}
