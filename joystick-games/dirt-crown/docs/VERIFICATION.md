# Dirt Crown verification

The source and synthetic-bridge browser checks are complete. This report does not claim an installed Android, macOS or Windows package, a real SDK session, or physical TV/controller acceptance.

## Preserved source and offline build

The original is `triptych/web-games-andrew` at `a7051c34fe2e7550fd206e6272f758df171855b0`, `game-069`. The lost earlier uncommitted adaptation was not recovered: this directory was built again from that fixed source. `upstream.json` records 36 files, and `dependency-lock.json` records 23 fixed dependencies. Original simulation and procedural art are preserved, including 20 tracks, 7 regions and 26 career events.

The exact offline build contains 63 files, approximately 2.70 MB. Three.js 0.165.0, its referenced add-ons, and Bungee/Rubik fonts are local. The builder checks static module closure, dependency hashes and exact distribution contents. `dist-sha256.json` and the per-output `asset-provenance.json` record the result. The original root MIT grant is also included in `dist/UPSTREAM-LICENSE.txt`; local dependency licenses remain with their files.

Nine adaptation tests pass, including manual throttle, independent buttons, disconnect cancellation and menu-held-key isolation. The author's fixed simulation test passes 1,051 checks across purity, tracks, determinism and rules; only relative import paths were adjusted. The exact original test, adaptation and logs are retained. Full career-bot, full-lap and complete-race tests were not run.

## Current browser evidence

`browser-attempt-5/` completed using tracked source from checkpoint `afe180426a4dbbdad86d4904ab8ec846f6aaab44` plus the fixed local Three.js core module. The first native CI later showed that the root `build/` ignore rule omitted that core module from Git; the frozen distribution hashes identify the actual tested bytes. The original tracked-only checkpoint declaration and its scope correction are both retained in `source-checkpoint.json` and `source-coverage-review.json`. Its 10 automatic checks pass. An independent validator confirms all 55 recorded resource responses match the frozen distribution hashes, all six PNG hashes/viewports match, there are no external runtime requests or JavaScript errors, and images described as gameplay are not paused. All six PNGs were opened and visually inspected; the individual notes and hashes are in `visual-review.json`.

Normal nine-button inputs navigated the original menus, selected Low through the original graphics setting, launched Free Race and waited for the unchanged countdown. Explicit UP accelerated the original car; the 1280×720 capture records speed 3.1441 with throttle 1. Original pause freezes race time and position. Blur and disconnect clear controls, reconnection with held buttons remains paused, and deliberate START resumes without re-pausing when START stays held across at least three consumed frames. Poll count equals consumed animation-frame count. The actual supplied synthetic ID is visible in menu, race and pause states; no signal strength is fabricated.

`thumb.png` is an unchanged copy of the actual `driving-1280.png`, with its provenance and SHA in `thumb-provenance.json`. At 960×540 the full controller ID and primary menu actions are visible; the side panel's 28vh scroll area does not show all secondary service/address/port details at once. Earlier attempt 4 provides actual 960×540 driving images for the previous input-adapter version, not full acceptance of the final adapter.

The browser uses a synthetic `PureGameHost` with ID `Dirt-Synthetic-42`. It does not demonstrate an actual phone, physical pad, host SDK or installed package. Software-rendered timing is not a TV performance measurement. The observed gameplay is a short race start, not race or career completion.

## Earlier attempts retained

- Attempt 1 failed on three missing Three.js add-ons. Those pinned files were added and import-closure validation was introduced; the original failing report is unchanged.
- Attempt 2 successfully navigated settings, created the original Kit career, used the original story skip, reached the Hub and launched Free Race. Its 60-second wait ended at countdown 0.5667 with zero speed. It is not a driving pass. The earlier two-line footer overlapped buttons and was subsequently shortened.
- Attempt 3's queued execution session disappeared before browser launch. Its `execution-interrupted.json` documents this as interrupted execution, not a game failure.
- Attempt 4 reached actual 960×540 manual-throttle driving and passed its original automatic checks. Visual/state review found its final image named `playing-1280` was paused. `review-override.json` rejects that attempt's overall acceptance. The adapter was then fixed to preserve held-button edges on resume and isolate held menu keys; attempt 5 tests those fixes explicitly.

## Native QA handoff

