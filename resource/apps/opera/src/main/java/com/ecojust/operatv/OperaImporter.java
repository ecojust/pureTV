package com.ecojust.operatv;

import android.content.ContentResolver;
import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** Imports only after an explicit URL or Storage Access Framework selection. */
public final class OperaImporter {
    private static final ScheduledExecutorService TIMEOUTS = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "OperaImportTimeout");
        thread.setDaemon(true);
        return thread;
    });
    private OperaImporter() {}

    public static List<OperaItem> fromUrl(String url) throws IOException {
        String address = PlaylistParser.resolveUrl(url, null);
        // A playlist download is bounded; adding a direct video URL does not use this method.
        OperaHttp.Response response = OperaHttp.fetch(address, PlaylistParser.MAX_BYTES);
        return PlaylistParser.parse(response.text, response.url);
    }

    public static List<OperaItem> fromDocument(Context context, Uri uri) throws IOException {
        if (uri == null || !"content".equals(uri.getScheme()) || uri.getAuthority() == null || uri.toString().length() > 4096) {
            throw PlaylistParser.error("请通过系统文件选择器选择视频或片单。", "Choose a video or playlist using the system file picker.");
        }
        ContentResolver resolver = context.getContentResolver();
        String name = "", mime;
        long size = -1;
        try {
            mime = resolver.getType(uri);
            try (Cursor cursor = resolver.query(uri, new String[]{OpenableColumns.DISPLAY_NAME, OpenableColumns.SIZE}, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameColumn = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeColumn = cursor.getColumnIndex(OpenableColumns.SIZE);
                    if (nameColumn >= 0 && !cursor.isNull(nameColumn)) name = cursor.getString(nameColumn);
                    if (sizeColumn >= 0 && !cursor.isNull(sizeColumn)) size = cursor.getLong(sizeColumn);
                }
            }
        } catch (RuntimeException inaccessible) {
            throw PlaylistParser.error("无法读取所选文件，请重新选择并授予读取权限。", "Cannot read the selected document. Choose it again and grant read access.");
        }
        if (name == null || name.isEmpty()) name = PlaylistParser.localized("我的视频", "My video");
        String lower = name.toLowerCase(Locale.ROOT);
        if (name.length() > 160) name = name.substring(0, 160);
        String normalizedMime = mime == null ? "" : mime.toLowerCase(Locale.ROOT).split(";", 2)[0].trim();
        boolean playlistExtension = lower.endsWith(".m3u") || lower.endsWith(".m3u8") || lower.endsWith(".json");
        boolean playlistMime = normalizedMime.startsWith("text/") || normalizedMime.equals("application/json")
                || normalizedMime.equals("application/x-mpegurl") || normalizedMime.equals("application/vnd.apple.mpegurl")
                || normalizedMime.equals("audio/mpegurl") || normalizedMime.equals("audio/x-mpegurl");
        boolean genericMime = normalizedMime.isEmpty() || normalizedMime.equals("application/octet-stream");
        boolean mediaExtension = lower.matches(".*\\.(mp4|m4v|mkv|webm|mov|3gp|ts|mp3|m4a|aac|ogg|wav)$");
        // An explicit media MIME wins over a misleading .json display name, but not an HLS MIME.
        boolean mediaMime = normalizedMime.startsWith("video/") || normalizedMime.startsWith("audio/") && !playlistMime;
        if (mediaMime || genericMime && mediaExtension && !playlistExtension) {
            try (InputStream stream = resolver.openInputStream(uri)) {
                if (stream == null) throw new IOException("No document stream");
                // Verify the grant without reading an entire movie or copying it into app storage.
                if (stream.read() < 0) throw PlaylistParser.error("所选媒体文件为空。", "The selected media file is empty.");
            } catch (IOException | RuntimeException inaccessible) {
                throw PlaylistParser.error("无法打开所选媒体文件，请重新选择并授予读取权限。", "Cannot open the media document. Choose it again and grant read access.");
            }
            try {
                List<OperaItem> items = new ArrayList<>();
                items.add(OperaItem.direct(name, uri.toString(), PlaylistParser.localGroup()));
                return items;
            } catch (IllegalArgumentException invalid) {
                throw PlaylistParser.error("所选文件地址无效。", "The selected document address is invalid.");
            }
        }
        if (!(playlistMime || genericMime && playlistExtension)) {
            throw PlaylistParser.error("请选择视频、M3U 或 JSON 片单；不支持这个文件类型。", "Choose a video, M3U or JSON playlist. This file type is not supported.");
        }
        if (size > PlaylistParser.MAX_BYTES) throw PlaylistParser.error("片单超过 1 MiB，未导入。", "Playlist exceeds 1 MiB; nothing was imported.");
        final String text;
        try (InputStream stream = resolver.openInputStream(uri)) {
            if (stream == null) throw new IOException("No document stream");
            text = readUtf8(stream);
        } catch (SecurityException inaccessible) {
            throw PlaylistParser.error("片单读取权限已失效，请重新选择文件。", "Playlist read access has expired. Choose the document again.");
        } catch (RuntimeException inaccessible) {
            throw PlaylistParser.error("无法读取所选片单，请重新选择文件。", "Cannot read the selected playlist. Choose the document again.");
        }
        // The URI grants access only to this document, not to sibling HLS segments.
        return PlaylistParser.parse(text, null);
    }

    static String readUtf8(InputStream stream) throws IOException {
        return readUtf8(stream, 15000);
    }

    /** The timeout closes an already-open stream; document providers may also delay opening it. */
    static String readUtf8(InputStream stream, long timeoutMillis) throws IOException {
        if (timeoutMillis < 1 || timeoutMillis > 15000) throw new IllegalArgumentException("Invalid import read timeout");
        AtomicBoolean timedOut = new AtomicBoolean();
        ScheduledFuture<?> alarm = TIMEOUTS.schedule(() -> {
            timedOut.set(true);
            // Closing the descriptor unblocks ordinary local/pipe reads without stopping a thread.
            try { stream.close(); } catch (IOException | RuntimeException ignored) { }
        }, timeoutMillis, TimeUnit.MILLISECONDS);
        try {
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            byte[] block = new byte[8192];
            long deadline = System.nanoTime() + timeoutMillis * 1000000;
            int count;
            while ((count = stream.read(block)) != -1) {
                if (Thread.currentThread().isInterrupted()) throw new IOException("Import cancelled");
                if (timedOut.get() || System.nanoTime() > deadline) throw readTimeout();
                if (count == 0) continue;
                if (bytes.size() + count > PlaylistParser.MAX_BYTES) throw PlaylistParser.error("片单超过 1 MiB，未导入。", "Playlist exceeds 1 MiB; nothing was imported.");
                bytes.write(block, 0, count);
            }
            if (timedOut.get() || System.nanoTime() > deadline) throw readTimeout();
            try {
                return StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT)
                        .onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes.toByteArray())).toString();
            } catch (CharacterCodingException invalid) {
                throw PlaylistParser.error("请使用 UTF-8 编码的 M3U 或 JSON 片单。", "Use a UTF-8 encoded M3U or JSON playlist.");
            }
        } catch (IOException failure) {
            if (timedOut.get()) throw readTimeout();
            throw failure;
        } finally {
            alarm.cancel(false);
        }
    }

    private static IOException readTimeout() {
        return PlaylistParser.error("片单读取超时，请重试。", "Reading the playlist timed out. Try again.");
    }
}
