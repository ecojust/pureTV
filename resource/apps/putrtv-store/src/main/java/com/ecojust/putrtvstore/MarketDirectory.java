package com.ecojust.putrtvstore;

import java.io.IOException;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TreeMap;
import java.util.TreeSet;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Reads the same Nginx directory indexes and application groups as the desktop APK market. */
final class MarketDirectory {
    interface Transport {
        byte[] read(URL url, int maxBytes, Cancellation cancellation) throws IOException;
        Metadata head(URL url, Cancellation cancellation) throws IOException;
    }

    static final class Metadata {
        final long bytes;
        final String etag, lastModified;

        Metadata(long bytes, String etag, String lastModified) {
            this.bytes = bytes;
            this.etag = etag == null ? "" : etag;
            this.lastModified = lastModified == null ? "" : lastModified;
        }
    }

    private static final int LOGO_BYTES = 8192;
    private static final int PAGE_BYTES = 4 * 1024 * 1024, MAX_FILES = 8192;
    private static final Pattern ANCHOR = Pattern.compile("<a(?=\\s)", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTRIBUTE = Pattern.compile(
            "\\s+([a-zA-Z0-9:_-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)')");
    private static final Pattern ENTITY = Pattern.compile("&(amp|lt|gt|quot|apos|#[0-9]{1,7}|#[xX][a-fA-F0-9]{1,6});");
    private static final Pattern FILE_VERSION = Pattern.compile("(.+)-([0-9]{1,10}(?:\\.[0-9]{1,10}){1,3})");
    private static final Pattern SHA256 = Pattern.compile("[0-9a-f]{64}");
    private static final Pattern CONTROL = Pattern.compile("[\\p{Cc}]");

    private MarketDirectory() { }

    static JSONObject load(Transport transport, Cancellation cancellation) throws IOException {
        ExecutorService workers = Executors.newFixedThreadPool(6);
        try {
            Set<String> folders = new TreeSet<>(), files = new TreeSet<>();
            List<Callable<Set<String>>> roots = new ArrayList<>();
            for (String root : Arrays.asList("launcher", "media", "game")) {
                roots.add(() -> children(transport, root, cancellation));
            }
            for (Future<Set<String>> result : submit(workers, roots)) {
                for (String path : await(result, cancellation)) {
                    if (path.endsWith("/")) folders.add(path.substring(0, path.length() - 1));
                    else files.add(path);
                }
            }
            if (folders.size() > 256 || files.size() > MAX_FILES) throw new IOException("Market directory is too large");
            List<Callable<Set<String>>> listings = new ArrayList<>();
            for (String folder : folders) listings.add(() -> children(transport, folder, cancellation));
            for (Future<Set<String>> result : submit(workers, listings)) {
                for (String path : await(result, cancellation)) if (!path.endsWith("/")) files.add(path);
                if (files.size() > MAX_FILES) throw new IOException("Market file inventory is too large");
            }
            return catalog(transport, workers, files, cancellation);
        } finally {
            workers.shutdownNow();
        }
    }

    private static <T> List<Future<T>> submit(ExecutorService workers, List<Callable<T>> tasks) {
        List<Future<T>> results = new ArrayList<>();
        for (Callable<T> task : tasks) results.add(workers.submit(task));
        return results;
    }

    private static <T> T await(Future<T> result, Cancellation cancellation) throws IOException {
        while (true) {
            cancellation.check();
            try {
                return result.get(150, TimeUnit.MILLISECONDS);
            } catch (TimeoutException timeout) {
                // Poll cancellation while another worker is waiting on a socket.
            } catch (InterruptedException interrupted) {
                Thread.currentThread().interrupt();
                throw new IOException("Market fetch interrupted", interrupted);
            } catch (ExecutionException failed) {
                if (failed.getCause() instanceof IOException) throw (IOException) failed.getCause();
                throw new IOException("Market fetch failed", failed.getCause());
            }
        }
    }

    private static Set<String> children(Transport transport, String folder, Cancellation cancellation) throws IOException {
        cancellation.check();
        byte[] data = transport.read(StoreNetwork.market(folder + "/"), PAGE_BYTES, cancellation);
        if (data.length > PAGE_BYTES) throw new IOException("Market index exceeds size limit");
        String html;
        try { html = StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(data)).toString(); }
        catch (CharacterCodingException invalid) { throw new IOException("Invalid UTF-8 in market index", invalid); }
        String lower = html.toLowerCase(Locale.ROOT);
        if (!lower.contains("<title>index of ") || !lower.contains("<pre>") || !lower.contains("</pre>"))
            throw new IOException("Missing market directory index for " + folder);
        Set<String> entries = new TreeSet<>();
        int count = 0, start = 0;
        // Match tags case-insensitively without changing indices for Unicode filenames.
        Matcher anchors = ANCHOR.matcher(html);
        while (anchors.find(start)) {
            cancellation.check();
            if (++count > MAX_FILES) throw new IOException("Too many links in market index");
            int end = html.indexOf('>', anchors.end());
            if (end == -1) throw new IOException("Invalid market directory link");
            Matcher attributes = ATTRIBUTE.matcher(html.substring(anchors.end(), end));
            start = end + 1;
            while (attributes.find()) {
                if (!"href".equalsIgnoreCase(attributes.group(1))) continue;
                String href = attributes.group(2) != null ? attributes.group(2) : attributes.group(3);
                String child = childPath(folder, href);
                if (child != null) entries.add(child);
                break;
            }
        }
        return entries;
    }

