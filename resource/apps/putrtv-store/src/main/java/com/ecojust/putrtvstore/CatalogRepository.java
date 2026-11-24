package com.ecojust.putrtvstore;

import android.content.Context;
import android.util.AtomicFile;
import android.util.JsonReader;
import android.util.JsonToken;
import android.util.Xml;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.List;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;

/** Live market membership comes from the same server directories as the desktop manager. */
public class CatalogRepository {
    public static final int MAX_CATALOG_BYTES = 4 * 1024 * 1024;
    public static final long FRESH_MS = 5 * 60 * 1000L;
    public static final String BUNDLED_ASSET = "catalog-snapshot.json";
    private final Context context;
    private final AtomicFile cache;
    private final MarketDirectory.Transport transport;
    private boolean refreshFailed;

    public CatalogRepository(Context context) {
        this(context, new MarketDirectory.Transport() {
            @Override public byte[] read(URL url, int limit, Cancellation cancel) throws IOException {
                return StoreNetwork.read(url, limit, cancel);
            }
            @Override public MarketDirectory.Metadata head(URL url, Cancellation cancel) throws IOException {
                return StoreNetwork.head(url, cancel);
            }
        });
    }

    CatalogRepository(Context context, MarketDirectory.Transport transport) {
        this.context = context.getApplicationContext();
        this.transport = transport;
        this.cache = new AtomicFile(new File(this.context.getFilesDir(), "market-directory-cache-v3.json"));
    }

    public synchronized StoreCatalog load(boolean force, Cancellation cancel) throws IOException {
        cancel.check();
        StoreCatalog cached = null;
        try (InputStream input = cache.openRead()) {
            cached = snapshot(input, "Saved APK market", cancel);
        } catch (IOException ignored) { cancel.check(); }
        long now = System.currentTimeMillis();
        if (!force && !refreshFailed && cached != null && now >= cached.fetchedAt && now - cached.fetchedAt < FRESH_MS)
            return cached;

        StoreCatalog bundled = null;
        try (InputStream input = context.getAssets().open(BUNDLED_ASSET)) {
            bundled = snapshot(input, "Bundled APK market", cancel);
        } catch (IOException ignored) { cancel.check(); }
        try {
            JSONObject feed = MarketDirectory.load(transport, cancel);
            enrich(feed, bundled);
            StoreCatalog live = parse(feed, StoreNetwork.SOURCE, now, false, "");
            cancel.check();
            refreshFailed = false;
            try { save(feed, now, cancel); } catch (IOException failure) {
                cancel.check();
                return new StoreCatalog(live.revision, live.source, "Live market loaded; offline cache could not be saved.", now, false, live.entries);
            }
            return live;
        } catch (IOException | JSONException failure) {
            cancel.check(); refreshFailed = true;
            StoreCatalog fallback = cached != null ? cached : bundled;
            if (fallback == null) throw new IOException("Cannot load the online or saved APK market", failure);
            return new StoreCatalog(fallback.revision, fallback.source, "Market refresh failed; showing a saved list.",
                    fallback.fetchedAt, true, fallback.entries);
        }
    }

    private StoreCatalog snapshot(InputStream stream, String source, Cancellation cancel) throws IOException {
        JSONObject wrapper = object(StoreNetwork.readBounded(stream, MAX_CATALOG_BYTES, cancel));
        if (!StoreNetwork.SOURCE.equals(string(wrapper, "source", 256, false))) throw new IOException("Unknown market source");
        return parse(requireObject(wrapper, "catalog"), source, number(wrapper, "fetchedAt", 1, Long.MAX_VALUE), false, "");
    }

    private void save(JSONObject feed, long fetchedAt, Cancellation cancel) throws IOException {
        FileOutputStream output = null;
        try {
            JSONObject wrapper = new JSONObject().put("source", StoreNetwork.SOURCE).put("fetchedAt", fetchedAt).put("catalog", feed);
            byte[] encoded = wrapper.toString().getBytes(StandardCharsets.UTF_8);
            if (encoded.length > MAX_CATALOG_BYTES) throw new IOException("Catalog cache is too large");
            cancel.check(); output = cache.startWrite(); output.write(encoded); cancel.check();
            cache.finishWrite(output); output = null;
        } catch (JSONException e) { throw new IOException("Invalid cache document", e); }
        finally { if (output != null) cache.failWrite(output); }
    }

