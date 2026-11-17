import com.ecojust.gamekit.WifiControllerServer;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.Executors;

/** Test-only desktop JVM adapter. Real production TCP server, no Android or NSD claim. */
public final class WifiWireHarness {
    public static void main(String[] args) throws Exception {
        Path assets = Path.of(args[0]).toAbsolutePath().normalize();
        WifiControllerServer controller = new WifiControllerServer();
        int tcpPort = controller.start(0);
        HttpServer http = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 8);
        http.setExecutor(Executors.newCachedThreadPool(task -> { Thread t = new Thread(task); t.setDaemon(true); return t; }));
        http.createContext("/", exchange -> {
            String route = exchange.getRequestURI().getPath();
            byte[] body;
            int code = 200;
            String type = "application/json; charset=utf-8";
            if (!exchange.getRequestMethod().equals("GET")) { code = 405; body = new byte[0]; }
            else if (route.equals("/favicon.ico")) { code = 204; body = new byte[0]; }
            else if (route.equals("/__wifi/snapshot")) body = controller.snapshot().getBytes(StandardCharsets.UTF_8);
            else {
                String name = route.equals("/") ? "tv.html" : route.substring(1);
                if (!name.matches("[A-Za-z0-9][A-Za-z0-9_.-]*") || !Files.isRegularFile(assets.resolve(name))) { code = 404; body = new byte[0]; }
                else {
                    body = Files.readAllBytes(assets.resolve(name));
                    type = name.endsWith(".html") ? "text/html; charset=utf-8" : name.endsWith(".css") ? "text/css; charset=utf-8" : name.endsWith(".js") ? "text/javascript; charset=utf-8" : name.endsWith(".json") ? "application/json; charset=utf-8" : "application/octet-stream";
                }
            }
            exchange.getResponseHeaders().set("Content-Type", type);
            exchange.getResponseHeaders().set("Cache-Control", "no-store");
            exchange.sendResponseHeaders(code, body.length == 0 ? -1 : body.length);
            try (var out = exchange.getResponseBody()) { out.write(body); }
        });
        http.start();
        Runtime.getRuntime().addShutdownHook(new Thread(() -> { http.stop(0); controller.stop(); }));
        System.out.println("{\"tcpPort\":" + tcpPort + ",\"httpPort\":" + http.getAddress().getPort() + "}");
        System.out.flush();
        while (System.in.read() != -1) { }
        http.stop(0); controller.stop();
    }
}
