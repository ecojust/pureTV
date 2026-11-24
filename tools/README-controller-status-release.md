# Controller client-status update delivery

This document records the original twenty-game rollout. To build and test the eight games still on the homepage, use the [current controller release guide](README-controller-release.md). To reproduce the rollout below, use its [pre-migration checkout](https://github.com/ecojust/pureTV/tree/7cba602846e3efe6ddb499db2be258edc82ab5de).

This update covers the twenty Android games listed in `docs/controller-client-status/rollout.json` and Neon Rush macOS 0.1.4. The Android scope is **controller client status acceptance**, separately from prior full gameplay acceptance. A current status screenshot/recording must never be described as a new full gameplay run. Used Car Racing retains its previous complete-Android-gameplay environment limitation.

## Source and versions

The rollout records the exact previous release, next version/code, and three-file baseline under each app's `docs/controller-status-baseline/<version>/`. Existing APKs stay where they were. Keep each current `resource.json` and `thumb.png` unchanged until all new signed packages and their selected status reports have been verified.

Freeze source and QA before dispatch. The existing `controller-games.yml` can be dispatched on the frozen feature ref; it builds the eleven legacy APKs and all twenty read-only observers. Nine Game Kit requests can be prepared with the new helper:

```sh
python3 tools/controller-status-release.py requests \
  --source-sha EXACT_40_CHARACTER_SHA \
  --output /dev/shm/controller-status-signing-request \
  --sdk /workspace/scratch/game-polish-toolchain/android-sdk \
  --jdk /workspace/scratch/game-polish-toolchain/jdk-17.0.21+9 \
  --zxing /workspace/scratch/game-polish-toolchain/core-3.5.3.jar
```

The command creates unsigned builds, logs, exact request files and a request summary. It never commits, dispatches, signs, or publishes. Push only the generated `requests-tree/requests/` to a fresh `build-assets/game-kit-requests-...` branch, then dispatch `sign-game-kit.yml` once per Game Kit game with the fixed source SHA and request branch. Follow `resource/game-kit/BUILD.md` for the existing fixed-certificate signing and independent fetch verification.

Neon Rush's macOS version/build constants are in `macos/build.py`. Its existing `neon-rush-macos.yml` creates the universal ZIP/DMG, checks the identical package on native architectures and runs native regressions. The package still uses an ad-hoc signature; Apple notarization and physical ESP32 testing are not implied.

## Android status acceptance

Supply the existing immutable `bundle_manifest` format to `controller-games-runtime.yml` with `acceptance_mode=client-status`; omit `batches` to select all eight bounded batches. The workflow keeps `complete` as its default. The new mode passes only `--status-only` to the original SDK driver and records an explicitly limited scope in the plan, batch, case and recording.

Every case must verify menu/service address, original SDK hello/sync, the real controller identity and icon, disconnect/same-ID reconnection, all ACKs, and independent seats for a two-player host. Android status acceptance stays in the menu. Browser QA additionally verifies that identity remains visible during ordinary play/pause. Rendering, model mutation, arbitrary JavaScript execution or simulated controller IDs are not added to the read-only Android observer.

Raw captures retain their original filenames. The main new preview is `controller-connected-android.png`; two-seat, disconnect and reconnect captures are archived separately. The original complete-gameplay flow and its assertions remain unchanged.

## Stage verified resources

After signed artifact fetches, run the existing `controller-runtime-inputs.py` for `arcade`, `worlds`, and `kit` into three fresh scratch directories. Keep their original input-verification reports. Fetch successful runtime exports through their new isolated branches and verify the export manifests.

Prepare an explicit selection JSON containing all twenty IDs:

```json
{
  "games": {
    "neon-rush": {"runId": "NEW_RUN_ID", "group": "controller-runtime-kit-1"}
  }
}
```

The example is abbreviated; staging rejects missing, duplicate or unknown games. It accepts original whole-workflow failures only when the specifically selected game passed its complete **status** acceptance, preserving the original workflow/group status.

For a later correction to one game, keep both original input-verification reports intact and pass both signed input directories. When more than one signed candidate exists for a game, its selection **must** specify `artifactSourceSha`; add `packageSha256` to pin the exact already-tested package. Staging rejects missing or ambiguous source selection and verifies the chosen APK's actual certificate, digest, receipt and committed asset bytes. It never selects the newest build implicitly. This allows the original three Worlds packages to remain selected while only Cozy Island uses its corrected build. The original JSON reports are copied unchanged under `docs/controller-client-status/signed-input-verification/`, alongside an explicit per-game selection record.

```json
{
  "games": {
    "cozy-island": {
      "runId": "NEW_CORRECTED_RUNTIME_RUN",
      "group": "controller-runtime-retry-cozy",
      "artifactSourceSha": "EXACT_40_CHARACTER_PRODUCTION_SHA",
      "packageSha256": "EXACT_64_CHARACTER_VERIFIED_APK_SHA256"
    }
  }
}
```

```sh
python3 tools/controller-status-release.py stage \
  --selection /dev/shm/controller-status-selection.json \
  --signed-input /dev/shm/status-input-arcade \
  --signed-input /dev/shm/status-input-worlds \
  --signed-input /dev/shm/status-input-kit \
  --runtime-export /dev/shm/status-runtime-export \
  --build-tools /workspace/scratch/game-polish-toolchain/android-sdk/build-tools/34.0.0
```

Repeat `--runtime-export` for additional original runs if needed. Before editing any current app metadata, the helper verifies all twenty packages, certificates, increasing versions, exact source/asset receipts, actual upgrade installs, UI report scope and required checks, original screenshot identity, and full video decoding. Videos must remain below 10,000,000 bytes. Video checking retains the source encoder timebase; original videos are copied unchanged.

New release files are `connected.png`, `controller-status.mp4`, `controller-status.json`, `verification.json`, the original signing receipt, and `captures/`. The resource fields `controllerStatusVideo`/`controllerStatusMetadata` identify this update. Old gameplay video links move to an explicitly versioned `historicalGameplayVideo` and remain in `previousReleases`. Eight hundred-game progress entries record the new UI verification and byte-identical model reuse separately; the completed count stays unchanged. All prior failures and original evidence remain intact.

## Final publication

After final app README edits and verified Mac package import, update the Mac package-only checksum list first, then run the required strict resource/catalog checks:

```sh
python3 tools/resource_catalog.py --build-tools /path/to/build-tools/34.0.0
python3 tools/update-resource-index.py
python3 tools/update-tv-store-catalog.py --build-tools /path/to/build-tools/34.0.0
python3 tools/controller-status-release.py checksums
```

The last command regenerates/verifies all twenty app manifests after documentation changes. It requires the referenced tracked files to be present, including files outside an initial sparse checkout.

After an ordinary non-forced publication push, verify complete public downloads using the exact publication commit:

```sh
python3 tools/controller-status-release.py public-verify \
  --ref EXACT_PUBLICATION_COMMIT \
  --output docs/controller-client-status/public-download-verification.json
```

This verifies new Android APKs, videos, metadata, previews, checksums, README files, catalog files and both Mac install packages. GitHub delivery is separate from a GitHub Release or uploading to `apps.b14f.com`.
