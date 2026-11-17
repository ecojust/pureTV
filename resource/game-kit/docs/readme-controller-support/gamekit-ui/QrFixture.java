import com.google.zxing.*;
import com.google.zxing.common.BitMatrix;
import java.awt.image.BufferedImage;
import java.io.File;
import javax.imageio.ImageIO;
public class QrFixture {
 public static void main(String[] args) throws Exception {
  BitMatrix bits=new MultiFormatWriter().encode("http://192.168.1.50:8123/?room=ui-fixture",BarcodeFormat.QR_CODE,320,320);
  BufferedImage image=new BufferedImage(320,320,BufferedImage.TYPE_INT_RGB);
  for(int y=0;y<320;y++)for(int x=0;x<320;x++)image.setRGB(x,y,bits.get(x,y)?0:0xffffff);
  ImageIO.write(image,"png",new File(args[0]));
 }
}
