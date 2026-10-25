package com.ecojust.cctvlive;

import android.app.*;
import android.content.*;
import android.content.res.ColorStateList;
import android.graphics.*;
import android.graphics.drawable.*;
import android.os.*;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.*;
import android.widget.*;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.*;

/** TV-first channel browser. Channel identity and every stream URL come from channels.m3u. */
public class MainActivity extends Activity implements SurfaceHolder.Callback, LivePlayer.Events {
    private static final int BG=0xff0b0d12, PANEL=0xff13161e, LINE=0xff282d39, TEXT=0xfff3f4f8, MUTED=0xff969cae, RED=0xffee5269;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final Set<String> favourites=new LinkedHashSet<>();
    private final List<ChannelCatalog.Channel> channels=new ArrayList<>(), shown=new ArrayList<>();
    private final Set<Integer> attempted=new HashSet<>();
    private final Channels adapter=new Channels();
    private SharedPreferences preferences;
    LivePlayer live;
    ChannelCatalog.Channel current;
    int routeIndex;
    boolean fullscreen;
    ListView channelList;
    private boolean active, favouriteMode;
    private int selectionEpoch, videoWidth=16, videoHeight=9;
    private float scale=1f;
    private LinearLayout root,header,body,side,right,footer;
    private FrameLayout stage;
    private SurfaceView surface;
    private BroadcastBackdrop backdrop;
    private LinearLayout messagePanel;
    private ProgressBar spinner;
    private TextView clock,date,count,empty,title,routeLabel,status,stageCode,message,subtitle,hints;
    private Button allTab,favouritesTab,playButton,routeButton,favouriteButton,fullButton;
    private AlertDialog routeDialog;
    private Runnable fallback;
    private final Runnable hideControls=()->{if(fullscreen&&active&&routeDialog==null&&live.state()==LivePlayer.State.PLAYING)showControls(false,false);};
    private final Runnable clockTick=new Runnable(){@Override public void run(){updateClock();if(active)main.postDelayed(this,30000);}};

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        scale=Math.max(.5f,Math.min(getResources().getConfiguration().screenWidthDp/960f,getResources().getConfiguration().screenHeightDp/540f));
        preferences=getSharedPreferences("cctv-live",MODE_PRIVATE);
        live=new LivePlayer(this,this);
        String error=null;
        try{channels.addAll(ChannelCatalog.load(this));}catch(IOException e){error=getString(R.string.catalog_error);}
        Set<String> saved=preferences.getStringSet("favourites",Collections.emptySet());
        String last=preferences.getString("last_channel","");
        for(ChannelCatalog.Channel channel:channels){if(saved.contains(channel.id))favourites.add(channel.id);if(channel.id.equals(last))current=channel;}
        if(current==null&&!channels.isEmpty())current=channels.get(0);
        favouriteMode=state!=null&&state.getBoolean("favourite_mode",false);
        buildUi();refreshList();changed();
        if(error!=null){message.setText(R.string.catalog_empty);subtitle.setText(error);}
        channelList.setSelection(Math.max(0,shown.indexOf(current)));
        channelList.requestFocus();
    }
    private void buildUi(){
        root=column();root.setBackgroundColor(BG);root.setPadding(dp(26),dp(16),dp(26),dp(10));
        header=row();header.setPadding(dp(2),0,dp(2),dp(12));
        LinearLayout brand=column();TextView wordmark=text("CCTV  LIVE",10,MUTED);wordmark.setLetterSpacing(.19f);wordmark.setTextColor(RED);brand.addView(wordmark);
        TextView app=text(getString(R.string.app_name),25,TEXT);app.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));brand.addView(app);header.addView(brand,new LinearLayout.LayoutParams(0,-2,1));
        count=text("",11,MUTED);count.setGravity(Gravity.CENTER);count.setPadding(dp(12),dp(7),dp(12),dp(7));count.setBackground(shape(PANEL,LINE,20));header.addView(count);
        LinearLayout time=column();time.setGravity(Gravity.RIGHT);time.setPadding(dp(22),0,0,0);clock=text("",23,TEXT);clock.setTypeface(Typeface.create("sans-serif-light",Typeface.NORMAL));date=text("",10,MUTED);time.addView(clock);time.addView(date);header.addView(time);root.addView(header,new LinearLayout.LayoutParams(-1,dp(64)));
        body=row();body.setGravity(Gravity.TOP);root.addView(body,new LinearLayout.LayoutParams(-1,0,1));
        side=column();side.setPadding(dp(10),dp(10),dp(10),dp(8));side.setBackground(shape(PANEL,LINE,14));
        LinearLayout.LayoutParams sideParams=new LinearLayout.LayoutParams(dp(208),-1);sideParams.rightMargin=dp(18);body.addView(side,sideParams);
        LinearLayout tabs=row();tabs.setGravity(Gravity.TOP);allTab=button(R.string.all_channels,()->setCategory(false),"tab-all");favouritesTab=button(R.string.favourites,()->setCategory(true),"tab-favourites");
        for(Button tab:new Button[]{allTab,favouritesTab}){tab.setTextSize(TypedValue.COMPLEX_UNIT_PX,dp(11));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(0,dp(35),1);p.setMargins(dp(2),0,dp(2),dp(10));tabs.addView(tab,p);}side.addView(tabs);
        FrameLayout listFrame=new FrameLayout(this);side.addView(listFrame,new LinearLayout.LayoutParams(-1,0,1));
        channelList=new ListView(this);channelList.setId(View.generateViewId());channelList.setTag("channel-list");channelList.setDivider(new android.graphics.drawable.ColorDrawable(Color.TRANSPARENT));channelList.setDividerHeight(dp(4));channelList.setSelector(R.drawable.list_focus);channelList.setDrawSelectorOnTop(true);channelList.setOverScrollMode(View.OVER_SCROLL_NEVER);channelList.setScrollbarFadingEnabled(false);channelList.setScrollBarSize(dp(3));channelList.setAdapter(adapter);channelList.setItemsCanFocus(false);
        channelList.setOnItemClickListener((parent,view,position,id)->choose(shown.get(position),0,true));
        listFrame.addView(channelList,new FrameLayout.LayoutParams(-1,-1));empty=text("",13,MUTED);empty.setGravity(Gravity.CENTER);empty.setPadding(dp(10),dp(18),dp(10),dp(18));listFrame.addView(empty,new FrameLayout.LayoutParams(-1,-1));channelList.setEmptyView(empty);
        right=column();body.addView(right,new LinearLayout.LayoutParams(0,-1,1));
        stage=new FrameLayout(this);stage.setId(View.generateViewId());stage.setTag("screen");stage.setFocusable(true);stage.setContentDescription(getString(R.string.playback_area));stage.setBackground(shape(Color.BLACK,LINE,14));stage.setClipToOutline(true);right.addView(stage,new LinearLayout.LayoutParams(-1,0,1));
        surface=new SurfaceView(this);surface.setTag("video-surface");stage.addView(surface,new FrameLayout.LayoutParams(1,1,Gravity.CENTER));surface.getHolder().addCallback(this);
        backdrop=new BroadcastBackdrop();stage.addView(backdrop,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout top=row();top.setPadding(dp(20),dp(14),dp(20),0);stageCode=text("",15,TEXT);stageCode.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));top.addView(stageCode,new LinearLayout.LayoutParams(0,-2,1));status=text("",10,MUTED);status.setTag("status");status.setPadding(dp(10),dp(5),dp(10),dp(5));status.setBackground(shape(0xb0181b23,0,12));top.addView(status);stage.addView(top,new FrameLayout.LayoutParams(-1,-2,Gravity.TOP));
        messagePanel=column();messagePanel.setGravity(Gravity.CENTER);messagePanel.setPadding(dp(24),dp(40),dp(24),dp(38));
        spinner=new ProgressBar(this);spinner.setIndeterminateTintList(ColorStateList.valueOf(RED));messagePanel.addView(spinner,new LinearLayout.LayoutParams(dp(26),dp(26)));
        message=text("",32,TEXT);message.setTag("message");message.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));message.setGravity(Gravity.CENTER);message.setMaxLines(2);messagePanel.addView(message,new LinearLayout.LayoutParams(-1,-2));
        subtitle=text("",12,MUTED);subtitle.setGravity(Gravity.CENTER);subtitle.setMaxLines(3);subtitle.setPadding(0,dp(12),0,0);messagePanel.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));stage.addView(messagePanel,new FrameLayout.LayoutParams(-1,-1));
        stage.setOnClickListener(v->{if(fullscreen)showControls(footer.getVisibility()!=View.VISIBLE,true);else setFullscreen(true);});
        stage.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->layoutVideo());
        footer=row();footer.setPadding(dp(2),dp(10),dp(2),dp(5));LinearLayout identity=column();title=text("",16,TEXT);title.setSingleLine(true);title.setEllipsize(TextUtils.TruncateAt.END);title.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));identity.addView(title);routeLabel=text("",10,MUTED);routeLabel.setSingleLine(true);routeLabel.setEllipsize(TextUtils.TruncateAt.END);routeLabel.setPadding(0,dp(5),0,0);identity.addView(routeLabel);LinearLayout.LayoutParams identityParams=new LinearLayout.LayoutParams(0,-2,1);identityParams.rightMargin=dp(10);footer.addView(identity,identityParams);
        playButton=button(R.string.play,this::togglePlay,"play");routeButton=button(R.string.routes,this::routes,"routes");favouriteButton=button(R.string.favourite,this::toggleFavourite,"favourite");fullButton=button(R.string.fullscreen,()->setFullscreen(!fullscreen),"fullscreen");
        boolean en=english();int[] widths=en?new int[]{83,94,80,88}:new int[]{76,72,60,60};Button[] controls={playButton,routeButton,favouriteButton,fullButton};
        for(int i=0;i<controls.length;i++){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(widths[i]),dp(39));p.leftMargin=dp(6);footer.addView(controls[i],p);}right.addView(footer,new LinearLayout.LayoutParams(-1,dp(66)));
        hints=text(getString(R.string.hints),10,MUTED);hints.setGravity(Gravity.CENTER);hints.setSingleLine(true);hints.setEllipsize(TextUtils.TruncateAt.END);root.addView(hints,new LinearLayout.LayoutParams(-1,dp(22)));
        channelList.setNextFocusRightId(playButton.getId());channelList.setNextFocusUpId(allTab.getId());playButton.setNextFocusLeftId(channelList.getId());playButton.setNextFocusUpId(stage.getId());stage.setNextFocusDownId(playButton.getId());allTab.setNextFocusDownId(channelList.getId());favouritesTab.setNextFocusDownId(channelList.getId());
        setContentView(root);updateClock();
    }
    @Override protected void onStart(){super.onStart();active=true;live.activate();main.post(clockTick);}
    @Override protected void onStop(){active=false;selectionEpoch++;main.removeCallbacksAndMessages(null);fallback=null;if(routeDialog!=null)routeDialog.dismiss();live.suspend();root.setKeepScreenOn(false);super.onStop();}
    @Override protected void onDestroy(){surface.getHolder().removeCallback(this);live.close();main.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putBoolean("favourite_mode",favouriteMode);}
    @Override public void surfaceCreated(SurfaceHolder holder){live.surface(holder);}
    @Override public void surfaceChanged(SurfaceHolder holder,int format,int width,int height){layoutVideo();}
    @Override public void surfaceDestroyed(SurfaceHolder holder){live.surface(null);}
    private void updateClock(){Locale locale=getResources().getConfiguration().getLocales().get(0);Date now=new Date();clock.setText(new SimpleDateFormat("HH:mm",locale).format(now));date.setText(new SimpleDateFormat("MM/dd E",locale).format(now));}
    private void setCategory(boolean saved){favouriteMode=saved;refreshList();channelList.requestFocus();}
    private void refreshList(){
        shown.clear();for(ChannelCatalog.Channel channel:channels)if(!favouriteMode||favourites.contains(channel.id))shown.add(channel);
        allTab.setSelected(!favouriteMode);favouritesTab.setSelected(favouriteMode);count.setText(getString(R.string.channel_count,channels.size()));
        empty.setText(channels.isEmpty()?getString(R.string.catalog_error):getString(R.string.empty_favourites)+"\n\n"+getString(R.string.empty_hint));adapter.notifyDataSetChanged();
    }
    private void choose(ChannelCatalog.Channel channel,int route,boolean reset){
        if(channel==null||route<0||route>=channel.routes.size())return;
        if(current!=channel&&routeDialog!=null)routeDialog.dismiss();
        selectionEpoch++;if(fallback!=null)main.removeCallbacks(fallback);fallback=null;
        current=channel;routeIndex=route;if(reset)attempted.clear();attempted.add(route);
        preferences.edit().putString("last_channel",channel.id).apply();adapter.notifyDataSetChanged();backdrop.invalidate();
        live.play(channel.routes.get(route).url);changed();
    }
    private void togglePlay(){
        if(current==null)return;
        if(live.state()==LivePlayer.State.PLAYING||live.state()==LivePlayer.State.LOADING){selectionEpoch++;if(fallback!=null)main.removeCallbacks(fallback);fallback=null;live.pause();}
        else choose(current,routeIndex,true);
    }
    private void toggleFavourite(){if(current==null)return;if(!favourites.add(current.id))favourites.remove(current.id);preferences.edit().putStringSet("favourites",new LinkedHashSet<>(favourites)).apply();refreshList();changed();}
    private void routes(){
        if(current==null||routeDialog!=null)return;main.removeCallbacks(hideControls);
        ChannelCatalog.Channel channel=current;String[] labels=new String[channel.routes.size()];for(int i=0;i<labels.length;i++)labels[i]=channel.routes.get(i).displayName(this);
        AlertDialog value=new AlertDialog.Builder(this).setTitle(R.string.route_title).setSingleChoiceItems(labels,routeIndex,(dialog,index)->{dialog.dismiss();choose(channel,index,true);}).setNegativeButton(R.string.close,null).create();
        routeDialog=value;value.setOnDismissListener(dialog->{if(routeDialog==value)routeDialog=null;scheduleHide();});value.show();
    }
    @Override public void next(){step(1);}
    @Override public void previous(){step(-1);}
    private void step(int direction){List<ChannelCatalog.Channel> choices=shown.isEmpty()?channels:shown;if(choices.isEmpty())return;int index=choices.indexOf(current);if(index<0)index=direction>0?-1:0;choose(choices.get((index+direction+choices.size())%choices.size()),0,true);channelList.setSelection(Math.max(0,shown.indexOf(current)));showControls(true,false);}
    private void setFullscreen(boolean value){
        if(current==null||fullscreen==value)return;fullscreen=value;header.setVisibility(value?View.GONE:View.VISIBLE);side.setVisibility(value?View.GONE:View.VISIBLE);hints.setVisibility(value?View.GONE:View.VISIBLE);
        root.setPadding(value?0:dp(26),value?0:dp(16),value?0:dp(26),value?0:dp(10));
        ((android.view.ViewGroup)footer.getParent()).removeView(footer);
        if(value){footer.setBackgroundColor(0xee10131a);footer.setPadding(dp(24),dp(12),dp(24),dp(12));stage.addView(footer,new FrameLayout.LayoutParams(-1,dp(72),Gravity.BOTTOM));}
        else{footer.setBackgroundColor(Color.TRANSPARENT);footer.setPadding(dp(2),dp(10),dp(2),dp(5));right.addView(footer,new LinearLayout.LayoutParams(-1,dp(66)));}
        fullButton.setText(value?R.string.exit_fullscreen:R.string.fullscreen);LinearLayout.LayoutParams fullSize=(LinearLayout.LayoutParams)fullButton.getLayoutParams();fullSize.width=dp(english()?(value?112:88):(value?88:60));fullButton.setLayoutParams(fullSize);showControls(true,false);
        if(value)stage.requestFocus();else{channelList.setSelection(Math.max(0,shown.indexOf(current)));channelList.requestFocus();}layoutVideo();
    }
    private void showControls(boolean show,boolean focus){footer.setVisibility(!fullscreen||show?View.VISIBLE:View.GONE);if(fullscreen){if(show&&focus)playButton.requestFocus();else if(!show)stage.requestFocus();}scheduleHide();}
    private void scheduleHide(){main.removeCallbacks(hideControls);if(fullscreen&&active&&footer.getVisibility()==View.VISIBLE&&routeDialog==null&&live.state()==LivePlayer.State.PLAYING)main.postDelayed(hideControls,4500);}
    @Override public void changed(){
        if(root==null||title==null)return;LivePlayer.State state=live.state();boolean available=current!=null;
        String display=available?current.displayName(this):getString(R.string.catalog_empty);
        title.setText(display);stageCode.setText(available?code(current):"CCTV");
        routeLabel.setText(available?getString(R.string.route_detail,current.routes.get(routeIndex).displayName(this),current.routes.size()):"");
        for(Button control:new Button[]{playButton,routeButton,favouriteButton,fullButton})control.setEnabled(available);
        favouriteButton.setText(available&&favourites.contains(current.id)?R.string.favourited:R.string.favourite);favouriteButton.setSelected(available&&favourites.contains(current.id));
        backdrop.setVisibility(state==LivePlayer.State.PLAYING?View.GONE:View.VISIBLE);messagePanel.setVisibility(state==LivePlayer.State.PLAYING?View.GONE:View.VISIBLE);spinner.setVisibility(state==LivePlayer.State.LOADING?View.VISIBLE:View.GONE);
        playButton.setText(state==LivePlayer.State.PLAYING||state==LivePlayer.State.LOADING?R.string.pause:state==LivePlayer.State.ERROR?R.string.retry:state==LivePlayer.State.PAUSED?R.string.resume:R.string.play);
        status.setText(state==LivePlayer.State.PLAYING?R.string.live:state==LivePlayer.State.LOADING?R.string.loading_video:state==LivePlayer.State.ERROR?R.string.error_title:state==LivePlayer.State.PAUSED?R.string.paused:R.string.ready);status.setTextColor(state==LivePlayer.State.PLAYING?RED:MUTED);
        message.setText(state==LivePlayer.State.ERROR?getString(R.string.error_title):available?description(current):getString(R.string.catalog_empty));
        message.setTextSize(TypedValue.COMPLEX_UNIT_PX,dp(state==LivePlayer.State.ERROR?23:32));
        subtitle.setText(state==LivePlayer.State.LOADING?getString(R.string.loading_video):state==LivePlayer.State.ERROR?live.error():state==LivePlayer.State.PAUSED?getString(R.string.paused):getString(R.string.idle_hint));
        if(state==LivePlayer.State.ERROR&&active&&available){
            int next=-1;for(int i=0;i<current.routes.size();i++)if(!attempted.contains(i)){next=i;break;}
            if(next>=0&&fallback==null){final int index=next,ticket=selectionEpoch;final ChannelCatalog.Channel channel=current;subtitle.setText(R.string.switching_route);fallback=()->{fallback=null;if(active&&ticket==selectionEpoch&&current==channel&&live.state()==LivePlayer.State.ERROR)choose(channel,index,false);};main.post(fallback);}
            else if(next<0){showControls(true,false);playButton.requestFocus();}
        }
        if(state!=LivePlayer.State.PLAYING)showControls(true,false);else scheduleHide();
        root.setKeepScreenOn(active&&(state==LivePlayer.State.LOADING||state==LivePlayer.State.PLAYING));adapter.notifyDataSetChanged();
    }
    @Override public void size(int width,int height){videoWidth=width;videoHeight=height;layoutVideo();}
    private void layoutVideo(){if(stage==null||surface==null)return;int[] size=fit(stage.getWidth(),stage.getHeight(),videoWidth,videoHeight);FrameLayout.LayoutParams p=(FrameLayout.LayoutParams)surface.getLayoutParams();if(p.width!=size[0]||p.height!=size[1]){p.width=size[0];p.height=size[1];surface.setLayoutParams(p);}}
    static int[] fit(int width,int height,int videoWidth,int videoHeight){if(width<=0||height<=0||videoWidth<=0||videoHeight<=0)return new int[]{1,1};double factor=Math.min((double)width/videoWidth,(double)height/videoHeight);return new int[]{Math.max(1,(int)Math.round(videoWidth*factor)),Math.max(1,(int)Math.round(videoHeight*factor))};}
    @Override public void onBackPressed(){if(fullscreen)setFullscreen(false);else super.onBackPressed();}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(fullscreen&&routeDialog==null&&event.getAction()==KeyEvent.ACTION_DOWN)scheduleHide();
        int key=event.getKeyCode();boolean next=key==KeyEvent.KEYCODE_CHANNEL_UP||key==KeyEvent.KEYCODE_MEDIA_NEXT||(fullscreen&&key==KeyEvent.KEYCODE_DPAD_DOWN);
        boolean previous=key==KeyEvent.KEYCODE_CHANNEL_DOWN||key==KeyEvent.KEYCODE_MEDIA_PREVIOUS||(fullscreen&&key==KeyEvent.KEYCODE_DPAD_UP);
        boolean confirm=fullscreen&&(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)&&getCurrentFocus()==stage;
        boolean media=key==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE||key==KeyEvent.KEYCODE_MEDIA_PLAY||key==KeyEvent.KEYCODE_MEDIA_PAUSE;
        if(routeDialog==null&&(next||previous||confirm||media||key==KeyEvent.KEYCODE_MENU)){
            if(event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0){if(next)step(1);else if(previous)step(-1);else if(confirm)showControls(true,true);else if(key==KeyEvent.KEYCODE_MENU)routes();else if(key==KeyEvent.KEYCODE_MEDIA_PLAY){if(current!=null&&live.state()!=LivePlayer.State.PLAYING&&live.state()!=LivePlayer.State.LOADING)choose(current,routeIndex,true);}else if(key==KeyEvent.KEYCODE_MEDIA_PAUSE)live.pause();else togglePlay();}return true;
        }
        return super.dispatchKeyEvent(event);
    }
    private String code(ChannelCatalog.Channel channel){String name=channel.displayName(this);int space=name.indexOf(' ');return space<0?name:name.substring(0,space);}
    private String description(ChannelCatalog.Channel channel){String name=channel.displayName(this);int space=name.indexOf(' ');return space<0?name:name.substring(space+1);}
    private boolean english(){return "en".equals(getResources().getConfiguration().getLocales().get(0).getLanguage());}
    private int dp(float value){return Math.max(value==0?0:1,Math.round(value*scale*getResources().getDisplayMetrics().density));}
    private LinearLayout column(){LinearLayout value=new LinearLayout(this);value.setOrientation(LinearLayout.VERTICAL);return value;}
    private LinearLayout row(){LinearLayout value=new LinearLayout(this);value.setOrientation(LinearLayout.HORIZONTAL);value.setGravity(Gravity.CENTER_VERTICAL);return value;}
    private TextView text(String value,int size,int color){TextView view=new TextView(this);view.setText(value);view.setTextSize(TypedValue.COMPLEX_UNIT_PX,dp(size));view.setTextColor(color);view.setFontFeatureSettings("kern");view.setIncludeFontPadding(false);return view;}
    private GradientDrawable shape(int color,int stroke,int radius){GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));if(stroke!=0)d.setStroke(dp(1),stroke);return d;}
    private Button button(int label,Runnable click,String tag){
        Button button=new Button(this);button.setId(View.generateViewId());button.setTag(tag);button.setText(label);button.setAllCaps(false);button.setTextSize(TypedValue.COMPLEX_UNIT_PX,dp(11));button.setPadding(dp(6),0,dp(6),0);button.setMinHeight(0);button.setMinimumHeight(0);button.setMinWidth(0);button.setMinimumWidth(0);button.setSingleLine(true);button.setEllipsize(TextUtils.TruncateAt.END);button.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));
        StateListDrawable background=new StateListDrawable();background.addState(new int[]{android.R.attr.state_focused},shape(TEXT,TEXT,9));background.addState(new int[]{android.R.attr.state_pressed},shape(0xffd7d9e0,TEXT,9));background.addState(new int[]{android.R.attr.state_selected},shape(0xff47212c,0xffa1394d,9));background.addState(new int[]{},shape(0xff20242e,LINE,9));button.setBackground(background);
        button.setTextColor(new ColorStateList(new int[][]{{-android.R.attr.state_enabled},{android.R.attr.state_focused},{android.R.attr.state_pressed},{}},new int[]{0xff626879,BG,BG,TEXT}));button.setOnClickListener(v->click.run());return button;
    }
    private final class Channels extends BaseAdapter {
        @Override public int getCount(){return shown.size();}@Override public ChannelCatalog.Channel getItem(int position){return shown.get(position);}@Override public long getItemId(int position){return position;}
        @Override public View getView(int position,View convert,ViewGroup parent){
            ChannelCatalog.Channel channel=shown.get(position);boolean selected=current==channel;LinearLayout row=row();row.setPadding(dp(10),dp(8),dp(10),dp(8));row.setLayoutParams(new AbsListView.LayoutParams(-1,dp(53)));row.setBackground(shape(selected?0xff39202b:0xff171b24,selected?0xff733042:0,9));row.setContentDescription(channel.displayName(MainActivity.this));
            TextView number=text(String.format(Locale.ROOT,"%02d",channels.indexOf(channel)+1),10,selected?RED:0xff626a7f);row.addView(number,new LinearLayout.LayoutParams(dp(25),-2));
            LinearLayout labels=column();TextView code=text(code(channel),14,TEXT);code.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));labels.addView(code);TextView name=text(description(channel),10,selected?0xffc7b3bd:MUTED);name.setSingleLine(true);name.setEllipsize(TextUtils.TruncateAt.END);name.setPadding(0,dp(6),0,0);labels.addView(name);row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
            TextView mark=text(selected&&live.state()==LivePlayer.State.PLAYING?"●":favourites.contains(channel.id)?"★":"",10,RED);row.addView(mark,new LinearLayout.LayoutParams(dp(14),-2));return row;
        }
    }
    private final class BroadcastBackdrop extends View {
        private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
        BroadcastBackdrop(){super(MainActivity.this);setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);}
        @Override protected void onDraw(Canvas canvas){
            float w=getWidth(),h=getHeight();paint.setShader(new LinearGradient(0,0,w,h,new int[]{0xff211723,0xff161a25,0xff0c111a},null,Shader.TileMode.CLAMP));canvas.drawRect(0,0,w,h,paint);paint.setShader(null);
            Path band=new Path();band.moveTo(w*.68f,0);band.lineTo(w*.85f,0);band.lineTo(w*.44f,h);band.lineTo(w*.27f,h);band.close();paint.setColor(0x0ff46c79);canvas.drawPath(band,paint);
            paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(1));paint.setColor(0x14dce1f7);for(int i=0;i<4;i++)canvas.drawCircle(w*.84f,h*.43f,h*(.28f+i*.18f),paint);paint.setStyle(Paint.Style.FILL);
            String number=current==null?"01":code(current).replace("CCTV-","");paint.setTypeface(Typeface.create("sans-serif-thin",Typeface.NORMAL));paint.setTextSize(h*.68f);paint.setColor(0x0de7e8f3);paint.setTextAlign(Paint.Align.RIGHT);canvas.drawText(number,w*.97f,h*.78f,paint);paint.setTextAlign(Paint.Align.LEFT);
            paint.setColor(RED);canvas.drawRoundRect(dp(20),h-dp(27),dp(42),h-dp(25),dp(1),dp(1),paint);paint.setColor(0xff666573);paint.setTextSize(dp(8));paint.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));canvas.drawText("CCTV  /  LIVE TELEVISION",dp(50),h-dp(23),paint);
        }
    }
}
