#!/bin/sh
# Regenerates the app icons from the `icono` scene: a 720x720 badge cropped from the
# 4x capture, then scaled with sips (macOS). Run from anywhere.
cd "$(dirname "$0")/.." || exit 1
CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP=$(mktemp -d)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --window-size=1280,720 --virtual-time-budget=2000 \
  --screenshot="$TMP/full.png" "file://$PWD/index.html?escena=icono" >/dev/null 2>&1
sips -c 720 720 "$TMP/full.png" --out "$TMP/badge.png" >/dev/null
sips -z 512 512 "$TMP/badge.png" --out icons/icon-512.png >/dev/null
sips -z 192 192 "$TMP/badge.png" --out icons/icon-192.png >/dev/null
sips -z 180 180 "$TMP/badge.png" --out icons/icon-180.png >/dev/null
# Maskable: the badge scaled to the 80% safe zone over the sky colour.
sips -z 410 410 "$TMP/badge.png" --out "$TMP/small.png" >/dev/null
sips -p 512 512 --padColor 1C2140 "$TMP/small.png" --out icons/icon-maskable-512.png >/dev/null
rm -rf "$TMP"
ls -la icons
