package com.ecojust.hostedgames;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.pm.ApplicationInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Bundle;
import android.os.Handler;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.webkit.RenderProcessGoneDetail;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.common.BitMatrix;
import java.io.IOException;
import java.util.List;
import org.json.JSONException;

public final class MainActivity extends Activity {
    private static final int BACKGROUND = Color.rgb(16, 28, 34);
    private static final int FOREGROUND = Color.rgb(238, 245, 245);
    private static final int MUTED = Color.rgb(168, 194, 199);
    private final Handler main = new Handler(android.os.Looper.getMainLooper());
    private FrameLayout root;
    private List<Game> games;
    private Game game;
    private String selection;
    private WebView web;
    private TextView loading;
    private HostedInput input;
    private AlertDialog helpDialog;
    private HostedControllerRoom room;
    private HostedLobbyInput lobby;
    private MenuCaption caption;
    private int pendingAction = -1;
    private boolean resumed;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        root = new FrameLayout(this);
        root.setBackgroundColor(BACKGROUND);
        setContentView(root);
        try {
            games = Game.load(this);
        } catch (IOException | JSONException badCatalog) {
            root.addView(label("游戏列表无法读取，请重新安装应用。", 22, FOREGROUND));
            return;
        }
        room = new HostedControllerRoom(getApplicationContext());
        lobby = new HostedLobbyInput(room, this::navigate);
        if (games.size() == 1) {
            play(games.get(0));
            return;
        }
        selection = state == null ? games.get(0).id : state.getString("selection", games.get(0).id);
        if (state != null && state.getBoolean("playing")) {
            for (Game item : games) if (item.id.equals(selection)) {
                play(item);
                return;
            }
        }
        showCatalog();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private TextView label(String text, int size, int color) {
        TextView view = new TextView(this);
        view.setText(text);
        view.setTextColor(color);
        view.setTextSize(size);
        return view;
    }

    private LinearLayout panel(int padding) {
        LinearLayout view = new LinearLayout(this);
        view.setOrientation(LinearLayout.VERTICAL);
        view.setPadding(dp(padding), dp(padding), dp(padding), dp(padding));
        return view;
    }

    private Button button(String text, Runnable action) {
        Button button = new Button(this);
        button.setText(text);
        button.setAllCaps(false);
        button.setFocusableInTouchMode(true);
        button.setOnClickListener(view -> action.run());
        return button;
    }

    private String exitLabel() {
        return games.size() == 1 ? "退出游戏" : "返回游戏列表";
    }

    private void leaveGame() {
        if (games.size() == 1) finish();
        else showCatalog();
    }

