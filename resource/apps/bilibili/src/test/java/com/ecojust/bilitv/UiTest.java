package com.ecojust.bilitv;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.*;
import android.os.Looper;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import java.io.*;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-mdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
public class UiTest {
    static boolean failSearch,historyHasMore,blockFirstSearch,blockQrVerification;
    static int favoriteWrites,qrPolls,qrStarts,searchPage;
    static AccountApi.Status qrStatus;
    static CountDownLatch entered,release;
    static boolean english(){return RuntimeEnvironment.getApplication().getResources().getConfiguration().locale.getLanguage().equals("en");}
    static String label(String zh,String en){return english()?en:zh;}
    static List<VideoApi.Video> fixtureVideos(){
        String[] zh={"山海之间 · 一次风景摄影练习","把日常拍成电影","雨天的书桌与一杯热茶","走进城市的一间小书店"};
        String[] en={"Between mountains and sea","Making everyday moments cinematic","A quiet desk on a rainy day","Inside a neighborhood bookshop"};
        List<VideoApi.Video> items=new ArrayList<>();for(int i=0;i<4;i++)items.add(new VideoApi.Video("BV1xx411c7mD",100+i,(english()?en:zh)[i],label("演示创作者","Demo creator"),"",180+i*63,500+i,42));return items;
    }
    public static class TestActivity extends MainActivity {
        @Override protected VideoApi createVideoApi(BiliHttp http){return new VideoApi(http){
            @Override public SearchPage search(String query,int page)throws IOException {
                searchPage=page;if(blockFirstSearch&&(query.equals("old")||query.equals("slow"))){entered.countDown();boolean done=false;while(!done)try{done=release.await(2,TimeUnit.SECONDS);}catch(InterruptedException ignored){}}
                if(failSearch)throw new BiliHttp.ApiException(BiliHttp.Kind.NETWORK,0,"offline");
                List<Video> values=fixtureVideos();if(query.equals("old"))values=Collections.singletonList(new Video("BV1xx411c7mD",200,"STALE","","",60));
                if(query.equals("empty"))values=Collections.emptyList();return new SearchPage(values,page,page==1);
            }
            @Override public Detail detail(String bvid){Video value=fixtureVideos().get(0);return new Detail(value,label("用于原生界面验证的演示内容。","Demonstration content for native UI validation."),Arrays.asList(new Part(500,1,label("第一集","Part one"),180),new Part(501,2,label("第二集","Part two"),240)));}
        };}
        @Override protected AccountApi createAccountApi(BiliHttp http,SessionStore session){return new AccountApi(http,session){
            @Override public Profile profile(){return new Profile(123,label("演示账号","Demo account"),"");}
            @Override public QrTicket startQr(){qrStarts++;session.clear();return new QrTicket("fixture-qr-key-123456","https://passport.bilibili.com/fixture",System.currentTimeMillis(),session.generation());}
            @Override public QrState pollQr(QrTicket ticket){qrPolls++;if(blockQrVerification){session.acceptCookies("https://passport.bilibili.com/x/passport-login/web/qrcode/poll",Arrays.asList("SESSDATA=fixture-session; Domain=.bilibili.com; Path=/; Secure; HttpOnly","bili_jct=fixture-csrf; Domain=.bilibili.com; Path=/; Secure"),session.generation());entered.countDown();boolean done=false;while(!done)try{done=release.await(2,TimeUnit.SECONDS);}catch(InterruptedException ignored){}}return new QrState(qrStatus,qrStatus==Status.SUCCESS?profile():null);}
            @Override public List<Folder> folders(long mid){return folders(mid,0);}
            @Override public List<Folder> folders(long mid,long aid){return Collections.singletonList(new Folder(55,label("慢慢看","Watch later"),4,false));}
            @Override public VideoApi.SearchPage favorites(long folder,int page){return new VideoApi.SearchPage(fixtureVideos(),page,false);}
            @Override public HistoryPage history(long max,long at){return new HistoryPage(fixtureVideos(),historyHasMore?100:0,historyHasMore?200:0,historyHasMore);}
            @Override public void favorite(long aid,long folder,boolean add){favoriteWrites++;}
        };}
    }
    @Before public void before(){new android.app.Instrumentation().setInTouchMode(false);new SessionStore(RuntimeEnvironment.getApplication()).clear();failSearch=historyHasMore=blockFirstSearch=blockQrVerification=false;favoriteWrites=qrPolls=qrStarts=searchPage=0;qrStatus=AccountApi.Status.WAITING;entered=new CountDownLatch(1);release=new CountDownLatch(1);}
    @After public void after(){release.countDown();}
    static Object field(Object target,String key)throws Exception{Field f=MainActivity.class.getDeclaredField(key);f.setAccessible(true);return f.get(target);}
    static void flush(MainActivity activity)throws Exception{for(int i=0;i<6;i++){shadowOf(Looper.getMainLooper()).idle();Future<?> pending=(Future<?>)field(activity,"pending");if(pending!=null&&!pending.isCancelled())pending.get(3,TimeUnit.SECONDS);shadowOf(Looper.getMainLooper()).idle();if(field(activity,"pending")==null)return;}throw new AssertionError("UI work did not settle");}
    static View root(MainActivity a){return a.getWindow().getDecorView();}
    static View tag(MainActivity a,String tag){View v=root(a).findViewWithTag(tag);assertNotNull(tag,v);return v;}
    static Button button(View v,String text){if(v instanceof Button&&text.contentEquals(((Button)v).getText()))return(Button)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){Button b=button(((ViewGroup)v).getChildAt(i),text);if(b!=null)return b;}return null;}
    static Dialog dialog(MainActivity a)throws Exception{return(Dialog)field(a,"modal");}
    static void search(MainActivity a,String value)throws Exception{((EditText)tag(a,"search-input")).setText(value);tag(a,"search-submit").performClick();flush(a);}
    static void signIn(MainActivity a)throws Exception{qrStatus=AccountApi.Status.SUCCESS;tag(a,"account").performClick();flush(a);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(2201));flush(a);assertNull(dialog(a));}
    static String visibleText(View v){StringBuilder text=new StringBuilder();if(v instanceof TextView)text.append(((TextView)v).getText()).append('\n');if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++)text.append(visibleText(((ViewGroup)v).getChildAt(i)));return text.toString();}
    @Test public void searchPaginationDetailsAndResumeUseExplicitRemoteActions()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();assertTrue(visibleText(root(a)).contains("只保留你想看的内容"));assertEquals(0,searchPage);search(a,"摄影");assertEquals(1,searchPage);assertEquals(0,favoriteWrites);
            button(root(a),"下一页").performClick();flush(a);assertEquals(2,searchPage);button(root(a),"上一页").performClick();flush(a);
            layout(root(a),960,540);View card=tag(a,"video-0");assertFalse("TV navigation leaves touch mode",card.isInTouchMode());assertTrue("The result card accepts keyboard focus",card.requestFocus());assertTrue(card.hasFocus());a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_DPAD_CENTER));a.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP,KeyEvent.KEYCODE_DPAD_CENTER));flush(a);assertNotNull(dialog(a));button(dialog(a).getWindow().getDecorView(),"继续播放").performClick();
            Intent playback=shadowOf(a).getNextStartedActivity();assertEquals("com.ecojust.bilitv.PlaybackActivity",playback.getComponent().getClassName());assertEquals(500,playback.getLongExtra("cid",0));assertEquals(42,playback.getLongExtra("positionSeconds",0));assertEquals(0,favoriteWrites);
        }
    }
    @Test public void failedAndEmptySearchAreReadableAndRetryKeepsQuery()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();failSearch=true;search(a,"摄影");assertTrue(visibleText(root(a)).contains("暂时无法读取"));assertNotNull(button(root(a),"重试"));failSearch=false;button(root(a),"重试").performClick();flush(a);assertNotNull(tag(a,"video-0"));search(a,"empty");assertTrue(visibleText(root(a)).contains("没有找到视频"));a.onBackPressed();assertTrue(visibleText(root(a)).contains("只保留你想看的内容"));
        }
    }
    @Test public void lateSearchCannotReplaceNewQuery()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();blockFirstSearch=true;((EditText)tag(a,"search-input")).setText("old");tag(a,"search-submit").performClick();assertTrue(entered.await(2,TimeUnit.SECONDS));search(a,"new");release.countDown();Thread.sleep(40);shadowOf(Looper.getMainLooper()).idle();assertFalse(visibleText(root(a)).contains("STALE"));assertTrue(visibleText(root(a)).contains("new"));
        }
    }
    @Test public void accountTabsRequireSignInAndFavoriteNeedsConfirmation()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();tag(a,"tab-favorites").performClick();assertTrue(visibleText(root(a)).contains("登录后继续"));signIn(a);flush(a);assertNotNull(button(root(a),"慢慢看  ·  4"));button(root(a),"慢慢看  ·  4").performClick();flush(a);tag(a,"video-0").performClick();flush(a);button(dialog(a).getWindow().getDecorView(),"收藏到…").performClick();flush(a);button(dialog(a).getWindow().getDecorView(),"+  慢慢看").performClick();assertEquals(0,favoriteWrites);dialog(a).getWindow().getDecorView().findViewWithTag("confirm-favorite").performClick();flush(a);assertEquals(1,favoriteWrites);
            button(root(a),"返回收藏夹").performClick();flush(a);a.onBackPressed();assertTrue(visibleText(root(a)).contains("只保留你想看的内容"));tag(a,"tab-history").performClick();flush(a);assertTrue(visibleText(root(a)).contains("观看历史"));tag(a,"account").performClick();button(dialog(a).getWindow().getDecorView(),"退出登录").performClick();assertEquals("扫码登录",((Button)tag(a,"account")).getText().toString());tag(a,"tab-history").performClick();assertTrue(visibleText(root(a)).contains("登录后继续"));
        }
    }
    @Test public void closingAndPausingQrStopsPollingAndExpirationOffersNewCode()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();tag(a,"account").performClick();flush(a);assertEquals(1,qrStarts);a.onBackPressed();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(10));assertEquals(0,qrPolls);
            tag(a,"account").performClick();flush(a);c.pause().stop();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(10));assertEquals(0,qrPolls);assertNull(dialog(a));c.start().resume();
            qrStatus=AccountApi.Status.EXPIRED;tag(a,"account").performClick();flush(a);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(2201));flush(a);assertNotNull(button(dialog(a).getWindow().getDecorView(),"重新生成"));
        }
    }
    @Test public void cancellingOrPausingQrRestoresInterruptedReadWithoutWrites()throws Exception{
        for(boolean pause:new boolean[]{false,true}){
            entered=new CountDownLatch(1);release=new CountDownLatch(1);blockFirstSearch=true;
            try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
                TestActivity a=c.get();((EditText)tag(a,"search-input")).setText("slow");tag(a,"search-submit").performClick();assertTrue(entered.await(2,TimeUnit.SECONDS));
                tag(a,"account").performClick();flush(a);assertNotNull(dialog(a));blockFirstSearch=false;release.countDown();
                if(pause)c.pause().stop().start().resume();else a.onBackPressed();
                flush(a);assertNull(dialog(a));assertNotNull(tag(a,"video-0"));assertFalse((Boolean)field(a,"loading"));assertEquals(0,favoriteWrites);assertFalse(((SessionStore)field(a,"session")).hasSession());
            }
        }
    }
    @Test public void cancellingQrAfterCookiesArriveClearsPartialLogin()throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();qrStatus=AccountApi.Status.SUCCESS;blockQrVerification=true;tag(a,"account").performClick();flush(a);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(2201));assertTrue(entered.await(2,TimeUnit.SECONDS));
            SessionStore store=(SessionStore)field(a,"session");assertTrue(store.hasSession());a.onBackPressed();assertFalse(store.hasSession());release.countDown();c.pause().stop().start().resume();Thread.sleep(40);shadowOf(Looper.getMainLooper()).idle();assertNull(field(a,"profile"));assertEquals("扫码登录",((Button)tag(a,"account")).getText().toString());
        }
    }
    @Test public void artworkCannotSendRequestsToUnrelatedOrLocalHosts()throws Exception{
        assertEquals("i0.hdslb.com",ThumbnailLoader.safe("https://i0.hdslb.com/bfs/archive/demo.jpg").getHost());
        for(String url:Arrays.asList("http://i0.hdslb.com/a","https://i0.hdslb.com.evil.test/a","https://localhost/a","https://user@i0.hdslb.com/a","file:///a")){try{ThumbnailLoader.safe(url);fail(url);}catch(IOException expected){}}
    }
    @Test public void capturesChineseSearchAndAccountStates()throws Exception{capture(960,540,"",true);}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-mdpi")public void capturesEnglishSearchAndAccountStates()throws Exception{capture(960,540,".en",true);}
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi")public void capturesCompactChinese()throws Exception{capture(640,360,"-compact",false);}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi")public void capturesCompactEnglish()throws Exception{capture(640,360,"-compact.en",false);}
    private void capture(int w,int h,String suffix,boolean extra)throws Exception{
        try(ActivityController<TestActivity> c=Robolectric.buildActivity(TestActivity.class).setup().visible()){
            TestActivity a=c.get();search(a,label("摄影","photography"));layout(root(a),w,h);checkBounds(tag(a,"search-submit"),w,h);checkBounds(tag(a,"account"),w,h);checkBounds(tag(a,"video-0"),w,h);if(english())assertFalse(visibleText(root(a)).matches("(?s).*\\p{IsHan}.*"));save(root(a),w,h,"bilibili-tv"+suffix+".png");
            if(extra){tag(a,"video-0").performClick();flush(a);saveDialog(a,w,h,"bilibili-detail"+suffix+".png");a.onBackPressed();tag(a,"account").performClick();flush(a);saveDialog(a,w,h,"bilibili-login"+suffix+".png");a.onBackPressed();signIn(a);tag(a,"tab-favorites").performClick();flush(a);button(root(a),label("慢慢看  ·  4","Watch later  ·  4")).performClick();flush(a);save(root(a),w,h,"bilibili-favorites"+suffix+".png");tag(a,"tab-history").performClick();flush(a);save(root(a),w,h,"bilibili-history"+suffix+".png");}
        }
    }
    private static void checkBounds(View v,int width,int height){int[] xy=new int[2];v.getLocationOnScreen(xy);assertTrue(xy[0]>=0&&xy[1]>=0);assertTrue(xy[0]+v.getWidth()<=width);assertTrue(xy[1]+v.getHeight()<=height);}
    private static void layout(View v,int w,int h){v.measure(View.MeasureSpec.makeMeasureSpec(w,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(h,View.MeasureSpec.EXACTLY));v.layout(0,0,w,h);}
    private static void saveDialog(MainActivity a,int w,int h,String file)throws Exception{View v=dialog(a).getWindow().getDecorView();save(v,Math.min(w-40,620),Math.min(h-40,480),file);}
    private static void save(View v,int w,int h,String file)throws Exception{layout(v,w,h);String folder=System.getenv("BILIBILI_UI_CAPTURE_DIR");if(folder==null)return;new File(folder).mkdirs();Bitmap b=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888);v.draw(new Canvas(b));try(FileOutputStream out=new FileOutputStream(new File(folder,file))){b.compress(Bitmap.CompressFormat.PNG,100,out);}b.recycle();}
}
