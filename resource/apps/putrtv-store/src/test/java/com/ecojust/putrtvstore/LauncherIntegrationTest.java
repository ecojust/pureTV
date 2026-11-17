package com.ecojust.putrtvstore;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class LauncherIntegrationTest {
    static ResolveInfo handler(String pkg, String cls) { ResolveInfo result = new ResolveInfo(); result.activityInfo = new ActivityInfo(); result.activityInfo.packageName = pkg; result.activityInfo.name = cls; result.activityInfo.applicationInfo = new ApplicationInfo(); result.activityInfo.applicationInfo.packageName = pkg; result.activityInfo.applicationInfo.enabled = true; result.activityInfo.applicationInfo.flags = ApplicationInfo.FLAG_INSTALLED; result.activityInfo.exported = true; result.activityInfo.enabled = true; return result; }
    static void home(Activity activity, String pkg) { shadowOf(activity.getPackageManager()).addResolveInfoForIntent(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), handler(pkg, pkg + ".MainActivity")); }
    @Test public void currentHomeIsExplicitAndCannotBeHijackedByAnotherHandler() {
        try (ActivityController<Activity> c = Robolectric.buildActivity(Activity.class).setup()) {
            Activity a = c.get(); home(a, "com.ecojust.puretv");
            Intent action = new Intent(LauncherIntegration.ACTION).setPackage("com.ecojust.puretv"); shadowOf(a.getPackageManager()).addResolveInfoForIntent(action, handler("com.example.other", "com.example.other.Handler"));
            // Supply a complete identity: Robolectric fills missing ApplicationInfo from
            // Intent.setPackage(), then copies that package onto ActivityInfo. That would
            // turn this intentionally foreign handler into the current-home fixture.
            assertEquals("com.example.other", a.getPackageManager().queryIntentActivities(action, PackageManager.MATCH_DEFAULT_ONLY).get(0).activityInfo.packageName);
            assertEquals(LauncherIntegration.Availability.NEEDS_LAUNCHER_UPDATE, new LauncherIntegration(a).target().availability);
        }
    }
    @Test public void supportedHomeReceivesOnlyNarrowPackageAndSvgRequest() {
        try (ActivityController<Activity> c = Robolectric.buildActivity(Activity.class).setup()) {
            Activity a = c.get(); home(a, "com.ecojust.puretv");
            Intent action = new Intent(LauncherIntegration.ACTION).setPackage("com.ecojust.puretv"); shadowOf(a.getPackageManager()).addResolveInfoForIntent(action, handler("com.ecojust.puretv", "com.ecojust.puretv.AddToHomeActivity"));
            LauncherIntegration integration = new LauncherIntegration(a); assertEquals(LauncherIntegration.Availability.SUPPORTED, integration.target().availability);
            assertTrue(integration.request(a, StoreUiTest.entries().get(0))); Intent request = shadowOf(a).getNextStartedActivityForResult().intent;
            assertEquals("com.ecojust.puretv", request.getComponent().getPackageName()); assertEquals("com.example.app0", request.getStringExtra("packageName")); assertFalse(request.hasExtra("layout"));
        }
    }
    @Test public void vendorHomeGetsHonestUnsupportedStatus() {
        try (ActivityController<Activity> c = Robolectric.buildActivity(Activity.class).setup()) {
            Activity a = c.get(); home(a, "com.vendor.home"); assertEquals(LauncherIntegration.Availability.OTHER_HOME, new LauncherIntegration(a).target().availability);
        }
    }
}
