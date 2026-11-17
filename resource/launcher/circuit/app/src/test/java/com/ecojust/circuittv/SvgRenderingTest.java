package com.ecojust.circuittv;

import android.graphics.Bitmap;
import android.graphics.Color;
import android.graphics.drawable.BitmapDrawable;
import android.widget.FrameLayout;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class SvgRenderingTest {
    @Test public void currentColorSvgProducesPixelsIndependentOfLabelColor() throws Exception {
        android.content.Context context=RuntimeEnvironment.getApplication();
        AppAdapter.Entry entry=new AppAdapter.Entry("test",R.string.home_music,R.drawable.ic_music,Color.WHITE,AppAdapter.MUSIC_WEBSITE,0);
        entry.svg="<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"currentColor\" d=\"M2 2h20v20H2z\"/></svg>";
        entry.foreground=Color.rgb(17,34,51);entry.iconColor=Color.rgb(229,127,90);
        AppAdapter adapter=new AppAdapter(context,null,4,java.util.Collections.singletonList(entry));
        AppAdapter.Holder holder=adapter.sceneHolder(new FrameLayout(context),0);
        assertTrue(holder.icon.getDrawable() instanceof BitmapDrawable);
        Bitmap bitmap=((BitmapDrawable)holder.icon.getDrawable()).getBitmap();
        assertEquals(entry.iconColor,bitmap.getPixel(64,64));assertEquals(0,Color.alpha(bitmap.getPixel(0,0)));
        assertEquals(entry.foreground,holder.name.getCurrentTextColor());assertEquals(android.view.View.LAYER_TYPE_NONE,holder.icon.getLayerType());
    }
    @Test public void shippedAppVectorsHaveVisibleInk() throws Exception {
        for(String pkg:new String[]{"com.ecojust.music","com.ecojust.webtv","com.ecojust.shortvideo","com.ecojust.circuittv","com.example.other","com.example.browser","com.example.files"}){
            String raw=SvgIcon.forPackage(pkg);UnifiedLayout.svg(raw);
            Bitmap bitmap=((BitmapDrawable)SvgIcon.drawable(RuntimeEnvironment.getApplication(),raw,Color.BLUE)).getBitmap();
            boolean visible=false;for(int y=0;y<128&&!visible;y++)for(int x=0;x<128;x++)if(Color.alpha(bitmap.getPixel(x,y))>0){visible=true;break;}
            assertTrue(pkg,visible);
        }
    }
    @Test public void compactCommandsRemainVisibleAndNamed() {
        try(org.robolectric.android.controller.ActivityController<MainActivity> c=org.robolectric.Robolectric.buildActivity(MainActivity.class).setup()){
            android.view.View root=c.get().getWindow().getDecorView();root.measure(android.view.View.MeasureSpec.makeMeasureSpec(1920,android.view.View.MeasureSpec.EXACTLY),android.view.View.MeasureSpec.makeMeasureSpec(1080,android.view.View.MeasureSpec.EXACTLY));root.layout(0,0,1920,1080);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            android.widget.TextView settings=c.get().findViewById(R.id.btnSettings);assertTrue(settings.isShown());assertEquals("",settings.getText().toString());assertNotNull(settings.getBackground());
        }
    }
    @Test(timeout=20000) public void iconOnlyCommandSurfacesStayStableAcrossRepeatedLayouts() throws Exception {
        try(org.robolectric.android.controller.ActivityController<MainActivity> c=org.robolectric.Robolectric.buildActivity(MainActivity.class).setup()) {
            android.view.View root=c.get().getWindow().getDecorView();
            android.widget.TextView command=c.get().findViewById(R.id.btnSettings);
            LayoutScene scene=(LayoutScene)command.getParent().getParent();
            // Use the actual WindowManager viewport. Forcing 1920 x 1080 here while
            // idle() restores Robolectric's configured display would test repeated resizing.
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            final int width=root.getWidth(),height=root.getHeight();
            assertTrue("activity has a measured viewport",width>0&&height>0);
            android.graphics.drawable.Drawable first=null;
            for(int pass=0;pass<8;pass++) {
                scene.requestLayout();
                root.measure(android.view.View.MeasureSpec.makeMeasureSpec(width,android.view.View.MeasureSpec.EXACTLY),android.view.View.MeasureSpec.makeMeasureSpec(height,android.view.View.MeasureSpec.EXACTLY));
                root.layout(0,0,width,height);
                org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
                assertEquals("viewport width stays fixed",width,root.getWidth());assertEquals("viewport height stays fixed",height,root.getHeight());
                assertTrue(command.getBackground() instanceof android.graphics.drawable.LayerDrawable);
                if(first==null)first=command.getBackground();else assertSame("layout must reuse its command surface",first,command.getBackground());
                assertEquals(0,command.getPaddingLeft());assertEquals(0,command.getPaddingRight());
                assertNull(command.getCompoundDrawables()[0]);
            }
            scene.apply(LauncherLayout.defaults(c.get()),"home");
            root.measure(android.view.View.MeasureSpec.makeMeasureSpec(width,android.view.View.MeasureSpec.EXACTLY),android.view.View.MeasureSpec.makeMeasureSpec(height,android.view.View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertNotSame("new layout invalidates the bounded surface cache",first,command.getBackground());
        }
    }
}
