package com.ecojust.operatv;

import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Rect;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.Config;
import org.robolectric.annotation.GraphicsMode;
import org.robolectric.annotation.LooperMode;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

/** Offline lifecycle and UI tests. Fake player progress is not evidence of decoded media. */
@RunWith(RobolectricTestRunner.class)
@Config(sdk = 28, qualifiers = "zh-rCN-w960dp-h540dp-land-mdpi")
@LooperMode(LooperMode.Mode.PAUSED)
public class PlaybackActivityTest {
    private static FakeCatalog catalog;
    private static List<FakePlayer> players;
    private static boolean prepareAutomatically;
    private ActivityController<TestActivity> controller;
    private boolean paused;
    private OperaItem item;

    private static class FakeCatalog extends CctvCatalog {
        volatile boolean fail;
        volatile CountDownLatch gate;
        final CountDownLatch entered = new CountDownLatch(1);
        @Override public PlaybackSource resolve(OperaItem item) throws IOException {
            entered.countDown();
            if (gate != null) {
                boolean done = false;
                for (int i = 0; i < 3 && !done; i++) {
                    try { done = gate.await(2, TimeUnit.SECONDS); }
                    catch (InterruptedException ignored) { /* Simulate a transport completing after cancellation. */ }
                }
            }
            if (fail) throw new IOException("Fixture unavailable");
            return new PlaybackSource(item.uri, Collections.emptyMap());
        }
    }

    private static class FakePlayer implements PlaybackActivity.Player {
        final PlaybackActivity.Events events;
        boolean playing, released;
        int at, duration = 40000;
        FakePlayer(PlaybackActivity.Events events) { this.events = events; players.add(this); }
        @Override public void prepare(CctvCatalog.PlaybackSource source) { if (prepareAutomatically) events.prepared(); }
        @Override public void play() { playing = true; }
        @Override public void pause() { playing = false; }
        @Override public void seek(int position) { at = position; events.seeked(); }
        @Override public int position() { return at; }
        @Override public int duration() { return duration; }
        @Override public boolean playing() { return playing; }
        @Override public void release() { playing = false; released = true; }
        void complete() { at = duration; playing = false; events.completed(); }
    }

    public static class TestActivity extends PlaybackActivity {
        @Override protected CctvCatalog createCatalog() { return catalog; }
        @Override protected Player createPlayer(SurfaceView view, Events events) { return new FakePlayer(events); }
        @Override protected boolean surfaceReady() { return true; }
    }

    @Before public void before() {
        catalog = new FakeCatalog();
        players = Collections.synchronizedList(new ArrayList<>());
        prepareAutomatically = true;
        item = OperaItem.direct("播放控件测试片 · 离线界面数据", "https://media.example.invalid/opera.mp4", "我的片单");
        RuntimeEnvironment.getApplication().getSharedPreferences(OperaStore.PREFERENCES, Context.MODE_PRIVATE)
                .edit().clear().commit();
    }

    @After public void after() {
        if (catalog.gate != null) catalog.gate.countDown();
        if (controller != null) {
            if (!paused) controller.pause();
            controller.stop().destroy();
            controller = null;
        }
    }

