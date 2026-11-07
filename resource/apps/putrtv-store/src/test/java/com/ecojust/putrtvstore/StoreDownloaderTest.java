package com.ecojust.putrtvstore;

import static org.junit.Assert.*;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

public class StoreDownloaderTest {
    private static final String REVISION = "1234567890abcdef1234567890abcdef12345678";
    private static final String PATH = "resource/apps/example/example-1.0.0.apk";
    private static final byte[] APK = "verified APK fixture".getBytes(StandardCharsets.US_ASCII);
    @Rule public TemporaryFolder temporary = new TemporaryFolder();

    @Test public void verifiesBothHashesAndOnlyRequestsPinnedCommit() throws Exception {
        File root = temporary.newFolder();
        AtomicInteger calls = new AtomicInteger();
        List<Long> progress = new ArrayList<>();
        StoreDownloader downloader = new StoreDownloader(root, (url, cancellation) -> {
            calls.incrementAndGet();
            assertEquals("https://raw.githubusercontent.com/ecojust/pureTV/" + REVISION + "/" + PATH,
                    url.toExternalForm());
            return new ByteArrayInputStream(APK);
        }, directory -> Long.MAX_VALUE);
        StoreEntry entry = entry(APK, PATH);
        File result = downloader.download(catalog(REVISION), entry, new Cancellation(),
                (bytes, total) -> { assertEquals(APK.length, total); progress.add(bytes); });
        assertTrue(result.isFile());
        assertEquals(new File(root, "store-downloads/" + entry.sha256 + ".apk"), result);
        assertArrayEquals(APK, read(result));
        assertEquals(Long.valueOf(0), progress.get(0));
        assertEquals(Long.valueOf(APK.length), progress.get(progress.size() - 1));
        assertEquals(1, calls.get());
        assertEquals(result, downloader.download(catalog(REVISION), entry, new Cancellation(), null));
        assertEquals("Verified cache must avoid another network request", 1, calls.get());
        assertNoPartial(root);
    }

    @Test public void corruptedSameLengthCacheIsDownloadedAgain() throws Exception {
        File root = temporary.newFolder();
        StoreEntry entry = entry(APK, PATH);
        File directory = new File(root, "store-downloads");
        assertTrue(directory.mkdir());
        byte[] corrupted = APK.clone();
        corrupted[0] ^= 1;
        write(new File(directory, entry.sha256 + ".apk"), corrupted);
        AtomicInteger calls = new AtomicInteger();
        StoreDownloader downloader = new StoreDownloader(root, (url, cancellation) -> {
            calls.incrementAndGet();
            return new ByteArrayInputStream(APK);
        }, directoryArg -> Long.MAX_VALUE);
        assertArrayEquals(APK, read(downloader.download(catalog(REVISION), entry, new Cancellation(), null)));
        assertEquals(1, calls.get());
    }

    @Test public void rejectsTruncatedResponseAndRemovesOwnPartial() throws Exception {
        File root = temporary.newFolder();
        StoreDownloader downloader = source(root, new byte[] {1});
        expect(StoreDownloader.Reason.TRUNCATED,
                () -> downloader.download(catalog(REVISION), entry(APK, PATH), new Cancellation(), null));
        assertNoPartial(root);
        assertEquals(0, new File(root, "store-downloads").listFiles().length);
    }

    @Test public void rejectsOversizeResponseBeforeWritingExtraBytes() throws Exception {
        File root = temporary.newFolder();
        StoreDownloader downloader = source(root, new byte[APK.length + 1]);
        expect(StoreDownloader.Reason.TOO_LARGE,
                () -> downloader.download(catalog(REVISION), entry(APK, PATH), new Cancellation(), null));
        assertNoPartial(root);
    }

    @Test public void rejectsSha256Mismatch() throws Exception {
        byte[] wrong = APK.clone();
        wrong[wrong.length - 1] ^= 1;
        File root = temporary.newFolder();
        expect(StoreDownloader.Reason.HASH_MISMATCH, () -> source(root, wrong).download(
                catalog(REVISION), entry(APK, PATH), new Cancellation(), null));
        assertNoPartial(root);
    }

    @Test public void rejectsOrdinarySha1InPlaceOfGitBlobHash() throws Exception {
        File root = temporary.newFolder();
        StoreEntry entry = entry(APK, PATH, APK.length, sha("SHA-256", APK), sha("SHA-1", APK));
        expect(StoreDownloader.Reason.HASH_MISMATCH, () -> source(root, APK).download(
                catalog(REVISION), entry, new Cancellation(), null));
        assertNoPartial(root);
    }

