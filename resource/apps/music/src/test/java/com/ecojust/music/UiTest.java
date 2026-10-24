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
        try (ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            MainActivity a=c.get(); java.lang.reflect.Field field=MainActivity.class.getDeclaredField("tracks"); field.setAccessible(true);
            @SuppressWarnings("unchecked") List<Track> tracks=(List<Track>)field.get(a);
            tracks.add(new Track("BV1234567890","钢琴与晚风 · 示例曲目","示例作者","","",222));
            tracks.add(new Track("BV1234567891","深夜 Lo-fi · 示例曲目","示例作者","","",180));
            java.lang.reflect.Field listField=MainActivity.class.getDeclaredField("list"); listField.setAccessible(true);
            ListView list=(ListView)listField.get(a); ((BaseAdapter)list.getAdapter()).notifyDataSetChanged();
            View root=a.getWindow().getDecorView(); root.measure(View.MeasureSpec.makeMeasureSpec(1920,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(1080,View.MeasureSpec.EXACTLY)); root.layout(0,0,1920,1080);
            assertEquals(2,list.getAdapter().getCount()); assertTrue(list.getHeight()>0); assertNotNull(find(root,"队列")); assertNotNull(find(root,"播放全部")); assertNotNull(find(root,"随机播放"));
            find(root,"顺序播放").performClick(); assertTrue(service.get().shuffled());
            String capture=System.getenv("MUSIC_UI_CAPTURE_DIR");
            if (capture!=null) { new File(capture).mkdirs(); Bitmap bitmap=Bitmap.createBitmap(1920,1080,Bitmap.Config.ARGB_8888); root.draw(new Canvas(bitmap)); try(FileOutputStream out=new FileOutputStream(new File(capture,"music-tv.png"))) { bitmap.compress(Bitmap.CompressFormat.PNG,100,out); } bitmap.recycle(); }
        }
    }
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi") public void compactTvKeepsControlsVisible() {
        try(ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).setup().visible()) {
            View root=c.get().getWindow().getDecorView(); root.measure(View.MeasureSpec.makeMeasureSpec(640,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(360,View.MeasureSpec.EXACTLY)); root.layout(0,0,640,360);
            Button queue=find(root,"队列"); int[] location=new int[2]; queue.getLocationOnScreen(location); assertTrue(location[0]+queue.getWidth()<=640); assertTrue(location[1]+queue.getHeight()<=360);
        }
    }
}
