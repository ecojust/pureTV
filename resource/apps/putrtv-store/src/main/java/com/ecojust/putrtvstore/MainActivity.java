package com.ecojust.putrtvstore;

import android.app.Activity;
import android.app.Dialog;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.EditorInfo;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.io.IOException;
import java.text.DateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

/** Remote-first storefront. Every installation ends in the Android confirmation screen. */
public class MainActivity extends Activity {
    static final int INK = 0xff17243d, MUTED = 0xff64748b, BLUE = 0xff2563eb, LINE = 0xffdce4f1, BACK = 0xfff4f7fc;
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Map<String, Button> tabs = new LinkedHashMap<>();
    private final Map<String, InstalledApps.Status> states = new LinkedHashMap<>();
    private Future<?> pending;
    private Cancellation cancellation;
    private int generation, page;
    private boolean downloadInterrupted;
    private boolean destroyed, active, loading;
    private CatalogRepository repository;
    private InstalledApps installed;
    private ApkInstaller installer;
    private StoreDownloader downloader;
    private LauncherIntegration launcher;
    private StoreArtwork artwork;
    private StoreCatalog catalog;
    private LinearLayout grid;
    private ScrollView scroll;
    private TextView headline, subtitle, syncStatus;
    private Button refresh;
    private EditText search;
    private Dialog modal;
    private StoreEntry selected;
    private String category = "launcher", query = "", reopenPackage;
    private View lastCard;

