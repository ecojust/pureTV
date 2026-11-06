package com.ecojust.bilitv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.SurfaceView;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import java.io.IOException;
import java.util.Locale;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.Future;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

/** Full-screen, remote-controlled player. Only a successfully playing stream produces history heartbeats. */
public class PlaybackActivity extends Activity {
    interface Repository {
        VideoApi.Detail detail(String bvid)throws IOException;
        VideoApi.Playback play(String bvid,long cid,int quality)throws IOException;
        boolean authenticated(); long accountGeneration();
        void heartbeat(String bvid,long cid,long seconds,boolean ended)throws IOException;
    }
    protected Repository createRepository(){
        SessionStore session=new SessionStore(this);BiliHttp http=new BiliHttp(session);VideoApi videos=new VideoApi(http);AccountApi account=new AccountApi(http,session);
        return new Repository(){
            public VideoApi.Detail detail(String bvid)throws IOException{return videos.detail(bvid);}
            public VideoApi.Playback play(String bvid,long cid,int q)throws IOException{return videos.play(bvid,cid,q);}
            public boolean authenticated(){return session.hasSession();}
            public long accountGeneration(){return session.generation();}
            public void heartbeat(String bvid,long cid,long seconds,boolean ended)throws IOException{account.heartbeat(bvid,cid,seconds,ended);}
        };
    }
    protected PlaybackEngine createEngine(SurfaceView view,PlaybackEngine.Events events){return new ExoPlaybackEngine(this,view,events);}
    private static ThreadPoolExecutor worker(String name){return new ThreadPoolExecutor(0,1,10,TimeUnit.SECONDS,new ArrayBlockingQueue<>(1),r->{Thread thread=new Thread(r,name);thread.setDaemon(true);return thread;},new ThreadPoolExecutor.DiscardOldestPolicy());}
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor resolver=worker("bilitv-play-resolve"),heartbeats=worker("bilitv-heartbeat");
    private Repository repository;private PlaybackPositionStore positions;private PlaybackEngine engine;private Future<?> pending;
    private SurfaceView surface;private FrameLayout root;private LinearLayout top,controls,center;private TextView title,status,time,qualityLabel;private Button toggle,retry;private SeekBar seek;
    private String bvid="",displayTitle="";private long cid,resumeMs,lastHeartbeatAt,accountEpoch;private int quality=64,generation,videoWidth=16,videoHeight=9;
    private boolean active,played,ended,seeking,showing=true,buffering,starting,completionReported;private VideoApi.Detail detail;
    private Runnable timeout;
    private final Runnable ticker=new Runnable(){public void run(){if(!active)return;updateProgress();if(engine!=null&&engine.isPlaying()&&SystemClock.elapsedRealtime()-lastHeartbeatAt>=30000)report(false);main.postDelayed(this,1000);}};
    private final Runnable hideControls=()->{if(active&&engine!=null&&engine.isPlaying()&&!seeking)showControls(false);};
    private boolean english(){return !getResources().getConfiguration().locale.getLanguage().equals("zh");}
    private String text(String zh,String en){return english()?en:zh;}
    private int dp(float value){return Math.round(value*getResources().getDisplayMetrics().density);}
    @Override public void onCreate(Bundle state){
        super.onCreate(state);getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        repository=createRepository();positions=new PlaybackPositionStore(this);
        bvid=getIntent().getStringExtra("bvid");cid=getIntent().getLongExtra("cid",0);resumeMs=Math.max(0,getIntent().getLongExtra("positionSeconds",0))*1000;
        displayTitle=getIntent().getStringExtra("title");if(displayTitle==null)displayTitle="BiliTV";
        if(state!=null){cid=state.getLong("cid",cid);resumeMs=state.getLong("position",resumeMs);quality=state.getInt("quality",quality);}
        buildUi();
    }
    private TextView label(String value,int size){TextView v=new TextView(this);v.setText(value);v.setTextSize(size);v.setTextColor(Color.WHITE);return v;}
    private Button button(String value,Runnable action){
        Button b=new Button(this);b.setText(value);b.setTextSize(14);b.setTextColor(Color.WHITE);b.setAllCaps(false);b.setMinWidth(dp(70));b.setMinimumWidth(dp(70));b.setMinHeight(dp(42));b.setPadding(dp(14),dp(4),dp(14),dp(4));
        b.setBackground(background(false));b.setOnFocusChangeListener((v,focused)->{b.setBackground(background(focused));b.setTextColor(focused?Color.rgb(25,29,38):Color.WHITE);});b.setOnClickListener(v->{action.run();armHide();});return b;
    }
    private GradientDrawable background(boolean focused){GradientDrawable bg=new GradientDrawable();bg.setColor(focused?Color.rgb(249,188,203):0xCC26303D);bg.setCornerRadius(dp(10));bg.setStroke(dp(2),focused?Color.WHITE:0xFF506075);return bg;}
    private void buildUi(){
        root=new FrameLayout(this);root.setBackgroundColor(Color.BLACK);setContentView(root);
        surface=new SurfaceView(this);root.addView(surface,new FrameLayout.LayoutParams(-1,-1,Gravity.CENTER));root.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->fitVideo());
        top=new LinearLayout(this);top.setGravity(Gravity.CENTER_VERTICAL);top.setPadding(dp(24),dp(16),dp(24),dp(18));top.setBackgroundColor(0xBA10151F);
        top.addView(button(text("返回","Back"),this::finish),new LinearLayout.LayoutParams(-2,dp(44)));title=label(displayTitle,19);title.setMaxLines(2);title.setTypeface(Typeface.DEFAULT,Typeface.BOLD);LinearLayout.LayoutParams titleSize=new LinearLayout.LayoutParams(0,-2,1);titleSize.leftMargin=dp(18);top.addView(title,titleSize);root.addView(top,new FrameLayout.LayoutParams(-1,-2,Gravity.TOP));
        center=new LinearLayout(this);center.setOrientation(LinearLayout.VERTICAL);center.setGravity(Gravity.CENTER);center.setPadding(dp(26),dp(20),dp(26),dp(20));center.setBackgroundColor(0xD91B2230);
        status=label(text("正在准备视频…","Preparing video…"),18);status.setGravity(Gravity.CENTER);center.addView(status,new LinearLayout.LayoutParams(-1,-2));retry=button(text("重试","Retry"),()->resolve(false));retry.setVisibility(View.GONE);LinearLayout.LayoutParams retrySize=new LinearLayout.LayoutParams(-2,dp(46));retrySize.topMargin=dp(16);center.addView(retry,retrySize);root.addView(center,new FrameLayout.LayoutParams(dp(440),-2,Gravity.CENTER));
        controls=new LinearLayout(this);controls.setOrientation(LinearLayout.VERTICAL);controls.setPadding(dp(26),dp(12),dp(26),dp(20));controls.setBackgroundColor(0xE510151F);
        LinearLayout progress=new LinearLayout(this);progress.setGravity(Gravity.CENTER_VERTICAL);seek=new SeekBar(this);seek.setMax(1000);seek.setContentDescription(text("播放进度，左右键调整","Playback position; use left or right"));progress.addView(seek,new LinearLayout.LayoutParams(0,dp(40),1));time=label("00:00 / 00:00",13);time.setPadding(dp(16),0,0,0);progress.addView(time);controls.addView(progress);
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onProgressChanged(SeekBar bar,int value,boolean user){if(user&&engine!=null&&engine.duration()>0){engine.seek(engine.duration()*value/1000);updateProgress();}}public void onStartTrackingTouch(SeekBar bar){seeking=true;}public void onStopTrackingTouch(SeekBar bar){seeking=false;armHide();}});
        LinearLayout actions=new LinearLayout(this);actions.setGravity(Gravity.CENTER_VERTICAL);toggle=button(text("暂停","Pause"),this::togglePlayback);actions.addView(toggle);addAction(actions,button(text("−10 秒","−10s"),()->jump(-10000)));addAction(actions,button(text("+10 秒","+10s"),()->jump(10000)));addAction(actions,button(text("选集","Episodes"),this::choosePart));addAction(actions,button(text("清晰度","Quality"),this::chooseQuality));qualityLabel=label("",12);qualityLabel.setPadding(dp(16),0,0,0);actions.addView(qualityLabel,new LinearLayout.LayoutParams(0,-2,1));controls.addView(actions);root.addView(controls,new FrameLayout.LayoutParams(-1,-2,Gravity.BOTTOM));toggle.requestFocus();
    }
    private void addAction(LinearLayout row,View child){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-2,dp(44));p.leftMargin=dp(10);row.addView(child,p);}
    private void fitVideo(){int w=root.getWidth(),h=root.getHeight();if(w<=0||h<=0)return;float scale=Math.min(w/(float)videoWidth,h/(float)videoHeight);FrameLayout.LayoutParams p=(FrameLayout.LayoutParams)surface.getLayoutParams();int sw=Math.round(videoWidth*scale),sh=Math.round(videoHeight*scale);if(p.width!=sw||p.height!=sh){p.width=sw;p.height=sh;surface.setLayoutParams(p);}}
    @Override protected void onResume(){super.onResume();active=true;main.post(ticker);if(bvid==null||!bvid.matches("BV[0-9A-Za-z]{10}")){fail(text("视频编号无效","Invalid video ID"));return;}resolve(true);}
    private void resolve(boolean useLocalResume){
        if(!active)return;remember(false);report(false);releaseEngine();if(pending!=null)pending.cancel(true);resolver.purge();int request=++generation;
        starting=true;played=false;ended=false;completionReported=false;buffering=true;accountEpoch=repository.accountGeneration();lastHeartbeatAt=SystemClock.elapsedRealtime();
        status.setText(text("正在获取视频…","Loading video…"));center.setVisibility(View.VISIBLE);retry.setVisibility(View.GONE);showControls(true);
        final String requestedBvid=bvid;final long requestedCid=cid;final int requestedQuality=quality;
        pending=resolver.submit(()->{
            try{
                VideoApi.Detail data=repository.detail(requestedBvid);long chosen=requestedCid;
                if(data.parts.isEmpty())throw new IOException("No playable part");
                if(chosen==0)chosen=data.parts.get(0).cid;
                boolean exists=false;for(VideoApi.Part part:data.parts)if(part.cid==chosen)exists=true;
                if(!exists)throw new IOException("The requested part is unavailable");
                VideoApi.Playback stream=repository.play(requestedBvid,chosen,requestedQuality);final long selected=chosen;
                main.post(()->{if(!active||request!=generation)return;detail=data;cid=selected;title.setText(data.video.title);if(useLocalResume&&resumeMs==0)resumeMs=positions.get(bvid,cid);start(stream,request);});
            }catch(Exception error){main.post(()->{if(active&&request==generation)fail(errorText(error));});}
        });
        armTimeout(request);
    }
    private void start(VideoApi.Playback stream,int request){
        qualityLabel.setText(qualityName(stream.quality));
        engine=createEngine(surface,new PlaybackEngine.Events(){
            public void state(boolean loading,boolean playing,boolean complete){
                if(!active||request!=generation)return;buffering=loading;
                if(playing){played=true;starting=false;center.setVisibility(View.GONE);cancelTimeout();armHide();}
                else if(loading){center.setVisibility(View.VISIBLE);status.setText(text("正在缓冲…","Buffering…"));retry.setVisibility(View.GONE);armTimeout(request);}
                else if(!starting){cancelTimeout();center.setVisibility(View.GONE);}
                toggle.setText(playing?text("暂停","Pause"):text("播放","Play"));
                if(complete&&!ended){ended=true;remember(true);report(true);showControls(true);status.setText(text("播放完毕","Playback finished"));center.setVisibility(View.VISIBLE);}
            }
            public void error(){if(active&&request==generation)fail(text("播放失败，请检查网络后重试；此电视可能不支持该编码。","Playback failed. Check your connection and retry; this TV may not support the codec."));}
            public void size(int w,int h){videoWidth=w;videoHeight=h;fitVideo();}
        });
        try{engine.prepare(stream,resumeMs);}catch(RuntimeException failure){fail(text("无法启动播放器，请重试","Unable to start playback. Please retry."));}
    }
    private String errorText(Exception error){
        if(error instanceof BiliHttp.ApiException){BiliHttp.ApiException api=(BiliHttp.ApiException)error;switch(api.kind){
            case AUTH_REQUIRED:return text("请返回首页扫码登录后重试","Sign in from the home screen and try again.");
            case RESTRICTED:return text("该视频暂不可用或需要账号对应的观看权限","This video is unavailable or requires access granted to your account.");
            case RATE_LIMITED:return text("服务暂时限制访问，请稍后重试","The service is limiting requests. Please try later.");
            case NOT_FOUND:return text("视频已不存在或不可见","The video is no longer available.");
            default:break;
        }}return text("无法获取视频，请检查网络后重试","Unable to load the video. Check your connection and retry.");
    }
    private void armTimeout(int request){if(timeout!=null)return;timeout=()->{timeout=null;if(active&&request==generation)fail(text("视频加载超时，请重试","Video loading timed out. Please retry."));};main.postDelayed(timeout,30000);}
    private void cancelTimeout(){if(timeout!=null)main.removeCallbacks(timeout);timeout=null;}
    private void fail(String message){cancelTimeout();if(pending!=null)pending.cancel(true);generation++;remember(false);report(false);releaseEngine();starting=false;buffering=false;status.setText(message);center.setVisibility(View.VISIBLE);retry.setVisibility(View.VISIBLE);showControls(true);retry.requestFocus();}
    private void releaseEngine(){if(engine!=null){PlaybackEngine old=engine;engine=null;old.release();}cancelTimeout();}
    private void togglePlayback(){if(engine==null){resolve(false);return;}if(ended){ended=false;completionReported=false;engine.seek(0);}if(engine.isPlaying()){engine.pause();showControls(true);report(false);}else{engine.play();armHide();}}
    private void jump(long delta){if(engine==null)return;engine.seek(Math.max(0,engine.position()+delta));updateProgress();showControls(true);armHide();}
    private void chooseQuality(){String[] names={"1080p","720p","480p","360p"};int[] codes={80,64,32,16};int selected=1;for(int i=0;i<codes.length;i++)if(codes[i]==quality)selected=i;new AlertDialog.Builder(this).setTitle(text("按账号权限获取可用清晰度","Request an available quality")) .setSingleChoiceItems(names,selected,(dialog,which)->{quality=codes[which];dialog.dismiss();resolve(false);}).setNegativeButton(text("取消","Cancel"),null).show();}
    private void choosePart(){if(detail==null||detail.parts.isEmpty())return;String[] titles=new String[detail.parts.size()];int selected=0;for(int i=0;i<titles.length;i++){VideoApi.Part part=detail.parts.get(i);titles[i]="P"+part.page+" · "+part.title;if(part.cid==cid)selected=i;}new AlertDialog.Builder(this).setTitle(text("选择分集","Choose an episode")).setSingleChoiceItems(titles,selected,(dialog,which)->{remember(false);report(false);releaseEngine();cid=detail.parts.get(which).cid;resumeMs=0;dialog.dismiss();resolve(true);}).setNegativeButton(text("取消","Cancel"),null).show();}
    private static String qualityName(int q){switch(q){case 80:return "1080p";case 64:return "720p";case 32:return "480p";case 16:return "360p";default:return "Q"+q;}}
    private static String timestamp(long ms){long s=Math.max(0,ms/1000);return s>=3600?String.format(Locale.US,"%d:%02d:%02d",s/3600,(s/60)%60,s%60):String.format(Locale.US,"%02d:%02d",s/60,s%60);}
    private void updateProgress(){if(engine==null)return;long pos=engine.position(),duration=engine.duration();time.setText(timestamp(pos)+" / "+timestamp(duration));if(!seeking)seek.setProgress(duration>0?(int)Math.min(1000,pos*1000/duration):0);seek.setEnabled(duration>0);}
    private void showControls(boolean show){showing=show;top.setVisibility(show?View.VISIBLE:View.GONE);controls.setVisibility(show?View.VISIBLE:View.GONE);if(show)main.removeCallbacks(hideControls);}
    private void armHide(){main.removeCallbacks(hideControls);if(active)main.postDelayed(hideControls,5000);}
    private void remember(boolean complete){if(engine!=null&&played){resumeMs=complete?0:engine.position();positions.save(bvid,cid,resumeMs,complete);}}
    private void report(boolean complete){
        if((complete&&completionReported)||!played||engine==null||!repository.authenticated()||repository.accountGeneration()!=accountEpoch)return;
        if(complete)completionReported=true;
        long now=SystemClock.elapsedRealtime();if(!complete&&now-lastHeartbeatAt<5000)return;
        final String video=bvid;final long part=cid,seconds=engine.position()/1000,epoch=accountEpoch;lastHeartbeatAt=now;
        heartbeats.execute(()->{if(repository.authenticated()&&repository.accountGeneration()==epoch)try{repository.heartbeat(video,part,seconds,complete);}catch(IOException ignored){/* Reading or playback remains usable when history sync is unavailable. */}});
    }
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(event.getAction()!=KeyEvent.ACTION_DOWN)return super.dispatchKeyEvent(event);
        int code=event.getKeyCode();
        if(code==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE||code==KeyEvent.KEYCODE_SPACE){togglePlayback();return true;}
        if(code==KeyEvent.KEYCODE_MEDIA_PLAY){if(engine!=null)engine.play();return true;}
        if(code==KeyEvent.KEYCODE_MEDIA_PAUSE){if(engine!=null)engine.pause();report(false);return true;}
        if(code==KeyEvent.KEYCODE_MEDIA_FAST_FORWARD){jump(10000);return true;}
        if(code==KeyEvent.KEYCODE_MEDIA_REWIND){jump(-10000);return true;}
        if(!showing){if(code==KeyEvent.KEYCODE_DPAD_LEFT||code==KeyEvent.KEYCODE_DPAD_RIGHT){jump(code==KeyEvent.KEYCODE_DPAD_LEFT?-10000:10000);return true;}if(code==KeyEvent.KEYCODE_DPAD_CENTER||code==KeyEvent.KEYCODE_ENTER){togglePlayback();showControls(true);toggle.requestFocus();return true;}if(code==KeyEvent.KEYCODE_DPAD_UP||code==KeyEvent.KEYCODE_DPAD_DOWN){showControls(true);toggle.requestFocus();armHide();return true;}}
        armHide();return super.dispatchKeyEvent(event);
    }
    @Override public void onBackPressed(){finish();}
    @Override protected void onSaveInstanceState(Bundle state){remember(false);state.putLong("cid",cid);state.putLong("position",resumeMs);state.putInt("quality",quality);super.onSaveInstanceState(state);}
    @Override protected void onPause(){active=false;generation++;if(pending!=null)pending.cancel(true);remember(ended);report(ended);releaseEngine();main.removeCallbacksAndMessages(null);super.onPause();}
    @Override protected void onDestroy(){resolver.shutdownNow();heartbeats.shutdown();releaseEngine();super.onDestroy();}
}
