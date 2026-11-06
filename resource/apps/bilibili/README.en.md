# BiliTV

[简体中文](README.md) · [64×64 SVG icon](logo.svg) · [Build instructions](docs/BUILD.md)

A minimal, independent Bilibili client for Android TV with native remote-friendly controls. Package: `com.ecojust.bilitv`; initial version: `0.1.0`; minimum Android: 4.4 / API 19. The interface follows the system's Chinese or English language; video, creator and folder names retain their original text.

## Features

- Search for videos, browse result pages and open details or individual parts.
- Sign in by scanning the official login QR code with the Bilibili mobile app. Cancel, refresh expired codes or sign out without entering a password in this client.
- Browse account favorite folders and explicitly confirm adding or removing a video.
- Read account watch history and resume playback. Account progress is reported only after playback actually starts; local resume positions also work without signing in.
- Play normally granted H.264/AVC and AAC media, including separate audio/video tracks and sequential segments. Controls include pause, seek, parts, quality and retry; the service determines the available quality.

The client includes no advertising SDK, splash ads, banners, promoted feeds or search advertising entries. Creator-recorded sponsorships inside a video remain part of the original content.

## Remote controls

Use direction keys and OK to navigate. Search uses the TV's input method. During playback, OK toggles pause, Left/Right seeks 10 seconds, Up/Down shows controls and Back leaves the player. Leaving the app releases playback resources. Closing a QR dialog or pausing the app stops login polling.

## Network and accounts

API requests use Bilibili's normal HTTPS web endpoints; media streams come directly from the returned CDN URLs. No project proxy is involved. Session data stays in private application storage with Android backup disabled. Signing out clears the session, and account cookies are never sent to image or media CDNs.

Expired sessions, access checks, unavailable content and permission restrictions are shown explicitly. Failed requests are not replaced with demonstration results. This version uses a new QR login when a session expires. Android 4.4 enables TLS 1.2 while preserving system certificate and hostname verification; device certificates, codecs and network conditions still affect playback.

## Build and verification

See [BUILD.md](docs/BUILD.md) for the scoped Android build, tests and existing repository signing certificate. The signed APK and verification record will be added after CI succeeds; unsigned development packages are not published as installation releases.

BiliTV is unofficial and is not affiliated with Bilibili. Application code uses the MIT license; see [NOTICE.md](NOTICE.md) for dependencies and marks. Dependency license copies are packaged under `assets/licenses/`.