    @Test public void rejectsUnboundedSizeAndUnsafeAddressesBeforeNetwork() throws Exception {
        File root = temporary.newFolder();
        StoreDownloader downloader = new StoreDownloader(root, (url, cancellation) -> {
            fail("Invalid metadata must not contact a server");
            return null;
        }, directory -> Long.MAX_VALUE);
        for (String revision : new String[] {"master", "../../master", REVISION + "?x=1", ""}) {
            expect(StoreDownloader.Reason.INVALID_ENTRY, () -> downloader.download(
                    catalog(revision), entry(APK, PATH), new Cancellation(), null));
        }
        for (String path : new String[] {"resource/apps/../example.apk", "/" + PATH,
                "https://evil.example/a.apk", PATH + "?foo=bar", PATH + "#fragment",
                "resource/apps/example/%2e%2e.apk", "resource/apps/example/a..apk"}) {
            expect(StoreDownloader.Reason.INVALID_ENTRY, () -> downloader.download(
                    catalog(REVISION), entry(APK, path), new Cancellation(), null));
        }
        for (long size : new long[] {-1, 0, StoreDownloader.MAX_APK_BYTES + 1, Long.MAX_VALUE}) {
            StoreEntry entry = entry(APK, PATH, size, sha("SHA-256", APK), gitBlob(APK));
            expect(StoreDownloader.Reason.INVALID_ENTRY, () -> downloader.download(
                    catalog(REVISION), entry, new Cancellation(), null));
        }
    }

    @Test public void checksFreeSpaceBeforeOpeningConnection() throws Exception {
        File root = temporary.newFolder();
        StoreDownloader downloader = new StoreDownloader(root, (url, cancellation) -> {
            fail("No space must fail before downloading");
            return null;
        }, directory -> APK.length);
        expect(StoreDownloader.Reason.NO_SPACE, () -> downloader.download(
                catalog(REVISION), entry(APK, PATH), new Cancellation(), null));
        assertNoPartial(root);
    }

    @Test public void cancellationDuringReadNeverPublishesFileOrDeletesUnrelatedPartial() throws Exception {
        File root = temporary.newFolder();
        File directory = new File(root, "store-downloads");
        assertTrue(directory.mkdir());
        File unrelated = new File(directory, "apk-other-operation.part");
        write(unrelated, new byte[] {7});
        Cancellation cancellation = new Cancellation();
        AtomicInteger closes = new AtomicInteger();
        StoreDownloader downloader = new StoreDownloader(root, (url, token) -> new ByteArrayInputStream(APK) {
            @Override public synchronized int read(byte[] buffer, int offset, int length) {
                int count = super.read(buffer, offset, length);
                cancellation.cancel();
                return count;
            }
            @Override public void close() throws IOException { closes.incrementAndGet(); super.close(); }
        }, directoryArg -> Long.MAX_VALUE);
        try {
            downloader.download(catalog(REVISION), entry(APK, PATH), cancellation, null);
            fail("Cancellation must fail the download");
        } catch (IOException expected) {
            assertTrue(cancellation.isCancelled());
        }
        assertEquals(1, closes.get());
        assertArrayEquals(new byte[] {7}, read(unrelated));
        assertEquals(1, directory.listFiles().length);
    }

    @Test public void networkFailureCleansPartialAndClosesStream() throws Exception {
        File root = temporary.newFolder();
        AtomicInteger closes = new AtomicInteger();
        StoreDownloader downloader = new StoreDownloader(root, (url, token) -> new InputStream() {
            @Override public int read() throws IOException { throw new IOException("offline fixture"); }
            @Override public void close() { closes.incrementAndGet(); }
        }, directory -> Long.MAX_VALUE);
        try {
            downloader.download(catalog(REVISION), entry(APK, PATH), new Cancellation(), null);
            fail("Network failure must not publish");
        } catch (IOException expected) {
            assertEquals("offline fixture", expected.getMessage());
        }
        assertEquals(1, closes.get());
        assertNoPartial(root);
    }

