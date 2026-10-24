package com.ecojust.soltv;

import android.content.Context;
import android.content.Intent;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.util.AtomicFile;
import android.util.Base64;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeMap;

/** Data-only layout.json override. It never accepts shell commands, intents or remote executable code. */
final class LauncherLayout {
    static final int LIMIT = 90 * 1024;
    final JSONObject json;
    int columns(String section) { return json.optJSONObject(section).optInt("columns",4); }
    LauncherLayout(JSONObject source) throws Exception {
        if((source.optInt("version")==4||source.optInt("version")==5)){UnifiedLayout.validate(source);json=new JSONObject(source.toString());return;}
        keys(source, "version", "home", "apps");
        if (!(source.opt("version") instanceof Integer) || source.getInt("version") != 3)
            throw new IllegalArgumentException("Unsupported layout.json version");
        for (String section : Arrays.asList("home","apps")) {
            JSONObject page=source.getJSONObject(section); keys(page,"columns","items","scene");
            validateScene(page.getJSONObject("scene"), section);
            if (!(page.opt("columns") instanceof Integer) || page.getInt("columns")<1 || page.getInt("columns")>6)
                throw new IllegalArgumentException("Invalid page columns");
            validateEntries(page.getJSONArray("items"),0,section.equals("home")?24:100);
        }
        if (source.toString().getBytes(StandardCharsets.UTF_8).length > LIMIT) throw new IllegalArgumentException("layout.json is too large");
        json = new JSONObject(source.toString());
    }
    private static void keys(JSONObject value, String... allowed) {
        Set<String> names = new HashSet<>(Arrays.asList(allowed));
        java.util.Iterator<String> iterator = value.keys();
        while (iterator.hasNext()) if (!names.contains(iterator.next())) throw new IllegalArgumentException("Unknown layout.json field");
    }
    static boolean validPackage(String value) { return value.length() <= 255 && value.matches("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+"); }
    private static void validateEntries(JSONArray list, int min, int max) throws Exception {
        if (list.length() < min || list.length() > max) throw new IllegalArgumentException("Invalid number of apps");
        Set<String> seen = new HashSet<>();
        for (int i = 0; i < list.length(); i++) {
            JSONObject entry = list.getJSONObject(i); keys(entry, "action", "packageName", "label", "icon", "color", "frame", "visible", "zIndex");
            geometry(entry);
            String action = entry.optString("action", "app");
            if (!Arrays.asList("app", "music", "bilibili", "files", "apps", "shortvideo", "webtv", "placeholder").contains(action)) throw new IllegalArgumentException("Unsupported action");
            if (action.equals("app") && !validPackage(entry.getString("packageName"))) throw new IllegalArgumentException("Invalid package name");
            if (!action.equals("app") && entry.has("packageName")) throw new IllegalArgumentException("Builtin actions do not accept package names");
            if (entry.has("label") && (!(entry.get("label") instanceof String) || entry.getString("label").length() > 100)) throw new IllegalArgumentException("Invalid label");
            if (!Arrays.asList("app", "music", "video", "files", "apps", "picture", "settings", "input").contains(entry.optString("icon", "app"))) throw new IllegalArgumentException("Invalid icon");
            if (!entry.optString("color", "#374959").matches("#[0-9a-fA-F]{6}")) throw new IllegalArgumentException("Invalid color");
            String key = action.equals("app") ? entry.getString("packageName") : action;
            if (!action.equals("placeholder") && !seen.add(key)) throw new IllegalArgumentException("Duplicate app");
        }
    }
    static void geometry(JSONObject node) throws Exception {
        if(node.has("visible") && !(node.get("visible") instanceof Boolean)) throw new IllegalArgumentException("Invalid visibility");
        if(node.has("zIndex") && (!(node.get("zIndex") instanceof Integer) || node.getInt("zIndex")<0 || node.getInt("zIndex")>20)) throw new IllegalArgumentException("Invalid layer");
        if(!node.has("frame")) return;
        JSONObject f=node.getJSONObject("frame");keys(f,"x","y","width","height");
        for(String key:Arrays.asList("x","y","width","height")) if(!(f.get(key) instanceof Integer)) throw new IllegalArgumentException("Invalid frame");
        if(f.getInt("x")<0 || f.getInt("y")<0 || f.getInt("x")>960 || f.getInt("y")>540 || f.getInt("width")<1 || f.getInt("height")<1 || f.getInt("width")>960-f.getInt("x") || f.getInt("height")>540-f.getInt("y")) throw new IllegalArgumentException("Frame outside 960x540 canvas");
    }
    static void validateScene(JSONObject scene,String section) throws Exception {
        keys(scene,"background","elements");JSONObject bg=scene.getJSONObject("background");keys(bg,"color","image","frame","visible","zIndex");if(!bg.has("frame"))throw new IllegalArgumentException("Missing background frame");geometry(bg);
        if(!bg.getString("color").matches("#[0-9a-fA-F]{6}"))throw new IllegalArgumentException("Invalid background color");
        if(bg.has("image")) {
            String image=bg.getString("image");
            if(!image.matches("data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+") || image.length()>33000)throw new IllegalArgumentException("Invalid embedded background");
            byte[] bytes=Base64.decode(image.substring(image.indexOf(',')+1),Base64.NO_WRAP);
            android.graphics.BitmapFactory.Options options=new android.graphics.BitmapFactory.Options();options.inJustDecodeBounds=true;
            android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);
            if(options.outWidth<1 || options.outHeight<1 || options.outWidth>1920 || options.outHeight>1080)throw new IllegalArgumentException("Background exceeds 1920x1080");
        }
        Set<String> seen=new HashSet<>();JSONArray elements=scene.getJSONArray("elements");
        List<String> allowed=section.equals("home")?Arrays.asList("clock","date","weather","wallpaper","favourites","inputs","network","settings","allApps"):Arrays.asList("title","subtitle","backHome");
        for(int i=0;i<elements.length();i++) {JSONObject node=elements.getJSONObject(i);keys(node,"id","frame","visible","zIndex");String id=node.getString("id");if(!allowed.contains(id)||!seen.add(id)||!node.has("frame"))throw new IllegalArgumentException("Invalid scene element");geometry(node);}
    }
    int screenWidth(){return (json.optInt("version")==4||json.optInt("version")==5)?json.optJSONObject("screen").optInt("width"):960;}
    int screenHeight(){return (json.optInt("version")==4||json.optInt("version")==5)?json.optJSONObject("screen").optInt("height"):540;}
    JSONObject page(String section) {try{return (json.optInt("version")==4||json.optInt("version")==5)?UnifiedLayout.page(json,section):json.optJSONObject(section);}catch(Exception e){throw new IllegalStateException(e);}}
    private static byte[] read(InputStream input) throws Exception {
        try (InputStream stream = input; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] bytes = new byte[4096]; int count;
            while ((count = stream.read(bytes)) != -1) { if (out.size() + count > LIMIT) throw new IllegalArgumentException("layout.json is too large"); out.write(bytes,0,count); }
            return out.toByteArray();
        }
    }
    private static File file(Context ctx) { return new File(ctx.getFilesDir(), "layout.json"); }
    static LauncherLayout override(Context ctx) {
        try {
            File privateFile = file(ctx);
            if (privateFile.exists() || new File(privateFile + ".bak").exists())
                return loadOverride(ctx,new JSONObject(new String(read(new AtomicFile(privateFile).openRead()), StandardCharsets.UTF_8)));
            File external=ctx.getExternalFilesDir(null);File imported=external==null?null:new File(external,"layout.json");
            if(imported!=null && imported.isFile())return loadOverride(ctx,new JSONObject(new String(read(new java.io.FileInputStream(imported)),StandardCharsets.UTF_8)));
        } catch (Exception ignored) { /* An invalid override never breaks Home. */ }
        return null;
    }
    private static LauncherLayout loadOverride(Context ctx,JSONObject source) throws Exception {
        LauncherLayout template=source.optInt("version")==3?defaults(ctx):template(ctx);
        if(source.optInt("version")==3||source.optInt("version")==4)source=UnifiedLayout.migrate(source,template.json);
        // Upgrade only the recognized 0.1.0 system template; retain every user decision.
        if(source.optInt("version")==5) {
            try { UnifiedLayout.locked(source,template.json); }
            catch(IllegalArgumentException changedTemplate) {
                JSONObject previous=new JSONObject(new String(read(ctx.getAssets().open("layout-0.1.0.json")),StandardCharsets.UTF_8));
                new LauncherLayout(source);UnifiedLayout.locked(source,previous);
                JSONObject updated=new JSONObject(template.json.toString());JSONObject screen=source.getJSONObject("screen");
                for(String section:Arrays.asList("home","apps")) {
                    JSONObject target=updated.getJSONObject(section),old=source.getJSONObject(section);
                    target.put("system",UnifiedLayout.resized(target.getJSONArray("system"),updated.getJSONObject("screen"),screen));
                    target.put("users",old.getJSONArray("users")).put("background",old.getJSONObject("background")).put("navigation",old.getJSONObject("navigation"));
                }
                updated.put("screen",screen);source=updated;
            }
        }
        LauncherLayout result=new LauncherLayout(source);
        if((source.optInt("version")==4||source.optInt("version")==5))UnifiedLayout.locked(result.json,template.json);
        return result;
    }
    static LauncherLayout effective(Context ctx) {
        LauncherLayout layout=override(ctx);
        if(layout!=null)return layout;
        try{return defaults(ctx);}catch(Exception ignored){return null;}
    }
    static LauncherLayout template(Context ctx)throws Exception{return new LauncherLayout(new JSONObject(new String(read(ctx.getAssets().open("layout.json")),StandardCharsets.UTF_8)));}
    static LauncherLayout defaults(Context ctx) throws Exception {
        return new LauncherLayout(UnifiedLayout.withInstalled(ctx,template(ctx).json));
    }
    static void apply(Context ctx, JSONObject json) throws Exception {
        LauncherLayout layout = new LauncherLayout(json);
        if((json.optInt("version")==4||json.optInt("version")==5))UnifiedLayout.locked(json,template(ctx).json);
        for(String section:Arrays.asList("home","apps")) {
            JSONArray items=layout.page(section).getJSONArray("items");
            for(int i=0;i<items.length();i++) {
                JSONObject item=items.getJSONObject(i);
                if(item.has("packageName") && !isUserApp(ctx,item.getString("packageName")))
                    throw new IllegalArgumentException("Only installed user applications may be added");
            }
        }
        AtomicFile target = new AtomicFile(file(ctx)); FileOutputStream output = target.startWrite();
        try { output.write(layout.json.toString().getBytes(StandardCharsets.UTF_8)); target.finishWrite(output); }
        catch (Exception error) { target.failWrite(output); throw error; }
        MainActivity.reloadLayoutFromManager();
        AppsActivity.reloadLayoutFromManager();
    }
    static void reset(Context ctx) {
        new AtomicFile(file(ctx)).delete();
        File directory=ctx.getExternalFilesDir(null);
        if(directory!=null) for(String name:Arrays.asList("layout.json")) {
            File external=new File(directory,name);
            if(external.exists() && !external.delete()) throw new IllegalStateException("Cannot remove external layout");
        }
        MainActivity.reloadLayoutFromManager();
        AppsActivity.reloadLayoutFromManager();
    }
    List<AppAdapter.Entry> entries(Context ctx, String section) {
        List<AppAdapter.Entry> result = new ArrayList<>(); JSONArray list = page(section).optJSONArray("items");
        for (int i=0; i<list.length(); i++) {
            JSONObject item = list.optJSONObject(i); String action = item.optString("action","app");
            AppAdapter.Entry base = null;
            for (AppAdapter.Entry e : AppAdapter.homeEntries()) if (e.key.equals(action)) base=e;
            for (AppAdapter.Entry e : AppAdapter.applicationEntries()) if (e.key.equals(action)) base=e;
            String pkg=item.optString("packageName",""); String title=item.optString("label","");
            if (title.isEmpty() && !pkg.isEmpty()) {try {title=ctx.getPackageManager().getApplicationLabel(ctx.getPackageManager().getApplicationInfo(pkg,0)).toString();}catch(Exception ignored){title=pkg;}}
            int resource = base == null ? R.drawable.ic_apps_minimal : base.icon;
            switch(item.optString("icon","app")) {
                case "music":resource=R.drawable.ic_music;break; case "video":resource=R.drawable.ic_video;break;
                case "files":resource=R.drawable.ic_folder;break;case "apps":resource=R.drawable.ic_apps_minimal;break;
                case "picture":resource=R.drawable.ic_picture;break;case "settings":resource=R.drawable.ic_settings;break;case "input":resource=R.drawable.ic_input;break;
                default:break;
            }
            AppAdapter.Entry rendered=new AppAdapter.Entry("layout-"+i+"-"+action+pkg,
                base==null?R.string.placeholder_app:base.label,resource,UnifiedLayout.color(item.optString("color","#374959")),
                pkg.isEmpty()?(base==null?AppAdapter.PLACEHOLDER:base.action):AppAdapter.CUSTOM_APP,base==null?i+1:base.number,
                title,pkg,item.optString("icon","app").equals("app"));
            if(item.has("svg")){rendered.svg=item.optString("svg");rendered.foreground=Color.parseColor(item.optString("foreground","#BFC3C8"));rendered.iconColor=Color.parseColor(item.optString("iconColor",item.optString("foreground","#BFC3C8")));}
            result.add(rendered);
        }
        return result;
    }
    /** Desktop wallpaper picker writes the very same JSON scene the manager reads. */
    static void wallpaper(Context ctx,File file) throws Exception {
        LauncherLayout current=effective(ctx);
        JSONObject draft=new JSONObject(current.json.toString());
        JSONObject bg;
        if((current.json.optInt("version")==4||current.json.optInt("version")==5))bg=draft.getJSONObject("home").getJSONObject("background");
        else bg=draft.getJSONObject("home").getJSONObject("scene").getJSONObject("background");
        if(file==null || !file.isFile())bg.remove("image");
        else {
            android.graphics.BitmapFactory.Options opts=new android.graphics.BitmapFactory.Options();opts.inJustDecodeBounds=true;android.graphics.BitmapFactory.decodeFile(file.getPath(),opts);
            int sample=1;while(opts.outWidth/sample>960 || opts.outHeight/sample>540)sample*=2;opts.inJustDecodeBounds=false;opts.inSampleSize=sample;
            Bitmap bitmap=android.graphics.BitmapFactory.decodeFile(file.getPath(),opts);if(bitmap==null)throw new IllegalArgumentException("Invalid wallpaper");
            try {
                String encoded="";
                for(int width:new int[]{960,640,480,320}) {
                    float ratio=Math.min(1f,Math.min(width/(float)bitmap.getWidth(),540f/bitmap.getHeight()));
                    Bitmap reduced=Bitmap.createScaledBitmap(bitmap,Math.max(1,Math.round(bitmap.getWidth()*ratio)),Math.max(1,Math.round(bitmap.getHeight()*ratio)),true);
                    try {for(int quality:new int[]{75,50,30}){ByteArrayOutputStream output=new ByteArrayOutputStream();reduced.compress(Bitmap.CompressFormat.WEBP,quality,output);encoded="data:image/webp;base64,"+Base64.encodeToString(output.toByteArray(),Base64.NO_WRAP);if(encoded.length()<=33000)break;}} finally {if(reduced!=bitmap)reduced.recycle();}
                    if(encoded.length()<=33000)break;
                }
                if(encoded.length()>33000)throw new IllegalArgumentException("Wallpaper too large");bg.put("image",encoded);
            }finally{bitmap.recycle();}
        }
        if((draft.optInt("version")==4||draft.optInt("version")==5)){new LauncherLayout(draft);AtomicFile target=new AtomicFile(file(ctx));FileOutputStream output=target.startWrite();try{output.write(draft.toString().getBytes(StandardCharsets.UTF_8));target.finishWrite(output);}catch(Exception error){target.failWrite(output);throw error;}MainActivity.reloadLayoutFromManager();AppsActivity.reloadLayoutFromManager();}
        else apply(ctx,draft);
    }
    static boolean isUserApp(Context ctx,String packageName) {
        try {
            android.content.pm.ApplicationInfo app=ctx.getPackageManager().getApplicationInfo(packageName,0);
            if((app.flags & (android.content.pm.ApplicationInfo.FLAG_SYSTEM | android.content.pm.ApplicationInfo.FLAG_UPDATED_SYSTEM_APP))!=0 || (app.flags & android.content.pm.ApplicationInfo.FLAG_INSTALLED)==0 || !app.enabled) return false;
            return ctx.getPackageManager().getLeanbackLaunchIntentForPackage(packageName)!=null || ctx.getPackageManager().getLaunchIntentForPackage(packageName)!=null;
        } catch(Exception ignored) {return false;}
    }
    static JSONArray installedApps(Context ctx) throws Exception {
        TreeMap<String,ResolveInfo> found = new TreeMap<>();
        for (String category : Arrays.asList(Intent.CATEGORY_LEANBACK_LAUNCHER,Intent.CATEGORY_LAUNCHER)) {
            for (ResolveInfo info : ctx.getPackageManager().queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(category),0)) {
                if (info.activityInfo != null && isUserApp(ctx,info.activityInfo.packageName)) found.put(info.activityInfo.packageName,info);
            }
        }
        JSONArray result = new JSONArray();
        for (java.util.Map.Entry<String,ResolveInfo> pair : found.entrySet()) {
            if (result.length() >= 100) break;
            JSONObject app = new JSONObject().put("packageName",pair.getKey()).put("label",pair.getValue().loadLabel(ctx.getPackageManager()).toString());
            Bitmap bitmap = null;
            try {
                Drawable icon=pair.getValue().loadIcon(ctx.getPackageManager());bitmap=Bitmap.createBitmap(32,32,Bitmap.Config.ARGB_8888);
                icon.setBounds(0,0,32,32);icon.draw(new Canvas(bitmap));ByteArrayOutputStream out=new ByteArrayOutputStream();bitmap.compress(Bitmap.CompressFormat.PNG,100,out);
                if (out.size() <= 8192) app.put("iconPng",Base64.encodeToString(out.toByteArray(),Base64.NO_WRAP));
            } catch(Exception ignored) { /* Text fallback is sufficient. */ }
            finally {if(bitmap!=null)bitmap.recycle();}
            result.put(app);
        }
        return result;
    }
}
