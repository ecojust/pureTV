package com.ecojust.astertv;

import android.content.Context;
import android.util.Xml;
import org.json.JSONArray;
import org.json.JSONObject;
import org.xmlpull.v1.XmlPullParser;
import java.io.StringReader;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/** Public v4 schema. Launcher-owned system nodes are immutable through desktop/ADB apply. */
final class UnifiedLayout {
    private static final Set<String> TAGS=new HashSet<>(Arrays.asList("svg","g","path","rect","circle","ellipse","line","polyline","polygon"));
    private static final Set<String> ATTRS=new HashSet<>(Arrays.asList("viewBox","width","height","x","y","x1","y1","x2","y2","cx","cy","r","rx","ry","d","points","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","fill-rule","clip-rule","opacity","fill-opacity","stroke-opacity","transform","color","xmlns"));
    static final String ICON="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"4\"/></svg>";
    private static void keys(JSONObject object,String... allowed){Set<String> names=new HashSet<>(Arrays.asList(allowed));Iterator<String> keys=object.keys();while(keys.hasNext())if(!names.contains(keys.next()))throw new IllegalArgumentException("Unknown layout field");}
    static void svg(String text) throws Exception {
        if(text.getBytes(java.nio.charset.StandardCharsets.UTF_8).length>8192 || text.toUpperCase(java.util.Locale.ROOT).contains("<!DOCTYPE") || text.toUpperCase(java.util.Locale.ROOT).contains("<!ENTITY"))throw new IllegalArgumentException("Invalid SVG");
        XmlPullParser parser=Xml.newPullParser();parser.setInput(new StringReader(text));boolean root=false;
        for(int event=parser.next();event!=XmlPullParser.END_DOCUMENT;event=parser.next())if(event==XmlPullParser.START_TAG){
            if(!root){if(!"svg".equals(parser.getName()))throw new IllegalArgumentException("SVG root required");root=true;}
            if(!TAGS.contains(parser.getName()))throw new IllegalArgumentException("Unsupported SVG element");
            String namespace=parser.getNamespace();if(namespace!=null&&!namespace.isEmpty()&&!namespace.equals("http://www.w3.org/2000/svg"))throw new IllegalArgumentException("Invalid SVG namespace");
            for(int i=0;i<parser.getAttributeCount();i++){
                String key=parser.getAttributeName(i),value=parser.getAttributeValue(i),ns=parser.getAttributeNamespace(i);
                if(!ATTRS.contains(key)||ns!=null&&!ns.isEmpty())throw new IllegalArgumentException("Unsupported SVG attribute");
                if(key.equals("xmlns")){if(!value.equals("http://www.w3.org/2000/svg"))throw new IllegalArgumentException("Invalid SVG namespace");continue;}
                String lower=value.toLowerCase(java.util.Locale.ROOT);for(String token:new String[]{"url","javascript:","http:","https:","data:","@import","<",">"})if(lower.contains(token))throw new IllegalArgumentException("External SVG resources are not supported");
            }
        }
        if(!root)throw new IllegalArgumentException("SVG required");
        com.caverock.androidsvg.SVG.getFromString(text);
    }
    private static int integer(JSONObject value,String key,int min,int max)throws Exception{Object n=value.get(key);if(!(n instanceof Integer)||value.getInt(key)<min||value.getInt(key)>max)throw new IllegalArgumentException("Invalid "+key);return value.getInt(key);}
    static int color(String value){return "transparent".equals(value)?android.graphics.Color.TRANSPARENT:android.graphics.Color.parseColor(value);}
    static void validate(JSONObject d)throws Exception{
        keys(d,"version","screen","home","apps");if(d.length()!=4||!(d.opt("version") instanceof Integer)||(d.getInt("version")!=4&&d.getInt("version")!=5)||d.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>LauncherLayout.LIMIT)throw new IllegalArgumentException("Invalid unified layout");
        JSONObject screen=d.getJSONObject("screen");keys(screen,"width","height");if(screen.length()!=2)throw new IllegalArgumentException("Invalid screen");int width=integer(screen,"width",320,7680),height=integer(screen,"height",320,7680);
        for(String section:Arrays.asList("home","apps")){
            JSONObject page=d.getJSONObject(section);keys(page,"users","system","background","navigation");if(page.length()!=4)throw new IllegalArgumentException("Invalid page");
            JSONObject background=page.getJSONObject("background");keys(background,"color","image");if(!background.getString("color").matches("#[0-9a-fA-F]{6}"))throw new IllegalArgumentException("Invalid background color");
            if(background.has("image"))validateImage(background.getString("image"));
            JSONObject navigation=page.getJSONObject("navigation");keys(navigation,"up","down");Iterator<String> directions=navigation.keys();while(directions.hasNext())if(!Arrays.asList("home","apps").contains(navigation.getString(directions.next())))throw new IllegalArgumentException("Invalid navigation");
            Set<String> ids=new HashSet<>(),packages=new HashSet<>();
            for(String kind:Arrays.asList("users","system")){
                JSONArray nodes=page.getJSONArray(kind);if(nodes.length()>(kind.equals("system")?32:section.equals("home")?24:100))throw new IllegalArgumentException("Too many components");
                for(int i=0;i<nodes.length();i++){
                    JSONObject n=nodes.getJSONObject(i);if(d.getInt("version")==5)keys(n,"id","name","frame","action","text","visible","icon","textColor","iconColor","backgroundColor");else keys(n,"id","name","frame","action","text","visible","icon","color","backgroundColor");
                    String id=n.getString("id");if(!(n.get("id") instanceof String)||!id.matches("[-A-Za-z0-9_]{1,100}")||!ids.add(id))throw new IllegalArgumentException("Invalid component id");
                    if(n.length()!=(d.getInt("version")==5?10:9))throw new IllegalArgumentException("Missing component fields");
                    for(String key:Arrays.asList("name","text"))if(!(n.get(key) instanceof String)||n.getString(key).length()>100)throw new IllegalArgumentException("Invalid component text");
                    String action=n.getString("action");if(!LauncherLayout.validPackage(action)||kind.equals("users")&&!packages.add(action))throw new IllegalArgumentException("Invalid component action");
                    if(!(n.get("visible") instanceof Boolean))throw new IllegalArgumentException("Invalid visibility");
                    for(String key:d.getInt("version")==5?Arrays.asList("textColor","iconColor","backgroundColor"):Arrays.asList("color","backgroundColor"))if(!(d.getInt("version")==5&&key.equals("backgroundColor")&&n.getString(key).equals("transparent"))&&!n.getString(key).matches("#[0-9a-fA-F]{6}"))throw new IllegalArgumentException("Invalid component color");
                    svg(n.getString("icon"));JSONObject f=n.getJSONObject("frame");keys(f,"x","y","width","height");if(f.length()!=4)throw new IllegalArgumentException("Invalid frame");int x=integer(f,"x",0,width),y=integer(f,"y",0,height),w=integer(f,"width",1,width),h=integer(f,"height",1,height);if(w>width-x||h>height-y)throw new IllegalArgumentException("Component outside screen");

                }
            }
        }
    }
    private static void validateImage(String image)throws Exception{
        if(image.length()>33000||!image.matches("data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+"))throw new IllegalArgumentException("Invalid background image");byte[] bytes=android.util.Base64.decode(image.substring(image.indexOf(',')+1),android.util.Base64.NO_WRAP);
        android.graphics.BitmapFactory.Options opts=new android.graphics.BitmapFactory.Options();opts.inJustDecodeBounds=true;android.graphics.BitmapFactory.decodeByteArray(bytes,0,bytes.length,opts);if(opts.outWidth<1||opts.outHeight<1||opts.outWidth>1920||opts.outHeight>1080)throw new IllegalArgumentException("Invalid background image dimensions");
    }
    static JSONArray resized(JSONArray nodes,JSONObject from,JSONObject to)throws Exception{
        JSONArray result=new JSONArray(nodes.toString());for(int i=0;i<result.length();i++){JSONObject f=result.getJSONObject(i).getJSONObject("frame");for(String key:Arrays.asList("x","y","width","height")){String axis=key.equals("x")||key.equals("width")?"width":"height";int n=(int)Math.round(f.getDouble(key)*to.getDouble(axis)/from.getDouble(axis));f.put(key,key.equals("width")||key.equals("height")?Math.max(1,n):n);}}return result;
    }
    static void locked(JSONObject next,JSONObject current)throws Exception{
        for(String page:Arrays.asList("home","apps")){
            JSONArray a=next.getJSONObject(page).getJSONArray("system"),b=resized(current.getJSONObject(page).getJSONArray("system"),current.getJSONObject("screen"),next.getJSONObject("screen"));
            if(a.length()!=b.length())throw new IllegalArgumentException("System components are read-only");
            for(int i=0;i<a.length();i++)if(!equal(a.getJSONObject(i),b.getJSONObject(i)))throw new IllegalArgumentException("System components are read-only");
        }
    }
    private static boolean equal(JSONObject a,JSONObject b)throws Exception{if(a.length()!=b.length())return false;Iterator<String> keys=a.keys();while(keys.hasNext()){String k=keys.next();Object x=a.get(k),y=b.opt(k);if(x instanceof JSONObject){if(!(y instanceof JSONObject)||!equal((JSONObject)x,(JSONObject)y))return false;}else if(!x.equals(y))return false;}return true;}
    static JSONObject page(JSONObject d,String section)throws Exception{
        JSONObject source=d.getJSONObject(section),page=new JSONObject().put("columns",4);JSONArray items=new JSONArray(),elements=new JSONArray();JSONObject background=new JSONObject().put("frame",new JSONObject().put("x",0).put("y",0).put("width",d.getJSONObject("screen").getInt("width")).put("height",d.getJSONObject("screen").getInt("height"))).put("color",source.getJSONObject("background").getString("color")).put("visible",true).put("zIndex",0);if(source.getJSONObject("background").has("image"))background.put("image",source.getJSONObject("background").getString("image"));
        for(int i=0;i<source.getJSONArray("system").length();i++){
            JSONObject n=source.getJSONArray("system").getJSONObject(i);String id=n.getString("id");
            if(id.equals("background")){background=new JSONObject().put("frame",n.getJSONObject("frame")).put("color",n.getString("backgroundColor")).put("visible",n.getBoolean("visible")).put("zIndex",0);if(n.has("image"))background.put("image",n.getString("image"));}
            else if(id.startsWith("shortcut-")){String action=id.substring(9).replaceFirst("-\\d+$","");items.put(item(n).put("action",action));}
            else elements.put(new JSONObject().put("id",id).put("name",n.getString("name")).put("frame",n.getJSONObject("frame")).put("visible",n.getBoolean("visible")).put("zIndex",2).put("color",n.optString("textColor",n.optString("color","#243E3A"))).put("backgroundColor",n.getString("backgroundColor")).put("text",n.getString("text")).put("svg",n.getString("icon")).put("iconColor",n.optString("iconColor",n.optString("color","#243E3A"))));
        }
        for(int i=0;i<source.getJSONArray("users").length();i++){JSONObject n=source.getJSONArray("users").getJSONObject(i);items.put(item(n).put("packageName",n.getString("action")));}
        if(background==null)throw new IllegalArgumentException("Missing system background");return page.put("items",items).put("scene",new JSONObject().put("background",background).put("elements",elements));
    }
    private static JSONObject item(JSONObject n)throws Exception{return new JSONObject().put("label",n.getString("text")).put("frame",n.getJSONObject("frame")).put("visible",n.getBoolean("visible")).put("color",n.getString("backgroundColor")).put("foreground",n.optString("textColor",n.optString("color","#243E3A"))).put("svg",n.getString("icon")).put("iconColor",n.optString("iconColor",n.optString("color","#243E3A"))).put("zIndex",1);}
    static JSONObject withInstalled(Context ctx,JSONObject template)throws Exception{
        JSONArray apps=LauncherLayout.installedApps(ctx);int homeCount=Math.min(6,apps.length());
        for(String page:Arrays.asList("home","apps")){
            JSONArray users=template.getJSONObject(page).getJSONArray("users");int count=page.equals("home")?homeCount:apps.length();
            for(int i=0;i<count;i++){
                JSONObject app=apps.getJSONObject(i);String pkg=app.getString("packageName"),label=app.getString("label");if(label.length()>100){int end=100;if(Character.isHighSurrogate(label.charAt(end-1)))end--;label=label.substring(0,end);}
                JSONObject frame=LayoutScene.frame(new JSONObject(),i,4,count,page);
                if(template.optInt("version")==5){
                    if(page.equals("home")){int[][] positions={{356,145,168,146},{550,125,168,146},{744,145,168,146},{356,324,168,146},{550,344,168,146},{744,324,168,146}};int[] at=positions[i];frame=new JSONObject().put("x",at[0]).put("y",at[1]).put("width",at[2]).put("height",at[3]);}
                    else {int rows=Math.max(1,(count+5)/6),step=Math.min(140,408/rows);frame=new JSONObject().put("x",48+(i%6)*146).put("y",116+(i/6)*step).put("width",134).put("height",Math.max(1,Math.min(126,step-8)));}
                }
                users.put(new JSONObject().put("id","app-"+i).put("name",label).put("text",label).put("frame",frame).put("action",pkg).put("visible",true).put("icon",SvgIcon.forPackage(pkg)).put("textColor","#F5F6FA").put("iconColor",SvgIcon.ink(pkg)).put("backgroundColor",SvgIcon.surface(pkg)));
            }
        }
        // Keep all installed entries within v5's shared 90 KiB budget. A large catalogue
        // first uses a smaller copy of the same artwork, then shorter displayed labels.
        if(size(template)>LauncherLayout.LIMIT){
            try(java.io.InputStream image=ctx.getAssets().open("wallpaper-compact.webp");java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream()){
                byte[] buffer=new byte[4096];int read;while((read=image.read(buffer))!=-1)bytes.write(buffer,0,read);
                template.getJSONObject("home").getJSONObject("background").put("image","data:image/webp;base64,"+android.util.Base64.encodeToString(bytes.toByteArray(),android.util.Base64.NO_WRAP));
            }
        }
        for(int limit:new int[]{64,48,32,16})if(size(template)>LauncherLayout.LIMIT){
            for(String section:Arrays.asList("home","apps")){JSONArray nodes=template.getJSONObject(section).getJSONArray("users");for(int i=0;i<nodes.length();i++){
                JSONObject n=nodes.getJSONObject(i);String label=n.getString("text");if(label.length()>limit){int end=limit-1;if(Character.isHighSurrogate(label.charAt(end-1)))end--;label=label.substring(0,end)+"…";n.put("text",label).put("name",label);}
            }}
        }
        if(size(template)>LauncherLayout.LIMIT)template.getJSONObject("home").getJSONObject("background").remove("image");
        return template;
    }
    private static int size(JSONObject value){return value.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;}
    static JSONObject migrate(JSONObject old,JSONObject template)throws Exception{
        JSONObject result=new JSONObject(template.toString());
        if(old.optInt("version")==4){
            JSONObject screen=old.getJSONObject("screen");
            for(String page:Arrays.asList("home","apps")){
                JSONObject target=result.getJSONObject(page),source=old.getJSONObject(page);
                target.put("system",resized(target.getJSONArray("system"),result.getJSONObject("screen"),screen));
                JSONArray users=new JSONArray(source.getJSONArray("users").toString());
                for(int i=0;i<users.length();i++){JSONObject n=users.getJSONObject(i);String color=n.getString("color");n.remove("color");n.put("textColor",color).put("iconColor",color);}
                target.put("users",users).put("background",source.getJSONObject("background")).put("navigation",source.getJSONObject("navigation"));
            }
            result.put("screen",screen);return result;
        }
        for(String page:Arrays.asList("home","apps")){
            JSONObject oldScene=old.getJSONObject(page).optJSONObject("scene");JSONObject oldBackground=oldScene==null?null:oldScene.optJSONObject("background");if(oldBackground!=null){JSONObject bg=result.getJSONObject(page).getJSONObject("background");bg.put("color",oldBackground.optString("color","#101419"));if(oldBackground.has("image"))bg.put("image",oldBackground.getString("image"));}
            JSONArray entries=old.getJSONObject(page).getJSONArray("items");boolean hasCustom=false;for(int i=0;i<entries.length();i++)if(entries.getJSONObject(i).has("packageName"))hasCustom=true;
            if(hasCustom)result.getJSONObject(page).put("users",new JSONArray());JSONArray users=result.getJSONObject(page).getJSONArray("users");
            for(int i=0;i<entries.length();i++){JSONObject e=entries.getJSONObject(i);if(!e.has("packageName"))continue;String label=e.optString("label",e.getString("packageName"));JSONObject f=LayoutScene.frame(e,i,old.getJSONObject(page).optInt("columns",4),entries.length(),page);users.put(new JSONObject().put("id","app-imported-"+i).put("name",label).put("text",label).put("frame",f).put("action",e.getString("packageName")).put("visible",e.optBoolean("visible",true)).put("icon",ICON).put("textColor","#BFC3C8").put("iconColor","#BFC3C8").put("backgroundColor",e.optString("color","#374959")));}
        }return result;
    }
}
