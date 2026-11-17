package com.ecojust.usedcartv;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.security.keystore.KeyInfo;
import android.security.keystore.KeyProperties;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.LargeTest;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.security.KeyFactory;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManagerFactory;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;
import static org.junit.Assume.assumeTrue;

/** Runs on Android's actual Keystore and Conscrypt, without exporting private keys. */
@RunWith(AndroidJUnit4.class)
@LargeTest
public class LanTlsPlatformTest {
    @Test public void deviceIdentityPersistsAndOpaqueKeysServeTlsAfterLanIpChanges() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        LanTlsIdentity original = LanTlsIdentity.load(context);
        LanGameServer.TlsConfig first = original.configuration(Arrays.asList("127.0.0.1", "192.168.1.45"));
        assertKeystoreKeysCannotBeExported();

        Result before = fetch(context, first, "TLSv1.2");
        assertEquals(new HashSet<>(Arrays.asList("127.0.0.1", "192.168.1.45")), addresses(before.leaf));

        // Loading again must use the installed TV identity, not a fresh authority.
        LanTlsIdentity reloaded = LanTlsIdentity.load(context);
        LanGameServer.TlsConfig afterReload = reloaded.configuration(Arrays.asList("127.0.0.1", "192.168.1.45"));
        assertEquals(first.fingerprint, afterReload.fingerprint);
        assertArrayEquals(first.certificateDer(), afterReload.certificateDer());
        assertArrayEquals(first.mobileConfig(), afterReload.mobileConfig());

        // DHCP changes replace the server certificate while phones retain their root trust.
        LanGameServer.TlsConfig changed = reloaded.configuration(Arrays.asList("127.0.0.1", "192.168.2.46"));
        assertEquals(first.fingerprint, changed.fingerprint);
        assertArrayEquals(first.certificateDer(), changed.certificateDer());
        Result after = fetch(context, changed, "TLSv1.2");
        assertEquals(new HashSet<>(Arrays.asList("127.0.0.1", "192.168.2.46")), addresses(after.leaf));
        assertArrayEquals(before.leaf.getPublicKey().getEncoded(), after.leaf.getPublicKey().getEncoded());
        assertNotEquals(before.leaf.getSerialNumber(), after.leaf.getSerialNumber());

