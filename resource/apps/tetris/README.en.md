# Tetris TV

[中文](README.md) · [English](README.en.md)

An independent recreation of classic NES falling-block play: a 10×20 well, seven tetrominoes, classic rotation, soft drop, line-clear scoring, increasing gravity and a NEXT preview.

Version **0.5.1** supports Android 8.0+ TVs. Package: `com.ecojust.tetristv`. The TV displays the board and room QR code, and phones scan it to become controllers. No ROM import is required.

<!-- apk-resource:start -->
[Download APK](tetris-0.5.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/) · [64×64 SVG icon](logo.svg)

The APK in this directory is signed with the pureTV release certificate. Android cannot update an existing installation of the same package if it uses a different signing certificate. Back up its data and uninstall the old package first.
<!-- apk-resource:end -->

## 0.5.1 gameplay review

Corrects soft-drop timing, release/repress between pieces, shift/rotation ordering and line-clear animation cadence.

Uses the same signing certificate as 0.5.0 and supports an in-place update. See the [fidelity review](../../../docs/game-fidelity-0.5.1.md) for tested behavior and remaining differences.

## Installation and signing

Version 0.5.1 uses the same shared pureTV certificate as 0.5.0, so it updates 0.5.0 in place and keeps local data. Versions signed with the older certificate cannot be updated in place: back up any exportable data before uninstalling them. Uninstalling clears local saves and records; the project has no automatic migration across signing certificates.

## Play

1. Connect the phones and TV to the same local network and open the TV app.
2. Scan its QR code in a phone browser. For two players, each phone joins separately.
3. Press SELECT at the title to choose one or two players, then START. Both players must connect for two-player play.
4. The left joystick stays hidden until touched. Each initial touch sets its center; drag to control and release to stop and hide it. The entire right third of the screen accepts action touches. START/SELECT stay separate at the bottom left. Gameplay areas suppress text selection and long-press menus.

| Control | Action |
| --- | --- |
| Left floating stick | Move left/right; hold down for soft drop. At the title, left/right selects a level; up/down changes A-TYPE level by ten or selects B-TYPE obstacle height |
| Lower-right half A | Rotate clockwise; switch A-TYPE/B-TYPE at the title |
| Upper-right half B | Rotate counterclockwise; switch A-TYPE/B-TYPE at the title |
| SELECT | Choose one/two players at the title; toggle music during play or pause |
| START | Start, pause or resume |
| TV Back | Exit confirmation |

Uses classic rotation without wall kicks and the NES level/gravity curve. There is no modern HOLD, ghost piece or hard drop. A-TYPE starting levels 0–19 are selectable. B-TYPE adds a fixed-speed, 25-line challenge with levels 0–9 and initial obstacle heights 0–5. Both players receive identical obstacles; a completed player waits while the other continues. Two-player mode adds separate wells with the same piece sequence and independent scores, without garbage attacks.

High scores are stored on the TV. Moving from an old-certificate release to 0.5.0 requires uninstalling, which clears those records; there is no automatic migration.

## Screenshots

These are captures of the actual game page rendered in Chromium with a simulated room connection, not physical-TV captures.

![Game screen](docs/tetris-tv.en.png)

![Phone controller with hidden joystick](docs/controller.en.png)

![Phone controller while dragging](docs/controller-active.en.png)

## Rooms and exit

Up to two phones connect directly to the local HTTP/WebSocket room. Its QR code includes a port and random room token for this launch, without a cloud relay. Backgrounding, interrupted touches and disconnections release controls. Losing an active player pauses the boards until they reconnect.

Pressing TV Home closes the room. Confirming exit closes ports and server threads, disconnects controllers, destroys the WebView and audio, and terminates the app process. Scan the new QR code after reopening.

## Build and verify

```sh
# Repository root
node --test resource/apps/tetris/tests/*.test.cjs
node resource/apps/tetris/tests/controller.mjs
node resource/apps/tetris/tests/compatibility.mjs
node resource/apps/tetris/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :tetris:assembleRelease :tetris:testDebugUnitTest :tetris:lintDebug :tetris:verifyReleaseSize
```

Browser tests require the desktop npm dependencies and Chromium, optionally selected with `CHROMIUM_PATH`. Gradle emits an unsigned release APK; the public directory contains a package signed with the pureTV release certificate.

See [reference notes](docs/reference.md) for rule sources and implementation differences. Artwork, icons, effects and 8-bit music are independently created; no original ROM, extracted artwork or soundtrack recording is included. Project-authored code and assets use [MIT](LICENSE). Physical TV/phone and frame-by-frame comparisons remain unverified.
