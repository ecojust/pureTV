#!/usr/bin/env bash
# Build and install without disabling the stock launcher.
set -euo pipefail
cd "$(dirname "$0")"
: "${TV_HOST:?Set TV_HOST to the TV IP address or IP:port}"
command -v adb >/dev/null || { echo "Please install Android platform-tools (adb)." >&2; exit 1; }
./gradlew --console=plain assembleDebug
TV_SERIAL="$TV_HOST"
[[ "$TV_SERIAL" == *:* ]] || TV_SERIAL="$TV_SERIAL:5555"
adb connect "$TV_SERIAL"
adb -s "$TV_SERIAL" install -r app/build/outputs/apk/debug/app-debug.apk
adb -s "$TV_SERIAL" shell cmd package set-home-activity --user 0 com.ecojust.puretv/.MainActivity
adb -s "$TV_SERIAL" shell am start -n com.ecojust.puretv/.MainActivity
echo "Installed. Press Home to open pureTV."
