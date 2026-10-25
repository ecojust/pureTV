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

/** One remote-first screen: search, an offline library, artwork and a decorative rhythm. */
public class MainActivity extends Activity {
    private static final int INK=0xff101416, TEXT=0xfff1f0e8, MUTED=0xff8f9998, MINT=0xffc5e4d2;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ThreadPoolExecutor searches=new ThreadPoolExecutor(1,1,20,TimeUnit.SECONDS,
            new ArrayBlockingQueue<>(1),new ThreadPoolExecutor.DiscardOldestPolicy());
    private final List<Track> tracks=new ArrayList<>();
    private final List<Track> localTracks=new ArrayList<>();
    private final TrackAdapter adapter=new TrackAdapter();
    private Future<?> searchJob;
    private Runnable searchTimeout;
    private int searchGeneration;
    private boolean visible,bound,searching,seeking,localMode=true,selectionMode;
    private long shownLibraryRevision=Long.MIN_VALUE;
    private ListPosition searchPosition=new ListPosition(),localPosition=new ListPosition();
    private String searchStatus="";
    private PlaybackService player;
    private CoverLoader covers;
    private Scene scene;
    private EditText query;
    private Button login,searchTab,localTab,localSequential,localShuffle,selectMode,selectAll,deleteSelected;
    private final Set<String> selectedIds=new LinkedHashSet<>();
    private TextView selectionCount;
    private AlertDialog deleteDialog,deleteFailureDialog;
    private ImageButton search,toggle,previous,next,audioQr;
    private ImageView hero;
    private TextView status,title,artist,now,elapsed,total;
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
        super.onCreate(state);covers=new CoverLoader();searches.allowCoreThreadTimeOut(true);searchStatus=getString(R.string.welcome);
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
        scene.place(query,255,20,609,40);
        search=iconButton("search",R.string.search,()->search(),false);scene.place(search,820,23,36,34);
        login=new Button(this);login.setId(View.generateViewId());login.setText(R.string.sign_in_short);login.setContentDescription(getString(R.string.account));login.setTextColor(MINT);login.setAllCaps(false);login.setTextSize(TypedValue.COMPLEX_UNIT_PX,px(13));login.setFocusable(true);login.setFocusableInTouchMode(true);login.setMinWidth(0);login.setMinimumWidth(0);login.setMinHeight(0);login.setMinimumHeight(0);login.setPadding(0,0,0,0);login.setBackground(buttonBackground(false,15));login.setDefaultFocusHighlightEnabled(false);login.setOnClickListener(v->startActivity(new Intent(this,LoginActivity.class)));scene.place(login,875,22,58,36);
        searchTab=browseTab(R.string.search_results,false);scene.place(searchTab,35,85,130,30);localTab=browseTab(R.string.local_songs,true);scene.place(localTab,173,85,126,30);
        status=text(getString(R.string.library_empty_count),13,MUTED);status.setMaxLines(2);status.setEllipsize(TextUtils.TruncateAt.END);scene.place(status,35,116,265,34);
        localSequential=compactButton(R.string.local_sequential,()->playLocal(false));scene.place(localSequential,35,154,82,27);
        localShuffle=compactButton(R.string.shuffle,()->playLocal(true));scene.place(localShuffle,123,154,82,27);
        selectMode=compactButton(R.string.select_tracks,()->setSelectionMode(!selectionMode));scene.place(selectMode,211,154,88,27);
        selectAll=compactButton(R.string.select_all,()->{if(selectedIds.size()==localTracks.size())selectedIds.clear();else{selectedIds.clear();for(Track track:localTracks)selectedIds.add(track.id);}adapter.notifyDataSetChanged();updateSelectionControls();});scene.place(selectAll,35,184,64,26);
        deleteSelected=compactButton(R.string.delete_selected,()->confirmDelete());scene.place(deleteSelected,105,184,102,26);
        selectionCount=text("",11,MUTED);selectionCount.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);scene.place(selectionCount,213,184,86,26);
        list=new ListView(this);list.setId(View.generateViewId());list.setDivider(null);list.setDividerHeight(0);list.setPadding(px(3),px(3),px(3),px(3));list.setClipToPadding(false);
        list.setSelector(R.drawable.list_focus);list.setDrawSelectorOnTop(true);list.setOverScrollMode(View.OVER_SCROLL_NEVER);list.setVerticalScrollBarEnabled(false);list.setFocusable(true);list.setAdapter(adapter);
        list.setOnItemClickListener((parent,row,position,id)->play(position));scene.place(list,27,157,280,329);
        hero=new ImageView(this);hero.setId(View.generateViewId());hero.setScaleType(ImageView.ScaleType.CENTER_CROP);hero.setImageDrawable(MusicVisuals.artwork());hero.setContentDescription(getString(R.string.album_artwork));
        hero.setClipToOutline(true);hero.setOutlineProvider(new ViewOutlineProvider(){@Override public void getOutline(View view,Outline outline){outline.setRoundRect(0,0,view.getWidth(),view.getHeight(),px(10));}});scene.place(hero,334,75,294,294);
        now=text(getString(R.string.ready_to_listen),12,MINT);now.setGravity(Gravity.CENTER);now.setSingleLine();now.setEllipsize(TextUtils.TruncateAt.END);scene.place(now,332,372,298,22);
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
        linkFocus();updateTabs();updateSelectionControls();setContentView(scene);if(state!=null)query.setText(state.getString("query",""));localTab.requestFocus();render();
    }
    private void linkFocus(){
        query.setNextFocusRightId(search.getId());query.setNextFocusDownId(localTab.getId());search.setNextFocusLeftId(query.getId());search.setNextFocusRightId(login.getId());search.setNextFocusDownId(searchTab.getId());
        searchTab.setNextFocusRightId(localTab.getId());localTab.setNextFocusLeftId(searchTab.getId());searchTab.setNextFocusUpId(query.getId());localTab.setNextFocusUpId(query.getId());searchTab.setNextFocusDownId(list.getId());localTab.setNextFocusDownId(list.getId());
        login.setNextFocusLeftId(search.getId());login.setNextFocusDownId(seek.getId());list.setNextFocusUpId(localSequential.getId());list.setNextFocusRightId(toggle.getId());
        localSequential.setNextFocusRightId(localShuffle.getId());localShuffle.setNextFocusLeftId(localSequential.getId());localShuffle.setNextFocusRightId(selectMode.getId());selectMode.setNextFocusLeftId(localShuffle.getId());
        for(Button control:new Button[]{localSequential,localShuffle,selectMode}){control.setNextFocusUpId(localTab.getId());control.setNextFocusDownId(list.getId());}
        selectAll.setNextFocusRightId(deleteSelected.getId());deleteSelected.setNextFocusLeftId(selectAll.getId());selectAll.setNextFocusUpId(selectMode.getId());deleteSelected.setNextFocusUpId(selectMode.getId());selectAll.setNextFocusDownId(list.getId());deleteSelected.setNextFocusDownId(list.getId());
        seek.setNextFocusUpId(search.getId());seek.setNextFocusDownId(toggle.getId());
        audioQr.setNextFocusUpId(search.getId());audioQr.setNextFocusDownId(seek.getId());audioQr.setNextFocusLeftId(list.getId());audioQr.setNextFocusRightId(seek.getId());
        previous.setNextFocusRightId(toggle.getId());previous.setNextFocusLeftId(list.getId());previous.setNextFocusUpId(seek.getId());toggle.setNextFocusLeftId(previous.getId());toggle.setNextFocusRightId(next.getId());toggle.setNextFocusUpId(seek.getId());next.setNextFocusLeftId(toggle.getId());next.setNextFocusUpId(seek.getId());
    }
    private Button compactButton(int label,Runnable action){Button button=new Button(this);button.setId(View.generateViewId());button.setText(label);button.setAllCaps(false);button.setTextSize(TypedValue.COMPLEX_UNIT_PX,px(12));button.setTextColor(MINT);button.setMinWidth(0);button.setMinimumWidth(0);button.setMinHeight(0);button.setMinimumHeight(0);button.setPadding(px(5),0,px(5),0);button.setBackground(buttonBackground(false,7));button.setDefaultFocusHighlightEnabled(false);button.setFocusable(true);button.setFocusableInTouchMode(true);button.setOnClickListener(v->action.run());return button;}
    private Button browseTab(int label,boolean local){Button button=compactButton(label,()->setLocalMode(local));button.setTextSize(TypedValue.COMPLEX_UNIT_PX,px(14));button.setTypeface(null,Typeface.BOLD);return button;}
    private List<Track> displayedTracks(){return localMode?localTracks:tracks;}
    private void updateTabs(){searchTab.setSelected(!localMode);localTab.setSelected(localMode);searchTab.setTextColor(localMode?MUTED:INK);localTab.setTextColor(localMode?INK:MUTED);searchTab.setBackground(buttonBackground(!localMode,9));localTab.setBackground(buttonBackground(localMode,9));query.setNextFocusDownId(localMode?localTab.getId():searchTab.getId());}
    private void showListStatus(){status.setText(localMode?(localTracks.isEmpty()?getString(R.string.library_empty_count):getString(R.string.library_count,localTracks.size())):searchStatus);}
    private void setLocalMode(boolean local){
        if(localMode==local){showListStatus();return;}
        if(localMode)localPosition=captureListPosition();else searchPosition=captureListPosition();
        if(local&&searching){cancelSearch();searchStatus=getString(R.string.request_cancelled);}
        localMode=local;selectionMode=false;selectedIds.clear();updateTabs();adapter.notifyDataSetChanged();updateSelectionControls();restoreListPosition(local?localPosition:searchPosition);showListStatus();
    }
    private void refreshLibrary(){
        if(player==null)return;long revision=player.libraryRevision();if(revision==shownLibraryRevision)return;
        ListPosition position=localMode?captureListPosition():localPosition;List<Track> saved=player.localTracks();shownLibraryRevision=player.libraryRevision();localTracks.clear();localTracks.addAll(saved);
        Set<String> existing=new HashSet<>();for(Track track:localTracks)existing.add(track.id);selectedIds.retainAll(existing);
        if(localTracks.isEmpty())selectionMode=false;
        if(localMode){adapter.notifyDataSetChanged();updateSelectionControls();restoreListPosition(position);showListStatus();}
    }
    private static final class ListPosition {String selectedId="",firstId="";int selectedIndex=-1,firstIndex,selectedOffset,firstOffset;}
    private ListPosition captureListPosition(){
        ListPosition position=new ListPosition();if(list==null)return position;List<Track> shown=displayedTracks();position.selectedIndex=list.getSelectedItemPosition();position.firstIndex=list.getFirstVisiblePosition();
        if(position.selectedIndex>=0&&position.selectedIndex<shown.size())position.selectedId=shown.get(position.selectedIndex).id;
        if(position.firstIndex>=0&&position.firstIndex<shown.size())position.firstId=shown.get(position.firstIndex).id;
        View first=list.getChildAt(0),selected=list.getSelectedView();position.firstOffset=first==null?0:first.getTop()-list.getPaddingTop();position.selectedOffset=selected==null?position.firstOffset:selected.getTop()-list.getPaddingTop();return position;
    }
    private void restoreListPosition(ListPosition position){
        List<Track> shown=displayedTracks();if(shown.isEmpty())return;int selected=indexOf(shown,position.selectedId),first=indexOf(shown,position.firstId);
        if(selected>=0)list.setSelectionFromTop(selected,position.selectedOffset);else if(position.selectedIndex>=0)list.setSelectionFromTop(Math.min(position.selectedIndex,shown.size()-1),position.selectedOffset);else list.setSelectionFromTop(first>=0?first:Math.min(Math.max(0,position.firstIndex),shown.size()-1),position.firstOffset);
    }
    private int indexOf(List<Track> values,String id){for(int i=0;i<values.size();i++)if(values.get(i).id.equals(id))return i;return -1;}
    private void setSelectionMode(boolean value){if(!localMode||value&&localTracks.isEmpty())return;ListPosition position=captureListPosition();selectionMode=value;if(!value)selectedIds.clear();adapter.notifyDataSetChanged();updateSelectionControls();restoreListPosition(position);if(localTracks.isEmpty())localSequential.requestFocus();else selectMode.requestFocus();}
    private void updateSelectionControls(){
        if(list==null)return;boolean selectionHadFocus=selectAll.hasFocus()||deleteSelected.hasFocus();int localVisibility=localMode?View.VISIBLE:View.GONE,selectionVisibility=localMode&&selectionMode?View.VISIBLE:View.GONE;
        localSequential.setVisibility(localVisibility);localShuffle.setVisibility(localVisibility);selectMode.setVisibility(localVisibility);selectMode.setEnabled(!localTracks.isEmpty());selectMode.setText(selectionMode?R.string.selection_done:R.string.select_tracks);
        selectAll.setVisibility(selectionVisibility);deleteSelected.setVisibility(selectionVisibility);selectionCount.setVisibility(selectionVisibility);selectAll.setText(!localTracks.isEmpty()&&selectedIds.size()==localTracks.size()?R.string.clear_selection:R.string.select_all);deleteSelected.setEnabled(!selectedIds.isEmpty());selectionCount.setText(getString(R.string.selected_count,selectedIds.size()));
        scene.move(list,27,localMode?(selectionMode?217:187):157,280,localMode?(selectionMode?252:299):329);
        localTab.setNextFocusDownId(localMode?localSequential.getId():list.getId());searchTab.setNextFocusDownId(localMode?localSequential.getId():list.getId());selectMode.setNextFocusDownId(selectionMode?selectAll.getId():list.getId());list.setNextFocusUpId(localMode?(selectionMode?selectAll.getId():localSequential.getId()):searchTab.getId());
        if(localMode&&selectionHadFocus&&!selectionMode){if(localTracks.isEmpty())localSequential.requestFocus();else selectMode.requestFocus();}else if(localMode&&deleteSelected.hasFocus()&&selectedIds.isEmpty())selectAll.requestFocus();
    }
    private void confirmDelete(){
        if(player==null||selectedIds.isEmpty())return;Set<String> confirmed=new LinkedHashSet<>(selectedIds);
        deleteDialog=new AlertDialog.Builder(this).setTitle(R.string.delete_confirm_title).setMessage(getString(R.string.delete_confirm_message,confirmed.size())).setNegativeButton(R.string.cancel,null).setPositiveButton(R.string.delete_selected,(dialog,which)->{
            if(player==null)return;int removed=player.deleteLocalTracks(confirmed);if(removed<0){deleteFailureDialog=new AlertDialog.Builder(this).setTitle(R.string.library_delete_failed).setMessage(player.libraryError()).setPositiveButton(R.string.close,null).create();deleteFailureDialog.setOnDismissListener(closed->deleteFailureDialog=null);deleteFailureDialog.show();return;}
            selectedIds.clear();setSelectionMode(false);refreshLibrary();showListStatus();Toast.makeText(this,removed==0?getString(R.string.local_selection_gone):getString(R.string.local_deleted,removed),Toast.LENGTH_LONG).show();
        }).create();deleteDialog.setOnDismissListener(dialog->deleteDialog=null);deleteDialog.show();
    }
    private void search(){String keyword=query.getText().toString().trim();if(keyword.isEmpty()){query.requestFocus();return;}load(keyword);}
    private void playLocal(boolean random){if(localTracks.isEmpty()){status.setText(R.string.local_empty);searchTab.requestFocus();return;}if(player!=null)player.playLocalList(new ArrayList<>(localTracks),random);showListStatus();render();}
    List<Track> searchTracks(String keyword)throws IOException{return HifiniApi.get().search(keyword);}
    private void load(String keyword){
        setLocalMode(false);cancelSearch();searching=true;searchStatus=getString(R.string.searching);status.setText(searchStatus);
        search.setEnabled(false);int ticket=searchGeneration;
        searchTimeout=()->{if(visible&&ticket==searchGeneration&&searching){cancelSearch();searchStatus=getString(R.string.search_timeout);if(!localMode){status.setText(searchStatus);query.requestFocus();}}};main.postDelayed(searchTimeout,20000);
        searchJob=searches.submit(()->{try{List<Track> found=searchTracks(keyword);main.post(()->{
            if(!visible||ticket!=searchGeneration)return;finishSearch();tracks.clear();tracks.addAll(found);adapter.notifyDataSetChanged();
            searchStatus=found.isEmpty()?getString(R.string.no_results):getString(R.string.results_count,found.size());status.setText(searchStatus);searchPosition=new ListPosition();
            if(!found.isEmpty()){list.requestFocus();list.setSelection(0);}render();
        });}catch(Exception e){String reason=MusicError.display(this,e);boolean needsLogin=requiresLogin(e);main.post(()->{if(visible&&ticket==searchGeneration){finishSearch();searchStatus=getString(R.string.search_failed,reason);if(!localMode){status.setText(searchStatus);if(needsLogin)login.requestFocus();else query.requestFocus();}}});}});
    }
    private boolean requiresLogin(Throwable error){for(Throwable cause=error;cause!=null;cause=cause.getCause())if(cause instanceof MusicError&&((MusicError)cause).resource==R.string.source_login_required)return true;return false;}
    private void finishSearch(){if(searchTimeout!=null)main.removeCallbacks(searchTimeout);searchTimeout=null;searching=false;search.setEnabled(true);}
    private void cancelSearch(){searchGeneration++;if(searchJob!=null)searchJob.cancel(true);searchJob=null;searches.purge();if(searchTimeout!=null)main.removeCallbacks(searchTimeout);searchTimeout=null;searching=false;if(search!=null)search.setEnabled(true);}
    private void play(int position){List<Track> shown=displayedTracks();if(position<0||position>=shown.size())return;if(localMode&&selectionMode){String id=shown.get(position).id;if(!selectedIds.add(id))selectedIds.remove(id);adapter.notifyDataSetChanged();updateSelectionControls();return;}if(player==null)return;if(localMode)player.playLocalListAt(new ArrayList<>(shown),position);else player.playListAt(new ArrayList<>(shown),position);}
    private void render(){
        if(toggle==null)return;
        Track track=player==null?null:player.current();String id=track==null?"":track.id;
        if(!id.equals(currentId)){currentId=id;adapter.notifyDataSetChanged();}
        refreshLibrary();
        title.setText(track==null?getString(R.string.choose_track):track.title);artist.setText(track==null?"HiFiNi":track.artist.isEmpty()?getString(R.string.unknown_artist):track.artist);
        String key=track==null?"":track.cover;if(!key.equals(coverKey)){coverKey=key;covers.load(key,hero,512);}
        boolean loading=player!=null&&player.loading(),playing=player!=null&&player.playing();
        toggle.setImageDrawable(MusicVisuals.icon(loading?"close":playing?"pause":"play",INK));toggle.setContentDescription(getString(loading?R.string.cancel:playing?R.string.pause:R.string.play));toggle.setEnabled(track!=null);
        previous.setEnabled(track!=null);next.setEnabled(track!=null);
        String error=player==null?"":player.error();now.setText(track==null?getString(R.string.ready_to_listen):loading?player.stage():!error.isEmpty()?getString(R.string.playback_failed):playing?getString(R.string.now_playing):getString(R.string.paused));
        if(!error.equals(shownError)){shownError=error;if(!error.isEmpty())status.setText(getString(R.string.retry_audio,error));else if(!searching)showListStatus();}
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
            else{if(audioQr.hasFocus())query.requestFocus();audioQr.setImageDrawable(null);}
            audioQr.setVisibility(available?View.VISIBLE:View.GONE);
            scene.move(title,323,394,available?250:316,32);scene.move(artist,331,427,available?242:300,22);
            login.setNextFocusDownId(available?audioQr.getId():seek.getId());seek.setNextFocusUpId(available?audioQr.getId():search.getId());list.setNextFocusRightId(available?audioQr.getId():toggle.getId());
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
    @Override protected void onStart(){super.onStart();visible=true;list.setAdapter(adapter);restoreListPosition(localMode?localPosition:searchPosition);bound=bindService(new Intent(this,PlaybackService.class),connection,BIND_AUTO_CREATE);main.post(tick);}
    @Override protected void onResume(){super.onResume();rhythm.setPageVisible(true);}
    @Override protected void onPause(){rhythm.setPageVisible(false);super.onPause();}
    @Override protected void onStop(){visible=false;dismissAudioLink();if(deleteDialog!=null)deleteDialog.dismiss();if(deleteFailureDialog!=null)deleteFailureDialog.dismiss();rhythm.setPageVisible(false);boolean wasSearching=searching;cancelSearch();if(wasSearching){searchStatus=getString(R.string.request_cancelled);showListStatus();}main.removeCallbacks(tick);if(localMode)localPosition=captureListPosition();else searchPosition=captureListPosition();list.setAdapter(null);covers.trim();coverKey="";hero.setImageDrawable(MusicVisuals.artwork());if(player!=null)player.listen(null);if(bound)unbindService(connection);bound=false;player=null;super.onStop();}
    @Override protected void onDestroy(){searches.shutdownNow();covers.close();main.removeCallbacksAndMessages(null);super.onDestroy();}
    @Override public void onTrimMemory(int level){super.onTrimMemory(level);if(covers!=null&&level>=TRIM_MEMORY_RUNNING_LOW){covers.trim();coverKey="";}}
    @Override protected void onSaveInstanceState(Bundle state){state.putString("query",query.getText().toString());super.onSaveInstanceState(state);}
    @Override public boolean onKeyDown(int key,KeyEvent event){
        if(key==KeyEvent.KEYCODE_BACK&&searching){cancelSearch();searchStatus=getString(R.string.request_cancelled);showListStatus();return true;}
        if(key==KeyEvent.KEYCODE_BACK&&selectionMode){setSelectionMode(false);return true;}
        if(player!=null)switch(key){case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:if(event.getRepeatCount()==0)player.toggle();return true;case KeyEvent.KEYCODE_MEDIA_PLAY:player.resume();return true;case KeyEvent.KEYCODE_MEDIA_PAUSE:player.pause(false);return true;case KeyEvent.KEYCODE_MEDIA_NEXT:player.next();return true;case KeyEvent.KEYCODE_MEDIA_PREVIOUS:player.previous();return true;case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:player.seek(player.position()+10000);return true;case KeyEvent.KEYCODE_MEDIA_REWIND:player.seek(player.position()-10000);return true;default:break;}
        return super.onKeyDown(key,event);
    }
    private class TrackAdapter extends BaseAdapter{
        public int getCount(){return displayedTracks().size();}public Track getItem(int position){return displayedTracks().get(position);}public long getItemId(int position){return position;}
        public View getView(int position,View recycled,ViewGroup parent){
            LinearLayout row;TrackRow cells;if(recycled instanceof LinearLayout&&recycled.getTag() instanceof TrackRow){row=(LinearLayout)recycled;cells=(TrackRow)row.getTag();}else{
                row=new LinearLayout(MainActivity.this);row.setGravity(Gravity.CENTER_VERTICAL);cells=new TrackRow();row.setTag(cells);
                cells.check=new CheckBox(MainActivity.this);cells.check.setFocusable(false);cells.check.setClickable(false);cells.check.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);cells.check.setButtonTintList(android.content.res.ColorStateList.valueOf(MINT));cells.check.setPadding(0,0,0,0);row.addView(cells.check,new LinearLayout.LayoutParams(px(26),px(30)));
                cells.cover=new ImageView(MainActivity.this);cells.cover.setScaleType(ImageView.ScaleType.CENTER_CROP);row.addView(cells.cover,new LinearLayout.LayoutParams(px(43),px(43)));
                LinearLayout labels=column();labels.setPadding(px(12),0,px(7),0);cells.name=text("",18,TEXT);cells.name.setSingleLine();cells.name.setEllipsize(TextUtils.TruncateAt.END);labels.addView(cells.name);cells.artist=text("",12,MUTED);cells.artist.setSingleLine();cells.artist.setEllipsize(TextUtils.TruncateAt.END);labels.addView(cells.artist);row.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
                cells.playing=new ImageView(MainActivity.this);cells.playing.setImageDrawable(MusicVisuals.icon("waveform",MINT));row.addView(cells.playing,new LinearLayout.LayoutParams(px(16),px(20)));cells.duration=text("",12,MUTED);cells.duration.setGravity(Gravity.RIGHT|Gravity.CENTER_VERTICAL);row.addView(cells.duration,new LinearLayout.LayoutParams(px(39),-1));
            }
            row.setPadding(px(7),px(localMode?3:5),px(8),px(localMode?3:5));row.setLayoutParams(new AbsListView.LayoutParams(-1,px(localMode?49:54)));
            Track track=getItem(position);boolean current=track.id.equals(currentId),checked=localMode&&selectionMode&&selectedIds.contains(track.id);row.setBackground(shape(checked?0xff30463b:current?0xff263736:0x00101416,7,checked?MINT:current?0xff7baba0:0x00101416,1));
            cells.check.setVisibility(localMode&&selectionMode?View.VISIBLE:View.GONE);cells.check.setChecked(checked);covers.load(track.cover,cells.cover,160);cells.name.setText(track.title);cells.artist.setText(track.artist.isEmpty()?getString(R.string.unknown_artist):track.artist);
            cells.playing.setVisibility(current?View.VISIBLE:View.GONE);cells.duration.setText(track.duration>0?time(track.duration*1000):"");row.setContentDescription(track.title+", "+track.artist+(current?", "+getString(R.string.now_playing):"")+(localMode&&selectionMode?", "+getString(checked?R.string.track_selected:R.string.track_not_selected):""));return row;
        }
    }
    private static final class TrackRow{CheckBox check;ImageView cover,playing;TextView name,artist,duration;}
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
