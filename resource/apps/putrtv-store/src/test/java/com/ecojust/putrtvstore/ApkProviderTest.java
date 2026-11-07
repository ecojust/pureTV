package com.ecojust.putrtvstore;

import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.File;
import java.io.FileNotFoundException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class ApkProviderTest {
    private static final String DIGEST = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    private static final byte[] PAYLOAD = "verified fixture APK bytes".getBytes(StandardCharsets.UTF_8);
    private Context context;
    private ApkProvider provider;
    private File directory, apk, outside;
    private Uri uri;

    @Before public void setup() throws Exception {
        context = RuntimeEnvironment.getApplication();
        directory = new File(context.getFilesDir(), ApkProvider.DIRECTORY);
        directory.mkdirs(); apk = new File(directory, DIGEST + ".apk");
        Files.write(apk.toPath(), PAYLOAD);
        outside = new File(context.getCacheDir(), "provider-outside.apk"); Files.write(outside.toPath(), PAYLOAD);
        provider = Robolectric.buildContentProvider(ApkProvider.class).create().get();
        uri = ApkProvider.uri(context, DIGEST);
    }
    @After public void cleanup() throws Exception {
        if (directory != null && Files.isSymbolicLink(directory.toPath())) Files.deleteIfExists(directory.toPath());
        else if (apk != null) Files.deleteIfExists(apk.toPath());
        if (outside != null) Files.deleteIfExists(outside.toPath());
    }

    @Test public void exactUriExposesReadOnlyBytesAndBoundedMetadata() throws Exception {
        assertEquals("content://" + context.getPackageName() + ".apks/apk/" + DIGEST + ".apk", uri.toString());
        assertEquals(ApkProvider.MIME, provider.getType(uri));
        try (ParcelFileDescriptor.AutoCloseInputStream input = new ParcelFileDescriptor.AutoCloseInputStream(provider.openFile(uri, "r"))) {
            assertArrayEquals(PAYLOAD, input.readAllBytes());
        }
        try (Cursor cursor = provider.query(uri, null, null, null, null)) {
            assertArrayEquals(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}, cursor.getColumnNames());
            assertTrue(cursor.moveToFirst()); assertEquals(DIGEST + ".apk", cursor.getString(0)); assertEquals(PAYLOAD.length, cursor.getLong(1));
            assertFalse(cursor.moveToNext());
        }
    }
    @Test public void projectionsNeverRevealAnAbsolutePath() {
        try (Cursor cursor = provider.query(uri, new String[]{"_data", OpenableColumns.SIZE, "filePath", OpenableColumns.DISPLAY_NAME}, null, null, null)) {
            assertEquals(-1, cursor.getColumnIndex("_data")); assertEquals(-1, cursor.getColumnIndex("filePath"));
            assertEquals(2, cursor.getColumnCount()); assertTrue(cursor.moveToFirst());
            assertEquals(PAYLOAD.length, cursor.getLong(cursor.getColumnIndex(OpenableColumns.SIZE)));
        }
        try (Cursor cursor = provider.query(uri, new String[]{"_data"}, null, null, null)) { assertEquals(0, cursor.getColumnCount()); }
    }
    @Test public void allWriteModesAndMutationsAreRefused() throws Exception {
        for (String mode : new String[]{"w", "wt", "wa", "rw", "rwt", "", null})
            assertThrows(SecurityException.class, () -> provider.openFile(uri, mode));
        assertThrows(UnsupportedOperationException.class, () -> provider.insert(uri, new ContentValues()));
        assertThrows(UnsupportedOperationException.class, () -> provider.update(uri, new ContentValues(), null, null));
        assertThrows(UnsupportedOperationException.class, () -> provider.delete(uri, null, null));
        assertArrayEquals(PAYLOAD, Files.readAllBytes(apk.toPath()));
    }
    @Test public void foreignTraversalAndDecoratedUrisAreRejected() {
        String authority = context.getPackageName() + ".apks";
        String[] invalid = {
                "content://foreign.apks/apk/" + DIGEST + ".apk",
                "file:///apk/" + DIGEST + ".apk",
                "content://" + authority + "/apk/../" + DIGEST + ".apk",
                "content://" + authority + "/apk/%2e%2e%2f" + DIGEST + ".apk",
                "content://" + authority + "/apk//" + DIGEST + ".apk",
                "content://" + authority + "/apk/" + DIGEST + ".apk/",
                "content://" + authority + "/anything/" + DIGEST + ".apk",
                uri + "?download=1", uri + "#fragment", uri + "?", uri + "#"
        };
        for (String value : invalid) {
            Uri malformed = Uri.parse(value);
            assertThrows(value, SecurityException.class, () -> provider.openFile(malformed, "r"));
            assertThrows(value, SecurityException.class, () -> provider.getType(malformed));
            assertThrows(value, SecurityException.class, () -> provider.query(malformed, null, null, null, null));
        }
        assertThrows(SecurityException.class, () -> provider.openFile(null, "r"));
    }
    @Test public void digestMustBeExactlyLowercaseSha256() {
        for (String digest : new String[]{null, "", DIGEST.toUpperCase(java.util.Locale.ROOT), DIGEST.substring(1), DIGEST + "a", "../" + DIGEST})
            assertThrows(IllegalArgumentException.class, () -> ApkProvider.uri(context, digest));
    }
    @Test public void selectionsAndMissingFilesCannotBeQueriedAsArbitraryData() throws Exception {
        assertThrows(IllegalArgumentException.class, () -> provider.query(uri, null, "1=1", null, null));
        assertThrows(IllegalArgumentException.class, () -> provider.query(uri, null, null, new String[]{"x"}, null));
        assertThrows(IllegalArgumentException.class, () -> provider.query(uri, null, null, null, "_data"));
        Files.delete(apk.toPath());
        assertThrows(FileNotFoundException.class, () -> provider.openFile(uri, "r"));
        assertThrows(IllegalArgumentException.class, () -> provider.query(uri, null, null, null, null));
    }
    @Test public void symlinkedApkCannotEscapeTheInstallerDirectory() throws Exception {
        Files.delete(apk.toPath()); Files.createSymbolicLink(apk.toPath(), outside.toPath());
        assertThrows(SecurityException.class, () -> provider.openFile(uri, "r"));
        assertThrows(SecurityException.class, () -> provider.getType(uri));
        assertThrows(SecurityException.class, () -> provider.query(uri, null, null, null, null));
        assertArrayEquals(PAYLOAD, Files.readAllBytes(outside.toPath()));
    }
    @Test public void symlinkedInstallerDirectoryCannotEscapePrivateFiles() throws Exception {
        Files.delete(apk.toPath()); Files.delete(directory.toPath()); Files.createSymbolicLink(directory.toPath(), context.getCacheDir().toPath());
        assertThrows(SecurityException.class, () -> provider.openFile(uri, "r"));
        assertThrows(SecurityException.class, () -> provider.query(uri, null, null, null, null));
    }
    @Test public void manifestRequiresExplicitUriGrants() {
        ProviderInfo info = context.getPackageManager().resolveContentProvider(context.getPackageName() + ".apks", 0);
        assertNotNull(info); assertFalse(info.exported); assertTrue(info.grantUriPermissions);
        assertEquals(ApkProvider.class.getName(), info.name);
    }
}
