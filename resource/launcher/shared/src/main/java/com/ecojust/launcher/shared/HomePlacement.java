package com.ecojust.launcher.shared;

import android.graphics.Rect;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Placement changes only one new Home user node; all existing JSON stays intact. */
public final class HomePlacement {
    private HomePlacement() {}

    public static boolean contains(JSONObject layout, String pkg) throws Exception {
        return find(layout, pkg) != null;
    }

    public static JSONObject find(JSONObject layout, String pkg) throws Exception {
        return find(layout, "home", pkg);
    }
    public static JSONObject find(JSONObject layout, String page, String pkg) throws Exception {
        JSONArray users = layout.getJSONObject(page).getJSONArray("users");
        for (int i = 0; i < users.length(); i++)
            if (pkg.equals(users.getJSONObject(i).getString("action"))) return users.getJSONObject(i);
        return null;
    }

    static Rect frame(JSONObject node) throws Exception {
        JSONObject f = node.getJSONObject("frame");
        int x = f.getInt("x"), y = f.getInt("y");
        return new Rect(x, y, x + f.getInt("width"), y + f.getInt("height"));
    }

    public static boolean free(JSONObject layout, Rect candidate) throws Exception {
        return free(layout, "home", candidate);
    }
    public static boolean free(JSONObject layout, String page, Rect candidate) throws Exception {
        JSONObject screen = layout.getJSONObject("screen");
        if (candidate.left < 0 || candidate.top < 0 || candidate.width() < 1 || candidate.height() < 1
                || candidate.right > screen.getInt("width") || candidate.bottom > screen.getInt("height")) return false;
        JSONObject home = layout.getJSONObject(page);
        for (String kind : new String[]{"users", "system"}) {
            JSONArray nodes = home.getJSONArray(kind);
            for (int i = 0; i < nodes.length(); i++) {
                JSONObject node = nodes.getJSONObject(i);
                if (node.getBoolean("visible") && Rect.intersects(candidate, frame(node))) return false;
            }
        }
        return true;
    }

    public static List<Rect> candidates(JSONObject layout) throws Exception {
        return candidates(layout, "home");
    }
    public static List<Rect> candidates(JSONObject layout, String page) throws Exception {
        if (layout.getInt("version") != 5) throw new IllegalArgumentException("unsupported_layout");
        List<Rect> result = new ArrayList<>();
        if (layout.getJSONObject(page).getJSONArray("users").length() >= (page.equals("home") ? 24 : 100)) return result;
        JSONObject screen = layout.getJSONObject("screen");
        int width = screen.getInt("width"), height = screen.getInt("height");
        // A compact, legible tile. Scan beyond fixed grid positions to find gaps in custom layouts.
        int tileWidth = Math.max(64, width / 6), tileHeight = Math.max(64, height / 5);
        int gap = Math.max(4, Math.min(width, height) / 80);
        int stepX = Math.max(4, width / 48), stepY = Math.max(4, height / 27);
        for (int y = gap; y + tileHeight + gap <= height; y += stepY) {
            for (int x = gap; x + tileWidth + gap <= width; x += stepX) {
                Rect tile = new Rect(x, y, x + tileWidth, y + tileHeight);
                Rect clearance = new Rect(tile); clearance.inset(-gap, -gap);
                if (!free(layout, page, clearance)) continue;
                boolean overlapsChoice = false;
                for (Rect existing : result) if (Rect.intersects(clearance, existing)) { overlapsChoice = true; break; }
                if (!overlapsChoice) result.add(tile);
                if (result.size() == 24) return result;
            }
        }
        return result;
    }

    public static JSONObject append(JSONObject original, String pkg, String label, String svg, Rect position) throws Exception {
        return append(original, "home", pkg, label, svg, position);
    }
    public static JSONObject append(JSONObject original, String page, String pkg, String label, String svg, Rect position) throws Exception {
        if (original.getInt("version") != 5) throw new IllegalArgumentException("unsupported_layout");
        if (!page.equals("home") && !page.equals("apps")) throw new IllegalArgumentException("invalid_page");
        if (find(original, page, pkg) != null) throw new IllegalArgumentException("already_present");
        if (original.getJSONObject(page).getJSONArray("users").length() >= (page.equals("home") ? 24 : 100)) throw new IllegalArgumentException("no_space");
        if (!free(original, page, position)) throw new IllegalArgumentException("layout_changed");
        JSONObject next = new JSONObject(original.toString());
        JSONArray users = next.getJSONObject(page).getJSONArray("users");
        Set<String> ids = new HashSet<>();
        for (String kind : new String[]{"users", "system"}) {
            JSONArray nodes = next.getJSONObject(page).getJSONArray(kind);
            for (int i = 0; i < nodes.length(); i++) ids.add(nodes.getJSONObject(i).getString("id"));
        }
        String id = "store-app";
        for (int i = 1; ids.contains(id); i++) id = "store-app-" + i;
        JSONObject frame = new JSONObject().put("x", position.left).put("y", position.top)
                .put("width", position.width()).put("height", position.height());
        users.put(new JSONObject().put("id", id).put("name", label).put("text", label)
                .put("action", pkg).put("frame", frame).put("visible", true).put("icon", svg)
                .put("textColor", "#FFFFFF").put("iconColor", "#FFFFFF").put("backgroundColor", "#284960"));
        return next;
    }
}
