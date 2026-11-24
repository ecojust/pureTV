package com.ecojust.usedcartv;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigInteger;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyPair;
import java.security.MessageDigest;
import java.security.Principal;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPublicKey;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;
import java.util.TreeSet;
import java.util.UUID;
import javax.net.ssl.KeyManager;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLEngine;
import javax.net.ssl.X509ExtendedKeyManager;

/**
 * Fixed RFC 5280 certificate templates for this TV's private LAN authority.
 * DER is encoded here; parsing, signature operations, trust and TLS are all
 * delegated to the platform. No private key is serialized by this class.
 */
final class LanCertificates {
    private static final long DAY = 86_400_000L;
    private static final long BACKDATE = 5 * 60_000L;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final byte[] SHA256_RSA = sequence(oid("1.2.840.113549.1.1.11"), tag(0x05, new byte[0]));

    private LanCertificates() {}

    static X509Certificate createAuthority(KeyPair keys, Date now) throws GeneralSecurityException, IOException {
        requireRsa(keys.getPublic());
        byte[] name = name(displayName(keys.getPublic()));
        Date from = new Date(now.getTime() - BACKDATE);
        byte[] identifier = keyIdentifier(keys.getPublic());
        byte[] extensions = sequence(
            extension("2.5.29.19", true, sequence(bool(true), integer(BigInteger.ZERO))),
            extension("2.5.29.15", true, tag(0x03, new byte[]{1, 0x06})), // keyCertSign, cRLSign
            extension("2.5.29.14", false, tag(0x04, identifier)),
            extension("2.5.29.35", false, sequence(tag(0x80, identifier)))
        );
        return certificate(name, name, keys.getPublic(), keys.getPrivate(), from,
            new Date(from.getTime() + 3650 * DAY), extensions);
    }

    static X509Certificate createServer(X509Certificate authority, PrivateKey authorityKey,
            PublicKey serverKey, List<String> ipv4Addresses, Date now) throws GeneralSecurityException, IOException {
        requireRsa(serverKey);
        authority.checkValidity(now);
        if (authority.getBasicConstraints() < 0 || authority.getKeyUsage() == null || !authority.getKeyUsage()[5])
            throw new GeneralSecurityException("The LAN signing certificate is not a certificate authority");
        List<String> addresses = normalizeAddresses(ipv4Addresses);
        List<byte[]> alternatives = new ArrayList<>();
        for (String address : addresses) alternatives.add(tag(0x87, ipv4(address)));
        byte[] extensions = sequence(
            extension("2.5.29.19", true, sequence()),
            extension("2.5.29.15", true, tag(0x03, new byte[]{7, (byte) 0x80})), // digitalSignature only
            extension("2.5.29.37", false, sequence(oid("1.3.6.1.5.5.7.3.1"))), // TLS serverAuth
            extension("2.5.29.17", false, sequence(alternatives.toArray(new byte[0][]))),
            extension("2.5.29.14", false, tag(0x04, keyIdentifier(serverKey))),
            extension("2.5.29.35", false, sequence(tag(0x80, keyIdentifier(authority.getPublicKey()))))
        );
        Date from = new Date(Math.max(authority.getNotBefore().getTime(), now.getTime() - BACKDATE));
        Date until = new Date(Math.min(authority.getNotAfter().getTime(), from.getTime() + 180 * DAY));
        if (until.getTime() - now.getTime() < DAY) throw new GeneralSecurityException("The LAN authority needs renewal");
        X509Certificate leaf = certificate(authority.getSubjectX500Principal().getEncoded(),
            name(displayName(authority.getPublicKey()) + " Controller"), serverKey, authorityKey, from, until, extensions);
        leaf.verify(authority.getPublicKey());
        return leaf;
    }

    static SSLContext serverContext(PrivateKey serverKey, X509Certificate leaf, X509Certificate authority)
            throws GeneralSecurityException {
        leaf.verify(authority.getPublicKey());
        X509Certificate[] chain = {leaf, authority};
        X509ExtendedKeyManager manager = new X509ExtendedKeyManager() {
            private String alias(String keyType) { return "RSA".equals(keyType) ? "lan" : null; }
            @Override public String[] getClientAliases(String keyType, Principal[] issuers) { return null; }
            @Override public String chooseClientAlias(String[] keyType, Principal[] issuers, Socket socket) { return null; }
            @Override public String chooseEngineClientAlias(String[] keyType, Principal[] issuers, SSLEngine engine) { return null; }
            @Override public String[] getServerAliases(String keyType, Principal[] issuers) {
                return alias(keyType) == null ? null : new String[]{"lan"};
            }
            @Override public String chooseServerAlias(String keyType, Principal[] issuers, Socket socket) { return alias(keyType); }
            @Override public String chooseEngineServerAlias(String keyType, Principal[] issuers, SSLEngine engine) { return alias(keyType); }
            @Override public X509Certificate[] getCertificateChain(String alias) { return "lan".equals(alias) ? chain.clone() : null; }
            @Override public PrivateKey getPrivateKey(String alias) { return "lan".equals(alias) ? serverKey : null; }
        };
        SSLContext context = SSLContext.getInstance("TLS");
        context.init(new KeyManager[]{manager}, null, RANDOM);
        return context;
    }

