package com.ecojust.putrtvstore;

import java.io.InterruptedIOException;

public final class Cancellation {
    private volatile boolean cancelled;
    public void cancel() { cancelled = true; }
    public boolean isCancelled() { return cancelled || Thread.currentThread().isInterrupted(); }
    public void check() throws InterruptedIOException {
        if (isCancelled()) throw new InterruptedIOException("Cancelled");
    }
}
