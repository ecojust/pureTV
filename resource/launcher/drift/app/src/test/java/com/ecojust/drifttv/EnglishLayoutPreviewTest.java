package com.ecojust.drifttv;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.util.Locale;
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

/** English screenshots exercise the shipped locale-selected template through real Activities. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="en-rUS-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class EnglishLayoutPreviewTest {
    private Locale previous;
    static Context ctx(){return RuntimeEnvironment.getApplication();}
    @Before public void englishApps(){
        previous=Locale.getDefault();Locale.setDefault(Locale.US);LauncherLayout.reset(ctx());
        install("com.ecojust.music","Music TV");install("com.ecojust.shortvideo","ShortVideo TV");
        install("com.ecojust.webtv","WebTV");install("com.phlox.tvwebbrowser","TV Bro");install("org.jellyfin.androidtv","Jellyfin");
    }
    @After public void cleanup(){LauncherLayout.reset(ctx());Locale.setDefault(previous);}
    static void install(String pkg,String label){
        PackageInfo info=new PackageInfo();info.packageName=pkg;info.applicationInfo=new ApplicationInfo();
        info.applicationInfo.packageName=pkg;info.applicationInfo.enabled=true;info.applicationInfo.nonLocalizedLabel=label;
        info.applicationInfo.flags=ApplicationInfo.FLAG_INSTALLED;shadowOf(ctx().getPackageManager()).installPackage(info);
        ResolveInfo resolved=new ResolveInfo();resolved.activityInfo=new android.content.pm.ActivityInfo();
        resolved.activityInfo.packageName=pkg;resolved.activityInfo.name=pkg+".Main";resolved.activityInfo.applicationInfo=info.applicationInfo;
        resolved.activityInfo.enabled=true;resolved.activityInfo.exported=true;
        for(String category:new String[]{Intent.CATEGORY_LAUNCHER,Intent.CATEGORY_LEANBACK_LAUNCHER}){
            Intent query=new Intent(Intent.ACTION_MAIN).addCategory(category);
            shadowOf(ctx().getPackageManager()).addResolveInfoForIntent(query,resolved);
            shadowOf(ctx().getPackageManager()).addResolveInfoForIntent(new Intent(query).setPackage(pkg),resolved);
        }
    }
    private static void englishVisibleText(View view){
        if(!view.isShown())return;
        if(view instanceof TextView)assertFalse("Untranslated visible text: "+((TextView)view).getText(),((TextView)view).getText().toString().matches("(?s).*\\p{IsHan}.*"));
        if(view.getContentDescription()!=null)assertFalse("Untranslated accessibility label: "+view.getContentDescription(),view.getContentDescription().toString().matches("(?s).*\\p{IsHan}.*"));
        if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)englishVisibleText(((ViewGroup)view).getChildAt(i));
    }
    private void capture(Activity activity,String filename)throws Exception{
        View decor=activity.getWindow().getDecorView();
        decor.measure(View.MeasureSpec.makeMeasureSpec(1920,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(1080,View.MeasureSpec.EXACTLY));
        decor.layout(0,0,1920,1080);shadowOf(android.os.Looper.getMainLooper()).idle();englishVisibleText(decor);
        assertNull("Fresh locale screenshot must use the real default, not an injected override",LauncherLayout.override(ctx()));
        String output=System.getenv("LAUNCHER_UI_CAPTURE_DIR");if(output==null)return;
        File directory=new File(output);assertTrue(directory.isDirectory()||directory.mkdirs());
        Bitmap bitmap=Bitmap.createBitmap(1920,1080,Bitmap.Config.ARGB_8888);decor.draw(new Canvas(bitmap));
        try(FileOutputStream stream=new FileOutputStream(new File(directory,filename))){assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG,100,stream));}finally{bitmap.recycle();}
    }
    @Test public void englishHomeUsesShippedTemplate()throws Exception{
        try(ActivityController<MainActivity> activity=Robolectric.buildActivity(MainActivity.class).setup()){capture(activity.get(),"home-render.en.png");}
    }
    @Test public void englishAppsUseShippedTemplate()throws Exception{
        try(ActivityController<AppsActivity> activity=Robolectric.buildActivity(AppsActivity.class).setup()){capture(activity.get(),"apps-render.en.png");}
    }
}