    static List<String> normalizeAddresses(List<String> addresses) throws GeneralSecurityException {
        if (addresses == null || addresses.isEmpty() || addresses.size() > 32)
            throw new GeneralSecurityException("One to 32 LAN IPv4 addresses are required");
        TreeSet<String> result = new TreeSet<>();
        for (String address : addresses) { ipv4(address); result.add(address); }
        return Collections.unmodifiableList(new ArrayList<>(result));
    }

    private static byte[] ipv4(String address) throws GeneralSecurityException {
        if (address == null || !address.matches("[0-9]{1,3}(?:\\.[0-9]{1,3}){3}"))
            throw new GeneralSecurityException("A literal LAN IPv4 address is required");
        String[] parts = address.split("\\.");
        byte[] bytes = new byte[4];
        int[] numbers = new int[4];
        for (int i = 0; i < 4; i++) {
            if (parts[i].length() > 1 && parts[i].startsWith("0")) throw new GeneralSecurityException("Ambiguous IPv4 address");
            numbers[i] = Integer.parseInt(parts[i]);
            if (numbers[i] > 255) throw new GeneralSecurityException("Invalid IPv4 address");
            bytes[i] = (byte) numbers[i];
        }
        if (!(numbers[0] == 10 || numbers[0] == 127 || numbers[0] == 192 && numbers[1] == 168
                || numbers[0] == 172 && numbers[1] >= 16 && numbers[1] <= 31
                || numbers[0] == 169 && numbers[1] == 254))
            throw new GeneralSecurityException("Only private, link-local or loopback IPv4 certificates may be issued");
        return bytes;
    }

    static String fingerprint(X509Certificate certificate) throws GeneralSecurityException {
        return hex(MessageDigest.getInstance("SHA-256").digest(certificate.getEncoded()));
    }

    static String displayName(PublicKey publicKey) throws GeneralSecurityException {
        return "pureTV LAN " + hex(MessageDigest.getInstance("SHA-256").digest(publicKey.getEncoded())).substring(0, 12).toUpperCase(Locale.ROOT);
    }

    static byte[] mobileConfig(X509Certificate authority) throws GeneralSecurityException {
        String fingerprint = fingerprint(authority);
        String identifier = "com.ecojust.usedcartv.lan." + fingerprint.substring(0, 24);
        String name = displayName(authority.getPublicKey());
        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
            + "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n"
            + "<plist version=\"1.0\"><dict>"
            + pair("PayloadType", "Configuration") + "<key>PayloadVersion</key><integer>1</integer>"
            + pair("PayloadIdentifier", identifier) + pair("PayloadUUID", uuid(identifier))
            + pair("PayloadDisplayName", name) + pair("PayloadOrganization", "pureTV / ecojust")
            + pair("PayloadDescription", "Trust this TV's local HTTPS controller. Verify the SHA-256 fingerprint on your TV before installing. You may remove this profile when you stop using this TV.")
            + "<key>PayloadRemovalDisallowed</key><false/><key>PayloadContent</key><array><dict>"
            + pair("PayloadType", "com.apple.security.root") + "<key>PayloadVersion</key><integer>1</integer>"
            + pair("PayloadIdentifier", identifier + ".ca") + pair("PayloadUUID", uuid(identifier + ".ca"))
            + pair("PayloadDisplayName", name) + pair("PayloadCertificateFileName", "puretv-lan-ca.cer")
            + pair("PayloadDescription", "SHA-256: " + fingerprint)
            + "<key>PayloadContent</key><data>" + Base64.getEncoder().encodeToString(authority.getEncoded())
            + "</data></dict></array></dict></plist>\n";
        return xml.getBytes(StandardCharsets.UTF_8);
    }

