package com.ecojust.hifinitv;

import android.animation.ValueAnimator;
import android.content.Context;
import android.database.ContentObserver;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.provider.Settings;
import android.view.View;

/** Decorative playback motion, not an audio analyser. No microphone or audio-session access. */
final class RhythmView extends View {
    private static final int BAR_COUNT = 33;
    private static final float TWO_PI = (float) (Math.PI * 2);
    private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path wave = new Path();
    private final Shader glow = new RadialGradient(170, 135, 119,
            new int[]{0x253d8272, 0x0b315b51, 0x00315b51},
            new float[]{0, .56f, 1}, Shader.TileMode.CLAMP);
    private final Shader bars = new LinearGradient(0, 64, 0, 183,
            0xffdef4df, 0xff81b7a3, Shader.TileMode.CLAMP);
    private final Shader reflection = new LinearGradient(0, 187, 0, 220,
            0x6399c9b2, 0x0099c9b2, Shader.TileMode.CLAMP);
    private boolean attached, playing, pageVisible, framePending, observing;
    private float durationScale = 1, phase = .65f;
    private long lastFrameTime;

    private final Runnable frame = new Runnable() {
        @Override public void run() {
            framePending = false;
            if (!canAnimate()) { lastFrameTime = 0; return; }
            long now = SystemClock.uptimeMillis();
            if (lastFrameTime != 0) {
                float elapsed = Math.min(64, Math.max(0, now - lastFrameTime)) / 1000f;
                // All wave rates have two decimal places: wrap at their shared period.
                phase = (phase + elapsed * .9f / durationScale) % (TWO_PI * 100);
            }
            lastFrameTime = now;
            invalidate();
            scheduleFrame();
        }
    };
    private final ContentObserver animationObserver = new ContentObserver(new Handler(Looper.getMainLooper())) {
        @Override public void onChange(boolean selfChange) {
            readAnimationSetting();
            updateAnimation();
        }
    };

