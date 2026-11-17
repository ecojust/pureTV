package com.ecojust.operatv;

import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=19)
public class OperaItemTest {
    @Test public void stableIdentitySurvivesTitleChangesAndPersistence() throws Exception {
        OperaItem item = OperaItem.direct("  我的\n戏曲  ", "https://example.com/video.mp4", "片单");
        OperaItem renamed = OperaItem.direct("New title", item.uri, "Different group");
        assertEquals(item.id, renamed.id); assertEquals(64, item.id.length());
        assertEquals("我的 戏曲", item.title);
        OperaItem restored = OperaItem.fromJson(item.toJson());
        assertEquals(item.id, restored.id); assertEquals(item.uri, restored.uri);
        assertEquals(item.title, restored.title); assertEquals("direct", restored.kind);
    }
    @Test public void safDocumentReferencesRemainContentUris() throws Exception {
        OperaItem item = OperaItem.direct("Local video", "content://com.example.documents/document/123", "Local");
        assertEquals("document", item.kind);
        assertEquals(item.uri, OperaItem.fromJson(item.toJson()).uri);
    }
    @Test public void cctvIdentityUsesValidatedGuidAndOfficialPage() throws Exception {
        String guid = "d5198f0ae8834a03b4dc6d95628d1cc6";
        OperaItem item = new OperaItem("cctv:" + guid,"节目","栏目","","cctv",guid,
                "https://tv.cctv.com/2019/11/24/example.shtml");
        assertEquals("cctv:" + guid, OperaItem.fromJson(item.toJson()).id);
        try { new OperaItem("arbitrary", "节目", "", "", "cctv", guid, ""); fail(); }
        catch (IllegalArgumentException expected) { assertTrue(expected.getMessage().contains("ID")); }
    }
    @Test public void rejectsExecutableFilesystemCredentialAndMalformedUris() {
        String[] invalid = {"javascript:alert(1)","file:///etc/passwd","data:text/plain,anything","ftp://example.com/a",
                "https://user:password@example.com/a","http://example.com:0/a","http://example.com:70000/a",
                "https://example.com/\nInjected","content:///no-authority","content://user@provider/a"};
        for (String uri : invalid) {
            try { OperaItem.direct("Test",uri,""); fail(uri); }
            catch (IllegalArgumentException expected) { assertNotNull(expected.getMessage()); }
        }
    }
    @Test public void rejectsCorruptedPersistedItemsInsteadOfCoercingObjectsOrIdentity() throws Exception {
        JSONObject value = OperaItem.direct("Test","http://192.168.1.9/video.mp4","").toJson();
        value.put("title",new JSONObject().put("unexpected",true));
        rejectsJson(value);
        value = OperaItem.direct("Test","https://example.com/a","").toJson();
        value.put("id","forged"); rejectsJson(value);
        value.remove("id"); rejectsJson(value);
    }
    @Test public void limitsTextAndAddresses() {
        try { OperaItem.direct(new String(new char[241]).replace('\0','x'),"https://example.com/a",""); fail(); }
        catch (IllegalArgumentException expected) { }
        try { OperaItem.direct("Test","https://example.com/"+new String(new char[8192]).replace('\0','x'),""); fail(); }
        catch (IllegalArgumentException expected) { }
    }
    private void rejectsJson(JSONObject value) throws Exception {
        try { OperaItem.fromJson(value); fail(); } catch (JSONException expected) { assertNotNull(expected.getMessage()); }
    }
}
