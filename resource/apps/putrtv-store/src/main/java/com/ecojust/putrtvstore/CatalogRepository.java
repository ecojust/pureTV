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
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;

/** A refreshed feed always refers to one immutable source commit, including all assets. */
public class CatalogRepository {
    public static final int MAX_CATALOG_BYTES = 4 * 1024 * 1024;
    public static final long FRESH_MS = 5 * 60 * 1000L;
    public static final String FEED_PATH = "resource/tv-store-catalog.json";
    public static final String BUNDLED_ASSET = "catalog-snapshot.json";
    private final Context context;
    private final AtomicFile cache;
    private final Transport transport;
    private boolean refreshFailed;

    interface Transport { byte[] read(URL url, int maxBytes, Cancellation cancellation) throws IOException; }
    public CatalogRepository(Context context) { this(context, StoreNetwork::read); }
    CatalogRepository(Context context, Transport transport) {
        this.context = context.getApplicationContext(); this.transport = transport;
        this.cache = new AtomicFile(new File(this.context.getFilesDir(), "tv-store-catalog-cache.json"));
    }

    public synchronized StoreCatalog load(boolean force, Cancellation cancellation) throws IOException {
        cancellation.check();
        StoreCatalog previous = null;
        try (InputStream input = cache.openRead()) {
            previous = snapshot(StoreNetwork.readBounded(input, MAX_CATALOG_BYTES, cancellation), false);
        } catch (IOException ignored) { cancellation.check(); }
        long now = System.currentTimeMillis();
        if (!force && !refreshFailed && previous != null && now >= previous.fetchedAt && now - previous.fetchedAt < FRESH_MS) return previous;
        try {
            JSONObject ref = object(transport.read(new URL(StoreNetwork.REF_URL), 64 * 1024, cancellation));
            JSONObject target = requireObject(ref, "object");
            if (!string(target, "type", 32, false).equals("commit")) throw new IOException("Repository ref is not a commit");
            String revision = string(target, "sha", 40, false);
            if (!StoreNetwork.validRevision(revision)) throw new IOException("Invalid repository revision");
            byte[] bytes = transport.read(StoreNetwork.raw(revision, FEED_PATH), MAX_CATALOG_BYTES, cancellation);
            cancellation.check();
            StoreCatalog live = parse(bytes, revision, "GitHub", now, false, "");
            refreshFailed = false;
            try { save(bytes, revision, now, cancellation); }
            catch (IOException failedCache) {
                cancellation.check();
                return new StoreCatalog(revision, "GitHub", "Live catalog loaded; offline cache could not be saved.", now, false, live.entries);
            }
            return live;
        } catch (IOException failure) {
            cancellation.check(); refreshFailed = true;
            if (previous == null) {
                try (InputStream input = context.getAssets().open(BUNDLED_ASSET)) {
                    previous = snapshot(StoreNetwork.readBounded(input, MAX_CATALOG_BYTES, cancellation), true);
                } catch (IOException invalidBundle) {
                    cancellation.check(); throw new IOException("Cannot load the online or bundled catalog", failure);
                }
            }
            return new StoreCatalog(previous.revision, previous.source,
                    "Online refresh failed; showing a saved catalog. Newer versions may be available.",
                    previous.fetchedAt, true, previous.entries);
        }
    }

    private StoreCatalog snapshot(byte[] bytes, boolean bundled) throws IOException {
        JSONObject wrapper = object(bytes); fields(wrapper, "revision", "fetchedAt", "catalog");
        String revision = string(wrapper, "revision", 40, false);
        long fetchedAt = number(wrapper, "fetchedAt", 0, Long.MAX_VALUE);
        JSONObject feed = requireObject(wrapper, "catalog");
        return parse(feed.toString().getBytes(StandardCharsets.UTF_8), revision,
                bundled ? "Bundled snapshot" : "Saved GitHub catalog", fetchedAt, bundled,
                bundled ? "Bundled catalog; connect to check for newer versions." : "");
    }

