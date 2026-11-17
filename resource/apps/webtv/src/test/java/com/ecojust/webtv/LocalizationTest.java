package com.ecojust.webtv;

import android.content.Context;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,qualifiers="en-rUS")
public class LocalizationTest {
    @Test public void builtInNamesUseEnglishWithoutChangingIdsCategoriesOrCustomNames()throws Exception{
        Context context=RuntimeEnvironment.getApplication();
        List<Playlist.Channel> channels=Playlist.parse(Playlist.read(context.getResources().openRawResource(R.raw.starter)),true);
        Playlist.Channel first=channels.get(0);
        assertEquals("GuangdongSatelliteTV.cn",first.id);assertEquals(Playlist.SATELLITE,first.group);
        assertEquals("Guangdong TV",ChannelLabels.name(context,first,true));
        for(Playlist.Channel channel:channels)assertFalse(ChannelLabels.name(context,channel,true).matches(".*[\\p{IsHan}].*"));
        Playlist.Channel custom=new Playlist.Channel(first.id,"我的自定义名称",first.group,first.urls);
        assertEquals("我的自定义名称",ChannelLabels.name(context,custom,false));
        assertEquals("Built-in channels",new ChannelRepository.Source("default","").label(context));
        assertEquals("Online playlist",new ChannelRepository.Source("url","").label(context));
        assertEquals("Local playlist",new ChannelRepository.Source("file","").label(context));
    }
    @Test public void parserAndRepositoryErrorsAreRenderedInEnglish()throws Exception{
        Context context=RuntimeEnvironment.getApplication();
        try{Playlist.parse("#EXTM3U\n#EXT-X-TARGETDURATION:6\n".getBytes(StandardCharsets.UTF_8),false);fail();}
        catch(IOException error){assertEquals("Choose an M3U channel list, not an individual HLS media playlist",UiError.message(context,error));}
        try{Playlist.safeUrl("file:///playlist.m3u");fail();}
        catch(IOException error){assertEquals("Use an HTTP(S) URL without embedded login credentials",UiError.message(context,error));}
        assertEquals("Playlist request failed (HTTP 503)",UiError.message(context,new UiError(R.string.list_http_error,503)));
        assertEquals("Playlist loading timed out",UiError.message(context,new java.net.SocketTimeoutException()));
        assertEquals("Unable to read the playlist",UiError.message(context,new IOException()));
    }
    @Test @Config(qualifiers="zh-rCN")public void chineseBuiltInNamesAndErrorsRemainChinese()throws Exception{
        Context context=RuntimeEnvironment.getApplication();
        Playlist.Channel first=Playlist.parse(Playlist.read(context.getResources().openRawResource(R.raw.starter)),true).get(0);
        assertEquals("广东卫视",ChannelLabels.name(context,first,true));
        assertEquals("默认频道",new ChannelRepository.Source("default","").label(context));
        assertEquals("频道列表超过 512 KiB 上限",UiError.message(context,new UiError(R.string.list_size_limit)));
    }
}
