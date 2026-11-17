package com.ecojust.putrtvstore;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.os.Build;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Reads only package identities represented by the store catalog. */
public class InstalledApps {
    public enum State {
        NOT_INSTALLED, UPDATE_AVAILABLE, CURRENT, NEWER_INSTALLED,
        SIGNATURE_MISMATCH, INCOMPATIBLE, UNKNOWN
    }

    public static final class Status {
        public final State state;
        public final long versionCode;
        public final String versionName;
        public final boolean installed;

        Status(State state, long versionCode, String versionName, boolean installed) {
            this.state = state;
            this.versionCode = versionCode;
            this.versionName = versionName == null ? "" : versionName;
            this.installed = installed;
        }
    }

    protected final Context context;
    protected final PackageManager packages;

    public InstalledApps(Context context) {
        this.context = context.getApplicationContext();
        this.packages = this.context.getPackageManager();
    }

    static int signatureFlags() {
        int flags = PackageManager.GET_SIGNATURES;
        if (Build.VERSION.SDK_INT >= 28) flags |= PackageManager.GET_SIGNING_CERTIFICATES;
        return flags;
    }

    protected PackageInfo packageInfo(String packageName) throws PackageManager.NameNotFoundException {
        return packages.getPackageInfo(packageName, signatureFlags());
    }

    static long version(PackageInfo info) {
        long value = Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
        if (value < 0) throw new IllegalArgumentException("Invalid package version");
        return value;
    }

    static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) {
            result.append(Character.forDigit((value >>> 4) & 15, 16));
            result.append(Character.forDigit(value & 15, 16));
        }
        return result.toString();
    }

    /** The catalog pins one current signer; different or multiple signers are not interchangeable. */
    static String signer(PackageInfo info) {
        Signature[] signatures = info.signatures;
        if (Build.VERSION.SDK_INT >= 28 && info.signingInfo != null) {
            signatures = info.signingInfo.getApkContentsSigners();
        }
        if (signatures == null || signatures.length != 1 || signatures[0] == null) return "";
        try {
            return hex(MessageDigest.getInstance("SHA-256").digest(signatures[0].toByteArray()));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    public Status inspect(StoreEntry entry) {
        PackageInfo installed = null;
        try {
            try {
                installed = packageInfo(entry.packageName);
            } catch (PackageManager.NameNotFoundException missing) {
                // Absence is distinct from a package-manager or visibility error.
            }
            long code = installed == null ? 0 : version(installed);
            String name = installed == null ? "" : installed.versionName;
            if (entry.minSdk > Build.VERSION.SDK_INT) {
                return new Status(State.INCOMPATIBLE, code, name, installed != null);
            }
            if (installed == null) return new Status(State.NOT_INSTALLED, 0, "", false);
            String certificate = signer(installed);
            if (certificate.isEmpty()) return new Status(State.UNKNOWN, code, name, true);
            if (!certificate.equalsIgnoreCase(entry.certificateSha256)) {
                return new Status(State.SIGNATURE_MISMATCH, code, name, true);
            }
            State state = code < entry.versionCode ? State.UPDATE_AVAILABLE
                    : code == entry.versionCode ? State.CURRENT : State.NEWER_INSTALLED;
            return new Status(state, code, name, true);
        } catch (RuntimeException unavailable) {
            return new Status(State.UNKNOWN, 0, "", installed != null);
        }
    }

    public Intent launchIntent(StoreEntry entry) {
        try {
            Intent intent = Build.VERSION.SDK_INT >= 21
                    ? packages.getLeanbackLaunchIntentForPackage(entry.packageName) : null;
            return intent != null ? intent : packages.getLaunchIntentForPackage(entry.packageName);
        } catch (RuntimeException unavailable) {
            return null;
        }
    }
}
