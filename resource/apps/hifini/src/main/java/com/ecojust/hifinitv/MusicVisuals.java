package com.ecojust.hifinitv;

import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.ColorFilter;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.graphics.drawable.Drawable;

/** Small native vector assets. The generic artwork is original, not a supplied album cover. */
final class MusicVisuals {
    private MusicVisuals() { }

    static Drawable icon(String name, int color) { return new Icon(name, color); }
    static Drawable artwork() { return new Artwork(); }

    private abstract static class Vector extends Drawable {
        final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Path path = new Path();
        int opacity = 255;
        ColorFilter filter;

        @Override public void setAlpha(int alpha) {
            opacity = Math.max(0, Math.min(255, alpha));
            invalidateSelf();
        }
        @Override public int getAlpha() { return opacity; }
        @Override public void setColorFilter(ColorFilter colorFilter) {
            filter = colorFilter;
            invalidateSelf();
        }
        @Override public int getOpacity() { return PixelFormat.TRANSLUCENT; }
        void color(int value) {
            paint.setShader(null);
            paint.setColor(value);
            paint.setAlpha(Color.alpha(value) * opacity / 255);
            paint.setColorFilter(filter);
        }
    }

    private static final class Icon extends Vector {
        private final String name;
        private final int tint;
        Icon(String name, int tint) { this.name = name; this.tint = tint; }
        @Override public int getIntrinsicWidth() { return 24; }
        @Override public int getIntrinsicHeight() { return 24; }

        @Override public void draw(Canvas canvas) {
            if (getBounds().isEmpty()) return;
            int save = canvas.save();
            float size = Math.min(getBounds().width(), getBounds().height());
            canvas.translate(getBounds().exactCenterX() - size / 2,
                    getBounds().exactCenterY() - size / 2);
            canvas.scale(size / 24f, size / 24f);
            color(tint);
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(1.8f);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setStrokeJoin(Paint.Join.ROUND);
            path.reset();
            switch (name) {
                case "search":
                    canvas.drawCircle(10.3f, 10.3f, 6.2f, paint);
                    canvas.drawLine(14.8f, 14.8f, 20.3f, 20.3f, paint);
                    break;
                case "shuffle":
                    path.moveTo(3, 6); path.lineTo(6, 6);
                    path.cubicTo(10, 6, 13, 18, 17, 18); path.lineTo(21, 18);
                    canvas.drawPath(path, paint);
                    path.reset(); path.moveTo(3, 18); path.lineTo(6, 18);
                    path.cubicTo(8.2f, 18, 10, 15, 11, 13);
                    path.moveTo(13, 9); path.cubicTo(14.5f, 6.5f, 15.5f, 6, 17, 6);
                    path.lineTo(21, 6);
                    path.moveTo(18, 3); path.lineTo(21, 6); path.lineTo(18, 9);
                    path.moveTo(18, 15); path.lineTo(21, 18); path.lineTo(18, 21);
                    canvas.drawPath(path, paint);
                    break;
                case "previous":
                    canvas.drawLine(5, 5, 5, 19, paint);
                    paint.setStyle(Paint.Style.FILL);
                    path.moveTo(18, 5); path.lineTo(7, 12); path.lineTo(18, 19); path.close();
                    canvas.drawPath(path, paint);
                    break;
                case "next":
                    canvas.drawLine(19, 5, 19, 19, paint);
                    paint.setStyle(Paint.Style.FILL);
                    path.moveTo(6, 5); path.lineTo(17, 12); path.lineTo(6, 19); path.close();
                    canvas.drawPath(path, paint);
                    break;
                case "play":
                    paint.setStyle(Paint.Style.FILL);
                    path.moveTo(8, 4.5f); path.lineTo(20, 12); path.lineTo(8, 19.5f); path.close();
                    canvas.drawPath(path, paint);
                    break;
                case "pause":
                    paint.setStyle(Paint.Style.FILL);
                    canvas.drawRoundRect(6, 4, 10, 20, 1.2f, 1.2f, paint);
                    canvas.drawRoundRect(14, 4, 18, 20, 1.2f, 1.2f, paint);
                    break;
                case "close":
                case "cancel":
                    canvas.drawLine(6, 6, 18, 18, paint);
                    canvas.drawLine(6, 18, 18, 6, paint);
                    break;
                case "waveform":
                    paint.setStrokeWidth(2.4f);
                    canvas.drawLine(3, 10, 3, 14, paint);
                    canvas.drawLine(7.5f, 5.5f, 7.5f, 18.5f, paint);
                    canvas.drawLine(12, 2.5f, 12, 21.5f, paint);
                    canvas.drawLine(16.5f, 7, 16.5f, 17, paint);
                    canvas.drawLine(21, 10, 21, 14, paint);
                    break;
                default:
                    canvas.drawCircle(12, 12, 7.5f, paint);
                    canvas.drawCircle(12, 12, 1.5f, paint);
            }
            canvas.restoreToCount(save);
        }
    }

