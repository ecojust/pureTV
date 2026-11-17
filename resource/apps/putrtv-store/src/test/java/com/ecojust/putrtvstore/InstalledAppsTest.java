package com.ecojust.putrtvstore;

import static org.junit.Assert.*;

import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.content.pm.SigningInfo;
import android.os.Build;
import java.security.MessageDigest;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadow.api.Shadow;
import static org.robolectric.Shadows.shadowOf;

/** Package-state fixtures exercise update decisions; they do not simulate a real APK installation. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = {19, 23, 28})
public class InstalledAppsTest {
    private static final String PACKAGE = "com.ecojust.example";
    private static final Signature RELEASE_SIGNER = new Signature(new byte[] {1, 3, 5, 7, 9});
    private static final Signature OTHER_SIGNER = new Signature(new byte[] {2, 4, 6, 8});
    private FixtureApps apps;
    private String certificate;

    static class FixtureApps extends InstalledApps {
        PackageInfo fixture;
        boolean inaccessible;
        String requestedPackage;

        FixtureApps(Context context) { super(context); }

        @Override protected PackageInfo packageInfo(String packageName) throws PackageManager.NameNotFoundException {
            requestedPackage = packageName;
            if (inaccessible) throw new SecurityException("Fixture package lookup is denied");
            if (fixture == null) throw new PackageManager.NameNotFoundException(packageName);
            return fixture;
        }
    }

    @Before public void setup() throws Exception {
        apps = new FixtureApps(RuntimeEnvironment.getApplication());
        certificate = hex(MessageDigest.getInstance("SHA-256").digest(RELEASE_SIGNER.toByteArray()));
    }

    @Test public void comparesVersionCodesRegardlessOfVersionNames() {
        apps.fixture = installed(4, "9999.0.0", RELEASE_SIGNER);
        InstalledApps.Status update = apps.inspect(entry(5, "1.0", 19));
        assertEquals(InstalledApps.State.UPDATE_AVAILABLE, update.state);
        assertTrue(update.installed);
        assertEquals(4, update.versionCode);
        assertEquals("9999.0.0", update.versionName);
        assertEquals(PACKAGE, apps.requestedPackage);

        apps.fixture = installed(5, "unrelated label", RELEASE_SIGNER);
        assertEquals(InstalledApps.State.CURRENT, apps.inspect(entry(5, "1.0", 19)).state);
        apps.fixture = installed(6, "0.0.1", RELEASE_SIGNER);
        assertEquals(InstalledApps.State.NEWER_INSTALLED, apps.inspect(entry(5, "99.0", 19)).state);
    }

    @Test public void doesNotOfferUpdateAcrossSigningKeys() {
        apps.fixture = installed(1, "0.1", OTHER_SIGNER);
        InstalledApps.Status status = apps.inspect(entry(5, "1.0", 19));
        assertEquals(InstalledApps.State.SIGNATURE_MISMATCH, status.state);
        assertTrue(status.installed);
        assertEquals(1, status.versionCode);
    }

    @Test public void missingOrMultipleSignersRemainUnknown() {
        for (Signature[] signatures : new Signature[][] {null, {}, {RELEASE_SIGNER, OTHER_SIGNER}, {null}}) {
            apps.fixture = installed(1, "0.1", RELEASE_SIGNER);
            apps.fixture.signatures = signatures;
            InstalledApps.Status status = apps.inspect(entry(5, "1.0", 19));
            assertEquals(InstalledApps.State.UNKNOWN, status.state);
            assertTrue(status.installed);
        }
    }

    @Test public void absenceDiffersFromUnavailablePackageManager() {
        InstalledApps.Status absent = apps.inspect(entry(5, "1.0", 19));
        assertEquals(InstalledApps.State.NOT_INSTALLED, absent.state);
        assertFalse(absent.installed);

        apps.inaccessible = true;
        InstalledApps.Status inaccessible = apps.inspect(entry(5, "1.0", 19));
        assertEquals(InstalledApps.State.UNKNOWN, inaccessible.state);
        assertFalse(inaccessible.installed);
    }

    @Test public void incompatibleSystemBlocksBothFreshInstallAndUpdate() {
        StoreEntry future = entry(5, "1.0", Build.VERSION.SDK_INT + 1);
        InstalledApps.Status absent = apps.inspect(future);
        assertEquals(InstalledApps.State.INCOMPATIBLE, absent.state);
        assertFalse(absent.installed);

        apps.fixture = installed(1, "0.1", RELEASE_SIGNER);
        InstalledApps.Status installed = apps.inspect(future);
        assertEquals(InstalledApps.State.INCOMPATIBLE, installed.state);
        assertTrue(installed.installed);
        assertEquals(1, installed.versionCode);
    }

    @Test public void currentApiLevelIsCompatibleAndNullDisplayVersionIsSafe() {
        apps.fixture = installed(1, null, RELEASE_SIGNER);
        InstalledApps.Status status = apps.inspect(entry(2, "0.2", Build.VERSION.SDK_INT));
        assertEquals(InstalledApps.State.UPDATE_AVAILABLE, status.state);
        assertEquals("", status.versionName);
        assertEquals(certificate, InstalledApps.signer(apps.fixture));
    }

    @Test @Config(sdk = 28) public void modernLongVersionCodeIsNotTruncated() {
        long installedVersion = (1L << 32) + 7;
        apps.fixture = installed(7, "long version", RELEASE_SIGNER);
        apps.fixture.setLongVersionCode(installedVersion);
        InstalledApps.Status status = apps.inspect(entry(installedVersion + 1, "next", 19));
        assertEquals(InstalledApps.State.UPDATE_AVAILABLE, status.state);
        assertEquals(installedVersion, status.versionCode);
    }

    @Test @Config(sdk = {19, 23}) public void legacySignatureFlagsDoNotDependOnModernApis() {
        assertEquals(PackageManager.GET_SIGNATURES, InstalledApps.signatureFlags());
        apps.fixture = installed(5, "1.0", RELEASE_SIGNER);
        assertEquals(InstalledApps.State.CURRENT, apps.inspect(entry(5, "1.0", 19)).state);
    }

    @Test @Config(sdk = 28) public void modernSignatureLookupRequestsCurrentSigningCertificates() {
        assertTrue((InstalledApps.signatureFlags() & PackageManager.GET_SIGNING_CERTIFICATES) != 0);
        assertTrue((InstalledApps.signatureFlags() & PackageManager.GET_SIGNATURES) != 0);
    }

    @Test @Config(sdk = 28) public void currentSignerOverridesLegacySignerAndSigningHistory() {
        apps.fixture = installed(1, "0.1", RELEASE_SIGNER);
        apps.fixture.signingInfo = Shadow.newInstanceOf(SigningInfo.class);
        shadowOf(apps.fixture.signingInfo).setSignatures(new Signature[] {OTHER_SIGNER});
        shadowOf(apps.fixture.signingInfo).setPastSigningCertificates(new Signature[] {RELEASE_SIGNER, OTHER_SIGNER});
        assertEquals(InstalledApps.State.SIGNATURE_MISMATCH, apps.inspect(entry(5, "1.0", 19)).state);
        shadowOf(apps.fixture.signingInfo).setSignatures(new Signature[] {RELEASE_SIGNER});
        assertEquals(InstalledApps.State.UPDATE_AVAILABLE, apps.inspect(entry(5, "1.0", 19)).state);
    }

    @Test public void unknownPackageHasNoLaunchIntent() {
        assertNull(apps.launchIntent(entry(1, "0.1", 19)));
    }

    private StoreEntry entry(long code, String name, int minSdk) {
        return new StoreEntry("apps/example", "示例", "Example", "", "", "tools", PACKAGE, name,
                "resource/apps/example/example.apk", "", "", repeat('a', 64), certificate,
                repeat('b', 40), code, 1, minSdk);
    }

    private static PackageInfo installed(int code, String name, Signature signer) {
        PackageInfo info = new PackageInfo();
        info.packageName = PACKAGE; info.versionCode = code; info.versionName = name;
        info.signatures = new Signature[] {signer};
        return info;
    }

    private static String repeat(char value, int count) {
        char[] chars = new char[count]; java.util.Arrays.fill(chars, value); return new String(chars);
    }

    private static String hex(byte[] bytes) {
        StringBuilder value = new StringBuilder();
        for (byte b : bytes) value.append(String.format("%02x", b & 255));
        return value.toString();
    }
}
