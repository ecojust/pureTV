package com.ecojust.mosstv;

import android.content.Context;
import android.content.ActivityNotFoundException;
import android.net.Uri;
import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Flat, labelled cards shared by the home shortcuts and the application list. */
public class AppAdapter extends RecyclerView.Adapter<AppAdapter.Holder> {
    interface TileListener {
        void onTileFocused(int position, View card);
        boolean onTileVerticalKey(int position, int keyCode);
    }

    static final int PLACEHOLDER = 0, APP_STORE = 1, BILIBILI = 2, MUSIC_WEBSITE = 3, FILES = 4, SHORTVIDEO = 5, WEBTV = 6, CUSTOM_APP = 7;
    static final float FOCUS_SCALE = 1.08f;
    static final float DESIGN_W_DP = 190f, DESIGN_H_DP = 94f;
    static boolean reducedMotion;

    static final class Entry {
        final String key;
        final int label, icon, color, action, number;
        final String customTitle, packageName;
        final boolean packageIcon;
        String svg="";int foreground=0xFFBFC3C8,iconColor=0xFFBFC3C8;

        Entry(String key, int label, int icon, int color, int action, int number) {
            this(key,label,icon,color,action,number,"","",false);
        }
        Entry(String key,int label,int icon,int color,int action,int number,String title,String pkg,boolean packageIcon) {
            this.customTitle=title;this.packageName=pkg;this.packageIcon=packageIcon;
            this.key = key;
            this.label = label;
            this.icon = icon;
            this.color = color;
            this.action = action;
            this.number = number;
        }

        String title(Context context) {
            if (!customTitle.isEmpty()) return customTitle;
            return number > 0 ? context.getString(label, number) : context.getString(label);
        }
    }

    static List<Entry> homeEntries() {
        return Arrays.asList(
                new Entry("music", R.string.home_music, R.drawable.ic_music, 0xFF303338, MUSIC_WEBSITE, 0),
                new Entry("bilibili", R.string.home_bilibili, R.drawable.ic_bilibili, 0xFF86515F, BILIBILI, 0),
                new Entry("files", R.string.home_files, R.drawable.ic_folder, 0xFF3B4C46, FILES, 0),
                new Entry("apps", R.string.home_apps, R.drawable.ic_apps_minimal, 0xFF374959, APP_STORE, 0));
    }

    static List<Entry> applicationEntries() {
        List<Entry> entries = new ArrayList<>();
        entries.add(new Entry("shortvideo", R.string.home_shortvideo, R.drawable.ic_video, 0xFF503036, SHORTVIDEO, 0));
        entries.add(new Entry("music", R.string.home_music, R.drawable.ic_music, 0xFF303338, MUSIC_WEBSITE, 0));
        entries.add(new Entry("webtv", R.string.home_webtv, R.drawable.ic_livetv, 0xFF3B4C46, WEBTV, 0));
        int[] icons = {R.drawable.ic_video, R.drawable.ic_music, R.drawable.ic_apps_minimal,
                R.drawable.ic_livetv, R.drawable.ic_picture, R.drawable.ic_wifi,
                R.drawable.ic_input, R.drawable.ic_settings};
        int[] colors = {0xFF503036, 0xFF303338, 0xFF374959, 0xFF3B4C46};
        for (int i = 3; i < icons.length; i++) {
            entries.add(new Entry("placeholder-" + i, R.string.placeholder_app, icons[i],
                    colors[i % colors.length], PLACEHOLDER, i + 1));
        }
        return entries;
    }

    private final Context context;
    private final TileListener listener;
    private final int columns;
    private final List<Entry> entries;

    AppAdapter(Context context, TileListener listener, int columns, List<Entry> entries) {
        this.context = context;
        this.listener = listener;
        this.columns = columns;
        this.entries = new ArrayList<>(entries);
        setHasStableIds(true);
    }

    static void setReducedMotion(boolean reduced) { reducedMotion = reduced; }
    void reload() { notifyDataSetChanged(); }
    void clear() { /* Cards hold only vector resources, never application artwork. */ }

    static int tileWidthPx(int innerWidthPx, int columns, float density) {
        int design = Math.round(DESIGN_W_DP * density);
        if (innerWidthPx <= 0 || columns <= 0) return design;
        int fit = (int) ((innerWidthPx / columns - 20 * density) / FOCUS_SCALE);
        return Math.max(1, Math.min(design, fit));
    }

