package com.ecojust.graphicsqa;

import java.io.BufferedReader;
import java.io.StringReader;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

/** Executes the actual pure header parser only; does not simulate Android/WebView. */
public final class HeaderBudgetTest {
    public static void main(String[] args) throws Exception {
        Method parser=GraphicsObserver.class.getDeclaredMethod("headerLine",BufferedReader.class,int[].class);
        parser.setAccessible(true);
        BufferedReader input=new BufferedReader(new StringReader("GET /graphics HTTP/1.1\r\nHost: localhost\r\n\r\n"));
        int[] remaining={8192};
        if(!"GET /graphics HTTP/1.1".equals(parser.invoke(null,input,remaining)))throw new AssertionError();
        if(!"Host: localhost".equals(parser.invoke(null,input,remaining)))throw new AssertionError();
        if(!"".equals(parser.invoke(null,input,remaining)))throw new AssertionError();
        if(remaining[0]!=8192-43)throw new AssertionError("actual header count "+remaining[0]);
        StringBuilder big=new StringBuilder();for(int i=0;i<8193;i++)big.append('x');
        try{parser.invoke(null,new BufferedReader(new StringReader(big.toString())),new int[]{8192});throw new AssertionError("overbudget line accepted");}
        catch(InvocationTargetException error){if(!(error.getCause() instanceof IllegalArgumentException))throw error;}
        if(parser.invoke(null,new BufferedReader(new StringReader("")),new int[]{8192})!=null)throw new AssertionError();
        Method timed=GraphicsObserver.class.getDeclaredMethod("headerLine",BufferedReader.class,int[].class,long.class);timed.setAccessible(true);
        try{timed.invoke(null,new BufferedReader(new StringReader("GET /status HTTP/1.1\n")),new int[]{8192},0L);throw new AssertionError("expired deadline accepted");}
        catch(InvocationTargetException error){if(!(error.getCause() instanceof IllegalArgumentException))throw error;}
        System.out.println("Actual Java header parser: CRLF/empty/EOF/shared byte budget/oversized line/expired absolute deadline passed");
    }
}
