package com.ecojust.usedcartv;

import java.io.ByteArrayInputStream;
import java.net.InetAddress;
import java.net.Socket;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.cert.CertPath;
import java.security.cert.CertPathValidator;
import java.security.cert.CertificateFactory;
import java.security.cert.PKIXParameters;
import java.security.cert.TrustAnchor;
import java.security.cert.X509Certificate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLHandshakeException;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLServerSocket;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.TrustManagerFactory;
import javax.xml.parsers.DocumentBuilderFactory;
import org.junit.BeforeClass;
import org.junit.Test;
import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import static org.junit.Assert.*;

/** Real PKIX and TLS checks. No trust-all managers or ignored certificate errors. */
public class LanCertificatesTest {
    private static KeyPair authorityKeys, serverKeys, otherKeys;
    private static X509Certificate authority, leaf, otherAuthority;
    private static Date now;

    @BeforeClass public static void identities() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA"); generator.initialize(2048);
        authorityKeys = generator.generateKeyPair(); serverKeys = generator.generateKeyPair(); otherKeys = generator.generateKeyPair();
        now = new Date();
        authority = LanCertificates.createAuthority(authorityKeys, now);
        otherAuthority = LanCertificates.createAuthority(otherKeys, now);
        leaf = LanCertificates.createServer(authority, authorityKeys.getPrivate(), serverKeys.getPublic(),
            Arrays.asList("127.0.0.1", "192.168.1.45"), now);
    }

    @Test public void authorityAndLeafPassPlatformPkixWithRestrictedCertificatePurposes() throws Exception {
        authority.verify(authorityKeys.getPublic()); authority.checkValidity(now); leaf.checkValidity(now);
        assertEquals(0, authority.getBasicConstraints());
        assertTrue(authority.getKeyUsage()[5]); assertTrue(authority.getKeyUsage()[6]); assertFalse(authority.getKeyUsage()[0]);
        assertEquals(-1, leaf.getBasicConstraints());
        assertTrue(leaf.getKeyUsage()[0]); assertFalse(leaf.getKeyUsage()[5]);
        assertEquals(Collections.singletonList("1.3.6.1.5.5.7.3.1"), leaf.getExtendedKeyUsage());
        assertEquals("SHA256withRSA", leaf.getSigAlgName());
        assertEquals(new HashSet<>(Arrays.asList("127.0.0.1", "192.168.1.45")), addresses(leaf));
        assertEquals(180L * 86_400_000L, leaf.getNotAfter().getTime() - leaf.getNotBefore().getTime());
        CertPath path = CertificateFactory.getInstance("X.509").generateCertPath(Collections.singletonList(leaf));
        PKIXParameters parameters = new PKIXParameters(Collections.singleton(new TrustAnchor(authority, null)));
        parameters.setRevocationEnabled(false); parameters.setDate(now);
        CertPathValidator.getInstance("PKIX").validate(path, parameters);
        assertEquals(64, LanCertificates.fingerprint(authority).length());
        assertNotEquals(LanCertificates.fingerprint(authority), LanCertificates.fingerprint(otherAuthority));
    }

    @Test public void changingIpReissuesOnlyTheLeafAndKeepsTheTrustedAuthority() throws Exception {
        byte[] profile = LanCertificates.mobileConfig(authority);
        X509Certificate changed = LanCertificates.createServer(authority, authorityKeys.getPrivate(), serverKeys.getPublic(),
            Arrays.asList("10.0.0.12", "172.16.0.2", "169.254.15.17"), now);
        changed.verify(authority.getPublicKey());
        assertEquals(new HashSet<>(Arrays.asList("10.0.0.12", "172.16.0.2", "169.254.15.17")), addresses(changed));
        assertFalse(addresses(changed).contains("192.168.1.45"));
        assertNotEquals(leaf.getSerialNumber(), changed.getSerialNumber());
        assertEquals(leaf.getIssuerX500Principal(), changed.getIssuerX500Principal());
        assertArrayEquals(profile, LanCertificates.mobileConfig(authority));
    }

    @Test public void certificateIssuerRejectsPublicNamesMalformedAddressesAndWrongSigningKeys() throws Exception {
        for (String bad : Arrays.asList("example.com", "puretv.local", "8.8.8.8", "172.32.0.1", "192.168.1.256",
                "192.168.01.1", "127.0.0.1:443", "::1", "", "192.168.1.1\n")) {
            try { LanCertificates.createServer(authority, authorityKeys.getPrivate(), serverKeys.getPublic(), Collections.singletonList(bad), now); fail(bad); }
            catch (GeneralSecurityException expected) { }
        }
        try { LanCertificates.createServer(authority, otherKeys.getPrivate(), serverKeys.getPublic(), Collections.singletonList("127.0.0.1"), now); fail("Wrong CA key"); }
        catch (GeneralSecurityException expected) { }
        assertEquals(Arrays.asList("10.0.0.1", "192.168.1.2"),
            LanCertificates.normalizeAddresses(Arrays.asList("192.168.1.2", "10.0.0.1", "10.0.0.1")));
    }

    @Test public void trustedCertificateAndMatchingIpCompleteActualTls12Handshake() throws Exception {
        assertEquals(42, handshake(authority, "127.0.0.1", "TLSv1.2", true));
    }

    @Test public void trustedCertificateAndMatchingIpCompleteActualTls13Handshake() throws Exception {
        if (Arrays.asList(SSLContext.getDefault().getSupportedSSLParameters().getProtocols()).contains("TLSv1.3"))
            assertEquals(42, handshake(authority, "127.0.0.1", "TLSv1.3", true));
    }

    @Test public void actualTlsRejectsAnUntrustedAuthorityAndAnIpOutsideTheSan() throws Exception {
        handshake(otherAuthority, "127.0.0.1", "TLSv1.2", false);
        handshake(authority, "127.0.0.2", "TLSv1.2", false);
    }

    @Test public void iosProfileContainsExactlyThisPublicRootAndCanBeRemoved() throws Exception {
        byte[] encoded = LanCertificates.mobileConfig(authority);
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
        factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        factory.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        Document document = factory.newDocumentBuilder().parse(new ByteArrayInputStream(encoded));
        NodeList data = document.getElementsByTagName("data"); assertEquals(1, data.getLength());
        assertArrayEquals(authority.getEncoded(), Base64.getMimeDecoder().decode(data.item(0).getTextContent()));
        List<String> types = new ArrayList<>();
        NodeList keys = document.getElementsByTagName("key");
        for (int i = 0; i < keys.getLength(); i++) {
            Node key = keys.item(i);
            if ("PayloadType".equals(key.getTextContent())) types.add(key.getNextSibling().getTextContent());
            if ("PayloadRemovalDisallowed".equals(key.getTextContent())) assertEquals("false", key.getNextSibling().getNodeName());
        }
        assertEquals(Arrays.asList("Configuration", "com.apple.security.root"), types);
        assertTrue(new String(encoded, java.nio.charset.StandardCharsets.UTF_8).contains(LanCertificates.fingerprint(authority)));
    }

    private static java.util.Set<String> addresses(X509Certificate certificate) throws Exception {
        java.util.Set<String> values = new HashSet<>();
        for (List<?> entry : certificate.getSubjectAlternativeNames()) {
            assertEquals(7, entry.get(0)); values.add((String) entry.get(1));
        }
        return values;
    }

    private static int handshake(X509Certificate trusted, String hostname, String protocol, boolean expectSuccess) throws Exception {
        SSLContext serverContext = LanCertificates.serverContext(serverKeys.getPrivate(), leaf, authority);
        KeyStore trustStore = KeyStore.getInstance(KeyStore.getDefaultType()); trustStore.load(null);
        trustStore.setCertificateEntry("trusted-device", trusted);
        TrustManagerFactory trust = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm()); trust.init(trustStore);
        SSLContext clientContext = SSLContext.getInstance("TLS"); clientContext.init(null, trust.getTrustManagers(), null);
        ExecutorService worker = Executors.newSingleThreadExecutor();
        try (SSLServerSocket listener = (SSLServerSocket) serverContext.getServerSocketFactory().createServerSocket(0, 1, InetAddress.getByName("127.0.0.1"))) {
            listener.setEnabledProtocols(new String[]{protocol});
            if ("TLSv1.2".equals(protocol)) listener.setEnabledCipherSuites(new String[]{"TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256"});
            Future<?> accepted = worker.submit(() -> {
                try (SSLSocket socket = (SSLSocket) listener.accept()) {
                    socket.setSoTimeout(3000); socket.startHandshake(); socket.getOutputStream().write(42); socket.getOutputStream().flush();
                } catch (Exception failure) { if (expectSuccess) throw new RuntimeException(failure); }
            });
            try (Socket transport = new Socket("127.0.0.1", listener.getLocalPort());
                    SSLSocket socket = (SSLSocket) clientContext.getSocketFactory().createSocket(transport, hostname, listener.getLocalPort(), true)) {
                socket.setSoTimeout(3000); socket.setEnabledProtocols(new String[]{protocol});
                SSLParameters parameters = socket.getSSLParameters(); parameters.setEndpointIdentificationAlgorithm("HTTPS"); socket.setSSLParameters(parameters);
                try {
                    socket.startHandshake();
                    if (!expectSuccess) fail("TLS must reject untrusted CA or mismatched IP");
                    assertEquals(protocol, socket.getSession().getProtocol());
                    return socket.getInputStream().read();
                } catch (SSLHandshakeException expected) { if (expectSuccess) throw expected; return -1; }
            } finally { accepted.get(5, TimeUnit.SECONDS); }
        } finally { worker.shutdownNow(); }
    }
}
