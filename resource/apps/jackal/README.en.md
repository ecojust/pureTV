# Jackal TV

[中文](README.md) · [English](README.en.md)

Jackal TV independently reimplements the six-stage NES version of Jackal: jeep movement, prisoner rescue, helicopter extraction, weapon upgrades and six distinct boss encounters. The TV displays the game and a room QR code. One or two phones join over the local network with a left joystick, right A/B buttons, and START/SELECT controls.

The published version is **`0.2.0-preview.1`**. Install and play without importing a ROM; the unchanged package ID and signing certificate allow updating earlier versions. This preview includes the six-stage rewrite, with remaining differences in AI, some collisions, animation timing and sound. Physical-TV and frame-by-frame comparisons are incomplete.

## APK

<!-- apk-resource:start -->
[Download APK](jackal-0.2.0-preview.1.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/)

The APK in this directory is signed with the pureTV release certificate.
<!-- apk-resource:end -->

Requires Android 8.0 or later. Package: `com.ecojust.jackaltv`. The current APK version is `0.2.0-preview.1`.

## Rewrite preview controls

1. Connect the phones and TV to the same local network; the TV may use Ethernet.
2. Open the app and scan its room QR code. The first phone controls green P1; the second controls brown P2.
3. Use **SELECT** on the title screen to choose one or two players, then press **START**. Connecting a second phone does not automatically change a selected single-player game.

| Control | Action |
| --- | --- |
| Left joystick | Drive and turn in eight directions |
| A | Throw a grenade or fire a rocket in the current direction; press again for each shot |
| B | Fire the machine gun toward the top of the screen; hold for repeated fire |
| START | Start, pause/resume, or confirm the Continue menu choice |
| SELECT | Choose the player count at the title or toggle the Continue menu choice |
| A + B | An eliminated co-op player borrows a life from a teammate who has at least two remaining |
| TV Back button | Show exit confirmation |

The native 256×240 display scrolls across six 512-pixel-wide stages. Each player starts with five lives. The machine gun always points north; the main weapon progresses from grenade to rocket, horizontal splash rocket, and cross-shaped splash rocket.

Different huts release two prisoners, four prisoners, or one flashing weapon-upgrade prisoner; some buildings are tank garages. Prisoners leave in a queue and board a nearby jeep, without the old eight-passenger cap. Helipads unload them one at a time, upgrading the main weapon at 4, 9 and 15 deliveries. Completing the walk into the helicopter awards the relevant score; the stage tally separately rewards delivered prisoners. Passengers still aboard carry over to the next stage. See the [reference and implementation notes](docs/reference.md) for constants, sources and verification limits.

## Rooms and exit

No controller app is required on the phones. The TV provides a local HTTP/WebSocket server on an assigned port, with a random room token in the QR code. Up to two players connect directly, without a cloud relay.

Backgrounding, locking or disconnecting a phone releases held controls. Reconnection attempts to restore its player slot, and the game pauses when all controllers disconnect. Pressing Home closes the room. Confirming exit disconnects phones, closes listening ports and server threads, destroys the game page and terminates the app process. Reopening creates a new room.

If the QR link cannot connect, check that both devices share a local network and that guest-network or Wi-Fi client isolation is disabled.

## Development builds and assets

The logic consists of newly written JavaScript state machines. It contains no ROM loader, CPU emulator or third-party game program implementation. The six maps, events, images and note data retain their provenance. This preview APK includes the reference assets required to run it; the original artwork, music and designs remain credited to Konami. The MIT license for the application code does not grant a new license to that material. The app does not execute the original program, but does use extracted and transcribed reference data.

The renderer requires stage tile/sprite atlases, a HUD font, sprite metadata, boss background patches, cinematic timelines and note data. Installing the APK in this directory requires no additional assets. Source builds require the complete artwork directory passed through `-PjackalArtworkDir`; see the [build guide](docs/local-preview-build.md). Data origins, attribution and remaining comparisons are documented in the [reference notes](docs/reference.md), [audio notes](docs/reference-audio.md) and [enemy/boss notes](docs/reference-enemies.md).

Verify logic and data from the repository root:

```sh
node resource/apps/jackal/tools/build-levels.cjs --check
node --test resource/apps/jackal/tests/game.test.cjs resource/apps/jackal/tests/enemies.test.cjs resource/apps/jackal/tests/scenes.test.cjs
```

After preparing the required assets, build Android:

```sh
cd resource/launcher/puretv
./gradlew :jackal:assembleDebug :jackal:testDebugUnitTest :jackal:lintDebug \
  -PjackalArtworkDir=/absolute/path/to/artwork
```

APKs appear under `resource/apps/jackal/build/outputs/apk/`. Android tests cover the LAN protocol, service shutdown and process exit; Node tests cover game rules. Browser tests and captures establish page behavior, not physical TV performance, phone latency or complete original-game parity. See [resource maintenance](../../../docs/resource-maintenance.md) for the release workflow.

## Rewrite preview screenshots

These images show the actual `0.2.0-preview.1` game page running in Chromium with simulated room data. They are not physical-TV captures.

![Rewrite preview game page](docs/jackal-tv.en.png)

![Phone controller](docs/controller.en.png)
