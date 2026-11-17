package com.ecojust.circuittv;

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
    static String surface(String pkg) {String[] palette={"#173F49","#422454","#262446","#3C2345","#183A42","#2D2652"};return palette[(pkg.hashCode()&0x7fffffff)%palette.length];}
    static String ink(String pkg){return "#66FFF2";}
    static String forPackage(String pkg) {
        String art=pkg.contains("browser")||pkg.contains("tvbro")?"<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M3 12h18M12 3c-5 4-5 14 0 18 5-4 5-14 0-18Z\"/>":
                pkg.contains("files")||pkg.contains("fileexplorer")?"<path d=\"M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0V5h7l2 2h7a2 2 0 0 1 2 2\"/>":
                pkg.contains("music")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M9 5v10.5a4 4 0 1 0 2 3.5V8l8-2v7.5a4 4 0 1 0 2 3.5V2L9 5Z\"/>":
                pkg.contains("webtv")?"<rect x=\"3\" y=\"5\" width=\"18\" height=\"14\" rx=\"3\"/><path d=\"M8 22h8M12 19v3M8 2l4 3 4-3\"/>":
                pkg.contains("video")?"<rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"5\"/><path d=\"m10 8 6 4-6 4Z\"/>":
                pkg.contains("jellyfin")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M12 2 1 21h22L12 2Zm0 7 5 9H7l5-9Z\"/>":
                pkg.contains("circuittv")?"<path d=\"M20 5h-9L5 11v7h12l4-4M12 9h9M9 14h6\"/><circle cx=\"20\" cy=\"5\" r=\"2\"/><circle cx=\"21\" cy=\"14\" r=\"2\"/>":
                pkg.contains("puretv")?"<rect x=\"3\" y=\"4\" width=\"18\" height=\"15\" rx=\"4\"/><path d=\"M8 9h4a3 3 0 0 1 0 6H8V9Zm1 10v3m6-3v3\"/>":
                "<path d=\"M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z\"/>";
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\">"+art+"</svg>";
    }
}
