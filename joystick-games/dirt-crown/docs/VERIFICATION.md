# Dirt Crown verification

The source and synthetic-bridge browser checks are complete. This report does not claim an installed Android, macOS or Windows package, a real SDK session, or physical TV/controller acceptance.

## Preserved source and offline build

The original is `triptych/web-games-andrew` at `a7051c34fe2e7550fd206e6272f758df171855b0`, `game-069`. The lost earlier uncommitted adaptation was not recovered: this directory was built again from that fixed source. `upstream.json` records 36 files, and `dependency-lock.json` records 23 fixed dependencies. Original simulation and procedural art are preserved, including 20 tracks, 7 regions and 26 career events.

The exact offline build contains 63 files, approximately 2.70 MB. Three.js 0.165.0, its referenced add-ons, and Bungee/Rubik fonts are local. The builder checks static module closure, dependency hashes and exact distribution contents. `dist-sha256.json` and the per-output `asset-provenance.json` record the result. The original root MIT grant is also included in `dist/UPSTREAM-LICENSE.txt`; local dependency licenses remain with their files.

Nine adaptation tests pass, including manual throttle, independent buttons, disconnect cancellation and menu-held-key isolation. The author's fixed simulation test passes 1,051 checks across purity, tracks, determinism and rules; only relative import paths were adjusted. The exact original test, adaptation and logs are retained. Full career-bot, full-lap and complete-race tests were not run.

## Current browser evidence

`browser-attempt-5/` completed using the runtime source from checkpoint `afe180426a4dbbdad86d4904ab8ec846f6aaab44`. Its 10 automatic checks pass. An independent validator confirms all 55 recorded resource responses match the frozen distribution hashes, all six PNG hashes/viewports match, there are no external runtime requests or JavaScript errors, and images described as gameplay are not paused. All six PNGs were opened and visually inspected; the individual notes and hashes are in `visual-review.json`.

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
