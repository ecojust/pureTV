package com.ecojust.hifinitv;

import android.graphics.Bitmap;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.EnumMap;
import java.util.Map;

/** Encodes the current media address locally, without changing or retaining signed URL parameters. */
final class AudioUrlQrCode {
    private static final int MAX_URL_CHARACTERS = 8192;
    private static final int MAX_PIXELS = 2048;
    private static final int QUIET_ZONE_MODULES = 4;

    private AudioUrlQrCode() { }

    /** URL validation is separate from QR capacity so the UI can still offer the complete address. */
    static boolean isSupported(String url) {
        if (url == null || url.isEmpty() || url.length() > MAX_URL_CHARACTERS) return false;
        for (int i = 0; i < url.length(); i++) {
            char character = url.charAt(i);
            if (Character.isISOControl(character)) return false;
            if (Character.isHighSurrogate(character)) {
                if (i + 1 >= url.length() || !Character.isLowSurrogate(url.charAt(++i))) return false;
            } else if (Character.isLowSurrogate(character)) {
                return false;
            }
        }
        try {
            URI uri = new URI(url).parseServerAuthority();
            return "https".equalsIgnoreCase(uri.getScheme())
                    && uri.getHost() != null && !uri.getHost().isEmpty()
                    && uri.getRawUserInfo() == null && uri.getPort() <= 65535;
        } catch (URISyntaxException invalidUrl) {
            return false;
        }
    }

    /**
     * Returns an exact-size square, or null for unsupported URLs, excessive payloads, or a size that
     * cannot contain the QR's complete modules and quiet zone. Sizes above 2048 pixels are rejected.
     */
    static Bitmap encode(String url, int size) {
        if (!isSupported(url) || size < 21 + 2 * QUIET_ZONE_MODULES || size > MAX_PIXELS) return null;
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, QUIET_ZONE_MODULES);
        // Keep medium error correction; dense URLs should use the full-text fallback instead of
        // sacrificing scan resilience to squeeze a larger payload into a QR code.
        hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
        try {
            // ZXing uses integer-size modules. It enlarges undersized requests, so reject those
            // results instead of stretching or clipping a dense code into the available area.
            BitMatrix matrix = new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, size, size, hints);
            if (matrix.getWidth() != size || matrix.getHeight() != size) return null;
            int[] colors = new int[size * size];
            for (int y = 0; y < size; y++) {
                for (int x = 0; x < size; x++) {
                    colors[y * size + x] = matrix.get(x, y) ? 0xff000000 : 0xffffffff;
                }
            }
            return Bitmap.createBitmap(colors, size, size, Bitmap.Config.ARGB_8888);
        } catch (WriterException | IllegalArgumentException unsupportedPayload) {
            // A valid media URL may exceed QR capacity; its full text remains available in UI.
            return null;
        }
    }
}
