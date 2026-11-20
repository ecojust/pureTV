import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Objects;

/** Relays a TV browser's usual Android bridge calls to the original server class. */
public class ActualPhoneRoom {
    private static Path assets;
    private static Path overlay;

    private static Path file(String name) throws IOException {
        Path relative = Path.of(name).normalize();
        if (relative.isAbsolute() || relative.startsWith("..")) {
            throw new IOException("Invalid asset path");
        }
        Path replacement = overlay.resolve(relative);
        return Files.isRegularFile(replacement) ? replacement : assets.resolve(relative);
    }

    private static String contentType(String name, Path path) throws IOException {
        if (name.endsWith(".js")) return "text/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".html")) return "text/html";
        return Objects.toString(Files.probeContentType(path), "application/octet-stream");
    }

    private static void respond(HttpExchange exchange, Object room, Method snapshot, Method publish)
            throws IOException {
        String name = exchange.getRequestURI().getPath().substring(1);
        try {
            byte[] body;
            String type = "application/json";
            if (name.equals("__snapshot")) {
                body = ((String) snapshot.invoke(room)).getBytes(StandardCharsets.UTF_8);
            } else if (name.equals("__publish")) {
                String status = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
                publish.invoke(room, status);
                body = "{}".getBytes(StandardCharsets.UTF_8);
            } else {
                Path path = file(name.isEmpty() ? "tv.html" : name);
                body = Files.readAllBytes(path);
                type = contentType(name, path);
            }
            exchange.getResponseHeaders().set("Content-Type", type);
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
        } catch (ReflectiveOperationException | IOException e) {
            exchange.sendResponseHeaders(404, -1);
        } finally {
            exchange.close();
        }
    }

    public static void main(String[] args) throws Exception {
        assets = Path.of(args[1]);
        overlay = Path.of(args[2]);
        Class<?> serverClass = Class.forName(args[0] + ".LanGameServer");
        Class<?> assetSource = Class.forName(serverClass.getName() + "$AssetSource");
        Object accessor = Proxy.newProxyInstance(
            assetSource.getClassLoader(),
            new Class<?>[] {assetSource},
            (proxy, method, params) -> Files.newInputStream(file((String) params[0]))
        );
        Object room = serverClass.getConstructor(assetSource).newInstance(accessor);
        int port = (int) serverClass.getMethod("start").invoke(room);
        String roomUrl = "http://127.0.0.1:" + port + "/?room=" + serverClass.getMethod("roomToken").invoke(room);
        Method snapshot = serverClass.getMethod("snapshot");
        Method publish = serverClass.getMethod("publish", String.class);
        HttpServer tv = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        tv.createContext("/", exchange -> respond(exchange, room, snapshot, publish));
        tv.start();
        try {
            System.out.println(roomUrl + " http://127.0.0.1:" + tv.getAddress().getPort() + "/tv.html");
            System.out.flush();
            new BufferedReader(new InputStreamReader(System.in)).readLine();
        } finally {
            serverClass.getMethod("stop").invoke(room);
            tv.stop(0);
        }
    }
}