    private void save(byte[] bytes, String revision, long fetchedAt, Cancellation cancellation) throws IOException {
        FileOutputStream output = null;
        try {
            JSONObject wrapper = new JSONObject(); wrapper.put("revision", revision);
            wrapper.put("fetchedAt", fetchedAt); wrapper.put("catalog", object(bytes));
            byte[] encoded = wrapper.toString().getBytes(StandardCharsets.UTF_8);
            if (encoded.length > MAX_CATALOG_BYTES) throw new IOException("Catalog cache is too large");
            cancellation.check(); output = cache.startWrite(); output.write(encoded);
            cancellation.check(); cache.finishWrite(output); output = null;
        } catch (JSONException failure) { throw new IOException("Invalid cache data", failure); }
        finally { if (output != null) cache.failWrite(output); }
    }

    public static StoreCatalog parse(byte[] bytes, String revision, String source, long fetchedAt,
            boolean stale, String warning) throws IOException {
        if (!StoreNetwork.validRevision(revision)) throw new IOException("Invalid catalog revision");
        JSONObject feed = object(bytes); fields(feed, "schemaVersion", "entries");
        if (number(feed, "schemaVersion", 1, 1) != 1) throw new IOException("Unsupported catalog version");
        Object list = feed.opt("entries");
        if (!(list instanceof JSONArray)) throw new IOException("Missing catalog entries");
        JSONArray items = (JSONArray) list;
        if (items.length() < 1 || items.length() > 1024) throw new IOException("Invalid catalog entry count");
        List<StoreEntry> entries = new ArrayList<>(); Set<String> packages = new HashSet<>(), ids = new HashSet<>();
        for (int i = 0; i < items.length(); i++) {
            Object value = items.opt(i);
            if (!(value instanceof JSONObject)) throw new IOException("Invalid catalog entry");
            JSONObject item = (JSONObject) value;
            fields(item, "id", "name", "nameEn", "description", "descriptionEn", "category", "packageName",
                    "versionName", "apkPath", "coverPath", "logoSvg", "sha256", "certificateSha256", "gitBlobSha", "versionCode", "bytes", "minSdk");
            String id = string(item, "id", 120, false), category = string(item, "category", 16, false);
            if (!id.matches("(?:launcher|apps)/[a-z0-9][a-z0-9-]*") || !ids.add(id)) throw new IOException("Invalid or duplicate catalog id");
            if (!Arrays.asList("launcher", "media", "game", "tools").contains(category)
                    || (id.startsWith("launcher/") != category.equals("launcher"))) throw new IOException("Invalid catalog category");
            String packageName = string(item, "packageName", 255, false);
            if (!packageName.matches("[A-Za-z_][A-Za-z0-9_]*(?:\\.[A-Za-z_][A-Za-z0-9_]*)+") || !packages.add(packageName))
                throw new IOException("Invalid or duplicate package identity");
            String apk = string(item, "apkPath", 512, false), cover = string(item, "coverPath", 512, true);
            String prefix = "resource/" + id + "/";
            if (!StoreNetwork.validPath(apk) || !apk.startsWith(prefix) || apk.substring(prefix.length()).contains("/") || !apk.endsWith(".apk"))
                throw new IOException("APK path does not match catalog identity");
            if (!cover.isEmpty() && (!StoreNetwork.validPath(cover) || !cover.startsWith(prefix)
                    || cover.substring(prefix.length()).contains("/") || !cover.endsWith(".png"))) throw new IOException("Invalid cover path");
            String logo = string(item, "logoSvg", 8192, true);
            if (!logo.isEmpty() && !safeLogo(logo)) throw new IOException("Unsafe catalog logo");
            entries.add(new StoreEntry(id, string(item, "name", 160, false), string(item, "nameEn", 160, false),
                    string(item, "description", 2048, true), string(item, "descriptionEn", 2048, true), category, packageName,
                    string(item, "versionName", 80, false), apk, cover, logo, hash(item, "sha256", 64),
                    hash(item, "certificateSha256", 64), hash(item, "gitBlobSha", 40),
                    number(item, "versionCode", 1, Long.MAX_VALUE), number(item, "bytes", 1, StoreDownloader.MAX_APK_BYTES),
                    (int) number(item, "minSdk", 1, 1000)));
        }
        return new StoreCatalog(revision, source, warning, fetchedAt, stale, entries);
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
    private static void fields(JSONObject object, String... names) throws IOException {
        Set<String> expected = new HashSet<>(Arrays.asList(names));
        for (Iterator<String> it = object.keys(); it.hasNext();) if (!expected.remove(it.next())) throw new IOException("Unknown catalog field");
        if (!expected.isEmpty()) throw new IOException("Missing catalog fields");
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
