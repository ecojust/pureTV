package com.ecojust.formatv;

import com.ecojust.launcher.shared.ConfirmHomeActivity;
import org.json.JSONObject;

/** User-confirmed app addition; the shell-only layout provider stays protected. */
public final class AddToHomeActivity extends ConfirmHomeActivity {
    @Override protected JSONObject readLayout() throws Exception {
        LauncherLayout value = LauncherLayout.override(this);
        java.io.File local = new java.io.File(getFilesDir(), "layout.json");
        java.io.File external = getExternalFilesDir(null);
        boolean saved = local.exists() || new java.io.File(local + ".bak").exists()
                || (external != null && new java.io.File(external, "layout.json").exists());
        if (saved && value == null) throw new IllegalStateException("Saved layout is invalid");
        if (value == null) value = LauncherLayout.defaults(this);
        return new JSONObject(value.json.toString());
    }
    @Override protected void writeLayout(JSONObject expected, JSONObject value) throws Exception {
        synchronized (LauncherLayout.class) {
            if (!readLayout().toString().equals(expected.toString())) throw new LayoutChangedException();
            LauncherLayout.apply(this, value);
        }
    }
    @Override protected void validateSvg(String value) throws Exception { UnifiedLayout.svg(value); }
    @Override protected String defaultSvg() { return UnifiedLayout.ICON; }
}