    protected CatalogRepository createRepository() { return new CatalogRepository(this); }
    protected InstalledApps createInstalledApps() { return new InstalledApps(this); }
    protected ApkInstaller createInstaller() { return new ApkInstaller(this); }
    protected StoreDownloader createDownloader() { return new StoreDownloader(this); }
    protected boolean enableNetworkArtwork() { return true; }
    boolean english() { return !getResources().getConfiguration().locale.getLanguage().equals("zh"); }
    String tr(String zh, String en) { return english() ? en : zh; }
    int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private TextView text(String value, int size, int color) {
        TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(color); return view;
    }
    private GradientDrawable shape(int color, int border, int width) {
        GradientDrawable shape = new GradientDrawable(); shape.setColor(color); shape.setCornerRadius(dp(13)); shape.setStroke(dp(width), border); return shape;
    }
    private StateListDrawable focusBackground(boolean selected) {
        StateListDrawable states = new StateListDrawable();
        states.addState(new int[]{android.R.attr.state_focused}, shape(0xffeaf1ff, BLUE, 3));
        states.addState(new int[]{android.R.attr.state_pressed}, shape(0xffdce9ff, BLUE, 2));
        states.addState(new int[]{}, shape(selected ? 0xffe7efff : Color.WHITE, selected ? 0xffb8ceff : LINE, 1)); return states;
    }
    private Button button(String title, String tag, View.OnClickListener action) {
        Button b = new Button(this); b.setText(title); b.setTag(tag); b.setTextColor(INK); b.setTextSize(13); b.setAllCaps(false);
        b.setMinHeight(0); b.setMinimumHeight(0); b.setMinWidth(0); b.setMinimumWidth(0); b.setPadding(dp(13), dp(7), dp(13), dp(7));
        b.setBackground(focusBackground(false)); b.setOnClickListener(action); return b;
    }
    private LinearLayout column() { LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.VERTICAL); return box; }
    private LinearLayout row() { LinearLayout box = new LinearLayout(this); box.setOrientation(LinearLayout.HORIZONTAL); return box; }
    private LinearLayout.LayoutParams space(int w, int h, int bottom) { LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(w < 0 ? w : dp(w), h < 0 ? h : dp(h)); lp.bottomMargin = dp(bottom); return lp; }

    @Override protected void onCreate(Bundle state) {
        super.onCreate(state);
        if (state != null) { category = state.getString("category", "launcher"); query = state.getString("query", ""); reopenPackage = state.getString("selectedPackage"); }
        repository = createRepository(); installed = createInstalledApps(); installer = createInstaller(); downloader = createDownloader(); launcher = new LauncherIntegration(this); artwork = new StoreArtwork();
        build(); refresh(false);
    }
    private void build() {
        LinearLayout root = row(); root.setTag("store-root"); root.setBackgroundColor(BACK); root.setPadding(dp(24), dp(22), dp(24), dp(20));
        LinearLayout side = column(); side.setPadding(0, dp(3), dp(20), 0);
        TextView brand = text("putrtv", 27, BLUE); brand.setTypeface(null, Typeface.BOLD); side.addView(brand);
        TextView brandHint = text(tr("电视应用商城", "TV app store"), 12, MUTED); side.addView(brandHint, space(-1, -2, 30));
        String[] kinds = {"launcher", "media", "game", "tools", "updates"};
        for (String kind : kinds) {
            Button tab = button(categoryName(kind), "tab-" + kind, v -> navigate(kind)); tab.setGravity(Gravity.START | Gravity.CENTER_VERTICAL);
            LinearLayout.LayoutParams lp = space(-1, 43, 9); if ("updates".equals(kind)) lp.topMargin = dp(18); side.addView(tab, lp); tabs.put(kind, tab);
        }
        View spacer = new View(this); side.addView(spacer, new LinearLayout.LayoutParams(1, 0, 1));
        TextView hint = text(tr("方向键浏览\n确定键选择", "Arrows to browse\nOK to select"), 11, MUTED); hint.setLineSpacing(dp(4), 1); side.addView(hint);
        root.addView(side, new LinearLayout.LayoutParams(dp(160), -1));
        LinearLayout body = column();
        LinearLayout toolbar = row(); toolbar.setGravity(Gravity.CENTER_VERTICAL);
        search = new EditText(this); search.setTag("search-input"); search.setSingleLine(true); search.setTextSize(14); search.setTextColor(INK); search.setHintTextColor(MUTED); search.setHint(tr("搜索应用或游戏", "Search apps or games")); search.setPadding(dp(15), 0, dp(15), 0); search.setBackground(focusBackground(false)); search.setImeOptions(EditorInfo.IME_ACTION_SEARCH); search.setText(query);
        search.setOnEditorActionListener((v, action, event) -> { if (action == EditorInfo.IME_ACTION_SEARCH || (event != null && event.getKeyCode() == KeyEvent.KEYCODE_ENTER && event.getAction() == KeyEvent.ACTION_UP)) { search(); return true; } return false; });
        toolbar.addView(search, new LinearLayout.LayoutParams(0, dp(42), 1));
        Button go = button(tr("搜索", "Search"), "search-submit", v -> search()); LinearLayout.LayoutParams goLp = space(-2, 42, 0); goLp.leftMargin = dp(9); toolbar.addView(go, goLp);
        refresh = button(tr("检查更新", "Check updates"), "refresh", v -> refresh(true)); LinearLayout.LayoutParams rlp = space(-2, 42, 0); rlp.leftMargin = dp(9); toolbar.addView(refresh, rlp);
        body.addView(toolbar);
        headline = text("", 26, INK); headline.setTypeface(null, Typeface.BOLD); headline.setPadding(0, dp(22), 0, dp(4)); body.addView(headline);
        subtitle = text("", 12, MUTED); body.addView(subtitle, space(-1, -2, 15));
        scroll = new ScrollView(this); scroll.setTag("catalog-scroll"); scroll.setFillViewport(true); scroll.setClipToPadding(false); scroll.setPadding(0, 0, dp(3), 0);
        grid = column(); grid.setTag("catalog-grid"); scroll.addView(grid); body.addView(scroll, new LinearLayout.LayoutParams(-1, 0, 1));
        syncStatus = text(tr("正在检查应用目录…", "Checking app catalog…"), 11, MUTED); syncStatus.setTag("sync-status"); syncStatus.setPadding(0, dp(12), 0, 0); syncStatus.setMaxLines(2); body.addView(syncStatus);
        root.addView(body, new LinearLayout.LayoutParams(0, -1, 1)); setContentView(root); render(); tabs.get(category).requestFocus();
    }
    private String categoryName(String value) {
        switch (value) { case "launcher": return tr("启动器", "Launchers"); case "media": return tr("影音", "Media"); case "game": return tr("游戏", "Games"); case "tools": return tr("工具", "Tools"); default: return tr("应用更新", "Updates"); }
    }
    private void navigate(String value) { page = 0; category = value; query = ""; search.setText(""); render(); scroll.smoothScrollTo(0, 0); tabs.get(value).requestFocus(); }
    private void search() {
        page = 0; query = search.getText().toString().trim(); render(); scroll.smoothScrollTo(0, 0);
        InputMethodManager keyboard = (InputMethodManager) getSystemService(INPUT_METHOD_SERVICE); if (keyboard != null) keyboard.hideSoftInputFromWindow(search.getWindowToken(), 0);
        View first = grid.findViewWithTag("card-0"); if (first != null) first.requestFocus();
    }
    private void refresh(boolean force) {
        if (modal != null) closeModal(); loading = true; refresh.setEnabled(false); syncStatus.setText(tr("正在检查应用目录…", "Checking app catalog…"));
        request(token -> repository.load(force, token), value -> {
            loading = false; refresh.setEnabled(true); catalog = value; inspect(); render();
            if (reopenPackage != null) { StoreEntry entry = findEntry(reopenPackage); reopenPackage = null; if (entry != null) detail(entry); }
        }, e -> { loading = false; refresh.setEnabled(true); syncStatus.setText(tr("暂时无法连接。按“检查更新”重试。", "Unable to connect. Choose Check updates to retry.")); if (catalog == null) showEmpty(tr("暂时无法读取目录", "Catalog unavailable"), tr("请检查电视网络后重试。", "Check your TV connection and try again.")); });
    }
    private void inspect() { states.clear(); if (catalog != null) for (StoreEntry entry : catalog.entries) states.put(entry.packageName, installed.inspect(entry)); }
    private boolean needsUpdate(StoreEntry entry) { InstalledApps.Status state = states.get(entry.packageName); return state != null && state.state == InstalledApps.State.UPDATE_AVAILABLE; }
    private void render() {
        for (Map.Entry<String, Button> tab : tabs.entrySet()) { tab.getValue().setBackground(focusBackground(category.equals(tab.getKey()) && query.isEmpty())); int count = 0; if (catalog != null) for (StoreEntry entry : catalog.entries) if (tab.getKey().equals("updates") ? needsUpdate(entry) : tab.getKey().equals(entry.category)) count++; tab.getValue().setText(categoryName(tab.getKey()) + (catalog == null ? "" : "  " + count)); }
        String title = query.isEmpty() ? categoryName(category) : tr("搜索结果", "Search results"); headline.setText(title);
        subtitle.setText(query.isEmpty() ? ("updates".equals(category) ? tr("查看已安装应用的新版本，安装前由你确认。", "New versions for installed apps. You confirm every installation.") : tr("发现好用的电视应用，让大屏多一点可能。", "Useful apps, made for your bigger screen.")) : tr("关键词：", "Results for: ") + query);
        grid.removeAllViews();
        if (catalog == null) { showEmpty(tr("正在载入…", "Loading…"), tr("首次打开需要连接网络。", "Connect to the internet to get the latest catalog.")); return; }
        String time = DateFormat.getDateTimeInstance(DateFormat.SHORT, DateFormat.SHORT, getResources().getConfiguration().locale).format(new Date(catalog.fetchedAt));
        syncStatus.setText(catalog.stale ? tr("离线目录 · 版本可能已变化，请联网检查更新", "Offline catalog · Versions may have changed. Check again when online.") : tr("检查时间：", "Last checked: ") + time + tr("  ·  安装需要系统确认", "  ·  System confirmation required"));
        List<StoreEntry> filtered = new ArrayList<>(); String needle = query.toLowerCase(Locale.ROOT);
        for (StoreEntry entry : catalog.entries) {
            boolean match = !query.isEmpty() ? (entry.name + " " + entry.nameEn + " " + entry.packageName).toLowerCase(Locale.ROOT).contains(needle) : ("updates".equals(category) ? needsUpdate(entry) : category.equals(entry.category));
            if (match) filtered.add(entry);
        }
        if (filtered.isEmpty()) { showEmpty(query.isEmpty() && "updates".equals(category) ? (catalog.stale ? tr("缓存中没有可用更新", "No updates in the cached catalog") : tr("未发现可用更新", "No updates found")) : tr("没有找到应用", "No matching apps"), catalog.stale ? tr("联网刷新后才能确认最新版本。", "Refresh online to check the latest versions.") : tr("试试其他分类或关键词。", "Try another category or search term.")); return; }
        int columns = getResources().getConfiguration().screenWidthDp < 800 ? 2 : 3;
        int pageSize = columns * 3; int pages = (filtered.size() + pageSize - 1) / pageSize;
        page = Math.min(page, pages - 1); int start = page * pageSize; int end = Math.min(start + pageSize, filtered.size());
        artwork.cancel();
        for (int offset = start; offset < end; offset += columns) {
            LinearLayout row = row();
            for (int j = 0; j < columns; j++) { LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, dp(getResources().getConfiguration().screenHeightDp < 600 ? 157 : 177), 1); if (j < columns - 1) lp.rightMargin = dp(12); row.addView(offset + j < end ? card(filtered.get(offset + j), offset + j - start) : new View(this), lp); }
            grid.addView(row, space(-1, -2, 12));
        }
        if (pages > 1) {
            LinearLayout pager = row(); pager.setGravity(Gravity.CENTER); Button previous = button(tr("上一页", "Previous"), "previous-page", v -> { page--; render(); scroll.smoothScrollTo(0, 0); grid.findViewWithTag("card-0").requestFocus(); }); previous.setEnabled(page > 0); pager.addView(previous, space(-2, 42, 0));
            TextView number = text((page + 1) + " / " + pages, 13, MUTED); number.setPadding(dp(18), 0, dp(18), 0); pager.addView(number);
            Button next = button(tr("下一页", "Next"), "next-page", v -> { page++; render(); scroll.smoothScrollTo(0, 0); grid.findViewWithTag("card-0").requestFocus(); }); next.setEnabled(page < pages - 1); pager.addView(next, space(-2, 42, 0)); grid.addView(pager);
        }
    }
    private void showEmpty(String title, String description) { grid.removeAllViews(); LinearLayout box = column(); box.setGravity(Gravity.CENTER); box.setPadding(dp(24), dp(35), dp(24), dp(30)); box.setBackground(shape(Color.WHITE, LINE, 1)); TextView t = text(title, 20, INK); t.setGravity(Gravity.CENTER); box.addView(t); TextView d = text(description, 13, MUTED); d.setGravity(Gravity.CENTER); d.setPadding(0, dp(12), 0, 0); box.addView(d); grid.addView(box); }
    private View card(StoreEntry entry, int index) {
        LinearLayout card = column(); card.setPadding(dp(8), dp(8), dp(8), dp(8)); card.setTag("card-" + index); card.setFocusable(true); card.setClickable(true); card.setBackground(focusBackground(false)); card.setContentDescription(entry.displayName(english()) + ", " + statusText(states.get(entry.packageName))); card.setOnClickListener(v -> { lastCard = card; detail(entry); });
        FrameLayout cover = new FrameLayout(this); int[] palette = {0xffe4edff, 0xffdff3ec, 0xffffeed9, 0xffeae5fc}; cover.setBackground(shape(palette[Math.abs(entry.id.hashCode() % palette.length)], Color.TRANSPARENT, 0));
        TextView monogram = text(entry.displayName(english()), 21, 0xff486185); monogram.setTypeface(null, Typeface.BOLD); monogram.setGravity(Gravity.CENTER); monogram.setMaxLines(2); monogram.setPadding(dp(12), 0, dp(12), 0); cover.addView(monogram, new FrameLayout.LayoutParams(-1, -1));
        ImageView image = new ImageView(this); image.setScaleType(ImageView.ScaleType.CENTER_CROP); cover.addView(image, new FrameLayout.LayoutParams(-1, -1)); if (enableNetworkArtwork()) artwork.load(catalog, entry, image);
        card.addView(cover, space(-1, getResources().getConfiguration().screenHeightDp < 600 ? 72 : 92, 7)); TextView title = text(entry.displayName(english()), 14, INK); title.setTypeface(null, Typeface.BOLD); title.setSingleLine(true); title.setEllipsize(TextUtils.TruncateAt.END); card.addView(title);
        TextView version = text("v" + entry.versionName + "  ·  " + size(entry.bytes), 10, MUTED); version.setPadding(0, dp(3), 0, dp(3)); card.addView(version);
        InstalledApps.Status state = states.get(entry.packageName); TextView status = text(statusText(state), 11, needsUpdate(entry) ? BLUE : MUTED); status.setSingleLine(true); status.setEllipsize(TextUtils.TruncateAt.END); card.addView(status); return card;
    }
    private String statusText(InstalledApps.Status status) {
        if (status == null) return tr("正在读取", "Checking");
        switch (status.state) {
            case NOT_INSTALLED: return tr("可安装", "Available"); case UPDATE_AVAILABLE: return tr("有更新", "Update available"); case CURRENT: return tr("已安装", "Installed"); case NEWER_INSTALLED: return tr("本机版本更新", "Newer version installed"); case SIGNATURE_MISMATCH: return tr("签名不同，无法直接更新", "Different signer · Update blocked"); case INCOMPATIBLE: return tr("需要更高版本 Android", "Requires newer Android"); default: return tr("暂时无法核对安装状态", "Installation status unavailable");
        }
    }
    static String size(long bytes) { return String.format(Locale.ROOT, "%.1f MB", bytes / 1000000.0); }
    private LinearLayout dialog(String title) {
        dismissModal(); modal = new Dialog(this); modal.requestWindowFeature(Window.FEATURE_NO_TITLE);
        LinearLayout body = column(); body.setPadding(dp(24), dp(22), dp(24), dp(20)); body.setBackground(shape(Color.WHITE, LINE, 1)); TextView heading = text(title, 23, INK); heading.setTypeface(null, Typeface.BOLD); heading.setPadding(0, 0, 0, dp(12)); body.addView(heading);
        ScrollView viewport = new ScrollView(this); viewport.addView(body); modal.setContentView(viewport); modal.setOnCancelListener(v -> closeModal()); modal.show(); Window window = modal.getWindow(); if (window != null) { window.setBackgroundDrawableResource(android.R.color.transparent); window.setLayout(Math.min(dp(600), getResources().getDisplayMetrics().widthPixels - dp(48)), Math.min(dp(470), getResources().getDisplayMetrics().heightPixels - dp(42))); } return body;
    }
    private void paragraph(LinearLayout body, String value) { TextView t = text(value, 13, MUTED); t.setPadding(0, 0, 0, dp(14)); t.setLineSpacing(dp(3), 1); body.addView(t); }
    private Button action(LinearLayout body, String label, String tag, View.OnClickListener action) { Button b = button(label, tag, action); body.addView(b, space(-1, 43, 8)); return b; }
    private void detail(StoreEntry entry) {
        selected = entry; LinearLayout body = dialog(entry.displayName(english())); InstalledApps.Status state = installed.inspect(entry); states.put(entry.packageName, state);
        paragraph(body, entry.displayDescription(english())); paragraph(body, "v" + entry.versionName + " · " + size(entry.bytes) + "\n" + statusText(state) + (state.installed ? tr("  ·  本机：", "  ·  Installed: ") + state.versionName : ""));
        Button first = null;
        if (state.state == InstalledApps.State.NOT_INSTALLED || state.state == InstalledApps.State.UPDATE_AVAILABLE) first = action(body, state.installed ? tr("下载更新", "Download update") : tr("下载并安装", "Download and install"), "install", v -> download(entry));
        if (state.state == InstalledApps.State.INCOMPATIBLE) paragraph(body, tr("此应用要求 Android API ", "This app requires Android API ") + entry.minSdk + tr(" 或更新版本。", " or newer."));
        if (state.state == InstalledApps.State.SIGNATURE_MISMATCH) paragraph(body, tr("本机应用与商城版本的签名不同，不能覆盖安装。请保留当前应用和数据。", "The installed app uses a different signing key and cannot be updated here. Keep your existing app and data."));
        if (state.installed) {
            Intent launch = installed.launchIntent(entry);
            if (launch != null) { Button open = action(body, tr("打开应用", "Open app"), "open-app", v -> { try { startActivity(launch); } catch (RuntimeException e) { toast(tr("无法打开此应用", "Unable to open this app")); } }); if (first == null) first = open; }
            LauncherIntegration.Target target = launcher.target();
            if (target.availability == LauncherIntegration.Availability.SUPPORTED) { paragraph(body, tr("在桌面中选择首页或应用页的空位，再确认添加。", "Choose a free position on Home or Apps, then confirm in your launcher.")); Button add = action(body, tr("添加到桌面…", "Add to home…"), "add-to-home", v -> { try { if (!launcher.request(this, entry)) toast(tr("桌面已变化，请重新打开详情。", "Your home changed. Reopen app details.")); } catch (RuntimeException e) { toast(tr("无法打开桌面的添加页面", "Unable to open the home screen editor")); } }); if (first == null) first = add; }
            else paragraph(body, homeHelp(target.availability));
        }
        Button close = action(body, tr("返回", "Back"), "close-detail", v -> closeModal()); if (first == null) first = close; first.requestFocus();
    }
    private String homeHelp(LauncherIntegration.Availability value) {
        switch (value) { case NEEDS_LAUNCHER_UPDATE: return tr("添加到自定义桌面：请先在商城更新当前启动器，然后重新打开这里。", "To add this app to your custom home, update the current launcher in the store, then reopen these details."); case NO_DEFAULT_HOME: return tr("请先设置默认桌面，再添加应用。", "Choose your default home app before adding apps."); default: return tr("当前桌面不支持商城添加入口，请使用电视桌面自己的应用管理功能。", "Your current home does not support adding apps from this store. Use your TV home’s app management."); }
    }
    private void download(StoreEntry entry) {
        if (!installer.canInstall()) {
            LinearLayout body = dialog(tr("允许商城安装应用", "Allow app installation")); paragraph(body, tr("需要在电视系统设置中允许来自 putrtv商城 的安装。返回后，再次选择下载并安装。", "Allow installations from putrtv Store in your TV settings. Return here and choose Download and install again."));
            action(body, tr("打开系统设置", "Open system settings"), "install-permission", v -> { try { installer.openPermissionSettings(); } catch (IOException e) { toast(installError(e)); } }).requestFocus(); action(body, tr("返回", "Back"), "close-detail", v -> detail(entry)); return;
        }
        LinearLayout body = dialog(tr("下载应用", "Downloading app")); paragraph(body, entry.displayName(english()) + " · " + size(entry.bytes)); TextView progress = text(tr("准备下载…", "Preparing download…"), 15, BLUE); progress.setTag("download-progress"); body.addView(progress, space(-1, -2, 16)); paragraph(body, tr("下载校验完成后会打开系统安装确认。", "Android will ask you to confirm after the download is verified."));
        action(body, tr("取消下载", "Cancel download"), "cancel-download", v -> { cancelRequest(); detail(entry); }).requestFocus();
        final int token = generation + 1;
        request(cancel -> { File apk = downloader.download(catalog, entry, cancel, (bytes, total) -> main.post(() -> { if (generation == token && modal != null) progress.setText(size(bytes) + " / " + size(total)); })); cancel.check(); return installer.prepare(entry, apk); }, prepared -> {
            try { installer.install(prepared); dismissModal(); toast(tr("请在系统页面确认安装。", "Confirm installation on the Android screen.")); }
            catch (IOException e) { failure(entry, e); }
        }, e -> failure(entry, e));
    }
    private void failure(StoreEntry entry, Exception error) { LinearLayout body = dialog(tr("未完成安装", "Installation not completed")); paragraph(body, installError(error)); action(body, tr("返回应用详情", "Back to app details"), "retry-detail", v -> detail(entry)).requestFocus(); }
    private String installError(Exception error) {
        if (error instanceof ApkInstaller.InstallException) {
            switch (((ApkInstaller.InstallException) error).reason) {
                case SIGNATURE_MISMATCH: case WRONG_SIGNER: return tr("签名不一致，已停止安装，现有应用未改动。", "Signing keys do not match. Installation stopped; the existing app is unchanged.");
                case INCOMPATIBLE_ANDROID: return tr("当前 Android 版本不支持此应用。", "This app requires a newer Android version.");
                case PERMISSION_REQUIRED: return tr("请先允许商城安装应用。", "Allow installations from the store first.");
                case STORAGE_UNAVAILABLE: return tr("无法准备安装文件，请检查电视可用空间。", "Unable to prepare the installer. Check free space on your TV.");
                case NO_INSTALLER: return tr("电视没有可用的系统安装程序。", "No Android package installer is available on this TV.");
                case NOT_NEWER: return tr("已安装相同或更新版本，请返回详情刷新。", "The same or a newer version is installed. Reopen the app details.");
                default: return tr("安装包未通过校验，已停止安装。请检查更新后重试。", "Package verification failed. Check for updates and retry.");
            }
        }
        return tr("下载或校验未完成，请检查网络及可用空间后重试。", "Download or verification failed. Check your connection and free space, then retry.");
    }
    private StoreEntry findEntry(String packageName) { if (catalog != null) for (StoreEntry entry : catalog.entries) if (entry.packageName.equals(packageName)) return entry; return null; }
    private void installationResult(ApkInstaller.Result result) {
        if (result.outcome == ApkInstaller.Outcome.NONE) return;
        inspect(); render();
        if (result.outcome == ApkInstaller.Outcome.INSTALLED) {
            StoreEntry entry = findEntry(result.packageName); toast(tr("已确认安装完成", "Installation verified"));
            if (entry == null) reopenPackage = result.packageName;
            if (entry != null) { detail(entry); View add = modal.getWindow().getDecorView().findViewWithTag("add-to-home"); if (add != null) add.requestFocus(); }
        } else { toast(tr("尚未确认安装成功，可返回详情重试。", "Installation was not confirmed. Reopen the app details to retry.")); if (selected != null) detail(selected); }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == ApkInstaller.INSTALL_REQUEST) installationResult(installer.confirmResult(result));
        else if (request == ApkInstaller.SETTINGS_REQUEST && selected != null) detail(selected);
        else if (request == LauncherIntegration.REQUEST_ADD) {
            String reason = data == null ? "" : data.getStringExtra("reason");
            if (result == RESULT_OK && "added".equals(reason)) toast(data != null && "apps".equals(data.getStringExtra("page")) ? tr("已添加到桌面的应用页", "Added to your home’s Apps page") : tr("已添加到首页", "Added to Home"));
            else if ("already_present".equals(reason)) toast(tr("桌面已经有这个应用", "This app is already on your home"));
            else if ("already_in_apps".equals(reason)) toast(tr("桌面的应用页已经有这个应用", "This app is already on your home’s Apps page"));
            else if ("already_hidden".equals(reason) || "already_hidden_apps".equals(reason)) toast(tr("桌面已有隐藏的应用块，请用管理器恢复显示。", "The app is already on your home but hidden. Restore it in the manager."));
            else if ("no_space".equals(reason)) toast(tr("桌面没有空位，请先调整布局。", "There is no free space. Adjust your home layout first."));
            else if (reason != null && !reason.isEmpty() && !"cancelled".equals(reason)) toast(tr("未能添加，请在桌面中检查布局。", "Unable to add the app. Check your home layout."));
        }
    }
    private interface Work<T> { T run(Cancellation token) throws Exception; }
    private interface Success<T> { void accept(T value); }
    private interface Failure { void accept(Exception error); }
    private <T> void request(Work<T> work, Success<T> success, Failure failure) {
        cancelRequest(); Cancellation token = cancellation = new Cancellation(); int current = generation;
        pending = worker.submit(() -> { try { T value = work.run(token); main.post(() -> { if (destroyed || current != generation || token.isCancelled()) return; pending = null; success.accept(value); }); } catch (Exception error) { main.post(() -> { if (destroyed || current != generation || token.isCancelled()) return; pending = null; failure.accept(error); }); } });
    }
    private void cancelRequest() { generation++; if (cancellation != null) cancellation.cancel(); if (pending != null) pending.cancel(true); pending = null; }
    private void dismissModal() { if (modal != null) { Dialog old = modal; modal = null; old.dismiss(); } }
    private void closeModal() { cancelRequest(); dismissModal(); selected = null; if (lastCard != null && lastCard.isAttachedToWindow()) lastCard.requestFocus(); else if (tabs.get(category) != null) tabs.get(category).requestFocus(); }
    private void toast(String value) { Toast.makeText(this, value, Toast.LENGTH_LONG).show(); }
    @Override protected void onResume() { super.onResume(); active = true; if (installer != null) { installationResult(installer.reconcile()); if (catalog != null) { inspect(); render(); } if (downloadInterrupted) { downloadInterrupted = false; if (selected != null) detail(selected); toast(tr("下载已暂停，可重新选择下载。", "Download paused. Choose Download again to resume.")); } } }
    @Override protected void onPause() { active = false; if (pending != null && modal != null && modal.getWindow().getDecorView().findViewWithTag("download-progress") != null) { downloadInterrupted = true; dismissModal(); } if (loading) { cancelRequest(); loading = false; refresh.setEnabled(true); syncStatus.setText(tr("检查已暂停，请返回后刷新。", "Check paused. Refresh when you return.")); } else cancelRequest(); artwork.cancel(); super.onPause(); }
    @Override protected void onDestroy() { destroyed = true; cancelRequest(); dismissModal(); artwork.close(); worker.shutdownNow(); main.removeCallbacksAndMessages(null); super.onDestroy(); }
    @Override protected void onSaveInstanceState(Bundle state) { super.onSaveInstanceState(state); state.putString("category", category); state.putString("query", query); if (selected != null) state.putString("selectedPackage", selected.packageName); }
    @Override public void onBackPressed() { if (modal != null) { closeModal(); return; } if (!query.isEmpty()) { query = ""; search.setText(""); render(); tabs.get(category).requestFocus(); return; } if (!"launcher".equals(category)) { navigate("launcher"); return; } super.onBackPressed(); }
}
