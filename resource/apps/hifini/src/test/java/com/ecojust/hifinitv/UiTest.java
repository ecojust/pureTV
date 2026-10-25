package com.ecojust.hifinitv;

import android.content.*;
import android.app.AlertDialog;
import android.database.DataSetObserver;
import android.graphics.*;
import android.graphics.drawable.BitmapDrawable;
import android.os.Looper;
import android.os.Bundle;
import android.provider.Settings;
import android.view.*;
import android.widget.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.*;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowChoreographer;
import org.robolectric.shadows.ShadowToast;
import java.io.*;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.*;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@LooperMode(LooperMode.Mode.PAUSED)
public class UiTest {
    private ServiceController<PreviewPlayer> service;
    public static class PreviewPlayer extends PlaybackService {
        Track track; List<Track> selected=new ArrayList<>(),saved=new ArrayList<>(); boolean active,random,busy;
        int selectedIndex=-1,plays,cancellations,onlinePlays,localSelections,localShuffles,localSequentialCalls,libraryReads,deletions;long revision;
        boolean deletionFails,transferring,interrupted;long receivedBytes,totalBytes=-1;Set<String> requestedDeletion=new LinkedHashSet<>();
        String attemptedUrl="",failure="",progressStage="";
        Runnable callback;
        @Override void listen(Runnable value){callback=value;}
        void update(){if(callback!=null)callback.run();}
        @Override Track current(){return track;}
        @Override boolean loading(){return busy;}
        @Override boolean downloading(){return transferring;}
        @Override long downloadedBytes(){return receivedBytes;}
        @Override long downloadTotalBytes(){return totalBytes;}
        @Override boolean interruptedDownload(){return interrupted;}
        @Override boolean playing(){return active;}
        @Override String stage(){return progressStage;}
        @Override String error(){return failure;}
        @Override String audioUrl(){return attemptedUrl;}
        @Override List<Track> localTracks(){libraryReads++;return new ArrayList<>(saved);}
        @Override long libraryRevision(){return revision;}
        void saveLibrary(List<Track> tracks){saved=new ArrayList<>(tracks);revision++;update();}
        @Override boolean shuffled(){return random;}
        @Override long position(){return track==null?0:88000;}
        @Override long duration(){return track==null?0:226000;}
        private void select(List<Track> tracks,int index,boolean shuffled){selected=new ArrayList<>(tracks);random=shuffled;selectedIndex=index;track=tracks.get(index);active=true;plays++;update();}
        @Override void playList(List<Track> tracks,boolean shuffled){onlinePlays++;select(tracks,0,shuffled);}
        @Override void playListAt(List<Track> tracks,int index){onlinePlays++;select(tracks,index,false);}
        @Override void playLocalList(List<Track> tracks,boolean shuffled){if(shuffled)localShuffles++;else localSequentialCalls++;select(tracks,0,shuffled);}
        @Override void playLocalListAt(List<Track> tracks,int index){localSelections++;select(tracks,index,false);}
        @Override int deleteLocalTracks(Collection<String> ids){deletions++;requestedDeletion=new LinkedHashSet<>(ids);if(deletionFails)return -1;int before=saved.size();saved.removeIf(track->ids.contains(track.id));int removed=before-saved.size();if(removed>0){revision++;update();}return removed;}
        @Override String libraryError(){return deletionFails?"Storage unavailable":"";}
        @Override void toggle(){if(busy){busy=false;transferring=false;active=false;cancellations++;}else{interrupted=false;failure="";active=!active;}update();}
        @Override void previous(){selectedIndex--;}
        @Override void next(){selectedIndex++;}
        @Override void seek(long value){}
    }
    public static class SourceActivity extends MainActivity {
        volatile int searches;volatile String keyword="";
        @Override List<Track> searchTracks(String value){searches++;keyword=value;return samples("en".equals(getResources().getConfiguration().getLocales().get(0).getLanguage()));}
    }
    public static class LoginRequiredActivity extends MainActivity {
        @Override List<Track> searchTracks(String value)throws IOException{throw new MusicError(R.string.source_login_required);}
    }
    public static class SlowSourceActivity extends MainActivity {
        volatile boolean entered;
        @Override List<Track> searchTracks(String value)throws IOException{
            entered=true;
            try{new java.util.concurrent.CountDownLatch(1).await();return Collections.emptyList();}
            catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException("cancelled");}
        }
    }
    @Before public void bindPreviewPlayer()throws Exception{
        PlaybackRecoveryStore.awaitWritesForTest();
        File filesDir=RuntimeEnvironment.getApplication().getFilesDir();PlaybackRecoveryStore.resetMemoryForTest(filesDir);
        File previousState=new File(filesDir,PlaybackRecoveryStore.FILE_NAME);assertTrue(!previousState.exists()||previousState.delete());
        // Drive virtual vsync explicitly; its default auto-advance never idles a repeating animation.
        ShadowChoreographer.setPaused(true);
        ShadowChoreographer.setFrameDelay(Duration.ofMillis(16));
        Settings.Global.putFloat(RuntimeEnvironment.getApplication().getContentResolver(),Settings.Global.ANIMATOR_DURATION_SCALE,1f);
        service=Robolectric.buildService(PreviewPlayer.class).create();
        shadowOf(RuntimeEnvironment.getApplication()).setComponentNameAndServiceForBindService(new ComponentName(RuntimeEnvironment.getApplication(),PlaybackService.class),service.get().onBind(new Intent()));
    }
    @After public void release()throws Exception{service.destroy();PlaybackRecoveryStore.awaitWritesForTest();}
    private static List<Track> samples(boolean english){
        String[] titles=english?new String[]{"Night Star","Night Voyage","After Midnight","Coastal Night","When Night Falls","Waiting for Night"}:new String[]{"夜行星","夜航","夜色未央","沿海的夜","入夜以后","等夜归来"};
        String[] artists=english?new String[]{"Forest Guest","Slow Island","North Shore","Wood and Blue","Daylight","Mountains and Sea"}:new String[]{"林间来客","慢岛乐队","北岸","木与蓝","拾光","山海计划"};
        List<Track> result=new ArrayList<>();for(int i=0;i<titles.length;i++)result.add(new Track(String.valueOf(100+i),titles[i],artists[i],"",226+i*6));return result;
    }
    private static List<Track> librarySamples(int count){List<Track> tracks=new ArrayList<>();for(int i=0;i<count;i++)tracks.add(Track.catalog("netease",String.valueOf(10000+i),"0","Saved song "+(i+1),"Local artist","",180+i));return tracks;}
    private static List<String> identities(List<Track> tracks){List<String> ids=new ArrayList<>();for(Track track:tracks)ids.add(track.id);return ids;}
    private static View findDescription(View root,String description){if(description.contentEquals(root.getContentDescription()==null?"":root.getContentDescription()))return root;if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){View found=findDescription(((ViewGroup)root).getChildAt(i),description);if(found!=null)return found;}return null;}
    private static TextView findText(View root,String text){if(root instanceof TextView&&text.contentEquals(((TextView)root).getText()))return (TextView)root;if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++){TextView found=findText(((ViewGroup)root).getChildAt(i),text);if(found!=null)return found;}return null;}
    @SuppressWarnings("unchecked") private static <T>T field(Object target,String name)throws Exception{Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return (T)f.get(target);}
    private static void layout(View root,int width,int height){root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(80));root.measure(View.MeasureSpec.makeMeasureSpec(width,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(height,View.MeasureSpec.EXACTLY));root.layout(0,0,width,height);}
    private static void await(java.util.function.BooleanSupplier condition)throws Exception{for(int i=0;i<300;i++){shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(16));if(condition.getAsBoolean())return;Thread.sleep(10);}fail("Asynchronous UI state was not rendered");}
    @Test public void localLibraryOpensByDefaultAndEmptyShuffleNeverStartsAnOnlineSearch()throws Exception{
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");Button localTab=field(a,"localTab"),searchTab=field(a,"searchTab");
            assertTrue((Boolean)field(a,"localMode"));assertEquals(0,list.getCount());assertEquals(a.getString(R.string.local_songs),localTab.getText().toString());assertEquals(a.getString(R.string.search_results),searchTab.getText().toString());
            assertNotNull(findText(root,a.getString(R.string.library_empty_count)));assertEquals(0,a.searches);assertEquals(0,service.get().plays);
            ((EditText)field(a,"query")).setText("An entered keyword must not start an online request");
            for(String control:new String[]{"localSequential","localShuffle"}){((Button)field(a,control)).performClick();assertNotNull(findText(root,a.getString(R.string.local_empty)));assertTrue(searchTab.isFocused());assertTrue((Boolean)field(a,"localMode"));}
            assertEquals(0,a.searches);assertEquals(0,service.get().plays);assertEquals(0,service.get().localShuffles);assertEquals(0,service.get().localSequentialCalls);assertFalse(((Button)field(a,"selectMode")).isEnabled());
        }
    }
    @Test public void savedLibraryShowsAllFiftySongsAndTheCapacityPolicy()throws Exception{
        service.get().saveLibrary(librarySamples(50));
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");
            assertTrue((Boolean)field(a,"localMode"));assertEquals(50,list.getCount());assertEquals("netease:10049",((Track)list.getAdapter().getItem(49)).id);
            assertNotNull(findText(root,a.getString(R.string.library_count,50)));assertEquals(0,a.searches);assertEquals(0,service.get().plays);
        }
    }
    @Test public void switchingTabsPreservesTheQueryAndSearchResultsWithoutAnotherRequest()throws Exception{
        service.get().saveLibrary(librarySamples(2));
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");EditText query=field(a,"query");
            assertEquals(2,list.getCount());query.setText("夜");findDescription(root,a.getString(R.string.search)).performClick();await(()->list.getCount()==6);
            assertFalse((Boolean)field(a,"localMode"));assertEquals(1,a.searches);List<String> results=identities(field(a,"tracks"));
            query.setText("unsubmitted query");((Button)field(a,"localTab")).performClick();assertTrue((Boolean)field(a,"localMode"));assertEquals(2,list.getCount());assertEquals("netease:10000",((Track)list.getAdapter().getItem(0)).id);
            assertEquals(results,identities(field(a,"tracks")));assertEquals("unsubmitted query",query.getText().toString());assertNotNull(findText(root,a.getString(R.string.library_count,2)));
            ((Button)field(a,"searchTab")).performClick();assertFalse((Boolean)field(a,"localMode"));assertEquals(6,list.getCount());assertEquals(results,identities(field(a,"tracks")));assertEquals("100",((Track)list.getAdapter().getItem(0)).id);
            assertEquals("unsubmitted query",query.getText().toString());assertEquals(1,a.searches);assertEquals(0,service.get().plays);
        }
    }
    @Test public void localRowsSequentialAndShuffleUseOnlyTheOfflinePlaybackMethods()throws Exception{
        List<Track> saved=librarySamples(6);service.get().saveLibrary(saved);
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");
            ((EditText)field(a,"query")).setText("夜");findDescription(root,a.getString(R.string.search)).performClick();await(()->a.searches==1&&list.getCount()==6&&!((Boolean)uncheckedField(a,"localMode")));
            ((Button)field(a,"localTab")).performClick();layout(root,1920,1080);list.performItemClick(list.getChildAt(3),3,3);
            PreviewPlayer p=service.get();assertEquals(1,p.localSelections);assertEquals(0,p.localShuffles);assertEquals(0,p.onlinePlays);assertEquals(3,p.selectedIndex);assertEquals(saved.get(3).id,p.track.id);assertFalse(p.random);
            ((Button)field(a,"localSequential")).performClick();assertEquals(1,p.localSequentialCalls);assertEquals(0,p.selectedIndex);assertEquals(saved.get(0).id,p.track.id);assertFalse(p.random);assertEquals(identities(saved),identities(p.selected));
            ((Button)field(a,"localShuffle")).performClick();assertEquals(1,p.localShuffles);assertEquals(1,p.localSelections);assertEquals(0,p.onlinePlays);assertTrue(p.random);assertEquals(identities(saved),identities(p.selected));assertEquals(1,a.searches);
        }
    }
    @Test public void selectingRowsDoesNotPlayAndDeletionRequiresConfirmation()throws Exception{
        PreviewPlayer p=service.get();List<Track> saved=librarySamples(6);p.saveLibrary(saved);
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");Button mode=field(a,"selectMode"),all=field(a,"selectAll"),delete=field(a,"deleteSelected");
            mode.performClick();layout(root,1920,1080);assertTrue((Boolean)field(a,"selectionMode"));assertFalse(delete.isEnabled());
            CheckBox check=(CheckBox)((ViewGroup)list.getChildAt(0)).getChildAt(0);assertEquals(View.VISIBLE,check.getVisibility());assertFalse(check.isFocusable());assertFalse(check.isClickable());assertFalse(check.isChecked());
            list.performItemClick(list.getChildAt(0),0,0);list.performItemClick(list.getChildAt(2),2,2);layout(root,1920,1080);
            Set<String> expected=new LinkedHashSet<>(Arrays.asList(saved.get(0).id,saved.get(2).id));assertEquals(expected,field(a,"selectedIds"));assertEquals(0,p.plays);assertTrue(delete.isEnabled());assertNotNull(findText(root,a.getString(R.string.selected_count,2)));
            check=(CheckBox)((ViewGroup)list.getChildAt(0)).getChildAt(0);assertTrue(check.isChecked());
            delete.performClick();AlertDialog confirmation=field(a,"deleteDialog");assertTrue(confirmation.isShowing());assertNotNull(findText(confirmation.getWindow().getDecorView(),a.getString(R.string.delete_confirm_message,2)));assertEquals(0,p.deletions);
            confirmation.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();assertEquals(0,p.deletions);assertEquals(6,list.getCount());assertEquals(expected,field(a,"selectedIds"));
            delete.performClick();confirmation=field(a,"deleteDialog");confirmation.getButton(AlertDialog.BUTTON_POSITIVE).performClick();layout(root,1920,1080);
            assertEquals(1,p.deletions);assertEquals(expected,p.requestedDeletion);assertEquals(4,list.getCount());assertFalse((Boolean)field(a,"selectionMode"));assertTrue(((Set<?>)field(a,"selectedIds")).isEmpty());assertEquals(a.getString(R.string.local_deleted,2),ShadowToast.getTextOfLatestToast());assertNotNull(findText(root,a.getString(R.string.library_count,4)));assertEquals(0,p.plays);
            mode.performClick();all.performClick();assertEquals(new LinkedHashSet<>(identities(p.saved)),field(a,"selectedIds"));assertEquals(a.getString(R.string.clear_selection),all.getText().toString());all.performClick();assertTrue(((Set<?>)field(a,"selectedIds")).isEmpty());assertFalse(delete.isEnabled());
            a.onKeyDown(KeyEvent.KEYCODE_BACK,new KeyEvent(KeyEvent.ACTION_DOWN,KeyEvent.KEYCODE_BACK));assertFalse((Boolean)field(a,"selectionMode"));
        }
    }
    @Test public void failedDeletionKeepsSongsAndSelectionAndShowsTheFailure()throws Exception{
        PreviewPlayer p=service.get();p.saveLibrary(librarySamples(3));p.deletionFails=true;
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");((Button)field(a,"selectMode")).performClick();list.performItemClick(list.getChildAt(0),0,0);
            ((Button)field(a,"deleteSelected")).performClick();AlertDialog confirmation=field(a,"deleteDialog");confirmation.getButton(AlertDialog.BUTTON_POSITIVE).performClick();
            await(()->uncheckedField(a,"deleteFailureDialog")!=null);
            AlertDialog failure=field(a,"deleteFailureDialog");assertNotNull("Failure opens a dialog",failure);assertTrue(failure.isShowing());assertNotNull("Failure title is visible",findText(failure.getWindow().getDecorView(),a.getString(R.string.library_delete_failed)));assertNotNull("Storage error is visible",findText(failure.getWindow().getDecorView(),p.libraryError()));
            assertEquals(1,p.deletions);assertEquals(3,list.getCount());assertEquals(Collections.singleton("netease:10000"),field(a,"selectedIds"));assertTrue((Boolean)field(a,"selectionMode"));assertEquals(0,p.plays);
            controller.pause().stop();assertFalse(failure.isShowing());
        }
    }
    @Test public void libraryRefreshesOnlyOnRevisionAndRetainsSelectedSongFocusAndScroll()throws Exception{
        PreviewPlayer p=service.get();p.saveLibrary(librarySamples(30));
        // A remote navigates in non-touch mode; touch-mode ListView deliberately has no selection.
        new android.app.Instrumentation().setInTouchMode(false);
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ListView list=field(a,"list");list.requestFocus();list.setSelectionFromTop(14,11);layout(root,1920,1080);
            assertTrue(list.hasFocus());assertFalse("TV remote navigation leaves touch mode",list.isInTouchMode());assertNotNull("A remote-selected row exists before refreshing",list.getSelectedItem());String selected=((Track)list.getSelectedItem()).id;String first=((Track)list.getAdapter().getItem(list.getFirstVisiblePosition())).id;int top=list.getChildAt(0).getTop();
            int reads=p.libraryReads;final int[] notifications={0};DataSetObserver observer=new DataSetObserver(){@Override public void onChanged(){notifications[0]++;}};list.getAdapter().registerDataSetObserver(observer);
            for(int i=0;i<4;i++)p.update();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1100));layout(root,1920,1080);
            assertEquals(reads,p.libraryReads);assertEquals(0,notifications[0]);assertEquals(selected,((Track)list.getSelectedItem()).id);assertEquals(first,((Track)list.getAdapter().getItem(list.getFirstVisiblePosition())).id);assertEquals(top,list.getChildAt(0).getTop());assertTrue(list.hasFocus());
            List<Track> changed=new ArrayList<>(p.saved);changed.add(0,Track.catalog("kuwo","99999","0","Newly saved song","New artist","",210));p.saveLibrary(changed);layout(root,1920,1080);
            assertEquals(reads+1,p.libraryReads);assertTrue(notifications[0]>0);assertEquals(31,list.getCount());assertEquals(selected,((Track)list.getSelectedItem()).id);assertEquals(first,((Track)list.getAdapter().getItem(list.getFirstVisiblePosition())).id);assertEquals(top,list.getChildAt(0).getTop());assertTrue(list.hasFocus());
            EditText query=field(a,"query");query.requestFocus();changed.add(Track.catalog("kuwo","99998","0","Another saved song","New artist","",220));p.saveLibrary(changed);layout(root,1920,1080);assertTrue(query.isFocused());
            list.getAdapter().unregisterDataSetObserver(observer);
        }
    }
    private static Object uncheckedField(Object target,String name){try{return field(target,name);}catch(Exception e){throw new AssertionError(e);}}
    @Test public void searchResultsPlayOnlyTheChosenRowAndHideLocalControls()throws Exception{
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");ListView list=field(a,"list");
            assertNull(findText(root,"收藏"));assertNull(findText(root,"最近播放"));assertNull(findText(root,"本地音频"));((Button)field(a,"searchTab")).performClick();
            for(String control:new String[]{"localSequential","localShuffle","selectMode","selectAll","deleteSelected"})assertEquals(View.GONE,((View)field(a,control)).getVisibility());assertEquals(0,a.searches);assertEquals(0,service.get().plays);
            query.setText("夜");findDescription(root,a.getString(R.string.search)).performClick();await(()->list.getCount()==6);assertEquals("夜",a.keyword);assertEquals(0,service.get().plays);
            list.performItemClick(list.getChildAt(3),3,3);assertEquals(3,service.get().selectedIndex);assertEquals("103",service.get().track.id);assertFalse(service.get().random);
            assertEquals(1,service.get().plays);assertEquals(1,service.get().onlinePlays);assertEquals(6,service.get().selected.size());assertEquals(1,a.searches);
            assertNotNull(findText(root,a.getString(R.string.search_results)));assertNotNull(findText(root,a.getString(R.string.results_count,6)));assertEquals(0,service.get().localSelections);assertEquals(0,service.get().localShuffles);assertEquals(0,service.get().localSequentialCalls);
            assertTrue(findDescription(root,a.getString(R.string.previous)).isFocusable());assertTrue(findDescription(root,a.getString(R.string.next)).isFocusable());
        }
    }
    @Test public void loginRequiredSearchHighlightsOfficialSignInWithoutPretendingAuthentication()throws Exception{
        try(ActivityController<LoginRequiredActivity> controller=Robolectric.buildActivity(LoginRequiredActivity.class).setup().visible()){
            LoginRequiredActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");query.setText("勇气");
            View login=findDescription(root,a.getString(R.string.account));assertNotNull(login);assertTrue(login.isFocusable());findDescription(root,a.getString(R.string.search)).performClick();
            String error=a.getString(R.string.search_failed,a.getString(R.string.source_login_required));await(()->findText(root,error)!=null);assertTrue(login.isFocused());
            login.performClick();Intent intent=shadowOf(a).getNextStartedActivity();assertNotNull(intent);assertEquals(LoginActivity.class.getName(),intent.getComponent().getClassName());
            assertNotNull(findText(root,error));assertEquals(0,service.get().plays);
        }
    }
    @Test public void searchDeadlineAndLeavingScreenRestoreUsableControls()throws Exception{
        try(ActivityController<SlowSourceActivity> controller=Robolectric.buildActivity(SlowSourceActivity.class).setup().visible()){
            SlowSourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);
            EditText query=field(a,"query");query.setText("night");View search=findDescription(root,a.getString(R.string.search));
            search.performClick();await(()->a.entered);assertFalse(search.isEnabled());
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(21));assertNotNull(findText(root,a.getString(R.string.search_timeout)));assertTrue(search.isEnabled());assertTrue(query.isFocused());
            a.entered=false;search.performClick();await(()->a.entered);controller.pause().stop();assertTrue(search.isEnabled());
            controller.start().resume().visible();assertTrue(search.isEnabled());assertNotNull(findText(root,a.getString(R.string.request_cancelled)));
        }
    }
    @Test public void rendersRecycledRowsAndPlayerWithoutBundledArtwork()throws Exception{renderPreview(false,"hifini-tv.png");}
    @Test @Config(qualifiers="en-rUS-w960dp-h540dp-land-xhdpi") public void englishResourcesRenderAndNavigateWithoutReplacingUiText()throws Exception{renderPreview(true,"hifini-tv.en.png");}
    private void renderPreview(boolean english,String filename)throws Exception{
        List<Track> data=samples(english);service.get().saveLibrary(data);
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();ListView list=field(a,"list");
            PreviewPlayer p=service.get();p.track=data.get(0);p.active=true;p.attemptedUrl="https://audio.example.org/music/night-star.mp3?demo=1";p.update();layout(root,1920,1080);
            assertTrue((Boolean)field(a,"localMode"));assertEquals(6,list.getCount());assertNotNull(findText(root,a.getString(R.string.library_count,6)));assertNotNull(findText(root,data.get(0).title));assertNotNull(findText(root,data.get(0).artist));assertNotNull(((ImageView)field(a,"hero")).getDrawable());
            RhythmView rhythm=field(a,"rhythm");assertNotNull(findText(root,a.getString(R.string.rhythm)));assertTrue(rhythm.isAnimating());assertFalse(rhythm.isFocusable());
            ImageButton audioQr=field(a,"audioQr");assertEquals(p.attemptedUrl,decodeQr(audioQr));assertAudioQrBounds(a,1920,1080);
            assertTrue(((Button)field(a,"localTab")).isFocused());if(english)assertEnglish(root);
            capture(root,filename,1920,1080);
        }
    }
    private static void capture(View root,String filename,int width,int height)throws IOException{
        String capture=System.getenv("HIFINI_UI_CAPTURE_DIR");if(capture!=null){new File(capture).mkdirs();Bitmap bitmap=Bitmap.createBitmap(width,height,Bitmap.Config.ARGB_8888);try{root.draw(new Canvas(bitmap));try(FileOutputStream output=new FileOutputStream(new File(capture,filename))){bitmap.compress(Bitmap.CompressFormat.PNG,100,output);}}finally{bitmap.recycle();}}
    }
    @Test public void attemptedAudioQrSurvivesFailureAndChangesWithTheCurrentSong()throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);ImageButton qr=field(a,"audioQr");assertEquals(View.GONE,qr.getVisibility());
            PreviewPlayer p=service.get();p.track=Track.catalog("netease","114713","0","Night Star","Forest Guest","",226);p.attemptedUrl="https://audio.example.org/music/first.mp3?token=demo%2F1&source=netease";p.active=true;p.update();layout(root,1920,1080);
            assertEquals(View.VISIBLE,qr.getVisibility());assertEquals(p.attemptedUrl,decodeQr(qr));assertAudioQrBounds(a,1920,1080);
            p.active=false;p.failure=a.getString(R.string.decoder_error,1,-2147483648);p.update();assertEquals(View.VISIBLE,qr.getVisibility());assertEquals(p.attemptedUrl,decodeQr(qr));assertTrue(qr.isFocusable());
            qr.performClick();AlertDialog dialog=field(a,"audioLinkDialog");assertNotNull(dialog);assertTrue(dialog.isShowing());View dialogRoot=dialog.getWindow().getDecorView();
            assertNotNull(findText(dialogRoot,p.attemptedUrl));assertNotNull(findText(dialogRoot,a.getString(R.string.audio_link_identity,p.track.id)));assertNotNull(findText(dialogRoot,a.getString(R.string.playback_error_detail,p.failure)));
            assertEquals(p.attemptedUrl,decodeQr((ImageView)findDescription(dialogRoot,a.getString(R.string.audio_link_qr))));
            p.track=Track.catalog("kuwo","289192","0","Night Voyage","Slow Island","",230);p.attemptedUrl="";p.failure="";p.update();assertEquals(View.GONE,qr.getVisibility());assertFalse(dialog.isShowing());
            p.attemptedUrl="https://audio.example.org/music/second.mp3?source=kuwo";p.update();layout(root,1920,1080);assertEquals(p.attemptedUrl,decodeQr(qr));
            p.attemptedUrl="https://audio.example.org/music/second.mp3?token="+"a".repeat(2500);p.update();assertEquals(View.VISIBLE,qr.getVisibility());assertFalse(qr.getDrawable() instanceof BitmapDrawable);qr.performClick();
            AlertDialog fullTextDialog=field(a,"audioLinkDialog");View fullTextRoot=fullTextDialog.getWindow().getDecorView();assertNotNull(findText(fullTextRoot,p.attemptedUrl));assertNotNull(findText(fullTextRoot,a.getString(R.string.audio_link_too_long)));assertNull(findDescription(fullTextRoot,a.getString(R.string.audio_link_qr)));
            p.attemptedUrl="https://name:password@audio.example.org/private.mp3";p.update();assertEquals(View.GONE,qr.getVisibility());
        }
    }
    private static String decodeQr(ImageView image)throws Exception{assertNotNull(image);assertTrue(image.getDrawable() instanceof BitmapDrawable);Bitmap bitmap=((BitmapDrawable)image.getDrawable()).getBitmap();int[] pixels=new int[bitmap.getWidth()*bitmap.getHeight()];bitmap.getPixels(pixels,0,bitmap.getWidth(),0,0,bitmap.getWidth(),bitmap.getHeight());return new com.google.zxing.qrcode.QRCodeReader().decode(new com.google.zxing.BinaryBitmap(new com.google.zxing.common.HybridBinarizer(new com.google.zxing.RGBLuminanceSource(bitmap.getWidth(),bitmap.getHeight(),pixels)))).getText();}
    private static void assertAudioQrBounds(MainActivity a,int width,int height)throws Exception{ImageButton qr=field(a,"audioQr");TextView title=field(a,"title"),artist=field(a,"artist");SeekBar seek=field(a,"seek");assertInside(qr,width,height);assertTrue("QR stays beside the title",title.getRight()<=qr.getLeft());assertTrue("QR stays beside the artist",artist.getRight()<=qr.getLeft());assertTrue("QR stays above the seek bar",qr.getBottom()<=seek.getTop());}
    @Test public void downloadingShowsProgressAndCanBeCancelledWithoutReplacingSearchStatus()throws Exception{downloadProgress(false,1920,1080);}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void englishDownloadProgressFitsCompactScreens()throws Exception{downloadProgress(true,640,360);}
    private void downloadProgress(boolean english,int width,int height)throws Exception{
        new android.app.Instrumentation().setInTouchMode(false);
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();TextView status=field(a,"status"),now=field(a,"now");String searchStatus=a.getString(R.string.results_count,6);
            ((EditText)field(a,"query")).setText(english?"Night":"夜");findDescription(root,a.getString(R.string.search)).performClick();await(()->searchStatus.contentEquals(status.getText()));
            PreviewPlayer p=service.get();p.track=samples(english).get(0);p.attemptedUrl="https://audio.example.org/music/night-star.mp3?demo=1";p.busy=true;p.transferring=true;p.receivedBytes=2621440;p.totalBytes=10485760;p.progressStage=a.getString(R.string.download_start);p.update();layout(root,width,height);
            ProgressBar progress=field(a,"downloadProgress");SeekBar seek=field(a,"seek");TextView received=field(a,"elapsed"),total=field(a,"total"),label=field(a,"toggleLabel");RhythmView rhythm=field(a,"rhythm");ImageButton toggle=field(a,"toggle");
            assertEquals(View.VISIBLE,progress.getVisibility());assertFalse(progress.isIndeterminate());assertEquals(250,progress.getProgress());assertEquals("2.5 MB",received.getText().toString());assertEquals("10.0 MB",total.getText().toString());assertEquals(a.getString(R.string.download_progress_percent,25),now.getText().toString());assertEquals(a.getString(R.string.download_progress_detail,"2.5 MB","10.0 MB",25),progress.getContentDescription());
            assertEquals(View.INVISIBLE,seek.getVisibility());assertFalse(progress.isFocusable());assertEquals(a.getString(R.string.cancel),label.getText().toString());assertEquals(searchStatus,status.getText().toString());assertFalse(rhythm.isAnimating());assertTrue(keepsScreenOn(a));
            for(View part:new View[]{progress,received,total,label})assertInside(part,width,height);for(TextView text:new TextView[]{received,total,label,now})assertSingleLineUnclipped(text);assertTrue(received.getRight()<=progress.getLeft());assertTrue(progress.getRight()<=total.getLeft());assertAudioQrBounds(a,width,height);
            capture(root,english?"hifini-tv-download.en.png":"hifini-tv-download.png",width,height);
            // A blocked connection must leave navigation and cancellation usable without inventing progress.
            shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1000));assertEquals(250,progress.getProgress());assertEquals(searchStatus,status.getText().toString());assertTrue(toggle.requestFocus());assertTrue(toggle.isFocused());
            p.totalBytes=-1;p.receivedBytes=4096;p.update();layout(root,width,height);assertTrue(progress.isIndeterminate());assertEquals("4.0 KB",received.getText().toString());assertEquals(a.getString(R.string.download_total_unknown),total.getText().toString());assertEquals(a.getString(R.string.download_start),now.getText().toString());assertFalse(now.getText().toString().contains("%"));assertEquals(a.getString(R.string.download_progress_unknown,"4.0 KB"),progress.getContentDescription());assertSingleLineUnclipped(total);
            ImageButton qr=field(a,"audioQr");if(qr.getDrawable() instanceof BitmapDrawable)assertEquals(p.attemptedUrl,decodeQr(qr));
            toggle.performClick();assertEquals(1,p.cancellations);assertFalse(p.busy);assertFalse(rhythm.isAnimating());assertEquals(View.GONE,progress.getVisibility());assertEquals(View.VISIBLE,seek.getVisibility());assertEquals(View.VISIBLE,qr.getVisibility());assertFalse(keepsScreenOn(a));
            p.failure=a.getString(R.string.download_timeout);p.update();assertEquals(a.getString(R.string.retry),toggle.getContentDescription());assertEquals(a.getString(R.string.retry),label.getText().toString());assertTrue(toggle.isFocused());toggle.performClick();assertTrue(p.active);assertTrue(rhythm.isAnimating());assertTrue(keepsScreenOn(a));assertEquals(searchStatus,status.getText().toString());
            p.active=false;p.busy=true;p.transferring=false;p.progressStage=a.getString(R.string.preparing_audio);p.update();layout(root,width,height);assertEquals(View.GONE,progress.getVisibility());assertEquals(p.progressStage,now.getText().toString());assertFalse(rhythm.isAnimating());assertTrue(keepsScreenOn(a));
            controller.pause().stop();assertFalse(keepsScreenOn(a));controller.start().resume().visible();await(()->keepsScreenOn(a));assertEquals(p.progressStage,now.getText().toString());if(english)assertEnglish(root);
        }
    }
    @Test public void downloadTimeoutKeepsTheCurrentSearchAndSongOnScreenWithRetry()throws Exception{failedDownloadStaysInPlace(R.string.download_timeout);}
    @Test public void downloadFailureKeepsTheCurrentSearchAndSongOnScreenWithRetry()throws Exception{failedDownloadStaysInPlace(R.string.audio_download_failed);}
    private void failedDownloadStaysInPlace(int failureResource)throws Exception{
        new android.app.Instrumentation().setInTouchMode(false);
        try(ActivityController<SourceActivity> controller=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);EditText query=field(a,"query");query.setText("夜");((ImageButton)field(a,"search")).performClick();ListView list=field(a,"list");await(()->list.getCount()==6);layout(root,1920,1080);
            list.requestFocus();list.setSelectionFromTop(3,12);layout(root,1920,1080);assertNotNull(list.getSelectedItem());Track chosen=(Track)list.getSelectedItem();list.performItemClick(list.getSelectedView(),list.getSelectedItemPosition(),list.getSelectedItemId());
            PreviewPlayer p=service.get();p.active=false;p.busy=true;p.transferring=true;p.receivedBytes=4096;p.totalBytes=10485760;p.progressStage=a.getString(R.string.download_start);p.update();layout(root,1920,1080);assertEquals(chosen.id,p.current().id);
            int firstVisible=list.getFirstVisiblePosition(),firstTop=list.getChildAt(0).getTop();List<String> resultIds=identities(field(a,"tracks"));assertNull(shadowOf(a).getNextStartedActivity());
            p.busy=false;p.transferring=false;p.failure=a.getString(failureResource);p.update();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(2));layout(root,1920,1080);
            assertFalse("A failed download must not finish the current screen",a.isFinishing());assertFalse(a.isDestroyed());assertNull("No home or other navigation intent may be started on failure",shadowOf(a).getNextStartedActivity());assertTrue(root.isShown());
            assertEquals(Boolean.FALSE,field(a,"localMode"));assertTrue(((Button)field(a,"searchTab")).isSelected());assertFalse(((Button)field(a,"localTab")).isSelected());assertEquals("夜",query.getText().toString());assertEquals(resultIds,identities(field(a,"tracks")));assertEquals(6,list.getCount());assertEquals(firstVisible,list.getFirstVisiblePosition());assertEquals(firstTop,list.getChildAt(0).getTop());assertNotNull(list.getSelectedItem());assertEquals(chosen.id,((Track)list.getSelectedItem()).id);assertTrue(list.hasFocus());
            assertEquals(chosen.id,p.current().id);assertEquals(chosen.title,((TextView)field(a,"title")).getText().toString());assertEquals(a.getString(R.string.playback_failed),((TextView)field(a,"now")).getText().toString());assertEquals(a.getString(R.string.retry_audio,p.failure),((TextView)field(a,"status")).getText().toString());assertEquals(View.GONE,((ProgressBar)field(a,"downloadProgress")).getVisibility());
            ImageButton retry=field(a,"toggle");assertEquals(a.getString(R.string.retry),retry.getContentDescription());assertEquals(a.getString(R.string.retry),((TextView)field(a,"toggleLabel")).getText().toString());assertTrue(retry.isEnabled());assertTrue(retry.requestFocus());retry.performClick();assertTrue(p.active);assertEquals(chosen.id,p.current().id);assertEquals(Boolean.FALSE,field(a,"localMode"));assertFalse(a.isFinishing());assertNull(shadowOf(a).getNextStartedActivity());
        }
    }
    private static boolean keepsScreenOn(MainActivity activity){return (activity.getWindow().getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0;}
    @Test public void bundleRecreationRestoresSearchResultsAndTheInterruptedSongWithoutAnotherSearch()throws Exception{restoreBrowsing(true);}
    @Test public void reopeningWithoutABundleRestoresPrivateBrowseMetadataAndTheCurrentTab()throws Exception{restoreBrowsing(false);}
    private void restoreBrowsing(boolean bundle)throws Exception{
        new android.app.Instrumentation().setInTouchMode(false);PreviewPlayer p=service.get();p.saveLibrary(librarySamples(8));Bundle saved=new Bundle();
        try(ActivityController<SourceActivity> first=Robolectric.buildActivity(SourceActivity.class).setup().visible()){
            SourceActivity old=first.get();View root=old.getWindow().getDecorView();layout(root,1920,1080);((EditText)field(old,"query")).setText("夜");((ImageButton)field(old,"search")).performClick();ListView list=field(old,"list");await(()->list.getCount()==6);layout(root,1920,1080);list.requestFocus();list.setSelectionFromTop(3,12);layout(root,1920,1080);
            String selected=((Track)list.getSelectedItem()).id;p.track=samples(false).get(3);p.interrupted=true;p.busy=false;p.active=false;p.update();if(!bundle)((Button)field(old,"localTab")).performClick();first.saveInstanceState(saved).pause().stop();
            try(ActivityController<SourceActivity> second=(bundle?Robolectric.buildActivity(SourceActivity.class).setup(saved):Robolectric.buildActivity(SourceActivity.class).setup()).visible()){
                SourceActivity restored=second.get();View restoredRoot=restored.getWindow().getDecorView();layout(restoredRoot,1920,1080);ListView restoredList=field(restored,"list");assertEquals(0,restored.searches);assertEquals("夜",((EditText)field(restored,"query")).getText().toString());assertEquals(Boolean.valueOf(!bundle),field(restored,"localMode"));assertEquals(p.track.title,((TextView)field(restored,"title")).getText().toString());assertEquals(restored.getString(R.string.retry),((ImageButton)field(restored,"toggle")).getContentDescription());assertEquals(restored.getString(R.string.download_interrupted_short),((TextView)field(restored,"now")).getText().toString());assertFalse(keepsScreenOn(restored));
                if(!bundle){assertEquals(8,restoredList.getCount());((Button)field(restored,"searchTab")).performClick();layout(restoredRoot,1920,1080);}assertEquals(6,restoredList.getCount());assertNotNull(restoredList.getSelectedItem());assertEquals(selected,((Track)restoredList.getSelectedItem()).id);assertEquals(0,restored.searches);
                ((ImageButton)field(restored,"toggle")).performClick();assertFalse(p.interrupted);assertTrue(p.active);assertTrue(keepsScreenOn(restored));
            }
        }
    }
    @Test public void rhythmMovesOnlyDuringPlaybackAndStopsWithThePage()throws Exception{
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,1920,1080);RhythmView rhythm=field(a,"rhythm");assertFalse(rhythm.isAnimating());
            PreviewPlayer p=service.get();p.track=samples(false).get(0);p.active=true;p.update();assertTrue(rhythm.isAnimating());assertRhythmFrames(rhythm,true);
            SeekBar seek=field(a,"seek");ImageButton search=field(a,"search");assertEquals(search.getId(),seek.getNextFocusUpId());assertFalse(rhythm.isFocusable());
            p.active=false;p.update();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            p.active=true;p.update();assertTrue(rhythm.isAnimating());controller.pause().stop();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            controller.start().resume().visible();await(rhythm::isAnimating);assertTrue(rhythm.isAnimating());
            p.track=null;p.active=false;p.update();assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
        }
    }
    @Test public void systemAnimationSettingKeepsTheRhythmStaticWithoutDisablingPlayback()throws Exception{
        ContentResolver resolver=RuntimeEnvironment.getApplication().getContentResolver();Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,0f);
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();PreviewPlayer p=service.get();p.track=samples(false).get(0);p.active=true;p.update();layout(root,1920,1080);
            RhythmView rhythm=field(a,"rhythm");assertTrue(p.playing());assertFalse(rhythm.isAnimating());assertRhythmFrames(rhythm,false);
            Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f);shadowOf(Looper.getMainLooper()).idle();assertTrue(rhythm.isAnimating());
            Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,0f);shadowOf(Looper.getMainLooper()).idle();assertFalse(rhythm.isAnimating());assertTrue(p.playing());assertRhythmFrames(rhythm,false);
        }finally{Settings.Global.putFloat(resolver,Settings.Global.ANIMATOR_DURATION_SCALE,1f);}
    }
    private static void assertRhythmFrames(RhythmView rhythm,boolean changes){Bitmap before=Bitmap.createBitmap(rhythm.getWidth(),rhythm.getHeight(),Bitmap.Config.ARGB_8888),after=Bitmap.createBitmap(rhythm.getWidth(),rhythm.getHeight(),Bitmap.Config.ARGB_8888);try{rhythm.draw(new Canvas(before));for(int elapsed=0;elapsed<350;elapsed+=16)shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(Math.min(16,350-elapsed)));rhythm.draw(new Canvas(after));assertEquals("Rhythm pixels should move only while animation is enabled",changes,!before.sameAs(after));}finally{before.recycle();after.recycle();}}
    @Test @Config(qualifiers="en-rUS-w640dp-h360dp-land-mdpi") public void englishCompactPlayerKeepsControlsInsideScreen()throws Exception{compactBounds(true);}
    @Test @Config(qualifiers="zh-rCN-w640dp-h360dp-land-mdpi") public void compactTvKeepsControlsVisible()throws Exception{compactBounds(false);}
    private void compactBounds(boolean english)throws Exception{
        service.get().saveLibrary(samples(english));
        try(ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).setup().visible()){
            MainActivity a=controller.get();View root=a.getWindow().getDecorView();layout(root,640,360);
            for(int id:new int[]{R.string.search,R.string.previous,R.string.next,R.string.play})assertInside(findDescription(root,a.getString(id)),640,360);
            assertInside(field(a,"hero"),640,360);assertInside(field(a,"rhythm"),640,360);
            Button searchTab=field(a,"searchTab"),localTab=field(a,"localTab");assertInside(searchTab,640,360);assertInside(localTab,640,360);assertSingleLineUnclipped(searchTab);assertSingleLineUnclipped(localTab);
            assertTrue(searchTab.getRight()<=localTab.getLeft()||localTab.getRight()<=searchTab.getLeft());assertTrue(searchTab.isFocusable());assertTrue(localTab.isFocusable());assertInside(findDescription(root,a.getString(R.string.account)),640,360);
            for(String name:new String[]{"localSequential","localShuffle","selectMode"}){Button button=field(a,name);assertInside(button,640,360);assertSingleLineUnclipped(button);assertTrue(button.getTop()>=localTab.getBottom());}
            EditText query=field(a,"query");assertTrue("Search uses the former top shuffle area",query.getRight()>550);((Button)field(a,"selectMode")).performClick();layout(root,640,360);
            for(String name:new String[]{"selectAll","deleteSelected"}){Button button=field(a,name);assertInside(button,640,360);assertSingleLineUnclipped(button);}assertInside(field(a,"selectionCount"),640,360);assertSingleLineUnclipped(field(a,"selectionCount"));
            PreviewPlayer p=service.get();p.track=samples(english).get(0);p.attemptedUrl="https://audio.example.org/music/night-star.mp3?demo=1";p.update();layout(root,640,360);assertAudioQrBounds(a,640,360);if(english)assertEnglish(root);
        }
    }
    private static void assertSingleLineUnclipped(TextView text){assertNotNull(text.getLayout());assertEquals(1,text.getLayout().getLineCount());assertEquals(0,text.getLayout().getEllipsisCount(0));assertEquals(text.getText().length(),text.getLayout().getLineEnd(0));assertTrue(text.getPaint().measureText(text.getText().toString())<=text.getWidth()-text.getCompoundPaddingLeft()-text.getCompoundPaddingRight()+1);}
    private static void assertInside(View view,int width,int height){assertNotNull(view);int[] point=new int[2];view.getLocationOnScreen(point);assertTrue("horizontal bounds",point[0]>=0&&point[0]+view.getWidth()<=width);assertTrue("vertical bounds",point[1]>=0&&point[1]+view.getHeight()<=height);assertTrue(view.getWidth()>0&&view.getHeight()>0);}
    private static void assertEnglish(View root){if(root instanceof TextView){TextView text=(TextView)root;assertFalse(text.getText().toString(),text.getText().toString().matches("(?s).*[\\p{IsHan}].*"));if(text.getHint()!=null)assertFalse(text.getHint().toString().matches("(?s).*[\\p{IsHan}].*"));}if(root.getContentDescription()!=null)assertFalse(root.getContentDescription().toString().matches("(?s).*[\\p{IsHan}].*"));if(root instanceof ViewGroup)for(int i=0;i<((ViewGroup)root).getChildCount();i++)assertEnglish(((ViewGroup)root).getChildAt(i));}
}
