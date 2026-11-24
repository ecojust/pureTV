package com.ecojust.putrtvstore;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.UUID;

/** Hands verified APKs to the system's user-confirmed installer; never installs silently. */
public class ApkInstaller {
    public static final int INSTALL_REQUEST = 4701;
    public static final int SETTINGS_REQUEST = 4702;
    private static final long MAX_BYTES = StoreDownloader.MAX_APK_BYTES;
    private static final long RETAIN_MILLIS = 24L * 60 * 60 * 1000;
    private static final String PREFERENCES = "pending-apk-install";

    public enum Error {
        INVALID_FILE, INVALID_APK, WRONG_PACKAGE, WRONG_VERSION,
        WRONG_SIGNER, HASH_MISMATCH, INCOMPATIBLE_ANDROID,
        SIGNATURE_MISMATCH, NOT_NEWER, STORAGE_UNAVAILABLE,
        NO_INSTALLER, PERMISSION_REQUIRED, PERSISTENCE_FAILED
    }

    public static class InstallException extends IOException {
        public final Error reason;
        InstallException(Error reason, String message) { super(message); this.reason = reason; }
    }

    public static final class PreparedApk {
        private final StoreEntry entry;
        private final File file;
        private final String owner;
        private PreparedApk(StoreEntry entry, File file, String owner) {
            this.entry = entry; this.file = file; this.owner = owner;
        }
    }

    public enum Outcome { NONE, INSTALLED, NOT_CONFIRMED }
    public static final class Result {
        public final Outcome outcome;
        public final String packageName, versionName;
        public final long versionCode;
        private Result(Outcome outcome, String packageName, String versionName, long versionCode) {
            this.outcome = outcome; this.packageName = packageName;
            this.versionName = versionName == null ? "" : versionName;
            this.versionCode = versionCode;
        }
    }

    private final Activity activity;
    private final InstalledApps installed;
    private final SharedPreferences pending;
    private final String owner = UUID.randomUUID().toString();

    public ApkInstaller(Activity activity) { this(activity, new InstalledApps(activity)); }
    ApkInstaller(Activity activity, InstalledApps installed) {
        this.activity = activity; this.installed = installed;
        this.pending = activity.getSharedPreferences(PREFERENCES, 0);
    }

    public boolean canInstall() {
        try {
            return Build.VERSION.SDK_INT < 26 || activity.getPackageManager().canRequestPackageInstalls();
        } catch (RuntimeException unavailable) {
            return false;
        }
    }

