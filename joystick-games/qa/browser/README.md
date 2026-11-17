# Browser validation

This suite runs the actual built game with ordinary keyboard input and a clearly labelled synthetic `PureGameHost` bridge. It does not claim TCP, Android, macOS, physical TV or ESP32 coverage. Native SDK tests are separate.

The bridge fixture changes input only. Tests read `JoystickGameQA.snapshot()` and rendered DOM; they never write game state, skip checkpoints, set scores or replace clocks. Every run writes source hashes, exact executed test sources, raw snapshots, screenshots and failures into a new output directory. Existing runs are never overwritten.

Use installed Playwright 1.64.1 and PNGJS 7.0.0 via `PURETV_PACKAGE`; use system Chromium with SwiftShader for the local software renderer. Output and cache must be outside source and generated assets.

```sh
TMPDIR=/dev/shm/joystick-qa-tmp \
PURETV_PACKAGE=/dev/shm/joystick-qa-deps/package.json \
node joystick-games/qa/browser/run.mjs \
  --game cf-transport-ship --assets /path/to/dist \
  --output /path/to/new-evidence --suite controls
```

960×540 and 1280×720 layout checks inspect full identity text, icon bounds, viewport overflow and actual page captures. Captures still require separate human/model visual review; the raw report never self-declares that review complete. Video capture retains only actual, monotonically timestamped CDP frames; frame omissions are logged and 30 fps export is not a device performance claim.

The `controls` suite uses a synthetic nine-button bridge. It waits for the game's cached input poll to advance on both press and release, and then observes gameplay effects. CF checks actual movement, turning, aiming, firing/ammo use, completed reload, airborne jump and weapon switching. QQ checks actual acceleration, original steering direction, drift, recovery, and cancellation without a free drift reward. Both check pause/resume, disconnect/reconnect and layouts. It does not use fixed short delays as proof that input reached the model.

`boosts.mjs` exercises QQ resource actions separately. It earns a small-boost window and nitro stock by normal drift inputs, then verifies X increments the actual small-boost count and B reduces stock while increasing the actual nitro timer/count. It never grants inventory. Invoke with the same environment variables:

```sh
node joystick-games/qa/browser/boosts.mjs \
  --assets /path/to/qq-speed/dist --output /path/to/new-evidence --seconds 900
```

`race.mjs` uses only ordinary browser keyboard events and menu clicks, without the bridge fixture. Its driver reads the public road-lookahead snapshot to steer; it must cross the actual ordered checkpoints and reach the normal results screen. It cannot set laps, position, resources or time. A slow software GPU may require a longer real-time budget:

```sh
node joystick-games/qa/browser/race.mjs \
  --assets /path/to/qq-speed/dist --output /path/to/new-evidence \
  --map city --mode speed --seconds 1200
```

Run one WebGL browser at a time on a shared software renderer. Every run retains its exact executed sources, so later improvements to the test driver cannot retroactively change earlier evidence. Failed attempts must remain available with their original status; a later pass is a separate run.
