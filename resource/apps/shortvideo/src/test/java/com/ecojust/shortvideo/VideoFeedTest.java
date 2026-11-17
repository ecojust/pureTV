package com.ecojust.shortvideo;

import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class VideoFeedTest {
    @Test public void parsesBothLiveResponseShapesWithoutInventingMetadata() throws Exception {
        VideoFeed.Clip a=VideoFeed.parse(VideoFeed.Source.KULEU,new JSONObject("{\"code\":200,\"msg\":\"Success\",\"mp4_video\":\"https://cdn.example.com/one.mp4?cache=1\"}"));
        VideoFeed.Clip b=VideoFeed.parse(VideoFeed.Source.DWO,new JSONObject("{\"code\":200,\"message\":\"Success\",\"data\":{\"video\":{\"url\":\"https://cdn.example.com/two.mp4\"}}}"));
        assertEquals(VideoFeed.Source.KULEU,a.source); assertEquals(VideoFeed.Source.DWO,b.source);
        assertEquals("https://cdn.example.com/two.mp4",b.url);
        assertEquals(a.key(),new VideoFeed.Clip("https://cdn.example.com/one.mp4?cache=2",a.source).key());
    }
    @Test public void rejectsErrorsAndMissingVideoInsteadOfTreatingHttp200AsSuccess() throws Exception {
        for(String body:new String[]{"{\"code\":500}","{\"code\":200}","{\"code\":200,\"data\":{\"video\":null}}"}) {
            try { VideoFeed.parse(VideoFeed.Source.DWO,new JSONObject(body)); fail(); } catch(IOException expected) { assertFalse(expected.getMessage().isEmpty()); }
        }
    }
    @Test public void rejectsUnsafeOrOversizedAddresses() throws Exception {
        for(String url:new String[]{"", "http://example.com/video.mp4", "file:///etc/file", "content://media/1", "javascript:alert(1)","https://user:secret@example.com/video.mp4","https://example.com/video.mp4#fragment","https://example.com/"+new String(new char[8192]).replace('\0','x')}) {
            try { VideoFeed.safeUrl(url); fail(url); } catch(IOException expected) { }
        }
        assertEquals("https://example.com/video.mp4",VideoFeed.safeUrl("https://example.com/video.mp4"));
    }
    private static class Connection extends HttpURLConnection {
        final int status; final byte[] bytes; String location; boolean disconnected;
        Connection(int status,String body) throws Exception { super(new URL("https://api.example.com/feed")); this.status=status; bytes=body.getBytes(StandardCharsets.UTF_8); }
        @Override public void connect() { }
        @Override public boolean usingProxy() { return false; }
        @Override public void disconnect() { disconnected=true; }
        @Override public int getResponseCode() { return status; }
        @Override public long getContentLengthLong() { return bytes.length; }
        @Override public String getHeaderField(String name) { return "Location".equals(name) ? location : null; }
        @Override public InputStream getInputStream() { return new ByteArrayInputStream(bytes); }
    }
    @Test public void httpErrorsDisconnectAndDoNotRetryInALoop() throws Exception {
        Connection connection=new Connection(429, "limited"); AtomicInteger calls=new AtomicInteger();
        VideoFeed feed=new VideoFeed(url->{calls.incrementAndGet();return connection;});
        try { feed.fetch(VideoFeed.Source.KULEU); fail(); } catch(VideoFeed.FeedException expected) { assertEquals(R.string.feed_rate_limited,expected.message); }
        assertTrue(connection.disconnected); assertEquals(1,calls.get());
    }
    @Test public void capsJsonBodyAndRejectsInvalidJson() throws Exception {
        for(String body:new String[]{new String(new char[65537]).replace('\0','x'),"<html>unavailable</html>"}) {
            Connection connection=new Connection(200,body); VideoFeed feed=new VideoFeed(url->connection);
            try { feed.fetch(VideoFeed.Source.KULEU); fail(); } catch(IOException expected) { assertFalse(expected.getMessage().isEmpty()); }
            assertTrue(connection.disconnected);
        }
    }
    @Test public void rejectsHttpsDowngradeAndBoundsRedirects() throws Exception {
        Connection downgrade=new Connection(302,""); downgrade.location="http://example.com/video";
        AtomicInteger count=new AtomicInteger(); VideoFeed feed=new VideoFeed(url->{count.incrementAndGet(); return downgrade;});
        try { feed.fetch(VideoFeed.Source.KULEU);fail(); } catch(VideoFeed.FeedException expected) { assertEquals(R.string.feed_unsafe_url,expected.message); }
        assertEquals(1,count.get());
        Connection loop=new Connection(302,""); loop.location="https://example.com/next"; count.set(0);
        feed=new VideoFeed(url->{count.incrementAndGet(); return loop;});
        try { feed.fetch(VideoFeed.Source.KULEU);fail(); } catch(VideoFeed.FeedException expected) { assertEquals(R.string.feed_too_many_redirects,expected.message); }
        assertEquals(4,count.get()); assertTrue(loop.disconnected);
    }
}
