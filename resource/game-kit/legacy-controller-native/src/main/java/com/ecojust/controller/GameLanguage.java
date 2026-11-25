package com.ecojust.controller;

import android.app.LocaleManager;
import android.content.Context;
import android.content.res.Configuration;
import android.os.Build;
import java.util.Locale;

/** Use Simplified Chinese unless the player has selected an app-specific language. */
public final class GameLanguage {
    private GameLanguage() {}

    public static Context forActivity(Context base) {
        if (Build.VERSION.SDK_INT >= 33) {
            LocaleManager manager = base.getSystemService(LocaleManager.class);
            if (manager != null && !manager.getApplicationLocales().isEmpty()) return base;
        }
        Configuration config = new Configuration(base.getResources().getConfiguration());
        config.setLocale(Locale.SIMPLIFIED_CHINESE);
        return base.createConfigurationContext(config);
    }
}
