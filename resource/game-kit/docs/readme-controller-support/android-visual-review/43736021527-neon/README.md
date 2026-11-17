# Neon Rush Android screenshot review

Four original PNGs from runtime 43736021527 were opened individually. The raw Android report passed all 8 checks, including 68/68 same-sequence SDK ACKs. APK source is a657ce24, observer source ed925cc1, and QA source e8a46fb7; exact package, report and screenshot hashes are in `review.json`.

The English menu and pause view show a complete actual QR pattern, phone URL, fixed Wi-Fi address on port 63485 and A/X drift, B/Y nitro, START controls. The menu footer reads 0.1.2. Gameplay and reconnect images render the race, vehicles, HUD and controls cleanly; the QR/help sidebar is intentionally hidden during active racing. No blocking layout clipping or overlap was seen. Menu and gameplay are suitable final preview candidates.

These are actual signed-APK Android TV emulator captures, not synthetic bridge-browser previews or physical-TV tests. QR visibility does not establish scan/decode success. This review did not modify production, raw evidence or gallery assets.
