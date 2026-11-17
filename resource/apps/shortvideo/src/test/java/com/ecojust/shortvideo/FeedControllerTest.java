package com.ecojust.shortvideo;

import android.os.Looper;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.io.IOException;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class FeedControllerTest {
    private FeedController controller;
    private final List<VideoFeed.Clip> clips=new ArrayList<>();
    private final List<Integer> errors=new ArrayList<>();
    private final List<Object[]> errorArguments=new ArrayList<>();
    private final AtomicInteger calls=new AtomicInteger();
    private final FeedController.Events events=new FeedController.Events() {
        public void loading() { }
        public void clip(VideoFeed.Clip clip) { clips.add(clip); }
        public void error(int message,Object... arguments) { errors.add(message);errorArguments.add(arguments); }
    };
    private FeedController.Loader unique() { return new FeedController.Loader() {
        public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException { return new VideoFeed.Clip("https://example.com/"+calls.incrementAndGet()+".mp4",source); }
        public void cancel() { }
    }; }
    private void create(FeedController.Loader loader) { controller=new FeedController(loader,events,VideoFeed.Source.KULEU);controller.activate(); }
    private void flush() throws Exception {
        shadowOf(Looper.getMainLooper()).idle();
        java.lang.reflect.Field field=FeedController.class.getDeclaredField("pending"); field.setAccessible(true);
        Future<?> pending=(Future<?>)field.get(controller); if(pending!=null&&!pending.isCancelled()) pending.get(2,TimeUnit.SECONDS);
        shadowOf(Looper.getMainLooper()).idle();
    }
    private void nextReady() throws Exception { controller.next(); shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1500));flush(); }
    @After public void close() { if(controller!=null)controller.close(); }
    @Test public void historyBoundAndBackForwardReuseWithoutNetwork() throws Exception {
        create(unique());controller.start();flush();
        for(int i=1;i<15;i++)nextReady();
        assertEquals(10,controller.size()); assertEquals(9,controller.index()); assertEquals(15,calls.get());
        controller.previous();assertTrue(controller.current().url.endsWith("14.mp4"));controller.next();
        assertTrue(controller.current().url.endsWith("15.mp4"));assertEquals(15,calls.get());
    }
    @Test public void requestsAreSpacedAndSourceSwitchClearsOldSession() throws Exception {
        create(unique());controller.start();flush();controller.next();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1000));
        assertEquals(1,calls.get());shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(500));flush();assertEquals(2,calls.get());
        controller.select(VideoFeed.Source.DWO);shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1500));flush();
        assertEquals(1,controller.size());assertEquals(VideoFeed.Source.DWO,controller.current().source);assertFalse(controller.hasPrevious());
    }
    @Test public void duplicateRetriesOnlyOnceAndThenStops() throws Exception {
        create(new FeedController.Loader() {
            public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException { calls.incrementAndGet(); return new VideoFeed.Clip("https://example.com/one.mp4",source); }
            public void cancel() { }
        });
        controller.start();flush();nextReady();shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(1500));flush();
        assertEquals(3,calls.get());assertEquals(Collections.singletonList(R.string.feed_repeated),errors);assertFalse(controller.loading());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMinutes(3));assertEquals(3,calls.get());assertEquals(1,controller.size());
    }
    @Test public void networkErrorNeedsExplicitRetry() throws Exception {
        create(new FeedController.Loader() {
            public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException { calls.incrementAndGet();throw new IOException("offline"); }
            public void cancel() { }
        });
        controller.start();flush();assertEquals(Collections.singletonList(R.string.network_error),errors);assertFalse(controller.loading());
        shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMinutes(3));assertEquals(1,calls.get());
        controller.fresh();flush();assertEquals(2,calls.get());
    }
    @Test public void sourceErrorKeepsResourceAndFormattingArgumentsForTheUiLocale() throws Exception {
        create(new FeedController.Loader() {
            public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException { throw new VideoFeed.FeedException(R.string.feed_http_error,503); }
            public void cancel() { }
        });
        controller.start();flush();
        assertEquals(Collections.singletonList(R.string.feed_http_error),errors);
        assertArrayEquals(new Object[]{503},errorArguments.get(0));
    }
    @Test public void suspendDiscardsLateResponseAndClosePreventsFurtherRequests() throws Exception {
        CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1),returned=new CountDownLatch(1);
        create(new FeedController.Loader() {
            public VideoFeed.Clip fetch(VideoFeed.Source source) throws IOException {
                calls.incrementAndGet();entered.countDown();
                try { release.await(2,TimeUnit.SECONDS); } catch(InterruptedException ignored) { }
                finally { returned.countDown(); }
                return new VideoFeed.Clip("https://example.com/late.mp4",source);
            }
            public void cancel() { }
        });
        controller.start();shadowOf(Looper.getMainLooper()).idle();assertTrue(entered.await(1,TimeUnit.SECONDS));
        controller.suspend();release.countDown();assertTrue(returned.await(1,TimeUnit.SECONDS));shadowOf(Looper.getMainLooper()).idle();
        assertTrue(clips.isEmpty());assertNull(controller.current());assertFalse(controller.loading());controller.close();controller.activate();controller.next();flush();assertEquals(1,calls.get());
    }
}
