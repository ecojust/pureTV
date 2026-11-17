package com.ecojust.puretv;

import android.app.Activity;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowToast;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class ExternalShortcutsTest {
    private void register(Context context, Intent query, String pkg) {
        ResolveInfo info = new ResolveInfo();
        info.activityInfo = new ActivityInfo();
        info.activityInfo.packageName = pkg;
        info.activityInfo.name = pkg + ".Launcher";
        info.activityInfo.exported = true;
        info.activityInfo.applicationInfo = new ApplicationInfo();
        info.activityInfo.applicationInfo.packageName = pkg;
        shadowOf(context.getPackageManager()).addResolveInfoForIntent(query, info);
    }

    @Test public void opensInstalledDangbeiStore() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            register(home, new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
                    .setPackage("com.dangbeimarket"), "com.dangbeimarket");
            AppStore.open(home);
            assertEquals("com.dangbeimarket", shadowOf(home).getNextStartedActivity().getComponent().getPackageName());
        }
    }

    @Test public void opensVendorStoreThroughStandardCategory() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            register(home, new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_APP_MARKET), "tv.vendor.store");
            AppStore.open(home);
            Intent opened = shadowOf(home).getNextStartedActivity();
            assertEquals(Intent.ACTION_MAIN, opened.getAction());
            assertTrue(opened.hasCategory(Intent.CATEGORY_APP_MARKET));
        }
    }

    @Test public void missingStoreAndBrowserShowsClearMessage() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            Context noHandler = new ContextWrapper(home) {
                @Override public void startActivity(Intent intent) { throw new ActivityNotFoundException(); }
            };
            AppStore.open(noHandler);
            assertEquals(home.getString(R.string.app_store_unavailable), ShadowToast.getTextOfLatestToast());
        }
    }

    @Test public void opensInstalledFileManager() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            register(home, new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER)
                    .setPackage("com.lonelycatgames.Xplore"), "com.lonelycatgames.Xplore");
            FileBrowser.open(home);
            assertEquals("com.lonelycatgames.Xplore", shadowOf(home).getNextStartedActivity().getComponent().getPackageName());
        }
    }

    @Test public void fallsBackToSystemDocumentPicker() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            register(home, new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("*/*"), "com.android.documentsui");
            FileBrowser.open(home);
            org.robolectric.shadows.ShadowActivity.IntentForResult result = shadowOf(home).getNextStartedActivityForResult();
            assertEquals(FileBrowser.REQUEST_OPEN, result.requestCode);
            assertEquals(Intent.ACTION_OPEN_DOCUMENT, result.intent.getAction());
            assertEquals("*/*", result.intent.getType());
        }
    }

    @Test public void missingFileManagerAndPickerShowsClearMessage() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            FileBrowser.open(home);
            assertEquals(home.getString(R.string.file_browser_unavailable), ShadowToast.getTextOfLatestToast());
        }
    }

    @Test public void selectedDocumentOpensWithReadPermission() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            Uri uri = Uri.parse("content://test.documents/document/example.txt");
            home.onActivityResult(FileBrowser.REQUEST_OPEN, Activity.RESULT_OK, new Intent().setData(uri));
            Intent opened = shadowOf(home).getNextStartedActivity();
            assertEquals(Intent.ACTION_VIEW, opened.getAction());
            assertEquals(uri, opened.getData());
            assertTrue((opened.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0);
        }
    }
}