    /** Attach inspected package metadata only to the exact live file represented by that receipt. */
    static void enrich(JSONObject feed, StoreCatalog bundled) throws IOException, JSONException {
        if (bundled == null) return;
        Map<String, StoreEntry> known = new HashMap<>();
        for (StoreEntry entry : bundled.entries) known.put(entry.apkPath, entry);
        JSONArray rows = feed.getJSONArray("entries");
        for (int i = 0; i < rows.length(); i++) {
            JSONObject row = rows.getJSONObject(i);
            StoreEntry entry = known.get(row.getString("apkPath"));
            if (entry == null || !entry.hasPackageIdentity() || row.getLong("bytes") != entry.bytes) continue;
            String checksum = row.getString("sha256");
            boolean sameFile = checksum.isEmpty() ? StoreNetwork.strongEtag(entry.etag) && entry.etag.equals(row.getString("etag"))
                    : checksum.equals(entry.sha256);
            if (sameFile) row.put("sha256", entry.sha256).put("gitBlobSha", entry.gitBlobSha)
                    .put("certificateSha256", entry.certificateSha256).put("packageName", entry.packageName)
                    .put("apkVersionName", entry.versionName).put("versionCode", entry.versionCode).put("minSdk", entry.minSdk);
        }
    }

    static StoreCatalog parse(JSONObject feed, String source, long fetchedAt, boolean stale, String warning) throws IOException {
        number(feed, "schemaVersion", 3, 3);
        JSONArray items = feed.optJSONArray("entries");
        if (items == null || items.length() > 1024) throw new IOException("Invalid market entries");
        List<StoreEntry> entries = new ArrayList<>();
        Set<String> paths = new HashSet<>();
        for (int i = 0; i < items.length(); i++) {
            JSONObject item = items.optJSONObject(i);
            if (item == null) throw new IOException("Invalid market entry");
            String path = string(item, "apkPath", 2048, false);
            String category = string(item, "category", 16, false);
            if (!StoreNetwork.validApkPath(path) || !path.startsWith(category + "/") ||
                    !path.equals(string(item, "id", 2048, false)) || !paths.add(path)) throw new IOException("Invalid or duplicate APK path");
            String cover = string(item, "coverPath", 2048, true);
            if (!cover.isEmpty() && (!StoreNetwork.validPath(cover) || !cover.endsWith(".png") ||
                    !cover.substring(0, cover.lastIndexOf('/') + 1).equals(path.substring(0, path.lastIndexOf('/') + 1))))
                throw new IOException("Invalid market cover");
            String etag = string(item, "etag", 512, true), date = string(item, "lastModified", 29, true);
            if ((!etag.isEmpty() && !StoreNetwork.strongEtag(etag)) || (!date.isEmpty() && !StoreNetwork.validModified(date)) ||
                    (etag.isEmpty() && date.isEmpty())) throw new IOException("Invalid APK validators");
            String digest = string(item, "sha256", 64, true);
            if (!digest.isEmpty() && !digest.matches("[a-f0-9]{64}")) throw new IOException("Invalid APK checksum");
            String name = string(item, "name", 512, false), version = string(item, "versionName", 255, true);
            long bytes = number(item, "bytes", 1, StoreDownloader.MAX_APK_BYTES);
            String provider = string(item, "provider", 512, true);
            Object artwork = item.opt("logoSvg");
            String logo = artwork instanceof String ? (String) artwork : "";
            if (!logo.isEmpty() && !safeLogo(logo)) logo = "";
            StoreEntry entry = new StoreEntry(path, name, "", "", "", category, "", "", path, cover, logo, digest, "", "",
                    0, bytes, 0, etag, date, provider, version);
            if (item.has("packageName")) {
                String pkg = string(item, "packageName", 255, false);
                if (!pkg.matches("[a-zA-Z_][a-zA-Z0-9_]*(?:\\.[a-zA-Z_][a-zA-Z0-9_]*)+")) throw new IOException("Invalid APK package");
                entry = entry.withIdentity(pkg, string(item, "apkVersionName", 255, true),
                        number(item, "versionCode", 1, Long.MAX_VALUE), (int) number(item, "minSdk", 1, 1000),
                        hash(item, "sha256", 64), hash(item, "certificateSha256", 64), hash(item, "gitBlobSha", 40));
            }
            entries.add(entry);
        }
        return new StoreCatalog(Long.toString(fetchedAt), source, warning, fetchedAt, stale, entries);
    }

