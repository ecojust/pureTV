# Four standalone 3D games: browser controller checks

Scope: Alien Shooter, Used Car Racing, Cozy Island and Coast Kart. These tests load the real bundled game and renderer, with an explicitly synthetic native Android bridge. Inputs use normal model paths and actual animation frames. No model, physics clock or camera is written. This is not TCP/NSD, physical TV/ESP32 or device-performance evidence; the release's official SDK/native checks are separate.

The native bridge consumes retained quick presses on snapshot reads. UI timers and diagnostics therefore use cached inputs and refresh only getInfo, rather than consuming an extra snapshot.

## Preserved attempts

- `attempt-1`: Alien gameplay/action checks passed, but the fixture allowed only 200 ms for START release to be sampled. On the software renderer a new START arrived before the model observed release, so resume timed out. No production rule was changed to make this pass.
- `attempt-2`: START release waited for the observed cached false state. Alien and Used Car passed all functional scenarios. Cozy's direction assertion used a fixed 650 ms wait; its next simulation sample had not happened, so the cached direction remained zero. The failing report and actual screenshots are preserved. The four examined runtime/model/HTML/CSS/adapter files were copied into `executed-assets/` before later UI changes.
- `attempt-3`: Normal updates now waited for observed fields; Cozy passed. Coast passed start, actions, manual pause and disconnection, then the reconnect fixture mistook the already-quarantined false cache for a newly sampled neutral frame. It sent the next START before the release was consumed. The final fixture also requires the snapshot read counter to advance before accepting a field match. This is a sampling acknowledgement, not a forced game step or clock.

The test fixtures intentionally send stale held snapshots on reconnect to check the browser boundary as well as native suppression. Real native sync already suppresses held action keys until release. Intermediate failure records remain unchanged. Each output directory retains its executed test script; source changes between attempts are described rather than rewriting reports.

## Completed preflight checks

- `adapter-unit.txt`: 6 adapter tests passed; the canonical adapter also matches all 11 legacy copies (`sync.py --check`).
- `final-input/report.json`: all 4 games passed normal START, direction input delivery, A/B/Y delivery, pause/resume, disconnect pause, stale held reconnect suppression and neutral-then-fresh-START recovery. It includes actual model/renderer snapshots. Assertions that input fields arrive are not by themselves proof of on-screen steering direction. `executed-assets/` contains all 24 files at the recorded hashes; Alien's old HTML was recovered by reversing only its documented version label edit and verified against the recorded SHA-256.
- `coast-screen-direction.json`: actual rendered kart mesh positions were projected offline with the real start-sample camera matrices. Screen x changed from -0.0542 to 0.0738 under right input, then -0.2737 under left input. Neither game coordinates nor camera/model setters define the expected direction. Used Car's independent directional acceptance is in the release owner's official SDK/native evidence.
- `layout-attempt-1`: Alien and Used Car passed Chinese/English at 960×540 and 1280×720, including the Used Car two-code HTTPS card and live native-info state changes. Cozy completed both Chinese screenshots before a 10-second status polling timeout. The report remains failed, without overwriting it.
- `final-layout-cozy-coast`: both games passed the same language/size/state checks with a longer 60-second polling allowance. No production update was made to address that timeout. Software-renderer duration here is not a device performance measurement.
- `sidebar-focus-attempt-1`: Cozy's music button reached focus and scrolled into view using normal Tab, but a strict zero-pixel border assertion failed. `sidebar-focus-before-css-followup` records a complete pass with the same 1 CSS pixel rounding allowance used for the other layout assertions; its 960px button bottom was 510.359px against a 510px sidebar edge. There are no DOM scroll/focus setters, only ordinary keyboard navigation.

`visual-review-pre-followup.json` records the original inspected PNG hashes. Wi-Fi addresses, mapping and original QR panels were readable in all 16 views. Cozy's bottom music control is reachable through normal keyboard focus/scroll, as shown by the separate screenshots. Visual inspection also caught a real Coast Chinese 1280px heading crop (`sidebar.top=-3.75`) which the original Wi-Fi-only geometry assertion did not check. The authorized follow-up changes only Coast's `.sidebar` `align-self` to `stretch` so its existing scrolling is bounded by the available main area; game logic and renderer are unchanged. The focused follow-up adds explicit whole-sidebar and heading bounds plus ordinary Tab/Control+Home navigation in both languages/sizes. Its result is recorded separately rather than replacing the earlier evidence.

`final-layout-coast-css/report.json` passed all four focused cases on CSS SHA-256 `f816438e78245579d8888e2cc3911bbad0a9ece0f0ef87c8ef9ee9be7a530b0b`. Its eight original screenshots plus the two Cozy focused screenshots were visually reviewed and hashed in `visual-review-final-followup.json`. No other production file changed during this targeted follow-up.

## Version/source boundaries

`frozen-source-hashes.json` binds the initial production freeze to commit `a657ce24`. Alien's preflight footer says **0.1.2**; the release owner authorized a version-label-only update to **0.1.3** after these captures, recorded in `version-label-followup.json`. The later Coast CSS follow-up is also recorded separately. These preflight screenshots are not screenshots of the final signed APK. Final APK hashes, official SDK/TCP tests and any Android instrumentation acceptance must be bound by the release owner to the later build.

No physical TV, ESP32, real NSD discovery, TCP server or APK installation is claimed by this browser-only evidence.
