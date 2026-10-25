package com.ecojust.cctvlive;

import android.content.Context;
import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** A bounded, bundled M3U catalog. URLs are data, never assembled from channel identifiers. */
final class ChannelCatalog {
    static final int MAX_BYTES = 512 * 1024, MAX_CHANNELS = 100, MAX_ROUTES = 4;
    private static final Pattern ATTRIBUTE = Pattern.compile("([\\w-]+)\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s,]+))");

    static final class Channel {
        final String id, name, englishName;
        final List<Route> routes;
        Channel(String id, String name, String englishName, List<Route> routes) {
            this.id = id; this.name = name; this.englishName = englishName;
            this.routes = Collections.unmodifiableList(new ArrayList<>(routes));
        }
        String displayName(Context context) { return english(context) && !englishName.isEmpty() ? englishName : name; }
    }

    static final class Route {
        final String label, englishLabel, url;
        Route(String label, String englishLabel, String url) {
            this.label = label; this.englishLabel = englishLabel; this.url = url;
        }
        String displayName(Context context) { return english(context) && !englishLabel.isEmpty() ? englishLabel : label; }
    }

    private ChannelCatalog() {}
    private static boolean english(Context context) {
        return "en".equals(context.getResources().getConfiguration().getLocales().get(0).getLanguage());
    }

    static List<Channel> load(Context context) throws IOException {
        return parse(read(context.getAssets().open("channels.m3u")));
    }

    static List<Channel> parse(byte[] bytes) throws IOException {
        if (bytes == null || bytes.length == 0) throw new IOException("Empty channel catalog");
        if (bytes.length > MAX_BYTES) throw new IOException("Channel catalog exceeds 512 KiB");
        String text;
        try {
            text = StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException error) {
            throw new IOException("Channel catalog is not UTF-8", error);
        }
        if (text.startsWith("\uFEFF")) text = text.substring(1);
        Map<String, Builder> found = new LinkedHashMap<>();
        Map<String, String> attributes = null;
        String title = null;
        boolean header = false;
        try (BufferedReader reader = new BufferedReader(new StringReader(text))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (Thread.currentThread().isInterrupted()) throw new IOException("Channel catalog loading cancelled");
                line = line.trim();
                if (line.isEmpty()) continue;
                if (!header) {
                    if (!line.equals("#EXTM3U") && !line.startsWith("#EXTM3U ")) throw new IOException("Missing M3U header");
                    header = true; continue;
                }
                if (line.startsWith("#EXT-X-")) throw new IOException("Expected channel catalog, not HLS playlist");
                if (line.startsWith("#EXTINF:")) {
                    if (attributes != null) throw new IOException("Channel has no stream URL");
                    int comma = titleComma(line);
                    if (comma < 0) throw new IOException("Invalid channel metadata");
                    attributes = new HashMap<>();
                    Matcher matcher = ATTRIBUTE.matcher(line.substring(0, comma));
                    while (matcher.find()) attributes.put(matcher.group(1), matcher.group(2) != null ? matcher.group(2)
                            : matcher.group(3) != null ? matcher.group(3) : matcher.group(4));
                    title = line.substring(comma + 1).trim();
                    continue;
                }
                if (line.startsWith("#")) continue;
                // Bare URLs and comments are not routes; every route needs an EXTINF record.
                if (attributes == null) continue;
                String url = safeUrl(line);
                String name = field(title.isEmpty() ? attributes.getOrDefault("tvg-name", "") : title, 120, false);
                String id = field(attributes.getOrDefault("tvg-id", name), 160, false);
                String englishName = field(attributes.getOrDefault("tvg-name-en", ""), 160, true);
                Builder channel = found.get(id);
                if (channel == null) {
                    if (found.size() >= MAX_CHANNELS) throw new IOException("Too many channels");
                    channel = new Builder(id, name, englishName); found.put(id, channel);
                }
                boolean duplicate = false;
                for (Route route : channel.routes) if (route.url.equals(url)) { duplicate = true; break; }
                if (!duplicate) {
                    if (channel.routes.size() >= MAX_ROUTES) throw new IOException("Too many channel routes");
                    int number = channel.routes.size() + 1;
                    String label = field(attributes.getOrDefault("route-name", "线路 " + number), 80, false);
                    String englishLabel = field(attributes.getOrDefault("route-name-en", "Route " + number), 80, true);
                    channel.routes.add(new Route(label, englishLabel, url));
                }
                attributes = null;
            }
        }
        if (attributes != null) throw new IOException("Channel has no stream URL");
        if (found.isEmpty()) throw new IOException("No channels in catalog");
        List<Channel> result = new ArrayList<>();
        for (Builder channel : found.values()) result.add(new Channel(channel.id, channel.name, channel.englishName, channel.routes));
        return Collections.unmodifiableList(result);
    }

    static String safeUrl(String address) throws IOException {
        if (address == null || address.trim().isEmpty() || address.length() > 8192) throw new IOException("Invalid stream URL length");
        try {
            URI uri = new URI(address.trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    || uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null
                    || uri.getPort() == 0 || uri.getPort() > 65535) throw new IOException("Unsupported stream URL");
            return uri.toASCIIString();
        } catch (URISyntaxException error) {
            throw new IOException("Invalid stream URL", error);
        }
    }

    static byte[] read(InputStream input) throws IOException {
        try (InputStream stream = input; ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192]; int count;
            while ((count = stream.read(buffer)) != -1) {
                if (Thread.currentThread().isInterrupted()) throw new IOException("Channel catalog loading cancelled");
                if (output.size() + count > MAX_BYTES) throw new IOException("Channel catalog exceeds 512 KiB");
                output.write(buffer, 0, count);
            }
            return output.toByteArray();
        }
    }

    private static String field(String value, int maximum, boolean allowEmpty) throws IOException {
        value = value.trim();
        if ((!allowEmpty && value.isEmpty()) || value.length() > maximum) throw new IOException("Invalid channel metadata length");
        for (int i = 0; i < value.length(); i++) if (Character.isISOControl(value.charAt(i))) throw new IOException("Invalid channel metadata text");
        return value;
    }

    private static int titleComma(String line) {
        char quote = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if ((c == '\'' || c == '"') && (quote == 0 || quote == c)) quote = quote == 0 ? c : 0;
            if (c == ',' && quote == 0) return i;
        }
        return -1;
    }

    private static final class Builder {
        final String id, name, englishName;
        final List<Route> routes = new ArrayList<>();
        Builder(String id, String name, String englishName) { this.id = id; this.name = name; this.englishName = englishName; }
    }
}
