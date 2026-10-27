# Jackal TV

[中文](README.md) · [English](README.en.md)

Jackal TV is being independently rewritten around the six-stage NES version of Jackal: jeep movement, prisoner rescue, helicopter extraction, weapon upgrades and six distinct boss encounters. The TV displays the game and a room QR code. One or two phones join over the local network with a left joystick, right A/B buttons, and START/SELECT controls.

**The current source is an unreleased rewrite preview.** The `0.1.0` APK below is the previously published version. Its three-stage original gameplay, controls and visuals do not represent this rewrite. This work has not replaced the APK, version number or signing record. Reference comparisons remain incomplete; the preview is not claimed to reproduce every original frame.

## Previously released APK

<!-- apk-resource:start -->
[Download APK](jackal-0.1.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/)

The APK in this directory is signed with the pureTV release certificate.
<!-- apk-resource:end -->

Requires Android 8.0 or later. Package: `com.ecojust.jackaltv`. The previously published APK is version `0.1.0`.

## Rewrite preview controls

1. Connect the phones and TV to the same local network; the TV may use Ethernet.
2. Open a development build and scan its room QR code. The first phone controls green P1; the second controls brown P2.
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

The logic consists of newly written JavaScript state machines. It contains no ROM loader, CPU emulator or third-party game program implementation. The six maps and event lists are data files with explicit provenance. Original visual and note material is currently used only for local reference validation; assets and permissions for formal distribution remain unresolved. Such material is not automatically covered by this project's MIT license, and the rewrite must not be described as using no extracted reference material.

The renderer requires a separately prepared `src/main/assets/art/` directory containing stage tile/sprite atlases, HUD font, sprite metadata, boss background patches and cinematic timelines. A complete playable development build cannot be produced without these assets. See the [reference notes](docs/reference.md) and [enemy/boss notes](docs/reference-enemies.md) for data origins, rights boundaries and remaining comparisons. Local reference material is not being published as an update to the existing APK.

Verify logic and data from the repository root:

```sh
node resource/apps/jackal/tools/build-levels.cjs --check
node --test resource/apps/jackal/tests/game.test.cjs resource/apps/jackal/tests/enemies.test.cjs
```

After preparing the required assets, build Android:

```sh
cd resource/launcher/puretv
./gradlew :jackal:assembleDebug :jackal:testDebugUnitTest :jackal:lintDebug
```

APKs appear under `resource/apps/jackal/build/outputs/apk/`. Android tests cover the LAN protocol, service shutdown and process exit; Node tests cover game rules. Browser tests and captures establish page behavior, not physical TV performance, phone latency or complete original-game parity. See [resource maintenance](../../../docs/resource-maintenance.md) for the release workflow.

## Previous-version screenshots

These images show the previously released pages rendered in Chromium with a simulated room connection. They are neither the new rewrite nor physical TV captures.

![Previous-version game page](docs/jackal-tv.en.png)

![Previous-version phone controller](docs/controller.en.png)
