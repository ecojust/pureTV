package com.ecojust.hifinitv;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Private persistent audio, ordered by its first successful download, with an atomic small index. */
final class LocalLibrary {
    static final int LIMIT = 50, MAX_INDEX_BYTES = 512 * 1024;
    private static final String DIRECTORY = "hifini-library";
    private final File directory, index;
    private final BeforeCommit beforeCommit;
    private final List<Entry> entries = new ArrayList<>();
    private long revision;
    interface BeforeCommit { void run() throws IOException; }
    private static final class Entry {
        final Track track;
        final long bytes;
        Entry(Track track, long bytes) { this.track = track; this.bytes = bytes; }
    }

    LocalLibrary(File filesDir) throws IOException { this(filesDir, () -> {}); }
    LocalLibrary(File filesDir, BeforeCommit beforeCommit) throws IOException {
        directory = new File(filesDir, DIRECTORY); index = new File(directory, "index.json"); this.beforeCommit = beforeCommit;
        if (Files.isSymbolicLink(directory.toPath()) || !directory.isDirectory() && !directory.mkdirs()) throw new IOException("Local library directory unavailable");
        if (index.exists()) readIndex();
        else {
            File[] existing = directory.listFiles();
            if (existing == null) throw new IOException("Cannot read local library directory");
            for (File file : existing) if (file.getName().matches("(?:[0-9a-f]{64}|\\.evict-[0-9a-f]{64})\\.audio"))
                throw new IOException("Local library index is missing; audio preserved");
            writeIndex(entries, 0);
        }
        // A crash before an eviction's index commit leaves the old row and a moved audio file.
        // Restore those files before deciding that an indexed song is missing.
        for (Entry entry : entries) {
            File file = audio(entry.track.id), removed = tomb(entry.track.id);
            if (!validFile(file, entry.bytes) && validFile(removed, entry.bytes)) move(removed, file);
        }
        List<Entry> repaired = new ArrayList<>();
        for (Entry entry : entries) if (validFile(audio(entry.track.id), entry.bytes)) repaired.add(entry);
        if (repaired.size() != entries.size()) commit(repaired);
        cleanOrphans();
    }

    synchronized List<Track> tracks() {
        List<Track> result = new ArrayList<>(); for (Entry entry : entries) result.add(entry.track); return result;
    }
    synchronized long revision() { return revision; }
    synchronized File find(String id) throws IOException {
        Entry entry = entry(id); if (entry == null) return null;
        File file = audio(entry.track.id);
        if (validFile(file, entry.bytes)) return file;
        removeAll(java.util.Collections.singleton(id)); return null;
    }
    synchronized void prepareDownload(Track track) throws IOException {
        requireTrack(track);
        if (find(track.id) != null) return;
        cleanOrphans();
        if (entries.size() >= LIMIT) removeAll(java.util.Collections.singleton(entries.get(0).track.id));
    }
    synchronized File save(Track track, File temporary) throws IOException {
        requireTrack(track);
        File existing = find(track.id);
        if (temporary != null && directory.getCanonicalFile().equals(temporary.getCanonicalFile().getParentFile())) {
            if (existing != null && temporary.getCanonicalFile().equals(existing.getCanonicalFile())) return existing;
            throw new IOException("Temporary audio must be outside the library");
        }
        if (existing != null) {
            if (temporary != null && !temporary.getCanonicalFile().equals(existing.getCanonicalFile()) && temporary.exists() && !temporary.delete())
                throw new IOException("Cannot remove duplicate temporary audio");
            return existing;
        }
        if (entries.size() >= LIMIT) throw new IOException("Prepare a local library slot before downloading");
        if (temporary == null || !Files.isRegularFile(temporary.toPath(), LinkOption.NOFOLLOW_LINKS)
                || temporary.length() <= 0 || temporary.length() > AudioDownloader.MAX_BYTES) throw new IOException("Incomplete temporary audio");
        File complete = audio(track.id);
        if (complete.exists() && !complete.delete()) throw new IOException("Cannot remove orphan audio");
        long size = temporary.length(); move(temporary, complete);
        List<Entry> next = new ArrayList<>(entries); next.add(new Entry(track, size));
        try { commit(next); }
        catch (IOException failure) {
            if (!complete.delete()) failure.addSuppressed(new IOException("Cannot remove uncommitted audio"));
            throw failure;
        }
        return complete;
    }
    synchronized void removeAll(Collection<String> ids) throws IOException {
        if (ids == null || ids.isEmpty()) return;
        List<Entry> next = new ArrayList<>(), removed = new ArrayList<>();
        for (Entry entry : entries) { if (ids.contains(entry.track.id)) removed.add(entry); else next.add(entry); }
        if (removed.isEmpty()) return;
        List<Entry> moved = new ArrayList<>();
        try {
            for (Entry entry : removed) {
                File file = audio(entry.track.id);
                if (file.exists()) { move(file, tomb(entry.track.id)); moved.add(entry); }
            }
            commit(next);
        } catch (IOException failure) {
            for (int i = moved.size() - 1; i >= 0; i--) {
                Entry entry = moved.get(i);
                try { move(tomb(entry.track.id), audio(entry.track.id)); }
                catch (IOException rollback) { failure.addSuppressed(rollback); }
            }
            throw failure;
        }
        IOException failure = null;
        for (Entry entry : removed) {
            File file = tomb(entry.track.id);
            if (file.exists() && !file.delete()) failure = new IOException("Cannot remove retired library audio");
        }
        if (failure != null) throw failure;
    }

