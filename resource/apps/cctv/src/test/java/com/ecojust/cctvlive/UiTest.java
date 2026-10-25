package com.ecojust.cctvlive;

import android.app.AlertDialog;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.media.MediaPlayer;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import org.robolectric.annotation.LooperMode;
import org.robolectric.shadows.ShadowAlertDialog;
import org.robolectric.shadows.ShadowMediaPlayer;
import java.io.File;
import java.io.FileOutputStream;
import java.time.Duration;
import java.util.Collections;
import java.util.List;
import java.util.regex.Pattern;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Real bundled channel metadata and native controls, with only the decoder replaced by a shadow. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class UiTest {
    @Before public void prepare() {
        // A TV remote operates outside touch mode; otherwise Android can reject button focus.
        new android.app.Instrumentation().setInTouchMode(false);
        RuntimeEnvironment.getApplication().getSharedPreferences("cctv-live",0).edit().clear().commit();
        ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,1));
    }

    private ActivityController<MainActivity> activity() {
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible();
        layout(controller.get(),1920,1080);
        return controller;
    }
    private void layout(MainActivity activity,int width,int height) {
        View root=activity.getWindow().getDecorView();
        for(int i=0;i<2;i++){
            root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));
            root.layout(0,0,width,height);
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));
        }
    }
    @SuppressWarnings("unchecked") private <T>T field(Object object,String name,Class<?> owner)throws Exception {
        java.lang.reflect.Field field=owner.getDeclaredField(name);field.setAccessible(true);return (T)field.get(object);
    }
    private MediaPlayer decoder(MainActivity activity)throws Exception{return field(activity.live,"player",LivePlayer.class);}
    private Button button(MainActivity activity,String tag){Button value=activity.getWindow().getDecorView().findViewWithTag(tag);assertNotNull(tag,value);return value;}
    private void attachSurface(MainActivity activity){SurfaceView surface=activity.getWindow().getDecorView().findViewWithTag("video-surface");assertNotNull(surface);activity.surfaceCreated(surface.getHolder());}
    private void prepared(){shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(30));}
    private void choose(MainActivity activity,int position){
        activity.channelList.setSelection(position);
        activity.channelList.performItemClick(null,position,activity.channelList.getAdapter().getItemId(position));
    }
    private void play(MainActivity activity){attachSurface(activity);button(activity,"play").performClick();prepared();assertEquals(LivePlayer.State.PLAYING,activity.live.state());}
    private void key(MainActivity activity,int code){activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,code));activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,code));}
    private void assertStaysInApp(MainActivity activity){assertFalse(activity.isFinishing());assertFalse(activity.isDestroyed());assertNull(shadowOf(activity).getNextStartedActivity());}

    @Test public void bundledChannelsOpenWithoutAutoplayAndRememberFavouritesAndLastSelection()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();
            assertEquals(21,activity.channelList.getCount());assertEquals("cctv1.cn",activity.current.id);
            assertNull(decoder(activity));assertEquals(LivePlayer.State.STOPPED,activity.live.state());
            button(activity,"favourite").performClick();attachSurface(activity);choose(activity,1);prepared();
            assertEquals("cctv2.cn",activity.current.id);button(activity,"favourite").performClick();
            assertEquals(2,activity.getSharedPreferences("cctv-live",0).getStringSet("favourites",Collections.emptySet()).size());
        }
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();assertEquals("cctv2.cn",activity.current.id);assertNull(decoder(activity));
            assertEquals(1,activity.channelList.getSelectedItemPosition());
            button(activity,"tab-favourites").performClick();assertEquals(2,activity.channelList.getCount());
            assertEquals("cctv1.cn",((ChannelCatalog.Channel)activity.channelList.getAdapter().getItem(0)).id);
            button(activity,"favourite").performClick();assertEquals(1,activity.channelList.getCount());
            button(activity,"tab-all").performClick();assertEquals(21,activity.channelList.getCount());
        }
    }

    @Test public void chosenChannelAndStreamDialogUseTheFixedFileUrls()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();List<ChannelCatalog.Channel> channels=ChannelCatalog.load(activity);
            attachSurface(activity);choose(activity,1);prepared();
            assertEquals(channels.get(1).routes.get(0).url,activity.live.url());assertEquals("cctv2.cn",activity.current.id);
            MediaPlayer first=decoder(activity);
            key(activity,KeyEvent.KEYCODE_MENU);AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertTrue(dialog.isShowing());
            ListView routes=dialog.getListView();assertEquals(2,routes.getCount());
            assertEquals(channels.get(1).routes.get(1).displayName(activity),routes.getAdapter().getItem(1));
            routes.performItemClick(null,1,1);prepared();
            assertEquals(channels.get(1).routes.get(1).url,activity.live.url());assertEquals(1,activity.routeIndex);
            assertEquals("cctv2.cn",activity.current.id);assertFalse(dialog.isShowing());
            assertEquals(ShadowMediaPlayer.State.END,shadowOf(first).getState());assertNotSame(first,decoder(activity));
            key(activity,KeyEvent.KEYCODE_MENU);AlertDialog staleRoutes=ShadowAlertDialog.getLatestAlertDialog();assertTrue(staleRoutes.isShowing());
            activity.next();prepared();
            assertEquals("cctv3.cn",activity.current.id);assertFalse(staleRoutes.isShowing());
        }
    }

    @Test public void fullscreenKeepsOneDecoderAndRemoteNavigationReturnsToTheSelectedChannel()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();play(activity);MediaPlayer first=decoder(activity);
            button(activity,"fullscreen").performClick();layout(activity,1920,1080);
            assertTrue(activity.fullscreen);assertSame(first,decoder(activity));
            activity.onBackPressed();layout(activity,1920,1080);
            assertFalse(activity.fullscreen);assertSame(first,decoder(activity));assertTrue(activity.channelList.hasFocus());
            button(activity,"fullscreen").performClick();
            View footer=field(activity,"footer",MainActivity.class);
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(4));
            assertEquals(View.VISIBLE,footer.getVisibility());key(activity,KeyEvent.KEYCODE_DPAD_RIGHT);
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(4));
            assertEquals(View.VISIBLE,footer.getVisibility());assertSame(first,decoder(activity));
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(600));
            assertEquals(View.GONE,footer.getVisibility());assertSame(first,decoder(activity));
            key(activity,KeyEvent.KEYCODE_DPAD_DOWN);prepared();
            assertEquals("cctv2.cn",activity.current.id);assertEquals(ShadowMediaPlayer.State.END,shadowOf(first).getState());
            activity.onBackPressed();layout(activity,1920,1080);
            assertFalse(activity.fullscreen);assertTrue(activity.channelList.hasFocus());assertEquals(1,activity.channelList.getSelectedItemPosition());
            assertStaysInApp(activity);
        }
    }

    @Test public void failedSingleRouteRemainsOnTheChannelAndOffersWorkingRetry()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();attachSurface(activity);choose(activity,2);prepared();
            assertEquals("cctv3.cn",activity.current.id);assertEquals(1,activity.current.routes.size());
            String url=activity.live.url();shadowOf(decoder(activity)).invokeErrorListener(1,-1004);prepared();
            assertEquals(LivePlayer.State.ERROR,activity.live.state());assertEquals("cctv3.cn",activity.current.id);assertEquals(url,activity.live.url());
            assertEquals(activity.getString(R.string.retry),button(activity,"play").getText().toString());
            assertTrue("Retry must receive remote focus; touchMode="+button(activity,"play").isInTouchMode()+", focused="+activity.getCurrentFocus(),button(activity,"play").hasFocus());
            assertStaysInApp(activity);assertNull(decoder(activity));
            button(activity,"play").performClick();prepared();assertEquals(LivePlayer.State.PLAYING,activity.live.state());assertEquals(url,activity.live.url());
        }
    }

    @Test public void exhaustedRoutesStopRetryingUntilTheUserActs()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();play(activity);ChannelCatalog.Channel channel=activity.current;
            shadowOf(decoder(activity)).invokeErrorListener(1,-1004);prepared();
            assertEquals(1,activity.routeIndex);assertEquals(channel.routes.get(1).url,activity.live.url());assertEquals(LivePlayer.State.PLAYING,activity.live.state());
            shadowOf(decoder(activity)).invokeErrorListener(1,-1004);prepared();
            assertEquals(LivePlayer.State.ERROR,activity.live.state());assertNull(decoder(activity));
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(30));
            assertEquals(LivePlayer.State.ERROR,activity.live.state());assertNull(decoder(activity));assertEquals(channel.id,activity.current.id);assertStaysInApp(activity);
            button(activity,"play").performClick();prepared();assertEquals(LivePlayer.State.PLAYING,activity.live.state());
        }
    }

    @Test public void changingChannelCancelsAnOlderPendingFallback()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();play(activity);
            shadowOf(decoder(activity)).invokeErrorListener(1,-1004);
            choose(activity,2);prepared();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(1));
            assertEquals("cctv3.cn",activity.current.id);assertEquals(activity.current.routes.get(0).url,activity.live.url());assertEquals(0,activity.routeIndex);
            assertEquals(LivePlayer.State.PLAYING,activity.live.state());assertStaysInApp(activity);
        }
    }

    @Test public void leavingDuringFallbackReleasesPlaybackAndCancelsTheQueuedSwitch()throws Exception {
        try(ActivityController<MainActivity> controller=activity()){
            MainActivity activity=controller.get();play(activity);MediaPlayer old=decoder(activity);
            shadowOf(old).invokeErrorListener(1,-1004);controller.pause().stop();
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(30));
            assertEquals(LivePlayer.State.STOPPED,activity.live.state());assertNull(decoder(activity));assertNull(field(activity.live,"session",LivePlayer.class));
            assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());assertEquals(0,activity.routeIndex);assertEquals("cctv1.cn",activity.current.id);
            View root=field(activity,"root",MainActivity.class);assertFalse(root.getKeepScreenOn());
        }
    }

    @Test public void rendersChineseIdlePage()throws Exception{capture(1920,1080,"cctv-live.png");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void rendersEnglishIdlePage()throws Exception{capture(1920,1080,"cctv-live.en.png");}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void compactEnglishPageKeepsControlsInsideScreen()throws Exception{capture(640,360,"cctv-live-compact.en.png");}

    private void assertEnglish(View view){
        if(view instanceof TextView)assertFalse(((TextView)view).getText().toString(),Pattern.compile("\\p{IsHan}").matcher(((TextView)view).getText()).find());
        if(view.getContentDescription()!=null)assertFalse(view.getContentDescription().toString(),Pattern.compile("\\p{IsHan}").matcher(view.getContentDescription()).find());
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)assertEnglish(((ViewGroup)view).getChildAt(i));
    }
    private void capture(int width,int height,String name)throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity activity=controller.get();layout(activity,width,height);View root=activity.getWindow().getDecorView();
            assertEquals(21,activity.channelList.getCount());assertNull(decoder(activity));assertEquals(LivePlayer.State.STOPPED,activity.live.state());
            for(String tag:new String[]{"tab-all","tab-favourites","play","routes","favourite","fullscreen"}){
                Button control=button(activity,tag);int[] xy=new int[2];control.getLocationOnScreen(xy);
                assertTrue(tag,control.getWidth()>0&&control.getHeight()>0);assertTrue(tag,xy[0]>=0&&xy[1]>=0);
                assertTrue(tag,xy[0]+control.getWidth()<=width&&xy[1]+control.getHeight()<=height);
                View parent=(View)control.getParent();
                assertTrue(tag+" extends left of its parent",control.getLeft()>=parent.getScrollX());
                assertTrue(tag+" extends above its parent",control.getTop()>=parent.getScrollY());
                assertTrue(tag+" extends right of its parent",control.getRight()<=parent.getScrollX()+parent.getWidth());
                assertTrue(tag+" extends below its parent",control.getBottom()<=parent.getScrollY()+parent.getHeight());
            }
            assertTrue(activity.channelList.getWidth()>0&&activity.channelList.getHeight()>0);
            View screen=root.findViewWithTag("screen");assertTrue(screen.getWidth()>0&&screen.getHeight()>0);
            if("en".equals(activity.getResources().getConfiguration().getLocales().get(0).getLanguage()))assertEnglish(root);
            String folder=System.getenv("CCTV_UI_CAPTURE_DIR");
            if(folder!=null){
                assertTrue(new File(folder).isDirectory()||new File(folder).mkdirs());
                Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));
                try(FileOutputStream output=new FileOutputStream(new File(folder,name))){assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG,100,output));}
                bitmap.recycle();
            }
        }
    }
}
