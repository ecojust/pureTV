package com.ecojust.operatv;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.zip.GZIPOutputStream;
import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/** Uses only a loopback test server, never a live provider or credentials. */
public class OperaHttpTest {
    private TestServer server;
    private String base;
    @Before public void start() throws Exception {
        server=new TestServer();
        base="http://127.0.0.1:"+server.port();
    }
    @After public void stop() throws Exception { Thread.interrupted(); if(server!=null)server.close(); }

    @Test public void returnsFinalRedirectBaseForRelativePlaylistEntries() throws Exception {
        server.createContext("/old",e->{e.getResponseHeaders().set("Location","/new/list.m3u");e.sendResponseHeaders(302,-1);e.close();});
        server.createContext("/new/list.m3u",e->{e.getResponseHeaders().set("Content-Type","application/x-mpegURL");send(e,200,"#EXTM3U\nvideo.mp4\n".getBytes(StandardCharsets.UTF_8));});
        OperaHttp.Response response=OperaHttp.fetch(base+"/old",1000);
        assertEquals(base+"/new/list.m3u",response.url);
        assertTrue(response.text.contains("video.mp4"));assertEquals("application/x-mpegURL",response.contentType);
    }
    @Test public void boundsChunkedAndDecodedGzipBodies() throws Exception {
        byte[] large=new byte[2048];Arrays.fill(large,(byte)'a');
        server.createContext("/chunked",e->{e.sendResponseHeaders(200,0);try{e.getResponseBody().write(large);}finally{e.close();}});
        ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(GZIPOutputStream zip=new GZIPOutputStream(bytes)){zip.write(large);}
        server.createContext("/gzip",e->{e.getResponseHeaders().set("Content-Encoding","gzip");send(e,200,bytes.toByteArray());});
        rejects("/chunked",64,"large");rejects("/gzip",64,"large");
    }
    @Test public void rejectsEmptyBomOnlyAndNonSuccessResponses() throws Exception {
        server.createContext("/empty",e->send(e,200,new byte[0]));
        server.createContext("/bom",e->send(e,200,"\uFEFF".getBytes(StandardCharsets.UTF_8)));
        server.createContext("/unavailable",e->send(e,503,"maintenance".getBytes(StandardCharsets.UTF_8)));
        rejects("/empty",100,"empty");rejects("/bom",100,"empty");rejects("/unavailable",100,"503");
    }
    @Test public void rejectsMalformedUtf8WithoutSilentlyChangingPlaylistTitles() throws Exception {
        server.createContext("/invalid-utf8",e->send(e,200,new byte[]{(byte)0xc3,0x28}));
        rejects("/invalid-utf8",100,"UTF-8");
    }
    @Test public void limitsRedirectsAndRejectsUnsupportedRedirectSchemes() throws Exception {
        AtomicInteger count=new AtomicInteger();
        server.createContext("/loop",e->{count.incrementAndGet();e.getResponseHeaders().set("Location","/loop");e.sendResponseHeaders(302,-1);e.close();});
        server.createContext("/file",e->{e.getResponseHeaders().set("Location","file:///tmp/private");e.sendResponseHeaders(302,-1);e.close();});
        rejects("/loop",100,"redirect");assertEquals(5,count.get());
        rejects("/file",100,"HTTP");
    }
    @Test public void cancelledRequestsDoNotContactServer() throws Exception {
        AtomicInteger count=new AtomicInteger();server.createContext("/data",e->{count.incrementAndGet();send(e,200,new byte[]{'x'});});
        Thread.currentThread().interrupt();
        try {OperaHttp.get(base+"/data",100);fail();}catch(IOException expected){assertTrue(expected.getMessage().contains("cancelled"));}
        finally{Thread.interrupted();}
        assertEquals(0,count.get());
    }
    @Test public void enablesModernTlsWithoutAddingLegacyProtocols() throws Exception {
        OperaHttp.ModernTlsFactory factory=new OperaHttp.ModernTlsFactory((SSLSocketFactory)SSLSocketFactory.getDefault());
        try(SSLSocket socket=(SSLSocket)factory.createSocket()){
            assertTrue(Arrays.asList(socket.getEnabledProtocols()).contains("TLSv1.2"));
            for(String protocol:socket.getEnabledProtocols()) assertTrue(protocol.equals("TLSv1.2")||protocol.equals("TLSv1.3"));
        }
    }
    private void rejects(String path,int limit,String expectedText)throws Exception{
        try{OperaHttp.get(base+path,limit);fail(path);}catch(IOException expected){assertTrue(expected.getMessage(),expected.getMessage().contains(expectedText));}
    }
    private static void send(TestResponse exchange,int status,byte[] bytes)throws IOException{
        exchange.sendResponseHeaders(status,bytes.length);
        try{exchange.getResponseBody().write(bytes);}finally{exchange.close();}
    }

