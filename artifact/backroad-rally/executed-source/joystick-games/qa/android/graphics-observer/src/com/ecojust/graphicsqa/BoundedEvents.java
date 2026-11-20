package com.ecojust.graphicsqa;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/** Test-only bounded console/lifecycle observations. No application state. */
public final class BoundedEvents {
    public static final int MAX_EVENTS = 256, MAX_BYTES = 262144;
    public static final class Event {
        public final long sequence, wallTime;
        public final String kind, message, source;
        public final int line, bytes;
        Event(long sequence, String kind, String message, String source, int line) {
            this.sequence=sequence;this.wallTime=System.currentTimeMillis();
            this.kind=clip(kind,64);this.message=clip(message,4096);this.source=clip(source,1024);this.line=line;
            this.bytes=utf8(this.kind)+utf8(this.message)+utf8(this.source)+64;
        }
    }
    private final List<Event> events = new ArrayList<Event>();
    private long sequence, dropped;
    private int bytes;
    static int utf8(String value) { return value.getBytes(StandardCharsets.UTF_8).length; }
    static String clip(String value, int maxBytes) {
        if(value==null)return "";
        int end=0,size=0;
        while(end<value.length()){
            int code=value.codePointAt(end),n=Character.charCount(code);
            int count=code<=0x7f?1:code<=0x7ff?2:code<=0xffff?3:4;
            if(size+count>maxBytes)break;
            size+=count;end+=n;
        }
        return value.substring(0,end);
    }
    public synchronized void add(String kind,String message,String source,int line) {
        Event e=new Event(++sequence,kind,message,source,line);
        while(!events.isEmpty()&&(events.size()>=MAX_EVENTS||bytes+e.bytes>MAX_BYTES)){
            bytes-=events.remove(0).bytes;++dropped;
        }
        events.add(e);bytes+=e.bytes;
    }
    public synchronized List<Event> snapshot(){return new ArrayList<Event>(events);}
    public synchronized long dropped(){return dropped;}
    public synchronized int bytes(){return bytes;}
}
