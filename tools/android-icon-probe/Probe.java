package com.ecojust.iconprobe;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import java.io.InputStream;
import java.security.MessageDigest;
import java.util.Locale;

/** Read-only check of both Android launcher surfaces through the installed package manager. */
public final class Probe extends Instrumentation {
    private Bundle input;

    @Override public void onCreate(Bundle args) {
        super.onCreate(args);
        input = args;
        start();
    }

    private void check(Resources resources, int id, String expected, int width, int height) throws Exception {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        try (InputStream stream = resources.openRawResource(id)) {
            byte[] chunk = new byte[8192];
            int count;
            while ((count = stream.read(chunk)) != -1) sha.update(chunk, 0, count);
        }
        StringBuilder hash = new StringBuilder();
        for (byte b : sha.digest()) hash.append(String.format(Locale.ROOT, "%02x", b & 255));
        if (!expected.contentEquals(hash)) throw new AssertionError("Launcher resource hash mismatch: " + id);
        Drawable image = resources.getDrawable(id, null);
        Bitmap pixels = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        image.setBounds(0, 0, width, height);
        image.draw(new Canvas(pixels));
        int first = pixels.getPixel(0, 0);
        for (int y = 0; y < height; y += 2) {
            for (int x = 0; x < width; x += 2) {
                if (pixels.getPixel(x, y) != first) return;
            }
        }
        throw new AssertionError("Installed launcher rendered a uniform image: " + id);
    }

    @Override public void onStart() {
        Bundle result = new Bundle();
        try {
            PackageManager pm = getTargetContext().getPackageManager();
            String game = input.getString("game");
            ApplicationInfo app = pm.getApplicationInfo(game, 0);
            Resources res = pm.getResourcesForApplication(app);
            check(res, app.icon, input.getString("icon"), 192, 192);
            check(res, app.banner, input.getString("banner"), 320, 180);
            for (String category : new String[]{Intent.CATEGORY_LAUNCHER, Intent.CATEGORY_LEANBACK_LAUNCHER}) {
                Intent intent = new Intent(Intent.ACTION_MAIN).addCategory(category).setPackage(game);
                ResolveInfo resolve = pm.resolveActivity(intent, 0);
                if (resolve == null) throw new AssertionError("Missing launcher: " + category);
                check(res, resolve.activityInfo.getIconResource(), input.getString("icon"), 192, 192);
                int banner = resolve.activityInfo.banner;
                check(res, banner == 0 ? app.banner : banner, input.getString("banner"), 320, 180);
            }
            result.putString("result", "PASS");
            finish(Activity.RESULT_OK, result);
        } catch (Throwable error) {
            result.putString("error", error.toString());
            finish(Activity.RESULT_CANCELED, result);
        }
    }
}
