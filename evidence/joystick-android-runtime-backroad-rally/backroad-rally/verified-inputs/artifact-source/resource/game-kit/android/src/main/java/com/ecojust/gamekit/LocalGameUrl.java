package com.ecojust.gamekit;

/** Exact offline origin and indexed file paths; query values are never file paths. */
final class LocalGameUrl {
    static final String ORIGIN = "https://game-kit.invalid/";
    static final String ENTRY = ORIGIN + "tv.html";
    private LocalGameUrl() { }

    static boolean isEntry(String url) { return "tv.html".equals(assetPath(url)); }

    static String assetPath(String url) {
        if (url == null || !url.startsWith(ORIGIN) || url.indexOf('#') >= 0) return null;
        int question = url.indexOf('?', ORIGIN.length());
        String path = url.substring(ORIGIN.length(), question < 0 ? url.length() : question);
        if (!validAssetPath(path)) return null;
        if (question >= 0 && !validQuery(url.substring(question + 1))) return null;
        return path;
    }

    static boolean validAssetPath(String path) {
        if (path == null || path.length() == 0 || path.length() > 1024) return false;
        String[] parts = path.split("/", -1);
        if (parts.length > 16) return false;
        for (String part : parts) {
            if (!part.matches("[A-Za-z0-9][A-Za-z0-9_.-]*") || part.endsWith(".")) return false;
            String stem = part.split("\\.", 2)[0].toUpperCase(java.util.Locale.ROOT);
            if (stem.matches("CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9]")) return false;
        }
        return true;
    }

    static boolean validQuery(String query) {
        if (query == null || query.length() > 4096) return false;
        final String punctuation = "-._~!$&'()*+,;=:@/?";
        for (int i = 0; i < query.length(); i++) {
            char value = query.charAt(i);
            if (value == '%') {
                if (i + 2 >= query.length()) return false;
                int high = hex(query.charAt(++i)), low = hex(query.charAt(++i));
                if (high < 0 || low < 0) return false;
                int decoded = high * 16 + low;
                if (decoded < 32 || decoded == 127 || decoded == '\\') return false;
            } else if (!(value >= '0' && value <= '9') && !(value >= 'a' && value <= 'z')
                    && !(value >= 'A' && value <= 'Z') && punctuation.indexOf(value) < 0) return false;
        }
        return true;
    }

    private static int hex(char value) {
        if (value >= '0' && value <= '9') return value - '0';
        if (value >= 'a' && value <= 'f') return value - 'a' + 10;
        if (value >= 'A' && value <= 'F') return value - 'A' + 10;
        return -1;
    }
}
