package com.ecojust.hifinitv;

import android.os.Looper;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Field;
import java.nio.file.Files;
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
import org.robolectric.shadows.util.DataSource;
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
        // Each retry can enqueue a new resolver and downloader. Drain real work, then main callbacks.
        for (int round = 0; round < 16; round++) {
            Future<?> resolution = (Future<?>)field(player, "pending");
            if (resolution != null && !resolution.isCancelled()) resolution.get(3, TimeUnit.SECONDS);
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
            Future<?> download = (Future<?>)field(player, "downloadPending");
            if (download != null && !download.isCancelled()) download.get(3, TimeUnit.SECONDS);
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
            if (!player.loading() || decoder(player) != null) return;
        }
        fail("Playback did not settle within its bounded attempts");
    }
    private static void resolveOnly(PlaybackService player) throws Exception {
        ((Future<?>)field(player, "pending")).get(3, TimeUnit.SECONDS);
        Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
    }
    private static android.media.MediaPlayer decoder(PlaybackService player) throws Exception {
        return (android.media.MediaPlayer)field(player, "player");
    }
    private static File localFile(PlaybackService player) throws Exception { return (File)field(player, "currentAudioFile"); }
    @Before public void reset() {
        RuntimeEnvironment.getApplication().getSharedPreferences("music_playback", 0).edit().clear().commit();
        deleteTree(new File(RuntimeEnvironment.getApplication().getFilesDir(), "hifini-library"));
        ShadowMediaPlayer.resetStaticState();
        ShadowMediaPlayer.setMediaInfoProvider(source -> new ShadowMediaPlayer.MediaInfo(60000, 1));
    }
    private static void deleteTree(File file) {
        File[] children = file.listFiles(); if (children != null) for (File child : children) deleteTree(child);
        file.delete();
    }
    private static LocalLibrary library(PlaybackService player) throws Exception { return (LocalLibrary)field(player, "library"); }
    private static List<File> seed(LocalFixtureService player, int count) throws Exception {
        List<File> files = new ArrayList<>();
        for (int i = 0; i < count; i++) { library(player).prepareDownload(track(i)); files.add(library(player).save(track(i), player.fixture())); }
        return files;
    }
    public static class LocalFixtureService extends PlaybackService {
        final AtomicInteger downloads = new AtomicInteger();
        final List<String> downloadedUrls = Collections.synchronizedList(new ArrayList<>());
        final List<File> files = Collections.synchronizedList(new ArrayList<>());
        File fixture() throws IOException {
            File directory = new File(getCacheDir(), "hifini-audio"); directory.mkdirs();
            File result = File.createTempFile("player-fixture-", ".audio", directory);
            // Decoder behavior is Robolectric's responsibility; the service must still receive a real local file.
            Files.write(result.toPath(), new byte[]{'R','I','F','F',8,0,0,0,'W','A','V','E'});
            files.add(result); return result;
        }
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            downloads.incrementAndGet(); downloadedUrls.add(source);
            progress.accept(new AudioDownloader.Progress(2048, 4096));
            File result = fixture(); progress.accept(new AudioDownloader.Progress(4096, 4096)); return result;
        }
    }
    public static class SlowResolver extends LocalFixtureService {
        final CountDownLatch started = new CountDownLatch(1);
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) throws IOException {
            started.countDown();
            try { new CountDownLatch(1).await(); }
            catch (InterruptedException e) { throw new IOException("cancelled", e); }
            throw new AssertionError("A stopped resolver must not complete");
        }
    }
    public static class FreshResolver extends LocalFixtureService {
        final AtomicInteger calls = new AtomicInteger();
        final List<String> requestedIds = Collections.synchronizedList(new ArrayList<>());
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            requestedIds.add(track.id); int call = calls.incrementAndGet();
            return resolved(track, call, Collections.singletonList("https://audio.example.org/" + track.id + "?token=" + call));
        }
    }
    public static class CatalogResolver extends LocalFixtureService {
        final AtomicInteger calls = new AtomicInteger();
        final HifiniApi api = new HifiniApi((url, referer, maximum) -> {
            throw new AssertionError("Catalog playback must not invent a forum request");
        });
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) throws IOException {
            calls.incrementAndGet(); return api.resolve(track, progress);
        }
    }
    public static class BackupResolver extends LocalFixtureService {
        final AtomicInteger calls = new AtomicInteger();
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            return resolved(track, calls.incrementAndGet(), Arrays.asList(
                    "https://one.example.org/audio", "https://two.example.org/audio", "https://three.example.org/audio"));
        }
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            if (!source.contains("three.")) {
                downloads.incrementAndGet(); downloadedUrls.add(source);
                throw new AudioDownloader.DownloadException(AudioDownloader.Failure.HTTP_STATUS, 503);
            }
            return super.downloadAudio(transfer, source, referer, progress);
        }
    }
    public static class CancelledBackupDownload extends BackupResolver {
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            downloads.incrementAndGet(); downloadedUrls.add(source);
            // The downloader reports this same failure when logout invalidates its captured session epoch.
            throw new AudioDownloader.DownloadException(AudioDownloader.Failure.CANCELLED);
        }
    }
    public static class FailedDownload extends FreshResolver {
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            downloads.incrementAndGet(); downloadedUrls.add(source);
            throw new AudioDownloader.DownloadException(AudioDownloader.Failure.HTTP_STATUS, 503);
        }
    }
    public static class BlockingDownload extends FreshResolver {
        final CountDownLatch started = new CountDownLatch(1), release = new CountDownLatch(1), finished = new CountDownLatch(1);
        volatile Consumer<AudioDownloader.Progress> report;
        volatile File lateFile;
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            if (!source.contains("/100?")) return super.downloadAudio(transfer, source, referer, progress);
            downloads.incrementAndGet(); downloadedUrls.add(source); report = progress; started.countDown();
            boolean released = false;
            // Even a transport completing after interruption must not restore cancelled playback or leave an orphan.
            while (!released) try { release.await(); released = true; } catch (InterruptedException ignored) { }
            lateFile = fixture(); finished.countDown(); return lateFile;
        }
    }
    public static class LateResolver extends FreshResolver {
        final CountDownLatch firstStarted = new CountDownLatch(1), releaseFirst = new CountDownLatch(1), firstReturned = new CountDownLatch(1);
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            if (!"100".equals(track.id)) return super.resolveTrack(track, progress);
            firstStarted.countDown();
            boolean released = false;
            while (!released) try { releaseFirst.await(); released = true; } catch (InterruptedException ignored) { }
            HifiniApi.Resolved result = resolved(track, 99, Collections.singletonList("https://audio.example.org/expired-old"));
            firstReturned.countDown(); return result;
        }
    }
    public static class ImmediateDecoderFailure extends CatalogResolver {
        @Override public void onCreate() {
            super.onCreate();
            ShadowMediaPlayer.setCreateListener((decoder, shadow) -> {
                try {
                    File local = library(this).find(current().id);
                    ShadowMediaPlayer.addException(DataSource.toDataSource(local.getAbsolutePath()),
                            new IOException("setDataSource failed: status=0x80000000 https://example.invalid/?secret=private-token"));
                } catch (Exception invalidFixture) { throw new AssertionError(invalidFixture); }
            });
        }
    }
    public static class OfflineService extends LocalFixtureService {
        final AtomicInteger resolutions = new AtomicInteger();
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            resolutions.incrementAndGet(); throw new AssertionError("Local playback must not resolve or require a login");
        }
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) {
            downloads.incrementAndGet(); throw new AssertionError("Local playback must not download");
        }
    }
    public static class ExpiredBeforeDownload extends FreshResolver {
        @Override HifiniApi.Resolved resolveTrack(Track track, Consumer<String> progress) {
            HifiniApi.Resolved result = super.resolveTrack(track, progress);
            try { Field deadline = PlaybackService.class.getDeclaredField("loadDeadline"); deadline.setAccessible(true); deadline.setLong(this, -1); }
            catch (Exception failure) { throw new AssertionError(failure); }
            return result;
        }
    }
    public static class InspectingDownload extends FreshResolver {
        volatile boolean evictionPublished;
        @Override File downloadAudio(AudioDownloader transfer, String source, String referer, Consumer<AudioDownloader.Progress> progress) throws IOException {
            assertEquals(49, localTracks().size()); assertFalse(localTracks().stream().anyMatch(track -> track.id.equals("100")));
            assertTrue("The UI must receive the reduced library before any network download", evictionPublished);
            return super.downloadAudio(transfer, source, referer, progress);
        }
    }

    @Test public void audioResolutionHasAnOverallTimeoutAndRemainsRetryable() throws Exception {
        ServiceController<SlowResolver> controller = Robolectric.buildService(SlowResolver.class).create();
        try {
            SlowResolver player = controller.get(); player.add(track(0), true);
            assertTrue(player.started.await(3, TimeUnit.SECONDS)); assertTrue(player.loading());
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(21));
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(0, player.downloads.get());
            assertEquals(player.getString(R.string.resolve_timeout), player.error());
            player.play(0); assertTrue(player.loading()); player.pause(false); assertFalse(player.loading());
        } finally { controller.destroy(); }
    }
    @Test public void completeDownloadFeedsLocalDecoderAndRemoteQrNeverExposesCachePath() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        FreshResolver player = controller.get(); File local = null;
        try {
            player.add(track(0), true); resolvedWork(player); local = localFile(player);
            assertNotNull(local); assertTrue(local.isFile()); assertTrue(player.playing());
            assertEquals(DataSource.toDataSource(local.getAbsolutePath()), Shadows.shadowOf(decoder(player)).getDataSource());
            assertEquals("https://audio.example.org/100?token=1", player.audioUrl());
            assertFalse(player.audioUrl().contains(getCachePath(player))); assertEquals(1, player.downloads.get());
        } finally { controller.destroy(); if (local != null) assertTrue(local.exists()); }
    }
    private static String getCachePath(PlaybackService player) { return player.getCacheDir().getAbsolutePath(); }
    @Test public void downloadProgressPrecedesDecoderAndPauseDiscardsALateCompletedFile() throws Exception {
        ServiceController<BlockingDownload> controller = Robolectric.buildService(BlockingDownload.class).create();
        BlockingDownload player = controller.get();
        try {
            player.add(track(0), true); resolveOnly(player); assertTrue(player.started.await(3, TimeUnit.SECONDS));
            player.report.accept(new AudioDownloader.Progress(1024, 2048)); Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertEquals(player.getString(R.string.download_progress_percent, 50), player.stage()); assertNull(decoder(player)); assertTrue(player.loading());
            player.report.accept(new AudioDownloader.Progress(4096, -1)); Shadows.shadowOf(Looper.getMainLooper()).idle();
            assertEquals(player.getString(R.string.download_progress_size, "4 KB"), player.stage());
            player.pause(false); assertFalse(player.loading()); assertFalse(player.playing());
            player.release.countDown(); finishWorkers(player); assertNotNull(player.lateFile); assertFalse(player.lateFile.exists());
            assertNull(decoder(player)); assertTrue(player.localTracks().isEmpty()); assertEquals("https://audio.example.org/100?token=1", player.audioUrl());
        } finally { player.release.countDown(); controller.destroy(); }
    }
    @Test public void downloadTimeoutCancelsAfterNinetySecondsWithoutStartingDecoder() throws Exception {
        ServiceController<BlockingDownload> controller = Robolectric.buildService(BlockingDownload.class).create();
        BlockingDownload player = controller.get();
        try {
            player.add(track(0), true); resolveOnly(player); assertTrue(player.started.await(3, TimeUnit.SECONDS));
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(91));
            assertFalse(player.loading()); assertEquals(player.getString(R.string.download_timeout), player.error());
            assertNull(decoder(player)); assertEquals(1, player.calls.get());
            player.release.countDown(); finishWorkers(player); assertFalse(player.lateFile.exists());
        } finally { player.release.countDown(); controller.destroy(); }
    }
    @Test public void switchingDuringDownloadKeepsOnlyTheSelectedSongsCompletedFile() throws Exception {
        ServiceController<BlockingDownload> controller = Robolectric.buildService(BlockingDownload.class).create();
        BlockingDownload player = controller.get();
        try {
            player.add(track(0), true); resolveOnly(player); assertTrue(player.started.await(3, TimeUnit.SECONDS));
            player.add(track(1), true); resolvedWork(player); File selected = localFile(player);
            assertEquals("101", player.current().id); assertTrue(selected.exists()); assertTrue(player.playing());
            player.release.countDown(); finishWorkers(player);
            assertFalse(player.lateFile.exists()); assertTrue(selected.exists()); assertEquals(selected, localFile(player));
            assertEquals(1, player.localTracks().size()); assertEquals("101", player.localTracks().get(0).id);
            assertEquals("https://audio.example.org/101?token=2", player.audioUrl());
        } finally { player.release.countDown(); controller.destroy(); }
    }
    @Test public void destroyingServiceDiscardsLateDownloadWithoutDependingOnMainCallbacks() throws Exception {
        ServiceController<BlockingDownload> controller = Robolectric.buildService(BlockingDownload.class).create();
        BlockingDownload player = controller.get();
        player.add(track(0), true); resolveOnly(player); assertTrue(player.started.await(3, TimeUnit.SECONDS));
        controller.destroy(); player.release.countDown();
        ThreadPoolExecutor workers = (ThreadPoolExecutor)field(player, "resolver"); assertTrue(workers.awaitTermination(3, TimeUnit.SECONDS));
        assertNotNull(player.lateFile); assertFalse(player.lateFile.exists()); assertTrue(player.localTracks().isEmpty());
    }
    private static void finishWorkers(PlaybackService player) throws Exception {
        ThreadPoolExecutor workers = (ThreadPoolExecutor)field(player, "resolver"); workers.shutdown();
        assertTrue(workers.awaitTermination(3, TimeUnit.SECONDS)); Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
    }
    @Test public void failedDownloadsUseBoundedBackupsBeforeDecoding() throws Exception {
        ServiceController<BackupResolver> controller = Robolectric.buildService(BackupResolver.class).create();
        try {
            BackupResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            assertTrue(player.playing()); assertEquals(1, player.calls.get()); assertEquals(3, player.downloads.get());
            assertEquals(Arrays.asList("https://one.example.org/audio", "https://two.example.org/audio", "https://three.example.org/audio"), player.downloadedUrls);
            assertEquals("https://three.example.org/audio", player.audioUrl()); assertTrue(localFile(player).exists());
        } finally { controller.destroy(); }
    }
    @Test public void cancelledDownloadNeverTriesBackupsOrRefreshesAnInvalidatedSession() throws Exception {
        ServiceController<CancelledBackupDownload> controller = Robolectric.buildService(CancelledBackupDownload.class).create();
        try {
            CancelledBackupDownload player = controller.get(); player.add(track(0), true); resolvedWork(player);
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(1, player.calls.get()); assertEquals(1, player.downloads.get());
            assertEquals(Collections.singletonList("https://one.example.org/audio"), player.downloadedUrls);
            assertEquals(0, field(player, "sourceIndex")); assertNull(decoder(player)); assertNull(localFile(player));
            assertEquals(player.getString(R.string.download_failed_detail, player.getString(R.string.playback_cancelled)), player.error());
        } finally { controller.destroy(); }
    }
    @Test public void repeatedDownloadFailureRefreshesSourceOnceAndStopsWithoutStreamingFallback() throws Exception {
        ServiceController<FailedDownload> controller = Robolectric.buildService(FailedDownload.class).create();
        try {
            FailedDownload player = controller.get(); player.add(track(0), true); resolvedWork(player);
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(2, player.calls.get()); assertEquals(2, player.downloads.get());
            assertNull(decoder(player)); assertNull(localFile(player)); assertTrue(player.localTracks().isEmpty()); assertTrue(player.error().contains("503"));
            assertEquals("https://audio.example.org/100?token=2", player.audioUrl());
        } finally { controller.destroy(); }
    }
    @Test public void localDecoderErrorStopsWithoutRedownloadingTheUnsupportedAudio() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player); File local = localFile(player);
            Shadows.shadowOf(decoder(player)).invokeErrorListener(1, -1004);
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(1, player.calls.get()); assertEquals(1, player.downloads.get());
            assertEquals(player.getString(R.string.decoder_error, 1, -1004), player.error()); assertTrue(local.exists());
            assertEquals("https://audio.example.org/100?token=1", player.audioUrl());
        } finally { controller.destroy(); }
    }
    @Test public void localPreparationHasTenSecondTimeoutWithoutAnotherDownload() throws Exception {
        ShadowMediaPlayer.setMediaInfoProvider(source -> new ShadowMediaPlayer.MediaInfo(60000, 60000));
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player); File local = localFile(player);
            assertTrue(player.loading()); Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(11));
            assertFalse(player.loading()); assertEquals(player.getString(R.string.local_prepare_timeout), player.error());
            assertEquals(1, player.downloads.get()); assertTrue(local.exists());
        } finally { controller.destroy(); }
    }
    @Test public void replayUsesSavedAudioWithoutRequestsOrRefreshingFifoOrder() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player); File saved = localFile(player);
            long revision = player.libraryRevision();
            player.play(0); resolvedWork(player);
            assertEquals(1, player.calls.get()); assertEquals(1, player.downloads.get()); assertEquals("Resolved 100 #1", player.current().title);
            assertEquals("https://covers.example.org/100-1.png", player.current().cover); assertEquals(saved, localFile(player));
            assertEquals(revision, player.libraryRevision()); assertTrue(saved.exists());
        } finally { controller.destroy(); }
    }
    @Test public void cancelledOldResolutionCannotReplaceNewSongMetadataOrLocalAudio() throws Exception {
        ServiceController<LateResolver> controller = Robolectric.buildService(LateResolver.class).create(); LateResolver player = controller.get();
        try {
            player.add(track(0), true); assertTrue(player.firstStarted.await(3, TimeUnit.SECONDS));
            player.add(track(1), true); resolvedWork(player); File local = localFile(player);
            player.releaseFirst.countDown(); assertTrue(player.firstReturned.await(3, TimeUnit.SECONDS)); finishWorkers(player);
            assertEquals("Resolved 101 #1", player.current().title); assertTrue(player.playing()); assertEquals(local, localFile(player));
            assertEquals(Collections.singletonList("https://audio.example.org/101?token=1"), player.downloadedUrls); assertEquals("", player.error());
        } finally { player.releaseFirst.countDown(); controller.destroy(); }
    }
    @Test public void attemptedAudioUrlClearsBeforeANewSelectionAndWhenQueueIsCleared() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); assertEquals("", player.audioUrl());
            player.playListAt(Arrays.asList(track(0), track(1)), 0); resolvedWork(player);
            assertEquals("https://audio.example.org/100?token=1", player.audioUrl());
            player.pause(false); assertEquals("https://audio.example.org/100?token=1", player.audioUrl());
            player.play(1); assertEquals("", player.audioUrl()); resolvedWork(player);
            assertEquals("https://audio.example.org/101?token=2", player.audioUrl());
            player.clearQueue(); assertEquals("", player.audioUrl()); assertNull(player.current());
        } finally { controller.destroy(); }
    }
    @Test public void immediateLocalDecoderFailuresRetainRemoteUrlAndSanitizedNativeStatus() throws Exception {
        ServiceController<ImmediateDecoderFailure> controller = Robolectric.buildService(ImmediateDecoderFailure.class).create();
        try {
            ImmediateDecoderFailure player = controller.get(); player.add(Track.catalog("netease", "254485", "", "Song", "Artist", "", 239), true); resolvedWork(player);
            assertFalse(player.loading()); assertFalse(player.playing()); assertEquals(1, player.calls.get()); assertEquals(1, player.downloads.get());
            assertEquals("https://www.hifini.net/musicparse-play.htm?source=netease&id=254485", player.audioUrl());
            assertTrue(player.error().contains("IOException")); assertTrue(player.error().contains("status=0x80000000"));
            assertFalse(player.error().contains("private-token")); assertFalse(player.error().contains("https://")); assertFalse(player.files.get(0).exists()); assertNotNull(library(player).find("netease:254485"));
        } finally { controller.destroy(); }
    }
    @Test public void pauseResumeSeekAndClearQueueKeepPersistentAudio() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.add(track(0), true); resolvedWork(player);
            android.media.MediaPlayer currentDecoder = decoder(player); File local = localFile(player);
            assertTrue(player.playing()); assertEquals(60000, player.duration());
            player.pause(false); assertFalse(player.playing()); assertTrue(local.exists()); player.resume(); assertTrue(player.playing());
            player.seek(10000); Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(10));
            assertTrue(player.position() >= 10000); assertSame(currentDecoder, decoder(player)); assertEquals(1, player.downloads.get());
            player.clearQueue(); assertTrue(local.exists()); assertEquals(1, player.localTracks().size()); assertFalse(player.playing()); assertFalse(player.loading()); assertNull(player.current());
        } finally { controller.destroy(); }
    }
    @Test public void queueIsBoundedDeduplicatedAndNeverRestoredFromAnEarlierSession() {
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try {
            PlaybackService player = controller.get(); assertTrue(player.queue().isEmpty()); assertNull(player.current());
            for (int i = 0; i < 50; i++) assertTrue(player.add(track(i), false));
            assertFalse(player.add(track(50), false)); assertTrue(player.add(track(0), false)); assertEquals(50, player.queue().size()); assertFalse(player.playing());
            player.queue().clear(); assertEquals(50, player.queue().size());
        } finally { controller.destroy(); }
        controller = Robolectric.buildService(PlaybackService.class).create();
        try { assertTrue(controller.get().queue().isEmpty()); assertNull(controller.get().current()); assertFalse(controller.get().playing()); }
        finally { controller.destroy(); }
    }
    @Test public void choosingSearchResultDownloadsThatSongWithoutResolvingTheFirstResult() throws Exception {
        ServiceController<FreshResolver> controller = Robolectric.buildService(FreshResolver.class).create();
        try {
            FreshResolver player = controller.get(); player.playListAt(Arrays.asList(track(0), track(1), track(2)), 2); resolvedWork(player);
            assertEquals(Collections.singletonList("102"), player.requestedIds); assertEquals("102", player.current().id);
            assertEquals(Collections.singletonList("https://audio.example.org/102?token=1"), player.downloadedUrls);
            assertEquals(3, player.queue().size()); assertFalse(player.shuffled()); assertTrue(player.playing());
        } finally { controller.destroy(); }
    }
    @Test public void catalogResultsKeepProviderIdentityAndDownloadTheirOfficialSourceIdUrl() throws Exception {
        Track netease = Track.catalog("netease", "254485", "", "Song", "Artist", "https://covers.example.org/a.png", 239);
        Track kuwo = Track.catalog("kuwo", "254485", "", "Other version", "Other artist", "https://covers.example.org/b.png", 241);
        ServiceController<CatalogResolver> controller = Robolectric.buildService(CatalogResolver.class).create();
        try {
            CatalogResolver player = controller.get(); player.playListAt(Arrays.asList(netease, kuwo), 1); resolvedWork(player);
            assertEquals(2, player.queue().size()); assertEquals("kuwo:254485", player.current().id); assertEquals("", player.current().threadId);
            assertEquals("https://covers.example.org/b.png", player.current().cover); assertEquals(241, player.current().duration); assertTrue(player.playing());
            assertEquals(Collections.singletonList("https://www.hifini.net/musicparse-play.htm?source=kuwo&id=254485"), player.downloadedUrls);
            assertEquals(DataSource.toDataSource(localFile(player).getAbsolutePath()), Shadows.shadowOf(decoder(player)).getDataSource());
            player.play(0); resolvedWork(player); assertEquals("netease:254485", player.current().id); assertEquals(2, player.calls.get());
            assertEquals("https://www.hifini.net/musicparse-play.htm?source=netease&id=254485", player.audioUrl());
        } finally { controller.destroy(); }
    }
    @Test public void librarySurvivesRecreationAndLocalOrSearchSelectionNeverNeedsNetwork() throws Exception {
        Track song = Track.catalog("netease", "254485", "", "Song", "Artist", "https://covers.example.org/song.png", 239);
        ServiceController<CatalogResolver> first = Robolectric.buildService(CatalogResolver.class).create();
        first.get().playListAt(Collections.singletonList(song), 0); resolvedWork(first.get());
        File saved = localFile(first.get()); long revision = first.get().libraryRevision(); first.destroy(); assertTrue(saved.exists());
        ServiceController<OfflineService> next = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = next.get(); assertEquals(1, player.localTracks().size()); assertEquals(revision, player.libraryRevision());
            player.playLocalListAt(player.localTracks(), 0); resolvedWork(player); assertTrue(player.playing()); assertEquals(saved, localFile(player));
            player.clearQueue(); player.playListAt(Collections.singletonList(song), 0); resolvedWork(player);
            assertTrue(player.playing()); assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get());
            assertEquals(revision, player.libraryRevision()); assertEquals("https://www.hifini.net/musicparse-play.htm?source=netease&id=254485", player.audioUrl());
        } finally { next.destroy(); }
        assertTrue(saved.exists());
    }
    @Test public void localShufflePlaysEachSavedSongWithoutRequestsAndDoesNotRefreshFifo() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); seed(player, 3); long revision = player.libraryRevision();
            player.playLocalList(player.localTracks(), true); resolvedWork(player); Set<String> heard = new HashSet<>(); heard.add(player.current().id);
            player.next(); resolvedWork(player); assertTrue(heard.add(player.current().id));
            player.next(); resolvedWork(player); assertTrue(heard.add(player.current().id));
            assertEquals(3, heard.size()); assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get());
            assertEquals(revision, player.libraryRevision()); assertEquals("100", player.localTracks().get(0).id);
        } finally { controller.destroy(); }
    }
    @Test public void missingLocalFilePrunesLibraryAndNeverSilentlyDownloads() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); List<File> stored = seed(player, 1); List<Track> snapshot = player.localTracks(); long revision = player.libraryRevision();
            assertTrue(stored.get(0).delete()); player.playLocalListAt(snapshot, 0); resolvedWork(player);
            assertFalse(player.loading()); assertEquals(player.getString(R.string.local_audio_missing), player.error());
            assertTrue(player.localTracks().isEmpty()); assertTrue(player.libraryRevision() > revision);
            assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get()); assertNull(decoder(player));
        } finally { controller.destroy(); }
    }
    @Test public void fiftyFirstDownloadEvictsOldestAndPublishesLibraryBeforeTheTransferStarts() throws Exception {
        ServiceController<InspectingDownload> controller = Robolectric.buildService(InspectingDownload.class).create();
        try {
            InspectingDownload player = controller.get(); List<File> stored = seed(player, 50);
            player.listen(() -> { if (player.localTracks().size() == 49) player.evictionPublished = true; });
            player.playListAt(Collections.singletonList(track(50)), 0); resolvedWork(player);
            assertTrue(player.playing()); assertFalse(stored.get(0).exists()); assertTrue(stored.get(1).exists()); assertEquals(50, player.localTracks().size());
            assertEquals("101", player.localTracks().get(0).id); assertEquals("150", player.localTracks().get(49).id);
        } finally { controller.destroy(); }
    }
    @Test public void failedDownloadRetriesDoNotEvictASecondSavedSong() throws Exception {
        ServiceController<FailedDownload> controller = Robolectric.buildService(FailedDownload.class).create();
        try {
            FailedDownload player = controller.get(); List<File> stored = seed(player, 50); long revision = player.libraryRevision();
            player.playListAt(Collections.singletonList(track(50)), 0); resolvedWork(player);
            assertEquals(2, player.downloads.get()); assertFalse(player.playing()); assertEquals(49, player.localTracks().size());
            assertFalse(stored.get(0).exists()); assertTrue(stored.get(1).exists()); assertEquals("101", player.localTracks().get(0).id);
            assertEquals(revision + 1, player.libraryRevision());
        } finally { controller.destroy(); }
    }
    @Test public void expiredRequestDoesNotEvictIfNoDownloadCanStart() throws Exception {
        ServiceController<ExpiredBeforeDownload> controller = Robolectric.buildService(ExpiredBeforeDownload.class).create();
        try {
            ExpiredBeforeDownload player = controller.get(); List<File> stored = seed(player, 50); long revision = player.libraryRevision();
            player.playListAt(Collections.singletonList(track(50)), 0); resolvedWork(player);
            assertEquals(0, player.downloads.get()); assertEquals(50, player.localTracks().size()); assertTrue(stored.get(0).exists());
            assertEquals(revision, player.libraryRevision()); assertEquals(player.getString(R.string.download_timeout), player.error());
        } finally { controller.destroy(); }
    }
    @Test public void damagedLibraryIsReportedWithoutDeletingAudioOrDownloading() throws Exception {
        File directory = new File(RuntimeEnvironment.getApplication().getFilesDir(), "hifini-library"); assertTrue(directory.mkdirs());
        File audio = new File(directory, "existing.audio"); Files.write(audio.toPath(), new byte[]{1,2,3});
        Files.write(new File(directory, "index.json").toPath(), "not a library".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); assertEquals(player.getString(R.string.library_unavailable), player.error());
            player.playListAt(Collections.singletonList(track(0)), 0); assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get());
            assertTrue(audio.exists()); assertEquals(player.getString(R.string.library_unavailable), player.error());
        } finally { controller.destroy(); }
    }
    @Test public void deletingCurrentAndOtherSavedSongsStopsAndRemovesThemFromAutomaticQueue() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); List<File> stored = seed(player, 3); player.playLocalListAt(player.localTracks(), 1); resolvedWork(player);
            assertEquals(2, player.deleteLocalTracks(Arrays.asList("101", "102", "unknown"))); assertFalse(player.playing()); assertNull(player.current());
            assertEquals("", player.audioUrl()); assertEquals(1, player.queue().size()); assertEquals("100", player.queue().get(0).id);
            assertTrue(stored.get(0).exists()); assertFalse(stored.get(1).exists()); assertFalse(stored.get(2).exists());
            player.next(); resolvedWork(player); assertEquals("100", player.current().id); assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get());
        } finally { controller.destroy(); }
    }
    @Test public void deletingOtherSongsPreservesDecoderAndRepairsSearchQueueShuffleIndices() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); seed(player, 4); player.playListAt(player.localTracks(), 2); resolvedWork(player);
            android.media.MediaPlayer initial = decoder(player); player.shuffle(true);
            assertEquals(2, player.deleteLocalTracks(Arrays.asList("100", "103"))); assertTrue(player.playing()); assertSame(initial, decoder(player));
            assertEquals(1, player.currentIndex()); assertEquals("102", player.current().id); assertEquals(2, player.queue().size());
            player.next(); resolvedWork(player); assertEquals("101", player.current().id);
            player.next(); resolvedWork(player); assertEquals("102", player.current().id); assertEquals(0, player.resolutions.get()); assertEquals(0, player.downloads.get());
            player.previous(); resolvedWork(player); assertTrue(Arrays.asList("101", "102").contains(player.current().id));
        } finally { controller.destroy(); }
    }
    @Test public void unknownOrDuplicateDeletionIdsNeverDeleteUnselectedFilesOrStopPlayback() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); List<File> stored = seed(player, 2); player.playLocalListAt(player.localTracks(), 1); resolvedWork(player);
            android.media.MediaPlayer initial = decoder(player); long revision = player.libraryRevision();
            assertEquals(0, player.deleteLocalTracks(Arrays.asList(null, "../index.json", "unknown"))); assertTrue(player.playing()); assertSame(initial, decoder(player));
            assertEquals(revision, player.libraryRevision()); assertTrue(stored.get(0).exists()); assertTrue(stored.get(1).exists());
            assertEquals(1, player.deleteLocalTracks(Arrays.asList("100", "100", "unknown"))); assertTrue(player.playing()); assertEquals("101", player.current().id);
        } finally { controller.destroy(); }
    }
    @Test public void failedDeletionRollsBackLibraryAndKeepsAnUnselectedDecoderPlaying() throws Exception {
        ServiceController<OfflineService> controller = Robolectric.buildService(OfflineService.class).create();
        try {
            OfflineService player = controller.get(); List<File> stored = seed(player, 2); player.playLocalListAt(player.localTracks(), 1); resolvedWork(player);
            Field field = PlaybackService.class.getDeclaredField("library"); field.setAccessible(true);
            field.set(player, new LocalLibrary(player.getFilesDir(), () -> { throw new IOException("simulated index write failure"); }));
            android.media.MediaPlayer initial = decoder(player);
            assertEquals(-1, player.deleteLocalTracks(Collections.singleton("100"))); assertEquals(player.getString(R.string.library_unavailable), player.libraryError());
            assertTrue(player.playing()); assertSame(initial, decoder(player)); assertEquals(2, player.queue().size()); assertEquals(2, player.localTracks().size());
            assertTrue(stored.get(0).exists()); assertTrue(stored.get(1).exists());
        } finally { controller.destroy(); }
    }
    @Test public void applicationAndPlaybackServiceHaveIndependentHifiniIdentity() {
        assertEquals("com.ecojust.hifinitv", RuntimeEnvironment.getApplication().getPackageName());
        assertEquals("HIFINi TV", RuntimeEnvironment.getApplication().getString(R.string.app_name));
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        try { assertEquals("com.ecojust.hifinitv", controller.get().getPackageName()); assertTrue(controller.get().queue().isEmpty()); }
        finally { controller.destroy(); }
    }
    @Test public void shufflePreferencePersistsWhileTheActiveQueueIsSessionOnly() {
        ServiceController<PlaybackService> controller = Robolectric.buildService(PlaybackService.class).create();
        assertTrue(controller.get().shuffled()); controller.get().shuffle(false); controller.destroy();
        controller = Robolectric.buildService(PlaybackService.class).create();
        try { assertFalse(controller.get().shuffled()); assertTrue(controller.get().queue().isEmpty()); }
        finally { controller.destroy(); }
    }
}
