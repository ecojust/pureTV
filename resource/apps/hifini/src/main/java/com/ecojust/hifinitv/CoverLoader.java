package com.ecojust.hifinitv;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Looper;
import android.util.LruCache;
import android.widget.ImageView;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.lang.ref.WeakReference;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Bounded artwork only: 4 MiB memory cache, 512 px hero / 160 px thumbnails, no disk cache. */
final class CoverLoader {
    private static final int MAX_BYTES=2*1024*1024;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final LruCache<String,Bitmap> cache=new LruCache<String,Bitmap>(4*1024*1024){
        @Override protected int sizeOf(String key,Bitmap bitmap){return bitmap.getAllocationByteCount();}
    };
    private final ThreadPoolExecutor worker=new ThreadPoolExecutor(1,1,20,TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(8),new ThreadPoolExecutor.DiscardOldestPolicy());
    private volatile boolean closed;
    private volatile int epoch;
    {worker.allowCoreThreadTimeOut(true);}

    void load(String url,ImageView view){load(url,view,160);}
    void load(String raw,ImageView view,int size){
        String url=raw==null?"":raw;int limit=size>160?512:160;String key=limit+":"+url;
        view.setTag(key);view.setImageDrawable(MusicVisuals.artwork());
        if(!valid(url)||closed)return;
        Bitmap cached=cache.get(key);if(cached!=null){view.setImageBitmap(cached);return;}
        int ticket=epoch;WeakReference<ImageView> target=new WeakReference<>(view);
        worker.execute(()->{
            Bitmap bitmap=cache.get(key);if(bitmap==null)bitmap=fetch(url,limit,ticket);if(bitmap==null||closed)return;
            synchronized(cache){if(ticket!=epoch||closed)return;cache.put(key,bitmap);}
            Bitmap result=bitmap;main.post(()->{ImageView current=target.get();if(!closed&&ticket==epoch&&current!=null&&key.equals(current.getTag()))current.setImageBitmap(result);});
        });
    }
    private Bitmap fetch(String source,int size,int ticket){
        HttpURLConnection connection=null;
        try{
            String url=source;
            for(int redirect=0;redirect<4;redirect++){
                if(!valid(url)||closed||ticket!=epoch||Thread.currentThread().isInterrupted())return null;
                connection=(HttpURLConnection)new URL(url).openConnection();connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(5000);connection.setReadTimeout(5000);
                connection.setRequestProperty("User-Agent",HifiniApi.AGENT);connection.setRequestProperty("Referer","https://www.hifini.net/");
                int code=connection.getResponseCode();
                if(code>=300&&code<400){String location=connection.getHeaderField("Location");if(location==null)return null;url=new URL(new URL(url),location).toExternalForm();connection.disconnect();connection=null;continue;}
                if(code!=200||connection.getContentLengthLong()>MAX_BYTES)return null;
                byte[] bytes;
                try(InputStream input=connection.getInputStream();ByteArrayOutputStream output=new ByteArrayOutputStream()){
                    byte[] chunk=new byte[8192];int count;
                    while((count=input.read(chunk))!=-1){if(closed||ticket!=epoch||Thread.currentThread().isInterrupted()||output.size()+count>MAX_BYTES)return null;output.write(chunk,0,count);}bytes=output.toByteArray();
                }
                BitmapFactory.Options options=new BitmapFactory.Options();options.inJustDecodeBounds=true;BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);
                if(options.outWidth<=0||options.outHeight<=0||options.outWidth>20000||options.outHeight>20000)return null;
                options.inSampleSize=1;while(options.outWidth/options.inSampleSize>size||options.outHeight/options.inSampleSize>size)options.inSampleSize*=2;
                options.inJustDecodeBounds=false;options.inPreferredConfig=Bitmap.Config.RGB_565;return BitmapFactory.decodeByteArray(bytes,0,bytes.length,options);
            }
            return null;
        }catch(Exception|OutOfMemoryError ignored){return null;}finally{if(connection!=null)connection.disconnect();}
    }
    private static boolean valid(String raw){
        try{java.net.URI uri=new java.net.URI(raw);String host=uri.getHost();return "https".equalsIgnoreCase(uri.getScheme())&&host!=null&&!host.isEmpty()&&uri.getUserInfo()==null&&!host.equalsIgnoreCase("localhost")&&!host.equals("127.0.0.1")&&!host.equals("::1");}
        catch(java.net.URISyntaxException e){return false;}
    }
    void trim(){synchronized(cache){epoch++;cache.evictAll();}worker.getQueue().clear();main.removeCallbacksAndMessages(null);}
    void close(){closed=true;worker.shutdownNow();main.removeCallbacksAndMessages(null);cache.evictAll();}
}
