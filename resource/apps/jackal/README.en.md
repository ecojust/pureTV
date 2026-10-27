# Jackal TV

<!-- apk-resource:start -->
[Download APK](jackal-0.1.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/)

The APK in this directory is signed with the pureTV release certificate.
<!-- apk-resource:end -->

[中文](README.md) · [English](README.en.md)

Drive a jeep behind enemy lines, blast open prison huts, rescue prisoners and deliver them to helicopter evacuation pads. Jackal TV is an original pixel game inspired by the classic NES jeep rescue game, supporting one or two players on a local network. The TV displays a vertically scrolling battlefield and room QR code. Each phone joins in its browser with a left joystick and right A/B buttons, without installing a controller app.

Requires Android 8.0 or later. Package: `com.ecojust.jackaltv`; version: `0.1.0`. The native 256×240 canvas preserves crisp pixel edges when scaled. Levels, pixel graphics, sound effects and controller pages are bundled in the APK; play does not require Internet access. No original game ROM or extracted image/audio assets are included. The TV follows the system language and the controller follows the browser language; both support Chinese and English.

## Play

1. Install the APK on your TV using pureTV Manager or ADB, then open Jackal TV.
2. Connect the phone and TV to the same local network. A wired TV connection works when the phone uses the same router's Wi-Fi.
3. Scan the room QR code on the right side of the TV. The first phone controls the yellow P1 jeep; the second controls the green P2 jeep.
4. Press **A** to deploy. Landscape orientation is recommended for the phone; portrait mode also works.

| Control | Action |
| --- | --- |
| Left joystick | Drive in eight directions and turn the jeep |
| Right A button | Start and fire the machine gun; hold for continuous fire, always aimed north |
| Right B button | Throw a grenade in the jeep's facing direction; hold to repeat |
| TV Back button | Show exit confirmation |

Use the machine gun or drive over infantry; use grenades against armored targets and prison huts. Once a hut is destroyed, approach prisoners to pick them up. Each jeep carries up to eight. Stop inside a helipad to unload them one by one, earning 250 points per rescued prisoner. Delivering three and six prisoners upgrades your grenades. Grenades have unlimited ammunition with a short cooldown between throws.

The campaign has three stages: jungle, desert and harbor. Advance north along roads, cross water on bridges and defeat each stage's fortress boss to proceed. Completing the third stage wins the campaign. Two players share the screen, each starting with three lives and receiving brief invulnerability after respawning.

![Actual game page rendered in Chromium with a simulated room connection; not a physical TV capture](docs/jackal-tv.en.png)

![Phone controller](docs/controller.en.png)

## Rooms and exit

The TV app provides an HTTP and WebSocket room server on a port assigned at startup. Its QR code contains a random token for the current room. Controller input travels directly between the phone and TV, without a cloud relay. Up to two players can join. Scan the new code after restarting the app.

A temporary phone disconnection, background switch or screen lock releases held controls, preventing a jeep from continuing to drive or fire. A reconnecting phone attempts to resume its previous player slot. The game pauses when all controllers disconnect. Pressing Home closes the room. Confirming exit disconnects all phones, closes the listening port and server threads, destroys the game page and terminates this app's process. Reopening creates a new room.

If the phone cannot connect, check that both devices share a local network and that the router does not isolate guest or Wi-Fi clients. There is no public Internet relay; the phone browser must be able to access the TV's local HTTP address.

## Build and verify

Run from the repository root:

```bash
node --test resource/apps/jackal/tests/game.test.cjs
npm ci --prefix desktop
cd desktop && npx playwright install chromium && cd ..
node resource/apps/jackal/tests/controller.mjs
node resource/apps/jackal/tests/capture.mjs
cd resource/launcher/puretv
./gradlew :jackal:assembleDebug :jackal:testDebugUnitTest :jackal:lintDebug :jackal:verifyReleaseSize
```

APKs are generated under `resource/apps/jackal/build/outputs/apk/`. Release builds enable code and resource shrinking and enforce a 5 MiB size limit. Published resource APKs use the pureTV release certificate. Android tests cover the room server and lifecycle, Node tests cover game rules, and browser tests cover the controller and game page.

Set `JACKAL_UI_CAPTURE_DIR` and run `tests/capture.mjs` to export Chinese and English game and controller previews. They render the actual bundled pages in Chromium using a simulated native bridge and test room; they do not measure physical TV performance or phone network latency. Resource updates use Android CI staging followed by `tools/prepare-app-resources.py --app jackal`; see [resource maintenance](../../../docs/resource-maintenance.md).
