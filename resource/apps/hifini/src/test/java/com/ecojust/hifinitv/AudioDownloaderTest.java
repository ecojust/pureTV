package com.ecojust.hifinitv;

import java.io.File;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/** Real HTTP transfers through an injected local transport; no live HiFiNi requests. */
public class AudioDownloaderTest {
    private MiniServer server;
    private ExecutorService requests;
    private File cache;
    private final TestSession session = new TestSession();
    private final List<String> logicalRequests = Collections.synchronizedList(new ArrayList<>());
    private static final String OFFICIAL = "https://www.hifini.net/";
    /** Minimal HTTP/1.1 fixture server using APIs available to Android unit-test compilation. */
    private static final class MiniServer {
        interface Handler { void handle(Exchange exchange) throws IOException; }
        private final java.net.ServerSocket socket;
        private final java.util.Map<String,Handler> handlers=new java.util.concurrent.ConcurrentHashMap<>();
        private final java.util.Set<java.net.Socket> clients=java.util.concurrent.ConcurrentHashMap.newKeySet();
        private final java.util.concurrent.atomic.AtomicReference<Throwable> failure=new java.util.concurrent.atomic.AtomicReference<>();
        private ExecutorService executor;
        MiniServer(InetSocketAddress address)throws IOException {socket=new java.net.ServerSocket();socket.bind(address);}
        void setExecutor(ExecutorService executor){this.executor=executor;}
        InetSocketAddress getAddress(){return(InetSocketAddress)socket.getLocalSocketAddress();}
        void createContext(String path,Handler handler){handlers.put(path,handler);}
        void start(){
            Thread accept=new Thread(()->{
                while(!socket.isClosed())try{
                    java.net.Socket client=socket.accept();client.setSoTimeout(5000);clients.add(client);
                    executor.execute(()->serve(client));
                }catch(IOException stopped){if(!socket.isClosed())failure.compareAndSet(null,stopped);}
            },"audio-download-test-server");accept.setDaemon(true);accept.start();
        }
        private void serve(java.net.Socket client){
            try(Exchange exchange=new Exchange(client)){
                Handler handler=handlers.get(exchange.getRequestURI().getPath());
                if(handler==null){exchange.sendResponseHeaders(404,-1);return;}
                handler.handle(exchange);
            }catch(IOException disconnected){/* Cancellation and deliberately truncated responses are expected. */}
            catch(Throwable error){failure.compareAndSet(null,error);}
            finally{clients.remove(client);try{client.close();}catch(IOException ignored){}}
        }
        void stop(int ignored){
            try{socket.close();}catch(IOException ignoredClose){}
            for(java.net.Socket client:clients)try{client.close();}catch(IOException ignoredClose){}
        }
        void assertHealthy(){if(failure.get()!=null)throw new AssertionError("Fixture server failed",failure.get());}
    }
    private static final class Headers extends java.util.TreeMap<String,String> {
        Headers(){super(String.CASE_INSENSITIVE_ORDER);}
        void set(String key,String value){put(key,value);}
        String getFirst(String key){return get(key);}
    }
    private static final class Exchange implements AutoCloseable {
        private final java.net.Socket socket;
        private final java.net.URI uri;
        private final Headers request=new Headers(),response=new Headers();
        private java.io.OutputStream body;
        Exchange(java.net.Socket socket)throws IOException {
            this.socket=socket;java.io.InputStream input=new java.io.BufferedInputStream(socket.getInputStream());
            String first=line(input);String[] parts=first.split(" ",3);
            if(parts.length!=3||!parts[0].equals("GET"))throw new IOException("Expected GET request");
            uri=java.net.URI.create(parts[1]);int bytes=first.length();
            for(String header=line(input);!header.isEmpty();header=line(input)){
                bytes+=header.length();if(bytes>32768)throw new IOException("Oversized fixture request");
                int colon=header.indexOf(':');if(colon<=0)throw new IOException("Invalid request header");
                request.set(header.substring(0,colon),header.substring(colon+1).trim());
            }
        }
        private static String line(java.io.InputStream input)throws IOException {
            java.io.ByteArrayOutputStream buffer=new java.io.ByteArrayOutputStream();int value;
            while((value=input.read())!=-1){if(value=='\n')return new String(buffer.toByteArray(),StandardCharsets.US_ASCII).replaceFirst("\r$","");buffer.write(value);if(buffer.size()>8192)throw new IOException("Oversized fixture line");}
            throw new java.io.EOFException("Incomplete request");
        }
        Headers getRequestHeaders(){return request;}
        Headers getResponseHeaders(){return response;}
        java.net.URI getRequestURI(){return uri;}
        void sendResponseHeaders(int status,long length)throws IOException {
            if(body!=null)throw new IOException("Response already started");
            java.io.OutputStream output=socket.getOutputStream();boolean chunked=length==0;
            response.set("Connection","close");
            if(chunked)response.set("Transfer-Encoding","chunked");else response.set("Content-Length",String.valueOf(Math.max(0,length)));
            StringBuilder headers=new StringBuilder("HTTP/1.1 "+status+" Fixture\r\n");
            response.forEach((name,value)->headers.append(name).append(": ").append(value).append("\r\n"));headers.append("\r\n");
            output.write(headers.toString().getBytes(StandardCharsets.US_ASCII));output.flush();
            body=new java.io.OutputStream(){
                private boolean closed;
                @Override public void write(int value)throws IOException{write(new byte[]{(byte)value},0,1);}
                @Override public void write(byte[] values,int offset,int size)throws IOException{
                    if(closed)throw new IOException("Closed fixture response");if(size==0)return;
                    if(chunked)output.write((Integer.toHexString(size)+"\r\n").getBytes(StandardCharsets.US_ASCII));
                    output.write(values,offset,size);if(chunked)output.write(new byte[]{'\r','\n'});
                }
                @Override public void flush()throws IOException{output.flush();}
                @Override public void close()throws IOException{
                    if(closed)return;closed=true;
                    try{if(chunked)output.write("0\r\n\r\n".getBytes(StandardCharsets.US_ASCII));output.flush();}finally{socket.close();}
                }
            };
        }
        java.io.OutputStream getResponseBody(){return body;}
        @Override public void close(){try{if(body!=null)body.close();else socket.close();}catch(IOException ignored){}}
    }
    private static final class TestSession implements AudioDownloader.Session {
        volatile long epoch;
        final List<String> cookieReads = new ArrayList<>(), cookieWrites = new ArrayList<>();
        public long epoch() { return epoch; }
        public String cookie(String url, long expected) { cookieReads.add(url); return expected == epoch ? "fixture-session=secret" : ""; }
        public void accept(String url, List<String> cookies, long expected) { if (expected == epoch) cookieWrites.add(url); }
    }
    @Before public void setup() throws Exception {
        cache = Files.createTempDirectory("hifini-download-test").toFile();
        requests = Executors.newCachedThreadPool();
        server = new MiniServer(new InetSocketAddress("127.0.0.1", 0)); server.setExecutor(requests); server.start();
    }
    @After public void cleanup() throws Exception {
        server.stop(0); requests.shutdownNow(); requests.awaitTermination(3, TimeUnit.SECONDS);
        server.assertHealthy();
        try (java.util.stream.Stream<java.nio.file.Path> files = Files.walk(cache.toPath())) {
            files.sorted(java.util.Comparator.reverseOrder()).forEach(path -> path.toFile().delete());
        }
    }
    private AudioDownloader downloader(long max, long timeout) {
        return new AudioDownloader(cache, logical -> {
            logicalRequests.add(logical.toExternalForm());
            return (HttpURLConnection) new URL("http://127.0.0.1:" + server.getAddress().getPort() + logical.getFile()).openConnection();
        }, session, max, timeout);
    }
    private AudioDownloader downloader() { return downloader(AudioDownloader.MAX_BYTES, 5000); }
    private void body(String path, byte[] bytes, String mime, boolean chunked) {
        server.createContext(path, exchange -> {
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.sendResponseHeaders(200, chunked ? 0 : bytes.length);
            try (java.io.OutputStream output = exchange.getResponseBody()) { output.write(bytes); }
        });
    }
    private void redirect(String from, String to) {
        server.createContext(from, exchange -> {
            exchange.getResponseHeaders().set("Location", to); exchange.sendResponseHeaders(302, -1); exchange.close();
        });
    }
    private static byte[] wav() {
        byte[] bytes = new byte[300];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, bytes, 0, 4);
        little(bytes,4,bytes.length-8);System.arraycopy("WAVEfmt ".getBytes(StandardCharsets.US_ASCII),0,bytes,8,8);
        little(bytes,16,16);bytes[20]=1;bytes[22]=1;little(bytes,24,8000);little(bytes,28,16000);bytes[32]=2;bytes[34]=16;
        System.arraycopy("data".getBytes(StandardCharsets.US_ASCII),0,bytes,36,4);little(bytes,40,bytes.length-44);return bytes;
    }
    private static void little(byte[] bytes,int offset,int value) { for(int i=0;i<4;i++) bytes[offset+i]=(byte)(value >>> (8*i)); }
    private static void failure(AudioDownloader.Failure reason, Throwing work) throws Exception {
        try { work.run(); fail("Expected " + reason); }
        catch (AudioDownloader.DownloadException error) { assertEquals(reason,error.failure); }
    }
    interface Throwing { void run() throws Exception; }
    private File[] cachedFiles() { File[] files=new File(cache,"hifini-audio").listFiles(); return files==null?new File[0]:files; }

    @Test public void downloadsCompleteAudioWithoutSuffixAndLeavesSuccessfulFileOwnedByCaller() throws Exception {
        body("/musicparse-play.htm",wav(),"application/octet-stream",false);
        List<AudioDownloader.Progress> progress=new ArrayList<>(); AudioDownloader first=downloader();
        File saved=first.download(OFFICIAL+"musicparse-play.htm?source=netease&id=254485",OFFICIAL,progress::add);
        assertArrayEquals(wav(),Files.readAllBytes(saved.toPath()));assertTrue(saved.getName().endsWith(".audio"));
        assertEquals(new File(cache,"hifini-audio").getCanonicalFile(),saved.getParentFile().getCanonicalFile());
        assertEquals(0,progress.get(0).downloaded);assertEquals(300,progress.get(0).total);
        assertEquals(300,progress.get(progress.size()-1).downloaded);first.close();assertTrue(saved.exists());
        try(AudioDownloader another=downloader()) {
            File second=another.download(OFFICIAL+"musicparse-play.htm",OFFICIAL,null);assertNotEquals(saved,second);assertTrue(saved.exists());
        }
        assertEquals(2,cachedFiles().length);AudioDownloader.cleanCache(cache);assertEquals(0,cachedFiles().length);
    }
    @Test public void chunkedAudioReportsUnknownLengthAndDoesNotTrustAMisconfiguredMime() throws Exception {
        body("/stream",wav(),"text/plain",true);List<AudioDownloader.Progress> progress=new ArrayList<>();
        try(AudioDownloader downloader=downloader()) {
            File file=downloader.download(OFFICIAL+"stream",OFFICIAL,progress::add);assertEquals(300,file.length());
            assertTrue(progress.stream().allMatch(update -> update.total == -1));
            assertEquals(300,progress.get(progress.size()-1).downloaded);
        }
    }
    @Test public void redirectCookiesStayOnOfficialHttpsAndSignedQueryBytesArePreserved() throws Exception {
        String cdn="http://m801.music.126.net/media?token=a%2Fb%2Bz&expires=123";
        server.createContext("/start",exchange->{
            assertEquals("fixture-session=secret",exchange.getRequestHeaders().getFirst("Cookie"));
            exchange.getResponseHeaders().set("Set-Cookie","new=fixture; Path=/");exchange.getResponseHeaders().set("Location",cdn);
            exchange.sendResponseHeaders(302,-1);exchange.close();
        });
        server.createContext("/media",exchange->{
            assertNull(exchange.getRequestHeaders().getFirst("Cookie"));assertEquals("token=a%2Fb%2Bz&expires=123",exchange.getRequestURI().getRawQuery());
            exchange.getResponseHeaders().set("Set-Cookie","cdn=untrusted; Path=/");exchange.sendResponseHeaders(200,wav().length);
            try(java.io.OutputStream output=exchange.getResponseBody()){output.write(wav());}
        });
        try(AudioDownloader downloader=downloader()){assertEquals(300,downloader.download(OFFICIAL+"start",OFFICIAL,null).length());}
        assertEquals(List.of(OFFICIAL+"start",cdn),logicalRequests);
        assertEquals(List.of(OFFICIAL+"start"),session.cookieReads);assertEquals(List.of(OFFICIAL+"start"),session.cookieWrites);
    }
    @Test public void anonymousCdnCannotGainSessionByRedirectingToOfficialSite() throws Exception {
        redirect("/external",OFFICIAL+"final");
        server.createContext("/final",exchange->{assertNull(exchange.getRequestHeaders().getFirst("Cookie"));exchange.sendResponseHeaders(200,wav().length);try(java.io.OutputStream output=exchange.getResponseBody()){output.write(wav());}});
        try(AudioDownloader downloader=downloader()){downloader.download("https://cdn.example.invalid/external",OFFICIAL,null);}
        assertTrue(session.cookieReads.isEmpty());assertTrue(session.cookieWrites.isEmpty());
    }
    @Test public void leavingOfficialSiteMakesTheRemainderOfTheChainAnonymous() throws Exception {
        server.createContext("/trusted",exchange->{
            assertEquals("fixture-session=secret",exchange.getRequestHeaders().getFirst("Cookie"));
            exchange.getResponseHeaders().set("Location","https://cdn.example.invalid/roundtrip");
            exchange.sendResponseHeaders(302,-1);exchange.close();
        });
        server.createContext("/roundtrip",exchange->{
            assertNull(exchange.getRequestHeaders().getFirst("Cookie"));
            exchange.getResponseHeaders().set("Location",OFFICIAL+"returned");exchange.sendResponseHeaders(302,-1);exchange.close();
        });
        server.createContext("/returned",exchange->{
            assertNull(exchange.getRequestHeaders().getFirst("Cookie"));exchange.getResponseHeaders().set("Set-Cookie","untrusted-hop=fixture; Path=/");
            exchange.sendResponseHeaders(200,wav().length);try(java.io.OutputStream output=exchange.getResponseBody()){output.write(wav());}
        });
        try(AudioDownloader downloader=downloader()){assertEquals(300,downloader.download(OFFICIAL+"trusted",OFFICIAL,null).length());}
        assertEquals(List.of(OFFICIAL+"trusted"),session.cookieReads);assertTrue(session.cookieWrites.isEmpty());
    }
    @Test public void queryOnlyRedirectPreservesRawResourcePathAndQueryEncoding() throws Exception {
        server.createContext("/path/audio.mp3",exchange->{
            String query=exchange.getRequestURI().getRawQuery();
            if("old=x".equals(query)) {
                exchange.getResponseHeaders().set("Location","?token=a%2fb%2BZ&expires=123");exchange.sendResponseHeaders(302,-1);exchange.close();
            } else {
                assertEquals("token=a%2fb%2BZ&expires=123",query);
                exchange.sendResponseHeaders(200,wav().length);try(java.io.OutputStream output=exchange.getResponseBody()){output.write(wav());}
            }
        });
        String original="https://cdn.example.invalid/path/audio.mp3?old=x";
        try(AudioDownloader downloader=downloader()){assertEquals(300,downloader.download(original,OFFICIAL,null).length());}
        assertEquals(List.of(original,"https://cdn.example.invalid/path/audio.mp3?token=a%2fb%2BZ&expires=123"),logicalRequests);
        assertEquals("https://cdn.example.invalid/p%2fath/audio%20file?token=%2b",AudioDownloader.checkedUrl("?token=%2b","https://cdn.example.invalid/p%2fath/audio%20file?old=x"));
    }
    @Test public void rejectsUntrustedHttpAndRedirectLoopsBeforeWritingAudio() throws Exception {
        redirect("/foreign","http://untrusted.example.invalid/media");redirect("/loop",OFFICIAL+"loop");
        try(AudioDownloader downloader=downloader()) { failure(AudioDownloader.Failure.UNSUPPORTED_URL,()->downloader.download(OFFICIAL+"foreign",OFFICIAL,null)); }
        assertEquals(List.of(OFFICIAL+"foreign"),logicalRequests);logicalRequests.clear();
        try(AudioDownloader downloader=downloader()) { failure(AudioDownloader.Failure.UNSUPPORTED_URL,()->downloader.download(OFFICIAL+"loop",OFFICIAL,null)); }
        assertEquals(6,logicalRequests.size());assertEquals(0,cachedFiles().length);
        for(String url:List.of("http://kuwo.cn.evil.invalid/file","http://music.126.net@evil.invalid/file","http://m.music.126.net:81/file","https://user:password@www.hifini.net/file","file:///tmp/file"))
            failure(AudioDownloader.Failure.UNSUPPORTED_URL,()->AudioDownloader.checkedUrl(url,OFFICIAL));
        failure(AudioDownloader.Failure.UNSUPPORTED_URL,()->AudioDownloader.checkedUrl("http://m.music.126.net/file",null));
        assertEquals("http://nmobi.kuwo.cn/file?a=%2f",AudioDownloader.checkedUrl("http://nmobi.kuwo.cn/file?a=%2f",OFFICIAL));
    }
    @Test public void htmlJsonAndPlaylistResponsesAreNeverPassedToTheDecoder() throws Exception {
        byte[][] bodies={"<!doctype html><form>Login</form>".getBytes(StandardCharsets.UTF_8),"  {\"url\":\"not-audio\"}".getBytes(StandardCharsets.UTF_8),"#EXTM3U\nhttps://example.invalid/a".getBytes(StandardCharsets.UTF_8),"access denied, please try again".getBytes(StandardCharsets.UTF_8),new byte[80]};
        for(int i=0;i<bodies.length;i++){String path="/invalid"+i;body(path,bodies[i],"audio/mpeg",false);try(AudioDownloader downloader=downloader()){failure(AudioDownloader.Failure.INVALID_AUDIO,()->downloader.download(OFFICIAL+path.substring(1),OFFICIAL,null));}assertEquals(0,cachedFiles().length);}
        redirect("/login",OFFICIAL+"user-login.htm");try(AudioDownloader downloader=downloader()){failure(AudioDownloader.Failure.LOGIN_REQUIRED,()->downloader.download(OFFICIAL+"login",OFFICIAL,null));}
    }
    @Test public void sizeLimitsApplyBothToContentLengthAndChunkedTransfer() throws Exception {
        body("/length",wav(),"audio/wav",false);body("/chunked",wav(),"audio/wav",true);
        for(String path:List.of("length","chunked"))try(AudioDownloader downloader=downloader(128,5000)){failure(AudioDownloader.Failure.TOO_LARGE,()->downloader.download(OFFICIAL+path,OFFICIAL,null));assertEquals(0,cachedFiles().length);}
    }
    @Test public void cancellationAndSessionChangesRemovePartialFiles() throws Exception {
        body("/cancel",wav(),"audio/wav",true);
        try(AudioDownloader downloader=downloader()) {
            failure(AudioDownloader.Failure.CANCELLED,()->downloader.download(OFFICIAL+"cancel",OFFICIAL,progress->{if(progress.downloaded>0)downloader.cancel();}));
        }
        assertEquals(0,cachedFiles().length);
        try(AudioDownloader downloader=downloader()) {
            failure(AudioDownloader.Failure.CANCELLED,()->downloader.download(OFFICIAL+"cancel",OFFICIAL,progress->{if(progress.downloaded>0)session.epoch++;}));
        }
        assertEquals(0,cachedFiles().length);
        Thread.currentThread().interrupt();
        try(AudioDownloader downloader=downloader()){failure(AudioDownloader.Failure.CANCELLED,()->downloader.download(OFFICIAL+"cancel",OFFICIAL,null));}
        finally{Thread.interrupted();}
    }
    @Test public void absoluteTimeoutDisconnectsAnActiveSlowTransfer() throws Exception {
        CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
        server.createContext("/slow",exchange->{entered.countDown();try{release.await(3,TimeUnit.SECONDS);}catch(InterruptedException ignored){Thread.currentThread().interrupt();}exchange.close();});
        try(AudioDownloader downloader=downloader(AudioDownloader.MAX_BYTES,150)) {
            long start=System.nanoTime();failure(AudioDownloader.Failure.TIMEOUT,()->downloader.download(OFFICIAL+"slow",OFFICIAL,null));
            assertTrue(entered.await(1,TimeUnit.SECONDS));assertTrue(TimeUnit.NANOSECONDS.toMillis(System.nanoTime()-start)<2000);
        } finally {release.countDown();}
        assertEquals(0,cachedFiles().length);
    }
    @Test public void explicitCancelReturnsPromptlyAndReaderCleansPartialAfterTransportUnblocks() throws Exception {
        CountDownLatch started=new CountDownLatch(1),received=new CountDownLatch(1),release=new CountDownLatch(1);
        server.createContext("/partial",exchange->{
            exchange.sendResponseHeaders(200,0);
            try(java.io.OutputStream output=exchange.getResponseBody()) {
                output.write(wav());output.flush();started.countDown();release.await();
            } catch(InterruptedException interrupted){Thread.currentThread().interrupt();}
        });
        ExecutorService worker=Executors.newSingleThreadExecutor();AudioDownloader downloader=downloader();
        try {
            Future<AudioDownloader.Failure> task=worker.submit(()->{
                try {downloader.download(OFFICIAL+"partial",OFFICIAL,progress->{if(progress.downloaded>0)received.countDown();});return null;}
                catch(AudioDownloader.DownloadException error){return error.failure;}
            });
            assertTrue(started.await(2,TimeUnit.SECONDS));assertTrue(received.await(2,TimeUnit.SECONDS));
            assertTrue("The reader must own an in-flight partial file",cachedFiles().length>0);
            requests.submit(downloader::cancel).get(300,TimeUnit.MILLISECONDS);
            // JDK/Android disconnect implementations may wait behind the active read. The UI
            // caller must return promptly; the reader owns cleanup once EOF/read timeout wakes it.
            release.countDown();
            assertEquals(AudioDownloader.Failure.CANCELLED,task.get(2,TimeUnit.SECONDS));
            assertEquals(0,cachedFiles().length);
        } finally {release.countDown();downloader.close();worker.shutdownNow();}
    }
    @Test public void httpErrorsAndTruncatedBodiesNeverLeaveCommittedFiles() throws Exception {
        server.createContext("/denied",exchange->{exchange.sendResponseHeaders(403,-1);exchange.close();});
        server.createContext("/truncated",exchange->{exchange.sendResponseHeaders(200,600);try(java.io.OutputStream output=exchange.getResponseBody()){output.write(wav());}catch(IOException expected){/* Intentional short response. */}});
        try(AudioDownloader downloader=downloader()) {
            try {downloader.download(OFFICIAL+"denied",OFFICIAL,null);fail();}
            catch(AudioDownloader.DownloadException error){assertEquals(AudioDownloader.Failure.HTTP_STATUS,error.failure);assertEquals(403,error.statusCode);}
        }
        try(AudioDownloader downloader=downloader()) {
            try {downloader.download(OFFICIAL+"truncated",OFFICIAL,null);fail();}
            catch(IOException expected){/* A transport EOF or an explicit incomplete-file rejection is valid. */}
        }
        assertEquals(0,cachedFiles().length);
    }
    @Test public void cleanCacheOnlyDeletesOwnedStaleArtifacts() throws Exception {
        File directory=new File(cache,"hifini-audio");assertTrue(directory.mkdirs());
        Files.write(new File(directory,"audio-stale.part").toPath(),new byte[]{1});Files.write(new File(directory,"audio-old.audio").toPath(),new byte[]{1});
        File unrelated=new File(directory,"cover.png");Files.write(unrelated.toPath(),new byte[]{1});
        File other=new File(cache,"unrelated.audio");Files.write(other.toPath(),new byte[]{1});
        AudioDownloader.cleanCache(cache);assertEquals(1,cachedFiles().length);assertTrue(unrelated.exists());assertTrue(other.exists());
    }
    @Test public void commonAudioContainersAreRecognizedWithoutDependingOnExtensions() throws Exception {
        byte[] mp3=new byte[500];mp3[0]=(byte)255;mp3[1]=(byte)251;mp3[2]=(byte)144;
        byte[] tagged=new byte[510];System.arraycopy("ID3".getBytes(StandardCharsets.US_ASCII),0,tagged,0,3);tagged[3]=4;System.arraycopy(mp3,0,tagged,10,500);
        byte[] flac=new byte[64];System.arraycopy("fLaC".getBytes(StandardCharsets.US_ASCII),0,flac,0,4);flac[4]=(byte)128;flac[7]=34;
        byte[] m4a=new byte[64];m4a[3]=24;System.arraycopy("ftypM4A ".getBytes(StandardCharsets.US_ASCII),0,m4a,4,8);
        byte[] ogg=new byte[64];System.arraycopy("OggS".getBytes(StandardCharsets.US_ASCII),0,ogg,0,4);ogg[26]=1;ogg[27]=19;System.arraycopy("OpusHead".getBytes(StandardCharsets.US_ASCII),0,ogg,28,8);
        for(byte[] bytes:new byte[][]{wav(),mp3,tagged,flac,m4a,ogg}){File file=File.createTempFile("signature-",".bin",cache);Files.write(file.toPath(),bytes);assertTrue(AudioDownloader.supportedAudio(file));}
        tagged[9]=127;File truncated=new File(cache,"truncated.bin");Files.write(truncated.toPath(),java.util.Arrays.copyOf(tagged,20));assertFalse(AudioDownloader.supportedAudio(truncated));
    }
    @Test public void continuouslyAdvancingSlowTransferOutlivesItsIdleDeadline() throws Exception {
        byte[] bytes = wav();
        server.createContext("/slow-progress", exchange -> {
            exchange.sendResponseHeaders(200, bytes.length);
            try (java.io.OutputStream output = exchange.getResponseBody()) {
                for (int offset = 0; offset < bytes.length; offset += 30) {
                    output.write(bytes, offset, Math.min(30, bytes.length - offset)); output.flush();
                    try { Thread.sleep(80); } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); return; }
                }
            }
        });
        try (AudioDownloader transfer = new AudioDownloader(cache,
                url -> (HttpURLConnection) new URL("http://127.0.0.1:" + server.getAddress().getPort() + url.getFile()).openConnection(),
                session, AudioDownloader.MAX_BYTES, 3000, 300)) {
            long started = System.nanoTime();
            File downloaded = transfer.download(OFFICIAL + "slow-progress", OFFICIAL, null);
            assertTrue("Slow fixture must outlive the idle interval", TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - started) > 600);
            assertArrayEquals(bytes, Files.readAllBytes(downloaded.toPath()));
        }
    }

    @Test public void stalledTransferStillTimesOutAndCleansItsPartialFile() throws Exception {
        CountDownLatch release = new CountDownLatch(1);
        server.createContext("/stalled-progress", exchange -> {
            exchange.sendResponseHeaders(200, 300);
            exchange.getResponseBody().write(wav(), 0, 50); exchange.getResponseBody().flush();
            try { release.await(2, TimeUnit.SECONDS); } catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        });
        try (AudioDownloader transfer = new AudioDownloader(cache,
                url -> (HttpURLConnection) new URL("http://127.0.0.1:" + server.getAddress().getPort() + url.getFile()).openConnection(),
                session, AudioDownloader.MAX_BYTES, 3000, 150)) {
            failure(AudioDownloader.Failure.TIMEOUT, () -> transfer.download(OFFICIAL + "stalled-progress", OFFICIAL, null));
            assertEquals(0, cachedFiles().length);
        } finally { release.countDown(); }
    }

    private static final class BlockingDisconnect extends HttpURLConnection {
        final CountDownLatch reading = new CountDownLatch(1), disconnecting = new CountDownLatch(1);
        final CountDownLatch releaseRead = new CountDownLatch(1), releaseDisconnect = new CountDownLatch(1);
        final java.util.concurrent.atomic.AtomicInteger disconnectCalls = new java.util.concurrent.atomic.AtomicInteger();
        volatile Thread reader, closer;
        boolean throwsOnDisconnect;
        BlockingDisconnect() throws Exception { super(new URL(OFFICIAL + "blocking")); }
        @Override public void connect() { }
        @Override public boolean usingProxy() { return false; }
        @Override public void disconnect() {
            if (throwsOnDisconnect) throw new IllegalStateException("vendor disconnect failure");
            if (disconnectCalls.getAndIncrement() > 0) return;
            disconnecting.countDown();
            try { releaseDisconnect.await(3, TimeUnit.SECONDS); }
            catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
        }
        @Override public int getResponseCode() { return 200; }
        @Override public long getContentLengthLong() { return 300; }
        @Override public java.util.Map<String,List<String>> getHeaderFields() { return Collections.emptyMap(); }
        @Override public java.io.InputStream getInputStream() {
            return new java.io.InputStream() {
                private boolean emitted;
                @Override public int read() { throw new AssertionError("Use bounded bulk reads"); }
                @Override public int read(byte[] bytes, int offset, int length) throws IOException {
                    reader = Thread.currentThread(); reading.countDown();
                    try { if (!releaseRead.await(3, TimeUnit.SECONDS)) throw new IOException("fixture timeout"); }
                    catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); throw new IOException(interrupted); }
                    if (emitted) return -1; emitted = true; byte[] data = wav();
                    System.arraycopy(data, 0, bytes, offset, data.length); return data.length;
                }
                @Override public void close() { closer = Thread.currentThread(); }
            };
        }
    }

    @Test public void cancelReturnsBeforeBlockingDisconnectAndOnlyReaderClosesStream() throws Exception {
        BlockingDisconnect connection = new BlockingDisconnect();
        AudioDownloader transfer = new AudioDownloader(cache, url -> connection, session, AudioDownloader.MAX_BYTES, 5000);
        Future<?> running = requests.submit(() -> { failure(AudioDownloader.Failure.CANCELLED,
                () -> transfer.download(OFFICIAL + "blocking", OFFICIAL, null)); return null; });
        try {
            assertTrue(connection.reading.await(2, TimeUnit.SECONDS));
            Future<?> cancellation = requests.submit(transfer::cancel);
            cancellation.get(300, TimeUnit.MILLISECONDS);
            assertTrue(connection.disconnecting.await(2, TimeUnit.SECONDS));
            assertNull("Cancellation must not close another thread's stream", connection.closer);
            connection.releaseRead.countDown(); running.get(2, TimeUnit.SECONDS);
            assertSame(connection.reader, connection.closer); assertEquals(0, cachedFiles().length);
        } finally { connection.releaseRead.countDown(); connection.releaseDisconnect.countDown(); transfer.close(); }
    }

    @Test public void vendorDisconnectExceptionsCannotEscapeCancellationCaller() throws Exception {
        BlockingDisconnect connection = new BlockingDisconnect(); connection.throwsOnDisconnect = true;
        AudioDownloader transfer = new AudioDownloader(cache, url -> connection, session, AudioDownloader.MAX_BYTES, 5000);
        Future<?> running = requests.submit(() -> { failure(AudioDownloader.Failure.CANCELLED,
                () -> transfer.download(OFFICIAL + "blocking", OFFICIAL, null)); return null; });
        try {
            assertTrue(connection.reading.await(2, TimeUnit.SECONDS));
            requests.submit(transfer::cancel).get(300, TimeUnit.MILLISECONDS);
            connection.releaseRead.countDown(); running.get(2, TimeUnit.SECONDS);
            assertEquals(0, cachedFiles().length);
        } finally { connection.releaseRead.countDown(); transfer.close(); }
    }

}
