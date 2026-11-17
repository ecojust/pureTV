#!/bin/sh
# Captures the game as a phone would show it: an iframe of the phone's size, touch controls on.
#   tools/movil.sh [ancho] [alto] [out] [t] [n] [x]      GUION/TRUCOS as in captura.sh
cd "$(dirname "$0")/.." || exit 1
WW=${1:-844}; HH=${2:-390}; OUT=${3:-artifacts/movil-$WW-$HH.png}; T=${4:-100}; N=${5:-0}; X=${6:-150}
CHROME="${CHROME_BIN:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
mkdir -p artifacts; F="$PWD/artifacts/movil.html"
echo "<body style='margin:0;background:#000'><iframe src='file://$PWD/index.html?escena=${ESCENA:-nivel}&t=$T&n=$N&x=$X&guion=$GUION&debug=1&trucos=$TRUCOS&touch=1' width=$WW height=$HH style='border:0;display:block'></iframe>" > "$F"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --no-first-run --allow-file-access-from-files --window-size=$((WW > 500 ? WW : 500)),$HH \
  --virtual-time-budget=3000 --screenshot="$OUT" "file://$F" >/dev/null 2>&1
echo "$OUT"
