package com.ecojust.bilitv;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class LegacyTlsTest {
    @Test @Config(sdk = 19) public void kitkatEnablesTls12WithoutReplacingHostnameValidation() throws Exception {
        SSLSocketFactory original = HttpsURLConnection.getDefaultSSLSocketFactory();
        HostnameVerifier verifier = HttpsURLConnection.getDefaultHostnameVerifier();
        try {
            LegacyTls.installIfNeeded();
            SSLSocketFactory installed = HttpsURLConnection.getDefaultSSLSocketFactory();
            assertTrue(installed instanceof LegacyTls.EnabledFactory);
            assertSame(verifier,HttpsURLConnection.getDefaultHostnameVerifier());
            assertArrayEquals(original.getDefaultCipherSuites(),installed.getDefaultCipherSuites());
            try (SSLSocket socket = (SSLSocket)installed.createSocket()) { assertArrayEquals(new String[]{"TLSv1.2"},socket.getEnabledProtocols()); }
            LegacyTls.installIfNeeded(); assertSame(installed,HttpsURLConnection.getDefaultSSLSocketFactory());
        } finally { HttpsURLConnection.setDefaultSSLSocketFactory(original); }
    }
    @Test @Config(sdk = 23) public void modernAndroidKeepsItsOwnFactoryAndProtocols() {
        SSLSocketFactory original = HttpsURLConnection.getDefaultSSLSocketFactory();
        LegacyTls.installIfNeeded(); assertSame(original,HttpsURLConnection.getDefaultSSLSocketFactory());
    }
}