    private void showCatalog() {
        closePlayer();
        game = null;
        LinearLayout library = panel(24);
        root.addView(library);
        library.addView(label("pureTV 在线游戏", 28, FOREGROUND));
        LinearLayout columns = new LinearLayout(this);
        library.addView(columns, new LinearLayout.LayoutParams(-1, 0, 1f));
        ScrollView list = new ScrollView(this);
        columns.addView(list, new LinearLayout.LayoutParams(0, -1, 1f));
        LinearLayout buttons = panel(4);
        list.addView(buttons);
        ScrollView preview = new ScrollView(this);
        columns.addView(preview, new LinearLayout.LayoutParams(0, -1, 1.3f));
        LinearLayout detail = panel(16);
        preview.addView(detail);
        TextView title = label("", 22, FOREGROUND);
        TextView original = label("", 14, MUTED);
        TextView instructions = label("", 17, FOREGROUND);
        instructions.setPadding(0, dp(14), 0, 0);
        detail.addView(title);
        detail.addView(original);
        detail.addView(instructions);
        detail.addView(new ConnectionPanel());
        Button selected = null;
        for (Game item : games) {
            Button entry = button(item.title, () -> play(item));
            entry.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            buttons.addView(entry, new LinearLayout.LayoutParams(-1, -2));
            Runnable describe = () -> {
                selection = item.id;
                title.setText(item.title);
                original.setText(item.originalTitle);
                instructions.setText(item.controls + "\n\n按确定键开始，游戏中按返回键查看手柄操作和原文对照。");
                preview.scrollTo(0, 0);
            };
            if (selection.equals(item.id)) {
                describe.run();
                selected = entry;
            }
            entry.setOnFocusChangeListener((view, focused) -> { if (focused) describe.run(); });
        }
        if (selected != null) selected.requestFocus();
        syncInput();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void play(Game selected) {
        closePlayer();
        game = selected;
        selection = selected.id;
        try {
            web = new WebView(this);
        } catch (RuntimeException unavailable) {
            showError("系统 WebView 无法启动，请在电视上更新 Android System WebView 后重试。");
            return;
        }
        WebView.setWebContentsDebuggingEnabled((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.setBackgroundColor(BACKGROUND);
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new PlayerClient(selected));
        root.addView(web);
        loading = label("正在打开" + selected.title + "…", 18, FOREGROUND);
        loading.setBackgroundColor(BACKGROUND);
        root.addView(loading, new FrameLayout.LayoutParams(-2, -2, Gravity.TOP | Gravity.CENTER_HORIZONTAL));
        input = new HostedInput(this, root, web, selected.id, this::toggleHelp, room);
        caption = new MenuCaption(root, web, input, selected);
        web.requestFocus();
        web.loadUrl(selected.url.toString());
        syncInput();
    }

    private final class PlayerClient extends WebViewClient {
        private final Game source;
        PlayerClient(Game game) { source = game; }

        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            if (request.isForMainFrame() && !source.owns(request.getUrl())) {
                Toast.makeText(MainActivity.this, "请在游戏作者站点内游玩", Toast.LENGTH_SHORT).show();
                return true;
            }
            return false;
        }

        @Override public void onPageStarted(WebView view, String url, Bitmap favicon) {
            checkAuthor(view, url);
        }

        @Override public void onPageCommitVisible(WebView view, String url) {
            checkAuthor(view, url);
        }

        private void checkAuthor(WebView view, String url) {
            if (view != web || (url != null && source.owns(android.net.Uri.parse(url)))) return;
            // Some top-level navigations (e.g. form POST) skip shouldOverrideUrlLoading.
            view.setVisibility(View.INVISIBLE);
            view.stopLoading();
            failAfterCallback(view, "游戏离开了作者站点，可重新进入。");
        }

        @Override public void onPageFinished(WebView view, String url) {
            if (view == web && loading != null) loading.setVisibility(View.GONE);
        }

        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (request.isForMainFrame()) failAfterCallback(view, "请检查电视网络，或稍后再试。");
        }

        @Override public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse response) {
            if (request.isForMainFrame()) failAfterCallback(view, "作者网站返回 HTTP " + response.getStatusCode() + "。");
        }

        @Override public boolean onRenderProcessGone(WebView view, RenderProcessGoneDetail detail) {
            failAfterCallback(view, "系统已结束游戏画面，请重新加载。");
            return true;
        }

