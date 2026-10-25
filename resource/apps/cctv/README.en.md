# CCTV Live

[English](README.en.md) · [中文](README.md)

An independent CCTV channel player from the pureTV project, designed for Android TV / Google TV remotes. Package: `com.ecojust.cctvlive`; version: `0.1.0`; Android 8.0 or later. The interface follows the system language and includes Chinese and English. This is a third-party client, not an official CCTV application.

## Interface and remote controls

- Browse channels on the left with the directional pad, then press OK to select and play. Switch between all channels and favorites.
- The current channel's information and playback area provide play/pause, favorites, route selection and fullscreen controls.
- In fullscreen, Up/Down changes channels, Back returns to the channel list, and Menu opens route selection.
- A failed route automatically falls back to another untried route for that channel. If all routes fail, the current page and channel remain visible with an error and retry control.

![Native Android interface preview; not a physical TV or live broadcast capture](docs/cctv-live.en.png)

## Fixed channel file

The channel list is [`src/main/assets/channels.m3u`](src/main/assets/channels.m3u). The application reads and parses this bundled file at startup. It does not scrape a website for channel metadata or construct stream URLs in Java code. To add or remove channels, reorder them, or change a route, edit this file and rebuild the APK. Existing installations do not automatically receive changes made to the repository file.

The initial list was supplied by the user and identified as **captured from the `tv.cctv.com/live` web player on 2026-10-25**. It contains 21 channels, 21 primary routes and 18 backup routes, including CCTV-4 Asia/Europe/America and CCTV-4K. The originally commented backup URLs have been converted into parseable M3U entries.

Entries sharing a `tvg-id` are merged into one channel. The first occurrence determines channel order. Each HTTP(S) URL line defines a route; duplicate URLs are removed and route order follows the file. A channel catalog is different from the HLS media playlist returned by an individual stream URL.

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="cctv1.cn" tvg-name="CCTV-1 综合" tvg-name-en="CCTV-1 General" group-title="CCTV" route-name="主线路" route-name-en="Primary",CCTV-1 综合
https://ldncctvwbcdtxy.liveplay.myqcloud.com/ldncctvwbcd/cdrmldcctv1_1/index.m3u8
#EXTINF:-1 tvg-id="cctv1.cn" tvg-name="CCTV-1 综合" tvg-name-en="CCTV-1 General" group-title="CCTV" route-name="备用线路 · 1080P" route-name-en="Backup · 1080P",CCTV-1 综合
https://ldncctvwbcdcnc.v.wscdns.com/ldncctvwbcd/cdrmldcctv1_1_1080P/playlist.m3u8?wsApp=HLS
```

`tvg-name-en`, `route-name`, and `route-name-en` are optional application extensions for the English channel name and Chinese/English route labels. Missing English names fall back to the original names. Lines beginning with `#` are comments, except for recognized M3U directives; a comment alone does not add a route. Parsing is limited to 512 KiB, 100 channels and four routes per channel. All bundled routes use HTTPS; this application does not permit cleartext HTTP streaming.

## Playback and verification

Android `MediaPlayer`, `SurfaceView`, and `MediaSession` provide playback. There is only one player at a time; changing channels releases the previous decoder, and leaving the foreground releases the player and audio focus. There are no third-party production dependencies. The app requests network access only and does not download entire live broadcasts or maintain a disk video cache.

If loading or buffering exceeds 25 seconds, or the player reports an error, the app tries the channel’s remaining routes in file order. Each route is attempted at most once per playback attempt, preventing an endless loop between primary and backup routes. If every route fails, the app stays on the current page; retrying or selecting a route starts a new attempt. Changing channels, pausing, or leaving the foreground cancels a pending automatic route switch.

“1080P” in a route label comes from the supplied source description and does not assert the actual decoded resolution. Picture quality and codec compatibility depend on the server and TV. Native UI previews and offline tests do not establish successful playback of every channel on a physical TV. Capture tests use controlled media states and do not fabricate broadcast footage.

An address check from the development environment on 2026-10-25 could read the CCTV-1 and CCTV-2 M3U manifests; both the CCTV-5 primary and backup routes returned HTTP 403. This check establishes manifest access only. Decoding and sustained playback of all 21 channels have not been verified on a physical TV.

## Build

From the repository root:

```bash
cd resource/launcher/puretv
./gradlew :cctv:assembleDebug :cctv:testDebugUnitTest :cctv:lintDebug
./gradlew :cctv:verifyReleaseSize
```

Build outputs are under `resource/apps/cctv/build/outputs/apk/`. Release builds shrink code and resources and must remain below 5 MiB. Catalog APKs are signed separately with the pureTV release certificate.

Set `CCTV_UI_CAPTURE_DIR` while running `:cctv:testDebugUnitTest` to export `cctv-live.png` and `cctv-live.en.png` native previews. For a catalog update, use the Android CI staging workflow followed by `tools/prepare-app-resources.py --app cctv`; see the [resource maintenance guide](../../../docs/resource-maintenance.md).
