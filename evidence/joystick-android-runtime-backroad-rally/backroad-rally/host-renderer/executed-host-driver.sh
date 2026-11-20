#!/usr/bin/env bash
# Inspect the original game's WebView only after both signed-observer gameplay scenarios finish.
set -euo pipefail
route_status=$1
out="$RUNNER_TEMP/runtime/$GAME/host-renderer"
mkdir -p "$out"
printf '%s\n' "$route_status" > "$out/player-route-exit.txt"
cp "$0" "$out/executed-host-driver.sh"
adb="$ANDROID_HOME/platform-tools/adb"
"$adb" shell dumpsys SurfaceFlinger | awk '/GLES:/{print}' > "$out/guest-surfaceflinger-gles.txt"
target=com.ecojust.joystick.backroadrally
observer=com.ecojust.joystickgraphicsqa.backroadrally
target_path=$("$adb" shell pm path "$target" | tr -d '\r' | sed -n 's/^package://p')
"$adb" exec-out cat "$target_path" | sha256sum > "$out/installed-target.sha256"
test "$(cut -d' ' -f1 "$out/installed-target.sha256")" = 67f61471e0e23e9ea963475425d5c43fa9d3265167f9028bd55dc319494fbe3c
probe="$RUNNER_TEMP/backroad-frozen-graphics-observer/backroad-graphics-observer.apk"
test "$(sha256sum "$probe" | cut -d' ' -f1)" = 3b523c88bcd88dc0481386b76ce5688f9182cc995c61874a7e319f59861afacf
cp "$RUNNER_TEMP/backroad-frozen-graphics-observer/graphics-observer-signing-receipt.json" "$out/"
timeout 45 "$adb" install -r -t "$probe" > "$out/readonly-observer-install.txt"
port=$("$adb" forward tcp:0 tcp:63487)
timeout 150 "$adb" shell am instrument -w -r -e diagnosticPort 63487 "$observer/com.ecojust.graphicsqa.GraphicsObserver" > "$out/readonly-observer-instrumentation.txt" 2>&1 &
observer_pid=$!
cleanup() {
    "$adb" shell am force-stop "$target" || true
    "$adb" forward --remove "tcp:$port" || true
    wait "$observer_pid" || true
}
trap cleanup EXIT
until_time=$((SECONDS + 110))
while ((SECONDS < until_time)); do
    if curl -fsS --max-time 8 "http://127.0.0.1:$port/capabilities" -o "$out/last-capabilities.json" 2>>"$out/capability-attempts.log" &&
        jq -e '.contextRead == true and (.version | type == "string") and (.unmaskedRenderer | type == "string")' "$out/last-capabilities.json" >/dev/null; then
        cp "$out/last-capabilities.json" "$out/game-webview-capabilities.json"
        break
    fi
    sleep 2
done
jq -e '.contextLost == false and (.version | contains("WebGL 2")) and (.unmaskedRenderer | ascii_downcase | contains("llvmpipe"))' "$out/game-webview-capabilities.json" > "$out/real-host-renderer-verified.txt"
exit "$route_status"
