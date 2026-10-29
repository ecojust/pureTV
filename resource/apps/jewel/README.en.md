# Magic Jewelry TV

[中文](README.md) · [English](README.en.md)

An independent recreation of the classic NES Magic Jewelry rules: three gems fall as a column onto a 6×13 board. Match three or more of the same color horizontally, vertically or diagonally, with gravity chains and magic columns.

Version **0.5.0** supports Android 8.0+ TVs. Package: `com.ecojust.jeweltv`. The TV displays the board and room QR code, and phones scan it to become controllers. No ROM import is required.

<!-- apk-resource:start -->
[Download APK](jewel-0.5.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/) · [64×64 SVG icon](logo.svg)

The APK in this directory is signed with the pureTV release certificate. Android cannot update an existing installation of the same package if it uses a different signing certificate. Back up its data and uninstall the old package first.
<!-- apk-resource:end -->

## 0.5.0 release and installation

All nine games are released as version 0.5.0 with the new shared pureTV release certificate. Package IDs stay unchanged, so Android cannot use the new certificate to replace an installation signed with the old one. Back up any data your device can export before uninstalling the old app and installing 0.5.0. Uninstalling clears local game saves and records. This project has no automatic save migration tool and cannot guarantee recovery of old saves.

## Play

1. Connect the phones and TV to the same local network and open the TV app.
2. Scan its QR code in a phone browser. For two players, each phone joins separately.
3. Press SELECT at the title to choose one or two players, then START. Both players must connect for two-player play.
4. The left joystick stays hidden until touched. Each initial touch sets its center; drag to control and release to stop and hide it. The entire right third of the screen accepts action touches. START/SELECT stay separate at the bottom left. Gameplay areas suppress text selection and long-press menus.

| Control | Action |
| --- | --- |
| Left floating stick | Move left/right; hold down for soft drop; release to stop |
| Entire right action zone A | Cycle the three gems; keyboard B retains the same action |
| SELECT + right action zone | Swap the top and bottom gems of the current column |
| SELECT | Choose one/two players at the title; toggle music while paused |
| START | Start, pause or resume |
| TV Back | Exit confirmation |

Every 70 cleared gems advances the level and awards a magic column, which clears the color it lands on. Unsupported gems visibly fall after a clear; the next chain is checked only after they land. A sidebar meter tracks progress toward the next magic column. Two players receive the same gem sequence and keep separate boards and scores, without sending garbage. This local two-player competition is an additional mode.

High scores are stored on the TV. Moving from an old-certificate release to 0.5.0 requires uninstalling, which clears those records; there is no automatic migration.

## Screenshots

These are captures of the actual game page rendered in Chromium with a simulated room connection, not physical-TV captures.

![Game screen](docs/jewel-tv.en.png)

![Phone controller with hidden joystick](docs/controller.en.png)

![Phone controller while dragging](docs/controller-active.en.png)

## Rooms and exit

Up to two phones connect directly to the local HTTP/WebSocket room. Its QR code includes a port and random room token for this launch, without a cloud relay. Backgrounding, interrupted touches and disconnections release controls. Losing an active player pauses the boards until they reconnect.

Pressing TV Home closes the room. Confirming exit closes ports and server threads, disconnects controllers, destroys the WebView and audio, and terminates the app process. Scan the new QR code after reopening.

## Build and verify

```sh
# Repository root
node --test resource/apps/jewel/tests/*.test.cjs
node resource/apps/jewel/tests/controller.mjs
node resource/apps/jewel/tests/compatibility.mjs
node resource/apps/jewel/tests/capture.mjs

cd resource/launcher/puretv
./gradlew :jewel:assembleRelease :jewel:testDebugUnitTest :jewel:lintDebug :jewel:verifyReleaseSize
```

Browser tests require the desktop npm dependencies and Chromium, optionally selected with `CHROMIUM_PATH`. Gradle emits an unsigned release APK; the public directory contains a package signed with the pureTV release certificate.

See [reference notes](docs/reference.md) for rule sources and implementation differences. Artwork, icons, effects and 8-bit music are independently created; no original ROM, extracted artwork or soundtrack recording is included. Project-authored code and assets use [MIT](LICENSE). Physical TV/phone and frame-by-frame comparisons remain unverified.