    static int tileHeightPx(int width) { return Math.round(width * DESIGN_H_DP / DESIGN_W_DP); }
    static int itemHeightPx(int height, float density) { return height + Math.round(54 * density); }

    String keyAt(int position) {
        return position >= 0 && position < entries.size() ? entries.get(position).key : null;
    }

    int positionOf(String key) {
        for (int i = 0; i < entries.size(); i++) if (entries.get(i).key.equals(key)) return i;
        return -1;
    }

    @NonNull @Override
    public Holder onCreateViewHolder(@NonNull ViewGroup parent, int type) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_app, parent, false);
        float density = parent.getResources().getDisplayMetrics().density;
        int width = parent.getWidth() > 0 ? parent.getWidth()
                : parent.getResources().getDisplayMetrics().widthPixels;
        int inner = width - parent.getPaddingLeft() - parent.getPaddingRight();
        int cardWidth = tileWidthPx(inner, columns, density);
        int cardHeight = tileHeightPx(cardWidth);
        View card = view.findViewById(R.id.card);
        ViewGroup.LayoutParams cardParams = card.getLayoutParams();
        cardParams.width = cardWidth;
        cardParams.height = cardHeight;
        card.setLayoutParams(cardParams);
        TextView name = view.findViewById(R.id.name);
        ViewGroup.MarginLayoutParams nameParams = (ViewGroup.MarginLayoutParams) name.getLayoutParams();
        nameParams.width = cardWidth;
        nameParams.topMargin = cardHeight + Math.round(8 * density);
        name.setLayoutParams(nameParams);
        return new Holder(view);
    }

    @Override public void onBindViewHolder(@NonNull Holder holder, int position) {
        Entry entry = entries.get(position);
        String title = entry.title(context);
        holder.textColor=entry.foreground;holder.fixedTextColor=!entry.svg.isEmpty();holder.name.setTextColor(entry.foreground);
        holder.name.setText(title);
        holder.icon.setImageResource(entry.icon);
        if (entry.packageIcon && !entry.packageName.isEmpty()) {
            try {holder.icon.setImageDrawable(context.getPackageManager().getApplicationIcon(entry.packageName));}catch(Exception ignored) { /* Keep vector fallback. */ }
        }
        GradientDrawable surface = new GradientDrawable();
        surface.setColor(entry.color);
        surface.setCornerRadius(8 * context.getResources().getDisplayMetrics().density);
        holder.card.setBackground(surface);
        holder.card.setContentDescription(title);
        holder.card.setScaleX(holder.card.isFocused() ? FOCUS_SCALE : 1f);
        holder.card.setScaleY(holder.card.isFocused() ? FOCUS_SCALE : 1f);
        holder.card.setOnClickListener(v -> launch(entry));
        holder.card.setForeground(context.getDrawable(R.drawable.card_focus));
        if(!entry.svg.isEmpty()) {
            GradientDrawable outline=new GradientDrawable();outline.setColor(android.graphics.Color.TRANSPARENT);outline.setCornerRadius(8*context.getResources().getDisplayMetrics().density);outline.setStroke(Math.max(1,Math.round(context.getResources().getDisplayMetrics().density)),entry.foreground);
            android.graphics.drawable.StateListDrawable focus=new android.graphics.drawable.StateListDrawable();focus.addState(new int[]{android.R.attr.state_focused},outline);focus.addState(new int[]{},new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));holder.card.setForeground(focus);
            try {
                android.graphics.drawable.Drawable icon=SvgIcon.drawable(context,entry.svg,entry.iconColor);
                holder.icon.setImageTintList(null);holder.icon.setLayerType(View.LAYER_TYPE_NONE,null);
                holder.icon.setImageDrawable(icon);
            }catch(Exception ignored){ /* Keep the installed-app/vector fallback, never a blank error icon. */ }
            holder.name.setTextColor(entry.foreground);
        }
    }

    Holder sceneHolder(ViewGroup parent,int position) {
        Holder holder=onCreateViewHolder(parent,0);holder.scenePosition=position;onBindViewHolder(holder,position);return holder;
    }
    private void launch(Entry entry) {
        if (entry.action == CUSTOM_APP) {
            if (!openNative(entry.packageName)) Toast.makeText(context, R.string.not_available, Toast.LENGTH_LONG).show();
            return;
        }
        if (entry.action == MUSIC_WEBSITE) {
            if (openNative("com.ecojust.music")) return;
            openWebsite(R.string.music_website_url, R.string.music_browser_unavailable);
            return;
        }
        if (entry.action == WEBTV) {
            if (!openNative("com.ecojust.webtv")) Toast.makeText(context, R.string.webtv_not_installed, Toast.LENGTH_LONG).show();
            return;
        }
        if (entry.action == SHORTVIDEO) {
            if (!openNative("com.ecojust.shortvideo")) Toast.makeText(context, R.string.shortvideo_not_installed, Toast.LENGTH_LONG).show();
            return;
        }
        if (entry.action == FILES) {
            FileBrowser.open(context);
            return;
        }
        if (entry.action == APP_STORE) {
            AppStore.open(context);
            return;
        }
        if (entry.action == BILIBILI) {
            for (String pkg : new String[]{"com.xiaodianshi.tv.yst", "tv.danmaku.bili", "tv.danmaku.bilibilihd"}) {
                Intent intent = context.getPackageManager().getLeanbackLaunchIntentForPackage(pkg);
                if (intent == null) intent = context.getPackageManager().getLaunchIntentForPackage(pkg);
                if (intent == null) continue;
                try {
                    context.startActivity(intent);
                    return;
                } catch (RuntimeException ignored) {
                    // Another installed variant may still be launchable.
                }
            }
            Toast.makeText(context, R.string.bilibili_not_installed, Toast.LENGTH_SHORT).show();
            return;
        }
        Toast.makeText(context, context.getString(R.string.placeholder_unconfigured,
                entry.title(context)), Toast.LENGTH_SHORT).show();
    }

    private boolean openNative(String pkg) {
        Intent intent = context.getPackageManager().getLeanbackLaunchIntentForPackage(pkg);
        if (intent == null) intent = context.getPackageManager().getLaunchIntentForPackage(pkg);
        if (intent == null) return false;
        try { context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)); return true; }
        catch (ActivityNotFoundException | SecurityException e) { return false; }
    }

    private void openWebsite(int urlResource, int errorResource) {
        Intent website = new Intent(Intent.ACTION_VIEW,
                Uri.parse(context.getString(urlResource)))
                .addCategory(Intent.CATEGORY_BROWSABLE)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            context.startActivity(website);
        } catch (ActivityNotFoundException | SecurityException e) {
            Toast.makeText(context, errorResource, Toast.LENGTH_LONG).show();
        }
    }

    @Override public int getItemCount() { return entries.size(); }
    @Override public long getItemId(int position) { return entries.get(position).key.hashCode(); }

    final class Holder extends RecyclerView.ViewHolder {
        int scenePosition=-1;int textColor=0xFFBFC3C8;boolean fixedTextColor;
        final View card;
        final ImageView icon;
        final TextView name;

        Holder(View view) {
            super(view);
            card = view.findViewById(R.id.card);
            icon = view.findViewById(R.id.icon);
            name = view.findViewById(R.id.name);
            card.setOnFocusChangeListener((v, focused) -> {
                v.animate().cancel();
                v.setElevation((focused?12:2)*context.getResources().getDisplayMetrics().density);
                float scale = focused ? FOCUS_SCALE : 1f;
                if (reducedMotion) {
                    v.setScaleX(scale);
                    v.setScaleY(scale);
                } else {
                    v.animate().scaleX(scale).scaleY(scale).setDuration(170)
                            .setInterpolator(new android.view.animation.DecelerateInterpolator()).start();
                }
                name.setTextColor(fixedTextColor?textColor:focused ? 0xFFF5F5F5 : textColor);
                int position = scenePosition>=0?scenePosition:getBindingAdapterPosition();
                if (focused && listener != null && position != RecyclerView.NO_POSITION) {
                    listener.onTileFocused(position, v);
                }
            });
            card.setOnKeyListener((v, keyCode, event) -> {
                if (event.getAction() != KeyEvent.ACTION_DOWN || listener == null) return false;
                if (keyCode != KeyEvent.KEYCODE_DPAD_UP && keyCode != KeyEvent.KEYCODE_DPAD_DOWN) return false;
                int position = scenePosition>=0?scenePosition:getBindingAdapterPosition();
                return position != RecyclerView.NO_POSITION && listener.onTileVerticalKey(position, keyCode);
            });
        }
    }
}
