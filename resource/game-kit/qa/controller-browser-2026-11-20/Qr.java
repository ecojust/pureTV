import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.common.HybridBinarizer;
import com.google.zxing.qrcode.QRCodeReader;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.Collections;
import javax.imageio.ImageIO;

public class Qr {
    private static final int SIZE = 320;

    /** Same writer and margin as MainActivity. ImageIO supplies the desktop PNG encoding. */
    private static String encode(String room) throws Exception {
        BitMatrix bits = new MultiFormatWriter().encode(room, BarcodeFormat.QR_CODE, SIZE, SIZE,
            Collections.singletonMap(EncodeHintType.MARGIN, 3));
        BufferedImage image = new BufferedImage(SIZE, SIZE, BufferedImage.TYPE_BYTE_BINARY);
        for (int y = 0; y < SIZE; y++) {
            for (int x = 0; x < SIZE; x++) {
                image.setRGB(x, y, bits.get(x, y) ? 0xff000000 : 0xffffffff);
            }
        }
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        ImageIO.write(image, "png", stream);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(stream.toByteArray());
    }

    private static String decode() throws Exception {
        byte[] bytes = Base64.getDecoder().decode(System.in.readAllBytes());
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(bytes));
        int width = image.getWidth();
        int height = image.getHeight();
        int[] pixels = image.getRGB(0, 0, width, height, null, 0, width);
        RGBLuminanceSource rgb = new RGBLuminanceSource(width, height, pixels);
        return new QRCodeReader().decode(new BinaryBitmap(new HybridBinarizer(rgb))).getText();
    }

    public static void main(String[] args) throws Exception {
        System.out.print(args.length == 0 ? decode() : encode(args[0]));
    }
}
