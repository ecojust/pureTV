package com.ecojust.putrtvstore;

import static org.junit.Assert.*;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = {19, 28})
public class MarketDirectoryTest {
    private static final String HASH = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    private static String listing(String... children) {
        StringBuilder page = new StringBuilder("<html><title>Index of /fixture/</title><pre>");
        for (String child : children) page.append("<a href=\"").append(child).append("\">…</a>");
        return page.append("</pre></html>").toString();
    }

    private static final class Server implements MarketDirectory.Transport {
        final Map<String, String> responses = new HashMap<>();
        final Map<String, Integer> heads = new ConcurrentHashMap<>();
        final AtomicInteger manifestReads = new AtomicInteger();
        final AtomicInteger logoReads = new AtomicInteger();
        Server() {
            responses.put("/game/", listing());
            responses.put("/media/", listing());
            responses.put("/launcher/", listing());
        }
        @Override public byte[] read(URL url, int limit, Cancellation cancel) throws IOException {
            cancel.check();
            if (url.getPath().endsWith("/manifest.json")) manifestReads.incrementAndGet();
            if (url.getPath().endsWith("/logo.svg")) {
                assertEquals(8192, limit);
                logoReads.incrementAndGet();
            }
            String content = responses.get(url.getPath());
            if (content == null) throw new IOException("Unexpected request " + url);
            return content.getBytes(StandardCharsets.UTF_8);
        }
        @Override public MarketDirectory.Metadata head(URL url, Cancellation cancel) throws IOException {
            cancel.check();
            heads.put(url.getPath(), 1);
            return new MarketDirectory.Metadata(123, "\"etag\"", null);
        }
    }

    @Test public void groupsVersionsAndUsesTrustedDirectoryPathsAndOptionalMetadata() throws Exception {
        Server server = new Server();
        server.responses.put("/media/", listing("video/", "A+B.apk", "outside.apk?q=secret",
                "../", "%2e%2e/", "broken&entity;.apk", "escape%2Ftest/", "https://other.invalid/a.apk", "%ZZ.apk"));
        server.responses.put("/media/video/", listing("deep/", "movie-0.1.apk", "movie-1.9.apk", "movie-1.10.apk",
                "movie-1.2.apk", "movie-2.0.apk", "movie-1.0.apk", "movie-1.10.apk", "movie-1.10.thumb.png",
                "movie-2.0.apk.thumb.png", "thumb.png", "manifest.json"));
        server.responses.put("/media/video/manifest.json", "{\"provider\":\" Demo \",\"packages\":[{\"file\":\"movie-2.0.apk\",\"bytes\":123,\"sha256\":\"" + HASH + "\"}]}");
        server.responses.put("/launcher/", listing("TV%20%E6%A1%8C%E9%9D%A2.apk"));
        JSONArray rows = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
        assertEquals(7, rows.length());
        JSONObject launcher = rows.getJSONObject(0), flat = rows.getJSONObject(1);
        assertEquals("launcher/TV 桌面.apk", launcher.getString("apkPath"));
        assertEquals("launcher", launcher.getString("category"));
        assertEquals("A+B", flat.getString("name"));
        assertEquals("", flat.getString("versionName"));
        for (int i = 0; i < 5; i++) {
            JSONObject movie = rows.getJSONObject(2 + i);
            assertEquals("movie", movie.getString("name"));
            assertEquals(Arrays.asList("2.0","1.10","1.9","1.2","1.0").get(i), movie.getString("versionName"));
            assertEquals("Demo", movie.getString("provider"));
            assertEquals(123, movie.getLong("bytes"));
            assertEquals("\"etag\"", movie.getString("etag"));
        }
        assertEquals("media/video/movie-2.0.apk.thumb.png", rows.getJSONObject(2).getString("coverPath"));
        assertEquals("media/video/movie-1.10.thumb.png", rows.getJSONObject(3).getString("coverPath"));
        assertEquals("media/video/thumb.png", rows.getJSONObject(4).getString("coverPath"));
        assertEquals(HASH, rows.getJSONObject(2).getString("sha256"));
        assertEquals("", rows.getJSONObject(3).getString("sha256"));
        assertEquals(1, server.manifestReads.get());
        assertEquals(7, server.heads.size());
    }

