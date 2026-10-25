package com.ecojust.hifinitv;

import android.os.Looper;
import java.io.IOException;
import java.lang.reflect.Field;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.function.Consumer;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import org.robolectric.android.controller.ServiceController;
import org.robolectric.shadows.ShadowMediaPlayer;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class PlayerTest {
    private static Track track(int number) { return new Track(String.valueOf(100 + number), "Track " + number, "Artist", "", 60); }
    private static HifiniApi.Resolved resolved(Track track, int revision, List<String> urls) {
        return new HifiniApi.Resolved(track.withMetadata("Resolved " + track.id + " #" + revision, "Artist",
                "https://covers.example.org/" + track.id + "-" + revision + ".png"), urls);
    }
    private static Object field(PlaybackService player, String name) throws Exception {
        Field field = PlaybackService.class.getDeclaredField(name); field.setAccessible(true); return field.get(player);
    }
    private static void resolvedWork(PlaybackService player) throws Exception {
        ((Future<?>)field(player, "pending")).get(3, TimeUnit.SECONDS);
        Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
    }
    private static android.media.MediaPlayer decoder(PlaybackService player) throws Exception {
        return (android.media.MediaPlayer)field(player, "player");
    }
    @Before public void reset() {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_playback", 0).edit().clear().commit();
        ShadowMediaPlayer.setMediaInfoProvider(source -> new ShadowMediaPlayer.MediaInfo(60000, 1));
    }
    public static class SlowResolver extends PlaybackService {
        final CountDownLatch started = new CountDownLatch(1);
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) throws IOException {
            started.countDown();
            try { new CountDownLatch(1).await(); }
            catch (InterruptedException e) { throw new IOException("cancelled", e); }
            throw new AssertionError("A stopped resolver must not complete");
        }
    }
    public static class FreshResolver extends PlaybackService {
        final AtomicInteger calls = new AtomicInteger();
        final List<String> requestedIds = Collections.synchronizedList(new ArrayList<>());
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            requestedIds.add(track.id); int call = calls.incrementAndGet();
            return resolved(track, call, Collections.singletonList("https://audio.example.org/" + track.id + "?token=" + call));
        }
    }
    public static class CatalogResolver extends PlaybackService {
        final AtomicInteger calls = new AtomicInteger();
        final HifiniApi api = new HifiniApi((url, referer, maximum) -> {
            throw new AssertionError("Catalog playback must use the confirmed source/id URL, not a guessed forum thread");
        });
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) throws IOException {
            calls.incrementAndGet(); return api.resolve(track, progress);
        }
    }
    public static class BackupResolver extends PlaybackService {
        final AtomicInteger calls = new AtomicInteger();
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            return resolved(track, calls.incrementAndGet(), Arrays.asList(
                    "https://one.example.org/audio", "https://two.example.org/audio", "https://three.example.org/audio"));
        }
    }
    public static class LateResolver extends FreshResolver {
        final CountDownLatch firstStarted = new CountDownLatch(1), releaseFirst = new CountDownLatch(1), firstReturned = new CountDownLatch(1);
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            if (!"100".equals(track.id)) return super.resolveTrack(track, progress);
            firstStarted.countDown();
            // Model a transport that returns after its Future was cancelled. A new song must still win.
            boolean released = false;
            while (!released) try { releaseFirst.await(); released = true; } catch (InterruptedException ignored) { }
            HifiniApi.Resolved result = resolved(track, 99, Collections.singletonList("https://audio.example.org/expired-old"));
            firstReturned.countDown(); return result;
        }
    }

    @Test public void audioResolutionHasAnOverallTimeoutAndRemainsRetryable() throws Exception {
        ServiceController<SlowResolver> controller = Robolectric.buildService(SlowResolver.class).create();
        try {
            SlowResolver player = controller.get(); player.add(track(0), true);
            assertTrue(player.started.await(3, TimeUnit.SECONDS)); assertTrue(player.loading());
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(21));
            assertFalse(player.loading()); assertFalse(player.playing());
            assertEquals(player.getString(R.string.resolve_timeout), player.error());
            player.play(0); assertTrue(player.loading()); player.pause(false); assertFalse(player.loading());
        } finally { controller.destroy(); }
    }
    @Test public void stalledSourcesUseBoundedBackupsWithoutEndlessPageRefresh() throws Exception {
        ShadowMediaPlayer.setMediaInfoProvider(source -> new ShadowMediaPlayer.MediaInfo(60000, 60000));
        ServiceController<BackupResolver> controller = Robolectric.buildService(BackupResolver.class).create();
        try {
            BackupResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(31));
            assertFalse(player.loading()); assertFalse(player.playing());
            assertEquals(player.getString(R.string.connect_timeout), player.error());
            assertEquals(1, player.calls.get()); assertEquals(2, field(player, "sourceIndex"));
        } finally { controller.destroy(); }
    }
    @Test public void decoderErrorAfterPlaybackReentersBoundedLoading() throws Exception {
        ServiceController<BackupResolver> controller = Robolectric.buildService(BackupResolver.class).create();
        try {
            BackupResolver player = controller.get(); player.add(track(0), true); resolvedWork(player); assertTrue(player.playing());
            android.media.MediaPlayer initial = decoder(player);
            ShadowMediaPlayer.setMediaInfoProvider(source -> new ShadowMediaPlayer.MediaInfo(60000, 60000));
            Shadows.shadowOf(initial).invokeErrorListener(1, -1004); assertTrue(player.loading());
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(21));
            assertFalse(player.loading()); assertEquals(player.getString(R.string.connect_timeout), player.error());
            assertEquals(1, player.calls.get());
        } finally { controller.destroy(); }
    }
    @Test public void expiredMediaResolvesOnceAgainAndDoesNotLoopOnRepeatedFailure() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            Shadows.shadowOf(decoder(player)).invokeErrorListener(1, -1004);
            assertTrue(player.loading()); resolvedWork(player);
            assertEquals(2, player.calls.get()); assertTrue(player.playing());
            assertEquals(Collections.singletonList("https://audio.example.org/100?token=2"), field(player, "sources"));
            assertEquals("Resolved 100 #2", player.current().title);
            Shadows.shadowOf(decoder(player)).invokeErrorListener(1, -1004);
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(2, player.calls.get());
            assertFalse(player.error().isEmpty());
        } finally { controller.destroy(); }
    }
    @Test public void playingSameTrackAgainResolvesFreshAudioAndArtwork() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            assertEquals(1, player.calls.get()); assertEquals("Resolved 100 #1", player.current().title);
            player.play(0); assertTrue(player.loading()); resolvedWork(player);
            assertEquals(2, player.calls.get()); assertEquals("Resolved 100 #2", player.current().title);
            assertEquals("https://covers.example.org/100-2.png", player.current().cover);
            assertEquals(Collections.singletonList("https://audio.example.org/100?token=2"), field(player, "sources"));
        } finally { controller.destroy(); }
    }
    @Test public void cancelledOldResolutionCannotReplaceNewSongMetadataOrAudio() throws Exception {
        ServiceController<LateResolver> controller = Robolectric.buildService(LateResolver.class).create();
        LateResolver player = controller.get();
        try {
            player.add(track(0), true); assertTrue(player.firstStarted.await(3, TimeUnit.SECONDS));
            player.add(track(1), true); resolvedWork(player); assertEquals("101", player.current().id);
            player.releaseFirst.countDown(); assertTrue(player.firstReturned.await(3, TimeUnit.SECONDS));
            // Wait for the old worker to exit and enqueue its result, without relying on a wall-clock sleep.
            ThreadPoolExecutor executor = (ThreadPoolExecutor)field(player, "resolver");
            executor.shutdown(); assertTrue(executor.awaitTermination(3, TimeUnit.SECONDS));
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
            assertEquals("Resolved 101 #1", player.current().title); assertTrue(player.playing());
            assertEquals(Collections.singletonList("https://audio.example.org/101?token=1"), field(player, "sources"));
            assertEquals("", player.error());
        } finally { player.releaseFirst.countDown(); controller.destroy(); }
    }
    @Test public void pauseResumeAndSeekKeepTheCurrentDecoderButReplayReResolves() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            android.media.MediaPlayer currentDecoder = decoder(player);
            assertTrue(player.playing()); assertEquals(60000, player.duration());
            player.pause(false); assertFalse(player.playing()); player.resume(); assertTrue(player.playing());
            player.seek(10000); Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
            assertTrue(player.position() >= 10000); assertSame(currentDecoder, decoder(player)); assertEquals(1, player.calls.get());
            player.play(0); resolvedWork(player); assertEquals(2, player.calls.get()); assertNotSame(currentDecoder, decoder(player));
            player.clearQueue(); assertFalse(player.playing()); assertFalse(player.loading()); assertNull(player.current());
        } finally { controller.destroy(); }
    }
    @Test public void queueIsBoundedDeduplicatedAndNeverRestoredFromAnEarlierSession() {
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get(); assertTrue(player.queue().isEmpty()); assertNull(player.current());
            for (int i = 0; i < 50; i++) assertTrue(player.add(track(i), false));
            assertFalse(player.add(track(50), false)); assertTrue(player.add(track(0), false));
            assertEquals(50, player.queue().size()); assertFalse(player.playing());
            player.queue().clear(); assertEquals(50, player.queue().size());
        } finally { controller.destroy(); }
        controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get(); assertTrue(player.queue().isEmpty()); assertNull(player.current());
            assertFalse(player.playing()); assertFalse(player.loading());
        } finally { controller.destroy(); }
    }
    @Test public void choosingSearchResultStartsThatSongWithoutResolvingTheFirstResult() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.playListAt(Arrays.asList(track(0), track(1), track(2)), 2); resolvedWork(player);
            assertEquals(Collections.singletonList("102"), player.requestedIds); assertEquals("102", player.current().id);
            assertEquals(3, player.queue().size()); assertFalse(player.shuffled()); assertTrue(player.playing());
        } finally { controller.destroy(); }
    }
    @Test public void catalogResultsKeepProviderIdentityAndPlayTheirOfficialSourceIdUrl() throws Exception {
        Track netease = Track.catalog("netease", "254485", "", "Song", "Artist", "https://covers.example.org/a.png", 239);
        Track kuwo = Track.catalog("kuwo", "254485", "", "Other version", "Other artist", "https://covers.example.org/b.png", 241);
        ServiceController<CatalogResolver> controller = Robolectric.buildService(CatalogResolver.class).create();
        try {
            CatalogResolver player = controller.get(); player.playListAt(Arrays.asList(netease, kuwo), 1); resolvedWork(player);
            assertEquals(2, player.queue().size()); assertEquals("kuwo:254485", player.current().id);
            assertEquals("", player.current().threadId); assertEquals("https://covers.example.org/b.png", player.current().cover);
            assertEquals(241, player.current().duration); assertTrue(player.playing());
            assertEquals(Collections.singletonList("https://www.hifini.net/musicparse-play.htm?source=kuwo&id=254485"), field(player, "sources"));
            player.play(0); resolvedWork(player);
            assertEquals("netease:254485", player.current().id); assertEquals(2, player.calls.get());
            assertEquals(Collections.singletonList("https://www.hifini.net/musicparse-play.htm?source=netease&id=254485"), field(player, "sources"));
            player.play(0); resolvedWork(player); assertEquals(3, player.calls.get()); assertTrue(player.playing());
        } finally { controller.destroy(); }
    }
    @Test public void applicationAndPlaybackServiceHaveIndependentHifiniIdentity() {
        assertEquals("com.ecojust.hifinitv", RuntimeEnvironment.getApplication().getPackageName());
        assertEquals("HIFINi TV", RuntimeEnvironment.getApplication().getString(R.string.app_name));
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            assertEquals("com.ecojust.hifinitv", controller.get().getPackageName());
            assertEquals("com.ecojust.hifinitv.PlaybackService", controller.get().getClass().getName());
            assertTrue(controller.get().queue().isEmpty()); assertNull(controller.get().current());
        } finally { controller.destroy(); }
    }
    @Test public void onlyShufflePreferencePersistsAcrossServiceRecreation() {
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        assertTrue(controller.get().shuffled()); controller.get().shuffle(false); controller.destroy();
        controller = Robolectric.buildService(PlaybackService.class).create();
        try { assertFalse(controller.get().shuffled()); assertTrue(controller.get().queue().isEmpty()); }
        finally { controller.destroy(); }
    }
}
