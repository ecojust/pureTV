# Seven published racing Windows packages: 10013 impact and Windows-only 0.1.1 proposal

Read-only audit at `772c99ae35583ad1594cd9fffcc6368aa4df7201`. No packages downloaded/opened, source/version edited, native tests rerun, refs created or CI dispatched. `review.py` / `review.json` bind each retained original build manifest's input `main.cpp` to the exact Git source and the manifest's packaged EXE hash to the existing independent delivery audit. The same package map is present in `windows-release.json` and `packages.json.windows`. Original binary audits are reused, not newly repeated.

All seven **contain the affected old condition**. This is a possible failure on a denied default endpoint with no detected listener, not a claim that all users or seven original normal/occupied runs failed. A successful original listener-conflict test does not exercise an exclusive bound-but-not-listening socket or another 10013 denial. Those old packages remain unchanged and do not acquire the 772c fix.

| Game | Original Windows package source | Original successful selected-game run | Version |
| --- | --- | --- | --- |
| Kart Rush | c5ad63e8c6a0ccfada5f763d1d26afa27f45002e | 44606210717 (readonly reexport 44610944515) | 0.1.0 |
| Night Racer | 6c7cb4fdb99dce236b634c842326bae6aed5f232 | 44615299245 | 0.1.0 |
| Last Track | 6c7cb4fdb99dce236b634c842326bae6aed5f232 | 44615299245 | 0.1.0 |
| Penguintrack | 6c7cb4fdb99dce236b634c842326bae6aed5f232 | 44615299245 | 0.1.0 |
| Dirt Crown | 6c7cb4fdb99dce236b634c842326bae6aed5f232 | 44615299245 | 0.1.0 |
| Turbo Kart Rush | 039d210cfa4cc65f59adf0859a777f3591853a70 | 44621752383 | 0.1.0 |
| Ponpoko Kart | 232d544079a472aa0ffb259c1bc73c692b94504d | 44628818020 | 0.1.0 |

The retained manifests bind three distinct old main.cpp hashes: Kart `1c07f418…`, Night/Last/Penguin/Dirt/Turbo `eb8b7f2a…`, Pon `ec7511d3…`. Every one contains `error!=WSAEADDRINUSE&&!(error==WSAEACCES&&listening(63485))`. Their exact packages, full hashes and original source/manifest bindings are in `review.json`. All seven `dist/` trees equal their original package source and current 772c tree.

Backroad and Kart Royale are already the two new 772c validation targets; they have no published Windows package to patch. No other joystick project, including the separate Sugarplum host sample, is included in this assessment or proposed rebuild list.

## Current version contract

- `tools/windows-build.py:164,178,198` accepts only `game.json.version`, uses it for folder/ZIP/installer filenames and `build-manifest.json.version`, and copies the original game.json unchanged into the Windows app.
- `shared/windows/Sources/main.cpp:137` reports that bundled `game.json.version` as `info.appVersion`.
- No existing `windowsVersion` field/CLI override exists. `installer_text()` currently has no DisplayVersion registry value; it should not be described as already presenting one.
- All common game metadata remains `version=0.1.0, versionCode=1`. `packages.json` already has separate Android, Mac and Windows objects; `windows-release.json.version/sourceCommit/qaSourceCommit/buildRunId/runtimeRunId/exportCommit` separately describe the actual Windows artifacts. Some Android entries have no explicit version field and identify it by the original APK name/receipt; preserve that shape rather than inventing fields.
- Merely renaming the old ZIP/EXE to 0.1.1 is wrong: it neither changes the host nor updates its appVersion. Raising common game.json.version alone also changes future Android/Mac packaging and would fail the original APK reuse guard that compares game.json production bytes.

## Small Windows-only version implementation proposal (not implemented)

Use one explicit Windows build input per selected game, e.g. `<game>/windows-version.json` containing only schemaVersion, game and version 0.1.1. Keep existing common game.json and catalog identities untouched. This avoids changing the Android production metadata or claiming old Mac/Android packages came from the new Windows source.