    @Test public void manifestFailureKeepsApplicationsAndRequiredIndexFailureRejectsPartialResult() throws Exception {
        Server server = new Server();
        server.responses.put("/game/", listing("first.apk", "manifest.json"));
        JSONObject first = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries").getJSONObject(0);
        assertEquals("game/first.apk", first.getString("id"));
        assertEquals("", first.getString("provider"));
        server.responses.put("/launcher/", "<html>temporary maintenance</html>");
        try { MarketDirectory.load(server, new Cancellation()); fail(); }
        catch (IOException expected) { assertTrue(expected.getMessage().contains("directory index")); }
    }

    @Test public void refreshTracksAdditionsRemovalsAndAnEmptyServer() throws Exception {
        Server server = new Server();
        assertEquals(0, MarketDirectory.load(server, new Cancellation()).getJSONArray("entries").length());
        server.responses.put("/media/", listing("new-app-1.0.apk"));
        JSONArray added = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
        assertEquals("media/new-app-1.0.apk", added.getJSONObject(0).getString("id"));
        server.responses.put("/media/", listing());
        assertEquals(0, MarketDirectory.load(server, new Cancellation()).getJSONArray("entries").length());
    }

    @Test public void numericallyEqualVersionsUseDesktopFilenameTieOrder() throws Exception {
        Server server = new Server();
        server.responses.put("/game/", listing("x-01.1.APK", "x-01.1.apk", "x-1.01.apk",
                "x-1.1.0.0.apk", "x-1.1.apk", "x-1.1.00.apk", "x-1.01.0.apk"));
        JSONArray rows = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
        assertEquals(5, rows.length());
        String[] expected = {"x-1.1.0.0.apk", "x-1.01.0.apk", "x-1.1.00.apk", "x-01.1.apk", "x-1.01.apk"};
        for (int i = 0; i < expected.length; i++) assertEquals("game/" + expected[i], rows.getJSONObject(i).getString("id"));
    }

    @Test public void validatesOneLogoPerFolderAndKeepsAppsWhenArtworkIsUnavailable() throws Exception {
        Server server = new Server();
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0L4 4\"/></svg>";
        server.responses.put("/game/", listing("demo/"));
        server.responses.put("/game/demo/", listing("demo-1.0.apk", "demo-1.1.apk", "logo.svg"));
        server.responses.put("/game/demo/logo.svg", svg);
        JSONArray rows = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
        assertEquals(svg, rows.getJSONObject(0).getString("logoSvg"));
        assertEquals(svg, rows.getJSONObject(1).getString("logoSvg"));
        assertEquals(1, server.logoReads.get());

        char[] oversized = new char[8193];
        Arrays.fill(oversized, ' ');
        for (String invalid : Arrays.asList("<svg><script/></svg>", new String(oversized), null)) {
            server.responses.put("/game/demo/logo.svg", invalid);
            rows = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
            assertEquals(2, rows.length());
            assertFalse(rows.getJSONObject(0).has("logoSvg"));
        }

        server.responses.put("/game/demo/", listing("demo-1.1.apk"));
        rows = MarketDirectory.load(server, new Cancellation()).getJSONArray("entries");
        assertEquals(1, rows.length());
        assertFalse(rows.getJSONObject(0).has("logoSvg"));
        assertEquals(4, server.logoReads.get());
    }

    @Test public void cancelledReadDoesNotReturnAnEmptyCatalog() throws Exception {
        Cancellation cancel = new Cancellation();
        cancel.cancel();
        try { MarketDirectory.load(new Server(), cancel); fail(); }
        catch (java.io.InterruptedIOException expected) { assertTrue(cancel.isCancelled()); }
    }
}
