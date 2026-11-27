set -euo pipefail
mode=$1
case "$mode" in
  normal|occupied) ;;
  *) exit 2 ;;
esac
adb="$ANDROID_HOME/platform-tools/adb"
evidence="$RUNNER_TEMP/runtime/$GAME"
{
  printf 'avd=FrozenTV%s\n' "$mode"
  timeout 12 "$adb" -s emulator-5554 shell getprop ro.build.fingerprint || true
  timeout 12 "$adb" -s emulator-5554 shell getprop ro.build.version.sdk || true
  timeout 12 "$adb" -s emulator-5554 shell getprop ro.product.cpu.abi || true
  timeout 12 "$adb" -s emulator-5554 shell wm size || true
  timeout 12 "$adb" -s emulator-5554 shell dumpsys SurfaceFlinger | grep -Ei '(GLES:|GL_RENDERER|Vulkan driver)' | head -12 || true
  timeout 12 "$adb" -s emulator-5554 shell dumpsys webviewupdate | grep -Ei '(Current WebView package|Preferred WebView package)' || true
} > "$evidence/guest-$mode.txt"
set +e
python3 joystick-games/tools/android-environment-diagnostics.py --output "$evidence/environment-diagnostics-$mode" -- \
  python3 joystick-games/tools/android-catalog.py runtime --game "$GAME" --mode "$mode" \
  --input "$RUNNER_TEMP/input" --output "$RUNNER_TEMP/runtime" --adb "$adb"
result=$?
printf '%s\n' "$result" > "$evidence/$mode-exit-code.txt"
exit "$result"
