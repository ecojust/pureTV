package com.ecojust.launcher.shared;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.List;

/** Public, user-confirmed request. Callers never receive general layout read/write access. */
public abstract class ConfirmHomeActivity extends Activity {
    public static final String ACTION = "com.ecojust.puretv.action.ADD_TO_HOME";
    public static final String EXTRA_PACKAGE = "packageName", EXTRA_SVG = "logoSvg";
    private String pkg, label, svg;
    private JSONObject layout;
    private List<Rect> slots = new ArrayList<>();
    private int selected;
    private Preview preview;
    private TextView status;
    private Button confirm;
    private boolean zh;
    private Drawable appIcon;
    private String failureReason;
    private String page = "home";
    private Button homePage, appsPage;

    protected abstract JSONObject readLayout() throws Exception;
    public static final class LayoutChangedException extends Exception {
        public LayoutChangedException() { super("The layout changed before saving"); }
    }
    protected abstract void writeLayout(JSONObject expected, JSONObject value) throws Exception;
    protected abstract void validateSvg(String value) throws Exception;
    protected abstract String defaultSvg();

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        zh = "zh".equals(getResources().getConfiguration().getLocales().get(0).getLanguage());
        setResult(RESULT_CANCELED, outcome("cancelled", "cancelled"));
        try {
            if (!ACTION.equals(getIntent().getAction())) { reject("invalid_request"); return; }
            pkg = getIntent().getStringExtra(EXTRA_PACKAGE);
            if (pkg == null || pkg.length() > 255 || !pkg.matches("[A-Za-z0-9_]+(\\.[A-Za-z0-9_]+)+")) { reject("invalid_app"); return; }
            if (!installedApp()) { reject("invalid_app"); return; }
            svg = getIntent().getStringExtra(EXTRA_SVG);
            if (svg == null || svg.isEmpty()) svg = defaultSvg();
            try { validateSvg(svg); } catch (Exception invalid) { reject("invalid_svg"); return; }
            layout = readLayout();
            if (layout == null || layout.optInt("version") != 5) { reject("unsupported_layout"); return; }
            if (duplicate(layout)) return;
            if (state != null && "apps".equals(state.getString("page"))) page = "apps";
            slots = HomePlacement.candidates(layout, page);
            if (slots.isEmpty() && page.equals("home")) {
                page = "apps";
                if (duplicate(layout)) return;
                slots = HomePlacement.candidates(layout, page);
            }
            if (slots.isEmpty()) { reject("no_space"); return; }
            selected = Math.min(slots.size() - 1, state == null ? 0 : Math.max(0, state.getInt("selected")));
            buildUi();
        } catch (Exception invalid) { reject("invalid_layout"); }
    }

    private boolean installedApp() {
        try {
            ApplicationInfo info = getPackageManager().getApplicationInfo(pkg, 0);
            if (!info.enabled || (info.flags & ApplicationInfo.FLAG_INSTALLED) == 0
                    || (info.flags & (ApplicationInfo.FLAG_SYSTEM | ApplicationInfo.FLAG_UPDATED_SYSTEM_APP)) != 0) return false;
            if (getPackageManager().getLeanbackLaunchIntentForPackage(pkg) == null
                    && getPackageManager().getLaunchIntentForPackage(pkg) == null) return false;
            label = getPackageManager().getApplicationLabel(info).toString().trim();
            if (label.isEmpty()) label = pkg;
            if (label.length() > 100) {
                int end = Character.isHighSurrogate(label.charAt(99)) ? 99 : 100;
                label = label.substring(0, end);
            }
            appIcon = getPackageManager().getApplicationIcon(info);
            return true;
        } catch (Exception unavailable) { return false; }
    }

    private Intent outcome(String result, String reason) {
        return new Intent().putExtra("result", result).putExtra("reason", reason).putExtra(EXTRA_PACKAGE, pkg).putExtra("page", page);
    }
    private void reject(String reason) { setResult(RESULT_CANCELED, outcome("rejected", reason)); finish(); }
    private boolean duplicate(JSONObject current) throws Exception {
        JSONObject existing = HomePlacement.find(current, page, pkg);
        if (existing == null) return false;
        reject(existing.getBoolean("visible") ? (page.equals("home") ? "already_present" : "already_in_apps") : (page.equals("home") ? "already_hidden" : "already_hidden_apps"));
        return true;
    }
    private String text(String chinese, String english) { return zh ? chinese : english; }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }

    private TextView textView(String value, int size, int color) {
        TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(color);
        return view;
    }
    private Button button(String value, String tag) {
        Button button = new Button(this); button.setId(View.generateViewId()); button.setTag(tag);
        button.setText(value); button.setTextSize(17); button.setAllCaps(false); button.setTextColor(Color.WHITE);
        StateListDrawable surface = new StateListDrawable();
        for (boolean focus : new boolean[]{true, false}) {
            GradientDrawable shape = new GradientDrawable(); shape.setCornerRadius(dp(12));
            shape.setColor(Color.rgb(focus ? 36 : 52, focus ? 108 : 77, focus ? 175 : 97));
            if (focus) shape.setStroke(dp(3), Color.rgb(128, 205, 255));
            surface.addState(focus ? new int[]{android.R.attr.state_focused} : new int[]{}, shape);
        }
        button.setBackground(surface);
        return button;
    }

    private void buildUi() {
        LinearLayout root = new LinearLayout(this); root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(28), dp(18), dp(28), dp(18)); root.setBackgroundColor(Color.rgb(240, 246, 250));
        root.addView(textView(text("添加到桌面 · ", "Add to Home · ") + label, 25, Color.rgb(24, 48, 68)));
        TextView instruction = textView(text("方向键选择空位，确定键进入确认。现有应用位置保持不变。",
                "Choose a free space with the arrow keys, then press OK to review the Add button."), 15, Color.rgb(69, 91, 107));
        instruction.setPadding(0, dp(4), 0, dp(8)); root.addView(instruction);
        LinearLayout pages = new LinearLayout(this);
        homePage = button(text("首页", "Home"), "page-home"); appsPage = button(text("应用页", "Apps"), "page-apps");
        LinearLayout.LayoutParams pageButton = new LinearLayout.LayoutParams(dp(160), dp(42)); pageButton.rightMargin = dp(10);
        pages.addView(homePage, pageButton); pages.addView(appsPage, new LinearLayout.LayoutParams(dp(160), dp(42))); root.addView(pages);
        homePage.setOnClickListener(v -> selectPage("home")); appsPage.setOnClickListener(v -> selectPage("apps"));
        preview = new Preview(); preview.setId(View.generateViewId()); preview.setTag("home-preview");
        preview.setFocusable(true); preview.setFocusableInTouchMode(true);
        root.addView(preview, new LinearLayout.LayoutParams(-1, 0, 1));
        status = textView("", 15, Color.rgb(42, 69, 87)); status.setTag("home-status");
        status.setPadding(0, dp(8), 0, dp(8)); root.addView(status);
        LinearLayout actions = new LinearLayout(this); actions.setOrientation(LinearLayout.HORIZONTAL);
        confirm = button(text("添加到这里", "Add here"), "home-confirm");
        Button cancel = button(text("取消", "Cancel"), "home-cancel");
        LinearLayout.LayoutParams buttonLayout = new LinearLayout.LayoutParams(dp(180), dp(48)); buttonLayout.rightMargin = dp(14);
        actions.addView(confirm, buttonLayout); actions.addView(cancel, new LinearLayout.LayoutParams(dp(130), dp(48)));
        root.addView(actions); setContentView(root);
        confirm.setOnClickListener(v -> save()); cancel.setOnClickListener(v -> cancel());
        confirm.setNextFocusUpId(preview.getId()); cancel.setNextFocusUpId(preview.getId());
        confirm.setNextFocusRightId(cancel.getId()); cancel.setNextFocusLeftId(confirm.getId());
        homePage.setNextFocusDownId(preview.getId()); appsPage.setNextFocusDownId(preview.getId());
        preview.setNextFocusDownId(confirm.getId());
        updateSelection(); preview.requestFocus();
        if (page.equals("apps")) status.setText(text("首页没有空位，请确认是否添加到应用页。", "Home is full. Confirm to add this app to the Apps page."));
    }

    private void selectPage(String target) {
        try {
            JSONObject latest = readLayout();
            if (HomePlacement.find(latest, target, pkg) != null) {
                status.setText(text("这个页面已经有该应用；隐藏的应用可在管理器中恢复显示。", "This page already has this app. Hidden tiles can be restored in the manager.")); return;
            }
            List<Rect> available = HomePlacement.candidates(latest, target);
            if (available.isEmpty()) { status.setText(text("这个页面没有空位，请选择另一个页面。", "This page has no free space. Choose the other page.")); return; }
            layout = latest; page = target; slots = available; selected = 0; updateSelection(); preview.requestFocus();
        } catch (Exception invalid) { status.setText(text("暂时无法读取布局。", "Cannot read the current layout.")); }
    }

    private void updateSelection() {
        String message = (page.equals("home") ? text("首页", "Home") : text("应用页", "Apps")) + " · " + text("空位 ", "Space ") + (selected + 1) + " / " + slots.size();
        status.setText(message); preview.setContentDescription(label + " · " + message); preview.invalidate();
        confirm.setText(page.equals("home") ? text("添加到首页", "Add to Home") : text("添加到应用页", "Add to Apps"));
        homePage.setText(page.equals("home") ? text("● 首页", "● Home") : text("首页", "Home"));
        appsPage.setText(page.equals("apps") ? text("● 应用页", "● Apps") : text("应用页", "Apps"));
    }

    private void save() {
        if (!installedApp()) { reject("invalid_app"); return; }
        try {
            // Re-read at confirmation: a desktop-manager edit while this screen is open must survive.
            JSONObject latest = readLayout();
            if (duplicate(latest)) return;
            Rect target = slots.get(selected);
            if (!HomePlacement.free(latest, page, target)) {
                layout = latest; slots = HomePlacement.candidates(latest, page); selected = 0;
                if (slots.isEmpty()) { reject("no_space"); return; }
                updateSelection(); status.setText(text("桌面已变化，请重新选择空位并确认。", "Home changed. Choose a free space and confirm again."));
                preview.requestFocus(); return;
            }
            JSONObject next = HomePlacement.append(latest, page, pkg, label, svg, target);
            writeLayout(latest, next);
            // A successful activity launch is not proof of a successful layout write.
            JSONObject saved = readLayout();
            JSONObject expected = HomePlacement.find(next, page, pkg), actual = HomePlacement.find(saved, page, pkg);
            if (actual == null || !expected.toString().equals(actual.toString())) { reject("save_failed"); return; }
            setResult(RESULT_OK, outcome("added", "added")); finish();
        } catch (LayoutChangedException changed) {
            selectPage(page);
            status.setText(text("桌面已变化，请重新选择空位并确认。", "Home changed. Choose a free space and confirm again."));
        } catch (Exception invalid) {
            // In particular, retain stale uninstalled blocks; do not silently delete someone else's edits.
            failureReason = "invalid_existing_layout";
            setResult(RESULT_CANCELED, outcome("rejected", failureReason));
            status.setText(text("未添加：现有布局无法保存，请在管理器中检查失效应用块或布局大小。",
                    "Not added. Check unavailable app tiles or the layout size in the desktop manager."));
            confirm.setEnabled(false); findViewById(android.R.id.content).findViewWithTag("home-cancel").requestFocus();
        }
    }

    private void cancel() {
        setResult(RESULT_CANCELED, failureReason == null ? outcome("cancelled", "cancelled") : outcome("rejected", failureReason)); finish();
    }
    @Override public void onBackPressed() { cancel(); }
    @Override protected void onSaveInstanceState(Bundle out) { out.putInt("selected", selected); out.putString("page", page); super.onSaveInstanceState(out); }

    private final class Preview extends View {
        final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        Preview() { super(ConfirmHomeActivity.this); setOnFocusChangeListener((view, focused) -> invalidate()); }
        @Override public boolean onKeyDown(int key, KeyEvent event) {
            if (key == KeyEvent.KEYCODE_DPAD_CENTER || key == KeyEvent.KEYCODE_ENTER || key == KeyEvent.KEYCODE_NUMPAD_ENTER) {
                confirm.requestFocus(); return true;
            }
            int dx = key == KeyEvent.KEYCODE_DPAD_RIGHT ? 1 : key == KeyEvent.KEYCODE_DPAD_LEFT ? -1 : 0;
            int dy = key == KeyEvent.KEYCODE_DPAD_DOWN ? 1 : key == KeyEvent.KEYCODE_DPAD_UP ? -1 : 0;
            if (dx == 0 && dy == 0) return super.onKeyDown(key, event);
            Rect current = slots.get(selected); double score = Double.MAX_VALUE; int next = -1;
            for (int i = 0; i < slots.size(); i++) {
                Rect candidate = slots.get(i); int x = candidate.centerX() - current.centerX(), y = candidate.centerY() - current.centerY();
                int along = dx * x + dy * y, across = dx == 0 ? Math.abs(x) : Math.abs(y);
                double distance = along + across * 3.0;
                if (along > 0 && distance < score) { score = distance; next = i; }
            }
            if (next >= 0) { selected = next; updateSelection(); }
            else if (dy > 0) confirm.requestFocus();
            else if (dy < 0) (page.equals("home") ? homePage : appsPage).requestFocus();
            return true;
        }
        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            try {
                JSONObject screen = layout.getJSONObject("screen");
                float scale = Math.min(getWidth() / (float)screen.getInt("width"), getHeight() / (float)screen.getInt("height"));
                float left = (getWidth() - screen.getInt("width") * scale) / 2, top = (getHeight() - screen.getInt("height") * scale) / 2;
                canvas.save(); canvas.translate(left, top); canvas.scale(scale, scale);
                paint.setColor(Color.parseColor(layout.getJSONObject(page).getJSONObject("background").getString("color")));
                canvas.drawRect(0, 0, screen.getInt("width"), screen.getInt("height"), paint);
                JSONObject home = layout.getJSONObject(page);
                for (String kind : new String[]{"system", "users"}) {
                    JSONArray nodes = home.getJSONArray(kind);
                    for (int i = 0; i < nodes.length(); i++) {
                        JSONObject node = nodes.getJSONObject(i); if (!node.getBoolean("visible")) continue;
                        Rect rect = HomePlacement.frame(node); paint.setColor(Color.rgb(75, 89, 102));
                        canvas.drawRoundRect(new RectF(rect), 8, 8, paint);
                        canvas.save(); canvas.clipRect(rect); paint.setColor(Color.WHITE); paint.setTextSize(16);
                        canvas.drawText(node.optString("text", node.optString("name")), rect.left + 8, rect.top + 22, paint); canvas.restore();
                    }
                }
                for (int i = 0; i < slots.size(); i++) {
                    Rect rect = slots.get(i); paint.setColor(i == selected ? Color.rgb(36, 108, 175) : Color.argb(100, 103, 169, 205));
                    canvas.drawRoundRect(new RectF(rect), 8, 8, paint);
                    if (i == selected) {
                        paint.setStyle(Paint.Style.STROKE); paint.setStrokeWidth(isFocused() ? 5 : 3); paint.setColor(Color.WHITE);
                        canvas.drawRoundRect(new RectF(rect), 8, 8, paint); paint.setStyle(Paint.Style.FILL);
                        int iconSize = Math.min(rect.width() / 3, rect.height() / 2);
                        if (appIcon != null) { appIcon.setBounds(rect.centerX() - iconSize / 2, rect.top + 8, rect.centerX() + iconSize / 2, rect.top + 8 + iconSize); appIcon.draw(canvas); }
                        canvas.save(); canvas.clipRect(rect); paint.setTextSize(16); paint.setColor(Color.WHITE);
                        canvas.drawText(label, rect.left + 8, rect.bottom - 12, paint); canvas.restore();
                    }
                }
                canvas.restore();
            } catch (Exception invalid) { /* Keep controls usable if the preview cannot be painted. */ }
        }
    }
}
