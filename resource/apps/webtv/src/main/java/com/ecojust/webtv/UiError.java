package com.ecojust.webtv;

import android.content.Context;
import java.io.IOException;
import java.net.SocketTimeoutException;

/** Keep parsing/network failures locale-neutral until they are shown in the UI. */
final class UiError extends IOException {
    private final int messageResource;
    private final Object[] arguments;
    UiError(int messageResource, Object... arguments) {
        super("WebTV error resource " + messageResource);
        this.messageResource = messageResource;
        this.arguments = arguments;
    }
    static String message(Context context, Throwable error) {
        if (error instanceof UiError) {
            UiError failure = (UiError) error;
            return context.getString(failure.messageResource, failure.arguments);
        }
        if (error instanceof SocketTimeoutException) return context.getString(R.string.list_timeout);
        String detail = error.getMessage();
        return detail == null || detail.isEmpty() ? context.getString(R.string.list_unreadable) : detail;
    }
}
