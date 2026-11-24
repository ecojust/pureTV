package com.ecojust.putrtvstore;

import static org.junit.Assert.*;
import android.content.Context;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28)
public class CatalogRepositoryTest {
    private Context context;
    private static final String PATH = "launcher/sample/Sample-1.0.apk", TAG = "\"123\"";
    private static final String DATE = "Tue, 24 Nov 2026 12:00:00 GMT";

    @Before public void cleanCache() {
        context = RuntimeEnvironment.getApplication();
        for (String suffix : new String[]{"", ".bak", ".new"})
            new File(context.getFilesDir(), "market-directory-cache-v3.json" + suffix).delete();
    }

    private static JSONObject row(String path) throws Exception {
        return new JSONObject().put("id", path).put("apkPath", path).put("category", path.split("/")[0])
                .put("name", "Sample").put("versionName", "1.0").put("bytes", 100).put("coverPath", "")
                .put("etag", TAG).put("lastModified", DATE).put("provider", "").put("sha256", "");
    }
    private static JSONObject feed(JSONObject... rows) throws Exception {
        JSONArray entries = new JSONArray();
        for (JSONObject row : rows) entries.put(row);
        return new JSONObject().put("schemaVersion", 3).put("entries", entries);
    }
    private static String repeat(char c, int n) { return new String(new char[n]).replace('\0', c); }
    private static StoreCatalog parse(JSONObject feed) throws IOException {
        return CatalogRepository.parse(feed, "market", 1, false, "");
    }
    private static void invalid(JSONObject document) throws Exception {
        try { parse(document); fail(document.toString()); } catch (IOException expected) { }
    }
    @Test public void freshUnknownPackagesAndLaunchersHaveTheirOwnFileIdentity() throws Exception {
        JSONObject one = row(PATH);
        JSONObject two = row("launcher/sample/Sample-1.1.apk").put("versionName", "1.1");
        StoreCatalog catalog = parse(feed(one, two));
        assertEquals(2, catalog.entries.size());
        assertFalse(catalog.entries.get(0).hasPackageIdentity());
        assertEquals("1.1", catalog.entries.get(1).marketVersion);
        invalid(feed(one, one));
        invalid(feed(one.put("id", "media/Sample.apk")));
    }
    @Test public void rejectsInvalidValidatorsSizesPathsAndCrossFolderCovers() throws Exception {
        invalid(feed(row(PATH).put("etag", "").put("lastModified", "")));
        invalid(feed(row(PATH).put("etag", "W/\"123\"")));
        invalid(feed(row(PATH).put("bytes", StoreDownloader.MAX_APK_BYTES + 1)));
        invalid(feed(row(PATH).put("bytes", "10")));
        invalid(feed(row(PATH).put("category", "game")));
        invalid(feed(row(PATH).put("coverPath", "media/sample/thumb.png")));
        invalid(feed(row("client/example.apk")));
        invalid(feed(row("launcher/sample/../sample.apk")));
    }
    @Test @Config(sdk = 19) public void sameFileReceivesSnapshotIdentityButChangedFilesStayUnverified() throws Exception {
        String sha = repeat('a', 64);
        JSONObject known = row(PATH).put("packageName", "test.sample").put("minSdk", 19).put("versionCode", 42)
                .put("apkVersionName", "actual").put("sha256", sha).put("gitBlobSha", repeat('b',40)).put("certificateSha256", repeat('c',64));
        StoreCatalog bundled = parse(feed(known));
        for (JSONObject same : new JSONObject[]{row(PATH), row(PATH).put("etag","").put("sha256",sha)}) {
            JSONObject current = feed(same);
            CatalogRepository.enrich(current, bundled);
            StoreEntry entry = parse(current).entries.get(0);
            assertTrue(entry.hasPackageIdentity());
            assertEquals("actual", entry.versionName);
            assertEquals("1.0",entry.marketVersion);
        }
        for (JSONObject changed : new JSONObject[]{row(PATH).put("etag",""), row(PATH).put("etag","\"456\""),
                row(PATH).put("bytes",90), row(PATH).put("sha256",repeat('d',64))}) {
            JSONObject current = feed(changed);
            CatalogRepository.enrich(current, bundled);
            assertFalse(parse(current).entries.get(0).hasPackageIdentity());
        }
        JSONObject removed = feed();
        CatalogRepository.enrich(removed, bundled);
        assertTrue(parse(removed).entries.isEmpty());
    }

