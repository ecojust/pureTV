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
public class RegistrationQrCodeTest {
    @Test public void actualBitmapsDecodeToTheOfficialRegistrationPageAtRecommendedSizes() throws Exception {
        for (int size : new int[]{128, 192, 256, 320, 512}) {
            Bitmap bitmap = RegistrationQrCode.create(size);
            assertEquals(size, bitmap.getWidth()); assertEquals(size, bitmap.getHeight());
            Result result = decode(bitmap);
            assertEquals("https://www.hifini.net/user-create.htm", result.getText());
            assertEquals("M", result.getResultMetadata().get(ResultMetadataType.ERROR_CORRECTION_LEVEL));
            assertOpaqueBlackAndWhite(bitmap);
            bitmap.recycle();
        }
    }

    @Test public void invalidOrExcessiveRequestsRemainBoundedAndScannable() throws Exception {
        for (int requested : new int[]{Integer.MIN_VALUE, 0, 1, Integer.MAX_VALUE}) {
            Bitmap bitmap = RegistrationQrCode.create(requested);
            assertTrue(bitmap.getWidth() >= 128); assertTrue(bitmap.getWidth() <= 1024);
            assertEquals("https://www.hifini.net/user-create.htm", decode(bitmap).getText());
            bitmap.recycle();
        }
    }

    private static Result decode(Bitmap bitmap) throws Exception {
        int width = bitmap.getWidth(), height = bitmap.getHeight();
        int[] pixels = new int[width * height];
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
        return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(width, height, pixels))));
    }

    private static void assertOpaqueBlackAndWhite(Bitmap bitmap) {
        int width = bitmap.getWidth(), height = bitmap.getHeight();
        int[] colors = new int[width * height];
        bitmap.getPixels(colors, 0, width, 0, 0, width, height);
        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                int color = colors[y * width + x];
                assertTrue(color == 0xff000000 || color == 0xffffffff);
                if (x < 4 || y < 4 || x >= width - 4 || y >= height - 4) assertEquals(0xffffffff, color);
            }
        }
    }
}
