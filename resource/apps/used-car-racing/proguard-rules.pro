# Preserve the intentionally exposed, origin-isolated WebView bridge.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
