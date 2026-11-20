import com.ecojust.gamekit.LanGameServer;
import com.ecojust.gamekit.WifiControllerServer;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import com.sun.net.httpserver.HttpServer;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.concurrent.Executors;
import java.util.Map;
import javax.imageio.ImageIO;
import org.json.JSONArray;
import org.json.JSONObject;

/** Loopback substitute for the Android WebView bridge. Both input servers are production classes. */
public class Host {
    // Same encoder, dimensions and quiet zone as MainActivity.qrData().
    static String qrData(String url) throws Exception {
        var bits = new MultiFormatWriter().encode(url, BarcodeFormat.QR_CODE, 320, 320, Map.of(EncodeHintType.MARGIN, 3));
        var image = new BufferedImage(320, 320, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < 320; y++) {
            for (int x = 0; x < 320; x++) image.setRGB(x, y, bits.get(x, y) ? 0 : 0xffffff);
        }
        var bytes = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", bytes);
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(bytes.toByteArray());
    }

    static String decode(File file, String[] args) throws Exception {
        var image = ImageIO.read(file);
        if (args.length == 6) image = image.getSubimage(Integer.parseInt(args[2]), Integer.parseInt(args[3]), Integer.parseInt(args[4]), Integer.parseInt(args[5]));
        int w = image.getWidth(), h = image.getHeight();
        var pixels = new RGBLuminanceSource(w, h, image.getRGB(0, 0, w, h, null, 0, w));
        return new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(pixels))).getText();
    }

    public static void main(String[] args) throws Exception {
        if (args[0].equals("decode")) {
            System.out.println(decode(new File(args[1]), args));
            return;
        }
        var assets = Path.of(args[0]).toRealPath();
        try (var phone = new LanGameServer(name -> Files.newInputStream(assets.resolve(name)));
             var wifi = new WifiControllerServer()) {
            var room = "http://127.0.0.1:" + phone.start() + "/?room=" + phone.roomToken();
            int tcpPort = wifi.start();
            var controller = new JSONObject().put("serviceName", "SDK test").put("state", "active")
                    .put("port", tcpPort).put("addresses", new JSONArray().put("127.0.0.1"));
            var info = new JSONObject().put("url", room).put("qr", qrData(room))
                    .put("language", "zh").put("wifiController", controller).toString();
            var web = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 10);
            var workers = Executors.newFixedThreadPool(8);
            web.setExecutor(workers);
            web.createContext("/", request -> {
                try {
                    byte[] body;
                    String type = "application/json";
                    switch (request.getRequestURI().getPath()) {
                        case "/frame" -> {
                            // Match MainActivity.HostBridge.snapshot(): prefer a live firmware seat.
                            String sample = wifi.snapshot();
                            if (new JSONObject(sample).optInt("connections") == 0) sample = phone.snapshot();
                            body = sample.getBytes(StandardCharsets.UTF_8);
                        }
                        case "/room" -> body = info.getBytes(StandardCharsets.UTF_8);
                        default -> {
                            String name = request.getRequestURI().getPath().substring(1);
                            Path file = assets.resolve(name).normalize();
                            if (!file.startsWith(assets) || !Files.isRegularFile(file)) {
                                request.sendResponseHeaders(404, -1);
                                return;
                            }
                            String mime = Files.probeContentType(file);
                            if (name.endsWith(".js") || name.endsWith(".mjs")) mime = "application/javascript";
                            if (name.endsWith(".wasm")) mime = "application/wasm";
                            request.getResponseHeaders().set("Content-Type", mime == null ? "application/octet-stream" : mime);
                            request.sendResponseHeaders(200, Files.size(file));
                            Files.copy(file, request.getResponseBody());
                            return;
                        }
                    }
                    request.getResponseHeaders().set("Content-Type", type);
                    request.getResponseHeaders().set("Cache-Control", "no-store");
                    request.sendResponseHeaders(200, body.length);
                    request.getResponseBody().write(body);
                } catch (org.json.JSONException error) {
                    throw new IllegalStateException(error);
                } finally {
                    request.close();
                }
            });
            web.start();
            try {
                String url = "http://127.0.0.1:" + web.getAddress().getPort() + "/tv.html";
                System.out.println(new JSONObject().put("tv", url).put("room", room).put("wifi", tcpPort));
                System.out.flush();
                System.in.read();
            } finally {
                web.stop(0);
                workers.shutdownNow();
            }
        }
    }
}
