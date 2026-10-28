package com.ecojust.nestv;

import java.io.*;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONObject;
import org.junit.*;
import org.junit.rules.TemporaryFolder;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=28,manifest=Config.NONE)
public class RomUploadTest {
    @Rule public TemporaryFolder temporary=new TemporaryFolder();
    RomStore store;LanGameServer server;int port;List<Socket> sockets=new ArrayList<>();
    @Before public void start() throws Exception {
        store=new RomStore(temporary.newFolder());
        server=new LanGameServer(name -> new ByteArrayInputStream(new byte[0]),new LanGameServer.CartridgeAccess(){
            public String info(){try{return new JSONObject().put("rom",store.info()==null?JSONObject.NULL:store.info().json()).toString();}catch(Exception error){throw new RuntimeException(error);}}
            public RomStore.Info replace(String name,byte[] data)throws IOException{return store.replace(name,data);}
            public InputStream open()throws IOException{return store.open();}
        });port=server.start();
    }
    @After public void stop() throws Exception{server.stop();for(Socket socket:sockets)socket.close();}
    Socket socket()throws Exception{Socket s=new Socket("127.0.0.1",port);s.setSoTimeout(2000);sockets.add(s);return s;}
    void headers(Socket s,String room,String origin,long length)throws Exception{
        s.getOutputStream().write(("POST /api/rom?room="+room+" HTTP/1.1\r\nHost: 127.0.0.1:"+port+"\r\nOrigin: "+origin+"\r\nContent-Type: application/octet-stream\r\nX-ROM-Name: game.nes\r\nContent-Length: "+length+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));s.getOutputStream().flush();
    }
    String response(Socket s)throws Exception{return new String(s.getInputStream().readAllBytes(),StandardCharsets.UTF_8);}
    String post(byte[] bytes,String token,String origin)throws Exception{Socket s=socket();headers(s,token,origin,bytes.length);s.getOutputStream().write(bytes);s.getOutputStream().flush();return response(s);}
    String origin(){return "http://127.0.0.1:"+port;}
    String get(String path)throws Exception{Socket s=socket();s.getOutputStream().write(("GET "+path+" HTTP/1.1\r\nHost: 127.0.0.1:"+port+"\r\n\r\n").getBytes(StandardCharsets.US_ASCII));return response(s);}

    @Test public void validUploadIsPersistedAndInfoRequiresRoom()throws Exception{
        assertTrue(get("/api/info?room=wrong").startsWith("HTTP/1.1 403"));
        String response=post(RomStoreTest.nrom(),server.roomToken(),origin());assertTrue(response,response.startsWith("HTTP/1.1 200"));
        assertEquals("game.nes",store.info().name);assertTrue(response.contains(store.info().revision));
        assertTrue(get("/api/info?room="+server.roomToken()).contains(store.info().revision));
        assertTrue(get("/api/rom?room="+server.roomToken()).startsWith("HTTP/1.1 200"));
        assertTrue(get("/api/rom?room=wrong").startsWith("HTTP/1.1 403"));
    }
    @Test public void wrongTokenCrossOriginAndOversizeFailBeforeSaving()throws Exception{
        assertTrue(post(new byte[16],"wrong",origin()).startsWith("HTTP/1.1 403"));
        assertTrue(post(new byte[16],server.roomToken(),"https://outside.example").startsWith("HTTP/1.1 403"));
        Socket tooLarge=socket();headers(tooLarge,server.roomToken(),origin(),RomStore.MAX_BYTES+1L);
        assertTrue(response(tooLarge).startsWith("HTTP/1.1 413"));assertNull(store.info());
    }
    @Test public void invalidAndInterruptedUploadsPreservePreviousCartridge()throws Exception{
        store.replace("previous.nes",RomStoreTest.nrom());String revision=store.info().revision;
        assertTrue(post(new byte[16],server.roomToken(),origin()).startsWith("HTTP/1.1 400"));
        Socket partial=socket();headers(partial,server.roomToken(),origin(),RomStoreTest.nrom().length);
        partial.getOutputStream().write(new byte[30]);partial.shutdownOutput();assertTrue(response(partial).startsWith("HTTP/1.1 400"));
        assertEquals(revision,store.info().revision);
        try(InputStream input=store.open()){assertArrayEquals(RomStoreTest.nrom(),input.readAllBytes());}
    }
    @Test public void concurrentUploadIsRejectedAndStopClosesPendingUpload()throws Exception{
        Socket pending=socket();headers(pending,server.roomToken(),origin(),RomStoreTest.nrom().length);
        pending.getOutputStream().write(new byte[16]);pending.getOutputStream().flush();
        // A short observation loop waits for the server to accept the first body without blocking that body.
        long until=System.nanoTime()+2_000_000_000L;boolean locked=false;
        while(System.nanoTime()<until){
            java.lang.reflect.Field field=LanGameServer.class.getDeclaredField("importing");field.setAccessible(true);
            if(((java.util.concurrent.atomic.AtomicBoolean)field.get(server)).get()){locked=true;break;}Thread.sleep(5);
        }
        assertTrue(locked);
        Socket second=socket();headers(second,server.roomToken(),origin(),16);assertTrue(response(second).startsWith("HTTP/1.1 409"));
        server.stop();try{assertEquals(-1,pending.getInputStream().read());}catch(java.net.SocketException closed){}
        assertNull(store.info());
    }
}
