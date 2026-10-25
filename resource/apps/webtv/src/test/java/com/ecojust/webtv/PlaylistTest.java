package com.ecojust.webtv;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="zh-rCN")
public class PlaylistTest {
    private List<Playlist.Channel> parse(String text) throws Exception{return Playlist.parse(text.getBytes(StandardCharsets.UTF_8),false);}
    @Test public void quotedCommasBomAndAlternateRoutesAreParsed() throws Exception{
        String body="\uFEFF#EXTM3U\n#EXTINF:-1 tvg-id=\"demo@HD\" group-title=\"卫视,综合\",测试卫视,高清\nhttps://example.com/one.m3u8\n#EXTINF:-1 tvg-id='demo@SD',测试卫视\nhttps://example.com/two.m3u8\n#EXTINF:-1 tvg-id=demo,测试卫视\nhttps://example.com/one.m3u8\n";
        List<Playlist.Channel> channels=parse(body);assertEquals(1,channels.size());assertEquals("测试卫视,高清",channels.get(0).name);assertEquals(Playlist.SATELLITE,channels.get(0).group);assertEquals(2,channels.get(0).urls.size());
    }
    @Test public void customGroupsRemainVisibleAndCctvIsRecognized() throws Exception{
        List<Playlist.Channel> channels=parse("#EXTM3U\n#EXTINF:-1,CCTV-13\nhttps://example.com/news.m3u8\n#EXTINF:-1 group-title=\"自定义\",自定义频道\nhttp://192.168.1.2/live.m3u8\n");
        assertEquals(Playlist.CCTV,channels.get(0).group);assertEquals(Playlist.OTHER,channels.get(1).group);assertTrue(channels.get(1).urls.get(0).startsWith("http:"));
    }
    @Test public void channelAndRouteLimitsAreEnforced() throws Exception{
        StringBuilder body=new StringBuilder("#EXTM3U\n");
        for(int i=0;i<310;i++)body.append("#EXTINF:-1 tvg-id=\"").append(i).append("\",频道").append(i).append("\nhttps://example.com/").append(i).append(".m3u8\n");
        for(int i=0;i<8;i++)body.append("#EXTINF:-1 tvg-id=\"0\",频道0\nhttps://example.com/extra").append(i).append(".m3u8\n");
        List<Playlist.Channel> channels=parse(body.toString());assertEquals(300,channels.size());assertEquals(4,channels.get(0).urls.size());
    }
    @Test public void rejectsHlsMediaListsAndListsWithoutPlayableChannels() throws Exception{
        for(String body:new String[]{"#EXTM3U\n#EXT-X-TARGETDURATION:6\n#EXTINF:6,\n1.ts", "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=123\nstream.m3u8", "<html>unavailable</html>", "#EXTM3U\n#EXTINF:-1,频道\nudp://239.1.1.1:1234"}){
            try{parse(body);fail(body);}catch(IOException expected){assertFalse(UiError.message(RuntimeEnvironment.getApplication(),expected).isEmpty());}
        }
    }
    @Test public void limitsStreamInputAndClosesIt() throws Exception{
        final boolean[] closed={false};InputStream input=new ByteArrayInputStream(new byte[Playlist.MAX_BYTES+1]){@Override public void close(){closed[0]=true;}};
        try{Playlist.read(input);fail();}catch(IOException expected){assertTrue(UiError.message(RuntimeEnvironment.getApplication(),expected).contains("512"));}assertTrue(closed[0]);
    }
    @Test public void rejectsUnsupportedSchemesCredentialsAndMalformedAddresses() throws Exception{
        for(String url:new String[]{"file:///x","content://media/1","udp://239.1.1.1:1234","https://user:secret@example.com/live","javascript:alert(1)","https://example.com/live|User-Agent=x","https://example.com/live#fragment"}){
            try{Playlist.safeUrl(url);fail(url);}catch(IOException expected){}
        }
        assertEquals("http://[::1]:8080/live.m3u8",Playlist.safeUrl("http://[::1]:8080/live.m3u8"));
    }
    @Test public void bundledCatalogueIsBoundedAndLocalizedWithoutAccountParameters() throws Exception{
        byte[] raw=Playlist.read(RuntimeEnvironment.getApplication().getResources().openRawResource(R.raw.starter));List<Playlist.Channel> channels=Playlist.parse(raw,true);
        assertTrue(channels.size()>=20);assertTrue(raw.length<16*1024);assertEquals("广东卫视",channels.get(0).name);
        assertTrue(channels.stream().anyMatch(c->c.group.equals(Playlist.CCTV)));
        for(Playlist.Channel channel:channels)for(String url:channel.urls)assertFalse(url.toLowerCase(Locale.ROOT).contains("accountinfo="));
    }
}