    private static class Directory implements MarketDirectory.Transport {
        final AtomicInteger reads = new AtomicInteger();
        boolean offline, empty;
        @Override public byte[] read(URL url, int limit, Cancellation cancel) throws IOException {
            cancel.check(); reads.incrementAndGet();
            if (offline) throw new IOException("offline");
            String links = !empty && url.getPath().equals("/launcher/") ? "<a href=\"Sample-1.0.apk\">Sample</a>" : "";
            return ("<html><head><title>Index of " + url.getPath() + "</title></head><body><h1>Index of " + url.getPath() + "</h1><hr><pre><a href=\"../\">../</a>" + links + "</pre><hr></body></html>").getBytes(StandardCharsets.UTF_8);
        }
        @Override public MarketDirectory.Metadata head(URL url, Cancellation cancel) {
            return new MarketDirectory.Metadata(100, TAG, DATE);
        }
    }
    @Test public void offlineUsesLastCompleteListingAndOnlineRemovalsReplaceIt() throws Exception {
        Directory transport = new Directory();
        CatalogRepository repo = new CatalogRepository(context, transport);
        StoreCatalog live = repo.load(true, new Cancellation());
        assertFalse(live.stale); assertEquals(1, live.entries.size());
        int reads = transport.reads.get();
        assertEquals(1, repo.load(false, new Cancellation()).entries.size());
        assertEquals(reads, transport.reads.get());
        transport.offline = true;
        StoreCatalog cached = repo.load(true, new Cancellation());
        assertTrue(cached.stale); assertEquals(live.entries.get(0).id, cached.entries.get(0).id);
        transport.offline = false; transport.empty = true;
        assertTrue(repo.load(false, new Cancellation()).entries.isEmpty());
    }
    @Test public void firstOfflineLaunchUsesInspectedMarketPackages() throws Exception {
        Directory transport = new Directory(); transport.offline = true;
        StoreCatalog bundled = new CatalogRepository(context, transport).load(true, new Cancellation());
        assertTrue(bundled.stale);
        JSONArray expected;
        try (InputStream stream = context.getAssets().open(CatalogRepository.BUNDLED_ASSET)) {
            byte[] raw = StoreNetwork.readBounded(stream, CatalogRepository.MAX_CATALOG_BYTES, new Cancellation());
            expected = new JSONObject(new String(raw, StandardCharsets.UTF_8)).getJSONObject("catalog").getJSONArray("entries");
        }
        assertEquals(expected.length(), bundled.entries.size());
        for (int i = 0; i < expected.length(); i++) {
            JSONObject record = expected.getJSONObject(i);
            StoreEntry entry = bundled.entries.get(i);
            assertTrue(entry.hasPackageIdentity());
            assertEquals(record.getString("id"), entry.id);
            assertEquals(record.getString("apkPath"), entry.apkPath);
            assertEquals(record.getString("category"), entry.category);
            assertEquals(record.getString("sha256"), entry.sha256);
        }
    }
    @Test public void cancellationNeverOpensNetworkOrPretendsRefreshSucceeded() throws Exception {
        Directory transport = new Directory();
        Cancellation cancelled = new Cancellation(); cancelled.cancel();
        try { new CatalogRepository(context, transport).load(true, cancelled); fail(); } catch (IOException expected) { }
        assertEquals(0, transport.reads.get());
    }
    @Test public void optionalLogosCannotSuppressAnOtherwiseUsablePackage() throws Exception {
        String logo = "<svg xmlns='http://www.w3.org/2000/svg'><circle cx='10' cy='10' r='5'/></svg>";
        assertEquals(logo, parse(feed(row(PATH).put("logoSvg",logo))).entries.get(0).logoSvg);
        for (Object bad : new Object[]{1, repeat('x',8193), "<svg><script/></svg>", "<svg><image href='https://example.com'/></svg>",
                "<svg><path onload='bad()'/></svg>", "<!DOCTYPE svg SYSTEM 'http://example.com/x'><svg/>",
                "<svg><path fill='url(https://example.com)'/></svg>"}) {
            StoreEntry retained = parse(feed(row(PATH).put("logoSvg",bad))).entries.get(0);
            assertEquals(PATH, retained.id);
            assertEquals("", retained.logoSvg);
        }
    }

    @Test public void getMustMatchTheValidatorUsedForConditionalDownload() throws Exception {
        StoreEntry etag = parse(feed(row(PATH))).entries.get(0);
        StoreNetwork.verifyResponse(etag, null, TAG, null);
        try { StoreNetwork.verifyResponse(etag, "100", "wrong", DATE); fail(); } catch (IOException expected) { }
        StoreEntry dated = parse(feed(row(PATH).put("etag",""))).entries.get(0);
        StoreNetwork.verifyResponse(dated, "100", null, DATE);
        try { StoreNetwork.verifyResponse(dated, "99", null, DATE); fail(); } catch (IOException expected) { }
        try { StoreNetwork.verifyResponse(dated, "100", TAG, null); fail(); } catch (IOException expected) { }
    }

    @Test public void marketUrlsKeepNamesEncodedAndRedirectsInsideSource() throws Exception {
        URL valid = StoreNetwork.market("media/电视/XYZ #1+2.apk");
        assertTrue(valid.toString().contains("%23")); assertTrue(valid.toString().contains("%E7"));
        StoreNetwork.validate(valid);
        for (String bad : new String[]{"http://apps.b14f.com/media/f.apk", "https://apps.b14f.com:444/media/f.apk",
                "https://attacker.test/media/f.apk", "https://apps.b14f.com/media/f.apk?redirect=x",
                "https://apps.b14f.com/game/a%2Fb.apk", "https://apps.b14f.com/game/a%5Cb.apk",
                "https://user@apps.b14f.com/media/f.apk", "https://apps.b14f.com/media/%2e%2e/f.apk",
                "https://apps.b14f.com/client/f.apk"}) {
            try { StoreNetwork.validate(new URL(bad)); fail(bad); } catch (IOException expected) { }
        }
        assertArrayEquals(new byte[]{1}, StoreNetwork.readBounded(new ByteArrayInputStream(new byte[]{1}),1,new Cancellation()));
        try { StoreNetwork.readBounded(new ByteArrayInputStream(new byte[]{1,2}),1,new Cancellation()); fail(); } catch (IOException expected) { }
    }
}
