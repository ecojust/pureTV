package com.ecojust.formatv;
import android.app.Activity;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONObject;
final class LegacyTestLayout {
 static void install(Activity activity,String page){try{
  java.io.InputStream input=LegacyTestLayout.class.getResourceAsStream("/layout-v3.json");java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream();byte[] buffer=new byte[4096];int read;while((read=input.read(buffer))!=-1)output.write(buffer,0,read);input.close();
  LauncherLayout layout=new LauncherLayout(new JSONObject(output.toString("UTF-8")));RecyclerView grid=activity.findViewById(page.equals("home")?R.id.grid:R.id.appsGrid);
  grid.setAdapter(new AppAdapter(activity,(AppAdapter.TileListener)activity,layout.columns(page),layout.entries(activity,page)));((LayoutScene)grid.getParent()).apply(layout,page);
 }catch(Exception error){throw new AssertionError(error);}}
}
