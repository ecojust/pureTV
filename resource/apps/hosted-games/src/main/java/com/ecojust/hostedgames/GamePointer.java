package com.ecojust.hostedgames;

import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.WebView;
import android.widget.FrameLayout;

/** A native overlay whose coordinates are local pixels in the game WebView. */
final class GamePointer {
    private final View marker;
    private final WebView web;
    private float x = -1, y;
    private boolean pressed;
    private long downTime;

    GamePointer(FrameLayout layer, WebView web) {
        this.web = web;
        marker = new View(web.getContext());
        marker.setContentDescription("游戏光标");
        marker.setFocusable(false);
        marker.setClickable(false);
        float density = web.getResources().getDisplayMetrics().density;
        int diameter = Math.round(18 * density);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setStroke(Math.max(2, Math.round(2 * density)), Color.WHITE);
        circle.setColor(0x884081a4);
        marker.setBackground(circle);
        marker.setVisibility(View.GONE);
        layer.addView(marker, new FrameLayout.LayoutParams(diameter, diameter));
    }

    void show(boolean visible) {
        marker.setVisibility(visible ? View.VISIBLE : View.GONE);
        if (visible) position();
    }

    private boolean position() {
        int w = web.getWidth(), h = web.getHeight();
        if (w == 0 || h == 0) return false;
        if (x < 0) { x = w * .5f; y = h * .5f; }
        x = Math.max(0, Math.min(w - 1, x));
        y = Math.max(0, Math.min(h - 1, y));
        marker.setTranslationX(web.getX() + x - marker.getLayoutParams().width * .5f);
        marker.setTranslationY(web.getY() + y - marker.getLayoutParams().height * .5f);
        return true;
    }

    float cursorX() { return marker.getVisibility() == View.VISIBLE ? x : -1; }
    float cursorY() { return marker.getVisibility() == View.VISIBLE && x >= 0 ? y : -1; }

    // A captured pointer reports relative axes, without running into the edge of the WebView.
    void look(float dx, float dy) {
        if (android.os.Build.VERSION.SDK_INT >= 26 && web.hasPointerCapture()) {
            MotionEvent captured = MotionEvent.obtain(0, SystemClock.uptimeMillis(), MotionEvent.ACTION_MOVE, dx, dy, 0);
            captured.setSource(InputDevice.SOURCE_MOUSE_RELATIVE);
            web.dispatchCapturedPointerEvent(captured);
            captured.recycle();
        } else move(dx, dy);
    }

    void move(float dx, float dy) {
        if (!position()) return;
        x = Math.max(0, x + dx); y += dy;
        position();
        if (pressed) send(MotionEvent.ACTION_MOVE);
        else send(MotionEvent.ACTION_HOVER_MOVE);
    }

    void press(boolean next) {
        if (pressed == next || !position()) return;
        if (next) { web.requestFocus(); downTime = SystemClock.uptimeMillis(); }
        pressed = next;
        send(next ? MotionEvent.ACTION_DOWN : MotionEvent.ACTION_UP);
    }

    void cancel() {
        if (pressed) { pressed = false; send(MotionEvent.ACTION_CANCEL); }
    }

    void remove() {
        cancel();
        ((FrameLayout) marker.getParent()).removeView(marker);
    }

    private void send(int action) {
        boolean hover = action == MotionEvent.ACTION_HOVER_MOVE;
        MotionEvent.PointerProperties pointer = new MotionEvent.PointerProperties();
        pointer.id = 0;
        pointer.toolType = hover ? MotionEvent.TOOL_TYPE_MOUSE : MotionEvent.TOOL_TYPE_FINGER;
        MotionEvent.PointerCoords coords = new MotionEvent.PointerCoords();
        coords.x = x; coords.y = y;
        coords.pressure = pressed ? 1f : 0f;
        coords.size = 1f;
        long now = SystemClock.uptimeMillis();
        MotionEvent event = MotionEvent.obtain(hover ? now : downTime, now, action, 1,
                new MotionEvent.PointerProperties[]{pointer}, new MotionEvent.PointerCoords[]{coords},
                0, 0, 1f, 1f, 0, 0, hover ? InputDevice.SOURCE_MOUSE : InputDevice.SOURCE_TOUCHSCREEN, 0);
        if (hover) web.dispatchGenericMotionEvent(event);
        else web.dispatchTouchEvent(event);
        event.recycle();
    }
}