    private static final class Artwork extends Vector {
        private final Shader sky = new LinearGradient(0, 0, 0, 100,
                new int[]{0xff102a31, 0xff224244, 0xff0b1e25},
                new float[]{0, .6f, 1}, Shader.TileMode.CLAMP);
        private final Shader halo = new RadialGradient(65, 26, 23,
                new int[]{0x54f4dfad, 0x12d8d6ad, 0x00d8d6ad},
                new float[]{0, .45f, 1}, Shader.TileMode.CLAMP);
        private final Shader sea = new LinearGradient(0, 58, 0, 100,
                0xff183a40, 0xff091a21, Shader.TileMode.CLAMP);
        @Override public int getIntrinsicWidth() { return 512; }
        @Override public int getIntrinsicHeight() { return 512; }

        @Override public void draw(Canvas canvas) {
            if (getBounds().isEmpty()) return;
            int save = canvas.save();
            canvas.translate(getBounds().left, getBounds().top);
            canvas.scale(getBounds().width() / 100f, getBounds().height() / 100f);
            path.reset(); path.addRoundRect(0, 0, 100, 100, 3, 3, Path.Direction.CW);
            canvas.clipPath(path);
            paint.setStyle(Paint.Style.FILL);
            color(Color.WHITE); paint.setShader(sky);
            canvas.drawRect(0, 0, 100, 100, paint);
            paint.setShader(halo); canvas.drawCircle(65, 26, 23, paint);
            // Fixed low-contrast stars keep the fallback deterministic and inexpensive.
            for (int i = 0; i < 48; i++) {
                float x = ((i * 37 + 7) % 101), y = ((i * 17 + 5) % 51);
                color(i % 4 == 0 ? 0x85e4eee4 : 0x3aabc7c5);
                canvas.drawCircle(x, y, i % 5 == 0 ? .16f : .1f, paint);
            }
            color(0xffe7dbb6); canvas.drawCircle(65, 26, 6.3f, paint);
            color(0x22ad9e78); canvas.drawCircle(63.4f, 25, 2.2f, paint);
            canvas.drawCircle(67.5f, 28, 1.5f, paint);
            canvas.drawCircle(65.5f, 22.8f, .9f, paint);
            color(0xff162d33);
            path.reset(); path.moveTo(0, 59); path.lineTo(0, 49);
            path.cubicTo(8, 53, 12, 47, 19, 49);
            path.cubicTo(26, 46, 29, 56, 36, 53);
            path.cubicTo(43, 53, 47, 58, 56, 59); path.close();
            canvas.drawPath(path, paint);
            color(Color.WHITE); paint.setShader(sea); canvas.drawRect(0, 59, 100, 100, paint);
            paint.setStyle(Paint.Style.STROKE); paint.setStrokeCap(Paint.Cap.ROUND);
            for (int i = 0; i < 23; i++) {
                float y = 60 + i * 1.8f, center = 65 + (float)Math.sin(i * 2.3) * 2;
                float half = 1.3f + i * .34f;
                color(i % 3 == 0 ? 0xa6b9bea2 : 0x507d9c93);
                paint.setStrokeWidth(.16f + i * .009f);
                canvas.drawLine(center - half, y, center + half, y, paint);
            }
            for (int i = 0; i < 14; i++) {
                color(i % 3 == 0 ? 0x423e6d70 : 0x2c72908d);
                paint.setStrokeWidth(.16f);
                float y = 64 + i * 2.6f;
                path.reset(); path.moveTo(0, y);
                path.cubicTo(25, y - 2, 41, y + 3, 63, y);
                path.cubicTo(79, y - 2, 89, y + 2, 100, y);
                canvas.drawPath(path, paint);
            }
            paint.setStyle(Paint.Style.FILL); color(0xff10252a);
            path.reset(); path.moveTo(0, 100); path.lineTo(0, 79);
            path.cubicTo(9, 76, 19, 82, 24, 85);
            path.cubicTo(31, 87, 38, 93, 48, 100); path.close();
            canvas.drawPath(path, paint);
            color(0xff0b1d22); path.reset(); path.moveTo(100, 100); path.lineTo(100, 87);
            path.cubicTo(88, 91, 78, 97, 71, 100); path.close(); canvas.drawPath(path, paint);
            canvas.restoreToCount(save);
        }
    }
}
