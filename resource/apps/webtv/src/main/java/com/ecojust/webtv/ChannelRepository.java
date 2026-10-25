package com.ecojust.webtv;

import android.content.Context;
import android.net.Uri;
import android.util.AtomicFile;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;

/** One atomic, bounded metadata snapshot. No channel logos, EPG or video files. */
class ChannelRepository {
    static final String DEFAULT_URL = "https://iptv-org.github.io/iptv/countries/cn.m3u";
    private static final int MAGIC = 0x57545631;
    static final class Source {
        final String kind, address;
        Source(String kind, String address) { this.kind = kind; this.address = address; }
        String label(Context context) { return context.getString(kind.equals("url") ? R.string.source_url : kind.equals("file") ? R.string.source_file : R.string.source_default); }
    }
    static final class Catalogue {
        final Source source; final List<Playlist.Channel> channels;
        Catalogue(Source source, List<Playlist.Channel> channels) { this.source = source; this.channels = channels; }
    }
    static final class Request {
        volatile boolean cancelled;
        final long deadline = System.nanoTime() + 24_000_000_000L;
        volatile HttpURLConnection connection;
        volatile InputStream stream;
        void cancel() {
            cancelled = true; HttpURLConnection current = connection; if (current != null) current.disconnect();
            InputStream open = stream; if (open != null) try { open.close(); } catch (IOException ignored) { }
        }
        void check() throws IOException { if (cancelled || Thread.currentThread().isInterrupted()) throw new UiError(R.string.list_cancelled); if (System.nanoTime() > deadline) throw new UiError(R.string.list_timeout); }
    }
    private final Context context;
    private final AtomicFile cache;
    ChannelRepository(Context context) {
        this.context = context.getApplicationContext(); cache = new AtomicFile(new File(context.getFilesDir(), "channels.snapshot"));
    }
    Catalogue initial(Request request) throws IOException {
        request.check(); Catalogue saved = cached(); if (saved != null) return saved;
        byte[] data = Playlist.read(context.getResources().openRawResource(R.raw.starter));
        request.check(); return new Catalogue(new Source("default", ""), Playlist.parse(data, true));
    }
    Catalogue refresh(Source source, Request request) throws IOException {
        if (source.kind.equals("file")) throw new UiError(R.string.local_refresh);
        String address = source.kind.equals("url") ? source.address : DEFAULT_URL;
        byte[] body = download(address, request); return save(source, body, request);
    }
    Catalogue importFile(Uri uri, Request request) throws IOException {
        if (!"content".equals(uri.getScheme())) throw new UiError(R.string.file_required);
        request.check(); InputStream stream = context.getContentResolver().openInputStream(uri);
        if (stream == null) throw new UiError(R.string.file_unreadable);
        request.stream = stream;
        try { return save(new Source("file", ""), Playlist.read(stream), request); }
        finally { request.stream = null; }
    }
    Catalogue restore(Request request) throws IOException {
        return save(new Source("default", ""), Playlist.read(context.getResources().openRawResource(R.raw.starter)), request);
    }
    private Catalogue save(Source source, byte[] body, Request request) throws IOException {
        request.check(); List<Playlist.Channel> channels = Playlist.parse(body, source.kind.equals("default")); request.check();
        FileOutputStream file = null;
        try {
            file = cache.startWrite(); DataOutputStream output = new DataOutputStream(file);
            output.writeInt(MAGIC); output.writeUTF(source.kind); output.writeUTF(source.address); output.writeInt(body.length); output.write(body); output.flush();
            request.check(); cache.finishWrite(file); file = null;
            return new Catalogue(source, channels);
        } finally { if (file != null) cache.failWrite(file); }
    }
    private Catalogue cached() {
        try (DataInputStream input = new DataInputStream(cache.openRead())) {
            if (cache.getBaseFile().length() > Playlist.MAX_BYTES + 16384 || input.readInt() != MAGIC) return null;
            String kind = input.readUTF(), address = input.readUTF();
            if (!kind.equals("default") && !kind.equals("url") && !kind.equals("file")) return null;
            if (kind.equals("url")) { if (address.length() > 2048) return null; Playlist.safeUrl(address); }
            int count = input.readInt(); if (count < 1 || count > Playlist.MAX_BYTES) return null;
            byte[] body = new byte[count]; input.readFully(body);
            return new Catalogue(new Source(kind, address), Playlist.parse(body, kind.equals("default")));
        } catch (IOException | RuntimeException e) { return null; }
    }
    private byte[] download(String raw, Request request) throws IOException {
        if (raw.length() > 2048) throw new UiError(R.string.list_url_limit);
        String address = Playlist.safeUrl(raw);
        for (int redirects = 0; redirects <= 3; redirects++) {
            request.check(); HttpURLConnection connection = open(address); request.connection = connection;
            connection.setConnectTimeout(8000); connection.setReadTimeout(8000); connection.setInstanceFollowRedirects(false);
            connection.setRequestProperty("User-Agent", "WebTV/0.1.0 (Android)"); connection.setRequestProperty("Accept", "application/x-mpegURL, audio/x-mpegurl, text/plain, */*");
            try {
                request.check(); int status = connection.getResponseCode();
                if (status == 301 || status == 302 || status == 303 || status == 307 || status == 308) {
                    String location = connection.getHeaderField("Location"); if (location == null) throw new UiError(R.string.list_redirect_invalid);
                    String next = Playlist.safeUrl(new URL(connection.getURL(), location).toString());
                    if (address.startsWith("https:") && !next.startsWith("https:")) throw new UiError(R.string.list_redirect_downgrade);
                    address = next; continue;
                }
                if (status != 200) throw new UiError(R.string.list_http_error, status);
                if (connection.getContentLengthLong() > Playlist.MAX_BYTES) throw new UiError(R.string.list_size_limit);
                InputStream stream = connection.getInputStream(); request.stream = stream;
                byte[] bytes = Playlist.read(new FilterInputStream(stream) {
                    @Override public int read(byte[] buffer, int offset, int length) throws IOException {
                        request.check(); int count = super.read(buffer,offset,length); request.check(); return count;
                    }
                }); request.check(); return bytes;
            } finally { request.stream = null; request.connection = null; connection.disconnect(); }
        }
        throw new UiError(R.string.list_redirect_limit);
    }
    protected HttpURLConnection open(String address) throws IOException { return (HttpURLConnection) new URL(address).openConnection(); }
}
