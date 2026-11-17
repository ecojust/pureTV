package com.ecojust.bilitv;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;

/** First-party API requests only. Media URLs and account cookies are never logged. */
public class BiliHttp {
    public static final String USER_AGENT = "Mozilla/5.0 (Linux; Android 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    public static final String REFERER = "https://www.bilibili.com/";
    static final int MAX_BODY = 2 * 1024 * 1024;
    public enum Kind { NETWORK, HTTP, RATE_LIMITED, AUTH_REQUIRED, NOT_FOUND, RESTRICTED, INVALID_RESPONSE, CANCELLED }
    public static class ApiException extends IOException {
        public final Kind kind;
        public final int code;
        public ApiException(Kind kind, int code, String message) { super(message); this.kind = kind; this.code = code; }
    }
    public interface CookieJar {
        long generation();
        String cookieHeader(String requestUrl);
        void acceptCookies(String requestUrl, List<String> values, long expectedGeneration);
    }
    public interface Transport { Response execute(Request request) throws IOException; }
    public static final class Request {
        public final String url, method;
        public final Map<String, String> headers;
        public final byte[] body;
        Request(String url, String method, Map<String, String> headers, byte[] body) {
            this.url = url; this.method = method; this.headers = Collections.unmodifiableMap(headers); this.body = body;
        }
    }
    public static final class Response {
        public final int status;
        public final Map<String, List<String>> headers;
        public final byte[] body;
        public Response(int status, Map<String, List<String>> headers, byte[] body) {
            this.status = status; this.headers = headers == null ? Collections.<String, List<String>>emptyMap() : headers;
            this.body = body == null ? new byte[0] : body;
        }
        List<String> values(String name) {
            for (Map.Entry<String,List<String>> entry : headers.entrySet())
                if (entry.getKey() != null && entry.getKey().equalsIgnoreCase(name)) return entry.getValue();
            return Collections.emptyList();
        }
    }
    private final CookieJar cookies;
    private final Transport transport;
    private volatile String wbiKey;
    private volatile long wbiFetchedAt;
    public BiliHttp(CookieJar cookies) { this(cookies, new UrlTransport()); }
    public BiliHttp(CookieJar cookies, Transport transport) {
        if (cookies == null || transport == null) throw new IllegalArgumentException("A session and transport are required");
        LegacyTls.installIfNeeded();
        this.cookies = cookies; this.transport = transport;
    }
    public JSONObject get(String endpoint, Map<String,String> parameters) throws IOException {
        return checked(request("GET", endpoint, parameters));
    }
    public JSONObject get(String endpoint, Map<String,String> parameters, long expectedGeneration) throws IOException {
        return checked(request("GET", endpoint, parameters, expectedGeneration));
    }
    public JSONObject post(String endpoint, Map<String,String> form) throws IOException {
        return checked(request("POST", endpoint, form));
    }
    public JSONObject post(String endpoint, Map<String,String> form, long expectedGeneration) throws IOException {
        return checked(request("POST", endpoint, form, expectedGeneration));
    }
    public JSONObject getWbi(String endpoint, Map<String,String> parameters) throws IOException {
        String key = signingKey();
        return get(endpoint, signedParameters(parameters, key, System.currentTimeMillis() / 1000));
    }
    public static Map<String,String> params(String... pairs) {
        if (pairs.length % 2 != 0) throw new IllegalArgumentException("Expected parameter pairs");
        Map<String,String> result = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) result.put(pairs[i], pairs[i+1]);
        return result;
    }
    static JSONObject checked(JSONObject root) throws IOException {
        if (!root.has("code")) throw invalid();
        int code = root.optInt("code", Integer.MIN_VALUE);
        if (code == 0) return root;
        Kind kind = code == -101 || code == -111 ? Kind.AUTH_REQUIRED
            : code == -412 || code == -352 || code == -509 ? Kind.RATE_LIMITED
            : code == -404 || code == 62002 ? Kind.NOT_FOUND
            : code == -403 || code == 62004 || code == 62012 ? Kind.RESTRICTED : Kind.INVALID_RESPONSE;
        throw new ApiException(kind, code, "Bilibili returned an API error (" + code + ")");
    }
    private JSONObject request(String method, String endpoint, Map<String,String> parameters) throws IOException {
        return request(method, endpoint, parameters, cookies.generation());
    }
    private JSONObject request(String method, String endpoint, Map<String,String> parameters, long epoch) throws IOException {
        checkCancelled();
        checkEpoch(epoch);
        String encoded = encode(parameters == null ? Collections.<String,String>emptyMap() : parameters);
        String address = endpoint.startsWith("/") ? "https://api.bilibili.com" + endpoint : endpoint;
        if (method.equals("GET") && !encoded.isEmpty()) address += (address.contains("?") ? "&" : "?") + encoded;
        byte[] body = method.equals("POST") ? encoded.getBytes("UTF-8") : new byte[0];
        for (int redirect = 0; redirect <= 3; redirect++) {
            URI uri = apiUri(address);
            checkEpoch(epoch);
            Map<String,String> headers = new LinkedHashMap<>();
            headers.put("User-Agent", USER_AGENT); headers.put("Referer", REFERER);
            headers.put("Accept", "application/json"); headers.put("Accept-Encoding", "identity");
            if (method.equals("POST")) headers.put("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
            String cookie = cookies.cookieHeader(uri.toString());
            checkEpoch(epoch);
            if (cookie != null && !cookie.isEmpty()) headers.put("Cookie", cookie);
            Response response;
            try { response = transport.execute(new Request(uri.toString(), method, headers, body)); }
            catch (ApiException error) { throw error; }
            catch (IOException error) { checkCancelled(); throw new ApiException(Kind.NETWORK, 0, "Unable to reach Bilibili"); }
            checkEpoch(epoch);
            if (response.body.length > MAX_BODY) throw invalid();
            cookies.acceptCookies(uri.toString(), response.values("Set-Cookie"), epoch);
            checkEpoch(epoch);
            if (response.status >= 300 && response.status < 400) {
                // Do not replay a mutation or send its form to a different URL.
                List<String> locations = response.values("Location");
                if (!method.equals("GET") || locations.isEmpty() || redirect == 3) throw invalid();
                try { address = uri.resolve(locations.get(0)).toString(); }
                catch (IllegalArgumentException error) { throw invalid(); }
                continue;
            }
            if (response.status != 200) {
                Kind kind = response.status == 412 || response.status == 429 ? Kind.RATE_LIMITED
                    : response.status == 401 ? Kind.AUTH_REQUIRED : response.status == 403 ? Kind.RESTRICTED
                    : response.status == 404 ? Kind.NOT_FOUND : Kind.HTTP;
                throw new ApiException(kind, response.status, "Bilibili returned HTTP " + response.status);
            }
            try { return new JSONObject(new String(response.body, "UTF-8")); }
            catch (JSONException error) { throw invalid(); }
        }
        throw invalid();
    }
    private void checkEpoch(long epoch) throws IOException {
        checkCancelled();
        if (cookies.generation() != epoch) throw new ApiException(Kind.CANCELLED, 0, "Account request was cancelled");
    }
    private synchronized String signingKey() throws IOException {
        long now = System.currentTimeMillis();
        if (wbiKey != null && now - wbiFetchedAt >= 0 && now - wbiFetchedAt < 60 * 60 * 1000L) return wbiKey;
        JSONObject root = request("GET", "/x/web-interface/nav", Collections.<String,String>emptyMap());
        int code = root.optInt("code", Integer.MIN_VALUE);
        if (code != 0 && code != -101) checked(root);
        JSONObject data = root.optJSONObject("data"), images = data == null ? null : data.optJSONObject("wbi_img");
        if (images == null) throw invalid();
        String source = imageKey(images.optString("img_url")) + imageKey(images.optString("sub_url"));
        int[] order = {46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52};
        StringBuilder mixed = new StringBuilder();
        for (int i = 0; i < 32; i++) mixed.append(source.charAt(order[i]));
        wbiKey = mixed.toString(); wbiFetchedAt = now; return wbiKey;
    }
    private static String imageKey(String value) throws IOException {
        try {
            String path = new URI(value).getPath();
            String filename = path.substring(path.lastIndexOf('/') + 1);
            String key = filename.substring(0, filename.indexOf('.'));
            if (!key.matches("[a-fA-F0-9]{32}")) throw invalid();
            return key;
        } catch (URISyntaxException | NullPointerException | IndexOutOfBoundsException error) { throw invalid(); }
    }
    static Map<String,String> signedParameters(Map<String,String> source, String key, long timestamp) throws IOException {
        Map<String,String> parameters = new TreeMap<>();
        if (source != null) for (Map.Entry<String,String> entry : source.entrySet())
            if (!entry.getKey().equals("w_rid") && !entry.getKey().equals("wts"))
                parameters.put(entry.getKey(), entry.getValue().replaceAll("[!'()*]", ""));
        parameters.put("wts", Long.toString(timestamp));
        try {
            byte[] digest = MessageDigest.getInstance("MD5").digest((encode(parameters) + key).getBytes("UTF-8"));
            StringBuilder hex = new StringBuilder();
            for (byte value : digest) hex.append(String.format(Locale.US, "%02x", value & 255));
            parameters.put("w_rid", hex.toString()); return parameters;
        } catch (java.security.NoSuchAlgorithmException error) { throw invalid(); }
    }
    static String encode(Map<String,String> values) throws IOException {
        StringBuilder result = new StringBuilder();
        for (Map.Entry<String,String> entry : values.entrySet()) {
            if (entry.getKey() == null || entry.getValue() == null) throw invalid();
            if (result.length() > 0) result.append('&');
            result.append(escape(entry.getKey())).append('=').append(escape(entry.getValue()));
        }
        return result.toString();
    }
    private static String escape(String value) throws IOException { return URLEncoder.encode(value, "UTF-8").replace("+", "%20").replace("%7E", "~"); }
    static URI apiUri(String address) throws IOException {
        try {
            URI uri = new URI(address);
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null || uri.getUserInfo() != null || uri.getFragment() != null
                || (uri.getPort() != -1 && uri.getPort() != 443)
                || !(host.equalsIgnoreCase("api.bilibili.com") || host.equalsIgnoreCase("passport.bilibili.com"))) throw invalid();
            return uri;
        } catch (URISyntaxException error) { throw invalid(); }
    }
    static ApiException invalid() { return new ApiException(Kind.INVALID_RESPONSE, 0, "Bilibili returned an unsupported response"); }
    static void checkCancelled() throws IOException {
        if (Thread.currentThread().isInterrupted()) throw new ApiException(Kind.CANCELLED, 0, "Request was cancelled");
    }
    private static final class UrlTransport implements Transport {
        @Override public Response execute(Request request) throws IOException {
            HttpURLConnection connection = (HttpURLConnection) new URL(request.url).openConnection();
            connection.setConnectTimeout(10000); connection.setReadTimeout(12000); connection.setInstanceFollowRedirects(false);
            connection.setRequestMethod(request.method);
            for (Map.Entry<String,String> header : request.headers.entrySet()) connection.setRequestProperty(header.getKey(), header.getValue());
            long deadline = System.nanoTime() + 30_000_000_000L;
            try {
                checkCancelled();
                if (request.method.equals("POST")) {
                    connection.setDoOutput(true); connection.setFixedLengthStreamingMode(request.body.length);
                    try (OutputStream output = connection.getOutputStream()) { output.write(request.body); }
                }
                int status = connection.getResponseCode();
                if (connection.getContentLength() > MAX_BODY) throw invalid();
                Map<String,List<String>> headers = new LinkedHashMap<>();
                for (Map.Entry<String,List<String>> entry : connection.getHeaderFields().entrySet())
                    if (entry.getKey() != null && entry.getValue() != null) headers.put(entry.getKey(), new ArrayList<>(entry.getValue()));
                InputStream stream = status >= 400 ? connection.getErrorStream() : connection.getInputStream();
                if (stream == null) return new Response(status, headers, new byte[0]);
                try (InputStream input = stream; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                    byte[] buffer = new byte[8192]; int count;
                    while ((count = input.read(buffer)) != -1) {
                        checkCancelled();
                        if (System.nanoTime() > deadline) throw new ApiException(Kind.NETWORK, 0, "Request timed out");
                        if (output.size() + count > MAX_BODY) throw invalid();
                        output.write(buffer, 0, count);
                    }
                    return new Response(status, headers, output.toByteArray());
                }
            } finally { connection.disconnect(); }
        }
    }
}
