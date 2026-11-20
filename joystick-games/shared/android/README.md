# Android host for joystick games

The two games use the existing `resource/game-kit/android/src/main` host unchanged.
`joystick-games/tools/android-build.py` composes that host and the three original
phone-controller assets in a temporary directory, adds the selected game's
committed flat `dist/` payload, and invokes the existing Game Kit APK builder.
The game entry is `tv.html`; the builder generates `game-config.json` and
`assets-index.json`. No game may replace a shared phone asset or generated file.

Registered identities are `com.ecojust.joystickcf` and
`com.ecojust.joystickqqspeed`. Their versions and display names come from each
game's `game.json`. An optional self-contained `icon.xml` is validated by the
existing builder. No app is added to the normal TV market automatically.

## Build

Use JDK 17, Android Platform 35, Build Tools 34.0.0 and the pinned ZXing 3.5.3 jar
documented in `resource/game-kit/BUILD.md`. First install the selected game's
locked Node dependencies and run `npm run build:check`; generated distributions
must match the committed source before signing.

```sh
python3 joystick-games/tools/android-build.py \
  --game qq-speed --output /absolute/scratch/qq-speed-unsigned \
  --cache /absolute/scratch/dex-cache \
  --sdk /absolute/android-sdk --jdk /absolute/jdk17 \
  --zxing /absolute/core-3.5.3.jar --require-committed
```

Output must be outside the repository and must not already exist. Set `TMPDIR`
to a writable scratch filesystem if the default temporary filesystem is small.
The output contains an **unsigned** APK, its original build receipt, all source
input hashes, and exact asset hashes. Source hashes are checked before and after
compilation. `--require-committed` additionally compares each input to Git HEAD.
Leaving out that flag is only for local development, not a release-signing path.

## Controller behavior and compatibility

The unchanged native host provides TCP JSONL on default port **63485**, publishes
the actual listener via `_puretv._tcp`, acknowledges the original nine-key SDK,
preserves stable connections and clears held input on cancellation. JavaScript
consumes `PureGameHost.snapshot()` once per game frame; independent physical
buttons are available in each player's `buttons` object. Sidebar identity uses
the same cached frame. No RSSI is invented.

APK minimum SDK is 26 (Android 8), matching the existing host. Both games also
need a WebView with **WebGL2**; a minimum SDK declaration is not proof that every
Android 8 television can render them. The CI runtime configuration uses the
previously exercised Android TV 16 / API 36 x86_64 image and SwiftShader. Passing
those checks does not constitute a physical television or ESP32 test.

## Signing and runtime evidence

`.github/workflows/joystick-games-android.yml` builds each game, verifies frozen
source and payload bindings, then signs with the repository's existing
`PURETV_KEYSTORE_*` secret and the certificate pinned in
`tools/puretv-release-certificate-v2.sha256`. It never generates a new key.
Package name, version, size, ZIP content, assets, signature and alignment are
checked again after signing and before runtime installation.

Read-only instrumentation Observers from `joystick-games/qa/android/` receive the
same certificate solely to inspect actual WebView state. They are separate
`testOnly` packages and are **not user installation packages**. Their signed
receipt records `testArtifactOnly:true` and `modelWrites:false`.

Actual SDK checks install the signed game and Observer on the disposable TV
emulator. The export preserves separate build, sign and runtime outcomes;
signed output alone is not recorded as a gameplay pass. Original reports and
exact executed QA sources are exported even on failures to a new branch named
`build-assets/joystick-games-android-<run>-attempt-<attempt>`. Existing branches
are never overwritten. Final distribution remains the root agent's separate
verification and repository publication step.

Local packaging-boundary tests:

```sh
python3 joystick-games/tools/android-tests.py
```

These cover source/metadata boundaries and archive composition, not gameplay.
