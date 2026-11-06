package com.ecojust.bilitv;

import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import java.io.File;
import java.io.FileOutputStream;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.SurfaceView;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-mdpi")
public class PlaybackTest {
    private static final String BV="BV1xx411c7mD";
    private static FakeRepository repository;
    private static List<FakeEngine> engines;
    private static boolean autoPlay;
    private ActivityController<TestActivity> controller;
    static class FakeRepository implements PlaybackActivity.Repository {
        boolean authenticated;volatile long epoch;volatile CountDownLatch block;
        final List<Long> reports=Collections.synchronizedList(new ArrayList<>());
        public VideoApi.Detail detail(String id)throws IOException{
            if(block!=null)try{block.await(3,TimeUnit.SECONDS);}catch(InterruptedException interrupted){Thread.currentThread().interrupt();throw new IOException("cancelled");}
            return new VideoApi.Detail(new VideoApi.Video(BV,42,"演示视频","测试作者","",120),"",Collections.singletonList(new VideoApi.Part(123,1,"第一集",120)));
        }
        public VideoApi.Playback play(String id,long cid,int q){return new VideoApi.Playback(Collections.emptyList(),"https://media.example.invalid/video","https://media.example.invalid/audio",64,120000);}
        public boolean authenticated(){return authenticated;}
        public long accountGeneration(){return epoch;}
        public void heartbeat(String id,long cid,long seconds,boolean ended){reports.add(ended?-1:seconds);}
    }
    static class FakeEngine implements PlaybackEngine {
        Events events;boolean playing,released;long position;
        FakeEngine(Events events){this.events=events;engines.add(this);}
        public void prepare(VideoApi.Playback source,long at){position=at;playing=autoPlay;events.state(!autoPlay,playing,false);}
        public void play(){playing=true;events.state(false,true,false);}
        public void pause(){playing=false;events.state(false,false,false);}
        public void seek(long at){position=Math.max(0,Math.min(120000,at));}
        public long position(){return position;}
        public long duration(){return 120000;}
        public boolean isPlaying(){return playing;}
        public void release(){playing=false;released=true;}
        void complete(){playing=false;position=120000;events.state(false,false,true);}
    }
    public static class TestActivity extends PlaybackActivity {
        @Override protected Repository createRepository(){return repository;}
        @Override protected PlaybackEngine createEngine(SurfaceView surface,PlaybackEngine.Events events){return new FakeEngine(events);}
    }
    @Before public void reset(){repository=new FakeRepository();engines=new ArrayList<>();autoPlay=true;RuntimeEnvironment.getApplication().getSharedPreferences("bilitv-playback",0).edit().clear().commit();}
    private void open(){Intent intent=new Intent(RuntimeEnvironment.getApplication(),TestActivity.class).putExtra("bvid",BV).putExtra("cid",123L).putExtra("title","演示视频");controller=Robolectric.buildActivity(TestActivity.class,intent).create().start().resume().visible().windowFocusChanged(true);}
    private void waitEngines(int count)throws Exception{for(int i=0;i<100&&engines.size()<count;i++){Thread.sleep(10);shadowOf(Looper.getMainLooper()).idle();}assertEquals(count,engines.size());}
    private void close(){if(controller!=null)controller.pause().stop().destroy();}
    @Test public void remoteSeekingAndLifecycleReleaseDecoderAndResumeOnlyLocalPosition()throws Exception{
        try{open();waitEngines(1);FakeEngine first=engines.get(0);controller.get().dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_MEDIA_FAST_FORWARD));assertEquals(10000,first.position());
            first.position=45000;controller.pause();assertTrue(first.released);assertEquals(45000,new PlaybackPositionStore(controller.get()).get(BV,123));
            controller.resume();waitEngines(2);assertEquals(45000,engines.get(1).position());assertTrue(repository.reports.isEmpty());
        }finally{close();}
    }
    @Test public void pausedActivityCannotStartLateResolvedMedia()throws Exception{
        repository.block=new CountDownLatch(1);try{open();controller.pause();repository.block.countDown();Thread.sleep(60);shadowOf(Looper.getMainLooper()).idle();assertTrue(engines.isEmpty());}finally{controller.stop().destroy();controller=null;}
    }
    @Test public void bufferingNeverCreatesViewingHistory()throws Exception{
        autoPlay=false;repository.authenticated=true;try{open();waitEngines(1);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(31));assertTrue(repository.reports.isEmpty());assertTrue(engines.get(0).released);}finally{close();}
    }
    @Test public void changedAccountCannotReceiveAnOldPlaybackHeartbeat()throws Exception{
        repository.authenticated=true;try{open();waitEngines(1);engines.get(0).position=30000;repository.epoch++;shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(31));assertTrue(repository.reports.isEmpty());}finally{close();}
    }
    @Test public void completionReportsOnlyOnceAndClearsResumePosition()throws Exception{
        repository.authenticated=true;try{open();waitEngines(1);engines.get(0).position=30000;new PlaybackPositionStore(controller.get()).save(BV,123,30000,false);engines.get(0).complete();
            for(int i=0;i<100&&repository.reports.isEmpty();i++)Thread.sleep(5);
            assertEquals(Collections.singletonList(-1L),repository.reports);assertEquals(0,new PlaybackPositionStore(controller.get()).get(BV,123));controller.pause();Thread.sleep(30);assertEquals(1,repository.reports.size());controller.stop().destroy();controller=null;
        }finally{close();}
    }
    @Test public void segmentedResumeMapsGlobalTimeAndNeverLeaksCredentialsToCdn(){
        assertArrayEquals(new long[]{0,9000},ExoPlaybackEngine.locate(new long[]{10000,20000},9000));
        assertArrayEquals(new long[]{1,5000},ExoPlaybackEngine.locate(new long[]{10000,20000},15000));
        assertArrayEquals(new long[]{1,19999},ExoPlaybackEngine.locate(new long[]{10000,20000},999999));
        Map<String,String> source=new HashMap<>();source.put("Cookie","SESSDATA=secret");source.put("Authorization","secret");source.put("Referer","https://www.bilibili.com/");source.put("User-Agent","BiliTV");
        Map<String,String> safe=ExoPlaybackEngine.mediaHeaders(source);assertEquals(2,safe.size());assertFalse(safe.containsKey("Cookie"));assertFalse(safe.containsKey("Authorization"));
    }
    private void checkButtons(View view,View root){
        if(view instanceof Button&&view.isShown()){Rect box=new Rect();view.getDrawingRect(box);((ViewGroup)root).offsetDescendantRectToMyCoords(view,box);assertTrue("Control fits compact player: "+((Button)view).getText(),box.left>=0&&box.right<=root.getWidth()&&box.top>=0&&box.bottom<=root.getHeight());}
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)checkButtons(((ViewGroup)view).getChildAt(i),root);
    }
    private String focusState(View root){
        View focused=controller.get().getCurrentFocus();
        return "windowFocus="+root.hasWindowFocus()+", rootShown="+root.isShown()+", root="+root.getWidth()+"x"+root.getHeight()+", focus="+(focused==null?"null":focused.getClass().getSimpleName()+"/shown="+focused.isShown());
    }
    private void captureControls(ViewGroup root,String name)throws Exception{
        String destination=System.getenv("BILIBILI_UI_CAPTURE_DIR");if(destination!=null&&!destination.isEmpty()){File file=new File(destination,name);file.getParentFile().mkdirs();Bitmap bitmap=Bitmap.createBitmap(root.getWidth(),root.getHeight(),Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));try(FileOutputStream out=new FileOutputStream(file)){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
    }
    @Test @Config(sdk=28,qualifiers="en-rUS-w640dp-h360dp-land-mdpi") @GraphicsMode(GraphicsMode.Mode.NATIVE)
    public void englishControlsFitCompactTvAndRetainKeyboardFocus()throws Exception{
        try{open();waitEngines(1);ViewGroup root=(ViewGroup)((ViewGroup)controller.get().findViewById(android.R.id.content)).getChildAt(0);
            root.measure(View.MeasureSpec.makeMeasureSpec(640,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(360,View.MeasureSpec.EXACTLY));root.layout(0,0,640,360);
            shadowOf(Looper.getMainLooper()).idle();
            System.out.println("Initial player controls: "+focusState(root));
            captureControls(root,"bilibili-player-controls.en.png");
            assertTrue("The fixture delivered the real window-focus lifecycle",root.hasWindowFocus());
            checkButtons(root,root);
            assertNotNull("Initial visible controls receive keyboard focus after layout: "+focusState(root),controller.get().getCurrentFocus());
            assertTrue(controller.get().getCurrentFocus().isShown());
            // Normal playback hides the controls; the remote must restore a usable, visible focus.
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(6));
            controller.get().dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_UP));
            controller.get().dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_DPAD_UP));
            shadowOf(Looper.getMainLooper()).idle();
            System.out.println("Remote-woken player controls: "+focusState(root));
            assertNotNull("Remote wake restores a control focus: "+focusState(root),controller.get().getCurrentFocus());
            assertTrue(controller.get().getCurrentFocus().isShown());
            checkButtons(root,root);
        }finally{close();}
    }
    @Test @Config(sdk=19) public void legacyAndroidCanCreateAndReleaseThePlayerShell()throws Exception{try{open();waitEngines(1);assertFalse(controller.get().isFinishing());}finally{close();}assertTrue(engines.get(0).released);}
}
