package com.ecojust.puretv;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;

/** Open an installed TV/mobile launcher, then try the standard Android app category. */
final class ExternalApps {
    private ExternalApps() { }

    static boolean open(Context context, int packagesResource, String category) {
        for (String pkg : context.getResources().getStringArray(packagesResource)) {
            try {
                Intent launch = context.getPackageManager().getLeanbackLaunchIntentForPackage(pkg);
                if (launch == null) launch = context.getPackageManager().getLaunchIntentForPackage(pkg);
                if (launch != null && start(context, launch)) return true;
            } catch (SecurityException ignored) {
                // Continue to the next installed application.
            }
        }
        Intent generic = new Intent(Intent.ACTION_MAIN).addCategory(category);
        return generic.resolveActivity(context.getPackageManager()) != null && start(context, generic);
    }

    private static boolean start(Context context, Intent intent) {
        try {
            context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (ActivityNotFoundException | SecurityException ignored) {
            return false;
        }
    }
}
