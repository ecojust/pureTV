package com.ecojust.bilitv;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONObject;
import java.util.Iterator;

/** Bounded, device-local resume positions; this is not presented as account history. */
final class PlaybackPositionStore {
    private final SharedPreferences prefs;
    PlaybackPositionStore(Context context){prefs=context.getSharedPreferences("bilitv-playback",Context.MODE_PRIVATE);}
    private JSONObject read(){try{return new JSONObject(prefs.getString("positions","{}"));}catch(Exception ignored){return new JSONObject();}}
    synchronized long get(String bvid,long cid){JSONObject entry=read().optJSONObject(bvid+":"+cid);return entry==null?0:Math.max(0,entry.optLong("position",0));}
    synchronized void save(String bvid,long cid,long position,boolean ended){
        if(bvid==null||!bvid.matches("BV[0-9A-Za-z]{10}")||cid<=0)return;
        JSONObject all=read();String key=bvid+":"+cid;
        try{
            if(ended)all.remove(key);else if(position>0)all.put(key,new JSONObject().put("position",position).put("time",System.currentTimeMillis()));
            while(all.length()>50){String oldest=null;long at=Long.MAX_VALUE;Iterator<String> keys=all.keys();while(keys.hasNext()){String next=keys.next();long time=all.getJSONObject(next).optLong("time",0);if(oldest==null||time<at){oldest=next;at=time;}}all.remove(oldest);}
            prefs.edit().putString("positions",all.toString()).apply();
        }catch(Exception ignored){/* A damaged local resume record must not stop playback. */}
    }
}