Necessary code scope:

1. `tools/windows-build.py`: bounded strict optional Windows-version loader, default to the current common version when absent; use the resolved version for Windows names and manifest. Derive only the **packaged Windows** game.json from the committed common metadata with its version replaced. Bind the exact source config and the resulting game.json in the build manifest; never rewrite the source game.json or web assets. Preserve packageName/storageKeys/install path.
2. `shared/windows/tests/` small metadata tests: default path unchanged; bad/wrong-game override rejected; only bundled version differs; names/manifest/info version agree. `windows-packages.py` should explicitly compare installed/portable game.json and manifest version against the deterministic resolved metadata in addition to its existing complete appFiles/hash checks. A small build helper can be reused there without a new general platform system.
3. Seven `<game>/windows-version.json` files. Existing Windows selector already includes ordinary game-root files, so the files cannot be omitted from sourceInputs. If executable-source export should include these config bytes, add only that exact filename to `windows-inputs.py.executed_sources`; no blanket exclusion or relaxed source checks.
4. The shared host binder fix and its CMake/controller-bind tests are already in 772c. No extra C++ version read is needed when packaged game.json carries the resolved version. Correct `shared/windows/README.md:9`, which still describes the old TCP-table condition.

No Android/Mac builder, APK certificate, platform binaries, platform metadata object or common game.json versionCode needs to change. A later Mac reuse on a different source must still obey its existing exact-input guard; do not weaken it to accommodate Windows changes. Existing Mac proofs continue to refer to their original sources/runs.

## Build and delivery boundary

The current shared host is not byte-identical to the seven old hosts apart from the binder change: since c5/6c7 there are bootstrap/bridge/storage/diagnostic changes. A new build from current HEAD must be described and verified as the current shared-host build, not falsely as an original binary with one patched instruction. If strictly backporting only the binder is desired, that requires separate exact parent/source isolation and fresh native verification; there are multiple old host versions. The smallest maintained route is one fixed current Windows source with unchanged seven game dist trees, plus the explicit version inputs.

The existing workflow already accepts an explicit JSON list of up to nine games; the exact seven above fit without expanding its registry or default scope. Root should freeze a concrete source after the new binder/metadata gates are verified. This assessment does not claim current 772c native binder success; the two-game run is still being diagnosed by its owner.

For each new game package, produce a new ZIP and installer, run the real Windows binder fixture, exact-source/file/package/installation checks, original four-document startup fixture, normal and occupied SDK/menu/gameplay/pause/background/disconnect checks and required storage restart checks. New host binaries require fresh native evidence; old gameplay rules/asset/license audits and unchanged dist hashes can be reused, but old native reports cannot be relabeled 0.1.1. Turbo's old storage status was not_exercised; do not upgrade that claim without a real dedicated run. Keep all prior failures and successful 0.1.0 reports.

Only after a game's new package passes, update its two Windows files, `windows-release.json`, `packages.json.windows`, Windows checksum lines and Windows README links/version/actual evidence reference; add a separate `docs/windows-delivery-0.1.1/` rather than overwrite original evidence. Update only Windows download links in `joystick-games/README.md` and any exact links actually referencing the old names. Do not change package counts or Android/Mac versions/status/source/QA/cert/bytes/hash objects. The JSON audit records canonical Android/Mac object hashes for before/after comparison.

Retire old Windows binaries from the working release directory when replacing them (their original fixed Git commits/evidence remain), or explicitly keep them declared in `packages.json.windows.files` with exact old hashes. Do not leave undeclared old EXE/ZIP files: the Windows source selector treats undeclared root files as inputs, and rejects undeclared files inside `windows/`. Turbo's two files are in `windows/`; the other six games currently store them at game root. Preserve every Android/Mac checksum line and platform directory byte.

New version/source/run/package hashes must all describe the fresh Windows build. Never copy 0.1.0's source/run ids onto 0.1.1; no public replacement is complete until the new downloads match their recorded hashes.
