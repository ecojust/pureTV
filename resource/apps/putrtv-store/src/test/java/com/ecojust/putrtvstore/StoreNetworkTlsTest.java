package com.ecojust.putrtvstore;

import static org.junit.Assert.*;

import java.io.IOException;
import java.net.InetAddress;
import java.net.Socket;
import java.util.Arrays;
import javax.net.ssl.HandshakeCompletedListener;
import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLSession;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import org.junit.Test;

/** Offline socket fixtures verify configuration; no server connection or physical TV is exercised. */
public class StoreNetworkTlsTest {
    private static final String[] LEGACY_SUPPORTED = {"SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"};

    @Test public void allSixCreationOverloadsEnableTls12OnTheActualDelegatedSocket() throws Exception {
        InetAddress remote = InetAddress.getByAddress(new byte[] {127, 0, 0, 1});
        InetAddress local = InetAddress.getByAddress(new byte[] {127, 0, 0, 2});
        Socket wrapped = new Socket();
        for (int overload = 0; overload < 6; overload++) {
            FixtureSocket socket = new FixtureSocket(LEGACY_SUPPORTED);
            assertArrayEquals(new String[] {"SSLv3", "TLSv1"}, socket.getEnabledProtocols());
            FixtureFactory delegate = new FixtureFactory(socket);
            SSLSocketFactory factory = new StoreNetwork.EnabledTlsFactory(delegate);
            Socket result;
            Object[] expectedArgs;
            switch (overload) {
                case 0:
                    result = factory.createSocket(); expectedArgs = new Object[0]; break;
                case 1:
                    result = factory.createSocket(wrapped, "example.invalid", 443, true);
                    expectedArgs = new Object[] {wrapped, "example.invalid", 443, true}; break;
                case 2:
                    result = factory.createSocket("example.invalid", 443);
                    expectedArgs = new Object[] {"example.invalid", 443}; break;
                case 3:
                    result = factory.createSocket("example.invalid", 443, local, 1234);
                    expectedArgs = new Object[] {"example.invalid", 443, local, 1234}; break;
                case 4:
                    result = factory.createSocket(remote, 443);
                    expectedArgs = new Object[] {remote, 443}; break;
                default:
                    result = factory.createSocket(remote, 443, local, 1234);
                    expectedArgs = new Object[] {remote, 443, local, 1234}; break;
            }
            assertSame("Configure the delegate's socket, not a replacement", socket, result);
            assertEquals(overload, delegate.overload);
            assertArrayEquals(expectedArgs, delegate.arguments);
            assertArrayEquals(new String[] {"TLSv1.2"}, socket.getEnabledProtocols());
            assertEquals(1, socket.protocolChanges);
            assertEquals(0, socket.cipherChanges);
            assertFalse(socket.closed);
            result.close();
        }
        wrapped.close();
    }

    @Test public void keepsModernTls13AndExcludesObsoleteProtocols() throws Exception {
        FixtureSocket socket = new FixtureSocket(new String[] {"TLSv1", "TLSv1.2", "SSLv3", "TLSv1.3"});
        new StoreNetwork.EnabledTlsFactory(new FixtureFactory(socket)).createSocket();
        assertArrayEquals(new String[] {"TLSv1.3", "TLSv1.2"}, socket.getEnabledProtocols());
        assertEquals(0, socket.cipherChanges);
        socket.close();
    }

    @Test public void allowsTls13OnlySocketWithoutEnablingUnsupportedTls12() throws Exception {
        FixtureSocket socket = new FixtureSocket(new String[] {"TLSv1.3"});
        new StoreNetwork.EnabledTlsFactory(new FixtureFactory(socket)).createSocket();
        assertArrayEquals(new String[] {"TLSv1.3"}, socket.getEnabledProtocols());
        socket.close();
    }

    @Test public void rejectsAndClosesSocketWithoutTls12OrNewer() throws Exception {
        FixtureSocket socket = new FixtureSocket(new String[] {"SSLv3", "TLSv1", "TLSv1.1"});
        try {
            new StoreNetwork.EnabledTlsFactory(new FixtureFactory(socket)).createSocket();
            fail("Obsolete protocols must not be used as a fallback");
        } catch (IOException expected) {
            assertTrue(socket.closed);
            assertEquals(0, socket.protocolChanges);
        }
    }

    @Test public void rejectsAndClosesNonTlsSocket() throws Exception {
        Socket socket = new Socket();
        try {
            new StoreNetwork.EnabledTlsFactory(new FixtureFactory(socket)).createSocket();
            fail("A plain socket must not be accepted for HTTPS");
        } catch (IOException expected) {
            assertTrue(socket.isClosed());
        }
    }

