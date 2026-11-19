# Kart Rush verification

Source and synthetic-bridge browser checks are complete. This report does not claim an installed Android, macOS or Windows package, an actual SDK session, or physical TV/controller acceptance. Upstream game licensing remains unresolved; dependency MIT grants do not cover the game. `LICENSE.txt` and `dist/UPSTREAM-LICENSE.txt` are license-status notices, not new grants.

## Original source and offline build

The fixed original is `stevkazt/kart-rush` at `4b0cf276d84e76171feb765d87b5e8a6159cc421`. Nine original file hashes and four dependency-file hashes are recorded. Local Three.js 0.160.0 and cannon-es 0.20.0 require no npm download at build time. The exact build contains 21 offline files, 2,575,015 bytes; `dist-sha256.json` and per-output provenance record them.

Eight adaptation tests pass. All 8 formal tracks, 7 Grand Prix races, 8 drivers and original 6-car/3-lap rules remain. The entire original CFG is byte-identical, as are original drivers, kart bodies, sound, icons and CSS. Tests cover explicit throttle, disabled telemetry/debug access, independent nine-key input, drift/input cancellation, reconnect quarantine and menu-held-key isolation. `source-changes.json` and the original-main adaptation diff identify all upstream edits. Initial development-only check failures are retained separately: a static-import regex matched prose, and an early test lacked the real CANNON dependency. No model rules were altered to satisfy those checks.

The adapter adds original-menu navigation, normal keyboard name entry, actual supplied controller ID, once-per-frame polling, and deliberate resume after focus loss or disconnect. TV input has no implicit auto-gas. Original drifting follows held steering; A/B use the original item actions and X uses original reset. Cancellation clears charged drift without awarding its normal release mini-turbo. START remains held safely across resume. The original item inventory is retained as a noninteractive HUD with A/B labels; only on-screen touch controls are hidden.

## Current browser evidence

`browser-attempt-3/` completed with 14/14 automatic checks passing. Independent validation confirms all 16 recorded local responses match the frozen distribution, all nine screenshot hashes/viewports match, there are no JavaScript errors or external runtime requests, claimed gameplay captures are unpaused, and supplied identity bounds fit the card. All nine PNGs were opened and visually inspected; `visual-review.json` records each hash and finding.

Normal nine-button input entered Q through the original name keyboard, submitted the original form and wrote `kartrush.profile`. The game waited for its unchanged countdown; explicit UP accelerated the kart to speed 3.5704 in the 960×540 capture. The later 1280×720 gameplay capture records speed 4.4397 after manual focus resume. The original X reset, Y help, B return, pause freeze, disconnect cancellation, held reconnect quarantine and START held across at least three consumed frames all passed. The item inventory is visibly restored at both viewport sizes, alongside readable speed, rear-view, map and supplied ID. Menu setup cards fit beside the reserved identity area.

The optional 30-second normal-UP pickup observation reached no ready item. It is recorded as `notClaimedAsItemUsePass` in the original report: inventory visibility is verified, but actual pickup/use effects are not claimed. No inventory, model, score or clock was injected. Original reset ghost protection makes the car translucent in the later captures; this is the original effect.

`thumb.png` is an unchanged copy of `browser-attempt-3/playing-1280.png`; `thumb-provenance.json` records its SHA. At 960×540 the full supplied ID remains visible, while the panel's scroll area cannot show all secondary service/address/port details at once. At 1280×720 those details fit. Runtime source remained unchanged throughout the run: it is source checkpoint `8612bc0` plus the item-HUD fix, whose exact patch and source hashes are archived with attempt 3. The input and model rules did not change for this final UI correction. Root subsequently committed these exact runtime and QA-plan bytes as `8f283c73f52f857777306eafc88f710262367834`; `source-checkpoint.json` records the match.

## Earlier attempts retained

- Attempt 1 never launched: its queued execution session disappeared, leaving only planned artifact hashes. `execution-interrupted.json` records this as execution interruption, not game failure.
- Attempt 2 completed with 12/12 automatic checks, 16 matching resource responses and 11 matching screenshots. All images were visually reviewed. Normal inputs opened every original track/driver picker, selected Rex and saved it, drove with explicit UP, reset and passed lifecycle checks. Review then found the original inventory was hidden together with touch controls. Its `review-override.json` therefore records core-input/menu acceptance but rejects overall acceptance. The original automatic report was not rewritten. The HUD-only fix was verified by attempt 3.

Browser input is a synthetic `PureGameHost` supplying `Kart-Synthetic-18`, not a real phone/host SDK connection. SwiftShader timing is not TV performance. No full lap, complete race, Grand Prix completion or every-item test is claimed.

## Native QA handoff

The 14-step data-only `qa-plan.json` validates with the repository parser. The race-start gate requires original `gameplay.phase == race`, `countdown <= 0`, and `paused == false`, with up to 60 seconds for the unmodified countdown. Name submission naturally calls the original `submitHello()` and writes `kartrush.profile`; the original start action also writes `kartrush.sitOut`. The plan includes 1,200 ms held-START resume assertions. Validation and source references are recorded in `qa-plan-validation.json`; native execution and process-restart persistence remain unverified here.

## First Android build attempt

Run [44597105538](https://github.com/ecojust/pureTV/actions/runs/44597105538), exact source `8f283c73f52f857777306eafc88f710262367834`, completed with failure. Kart Rush's eight unit checks, 21-file offline payload and Android boundary checks passed. The next step, fetching the existing fixed ZXing QR encoder, failed with curl exit 22 before the APK/Observer builder ran. Signing and native runtime were skipped. This is not a native gameplay result. The untouched report subset and GitHub job/annotation records are in `android-attempt-1/`; all 22 files in the complete export matched their recorded sizes and hashes. The full original export is commit `a95b504fd6278aec7758e3b49c1b1896500235ab` on `build-assets/joystick-catalog-android-44597105538-attempt-1`. Exact HTTP status was unavailable in retained reports; the separate local job-log download also returned 403 and is not treated as the original failure cause.

## Original Android second run

Run `44600152694`, source `06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7`, built and signed the 948,563-byte package and passed both actual installed Android TV emulator modes, each with 52 checks. The 513/512 accepted SDK messages each have an original host ACK; normal port 63485 and occupied fallback 43313 stay stable. Independent signature/source/payload audit and all 14 original screenshots plus six sampled video frames are retained in `android-attempt-2/`. Both original reports remain unchanged. The whole batch export flag remains false because the other games failed. This is per-game Android evidence, not a Mac/Windows or physical-device result, and not package publication.
