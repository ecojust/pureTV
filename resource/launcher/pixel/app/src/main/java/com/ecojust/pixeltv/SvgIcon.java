package com.ecojust.pixeltv;

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
    static String surface(String pkg){String[] colors={"#53E0BA","#EF8D58","#B3A1F5","#F3CA70","#7CBEF2","#EF77AE"};return colors[(pkg.hashCode()&0x7fffffff)%colors.length];}
    static String ink(String pkg){return "#161129";}
    static String forPackage(String pkg) {
        String art=pkg.contains("pixeltv")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M3 3h15v3h3v9h-3v3H9v6H3Zm6 6v3h6V9Z\"/>":
                pkg.contains("music")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M8 4h12v14h-3v3h-6v-6h6V7h-6v11H8v3H2v-6h6Z\"/>":
                pkg.contains("webtv")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M2 4h20v14h-8v3h5v2H5v-2h5v-3H2Zm3 3v8h14V7ZM7 1h3v3H7Zm7 0h3v3h-3Z\"/>":
                pkg.contains("video")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M3 3h18v18H3Zm3 3v12h12V6Zm3 1h3v3h3v4h-3v3H9Z\"/>":
                pkg.contains("jellyfin")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M10 2h4v4h3v4h3v4h3v8H1v-8h3v-4h3V6h3Zm0 10v4H7v3h10v-3h-3v-4Z\"/>":
                pkg.contains("browser")||pkg.contains("tvbro")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M7 2h10v3h4v4h2v6h-2v4h-4v3H7v-3H3v-4H1V9h2V5h4Zm2 3v5h6V5Zm-5 8v3h3v-3Zm5 0v6h6v-6Zm8 0v3h3v-3Z\"/>":
                pkg.contains("puretv")?"<path fill=\"currentColor\" stroke=\"none\" d=\"M3 3h18v15h-3v3h-3v-3H9v3H6v-3H3Zm3 3v9h12V6Zm3 2h6v5H9Z\"/>":
                "<path d=\"M3 3h7v7H3ZM14 3h7v7h-7ZM3 14h7v7H3ZM14 14h7v7h-7Z\"/>";
        return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"square\" stroke-linejoin=\"miter\">"+art+"</svg>";
    }
}
