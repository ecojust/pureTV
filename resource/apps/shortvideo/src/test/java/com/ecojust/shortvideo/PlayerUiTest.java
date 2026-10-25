package com.ecojust.shortvideo;

import android.app.AlertDialog;
import android.graphics.*;
import android.media.MediaPlayer;
import android.os.Looper;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowMediaPlayer;
import org.robolectric.shadows.ShadowAlertDialog;
import java.io.*;
import java.time.Duration;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class PlayerUiTest {
    private static final AtomicInteger calls=new AtomicInteger();
    private static boolean offline;
    public static class TestActivity extends MainActivity {
        @Override protected FeedController.Loader createLoader() { return new FeedController.Loader() {
            public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException {
                int number=calls.incrementAndGet();if(offline)throw new IOException("Test network unavailable");
                return new VideoFeed.Clip("https://example.com/video/"+number+".mp4",source);
            }
            public void cancel() { }
        }; }
    }
    @Before public void setup() {
        calls.set(0);offline=false;RuntimeEnvironment.getApplication().getSharedPreferences("shortvideo",0).edit().clear().commit();
        ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,1));
    }
    private <T> T field(Object owner,String name,Class<?> type) throws Exception {
        java.lang.reflect.Field f=type.getDeclaredField(name);f.setAccessible(true);return (T)f.get(owner);
    }
    private void flush(MainActivity activity) throws Exception {
        shadowOf(Looper.getMainLooper()).idle(); FeedController feed=field(activity,"feed",MainActivity.class);
        Future<?> pending=field(feed,"pending",FeedController.class);if(pending!=null&&!pending.isCancelled())pending.get(2,TimeUnit.SECONDS);
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(30));
    }
    private void start(MainActivity activity) throws Exception {
        SurfaceView surface=field(activity,"surface",MainActivity.class);activity.surfaceCreated(surface.getHolder());flush(activity);
    }
    private Button button(View view,String label) {
        if(view instanceof Button&&label.contentEquals(((Button)view).getText()))return (Button)view;
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){Button b=button(((ViewGroup)view).getChildAt(i),label);if(b!=null)return b;}
        return null;
    }
    private void key(MainActivity activity,int code) { activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,code));activity.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,code)); }
    @Test public void pauseHiddenControlsResumeAndMediaKeys() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);MediaPlayer player=field(activity,"player",MainActivity.class);assertNotNull(player);assertTrue(player.isPlaying());
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(4600));LinearLayout footer=field(activity,"footer",MainActivity.class);assertEquals(View.GONE,footer.getVisibility());
            key(activity,KeyEvent.KEYCODE_DPAD_CENTER);assertFalse(player.isPlaying());assertEquals(View.VISIBLE,footer.getVisibility());
            key(activity,KeyEvent.KEYCODE_DPAD_CENTER);assertTrue(player.isPlaying());
            key(activity,KeyEvent.KEYCODE_MEDIA_PAUSE);assertFalse(player.isPlaying());key(activity,KeyEvent.KEYCODE_MEDIA_PLAY);assertTrue(player.isPlaying());
        }
    }
    @Test public void nextReleasesOldDecoderAndPreviousReusesAddress() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);MediaPlayer old=field(activity,"player",MainActivity.class);
            key(activity,KeyEvent.KEYCODE_DPAD_DOWN);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1500));flush(activity);
            assertEquals(2,calls.get());assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());
            MediaPlayer current=field(activity,"player",MainActivity.class);assertNotSame(old,current);assertTrue(current.isPlaying());
            key(activity,KeyEvent.KEYCODE_DPAD_UP);flush(activity);assertEquals(2,calls.get());FeedController feed=field(activity,"feed",MainActivity.class);assertEquals(0,feed.index());
        }
    }
    @Test public void leavingReleasesDecoderAndReturnRestoresPosition() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);MediaPlayer old=field(activity,"player",MainActivity.class);shadowOf(old).setCurrentPosition(12000);
            c.pause().stop();assertNull(field(activity,"player",MainActivity.class));assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());assertFalse(activity.getWindow().getDecorView().getKeepScreenOn());
            c.start().resume();flush(activity);MediaPlayer restored=field(activity,"player",MainActivity.class);assertNotSame(old,restored);assertTrue("restored position="+restored.getCurrentPosition(),restored.getCurrentPosition()>=12000);assertEquals(1,calls.get());
        }
    }
    @Test public void networkFailureShowsRetryAndSourceSwitchPersists() throws Exception {
        offline=true;
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);View root=activity.getWindow().getDecorView();Button retry=button(root,"重试获取");assertEquals(View.VISIBLE,retry.getVisibility());assertTrue(retry.hasFocus());
            assertNull(field(activity,"player",MainActivity.class));shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMinutes(2));assertEquals(1,calls.get());
            key(activity,KeyEvent.KEYCODE_MENU);AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertTrue(dialog.isShowing());
            offline=false;dialog.getListView().performItemClick(dialog.getListView().getChildAt(1),1,1);flush(activity);
            assertEquals("DWO",activity.getSharedPreferences("shortvideo",0).getString("source",""));assertTrue(((MediaPlayer)field(activity,"player",MainActivity.class)).isPlaying());
        }
    }
    @Test public void decoderTimeoutStopsAndDoesNotLoop() throws Exception {
        ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,30000));
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(26));assertNull(field(activity,"player",MainActivity.class));
            assertEquals(View.VISIBLE,button(activity.getWindow().getDecorView(),"重试获取").getVisibility());assertEquals(1,calls.get());
        }
    }
    @Test public void stalledBufferingReleasesDecoderAndOffersRetry() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);MediaPlayer player=field(activity,"player",MainActivity.class);
            shadowOf(player).invokeInfoListener(MediaPlayer.MEDIA_INFO_BUFFERING_START,0);
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(26));
            assertNull(field(activity,"player",MainActivity.class));assertEquals(ShadowMediaPlayer.State.END,shadowOf(player).getState());
            assertEquals(View.VISIBLE,button(activity.getWindow().getDecorView(),"重试获取").getVisibility());assertEquals(1,calls.get());
        }
    }
    @Test public void completionFetchesNextWithoutLoopingTheCurrentClip() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(60));flush(activity);
            assertEquals(2,calls.get());assertEquals(1,((FeedController)field(activity,"feed",MainActivity.class)).index());
        }
    }
    @Test public void registeredMediaCallbacksOperatePlayerAndSessionIsReleasedOnExit() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);
            android.media.session.MediaSession session=field(activity,"mediaSession",MainActivity.class);
            assertTrue(session.isActive());
            // Robolectric does not route transport Binder calls back to the session.
            Object handler=org.robolectric.util.ReflectionHelpers.getField(session,"mCallback");
            android.media.session.MediaSession.Callback callback=org.robolectric.util.ReflectionHelpers.getField(handler,"mCallback");
            callback.onPause();shadowOf(Looper.getMainLooper()).idle();
            assertFalse(((MediaPlayer)field(activity,"player",MainActivity.class)).isPlaying());
            callback.onPlay();shadowOf(Looper.getMainLooper()).idle();
            assertTrue(((MediaPlayer)field(activity,"player",MainActivity.class)).isPlaying());
            c.pause().stop();assertNull(field(activity,"mediaSession",MainActivity.class));
        }
    }
    @Test public void aspectFitPreservesPortraitLandscapeAndWideRatios() {
        assertArrayEquals(new int[]{608,1080},MainActivity.fit(1920,1080,720,1280));
        assertArrayEquals(new int[]{1920,1080},MainActivity.fit(1920,1080,1920,1080));
        assertArrayEquals(new int[]{1920,800},MainActivity.fit(1920,1080,2400,1000));
        assertArrayEquals(new int[]{1,1},MainActivity.fit(0,1080,720,1280));
    }
    @Test public void rendersTvControls() throws Exception { capture(1920,1080,"shortvideo-tv.png"); }
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void rendersEnglishTvControls() throws Exception { capture(1920,1080,"shortvideo-tv.en.png"); }
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi") public void compactTvKeepsControlsInsideScreen() throws Exception { capture(640,360,"shortvideo-tv-compact.png"); }
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void compactEnglishTvKeepsControlsInsideScreen() throws Exception { capture(640,360,"shortvideo-tv-compact.en.png"); }
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void englishLocaleLocalizesSourcesPlaybackAndErrors() throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);
            TextView source=field(activity,"sourceLabel",MainActivity.class),counter=field(activity,"counter",MainActivity.class),mode=field(activity,"modeLabel",MainActivity.class);
            assertEquals("Source: Kuleu Random",source.getText().toString());assertEquals("Clip 1",counter.getText().toString());assertEquals("Autoplay",mode.getText().toString());
            key(activity,KeyEvent.KEYCODE_MEDIA_PAUSE);assertEquals("Paused",mode.getText().toString());
            assertNotNull(button(activity.getWindow().getDecorView(),"Play"));
            key(activity,KeyEvent.KEYCODE_MENU);AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();
            assertEquals("Kuleu Random",dialog.getListView().getAdapter().getItem(0));assertEquals("Dwo Random",dialog.getListView().getAdapter().getItem(1));
            assertEquals("Close",dialog.getButton(AlertDialog.BUTTON_NEGATIVE).getText().toString());assertNoChineseText(dialog.getWindow().getDecorView());dialog.dismiss();
            activity.error(R.string.feed_http_error,503);
            TextView message=field(activity,"message",MainActivity.class);assertEquals("The video source request failed (HTTP 503).",message.getText().toString());
            assertNotNull(button(activity.getWindow().getDecorView(),"Try again"));assertNoChineseText(activity.getWindow().getDecorView());
        }
    }
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void englishNetworkFailureUsesLocalizedMessageInsteadOfExceptionText() throws Exception {
        offline=true;
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);TextView message=field(activity,"message",MainActivity.class);
            assertEquals("This video source is unavailable. Try again or choose another source.",message.getText().toString());
            assertNoChineseText(activity.getWindow().getDecorView());
        }
    }
    private void assertNoChineseText(View view) {
        if(view instanceof TextView)assertFalse(((TextView)view).getText().toString(),((TextView)view).getText().toString().matches("(?s).*[\\p{IsHan}].*"));
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)assertNoChineseText(((ViewGroup)view).getChildAt(i));
    }
    private void capture(int width,int height,String file) throws Exception {
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()) {
            TestActivity activity=c.get();start(activity);View root=activity.getWindow().getDecorView();root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);
            for(int label:new int[]{R.string.previous,R.string.pause,R.string.next,R.string.sources}) {
                Button control=button(root,activity.getString(label));assertNotNull(control);int[] location=new int[2];control.getLocationOnScreen(location);
                assertTrue(location[0]>=0);assertTrue(location[0]+control.getWidth()<=width);assertTrue(location[1]+control.getHeight()<=height);
                assertEquals(1,control.getLineCount());
            }
            assertTrue(button(root,activity.getString(R.string.sources)).isFocusable());
            if(file.contains(".en."))assertNoChineseText(root);
            String folder=System.getenv("SHORTVIDEO_UI_CAPTURE_DIR");
            if(folder!=null){new File(folder).mkdirs();Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));try(FileOutputStream out=new FileOutputStream(new File(folder,file))){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
        }
    }
}
