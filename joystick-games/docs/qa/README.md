# QA evidence

Browser evidence below was generated from the frozen production game bytes in commit `e7a7c9a9b823052425b7ea111d61896b2f92ea60`. The browser scripts were developed and run after the production freeze; each run includes its own exact `executed-source/` copy. The source hash in each report, rather than the current working copy of a QA script, identifies what was tested.

| Game | Frozen `dist/tv.html` SHA-256 |
| --- | --- |
| CF transport ship | `9128ffc33f14d73da2205baf992c9f5f016ad3ff29b9744f1a2bb1fe375cd472` |
| QQ Speed | `82322636083050a14f6e35e8a4dbef0683ca721c38d4b7e12ddbe5ec95a54c8c` |

## Browser controls and resources

These tests run the actual built games. The controls/resource suites supply a **synthetic native-input bridge**; they do not prove Android APK, macOS app, TCP, physical TV or ESP32 operation. Android and macOS native SDK tests have separate evidence and scope. No browser test writes game state, inventory, lap counters or clocks.

| Evidence | Result | Actual coverage |
| --- | --- | --- |
| [CF controls](cf-controls/report.json) | 12 groups passed | Menu/start, cached controller icon and full ID, actual movement/turning/aiming, shots and ammo use, reload completion, airborne jump, weapon switching, pause/resume, disconnect/reconnect, both viewport sizes. |
| [QQ controls](qq-controls/report.json) | 11 groups passed | Menu/start, actual acceleration and original steering direction, drift, cancellation without a free drift reward, normal reset, pause/resume, disconnect/reconnect, both viewport sizes. |
| [QQ earned resources](qq-resources/report.json) | 2 groups passed | Normal drift earns a small-boost window, X consumes it and starts boost; continued drift earns nitro, B consumes stock and starts nitro. |
| [QQ complete race](qq-race/report.json) | 2 groups passed | Ordinary menu clicks and keyboard events complete one city/speed lap through the actual game and reach its normal results screen. No bridge fixture is used in this run. |
| [QQ menu coverage](../../qq-speed/docs/menu-browser-attempt-3/report.json) | 10 cases passed | 960×540 and 1280×720 menus; every combination of the four maps and two modes reaches a rendered countdown through ordinary controls. This is not eight complete races. |

The QQ resource [independent snapshot review](qq-resources-review.json) confirms the small-boost timer changed from 0 to 0.958 seconds and the earned window was consumed; nitro stock changed from 1 to 0 and the nitro timer reached 2.758 seconds. Item-mode pickup/use is outside this test.

The CF [mechanics review](cf-controls-mechanics-review.json) additionally verifies reload increased the magazine from 28 to 30 while reducing reserve from 90 to 88, with no death or respawn, and that jump raised the actual player from y=0 to y=0.47 while becoming airborne.

The QQ [complete-race review](qq-race-review.json) confirms `finished=true`, `lap=1`, `resultShown=true`, first place, zero resets and zero collisions. The actual 960×540 results capture displays `00:42.20`, all six racers and both replay/lobby actions. This is game time; the software-rendered run took about 16.1 minutes of wall time including its normal results wait. Its [archive](qq-race-archive.json) preserves the exact ordinary input sequence, read-only snapshots, test sources and unmodified menu/results images. This one race does not claim every map/mode, native TCP or physical-controller completion.

The original captures were separately inspected: [CF review](cf-controls-visual-review.json), [QQ review](qq-controls-visual-review.json). All nine captures per controls suite show actual rendered game/menu/pause content. The full controller ID wraps and remains visible. At 960×540 some menu options and service information require ordinary internal scrolling; the reviews document this explicitly. The QQ temporary instruction hint uses wall-clock time and can expire before countdown finishes on a slow software renderer.

The QQ controls archive retains its actual CDP capture, raw timestamped JPEGs and a fully decoded 330-second video. Video export at 30 fps is not a physical-device performance claim. Its scope is the recorded controls/lifecycle segment, not a full race. Original file hashes are recorded in [CF archive](cf-controls-archive.json), [QQ archive](qq-controls-archive.json) and [QQ resource archive](qq-resources-archive.json).

## Retained failed attempts

[CF attempts 1–3](browser-attempts/README.md) retain their original reports, inputs, images, videos and exact test sources. The first two exposed test assumptions about menu focus and input polling; the third verified five groups before the software renderer exceeded the short wall-clock allowance for reload. The final 12-group run uses a natural state predicate with a longer wall-clock bound, without accelerating game time. Earlier failures are not relabelled as passes.

[QQ race attempt 1](browser-attempts/qq-race-1/report.json) retained its original menu timeout: after choosing one lap, the QA driver pressed Enter while focus was still on that option. The game correctly confirmed the selected option again. The next driver uses the normal visible Start button. No product change or gameplay result is claimed from this attempt.

Native Android evidence under `android/`, shared-input unit evidence under `shared/`, and the macOS workflow artifacts must be interpreted using their own recorded source/package hashes and explicit coverage. Browser results alone do not certify a release package.
