package com.ecojust.operatv;

import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** These are native Android View fixtures, not public-service or TV-device playback evidence. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class MainActivityTest {
    static boolean fail,block;
    static int calls,requestedPage;
    static CountDownLatch entered,release,returned;
    static boolean english(){return "en".equals(RuntimeEnvironment.getApplication().getResources().getConfiguration().locale.getLanguage());}
    static List<OperaItem> fixture(){
        String[] zh={"黄梅戏《女驸马》经典唱段","京剧《锁麟囊》选段欣赏","越剧《梁山伯与祝英台》","豫剧《花木兰》选段","跟我学 · 戏曲身段入门","名家书场 · 一段好故事"};
        String[] en={"Huangmei opera · A classic selection","Peking opera · The embroidered purse","Yue opera · The butterfly lovers","Henan opera · Mulan on stage","Learn with me · Stage movement","Storytelling · An evening tale"};
        List<OperaItem> values=new ArrayList<>();for(int i=0;i<zh.length;i++){String id=String.format(java.util.Locale.ROOT,"%032x",i+1);values.add(new OperaItem("cctv:"+id,(english()?en:zh)[i],english()?"Native preview fixture":"原生预览示例","","cctv",id,"https://tv.cctv.com/2026/11/10/VIDEfixture.shtml"));}return values;
    }
    public static class TestActivity extends MainActivity {
        @Override protected CctvCatalog createCatalog(){return new CctvCatalog(){@Override public Page load(String columnId,int page)throws IOException{calls++;requestedPage=page;if(block){entered.countDown();boolean done=false;while(!done)try{done=release.await(3,TimeUnit.SECONDS);}catch(InterruptedException ignored){}returned.countDown();}if(fail)throw new IOException("Public catalog is temporarily unavailable");return new Page(fixture(),page<2);}};}
    }
    @Before public void before(){new android.app.Instrumentation().setInTouchMode(false);RuntimeEnvironment.getApplication().getSharedPreferences(OperaStore.PREFERENCES,Context.MODE_PRIVATE).edit().clear().commit();calls=requestedPage=0;fail=block=false;entered=new CountDownLatch(1);release=new CountDownLatch(1);returned=new CountDownLatch(1);}
    @After public void after(){release.countDown();}
    static Object field(MainActivity a,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(a);}
    static View root(MainActivity a){return a.getWindow().getDecorView();}
    static View tag(View root,String key){View v=root.findViewWithTag(key);assertNotNull(key,v);return v;}
    static View tag(MainActivity a,String key){return tag(root(a),key);}
    static Dialog dialog(MainActivity a)throws Exception{return (Dialog)field(a,"modal");}
    static View modal(MainActivity a,String key)throws Exception{assertNotNull(dialog(a));return tag(dialog(a).getWindow().getDecorView(),key);}
    static void flush(MainActivity a)throws Exception{for(int i=0;i<8;i++){shadowOf(Looper.getMainLooper()).idle();Future<?> f=(Future<?>)field(a,"pending");if(f!=null&&!f.isCancelled())f.get(4,TimeUnit.SECONDS);shadowOf(Looper.getMainLooper()).idle();if(field(a,"pending")==null)return;}throw new AssertionError("Pending view work did not settle");}
    static String allText(View v){StringBuilder s=new StringBuilder();if(v instanceof TextView)s.append(((TextView)v).getText()).append('\n');if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++)s.append(allText(((ViewGroup)v).getChildAt(i)));return s.toString();}
    static void layout(View v,int w,int h){v.measure(View.MeasureSpec.makeMeasureSpec(w,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(h,View.MeasureSpec.EXACTLY));v.layout(0,0,w,h);}

    @Test public void remoteListPaginationAndFilteringAreExplicit()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);assertEquals(1,calls);assertEquals(1,requestedPage);assertTrue(tag(a,"page-next").isEnabled());assertFalse(tag(a,"page-previous").isEnabled());
            ((EditText)tag(a,"search-input")).setText("黄梅戏");assertEquals(1,calls);assertNotNull(tag(a,"card:"+fixture().get(0).id));assertNull(root(a).findViewWithTag("card:"+fixture().get(1).id));assertTrue(allText(root(a)).contains("当前页筛选"));
            tag(a,"search-clear").performClick();tag(a,"page-next").performClick();flush(a);assertEquals(2,requestedPage);assertFalse(tag(a,"page-next").isEnabled());tag(a,"page-previous").performClick();flush(a);assertEquals(1,requestedPage);
        }
    }
    @Test public void dpadSelectionFavoriteAndLaunchUseTheSelectedItem()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);layout(root(a),960,540);View card=tag(a,"card:"+fixture().get(0).id);assertTrue(card.requestFocus());assertTrue(card.hasFocus());a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_CENTER));a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_DPAD_CENTER));assertNotNull(dialog(a));
            modal(a,"detail-favorite").performClick();assertNull(dialog(a));assertTrue(new OperaStore(a).isFavorite(fixture().get(0).id));assertTrue(((TextView)tag(a,"card:"+fixture().get(0).id)).getText().toString().startsWith("★"));assertTrue(new OperaStore(a).history().isEmpty());tag(a,"nav-favorites").performClick();tag(a,"card:"+fixture().get(0).id).performClick();modal(a,"detail-play").performClick();Intent started=shadowOf(a).getNextStartedActivity();assertEquals("com.ecojust.operatv.PlaybackActivity",started.getComponent().getClassName());assertEquals(fixture().get(0).id,OperaItem.fromJson(new JSONObject(started.getStringExtra("item"))).id);
        }
    }
    @Test public void failedCatalogProvidesRetryAndNoInventedContent()throws Exception{
        fail=true;try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);assertNotNull(tag(a,"retry"));assertNull(root(a).findViewWithTag("card:"+fixture().get(0).id));fail=false;tag(a,"retry").performClick();flush(a);assertNotNull(tag(a,"card:"+fixture().get(0).id));
        }
    }
    @Test public void lateProviderResponseCannotReplaceTheLocalLibrary()throws Exception{
        block=true;try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();assertTrue(entered.await(3,TimeUnit.SECONDS));tag(a,"nav-mine").performClick();release.countDown();assertTrue(returned.await(3,TimeUnit.SECONDS));shadowOf(Looper.getMainLooper()).idle();assertEquals("mine",field(a,"screen"));assertTrue(allText(root(a)).contains("导入我的片单"));assertNull(root(a).findViewWithTag("card:"+fixture().get(0).id));
        }
    }
    @Test public void openingImportDuringLoadingLeavesAnActionablePageWhenCancelled()throws Exception{
        block=true;try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();assertTrue(entered.await(3,TimeUnit.SECONDS));tag(a,"import-menu").performClick();modal(a,"dialog-cancel").performClick();assertFalse((Boolean)field(a,"loading"));assertNotNull(tag(a,"retry"));release.countDown();
        }
    }
    @Test public void directImportCommitsOnlyValidNetworkUrlsAndDoesNotInventHistory()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);tag(a,"import-menu").performClick();modal(a,"import-direct").performClick();((EditText)modal(a,"import-title")).setText("My recording");((EditText)modal(a,"import-url")).setText("content://ungranted/video");modal(a,"import-confirm").performClick();flush(a);assertTrue(new OperaStore(a).imported().isEmpty());assertNotNull(dialog(a));assertTrue(modal(a,"import-confirm").isEnabled());
            ((EditText)modal(a,"import-url")).setText("http://192.168.1.2/recording.mp4");modal(a,"import-confirm").performClick();flush(a);assertNull(dialog(a));assertEquals("mine",field(a,"screen"));assertEquals(1,new OperaStore(a).imported().size());assertTrue(new OperaStore(a).history().isEmpty());assertTrue(allText(root(a)).contains("My recording"));
        }
    }
    @Test public void corruptStorageShowsFailureAndPreservesTheOriginalSnapshot()throws Exception{
        RuntimeEnvironment.getApplication().getSharedPreferences(OperaStore.PREFERENCES,Context.MODE_PRIVATE).edit().putString(OperaStore.SNAPSHOT,"invalid").commit();
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);tag(a,"nav-favorites").performClick();assertTrue(allText(root(a)).contains("本机资料暂时无法读取"));assertEquals("invalid",a.getSharedPreferences(OperaStore.PREFERENCES,Context.MODE_PRIVATE).getString(OperaStore.SNAPSHOT,""));
        }
    }
    @Test public void localLibraryAndFavoritesSurviveActivityRecreation()throws Exception{
        OperaItem item=OperaItem.direct("My own opera","https://example.com/opera.mp4","My videos");OperaStore store=new OperaStore(RuntimeEnvironment.getApplication());store.importItems(java.util.Collections.singletonList(item));store.toggleFavorite(item);
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);tag(a,"nav-mine").performClick();c.recreate();a=c.get();flush(a);assertEquals("mine",field(a,"screen"));assertNotNull(tag(a,"card:"+item.id));tag(a,"nav-favorites").performClick();assertNotNull(tag(a,"card:"+item.id));
        }
    }
    @Test public void capturesChineseNativeStates()throws Exception{capture(960,540,"");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-mdpi")public void capturesEnglishNativeStates()throws Exception{capture(960,540,".en");}
    @Test @Config(qualifiers="zh-rCN-w1280dp-h720dp-land-mdpi")public void capturesLargeChineseNativeStates()throws Exception{capture(1280,720,"-1280");}
    @Test @Config(qualifiers="en-rUS-w1280dp-h720dp-land-mdpi")public void capturesLargeEnglishNativeStates()throws Exception{capture(1280,720,"-1280.en");}
    private void capture(int w,int h,String suffix)throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();flush(a);layout(root(a),w,h);View card=tag(a,"card:"+fixture().get(0).id);assertTrue(card.requestFocus());checkBounds(card,w,h);checkBounds(tag(a,"import-menu"),w,h);save(root(a),w,h,"opera-tv"+suffix+".png");
            card.performClick();modal(a,"detail-favorite").performClick();tag(a,"nav-favorites").performClick();save(root(a),w,h,"opera-favorites"+suffix+".png");tag(a,"nav-mine").performClick();save(root(a),w,h,"opera-empty"+suffix+".png");tag(a,"import-menu").performClick();modal(a,"import-direct").performClick();save(dialog(a).getWindow().getDecorView(),Math.min(w-44,600),Math.min(h-36,470),"opera-import"+suffix+".png");
        }
    }
    private static void checkBounds(View v,int w,int h){int[] xy=new int[2];v.getLocationOnScreen(xy);assertTrue(xy[0]>=0&&xy[1]>=0);assertTrue(xy[0]+v.getWidth()<=w);assertTrue(xy[1]+v.getHeight()<=h);}
    private static void save(View v,int w,int h,String file)throws Exception{layout(v,w,h);String folder=System.getenv("OPERA_UI_CAPTURE_DIR");if(folder==null)return;new File(folder).mkdirs();Bitmap image=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);v.draw(new Canvas(image));try(FileOutputStream out=new FileOutputStream(new File(folder,file))){assertTrue(image.compress(Bitmap.CompressFormat.PNG,100,out));}image.recycle();}
}
