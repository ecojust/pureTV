package com.ecojust.music;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.*;
import android.database.Cursor;
import android.net.Uri;
import android.os.*;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.view.*;
import android.view.inputmethod.EditorInfo;
import android.widget.*;
import java.util.*;
import java.util.concurrent.*;

/** Native, recycled TV lists. Network work and decoding never run on the UI thread. */
public class MainActivity extends Activity {
    private final Handler main = new Handler(Looper.getMainLooper());
    private final ExecutorService searchWorker = new ThreadPoolExecutor(1, 1, 30, TimeUnit.SECONDS, new ArrayBlockingQueue<>(1), new ThreadPoolExecutor.DiscardOldestPolicy());
    private Future<?> searchJob;
    private int searchGeneration;
    private MusicStore store;
    private CoverLoader covers;
    private PlaybackService player;
    private boolean bound, visible;
    private LinearLayout content;
    private EditText query;
    private TextView heading, status, now, clock;
    private Button toggle, favourite, mode;
    private SeekBar seek;
    private ListView list;
    private final List<Track> tracks = new ArrayList<>();
    private final TrackAdapter adapter = new TrackAdapter();
    private int page = R.string.discover;
    private String favouriteTrackId, lastPlaybackError = "";
    private boolean cachedFavourite, wasLoading;
    private String lastStage = "";
    private Dialog fullscreen;
    private TextView fullTitle, fullTime;
    private Button fullToggle, fullMode;
    private final Runnable tick = new Runnable() {
        @Override public void run() { if (visible) { render(); main.postDelayed(this, 1000); } }
    };
    private final ServiceConnection connection = new ServiceConnection() {
        @Override public void onServiceConnected(ComponentName name, IBinder service) {
            player = ((PlaybackService.LocalBinder) service).player(); player.listen(MainActivity.this::render);
            for (int i = 0; i < pendingLocal.size(); i++) { if (!player.add(pendingLocal.get(i), i == 0)) { toast(getString(R.string.queue_full)); break; } }
            pendingLocal.clear(); render();
        }
        @Override public void onServiceDisconnected(ComponentName name) { player = null; }
    };

