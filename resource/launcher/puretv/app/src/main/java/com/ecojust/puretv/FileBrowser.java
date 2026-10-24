package com.ecojust.puretv;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.net.Uri;
import android.widget.Toast;

final class FileBrowser {
    static final int REQUEST_OPEN = 61;
    private FileBrowser() { }

    static void open(Context context) {
        if (ExternalApps.open(context, R.array.file_manager_packages, "android.intent.category.APP_FILES")) return;
        Context current = context;
        while (current instanceof ContextWrapper && !(current instanceof Activity)) {
            Context base = ((ContextWrapper) current).getBaseContext();
            if (base == current) break;
            current = base;
        }
        Intent picker = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                .addCategory(Intent.CATEGORY_OPENABLE).setType("*/*");
        if (current instanceof Activity && picker.resolveActivity(context.getPackageManager()) != null) {
            try {
                ((Activity) current).startActivityForResult(picker, REQUEST_OPEN);
                return;
            } catch (ActivityNotFoundException | SecurityException ignored) {
                // Some vendor ROMs disable their system document picker.
            }
        }
        Toast.makeText(context, R.string.file_browser_unavailable, Toast.LENGTH_LONG).show();
    }

    static void openSelected(Activity activity, Uri uri) {
        if (uri == null) return;
        try {
            String type = activity.getContentResolver().getType(uri);
            activity.startActivity(new Intent(Intent.ACTION_VIEW)
                    .setDataAndType(uri, type != null ? type : "*/*")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(activity, R.string.file_viewer_unavailable, Toast.LENGTH_LONG).show();
        }
    }
}
