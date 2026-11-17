package com.ecojust.mosstv;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.ResolveInfo;
import androidx.recyclerview.widget.RecyclerView;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.RobolectricTestRunner;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
public class LauncherLayoutTest {
 static Context ctx(){return RuntimeEnvironment.getApplication();}
 @After public void clear(){LauncherLayout.reset(ctx());}
 static void install(String pkg,boolean system){install(pkg,system,null);}
 static void install(String pkg,boolean system,String title){
  PackageInfo info=new PackageInfo();info.packageName=pkg;info.applicationInfo=new ApplicationInfo();info.applicationInfo.packageName=pkg;info.applicationInfo.enabled=true;info.applicationInfo.nonLocalizedLabel=title!=null?title:pkg.equals("com.example.browser")?"浏览器":pkg.equals("com.example.files")?"文件":pkg.equals("com.example.music")?"音乐":pkg.equals("com.example.video")?"视频":pkg.equals("com.ecojust.webtv")?"电视":pkg;info.applicationInfo.flags=ApplicationInfo.FLAG_INSTALLED|(system?ApplicationInfo.FLAG_SYSTEM:0);
  org.robolectric.Shadows.shadowOf(ctx().getPackageManager()).installPackage(info);
  ResolveInfo resolve=new ResolveInfo();resolve.activityInfo=new android.content.pm.ActivityInfo();resolve.activityInfo.packageName=pkg;resolve.activityInfo.name=pkg+".Main";resolve.activityInfo.applicationInfo=info.applicationInfo;resolve.activityInfo.enabled=true;resolve.activityInfo.exported=true;
  for(String category:new String[]{Intent.CATEGORY_LAUNCHER,Intent.CATEGORY_LEANBACK_LAUNCHER}){Intent query=new Intent(Intent.ACTION_MAIN).addCategory(category);org.robolectric.Shadows.shadowOf(ctx().getPackageManager()).addResolveInfoForIntent(query,resolve);org.robolectric.Shadows.shadowOf(ctx().getPackageManager()).addResolveInfoForIntent(new Intent(query).setPackage(pkg),resolve);}
 }
 static JSONObject user(String pkg)throws Exception{return new JSONObject().put("id","app-custom").put("name","用户应用").put("text","打开应用").put("action",pkg).put("frame",new JSONObject("{\"x\":120,\"y\":280,\"width\":200,\"height\":150}")).put("visible",true).put("icon",UnifiedLayout.ICON).put("textColor","#EEEEEE").put("iconColor","#22AA88").put("backgroundColor","#123456");}
 @Test public void hundredApplicationsWithLongChineseLabelsRemainWithinProtocolBudget()throws Exception{
  for(int i=0;i<100;i++){
    String pkg="com.example.catalogue.app"+i;install(pkg,false,"电视应用长名称".repeat(20)+i);
  }
  JSONObject layout=LauncherLayout.defaults(ctx()).json;assertEquals(100,layout.getJSONObject("apps").getJSONArray("users").length());
  assertTrue(layout.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=LauncherLayout.LIMIT);
  assertEquals(6,layout.getJSONObject("home").getJSONArray("users").length());LauncherLayout.apply(ctx(),layout);
 }
 @Test public void upgradesPreviousV5SystemAndPreservesCustomUsersAndBackground()throws Exception{
  install("com.example.user",false);
  JSONObject old=new JSONObject(new String(ctx().getAssets().open("layout-0.1.0.json").readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));
  old.getJSONObject("home").put("users",new JSONArray().put(user("com.example.user")));
  old.getJSONObject("home").put("background",new JSONObject().put("color","#123456"));
  old.getJSONObject("home").put("navigation",new JSONObject());
  java.io.File stored=new java.io.File(ctx().getFilesDir(),"layout.json");java.nio.file.Files.write(stored.toPath(),old.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));
  JSONObject upgraded=LauncherLayout.override(ctx()).json;
  assertEquals(120,upgraded.getJSONObject("home").getJSONArray("users").getJSONObject(0).getJSONObject("frame").getInt("x"));
  assertEquals("#123456",upgraded.getJSONObject("home").getJSONObject("background").getString("color"));
  assertEquals(0,upgraded.getJSONObject("home").getJSONObject("navigation").length());
  assertEquals("statusClock",upgraded.getJSONObject("home").getJSONArray("system").getJSONObject(0).getString("id"));
  LauncherLayout.apply(ctx(),upgraded);
 }
 @Test public void defaultsExposeUniformUsersAndSystemAndEveryComponentHasAction()throws Exception{
  install("com.example.user",false);install("com.example.system",true);JSONObject d=LauncherLayout.defaults(ctx()).json;assertEquals(5,d.getInt("version"));assertFalse(d.getJSONObject("home").has("columns"));assertFalse(d.getJSONObject("home").has("scene"));
  for(String page:new String[]{"home","apps"})for(String kind:new String[]{"users","system"}){JSONArray nodes=d.getJSONObject(page).getJSONArray(kind);for(int i=0;i<nodes.length();i++){JSONObject n=nodes.getJSONObject(i);assertTrue(LauncherLayout.validPackage(n.getString("action")));assertTrue(n.has("frame"));assertTrue(n.has("name"));assertTrue(n.has("text"));UnifiedLayout.svg(n.getString("icon"));}}
  assertFalse(d.toString().contains("com.example.system"));assertTrue(d.toString().contains("com.example.user"));
 }
 @Test public void userPositionScreenAndSvgDriveRealViewsAndSystemCannotMove()throws Exception{
  install("com.example.custom",false);JSONObject d=LauncherLayout.defaults(ctx()).json;d.getJSONObject("home").put("users",new JSONArray().put(user("com.example.custom")));LauncherLayout.apply(ctx(),d);
  try(org.robolectric.android.controller.ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup()){
   MainActivity activity=controller.get();android.view.View root=activity.getWindow().getDecorView();root.measure(android.view.View.MeasureSpec.makeMeasureSpec(1920,android.view.View.MeasureSpec.EXACTLY),android.view.View.MeasureSpec.makeMeasureSpec(1080,android.view.View.MeasureSpec.EXACTLY));root.layout(0,0,1920,1080);org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
   RecyclerView grid=activity.findViewById(R.id.grid);android.view.View card=LayoutScene.holder(grid,0).itemView;assertEquals(240,card.getLeft());assertEquals(560,card.getTop());assertEquals(400,card.getWidth());assertNotNull(((android.widget.ImageView)card.findViewById(R.id.icon)).getDrawable());
   card.findViewById(R.id.card).performClick();assertEquals("com.example.custom",org.robolectric.Shadows.shadowOf(activity).getNextStartedActivity().getComponent().getPackageName());
   JSONObject scaled=new JSONObject(d.toString());scaled.put("screen",new JSONObject("{\"width\":1920,\"height\":1080}"));for(String page:new String[]{"home","apps"})scaled.getJSONObject(page).put("system",UnifiedLayout.resized(d.getJSONObject(page).getJSONArray("system"),d.getJSONObject("screen"),scaled.getJSONObject("screen")));LauncherLayout.apply(ctx(),scaled);
   root.measure(android.view.View.MeasureSpec.makeMeasureSpec(1920,android.view.View.MeasureSpec.EXACTLY),android.view.View.MeasureSpec.makeMeasureSpec(1080,android.view.View.MeasureSpec.EXACTLY));root.layout(0,0,1920,1080);org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();assertEquals(120,LayoutScene.holder(grid,0).itemView.getLeft());
  }
  JSONObject bad=new JSONObject(d.toString());bad.getJSONObject("home").getJSONArray("system").getJSONObject(1).getJSONObject("frame").put("x",123);
  try{LauncherLayout.apply(ctx(),bad);fail("System must be immutable");}catch(IllegalArgumentException expected){}
 }
 @Test public void userActionsRequireInstalledLaunchableNonSystemAppsAndSvgIsBounded()throws Exception{
  install("com.example.user",false);install("com.example.system",true);JSONObject d=LauncherLayout.defaults(ctx()).json;
  for(String pkg:new String[]{"com.example.system","com.example.missing"}){d.getJSONObject("home").put("users",new JSONArray().put(user(pkg)));try{LauncherLayout.apply(ctx(),d);fail("Invalid user app");}catch(IllegalArgumentException expected){}}
  for(String svg:new String[]{"<svg><script>bad</script></svg>","<svg onload=\"alert(1)\"/>","<svg><image href=\"https://evil\"/></svg>","<!DOCTYPE svg><svg/>"}){d.getJSONObject("home").put("users",new JSONArray().put(user("com.example.user").put("icon",svg)));try{new LauncherLayout(d);fail("Invalid SVG");}catch(Exception expected){}}
 }
 @Test public void providerIsShellProtectedAndReturnsV5()throws Exception{
  android.content.pm.ProviderInfo info=ctx().getPackageManager().resolveContentProvider("com.ecojust.mosstv.layout",0);assertTrue(info.exported);assertEquals("android.permission.DUMP",info.readPermission);assertEquals("android.permission.DUMP",info.writePermission);
  LauncherLayoutProvider provider=Robolectric.buildContentProvider(LauncherLayoutProvider.class).create().get();android.os.Bundle result=provider.call("status",null,null);JSONObject value=new JSONObject(new String(android.util.Base64.decode(result.getString("result"),android.util.Base64.NO_WRAP),java.nio.charset.StandardCharsets.UTF_8));assertEquals(5,value.getInt("version"));assertEquals(5,value.getJSONObject("layout").getInt("version"));
 }
 @Test public void providerAppliesAndResetsUserLayoutWithoutChangingSystem()throws Exception{
  install("com.example.user",false);LauncherLayoutProvider provider=Robolectric.buildContentProvider(LauncherLayoutProvider.class).create().get();
  JSONObject draft=LauncherLayout.defaults(ctx()).json;draft.getJSONObject("home").put("users",new JSONArray().put(user("com.example.user")));
  String payload=android.util.Base64.encodeToString(draft.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8),android.util.Base64.NO_WRAP);
  android.os.Bundle result=provider.call("apply",payload,null);JSONObject applied=new JSONObject(new String(android.util.Base64.decode(result.getString("result"),android.util.Base64.NO_WRAP),java.nio.charset.StandardCharsets.UTF_8));
  assertTrue(applied.getBoolean("custom"));assertEquals(120,applied.getJSONObject("layout").getJSONObject("home").getJSONArray("users").getJSONObject(0).getJSONObject("frame").getInt("x"));assertTrue(applied.has("systemBasis"));
  provider.call("reset",null,null);assertNull(LauncherLayout.override(ctx()));
 }
 @Test public void downAndUpPageSwitchesFollowNavigationJson()throws Exception{
  install("com.example.user",false);JSONObject draft=LauncherLayout.defaults(ctx()).json;draft.getJSONObject("home").put("users",new JSONArray().put(user("com.example.user")));LauncherLayout.apply(ctx(),draft);
  try(org.robolectric.android.controller.ActivityController<MainActivity> home=Robolectric.buildActivity(MainActivity.class).setup()){
   assertTrue(home.get().onTileVerticalKey(0,android.view.KeyEvent.KEYCODE_DPAD_DOWN));assertEquals(AppsActivity.class.getName(),org.robolectric.Shadows.shadowOf(home.get()).getNextStartedActivity().getComponent().getClassName());
   draft.getJSONObject("home").put("navigation",new JSONObject());LauncherLayout.apply(ctx(),draft);org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();assertFalse(home.get().onTileVerticalKey(0,android.view.KeyEvent.KEYCODE_DPAD_DOWN));
  }
  try(org.robolectric.android.controller.ActivityController<AppsActivity> apps=Robolectric.buildActivity(AppsActivity.class).setup()){
   assertTrue(apps.get().onTileVerticalKey(0,android.view.KeyEvent.KEYCODE_DPAD_UP));assertTrue(apps.get().isFinishing());
  }
 }
 @Test public void pageBackgroundsAreIndependentAndLegacyUserBlocksMigrate()throws Exception{
  install("com.example.user",false);JSONObject d=LauncherLayout.defaults(ctx()).json;
  android.graphics.Bitmap bitmap=android.graphics.Bitmap.createBitmap(2,2,android.graphics.Bitmap.Config.ARGB_8888);bitmap.eraseColor(android.graphics.Color.RED);java.io.ByteArrayOutputStream bytes=new java.io.ByteArrayOutputStream();bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,bytes);bitmap.recycle();String image="data:image/png;base64,"+android.util.Base64.encodeToString(bytes.toByteArray(),android.util.Base64.NO_WRAP);
  d.getJSONObject("home").getJSONObject("background").put("image",image);d.getJSONObject("apps").getJSONObject("background").remove("image");d.getJSONObject("apps").getJSONObject("background").put("color","#334455");LauncherLayout.apply(ctx(),d);JSONObject read=LauncherLayout.override(ctx()).json;assertEquals(image,read.getJSONObject("home").getJSONObject("background").getString("image"));assertFalse(read.getJSONObject("apps").getJSONObject("background").has("image"));assertEquals("#334455",read.getJSONObject("apps").getJSONObject("background").getString("color"));
  JSONObject legacy=new JSONObject("{\"version\":3,\"home\":{\"columns\":4,\"items\":[{\"packageName\":\"com.example.user\",\"label\":\"旧应用\",\"frame\":{\"x\":10,\"y\":20,\"width\":100,\"height\":120}}]},\"apps\":{\"columns\":4,\"items\":[]}}");JSONObject migrated=UnifiedLayout.migrate(legacy,LauncherLayout.defaults(ctx()).json);new LauncherLayout(migrated);assertEquals("com.example.user",migrated.getJSONObject("home").getJSONArray("users").getJSONObject(0).getString("action"));assertEquals(10,migrated.getJSONObject("home").getJSONArray("users").getJSONObject(0).getJSONObject("frame").getInt("x"));
 }
 @Test public void systemCoordinatesReturnToCanonicalBasisAfterScreenRoundTrip()throws Exception{
  JSONObject original=LauncherLayout.defaults(ctx()).json;JSONObject small=new JSONObject(original.toString());small.put("screen",new JSONObject("{\"width\":320,\"height\":320}"));for(String page:new String[]{"home","apps"}){small.getJSONObject(page).put("users",new JSONArray());small.getJSONObject(page).put("system",UnifiedLayout.resized(original.getJSONObject(page).getJSONArray("system"),original.getJSONObject("screen"),small.getJSONObject("screen")));}LauncherLayout.apply(ctx(),small);
  JSONObject restored=new JSONObject(small.toString());restored.put("screen",original.getJSONObject("screen"));for(String page:new String[]{"home","apps"})restored.getJSONObject(page).put("system",original.getJSONObject(page).getJSONArray("system"));LauncherLayout.apply(ctx(),restored);assertEquals(960,LauncherLayout.override(ctx()).json.getJSONObject("screen").getInt("width"));
 }
 @Test public void previousV4UserLayoutMigratesWithoutMovingUserCards()throws Exception{
  JSONObject old=new JSONObject(new String(getClass().getClassLoader().getResourceAsStream("layout-v4.json").readAllBytes(),java.nio.charset.StandardCharsets.UTF_8));
  JSONObject node=user("com.example.custom");node.remove("textColor");node.remove("iconColor");node.put("color","#123456");old.getJSONObject("home").put("users",new JSONArray().put(node));
  JSONObject upgraded=UnifiedLayout.migrate(old,LauncherLayout.template(ctx()).json);new LauncherLayout(upgraded);
  JSONObject actual=upgraded.getJSONObject("home").getJSONArray("users").getJSONObject(0);
  assertEquals(node.getJSONObject("frame").toString(),actual.getJSONObject("frame").toString());assertEquals("#123456",actual.getString("textColor"));assertEquals("#123456",actual.getString("iconColor"));assertFalse(actual.has("color"));
  assertEquals("transparent",upgraded.getJSONObject("home").getJSONArray("system").getJSONObject(0).getString("backgroundColor"));
 }
}
