package com.ecojust.puretv;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

final class AppStore {
    private AppStore() { }

    static void open(Context context) {
        if (ExternalApps.open(context, R.array.app_store_packages, Intent.CATEGORY_APP_MARKET)) return;
        Intent website = new Intent(Intent.ACTION_VIEW,
                Uri.parse(context.getString(R.string.app_store_website_url)))
                .addCategory(Intent.CATEGORY_BROWSABLE).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(website);
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(context, R.string.app_store_unavailable, Toast.LENGTH_LONG).show();
        }
    }
}