    private interface Handler { void handle(TestResponse response) throws IOException; }

    /** A bounded loopback fixture using only java.base APIs available to Android test compilation. */
    private static final class TestServer implements AutoCloseable {
        private final ServerSocket socket = new ServerSocket();
        private final Map<String,Handler> routes = new ConcurrentHashMap<>();
        private final Thread worker;
        private volatile boolean closed;
        private volatile Socket active;

        TestServer() throws IOException {
            socket.bind(new InetSocketAddress("127.0.0.1",0));
            worker = new Thread(this::serve,"opera-http-test-loopback");
            worker.setDaemon(true);
            worker.start();
        }
        int port() { return socket.getLocalPort(); }
        void createContext(String path, Handler handler) { routes.put(path,handler); }
        private void serve() {
            while(!closed) {
                try(Socket client=socket.accept()) {
                    active=client;
                    client.setSoTimeout(2000);
                    InputStream input=client.getInputStream();
                    ByteArrayOutputStream request=new ByteArrayOutputStream();
                    int ending=0;
                    while(ending!=0x0d0a0d0a) {
                        int value=input.read();
                        if(value<0)throw new IOException("Incomplete test request");
                        request.write(value);
                        if(request.size()>16384)throw new IOException("Oversized test request");
                        ending=(ending<<8)|value;
                    }
                    String firstLine=new String(request.toByteArray(),StandardCharsets.US_ASCII).split("\\r\\n",2)[0];
                    String[] parts=firstLine.split(" ",3);
                    if(parts.length!=3)throw new IOException("Malformed test request");
                    Handler handler=routes.get(parts[1]);
                    TestResponse response=new TestResponse(client.getOutputStream());
                    if(handler==null)send(response,404,new byte[0]);
                    else handler.handle(response);
                    response.close();
                } catch(IOException ignored) {
                    // An oversized response may be rejected by the client before it has all been sent.
                } finally { active=null; }
            }
        }
        @Override public void close() throws Exception {
            closed=true;
            socket.close();
            Socket current=active;
            if(current!=null)current.close();
            worker.join(3000);
            assertFalse("Loopback fixture thread did not stop",worker.isAlive());
        }
    }

    private static final class Headers extends LinkedHashMap<String,String> {
        void set(String key,String value) { put(key,value); }
    }
    private static final class TestResponse implements AutoCloseable {
        private final OutputStream output;
        private final Headers headers=new Headers();
        private final ByteArrayOutputStream body=new ByteArrayOutputStream();
        private int status=200;
        private long length=-1;
        private boolean sent;
        TestResponse(OutputStream output) { this.output=output; }
        Headers getResponseHeaders() { return headers; }
        void sendResponseHeaders(int status,long length) { this.status=status;this.length=length; }
        OutputStream getResponseBody() { return body; }
        @Override public void close() throws IOException {
            if(sent)return;
            sent=true;
            boolean chunked=length==0;
            StringBuilder head=new StringBuilder("HTTP/1.1 ").append(status).append(" Test\r\nConnection: close\r\n");
            for(Map.Entry<String,String> entry:headers.entrySet())head.append(entry.getKey()).append(": ").append(entry.getValue()).append("\r\n");
            if(chunked)head.append("Transfer-Encoding: chunked\r\n");
            else head.append("Content-Length: ").append(Math.max(0,length)).append("\r\n");
            head.append("\r\n");
            output.write(head.toString().getBytes(StandardCharsets.US_ASCII));
            if(chunked) {
                if(body.size()>0) {
                    output.write((Integer.toHexString(body.size())+"\r\n").getBytes(StandardCharsets.US_ASCII));
                    body.writeTo(output);output.write(new byte[]{'\r','\n'});
                }
                output.write("0\r\n\r\n".getBytes(StandardCharsets.US_ASCII));
            } else body.writeTo(output);
            output.flush();
        }
    }
}
