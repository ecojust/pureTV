package com.ecojust.putrtvstore;

import android.content.Context;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.Charset;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.regex.Pattern;

/** Downloads one immutable catalog APK into private storage, verifying every byte before use. */
public class StoreDownloader {
    public static final long MAX_APK_BYTES = 512L * 1024 * 1024;
    private static final long DISK_RESERVE_BYTES = 1024L * 1024;
    private static final long CACHE_RETENTION_MS = 24L * 60 * 60 * 1000;
    private static final Pattern SHA256 = Pattern.compile("[a-f0-9]{64}");
    private static final Pattern SHA1 = Pattern.compile("[a-f0-9]{40}");
    private static final Object CACHE_LOCK = new Object();

    public interface Progress {
        /** Called on the download worker thread. */
        void onProgress(long bytes, long total);
    }

    public enum Reason { INVALID_ENTRY, NO_SPACE, TRUNCATED, TOO_LARGE, HASH_MISMATCH, CACHE_IO }

    public static final class DownloadException extends IOException {
        public final Reason reason;

        DownloadException(Reason reason) {
            super(reason.name());
            this.reason = reason;
        }

        DownloadException(Reason reason, IOException cause) {
            super(reason.name(), cause);
            this.reason = reason;
        }
    }

    interface Source { InputStream open(StoreEntry entry, Cancellation cancellation) throws IOException; }
    interface Space { long available(File directory); }

    private final File privateRoot;
    private final Source source;
    private final Space space;

    public StoreDownloader(Context context) {
        this(context.getFilesDir(), StoreNetwork::openApk, File::getUsableSpace);
    }

    // The injected source and storage budget keep verification tests entirely offline.
    StoreDownloader(File privateRoot, Source source, Space space) {
        this.privateRoot = privateRoot;
        this.source = source;
        this.space = space;
    }

    public File download(StoreCatalog catalog, StoreEntry entry, Cancellation cancellation,
                         Progress progress) throws IOException {
        if (cancellation == null) throw new IllegalArgumentException("Cancellation is required");
        cancellation.check();
        validate(catalog, entry);
        // A second activity instance can survive configuration changes. Serialize cache publication
        // and cleanup across instances; temporary files still have unique, operation-owned names.
        synchronized (CACHE_LOCK) {
            cancellation.check();
            File directory = directory();
            String key = snapshotKey(entry);
            File complete = null;
            if (!entry.sha256.isEmpty()) {
                complete = child(directory, entry.sha256 + ".apk");
            } else if (key != null) {
                // A cache receipt binds the observed digest to this exact server generation.
                String[] names = directory.list();
                if (names != null) for (String name : names) {
                    if (name.matches(key + "-[a-f0-9]{64}\\.apk")) {
                        complete = child(directory, name);
                        break;
                    }
                }
            }
            if (complete != null && complete.exists()) {
                if (!complete.isFile()) throw new DownloadException(Reason.CACHE_IO);
                if (verify(complete, entry, cancellation)) {
                    complete.setLastModified(System.currentTimeMillis());
                    report(progress, entry.bytes, entry.bytes);
                    return complete;
                }
                if (!complete.delete()) throw new DownloadException(Reason.CACHE_IO);
            }
            cleanOldFiles(directory, complete);
            if (space.available(directory) < entry.bytes + DISK_RESERVE_BYTES) {
                throw new DownloadException(Reason.NO_SPACE);
            }
            File partial;
            try {
                partial = File.createTempFile("apk-", ".part", directory);
            } catch (IOException failure) {
                throw new DownloadException(Reason.CACHE_IO, failure);
            }
            try {
                MessageDigest sha256 = digest("SHA-256");
                MessageDigest blob = blobDigest(entry.bytes);
                long received = 0;
                report(progress, 0, entry.bytes);
                try (InputStream input = source.open(entry, cancellation);
                     FileOutputStream output = new FileOutputStream(partial)) {
                    byte[] buffer = new byte[64 * 1024];
                    while (true) {
                        cancellation.check();
                        int count = input.read(buffer);
                        if (count < 0) break;
                        if (count == 0) continue;
                        cancellation.check();
                        if (count > entry.bytes - received) {
                            throw new DownloadException(Reason.TOO_LARGE);
                        }
                        output.write(buffer, 0, count);
                        sha256.update(buffer, 0, count);
                        blob.update(buffer, 0, count);
                        received += count;
                        report(progress, received, entry.bytes);
                    }
                    cancellation.check();
                    if (received != entry.bytes) throw new DownloadException(Reason.TRUNCATED);
                    String actualHash = hex(sha256.digest());
                    if ((!entry.sha256.isEmpty() && !entry.sha256.equals(actualHash))
                            || (!entry.gitBlobSha.isEmpty() && !entry.gitBlobSha.equals(hex(blob.digest())))) {
                        throw new DownloadException(Reason.HASH_MISMATCH);
                    }
                    String prefix = entry.sha256.isEmpty() && key != null ? key + "-" : "";
                    complete = child(directory, prefix + actualHash + ".apk");
                    output.getFD().sync();
                }
                cancellation.check();
                if (!partial.renameTo(complete)) throw new DownloadException(Reason.CACHE_IO);
                return complete;
            } finally {
                // This operation never removes another operation's temporary file.
                if (partial.exists()) partial.delete();
            }
        }
    }

