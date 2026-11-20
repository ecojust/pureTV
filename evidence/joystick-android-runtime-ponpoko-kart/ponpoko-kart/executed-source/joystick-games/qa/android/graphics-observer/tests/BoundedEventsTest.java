package com.ecojust.graphicsqa;

import java.util.List;

public final class BoundedEventsTest {
    static int checks;
    static void check(boolean value){++checks;if(!value)throw new AssertionError("check "+checks);}
    public static void main(String[] args){
        BoundedEvents ring=new BoundedEvents();
        ring.add("console-ERROR","first","asset.js",17);
        List<BoundedEvents.Event> first=ring.snapshot();check(first.size()==1&&first.get(0).line==17);first.clear();check(ring.snapshot().size()==1);
        for(int i=0;i<300;i++)ring.add("console-WARNING","entry "+i,"asset.js",i);
        List<BoundedEvents.Event> rows=ring.snapshot();check(rows.size()==256);check(ring.dropped()==45);check(rows.get(0).sequence==46);check(rows.get(255).sequence==301);
        StringBuilder large=new StringBuilder();for(int i=0;i<5000;i++)large.append("\ud83d\ude80");
        for(int i=0;i<300;i++)ring.add("console-ERROR",large.toString(),large.toString(),-1);
        check(ring.bytes()<=BoundedEvents.MAX_BYTES);check(ring.snapshot().size()<256);
        for(BoundedEvents.Event e:ring.snapshot()){check(BoundedEvents.utf8(e.message)<=4096);check(BoundedEvents.utf8(e.source)<=1024);check(!Character.isHighSurrogate(e.message.charAt(e.message.length()-1)));}
        check(BoundedEvents.clip(null,20).equals(""));check(BoundedEvents.clip("abc",2).equals("ab"));check(BoundedEvents.clip("\ud83d\ude80",3).equals(""));
        System.out.println("BoundedEvents actual Java checks: "+checks);
    }
}