        if (Arrays.asList(changed.context.getSupportedSSLParameters().getProtocols()).contains("TLSv1.3")) {
            Result modern = fetch(context, changed, "TLSv1.3");
            assertArrayEquals(after.leaf.getEncoded(), modern.leaf.getEncoded());
        }
        assertKeystoreKeysCannotBeExported();
    }

    @Test public void explicitlyEnabledIsolatedInstallCanResetOnlyTheLanPairingIdentity() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        // Reset smoke tests are opt-in for the fresh CI emulator installation.
        // A normal instrumentation invocation must not invalidate an owner's pairing.
        assumeTrue((context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        assumeTrue("true".equals(InstrumentationRegistry.getArguments().getString("allowIdentityReset")));
        File sentinel = File.createTempFile("lan-reset-platform-test-", ".sentinel", context.getFilesDir());
        try {
            try (FileOutputStream output = new FileOutputStream(sentinel)) { output.write("game-data-sentinel".getBytes(StandardCharsets.UTF_8)); }
            LanGameServer.TlsConfig previous = LanTlsIdentity.load(context).configuration(Arrays.asList("127.0.0.1", "192.168.1.45"));
            X509Certificate previousRoot = parseCertificate(previous.certificateDer());
            LanTlsIdentity.reset(context);
            LanGameServer.TlsConfig replacement = LanTlsIdentity.load(context).configuration(Arrays.asList("127.0.0.1", "192.168.1.45"));
            assertNotEquals(previous.fingerprint, replacement.fingerprint);
            fetch(context, replacement, "TLSv1.2");
            try { fetch(context, replacement, "TLSv1.2", previousRoot); fail("A reset TV must not authenticate under its old root"); }
            catch (SSLHandshakeException expected) { }
            try (FileInputStream input = new FileInputStream(sentinel)) { assertEquals("game-data-sentinel", readResponse(input)); }
            assertKeystoreKeysCannotBeExported();
        } finally { assertTrue("Only the temporary test sentinel is removed", sentinel.delete()); }
    }

    private static Result fetch(Context context, LanGameServer.TlsConfig configuration, String protocol) throws Exception {
        return fetch(context, configuration, protocol, parseCertificate(configuration.certificateDer()));
    }

    private static X509Certificate parseCertificate(byte[] encoded) throws Exception {
        return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(encoded));
    }

    private static Result fetch(Context context, LanGameServer.TlsConfig configuration, String protocol, X509Certificate authority) throws Exception {
        KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType()); trustStore.load(null);
        trustStore.setCertificateEntry("this-tv", authority);
        TrustManagerFactory trust = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        trust.init(trustStore);
        SSLContext client = SSLContext.getInstance("TLS"); client.init(null, trust.getTrustManagers(), null);
        try (LanGameServer server = new LanGameServer(name -> context.getAssets().open(name), configuration)) {
            server.start();
            assertTrue(server.httpsPort() > 0);
            int port = server.httpsPort();
            try (SSLSocket socket = (SSLSocket) client.getSocketFactory().createSocket("127.0.0.1", port)) {
                socket.setSoTimeout(10_000);
                socket.setEnabledProtocols(new String[]{protocol});
                if ("TLSv1.2".equals(protocol))
                    socket.setEnabledCipherSuites(new String[]{"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"});
                SSLParameters parameters = socket.getSSLParameters();
                parameters.setEndpointIdentificationAlgorithm("HTTPS"); socket.setSSLParameters(parameters);
                socket.startHandshake();
                assertEquals(protocol, socket.getSession().getProtocol());
                java.security.cert.Certificate[] chain = socket.getSession().getPeerCertificates();
                assertTrue(chain.length >= 1);
                X509Certificate leaf = (X509Certificate) chain[0];
                leaf.checkValidity(); leaf.verify(authority.getPublicKey());
                socket.getOutputStream().write(("GET /connection.json?room=" + server.roomToken()
                    + " HTTP/1.1\r\nHost: 127.0.0.1:" + port + "\r\nConnection: close\r\n\r\n").getBytes(StandardCharsets.US_ASCII));
                socket.getOutputStream().flush();
                String response = readResponse(socket.getInputStream());
                assertTrue(response.startsWith("HTTP/1.1 200"));
                assertTrue(response.contains("connect-src 'self' wss://127.0.0.1:" + port));
                JSONObject info = new JSONObject(response.substring(response.indexOf("\r\n\r\n") + 4));
                assertEquals(configuration.fingerprint, info.getString("certificateSha256"));
                assertEquals("https://127.0.0.1:" + port + "/?room=" + server.roomToken(), info.getString("secureUrl"));
                assertEquals(server.roomToken(), info.getString("room"));
                return new Result(leaf);
            }
        }
    }

    private static String readResponse(InputStream input) throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream(); byte[] block = new byte[4096]; int count;
        while ((count = input.read(block)) != -1) {
            assertTrue("Bounded connection metadata", output.size() + count <= 65_536);
            output.write(block, 0, count);
        }
        return output.toString(StandardCharsets.UTF_8.name());
    }

    private static Set<String> addresses(X509Certificate certificate) throws Exception {
        Set<String> addresses = new HashSet<>();
        for (List<?> entry : certificate.getSubjectAlternativeNames()) {
            assertEquals(7, entry.get(0)); addresses.add((String) entry.get(1));
        }
        return addresses;
    }

    private static void assertKeystoreKeysCannotBeExported() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore"); store.load(null);
        int checked = 0;
        for (Enumeration<String> aliases = store.aliases(); aliases.hasMoreElements();) {
            String alias = aliases.nextElement();
            if (!alias.startsWith("com.ecojust.usedcartv.lan.")) continue;
            Key key = store.getKey(alias, null);
            assertTrue("LAN identity remains a private Keystore key", key instanceof PrivateKey);
            assertNull("Android Keystore must not export a private key", key.getEncoded());
            KeyInfo details = KeyFactory.getInstance("RSA", "AndroidKeyStore").getKeySpec(key, KeyInfo.class);
            assertEquals("LAN keys only sign; TLS must never use RSA key decryption", KeyProperties.PURPOSE_SIGN, details.getPurposes());
            checked++;
        }
        assertTrue("Authority and TLS server use independent private keys", checked >= 2);
    }

    private static final class Result {
        final X509Certificate leaf;
        Result(X509Certificate leaf) { this.leaf = leaf; }
    }
}
