package com.ecojust.putrtvstore;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Archive fixtures model Android's parsed identity; no test claims to run a real APK installer. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class ApkInstallerTest {
    private static final String PACKAGE = "com.ecojust.fixture";
    private static final byte[] APK = "verified archive fixture".getBytes(StandardCharsets.US_ASCII);
    private static final Signature CERTIFICATE = new Signature(new byte[] {1, 2, 3, 4, 5});
    private static final Signature OTHER_CERTIFICATE = new Signature(new byte[] {5, 4, 3, 2, 1});
    private Activity activity;
    private TestInstaller installer;
    private StoreEntry entry;
    private File source;

    public static class TestActivity extends Activity { }

    private static final class TestInstaller extends ApkInstaller {
        PackageInfo archive;
        boolean available = true, externalAvailable = true, supportInstallAction = true;
        TestInstaller(Activity activity) { super(activity); }
        @Override protected PackageInfo archiveInfo(File apk) { return archive; }
        @Override protected boolean hasInstaller(Intent intent) {
            return available && (supportInstallAction || Intent.ACTION_VIEW.equals(intent.getAction()));
        }
        @Override protected File externalDirectory() throws InstallException {
            if (!externalAvailable) throw new InstallException(Error.STORAGE_UNAVAILABLE, "fixture unavailable");
            return super.externalDirectory();
        }
    }

    @Before public void before() throws Exception {
        activity = Robolectric.buildActivity(TestActivity.class).setup().get();
        shadowOf(activity.getPackageManager()).setCanRequestPackageInstalls(true);
        installer = new TestInstaller(activity);
        installer.archive = archive(2, CERTIFICATE);
        entry = entry(19);
        source = new File(activity.getCacheDir(), "download.apk");
        write(source, APK);
    }

    @Test public void androidNineGrantsOnlyTheVerifiedPrivateApk() throws Exception {
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        // Source download retention does not affect the installer's independently verified copy.
        assertTrue(source.delete());
        installer.install(prepared);
        Intent intent = launched();
        assertEquals(Intent.ACTION_INSTALL_PACKAGE, intent.getAction());
        assertEquals("content", intent.getData().getScheme());
        assertEquals(activity.getPackageName() + ".apks", intent.getData().getAuthority());
        assertEquals("/apk/" + entry.sha256 + ".apk", intent.getData().getPath());
        assertEquals(ApkProvider.MIME, intent.getType());
        assertEquals(Intent.FLAG_GRANT_READ_URI_PERMISSION,
                intent.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION);
        assertEquals(0, intent.getFlags() & Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
        assertEquals(intent.getData(), intent.getClipData().getItemAt(0).getUri());
        assertTrue(intent.getBooleanExtra(Intent.EXTRA_RETURN_RESULT, false));
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED, installer.reconcile().outcome);
    }

    @Test @Config(sdk = 19) public void android44UsesAnIndependentlyVerifiedLegacyFileUri() throws Exception {
        assertLegacyStaging();
    }

    @Test @Config(sdk = 23) public void androidSixUsesAnIndependentlyVerifiedLegacyFileUri() throws Exception {
        assertLegacyStaging();
    }

    private void assertLegacyStaging() throws Exception {
        assertTrue(installer.canInstall());
        installer.install(installer.prepare(entry, source));
        Intent intent = launched();
        assertEquals("file", intent.getData().getScheme());
        File staged = new File(intent.getData().getPath()).getCanonicalFile();
        assertEquals(installer.externalDirectory().getCanonicalFile(), staged.getParentFile());
        assertNotEquals(source.getCanonicalFile(), staged);
        assertArrayEquals(APK, Files.readAllBytes(staged.toPath()));
        assertEquals(0, intent.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION);
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED,
                installer.confirmResult(Activity.RESULT_CANCELED).outcome);
    }

    @Test public void unknownSourcePermissionIsExplicitAndDoesNotStartAnInstall() throws Exception {
        shadowOf(activity.getPackageManager()).setCanRequestPackageInstalls(false);
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        assertFalse(installer.canInstall());
        expect(ApkInstaller.Error.PERMISSION_REQUIRED, () -> installer.install(prepared));
        assertNull(shadowOf(activity).getNextStartedActivity());
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
        installer.openPermissionSettings();
        Intent settings = launched();
        assertEquals(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, settings.getAction());
        assertEquals(Uri.parse("package:" + activity.getPackageName()), settings.getData());
    }

    @Test public void sameSizedCorruptionNeverReachesTheSystemInstaller() throws Exception {
        byte[] wrong = APK.clone(); wrong[0] ^= 1; write(source, wrong);
        expect(ApkInstaller.Error.HASH_MISMATCH, () -> installer.prepare(entry, source));
        assertNull(shadowOf(activity).getNextStartedActivity());
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
    }

    @Test public void truncatedOrOversizedFileIsRejected() throws Exception {
        write(source, new byte[] {1});
        expect(ApkInstaller.Error.INVALID_FILE, () -> installer.prepare(entry, source));
        write(source, new byte[APK.length + 1]);
        expect(ApkInstaller.Error.INVALID_FILE, () -> installer.prepare(entry, source));
    }

    @Test public void parsedPackageVersionSignerAndAndroidRequirementMustMatch() throws Exception {
        installer.archive = null;
        expect(ApkInstaller.Error.INVALID_APK, () -> installer.prepare(entry, source));
        installer.archive = archive(2, CERTIFICATE); installer.archive.packageName = "com.example.other";
        expect(ApkInstaller.Error.WRONG_PACKAGE, () -> installer.prepare(entry, source));
        installer.archive = archive(3, CERTIFICATE);
        expect(ApkInstaller.Error.WRONG_VERSION, () -> installer.prepare(entry, source));
        installer.archive = archive(2, OTHER_CERTIFICATE);
        expect(ApkInstaller.Error.WRONG_SIGNER, () -> installer.prepare(entry, source));
        installer.archive = archive(2, CERTIFICATE); installer.archive.applicationInfo.minSdkVersion = 29;
        expect(ApkInstaller.Error.INCOMPATIBLE_ANDROID, () -> installer.prepare(entry, source));
        installer.archive = archive(2, CERTIFICATE);
        expect(ApkInstaller.Error.INCOMPATIBLE_ANDROID, () -> installer.prepare(entry(29), source));
        assertNull(shadowOf(activity).getNextStartedActivity());
    }

    @Test public void installedSigningConflictBlocksUpdateWithoutUninstalling() throws Exception {
        installPackage(archive(1, OTHER_CERTIFICATE));
        expect(ApkInstaller.Error.SIGNATURE_MISMATCH, () -> installer.prepare(entry, source));
        assertEquals(InstalledApps.State.SIGNATURE_MISMATCH, new InstalledApps(activity).inspect(entry).state);
        assertNull(shadowOf(activity).getNextStartedActivity());
    }

    @Test public void refusesSameVersionDowngradeAndAChangedBaselineBeforeLaunch() throws Exception {
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        installPackage(archive(2, CERTIFICATE));
        expect(ApkInstaller.Error.NOT_NEWER, () -> installer.install(prepared));
        expect(ApkInstaller.Error.NOT_NEWER, () -> installer.prepare(entry, source));
        installPackage(archive(3, CERTIFICATE));
        expect(ApkInstaller.Error.NOT_NEWER, () -> installer.prepare(entry, source));
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
    }

    @Test public void resultOkAndCancelCannotClaimAnUnchangedPackageWasUpdated() throws Exception {
        installPackage(archive(1, CERTIFICATE));
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        installer.install(prepared); launched();
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED,
                installer.confirmResult(Activity.RESULT_OK).outcome);
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
        installer.install(prepared); launched();
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED,
                installer.confirmResult(Activity.RESULT_CANCELED).outcome);
        assertEquals(1, new InstalledApps(activity).inspect(entry).versionCode);
    }

    @Test public void actualVersionAndSignerProveSuccessEvenWithoutAResultCode() throws Exception {
        installPackage(archive(1, CERTIFICATE));
        installer.install(installer.prepare(entry, source)); launched();
        installPackage(archive(2, CERTIFICATE));
        ApkInstaller.Result result = installer.reconcile();
        assertEquals(ApkInstaller.Outcome.INSTALLED, result.outcome);
        assertEquals(PACKAGE, result.packageName);
        assertEquals(2, result.versionCode);
        assertEquals("2.0", result.versionName);
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
    }

    @Test @Config(sdk = 19) public void legacyActualInstallIsAlsoVerifiedWithPackageManager() throws Exception {
        installer.install(installer.prepare(entry, source)); launched();
        installPackage(archive(2, CERTIFICATE));
        assertEquals(ApkInstaller.Outcome.INSTALLED,
                installer.confirmResult(Activity.RESULT_CANCELED).outcome);
    }

    @Test public void installedStateWithWrongSignerNeverCountsAsSuccess() throws Exception {
        installer.install(installer.prepare(entry, source)); launched();
        installPackage(archive(2, OTHER_CERTIFICATE));
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED,
                installer.confirmResult(Activity.RESULT_OK).outcome);
    }

    @Test public void processRecreationRecoversOnlyAnActuallyCompletedInstallation() throws Exception {
        installer.install(installer.prepare(entry, source)); launched();
        installPackage(archive(2, CERTIFICATE));
        ApkInstaller recreated = new ApkInstaller(activity);
        assertEquals(ApkInstaller.Outcome.INSTALLED, recreated.reconcile().outcome);
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
    }

    @Test public void processRecreationAfterCancellationDoesNotReportSuccess() throws Exception {
        installer.install(installer.prepare(entry, source)); launched();
        assertEquals(ApkInstaller.Outcome.NOT_CONFIRMED, new ApkInstaller(activity).reconcile().outcome);
        installPackage(archive(2, CERTIFICATE));
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
    }

    @Test public void unavailableInstallerLeavesNoPendingSuccessAndSupportsViewFallback() throws Exception {
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        installer.available = false;
        expect(ApkInstaller.Error.NO_INSTALLER, () -> installer.install(prepared));
        assertEquals(ApkInstaller.Outcome.NONE, installer.reconcile().outcome);
        installer.available = true; installer.supportInstallAction = false;
        installer.install(prepared);
        assertEquals(Intent.ACTION_VIEW, launched().getAction());
    }

    @Test @Config(sdk = 23) public void missingLegacyStorageFailsBeforeLaunchingInstaller() throws Exception {
        installer.externalAvailable = false;
        expect(ApkInstaller.Error.STORAGE_UNAVAILABLE, () -> installer.prepare(entry, source));
        assertNull(shadowOf(activity).getNextStartedActivity());
    }

    @Test @Config(sdk = 23) public void legacyFileIsRecheckedWhenReturningFromPermissionOrOtherUi() throws Exception {
        ApkInstaller.PreparedApk prepared = installer.prepare(entry, source);
        File[] staged = installer.externalDirectory().listFiles((directory, name) -> name.endsWith(".apk"));
        assertNotNull(staged); assertEquals(1, staged.length);
        byte[] wrong = APK.clone(); wrong[0] ^= 1; write(staged[0], wrong);
        expect(ApkInstaller.Error.HASH_MISMATCH, () -> installer.install(prepared));
        assertNull(shadowOf(activity).getNextStartedActivity());
    }

    private Intent launched() {
        Intent intent = shadowOf(activity).getNextStartedActivity();
        assertNotNull("Expected a system confirmation/settings intent", intent);
        return intent;
    }

    private void installPackage(PackageInfo info) { shadowOf(activity.getPackageManager()).installPackage(info); }

    private static PackageInfo archive(int version, Signature signer) {
        PackageInfo info = new PackageInfo();
        info.packageName = PACKAGE; info.versionCode = version; info.versionName = version + ".0";
        info.signatures = new Signature[] {signer};
        info.applicationInfo = new ApplicationInfo();
        info.applicationInfo.packageName = PACKAGE;
        if (Build.VERSION.SDK_INT >= 24) info.applicationInfo.minSdkVersion = 19;
        return info;
    }

    private static StoreEntry entry(int minSdk) throws Exception {
        return new StoreEntry("apps/fixture", "示例", "Fixture", "", "", "tools", PACKAGE, "2.0",
                "resource/apps/fixture/fixture.apk", "", "", sha(APK), sha(CERTIFICATE.toByteArray()),
                "0000000000000000000000000000000000000000", 2, APK.length, minSdk);
    }

    private static String sha(byte[] bytes) throws Exception {
        return InstalledApps.hex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static void write(File path, byte[] bytes) throws Exception {
        try (FileOutputStream output = new FileOutputStream(path)) { output.write(bytes); }
    }

    private interface Checked { void run() throws Exception; }
    private static void expect(ApkInstaller.Error reason, Checked action) throws Exception {
        try { action.run(); fail("Expected " + reason); }
        catch (ApkInstaller.InstallException expected) { assertEquals(reason, expected.reason); }
    }
}
