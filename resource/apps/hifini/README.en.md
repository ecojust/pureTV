# HIFINi TV

<!-- apk-resource:start -->
[Download APK](hifini-0.1.0.apk?raw=1) · [Checksums](SHA256SUMS.txt) · [Signing and build provenance](resource.json) · [Source code](src/)

The APK in this directory is signed with the pureTV release certificate. Android cannot update an existing installation of the same package if it uses a different signing certificate. Back up its data and uninstall the old package first.
<!-- apk-resource:end -->

[English](README.en.md) · [中文](README.md)

An independent HiFiNi music client for Android TV remotes, requiring Android 8.0 or later. Package: `com.ecojust.hifinitv`; version: `0.1.0`. It installs alongside Music TV and does not access or modify Music TV data.

![Native English UI with fictional test tracks; not a live playback or physical TV capture](docs/hifini-tv.en.png)

## Search and playback

- Search by song or artist after signing in to HiFiNi, or enter an official forum page containing static player data, such as `https://www.hifini.net/thread-6544.htm`.
- Shuffle plays the current search results in a random order without repeating within a round. If there are no results yet, enter a keyword and press Shuffle to search and play. Queues contain up to 50 tracks; this does not sample the entire site catalog.
- Search uses `musicparse-search.htm?keyword=...`, preserving each NetEase/Kuwo source ID, title, artist, artwork, and duration, including tracks without a forum topic.
- Playback uses `musicparse-play.htm?source=...&id=...` and requests the official playback entry each time, with at most one fresh retry after failure. No persistent history, favorites, or temporary audio URL cache.
- Source artwork and artist details accompany a native rhythm animation. The animation runs during playback and rests when paused, stopped, or off-screen. It does not record a microphone or analyze the audio spectrum. Lyrics are not included.
- Play/pause, previous/next, seeking, background playback, system media keys, and playback notifications.

Use the directional pad to navigate and OK to select. Back cancels a pending search. The interface follows the system language, with Chinese and English resources.

## Sign-in and saved credentials

Open **Sign in** at the top right. The registration QR code sits above the username, password, and sign-in button. Existing users can sign in directly; new users can scan with a phone to visit `https://www.hifini.net/user-create.htm`. The QR code is generated locally, contains only this official URL, and has no separate open-registration button.

Your username and password are encrypted locally using Android Keystore AES-GCM, never logged or included in system backups. An explicit press of Sign in fills and submits the official HTTPS form. Complete any verification requested by the site in the website area. Automatically restoring saved credentials only fills the form; it does not submit it.

The official WebView session cookies are retained locally and shared with native requests to HiFiNi. A valid session avoids repeated sign-in. Expiration, verification, or account changes can still require interaction. You can refill saved credentials, forget them, or clear the local session.

Credentials are not sent to the desktop manager or an agent. Session cookies are not attached to third-party artwork or audio requests. Native playback does not execute website scripts; the official sign-in page uses the system WebView.

## Build and verification

```bash
cd resource/launcher/puretv
./gradlew :hifini:testDebugUnitTest :hifini:lintDebug :hifini:verifyReleaseSize
```

From the repository root, run `node --test resource/apps/hifini/src/test/js/login-autofill.test.mjs` to verify the actual autofill script's form and origin checks (Node.js 22).

Release outputs are under `resource/apps/hifini/build/outputs/apk/release/`; catalog APKs are signed separately with the pureTV certificate. Set `HIFINI_UI_CAPTURE_DIR` to export native Chinese and English previews. Parser tests use a sanitized search excerpt supplied by the user and synthetic boundary fixtures; see their [provenance](src/test/resources/hifini/README.md).

Production dependencies are jsoup for HTML parsing and ZXing Core for generating the registration QR code locally; Android MediaPlayer handles audio. Release builds shrink code and resources and must remain below 5 MiB. Artwork has a 4 MiB memory cache and a 2 MiB per-download limit; queues are limited to 50 tracks. See [NOTICE.md](NOTICE.md) for licenses.

**Live verification status:** Requests to the HiFiNi homepage, search and playback entries, and supplied song page failed from the development environment. Real account sign-in, live search, and playback have not yet been verified. Native UI, parser fixture, and playback state tests do not replace testing on a TV. Site changes, verification, media formats, and regional connectivity may affect availability. The adapter uses official search/playback entries and explicitly supplied page data; it does not execute decryption scripts or use third-party resolver services.
