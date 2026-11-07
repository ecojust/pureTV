package com.ecojust.putrtvstore;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** Bounded thumbnails are optional; failure leaves the readable app tile in place. */
final class StoreArtwork {
    private final ExecutorService workers = Executors.newFixedThreadPool(2);
    private final Handler main = new Handler(Looper.getMainLooper());
    private final LruCache<String, Bitmap> cache = new LruCache<String, Bitmap>(4 * 1024 * 1024) {
        @Override protected int sizeOf(String key, Bitmap bitmap) { return bitmap.getByteCount(); }
    };
    private Cancellation cancellation = new Cancellation();
    private boolean closed;
    void load(StoreCatalog catalog, StoreEntry entry, ImageView target) {
        if (closed || entry.coverPath == null || entry.coverPath.isEmpty()) return;
        String key = catalog.revision + "/" + entry.coverPath;
        target.setTag(key);
        Bitmap cached = cache.get(key);
        if (cached != null) { target.setImageBitmap(cached); return; }
        Cancellation request = cancellation;
        workers.execute(() -> {
            try {
                byte[] bytes = StoreNetwork.read(StoreNetwork.raw(catalog.revision, entry.coverPath), 2 * 1024 * 1024, request);
                BitmapFactory.Options options = new BitmapFactory.Options();
                options.inJustDecodeBounds = true;
                BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
                if (options.outWidth <= 0 || options.outHeight <= 0 || options.outWidth > 4096 || options.outHeight > 4096) return;
                options.inSampleSize = 1;
                while (options.outWidth / options.inSampleSize > 640 || options.outHeight / options.inSampleSize > 360) options.inSampleSize *= 2;
                options.inJustDecodeBounds = false;
                Bitmap bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.length, options);
                request.check();
                if (bitmap == null) return;
                cache.put(key, bitmap);
                main.post(() -> { if (!closed && !request.isCancelled() && key.equals(target.getTag())) target.setImageBitmap(bitmap); });
            } catch (Exception ignored) { /* Artwork is optional; text and install remain available. */ }
        });
    }
    void cancel() { cancellation.cancel(); cancellation = new Cancellation(); }
    void close() { closed = true; cancellation.cancel(); workers.shutdownNow(); main.removeCallbacksAndMessages(null); cache.evictAll(); }
}