    RhythmView(Context context) {
        super(context);
        setFocusable(false);
        setClickable(false);
        setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);
        readAnimationSetting();
    }

    void setPlaying(boolean value) {
        if (playing == value) return;
        playing = value;
        updateAnimation();
    }

    void setPageVisible(boolean value) {
        if (pageVisible == value) return;
        pageVisible = value;
        if (value) readAnimationSetting();
        updateAnimation();
    }

    /** True only while this view has a pending frame callback. */
    boolean isAnimating() { return framePending; }

    private void readAnimationSetting() {
        try {
            float value = Settings.Global.getFloat(getContext().getContentResolver(),
                    Settings.Global.ANIMATOR_DURATION_SCALE, 1);
            durationScale = Float.isNaN(value) || Float.isInfinite(value) ? 1 : Math.max(0, value);
        } catch (RuntimeException unavailable) {
            // The platform animator flag still applies when a vendor restricts the setting.
            durationScale = 1;
        }
    }

    private boolean canAnimate() {
        return attached && playing && pageVisible && getWindowVisibility() == VISIBLE
                && isShown() && durationScale > 0 && ValueAnimator.areAnimatorsEnabled();
    }

    private void updateAnimation() {
        // View constructors can call visibility hooks before subclass fields are initialized.
        if (frame == null) return;
        if (canAnimate()) scheduleFrame();
        else {
            removeCallbacks(frame);
            framePending = false;
            lastFrameTime = 0;
        }
    }

    private void scheduleFrame() {
        if (!framePending && canAnimate()) {
            framePending = true;
            postOnAnimation(frame);
        }
    }

    @Override protected void onAttachedToWindow() {
        super.onAttachedToWindow();
        attached = true;
        if (!observing) {
            try {
                getContext().getContentResolver().registerContentObserver(
                        Settings.Global.getUriFor(Settings.Global.ANIMATOR_DURATION_SCALE),
                        false, animationObserver);
                observing = true;
            } catch (RuntimeException unavailable) { /* Static setting and platform flag remain available. */ }
        }
        readAnimationSetting();
        updateAnimation();
    }

    @Override protected void onDetachedFromWindow() {
        attached = false;
        updateAnimation();
        if (observing) {
            getContext().getContentResolver().unregisterContentObserver(animationObserver);
            observing = false;
        }
        super.onDetachedFromWindow();
    }

    @Override protected void onWindowVisibilityChanged(int visibility) {
        super.onWindowVisibilityChanged(visibility);
        updateAnimation();
    }

    @Override protected void onVisibilityChanged(View changedView, int visibility) {
        super.onVisibilityChanged(changedView, visibility);
        updateAnimation();
    }

    @Override protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float width = getWidth() - getPaddingLeft() - getPaddingRight();
        float height = getHeight() - getPaddingTop() - getPaddingBottom();
        if (width <= 0 || height <= 0) return;
        int save = canvas.save();
        canvas.translate(getPaddingLeft(), getPaddingTop());
        canvas.scale(width / 320f, height / 256f);
        canvas.clipRect(0, 0, 320, 256);
        paint.setStyle(Paint.Style.FILL);
        paint.setAlpha(255);
        paint.setShader(glow);
        canvas.drawRect(0, 0, 320, 256, paint);

        // Two quiet waves and a few fixed particles add depth without implying measured audio.
        paint.setShader(null);
        paint.setStyle(Paint.Style.STROKE);
        paint.setStrokeWidth(1.1f);
        for (int layer = 0; layer < 2; layer++) {
            paint.setColor(layer == 0 ? 0x466f9a86 : 0x183e7664);
            wave.reset();
            for (int step = 0; step <= 40; step++) {
                float x = step * 8f;
                float y = 122 + layer * 14
                        + (float) Math.sin(x / 35f + phase * .72f + layer) * (15 - layer * 3)
                        + (float) Math.sin(x / 67f - phase * .44f) * 8;
                if (step == 0) wave.moveTo(x, y); else wave.lineTo(x, y);
            }
            canvas.drawPath(wave, paint);
        }

        paint.setStyle(Paint.Style.FILL);
        for (int index = 0; index < BAR_COUNT; index++) {
            float u = index / (float) (BAR_COUNT - 1);
            float x = 10 + index * 9.2f;
            float envelope = (float) Math.pow(Math.sin(u * Math.PI), 1.5);
            float sway = .57f + .24f * (float) Math.sin(phase * 1.7f + index * .37f)
                    + .16f * (float) Math.sin(phase * 2.3f - index * .29f);
            float barHeight = 10 + (20 + envelope * 110) * Math.max(.14f, sway);

            paint.setShader(null);
            paint.setColor(0x193b7b68);
            float distantHeight = 17 + (18 + envelope * 100)
                    * (.6f + .35f * (float) Math.sin(phase * .8f + index * .54f));
            canvas.drawRoundRect(x, 181 - distantHeight, x + 4.6f, 181, 2.3f, 2.3f, paint);

            paint.setColor(0xffffffff);
            paint.setShader(bars);
            canvas.drawRoundRect(x, 183 - barHeight, x + 4.6f, 183, 2.3f, 2.3f, paint);
            paint.setShader(reflection);
            canvas.drawRoundRect(x, 187, x + 4.6f, 187 + Math.min(33, barHeight * .35f),
                    2.3f, 2.3f, paint);
        }
        paint.setShader(null);
        for (int dot = 0; dot < 13; dot++) {
            float x = 15 + (dot * 71 % 294), y = 40 + (dot * 43 % 184);
            paint.setColor(dot % 3 == 0 ? 0x88badfc2 : 0x344b8971);
            canvas.drawCircle(x, y, dot % 3 == 0 ? .9f : .5f, paint);
        }
        canvas.restoreToCount(save);
    }
}
