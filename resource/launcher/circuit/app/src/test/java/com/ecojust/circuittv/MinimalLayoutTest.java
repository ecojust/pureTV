package com.ecojust.circuittv;

import android.app.Activity;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.view.View;
import androidx.recyclerview.widget.RecyclerView;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import org.junit.Test;
import org.junit.Before;
import org.junit.After;
import java.util.Locale;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class MinimalLayoutTest {
    private Locale previousLocale;
    @Before public void useChineseLocale() {
        previousLocale = Locale.getDefault();
        Locale.setDefault(Locale.SIMPLIFIED_CHINESE);
        for(String pkg:new String[]{"com.ecojust.music","com.ecojust.shortvideo","com.phlox.tvwebbrowser","org.jellyfin.androidtv","com.ecojust.webtv"})LauncherLayoutTest.install(pkg,false);
    }
    @After public void restoreLocale() { Locale.setDefault(previousLocale); }

    private void layout(Activity activity, int width, int height) {
        View decor = activity.getWindow().getDecorView();
        decor.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
                View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
        decor.layout(0, 0, width, height);
        shadowOf(android.os.Looper.getMainLooper()).idle();
    }

    private void capture(Activity activity, String name) throws Exception {
        String output = System.getenv("LAUNCHER_UI_CAPTURE_DIR");
        if (output == null) return;
        File directory = new File(output);
        assertTrue(directory.isDirectory() || directory.mkdirs());
        View decor = activity.getWindow().getDecorView();
        Bitmap bitmap = Bitmap.createBitmap(decor.getWidth(), decor.getHeight(), Bitmap.Config.ARGB_8888);
        decor.draw(new Canvas(bitmap));
        try (FileOutputStream stream = new FileOutputStream(new File(directory, name + ".png"))) {
            assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, stream));
        } finally {
            bitmap.recycle();
        }
    }

    private void checkCards(RecyclerView grid, int count) {
        assertEquals(count, grid.getAdapter().getItemCount());
        for (int i = 0; i < count; i++) {
            RecyclerView.ViewHolder holder = LayoutScene.holder(grid,i);
            assertNotNull("card " + i + " should be visible", holder);
            View card = holder.itemView.findViewById(R.id.card);
            assertTrue(card.getWidth() > 0);
            assertTrue(holder.itemView.getLeft() + card.getLeft() >= 0);
            assertTrue(holder.itemView.getLeft() + card.getRight() <= grid.getWidth());
        }
    }

    @Test public void homeRendersSixCardsAndCompactNavigation() throws Exception {
        String wallpaper = System.getenv("CLEAN_UI_TEST_WALLPAPER");
        if (wallpaper != null) {
            File file = new File(RuntimeEnvironment.getApplication().getExternalFilesDir(null), "wallpaper.jpg");
            Files.copy(new File(wallpaper).toPath(), file.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            layout(home, 1920, 1080);
            RecyclerView grid = home.findViewById(R.id.grid);
            checkCards(grid, grid.getAdapter().getItemCount());
            assertEquals(6,grid.getAdapter().getItemCount());
            org.json.JSONArray users=LauncherLayout.defaults(home).json.getJSONObject("home").getJSONArray("users");
            for(int i=0;i<users.length();i++) {
                org.json.JSONObject f=users.getJSONObject(i).getJSONObject("frame");View tile=LayoutScene.holder(grid,i).itemView;
                assertEquals("x must match protocol",f.getInt("x")*2,tile.getLeft());
                assertEquals("y must match protocol",f.getInt("y")*2,tile.getTop());
                assertEquals("width must match protocol",f.getInt("width")*2,tile.getWidth());
                assertEquals("height must match protocol",f.getInt("height")*2,tile.getHeight());
            }

            assertFalse(((android.widget.TextView)LayoutScene.holder(grid,0).itemView.findViewById(R.id.name)).getText().toString().isEmpty());
            assertFalse(((android.widget.TextView)LayoutScene.holder(grid,2).itemView.findViewById(R.id.name)).getText().toString().isEmpty());
            View first = LayoutScene.holder(grid,0).itemView.findViewById(R.id.card);
            assertTrue("initial TV focus should be visible", first.hasFocus());
            int[] at = new int[2];
            first.getLocationOnScreen(at);
            assertTrue("home shortcuts are on screen", at[1] >= 0);
            View nav = home.findViewById(R.id.topButtons);
            assertTrue(home.findViewById(R.id.clock).getWidth() > 0);
            assertEquals(26f,((android.widget.TextView)home.findViewById(R.id.clock)).getTextSize(),.1f);
            assertFalse(home.findViewById(R.id.btnInputs).isShown());assertFalse(home.findViewById(R.id.btnWifi).isShown());
            View top=first.focusSearch(View.FOCUS_UP);assertNotNull(top);assertTrue(top.isShown());assertTrue(top.requestFocus());
            assertTrue("remote focus stays on an actionable visible element",top.isFocusable());
            first.requestFocus();
            assertTrue(nav.getRight() <= home.findViewById(R.id.root).getWidth());
            capture(home, "home-render");
        }
    }

    @Test public void applicationPageRendersEightPlaceholders() throws Exception {
        try (ActivityController<AppsActivity> controller = Robolectric.buildActivity(AppsActivity.class).setup()) {
            AppsActivity page = controller.get();
            layout(page, 1920, 1080);
            RecyclerView appsGrid=page.findViewById(R.id.appsGrid);checkCards(appsGrid,appsGrid.getAdapter().getItemCount());
            capture(page, "apps-render");
        }
    }

    @Test @Config(qualifiers = "zh-rCN-w640dp-h360dp-land-mdpi")
    public void homeCardsFitSmallTelevision() {
        try (ActivityController<MainActivity> controller = Robolectric.buildActivity(MainActivity.class).setup()) {
            MainActivity home = controller.get();
            layout(home, 640, 360);
            RecyclerView grid = home.findViewById(R.id.grid);
            checkCards(grid, grid.getAdapter().getItemCount());
            assertFalse(((android.widget.TextView)LayoutScene.holder(grid,0).itemView.findViewById(R.id.name)).getText().toString().isEmpty());
            assertFalse(((android.widget.TextView)LayoutScene.holder(grid,2).itemView.findViewById(R.id.name)).getText().toString().isEmpty());
            View first = LayoutScene.holder(grid,0).itemView.findViewById(R.id.card);
            assertTrue("initial TV focus should be visible", first.hasFocus());
            int[] at = new int[2];
            first.getLocationOnScreen(at);
            assertTrue("home shortcuts are on screen", at[1] >= 0);
        }
    }
}
