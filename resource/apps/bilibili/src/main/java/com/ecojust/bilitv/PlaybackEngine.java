package com.ecojust.bilitv;

import android.content.Context;
import android.view.SurfaceView;
import com.google.android.exoplayer2.C;
import com.google.android.exoplayer2.ExoPlayer;
import com.google.android.exoplayer2.MediaItem;
import com.google.android.exoplayer2.PlaybackException;
import com.google.android.exoplayer2.Player;
import com.google.android.exoplayer2.audio.AudioAttributes;
import com.google.android.exoplayer2.source.MediaSource;
import com.google.android.exoplayer2.source.MergingMediaSource;
import com.google.android.exoplayer2.source.ProgressiveMediaSource;
import com.google.android.exoplayer2.upstream.DefaultHttpDataSource;
import com.google.android.exoplayer2.upstream.DefaultLoadErrorHandlingPolicy;
import com.google.android.exoplayer2.video.VideoSize;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

/** A single ExoPlayer owns both DASH tracks; no WebView, advertisements or background decoder. */
interface PlaybackEngine {
    interface Events { void state(boolean buffering, boolean playing, boolean ended); void error(); void size(int width,int height); }
    void prepare(VideoApi.Playback source,long positionMs);
    void play(); void pause(); void seek(long positionMs);
    long position(); long duration(); boolean isPlaying(); void release();
}

final class ExoPlaybackEngine implements PlaybackEngine {
    private final ExoPlayer player;
    private final Events events;
    private long[] lengths=new long[0];
    private boolean released;
    ExoPlaybackEngine(Context context,SurfaceView surface,Events events) {
        this.events=events;
        LegacyTls.installIfNeeded();
        player=new ExoPlayer.Builder(context).build();
        player.setVideoSurfaceView(surface);
        player.setAudioAttributes(new AudioAttributes.Builder().setUsage(C.USAGE_MEDIA).setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).build(),true);
        player.setHandleAudioBecomingNoisy(true);
        player.addListener(new Player.Listener(){
            @Override public void onPlaybackStateChanged(int state){notifyState();}
            @Override public void onIsPlayingChanged(boolean playing){notifyState();}
            @Override public void onPlayerError(PlaybackException error){if(!released)events.error();}
            @Override public void onVideoSizeChanged(VideoSize size){if(!released&&size.width>0&&size.height>0)events.size(Math.round(size.width*size.pixelWidthHeightRatio),size.height);}
        });
    }
    private void notifyState(){if(!released)events.state(player.getPlaybackState()==Player.STATE_BUFFERING,player.isPlaying(),player.getPlaybackState()==Player.STATE_ENDED);}
    static Map<String,String> mediaHeaders(Map<String,String> source) {
        // Never copy account cookies or arbitrary API authorization to a media CDN.
        Map<String,String> headers=new HashMap<>();
        for(Map.Entry<String,String> entry:source.entrySet())if(entry.getKey().equalsIgnoreCase("Referer")||entry.getKey().equalsIgnoreCase("User-Agent"))headers.put(entry.getKey(),entry.getValue());
        return headers;
    }
    private static MediaSource progressive(String url,ProgressiveMediaSource.Factory factory){return factory.createMediaSource(MediaItem.fromUri(url));}
    @Override public void prepare(VideoApi.Playback source,long positionMs) {
        if(released)return;
        DefaultHttpDataSource.Factory http=new DefaultHttpDataSource.Factory().setConnectTimeoutMs(12000).setReadTimeoutMs(15000)
                .setAllowCrossProtocolRedirects(false).setDefaultRequestProperties(mediaHeaders(source.headers));
        ProgressiveMediaSource.Factory streams=new ProgressiveMediaSource.Factory(http).setLoadErrorHandlingPolicy(new DefaultLoadErrorHandlingPolicy(0));
        List<MediaSource> media=new ArrayList<>();
        if(!source.segments.isEmpty()){
            lengths=new long[source.segments.size()];
            for(int i=0;i<lengths.length;i++){VideoApi.Segment part=source.segments.get(i);lengths[i]=Math.max(0,part.durationMs);media.add(progressive(part.url,streams));}
        }else{
            lengths=new long[]{Math.max(0,source.durationMs)};
            MediaSource video=progressive(source.videoUrl,streams);
            // Both extracted MP4 tracks retain their media timestamps and share one playback clock.
            media.add(source.audioUrl==null||source.audioUrl.isEmpty()?video:new MergingMediaSource(video,progressive(source.audioUrl,streams)));
        }
        long[] start=locate(lengths,positionMs);
        player.setMediaSources(media,(int)start[0],start[1]);player.prepare();player.setPlayWhenReady(true);
    }
    static long[] locate(long[] lengths,long positionMs){
        long remaining=Math.max(0,positionMs);int index=0;
        while(index<lengths.length-1&&lengths[index]>0&&remaining>=lengths[index])remaining-=lengths[index++];
        if(index<lengths.length&&lengths[index]>0)remaining=Math.min(remaining,Math.max(0,lengths[index]-1));
        return new long[]{index,remaining};
    }
    @Override public void play(){if(!released)player.play();}
    @Override public void pause(){if(!released)player.pause();}
    @Override public void seek(long value){if(!released){long[] target=locate(lengths,value);player.seekTo((int)target[0],target[1]);}}
    @Override public long position(){if(released)return 0;long total=Math.max(0,player.getCurrentPosition());for(int i=0;i<Math.min(lengths.length,player.getCurrentMediaItemIndex());i++)total+=lengths[i];return total;}
    @Override public long duration(){if(released)return 0;long total=0;for(long length:lengths)total+=length;return total>0?total:Math.max(0,player.getDuration()==C.TIME_UNSET?0:player.getDuration());}
    @Override public boolean isPlaying(){return !released&&player.isPlaying();}
    @Override public void release(){if(!released){released=true;player.clearVideoSurface();player.release();}}
}
