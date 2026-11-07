package com.ecojust.putrtvstore;

import static org.junit.Assert.*;
import android.content.Context;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
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
    private static final String REV = "23bf3b11c156922a70a64d5f10f2700c52ac10f6";
    private Context context;

    @Before public void cleanCache() {
        context = RuntimeEnvironment.getApplication();
        for (String suffix : new String[]{"", ".bak", ".new"})
            new File(context.getFilesDir(), "tv-store-catalog-cache.json" + suffix).delete();
    }
    private static JSONObject entry() throws Exception {
        JSONObject value = new JSONObject();
        value.put("id", "apps/sample"); value.put("name", "测试应用"); value.put("nameEn", "Sample");
        value.put("description", "说明"); value.put("descriptionEn", "Description"); value.put("category", "game");
        value.put("packageName", "com.ecojust.sample"); value.put("versionName", "1.0.0");
        value.put("apkPath", "resource/apps/sample/sample-1.0.0.apk"); value.put("coverPath", "resource/apps/sample/thumb.png");
        value.put("logoSvg", "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><path d=\"M0 0h10v10z\" fill=\"#fff\"/></svg>");
        value.put("sha256", repeat('a', 64)); value.put("certificateSha256", repeat('b', 64));
        value.put("gitBlobSha", repeat('c', 40)); value.put("versionCode", 5); value.put("bytes", 12534502); value.put("minSdk", 19);
        return value;
    }
    private static String repeat(char c, int count) { char[] chars = new char[count]; java.util.Arrays.fill(chars, c); return new String(chars); }
    private static byte[] feed(JSONObject entry) throws Exception {
        return new JSONObject().put("schemaVersion", 1).put("entries", new JSONArray().put(entry)).toString().getBytes(StandardCharsets.UTF_8);
    }
    private static StoreCatalog parse(byte[] bytes) throws IOException { return CatalogRepository.parse(bytes, REV, "fixture", 1, false, ""); }
    private static void invalid(byte[] bytes) throws Exception {
        try { parse(bytes); fail("Invalid feed was accepted"); } catch (IOException expected) { }
    }

    @Test public void validIdentityHasLocalizedTextAndImmutableEntries() throws Exception {
        StoreCatalog catalog = parse(feed(entry())); StoreEntry app = catalog.entries.get(0);
        assertEquals("Sample", app.displayName(true)); assertEquals("测试应用", app.displayName(false));
        assertEquals("Description", app.displayDescription(true)); assertEquals(5, app.versionCode);
        assertEquals(12534502, app.bytes); assertEquals(19, app.minSdk);
        try { catalog.entries.clear(); fail(); } catch (UnsupportedOperationException expected) { }
        ArrayList<StoreEntry> source = new ArrayList<>(catalog.entries);
        StoreCatalog copy = new StoreCatalog(REV, "fixture", "", 1, false, source); source.clear(); assertEquals(1, copy.entries.size());
    }
    @Test public void rejectsUnsafePathsAndMismatchedFolders() throws Exception {
        for (String path : new String[]{"resource/apps/sample/../sample.apk", "resource/apps/other/sample.apk",
                "resource/apps/sample/%2e%2e.apk", "https://example.com/a.apk", "resource/apps/sample/a\\b.apk"}) {
            JSONObject item = entry(); item.put("apkPath", path); invalid(feed(item));
        }
        JSONObject item = entry(); item.put("coverPath", "resource/apps/other/thumb.png"); invalid(feed(item));
    }
    @Test public void rejectsDuplicateIdsAndPackages() throws Exception {
        JSONObject other = entry(); other.put("id", "apps/second"); other.put("apkPath", "resource/apps/second/a.apk"); other.put("coverPath", "");
        invalid(new JSONObject().put("schemaVersion", 1).put("entries", new JSONArray().put(entry()).put(other)).toString().getBytes(StandardCharsets.UTF_8));
    }
    @Test public void rejectsWrongTypesHashesVersionsAndUnknownFields() throws Exception {
        for (String key : new String[]{"versionCode", "bytes", "minSdk"}) {
            JSONObject item = entry(); item.put(key, "5"); invalid(feed(item)); item.put(key, 0); invalid(feed(item)); item.put(key, 1.25); invalid(feed(item));
        }
        JSONObject item = entry(); item.put("sha256", repeat('A', 64)); invalid(feed(item));
        item = entry(); item.put("unexpected", true); invalid(feed(item));
        item = entry(); item.put("category", "launcher"); invalid(feed(item));
    }
    @Test public void catalogAndDownloaderShareTheApkSizeLimit() throws Exception {
        JSONObject item = entry(); item.put("bytes", StoreDownloader.MAX_APK_BYTES);
        assertEquals(StoreDownloader.MAX_APK_BYTES, parse(feed(item)).entries.get(0).bytes);
        item.put("bytes", StoreDownloader.MAX_APK_BYTES + 1); invalid(feed(item));
    }
    @Test public void strictJsonRejectsDuplicatesCommentsTrailingAndInvalidUtf8() throws Exception {
        String valid = new String(feed(entry()), StandardCharsets.UTF_8);
        invalid(valid.replace("\"schemaVersion\":1", "\"schemaVersion\":1,\"schemaVersion\":1").getBytes(StandardCharsets.UTF_8));
        invalid(("/*comment*/" + valid).getBytes(StandardCharsets.UTF_8));
        invalid((valid + " {}").getBytes(StandardCharsets.UTF_8));
        invalid(new byte[]{'{', '"', (byte) 0xc0, (byte) 0xaf, '"', ':', '1', '}'});
    }
    @Test public void rejectsActiveSvgButAcceptsStaticLogo() throws Exception {
        assertTrue(CatalogRepository.safeLogo(entry().getString("logoSvg")));
        for (String svg : new String[]{"<!DOCTYPE svg [<!ENTITY x SYSTEM 'https://evil'>]><svg>&x;</svg>",
                "<svg><script>bad()</script></svg>", "<svg><path fill='url(#x)'/></svg>",
                "<svg><image href='https://evil'/></svg>", "<svg onload='bad()'/>", "<svg xmlns='urn:evil'/>", "<svg>text</svg>"}) {
            JSONObject item = entry(); item.put("logoSvg", svg); invalid(feed(item));
        }
    }
    @Test public void liveCatalogPinsAssetsAndCacheAvoidsRepeatedRefresh() throws Exception {
        byte[] data = feed(entry()); AtomicInteger calls = new AtomicInteger();
        CatalogRepository repository = new CatalogRepository(context, (url, limit, cancel) -> {
            calls.incrementAndGet();
            if (url.toString().equals(StoreNetwork.REF_URL)) return ("{\"object\":{\"type\":\"commit\",\"sha\":\"" + REV + "\"}}").getBytes(StandardCharsets.UTF_8);
            assertEquals("https://raw.githubusercontent.com/ecojust/pureTV/" + REV + "/resource/tv-store-catalog.json", url.toString()); return data;
        });
        StoreCatalog fresh = repository.load(true, new Cancellation()); assertFalse(fresh.stale); assertEquals(2, calls.get());
        assertFalse(repository.load(false, new Cancellation()).stale); assertEquals(2, calls.get());
        CatalogRepository offline = new CatalogRepository(context, (url, limit, cancel) -> { throw new IOException("offline"); });
        StoreCatalog saved = offline.load(true, new Cancellation()); assertTrue(saved.stale); assertEquals(REV, saved.revision);
        assertEquals("Sample", saved.entries.get(0).nameEn); assertFalse(saved.warning.isEmpty());
    }
    @Test public void malformedRefreshDoesNotReplaceLastGoodCache() throws Exception {
        byte[] data = feed(entry());
        CatalogRepository valid = new CatalogRepository(context, (url, limit, cancel) -> url.getHost().equals("api.github.com")
                ? ("{\"object\":{\"type\":\"commit\",\"sha\":\"" + REV + "\"}}").getBytes(StandardCharsets.UTF_8) : data);
        valid.load(true, new Cancellation());
        CatalogRepository malformed = new CatalogRepository(context, (url, limit, cancel) -> "{}".getBytes(StandardCharsets.UTF_8));
        assertTrue(malformed.load(true, new Cancellation()).stale);
        StoreCatalog stillStale = malformed.load(false, new Cancellation());
        assertTrue(stillStale.stale); assertEquals("Sample", stillStale.entries.get(0).nameEn);
    }
    @Test public void firstOfflineStartUsesExplicitlyStaleFrozenSnapshot() throws Exception {
        CatalogRepository offline = new CatalogRepository(context, (url, limit, cancel) -> { throw new IOException("offline"); });
        StoreCatalog bundled = offline.load(true, new Cancellation());
        assertTrue(bundled.stale); assertEquals(REV, bundled.revision); assertEquals(126, bundled.entries.size());
        assertFalse(bundled.warning.isEmpty());
    }
    @Test public void cancellationNeverPretendsRefreshSucceeded() throws Exception {
        Cancellation cancelled = new Cancellation(); cancelled.cancel();
        CatalogRepository repository = new CatalogRepository(context, (url, limit, cancel) -> { fail("Must not start network"); return null; });
        try { repository.load(true, cancelled); fail(); } catch (IOException expected) { assertTrue(cancelled.isCancelled()); }
    }
    @Test @Config(sdk = 19) public void android44ParsesCatalogAndStaticLogo() throws Exception {
        assertEquals(19, parse(feed(entry())).entries.get(0).minSdk);
    }
    @Test public void networkRestrictsHostsPathsRevisionsAndBoundedReads() throws Exception {
        StoreNetwork.validate(new URL(StoreNetwork.REF_URL));
        StoreNetwork.validate(StoreNetwork.raw(REV, "resource/apps/sample/a.apk"));
        for (String bad : new String[]{"http://raw.githubusercontent.com/ecojust/pureTV/" + REV + "/resource/a.apk",
                "https://raw.githubusercontent.com/other/repo/" + REV + "/resource/a.apk",
                "https://api.github.com/repos/ecojust/pureTV/contents/resource",
                "https://raw.githubusercontent.com/ecojust/pureTV/master/resource/a.apk",
                "https://raw.githubusercontent.com/ecojust/pureTV/" + REV + "/resource/../a.apk",
                "https://user@raw.githubusercontent.com/ecojust/pureTV/" + REV + "/resource/a.apk",
                "https://raw.githubusercontent.com/ecojust/pureTV/" + REV + "/resource/a.apk?token=x"}) {
            try { StoreNetwork.validate(new URL(bad)); fail(bad); } catch (IOException expected) { }
        }
        assertArrayEquals(new byte[]{1, 2}, StoreNetwork.readBounded(new ByteArrayInputStream(new byte[]{1, 2}), 2, new Cancellation()));
        try { StoreNetwork.readBounded(new ByteArrayInputStream(new byte[]{1, 2, 3}), 2, new Cancellation()); fail(); } catch (IOException expected) { }
    }
}
