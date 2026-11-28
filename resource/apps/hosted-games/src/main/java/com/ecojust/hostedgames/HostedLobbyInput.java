package com.ecojust.hostedgames;

import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.KeyEvent;
import java.util.function.IntConsumer;

/** Delivers remote controllers to the currently focused native catalog, help or retry panel. */
final class HostedLobbyInput implements AutoCloseable {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final HostedControllerRoom room;
    private final IntConsumer action;
    private final HostedInput.Pad phone = new HostedInput.Pad(), wifi = new HostedInput.Pad();
    private boolean active, waitForNeutral;
    private int previous;
    private long repeatAt;
    private final Runnable frame = new Runnable() {
        @Override public void run() {
            if (!active) return;
            if (phone.read(room.readPhone()) | wifi.read(room.readWifi())) waitForNeutral = true;
            int state = phone.buttons | wifi.buttons | direction(phone) | direction(wifi);
            int edges = state & ~previous;
            previous = state;
            long now = SystemClock.uptimeMillis();
            if (waitForNeutral) {
                if (state == 0) waitForNeutral = false;
            } else if (edges != 0) {
                repeatAt = now + 440;
                press(edges);
            } else if (state != 0 && now >= repeatAt) {
                repeatAt = now + 160;
                press(state & (HostedInput.UP | HostedInput.DOWN | HostedInput.LEFT | HostedInput.RIGHT));
            }
            if (active) handler.postDelayed(this, 32);
        }
    };

    HostedLobbyInput(HostedControllerRoom room, IntConsumer action) { this.room = room; this.action = action; }

    void setActive(boolean enabled) {
        if (active == enabled) return;
        active = enabled;
        waitForNeutral = true;
        previous = 0;
        handler.removeCallbacks(frame);
        if (active) handler.post(frame);
    }

    private static int direction(HostedInput.Pad pad) {
        if (Math.max(Math.abs(pad.x), Math.abs(pad.y)) < .5f) return 0;
        if (Math.abs(pad.x) > Math.abs(pad.y)) return pad.x > 0 ? HostedInput.RIGHT : HostedInput.LEFT;
        return pad.y > 0 ? HostedInput.DOWN : HostedInput.UP;
    }

    private void press(int bits) {
        if ((bits & HostedInput.START) != 0) action.accept(KeyEvent.KEYCODE_BUTTON_START);
        else if ((bits & HostedInput.B) != 0) action.accept(KeyEvent.KEYCODE_BACK);
        else if ((bits & HostedInput.A) != 0) action.accept(KeyEvent.KEYCODE_DPAD_CENTER);
        else if ((bits & HostedInput.UP) != 0) action.accept(KeyEvent.KEYCODE_DPAD_UP);
        else if ((bits & HostedInput.DOWN) != 0) action.accept(KeyEvent.KEYCODE_DPAD_DOWN);
        else if ((bits & HostedInput.LEFT) != 0) action.accept(KeyEvent.KEYCODE_DPAD_LEFT);
        else if ((bits & HostedInput.RIGHT) != 0) action.accept(KeyEvent.KEYCODE_DPAD_RIGHT);
    }

    @Override public void close() { setActive(false); }
}
