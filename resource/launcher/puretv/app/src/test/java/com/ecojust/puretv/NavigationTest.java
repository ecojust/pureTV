package com.ecojust.puretv;

import android.content.Intent;
import android.view.KeyEvent;
import android.view.View;
import androidx.recyclerview.widget.RecyclerView;
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
@Config(sdk = 28, qualifiers = "w960dp-h540dp-land")
public class NavigationTest {
    private void layout(android.app.Activity activity) {
        View decor = activity.getWindow().getDecorView();
        decor.measure(View.MeasureSpec.makeMeasureSpec(1920, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(1080, View.MeasureSpec.EXACTLY));
        decor.layout(0, 0, 1920, 1080);
        shadowOf(android.os.Looper.getMainLooper()).idle();
    }

    @Test public void applicationsCardOpensStoreWebsiteWhenNoStoreIsInstalled() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();LegacyTestLayout.install(home,"home");
            layout(home);
            RecyclerView grid = home.findViewById(R.id.grid);
            assertEquals(4, grid.getAdapter().getItemCount());
            RecyclerView.ViewHolder apps = LayoutScene.holder(grid,3);
            assertNotNull(apps);
            apps.itemView.findViewById(R.id.card).performClick();
            Intent intent = shadowOf(home).getNextStartedActivity();
            assertEquals(Intent.ACTION_VIEW, intent.getAction());
            assertEquals("https://www.dangbei.com/", intent.getDataString());
        }
    }

    @Test public void musicCardOpensFreeMusicWebsiteInBrowser() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();LegacyTestLayout.install(home,"home");
            layout(home);
            RecyclerView grid = home.findViewById(R.id.grid);
            LayoutScene.holder(grid,0).itemView.findViewById(R.id.card).performClick();
            Intent intent = shadowOf(home).getNextStartedActivity();
            assertEquals(Intent.ACTION_VIEW, intent.getAction());
            assertEquals("https://somafm.com/player/", intent.getDataString());
            assertTrue(intent.hasCategory(Intent.CATEGORY_BROWSABLE));
        }
    }

    @Test public void musicCardPrefersInstalledNativePlayer() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();LegacyTestLayout.install(home,"home");
            android.content.pm.ResolveInfo info = new android.content.pm.ResolveInfo();
            info.activityInfo = new android.content.pm.ActivityInfo();
            info.activityInfo.packageName = "com.ecojust.music";
            info.activityInfo.name = "com.ecojust.music.MainActivity";
            info.activityInfo.exported = true;
            info.activityInfo.applicationInfo = new android.content.pm.ApplicationInfo();
            info.activityInfo.applicationInfo.packageName = "com.ecojust.music";
            shadowOf(home.getPackageManager()).addResolveInfoForIntent(new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER).setPackage("com.ecojust.music"), info);
            layout(home);
            RecyclerView grid = home.findViewById(R.id.grid);
            LayoutScene.holder(grid,0).itemView.findViewById(R.id.card).performClick();
            assertEquals("com.ecojust.music", shadowOf(home).getNextStartedActivity().getComponent().getPackageName());
        }
    }

    @Test public void musicCardExplainsMissingBrowser() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();LegacyTestLayout.install(home,"home");
            android.content.Context noBrowser = new android.content.ContextWrapper(home) {
                @Override public void startActivity(Intent intent) {
                    throw new android.content.ActivityNotFoundException("No browser installed");
                }
            };
            RecyclerView grid = home.findViewById(R.id.grid);
            grid.setAdapter(new AppAdapter(noBrowser, home, 4, AppAdapter.homeEntries()));
            layout(home);
            LayoutScene.holder(grid,0).itemView.findViewById(R.id.card).performClick();
            assertEquals(home.getString(R.string.music_browser_unavailable), ShadowToast.getTextOfLatestToast());
            assertNull(shadowOf(home).getNextStartedActivity());
        }
    }

    @Test public void applicationPageExplainsMissingShortVideoAndBackFinishes() {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();LegacyTestLayout.install(page,"apps");
            layout(page);
            RecyclerView grid = page.findViewById(R.id.appsGrid);
            assertEquals(8, grid.getAdapter().getItemCount());
            LayoutScene.holder(grid,0).itemView.findViewById(R.id.card).performClick();
            assertEquals(page.getString(R.string.shortvideo_not_installed), ShadowToast.getTextOfLatestToast());
            assertNull(shadowOf(page).getNextStartedActivity());
            page.findViewById(R.id.backHome).performClick();
            assertTrue(page.isFinishing());
        }
    }

    @Test public void shortVideoEntryLaunchesInstalledCompanion() {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();LegacyTestLayout.install(page,"apps");
            android.content.pm.ResolveInfo info = new android.content.pm.ResolveInfo();
            info.activityInfo = new android.content.pm.ActivityInfo();
            info.activityInfo.packageName = "com.ecojust.shortvideo";
            info.activityInfo.name = "com.ecojust.shortvideo.MainActivity";
            info.activityInfo.exported = true;
            info.activityInfo.applicationInfo = new android.content.pm.ApplicationInfo();
            info.activityInfo.applicationInfo.packageName = "com.ecojust.shortvideo";
            shadowOf(page.getPackageManager()).addResolveInfoForIntent(new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER).setPackage("com.ecojust.shortvideo"), info);
            layout(page);
            RecyclerView grid = page.findViewById(R.id.appsGrid);
            assertEquals(page.getString(R.string.home_shortvideo), ((android.widget.TextView)LayoutScene.holder(grid,0).itemView.findViewById(R.id.name)).getText().toString());
            LayoutScene.holder(grid,0).itemView.findViewById(R.id.card).performClick();
            assertEquals("com.ecojust.shortvideo", shadowOf(page).getNextStartedActivity().getComponent().getPackageName());
        }
    }

    @Test public void webTvEntryExplainsMissingPackage() {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();LegacyTestLayout.install(page,"apps"); layout(page);
            RecyclerView grid = page.findViewById(R.id.appsGrid);
            LayoutScene.holder(grid,2).itemView.findViewById(R.id.card).performClick();
            assertEquals(page.getString(R.string.webtv_not_installed), ShadowToast.getTextOfLatestToast());
            assertNull(shadowOf(page).getNextStartedActivity());
        }
    }

    @Test public void webTvEntryLaunchesInstalledCompanion() {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();LegacyTestLayout.install(page,"apps");
            android.content.pm.ResolveInfo info = new android.content.pm.ResolveInfo();
            info.activityInfo = new android.content.pm.ActivityInfo();
            info.activityInfo.packageName = "com.ecojust.webtv";
            info.activityInfo.name = "com.ecojust.webtv.MainActivity";
            info.activityInfo.exported = true;
            info.activityInfo.applicationInfo = new android.content.pm.ApplicationInfo();
            info.activityInfo.applicationInfo.packageName = "com.ecojust.webtv";
            shadowOf(page.getPackageManager()).addResolveInfoForIntent(new Intent(Intent.ACTION_MAIN)
                    .addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER).setPackage("com.ecojust.webtv"), info);
            layout(page);
            RecyclerView grid = page.findViewById(R.id.appsGrid);
            LayoutScene.holder(grid,2).itemView.findViewById(R.id.card).performClick();
            assertEquals("com.ecojust.webtv", shadowOf(page).getNextStartedActivity().getComponent().getPackageName());
        }
    }

    @Test public void remoteDownOpensAppsAndUpReachesNavigation() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();LegacyTestLayout.install(home,"home");
            layout(home);
            RecyclerView grid=home.findViewById(R.id.grid);View card=LayoutScene.holder(grid,0).itemView.findViewById(R.id.card);
            assertFalse(home.onTileVerticalKey(0, KeyEvent.KEYCODE_DPAD_UP));
            View up=card.focusSearch(View.FOCUS_UP);assertNotNull(up);assertTrue(up.isShown());up.requestFocus();assertTrue(up.hasFocus());
            View down=card.focusSearch(View.FOCUS_DOWN);assertNotNull(down);assertEquals(R.id.allAppsHint,down.getId());down.performClick();
            assertEquals(AppsActivity.class.getName(), shadowOf(home).getNextStartedActivity()
                    .getComponent().getClassName());
        }
    }

    @Test public void remoteOnAppsPageCanReachBackAndLastRow() {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();LegacyTestLayout.install(page,"apps");
            layout(page);
            RecyclerView grid=page.findViewById(R.id.appsGrid);View card=LayoutScene.holder(grid,0).itemView.findViewById(R.id.card);
            assertFalse(page.onTileVerticalKey(0, KeyEvent.KEYCODE_DPAD_UP));View up=card.focusSearch(View.FOCUS_UP);assertNotNull(up);up.requestFocus();
            assertTrue(page.findViewById(R.id.backHome).hasFocus());
            assertFalse(page.onTileVerticalKey(7, KeyEvent.KEYCODE_DPAD_DOWN));
            assertFalse(page.isFinishing());
        }
    }
}
