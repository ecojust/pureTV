package com.ecojust.operatv;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** One private, bounded snapshot. Mutations validate completely before replacing it. */
public final class OperaStore {
    static final String PREFERENCES = "operatv.library";
    static final String SNAPSHOT = "snapshot.v1";
    static final int MAX_IMPORTED = 500;
    static final int MAX_FAVORITES = 200;
    static final int MAX_HISTORY = 100;
    private static final int MAX_SNAPSHOT_CHARS = 4 * 1024 * 1024;
    private static final int MAX_POSITION_MS = 7 * 24 * 60 * 60 * 1000;
    private static final Object LOCK = new Object();
    private final SharedPreferences preferences;
    private String lastProblem = "";

    public OperaStore(Context context) {
        preferences = context.getApplicationContext().getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE);
    }

    public List<OperaItem> imported() { synchronized (LOCK) { return readList(0); } }
    public List<OperaItem> favorites() { synchronized (LOCK) { return readList(1); } }
    public List<OperaItem> history() { synchronized (LOCK) { return readList(2); } }

    /** Nonempty when saved data cannot be read; the original snapshot remains untouched. */
    public String problem() { synchronized (LOCK) {
        try { read(); } catch (IOException failure) { lastProblem = failure.getMessage(); }
        return lastProblem;
    } }

    public boolean isFavorite(String id) { synchronized (LOCK) {
        try { return read().favorites.containsKey(id); }
        catch (IOException failure) { lastProblem = failure.getMessage(); return false; }
    } }

    public boolean toggleFavorite(OperaItem item) throws IOException { synchronized (LOCK) {
        OperaItem checked = validate(item);
        State state = read();
        boolean adding = !state.favorites.containsKey(checked.id);
        if (adding) {
            if (state.favorites.size() >= MAX_FAVORITES) throw PlaylistParser.error("收藏已满（200 项），请先移除一些节目。", "Favorites are full (200 items). Remove an item first.");
            state.favorites = prepend(state.favorites, checked);
        } else state.favorites.remove(checked.id);
        save(state);
        return adding;
    } }

    public int importItems(List<OperaItem> items) throws IOException { synchronized (LOCK) {
        if (items == null || items.isEmpty() || items.size() > MAX_IMPORTED) {
            throw PlaylistParser.error("请选择 1–500 个有效节目，原片单未改变。", "Select 1–500 valid items. Your existing playlist was not changed.");
        }
        LinkedHashMap<String, OperaItem> checked = new LinkedHashMap<>();
        for (OperaItem item : items) {
            OperaItem valid = validate(item);
            if (!valid.kind.equals("direct") && !valid.kind.equals("document")) {
                throw PlaylistParser.error("导入只接受视频链接或已选择的本地文件。", "Import accepts media links or selected local documents only.");
            }
            checked.put(valid.id, valid);
        }
        State state = read();
        int before = state.imported.size();
        state.imported.putAll(checked);
        if (state.imported.size() > MAX_IMPORTED) {
            throw PlaylistParser.error("我的片单最多保存 500 项，请先移除一些节目；本次未导入。", "My playlist holds at most 500 items. Remove some items first; nothing was imported.");
        }
        int added = state.imported.size() - before;
        save(state);
        return added;
    } }

    public void removeImported(String id) throws IOException { synchronized (LOCK) {
        State state = read();
        if (state.imported.remove(id) != null) save(state);
    } }

    public void clearHistory() throws IOException { synchronized (LOCK) {
        State state = read();
        state.history.clear(); state.positions.clear();
        save(state);
    } }

    /** Call only after real playback has progressed, never on a click or failed prepare. */
    public void record(OperaItem item, int positionMs, int durationMs) { synchronized (LOCK) {
        if (positionMs <= 0) return;
        try {
            OperaItem valid = validate(item);
            State state = read();
            int duration = Math.max(0, Math.min(durationMs, MAX_POSITION_MS));
            int position = Math.max(0, Math.min(positionMs, MAX_POSITION_MS));
            if (duration == 0 || position >= Math.max(0, duration - 1000)) position = 0;
            state.history = prepend(state.history, valid);
            state.positions.put(valid.id, position);
            while (state.history.size() > MAX_HISTORY) {
                String oldest = null;
                for (String id : state.history.keySet()) oldest = id;
                state.history.remove(oldest); state.positions.remove(oldest);
            }
            save(state);
        } catch (IOException failure) { lastProblem = failure.getMessage(); }
    } }

    public int position(String id) { synchronized (LOCK) {
        try { Integer value = read().positions.get(id); return value == null ? 0 : value; }
        catch (IOException failure) { lastProblem = failure.getMessage(); return 0; }
    } }

    private List<OperaItem> readList(int which) {
        try {
            State state = read();
            return new ArrayList<>((which == 0 ? state.imported : which == 1 ? state.favorites : state.history).values());
        } catch (IOException failure) {
            lastProblem = failure.getMessage();
            return new ArrayList<>();
        }
    }

    private State read() throws IOException {
        try {
            String raw = preferences.getString(SNAPSHOT, null);
            if (raw == null) return new State();
            if (raw.length() > MAX_SNAPSHOT_CHARS) throw new JSONException("Oversized library");
            PlaylistParser.checkJsonDepth(raw);
            JSONTokener tokener = new JSONTokener(raw);
            Object decoded = tokener.nextValue();
            if (!(decoded instanceof JSONObject) || tokener.nextClean() != 0) throw new JSONException("Invalid library JSON");
            JSONObject value = (JSONObject) decoded;
            if (!(value.opt("version") instanceof Integer) || value.getInt("version") != 1) throw new JSONException("Unknown schema");
            State state = new State();
            state.imported = readItems(value.getJSONArray("imported"), MAX_IMPORTED);
            state.favorites = readItems(value.getJSONArray("favorites"), MAX_FAVORITES);
            state.history = readItems(value.getJSONArray("history"), MAX_HISTORY);
            JSONObject positions = value.getJSONObject("positions");
            if (positions.length() > MAX_HISTORY) throw new JSONException("Too many resume positions");
            java.util.Iterator<String> keys = positions.keys();
            while (keys.hasNext()) {
                String id = keys.next(); Object position = positions.get(id);
                if (!state.history.containsKey(id) || !(position instanceof Integer)
                        || ((Integer) position) < 0 || ((Integer) position) > MAX_POSITION_MS) throw new JSONException("Invalid resume position");
                state.positions.put(id, (Integer) position);
            }
            return state;
        } catch (JSONException | IllegalArgumentException | ClassCastException failure) {
            throw PlaylistParser.error("保存的片单数据无法读取，已保留原数据；请勿清除应用数据。", "Saved library data cannot be read and has been preserved. Do not clear application data.");
        }
    }

    private LinkedHashMap<String, OperaItem> readItems(JSONArray array, int limit) throws JSONException {
        if (array.length() > limit) throw new JSONException("Too many saved items");
        LinkedHashMap<String, OperaItem> result = new LinkedHashMap<>();
        for (int i = 0; i < array.length(); i++) {
            OperaItem item = OperaItem.fromJson(array.getJSONObject(i));
            if (result.put(item.id, item) != null) throw new JSONException("Duplicate saved item");
        }
        return result;
    }

    private OperaItem validate(OperaItem item) throws IOException {
        try {
            if (item == null) throw new JSONException("Missing item");
            return OperaItem.fromJson(item.toJson());
        } catch (JSONException | IllegalArgumentException failure) {
            throw PlaylistParser.error("节目数据无效，原数据未改变。", "The item is invalid. Existing data was not changed.");
        }
    }

    private void save(State state) throws IOException {
        final String encoded;
        try {
            JSONObject value = new JSONObject();
            value.put("version", 1); value.put("imported", array(state.imported));
            value.put("favorites", array(state.favorites)); value.put("history", array(state.history));
            JSONObject positions = new JSONObject();
            for (Map.Entry<String, Integer> entry : state.positions.entrySet()) positions.put(entry.getKey(), entry.getValue());
            value.put("positions", positions);
            encoded = value.toString();
            if (encoded.length() > MAX_SNAPSHOT_CHARS) throw new JSONException("Oversized library");
        } catch (JSONException failure) {
            throw PlaylistParser.error("片单数据过大或无效，原数据未改变。", "Library data is too large or invalid. Existing data was not changed.");
        }
        String previous = preferences.getString(SNAPSHOT, null);
        if (!preferences.edit().putString(SNAPSHOT, encoded).commit()) {
            SharedPreferences.Editor rollback = preferences.edit();
            if (previous == null) rollback.remove(SNAPSHOT); else rollback.putString(SNAPSHOT, previous);
            rollback.commit();
            throw PlaylistParser.error("无法保存片单，请检查设备剩余空间。", "Could not save the library. Check available device storage.");
        }
        lastProblem = "";
    }

    private JSONArray array(LinkedHashMap<String, OperaItem> items) {
        JSONArray values = new JSONArray();
        for (OperaItem item : items.values()) values.put(item.toJson());
        return values;
    }

    private static LinkedHashMap<String, OperaItem> prepend(LinkedHashMap<String, OperaItem> before, OperaItem item) {
        LinkedHashMap<String, OperaItem> after = new LinkedHashMap<>();
        after.put(item.id, item);
        for (Map.Entry<String, OperaItem> entry : before.entrySet()) if (!entry.getKey().equals(item.id)) after.put(entry.getKey(), entry.getValue());
        return after;
    }

    private static final class State {
        LinkedHashMap<String, OperaItem> imported = new LinkedHashMap<>();
        LinkedHashMap<String, OperaItem> favorites = new LinkedHashMap<>();
        LinkedHashMap<String, OperaItem> history = new LinkedHashMap<>();
        final LinkedHashMap<String, Integer> positions = new LinkedHashMap<>();
    }
}
