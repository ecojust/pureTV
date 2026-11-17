package com.ecojust.usedcartv;

import android.content.Context;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.AtomicFile;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import javax.security.auth.x500.X500Principal;

/** Persistent per-installation LAN identity. Its private keys never leave Android Keystore. */
final class LanTlsIdentity {
    private static final String AUTHORITY_ALIAS = "com.ecojust.usedcartv.lan.authority.v1";
    // v2 enables the raw, pre-hashed signature operations used by Android's TLS stack.
    // A server-key policy change never replaces the authority already trusted by phones.
    private static final String SERVER_ALIAS = "com.ecojust.usedcartv.lan.server.v2";
    private static final String CERTIFICATE_FILE = "puretv-lan-authority-v1.der";
    private static final long DAY = 86_400_000L;
    private final X509Certificate authority;
    private final KeyPair authorityKeys;
    private final KeyPair serverKeys;
    private List<String> cachedAddresses;
    private X509Certificate cachedLeaf;
    private LanGameServer.TlsConfig cachedConfiguration;

    private LanTlsIdentity(X509Certificate authority, KeyPair authorityKeys, KeyPair serverKeys) {
        this.authority = authority; this.authorityKeys = authorityKeys; this.serverKeys = serverKeys;
    }

    static synchronized LanTlsIdentity load(Context context) throws GeneralSecurityException, IOException {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        File certificateFile = new File(context.getNoBackupFilesDir(), CERTIFICATE_FILE);
        AtomicFile file = new AtomicFile(certificateFile);
        boolean savedCertificate = certificateFile.exists() || new File(certificateFile.getPath() + ".bak").exists();
        // A missing key alongside an existing trusted certificate is not silently replaced.
        // This prevents turning an identity/storage error into an unnoticed new authority.
        if (savedCertificate && !store.containsAlias(AUTHORITY_ALIAS))
            throw new GeneralSecurityException("The saved LAN certificate has no corresponding Android Keystore key");
        KeyPair rootKeys = keys(store, AUTHORITY_ALIAS, false);
        X509Certificate root;
        if (savedCertificate) {
            byte[] encoded;
            try (FileInputStream input = file.openRead(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                byte[] block = new byte[4096]; int read;
                while ((read = input.read(block)) != -1) {
                    if (output.size() + read > 64 * 1024) throw new IOException("Invalid LAN certificate size");
                    output.write(block, 0, read);
                }
                encoded = output.toByteArray();
            }
            root = (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(encoded));
            if (!Arrays.equals(root.getPublicKey().getEncoded(), rootKeys.getPublic().getEncoded()))
                throw new GeneralSecurityException("The LAN certificate does not match this TV's key");
            root.verify(rootKeys.getPublic()); root.checkValidity();
            if (root.getBasicConstraints() != 0 || root.getKeyUsage() == null || !root.getKeyUsage()[5])
                throw new GeneralSecurityException("Invalid LAN authority certificate");
        } else {
            root = LanCertificates.createAuthority(rootKeys, new Date());
            FileOutputStream output = null;
            try {
                output = file.startWrite(); output.write(root.getEncoded()); file.finishWrite(output); output = null;
            } finally { if (output != null) file.failWrite(output); }
        }
        return new LanTlsIdentity(root, rootKeys, keys(store, SERVER_ALIAS, true));
    }

    /** Only call after an explicit user confirmation and after closing the old room. */
    static synchronized void reset(Context context) throws GeneralSecurityException, IOException {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        // Exact, application-owned aliases only. The APK signing identity and game
        // data are unrelated and must never be modified by a phone-pairing reset.
        for (String alias : new String[]{AUTHORITY_ALIAS, "com.ecojust.usedcartv.lan.server.v1", SERVER_ALIAS})
            if (store.containsAlias(alias)) store.deleteEntry(alias);
        File certificate = new File(context.getNoBackupFilesDir(), CERTIFICATE_FILE);
        new AtomicFile(certificate).delete();
        for (String suffix : new String[]{"", ".bak", ".new"}) {
            File remaining = new File(certificate.getPath() + suffix);
            if (remaining.exists() && !remaining.delete()) throw new IOException("Cannot remove the previous LAN certificate");
        }
    }

    synchronized LanGameServer.TlsConfig configuration(List<String> addresses) throws GeneralSecurityException, IOException {
        List<String> normalized = LanCertificates.normalizeAddresses(addresses);
        Date now = new Date();
        authority.checkValidity(now);
        if (cachedConfiguration != null && normalized.equals(cachedAddresses)
                && cachedLeaf.getNotBefore().getTime() <= now.getTime()
                && cachedLeaf.getNotAfter().getTime() - now.getTime() > 7 * DAY) return cachedConfiguration;
        X509Certificate leaf = LanCertificates.createServer(authority, authorityKeys.getPrivate(), serverKeys.getPublic(), normalized, now);
        LanGameServer.TlsConfig configuration = new LanGameServer.TlsConfig(
            LanCertificates.serverContext(serverKeys.getPrivate(), leaf, authority), authority.getEncoded(),
            LanCertificates.mobileConfig(authority), LanCertificates.fingerprint(authority), LanCertificates.displayName(authority.getPublicKey()));
        cachedAddresses = normalized; cachedLeaf = leaf; cachedConfiguration = configuration;
        return configuration;
    }

    private static KeyPair keys(KeyStore store, String alias, boolean tlsServer) throws GeneralSecurityException {
        if (!store.containsAlias(alias)) {
            KeyPairGenerator generator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA, "AndroidKeyStore");
            Date now = new Date();
            KeyGenParameterSpec.Builder specification = new KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN)
                .setKeySize(2048)
                .setUserAuthenticationRequired(false)
                .setCertificateSubject(new X500Principal("CN=pureTV LAN key"))
                .setCertificateSerialNumber(BigInteger.ONE)
                .setCertificateNotBefore(new Date(now.getTime() - DAY))
                .setCertificateNotAfter(new Date(now.getTime() + 3650 * DAY));
            if (tlsServer) {
                // Android 8 Conscrypt signs pre-hashed TLS records with NONEwithRSA.
                // Newer Conscrypt also uses private RSA/NoPadding for TLS 1.3's
                // already-encoded PSS signatures. These remain SIGN operations:
                // PURPOSE_DECRYPT is deliberately never authorized.
                specification.setDigests(KeyProperties.DIGEST_NONE, KeyProperties.DIGEST_SHA256,
                        KeyProperties.DIGEST_SHA384, KeyProperties.DIGEST_SHA512)
                    .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1, KeyProperties.SIGNATURE_PADDING_RSA_PSS)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE);
            } else {
                specification.setDigests(KeyProperties.DIGEST_SHA256)
                    .setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1);
            }
            generator.initialize(specification.build());
            return generator.generateKeyPair();
        }
        java.security.Key key = store.getKey(alias, null);
        java.security.cert.Certificate certificate = store.getCertificate(alias);
        if (!(key instanceof PrivateKey) || certificate == null)
            throw new GeneralSecurityException("Invalid Android Keystore LAN key");
        return new KeyPair(certificate.getPublicKey(), (PrivateKey) key);
    }
}
