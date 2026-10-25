package com.ecojust.music;

import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.*;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowAlertDialog;
import java.io.*;
import java.util.List;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28, qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class UiTest {
    private org.robolectric.android.controller.ServiceController<PlaybackService> service;
    @Before public void bindRealService() {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        RuntimeEnvironment.getApplication().getSharedPreferences("music_playback",0).edit().clear().commit();
        service = Robolectric.buildService(PlaybackService.class).create();
        shadowOf(RuntimeEnvironment.getApplication()).setComponentNameAndServiceForBindService(
            new android.content.ComponentName(RuntimeEnvironment.getApplication(),PlaybackService.class), service.get().onBind(new Intent()));
    }
    @After public void releaseService() { service.destroy(); }
    private Button find(View view, String title) {
        if (view instanceof Button && ((Button)view).getText().toString().equals(title)) return (Button)view;
        if (view instanceof ViewGroup) for (int i=0;i<((ViewGroup)view).getChildCount();i++) { Button b=find(((ViewGroup)view).getChildAt(i),title); if (b!=null) return b; }
        return null;
    }
    @Test public void remoteNavigationAndLocalPicker() {
        try (ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            MainActivity a=c.get(); View root=a.getWindow().getDecorView();
            assertTrue(find(root,"收藏").isFocusable()); find(root,"收藏").performClick();
            find(root,"本地音频").performClick(); Intent picker=shadowOf(a).getNextStartedActivityForResult().intent;
            assertEquals(Intent.ACTION_OPEN_DOCUMENT,picker.getAction()); assertEquals("audio/*",picker.getType());
            find(root,"设置").performClick(); assertTrue(ShadowAlertDialog.getLatestAlertDialog().isShowing()); ShadowAlertDialog.getLatestAlertDialog().dismiss();
            find(root,"全屏").performClick(); assertNotNull(org.robolectric.shadows.ShadowDialog.getLatestDialog());
        }
    }
    @Test public void rendersRecycledRowsAndPlayerWithoutBundledArtwork() throws Exception {
        renderPreview(false,"music-tv.png");
    }
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi")
    public void englishResourcesRenderAndNavigateWithoutReplacingUiText() throws Exception {
        renderPreview(true,"music-tv.en.png");
    }
    private void renderPreview(boolean english,String filename) throws Exception {
        try (ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            MainActivity a=c.get(); java.lang.reflect.Field field=MainActivity.class.getDeclaredField("tracks"); field.setAccessible(true);
            @SuppressWarnings("unchecked") List<Track> tracks=(List<Track>)field.get(a);
            tracks.add(new Track("BV1234567890",english?"Piano at dusk · Sample track":"钢琴与晚风 · 示例曲目",english?"Sample artist":"示例作者","","",222));
            tracks.add(new Track("BV1234567891",english?"Late-night lo-fi · Sample track":"深夜 Lo-fi · 示例曲目",english?"Sample artist":"示例作者","","",180));
            java.lang.reflect.Field listField=MainActivity.class.getDeclaredField("list"); listField.setAccessible(true);
            ListView list=(ListView)listField.get(a); ((BaseAdapter)list.getAdapter()).notifyDataSetChanged();
            View root=a.getWindow().getDecorView(); root.measure(View.MeasureSpec.makeMeasureSpec(1920,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(1080,View.MeasureSpec.EXACTLY)); root.layout(0,0,1920,1080);
            assertEquals(2,list.getAdapter().getCount()); assertTrue(list.getHeight()>0);
            for(int id:new int[]{R.string.queue,R.string.play_all,R.string.shuffle})assertNotNull(find(root,a.getString(id)));
            find(root,a.getString(R.string.sequence)).performClick();assertTrue(service.get().shuffled());
            if(english){assertEquals("Search",a.getString(R.string.search));assertEnglish(root);}
            String capture=System.getenv("MUSIC_UI_CAPTURE_DIR");
            if (capture!=null) { new File(capture).mkdirs(); Bitmap bitmap=Bitmap.createBitmap(1920,1080,Bitmap.Config.ARGB_8888); root.draw(new Canvas(bitmap)); try(FileOutputStream out=new FileOutputStream(new File(capture,filename))) { bitmap.compress(Bitmap.CompressFormat.PNG,100,out); } bitmap.recycle(); }
            if(english){
                find(root,"Favorite").performClick();assertEquals(0,list.getAdapter().getCount());assertEnglish(root);
                find(root,"Settings").performClick();AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertTrue(dialog.isShowing());assertEnglish(dialog.getWindow().getDecorView());dialog.dismiss();
                find(root,"Local audio").performClick();assertEquals(Intent.ACTION_OPEN_DOCUMENT,shadowOf(a).getNextStartedActivityForResult().intent.getAction());
            }
        }
    }
    private void assertEnglish(View root) {
        if(root instanceof TextView){TextView text=(TextView)root;assertFalse(text.getText().toString(),text.getText().toString().matches("(?s).*[\\p{IsHan}].*"));if(text.getHint()!=null)assertFalse(text.getHint().toString().matches("(?s).*[\\p{IsHan}].*"));}
        if(root.getContentDescription()!=null)assertFalse(root.getContentDescription().toString().matches("(?s).*[\\p{IsHan}].*"));
        if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++)assertEnglish(((ViewGroup)root).getChildAt(i));
    }
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void englishCompactPlayerKeepsControlsInsideScreen() {
        try(ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            MainActivity a=c.get();View root=a.getWindow().getDecorView();root.measure(View.MeasureSpec.makeMeasureSpec(640,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(360,View.MeasureSpec.EXACTLY));root.layout(0,0,640,360);
            for(int id:new int[]{R.string.queue,R.string.fullscreen,R.string.sequence,R.string.play_all,R.string.previous,R.string.next,R.string.play}){Button b=find(root,a.getString(id));assertNotNull(b);int[] xy=new int[2];b.getLocationOnScreen(xy);assertTrue(a.getString(id)+" horizontal bounds",xy[0]>=0&&xy[0]+b.getWidth()<=640);assertTrue(a.getString(id)+" vertical bounds",xy[1]>=0&&xy[1]+b.getHeight()<=360);}
            assertEnglish(root);
        }
    }
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi") public void compactTvKeepsControlsVisible() {
        try(ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            View root=c.get().getWindow().getDecorView(); root.measure(View.MeasureSpec.makeMeasureSpec(640,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(360,View.MeasureSpec.EXACTLY)); root.layout(0,0,640,360);
            Button queue=find(root,"队列"); int[] location=new int[2]; queue.getLocationOnScreen(location); assertTrue(location[0]+queue.getWidth()<=640); assertTrue(location[1]+queue.getHeight()<=360);
        }
    }
}
