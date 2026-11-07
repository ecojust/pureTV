package com.ecojust.putrtvstore;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/** Read-only access to a single verified APK through an explicit Android URI grant. */
public final class ApkProvider extends ContentProvider {
    static final String DIRECTORY = "install-apks";
    static final String MIME = "application/vnd.android.package-archive";

    static File directory(Context context) throws IOException {
        File base = context.getFilesDir().getCanonicalFile();
        File directory = new File(base, DIRECTORY).getCanonicalFile();
        if (!base.equals(directory.getParentFile()) || !DIRECTORY.equals(directory.getName())) {
            throw new IOException("Invalid installer directory");
        }
        return directory;
    }

    static Uri uri(Context context, String digest) {
        if (digest == null || !digest.matches("[0-9a-f]{64}")) throw new IllegalArgumentException("Invalid APK digest");
        return new Uri.Builder().scheme("content").authority(context.getPackageName() + ".apks")
                .appendPath("apk").appendPath(digest + ".apk").build();
    }

    private File resolve(Uri uri) {
        if (getContext() == null || uri == null || !"content".equals(uri.getScheme())
                || !(getContext().getPackageName() + ".apks").equals(uri.getAuthority())
                || uri.getQuery() != null || uri.getFragment() != null) {
            throw new SecurityException("Invalid APK URI");
        }
        List<String> segments = uri.getPathSegments();
        if (segments.size() != 2 || !"apk".equals(segments.get(0))
                || !segments.get(1).matches("[0-9a-f]{64}\\.apk")
                || !("/apk/" + segments.get(1)).equals(uri.getPath())) {
            throw new SecurityException("Invalid APK path");
        }
        try {
            File parent = directory(getContext());
            File file = new File(parent, segments.get(1)).getCanonicalFile();
            if (!parent.equals(file.getParentFile()) || !segments.get(1).equals(file.getName())) {
                throw new SecurityException("APK path escapes its directory");
            }
            return file;
        } catch (IOException invalid) {
            throw new SecurityException("Cannot resolve APK path");
        }
    }

    @Override public boolean onCreate() { return true; }

    @Override public String getType(Uri uri) { resolve(uri); return MIME; }

    @Override public Cursor query(Uri uri, String[] projection, String selection,
            String[] selectionArgs, String sortOrder) {
        File file = resolve(uri);
        if (!file.isFile()) throw new IllegalArgumentException("APK is unavailable");
        if (selection != null || selectionArgs != null || sortOrder != null) {
            throw new IllegalArgumentException("APK queries do not support selections");
        }
        String[] requested = projection == null
                ? new String[] {OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE} : projection;
        List<String> columns = new ArrayList<>();
        List<Object> values = new ArrayList<>();
        for (String column : requested) {
            if (OpenableColumns.DISPLAY_NAME.equals(column)) {
                columns.add(column); values.add(file.getName());
            } else if (OpenableColumns.SIZE.equals(column)) {
                columns.add(column); values.add(file.length());
            }
        }
        MatrixCursor cursor = new MatrixCursor(columns.toArray(new String[0]), 1);
        cursor.addRow(values.toArray());
        return cursor;
    }

    @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        if (!"r".equals(mode)) throw new SecurityException("APK provider is read-only");
        File file = resolve(uri);
        if (!file.isFile()) throw new FileNotFoundException("APK is unavailable");
        return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
    }

    @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException("Read-only"); }
    @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException("Read-only"); }
    @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException("Read-only"); }
}
