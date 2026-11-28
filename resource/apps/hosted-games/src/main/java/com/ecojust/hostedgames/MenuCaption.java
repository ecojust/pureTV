package com.ecojust.hostedgames;

import android.os.Handler;
import android.os.Looper;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.TextView;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Render our own glossary under the game. Never send a Java interface or room token to the page. */
final class MenuCaption implements AutoCloseable {
    private final Handler main = new Handler(Looper.getMainLooper());
    private final WebView web;
    private final HostedInput input;
    private final TextView caption;
    private final JSONArray terms;
    private final String labels;
    private boolean active, closed;
    private int generation;

    MenuCaption(FrameLayout layer, WebView web, HostedInput input, Game game) {
        this.web = web;
        this.input = input;
        terms = game.guide.optJSONArray("terms");
        JSONArray labelsJson = new JSONArray();
        for (int i = 0; terms != null && i < terms.length(); i++) {
            labelsJson.put(terms.optJSONObject(i).optString("label").toUpperCase(Locale.ROOT));
        }
        labels = labelsJson.toString();
        caption = new TextView(web.getContext());
        caption.setTextColor(0xfff5ffff);
        caption.setBackgroundColor(0xe61b3137);
        caption.setTextSize(16);
        int pad = Math.round(8 * web.getResources().getDisplayMetrics().density);
        caption.setPadding(pad, pad / 2, pad, pad / 2);
        caption.setVisibility(View.GONE);
        layer.addView(caption, new FrameLayout.LayoutParams(-2, -2, Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL));
    }

    void setActive(boolean active) {
        if (closed || this.active == active) return;
        this.active = active;
        generation++;
        main.removeCallbacks(check);
        caption.setVisibility(View.GONE);
        if (active && terms != null) main.post(check);
    }

    private final Runnable check = new Runnable() {
        @Override public void run() {
            if (!active) return;
            float x = input.cursorX(), y = input.cursorY();
            int width = web.getWidth(), height = web.getHeight();
            if (x < 0 || y < 0 || width == 0 || height == 0) {
                caption.setVisibility(View.GONE);
                main.postDelayed(this, 350);
                return;
            }
            int epoch = generation;
            // Return a bounded index only; text, attributes and account details stay in the page.
            String lookup = "(function(){const labels=" + labels
                    + ";let e=document.elementFromPoint(innerWidth*" + (x / width)
                    + ",innerHeight*" + (y / height) + ");"
                    + "for(let n=0;e&&n<3&&e!==document.body;n++,e=e.parentElement){"
                    + "const values=[e.getAttribute('aria-label'),e.getAttribute('title')];"
                    + "if(e.childElementCount<4&&e.childNodes.length<8)values.push(e.innerText);"
                    + "for(const v of values){if(!v||v.length>100)continue;"
                    + "const i=labels.indexOf(v.trim().replace(/\\s+/g,' ').toUpperCase());if(i>=0)return i;}}return -1;})()";
            web.evaluateJavascript(lookup, result -> {
                if (generation != epoch || closed) return;
                int index = -1;
                try { index = Integer.parseInt(result); } catch (NumberFormatException ignored) { }
                JSONObject match = terms.optJSONObject(index);
                if (match == null) caption.setVisibility(View.GONE);
                else {
                    String text = match.optString("label") + "  ·  " + match.optString("zh");
                    if (!text.contentEquals(caption.getText())) caption.setText(text);
                    FrameLayout.LayoutParams position = (FrameLayout.LayoutParams) caption.getLayoutParams();
                    int gravity = (y > height * .72f ? Gravity.TOP : Gravity.BOTTOM) | Gravity.CENTER_HORIZONTAL;
                    if (position.gravity != gravity) { position.gravity = gravity; caption.setLayoutParams(position); }
                    caption.setVisibility(View.VISIBLE);
                }
                main.postDelayed(this, 350);
            });
        }
    };

    @Override public void close() {
        setActive(false);
        closed = true;
    }
}
