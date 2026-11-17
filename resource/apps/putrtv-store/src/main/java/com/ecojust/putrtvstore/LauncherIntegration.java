package com.ecojust.putrtvstore;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import java.util.List;

/** A narrow, foreground request. Only the current home can change its own layout. */
public final class LauncherIntegration {
    public static final String ACTION = "com.ecojust.puretv.action.ADD_TO_HOME";
    public static final int REQUEST_ADD = 4822;
    public enum Availability { SUPPORTED, NEEDS_LAUNCHER_UPDATE, OTHER_HOME, NO_DEFAULT_HOME }
    public static final class Target {
        public final Availability availability;
        public final ComponentName component;
        Target(Availability availability, ComponentName component) { this.availability = availability; this.component = component; }
    }
    private final Context context;
    public LauncherIntegration(Context context) { this.context = context; }
    public Target target() {
        PackageManager pm = context.getPackageManager();
        ResolveInfo home = pm.resolveActivity(new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_HOME), PackageManager.MATCH_DEFAULT_ONLY);
        if (home == null || home.activityInfo == null || "android".equals(home.activityInfo.packageName)) return new Target(Availability.NO_DEFAULT_HOME, null);
        String packageName = home.activityInfo.packageName;
        Intent request = new Intent(ACTION).setPackage(packageName);
        List<ResolveInfo> handlers = pm.queryIntentActivities(request, PackageManager.MATCH_DEFAULT_ONLY);
        for (ResolveInfo handler : handlers) {
            if (handler.activityInfo != null && handler.activityInfo.enabled && handler.activityInfo.exported
                    && packageName.equals(handler.activityInfo.packageName)
                    && (handler.activityInfo.permission == null || pm.checkPermission(handler.activityInfo.permission, context.getPackageName()) == PackageManager.PERMISSION_GRANTED)) {
                return new Target(Availability.SUPPORTED, new ComponentName(packageName, handler.activityInfo.name));
            }
        }
        String known = "|com.ecojust.puretv|com.ecojust.novatv|com.ecojust.formatv|com.ecojust.mosstv|com.ecojust.astertv|com.ecojust.soltv|com.ecojust.monotv|com.ecojust.pixeltv|com.ecojust.circuittv|com.ecojust.drifttv|";
        return new Target(known.contains("|" + packageName + "|") ? Availability.NEEDS_LAUNCHER_UPDATE : Availability.OTHER_HOME, null);
    }
    public boolean request(Activity activity, StoreEntry entry) {
        Target target = target();
        if (target.component == null) return false;
        Intent request = new Intent(ACTION).setComponent(target.component).putExtra("packageName", entry.packageName);
        if (entry.logoSvg != null && entry.logoSvg.getBytes(java.nio.charset.StandardCharsets.UTF_8).length <= 8192) request.putExtra("logoSvg", entry.logoSvg);
        activity.startActivityForResult(request, REQUEST_ADD);
        return true;
    }
}