    private Entry entry(String id) { for (Entry entry : entries) if (entry.track.id.equals(id)) return entry; return null; }
    private File audio(String id) { return new File(directory, digest(id) + ".audio"); }
    private File tomb(String id) { return new File(directory, ".evict-" + digest(id) + ".audio"); }
    private static String digest(String id) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(id.getBytes(StandardCharsets.UTF_8)); StringBuilder result = new StringBuilder(64);
            for (byte value : hash) result.append("0123456789abcdef".charAt((value & 255) >> 4)).append("0123456789abcdef".charAt(value & 15));
            return result.toString();
        } catch (java.security.NoSuchAlgorithmException impossible) { throw new AssertionError(impossible); }
    }
    private static boolean validFile(File file, long size) {
        return size > 0 && size <= AudioDownloader.MAX_BYTES && Files.isRegularFile(file.toPath(), LinkOption.NOFOLLOW_LINKS) && file.length() == size;
    }
    private static void requireTrack(Track track) throws IOException {
        if (track == null) throw new IOException("Missing song metadata");
    }
    private static void move(File from, File to) throws IOException {
        // Both directories are inside the app's private data volume. Never copy whole songs on the UI thread.
        Files.move(from.toPath(), to.toPath(), StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
    }
    private void commit(List<Entry> next) throws IOException {
        if (revision == Long.MAX_VALUE) throw new IOException("Local library revision exhausted");
        writeIndex(next, revision + 1); entries.clear(); entries.addAll(next); revision++;
    }
    private void writeIndex(List<Entry> next, long version) throws IOException {
        byte[] bytes;
        try {
            JSONObject document = new JSONObject(); document.put("version", 1); document.put("revision", version); JSONArray tracks = new JSONArray();
            for (Entry entry : next) {
                Track track = entry.track; JSONObject row = new JSONObject();
                row.put("id", track.id); row.put("source", track.source); row.put("sourceId", track.sourceId); row.put("threadId", track.threadId);
                row.put("title", track.title); row.put("artist", track.artist); row.put("cover", track.cover); row.put("duration", track.duration); row.put("bytes", entry.bytes);
                tracks.put(row);
            }
            document.put("tracks", tracks); bytes = document.toString().getBytes(StandardCharsets.UTF_8);
        } catch (JSONException invalid) { throw new IOException("Invalid local library metadata", invalid); }
        if (bytes.length > MAX_INDEX_BYTES) throw new IOException("Local library metadata exceeds limit");
        File pending = File.createTempFile(".index-", ".tmp", directory);
        try {
            try (FileOutputStream output = new FileOutputStream(pending)) { output.write(bytes); output.getFD().sync(); }
            beforeCommit.run(); move(pending, index);
        } finally { pending.delete(); }
    }
    private void readIndex() throws IOException {
        if (!Files.isRegularFile(index.toPath(), LinkOption.NOFOLLOW_LINKS) || index.length() > MAX_INDEX_BYTES)
            throw new IOException("Local library index is unreadable; audio preserved");
        // Parse all metadata before restoring or deleting any file. Damaged metadata must never erase audio.
        try {
            JSONTokener parser = new JSONTokener(new String(Files.readAllBytes(index.toPath()), StandardCharsets.UTF_8));
            Object root = parser.nextValue();
            if (!(root instanceof JSONObject) || parser.nextClean() != 0) throw new JSONException("Invalid index document");
            JSONObject document = (JSONObject) root;
            if (integer(document, "version") != 1) throw new JSONException("Unsupported version");
            long loadedRevision = integer(document, "revision"); if (loadedRevision < 0) throw new JSONException("Invalid revision");
            JSONArray tracks = document.getJSONArray("tracks"); if (tracks.length() > LIMIT) throw new JSONException("Too many songs");
            List<Entry> loaded = new ArrayList<>(); Set<String> ids = new HashSet<>();
            for (int i = 0; i < tracks.length(); i++) {
                JSONObject row = tracks.getJSONObject(i);
                String source = text(row, "source"), sourceId = text(row, "sourceId"), thread = text(row, "threadId");
                String title = text(row, "title"), artist = text(row, "artist"), cover = text(row, "cover");
                long duration = integer(row, "duration"), bytes = integer(row, "bytes");
                if (title.length() > 240 || artist.length() > 160 || cover.length() > 4096 || duration < 0 || duration > 86400
                        || bytes <= 0 || bytes > AudioDownloader.MAX_BYTES || source.isEmpty() && !sourceId.isEmpty()) throw new JSONException("Invalid song metadata");
                Track track = source.isEmpty() ? new Track(thread, title, artist, cover, duration)
                        : Track.catalog(source, sourceId, thread, title, artist, cover, duration);
                if (!track.id.equals(text(row, "id")) || !ids.add(track.id)) throw new JSONException("Invalid song identity");
                loaded.add(new Entry(track, bytes));
            }
            entries.addAll(loaded); revision = loadedRevision;
        } catch (JSONException | IllegalArgumentException invalid) { throw new IOException("Local library index is damaged; audio preserved", invalid); }
    }
    private static String text(JSONObject object, String key) throws JSONException {
        Object value = object.get(key);
        if (!(value instanceof String)) throw new JSONException("Invalid string metadata");
        return (String) value;
    }
    private static long integer(JSONObject object, String key) throws JSONException {
        Object value = object.get(key);
        // JSONObject's coercing getters can silently turn fractional byte lengths into a
        // missing-file repair, which would delete valid audio. Validate the stored type first.
        if (!(value instanceof Integer) && !(value instanceof Long)) throw new JSONException("Invalid integer metadata");
        return ((Number) value).longValue();
    }
    private void cleanOrphans() throws IOException {
        Set<String> keep = new HashSet<>(); for (Entry entry : entries) keep.add(audio(entry.track.id).getName());
        File[] files = directory.listFiles(); if (files == null) throw new IOException("Cannot read local library directory");
        for (File file : files) {
            String name = file.getName();
            boolean audioOrphan = name.matches("[0-9a-f]{64}\\.audio") && !keep.contains(name);
            boolean retired = name.matches("\\.evict-[0-9a-f]{64}\\.audio");
            boolean unfinishedIndex = name.matches("\\.index--?[0-9]+\\.tmp");
            if ((audioOrphan || retired || unfinishedIndex) && !file.isDirectory() && !file.delete()) throw new IOException("Cannot clean orphan library files");
        }
    }
}