    @Override public void onCreate(Bundle state) {
        super.onCreate(state); store = new MusicStore(this); covers = new CoverLoader();
        LinearLayout root = column(); root.setPadding(dp(24), dp(18), dp(24), dp(12)); root.setBackgroundColor(0xff111319);
        LinearLayout body = row(); root.addView(body, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout nav = column(); nav.setPadding(0, dp(12), dp(20), 0); ScrollView navScroll = new ScrollView(this); navScroll.setFillViewport(false); navScroll.addView(nav); body.addView(navScroll, new LinearLayout.LayoutParams(dp(140), -1));
        TextView brand = text("Music TV", 25); brand.setTextColor(0xffe3a1b0); nav.addView(brand); space(nav, 18);
        for (int name : new int[]{R.string.discover, R.string.search, R.string.favourite, R.string.history, R.string.local_audio, R.string.settings}) {
            Button button = button(getString(name), () -> navigate(name)); nav.addView(button, new LinearLayout.LayoutParams(-1, dp(48)));
        }
        content = column(); body.addView(content, new LinearLayout.LayoutParams(0, -1, 1));
        heading = text(getString(R.string.discover_music), 25); content.addView(heading); space(content, 8);
        LinearLayout search = row(); query = new EditText(this); query.setSingleLine(); query.setTextSize(18); query.setTextColor(0xfff4f4f5);
        query.setHintTextColor(0xff9699a3); query.setHint(getString(R.string.search_hint)); query.setContentDescription(getString(R.string.search_music));
        query.setFilters(new android.text.InputFilter[]{new android.text.InputFilter.LengthFilter(120)});
        query.setImeOptions(EditorInfo.IME_ACTION_SEARCH); query.setOnEditorActionListener((v, action, event) -> { if (action == EditorInfo.IME_ACTION_SEARCH) { search(); return true; } return false; });
        search.addView(query, new LinearLayout.LayoutParams(0, dp(50), 1)); search.addView(button(getString(R.string.search), this::search), new LinearLayout.LayoutParams(dp(85), dp(50))); content.addView(search);
        status = text(getString(R.string.welcome), 14); status.setPadding(0, dp(8), 0, dp(8)); content.addView(status);
        LinearLayout resultActions = row();
        resultActions.addView(button(getString(R.string.play_all), () -> playResults(false)));
        resultActions.addView(button(getString(R.string.shuffle), () -> playResults(true)));
        content.addView(resultActions);
        list = new ListView(this); list.setDividerHeight(dp(5)); list.setSelector(R.drawable.list_focus); list.setDrawSelectorOnTop(true); list.setAdapter(adapter);
        list.setOnItemClickListener((parent, view, position, id) -> play(tracks.get(position)));
        list.setOnItemLongClickListener((parent, view, position, id) -> { trackMenu(tracks.get(position)); return true; });
        content.addView(list, new LinearLayout.LayoutParams(-1, 0, 1));
        LinearLayout bottom = column(); bottom.setPadding(dp(8), dp(12), 0, 0); root.addView(bottom);
        LinearLayout bar = row(); now = text(getString(R.string.choose_track), 16); now.setSingleLine(); now.setEllipsize(TextUtils.TruncateAt.END); bar.addView(now, new LinearLayout.LayoutParams(0, dp(44), 1));
        favourite = button(getString(R.string.favourite), this::toggleFavourite); bar.addView(favourite);
        bar.addView(button(getString(R.string.previous), () -> { if (player != null) player.previous(); }));
        toggle = button(getString(R.string.play), () -> { if (player != null) player.toggle(); }); bar.addView(toggle);
        bar.addView(button(getString(R.string.next), () -> { if (player != null) player.next(); }));
        mode = button(getString(R.string.sequence), () -> { if (player != null) player.shuffle(!player.shuffled()); }); bar.addView(mode);
        bar.addView(button(getString(R.string.queue), this::queueDialog)); bar.addView(button(getString(R.string.fullscreen), this::fullscreen)); bottom.addView(bar);
        LinearLayout timeline = row(); seek = new SeekBar(this); seek.setMax(1000); timeline.addView(seek, new LinearLayout.LayoutParams(0, dp(32), 1));
        clock = text("0:00 / 0:00", 13); timeline.addView(clock, new LinearLayout.LayoutParams(dp(125), dp(32))); bottom.addView(timeline);
        seek.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) { if (fromUser && player != null) player.seek(player.duration() * progress / 1000); }
            public void onStartTrackingTouch(SeekBar bar) { }
            public void onStopTrackingTouch(SeekBar bar) { }
        });
        setContentView(root); query.requestFocus();
        if (state != null) query.setText(state.getString("query", ""));
    }
    private void navigate(int destination) {
        if (destination == R.string.local_audio) { localAudio(); return; }
        if (destination == R.string.settings) {
            new AlertDialog.Builder(this).setTitle(getString(R.string.settings_title)).setMessage(getString(R.string.settings_message))
                    .setPositiveButton(getString(R.string.clear_covers), (d, w) -> { covers.trim(); list.invalidateViews(); })
                    .setNegativeButton(getString(R.string.close), null).show(); return;
        }
        cancelSearch(); page = destination; heading.setText(destination == R.string.discover ? getString(R.string.discover_music) : getString(destination));
        tracks.clear();
        if (destination == R.string.favourite) tracks.addAll(store.favourites());
        else if (destination == R.string.history) tracks.addAll(store.history());
        adapter.notifyDataSetChanged();
        status.setText(tracks.isEmpty() ? destination == R.string.favourite ? getString(R.string.empty_favourites) : destination == R.string.history ? getString(R.string.empty_history) : getString(R.string.search_suggestions) : getString(R.string.track_count, tracks.size()));
        if (destination == R.string.search) query.requestFocus();
    }
    private void search() {
        String keyword = query.getText().toString().trim(); if (keyword.isEmpty()) { query.requestFocus(); return; }
        cancelSearch(); page = R.string.search; heading.setText(getString(R.string.search_music)); tracks.clear(); adapter.notifyDataSetChanged(); status.setText(getString(R.string.searching));
        int ticket = searchGeneration;
        searchJob = searchWorker.submit(() -> {
            try {
                List<Track> result = BiliApi.get().search(keyword);
                main.post(() -> { if (visible && ticket == searchGeneration) { tracks.clear(); tracks.addAll(result); adapter.notifyDataSetChanged(); status.setText(result.isEmpty() ? getString(R.string.no_results) : getString(R.string.results_count, result.size())); if (!result.isEmpty()) list.requestFocus(); } });
            } catch (Exception e) {
                main.post(() -> { if (visible && ticket == searchGeneration) status.setText(getString(R.string.search_failed, MusicError.display(this,e))); });
            }
        });
    }
    private void cancelSearch() { searchGeneration++; if (searchJob != null) searchJob.cancel(true); searchJob = null; ((ThreadPoolExecutor) searchWorker).purge(); }
    private void playResults(boolean shuffle) {
        if (tracks.isEmpty()) { toast(getString(R.string.search_first)); return; }
        if (player != null) player.playList(new ArrayList<>(tracks), shuffle);
    }
    private void play(Track track) { if (player != null && !player.add(track, true)) toast(getString(R.string.queue_full_clear)); }
    private void trackMenu(Track track) {
        new AlertDialog.Builder(this).setTitle(track.title).setItems(new String[]{getString(R.string.play_now), getString(R.string.add_queue), store.favourite(track.id) ? getString(R.string.remove_favourite) : getString(R.string.favourite)}, (d, which) -> {
            if (which == 0) play(track);
            else if (which == 1) { if (player != null) toast(player.add(track, false) ? getString(R.string.queued) : getString(R.string.queue_full)); }
            else { toast(store.toggle(track) ? getString(R.string.saved) : getString(R.string.unsaved)); favouriteTrackId = null; if (page == R.string.favourite) navigate(page); render(); }
        }).show();
    }
    private void toggleFavourite() {
        Track track = player == null ? null : player.current();
        if (track != null) { toast(store.toggle(track) ? getString(R.string.saved) : getString(R.string.unsaved)); favouriteTrackId = null; if (page == R.string.favourite) navigate(page); render(); }
    }
    private void queueDialog() {
        if (player == null) return;
        List<Track> queue = player.queue(); String[] titles = new String[queue.size()];
        for (int i = 0; i < titles.length; i++) titles[i] = (i == player.currentIndex() ? "♪  " : "") + queue.get(i).title;
        AlertDialog.Builder dialog = new AlertDialog.Builder(this).setTitle(getString(R.string.queue_title, titles.length)).setNegativeButton(getString(R.string.close), null);
        if (titles.length == 0) dialog.setMessage(getString(R.string.queue_empty));
        else dialog.setItems(titles, (d, which) -> { if (player != null) player.play(which); }).setNeutralButton(getString(R.string.clear), (d, w) -> new AlertDialog.Builder(this).setMessage(getString(R.string.clear_queue_confirm)).setPositiveButton(getString(R.string.clear), (a, b) -> { if (player != null) player.clearQueue(); }).setNegativeButton(getString(R.string.cancel), null).show());
        dialog.show();
    }
    private void fullscreen() {
        if (fullscreen != null) return;
        fullscreen = new Dialog(this, R.style.MusicTheme); LinearLayout panel = column(); panel.setGravity(Gravity.CENTER); panel.setPadding(dp(48), dp(24), dp(48), dp(24)); panel.setBackgroundColor(0xff111319);
        TextView symbol = text("♫", 48); symbol.setTextColor(0xffe3a1b0); panel.addView(symbol);
        fullTitle = text(getString(R.string.choose_track), 30); fullTitle.setMaxLines(2); fullTitle.setGravity(Gravity.CENTER); panel.addView(fullTitle); space(panel, 24);
        LinearLayout controls = row(); controls.setGravity(Gravity.CENTER); controls.addView(button(getString(R.string.previous), () -> { if (player != null) player.previous(); })); fullToggle = button(getString(R.string.play), () -> { if (player != null) player.toggle(); }); controls.addView(fullToggle); controls.addView(button(getString(R.string.next), () -> { if (player != null) player.next(); })); controls.addView(button(getString(R.string.favourite), this::toggleFavourite));
        fullMode = button(getString(R.string.sequence), () -> { if (player != null) player.shuffle(!player.shuffled()); }); controls.addView(fullMode); panel.addView(controls);
        fullTime = text("", 17); panel.addView(fullTime); space(panel, 24); panel.addView(button(getString(R.string.back), () -> fullscreen.dismiss()));
        ScrollView scroll = new ScrollView(this); scroll.setFillViewport(true); scroll.addView(panel); fullscreen.setContentView(scroll); fullscreen.setOnDismissListener(d -> { fullscreen = null; fullTitle = null; fullTime = null; fullToggle = null; fullMode = null; }); fullscreen.show(); fullscreen.getWindow().setLayout(-1, -1); fullToggle.requestFocus(); render();
    }
    private void render() {
        if (player == null) return;
        mode.setText(player.shuffled() ? getString(R.string.shuffle) : getString(R.string.sequence));
        if (fullMode != null) fullMode.setText(mode.getText());
        Track track = player.current(); String title = track == null ? getString(R.string.choose_track) : track.title;
        now.setText(title); now.setContentDescription(track == null ? title : title + ", " + track.artist);
        String action = player.loading() ? getString(R.string.cancel) : player.playing() ? getString(R.string.pause) : getString(R.string.play); toggle.setText(action);
        if (track == null) { favouriteTrackId = null; cachedFavourite = false; }
        else if (!track.id.equals(favouriteTrackId)) { favouriteTrackId = track.id; cachedFavourite = store.favourite(track.id); }
        favourite.setText(cachedFavourite ? getString(R.string.saved) : getString(R.string.favourite));
        long duration = player.duration(), position = player.position(); seek.setEnabled(duration > 0); seek.setProgress(duration > 0 ? (int)(position * 1000 / duration) : 0);
        String time = time(position) + " / " + time(duration); clock.setText(time);
        if (!player.error().equals(lastPlaybackError) || player.loading() != wasLoading || !player.stage().equals(lastStage)) {
            if (!player.error().isEmpty()) status.setText(getString(R.string.retry_audio, player.error()));
            else if (player.loading()) status.setText(player.stage());
            else if (wasLoading || !lastPlaybackError.isEmpty()) status.setText(getString(R.string.track_hint));
            lastPlaybackError = player.error(); wasLoading = player.loading(); lastStage = player.stage();
        }
        if (fullTitle != null) { fullTitle.setText(title); fullTime.setText(player.loading() ? player.stage() : !player.error().isEmpty() ? player.error() : time); fullToggle.setText(action); }
    }
    private void localAudio() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("audio/*").putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION);
        try { startActivityForResult(intent, 71); } catch (ActivityNotFoundException e) { toast(getString(R.string.no_picker)); }
    }
    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data); if (request != 71 || result != RESULT_OK || data == null) return;
        List<Uri> uris = new ArrayList<>();
        if (data.getClipData() != null) { for (int i = 0; i < Math.min(data.getClipData().getItemCount(), MusicStore.QUEUE_LIMIT); i++) uris.add(data.getClipData().getItemAt(i).getUri()); }
        else if (data.getData() != null) uris.add(data.getData());
        boolean first = true;
        for (Uri uri : uris) {
            if (!"content".equals(uri.getScheme())) continue;
            try { if ((data.getFlags() & Intent.FLAG_GRANT_READ_URI_PERMISSION) != 0) getContentResolver().takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION); } catch (SecurityException ignored) { }
            String title = getString(R.string.local_audio);
            try (Cursor cursor = getContentResolver().query(uri, new String[]{OpenableColumns.DISPLAY_NAME}, null, null, null)) { if (cursor != null && cursor.moveToFirst()) title = cursor.getString(0); } catch (RuntimeException ignored) { }
            if (title == null) title = getString(R.string.local_audio); if (title.length() > 200) title = title.substring(0, 200);
            Track track = new Track(uri.toString(), title, getString(R.string.local_audio), "", uri.toString(), 0);
            // Binding is asynchronous after the system picker returns: enqueue on the next UI frame if needed.
            final boolean playNow = first; first = false;
            if (player != null) { if (!player.add(track, playNow)) { toast(getString(R.string.queue_full)); break; } }
            else pendingLocal.add(track);
        }
    }
    private final List<Track> pendingLocal = new ArrayList<>();
    @Override protected void onStart() { super.onStart(); visible = true; list.setAdapter(adapter); bound = bindService(new Intent(this, PlaybackService.class), connection, BIND_AUTO_CREATE); main.post(tick); }
    @Override protected void onStop() {
        visible = false; cancelSearch(); main.removeCallbacks(tick); list.setAdapter(null); covers.trim(); if (fullscreen != null) fullscreen.dismiss();
        if (player != null) player.listen(null); if (bound) unbindService(connection); bound = false; player = null; super.onStop();
    }
    @Override protected void onDestroy() { searchWorker.shutdownNow(); covers.close(); main.removeCallbacksAndMessages(null); super.onDestroy(); }
    @Override public void onTrimMemory(int level) { super.onTrimMemory(level); if (covers != null && level >= TRIM_MEMORY_RUNNING_LOW) covers.trim(); }
    @Override protected void onSaveInstanceState(Bundle state) { state.putString("query", query.getText().toString()); super.onSaveInstanceState(state); }
    @Override public boolean onKeyDown(int key, KeyEvent event) {
        if (player != null) {
            switch (key) {
                case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE: if (event.getRepeatCount() == 0) player.toggle(); return true;
                case KeyEvent.KEYCODE_MEDIA_PLAY: player.resume(); return true;
                case KeyEvent.KEYCODE_MEDIA_PAUSE: player.pause(false); return true;
                case KeyEvent.KEYCODE_MEDIA_NEXT: player.next(); return true;
                case KeyEvent.KEYCODE_MEDIA_PREVIOUS: player.previous(); return true;
                case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD: player.seek(player.position() + 10000); return true;
                case KeyEvent.KEYCODE_MEDIA_REWIND: player.seek(player.position() - 10000); return true;
            }
        }
        return super.onKeyDown(key, event);
    }
    private class TrackAdapter extends BaseAdapter {
        public int getCount() { return tracks.size(); }
        public Track getItem(int position) { return tracks.get(position); }
        public long getItemId(int position) { return position; }
        public View getView(int position, View recycled, android.view.ViewGroup parent) {
            LinearLayout row;
            if (recycled == null) {
                row = MainActivity.this.row(); row.setPadding(dp(10), dp(5), dp(10), dp(5)); row.setBackgroundColor(0xff1b1e26);
                ImageView cover = new ImageView(MainActivity.this); cover.setScaleType(ImageView.ScaleType.CENTER_CROP); row.addView(cover, new LinearLayout.LayoutParams(dp(48), dp(48)));
                LinearLayout labels = column(); labels.setPadding(dp(14), 0, dp(10), 0); TextView title = text("", 18); title.setSingleLine(); title.setEllipsize(TextUtils.TruncateAt.END); labels.addView(title); TextView artist = text("", 13); artist.setSingleLine(); labels.addView(artist); row.addView(labels, new LinearLayout.LayoutParams(0, -2, 1));
                row.addView(text("", 14), new LinearLayout.LayoutParams(dp(65), -2));
            } else row = (LinearLayout) recycled;
            Track track = getItem(position); ImageView cover = (ImageView) row.getChildAt(0); covers.load(track.cover, cover);
            LinearLayout labels = (LinearLayout) row.getChildAt(1); ((TextView) labels.getChildAt(0)).setText(track.title); ((TextView) labels.getChildAt(1)).setText(track.artist); ((TextView) row.getChildAt(2)).setText(track.duration > 0 ? time(track.duration * 1000) : getString(R.string.local));
            return row;
        }
    }
    private int dp(int value) { return Math.round(value * getResources().getDisplayMetrics().density); }
    private LinearLayout column() { LinearLayout view = new LinearLayout(this); view.setOrientation(LinearLayout.VERTICAL); return view; }
    private LinearLayout row() { LinearLayout view = new LinearLayout(this); view.setOrientation(LinearLayout.HORIZONTAL); view.setGravity(Gravity.CENTER_VERTICAL); return view; }
    private TextView text(String value, int size) { TextView view = new TextView(this); view.setText(value); view.setTextSize(size); view.setTextColor(0xffe4e5e9); view.setGravity(Gravity.CENTER_VERTICAL); return view; }
    private Button button(String title, Runnable click) { Button view = new Button(this); view.setText(title); view.setTextSize(15); view.setAllCaps(false); view.setMinWidth(dp(68)); view.setMinimumHeight(dp(42)); view.setTextColor(0xffe4e5e9); view.setBackgroundResource(R.drawable.focus); view.setPadding(dp(12), dp(6), dp(12), dp(6)); view.setOnClickListener(v -> click.run()); return view; }
    private void space(LinearLayout parent, int height) { parent.addView(new View(this), new LinearLayout.LayoutParams(1, dp(height))); }
    private void toast(String message) { Toast.makeText(this, message, Toast.LENGTH_SHORT).show(); }
    static String time(long ms) { long seconds = Math.max(0, ms / 1000); return String.format(Locale.ROOT, "%d:%02d", seconds / 60, seconds % 60); }
}
