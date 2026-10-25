package com.ecojust.hifinitv;

/** Stable song metadata with separate catalog and optional forum identities; never a media URL. */
final class Track {
    final String id, title, artist, cover;
    final String source, sourceId, threadId;
    final long duration;

    Track(String id, String title, String artist, String cover, long duration) {
        this("", "", requireThread(id), title, artist, cover, duration);
    }

    private Track(String source, String sourceId, String threadId, String title, String artist, String cover, long duration) {
        this.source = source; this.sourceId = sourceId; this.threadId = threadId;
        this.id = source.isEmpty() ? threadId : source + ":" + sourceId;
        this.title = clean(title, 240);
        this.artist = clean(artist, 160);
        this.cover = clean(cover, 4096);
        this.duration = Math.max(0, Math.min(86400, duration));
    }

    static Track catalog(String source, String sourceId, String threadId, String title, String artist, String cover, long duration) {
        if (!("netease".equals(source) || "kuwo".equals(source)) || sourceId == null || !sourceId.matches("[1-9][0-9]{0,19}"))
            throw new IllegalArgumentException("Invalid HiFiNi catalog identity");
        String topic = threadId == null || threadId.isEmpty() || "0".equals(threadId) ? "" : requireThread(threadId);
        return new Track(source, sourceId, topic, title, artist, cover, duration);
    }

    Track withMetadata(String title, String artist, String cover) {
        return new Track(source, sourceId, threadId, title, artist, cover, duration);
    }

    String pageUrl() { return threadId.isEmpty() ? "https://www.hifini.net/" : "https://www.hifini.net/thread-" + threadId + ".htm"; }
    private static String requireThread(String value) {
        if (value == null || !value.matches("[1-9][0-9]{0,11}")) throw new IllegalArgumentException("Invalid HiFiNi thread ID");
        return value;
    }
    private static String clean(String value, int limit) {
        if (value == null) return "";
        String text = value.trim();
        return text.length() > limit ? text.substring(0, limit) : text;
    }
}