    private static String childPath(String folder, String href) {
        StringBuffer value = new StringBuffer();
        Matcher entities = ENTITY.matcher(href);
        int consumed = 0;
        while (entities.find()) {
            int amp = href.indexOf('&', consumed);
            if (amp != entities.start()) return null;
            consumed = entities.end();
            String entity = entities.group(1), expanded;
            switch (entity) {
                case "amp": expanded = "&"; break;
                case "lt": expanded = "<"; break;
                case "gt": expanded = ">"; break;
                case "quot": expanded = "\""; break;
                case "apos": expanded = "'"; break;
                default:
                    boolean hex = entity.charAt(1) == 'x' || entity.charAt(1) == 'X';
                    int point = Integer.parseInt(entity.substring(hex ? 2 : 1), hex ? 16 : 10);
                    if (!Character.isValidCodePoint(point) || (point >= 0xd800 && point <= 0xdfff)) return null;
                    expanded = new String(Character.toChars(point));
            }
            entities.appendReplacement(value, Matcher.quoteReplacement(expanded));
        }
        if (href.indexOf('&', consumed) >= 0) return null;
        entities.appendTail(value);
        String relative = value.toString();
        boolean directory = relative.endsWith("/");
        String leaf = directory ? relative.substring(0, relative.length() - 1) : relative;
        if (leaf.isEmpty() || leaf.indexOf('/') >= 0 || leaf.indexOf(':') >= 0 || leaf.indexOf('?') >= 0 || leaf.indexOf('#') >= 0) return null;
        try { leaf = URLDecoder.decode(leaf.replace("+", "%2B"), "UTF-8"); }
        catch (IllegalArgumentException | IOException invalid) { return null; }
        if (leaf.startsWith(".") || leaf.indexOf('/') >= 0 || leaf.indexOf('\\') >= 0 || leaf.indexOf('\ufffd') >= 0
                || CONTROL.matcher(leaf).find() || leaf.getBytes(StandardCharsets.UTF_8).length > 255) return null;
        return folder + "/" + leaf + (directory ? "/" : "");
    }

    private static final class Apk implements Comparable<Apk> {
        final String path, folder, file, name, version;
        final long[] numbers = new long[4];
        final int components;

        Apk(String path) {
            this.path = path;
            int slash = path.lastIndexOf('/');
            folder = path.substring(0, slash);
            file = path.substring(slash + 1);
            String stem = file.substring(0, file.length() - 4);
            Matcher match = FILE_VERSION.matcher(stem);
            if (match.matches()) {
                name = match.group(1);
                version = match.group(2);
                String[] parts = version.split("\\.");
                components = parts.length;
                for (int i = 0; i < parts.length; i++) numbers[i] = Long.parseLong(parts[i]);
            } else {
                name = stem.isEmpty() ? file : stem;
                version = "";
                components = 0;
            }
        }

        public int compareTo(Apk other) {
            if (version.isEmpty() != other.version.isEmpty()) return version.isEmpty() ? 1 : -1;
            for (int i = 0; i < numbers.length; i++) {
                if (numbers[i] != other.numbers[i]) return numbers[i] > other.numbers[i] ? -1 : 1;
            }
            // Desktop uses English numeric collation for ties. Inside this group
            // the folder and name match. Leading zeroes compare equal, one more
            // numeric component sorts before ".apk", and lowercase sorts first.
            if (components != other.components) return other.components - components;
            String ext = file.substring(file.length() - 3);
            return other.file.substring(other.file.length() - 3).compareTo(ext);
        }
    }

    private static String optionalText(Transport transport, String path, int limit, long deadline, Cancellation cancellation)
            throws IOException {
        cancellation.check();
        if (System.nanoTime() - deadline >= 0) return "";
        try {
            byte[] bytes = transport.read(StoreNetwork.market(path), limit, cancellation);
            if (bytes.length <= limit) return StandardCharsets.UTF_8.newDecoder().decode(ByteBuffer.wrap(bytes)).toString();
        } catch (IOException unavailable) {
            cancellation.check();
        }
        return "";
    }

