# Cozy Island TV

[中文](README.md) · [English](README.en.md)

An independently made island-life TV game with smooth isometric graphics. Gather materials, fish, help original residents, craft and place furniture, and upgrade your home on an original island.

Version **0.5.1** requires Android 8.0 or later. Package: `com.ecojust.cozyislandtv`.

<!-- apk-resource:start -->
[Download APK](cozy-island-0.5.1.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/) · [64×64 SVG icon](logo.svg)

The APK in this directory is signed with the pureTV release certificate. Android cannot update an existing installation of the same package if it uses a different signing certificate. Back up its data and uninstall the old package first.
<!-- apk-resource:end -->

<!-- visual-release:start -->
## 0.5.2 visual update (release pending)

The source version is **0.5.2**; full-group acceptance, Android CI and the signed release are not yet complete. Existing downloads still point to the published **0.5.1** package. This update keeps the current pureTV release certificate. See the [0.5.2 visual update record](../../../docs/game-visuals-0.5.2.md) for confirmed changes, validation results and pending work.

This round uses Animal Crossing: New Horizons as the visual reference for rebuilding terrain, characters, buildings and camera as actual WebGL 1 3D scenes. Visual and runtime acceptance is still pending. The island and residents are independently created; gathering, fishing, insects, furniture, saves and LAN two-player flows remain in acceptance scope. This is not a complete port of the commercial game.

See the [reference notes](docs/reference.md) for the implementation scope. 3D rendering uses locally bundled Three.js r124 under MIT, with no CDN dependency.
<!-- visual-release:end -->

## 0.5.1 gameplay review

Adds day/night insects, raised-net sneaking, release-to-catch input, species inventory and a shared journal while preserving old saves.

Uses the same signing certificate as 0.5.0 and supports an in-place update. See the [fidelity review](../../../docs/game-fidelity-0.5.1.md) for tested behavior and remaining differences.

## Installation and signing

Version 0.5.1 uses the same shared pureTV certificate as 0.5.0, so it updates 0.5.0 in place and keeps local data. Versions signed with the older certificate cannot be updated in place: back up any exportable data before uninstalling them. Uninstalling clears local saves and records; the project has no automatic migration across signing certificates.

## Play

1. Connect the TV and phones to the same LAN, then open the game on the TV.
2. Scan the room QR code with a phone browser. Use one phone per player; no phone app is required.
3. Choose the player count on the title screen, then press START.
4. Touch anywhere in the left joystick area to set its center. Drag to move; releasing hides it and clears movement. A/B work simultaneously with the joystick.

The right third of the phone is the action area: B fills the upper half and A fills the lower half. Touch anywhere in either region while using the floating stick on the left. START and SELECT remain separate at the bottom left. Gameplay controls suppress text selection and long-press browser menus.

| Control | Action |
| --- | --- |
| Floating joystick | Move / select menu entries |
| A | Interact, gather, fish or confirm; hold with the bug net to sneak, release to swing |
| B | Open inventory / go back |
| SELECT | Cycle hands / rod / bug net; rotate while placing; choose 1P/2P on title; toggle music while paused |
| START | Start, pause / resume |

One or two players can explore simultaneously, with separate inventories and interaction menus and shared island progress. One player can enter the house while the other stays outside. The game offers a finite set of resident tasks and home upgrades; see the [game notes](docs/reference.md) for content and scope.

Changes in 0.5.0: five fish species appear at different island hours. Watch the bobber distinguish gentle nibbles from the final bite; the reaction window depends on the species. The shared fish journal records catches and largest sizes, saves across sessions and gives 10 coins for each first discovery. The save format remains compatible with older data, but this certificate-changing release does not migrate saves from the old installation. Caught fish still count as the fish resource for requests and selling.

Visible butterflies, beetles and fireflies follow day/night schedules. Running scares them; hold the net to approach slowly, face an insect and release A to catch it. Specimens can be sold and enter a shared journal, with no duplicate catch when two players reach the same insect.

## Screenshots

Actual bundled game pages rendered in Chromium with a simulated native room bridge, not physical-TV captures.

![Cozy Island TV](docs/cozy-island-tv.en.png)

![Controller](docs/controller.en.png)

![Floating joystick](docs/controller-active.en.png)

## Saves, room and exit

Item and building transactions save immediately; positions save periodically. The save format remains compatible with older data, but the certificate change in 0.5.0 prevents an in-place update and does not migrate the old installation’s save. Uninstalling or confirming a save reset removes progress.

Up to two phones connect through a local HTTP/WebSocket room with a fresh port and random token on each launch. Input is released on touch cancellation, loss of focus or disconnection. Losing a participating phone pauses play; reconnecting resumes automatic pause but preserves manual pause.

TV Home or confirmed exit closes the room, disconnects phones, releases workers and wake locks, destroys the WebView/audio and ends the app process. Scan the new room code when reopening.

## Development and scope

This is an independent game with original maps, artwork, residents and synthesized music. It does not bundle Nintendo software, ROMs or extracted assets and does not claim the complete content of a commercial Switch title. See the [reference and scope notes](docs/reference.md). Project-authored code and assets use [MIT](LICENSE).

```sh
node --test resource/apps/cozy-island/tests/*.test.cjs
node resource/apps/cozy-island/tests/controller.mjs
node resource/apps/cozy-island/tests/compatibility.mjs
node resource/apps/cozy-island/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :cozy-island:assembleRelease :cozy-island:testDebugUnitTest :cozy-island:lintDebug :cozy-island:verifyReleaseSize
```

Browser tests use desktop npm dependencies and Chromium (`CHROMIUM_PATH`). Physical TV and phone verification remains pending.
