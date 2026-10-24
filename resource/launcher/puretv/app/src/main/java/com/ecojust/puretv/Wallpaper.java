package com.ecojust.puretv;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * The desktop wallpaper.
 *
 * One picture only, always at {@code wallpaper.jpg} in the app's external files directory — the same
 * file the {@link Config} overlay reads. Everything here exists to keep that invariant: a new wallpaper
 * always replaces the old one rather than piling up beside it, because a TV box has very little
 * storage and a daily wallpaper left behind every morning would fill it within a couple of weeks.
 *
 * The Picsum picture is downloaded at most once a day and only while the user has switched the feature
 * on. Nothing runs in the background: the refresh happens when the launcher starts.
 */
final class Wallpaper {

    private static final String TAG = "PureTV.Wallpaper";
    private static final String PREFS = "wallpaper";
    private static final String KEY_AUTO = "daily_wallpaper_enabled";
    private static final String KEY_LAST_DAY = "daily_wallpaper_last_day";

    private static final String FILE_NAME = "wallpaper.jpg";
    static final String DAILY_IMAGE_URL = "https://picsum.photos/1920/1080?random=1";
    private static final int TIMEOUT = 15000;
    private static final long MAX_BYTES = 4L * 1024 * 1024;

    private final Context ctx;
    private final SharedPreferences prefs;

    Wallpaper(Context ctx) {
        this.ctx = ctx.getApplicationContext();
        this.prefs = this.ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    boolean autoDaily() {
        return prefs.getBoolean(KEY_AUTO, false);
    }

    /** Stop automatic changes without removing the current picture. */
    void setAutoDaily(boolean on) {
        prefs.edit().putBoolean(KEY_AUTO, on).apply();
    }

    /** True when a picture is already applied. */
    boolean hasWallpaper() {
        File f = file();
        return f != null && f.isFile() && f.length() > 0;
    }

    File file() {
        File dir = ctx.getExternalFilesDir(null);
        return dir == null ? null : new File(dir, FILE_NAME);
    }

    /** Delete the current wallpaper; the desktop falls back to its plain background. */
    boolean clear() {
        File f = file();
        return f != null && (!f.exists() || f.delete());
    }

    /**
     * Fetch a daily random picture, unless it was already downloaded today or today is not available.
     * Blocking — call it off the main thread. Returns true when today's wallpaper is available.
     */
    synchronized boolean refreshDailyIfDue() {
        if (!autoDaily()) return false;
        String today = today();
        if (today.equals(prefs.getString(KEY_LAST_DAY, "")) && hasWallpaper()) return true;

        byte[] bytes = download(DAILY_IMAGE_URL);
        if (bytes == null) return false;
        // Only remember the day once the picture is on disk, or a failed download would block
        // today's retry until tomorrow.
        if (!autoDaily() || !write(bytes)) return false;
        prefs.edit().putString(KEY_LAST_DAY, today).apply();
        return true;
    }

    private byte[] download(String url) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(TIMEOUT);
            c.setReadTimeout(TIMEOUT);
            c.setInstanceFollowRedirects(true);
            if (c.getResponseCode() / 100 != 2) return null;
            long len = c.getContentLengthLong();
            if (len > MAX_BYTES) return null;              // a multi-megabyte JPEG is not a wallpaper
            try (InputStream in = c.getInputStream()) {
                return readBytes(in);
            }
        } catch (Exception e) {
            Log.w(TAG, "download failed: " + e.getMessage());
            return null;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    /**
     * Write the picture as the one and only wallpaper. The file is replaced in place, so the picture
     * from yesterday is gone the moment the new one lands — no accumulation, no extra cleanup.
     */
    boolean write(byte[] bytes) {
        File f = file();
        if (f == null) return false;
        File tmp = new File(f.getParentFile(), FILE_NAME + ".part");
        try (FileOutputStream out = new FileOutputStream(tmp)) {
            out.write(bytes);
            out.flush();
        } catch (Exception e) {
            Log.w(TAG, "could not write the wallpaper: " + e.getMessage());
            tmp.delete();
            return false;
        }
        // BitmapFactory is the real test: a truncated or non-image file must not become the wallpaper.
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(tmp.getPath(), o);
        if (!WallpaperSize.accepted(o.outWidth, o.outHeight)) {
            tmp.delete();
            return false;
        }
        return replace(tmp, f);
    }

    /**
     * Copy a picture the user picked themselves. Anything already in place is replaced, so picking
     * a new picture does not leave the previous one on disk.
     */
    boolean importFrom(Uri uri) {
        File f = file();
        if (f == null) return false;
        File tmp = new File(f.getParentFile(), FILE_NAME + ".part");
        try (InputStream in = ctx.getContentResolver().openInputStream(uri)) {
            if (in == null) return false;
            try (FileOutputStream out = new FileOutputStream(tmp)) {
                byte[] buf = new byte[16384];
                int n, total = 0;
                while ((n = in.read(buf)) > 0) {
                    total += n;
                    if (total > MAX_BYTES) {
                        tmp.delete();
                        return false;
                    }
                    out.write(buf, 0, n);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "import failed: " + e.getMessage());
            tmp.delete();
            return false;
        }
        BitmapFactory.Options o = new BitmapFactory.Options();
        o.inJustDecodeBounds = true;
        BitmapFactory.decodeFile(tmp.getPath(), o);
        if (!WallpaperSize.accepted(o.outWidth, o.outHeight)) {
            tmp.delete();
            return false;
        }
        return replace(tmp, f);
    }

    /** Rename on the same filesystem, keeping the previous picture if replacement fails. */
    private boolean replace(File tmp, File target) {
        try {
            android.system.Os.rename(tmp.getPath(), target.getPath());
            return true;
        } catch (android.system.ErrnoException e) {
            Log.w(TAG, "could not replace wallpaper", e);
            tmp.delete();
            return false;
        }
    }

    /** Wallpaper file size in bytes, for the panel;0 when there is none. */
    long sizeBytes() {
        File f = file();
        return f != null && f.isFile() ? f.length() : 0;
    }

    private static String today() {
        java.util.Calendar c = java.util.Calendar.getInstance();
        return c.get(java.util.Calendar.YEAR) + "-" + (c.get(java.util.Calendar.MONTH) + 1)
                + "-" + c.get(java.util.Calendar.DAY_OF_MONTH);
    }

    static byte[] readBytes(InputStream in) {
        try {
            java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) != -1) {
                if (bos.size() + (long) n > MAX_BYTES) return null;
                bos.write(buf, 0, n);
            }
            return bos.toByteArray();
        } catch (java.io.IOException e) {
            return null;
        }
    }
}