    private void open() { open(item.toJson().toString()); }
    private void open(String payload) {
        Intent intent = new Intent(RuntimeEnvironment.getApplication(), TestActivity.class);
        if (payload != null) intent.putExtra("item", payload);
        controller = Robolectric.buildActivity(TestActivity.class, intent).create().start().resume().visible().windowFocusChanged(true);
        paused = false;
    }
    private void pump() { shadowOf(Looper.getMainLooper()).idle(); }
    private void tick() { shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(500)); }
    private void awaitPlayers(int expected) throws Exception {
        for (int i = 0; i < 100 && players.size() < expected; i++) { Thread.sleep(10); pump(); }
        pump();
        assertEquals(expected, players.size());
    }
    private void awaitFailure() throws Exception {
        for (int i = 0; i < 100 && !find("player-retry").isShown(); i++) { Thread.sleep(10); pump(); }
        assertTrue(find("player-retry").isShown());
    }
    private View find(String description) { return find(root(), description); }
    private View find(View view, String description) {
        if (description.contentEquals(view.getContentDescription() == null ? "" : view.getContentDescription())) return view;
        if (view instanceof ViewGroup) {
            for (int i = 0; i < ((ViewGroup) view).getChildCount(); i++) {
                View match = find(((ViewGroup) view).getChildAt(i), description);
                if (match != null) return match;
            }
        }
        return null;
    }
    private ViewGroup root() { return (ViewGroup) ((ViewGroup) controller.get().findViewById(android.R.id.content)).getChildAt(0); }
    private OperaStore store() { return new OperaStore(controller.get()); }
    private void pause() { controller.pause(); paused = true; }
    private void resume() { controller.resume(); paused = false; }
    private void press(int key) {
        controller.get().dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, key));
        controller.get().dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, key));
    }

    @Test public void missingItemShowsAnActionableErrorWithoutNetworkOrDecoder() {
        open(null);
        assertTrue(players.isEmpty());
        assertEquals(1, catalog.entered.getCount());
        assertFalse(find("player-toggle").isEnabled());
        assertFalse(find("player-retry").isShown());
        assertTrue(find("player-back").isShown());
        assertTrue(store().history().isEmpty());
    }

    @Test public void lookupFailureCanRetryWithoutCreatingFalseHistory() throws Exception {
        catalog.fail = true;
        open();
        awaitFailure();
        assertTrue(players.isEmpty());
        assertTrue(store().history().isEmpty());
        catalog.fail = false;
        find("player-retry").performClick();
        awaitPlayers(1);
        assertTrue(players.get(0).playing);
        assertFalse(find("player-retry").isShown());
        assertTrue(store().history().isEmpty());
    }

    @Test public void lateResolverResponseCannotStartAfterActivityPauses() throws Exception {
        catalog.gate = new CountDownLatch(1);
        open();
        assertTrue(catalog.entered.await(1, TimeUnit.SECONDS));
        pause();
        catalog.gate.countDown();
        Thread.sleep(50);
        pump();
        assertTrue(players.isEmpty());
        assertTrue(store().history().isEmpty());
    }

    @Test public void actualObservedClockAdvanceControlsHistoryAndResume() throws Exception {
        open(); awaitPlayers(1);
        FakePlayer first = players.get(0);
        first.at = 1000; tick();
        first.at = 12000; tick();
        pause();
        assertTrue(first.released);
        assertEquals(12000, store().position(item.id));
        assertEquals(item.id, store().history().get(0).id);
        resume(); awaitPlayers(2);
        assertEquals(12000, players.get(1).at);
        assertTrue(players.get(1).playing);
    }

    @Test public void preparedOrSeekedWithoutClockAdvancementDoesNotCreateHistory() throws Exception {
        open(); awaitPlayers(1);
        press(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD);
        assertEquals(10000, players.get(0).at);
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(12));
        pause();
        assertTrue(store().history().isEmpty());
        assertEquals(0, store().position(item.id));
    }

    @Test public void prepareTimeoutReleasesDecoderAndOffersRetry() throws Exception {
        prepareAutomatically = false;
        open(); awaitPlayers(1);
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(31));
        assertTrue(players.get(0).released);
        assertTrue(find("player-retry").isShown());
        assertFalse(find("player-toggle").isEnabled());
        assertTrue(store().history().isEmpty());
    }

    @Test public void oldDecoderCallbacksCannotAffectRetriedPlayback() throws Exception {
        open(); awaitPlayers(1);
        FakePlayer first = players.get(0);
        first.events.error();
        assertTrue(first.released);
        find("player-retry").performClick();
        awaitPlayers(2);
        first.events.prepared(); first.events.completed(); first.events.error();
        assertTrue(players.get(1).playing);
        assertFalse(players.get(1).released);
        assertFalse(find("player-retry").isShown());
        assertTrue(store().history().isEmpty());
    }

    @Test public void completionClearsResumeAndReplayStartsAtTheBeginning() throws Exception {
        open(); awaitPlayers(1);
        FakePlayer player = players.get(0);
        player.at = 1000; tick();
        player.at = 14000; tick();
        player.complete();
        assertEquals(0, store().position(item.id));
        assertEquals(1, store().history().size());
        find("player-toggle").performClick();
        assertEquals(0, player.at);
        assertTrue(player.playing);
    }

    @Test public void remotePauseSeekAndResumeReflectThePlayerState() throws Exception {
        open(); awaitPlayers(1);
        FakePlayer player = players.get(0);
        press(KeyEvent.KEYCODE_MEDIA_PAUSE);
        assertFalse(player.playing);
        press(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD);
        assertEquals(10000, player.at);
        assertFalse(player.playing);
        assertTrue(((TextView) find("player-position")).getText().toString().startsWith("00:10"));
        press(KeyEvent.KEYCODE_MEDIA_PLAY);
        assertTrue(player.playing);
        press(KeyEvent.KEYCODE_MEDIA_REWIND);
        assertEquals(0, player.at);
        assertTrue(player.playing);
    }

    @Test @Config(sdk = 19) public void minimumAndroidCanCreateAndReleasePlayerShell() throws Exception {
        open(); awaitPlayers(1);
        assertFalse(controller.get().isFinishing());
        pause();
        assertTrue(players.get(0).released);
    }

    private void checkBounds(View view, ViewGroup root) {
        if (view instanceof Button && view.isShown()) {
            Rect box = new Rect(); view.getDrawingRect(box); root.offsetDescendantRectToMyCoords(view, box);
            assertTrue("Visible control is inside the window: " + ((Button) view).getText(),
                    box.left >= 0 && box.top >= 0 && box.right <= root.getWidth() && box.bottom <= root.getHeight());
        }
        if (view instanceof ViewGroup) for (int i = 0; i < ((ViewGroup) view).getChildCount(); i++) checkBounds(((ViewGroup) view).getChildAt(i), root);
    }

    private void render(int width, int height, String name) throws Exception {
        ViewGroup root = root();
        root.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
        root.layout(0, 0, width, height);
        pump();
        checkBounds(root, root);
        String folder = System.getenv("OPERA_UI_CAPTURE_DIR");
        if (folder != null && !folder.isEmpty()) {
            File target = new File(folder, name); target.getParentFile().mkdirs();
            Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            root.draw(new Canvas(bitmap));
            try (FileOutputStream output = new FileOutputStream(target)) { bitmap.compress(Bitmap.CompressFormat.PNG, 100, output); }
            bitmap.recycle();
        }
    }

    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE)
    public void controlsRemainFocusableAfterAutoHideAndFitBothTvSizes() throws Exception {
        open(); awaitPlayers(1);
        render(960, 540, "opera-player-controls.png");
        ViewGroup root = root();
        assertNotNull(root.findFocus());
        assertTrue(root.findFocus().isShown());
        View next = root.findFocus().focusSearch(View.FOCUS_DOWN);
        assertNotNull(next); assertTrue(next.requestFocus());
        controller.windowFocusChanged(false).windowFocusChanged(true);
        assertSame(next, root.findFocus());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(7));
        press(KeyEvent.KEYCODE_DPAD_UP);
        assertNotNull(root.findFocus());
        assertTrue(root.findFocus().isShown());
        render(1280, 720, "opera-player-controls-1280.png");
    }

    @Test @Config(sdk = 28, qualifiers = "en-rUS-w640dp-h360dp-land-mdpi")
    @GraphicsMode(GraphicsMode.Mode.NATIVE)
    public void englishErrorControlsFitCompactScreen() throws Exception {
        catalog.fail = true;
        open(); awaitFailure();
        render(640, 360, "opera-player-error.en.png");
        assertTrue(find("player-retry").hasFocus());
        assertTrue(((TextView) find("player-status")).getText().toString().contains("failed"));
    }
}
