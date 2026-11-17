package com.ecojust.hifinitv;

import android.graphics.Bitmap;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.util.EnumMap;
import java.util.Map;

/** A local QR code for the public registration page; it never contains account information. */
final class RegistrationQrCode {
    private RegistrationQrCode() { }

    static Bitmap create(int requestedPixels) {
        int pixels = Math.max(128, Math.min(1024, requestedPixels));
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        hints.put(EncodeHintType.MARGIN, 4);
        try {
            // QRCodeWriter scales whole modules by an integer and centers any spare white pixels.
            BitMatrix matrix = new QRCodeWriter().encode(HifiniSession.REGISTER,
                    BarcodeFormat.QR_CODE, pixels, pixels, hints);
            int width = matrix.getWidth(), height = matrix.getHeight();
            int[] colors = new int[width * height];
            for (int y = 0; y < height; y++) {
                for (int x = 0; x < width; x++) colors[y * width + x] = matrix.get(x, y) ? 0xff000000 : 0xffffffff;
            }
            return Bitmap.createBitmap(colors, width, height, Bitmap.Config.ARGB_8888);
        } catch (WriterException invalidStaticAddress) {
            throw new IllegalStateException("Could not encode the official registration page", invalidStaticAddress);
        }
    }
}
