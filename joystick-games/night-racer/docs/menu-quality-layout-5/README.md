# Pause layout and original quality-menu verification

This is a DOM-only browser check. It imports the actual TV adapter and shared controller bridge, uses the final built HTML/CSS, and extracts the original quality settings/reload and Resume handlers from `src/src/main.js`. It does not instantiate WebGL, race physics, a countdown or native TCP. The displayed `renderer: webgl2` is the adapter identity field, not proof that this fixture rendered WebGL.

Run saved as:

```sh
TMPDIR=/dev/shm/racing-review-arcade/tmp timeout --signal=TERM --kill-after=5s 90s node joystick-games/night-racer/tests/menu-quality-layout.mjs 5
python3 joystick-games/night-racer/docs/menu-quality-layout-5/verify-evidence.py
```

The first command completed with exit 0. Use a new attempt suffix for another browser run: the script refuses to overwrite an existing report. The second command only verifies saved evidence, hashes and plan consistency; it does not rerun the browser.

English and Chinese at 960×540 and 1280×720 all passed. The fixed ordinary-key route from the original Start focus is `UP RIGHT DOWN RIGHT A DOWN LEFT LEFT LEFT LEFT A`, selecting the existing Low preset (labelled “Smooth” / “流畅”). The original handler saves `nr-gfx` and calls ordinary `location.reload()`. After reload, Low and Start focus were observed; START invoked the fixture's start callback. This is menu verification, not a real race-start or performance result.

All original five pause buttons fit, their centers hit the intended controls, and Resume is beyond the controller card's right edge at x=202. Resume begins at x=258.25 / 418.25 (English 960/1280) and x=303.59 / 463.59 (Chinese 960/1280). Pointer and nine-key A each invoked the exact original Resume handler once. The only pause behavior used here is a stub recording its callback; real pause stability remains a separate native/gameplay check.

The final 20-step native plan prepends these 11 menu actions. Its prior nine steps are retained; START additionally expects Low and still waits for the original `race` state before acceleration. Native host behavior across reload, actual held-button durations, native countdown progress and all subsequent gameplay remain pending for this new source revision. No default-quality or simulation changes were made.

Earlier attempts are preserved:

- Attempt 1 used the shorter template Start label and the earlier observer field placement. It is not final-path proof; it also contains the original nine-step plan and successful final build/unit logs.
- Attempts 2 and 3 used the exact three-lap Start label and exposed the invalid initial RIGHT route at English 960. Their original failure reports remain intact.
- Attempt 4 recorded geometry and successfully used case-specific ordinary-key paths. Those graphs established the shared `UP RIGHT DOWN RIGHT` route.
- Attempt 5 uses that single shared path in all four cases and matches current source/dist hashes. `executed-menu-quality-layout.mjs`, `executed-fixture.js`, `report.json`, screenshots and `validation-summary.json` preserve execution and review evidence.

Original Android v2 normal/occupied reports each passed 47 checks and remain unmodified. The new layout was prompted by their actual paused image; their signed package and successful runtime results do not certify this later CSS/observer revision.
