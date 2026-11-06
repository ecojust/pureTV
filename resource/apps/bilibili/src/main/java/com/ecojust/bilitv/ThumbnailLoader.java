package com.ecojust.bilitv;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;
import java.io.*;
import java.net.*;
import java.util.Locale;
import java.util.concurrent.*;

/** Bounded, memory-only public artwork loader. Never sends account credentials. */
final class ThumbnailLoader implements AutoCloseable {
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor pool=new ThreadPoolExecutor(2,2,20,TimeUnit.SECONDS,new ArrayBlockingQueue<>(32),new ThreadPoolExecutor.DiscardPolicy());
    private final LruCache<String,Bitmap> cache=new LruCache<String,Bitmap>(6*1024*1024){@Override protected int sizeOf(String key,Bitmap value){return value.getByteCount();}};
    private volatile boolean closed;
    static URL safe(String raw)throws IOException {
        URL url=new URL(raw);String host=url.getHost().toLowerCase(Locale.ROOT);
        if(!"https".equals(url.getProtocol())||url.getUserInfo()!=null||url.getPort()!=-1&&url.getPort()!=443||!(host.endsWith(".hdslb.com")||host.endsWith(".biliimg.com")))throw new IOException("Invalid artwork address");
        return url;
    }
    void load(String raw,ImageView target){
        target.setTag(raw);if(raw==null||raw.isEmpty()||closed)return;
        Bitmap ready=cache.get(raw);if(ready!=null){target.setImageBitmap(ready);return;}
        pool.execute(()->{HttpURLConnection connection=null;try{
            connection=(HttpURLConnection)safe(raw).openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(6000);connection.setReadTimeout(6000);
            if(connection.getResponseCode()!=200||connection.getContentLength()>2*1024*1024)return;
            byte[] bytes;try(InputStream input=connection.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){byte[] buffer=new byte[8192];int count;while((count=input.read(buffer))!=-1){if(closed||Thread.currentThread().isInterrupted()||output.size()+count>2*1024*1024)return;output.write(buffer,0,count);}bytes=output.toByteArray();}
            BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);
            if(options.outWidth<=0||options.outHeight<=0||options.outWidth>12000||options.outHeight>12000)return;
            options.inJustDecodeBounds=false;options.inSampleSize=1;while(options.outWidth/options.inSampleSize>480||options.outHeight/options.inSampleSize>320)options.inSampleSize*=2;
            Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);if(bitmap==null)return;
            if(closed){bitmap.recycle();return;}cache.put(raw,bitmap);
            main.post(()->{if(!closed&&raw.equals(target.getTag()))target.setImageBitmap(bitmap);});
        }catch(IOException|RuntimeException ignored){/* Placeholder remains; no signed URLs or cookies are logged. */}finally{if(connection!=null)connection.disconnect();}});
    }
    @Override public void close(){closed=true;pool.shutdownNow();main.removeCallbacksAndMessages(null);cache.evictAll();}
}
