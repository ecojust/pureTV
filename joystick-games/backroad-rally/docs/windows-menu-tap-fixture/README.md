# Backroad menu tap QA

Current contract: root coordinated the marker name `menuTap: true` for both native Mac and Windows QA after the actual Mac01v3 reports showed the same menu-repeat issue. Only the33 markers were renamed; original keys, holdMs, expectations and six later held gameplay steps remain unchanged. `shared-menu-tap-plan-validation.json` records the new exact plan hash. The earlier Windows-only analysis/plan-validation below remains historical evidence; no native rerun is claimed.

Original run `44606210717` / source `c5ad63e` remains failed. `analysis.json` records actual focus, input-release and wire timing evidence. The old test kept nominal 100ms menu inputs held for multiple seconds while waiting for diagnostics; some expectations matched before the new input was consumed.

The first33 explicit menu steps are now marked `windowsMenuTap: true`; original keys, holdMs, expectations and six later held gameplay steps are unchanged. The Windows owner implements immediate16ms down/release plus exact counter, stable-focus and released-input checks. macOS/Android behavior is unchanged.

`result.json` records8 passing contract checks using the unchanged actual Windows bridge, Backroad adapter and original MenuController/Row in real Chromium with GPU/WebGL disabled. It verifies coalesced short-press preservation, single row movement, absence of repeat after650ms and single A confirmation. Native input is synthesized in this isolated fixture; it is not Windows/native SDK/gameplay acceptance. All fixture runtime input-source bytes match the original Windows source.

Run from the repository root: `TMPDIR=/dev/shm/racing-review-driving/tmp node joystick-games/backroad-rally/docs/windows-menu-tap-fixture/run.cjs`. The runner records every source hash and verifies no input changed during execution. An actual original-package Windows runtime is still needed.
