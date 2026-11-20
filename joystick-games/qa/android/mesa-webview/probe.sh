#!/usr/bin/env bash
# Standalone SDK capability probe, separate package/UID from the game and its signed observer.
set -euo pipefail
src="$(cd "$(dirname "$0")" && pwd)"
scratch="$(mktemp -d "$RUNNER_TEMP/webview-probe.XXXXXX")"
package=org.puretv.qa.renderer
adb="$ANDROID_HOME/platform-tools/adb"
bt="$ANDROID_HOME/build-tools/34.0.0"
android="$ANDROID_HOME/platforms/android-35/android.jar"
if ! test -f "$android"; then
  sdkmanager 'platforms;android-35'
fi
out="$RUNNER_TEMP/runtime/$GAME/host-renderer"
mkdir -p "$out" "$scratch/classes" "$scratch/dex"
cd "$scratch"
trap 'rm -f probe.p12' EXIT
cat > AndroidManifest.xml <<'XML'
<manifest xmlns:android="http://schemas.android.com/apk/res/android" package="org.puretv.qa.renderer">
 <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="29"/>
 <application android:testOnly="true" android:hardwareAccelerated="true">
  <activity android:name=".GpuProbe" android:exported="true"/>
 </application>
</manifest>
XML
javac -source 8 -target 8 -bootclasspath "$android" -d classes "$src/GpuProbe.java"
"$bt/d8" --min-api 26 --lib "$android" --output dex classes/org/puretv/qa/renderer/GpuProbe.class
"$bt/aapt2" link --manifest AndroidManifest.xml -I "$android" -o probe.apk
(cd dex && zip -q ../probe.apk classes.dex)
"$bt/zipalign" -f 4 probe.apk aligned.apk
# This temporary debug key signs only the separate testOnly capability probe.
keytool -genkeypair -keystore probe.p12 -storetype PKCS12 -storepass android -keypass android -alias probe \
  -dname CN=PureTV-QA-Probe -keyalg RSA -keysize 2048 -validity 2 >/dev/null
"$bt/apksigner" sign --ks probe.p12 --ks-pass pass:android --out signed-probe.apk aligned.apk
"$adb" install -t signed-probe.apk
trap '"$adb" uninstall "$package" >/dev/null || true; rm -f probe.p12' EXIT
"$adb" shell am start -W -n "$package/.GpuProbe"
for ((i=0; i<35; i++)); do
  "$adb" logcat -d -v raw 'PureTVGpuProbe:I' '*:S' | tr -d '\r' | awk '/^\{/ {line=$0} END {if (line) print line}' > "$out/webview.json"
  if test -s "$out/webview.json"; then break; fi
  sleep 1
done
jq -ec 'select(type=="object" and (.webgl2|type)=="boolean")' "$out/webview.json"
"$adb" shell dumpsys SurfaceFlinger | awk '/GLES:/{print}' > "$out/surfaceflinger-gles.txt"
cp "$src/GpuProbe.java" "$src/probe.sh" "$out/"
