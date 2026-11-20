# Game Kit controller UI regression

Nine README games were checked in Chromium at 960×540 and 1280×720. All 18 final cases select level 2, start, and pause through normal keyboard input. No game model, clock, renderer, or gameplay state was written by these tests. Native connection metadata is an explicit fixture, not physical television or ESP32 evidence.

- `attempt-3/` contains the 18-case ordinary-input run and unedited screenshots. Glass Fold menu blur was rejected after visual review; its two final cases come from `attempt-4/`.
- `wifi-status-layout/` contains 12 Chinese/English registering, discovery-unavailable, and stopped states on one horizontal and one vertical rail at 960×540. Text ranges must stay within the visible card; stopped services show no stale address.
- `scroll-and-visibility-attempt-2/` proves actual mouse-wheel scrolling in Packing Sculptor and Prism Relay, and proves Glass Fold's connection help is above the menu backdrop. Corresponding final assets are in `final-scroll-assets/`.
- `model-reuse.json` binds the eight unchanged puzzle rule models to their previous signed APKs and prior verification. Neon rules match the already verified macOS 0.1.3 steering fix; the older Android 0.1.1 model is not reused.
- `final-source-binding.json` binds all nine current payloads to the ordinary-input run. The only later differences are the reviewed status wording and one vertical scrolling rule; their exact diffs and targeted tests are included. `final-payload/` and `final-sources/` preserve the final bytes.

Failure history is retained: setup attempt 1 imported a nonexistent helper; attempt 2's first assertions missed a clipped Wi-Fi card; attempt 3's Glass Fold fullscreen backdrop blurred connection help; the first actual scroll check found inherited `overflow:hidden`. Raw reports are unchanged, with separate visual-rejection supplements where appropriate.

`visual-review.json` lists the screenshots actually inspected. `verification.json` summarizes coverage and limits. Each run includes its executed script, asset hashes, and stdout. The ordinary-input runner is also maintained at `resource/game-kit/qa/readme-controller-ui.mjs`.

Reproduction uses Chromium plus the Node dependencies exposed through `PURETV_PACKAGE`, for example:

```sh
TMPDIR=/dev/shm/neon-chrome-temp PURETV_PACKAGE=/dev/shm/puretv-market-sync/desktop/package.json node resource/game-kit/qa/readme-controller-ui.mjs --output /dev/shm/new-gamekit-ui-attempt --qr /path/to/qr-fixture.png
```

All build/test output was written under `/dev/shm`; scripts retain the original execution paths for provenance. `QrFixture.java` generated the actual QR from its documented fixture URL. The archive's scripts are evidence of the original invocation, not promises of portable absolute paths. Native TCP/lifecycle preflight is documented separately in `../preflight/` and final Android validation belongs to the release CI.
