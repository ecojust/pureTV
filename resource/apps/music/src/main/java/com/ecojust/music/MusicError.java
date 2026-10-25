package com.ecojust.music;

import android.content.Context;
import java.io.IOException;

/** Data-only request errors; the UI resolves text using its current Android locale. */
final class MusicError extends IOException {
    final int resource;
    private final Object[] arguments;
    MusicError(int resource, Object... arguments) {
        super("Music request error: " + resource + " " + java.util.Arrays.toString(arguments));
        this.resource = resource; this.arguments = arguments;
    }
    MusicError(int resource, Throwable cause) {
        this(resource); initCause(cause);
    }
    static String display(Context context, Throwable error) {
        for (Throwable cause=error; cause!=null; cause=cause.getCause()) {
            if (cause instanceof MusicError) {
                MusicError known=(MusicError)cause;
                return context.getString(known.resource,known.arguments);
            }
            if (cause instanceof java.net.SocketTimeoutException) return context.getString(R.string.network_timeout);
            if (cause instanceof java.net.UnknownHostException || cause instanceof java.net.ConnectException) return context.getString(R.string.network_unavailable);
            if (cause instanceof SecurityException) return context.getString(R.string.audio_permission);
        }
        return context.getString(R.string.request_failed);
    }
}
