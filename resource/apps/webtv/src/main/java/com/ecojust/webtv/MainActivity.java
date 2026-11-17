package com.ecojust.webtv;

import android.app.*;
import android.content.*;
import android.net.Uri;
import android.os.*;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.net.URI;
import java.util.*;
import java.util.concurrent.*;

/** Native TV channel browser, one surface, one decoder, and one bounded metadata worker. */
public class MainActivity extends Activity implements SurfaceHolder.Callback, LivePlayer.Events {
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor worker = new ThreadPoolExecutor(1,1,30,TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1),new ThreadPoolExecutor.AbortPolicy());
    private ChannelRepository repository;
    private ChannelRepository.Catalogue catalogue;
    private ChannelRepository.Request request;
    private Future<?> pending;
    private int loadGeneration, routeIndex;
    private SharedPreferences preferences;
    private final Set<String> favourites = new LinkedHashSet<>();
    private final List<Playlist.Channel> shown = new ArrayList<>();
    private final Channels adapter = new Channels();
    private Playlist.Channel current;
    private LivePlayer live;
    private boolean active, loadingList, fullscreen;
    private String category = Playlist.SATELLITE;
    private Uri pendingFile;
    private LinearLayout root, header, side, footer;
    private FrameLayout stage;
    private SurfaceView surface;
    private ListView list;
    private TextView sourceStatus, channelTitle, playbackStatus, hints, empty, message;
    private ProgressBar spinner;
    private LinearLayout messagePanel;
    private Button fullButton, previous, next, favourite, route, retry;
    private AlertDialog dialog;
    private int videoWidth = 16, videoHeight = 9;
    private Runnable retryList;
    private final Runnable hideControls = () -> {
        if (fullscreen && active && dialog == null && live.state() == LivePlayer.State.PLAYING) showFullControls(false,false);
    };
    protected ChannelRepository createRepository() { return new ChannelRepository(this); }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state); worker.allowCoreThreadTimeOut(true); repository = createRepository();
        preferences = getSharedPreferences("webtv",MODE_PRIVATE);
        Set<String> saved = preferences.getStringSet("favourites",Collections.emptySet());
        for (String id : saved) if (favourites.size() < 50 && id.length() <= 160) favourites.add(id);
        category = preferences.getString("category",Playlist.SATELLITE);
        live = new LivePlayer(this,this); buildUi();
    }
    private void buildUi() {
        boolean english = getResources().getConfiguration().getLocales().get(0).getLanguage().equals("en");
        root = column(); root.setBackgroundColor(0xff111319); root.setFocusableInTouchMode(true); root.setPadding(dp(16),dp(10),dp(16),dp(8));
        header = row(); TextView brand = text(getString(R.string.app_name),26); brand.setTextColor(0xffe3a1b0); header.addView(brand,new LinearLayout.LayoutParams(dp(100),dp(48)));
        sourceStatus = text("",13); sourceStatus.setSingleLine(); sourceStatus.setEllipsize(TextUtils.TruncateAt.END); sourceStatus.setTextColor(0xffa9acb6); header.addView(sourceStatus,new LinearLayout.LayoutParams(0,dp(48),1));
        header.addView(button(R.string.sources,this::sourceDialog),new LinearLayout.LayoutParams(dp(english?88:80),dp(44)));
        fullButton = button(R.string.fullscreen,()->setFullscreen(!fullscreen)); header.addView(fullButton,new LinearLayout.LayoutParams(dp(english?104:74),dp(44))); root.addView(header);
        LinearLayout body = row(); body.setGravity(Gravity.TOP); root.addView(body,new LinearLayout.LayoutParams(-1,0,1));
        side = column(); int sideWidth = getResources().getConfiguration().screenWidthDp >= 800 ? 200 : 170;
        side.setPadding(0,dp(6),dp(10),0); body.addView(side,new LinearLayout.LayoutParams(dp(sideWidth),-1));
        LinearLayout tabs = row();
        String[] categories = {Playlist.SATELLITE,Playlist.CCTV,"收藏","全部"}; int[] labels = {R.string.satellite,R.string.cctv,R.string.favourites,R.string.all};
        for(int i=0;i<categories.length;i++){if(english && i==2){side.addView(tabs);tabs=row();}String value=categories[i];Button tab=button(labels[i],()->setCategory(value));tab.setTextSize(13);tab.setPadding(0,0,0,0);tabs.addView(tab,new LinearLayout.LayoutParams(0,dp(42),1));} side.addView(tabs);
        FrameLayout listFrame = new FrameLayout(this); side.addView(listFrame,new LinearLayout.LayoutParams(-1,0,1));
        list = new ListView(this); list.setFocusableInTouchMode(true); list.setDividerHeight(dp(3)); list.setSelector(R.drawable.list_focus); list.setDrawSelectorOnTop(true); list.setAdapter(adapter);
        list.setOnItemClickListener((parent,view,position,id)->{
            Playlist.Channel channel=shown.get(position);
            if(current!=null&&current.id.equals(channel.id)&&live.state()==LivePlayer.State.PLAYING)setFullscreen(true);
            else play(channel,0);
        });
        listFrame.addView(list,new FrameLayout.LayoutParams(-1,-1)); empty=text(getString(R.string.empty),15);empty.setGravity(Gravity.CENTER);empty.setPadding(dp(8),dp(20),dp(8),dp(20));listFrame.addView(empty,new FrameLayout.LayoutParams(-1,-1));list.setEmptyView(empty);
        LinearLayout right = column(); body.addView(right,new LinearLayout.LayoutParams(0,-1,1));
        stage = new FrameLayout(this);stage.setBackgroundColor(0xff090b0f);stage.setFocusable(true);stage.setContentDescription(getString(R.string.playback_area));right.addView(stage,new LinearLayout.LayoutParams(-1,0,1));
        surface = new SurfaceView(this);stage.addView(surface,new FrameLayout.LayoutParams(1,1,Gravity.CENTER));surface.getHolder().addCallback(this);
        stage.addOnLayoutChangeListener((v,l,t,r,b,ol,ot,or,ob)->layoutVideo());
        stage.setOnClickListener(v->{if(fullscreen)showFullControls(footer.getVisibility()!=View.VISIBLE,true);else setFullscreen(true);});
        messagePanel = column();messagePanel.setGravity(Gravity.CENTER);messagePanel.setPadding(dp(16),dp(8),dp(16),dp(8));
        spinner=new ProgressBar(this);messagePanel.addView(spinner,new LinearLayout.LayoutParams(dp(28),dp(28)));
        message=text(getString(R.string.loading_list),16);message.setMaxLines(3);message.setEllipsize(TextUtils.TruncateAt.END);message.setGravity(Gravity.CENTER);messagePanel.addView(message,new LinearLayout.LayoutParams(-1,-2));
        retry=button(R.string.retry,this::retry);messagePanel.addView(retry,new LinearLayout.LayoutParams(dp(130),dp(44)));retry.setVisibility(View.GONE);stage.addView(messagePanel,new FrameLayout.LayoutParams(-1,-1));
        footer=column();footer.setPadding(0,dp(6),0,0);right.addView(footer,new LinearLayout.LayoutParams(-1,-2));
        LinearLayout titleRow=row();channelTitle=text("",18);channelTitle.setSingleLine();channelTitle.setEllipsize(TextUtils.TruncateAt.END);titleRow.addView(channelTitle,new LinearLayout.LayoutParams(0,dp(30),1));playbackStatus=text("",13);playbackStatus.setTextColor(0xffe3a1b0);titleRow.addView(playbackStatus);footer.addView(titleRow);
        LinearLayout controls=row();controls.setGravity(Gravity.CENTER);
        previous=button(R.string.previous,()->step(-1));next=button(R.string.next,()->step(1));favourite=button(R.string.favourite,this::toggleFavourite);route=button(R.string.route,this::routes);
        for(Button control:new Button[]{previous,next,favourite,route}){LinearLayout.LayoutParams item=new LinearLayout.LayoutParams(0,dp(44),1);item.setMargins(dp(2),dp(2),dp(2),dp(2));controls.addView(control,item);}footer.addView(controls);
        hints=text(getString(R.string.hints),11);hints.setGravity(Gravity.CENTER);hints.setTextColor(0xffa9acb6);hints.setSingleLine();hints.setEllipsize(TextUtils.TruncateAt.END);footer.addView(hints,new LinearLayout.LayoutParams(-1,dp(24)));
        setContentView(root);list.requestFocus();changed();
    }
    @Override protected void onStart() {
        super.onStart();active=true;live.activate();
        if(pendingFile!=null){Uri file=pendingFile;pendingFile=null;load(req->repository.importFile(file,req));}
        else if(catalogue==null)load(repository::initial);
    }
    @Override protected void onStop() {
        active=false;cancelLoad();main.removeCallbacks(hideControls);if(dialog!=null)dialog.dismiss();live.suspend();root.setKeepScreenOn(false);super.onStop();
    }
    @Override protected void onDestroy(){worker.shutdownNow();live.close();surface.getHolder().removeCallback(this);main.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override public void surfaceCreated(SurfaceHolder holder){live.surface(holder);}
    @Override public void surfaceChanged(SurfaceHolder holder,int format,int width,int height){layoutVideo();}
    @Override public void surfaceDestroyed(SurfaceHolder holder){live.surface(null);}
    private interface Load { ChannelRepository.Catalogue run(ChannelRepository.Request request) throws Exception; }
    private void load(Load action) {
        if(!active)return;cancelLoad();loadingList=true;request=new ChannelRepository.Request();ChannelRepository.Request ticketRequest=request;int ticket=loadGeneration;
        sourceStatus.setText(R.string.loading_list);if(catalogue==null)setMessage(getString(R.string.loading_list),true);
        retryList=()->load(action);
        pending=worker.submit(()->{
            try{
                ChannelRepository.Catalogue result=action.run(ticketRequest);ticketRequest.check();
                main.post(()->{if(active&&ticket==loadGeneration){loadingList=false;retryList=null;apply(result);}});
            }catch(Exception e){String reason=UiError.message(this,e);
                if(!ticketRequest.cancelled)main.post(()->{if(active&&ticket==loadGeneration){loadingList=false;
                    if(catalogue==null){setMessage(getString(R.string.list_error,reason),false);retry.setText(R.string.list_retry);retry.requestFocus();}
                    else{updateSourceStatus();toast(getString(R.string.list_error,reason));}
                }});
            }
        });
    }
    private void cancelLoad(){loadGeneration++;loadingList=false;if(request!=null)request.cancel();if(pending!=null)pending.cancel(true);pending=null;worker.purge();}
    private void apply(ChannelRepository.Catalogue result) {
        Playlist.Channel old=current;String oldUrl=live.url();catalogue=result;updateSourceStatus();refreshList();
        Playlist.Channel chosen=null;String wanted=old==null?preferences.getString("last_channel",""):old.id;
        for(Playlist.Channel channel:catalogue.channels)if(channel.id.equals(wanted)){chosen=channel;break;}
        if(chosen==null&&!shown.isEmpty())chosen=shown.get(0);
        if(chosen==null&&!catalogue.channels.isEmpty())chosen=catalogue.channels.get(0);
        if(chosen!=null){int line=chosen.urls.indexOf(oldUrl);if(old!=null&&line>=0&&live.state()==LivePlayer.State.PLAYING){current=chosen;routeIndex=line;adapter.notifyDataSetChanged();changed();}else play(chosen,Math.max(0,line));}
        list.requestFocus();
    }
    private void updateSourceStatus(){if(catalogue!=null)sourceStatus.setText(getString(R.string.list_ready,catalogue.source.label(this),catalogue.channels.size()));}
    private void setCategory(String value){category=value;preferences.edit().putString("category",value).apply();refreshList();list.requestFocus();}
    private void refreshList(){
        shown.clear();if(catalogue!=null)for(Playlist.Channel channel:catalogue.channels)if(category.equals("全部")||category.equals(channel.group)||category.equals("收藏")&&favourites.contains(channel.id))shown.add(channel);
        if(shown.isEmpty()&&catalogue!=null&&!category.equals("收藏")&&!category.equals("全部")){category="全部";shown.addAll(catalogue.channels);}
        adapter.notifyDataSetChanged();previous.setEnabled(!shown.isEmpty());next.setEnabled(!shown.isEmpty());
    }
    private void play(Playlist.Channel channel,int line){
        current=channel;routeIndex=Math.max(0,Math.min(line,channel.urls.size()-1));retryList=null;
        preferences.edit().putString("last_channel",channel.id).apply();adapter.notifyDataSetChanged();
        for(int i=0;i<shown.size();i++)if(shown.get(i).id.equals(channel.id)){list.setSelection(i);break;}
        live.play(channel.urls.get(routeIndex));
    }
    private void retry(){if(catalogue==null&&retryList!=null)retryList.run();else if(current!=null)play(current,routeIndex);}
    private void step(int direction){
        if(shown.isEmpty())return;int index=-1;for(int i=0;i<shown.size();i++)if(current!=null&&shown.get(i).id.equals(current.id)){index=i;break;}
        if(index<0)index=direction>0?-1:0;play(shown.get((index+direction+shown.size())%shown.size()),0);showFullControls(true,false);
    }
    private void toggleFavourite(){
        if(current==null)return;if(favourites.contains(current.id))favourites.remove(current.id);
        else if(favourites.size()<50)favourites.add(current.id);else{toast(getString(R.string.favourite_limit));return;}
        preferences.edit().putStringSet("favourites",new HashSet<>(favourites)).apply();refreshList();changed();
    }
    private void routes(){
        if(current==null)return;if(current.urls.size()<2){toast(getString(R.string.single_route));return;}
        String[] labels=new String[current.urls.size()];for(int i=0;i<labels.length;i++)labels[i]=getString(R.string.route_label,i+1,URI.create(current.urls.get(i)).getHost());
        Playlist.Channel selected=current;showDialog(new AlertDialog.Builder(this).setTitle(channelName(current)).setSingleChoiceItems(labels,routeIndex,(d,which)->{play(selected,which);d.dismiss();}).setNegativeButton(R.string.close,null).create());
    }
    private void sourceDialog(){
        if(loadingList){toast(getString(R.string.busy));return;}
        showDialog(new AlertDialog.Builder(this).setTitle(R.string.sources).setItems(new String[]{getString(R.string.refresh),getString(R.string.import_url),getString(R.string.import_file),getString(R.string.restore)},(d,which)->{
            d.dismiss();
            if(which==0){if(catalogue==null)load(repository::initial);else if(catalogue.source.kind.equals("file"))toast(getString(R.string.local_refresh));else{ChannelRepository.Source source=catalogue.source;load(req->repository.refresh(source,req));}}
            else if(which==1)urlDialog();else if(which==2)filePicker();else load(repository::restore);
        }).setNegativeButton(R.string.close,null).create());
    }
    private void urlDialog(){
        EditText input=new EditText(this);input.setSingleLine();input.setHint(R.string.url_hint);input.setTextSize(16);input.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(2048)});
        input.setInputType(android.text.InputType.TYPE_CLASS_TEXT|android.text.InputType.TYPE_TEXT_VARIATION_URI);
        if(catalogue!=null&&catalogue.source.kind.equals("url"))input.setText(catalogue.source.address);
        AlertDialog form=new AlertDialog.Builder(this).setTitle(R.string.import_url).setView(input).setPositiveButton(R.string.import_action,null).setNegativeButton(R.string.cancel,null).create();
        showDialog(form);form.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            try{String address=Playlist.safeUrl(input.getText().toString().trim());form.dismiss();load(req->repository.refresh(new ChannelRepository.Source("url",address),req));}
            catch(Exception e){input.setError(UiError.message(this,e));}
        });
    }
    private void filePicker(){
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try{startActivityForResult(intent,81);}catch(ActivityNotFoundException e){toast(getString(R.string.no_picker));}
    }
    @Override protected void onActivityResult(int requestCode,int resultCode,Intent data){
        super.onActivityResult(requestCode,resultCode,data);if(requestCode!=81||resultCode!=RESULT_OK||data==null||data.getData()==null)return;
        Uri file=data.getData();if(active)load(req->repository.importFile(file,req));else pendingFile=file;
    }
    private void showDialog(AlertDialog value){
        if(dialog!=null)dialog.dismiss();main.removeCallbacks(hideControls);dialog=value;
        value.setOnDismissListener(d->{if(dialog==value)dialog=null;scheduleHide();});value.show();
    }
    private void setFullscreen(boolean value){
        if(value&&current==null)return;fullscreen=value;header.setVisibility(value?View.GONE:View.VISIBLE);side.setVisibility(value?View.GONE:View.VISIBLE);
        root.setPadding(value?0:dp(16),value?0:dp(10),value?0:dp(16),value?0:dp(8));
        fullButton.setText(value?R.string.exit_fullscreen:R.string.fullscreen);hints.setText(value?R.string.full_hints:R.string.hints);
        showFullControls(true,value);if(!value)list.requestFocus();layoutVideo();
    }
    private void showFullControls(boolean show,boolean focus){
        footer.setVisibility(!fullscreen||show?View.VISIBLE:View.GONE);
        if(fullscreen&&show&&focus)next.requestFocus();else if(fullscreen&&!show)root.requestFocus();scheduleHide();
    }
    private void scheduleHide(){main.removeCallbacks(hideControls);if(fullscreen&&active&&dialog==null&&live.state()==LivePlayer.State.PLAYING)main.postDelayed(hideControls,4500);}
    @Override public void changed(){
        if(root==null||channelTitle==null)return;LivePlayer.State state=live.state();
        channelTitle.setText(current==null?getString(R.string.waiting):getString(R.string.route_count,channelName(current),routeIndex+1,current.urls.size()));
        fullButton.setEnabled(current!=null);favourite.setEnabled(current!=null);route.setEnabled(current!=null);favourite.setText(current!=null&&favourites.contains(current.id)?R.string.favourited:R.string.favourite);
        if(state==LivePlayer.State.LOADING){playbackStatus.setText(R.string.loading_video);setMessage(getString(R.string.loading_video),true);showFullControls(true,false);}
        else if(state==LivePlayer.State.PLAYING){playbackStatus.setText(R.string.live);messagePanel.setVisibility(View.GONE);scheduleHide();}
        else if(state==LivePlayer.State.ERROR){playbackStatus.setText(R.string.waiting);setMessage(live.error(),false);showFullControls(true,false);if(active)retry.requestFocus();}
        else if(state==LivePlayer.State.PAUSED){playbackStatus.setText(R.string.waiting);setMessage(getString(R.string.paused),false);showFullControls(true,false);}
        else if(!loadingList&&catalogue!=null){playbackStatus.setText(R.string.waiting);}
        root.setKeepScreenOn(active&&(state==LivePlayer.State.PLAYING||state==LivePlayer.State.LOADING));
    }
    private void setMessage(String value,boolean busy){message.setText(value);messagePanel.setVisibility(View.VISIBLE);spinner.setVisibility(busy?View.VISIBLE:View.GONE);retry.setVisibility(busy?View.GONE:View.VISIBLE);retry.setText(R.string.retry);}
    @Override public void size(int width,int height){videoWidth=width;videoHeight=height;layoutVideo();}
    @Override public void next(){step(1);}
    @Override public void previous(){step(-1);}
    private void layoutVideo(){
        if(stage==null||surface==null)return;int[] size=fit(stage.getWidth(),stage.getHeight(),videoWidth,videoHeight);
        FrameLayout.LayoutParams params=(FrameLayout.LayoutParams)surface.getLayoutParams();if(params.width!=size[0]||params.height!=size[1]){params.width=size[0];params.height=size[1];surface.setLayoutParams(params);}
    }
    static int[] fit(int w,int h,int videoW,int videoH){if(w<=0||h<=0||videoW<=0||videoH<=0)return new int[]{1,1};double scale=Math.min((double)w/videoW,(double)h/videoH);return new int[]{Math.max(1,(int)Math.round(videoW*scale)),Math.max(1,(int)Math.round(videoH*scale))};}
    @Override public void onBackPressed(){if(fullscreen)setFullscreen(false);else super.onBackPressed();}
    @Override public boolean dispatchKeyEvent(KeyEvent event){
        int key=event.getKeyCode();boolean fullArrow=fullscreen&&(key==KeyEvent.KEYCODE_DPAD_UP||key==KeyEvent.KEYCODE_DPAD_DOWN);
        boolean confirm=(key==KeyEvent.KEYCODE_DPAD_CENTER||key==KeyEvent.KEYCODE_ENTER)&&fullscreen&&footer.getVisibility()!=View.VISIBLE;
        boolean media=key==KeyEvent.KEYCODE_MEDIA_NEXT||key==KeyEvent.KEYCODE_MEDIA_PREVIOUS||key==KeyEvent.KEYCODE_MEDIA_PLAY||key==KeyEvent.KEYCODE_MEDIA_PAUSE||key==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE;
        if(key==KeyEvent.KEYCODE_MENU||fullArrow||confirm||media){
            if(event.getAction()==KeyEvent.ACTION_DOWN&&event.getRepeatCount()==0){
                if(key==KeyEvent.KEYCODE_MENU)sourceDialog();else if(key==KeyEvent.KEYCODE_MEDIA_NEXT||key==KeyEvent.KEYCODE_DPAD_DOWN)step(1);
                else if(key==KeyEvent.KEYCODE_MEDIA_PREVIOUS||key==KeyEvent.KEYCODE_DPAD_UP)step(-1);
                else if(key==KeyEvent.KEYCODE_MEDIA_PAUSE)live.pause();else if(key==KeyEvent.KEYCODE_MEDIA_PLAY)live.resume();
                else if(key==KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE){if(live.state()==LivePlayer.State.PLAYING||live.state()==LivePlayer.State.LOADING)live.pause();else live.resume();}
                else if(confirm){if(live.state()==LivePlayer.State.PAUSED||live.state()==LivePlayer.State.ERROR)retry();showFullControls(true,true);}
            }return true;
        }
        if(event.getAction()==KeyEvent.ACTION_DOWN&&fullscreen){if(footer.getVisibility()!=View.VISIBLE&&(key==KeyEvent.KEYCODE_DPAD_LEFT||key==KeyEvent.KEYCODE_DPAD_RIGHT)){showFullControls(true,true);return true;}scheduleHide();}
        return super.dispatchKeyEvent(event);
    }
    private final class Channels extends BaseAdapter{
        public int getCount(){return shown.size();}public Playlist.Channel getItem(int index){return shown.get(index);}public long getItemId(int index){return index;}
        public View getView(int index,View recycled,ViewGroup parent){TextView view=recycled instanceof TextView?(TextView)recycled:text("",17);Playlist.Channel channel=getItem(index);
            view.setText(String.format(Locale.ROOT,"%02d  %s",index+1,channelName(channel)));view.setSingleLine();view.setEllipsize(TextUtils.TruncateAt.END);view.setGravity(Gravity.CENTER_VERTICAL);view.setPadding(dp(10),0,dp(8),0);view.setMinHeight(dp(50));
            boolean selected=current!=null&&current.id.equals(channel.id);view.setTextColor(selected?0xffe3a1b0:0xffececf0);view.setBackgroundColor(selected?0xff28252e:0xff171a21);return view;}
    }
    private String channelName(Playlist.Channel channel){return ChannelLabels.name(this,channel,catalogue!=null&&catalogue.source.kind.equals("default"));}
    private int dp(int value){return Math.round(value*getResources().getDisplayMetrics().density);}
    private LinearLayout column(){LinearLayout view=new LinearLayout(this);view.setOrientation(LinearLayout.VERTICAL);return view;}
    private LinearLayout row(){LinearLayout view=new LinearLayout(this);view.setOrientation(LinearLayout.HORIZONTAL);view.setGravity(Gravity.CENTER_VERTICAL);return view;}
    private TextView text(String value,int size){TextView view=new TextView(this);view.setText(value);view.setTextSize(size);view.setTextColor(0xffececf0);view.setGravity(Gravity.CENTER_VERTICAL);return view;}
    private Button button(int label,Runnable action){Button view=new Button(this);view.setText(label);view.setTextSize(15);view.setAllCaps(false);view.setFocusableInTouchMode(true);view.setMinWidth(0);view.setTextColor(0xffececf0);view.setBackgroundResource(R.drawable.focus);view.setPadding(dp(6),dp(4),dp(6),dp(4));view.setOnClickListener(v->{action.run();scheduleHide();});return view;}
    private void toast(String value){Toast.makeText(this,value,Toast.LENGTH_LONG).show();}
}
