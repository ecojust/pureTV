package com.ecojust.hifinitv;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** A bounded reader for quoted APlayer data properties, not a JavaScript interpreter. */
final class PlayerLiteral {
    private static final Pattern PLAYER = Pattern.compile("\\bnew\\s+APlayer\\s*\\(");
    private static final String[] FIELDS = {"url", "name", "title", "artist", "author", "cover", "pic"};
    static Map<String, String> parse(String script) {
        if (script == null || script.length() > HifiniApi.MAX_HTML_BYTES) return Collections.emptyMap();
        String code;
        try { code = codeOnly(script); } catch (IllegalArgumentException ignored) { return Collections.emptyMap(); }
        Matcher matcher = PLAYER.matcher(code);
        int attempts = 0;
        while (matcher.find() && attempts++ < 8) {
            try {
                int start = skip(script, matcher.end());
                if (at(script, start) != '{') continue;
                int end = close(script, start);
                String options = script.substring(start, end + 1);
                String audio = property(options, "audio");
                if (audio == null) audio = property(options, "music");
                if (audio == null) continue;
                int first = skip(audio, 0);
                if (at(audio, first) == '[') first = skip(audio, first + 1);
                if (at(audio, first) != '{') continue;
                String data = audio.substring(first, close(audio, first) + 1);
                Map<String, String> fields = new LinkedHashMap<>();
                for (String name : FIELDS) {
                    String raw = property(data, name);
                    if (raw == null) continue;
                    int offset = skip(raw, 0);
                    if (at(raw, offset) != '\'' && at(raw, offset) != '"') continue;
                    Quoted quoted = quoted(raw, offset);
                    if (skip(raw, quoted.end) == raw.length()) fields.put(name, quoted.value);
                }
                if (fields.containsKey("url")) return fields;
            } catch (IllegalArgumentException ignored) { /* Dynamic or malformed player data stays unsupported. */ }
        }
        return Collections.emptyMap();
    }

    private static String codeOnly(String script) {
        StringBuilder code = new StringBuilder(script);
        for (int i = 0; i < script.length();) {
            int end = i;
            char c = script.charAt(i);
            if (c == '\'' || c == '"') end = quoted(script, i).end;
            else if (script.startsWith("//", i)) { end = script.indexOf('\n', i + 2); if (end < 0) end = script.length(); }
            else if (script.startsWith("/*", i)) { end = script.indexOf("*/", i + 2); if (end < 0) throw new IllegalArgumentException(); end += 2; }
            else if (c == '`') {
                end = i + 1;
                while (end < script.length() && script.charAt(end) != '`') { if (script.charAt(end) == '\\') end++; end++; }
                if (end >= script.length()) throw new IllegalArgumentException(); end++;
            }
            if (end > i) { for (int j = i; j < end; j++) code.setCharAt(j, ' '); i = end; }
            else i++;
        }
        return code.toString();
    }

    /** Returns the last top-level property value, preserving JavaScript duplicate-key semantics. */
    private static String property(String object, String wanted) {
        int i = skip(object, 1);
        String result = null;
        while (i < object.length() && object.charAt(i) != '}') {
            String name;
            char c = object.charAt(i);
            if (c == '\'' || c == '"') { Quoted key = quoted(object, i); name = key.value; i = key.end; }
            else {
                int start = i;
                while (i < object.length() && (Character.isLetterOrDigit(object.charAt(i)) || object.charAt(i) == '_' || object.charAt(i) == '$')) i++;
                if (i == start) throw new IllegalArgumentException();
                name = object.substring(start, i);
            }
            i = skip(object, i);
            if (at(object, i) != ':') throw new IllegalArgumentException();
            int start = skip(object, i + 1);
            i = valueEnd(object, start);
            if (wanted.equals(name)) result = object.substring(start, i).trim();
            i = skip(object, i);
            if (at(object, i) == ',') i = skip(object, i + 1);
            else if (at(object, i) != '}') throw new IllegalArgumentException();
        }
        return result;
    }

    private static int valueEnd(String text, int start) {
        int i = start;
        while (i < text.length()) {
            i = skip(text, i);
            char c = at(text, i);
            if (c == ',' || c == '}') return i;
            if (c == '\'' || c == '"') i = quoted(text, i).end;
            else if (c == '{' || c == '[' || c == '(') i = close(text, i) + 1;
            else if (c == '`') throw new IllegalArgumentException(); // No template literals or interpolation.
            else i++;
        }
        throw new IllegalArgumentException();
    }

    private static int close(String text, int start) {
        char open = at(text, start), expected = open == '{' ? '}' : open == '[' ? ']' : ')';
        int depth = 1;
        for (int i = start + 1; i < text.length();) {
            i = skip(text, i);
            char c = at(text, i);
            if (c == '\'' || c == '"') { i = quoted(text, i).end; continue; }
            if (c == '`') throw new IllegalArgumentException();
            if (c == open) depth++;
            // Count this bracket type; quoted text and comments cannot change the depth.
            if (c == expected) { depth--; if (depth == 0) return i; }
            i++;
        }
        throw new IllegalArgumentException();
    }

    private static int skip(String text, int start) {
        int i = start;
        while (i < text.length()) {
            if (Character.isWhitespace(text.charAt(i))) { i++; continue; }
            if (text.startsWith("//", i)) { int newline = text.indexOf('\n', i + 2); if (newline < 0) return text.length(); i = newline + 1; continue; }
            if (text.startsWith("/*", i)) { int end = text.indexOf("*/", i + 2); if (end < 0) throw new IllegalArgumentException(); i = end + 2; continue; }
            break;
        }
        return i;
    }

    private static final class Quoted {
        final String value; final int end;
        Quoted(String value, int end) { this.value = value; this.end = end; }
    }
    private static Quoted quoted(String text, int start) {
        char quote = text.charAt(start);
        StringBuilder result = new StringBuilder();
        for (int i = start + 1; i < text.length(); i++) {
            char c = text.charAt(i);
            if (c == quote) return new Quoted(result.toString(), i + 1);
            if (c == '\n' || c == '\r') throw new IllegalArgumentException();
            if (c == '\\') {
                if (++i >= text.length()) throw new IllegalArgumentException();
                c = text.charAt(i);
                switch (c) {
                    case 'n': c = '\n'; break;
                    case 'r': c = '\r'; break;
                    case 't': c = '\t'; break;
                    case 'b': c = '\b'; break;
                    case 'f': c = '\f'; break;
                    case 'v': c = '\u000b'; break;
                    case '\n': continue;
                    case '\r': if (i + 1 < text.length() && text.charAt(i + 1) == '\n') i++; continue;
                    case 'u': case 'x':
                        int digits = c == 'u' ? 4 : 2;
                        if (i + digits >= text.length()) throw new IllegalArgumentException();
                        try { c = (char) Integer.parseInt(text.substring(i + 1, i + 1 + digits), 16); }
                        catch (NumberFormatException error) { throw new IllegalArgumentException(); }
                        i += digits; break;
                    default: break;
                }
            }
            result.append(c);
            if (result.length() > 128 * 1024) throw new IllegalArgumentException();
        }
        throw new IllegalArgumentException();
    }
    private static char at(String text, int index) { return index >= 0 && index < text.length() ? text.charAt(index) : '\0'; }
    private PlayerLiteral() {}
}