    private static String hash(JSONObject object, String key, int length) throws IOException {
        String value = string(object, key, length, false);
        if (!value.matches("[a-f0-9]{" + length + "}")) throw new IOException("Invalid " + key);
        return value;
    }
    private static JSONObject requireObject(JSONObject object, String key) throws IOException {
        Object value = object.opt(key);
        if (!(value instanceof JSONObject)) throw new IOException("Invalid " + key);
        return (JSONObject) value;
    }
    private static String string(JSONObject object, String key, int max, boolean empty) throws IOException {
        Object value = object.opt(key);
        if (!(value instanceof String)) throw new IOException("Invalid " + key);
        String text = (String) value;
        if (text.length() > max || (!empty && text.trim().isEmpty()) || text.indexOf('\0') >= 0)
            throw new IOException("Invalid " + key);
        return text;
    }
    private static long number(JSONObject object, String key, long min, long max) throws IOException {
        Object value = object.opt(key);
        if (!(value instanceof Long) && !(value instanceof Integer)) throw new IOException("Invalid " + key);
        long number = ((Number) value).longValue();
        if (number < min || number > max) throw new IOException("Out of range " + key);
        return number;
    }
    /** Android's JSONObject parser accepts duplicate keys and lenient JSON. Use strict streaming first. */
    private static JSONObject object(byte[] bytes) throws IOException {
        if (bytes.length > MAX_CATALOG_BYTES) throw new IOException("Catalog exceeds size limit");
        try {
            String text = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString();
            try (JsonReader reader = new JsonReader(new StringReader(text))) {
                reader.setLenient(false);
                Object value = readValue(reader, 0);
                if (!(value instanceof JSONObject) || reader.peek() != JsonToken.END_DOCUMENT) throw new IOException("Invalid JSON document");
                return (JSONObject) value;
            }
        } catch (JSONException | IllegalStateException | NumberFormatException failure) { throw new IOException("Invalid catalog JSON", failure); }
    }
    private static Object readValue(JsonReader reader, int depth) throws IOException, JSONException {
        if (depth > 8) throw new IOException("Catalog JSON is too deeply nested");
        switch (reader.peek()) {
            case BEGIN_OBJECT:
                reader.beginObject(); JSONObject object = new JSONObject();
                while (reader.hasNext()) {
                    String key = reader.nextName();
                    if (key.length() > 80 || object.has(key)) throw new IOException("Invalid or duplicate JSON field");
                    object.put(key, readValue(reader, depth + 1));
                }
                reader.endObject(); return object;
            case BEGIN_ARRAY:
                reader.beginArray(); JSONArray array = new JSONArray();
                while (reader.hasNext()) {
                    if (array.length() >= 1024) throw new IOException("JSON array is too large");
                    array.put(readValue(reader, depth + 1));
                }
                reader.endArray(); return array;
            case STRING:
                String value = reader.nextString();
                if (value.length() > 16384) throw new IOException("JSON string is too large");
                return value;
            case NUMBER:
                String number = reader.nextString();
                if (!number.matches("-?(?:0|[1-9][0-9]*)")) throw new IOException("Expected integer JSON number");
                return Long.parseLong(number);
            case BOOLEAN: return reader.nextBoolean();
            case NULL: reader.nextNull(); return JSONObject.NULL;
            default: throw new IOException("Invalid JSON token");
        }
    }

    static boolean safeLogo(String svg) {
        if (svg.getBytes(StandardCharsets.UTF_8).length > 8192 || svg.matches("(?is).*(?:<!DOCTYPE|<!ENTITY).*")) return false;
        Set<String> tags = new HashSet<>(Arrays.asList("svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline", "polygon"));
        Set<String> attrs = new HashSet<>(Arrays.asList("viewBox", "width", "height", "x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "d", "points", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill-rule", "clip-rule", "opacity", "fill-opacity", "stroke-opacity", "transform", "color"));
        try {
            XmlPullParser parser = Xml.newPullParser(); parser.setFeature(XmlPullParser.FEATURE_PROCESS_NAMESPACES, true);
            parser.setInput(new StringReader(svg)); boolean root = false; int roots = 0;
            int event;
            while ((event = parser.nextToken()) != XmlPullParser.END_DOCUMENT) {
                if (event == XmlPullParser.DOCDECL || event == XmlPullParser.ENTITY_REF || event == XmlPullParser.PROCESSING_INSTRUCTION) return false;
                if ((event == XmlPullParser.TEXT || event == XmlPullParser.CDSECT) && !parser.getText().trim().isEmpty()) return false;
                if (event != XmlPullParser.START_TAG) continue;
                if (parser.getDepth() == 1) { roots++; if (!parser.getName().equals("svg")) return false; root = true; }
                if (!tags.contains(parser.getName()) || parser.getDepth() > 32) return false;
                String ns = parser.getNamespace();
                if (ns != null && !ns.isEmpty() && !ns.equals("http://www.w3.org/2000/svg")) return false;
                for (int i = 0; i < parser.getAttributeCount(); i++) {
                    String attrNs = parser.getAttributeNamespace(i), attrValue = parser.getAttributeValue(i);
                    if ((attrNs != null && !attrNs.isEmpty()) || !attrs.contains(parser.getAttributeName(i))
                            || attrValue.matches("(?is).*(?:url|javascript:|http:|https:|data:|@import|[<>]).*")) return false;
                }
            }
            return root && roots == 1;
        } catch (Exception ignored) { return false; }
    }
}