The 24-step data-only `qa-plan.json` is schema-valid, with natural Kit career creation and 1,200 ms held-START resume checks. After the browser run, its start gate was strengthened to require original `gameplay.mode == race`, `phase == race`, `countdown <= 0` and `paused == false`; title-background race state cannot satisfy that gate. It waits up to 60 seconds for the original countdown without changing clocks or physics. Natural career creation calls the original `persist()` and writes `dirt-crown.v1.profile`. Plan validation and source references are in `qa-plan-validation.json`. Native execution and process-restart persistence remain unverified here.

## First Android build attempt and source packaging correction

Run [44597102731](https://github.com/ecojust/pureTV/actions/runs/44597102731), exact source `8f283c73f52f857777306eafc88f710262367834`, completed with failure. The 9 adaptation tests and 1,051 simulation checks passed. The offline build then failed with `Unresolved module js/main.js -> three`: the root `build/` ignore rule had omitted `src/vendor/three/build/three.module.js` and its dist copy from the commit. These were the only local runtime assets missing from the frozen Git tree. Both original files were present during browser verification, each 1,284,652 bytes with SHA-256 `5916c8dfb5f4e3eede312de305345868d4a0a8105383b080c6985565d6e79b46`.

The correction adds a game-scoped ignore exception and includes those identical bytes; no runtime, physics, dependency-version or distribution-content change is made. A new empty scratch tree was reconstructed from 132 frozen Git entries, with every local byte checked against its frozen blob OID. It reproduced the original missing-module failure, then passed the exact 63-file, 2,698,500-byte build check after adding only those module copies and the ignore exception. An earlier archive attempt waited on a promisor fetch and was stopped; none of its output was treated as test evidence. Before/after logs and reconstruction identities are in `android-attempt-1/clean-checkout-fix-validation.json`.

The untouched Android report subset, original run/jobs and full export manifest are retained in `android-attempt-1/`; all 23 export files matched their recorded sizes and hashes. Original export commit: `0edb618064fd200697e791cf64e45a5566f4a9da`, branch `build-assets/joystick-catalog-android-44597102731-attempt-1`. Signing and runtime were skipped, so Android gameplay and installed persistence remain unverified.

The missing-core correction is committed as `98bf52b32e7936013ff5e404d0421a95c9b23a28`. A complete source/dist inventory check confirms all 126 local files are tracked at that commit and match their Git blob OIDs; this closes the earlier tracked-only source-binding gap. It does not replace a fresh native build/runtime result.

## Second Android run: original observation timeout

Run `44600442272`, source `06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7`, built and signed the APK (1,124,106 bytes, SHA-256 `e6a535e00f76f5b3f52f3a79a65a29ea0358896f1b8b56da0c57d7f3aa378b4c`) and installed it in normal and occupied-port modes. Both original runtime reports failed during the before-image observation in `capture(connected)`, before any gameplay scenarios. Each had 17 SDK messages and 17 ACKs. Their first initialized snapshot was frame 1 with `gameplay.mode=loading`; it does not prove the title menu had finished loading.

Hash-verified original logcat records explicitly show `WebView snapshot timed out` in Observer.java:102 for each target PID. The unchanged Java observer catches that exception and closes the request socket, which Python received as `RemoteDisconnected`. Direct capture/record observations had no transport retry. No FATAL EXCEPTION, Fatal signal or target ANR appears in the captured logcat. The instrumentation tail saying `Process crashed` must be read alongside the runner cleanup force-stop after failure; the next mode log confirms the normal target was stopped after its timeout. This evidence does not establish that the renderer is unsupported.

The untouched reports, ADB logs, wire records, instrumentation logs and original executed QA sources are retained in `android-attempt-2/original/`, bound to export commit `1c0de1034ac0bd6954cb0958a7f2ada3bb3d69a4`. A Python-only QA correction uses at most three fresh GETs within 45 seconds (at most 15 seconds per request), with each failed transport and recovery recorded. It never returns an old snapshot, does not retry valid HTTP/JSON failures, and preserves the current game/port/model/image checks. Caller wait deadlines are propagated. The Observer APK and game APK do not change.

Eight real localhost HTTP regression cases and all 35 shared runner tests pass. The first local run lacked a historical plan due to sparse checkout; its original failure is retained. The complete run used unchanged tests in isolated scratch with frozen Git-blob-verified historical plans, without changing global sparse checkout. Details and exact tested source hashes are in `android-attempt-2/qa-fix-validation.json`. A native rerun on the original signed packages is still required; the first failed reports remain failed.