    @Test public void alreadyCancelledRequestDoesNotCreateFilesOrOpenNetwork() throws Exception {
        File root = temporary.newFolder();
        Cancellation cancellation = new Cancellation();
        cancellation.cancel();
        StoreDownloader downloader = new StoreDownloader(root, (url, token) -> {
            fail("Cancelled request must not open a connection");
            return null;
        }, directory -> Long.MAX_VALUE);
        try {
            downloader.download(catalog(REVISION), entry(APK, PATH), cancellation, null);
            fail("Cancelled request must not complete");
        } catch (IOException expected) {
            assertTrue(cancellation.isCancelled());
        }
        assertEquals(0, root.listFiles().length);
    }

    @Test public void refusesCacheDirectoryLinksOutsidePrivateRoot() throws Exception {
        File root = temporary.newFolder();
        File outside = temporary.newFolder();
        Files.createSymbolicLink(new File(root, "store-downloads").toPath(), outside.toPath());
        StoreDownloader downloader = new StoreDownloader(root, (url, token) -> {
            fail("A linked cache directory must not be used");
            return null;
        }, directory -> Long.MAX_VALUE);
        expect(StoreDownloader.Reason.CACHE_IO, () -> downloader.download(
                catalog(REVISION), entry(APK, PATH), new Cancellation(), null));
        assertEquals(0, outside.listFiles().length);
    }

    @Test public void removesOnlyOldKnownCacheFiles() throws Exception {
        File root = temporary.newFolder();
        File directory = new File(root, "store-downloads");
        assertTrue(directory.mkdir());
        File oldApk = new File(directory, String.join("", Collections.nCopies(64, "0")) + ".apk");
        File oldPartial = new File(directory, "apk-123456.part");
        File unrelated = new File(directory, "user-document.txt");
        File recent = new File(directory, String.join("", Collections.nCopies(64, "1")) + ".apk");
        for (File file : new File[] {oldApk, oldPartial, unrelated, recent}) write(file, new byte[] {1});
        for (File file : new File[] {oldApk, oldPartial, unrelated}) {
            assertTrue(file.setLastModified(System.currentTimeMillis() - 48L * 60 * 60 * 1000));
        }
        source(root, APK).download(catalog(REVISION), entry(APK, PATH), new Cancellation(), null);
        assertFalse(oldApk.exists());
        assertFalse(oldPartial.exists());
        assertTrue(unrelated.exists());
        assertTrue(recent.exists());
    }

    private StoreDownloader source(File root, byte[] data) {
        return new StoreDownloader(root, (url, cancellation) -> new ByteArrayInputStream(data),
                directory -> Long.MAX_VALUE);
    }

    private static StoreCatalog catalog(String revision) {
        return new StoreCatalog(revision, "test", "", 1, false, Collections.emptyList());
    }

    private static StoreEntry entry(byte[] bytes, String path) throws Exception {
        return entry(bytes, path, bytes.length, sha("SHA-256", bytes), gitBlob(bytes));
    }

    private static StoreEntry entry(byte[] bytes, String path, long size, String sha256, String blob) {
        return new StoreEntry("apps/example", "示例", "Example", "", "", "tools",
                "com.ecojust.example", "1.0.0", path, "", "", sha256,
                "eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23", blob, 1, size, 19);
    }

    private static String gitBlob(byte[] bytes) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-1");
        digest.update(("blob " + bytes.length + "\0").getBytes(StandardCharsets.US_ASCII));
        digest.update(bytes);
        return hex(digest.digest());
    }

    private static String sha(String algorithm, byte[] bytes) throws Exception {
        return hex(MessageDigest.getInstance(algorithm).digest(bytes));
    }

    private static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte value : bytes) result.append(String.format("%02x", value & 255));
        return result.toString();
    }

    private static void write(File path, byte[] bytes) throws IOException {
        try (FileOutputStream output = new FileOutputStream(path)) { output.write(bytes); }
    }

    private static byte[] read(File path) throws IOException {
        byte[] result = new byte[(int) path.length()];
        try (FileInputStream input = new FileInputStream(path)) {
            int count = input.read(result);
            assertEquals(result.length, count);
        }
        return result;
    }

    private static void assertNoPartial(File root) {
        File[] files = new File(root, "store-downloads").listFiles();
        if (files != null) for (File file : files) assertFalse(file.getName(), file.getName().endsWith(".part"));
    }

    interface Checked { void run() throws Exception; }

    private static void expect(StoreDownloader.Reason reason, Checked call) throws Exception {
        try {
            call.run();
            fail("Expected " + reason);
        } catch (StoreDownloader.DownloadException expected) {
            assertEquals(reason, expected.reason);
        }
    }
}
