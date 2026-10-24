package com.ecojust.novatv;

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
    static String forPackage(String pkg) {
        String art=pkg.contains("browser")||pkg.contains("tvbro")?"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c-5 4-5 14 0 18 5-4 5-14 0-18Z\"/>":
                pkg.contains("files")||pkg.contains("fileexplorer")?"<path d=\"M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V5h7l2 2h7a2 2 0 0 1 2 2\"/>":
                pkg.contains("music")?"<path d=\"M9 18V5l12-2v13M9 8l12-2\"/><circle cx=\"6\" cy=\"18\" r=\"3\"/><circle cx=\"18\" cy=\"16\" r=\"3\"/>":
                pkg.contains("webtv")?"<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"M8 22h8M12 19v3M8 2l4 3 4-3\"/>":
                pkg.contains("video")?"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><path d=\"m10 8 6 4-6 4Z\"/>":
                (pkg.contains("novatv")||pkg.contains("puretv"))?"<rect x=\"3\" y=\"4\" width=\"18\" height=\"15\" rx=\"4\"/><path d=\"M8 9h4a3 3 0 0 1 0 6H8V9Zm1 10v3m6-3v3\"/>":
                "<path d=\"M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z\"/>";
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"+art+"</svg>";
    }
}
