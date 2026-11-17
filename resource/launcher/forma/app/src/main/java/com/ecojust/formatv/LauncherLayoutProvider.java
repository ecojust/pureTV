package com.ecojust.formatv;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Binder;
import android.os.Bundle;
import android.os.Process;
import android.util.Base64;
import org.json.JSONObject;
import java.nio.charset.StandardCharsets;

/** Shell-only, bounded layout API for the desktop manager. No arbitrary file/intent operations. */
public final class LauncherLayoutProvider extends ContentProvider {
    @Override public boolean onCreate() { return true; }
    @Override public Bundle call(String method, String arg, Bundle extras) {
        if (Binder.getCallingUid()!=Process.myUid() && getContext().checkCallingPermission("android.permission.DUMP")!=PackageManager.PERMISSION_GRANTED)
            throw new SecurityException("Layout access requires the shell DUMP permission");
        try {
            if ("apply".equals(method)) {
                if (arg==null || arg.length()>LauncherLayout.LIMIT*2) throw new IllegalArgumentException("Invalid layout.json payload");
                byte[] bytes=Base64.decode(arg,Base64.NO_WRAP);
                if (bytes.length>LauncherLayout.LIMIT) throw new IllegalArgumentException("layout.json is too large");
                LauncherLayout.apply(getContext(),new JSONObject(new String(bytes,StandardCharsets.UTF_8)));
            } else if ("reset".equals(method)) LauncherLayout.reset(getContext());
            else if (!"status".equals(method)) throw new IllegalArgumentException("Unknown layout operation");
            LauncherLayout override=LauncherLayout.override(getContext());
            JSONObject value=new JSONObject().put("supported",true).put("version",(override==null?LauncherLayout.defaults(getContext()):override).json.getInt("version")).put("custom",override!=null)
                .put("layout",(override==null?LauncherLayout.defaults(getContext()):override).json).put("apps",LauncherLayout.installedApps(getContext()));
            JSONObject template=LauncherLayout.template(getContext()).json;
            value.put("systemBasis",new JSONObject().put("screen",template.getJSONObject("screen")).put("home",template.getJSONObject("home").getJSONArray("system")).put("apps",template.getJSONObject("apps").getJSONArray("system")));
            Bundle result=new Bundle();result.putString("result",Base64.encodeToString(value.toString().getBytes(StandardCharsets.UTF_8),Base64.NO_WRAP));return result;
        } catch(Exception error) {throw new IllegalArgumentException("Cannot read or apply layout.json: "+error.getMessage(),error);}
    }
    @Override public Cursor query(Uri uri,String[] projection,String selection,String[] args,String order){throw new UnsupportedOperationException();}
    @Override public String getType(Uri uri){return null;}
    @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}
    @Override public int delete(Uri uri,String selection,String[] args){throw new UnsupportedOperationException();}
    @Override public int update(Uri uri,ContentValues values,String selection,String[] args){throw new UnsupportedOperationException();}
}
