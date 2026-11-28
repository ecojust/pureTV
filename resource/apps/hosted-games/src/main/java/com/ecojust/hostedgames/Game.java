package com.ecojust.hostedgames;

import android.content.Context;
import android.net.Uri;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Both the TV launcher and the web library read the same authored catalog. */
final class Game {
    final String id, title, originalTitle, controls;
    final Uri url;
    final JSONObject guide;

    private Game(JSONObject entry) throws JSONException {
        id = entry.getString("id");
        title = entry.getString("zh");
        originalTitle = entry.getString("en");
        controls = entry.getJSONObject("controls").getString("zh");
        url = Uri.parse(entry.getString("url"));
        if (!"https".equals(url.getScheme()) || url.getHost() == null || url.getUserInfo() != null) {
            throw new JSONException("Invalid game address: " + id);
        }
        guide = entry.getJSONObject("guide");
    }

    static List<Game> load(Context context) throws JSONException, IOException {
        StringBuilder json = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                context.getAssets().open("hosted-games.json"), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) json.append(line);
        }
        List<Game> games = new ArrayList<>();
        JSONArray entries = new JSONArray(json.toString());
        for (int i = 0; i < entries.length(); i++) games.add(new Game(entries.getJSONObject(i)));
        if (games.isEmpty()) throw new JSONException("Empty game catalog");
        return games;
    }

    boolean owns(Uri dest) {
        return "https".equals(dest.getScheme()) && dest.getUserInfo() == null
                && url.getHost().equalsIgnoreCase(dest.getHost())
                && (dest.getPort() == -1 || dest.getPort() == 443);
    }

    String instructions() {
        StringBuilder text = new StringBuilder();
        JSONObject objective = guide.optJSONObject("objective");
        if (objective != null) text.append(objective.optString("zh")).append("\n\n");
        text.append(controls);
        JSONArray steps = guide.optJSONArray("steps");
        if (steps != null) for (int i = 0; i < steps.length(); i++) {
            text.append("\n").append(i + 1).append(". ").append(steps.optJSONObject(i).optString("zh"));
        }
        JSONArray terms = guide.optJSONArray("terms");
        if (terms != null && terms.length() != 0) {
            text.append("\n\n原文对照");
            for (int i = 0; i < terms.length(); i++) {
                JSONObject term = terms.optJSONObject(i);
                text.append("\n").append(term.optString("label")).append("  ·  ").append(term.optString("zh"));
            }
        }
        return text.toString();
    }
}
