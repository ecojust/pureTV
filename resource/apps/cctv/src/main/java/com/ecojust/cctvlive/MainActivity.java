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

/** TV-first channel browser. Channel identity and official player page URLs come from channels.m3u. */
public class MainActivity extends Activity implements CctvWebPlayer.Events {
    private static final int BG=0xff0b0d12, PANEL=0xff13161e, LINE=0xff282d39, TEXT=0xfff3f4f8, MUTED=0xff969cae, RED=0xffee5269;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final Set<String> favourites=new LinkedHashSet<>();
    private final List<ChannelCatalog.Channel> channels=new ArrayList<>(), shown=new ArrayList<>();
    private final Channels adapter=new Channels();
    private SharedPreferences preferences;
    CctvWebPlayer web;
    ChannelCatalog.Channel current;
    boolean fullscreen;
    ListView channelList;
    private boolean active, favouriteMode;
    private float scale=1f;
    private LinearLayout root,header,body,side,right,footer;
    private FrameLayout stage;
    private BroadcastBackdrop backdrop;
    private LinearLayout messagePanel;
    private ProgressBar spinner;
    private TextView clock,date,count,empty,title,pageLabel,status,stageCode,message,subtitle,hints;
    private Button allTab,favouritesTab,playButton,playerButton,favouriteButton,fullButton;
    private final Runnable hideControls=()->{if(fullscreen&&active&&web.state()==CctvWebPlayer.State.READY)showControls(false,false);};
    private final Runnable clockTick=new Runnable(){@Override public void run(){updateClock();if(active)main.postDelayed(this,30000);}};

    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        scale=Math.max(.5f,Math.min(getResources().getConfiguration().screenWidthDp/960f,getResources().getConfiguration().screenHeightDp/540f));
        preferences=getSharedPreferences("cctv-live",MODE_PRIVATE);
        web=new CctvWebPlayer(this,this);
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
        channelList.setOnItemClickListener((parent,view,position,id)->choose(shown.get(position)));
        listFrame.addView(channelList,new FrameLayout.LayoutParams(-1,-1));empty=text("",13,MUTED);empty.setGravity(Gravity.CENTER);empty.setPadding(dp(10),dp(18),dp(10),dp(18));listFrame.addView(empty,new FrameLayout.LayoutParams(-1,-1));channelList.setEmptyView(empty);
        right=column();body.addView(right,new LinearLayout.LayoutParams(0,-1,1));
        stage=new FrameLayout(this);stage.setId(View.generateViewId());stage.setTag("screen");stage.setFocusable(true);stage.setContentDescription(getString(R.string.playback_area));stage.setBackground(shape(Color.BLACK,LINE,14));stage.setClipToOutline(true);right.addView(stage,new LinearLayout.LayoutParams(-1,0,1));
        if(web.view()!=null){web.view().setTag("official-player");stage.addView(web.view(),new FrameLayout.LayoutParams(-1,-1));}
        backdrop=new BroadcastBackdrop();stage.addView(backdrop,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout top=row();top.setPadding(dp(20),dp(14),dp(20),0);stageCode=text("",15,TEXT);stageCode.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));top.addView(stageCode,new LinearLayout.LayoutParams(0,-2,1));status=text("",10,MUTED);status.setTag("status");status.setPadding(dp(10),dp(5),dp(10),dp(5));status.setBackground(shape(0xb0181b23,0,12));top.addView(status);stage.addView(top,new FrameLayout.LayoutParams(-1,-2,Gravity.TOP));
        messagePanel=column();messagePanel.setGravity(Gravity.CENTER);messagePanel.setPadding(dp(24),dp(40),dp(24),dp(38));
        spinner=new ProgressBar(this);spinner.setIndeterminateTintList(ColorStateList.valueOf(RED));messagePanel.addView(spinner,new LinearLayout.LayoutParams(dp(26),dp(26)));
        message=text("",32,TEXT);message.setTag("message");message.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));message.setGravity(Gravity.CENTER);message.setMaxLines(2);messagePanel.addView(message,new LinearLayout.LayoutParams(-1,-2));
        subtitle=text("",12,MUTED);subtitle.setGravity(Gravity.CENTER);subtitle.setMaxLines(3);subtitle.setPadding(0,dp(12),0,0);messagePanel.addView(subtitle,new LinearLayout.LayoutParams(-1,-2));stage.addView(messagePanel,new FrameLayout.LayoutParams(-1,-1));
        stage.setOnClickListener(v->{if(fullscreen)showControls(footer.getVisibility()!=View.VISIBLE,true);else setFullscreen(true);});
        footer=row();footer.setPadding(dp(2),dp(10),dp(2),dp(5));LinearLayout identity=column();title=text("",16,TEXT);title.setSingleLine(true);title.setEllipsize(TextUtils.TruncateAt.END);title.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));identity.addView(title);pageLabel=text("",10,MUTED);pageLabel.setSingleLine(true);pageLabel.setEllipsize(TextUtils.TruncateAt.END);pageLabel.setPadding(0,dp(5),0,0);identity.addView(pageLabel);LinearLayout.LayoutParams identityParams=new LinearLayout.LayoutParams(0,-2,1);identityParams.rightMargin=dp(10);footer.addView(identity,identityParams);
        playButton=button(R.string.play,this::reload,"play");playerButton=button(R.string.player,this::focusPlayer,"player");favouriteButton=button(R.string.favourite,this::toggleFavourite,"favourite");fullButton=button(R.string.fullscreen,()->setFullscreen(!fullscreen),"fullscreen");
        boolean en=english();int[] widths=en?new int[]{83,68,80,88}:new int[]{76,84,60,60};Button[] controls={playButton,playerButton,favouriteButton,fullButton};
        for(int i=0;i<controls.length;i++){LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(dp(widths[i]),dp(39));p.leftMargin=dp(6);footer.addView(controls[i],p);}right.addView(footer,new LinearLayout.LayoutParams(-1,dp(66)));
        hints=text(getString(R.string.hints),10,MUTED);hints.setGravity(Gravity.CENTER);hints.setSingleLine(true);hints.setEllipsize(TextUtils.TruncateAt.END);root.addView(hints,new LinearLayout.LayoutParams(-1,dp(22)));
        channelList.setNextFocusRightId(playButton.getId());channelList.setNextFocusUpId(allTab.getId());playButton.setNextFocusLeftId(channelList.getId());playButton.setNextFocusUpId(stage.getId());stage.setNextFocusDownId(playButton.getId());allTab.setNextFocusDownId(channelList.getId());favouritesTab.setNextFocusDownId(channelList.getId());
        setContentView(root);updateClock();
    }
    @Override protected void onStart(){super.onStart();active=true;web.activate();main.post(clockTick);}
    @Override protected void onStop(){active=false;main.removeCallbacksAndMessages(null);web.suspend();root.setKeepScreenOn(false);super.onStop();}
    @Override protected void onDestroy(){
        boolean terminate=isFinishing()&&!isChangingConfigurations();
        active=false;web.close();main.removeCallbacksAndMessages(null);root.setKeepScreenOn(false);super.onDestroy();
        if(terminate)android.os.Process.killProcess(android.os.Process.myPid());
    }
    @Override protected void onSaveInstanceState(Bundle state){super.onSaveInstanceState(state);state.putBoolean("favourite_mode",favouriteMode);}
    private void updateClock(){Locale locale=getResources().getConfiguration().getLocales().get(0);Date now=new Date();clock.setText(new SimpleDateFormat("HH:mm",locale).format(now));date.setText(new SimpleDateFormat("MM/dd E",locale).format(now));}
    private void setCategory(boolean saved){favouriteMode=saved;refreshList();channelList.requestFocus();}
    private void refreshList(){
        shown.clear();for(ChannelCatalog.Channel channel:channels)if(!favouriteMode||favourites.contains(channel.id))shown.add(channel);
        allTab.setSelected(!favouriteMode);favouritesTab.setSelected(favouriteMode);count.setText(getString(R.string.channel_count,channels.size()));
        empty.setText(channels.isEmpty()?getString(R.string.catalog_error):getString(R.string.empty_favourites)+"\n\n"+getString(R.string.empty_hint));adapter.notifyDataSetChanged();
    }
    private void choose(ChannelCatalog.Channel channel){
        if(channel==null)return;current=channel;
        preferences.edit().putString("last_channel",channel.id).apply();adapter.notifyDataSetChanged();backdrop.invalidate();
        web.load(channel.pageUrl);changed();
    }
    private void reload(){if(current!=null)choose(current);}
    private void focusPlayer(){if(web.view()!=null&&web.state()==CctvWebPlayer.State.READY){web.view().requestFocus();showControls(true,false);}}
    private void toggleFavourite(){if(current==null)return;if(!favourites.add(current.id))favourites.remove(current.id);preferences.edit().putStringSet("favourites",new LinkedHashSet<>(favourites)).apply();refreshList();changed();}
    private void step(int direction){List<ChannelCatalog.Channel> choices=shown.isEmpty()?channels:shown;if(choices.isEmpty())return;int index=choices.indexOf(current);if(index<0)index=direction>0?-1:0;choose(choices.get((index+direction+choices.size())%choices.size()));channelList.setSelection(Math.max(0,shown.indexOf(current)));showControls(true,false);}
    private void setFullscreen(boolean value){
        if(current==null||fullscreen==value)return;fullscreen=value;header.setVisibility(value?View.GONE:View.VISIBLE);side.setVisibility(value?View.GONE:View.VISIBLE);hints.setVisibility(value?View.GONE:View.VISIBLE);
        root.setPadding(value?0:dp(26),value?0:dp(16),value?0:dp(26),value?0:dp(10));
        ((android.view.ViewGroup)footer.getParent()).removeView(footer);
        if(value){footer.setBackgroundColor(0xee10131a);footer.setPadding(dp(24),dp(12),dp(24),dp(12));stage.addView(footer,new FrameLayout.LayoutParams(-1,dp(72),Gravity.BOTTOM));}
        else{footer.setBackgroundColor(Color.TRANSPARENT);footer.setPadding(dp(2),dp(10),dp(2),dp(5));right.addView(footer,new LinearLayout.LayoutParams(-1,dp(66)));}
        fullButton.setText(value?R.string.exit_fullscreen:R.string.fullscreen);LinearLayout.LayoutParams fullSize=(LinearLayout.LayoutParams)fullButton.getLayoutParams();fullSize.width=dp(english()?(value?112:88):(value?88:60));fullButton.setLayoutParams(fullSize);showControls(true,false);
        if(value)stage.requestFocus();else{channelList.setSelection(Math.max(0,shown.indexOf(current)));channelList.requestFocus();}
    }
    private void showControls(boolean show,boolean focus){footer.setVisibility(!fullscreen||show?View.VISIBLE:View.GONE);if(fullscreen){if(show&&focus)playButton.requestFocus();else if(!show)stage.requestFocus();}scheduleHide();}
    private void scheduleHide(){main.removeCallbacks(hideControls);if(fullscreen&&active&&footer.getVisibility()==View.VISIBLE&&web.state()==CctvWebPlayer.State.READY)main.postDelayed(hideControls,4500);}
    @Override public void changed(){
        if(root==null||title==null)return;CctvWebPlayer.State state=web.state();boolean available=current!=null;
        String display=available?current.displayName(this):getString(R.string.catalog_empty);
        title.setText(display);stageCode.setText(available?code(current):"CCTV");pageLabel.setText(R.string.official_site);
        for(Button control:new Button[]{playButton,favouriteButton,fullButton})control.setEnabled(available);
        playerButton.setEnabled(available&&state==CctvWebPlayer.State.READY);
        favouriteButton.setText(available&&favourites.contains(current.id)?R.string.favourited:R.string.favourite);favouriteButton.setSelected(available&&favourites.contains(current.id));
        boolean ready=state==CctvWebPlayer.State.READY;
        backdrop.setVisibility(ready?View.GONE:View.VISIBLE);messagePanel.setVisibility(ready?View.GONE:View.VISIBLE);spinner.setVisibility(state==CctvWebPlayer.State.LOADING?View.VISIBLE:View.GONE);
        playButton.setText(state==CctvWebPlayer.State.IDLE?R.string.play:state==CctvWebPlayer.State.ERROR?R.string.retry:R.string.reload);
        status.setText(ready?R.string.web_ready:state==CctvWebPlayer.State.LOADING?R.string.web_loading:state==CctvWebPlayer.State.ERROR?R.string.error_title:R.string.ready);status.setTextColor(ready?RED:MUTED);
        message.setText(state==CctvWebPlayer.State.ERROR?getString(R.string.error_title):available?description(current):getString(R.string.catalog_empty));
        message.setTextSize(TypedValue.COMPLEX_UNIT_PX,dp(state==CctvWebPlayer.State.ERROR?23:32));
        subtitle.setText(state==CctvWebPlayer.State.LOADING?getString(R.string.web_loading):state==CctvWebPlayer.State.ERROR?web.error():getString(R.string.idle_hint));
        if(!ready)showControls(true,false);else scheduleHide();
        if(state==CctvWebPlayer.State.ERROR&&active)playButton.requestFocus();
        root.setKeepScreenOn(active&&(ready||state==CctvWebPlayer.State.LOADING));adapter.notifyDataSetChanged();
    }
    private void exitApplication(){
        active=false;main.removeCallbacksAndMessages(null);web.close();root.setKeepScreenOn(false);
        // apply() is asynchronous; flush the tiny selection record before ending our process.
        SharedPreferences.Editor saved=preferences.edit().putStringSet("favourites",new LinkedHashSet<>(favourites));
        if(current!=null)saved.putString("last_channel",current.id);
        saved.commit();finishAndRemoveTask();
    }
    @Override public void onBackPressed(){if(fullscreen)setFullscreen(false);else if(web.view()!=null&&web.view().hasFocus())channelList.requestFocus();else exitApplication();}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        if(fullscreen&&event.getAction()==KeyEvent.ACTION_DOWN)scheduleHide();
        int key=event.getKeyCode();boolean next=key==KeyEvent.KEYCODE_CHANNEL_UP||key==KeyEvent.KEYCODE_MEDIA_NEXT||(fullscreen&&key==KeyEvent.KEYCODE_DPAD_DOWN);
        boolean previous=key==KeyEvent.KEYCODE_CHANNEL_DOWN||key==KeyEvent.KEYCODE_MEDIA_PREVIOUS||(fullscreen&&key==KeyEvent.KEYCODE_DPAD_UP);
        boolean confirm=fullscreen&&(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)&&getCurrentFocus()==stage;
        if(next||previous||confirm||key==KeyEvent.KEYCODE_MENU){
            if(event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0){if(next)step(1);else if(previous)step(-1);else if(confirm)showControls(true,true);else{if(fullscreen)setFullscreen(false);channelList.requestFocus();}}return true;
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
            TextView mark=text(selected&&web.state()==CctvWebPlayer.State.READY?"●":favourites.contains(channel.id)?"★":"",10,RED);row.addView(mark,new LinearLayout.LayoutParams(dp(14),-2));return row;
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
