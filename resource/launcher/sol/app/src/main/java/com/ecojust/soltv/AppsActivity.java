package com.ecojust.soltv;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import java.lang.ref.WeakReference;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

/** Companion app shortcuts followed by a small set of placeholders. */
public class AppsActivity extends Activity implements AppAdapter.TileListener {
    private static WeakReference<AppsActivity> live;
    private RecyclerView grid;
    private AppAdapter adapter;
    private LayoutScene layoutScene;
    private int columns;
    private int focusedPosition;
    private String layoutSignature="";

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        setContentView(R.layout.activity_apps);
        LauncherLayout layout=LauncherLayout.effective(this);
        layoutSignature=layout==null?"":layout.json.toString();
        columns = layout==null?(getResources().getConfiguration().screenWidthDp >= 800 ? 4 : 3):layout.columns("apps");
        grid = findViewById(R.id.appsGrid);
        grid.setLayoutManager(new GridLayoutManager(this, columns));
        grid.setHasFixedSize(true);
        grid.setItemAnimator(null);
        AppAdapter.setReducedMotion(getSharedPreferences("layout", MODE_PRIVATE)
                .getBoolean("reduced_motion", false));
        adapter = new AppAdapter(this, this, columns, layout==null?AppAdapter.applicationEntries():layout.entries(this,"apps"));
        grid.setAdapter(adapter);
        layoutScene=new LayoutScene(this,findViewById(R.id.appsRoot),grid,"apps");layoutScene.apply(layout,"apps");
        findViewById(R.id.backHome).setOnClickListener(v -> finish());
        findViewById(R.id.backHome).setOnKeyListener((v, key, event) -> {
            if (layoutScene != null) return false;
            if (event.getAction() != KeyEvent.ACTION_DOWN) return false;
            if (key == KeyEvent.KEYCODE_DPAD_DOWN) {
                CardFocus.request(grid, focusedPosition);
                return true;
            }
            return key == KeyEvent.KEYCODE_DPAD_UP;
        });
        if (state != null) focusedPosition = state.getInt("focusedPosition", 0);
        CardFocus.request(grid, focusedPosition);
        live=new WeakReference<>(this);
    }

    @Override protected void onResume() {
        super.onResume();
        reloadCustomLayout();
    }
    static void reloadLayoutFromManager() {
        AppsActivity activity=live==null?null:live.get();
        if(activity!=null)activity.runOnUiThread(()->{if(!activity.isFinishing() && !activity.isDestroyed())activity.reloadCustomLayout();});
    }
    private void reloadCustomLayout() {
        LauncherLayout layout=LauncherLayout.effective(this);String signature=layout==null?"":layout.json.toString();
        if(!signature.equals(layoutSignature)) {
            layoutSignature=signature;columns=layout==null?(getResources().getConfiguration().screenWidthDp>=800?4:3):layout.columns("apps");
            adapter.clear();adapter=new AppAdapter(this,this,columns,layout==null?AppAdapter.applicationEntries():layout.entries(this,"apps"));
            grid.setLayoutManager(new GridLayoutManager(this,columns));grid.setAdapter(adapter);layoutScene.apply(layout,"apps");CardFocus.request(grid,focusedPosition);
        }
    }

    @Override protected void onDestroy() {
        if(live!=null && live.get()==this)live.clear();
        if(adapter!=null)adapter.clear();
        super.onDestroy();
    }

    @Override public void onTileFocused(int position, View card) { focusedPosition = position; }

    @Override public boolean onTileVerticalKey(int position, int key) {
        if (layoutScene != null) {
            if(layoutScene.edge(position,key==KeyEvent.KEYCODE_DPAD_DOWN)&&navigateLayout(key==KeyEvent.KEYCODE_DPAD_DOWN?"down":"up"))return true;
            return false;
        }
        if (key == KeyEvent.KEYCODE_DPAD_UP && position < columns) {
            findViewById(R.id.backHome).requestFocus();
            return true;
        }
        int target = key == KeyEvent.KEYCODE_DPAD_UP ? position - columns : position + columns;
        if (target >= adapter.getItemCount()) {
            // Preserve the column where possible, including the last incomplete row.
            int lastRow = ((adapter.getItemCount() - 1) / columns) * columns;
            if (position >= lastRow) return true;
            target = adapter.getItemCount() - 1;
        }
        CardFocus.request(grid, target);
        return true;
    }

    private boolean navigateLayout(String direction){if(layoutScene!=null&&layoutScene.navigation(direction).equals("home")){finish();return true;}return false;}
    @Override public boolean dispatchKeyEvent(KeyEvent event){if(event.getAction()==KeyEvent.ACTION_DOWN&&adapter!=null&&adapter.getItemCount()==0&&(event.getKeyCode()==KeyEvent.KEYCODE_DPAD_UP||event.getKeyCode()==KeyEvent.KEYCODE_DPAD_DOWN)&&navigateLayout(event.getKeyCode()==KeyEvent.KEYCODE_DPAD_UP?"up":"down"))return true;return super.dispatchKeyEvent(event);}

    @Override protected void onSaveInstanceState(Bundle state) {
        state.putInt("focusedPosition", focusedPosition);
        super.onSaveInstanceState(state);
    }
}