    private static JSONObject catalog(Transport transport, ExecutorService workers, Set<String> files,
            Cancellation cancellation) throws IOException {
        Map<String, List<Apk>> groups = new TreeMap<>();
        Set<String> folders = new TreeSet<>();
        int count = 0;
        for (String path : files) {
            if (!path.toLowerCase(Locale.ROOT).endsWith(".apk")) continue;
            if (++count > 1024) throw new IOException("Too many APKs in market");
            Apk apk = new Apk(path);
            String group = apk.folder + "/" + apk.name;
            if (!groups.containsKey(group)) groups.put(group, new ArrayList<>());
            groups.get(group).add(apk);
            folders.add(apk.folder);
        }

        Map<String, Future<JSONObject>> manifests = new HashMap<>();
        Map<String, Future<String>> logos = new HashMap<>();
        long metadataDeadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(45);
        for (String folder : folders) {
            String manifestPath = folder + "/manifest.json", logoPath = folder + "/logo.svg";
            if (files.contains(manifestPath)) manifests.put(folder, workers.submit(() -> {
                String text = optionalText(transport, manifestPath, 65536, metadataDeadline, cancellation);
                try { return new JSONObject(text); }
                catch (JSONException malformed) { return null; }
            }));
            if (files.contains(logoPath)) logos.put(folder, workers.submit(() -> {
                String svg = optionalText(transport, logoPath, LOGO_BYTES, metadataDeadline, cancellation);
                return !svg.isEmpty() && CatalogRepository.safeLogo(svg) ? svg : "";
            }));
        }
        List<Callable<JSONObject>> jobs = new ArrayList<>();
        for (List<Apk> versions : groups.values()) {
            Collections.sort(versions);
            for (Apk apk : versions.subList(0, Math.min(5, versions.size()))) {
                jobs.add(() -> {
                    cancellation.check();
                    Metadata metadata = transport.head(StoreNetwork.market(apk.path), cancellation);
                    Future<JSONObject> manifest = manifests.get(apk.folder);
                    JSONObject item = row(apk, files, metadata, manifest == null ? null : await(manifest, cancellation));
                    Future<String> logo = logos.get(apk.folder);
                    if (logo != null) {
                        String svg = await(logo, cancellation);
                        if (!svg.isEmpty()) item.put("logoSvg", svg);
                    }
                    return item;
                });
            }
        }
        try {
            JSONArray entries = new JSONArray();
            for (Future<JSONObject> result : submit(workers, jobs)) entries.put(await(result, cancellation));
            return new JSONObject().put("schemaVersion", 3).put("entries", entries);
        } catch (JSONException invalid) { throw new IOException("Invalid market catalog", invalid); }
    }

    private static JSONObject row(Apk apk, Set<String> files, Metadata metadata, JSONObject manifest) throws JSONException {
        String cover = "";
        for (String name : Arrays.asList(apk.file.substring(0, apk.file.length() - 4) + ".thumb.png",
                apk.file + ".thumb.png", "thumb.png")) {
            if (files.contains(apk.folder + "/" + name)) { cover = apk.folder + "/" + name; break; }
        }
        String provider = manifest != null && manifest.opt("provider") instanceof String ? manifest.optString("provider").trim() : "";
        if (provider.getBytes(StandardCharsets.UTF_8).length > 512 || CONTROL.matcher(provider).find()) provider = "";
        String digest = "";
        JSONArray packages = manifest == null ? null : manifest.optJSONArray("packages");
        for (int i = 0; packages != null && i < packages.length(); i++) {
            JSONObject item = packages.optJSONObject(i);
            if (item == null || !apk.file.equals(item.opt("file")) || !Long.valueOf(metadata.bytes).equals(asLong(item.opt("bytes")))) continue;
            Object hash = item.opt("sha256");
            String value = hash instanceof String ? ((String) hash).toLowerCase(Locale.ROOT) : "";
            if (!SHA256.matcher(value).matches() || (!digest.isEmpty() && !digest.equals(value))) { digest = ""; break; }
            digest = value;
        }
        return new JSONObject().put("id", apk.path).put("category", apk.path.substring(0, apk.path.indexOf('/')))
                .put("apkPath", apk.path).put("name", apk.name).put("versionName", apk.version).put("coverPath", cover)
                .put("bytes", metadata.bytes).put("etag", metadata.etag).put("lastModified", metadata.lastModified)
                .put("sha256", digest).put("provider", provider);
    }

    private static Long asLong(Object value) {
        return value instanceof Integer || value instanceof Long ? ((Number) value).longValue() : null;
    }
}