    @Test public void closesSocketWhenProviderRejectsProtocolConfiguration() throws Exception {
        FixtureSocket socket = new FixtureSocket(LEGACY_SUPPORTED);
        socket.rejectProtocolChange = true;
        try {
            new StoreNetwork.EnabledTlsFactory(new FixtureFactory(socket)).createSocket();
            fail("Configuration failure must not return an insecure socket");
        } catch (IOException expected) {
            assertTrue(socket.closed);
            assertTrue(expected.getCause() instanceof IllegalArgumentException);
        }
    }

    @Test public void forwardsCipherSuitesAndDoesNotReplaceGlobalHttpsPolicy() throws Exception {
        SSLSocketFactory originalFactory = HttpsURLConnection.getDefaultSSLSocketFactory();
        HostnameVerifier originalVerifier = HttpsURLConnection.getDefaultHostnameVerifier();
        FixtureSocket socket = new FixtureSocket(LEGACY_SUPPORTED);
        FixtureFactory delegate = new FixtureFactory(socket);
        StoreNetwork.EnabledTlsFactory factory = new StoreNetwork.EnabledTlsFactory(delegate);
        assertArrayEquals(delegate.getDefaultCipherSuites(), factory.getDefaultCipherSuites());
        assertArrayEquals(delegate.getSupportedCipherSuites(), factory.getSupportedCipherSuites());
        factory.createSocket();
        assertSame(originalFactory, HttpsURLConnection.getDefaultSSLSocketFactory());
        assertSame(originalVerifier, HttpsURLConnection.getDefaultHostnameVerifier());
        assertArrayEquals(new String[] {"fixture-enabled-cipher"}, socket.getEnabledCipherSuites());
        assertEquals(0, socket.cipherChanges);
        socket.close();
    }

    private static final class FixtureFactory extends SSLSocketFactory {
        final Socket socket;
        int overload = -1;
        Object[] arguments;
        FixtureFactory(Socket socket) { this.socket = socket; }
        private Socket created(int id, Object... args) { overload = id; arguments = args; return socket; }
        @Override public String[] getDefaultCipherSuites() { return new String[] {"fixture-default"}; }
        @Override public String[] getSupportedCipherSuites() { return new String[] {"fixture-default", "fixture-other"}; }
        @Override public Socket createSocket() { return created(0); }
        @Override public Socket createSocket(Socket wrapped, String host, int port, boolean close) {
            return created(1, wrapped, host, port, close);
        }
        @Override public Socket createSocket(String host, int port) { return created(2, host, port); }
        @Override public Socket createSocket(String host, int port, InetAddress local, int localPort) {
            return created(3, host, port, local, localPort);
        }
        @Override public Socket createSocket(InetAddress host, int port) { return created(4, host, port); }
        @Override public Socket createSocket(InetAddress host, int port, InetAddress local, int localPort) {
            return created(5, host, port, local, localPort);
        }
    }

    private static final class FixtureSocket extends SSLSocket {
        final String[] supported;
        String[] enabled = {"SSLv3", "TLSv1"};
        boolean closed, rejectProtocolChange;
        int protocolChanges, cipherChanges;
        FixtureSocket(String[] supported) { this.supported = supported.clone(); }
        @Override public String[] getSupportedProtocols() { return supported.clone(); }
        @Override public String[] getEnabledProtocols() { return enabled.clone(); }
        @Override public void setEnabledProtocols(String[] protocols) {
            if (rejectProtocolChange) throw new IllegalArgumentException("Fixture provider rejected configuration");
            for (String protocol : protocols) if (!Arrays.asList(supported).contains(protocol))
                throw new IllegalArgumentException("Unsupported protocol: " + protocol);
            enabled = protocols.clone(); protocolChanges++;
        }
        @Override public String[] getSupportedCipherSuites() { return new String[] {"fixture-enabled-cipher"}; }
        @Override public String[] getEnabledCipherSuites() { return new String[] {"fixture-enabled-cipher"}; }
        @Override public void setEnabledCipherSuites(String[] suites) { cipherChanges++; }
        @Override public SSLSession getSession() { return null; }
        @Override public void addHandshakeCompletedListener(HandshakeCompletedListener listener) { }
        @Override public void removeHandshakeCompletedListener(HandshakeCompletedListener listener) { }
        @Override public void startHandshake() { fail("Factory fixtures must not perform a network handshake"); }
        @Override public void setUseClientMode(boolean mode) { }
        @Override public boolean getUseClientMode() { return true; }
        @Override public void setNeedClientAuth(boolean need) { }
        @Override public boolean getNeedClientAuth() { return false; }
        @Override public void setWantClientAuth(boolean want) { }
        @Override public boolean getWantClientAuth() { return false; }
        @Override public void setEnableSessionCreation(boolean enabled) { }
        @Override public boolean getEnableSessionCreation() { return true; }
        @Override public void close() { closed = true; }
    }
}
