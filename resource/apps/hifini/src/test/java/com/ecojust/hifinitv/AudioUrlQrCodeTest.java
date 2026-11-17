package com.ecojust.hifinitv;

import android.graphics.Bitmap;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.ResultMetadataType;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class AudioUrlQrCodeTest {
    @Test public void actualBitmapsPreserveSignedQueriesAndUnicodeExactly() throws Exception {
        String[] urls = {
                "https://cdn.example.test/track.m4a?token=a%2Fb%2Bc%3D&expires=1792886400",
                "https://cdn.example.test/音乐/夜曲.m4a?name=夜曲🎵&token=Ab%2fCd%2B%3d"
                        + "&query=a+b;c:@/?x%3F%23&repeat=1&repeat=2&empty=&flag",
                "HTTPS://cdn.example.test:8443/audio?signature=%252F%2F%2b+&order=z&order=a"
        };
        for (String url : urls) {
            assertTrue(AudioUrlQrCode.isSupported(url));
            for (int size : new int[]{192, 480}) {
                Bitmap bitmap = AudioUrlQrCode.encode(url, size);
                assertNotNull(bitmap);
                try {
                    assertEquals(size, bitmap.getWidth());
                    assertEquals(size, bitmap.getHeight());
                    Result decoded = decode(bitmap);
                    assertEquals(url, decoded.getText());
                    assertEquals("M", decoded.getResultMetadata().get(ResultMetadataType.ERROR_CORRECTION_LEVEL));
                    assertQuietZoneAndOpaqueModules(bitmap);
                } finally {
                    bitmap.recycle();
                }
            }
        }
    }

    @Test public void compactQrIsNeverCroppedOrScaledBelowWholeModules() throws Exception {
        String url = "https://cdn.example.test/audio?token=" + "a".repeat(160);
        assertTrue(AudioUrlQrCode.isSupported(url));
        assertNull(AudioUrlQrCode.encode(url, 40));
        Bitmap bitmap = AudioUrlQrCode.encode(url, 480);
        assertNotNull(bitmap);
        try {
            assertEquals(url, decode(bitmap).getText());
            assertQuietZoneAndOpaqueModules(bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    @Test public void denseUrlsUseFullTextInsteadOfLoweringErrorCorrection() {
        String url = "https://cdn.example.test/audio?token=" + "a".repeat(2500);
        assertTrue(AudioUrlQrCode.isSupported(url));
        assertNull(AudioUrlQrCode.encode(url, 768));
        assertNull(AudioUrlQrCode.encode(url, 1024));
    }

    @Test public void longUrlsWithinMediumCorrectionCapacityRemainNormallyScannable() throws Exception {
        String url = "https://cdn.example.test/audio?token=" + "a".repeat(1500);
        Bitmap bitmap = AudioUrlQrCode.encode(url, 768);
        assertNotNull(bitmap);
        try {
            Result decoded = decode(bitmap);
            assertEquals(url, decoded.getText());
            assertEquals("M", decoded.getResultMetadata().get(ResultMetadataType.ERROR_CORRECTION_LEVEL));
            assertQuietZoneAndOpaqueModules(bitmap);
        } finally {
            bitmap.recycle();
        }
    }

    @Test public void validUrlsBeyondQrCapacityRemainAvailableAsText() {
        String url = "https://cdn.example.test/audio?token=" + "a".repeat(4000);
        assertTrue(AudioUrlQrCode.isSupported(url));
        assertNull(AudioUrlQrCode.encode(url, 1024));
        String oversized = "https://cdn.example.test/audio?token=" + "a".repeat(8192);
        assertFalse(AudioUrlQrCode.isSupported(oversized));
        assertNull(AudioUrlQrCode.encode(oversized, 480));
    }

    @Test public void rejectsCredentialsControlsInvalidAddressesAndOtherProtocols() {
        String[] invalid = {
                null, "", " ", "https://", "https:///track.mp3", "/track.mp3", "//cdn.example.test/track.mp3",
                "http://cdn.example.test/track.mp3", "file:///track.mp3", "content://media/track",
                "https://user:password@cdn.example.test/track.mp3", "https://user@cdn.example.test/track.mp3",
                "https://%75ser:%70ass@cdn.example.test/track.mp3", "https://@cdn.example.test/track.mp3",
                "https://cdn.example.test:65536/track.mp3", "https://cdn.example.test:notaport/track.mp3",
                "https://cdn.example.test/track.mp3?token=%GG", "https://cdn.example.test/a b.mp3",
                " https://cdn.example.test/track.mp3", "https://cdn.example.test/track.mp3\n",
                "https://cdn.example.test/track.mp3?token=a\rb", "https://cdn.example.test/track.mp3?token=a\u0000b",
                "https://cdn.example.test/track.mp3?token=a\u0085b", "https://cdn.example.test/track.mp3?token=\uD800",
                "https://cdn.example.test/track.mp3?token=\uDC00"
        };
        for (String url : invalid) {
            assertFalse(AudioUrlQrCode.isSupported(url));
            assertNull(AudioUrlQrCode.encode(url, 480));
        }
    }

    @Test public void invalidOrExcessiveBitmapSizesReturnNull() {
        String url = "https://cdn.example.test/track.mp3";
        for (int size : new int[]{Integer.MIN_VALUE, -1, 0, 1, 28, 2049, Integer.MAX_VALUE}) {
            assertNull(AudioUrlQrCode.encode(url, size));
        }
    }

    private static Result decode(Bitmap bitmap) throws Exception {
        int width = bitmap.getWidth(), height = bitmap.getHeight();
        int[] pixels = new int[width * height];
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
        return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(width, height, pixels))));
    }

    private static void assertQuietZoneAndOpaqueModules(Bitmap bitmap) {
        int size = bitmap.getWidth();
        int[] colors = new int[size * size];
        bitmap.getPixels(colors, 0, size, 0, 0, size, size);
        int firstX = -1, firstY = -1;
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                int color = colors[y * size + x];
                assertTrue(color == 0xff000000 || color == 0xffffffff);
                if (firstX < 0 && color == 0xff000000) {
                    firstX = x;
                    firstY = y;
                }
            }
        }
        assertTrue(firstX >= 4 && firstY >= 4);
        int finderWidth = 0;
        while (firstX + finderWidth < size && colors[firstY * size + firstX + finderWidth] == 0xff000000) finderWidth++;
        assertEquals(0, finderWidth % 7);
        int moduleSize = finderWidth / 7;
        assertTrue(moduleSize >= 1);
        int quietZone = 4 * moduleSize;
        assertTrue(firstX >= quietZone && firstY >= quietZone);
        for (int y = 0; y < size; y++) {
            for (int x = 0; x < size; x++) {
                if (x < quietZone || y < quietZone || x >= size - quietZone || y >= size - quietZone) {
                    assertEquals(0xffffffff, colors[y * size + x]);
                }
            }
        }
    }
}
