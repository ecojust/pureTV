package com.ecojust.webtv;

import android.content.Context;
import android.net.Uri;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="zh-rCN")
public class RepositoryTest {
    private Context context;
    private static final String BODY="#EXTM3U\n#EXTINF:-1 tvg-id=\"custom\",我的卫视\nhttps://example.com/live.m3u8\n";
    @Before public void clean(){context=RuntimeEnvironment.getApplication();for(String name:new String[]{"channels.snapshot","channels.snapshot.bak","channels.snapshot.new"})context.deleteFile(name);}
    private static class Connection extends HttpURLConnection{
        int status=200;byte[] body;String location;boolean disconnected;
        Connection(String text)throws Exception{super(new URL("https://example.com/channels.m3u"));body=text.getBytes(StandardCharsets.UTF_8);}
        public void connect(){}public boolean usingProxy(){return false;}public void disconnect(){disconnected=true;}
        public int getResponseCode(){return status;}public long getContentLengthLong(){return body.length;}
        public String getHeaderField(String key){return "Location".equals(key)?location:null;}public InputStream getInputStream(){return new ByteArrayInputStream(body);}
    }
    @Test public void successfulUrlImportSurvivesRestartAndInvalidImportKeepsSnapshot()throws Exception{
        Connection connection=new Connection(BODY);ChannelRepository repo=new ChannelRepository(context){@Override protected HttpURLConnection open(String address){return connection;}};
        ChannelRepository.Catalogue loaded=repo.refresh(new ChannelRepository.Source("url","https://example.com/list.m3u"),new ChannelRepository.Request());assertEquals("我的卫视",loaded.channels.get(0).name);assertTrue(connection.disconnected);
        connection.body="<html>error</html>".getBytes(StandardCharsets.UTF_8);
        try{repo.refresh(new ChannelRepository.Source("url","https://example.com/bad.m3u"),new ChannelRepository.Request());fail();}catch(IOException expected){}
        ChannelRepository.Catalogue restored=new ChannelRepository(context).initial(new ChannelRepository.Request());assertEquals("https://example.com/list.m3u",restored.source.address);assertEquals("custom",restored.channels.get(0).id);
    }
    @Test public void localImportCopiesMetadataInsteadOfDependingOnPersistentUriPermission()throws Exception{
        Uri uri=Uri.parse("content://documents/live.m3u");shadowOf(context.getContentResolver()).registerInputStream(uri,new ByteArrayInputStream(BODY.getBytes(StandardCharsets.UTF_8)));
        ChannelRepository repo=new ChannelRepository(context);assertEquals("file",repo.importFile(uri,new ChannelRepository.Request()).source.kind);
        assertEquals("我的卫视",new ChannelRepository(context).initial(new ChannelRepository.Request()).channels.get(0).name);
    }
    @Test public void cancelledRequestsDoNotReplacePreviousCatalogue()throws Exception{
        ChannelRepository repo=new ChannelRepository(context);repo.restore(new ChannelRepository.Request());ChannelRepository.Request cancelled=new ChannelRepository.Request();cancelled.cancel();
        try{repo.importFile(Uri.parse("content://docs/list"),cancelled);fail();}catch(IOException expected){}
        assertEquals("default",repo.initial(new ChannelRepository.Request()).source.kind);
    }
    @Test public void corruptedCacheFallsBackToBundledMetadata()throws Exception{
        try(FileOutputStream file=context.openFileOutput("channels.snapshot",0)){file.write(new byte[]{1,2,3,4});}
        ChannelRepository.Catalogue catalogue=new ChannelRepository(context).initial(new ChannelRepository.Request());assertEquals("default",catalogue.source.kind);assertTrue(catalogue.channels.size()>20);
    }
    @Test public void httpErrorsAndOversizeInputsDoNotCreateSnapshot()throws Exception{
        Connection connection=new Connection("error");connection.status=503;
        ChannelRepository repo=new ChannelRepository(context){@Override protected HttpURLConnection open(String address){return connection;}};
        try{repo.refresh(new ChannelRepository.Source("url","https://example.com/list"),new ChannelRepository.Request());fail();}catch(IOException expected){assertTrue(UiError.message(RuntimeEnvironment.getApplication(),expected).contains("503"));}
        connection.status=200;connection.body=new byte[Playlist.MAX_BYTES+1];
        try{repo.refresh(new ChannelRepository.Source("url","https://example.com/list"),new ChannelRepository.Request());fail();}catch(IOException expected){assertTrue(UiError.message(RuntimeEnvironment.getApplication(),expected).contains("512"));}
        assertFalse(new File(context.getFilesDir(),"channels.snapshot").exists());assertTrue(connection.disconnected);
    }
    @Test public void redirectsAreBoundedAndHttpsCannotDowngrade()throws Exception{
        Connection connection=new Connection("");connection.status=302;connection.location="http://example.com/other";AtomicInteger calls=new AtomicInteger();
        ChannelRepository repo=new ChannelRepository(context){@Override protected HttpURLConnection open(String address){calls.incrementAndGet();return connection;}};
        try{repo.refresh(new ChannelRepository.Source("url","https://example.com/list"),new ChannelRepository.Request());fail();}catch(IOException expected){assertTrue(UiError.message(RuntimeEnvironment.getApplication(),expected).contains("降级"));}assertEquals(1,calls.get());
        connection.location="https://example.com/loop";calls.set(0);
        try{repo.refresh(new ChannelRepository.Source("url","https://example.com/list"),new ChannelRepository.Request());fail();}catch(IOException expected){assertTrue(UiError.message(RuntimeEnvironment.getApplication(),expected).contains("重定向"));}assertEquals(4,calls.get());
    }
}
