package com.ecojust.hifinitv;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.*;
import android.os.*;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.*;
import android.view.inputmethod.EditorInfo;
import android.widget.*;
import java.io.IOException;
import java.util.*;
import java.util.concurrent.*;

/** One remote-first screen: search, shuffled results, artwork and a decorative rhythm. */
public class MainActivity extends Activity {
    private static final int INK=0xff101416, TEXT=0xfff1f0e8, MUTED=0xff8f9998, MINT=0xffc5e4d2;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor searches=new ThreadPoolExecutor(1,1,20,TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1),new ThreadPoolExecutor.DiscardOldestPolicy());
    private final List<Track> tracks=new ArrayList<>();
    private final TrackAdapter adapter=new TrackAdapter();
    private Future<?> searchJob;
    private Runnable searchTimeout;
    private int searchGeneration;
    private boolean visible,bound,searching,discovery,seeking;
    private PlaybackService player;
    private CoverLoader covers;
    private Scene scene;
    private EditText query;
    private Button shuffle,login;
    private ImageButton search,toggle,previous,next,audioQr;
    private ImageView hero;
    private TextView heading,status,title,artist,now,elapsed,total;
    private ListView list;
    private RhythmView rhythm;
    private SeekBar seek;
    private String coverKey="",currentId="",shownError="",shownAudioUrl="",shownAudioTrack="";
    private AlertDialog audioLinkDialog;
    private TextView audioDebugError;
    private final Runnable tick=new Runnable(){@Override public void run(){if(visible){render();main.postDelayed(this,500);}}};
    private final ServiceConnection connection=new ServiceConnection(){
        @Override public void onServiceConnected(ComponentName name,IBinder binder){player=((PlaybackService.LocalBinder)binder).player();player.listen(MainActivity.this::render);render();}
        @Override public void onServiceDisconnected(ComponentName name){player=null;render();}
    };

    @Override public void onCreate(Bundle state){
        super.onCreate(state);covers=new CoverLoader();searches.allowCoreThreadTimeOut(true);
        scene=new Scene();scene.setFocusable(false);
        LinearLayout brand=new LinearLayout(this);brand.setGravity(Gravity.CENTER_VERTICAL);
        ImageView mark=new ImageView(this);mark.setImageDrawable(MusicVisuals.icon("waveform",MINT));brand.addView(mark,new LinearLayout.LayoutParams(px(28),px(38)));
        LinearLayout brandText=column();brandText.setPadding(px(12),0,0,0);
        TextView word=text("HIFINi TV",23,TEXT);word.setTypeface(null,Typeface.BOLD);brandText.addView(word);
        TextView source=text("HiFiNi",9,MUTED);source.setLetterSpacing(.28f);brandText.addView(source);brand.addView(brandText);
        scene.place(brand,34,19,205,47);
        query=new EditText(this);query.setId(View.generateViewId());query.setSingleLine();query.setTextColor(TEXT);query.setHintTextColor(MUTED);
        query.setHint(R.string.search_hint);query.setContentDescription(getString(R.string.search_music));query.setTextSize(19);query.setPadding(px(15),0,px(43),0);
        query.setBackground(shape(0xff191e20,24,0xff343c3b,1));query.setImeOptions(EditorInfo.IME_ACTION_SEARCH);
        query.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(100)});
        query.setOnEditorActionListener((v,action,event)->{if(action==EditorInfo.IME_ACTION_SEARCH||event!=null&&event.getAction()==KeyEvent.ACTION_DOWN&&event.getKeyCode()==KeyEvent.KEYCODE_ENTER){search();return true;}return false;});
        query.setOnFocusChangeListener((v,focused)->query.setBackground(shape(0xff191e20,24,focused?MINT:0xff343c3b,focused?2:1)));
        scene.place(query,255,20,411,40);
        search=iconButton("search",R.string.search,()->search(),false);scene.place(search,622,23,36,34);
        shuffle=new Button(this);shuffle.setFocusable(true);shuffle.setFocusableInTouchMode(true);shuffle.setId(View.generateViewId());shuffle.setText(R.string.shuffle);shuffle.setTextColor(INK);shuffle.setAllCaps(false);shuffle.setTextSize(17);shuffle.setTypeface(null,Typeface.BOLD);
        shuffle.setMinWidth(0);shuffle.setMinimumWidth(0);shuffle.setMinHeight(0);shuffle.setMinimumHeight(0);shuffle.setPadding(px(13),0,px(13),0);shuffle.setBackground(buttonBackground(true,22));shuffle.setDefaultFocusHighlightEnabled(false);
        Drawable shuffleIcon=MusicVisuals.icon("shuffle",INK);shuffleIcon.setBounds(0,0,px(22),px(22));shuffle.setCompoundDrawables(shuffleIcon,null,null,null);shuffle.setCompoundDrawablePadding(px(8));shuffle.setOnClickListener(v->random());
        scene.place(shuffle,700,20,164,40);
        login=new Button(this);login.setId(View.generateViewId());login.setText(R.string.sign_in_short);login.setContentDescription(getString(R.string.hifini_login));login.setTextColor(MINT);login.setAllCaps(false);login.setTextSize(TypedValue.COMPLEX_UNIT_PX,px(13));login.setFocusable(true);login.setFocusableInTouchMode(true);login.setMinWidth(0);login.setMinimumWidth(0);login.setMinHeight(0);login.setMinimumHeight(0);login.setPadding(0,0,0,0);login.setBackground(buttonBackground(false,15));login.setDefaultFocusHighlightEnabled(false);login.setOnClickListener(v->{status.setText(R.string.login_return_hint);startActivity(new Intent(this,LoginActivity.class));});scene.place(login,875,22,58,36);
        heading=text(getString(R.string.search_results),23,TEXT);heading.setTypeface(null,Typeface.BOLD);scene.place(heading,35,85,270,30);
        status=text(getString(R.string.welcome),13,MUTED);status.setMaxLines(2);status.setEllipsize(TextUtils.TruncateAt.END);scene.place(status,35,116,265,34);
        list=new ListView(this);list.setId(View.generateViewId());list.setDivider(null);list.setDividerHeight(0);list.setPadding(px(3),px(3),px(3),px(3));list.setClipToPadding(false);
        list.setSelector(R.drawable.list_focus);list.setDrawSelectorOnTop(true);list.setOverScrollMode(View.OVER_SCROLL_NEVER);list.setVerticalScrollBarEnabled(false);list.setFocusable(true);list.setAdapter(adapter);
        list.setOnItemClickListener((parent,row,position,id)->play(position));scene.place(list,27,157,280,329);
        hero=new ImageView(this);hero.setId(View.generateViewId());hero.setScaleType(ImageView.ScaleType.CENTER_CROP);hero.setImageDrawable(MusicVisuals.artwork());hero.setContentDescription(getString(R.string.album_artwork));
        hero.setClipToOutline(true);hero.setOutlineProvider(new ViewOutlineProvider(){@Override public void getOutline(View view,Outline outline){outline.setRoundRect(0,0,view.getWidth(),view.getHeight(),px(10));}});scene.place(hero,334,75,294,294);
        now=text(getString(R.string.ready_to_listen),12,MINT);now.setGravity(Gravity.CENTER);scene.place(now,332,372,298,22);
        title=text(getString(R.string.choose_track),24,TEXT);title.setTypeface(null,Typeface.BOLD);title.setGravity(Gravity.CENTER);title.setSingleLine();title.setEllipsize(TextUtils.TruncateAt.END);scene.place(title,323,394,316,32);
        artist=text("HiFiNi",15,MUTED);artist.setGravity(Gravity.CENTER);artist.setSingleLine();artist.setEllipsize(TextUtils.TruncateAt.END);scene.place(artist,331,427,300,22);
        audioQr=new ImageButton(this);audioQr.setId(View.generateViewId());audioQr.setContentDescription(getString(R.string.audio_link_qr));audioQr.setScaleType(ImageView.ScaleType.FIT_CENTER);audioQr.setPadding(px(3),px(3),px(3),px(3));audioQr.setBackground(buttonBackground(false,5));audioQr.setDefaultFocusHighlightEnabled(false);audioQr.setFocusable(true);audioQr.setFocusableInTouchMode(true);audioQr.setVisibility(View.GONE);audioQr.setOnClickListener(v->showAudioLink());scene.place(audioQr,586,391,54,54);
        TextView rhythmLabel=text(getString(R.string.rhythm),14,MUTED);scene.place(rhythmLabel,663,101,260,25);
        rhythm=new RhythmView(this);rhythm.setFocusable(false);rhythm.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);scene.place(rhythm,638,136,304,243);
        TextView rhythmCaption=text(getString(R.string.rhythm_caption),11,MUTED);rhythmCaption.setGravity(Gravity.CENTER);rhythmCaption.setLetterSpacing(.13f);scene.place(rhythmCaption,650,382,280,24);
        elapsed=text("0:00",12,MUTED);scene.place(elapsed,334,452,42,23);
        seek=new SeekBar(this);seek.setId(View.generateViewId());seek.setMax(1000);seek.setPadding(px(8),0,px(8),0);seek.setProgressTintList(android.content.res.ColorStateList.valueOf(MINT));seek.setThumbTintList(android.content.res.ColorStateList.valueOf(TEXT));
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener(){public void onProgressChanged(SeekBar bar,int progress,boolean fromUser){if(fromUser&&player!=null)player.seek(player.duration()*progress/1000);}public void onStartTrackingTouch(SeekBar bar){seeking=true;}public void onStopTrackingTouch(SeekBar bar){seeking=false;}});
        scene.place(seek,374,451,514,25);total=text("0:00",12,MUTED);total.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);scene.place(total,886,452,43,23);
        previous=iconButton("previous",R.string.previous,()->{if(player!=null)player.previous();},false);scene.place(previous,534,483,39,34);
        toggle=iconButton("play",R.string.play,()->{if(player!=null)player.toggle();},true);scene.place(toggle,606,479,42,42);
        next=iconButton("next",R.string.next,()->{if(player!=null)player.next();},false);scene.place(next,682,483,39,34);
        TextView remote=text(getString(R.string.remote_hint),10,MUTED);remote.setSingleLine();remote.setEllipsize(TextUtils.TruncateAt.END);scene.place(remote,35,500,290,20);
        linkFocus();setContentView(scene);if(state!=null)query.setText(state.getString("query",""));shuffle.requestFocus();render();
    }
    private void linkFocus(){
        query.setNextFocusRightId(search.getId());query.setNextFocusDownId(list.getId());search.setNextFocusLeftId(query.getId());search.setNextFocusRightId(shuffle.getId());search.setNextFocusDownId(list.getId());
        shuffle.setNextFocusLeftId(search.getId());shuffle.setNextFocusRightId(login.getId());shuffle.setNextFocusDownId(seek.getId());login.setNextFocusLeftId(shuffle.getId());login.setNextFocusDownId(seek.getId());list.setNextFocusUpId(query.getId());list.setNextFocusRightId(toggle.getId());
        seek.setNextFocusUpId(shuffle.getId());seek.setNextFocusDownId(toggle.getId());
        audioQr.setNextFocusUpId(shuffle.getId());audioQr.setNextFocusDownId(seek.getId());audioQr.setNextFocusLeftId(list.getId());audioQr.setNextFocusRightId(seek.getId());
        previous.setNextFocusRightId(toggle.getId());previous.setNextFocusLeftId(list.getId());previous.setNextFocusUpId(seek.getId());toggle.setNextFocusLeftId(previous.getId());toggle.setNextFocusRightId(next.getId());toggle.setNextFocusUpId(seek.getId());next.setNextFocusLeftId(toggle.getId());next.setNextFocusUpId(seek.getId());
    }
    private void search(){String keyword=query.getText().toString().trim();if(keyword.isEmpty()){query.requestFocus();return;}load(false,keyword);}
    private void random(){
        if(!tracks.isEmpty()){cancelSearch();discovery=true;heading.setText(R.string.shuffle_selection);status.setText(getString(R.string.shuffle_count,tracks.size()));if(player!=null)player.playList(new ArrayList<>(tracks),true);render();return;}
        String keyword=query.getText().toString().trim();if(keyword.isEmpty()){status.setText(R.string.shuffle_needs_search);query.requestFocus();return;}load(true,keyword);
    }
    List<Track> searchTracks(String keyword)throws IOException{return HifiniApi.get().search(keyword);}
    private void load(boolean random,String keyword){
        cancelSearch();searching=true;discovery=random;heading.setText(random?R.string.shuffle_selection:R.string.search_results);status.setText(R.string.searching);
        search.setEnabled(false);shuffle.setEnabled(false);int ticket=searchGeneration;
        searchTimeout=()->{if(visible&&ticket==searchGeneration&&searching){cancelSearch();status.setText(R.string.search_timeout);shuffle.requestFocus();}};main.postDelayed(searchTimeout,20000);
        searchJob=searches.submit(()->{try{List<Track> found=searchTracks(keyword);main.post(()->{
            if(!visible||ticket!=searchGeneration)return;finishSearch();search.setEnabled(true);shuffle.setEnabled(true);tracks.clear();tracks.addAll(found);adapter.notifyDataSetChanged();
            status.setText(found.isEmpty()?getString(R.string.no_results):getString(random?R.string.shuffle_count:R.string.results_count,found.size()));
            if(random&&!found.isEmpty()&&player!=null)player.playList(new ArrayList<>(found),true);if(!found.isEmpty()){list.requestFocus();list.setSelection(0);}render();
        });}catch(Exception e){String reason=MusicError.display(this,e);boolean needsLogin=requiresLogin(e);main.post(()->{if(visible&&ticket==searchGeneration){finishSearch();search.setEnabled(true);shuffle.setEnabled(true);status.setText(getString(R.string.search_failed,reason));if(needsLogin)login.requestFocus();else shuffle.requestFocus();}});}});
    }
    private boolean requiresLogin(Throwable error){for(Throwable cause=error;cause!=null;cause=cause.getCause())if(cause instanceof MusicError&&((MusicError)cause).resource==R.string.source_login_required)return true;return false;}
    private void finishSearch(){if(searchTimeout!=null)main.removeCallbacks(searchTimeout);searchTimeout=null;searching=false;search.setEnabled(true);shuffle.setEnabled(true);}
    private void cancelSearch(){searchGeneration++;if(searchJob!=null)searchJob.cancel(true);searchJob=null;searches.purge();if(searchTimeout!=null)main.removeCallbacks(searchTimeout);searchTimeout=null;searching=false;if(search!=null)search.setEnabled(true);if(shuffle!=null)shuffle.setEnabled(true);}
    private void play(int position){if(player==null||position<0||position>=tracks.size())return;player.playListAt(new ArrayList<>(tracks),position);}
    private void render(){
        if(toggle==null)return;
        Track track=player==null?null:player.current();String id=track==null?"":track.id;
        if(!id.equals(currentId)){currentId=id;adapter.notifyDataSetChanged();}
        title.setText(track==null?getString(R.string.choose_track):track.title);artist.setText(track==null?"HiFiNi":track.artist.isEmpty()?getString(R.string.unknown_artist):track.artist);
        String key=track==null?"":track.cover;if(!key.equals(coverKey)){coverKey=key;covers.load(key,hero,512);}
        boolean loading=player!=null&&player.loading(),playing=player!=null&&player.playing();
        toggle.setImageDrawable(MusicVisuals.icon(loading?"close":playing?"pause":"play",INK));toggle.setContentDescription(getString(loading?R.string.cancel:playing?R.string.pause:R.string.play));toggle.setEnabled(track!=null);
        previous.setEnabled(track!=null);next.setEnabled(track!=null);
        String error=player==null?"":player.error();now.setText(track==null?getString(R.string.ready_to_listen):loading?player.stage():!error.isEmpty()?getString(R.string.playback_failed):playing?getString(R.string.now_playing):getString(R.string.paused));
        if(!error.equals(shownError)){shownError=error;if(!error.isEmpty())status.setText(getString(R.string.retry_audio,error));else if(!searching&&!tracks.isEmpty())status.setText(getString(discovery?R.string.shuffle_count:R.string.results_count,tracks.size()));}
        long duration=player==null?0:player.duration(),position=player==null?0:player.position();seek.setEnabled(duration>0);if(!seeking)seek.setProgress(duration>0?(int)(position*1000/duration):0);elapsed.setText(time(position));total.setText(time(duration));
        renderAudioLink(track,error);
        rhythm.setPlaying(track!=null&&playing&&!loading);
    }
    private void renderAudioLink(Track track,String error){
        String url=track==null||player==null?"":player.audioUrl();if(!AudioUrlQrCode.isSupported(url))url="";
        String trackId=track==null?"":track.id;
        if(!url.equals(shownAudioUrl)||!trackId.equals(shownAudioTrack)){
            dismissAudioLink();shownAudioUrl=url;shownAudioTrack=trackId;boolean available=!url.isEmpty();
            if(available){Bitmap bitmap=AudioUrlQrCode.encode(url,px(48));audioQr.setContentDescription(getString(bitmap==null?R.string.audio_link_open:R.string.audio_link_qr));if(bitmap!=null){BitmapDrawable drawable=new BitmapDrawable(getResources(),bitmap);drawable.setFilterBitmap(false);audioQr.setImageDrawable(drawable);}else audioQr.setImageDrawable(MusicVisuals.icon("search",MINT));}
            else{if(audioQr.hasFocus())shuffle.requestFocus();audioQr.setImageDrawable(null);}
            audioQr.setVisibility(available?View.VISIBLE:View.GONE);
            scene.move(title,323,394,available?250:316,32);scene.move(artist,331,427,available?242:300,22);
            shuffle.setNextFocusDownId(available?audioQr.getId():seek.getId());seek.setNextFocusUpId(available?audioQr.getId():shuffle.getId());list.setNextFocusRightId(available?audioQr.getId():toggle.getId());
        }
        if(audioDebugError!=null){audioDebugError.setText(error.isEmpty()?"":getString(R.string.playback_error_detail,error));audioDebugError.setVisibility(error.isEmpty()?View.GONE:View.VISIBLE);}
    }
    private void showAudioLink(){
        if(shownAudioUrl.isEmpty()||player==null||player.current()==null)return;dismissAudioLink();
        Track track=player.current();LinearLayout body=new LinearLayout(this);body.setPadding(px(20),px(12),px(20),px(12));body.setGravity(Gravity.CENTER_VERTICAL);
        Bitmap bitmap=AudioUrlQrCode.encode(shownAudioUrl,px(230));
        if(bitmap!=null){ImageView enlarged=new ImageView(this);BitmapDrawable drawable=new BitmapDrawable(getResources(),bitmap);drawable.setFilterBitmap(false);enlarged.setImageDrawable(drawable);enlarged.setScaleType(ImageView.ScaleType.FIT_CENTER);enlarged.setContentDescription(getString(R.string.audio_link_qr));body.addView(enlarged,new LinearLayout.LayoutParams(px(230),px(230)));}
        ScrollView details=new ScrollView(this);details.setId(View.generateViewId());details.setFocusable(true);details.setOverScrollMode(View.OVER_SCROLL_NEVER);details.setPadding(px(18),0,0,0);
        LinearLayout fields=column();TextView song=text(track.title,20,TEXT);song.setTypeface(null,Typeface.BOLD);fields.addView(song);fields.addView(text(track.artist,14,MUTED));
        TextView identity=text(getString(R.string.audio_link_identity,track.id),13,MUTED);identity.setPadding(0,px(12),0,px(8));fields.addView(identity);
        fields.addView(text(getString(bitmap==null?R.string.audio_link_too_long:R.string.audio_link_hint),13,MINT));
        TextView address=text(shownAudioUrl,13,TEXT);address.setTypeface(Typeface.MONOSPACE);address.setPadding(0,px(10),0,px(10));fields.addView(address);
        audioDebugError=text(player.error().isEmpty()?"":getString(R.string.playback_error_detail,player.error()),13,0xffefb7a8);audioDebugError.setVisibility(player.error().isEmpty()?View.GONE:View.VISIBLE);fields.addView(audioDebugError);
        details.addView(fields,new ScrollView.LayoutParams(-1,-2));body.addView(details,new LinearLayout.LayoutParams(0,px(250),1));
        audioLinkDialog=new AlertDialog.Builder(this).setTitle(R.string.audio_link_title).setView(body).setPositiveButton(R.string.close,(dialog,which)->dialog.dismiss()).create();
        audioLinkDialog.setOnDismissListener(dialog->{audioLinkDialog=null;audioDebugError=null;});audioLinkDialog.show();Window window=audioLinkDialog.getWindow();if(window!=null){window.setBackgroundDrawable(shape(INK,12,0xff343c3b,1));window.setLayout(px(760),WindowManager.LayoutParams.WRAP_CONTENT);}
        details.setNextFocusDownId(android.R.id.button1);
    }
    private void dismissAudioLink(){if(audioLinkDialog!=null)audioLinkDialog.dismiss();audioLinkDialog=null;audioDebugError=null;}
    @Override protected void onStart(){super.onStart();visible=true;list.setAdapter(adapter);bound=bindService(new Intent(this,PlaybackService.class),connection,BIND_AUTO_CREATE);main.post(tick);}
    @Override protected void onResume(){super.onResume();rhythm.setPageVisible(true);}
    @Override protected void onPause(){rhythm.setPageVisible(false);super.onPause();}
    @Override protected void onStop(){visible=false;dismissAudioLink();rhythm.setPageVisible(false);boolean wasSearching=searching;cancelSearch();if(wasSearching)status.setText(R.string.request_cancelled);main.removeCallbacks(tick);list.setAdapter(null);covers.trim();coverKey="";hero.setImageDrawable(MusicVisuals.artwork());if(player!=null)player.listen(null);if(bound)unbindService(connection);bound=false;player=null;super.onStop();}
    @Override protected void onDestroy(){searches.shutdownNow();covers.close();main.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override public void onTrimMemory(int level){super.onTrimMemory(level);if(covers!=null&&level>=TRIM_MEMORY_RUNNING_LOW){covers.trim();coverKey="";}}
    @Override protected void onSaveInstanceState(Bundle state){state.putString("query",query.getText().toString());super.onSaveInstanceState(state);}
    @Override public boolean onKeyDown(int key,KeyEvent event){
        if(key==KeyEvent.KEYCODE_BACK&&searching){cancelSearch();search.setEnabled(true);shuffle.setEnabled(true);status.setText(R.string.request_cancelled);return true;}
        if(player!=null)switch(key){case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:if(event.getRepeatCount()==0)player.toggle();return true;case KeyEvent.KEYCODE_MEDIA_PLAY:player.resume();return true;case KeyEvent.KEYCODE_MEDIA_PAUSE:player.pause(false);return true;case KeyEvent.KEYCODE_MEDIA_NEXT:player.next();return true;case KeyEvent.KEYCODE_MEDIA_PREVIOUS:player.previous();return true;case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:player.seek(player.position()+10000);return true;case KeyEvent.KEYCODE_MEDIA_REWIND:player.seek(player.position()-10000);return true;default:break;}
        return super.onKeyDown(key,event);
    }
    private class TrackAdapter extends BaseAdapter{
        public int getCount(){return tracks.size();}public Track getItem(int position){return tracks.get(position);}public long getItemId(int position){return position;}
        public View getView(int position,View recycled,ViewGroup parent){
            LinearLayout row;if(recycled instanceof LinearLayout)row=(LinearLayout)recycled;else{
                row=new LinearLayout(MainActivity.this);row.setGravity(Gravity.CENTER_VERTICAL);row.setPadding(px(7),px(5),px(8),px(5));row.setLayoutParams(new AbsListView.LayoutParams(-1,px(54)));
                ImageView cover=new ImageView(MainActivity.this);cover.setScaleType(ImageView.ScaleType.CENTER_CROP);row.addView(cover,new LinearLayout.LayoutParams(px(43),px(43)));
                LinearLayout labels=column();labels.setPadding(px(12),0,px(7),0);TextView name=text("",18,TEXT);name.setSingleLine();name.setEllipsize(TextUtils.TruncateAt.END);labels.addView(name);TextView singer=text("",12,MUTED);singer.setSingleLine();singer.setEllipsize(TextUtils.TruncateAt.END);labels.addView(singer);row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
                ImageView playing=new ImageView(MainActivity.this);playing.setImageDrawable(MusicVisuals.icon("waveform",MINT));row.addView(playing,new LinearLayout.LayoutParams(px(16),px(20)));TextView duration=text("",12,MUTED);duration.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);row.addView(duration,new LinearLayout.LayoutParams(px(39),-1));
            }
            Track track=getItem(position);boolean current=track.id.equals(currentId);row.setBackground(shape(current?0xff263736:0x00101416,7,current?0xff7baba0:0x00101416,1));
            covers.load(track.cover,(ImageView)row.getChildAt(0),160);LinearLayout labels=(LinearLayout)row.getChildAt(1);((TextView)labels.getChildAt(0)).setText(track.title);((TextView)labels.getChildAt(1)).setText(track.artist.isEmpty()?getString(R.string.unknown_artist):track.artist);
            row.getChildAt(2).setVisibility(current?View.VISIBLE:View.GONE);((TextView)row.getChildAt(3)).setText(track.duration>0?time(track.duration*1000):"");row.setContentDescription(track.title+", "+track.artist+(current?", "+getString(R.string.now_playing):""));return row;
        }
    }
    private LinearLayout column(){LinearLayout result=new LinearLayout(this);result.setOrientation(LinearLayout.VERTICAL);return result;}
    private int px(float value){float density=getResources().getDisplayMetrics().density;float fit=Math.min(getResources().getConfiguration().screenWidthDp/960f,getResources().getConfiguration().screenHeightDp/540f);return Math.max(1,Math.round(value*density*Math.max(.5f,fit)));}
    private TextView text(String value,int size,int color){TextView result=new TextView(this);result.setText(value);result.setTextSize(TypedValue.COMPLEX_UNIT_PX,px(size));result.setTextColor(color);result.setGravity(Gravity.CENTER_VERTICAL);result.setIncludeFontPadding(false);return result;}
    private Drawable shape(int color,int radius,int stroke,float width){GradientDrawable drawable=new GradientDrawable();drawable.setColor(color);drawable.setCornerRadius(px(radius));if(width>0)drawable.setStroke(px(width),stroke);return drawable;}
    private Drawable buttonBackground(boolean filled,int radius){StateListDrawable states=new StateListDrawable();states.addState(new int[]{android.R.attr.state_enabled,-android.R.attr.state_focused},shape(filled?MINT:0x00101416,radius,0,0));states.addState(new int[]{android.R.attr.state_focused},shape(filled?MINT:0xff253431,radius,TEXT,2));states.addState(new int[]{},shape(filled?0xff6b7973:0x00101416,radius,0,0));return states;}
    private ImageButton iconButton(String name,int description,Runnable action,boolean filled){ImageButton button=new ImageButton(this);button.setId(View.generateViewId());button.setImageDrawable(MusicVisuals.icon(name,filled?INK:TEXT));button.setContentDescription(getString(description));button.setScaleType(ImageView.ScaleType.FIT_CENTER);button.setPadding(px(8),px(8),px(8),px(8));button.setBackground(buttonBackground(filled,50));button.setDefaultFocusHighlightEnabled(false);button.setOnClickListener(v->action.run());return button;}
    private final class Scene extends ViewGroup{
        private final Map<View,Rect> frames=new HashMap<>();private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
        Scene(){super(MainActivity.this);setWillNotDraw(false);setBackgroundColor(INK);}
        void place(View view,int x,int y,int width,int height){frames.put(view,new Rect(x,y,x+width,y+height));addView(view);}
        void move(View view,int x,int y,int width,int height){frames.put(view,new Rect(x,y,x+width,y+height));requestLayout();}
        @Override protected void onMeasure(int width,int height){int w=MeasureSpec.getSize(width),h=MeasureSpec.getSize(height);setMeasuredDimension(w,h);float unit=Math.min(w/960f,h/540f);for(Map.Entry<View,Rect> entry:frames.entrySet()){Rect f=entry.getValue();entry.getKey().measure(MeasureSpec.makeMeasureSpec(Math.round(f.width()*unit),MeasureSpec.EXACTLY),MeasureSpec.makeMeasureSpec(Math.round(f.height()*unit),MeasureSpec.EXACTLY));}}
        @Override protected void onLayout(boolean changed,int left,int top,int right,int bottom){float unit=Math.min(getWidth()/960f,getHeight()/540f);int dx=Math.round((getWidth()-960*unit)/2),dy=Math.round((getHeight()-540*unit)/2);for(Map.Entry<View,Rect> entry:frames.entrySet()){Rect f=entry.getValue();entry.getKey().layout(dx+Math.round(f.left*unit),dy+Math.round(f.top*unit),dx+Math.round(f.right*unit),dy+Math.round(f.bottom*unit));}}
        @Override protected void onDraw(Canvas canvas){super.onDraw(canvas);paint.setShader(new RadialGradient(getWidth()*.55f,getHeight()*.53f,getWidth()*.38f,0xff192d2c,INK,Shader.TileMode.CLAMP));canvas.drawRect(0,0,getWidth(),getHeight(),paint);paint.setShader(null);}
    }
    static String time(long millis){long seconds=Math.max(0,millis/1000);return String.format(Locale.ROOT,"%d:%02d",seconds/60,seconds%60);}
}
