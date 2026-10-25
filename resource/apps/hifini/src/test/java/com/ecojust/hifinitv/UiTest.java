package com.ecojust.hifinitv;

import android.content.*;
import android.app.AlertDialog;
import android.graphics.*;
import android.graphics.drawable.BitmapDrawable;
import android.os.Looper;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.*;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowChoreographer;
import java.io.*;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.*;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class UiTest {
    private ServiceController<PreviewPlayer> service;
    public static class PreviewPlayer extends PlaybackService {
        Track track; List<Track> selected=new ArrayList<>(); boolean active,random;int selectedIndex=-1,plays;String attemptedUrl="",failure="";
        Runnable callback;
        @Override void listen(Runnable value){callback=value;}
        void update(){if(callback!=null)callback.run();}
        @Override Track current(){return track;}
        @Override boolean loading(){return false;}
        @Override boolean playing(){return active;}
        @Override String stage(){return "";}
        @Override String error(){return failure;}
        @Override String audioUrl(){return attemptedUrl;}
        @Override boolean shuffled(){return random;}
        @Override long position(){return track==null?0:88000;}
        @Override long duration(){return track==null?0:226000;}
        @Override void playList(List<Track> tracks,boolean shuffled){selected=new ArrayList<>(tracks);random=shuffled;selectedIndex=0;track=tracks.get(0);active=true;plays++;update();}
        @Override void playListAt(List<Track> tracks,int index){selected=new ArrayList<>(tracks);random=false;selectedIndex=index;track=tracks.get(index);active=true;plays++;update();}
        @Override void toggle(){active=!active;update();}
        @Override void previous(){selectedIndex--;}
        @Override void next(){selectedIndex++;}
        @Override void seek(long value){}
    }
    public static class SourceActivity extends MainActivity {
        volatile int searches;volatile String keyword="";
        @Override List<Track> searchTracks(String value){searches++;keyword=value;return samples(false);}
    }
    public static class LoginRequiredActivity extends MainActivity {
        @Override List<Track> searchTracks(String value)throws IOException{throw new MusicError(R.string.source_login_required);}
    }
    public static class SlowSourceActivity extends MainActivity {
        volatile boolean entered;
        @Override List<Track> searchTracks(String value)throws IOException{
            entered=true;
            try{new java.util.concurrent.CountDownLatch(1).await();return Collections.emptyList();}
            catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException("cancelled");}
        }
    }
    @Before public void bindPreviewPlayer(){
        // Drive virtual vsync explicitly; its default auto-advance never idles a repeating animation.
        ShadowChoreographer.setPaused(true);
        ShadowChoreographer.setFrameDelay(Duration.ofMillis(16));
        Settings.Global.putFloat(RuntimeEnvironment.getApplication().getContentResolver(),Settings.Global.ANIMATOR_DURATION_SCALE,1f);
        service=Robolectric.buildService(PreviewPlayer.class).create();
        shadowOf(RuntimeEnvironment.getApplication()).setComponentNameAndServiceForBindService(new ComponentName(RuntimeEnvironment.getApplication(),PlaybackService.class),service.get().onBind(new Intent()));
    }
    @After public void release(){service.destroy();}
    private static List<Track> samples(boolean english){
        String[] titles=english?new String[]{"Night Star","Night Voyage","After Midnight","Coastal Night","When Night Falls","Waiting for Night"}:new String[]{"夜行星","夜航","夜色未央","沿海的夜","入夜以后","等夜归来"};
        String[] artists=english?new String[]{"Forest Guest","Slow Island","North Shore","Wood and Blue","Daylight","Mountains and Sea"}:new String[]{"林间来客","慢岛乐队","北岸","木与蓝","拾光","山海计划"};
        List<Track> result=new ArrayList<>();for(int i=0;i<titles.length;i++)result.add(new Track(String.valueOf(100+i),titles[i],artists[i],"",226+i*6));return result;
    }
    private static View findDescription(View root,String description){if(description.contentEquals(root.getContentDescription()==null?"":root.getContentDescription()))return root;if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View found=findDescription(((ViewGroup)root).getChildAt(i),description);if(found!=null)return found;}return null;}
    private static TextView findText(View root,String text){if(root instanceof TextView&&text.contentEquals(((TextView)root).getText()))return (TextView)root;if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){TextView found=findText(((ViewGroup)root).getChildAt(i),text);if(found!=null)return found;}return null;}
    @SuppressWarnings("unchecked") private static <T>T field(Object target,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return (T)f.get(target);}
    private static void layout(View root,int width,int height){root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(80));root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);}
    private static void await(java.util.function.BooleanSupplier condition)throws Exception{for(int i=0;i<300;i++){shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(16));if(condition.getAsBoolean())return;Thread.sleep(10);}fail("Asynchronous UI state was not rendered");}
    @Test public void shuffleUsesCurrentSearchResultsWithoutAnotherSourceRequest()throws Exception{
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");ListView list=field(a,"list");
            assertNull(findText(root,"收藏"));assertNull(findText(root,"最近播放"));assertNull(findText(root,"本地音频"));assertNotNull(findText(root,"随机播放"));
            findText(root,a.getString(R.string.shuffle)).performClick();assertNotNull(findText(root,a.getString(R.string.shuffle_needs_search)));assertTrue(query.isFocused());assertEquals(0,a.searches);assertEquals(0,service.get().plays);
            query.setText("夜");findDescription(root,a.getString(R.string.search)).performClick();await(()->list.getCount()==6);assertEquals("夜",a.keyword);assertEquals(0,service.get().plays);
            list.performItemClick(list.getChildAt(3),3,3);assertEquals(3,service.get().selectedIndex);assertEquals("103",service.get().track.id);assertFalse(service.get().random);
            findText(root,a.getString(R.string.shuffle)).performClick();assertEquals(2,service.get().plays);assertTrue(service.get().random);assertEquals(6,service.get().selected.size());assertEquals(1,a.searches);
            assertNotNull(findText(root,a.getString(R.string.shuffle_selection)));assertNotNull(findText(root,a.getString(R.string.shuffle_count,6)));
            findText(root,a.getString(R.string.shuffle)).performClick();assertEquals(3,service.get().plays);assertEquals(1,a.searches);
            assertTrue(findDescription(root,a.getString(R.string.previous)).isFocusable());assertTrue(findDescription(root,a.getString(R.string.next)).isFocusable());
        }
    }
    @Test public void shuffleSearchesAnEnteredKeywordWhenThereAreNoCurrentResults()throws Exception{
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");ListView list=field(a,"list");query.setText("  夜  ");
            findText(root,a.getString(R.string.shuffle)).performClick();await(()->list.getCount()==6&&service.get().plays==1);
            assertEquals(1,a.searches);assertEquals("夜",a.keyword);assertTrue(service.get().random);assertEquals(6,service.get().selected.size());assertNotNull(findText(root,a.getString(R.string.shuffle_count,6)));
        }
    }
    @Test public void loginRequiredSearchHighlightsOfficialSignInWithoutPretendingAuthentication()throws Exception{
        try(ActivityController<LoginRequiredActivity> controller=Robolectric.buildActivity(LoginRequiredActivity.class).setup().visible()){
            LoginRequiredActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");query.setText("勇气");
            View login=findDescription(root,a.getString(R.string.hifini_login));assertNotNull(login);assertTrue(login.isFocusable());findDescription(root,a.getString(R.string.search)).performClick();
            String error=a.getString(R.string.search_failed,a.getString(R.string.source_login_required));await(()->findText(root,error)!=null);assertTrue(login.isFocused());
            login.performClick();Intent intent=shadowOf(a).getNextStartedActivity();assertNotNull(intent);assertEquals(LoginActivity.class.getName(),intent.getComponent().getClassName());
            assertNotNull(findText(root,a.getString(R.string.login_return_hint)));assertEquals(0,service.get().plays);
        }
    }
    @Test public void searchDeadlineAndLeavingScreenRestoreUsableControls()throws Exception{
        try(ActivityController<SlowSourceActivity> controller=Robolectric.buildActivity(SlowSourceActivity.class).setup().visible()){
            SlowSourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);
            EditText query=field(a,"query");query.setText("night");View search=findDescription(root,a.getString(R.string.search));TextView shuffle=findText(root,a.getString(R.string.shuffle));
            search.performClick();await(()->a.entered);assertFalse(search.isEnabled());assertFalse(shuffle.isEnabled());
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(21));assertNotNull(findText(root,a.getString(R.string.search_timeout)));assertTrue(search.isEnabled());assertTrue(shuffle.isEnabled());
            a.entered=false;search.performClick();await(()->a.entered);controller.pause().stop();assertTrue(search.isEnabled());assertTrue(shuffle.isEnabled());
            controller.start().resume().visible();assertTrue(search.isEnabled());assertTrue(shuffle.isEnabled());assertNotNull(findText(root,a.getString(R.string.request_cancelled)));
        }
    }
    @Test public void rendersRecycledRowsAndPlayerWithoutBundledArtwork()throws Exception{renderPreview(false,"hifini-tv.png");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void englishResourcesRenderAndNavigateWithoutReplacingUiText()throws Exception{renderPreview(true,"hifini-tv.en.png");}
    private void renderPreview(boolean english,String filename)throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();List<Track> data=samples(english);List<Track> tracks=field(a,"tracks");tracks.addAll(data);ListView list=field(a,"list");((BaseAdapter)list.getAdapter()).notifyDataSetChanged();
            ((EditText)field(a,"query")).setText(english?"Night":"夜");((TextView)field(a,"status")).setText(a.getString(R.string.results_count,data.size()));
            PreviewPlayer p=service.get();p.track=data.get(0);p.active=true;p.attemptedUrl="https://audio.example.org/music/night-star.mp3?demo=1";p.update();layout(root,1920,1080);
            assertEquals(6,list.getCount());assertNotNull(findText(root,data.get(0).title));assertNotNull(findText(root,data.get(0).artist));assertNotNull(((ImageView)field(a,"hero")).getDrawable());
            RhythmView rhythm=field(a,"rhythm");assertNotNull(findText(root,a.getString(R.string.rhythm)));assertTrue(rhythm.isAnimating());assertFalse(rhythm.isFocusable());
            ImageButton audioQr=field(a,"audioQr");assertEquals(p.attemptedUrl,decodeQr(audioQr));assertAudioQrBounds(a,1920,1080);
            assertTrue(findText(root,a.getString(R.string.shuffle)).isFocused());if(english)assertEnglish(root);
            String capture=System.getenv("HIFINI_UI_CAPTURE_DIR");if(capture!=null){new File(capture).mkdirs();Bitmap bitmap=Bitmap.createBitmap(1920,1080,Bitmap.Config.ARGB_8888);root.draw(new Canvas(bitmap));try(FileOutputStream output=new FileOutputStream(new File(capture,filename))){bitmap.compress(Bitmap.CompressFormat.PNG,100,output);}bitmap.recycle();}
        }
    }
    @Test public void attemptedAudioQrSurvivesFailureAndChangesWithTheCurrentSong()throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ImageButton qr=field(a,"audioQr");assertEquals(View.GONE,qr.getVisibility());
            PreviewPlayer p=service.get();p.track=Track.catalog("netease","114713","0","Night Star","Forest Guest","",226);p.attemptedUrl="https://audio.example.org/music/first.mp3?token=demo%2F1&source=netease";p.active=true;p.update();layout(root,1920,1080);
            assertEquals(View.VISIBLE,qr.getVisibility());assertEquals(p.attemptedUrl,decodeQr(qr));assertAudioQrBounds(a,1920,1080);
            p.active=false;p.failure=a.getString(R.string.decoder_error,1,-2147483648);p.update();assertEquals(View.VISIBLE,qr.getVisibility());assertEquals(p.attemptedUrl,decodeQr(qr));assertTrue(qr.isFocusable());
            qr.performClick();AlertDialog dialog=field(a,"audioLinkDialog");assertNotNull(dialog);assertTrue(dialog.isShowing());View dialogRoot=dialog.getWindow().getDecorView();
            assertNotNull(findText(dialogRoot,p.attemptedUrl));assertNotNull(findText(dialogRoot,a.getString(R.string.audio_link_identity,p.track.id)));assertNotNull(findText(dialogRoot,a.getString(R.string.playback_error_detail,p.failure)));
            assertEquals(p.attemptedUrl,decodeQr((ImageView)findDescription(dialogRoot,a.getString(R.string.audio_link_qr))));
            p.track=Track.catalog("kuwo","289192","0","Night Voyage","Slow Island","",230);p.attemptedUrl="";p.failure="";p.update();assertEquals(View.GONE,qr.getVisibility());assertFalse(dialog.isShowing());
            p.attemptedUrl="https://audio.example.org/music/second.mp3?source=kuwo";p.update();layout(root,1920,1080);assertEquals(p.attemptedUrl,decodeQr(qr));
            p.attemptedUrl="https://audio.example.org/music/second.mp3?token="+"a".repeat(2500);p.update();assertEquals(View.VISIBLE,qr.getVisibility());assertFalse(qr.getDrawable() instanceof BitmapDrawable);qr.performClick();
            AlertDialog fullTextDialog=field(a,"audioLinkDialog");View fullTextRoot=fullTextDialog.getWindow().getDecorView();assertNotNull(findText(fullTextRoot,p.attemptedUrl));assertNotNull(findText(fullTextRoot,a.getString(R.string.audio_link_too_long)));assertNull(findDescription(fullTextRoot,a.getString(R.string.audio_link_qr)));
            p.attemptedUrl="https://name:password@audio.example.org/private.mp3";p.update();assertEquals(View.GONE,qr.getVisibility());
        }
    }
    private static String decodeQr(ImageView image)throws Exception{assertNotNull(image);assertTrue(image.getDrawable() instanceof BitmapDrawable);Bitmap bitmap=((BitmapDrawable)image.getDrawable()).getBitmap();int[] pixels=new int[bitmap.getWidth()*bitmap.getHeight()];bitmap.getPixels(pixels,0,bitmap.getWidth(),0,0,bitmap.getWidth(),bitmap.getHeight());return new com.google.zxing.qrcode.QRCodeReader().decode(new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(new com.google.zxing.RGBLuminanceSource(bitmap.getWidth(),bitmap.getHeight(),pixels)))).getText();}
    private static void assertAudioQrBounds(MainActivity a,int width,int height)throws Exception{ImageButton qr=field(a,"audioQr");TextView title=field(a,"title"),artist=field(a,"artist");SeekBar seek=field(a,"seek");assertInside(qr,width,height);assertTrue("QR stays beside the title",title.getRight()<=qr.getLeft());assertTrue("QR stays beside the artist",artist.getRight()<=qr.getLeft());assertTrue("QR stays above the seek bar",qr.getBottom()<=seek.getTop());}
    @Test public void rhythmMovesOnlyDuringPlaybackAndStopsWithThePage()throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);RhythmView rhythm=field(a,"rhythm");assertFalse(rhythm.isAnimating());
            PreviewPlayer p=service.get();p.track=samples(false).get(0);p.active=true;p.update();assertTrue(rhythm.isAnimating());assertRhythmFrames(rhythm,true);
            SeekBar seek=field(a,"seek");Button shuffle=field(a,"shuffle");assertEquals(seek.getId(),shuffle.getNextFocusDownId());assertFalse(rhythm.isFocusable());
            p.active=false;p.update();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            p.active=true;p.update();assertTrue(rhythm.isAnimating());controller.pause().stop();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            controller.start().resume().visible();await(rhythm::isAnimating);assertTrue(rhythm.isAnimating());
            p.track=null;p.active=false;p.update();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
        }
    }
    @Test public void systemAnimationSettingKeepsTheRhythmStaticWithoutDisablingPlayback()throws Exception{
        ContentResolver resolver=RuntimeEnvironment.getApplication().getContentResolver();Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,0f);
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();PreviewPlayer p=service.get();p.track=samples(false).get(0);p.active=true;p.update();layout(root,1920,1080);
            RhythmView rhythm=field(a,"rhythm");assertTrue(p.playing());assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f);shadowOf(Looper.getMainLooper()).idle();assertTrue(rhythm.isAnimating());
            Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,0f);shadowOf(Looper.getMainLooper()).idle();assertFalse(rhythm.isAnimating());assertTrue(p.playing());assertRhythmFrames(rhythm,false);
        }finally{Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f);}
    }
    private static void assertRhythmFrames(RhythmView rhythm,boolean changes){Bitmap before=Bitmap.createBitmap(rhythm.getWidth(),rhythm.getHeight(),Bitmap.Config.ARGB_8888),after=Bitmap.createBitmap(rhythm.getWidth(),rhythm.getHeight(),Bitmap.Config.ARGB_8888);try{rhythm.draw(new Canvas(before));for(int elapsed=0;elapsed<350;elapsed+=16)shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(Math.min(16,350-elapsed)));rhythm.draw(new Canvas(after));assertEquals("Rhythm pixels should move only while animation is enabled",changes,!before.sameAs(after));}finally{before.recycle();after.recycle();}}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void englishCompactPlayerKeepsControlsInsideScreen()throws Exception{compactBounds(true);}
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi") public void compactTvKeepsControlsVisible()throws Exception{compactBounds(false);}
    private void compactBounds(boolean english)throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,640,360);
            for(int id:new int[]{R.string.search,R.string.previous,R.string.next,R.string.play})assertInside(findDescription(root,a.getString(id)),640,360);
            assertInside(findText(root,a.getString(R.string.shuffle)),640,360);assertInside(field(a,"hero"),640,360);assertInside(field(a,"rhythm"),640,360);
            PreviewPlayer p=service.get();p.track=samples(english).get(0);p.attemptedUrl="https://audio.example.org/music/night-star.mp3?demo=1";p.update();layout(root,640,360);assertAudioQrBounds(a,640,360);if(english)assertEnglish(root);
        }
    }
    private static void assertInside(View view,int width,int height){assertNotNull(view);int[] point=new int[2];view.getLocationOnScreen(point);assertTrue("horizontal bounds",point[0]>=0&&point[0]+view.getWidth()<=width);assertTrue("vertical bounds",point[1]>=0&&point[1]+view.getHeight()<=height);assertTrue(view.getWidth()>0&&view.getHeight()>0);}
    private static void assertEnglish(View root){if(root instanceof TextView){TextView text=(TextView)root;assertFalse(text.getText().toString(),text.getText().toString().matches("(?s).*[\\p{IsHan}].*"));if(text.getHint()!=null)assertFalse(text.getHint().toString().matches("(?s).*[\\p{IsHan}].*"));}if(root.getContentDescription()!=null)assertFalse(root.getContentDescription().toString().matches("(?s).*[\\p{IsHan}].*"));if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++)assertEnglish(((ViewGroup)root).getChildAt(i));}
}