    private static void validate(StoreCatalog catalog, StoreEntry entry) throws IOException {
        if (catalog == null || entry == null || entry.bytes <= 0 || entry.bytes > MAX_APK_BYTES
                || !StoreNetwork.validApkPath(entry.apkPath) || entry.sha256 == null
                || (!entry.sha256.isEmpty() && !SHA256.matcher(entry.sha256).matches())
                || entry.gitBlobSha == null || (!entry.gitBlobSha.isEmpty() && !SHA1.matcher(entry.gitBlobSha).matches())) {
            throw new DownloadException(Reason.INVALID_ENTRY);
        }
    }

    static String snapshotKey(StoreEntry entry) {
        if (entry.sha256.isEmpty() && !StoreNetwork.strongEtag(entry.etag)
                && !StoreNetwork.validModified(entry.lastModified)) return null;
        String identity = entry.apkPath + "\n" + entry.bytes + "\n" + entry.sha256
                + "\n" + entry.etag + "\n" + entry.lastModified;
        return hex(digest("SHA-256").digest(identity.getBytes(Charset.forName("UTF-8"))));
    }

    private File directory() throws IOException {
        File root = privateRoot.getCanonicalFile();
        if (!root.isDirectory() && !root.mkdirs()) throw new DownloadException(Reason.CACHE_IO);
        File directory = child(root, "store-downloads");
        if (!directory.isDirectory() && !directory.mkdir()) throw new DownloadException(Reason.CACHE_IO);
        return directory;
    }

    private static File child(File directory, String name) throws IOException {
        File child = new File(directory, name);
        if (!child.getCanonicalFile().equals(new File(directory.getCanonicalFile(), name))) {
            throw new DownloadException(Reason.CACHE_IO);
        }
        return child;
    }

    private static boolean verify(File file, StoreEntry entry, Cancellation cancellation) throws IOException {
        if (file.length() != entry.bytes) return false;
        MessageDigest sha256 = digest("SHA-256");
        MessageDigest blob = blobDigest(entry.bytes);
        long total = 0;
        try (InputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[64 * 1024];
            int count;
            while ((count = input.read(buffer)) != -1) {
                cancellation.check();
                if (count > entry.bytes - total) return false;
                sha256.update(buffer, 0, count);
                blob.update(buffer, 0, count);
                total += count;
            }
        }
        cancellation.check();
        String hash = hex(sha256.digest());
        return total == entry.bytes && file.getName().endsWith(hash + ".apk")
                && (entry.sha256.isEmpty() || entry.sha256.equals(hash))
                && (entry.gitBlobSha.isEmpty() || entry.gitBlobSha.equals(hex(blob.digest())));
    }

    private static void cleanOldFiles(File directory, File current) throws IOException {
        File[] files = directory.listFiles();
        if (files == null) return;
        long cutoff = System.currentTimeMillis() - CACHE_RETENTION_MS;
        for (File file : files) {
            String name = file.getName();
            if (file.equals(current) || !file.isFile() || file.lastModified() <= 0
                    || file.lastModified() >= cutoff) continue;
            if (!name.matches("(?:[a-f0-9]{64}-)?[a-f0-9]{64}\\.apk") && !name.matches("apk-[A-Za-z0-9-]+\\.part")) continue;
            // Leave unexpected links and unrelated application files untouched.
            if (file.getCanonicalFile().equals(new File(directory.getCanonicalFile(), name))) file.delete();
        }
    }

    private static MessageDigest blobDigest(long bytes) {
        MessageDigest digest = digest("SHA-1");
        digest.update(("blob " + bytes + "\0").getBytes(Charset.forName("US-ASCII")));
        return digest;
    }

    private static MessageDigest digest(String algorithm) {
        try {
            return MessageDigest.getInstance(algorithm);
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(algorithm + " is required by Android", impossible);
        }
    }

    private static String hex(byte[] bytes) {
        char[] digits = "0123456789abcdef".toCharArray();
        char[] result = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            result[i * 2] = digits[(bytes[i] & 255) >>> 4];
            result[i * 2 + 1] = digits[bytes[i] & 15];
        }
        return new String(result);
    }

    private static void report(Progress progress, long bytes, long total) {
        if (progress != null) progress.onProgress(bytes, total);
    }
}
