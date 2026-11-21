#!/usr/bin/env bash
set -euo pipefail
output=$(realpath -m "$1")
source_dir=$(cd "$(dirname "$0")" && pwd)
tools="$ANDROID_HOME/build-tools/34.0.0"
platform="$ANDROID_HOME/platforms/android-35/android.jar"
mkdir -p "$output/classes" "$output/dex"
javac --release 8 -classpath "$platform" -d "$output/classes" "$source_dir/Probe.java"
"$tools/d8" --release --min-api 26 --lib "$platform" --output "$output/dex" "$output/classes/com/ecojust/iconprobe/Probe.class"
"$tools/aapt2" link --manifest "$source_dir/AndroidManifest.xml" -I "$platform" -o "$output/probe-unsigned.apk"
(cd "$output/dex" && zip -q -0 "$output/probe-unsigned.apk" classes.dex)
keytool -genkeypair -alias probe -keystore "$output/probe.jks" -storepass testonly -keypass testonly -keyalg RSA -validity 7 -dname CN=Probe
"$tools/zipalign" -f 4 "$output/probe-unsigned.apk" "$output/probe-aligned.apk"
"$tools/apksigner" sign --ks "$output/probe.jks" --ks-pass pass:testonly --out "$output/probe.apk" "$output/probe-aligned.apk"
