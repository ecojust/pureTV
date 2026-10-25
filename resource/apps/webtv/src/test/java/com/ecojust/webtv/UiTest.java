package com.ecojust.webtv;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Looper;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.*;
import java.io.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi") @GraphicsMode(GraphicsMode.Mode.NATIVE)
public class UiTest {
    private static boolean failRefresh;private static Uri imported;
    private static ChannelRepository.Catalogue catalogue(ChannelRepository.Source source){
        List<Playlist.Channel> channels=new ArrayList<>();channels.add(new Playlist.Channel("gd",RuntimeEnvironment.getApplication().getString(R.string.channel_guangdong),Playlist.SATELLITE,Arrays.asList("https://example.com/gd.m3u8","https://backup.example.com/gd.m3u8")));
        channels.add(new Playlist.Channel("hn",RuntimeEnvironment.getApplication().getString(R.string.channel_hunan),Playlist.SATELLITE,Collections.singletonList("https://example.com/hn.m3u8")));
        channels.add(new Playlist.Channel("cctv13","CCTV-13",Playlist.CCTV,Collections.singletonList("https://example.com/news.m3u8")));
        return new ChannelRepository.Catalogue(source,channels);
    }
    public static class TestActivity extends MainActivity {
        @Override protected ChannelRepository createRepository(){return new ChannelRepository(this){
            @Override Catalogue initial(Request request){return catalogue(new Source("default",""));}
            @Override Catalogue refresh(Source source,Request request)throws IOException{if(failRefresh)throw new UiError(R.string.list_unreadable);return catalogue(source);}
            @Override Catalogue importFile(Uri uri,Request request){imported=uri;return catalogue(new Source("file",""));}
        };}
    }
    @Before public void setup(){failRefresh=false;imported=null;RuntimeEnvironment.getApplication().getSharedPreferences("webtv",0).edit().clear().commit();ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,1));}
    private <T>T field(Object object,String name,Class<?> owner)throws Exception{java.lang.reflect.Field f=owner.getDeclaredField(name);f.setAccessible(true);return (T)f.get(object);}
    private void flush(MainActivity activity)throws Exception{
        shadowOf(Looper.getMainLooper()).idle();Future<?> pending=field(activity,"pending",MainActivity.class);if(pending!=null&&!pending.isCancelled())pending.get(2,TimeUnit.SECONDS);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));
    }
    private void start(MainActivity activity)throws Exception{SurfaceView surface=field(activity,"surface",MainActivity.class);activity.surfaceCreated(surface.getHolder());flush(activity);}
    private Button button(View view,String label){if(view instanceof Button&&label.contentEquals(((Button)view).getText()))return (Button)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){Button result=button(((ViewGroup)view).getChildAt(i),label);if(result!=null)return result;}return null;}
    private void key(MainActivity activity,int code){activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,code));activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,code));}
    @Test public void categoryFavouriteAndRemoteFullscreenSwitchesChannels()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);LivePlayer live=field(a,"live",MainActivity.class);assertEquals(LivePlayer.State.PLAYING,live.state());ListView list=field(a,"list",MainActivity.class);assertEquals(2,list.getCount());
            View root=a.getWindow().getDecorView();button(root,"收藏").performClick(); // category tab, initially empty
            assertEquals(0,list.getCount());button(root,"卫视").performClick();assertEquals(2,list.getCount());
            Button favourite=field(a,"favourite",MainActivity.class);favourite.performClick();assertTrue(a.getSharedPreferences("webtv",0).getStringSet("favourites",Collections.emptySet()).contains("gd"));
            list.performItemClick(list.getChildAt(0),0,0);assertTrue((Boolean)field(a,"fullscreen",MainActivity.class));
            MediaPlayer old=field(live,"player",LivePlayer.class);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(4600));assertEquals(View.GONE,((View)field(a,"footer",MainActivity.class)).getVisibility());
            key(a,KeyEvent.KEYCODE_DPAD_DOWN);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));assertEquals("https://example.com/hn.m3u8",live.url());assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());
            a.onBackPressed();assertFalse((Boolean)field(a,"fullscreen",MainActivity.class));assertTrue(list.hasFocus());
            button(root,"央视").performClick();assertEquals(1,list.getCount());list.performItemClick(list.getChildAt(0),0,0);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));assertTrue(live.url().contains("news"));
        }
    }
    @Test public void fullscreenDoesNotCreateAnAdditionalDecoderAndStopReleasesIt()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);LivePlayer live=field(a,"live",MainActivity.class);MediaPlayer player=field(live,"player",LivePlayer.class);View root=a.getWindow().getDecorView();button(root,"全屏").performClick();
            assertSame(player,field(live,"player",LivePlayer.class));a.onBackPressed();assertSame(player,field(live,"player",LivePlayer.class));
            c.pause().stop();assertNull(field(live,"player",LivePlayer.class));assertNull(field(live,"session",LivePlayer.class));assertEquals(ShadowMediaPlayer.State.END,shadowOf(player).getState());
        }
    }
    @Test public void routeDialogSelectsAlternativeAndFailureShowsRetry()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);View root=a.getWindow().getDecorView();button(root,"换线路").performClick();AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertEquals(2,dialog.getListView().getCount());
            dialog.getListView().performItemClick(dialog.getListView().getChildAt(1),1,1);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));LivePlayer live=field(a,"live",MainActivity.class);assertTrue(live.url().contains("backup"));
            shadowOf((MediaPlayer)field(live,"player",LivePlayer.class)).invokeErrorListener(1,-1004);assertEquals(LivePlayer.State.ERROR,live.state());Button retry=button(root,"重试播放");assertEquals(View.VISIBLE,retry.getVisibility());assertTrue(retry.hasFocus());
            retry.performClick();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));assertEquals(LivePlayer.State.PLAYING,live.state());
        }
    }
    @Test public void invalidListRefreshKeepsExistingChannelAndDecoder()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);LivePlayer live=field(a,"live",MainActivity.class);MediaPlayer old=field(live,"player",LivePlayer.class);failRefresh=true;key(a,KeyEvent.KEYCODE_MENU);
            AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();dialog.getListView().performItemClick(dialog.getListView().getChildAt(0),0,0);flush(a);
            assertSame(old,field(live,"player",LivePlayer.class));assertEquals(LivePlayer.State.PLAYING,live.state());assertTrue(ShadowToast.getTextOfLatestToast().contains(a.getString(R.string.list_unreadable)));
        }
    }
    @Test public void localPickerAndResultAfterBackgroundImportMetadata()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);key(a,KeyEvent.KEYCODE_MENU);AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();dialog.getListView().performItemClick(dialog.getListView().getChildAt(2),2,2);
            ShadowActivity.IntentForResult picker=shadowOf(a).getNextStartedActivityForResult();assertEquals(Intent.ACTION_OPEN_DOCUMENT,picker.intent.getAction());assertEquals("*/*",picker.intent.getType());
            c.pause().stop();Uri uri=Uri.parse("content://docs/list.m3u");a.onActivityResult(81,Activity.RESULT_OK,new Intent().setData(uri));c.start().resume();flush(a);assertEquals(uri,imported);
        }
    }
    @Test public void favouriteLimitAndRememberedChannelAreBounded()throws Exception{
        Set<String> ids=new HashSet<>();for(int i=0;i<50;i++)ids.add("id"+i);RuntimeEnvironment.getApplication().getSharedPreferences("webtv",0).edit().putStringSet("favourites",ids).putString("last_channel","hn").commit();
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);assertTrue(((LivePlayer)field(a,"live",MainActivity.class)).url().contains("hn"));((Button)field(a,"favourite",MainActivity.class)).performClick();assertTrue(ShadowToast.getTextOfLatestToast().contains("50"));assertEquals(50,a.getSharedPreferences("webtv",0).getStringSet("favourites",Collections.emptySet()).size());
        }
    }
    @Test public void aspectRatioFitDoesNotStretchVideo(){assertArrayEquals(new int[]{960,540},MainActivity.fit(960,540,1920,1080));assertArrayEquals(new int[]{304,540},MainActivity.fit(960,540,720,1280));assertArrayEquals(new int[]{1,1},MainActivity.fit(0,0,1920,1080));}
    @Test public void rendersTvControls()throws Exception{capture(1920,1080,"webtv-controls.png");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi")public void rendersEnglishTvControls()throws Exception{capture(1920,1080,"webtv-controls.en.png");}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi")public void compactEnglishControlsStayInsideScreen()throws Exception{capture(640,360,"webtv-compact.en.png");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi")public void englishControlsDialogsAndFailuresAreLocalized()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);View root=a.getWindow().getDecorView();
            assertEquals("Built-in channels · 3 channels",((TextView)field(a,"sourceStatus",MainActivity.class)).getText().toString());
            assertEquals("Guangdong TV · Stream 1/2",((TextView)field(a,"channelTitle",MainActivity.class)).getText().toString());
            assertEnglish(root);
            button(root,"Stream").performClick();AlertDialog routes=ShadowAlertDialog.getLatestAlertDialog();
            assertEquals("Stream 1 · example.com",routes.getListView().getAdapter().getItem(0));assertEnglish(routes.getWindow().getDecorView());routes.dismiss();
            button(root,"Sources").performClick();AlertDialog sources=ShadowAlertDialog.getLatestAlertDialog();assertEnglish(sources.getWindow().getDecorView());
            sources.getListView().performItemClick(sources.getListView().getChildAt(1),1,1);AlertDialog form=ShadowAlertDialog.getLatestAlertDialog();
            EditText input=findInput(form.getWindow().getDecorView());assertNotNull(input);input.setText("file:///tmp/channels.m3u");
            form.getButton(AlertDialog.BUTTON_POSITIVE).performClick();assertEquals("Use an HTTP(S) URL without embedded login credentials",input.getError().toString());assertEnglish(form.getWindow().getDecorView());form.dismiss();
            failRefresh=true;button(root,"Sources").performClick();sources=ShadowAlertDialog.getLatestAlertDialog();sources.getListView().performItemClick(sources.getListView().getChildAt(0),0,0);flush(a);
            assertEquals("Unable to load playlist: Unable to read the playlist",ShadowToast.getTextOfLatestToast());
            LivePlayer live=field(a,"live",MainActivity.class);shadowOf((MediaPlayer)field(live,"player",LivePlayer.class)).invokeErrorListener(1,-1004);
            assertEquals("This stream cannot be played (1 / -1004). Try another stream or update the playlist",((TextView)field(a,"message",MainActivity.class)).getText().toString());
            assertNotNull(button(root,"Retry playback"));assertEnglish(root);
        }
    }
    private EditText findInput(View view){if(view instanceof EditText)return (EditText)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){EditText found=findInput(((ViewGroup)view).getChildAt(i));if(found!=null)return found;}return null;}
    private void assertEnglish(View view){
        if(view instanceof TextView)assertFalse(((TextView)view).getText().toString(),java.util.regex.Pattern.compile("\\p{IsHan}").matcher(((TextView)view).getText()).find());
        if(view.getContentDescription()!=null)assertFalse(view.getContentDescription().toString(),java.util.regex.Pattern.compile("\\p{IsHan}").matcher(view.getContentDescription()).find());
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)assertEnglish(((ViewGroup)view).getChildAt(i));
    }
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi")public void compactControlsStayInsideScreen()throws Exception{capture(640,360,"webtv-compact.png");}
    private void capture(int width,int height,String file)throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();start(a);View root=a.getWindow().getDecorView();root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);
            for(int label:new int[]{R.string.fullscreen,R.string.sources,R.string.previous,R.string.next,R.string.route,R.string.satellite,R.string.cctv,R.string.favourites,R.string.all}){Button b=button(root,a.getString(label));assertNotNull(b);int[] xy=new int[2];b.getLocationOnScreen(xy);assertTrue(xy[0]>=0);assertTrue(xy[0]+b.getWidth()<=width);assertTrue(xy[1]+b.getHeight()<=height);}
            if(a.getResources().getConfiguration().getLocales().get(0).getLanguage().equals("en"))assertEnglish(root);
            String folder=System.getenv("WEBTV_UI_CAPTURE_DIR");if(folder!=null){new File(folder).mkdirs();Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));try(FileOutputStream out=new FileOutputStream(new File(folder,file))){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
        }
    }
}
