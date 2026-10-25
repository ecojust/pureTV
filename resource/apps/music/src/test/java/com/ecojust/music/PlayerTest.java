package com.ecojust.music;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import org.robolectric.android.controller.ServiceController;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class PlayerTest {
    @org.junit.Before public void resetMode() {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_playback",0).edit().clear().commit();
    }
    public static class SlowResolver extends PlaybackService {
        final java.util.concurrent.CountDownLatch started = new java.util.concurrent.CountDownLatch(1);
        @Override java.util.List<String> resolveSources(Track track, java.util.function.Consumer<String> progress) throws java.io.IOException {
            started.countDown();
            try { new java.util.concurrent.CountDownLatch(1).await(); }
            catch (InterruptedException e) { throw new java.io.IOException("cancelled"); }
            return java.util.Collections.emptyList();
        }
    }
    public static class BackupResolver extends PlaybackService {
        @Override java.util.List<String> resolveSources(Track track, java.util.function.Consumer<String> progress) {
            return java.util.Arrays.asList("https://one.example.com/audio", "https://two.example.com/audio", "https://three.example.com/audio");
        }
    }
    @Test public void audioResolutionHasAnOverallTimeoutAndRemainsRetryable() throws Exception {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        ServiceController<SlowResolver> c = Robolectric.buildService(SlowResolver.class).create();
        try {
            SlowResolver p = c.get(); p.add(LibraryTest.track(0), true);
            assertTrue(p.started.await(1, java.util.concurrent.TimeUnit.SECONDS));
            assertTrue(p.loading());
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(21));
            assertFalse(p.loading()); assertFalse(p.playing()); assertEquals(p.getString(R.string.resolve_timeout),p.error());
            p.play(0); assertTrue(p.loading()); p.pause(false); assertFalse(p.loading());
        } finally { c.destroy(); }
    }
    @Test public void stalledSourcesUseBoundedBackupsAndStopLoading() throws Exception {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        org.robolectric.shadows.ShadowMediaPlayer.setMediaInfoProvider(source -> new org.robolectric.shadows.ShadowMediaPlayer.MediaInfo(60000,60000));
        ServiceController<BackupResolver> c = Robolectric.buildService(BackupResolver.class).create();
        try {
            BackupResolver p = c.get(); p.add(LibraryTest.track(0), true);
            java.lang.reflect.Field pending = PlaybackService.class.getDeclaredField("pending"); pending.setAccessible(true);
            ((java.util.concurrent.Future<?>) pending.get(p)).get(1, java.util.concurrent.TimeUnit.SECONDS);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(31));
            assertFalse(p.loading()); assertFalse(p.playing()); assertEquals(p.getString(R.string.connect_timeout),p.error());
            java.lang.reflect.Field index = PlaybackService.class.getDeclaredField("sourceIndex"); index.setAccessible(true);
            assertEquals(2, index.getInt(p));
        } finally { c.destroy(); }
    }
    @Test public void decoderErrorAfterPlaybackReentersBoundedLoading() throws Exception {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        org.robolectric.shadows.ShadowMediaPlayer.setMediaInfoProvider(source -> new org.robolectric.shadows.ShadowMediaPlayer.MediaInfo(60000,1));
        ServiceController<BackupResolver> c = Robolectric.buildService(BackupResolver.class).create();
        try {
            BackupResolver p = c.get(); p.add(LibraryTest.track(0), true);
            java.lang.reflect.Field pending = PlaybackService.class.getDeclaredField("pending"); pending.setAccessible(true);
            ((java.util.concurrent.Future<?>) pending.get(p)).get(1, java.util.concurrent.TimeUnit.SECONDS);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofMillis(10));
            assertTrue(p.playing());
            java.lang.reflect.Field field = PlaybackService.class.getDeclaredField("player"); field.setAccessible(true);
            android.media.MediaPlayer decoder = (android.media.MediaPlayer) field.get(p);
            org.robolectric.shadows.ShadowMediaPlayer.setMediaInfoProvider(source -> new org.robolectric.shadows.ShadowMediaPlayer.MediaInfo(60000,60000));
            org.robolectric.Shadows.shadowOf(decoder).invokeErrorListener(1, -1004);
            assertTrue(p.loading());
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofSeconds(21));
            assertFalse(p.loading()); assertEquals(p.getString(R.string.connect_timeout),p.error());
        } finally { c.destroy(); }
    }
    @Test public void shuffleModePersistsAcrossServiceRecreation() {
        ServiceController<PlaybackService> c = Robolectric.buildService(PlaybackService.class).create();
        c.get().shuffle(true); c.destroy();
        c = Robolectric.buildService(PlaybackService.class).create();
        try { assertTrue(c.get().shuffled()); } finally { c.destroy(); }
    }

    @Test public void localPlaybackPauseResumeSeekAndCancelUseOneDecoder() throws Exception {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        org.robolectric.shadows.ShadowMediaPlayer.setMediaInfoProvider(source -> new org.robolectric.shadows.ShadowMediaPlayer.MediaInfo(60000,1));
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get();
            Track local = new Track("content://music/1","Local","Artist","","content://music/1",60);
            assertTrue(player.add(local,true));
            java.lang.reflect.Field pending = PlaybackService.class.getDeclaredField("pending"); pending.setAccessible(true);
            ((java.util.concurrent.Future<?>)pending.get(player)).get(1,java.util.concurrent.TimeUnit.SECONDS);
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofMillis(10));
            assertTrue(player.playing()); assertEquals(60000,player.duration());
            player.pause(false); assertFalse(player.playing()); player.resume(); assertTrue(player.playing());
            player.seek(10000); org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idleFor(java.time.Duration.ofMillis(10));
            assertTrue(player.position()>=10000); assertEquals(local.id,new MusicStore(player).history().get(0).id);
            player.play(0); java.util.concurrent.Future<?> work=(java.util.concurrent.Future<?>)pending.get(player);
            work.get(1,java.util.concurrent.TimeUnit.SECONDS); player.clearQueue();
            org.robolectric.Shadows.shadowOf(android.os.Looper.getMainLooper()).idle();
            assertFalse(player.playing()); assertFalse(player.loading()); assertNull(player.current());
        } finally { controller.destroy(); }
    }
    @Test public void queueIsBoundedDeduplicatedAndRestoredWithoutAutoplay() {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_library",0).edit().clear().commit();
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get();
            for (int i=0;i<50;i++) assertTrue(player.add(LibraryTest.track(i),false));
            assertFalse(player.add(LibraryTest.track(50),false)); assertTrue(player.add(LibraryTest.track(0),false));
            assertEquals(50,player.queue().size()); assertFalse(player.playing());
            player.queue().clear(); assertEquals(50,player.queue().size());
        } finally { controller.destroy(); }
        controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get(); assertEquals(50,player.queue().size()); assertFalse(player.playing()); assertFalse(player.loading());
            player.clearQueue(); assertTrue(player.queue().isEmpty()); assertNull(player.current());
        } finally { controller.destroy(); }
        assertTrue(new MusicStore(RuntimeEnvironment.getApplication()).queue().isEmpty());
    }
}
