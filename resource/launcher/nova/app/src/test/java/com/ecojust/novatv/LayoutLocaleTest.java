package com.ecojust.novatv;

import android.content.Context;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class)
@Config(sdk=28,qualifiers="zh-rCN-w960dp-h540dp-land-xhdpi")
public class LayoutLocaleTest {
    private Locale previous;
    static Context ctx(){return RuntimeEnvironment.getApplication();}
    private static void language(String qualifier,Locale locale){Locale.setDefault(locale);RuntimeEnvironment.setQualifiers(qualifier+"-w960dp-h540dp-land-xhdpi");}
    @Before public void setup(){previous=Locale.getDefault();language("zh-rCN",Locale.SIMPLIFIED_CHINESE);LauncherLayout.reset(ctx());EnglishLayoutPreviewTest.install("com.example.localeapp","Example app");}
    @After public void cleanup(){LauncherLayout.reset(ctx());Locale.setDefault(previous);}
    private static JSONObject status()throws Exception{
        LauncherLayoutProvider provider=Robolectric.buildContentProvider(LauncherLayoutProvider.class).create().get();
        String encoded=provider.call("status",null,null).getString("result");return new JSONObject(new String(android.util.Base64.decode(encoded,android.util.Base64.NO_WRAP),StandardCharsets.UTF_8));
    }
    private static void preserved(JSONObject saved,JSONObject actual)throws Exception{
        assertEquals(saved.getJSONObject("screen").toString(),actual.getJSONObject("screen").toString());
        for(String page:new String[]{"home","apps"})for(String key:new String[]{"users","background","navigation"})assertEquals(page+"."+key,saved.getJSONObject(page).get(key).toString(),actual.getJSONObject(page).get(key).toString());
        JSONObject canonical=LauncherLayout.template(ctx()).json;UnifiedLayout.locked(actual,canonical);
        JSONObject response=status();assertTrue(response.getBoolean("custom"));
        for(String page:new String[]{"home","apps"})assertEquals(canonical.getJSONObject(page).getJSONArray("system").toString(),response.getJSONObject("systemBasis").getJSONArray(page).toString());
    }
    @Test public void localeRoundTripPreservesCustomLayoutAndCanonicalSystemBasis()throws Exception{
        JSONObject original=LauncherLayout.defaults(ctx()).json;JSONObject app=original.getJSONObject("home").getJSONArray("users").getJSONObject(0);
        app.put("name","Pinned choice").put("text","Pinned choice").put("textColor","#CCDDEE").put("iconColor","#44AA77").put("backgroundColor","#122334");
        app.put("frame",new JSONObject().put("x",120).put("y",280).put("width",180).put("height",140));
        original.getJSONObject("home").put("background",new JSONObject().put("color","#123456")).put("navigation",new JSONObject());
        LauncherLayout.apply(ctx(),original);JSONObject saved=new JSONObject(original.toString());
        language("en-rUS",Locale.US);assertNotNull(LauncherLayout.override(ctx()));preserved(saved,LauncherLayout.override(ctx()).json);
        assertFalse(LauncherLayout.template(ctx()).json.getJSONObject("home").getJSONArray("system").toString().matches("(?s).*\\p{IsHan}.*"));
        // A known Chinese template submitted after a locale change is safely normalized on save.
        LauncherLayout.apply(ctx(),saved);preserved(saved,LauncherLayout.override(ctx()).json);
        JSONObject english=LauncherLayout.override(ctx()).json;
        for(String changed:new String[]{"text","action","frame"}){
            JSONObject bad=new JSONObject(english.toString());JSONObject system=bad.getJSONObject("home").getJSONArray("system").getJSONObject(0);
            if(changed.equals("frame"))system.getJSONObject("frame").put("x",system.getJSONObject("frame").getInt("x")+1);
            else system.put(changed,changed.equals("action")?"com.example.unauthorized":"Unauthorized system label");
            try{LauncherLayout.apply(ctx(),bad);fail("System "+changed+" must stay immutable");}catch(IllegalArgumentException expected){}
        }
        preserved(saved,LauncherLayout.override(ctx()).json);
        language("zh-rCN",Locale.SIMPLIFIED_CHINESE);assertNotNull(LauncherLayout.override(ctx()));preserved(saved,LauncherLayout.override(ctx()).json);
        LauncherLayout.apply(ctx(),english);preserved(saved,LauncherLayout.override(ctx()).json);
    }
    @Test public void englishDefaultsKeepHundredLongNamedAppsWithinV5Budget()throws Exception{
        language("en-rUS",Locale.US);
        for(int i=0;i<100;i++)EnglishLayoutPreviewTest.install("com.example.catalogue.app"+i,"电视应用长名称".repeat(20)+i);
        JSONObject defaults=LauncherLayout.defaults(ctx()).json;assertEquals(100,defaults.getJSONObject("apps").getJSONArray("users").length());
        assertTrue(defaults.toString().getBytes(StandardCharsets.UTF_8).length<=LauncherLayout.LIMIT);LauncherLayout.apply(ctx(),defaults);
        assertEquals(100,status().getJSONObject("layout").getJSONObject("apps").getJSONArray("users").length());
    }
}