    private static String uuid(String value) {
        return UUID.nameUUIDFromBytes(value.getBytes(StandardCharsets.UTF_8)).toString().toUpperCase(Locale.ROOT);
    }
    private static String pair(String key, String value) { return "<key>" + key + "</key><string>" + escapeXml(value) + "</string>"; }
    private static String escapeXml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;"); }
    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format(Locale.ROOT, "%02x", value & 0xff));
        return result.toString();
    }
    private static void requireRsa(PublicKey key) throws GeneralSecurityException {
        if (!(key instanceof RSAPublicKey) || ((RSAPublicKey) key).getModulus().bitLength() < 2048)
            throw new GeneralSecurityException("LAN certificates require an RSA key of at least 2048 bits");
    }
    private static byte[] keyIdentifier(PublicKey publicKey) throws GeneralSecurityException {
        // RFC 5280 permits other methods of constructing a unique key identifier.
        return Arrays.copyOf(MessageDigest.getInstance("SHA-256").digest(publicKey.getEncoded()), 20);
    }
    private static X509Certificate certificate(byte[] issuer, byte[] subject, PublicKey publicKey, PrivateKey signingKey,
            Date from, Date until, byte[] extensions) throws GeneralSecurityException, IOException {
        BigInteger serial;
        do { serial = new BigInteger(159, RANDOM); } while (serial.signum() == 0);
        byte[] tbs = sequence(tag(0xa0, integer(BigInteger.valueOf(2))), integer(serial), SHA256_RSA,
            issuer, sequence(time(from), time(until)), subject, publicKey.getEncoded(), tag(0xa3, extensions));
        Signature signature = Signature.getInstance("SHA256withRSA");
        signature.initSign(signingKey); signature.update(tbs);
        byte[] encoded = sequence(tbs, SHA256_RSA, tag(0x03, concat(new byte[]{0}, signature.sign())));
        return (X509Certificate) CertificateFactory.getInstance("X.509").generateCertificate(new ByteArrayInputStream(encoded));
    }
    private static byte[] extension(String identifier, boolean critical, byte[] value) {
        return critical ? sequence(oid(identifier), bool(true), tag(0x04, value)) : sequence(oid(identifier), tag(0x04, value));
    }
    private static byte[] name(String commonName) {
        return sequence(tag(0x31, sequence(oid("2.5.4.3"), tag(0x0c, commonName.getBytes(StandardCharsets.UTF_8)))));
    }
    private static byte[] time(Date date) {
        SimpleDateFormat year = new SimpleDateFormat("yyyy", Locale.ROOT); year.setTimeZone(TimeZone.getTimeZone("UTC"));
        boolean utc = Integer.parseInt(year.format(date)) < 2050;
        SimpleDateFormat format = new SimpleDateFormat(utc ? "yyMMddHHmmss'Z'" : "yyyyMMddHHmmss'Z'", Locale.ROOT);
        format.setTimeZone(TimeZone.getTimeZone("UTC"));
        return tag(utc ? 0x17 : 0x18, format.format(date).getBytes(StandardCharsets.US_ASCII));
    }
    private static byte[] oid(String value) {
        String[] parts = value.split("\\.");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        base128(out, Integer.parseInt(parts[0]) * 40L + Integer.parseInt(parts[1]));
        for (int i = 2; i < parts.length; i++) base128(out, Long.parseLong(parts[i]));
        return tag(0x06, out.toByteArray());
    }
    private static void base128(ByteArrayOutputStream out, long value) {
        int count = 1;
        for (long rest = value >>> 7; rest != 0; rest >>>= 7) count++;
        for (int i = count - 1; i >= 0; i--) out.write((int) ((value >>> (i * 7)) & 0x7f) | (i == 0 ? 0 : 0x80));
    }
    private static byte[] integer(BigInteger value) { return tag(0x02, value.toByteArray()); }
    private static byte[] bool(boolean value) { return tag(0x01, new byte[]{(byte) (value ? 0xff : 0)}); }
    private static byte[] sequence(byte[]... values) { return tag(0x30, concat(values)); }
    private static byte[] concat(byte[]... values) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (byte[] value : values) out.write(value, 0, value.length);
        return out.toByteArray();
    }
    private static byte[] tag(int tag, byte[] body) {
        ByteArrayOutputStream out = new ByteArrayOutputStream(); out.write(tag);
        if (body.length < 128) out.write(body.length);
        else {
            int bytes = 0;
            for (int size = body.length; size != 0; size >>>= 8) bytes++;
            out.write(0x80 | bytes);
            for (int i = bytes - 1; i >= 0; i--) out.write((body.length >>> (8 * i)) & 0xff);
        }
        out.write(body, 0, body.length); return out.toByteArray();
    }
}