        private void failAfterCallback(WebView sender, String detail) {
            main.post(() -> { if (sender == web) showError(detail); });
        }
    }

    private void showError(String detail) {
        closePlayer();
        LinearLayout panel = panel(24);
        panel.setGravity(Gravity.CENTER);
        root.addView(panel);
        panel.addView(label("游戏加载失败", 24, FOREGROUND));
        panel.addView(label(detail, 18, MUTED));
        Button retry = button("重试", () -> play(game));
        panel.addView(retry);
        panel.addView(button(exitLabel(), this::leaveGame));
        retry.requestFocus();
        syncInput();
    }

    private void toggleHelp() {
        if (!resumed || input == null) return;
        if (helpDialog != null) {
            helpDialog.dismiss();
            return;
        }
        LinearLayout layout = new LinearLayout(this);
        layout.setPadding(dp(12), dp(4), dp(12), 0);
        ScrollView scroll = new ScrollView(this);
        LinearLayout text = panel(6);
        scroll.addView(text);
        layout.addView(scroll, new LinearLayout.LayoutParams(0, -1, 1.6f));
        TextView mapping = label(input.help(), 17, FOREGROUND);
        text.addView(mapping);
        if (input.canSwitchMode()) {
            Button switcher = new Button(this);
            switcher.setAllCaps(false);
            switcher.setText("切换操作模式 · " + input.modeLabel());
            switcher.setOnClickListener(view -> {
                input.toggleMode();
                switcher.setText("切换操作模式 · " + input.modeLabel());
                mapping.setText(input.help());
            });
            text.addView(switcher);
        }
        String[] actions = input.auxActions();
        for (int i = 0; i < actions.length; i++) {
            int index = i;
            text.addView(button(actions[i], () -> {
                pendingAction = index;
                helpDialog.dismiss();
            }));
        }
        TextView guide = label(game.instructions(), 16, FOREGROUND);
        guide.setPadding(0, dp(10), 0, 0);
        text.addView(guide);
        layout.addView(new ConnectionPanel(), new LinearLayout.LayoutParams(0, -1, 1f));
        helpDialog = new AlertDialog.Builder(this)
                .setTitle(game.title + " · 操作说明").setView(layout)
                .setPositiveButton("继续游戏", null)
                .setNeutralButton("重新加载", (dialog, which) -> play(game))
                .setNegativeButton(exitLabel(), (dialog, which) -> leaveGame()).create();
        AlertDialog shown = helpDialog;
        shown.setOnKeyListener((dialog, code, event) -> {
            if (code != KeyEvent.KEYCODE_BUTTON_START && code != KeyEvent.KEYCODE_MENU) return false;
            if (event.getAction() == KeyEvent.ACTION_UP) dialog.dismiss();
            return true;
        });
        shown.setOnDismissListener(dialog -> {
            if (shown != helpDialog) return;
            helpDialog = null;
            if (web != null) web.requestFocus();
            syncInput();
        });
        shown.show();
        android.view.Window window = shown.getWindow();
        if (window != null) {
            window.setLayout(Math.min(dp(820), root.getWidth()), Math.min(dp(460), root.getHeight()));
            window.getDecorView().getViewTreeObserver().addOnWindowFocusChangeListener(focused -> syncInput());
        }
        shown.getButton(AlertDialog.BUTTON_POSITIVE).requestFocus();
        syncInput();
    }

    private final class ConnectionPanel extends LinearLayout implements Runnable {
        private final ImageView qr = new ImageView(MainActivity.this);
        private final TextView status = label("", 14, MUTED);
        private String lastUrl;

        ConnectionPanel() {
            super(MainActivity.this);
            setOrientation(VERTICAL);
            setPadding(dp(6), dp(8), dp(6), 0);
            addView(label("同一 Wi-Fi 下扫码连接手柄", 16, FOREGROUND));
            qr.setContentDescription("手机手柄二维码");
            addView(qr, new LinearLayout.LayoutParams(-1, dp(96)));
            addView(status);
        }

        @Override public void run() {
            String url = room.phoneUrl();
            if (!java.util.Objects.equals(url, lastUrl)) {
                qr.setImageBitmap(qrImage(url));
                qr.setVisibility(url.isEmpty() ? GONE : VISIBLE);
                lastUrl = url;
            }
            String value = room.status() + (url.isEmpty() ? "" : "\n" + url);
            if (!value.contentEquals(status.getText())) status.setText(value);
            postDelayed(this, 1000);
        }

        @Override protected void onWindowVisibilityChanged(int visibility) {
            super.onWindowVisibilityChanged(visibility);
            removeCallbacks(this);
            if (visibility == VISIBLE && isAttachedToWindow()) post(this);
        }

        @Override protected void onAttachedToWindow() {
            super.onAttachedToWindow();
            removeCallbacks(this);
            post(this);
        }

        @Override protected void onDetachedFromWindow() {
            removeCallbacks(this);
            super.onDetachedFromWindow();
        }
    }

    private Bitmap qrImage(String url) {
        if (url == null || url.isEmpty()) return null;
        try {
            int size = 240;
            BitMatrix matrix = new MultiFormatWriter().encode(url, BarcodeFormat.QR_CODE, size, size);
            int[] pixels = new int[size * size];
            for (int y = 0; y < size; y++) for (int x = 0; x < size; x++) {
                pixels[y * size + x] = matrix.get(x, y) ? Color.BLACK : Color.WHITE;
            }
            return Bitmap.createBitmap(pixels, size, size, Bitmap.Config.ARGB_8888);
        } catch (WriterException badUrl) {
            return null;
        }
    }

    private void navigate(int key) {
        if (key == KeyEvent.KEYCODE_BACK || key == KeyEvent.KEYCODE_BUTTON_START) {
            if (helpDialog != null) helpDialog.dismiss();
            else if (key == KeyEvent.KEYCODE_BACK) onBackPressed();
            return;
        }
        View panel = helpDialog == null ? root : helpDialog.getWindow().getDecorView();
        View focused = panel.findFocus();
        if (focused == null) return;
        if (key == KeyEvent.KEYCODE_DPAD_CENTER) {
            if (focused.isEnabled()) focused.performClick();
            return;
        }
        // LAN events arrive on the UI thread without ViewRootImpl's physical D-pad focus traversal.
        int direction;
        switch (key) {
            case KeyEvent.KEYCODE_DPAD_LEFT: direction = View.FOCUS_LEFT; break;
            case KeyEvent.KEYCODE_DPAD_RIGHT: direction = View.FOCUS_RIGHT; break;
            case KeyEvent.KEYCODE_DPAD_UP: direction = View.FOCUS_UP; break;
            case KeyEvent.KEYCODE_DPAD_DOWN: direction = View.FOCUS_DOWN; break;
            default: return;
        }
        View next = focused.focusSearch(direction);
        if (next != null && next != focused && next.requestFocus(direction)) return;
        if (focused instanceof ScrollView && (direction == View.FOCUS_UP || direction == View.FOCUS_DOWN)) {
            ((ScrollView) focused).pageScroll(direction);
        }
    }

    private void syncInput() {
        boolean playing = resumed && hasWindowFocus() && helpDialog == null && input != null;
        boolean helping = resumed && helpDialog != null && helpDialog.getWindow() != null
                && helpDialog.getWindow().getDecorView().hasWindowFocus();
        if (lobby != null) lobby.setActive(helping || (resumed && hasWindowFocus() && input == null));
        if (input != null) input.setActive(playing);
        if (web != null) web.setKeepScreenOn(playing);
        if (caption != null) caption.setActive(playing);
        if (playing && pendingAction >= 0) {
            int index = pendingAction;
            pendingAction = -1;
            input.tapAux(index);
        }
    }

    @Override public void onWindowFocusChanged(boolean focus) { super.onWindowFocusChanged(focus); syncInput(); }

    @Override public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if (input != null && (code == KeyEvent.KEYCODE_MENU || code == KeyEvent.KEYCODE_BUTTON_START)) {
            if (event.getAction() == KeyEvent.ACTION_UP) toggleHelp();
            return true;
        }
        if (helpDialog == null && input != null && input.key(event)) return true;
        return super.dispatchKeyEvent(event);
    }

    @Override public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (helpDialog == null && input != null && input.motion(event)) return true;
        return super.dispatchGenericMotionEvent(event);
    }

    @Override public void onBackPressed() {
        if (web != null) toggleHelp();
        else if (game != null) leaveGame();
        else super.onBackPressed();
    }

    private void closePlayer() {
        AlertDialog dialog = helpDialog;
        helpDialog = null;
        if (dialog != null) dialog.dismiss();
        if (caption != null) {
            caption.close();
            caption = null;
        }
        pendingAction = -1;
        if (input != null) {
            input.close();
            input = null;
        }
        root.removeAllViews();
        if (web != null) {
            web.destroy();
            web = null;
        }
        loading = null;
    }

    @Override protected void onSaveInstanceState(Bundle state) {
        super.onSaveInstanceState(state);
        state.putString("selection", selection);
        state.putBoolean("playing", web != null);
    }

    @Override protected void onStart() {
        super.onStart();
        if (room != null) room.start();
    }

    @Override protected void onStop() {
        if (room != null) room.stop();
        super.onStop();
    }

    @Override protected void onResume() {
        super.onResume();
        resumed = true;
        if (web != null) web.onResume();
        syncInput();
    }

    @Override protected void onPause() {
        resumed = false;
        syncInput();
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override protected void onDestroy() {
        closePlayer();
        if (lobby != null) lobby.close();
        if (room != null) room.close();
        super.onDestroy();
    }
}
