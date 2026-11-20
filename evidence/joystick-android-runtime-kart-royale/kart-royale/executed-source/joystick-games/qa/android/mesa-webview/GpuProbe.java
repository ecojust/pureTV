package org.puretv.qa.renderer;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public final class GpuProbe extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        WebView view = new WebView(this);
        setContentView(view);
        view.getSettings().setJavaScriptEnabled(true);
        view.addJavascriptInterface(this, "Probe");
        // A local document in the installed WebView provider, using the same WebGL API as the game.
        view.loadDataWithBaseURL("https://probe.invalid/",
            "<canvas id='test'></canvas><script>try {"
            + "const g=test.getContext('webgl2');const d=g&&g.getExtension('WEBGL_debug_renderer_info');"
            + "Probe.report(JSON.stringify({webgl2:!!g,version:g&&g.getParameter(g.VERSION),"
            + "renderer:d&&g.getParameter(d.UNMASKED_RENDERER_WEBGL),vendor:d&&g.getParameter(d.UNMASKED_VENDOR_WEBGL)}));"
            + "} catch(e) {Probe.report(JSON.stringify({error:String(e)}));}</script>",
            "text/html", "UTF-8", null);
    }

    @JavascriptInterface public void report(String result) {
        Log.i("PureTVGpuProbe", result);
    }
}
