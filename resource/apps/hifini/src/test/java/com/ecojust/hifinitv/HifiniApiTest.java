package com.ecojust.hifinitv;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28)
public class HifiniApiTest {
    private String fixture(String file) throws IOException {
        try (java.io.InputStream input = getClass().getResourceAsStream("/hifini/" + file)) {
            assertNotNull(input); return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
    private Track track() { return new Track("101", "Search title", "", "", 0); }
    @Test public void forumSearchUsesConfirmedUnderscoreRouteAndStableThreadIds() throws Exception {
        List<String> requests = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, referer, limit) -> { requests.add(url); return fixture("search.html"); });
        List<Track> tracks = api.forumSearch("夜 & 海");
        assertEquals("https://www.hifini.net/search-_E5_A4_9C_20_26_20_E6_B5_B7-1.htm", requests.get(0));
        assertEquals(2, tracks.size()); assertEquals("101", tracks.get(0).id);
        assertEquals("夜行星", tracks.get(0).title); assertEquals("林间来客", tracks.get(0).artist);
        assertEquals("", tracks.get(0).cover); // Forum avatars are not album artwork.
        assertEquals("https://www.hifini.net/thread-101.htm", tracks.get(0).pageUrl());
        assertEquals("https://www.hifini.net/search-_E5_8B_87_E6_B0_94-1.htm", HifiniApi.buildForumSearchUrl("勇气"));
        assertEquals("https://www.hifini.net/search-A_5Fb_2Dc-1.htm", HifiniApi.buildForumSearchUrl("A_b-c"));
    }
    @Test public void catalogSearchReadsRealPrintStructureWithoutDroppingUnlinkedSongs() throws Exception {
        List<String> requests = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, ref, max) -> { requests.add(url); return fixture("musicparse-search.html"); });
        List<Track> tracks = api.search("勇气");
        assertEquals(List.of("https://www.hifini.net/musicparse-search.htm?keyword=%E5%8B%87%E6%B0%94"), requests);
        assertEquals(3, tracks.size());
        assertEquals("netease:254485", tracks.get(0).id); assertEquals("253433", tracks.get(0).threadId);
        assertEquals("勇气", tracks.get(0).title); assertEquals("梁静茹", tracks.get(0).artist); assertEquals(239, tracks.get(0).duration);
        assertTrue(tracks.get(0).cover.startsWith("https://p1.music.126.net/"));
        assertEquals("netease:2057626026", tracks.get(1).id); assertEquals("", tracks.get(1).threadId);
        assertEquals("kuwo:84721098", tracks.get(2).id); assertEquals("242691", tracks.get(2).threadId);
    }
    @Test public void catalogSongsPlayThroughConfirmedEndpointWithOrWithoutThreads() throws Exception {
        HifiniApi api = new HifiniApi((url, ref, max) -> { throw new AssertionError("Catalog playback must not wait for a forum page"); });
        Track unlinked = Track.catalog("netease", "254485", "", "Song", "Artist", "https://example.invalid/cover", 239);
        HifiniApi.Resolved first = api.resolve(unlinked, stage -> {}), second = api.resolve(unlinked, stage -> {});
        assertEquals(List.of("https://www.hifini.net/musicparse-play.htm?source=netease&id=254485"), first.audioUrls);
        assertNotSame(first, second); assertSame(unlinked, first.track);
        Track linked = Track.catalog("kuwo", "84721098", "242691", "Song", "Artist", "", 241);
        assertEquals("https://www.hifini.net/musicparse-play.htm?source=kuwo&id=84721098", api.resolve(linked, stage -> {}).audioUrls.get(0));
        assertEquals(linked.id, api.resolve(linked, stage -> {}).track.id);
        try { HifiniApi.buildPlaybackUrl(track()); fail(); }
        catch (MusicError error) { assertEquals(R.string.unsupported_link,error.resource); }
    }
    @Test public void catalogProviderIdentityIsIndependentOfTopicMetadata() throws Exception {
        String html = fixture("musicparse-search.html").replace("[source_id] => 84721098", "[source_id] => 254485")
                .replace("thread-253433.htm", "https://other.example.invalid/thread-253433.htm");
        List<Track> tracks=HifiniApi.parseCatalog(html,HifiniApi.ORIGIN);
        assertEquals(3,tracks.size()); assertEquals("",tracks.get(0).threadId);
        assertEquals("netease:254485",tracks.get(0).id);assertEquals("kuwo:254485",tracks.get(2).id);
        assertEquals("",tracks.get(1).threadId); // source_id is never repurposed as a forum ID.
    }
    @Test public void catalogEmptyAndMalformedResponsesAreDistinguished() throws Exception {
        String empty="<pre>Array\n(\n    [netease] =&gt; Array\n        (\n        )\n    [kuwo] =&gt; Array\n        (\n        )\n)</pre>";
        assertTrue(HifiniApi.parseCatalog(empty,HifiniApi.ORIGIN).isEmpty());
        for(String html:new String[]{"<pre>Array\n(\n    [netease] => Array\n(\n)</pre>","{\"netease\":[]}"}) {
            try {HifiniApi.parseCatalog(html,HifiniApi.ORIGIN);fail();}
            catch(MusicError error){assertEquals(R.string.source_changed,error.resource);}
        }
        try { PhpArray.parse("x".repeat(HifiniApi.MAX_HTML_BYTES+1)); fail(); }
        catch(IllegalArgumentException expected) { /* Bounded before parsing. */ }
        try { PhpArray.parse("Array\n(\n    [x] => one\n    [x] => two\n)"); fail(); }
        catch(IllegalArgumentException expected) { /* Ambiguous duplicate keys are not accepted. */ }
    }
    @Test public void onlyVerifiedCoverHostReceivesAnHttpsUpgrade() {
        assertEquals("https://p1.music.126.net/cover.jpg",HifiniApi.imageUrl("http://p1.music.126.net/cover.jpg",HifiniApi.ORIGIN));
        assertNull(HifiniApi.imageUrl("http://p2.music.126.net/cover.jpg",HifiniApi.ORIGIN));
        assertNull(HifiniApi.imageUrl("http://p1.music.126.net.evil.invalid/cover.jpg",HifiniApi.ORIGIN));
        assertNull(HifiniApi.imageUrl("http://user:password@p1.music.126.net/cover.jpg",HifiniApi.ORIGIN));
    }
    @Test public void officialDetailLinksReturnMetadataButResolveAgainWhenPlayed() throws Exception {
        int[] calls = {0}; List<String> urls = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, ref, max) -> { urls.add(url); return fixture("player.html").replace("token=first", "token=" + ++calls[0]); });
        Track found = api.search("https://www.hifini.net/thread-6544.htm").get(0);
        assertEquals("6544", found.id); assertEquals("夜行星", found.title);
        HifiniApi.Resolved playing = api.resolve(found, stage -> {});
        assertEquals(2, calls[0]); assertTrue(playing.audioUrls.get(0).endsWith("token=2"));
        assertEquals(List.of("https://www.hifini.net/thread-6544.htm", "https://www.hifini.net/thread-6544.htm"), urls);
        try { api.search("https://example.invalid/thread-6544.htm"); fail(); }
        catch (MusicError error) { assertEquals(R.string.unsupported_link, error.resource); }
        assertEquals(2, calls[0]);
    }
    @Test public void discoverIsBoundedPublicFrontPageNotRandomGuessedIds() throws Exception {
        List<String> requests = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, ref, max) -> { requests.add(url); return fixture("search.html"); });
        assertEquals(2, api.discover().size()); assertEquals(List.of(HifiniApi.ORIGIN + "/"), requests);
        StringBuilder html = new StringBuilder("<ul class='threadlist'>");
        for (int i=1;i<80;i++) html.append("<li><div class=subject><a href='thread-").append(i).append(".htm'>Artist《Song ").append(i).append("》[MP3]</a></div></li>");
        html.append("</ul>"); assertEquals(50, HifiniApi.parseList(html.toString(), HifiniApi.ORIGIN).size());
    }
    @Test public void resolvesFreshPageEveryTimeAndKeepsOnlyFirstAudioTrack() throws Exception {
        int[] reads = {0}; List<String> stages = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, ref, max) -> fixture("player.html").replace("token=first", "token=" + ++reads[0]));
        HifiniApi.Resolved first = api.resolve(track(), stages::add), second = api.resolve(track(), value -> {});
        assertEquals(2, reads[0]); assertEquals(List.of("page", "audio"), stages);
        assertTrue(first.audioUrls.get(0).endsWith("token=1")); assertTrue(second.audioUrls.get(0).endsWith("token=2"));
        assertEquals(1, first.audioUrls.size()); assertEquals("夜行星", first.track.title);
        assertEquals("林间来客", first.track.artist); assertEquals("https://cdn.example.invalid/cover.jpg", first.track.cover);
    }
    @Test public void oldAndNewPlayerPropertiesAreReadWithoutExecutingCode() throws Exception {
        Map<String,String> parsed = PlayerLiteral.parse("new APlayer({element:document.querySelector('#p'), music:{title:'A \\'song\\'',author:'Artist',url:'https:\\/\\/cdn.example.invalid/song.mp3?x=1\\u0026y=2',pic:'//cdn.example.invalid/cover.png'}})");
        assertEquals("A 'song'", parsed.get("title"));
        assertEquals("https://cdn.example.invalid/song.mp3?x=1&y=2", parsed.get("url"));
        assertTrue(PlayerLiteral.parse("var unrelated={url:'https://cdn.example.invalid/ad.mp3'};").isEmpty());
        assertTrue(PlayerLiteral.parse("/* new APlayer({audio:{url:'https://cdn.example.invalid/ad.mp3'}}) */").isEmpty());
        assertTrue(PlayerLiteral.parse("const example=\"new APlayer({audio:{url:'https://cdn.example.invalid/ad.mp3'}})\";").isEmpty());
        assertTrue(PlayerLiteral.parse("new APlayer({audio:{url:'https://cdn.example.invalid/'+getSecret()}})").isEmpty());
        assertTrue(PlayerLiteral.parse("new APlayer({audio:loadPlayer()})").isEmpty());
        assertTrue(PlayerLiteral.parse("new APlayer({audio:{url:'https://cdn.example.invalid/ok',url:getSecret()}})").isEmpty());
    }
    @Test public void metadataResolutionNeverFetchesUnrequestedLyrics() throws Exception {
        List<String> requests = new ArrayList<>();
        HifiniApi api = new HifiniApi((url, ref, max) -> {
            requests.add(url);
            if (url.endsWith(".lrc")) throw new AssertionError("Lyrics are outside this app's scope");
            return "<script>new APlayer({audio:{url:'https://cdn.example.invalid/a.mp3',artist:'Artist',lrc:'https://cdn.example.invalid/a.lrc'}})</script>";
        });
        HifiniApi.Resolved resolved=api.resolve(track(), value -> {});
        assertEquals(List.of(track().pageUrl()), requests); assertEquals("Artist", resolved.track.artist);
        assertEquals(1,resolved.audioUrls.size());
    }
    @Test public void verificationUnavailableAndUnknownFormatsStayExplicit() throws Exception {
        for (String html : new String[]{"<title>Just a moment...</title><form id='challenge-form'></form>", "<div class='message'>访问验证：请输入验证码</div>"}) {
            try { new HifiniApi((url, ref, max) -> html).resolve(track(), value -> {}); fail(); }
            catch (MusicError error) { assertEquals(R.string.source_verification, error.resource); }
        }
        try { HifiniApi.parseList("<html><body>unexpected format</body></html>",HifiniApi.ORIGIN); fail(); }
        catch (MusicError error) { assertEquals(R.string.source_changed,error.resource); }
        assertTrue(HifiniApi.parseList("<ul class='threadlist'></ul><p>没有找到结果</p>",HifiniApi.ORIGIN).isEmpty());
        try {new HifiniApi((url,ref,max)->"<p>只有下载链接，没有公开试听</p>").resolve(track(), value -> {});fail();}
        catch(MusicError error){assertEquals(R.string.no_playable_audio,error.resource);}
    }
    @Test public void loginResponsesAreNeverPresentedAsAnEmptySearch() throws Exception {
        for (String html : new String[]{"<title>用户登录 - HiFiNi</title><form action='user-login.htm'><input type='password'></form>",
                "<div class='message'>请先登录再搜索</div><ul class='threadlist'></ul>"}) {
            try { new HifiniApi((url,ref,max)->html).search("勇气"); fail(); }
            catch (MusicError error) { assertEquals(R.string.source_login_required,error.resource); }
        }
        try { new HifiniApi((url,ref,max)->"<div class='message'>需要登录后才能查看</div>").resolve(track(),stage->{}); fail(); }
        catch (MusicError error) { assertEquals(R.string.source_login_required,error.resource); }
        assertTrue(HifiniApi.loginPageUrl("https://www.hifini.net/user-login.htm"));
        assertTrue(HifiniApi.loginPageUrl("https://hifini.net/user-login.htm?referer=search"));
        assertFalse(HifiniApi.loginPageUrl("https://example.invalid/user-login.htm"));
    }
    @Test public void requestsAndMediaAreBoundedAndDoNotAcceptExecutableOrLocalSchemes() throws Exception {
        for (String value : new String[]{"file:///etc/passwd", "javascript:alert(1)", "content://media/a", "https://user:secret@example.invalid/song", "http://cdn.example.invalid/song"})
            assertNull(value, HifiniApi.mediaUrl(value,HifiniApi.ORIGIN));
        assertNull(HifiniApi.threadId("https://example.invalid/thread-1.htm",HifiniApi.ORIGIN));
        assertNull(HifiniApi.threadId("thread-0.htm",HifiniApi.ORIGIN));
        for (String value : new String[]{"", "x".repeat(101), "title\nother"}) {
            try {new HifiniApi((url,ref,max)->{throw new AssertionError("should not request");}).search(value);fail();}
            catch(MusicError error){assertEquals(R.string.invalid_search,error.resource);}
        }
        try {new HifiniApi((url,ref,max)->"x".repeat(max+1)).discover();fail();}
        catch(MusicError error){assertEquals(R.string.response_too_large,error.resource);}
    }
    @Test public void interruptionDoesNotIssueAnotherNetworkRequest() throws Exception {
        Thread.currentThread().interrupt();
        try {new HifiniApi((url,ref,max)->{throw new AssertionError("should not request");}).resolve(track(), value->{});fail();}
        catch(MusicError error){assertEquals(R.string.playback_cancelled,error.resource);}
        finally {Thread.interrupted();}
    }
    @Test @Config(qualifiers="en-rUS") public void sourceErrorsFollowInterfaceLanguage() {
        String text=MusicError.display(RuntimeEnvironment.getApplication(),new MusicError(R.string.source_unavailable,503));
        assertTrue(text.contains("503")); assertFalse(text.matches("(?s).*[\\p{IsHan}].*"));
    }
}