    public void openPermissionSettings() throws InstallException {
        Intent intent = Build.VERSION.SDK_INT >= 26
                ? new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName()))
                : new Intent(Settings.ACTION_SECURITY_SETTINGS);
        try {
            activity.startActivityForResult(intent, SETTINGS_REQUEST);
        } catch (ActivityNotFoundException | SecurityException unavailable) {
            try {
                activity.startActivityForResult(new Intent(Settings.ACTION_SECURITY_SETTINGS), SETTINGS_REQUEST);
            } catch (ActivityNotFoundException | SecurityException alsoUnavailable) {
                throw failure(Error.NO_INSTALLER, "No unknown-source settings screen is available");
            }
        }
    }

    /** Run on a worker thread. Copies, hashes and inspects the actual APK before exposing it. */
    public PreparedApk prepare(StoreEntry entry, File source) throws IOException {
        if (entry == null || source == null || entry.bytes <= 0 || entry.bytes > MAX_BYTES) {
            throw failure(Error.INVALID_FILE, "Invalid marketplace APK size or file");
        }
        if (entry.sha256 == null || entry.certificateSha256 == null || entry.packageName == null
                || entry.versionName == null || entry.versionCode < 0 || entry.minSdk < 0) {
            throw failure(Error.INVALID_APK, "Invalid marketplace APK metadata");
        }
        StoreEntry listed = entry;
        if (entry.sha256.isEmpty()) {
            // The downloader publishes under the observed digest after checking the HTTP snapshot.
            String name = source.getName();
            String key = StoreDownloader.snapshotKey(entry);
            String prefix = key == null ? "" : key + "-";
            if (!name.matches(prefix + "[a-f0-9]{64}\\.apk")) {
                throw failure(Error.INVALID_FILE, "Missing verified APK digest");
            }
            String hash = name.substring(name.length() - 68, name.length() - 4);
            entry = entry.withIdentity(entry.packageName, entry.versionName, entry.versionCode,
                    entry.minSdk, hash, entry.certificateSha256, entry.gitBlobSha);
        }
        if (!entry.sha256.matches("[0-9a-f]{64}")) {
            throw failure(Error.INVALID_APK, "Invalid marketplace checksum");
        }
        if (entry.minSdk > Build.VERSION.SDK_INT) {
            throw failure(Error.INCOMPATIBLE_ANDROID, "The APK requires a newer Android version");
        }
        verifyFile(source, entry);
        File directory = ApkProvider.directory(activity);
        ensureDirectory(directory);
        cleanup(directory, entry.sha256 + ".apk");
        File privateApk = new File(directory, entry.sha256 + ".apk");
        copyVerified(source, privateApk, entry);
        PackageInfo archive = archiveInfo(privateApk);
        if (archive == null) throw failure(Error.INVALID_APK, "Android could not read the APK");
        if (!entry.packageName.isEmpty() && !entry.packageName.equals(archive.packageName)) {
            throw failure(Error.WRONG_PACKAGE, "The APK package does not match the catalog");
        }
        long actualCode = InstalledApps.version(archive);
        String actualName = archive.versionName == null ? "" : archive.versionName;
        if ((entry.versionCode > 0 && actualCode != entry.versionCode)
                || (!entry.versionName.isEmpty() && !entry.versionName.equals(actualName))) {
            throw failure(Error.WRONG_VERSION, "The APK version does not match the catalog");
        }
        String actualSigner = InstalledApps.signer(archive);
        if (actualSigner.isEmpty() || (!entry.certificateSha256.isEmpty()
                && !entry.certificateSha256.equalsIgnoreCase(actualSigner))) {
            throw failure(Error.WRONG_SIGNER, "The APK signing certificate does not match the catalog");
        }
        if (Build.VERSION.SDK_INT >= 24 && archive.applicationInfo != null
                && archive.applicationInfo.minSdkVersion > Build.VERSION.SDK_INT) {
            throw failure(Error.INCOMPATIBLE_ANDROID, "The APK requires a newer Android version");
        }
        int minSdk = Build.VERSION.SDK_INT >= 24 && archive.applicationInfo != null
                ? Math.max(1, archive.applicationInfo.minSdkVersion) : Math.max(1, entry.minSdk);
        entry = entry.withIdentity(archive.packageName, actualName, actualCode, minSdk,
                entry.sha256, actualSigner, entry.gitBlobSha);
        validateEntry(entry);
        installed.remember(listed, entry);
        baseline(entry);
        File ready = privateApk;
        if (Build.VERSION.SDK_INT < 24) {
            // Android 4.4 and 6 stock installers do not accept content URIs. Their app-specific
            // external directory is readable by the installer without broad storage permission.
            File external = externalDirectory();
            ensureDirectory(external);
            cleanup(external, null);
            ready = new File(external, UUID.randomUUID().toString() + ".apk");
            copyVerified(privateApk, ready, entry);
        }
        return new PreparedApk(entry, ready, owner);
    }

    protected PackageInfo archiveInfo(File apk) {
        return activity.getPackageManager().getPackageArchiveInfo(apk.getAbsolutePath(), InstalledApps.signatureFlags());
    }

    protected File externalDirectory() throws InstallException {
        File root = activity.getExternalFilesDir(null);
        if (root == null) throw failure(Error.STORAGE_UNAVAILABLE, "App-specific external storage is unavailable");
        try {
            root = root.getCanonicalFile();
            File directory = new File(root, "install-apks").getCanonicalFile();
            if (!root.equals(directory.getParentFile()) || !"install-apks".equals(directory.getName())) {
                throw failure(Error.STORAGE_UNAVAILABLE, "Invalid APK staging directory");
            }
            return directory;
        }
        catch (IOException unavailable) { throw failure(Error.STORAGE_UNAVAILABLE, "Cannot access APK staging storage"); }
    }

    protected boolean hasInstaller(Intent intent) {
        return intent.resolveActivity(activity.getPackageManager()) != null;
    }

    /** Opens Android's confirmation screen. This method never reports installation success. */
    public void install(PreparedApk prepared) throws InstallException {
        if (prepared == null || !owner.equals(prepared.owner)) {
            throw failure(Error.INVALID_FILE, "Prepare this APK before opening the installer");
        }
        if (!canInstall()) throw failure(Error.PERMISSION_REQUIRED, "Allow this store to request APK installations");
        StoreEntry entry = prepared.entry;
        long before = baseline(entry);
        // External storage can be changed by another app on old systems. Recheck immediately
        // before handing it off; the system installer still independently verifies APK signatures.
        verifyFile(prepared.file, entry);
        Uri uri = Build.VERSION.SDK_INT >= 24 ? ApkProvider.uri(activity, entry.sha256)
                : Uri.fromFile(prepared.file);
        Intent intent = installationIntent(Intent.ACTION_INSTALL_PACKAGE, uri);
        if (!hasInstaller(intent)) intent = installationIntent(Intent.ACTION_VIEW, uri);
        if (!hasInstaller(intent)) throw failure(Error.NO_INSTALLER, "No system APK installer is available");
        boolean saved = pending.edit().clear().putString("package", entry.packageName)
                .putString("signer", entry.certificateSha256).putString("name", entry.versionName)
                .putLong("version", entry.versionCode).putLong("before", before)
                .putString("file", prepared.file.getAbsolutePath()).commit();
        if (!saved) throw failure(Error.PERSISTENCE_FAILED, "Cannot persist the installation verification request");
        try {
            activity.startActivityForResult(intent, INSTALL_REQUEST);
        } catch (ActivityNotFoundException | SecurityException unavailable) {
            pending.edit().clear().commit();
            throw failure(Error.NO_INSTALLER, "Android could not open the APK installer");
        }
    }

    private Intent installationIntent(String action, Uri uri) {
        Intent intent = new Intent(action).setDataAndType(uri, ApkProvider.MIME)
                .putExtra(Intent.EXTRA_RETURN_RESULT, true);
        if (Build.VERSION.SDK_INT >= 24) {
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            intent.setClipData(ClipData.newRawUri("APK", uri));
        }
        return intent;
    }

    /** Ignore the installer's result code: only the package manager proves the requested update. */
    public Result confirmResult(int resultCode) { return reconcile(); }

    /** Call after returning to the foreground; the persisted ticket also survives process death. */
    public Result reconcile() {
        String packageName = pending.getString("package", "");
        if (packageName.isEmpty()) return new Result(Outcome.NONE, "", "", 0);
        String signer = pending.getString("signer", "");
        long target = pending.getLong("version", -1);
        long before = pending.getLong("before", Long.MAX_VALUE);
        String name = pending.getString("name", "");
        Outcome outcome = Outcome.NOT_CONFIRMED;
        long actual = 0;
        try {
            PackageInfo info = installed.packageInfo(packageName);
            actual = InstalledApps.version(info);
            name = info.versionName;
            if (target > 0 && before < target && actual >= target
                    && signer.matches("[0-9a-fA-F]{64}")
                    && signer.equalsIgnoreCase(InstalledApps.signer(info))) {
                outcome = Outcome.INSTALLED;
            }
        } catch (PackageManager.NameNotFoundException | RuntimeException unavailable) {
            // Cancellation, uninstall, unreadable package state and signer mismatch are not success.
        }
        // Consume once. Leaving a completed ticket can falsely credit a later unrelated install.
        if (!pending.edit().clear().commit()) outcome = Outcome.NOT_CONFIRMED;
        return new Result(outcome, packageName, name, actual);
    }

    private long baseline(StoreEntry entry) throws InstallException {
        try {
            PackageInfo info = installed.packageInfo(entry.packageName);
            if (!entry.certificateSha256.equalsIgnoreCase(InstalledApps.signer(info))) {
                throw failure(Error.SIGNATURE_MISMATCH, "The installed app uses a different or unreadable signing certificate");
            }
            long version = InstalledApps.version(info);
            if (version >= entry.versionCode) throw failure(Error.NOT_NEWER, "The installed version is already current or newer");
            return version;
        } catch (PackageManager.NameNotFoundException absent) {
            return -1;
        } catch (RuntimeException unavailable) {
            throw failure(Error.SIGNATURE_MISMATCH, "Cannot safely verify the installed app's identity");
        }
    }

    private static void validateEntry(StoreEntry entry) throws InstallException {
        if (entry == null || entry.packageName == null || !entry.packageName.matches("[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z][A-Za-z0-9_]*)+")
                || entry.versionName == null || entry.versionCode < 1 || entry.minSdk < 1
                || entry.bytes < 1 || entry.bytes > MAX_BYTES || entry.sha256 == null
                || !entry.sha256.matches("[0-9a-f]{64}") || entry.certificateSha256 == null
                || !entry.certificateSha256.matches("[0-9a-fA-F]{64}")) {
            throw failure(Error.INVALID_APK, "The catalog APK identity is incomplete");
        }
    }

    private static void ensureDirectory(File directory) throws InstallException {
        if (!directory.isDirectory() && !directory.mkdirs()) {
            throw failure(Error.STORAGE_UNAVAILABLE, "Cannot create APK staging directory");
        }
    }

    private void copyVerified(File source, File target, StoreEntry entry) throws IOException {
        if (source.getCanonicalFile().equals(target.getCanonicalFile())) {
            verifyFile(target, entry); target.setLastModified(System.currentTimeMillis()); return;
        }
        if (target.getParentFile().getUsableSpace() < entry.bytes + 1024 * 1024) {
            throw failure(Error.STORAGE_UNAVAILABLE, "Not enough room to stage the APK");
        }
        File part = new File(target.getParentFile(), UUID.randomUUID().toString() + ".part");
        try {
            try (FileInputStream input = new FileInputStream(source); FileOutputStream output = new FileOutputStream(part)) {
                byte[] buffer = new byte[32 * 1024];
                long copied = 0;
                int count;
                while ((count = input.read(buffer)) != -1) {
                    copied += count;
                    if (copied > entry.bytes) throw failure(Error.INVALID_FILE, "APK size changed during staging");
                    output.write(buffer, 0, count);
                }
                output.getFD().sync();
            }
            verifyFile(part, entry);
            if (!part.renameTo(target)) throw failure(Error.STORAGE_UNAVAILABLE, "Cannot publish the staged APK");
            verifyFile(target, entry);
        } finally {
            if (part.exists()) part.delete();
        }
    }

    private static void verifyFile(File file, StoreEntry entry) throws InstallException {
        if (file == null || !file.isFile() || file.length() != entry.bytes) {
            throw failure(Error.INVALID_FILE, "APK size does not match the catalog");
        }
        try (FileInputStream input = new FileInputStream(file)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[32 * 1024];
            int count;
            long total = 0;
            while ((count = input.read(buffer)) != -1) {
                total += count;
                if (total > entry.bytes) throw failure(Error.INVALID_FILE, "APK size changed while verifying");
                digest.update(buffer, 0, count);
            }
            if (total != entry.bytes || !entry.sha256.equals(InstalledApps.hex(digest.digest()))) {
                throw failure(Error.HASH_MISMATCH, "APK digest does not match the catalog");
            }
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        } catch (InstallException invalid) {
            throw invalid;
        } catch (IOException unreadable) {
            throw failure(Error.INVALID_FILE, "Cannot read the APK");
        }
    }

    private void cleanup(File directory, String keepName) {
        String pendingFile = pending.getString("file", "");
        File[] files = directory.listFiles();
        if (files == null) return;
        long cutoff = System.currentTimeMillis() - RETAIN_MILLIS;
        for (File file : files) {
            String name = file.getName();
            if (file.isFile() && (name.endsWith(".apk") || name.endsWith(".part"))
                    && !name.equals(keepName) && !file.getAbsolutePath().equals(pendingFile)
                    && file.lastModified() < cutoff) file.delete();
        }
    }

    private static InstallException failure(Error reason, String message) { return new InstallException(reason, message); }
}
