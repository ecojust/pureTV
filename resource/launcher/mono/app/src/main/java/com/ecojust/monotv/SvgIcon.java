package com.ecojust.monotv;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import com.caverock.androidsvg.SVG;

/** Rasterize bounded vectors once; PictureDrawable is unreliable on TV hardware canvases. */
final class SvgIcon {
    static boolean hasArtwork(String value) {
        return value.matches("(?s).*<(path|rect|circle|ellipse|line|polyline|polygon)[\\s/>].*");
    }
    static Drawable drawable(Context context, String source, int color) throws Exception {
        if (!hasArtwork(source)) return null;
        String ink=String.format(java.util.Locale.ROOT,"#%06X",color & 0xFFFFFF);
        SVG svg=SVG.getFromString(source.replaceAll("(?i)currentcolor",ink));
        Bitmap image=Bitmap.createBitmap(128,128,Bitmap.Config.ARGB_8888);
        svg.setDocumentWidth(128);svg.setDocumentHeight(128);
        svg.renderToCanvas(new Canvas(image));
        return new BitmapDrawable(context.getResources(),image);
    }
    static String surface(String pkg){return "#222222";}
    static String ink(String pkg){return "#F8F6F0";}
    static String forPackage(String pkg) {
        String art=pkg.contains("monotv")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M4 20V4h3l5 8 5-8h3v16h-4V11l-4 6-4-6v9Z\"/>":
                pkg.contains("music")?"<path d=\"M8 18V5l11-2v13M8 8l11-2\"/><circle cx=\"5\" cy=\"18\" r=\"3\"/><circle cx=\"16\" cy=\"16\" r=\"3\"/>":
                pkg.contains("webtv")?"<rect x=\"2\" y=\"5\" width=\"20\" height=\"14\" rx=\"1\"/><path d=\"M8 22h8M12 19v3M8 2l4 3 4-3\"/>":
                pkg.contains("video")?"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"1\"/><path d=\"m10 8 6 4-6 4Z\"/>":
                pkg.contains("jellyfin")?"<path d=\"M12 2 1 21h22L12 2Zm0 7 5 9H7l5-9Z\"/>":
                pkg.contains("browser")||pkg.contains("tvbro")?"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c-5 4-5 14 0 18 5-4 5-14 0-18Z\"/>":
                pkg.contains("puretv")?"<path d=\"M3 4h18v15H3ZM8 9h4a3 3 0 0 1 0 6H8V9Zm1 10v3m6-3v3\"/>":
                "<path d=\"M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z\"/>";
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"+art+"</svg>";
    }
}
