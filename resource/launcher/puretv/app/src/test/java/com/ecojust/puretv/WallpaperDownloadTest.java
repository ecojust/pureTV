package com.ecojust.puretv;

import org.junit.Test;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import static org.junit.Assert.*;

public class WallpaperDownloadTest {
    private static final int LIMIT = 4 * 1024 * 1024;

    @Test public void preservesResponseBytes() {
        byte[] data = {0, 1, -1, 42};
        assertArrayEquals(data, Wallpaper.readBytes(new ByteArrayInputStream(data)));
    }

    @Test public void acceptsResponseAtSizeLimit() {
        byte[] data = new byte[LIMIT];
        data[LIMIT - 1] = 42;
        assertArrayEquals(data, Wallpaper.readBytes(new ByteArrayInputStream(data)));
    }

    @Test public void rejectsOversizedResponseWithoutContentLength() {
        final int[] read = {0};
        InputStream unlimited = new InputStream() {
            @Override public int read() { read[0]++; return 1; }
            @Override public int read(byte[] bytes, int off, int len) {
                read[0] += len;
                return len;
            }
        };
        assertNull(Wallpaper.readBytes(unlimited));
        assertTrue("must stop reading when the size limit is exceeded", read[0] <= LIMIT + 16384);
    }

    @Test public void handlesInterruptedResponse() {
        InputStream broken = new InputStream() {
            @Override public int read() throws IOException { throw new IOException("disconnected"); }
        };
        assertNull(Wallpaper.readBytes(broken));
    }
}
