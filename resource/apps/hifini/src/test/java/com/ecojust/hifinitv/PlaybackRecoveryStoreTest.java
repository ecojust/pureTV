package com.ecojust.hifinitv;

import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class PlaybackRecoveryStoreTest {
    private File root, checkpoint, audio;
    @Before public void setup() throws Exception {
        root = Files.createTempDirectory("hifini-playback-recovery-test").toFile();
        checkpoint = new File(root, PlaybackRecoveryStore.FILE_NAME);
        File library = new File(root, "hifini-library"); assertTrue(library.mkdirs());
        audio = new File(library, "already-downloaded.audio"); Files.write(audio.toPath(), new byte[]{1,2,3});
    }
    @After public void cleanup() throws Exception {
        PlaybackRecoveryStore.awaitWritesForTest();
        PlaybackRecoveryStore.resetMemoryForTest(root);
        try (java.util.stream.Stream<java.nio.file.Path> files = Files.walk(root.toPath())) {
            files.sorted(java.util.Comparator.reverseOrder()).forEach(path -> path.toFile().delete());
        }
    }
    private static Track song(int number) {
        return Track.catalog("netease", String.valueOf(100 + number), "", "Song " + number, "Artist", "https://covers.example.invalid/" + number + ".jpg", 180);
    }
    private JSONObject document() throws Exception { return new JSONObject(new String(Files.readAllBytes(checkpoint.toPath()), StandardCharsets.UTF_8)); }
    private void document(JSONObject document) throws Exception { Files.write(checkpoint.toPath(), document.toString().getBytes(StandardCharsets.UTF_8)); }
    private void assertAudioUntouched() throws Exception { assertArrayEquals(new byte[]{1,2,3}, Files.readAllBytes(audio.toPath())); }

    @Test public void queueAndRetrySelectionSurviveASeparateStoreWithoutMediaLinks() throws Exception {
        Track forum = new Track("6544", "Forum song", "Singer", "https://covers.example.invalid/forum.jpg", 200);
        new PlaybackRecoveryStore(root).write(Arrays.asList(song(0), forum), 1, false, true, true);
        PlaybackRecoveryStore.State state = new PlaybackRecoveryStore(root).read();
        assertEquals(2, state.queue.size()); assertEquals(1, state.index); assertTrue(state.interrupted); assertTrue(state.shuffled); assertFalse(state.localOnly);
        assertEquals(forum.id, state.queue.get(state.index).id); assertEquals(forum.title, state.queue.get(state.index).title);
        assertEquals(song(0).sourceId, state.queue.get(0).sourceId);
        String stored = new String(Files.readAllBytes(checkpoint.toPath()), StandardCharsets.UTF_8);
        assertFalse(stored.contains("audioUrl")); assertFalse(stored.contains("musicparse-play")); assertFalse(stored.contains("Cookie"));
        assertAudioUntouched();
    }
    @Test public void nonCurrentBadMetadataNeverMovesSelectionToADifferentSong() throws Exception {
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root);
        store.write(Arrays.asList(song(0), song(1)), 1, false, false, true);
        JSONObject document = document(); document.getJSONArray("queue").getJSONObject(0).put("sourceId", "invalid"); document(document);
        PlaybackRecoveryStore.State state = store.read();
        assertEquals(1, state.queue.size()); assertEquals(0, state.index); assertEquals(song(1).id, state.queue.get(state.index).id);
        document.put("currentId", "netease:999999"); document(document);
        assertEquals(-1, store.read().index); assertTrue(store.read().queue.isEmpty()); assertAudioUntouched();
    }
    @Test public void failedAtomicCommitKeepsPreviousSelectionAndCleansTemporaryFile() throws Exception {
        AtomicBoolean reject = new AtomicBoolean();
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root, () -> { if (reject.get()) throw new IOException("fixture disk failure"); });
        store.write(List.of(song(0)), 0, true, false, false); byte[] before = Files.readAllBytes(checkpoint.toPath());
        reject.set(true);
        try { store.write(List.of(song(1)), 0, false, true, true); fail("Expected failed checkpoint"); } catch (IOException expected) { }
        assertArrayEquals(before, Files.readAllBytes(checkpoint.toPath()));
        assertEquals(song(0).id, new PlaybackRecoveryStore(root).read().queue.get(0).id);
        assertEquals(0, Arrays.stream(root.listFiles()).filter(file -> file.getName().startsWith(".playback-recovery-")).count());
        assertAudioUntouched();
    }
    @Test public void corruptOversizedOrUnsupportedDocumentsReturnEmptyWithoutErasingAudio() throws Exception {
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root);
        assertTrue(store.read().queue.isEmpty());
        for (String value : new String[]{"not json", "{}", "{\"version\":2}", "{\"version\":1} trailing"}) {
            Files.write(checkpoint.toPath(), value.getBytes(StandardCharsets.UTF_8)); assertTrue(store.read().queue.isEmpty()); assertTrue(checkpoint.exists()); assertAudioUntouched();
        }
        Files.write(checkpoint.toPath(), new byte[PlaybackRecoveryStore.MAX_BYTES + 1]); assertTrue(store.read().queue.isEmpty()); assertAudioUntouched();
        store.write(List.of(song(0)), 0, false, false, true);
        JSONObject wrongFlag = document(); wrongFlag.put("interrupted", "true"); document(wrongFlag);
        assertTrue(store.read().queue.isEmpty()); assertAudioUntouched();
    }
    @Test public void oversizedOrDuplicateQueuesCannotReplaceAValidCheckpoint() throws Exception {
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root); store.write(List.of(song(0)), 0, false, false, true);
        byte[] before = Files.readAllBytes(checkpoint.toPath());
        List<Track> tooMany = new ArrayList<>(); for (int i = 0; i < 51; i++) tooMany.add(song(i));
        for (List<Track> invalid : List.of(tooMany, List.of(song(0), song(0)))) {
            try { store.write(invalid, 0, false, false, true); fail("Expected rejected queue"); } catch (IOException expected) { }
            assertArrayEquals(before, Files.readAllBytes(checkpoint.toPath()));
        }
        JSONObject oversized = document(); JSONArray rows = new JSONArray(); for (int i = 0; i < 51; i++) rows.put(oversized.getJSONArray("queue").getJSONObject(0));
        oversized.put("queue", rows); document(oversized); assertTrue(store.read().queue.isEmpty()); assertAudioUntouched();
    }
    @Test public void clearingCheckpointOnlyRemovesRecoveryState() throws Exception {
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root); store.write(List.of(song(0)), 0, true, false, false);
        store.clear(); assertFalse(checkpoint.exists()); assertTrue(store.read().queue.isEmpty()); assertAudioUntouched();
        store.clear(); assertAudioUntouched();
    }
    @Test public void blockedDiskNeverBlocksQueueingAndNewServiceSeesCoalescedLatestState() throws Exception {
        CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        AtomicInteger commits = new AtomicInteger();
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root, () -> {
            if (commits.incrementAndGet() == 1) {
                entered.countDown();
                try { if (!release.await(5, TimeUnit.SECONDS)) throw new IOException("Test commit stayed blocked"); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IOException(error); }
            }
        });
        ExecutorService caller = Executors.newSingleThreadExecutor();
        try {
            caller.submit(() -> store.writeAsync(List.of(song(0)), 0, false, false, true, null)).get(500, TimeUnit.MILLISECONDS);
            assertTrue(entered.await(2, TimeUnit.SECONDS));
            List<Track> queue = new ArrayList<>(List.of(song(2)));
            caller.submit(() -> {
                store.writeAsync(List.of(song(1)), 0, false, false, true, null);
                store.writeAsync(queue, 0, true, true, false, null);
                return new PlaybackRecoveryStore(root).readLatest();
            }).get(500, TimeUnit.MILLISECONDS);
            queue.clear(); // The caller cannot mutate the queued snapshot.
            PlaybackRecoveryStore.State state = new PlaybackRecoveryStore(root).readLatest();
            assertEquals(song(2).id, state.queue.get(0).id); assertTrue(state.localOnly); assertTrue(state.shuffled); assertFalse(state.interrupted);
            try { state.queue.clear(); fail("Expected immutable state"); } catch (UnsupportedOperationException expected) { }
        } finally {
            release.countDown(); caller.shutdownNow(); PlaybackRecoveryStore.awaitWritesForTest();
        }
        assertEquals(2, commits.get());
        PlaybackRecoveryStore.resetMemoryForTest(root);
        assertEquals(song(2).id, new PlaybackRecoveryStore(root).readLatest().queue.get(0).id);
        assertAudioUntouched();
    }
    @Test public void asyncFailureKeepsOldDiskAndLatestMemoryAndReportsOnWriter() throws Exception {
        new PlaybackRecoveryStore(root).write(List.of(song(0)), 0, true, false, false);
        byte[] before = Files.readAllBytes(checkpoint.toPath());
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root, () -> { throw new IOException("fixture disk failure"); });
        AtomicReference<IOException> failure = new AtomicReference<>();
        AtomicReference<Thread> callbackThread = new AtomicReference<>();
        store.writeAsync(List.of(song(1)), 0, false, true, true, error -> { failure.set(error); callbackThread.set(Thread.currentThread()); });
        PlaybackRecoveryStore.awaitWritesForTest();
        assertNotNull(failure.get()); assertNotSame(Thread.currentThread(), callbackThread.get());
        assertArrayEquals(before, Files.readAllBytes(checkpoint.toPath()));
        assertEquals(song(1).id, new PlaybackRecoveryStore(root).readLatest().queue.get(0).id);
        PlaybackRecoveryStore.resetMemoryForTest(root);
        assertEquals(song(0).id, new PlaybackRecoveryStore(root).readLatest().queue.get(0).id);
        assertAudioUntouched();
    }
    @Test public void queuedEmptyStateClearsOnlyCheckpointAndRemainsEmptyInMemory() throws Exception {
        PlaybackRecoveryStore store = new PlaybackRecoveryStore(root);
        store.writeAsync(List.of(song(0)), 0, true, false, false, null);
        PlaybackRecoveryStore.awaitWritesForTest(); assertTrue(checkpoint.exists());
        store.writeAsync(List.of(), -1, false, false, false, null);
        assertTrue(new PlaybackRecoveryStore(root).readLatest().queue.isEmpty());
        PlaybackRecoveryStore.awaitWritesForTest();
        assertFalse(checkpoint.exists()); assertAudioUntouched();
    }
}
