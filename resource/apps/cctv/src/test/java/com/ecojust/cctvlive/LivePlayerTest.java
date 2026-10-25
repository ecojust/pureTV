package com.ecojust.cctvlive;

import android.content.Context;
import android.media.MediaPlayer;
import android.media.session.MediaSession;
import android.os.Looper;
import android.view.SurfaceView;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowMediaPlayer;
import java.time.Duration;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class LivePlayerTest {
    private LivePlayer live;private int next,previous;
    @Before public void create(){
        Context context=RuntimeEnvironment.getApplication();ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,1));
        live=new LivePlayer(context,new LivePlayer.Events(){public void changed(){}public void size(int w,int h){}public void next(){next++;}public void previous(){previous++;}});
        live.surface(new SurfaceView(context).getHolder());live.activate();
    }
    @After public void close(){live.close();}
    private <T>T field(String name)throws Exception{java.lang.reflect.Field f=LivePlayer.class.getDeclaredField(name);f.setAccessible(true);return (T)f.get(live);}
    private void prepared(){shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(20));}
    @Test public void switchingReleasesOldDecoderAndPauseResumeReconnectsAtLiveEdge()throws Exception{
        live.play("https://example.com/one.m3u8");prepared();assertEquals(LivePlayer.State.PLAYING,live.state());MediaPlayer first=field("player");shadowOf(first).setCurrentPosition(12000);
        live.play("https://example.com/two.m3u8");assertEquals(ShadowMediaPlayer.State.END,shadowOf(first).getState());prepared();MediaPlayer second=field("player");assertNotSame(first,second);
        live.pause();assertNull(field("player"));assertEquals(LivePlayer.State.PAUSED,live.state());assertEquals(ShadowMediaPlayer.State.END,shadowOf(second).getState());
        live.resume();prepared();assertEquals(LivePlayer.State.PLAYING,live.state());assertTrue(((MediaPlayer)field("player")).getCurrentPosition()<1000);
    }
    @Test public void decoderTimeoutStopsWithoutReconnectLoop()throws Exception{
        ShadowMediaPlayer.setMediaInfoProvider(source->new ShadowMediaPlayer.MediaInfo(60000,30000));live.play("https://example.com/slow.m3u8");MediaPlayer player=field("player");
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(26));assertEquals(LivePlayer.State.ERROR,live.state());assertNull(field("player"));assertEquals(ShadowMediaPlayer.State.END,shadowOf(player).getState());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMinutes(2));assertNull(field("player"));
    }
    @Test public void bufferingTimeoutAndEndedStreamOfferExplicitRecovery()throws Exception{
        live.play("https://example.com/live.m3u8");prepared();MediaPlayer player=field("player");shadowOf(player).invokeInfoListener(MediaPlayer.MEDIA_INFO_BUFFERING_START,0);
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(26));assertEquals(LivePlayer.State.ERROR,live.state());assertNull(field("player"));
        live.play("https://example.com/live.m3u8");prepared();player=field("player");shadowOf(player).invokeCompletionListener();assertEquals(LivePlayer.State.ERROR,live.state());assertEquals(RuntimeEnvironment.getApplication().getString(R.string.ended),live.error());
    }
    @Test public void surfaceLossAndBackgroundReleaseResourcesThenResumeFresh()throws Exception{
        live.play("https://example.com/live.m3u8");prepared();MediaPlayer old=field("player");live.surface(null);assertNull(field("player"));assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());
        live.surface(new SurfaceView(RuntimeEnvironment.getApplication()).getHolder());prepared();assertEquals(LivePlayer.State.PLAYING,live.state());
        old=field("player");live.suspend();assertNull(field("player"));assertNull(field("session"));assertEquals(ShadowMediaPlayer.State.END,shadowOf(old).getState());
        live.activate();prepared();assertEquals(LivePlayer.State.PLAYING,live.state());
    }
    @Test public void registeredMediaCallbacksControlLiveAndChannelNavigation()throws Exception{
        live.play("https://example.com/live.m3u8");prepared();MediaSession session=field("session");assertTrue(session.isActive());
        Object handler=org.robolectric.util.ReflectionHelpers.getField(session,"mCallback");MediaSession.Callback callback=org.robolectric.util.ReflectionHelpers.getField(handler,"mCallback");
        callback.onSkipToNext();callback.onSkipToPrevious();assertEquals(1,next);assertEquals(1,previous);
        callback.onPause();assertEquals(LivePlayer.State.PAUSED,live.state());callback.onPlay();prepared();assertEquals(LivePlayer.State.PLAYING,live.state());
    }
}
