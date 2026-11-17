# Seven arcade games: Web controller evidence

This directory records the Web runtime work for Super Mario, Bomb Jack, Adventure Island, Tetris, Jewel, Jackal and Tank. The games retain their original models, artwork and phone/remote control paths. The new Wi-Fi input path uses the common `legacy-controller-web/puretv-controller.js` adapter.

The runner uses real Chromium animation frames, actual game renderers and ordinary bridge input snapshots. Its Android bridge, discovery response and QR image are synthetic. It does **not** test native TCP, mDNS, QR decoding or physical TVs/phones/ESP32 controllers. Separate native and TCP QA reports cover those layers. No model state or clock is changed by this runner.

## Recorded checks

`complete-final-zh/` and `complete-final-en/` both pass all seven games with the exact final source hashes. `wifi-states-final-zh/` and `wifi-states-final-en/` exercise the same assets across both required sizes and five service states (140 state/size/game/language combinations). Earlier `final-*` and `layout-final-*` folders are retained historical successful runs before the last UI text update.

- START short pulses, Y/SELECT menu navigation, and actual positive/right and negative/left screen-axis movement.
- Manual pause followed by disconnect/reconnect resumes with one fresh START.
- Disconnect freezes game players; reconnect with held action/START remains paused; release then fresh START resumes.
- The A pulse and resulting state are captured, but this runner does not assert every game-specific A/B effect. See the independent TCP QA for effect checks.
- Chinese and English menus at 960×540 and 1280×720, with body and sidebar measurements. Five additional connection states exercise connected, registering, discovery failure with a live TCP address, service failure without a port, and stopped service. Native numeric error codes must not appear as help text.
- Selected screenshots for every game and both sizes are inspected directly, plus final-runtime failure/connected/registering/stopped screens; `visual-review.json` lists exactly which files were reviewed and which source stage they represent. The white rectangle in the QR location is the explicit synthetic image fixture.

Each run folder contains the exact executed runner, raw report and screenshots. Earlier failures are retained with causes in `summary.json`; their reports are not rewritten to pass. No video was recorded by this runner.

## Reproduce

Provide the existing desktop Playwright dependency via `PURETV_PACKAGE` (an absolute path to its `package.json`) and a Chromium executable. Keep scratch/browser output outside the repository. Jackal's existing artwork extractor reconstructs its deliberately external artwork from its verified previously released APK:

```sh
python3 resource/apps/jackal/tools/extract-artwork.py --output /absolute/scratch/jackal-art
TMPDIR=/absolute/scratch/browser \
PURETV_PACKAGE=/absolute/dependencies/package.json \
CHROMIUM_PATH=/usr/bin/chromium \
JACKAL_ART_DIR=/absolute/scratch/jackal-art \
ARCADE_LANGUAGE=zh-CN \
ARCADE_QA_OUTPUT=/absolute/scratch/arcade-input \
node tools/tests/arcade-wifi-runtime.mjs
```

Use `ARCADE_LANGUAGE=en-US` for English, `ARCADE_LAYOUT_ONLY=1` for the full service-state/layout checks, and optionally `ARCADE_GAMES=jackal,tank` to select games. Archived scripts resolve the repository relative to `tools/tests/`; replay an archived version from that location in an isolated checkout, not directly from its evidence folder.

`executed-assets/` contains frozen assets with final state UI. `initial-frozen-assets/` preserves the source before the final localized failure-state update. `input-tested-css/` preserves the earlier CSS from the first complete input runs, reconstructed and checked against the raw report hashes. `SHA256SUMS.txt` covers the archive. The final source baseline and each asset hash are in `summary.json`; build/signing/publication are outside this Web-only record.
