#!/usr/bin/env bash
set -euo pipefail
exe=$1
repo=$2
out=$3
# Both Android and the native app use the same ADB server and loopback-only namespace.
export XDG_CONFIG_HOME="$XDG_RUNTIME_DIR/config" XDG_DATA_HOME="$XDG_RUNTIME_DIR/data" XDG_CACHE_HOME="$XDG_RUNTIME_DIR/cache"
openbox >"$XDG_RUNTIME_DIR/openbox.log" 2>&1 &
wm=$!
"$exe" >"$XDG_RUNTIME_DIR/manager.log" 2>&1 &
manager=$!
trap 'kill "$manager" "$wm" 2>/dev/null || true' EXIT
/usr/bin/python3 "$repo/tools/desktop-offline-qa/native.py" "$out" "$manager" "$repo/joystick-games/neon-rush/resource.json"
