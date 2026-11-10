package com.ecojust.operatv;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Context;
import android.content.pm.ProviderInfo;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.OpenableColumns;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowContentResolver;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.List;

import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class OperaImporterTest {
    private Context context;
    private FixtureProvider provider;
    private final Uri uri = Uri.parse("content://opera.import.fixture/document/1");

    @Before public void setup() throws Exception {
        context = RuntimeEnvironment.getApplication();
        provider = new FixtureProvider();
        provider.file = new File(context.getCacheDir(), "selected-document.fixture");
        provider.name = "京剧.m3u";
        provider.mime = "audio/x-mpegurl";
        ProviderInfo info = new ProviderInfo();
        info.authority = "opera.import.fixture";
        info.exported = true;
        info.grantUriPermissions = true;
        info.applicationInfo = context.getApplicationInfo();
        provider.attachInfo(context, info);
        ShadowContentResolver.registerProviderInternal("opera.import.fixture", provider);
    }

    private void bytes(String text) throws IOException { Files.write(provider.file.toPath(), text.getBytes(StandardCharsets.UTF_8)); }

    @Test public void selectedPlaylistIsReadAsBoundedTextWithoutGivingItsUrlsDocumentAccess() throws Exception {
        bytes("#EXTM3U\n#EXTINF:-1,京剧名段\nhttps://example.org/opera.mp4\n");
        List<OperaItem> items = OperaImporter.fromDocument(context, uri);
        assertEquals(1, items.size()); assertEquals("京剧名段", items.get(0).title);
        assertEquals("direct", items.get(0).kind);
        assertEquals("https://example.org/opera.mp4", items.get(0).uri);
    }

    @Test public void videoSelectionKeepsItsContentUriAndDoesNotCopyOrParseTheMovie() throws Exception {
        provider.mime = "video/mp4"; provider.name = "戏曲演出.mp4";
        bytes("fixture media bytes; actual decoding belongs to playback tests");
        List<OperaItem> items = OperaImporter.fromDocument(context, uri);
        assertEquals("document", items.get(0).kind);
        assertEquals(uri.toString(), items.get(0).uri);
        assertEquals("戏曲演出.mp4", items.get(0).title);
        assertEquals(1, provider.openCount);
    }

    @Test public void explicitUnsupportedMimeIsNotOverriddenByAnM3uFilename() throws Exception {
        provider.name = "fake.m3u"; provider.mime = "application/pdf";
        bytes("https://example.org/video.mp4");
        assertThrows(IOException.class, () -> OperaImporter.fromDocument(context, uri));
        assertEquals(0, provider.openCount);
    }

    @Test public void permissionLossFailsRatherThanCreatingABrokenImportedEntry() throws Exception {
        provider.mime = "video/mp4"; provider.name = "movie.mp4"; provider.denied = true;
        assertThrows(IOException.class, () -> OperaImporter.fromDocument(context, uri));
        assertThrows(IOException.class, () -> OperaImporter.fromDocument(context, Uri.parse("file:///sdcard/movie.mp4")));
    }

    @Test public void localHlsSegmentsAndOversizedDeclaredFilesAreRejectedBeforeStorage() throws Exception {
        bytes("#EXTM3U\n#EXT-X-TARGETDURATION:5\n#EXTINF:5,\nsegment.ts\n#EXT-X-ENDLIST");
        assertThrows(IOException.class, () -> OperaImporter.fromDocument(context, uri));
        provider.declaredSize = PlaylistParser.MAX_BYTES + 1L;
        provider.openCount = 0;
        assertThrows(IOException.class, () -> OperaImporter.fromDocument(context, uri));
        assertEquals(0, provider.openCount);
    }

    @Test public void unknownFileSizeCannotBypassByteLimitAndMalformedUtf8IsRejected() {
        assertThrows(IOException.class, () -> OperaImporter.readUtf8(new ByteArrayInputStream(new byte[PlaylistParser.MAX_BYTES + 1])));
        assertThrows(IOException.class, () -> OperaImporter.readUtf8(new ByteArrayInputStream(new byte[]{(byte) 0xc3, 0x28})));
    }

    @Test(timeout = 5000) public void readDeadlineClosesAWaitingStreamInsteadOfWaitingForItsNextByte() {
        BlockingStream stream = new BlockingStream();
        IOException error = assertThrows(IOException.class, () -> OperaImporter.readUtf8(stream, 50));
        assertTrue(error.getMessage(), error.getMessage().contains("timed out") || error.getMessage().contains("超时"));
        assertTrue(stream.closed);
    }

    private static final class BlockingStream extends InputStream {
        volatile boolean closed;
        @Override public synchronized int read(byte[] bytes, int offset, int length) throws IOException {
            while (!closed) {
                try { wait(); }
                catch (InterruptedException cancelled) { Thread.currentThread().interrupt(); throw new IOException("cancelled", cancelled); }
            }
            throw new IOException("closed");
        }
        @Override public int read() throws IOException { return read(new byte[1], 0, 1); }
        @Override public synchronized void close() { closed = true; notifyAll(); }
    }

    public static final class FixtureProvider extends ContentProvider {
        File file; String name, mime; boolean denied; int openCount; long declaredSize = -1;
        @Override public boolean onCreate() { return true; }
        @Override public String getType(Uri uri) { return mime; }
        @Override public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sortOrder) {
            if (denied) throw new SecurityException("Fixture read grant was revoked");
            MatrixCursor cursor = new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE});
            cursor.addRow(new Object[]{name, declaredSize >= 0 ? declaredSize : file.length()});
            return cursor;
        }
        @Override public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
            if (denied) throw new SecurityException("Fixture read grant was revoked");
            openCount++;
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        }
        @Override public Uri insert(Uri uri, ContentValues values) { throw new UnsupportedOperationException(); }
        @Override public int delete(Uri uri, String selection, String[] args) { throw new UnsupportedOperationException(); }
        @Override public int update(Uri uri, ContentValues values, String selection, String[] args) { throw new UnsupportedOperationException(); }
    }
}
