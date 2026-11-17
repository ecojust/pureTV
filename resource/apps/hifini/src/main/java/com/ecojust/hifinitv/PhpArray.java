package com.ecojust.hifinitv;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Strict, bounded reader for the site's observed PHP print_r search data; no PHP evaluation. */
final class PhpArray {
    private static final Pattern ENTRY = Pattern.compile("^(\\s*)\\[([^\\]\\r\\n]{1,80})] =>(?: (.*))?$");
    private static final int MAX_DEPTH = 6, MAX_ENTRIES = 2000, MAX_LINES = 10000;
    private final String[] lines;
    private int position, entries;
    private PhpArray(String text) {
        if (text == null || text.length() > HifiniApi.MAX_HTML_BYTES) throw new IllegalArgumentException();
        lines = text.replace("\r\n", "\n").replace('\r', '\n').split("\n", -1);
        if (lines.length > MAX_LINES) throw new IllegalArgumentException();
    }
    static Map<String, Object> parse(String text) {
        PhpArray parser = new PhpArray(text);
        while (parser.position < parser.lines.length && !parser.lines[parser.position].trim().equals("Array")) parser.position++;
        if (parser.position == parser.lines.length) throw new IllegalArgumentException();
        parser.position++;
        return parser.array(0);
    }
    private Map<String, Object> array(int depth) {
        if (depth > MAX_DEPTH) throw new IllegalArgumentException();
        emptyLines();
        if (position >= lines.length || !lines[position].trim().equals("(")) throw new IllegalArgumentException();
        int indent = indent(lines[position++]);
        Map<String, Object> result = new LinkedHashMap<>();
        while (position < lines.length) {
            emptyLines();
            if (position >= lines.length) break;
            String line = lines[position];
            if (line.trim().equals(")") && indent(line) == indent) { position++; return result; }
            Matcher entry = ENTRY.matcher(line);
            if (!entry.matches() || indent(line) != indent + 4 || ++entries > MAX_ENTRIES) throw new IllegalArgumentException();
            String key = entry.group(2), value = entry.group(3) == null ? "" : entry.group(3);
            if (result.containsKey(key) || value.length() > 16384) throw new IllegalArgumentException();
            position++;
            if (value.equals("Array") && nextIsArray()) result.put(key, array(depth + 1));
            else result.put(key, value);
        }
        throw new IllegalArgumentException();
    }
    private boolean nextIsArray() {
        int next = position;
        while (next < lines.length && lines[next].trim().isEmpty()) next++;
        return next < lines.length && lines[next].trim().equals("(");
    }
    private void emptyLines() { while (position < lines.length && lines[position].trim().isEmpty()) position++; }
    private static int indent(String line) {
        int size = 0;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == ' ') size++;
            else if (c == '\t') size += 4;
            else break;
        }
        return size;
    }
}
