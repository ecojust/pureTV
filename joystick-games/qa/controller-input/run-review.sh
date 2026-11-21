set -euo pipefail
qa=joystick-games/qa/controller-input
chrome=$(command -v google-chrome)
if [[ $MODE == phone ]]; then
  python "$qa/phone.py" --payloads payloads --output qa-results --chromium "$chrome" --timeout 150 \
    --android-json android-json.jar --zxing zxing.jar --gameplay-module "$qa/expansion_gameplay.py" "$GAME"
else
  python "$qa/pc.py" --host player/host.py --payloads payloads --output qa-results --chromium "$chrome" \
    --timeout 150 --gameplay "$MODE" --angle swiftshader "$GAME"
fi
