[简体中文](README.md) | **English**

<div align="center">
  <img src="docs/branding/puretv-logo.png" width="112" alt="pureTV Chinese zodiac dragon logo">
</div>

pureTV is a desktop system manager for Android TV and Google TV. Connect to your TV over ADB to view system information, install and uninstall apps, enable or disable them, choose a launcher, and customize supported home screens with a visual canvas. Agents can also control the open manager through MCP.

[![Release](https://img.shields.io/github/v/release/ecojust/pureTV?style=flat-square&label=release&color=0f766e&sort=date)](https://github.com/ecojust/pureTV/releases/latest)
[![GitHub Release total downloads](https://img.shields.io/github/downloads/ecojust/pureTV/total?style=flat-square&label=downloads&color=16a34a)](https://github.com/ecojust/pureTV/releases)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-2563eb?style=flat-square)](desktop/README.md)
[![Launcher count](https://img.shields.io/badge/launchers-10-7c3aed?style=flat-square)](resource/launcher/)
[![App count](https://img.shields.io/badge/apps-117-f97316?style=flat-square)](resource/apps/)
[![MCP](https://img.shields.io/badge/MCP-34%20tools-5c4ee5?style=flat-square)](desktop/docs/mcp.md)
[![Layout](https://img.shields.io/badge/layout-v5-0891b2?style=flat-square)](resource/README-development.md#layoutjson-协议规范与画面对照)
[![Android TV](https://img.shields.io/badge/Android%20TV-ADB-3ddc84?style=flat-square&logo=android&logoColor=white)](#connection-and-app-management)
[![License](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)

[Download pureTV Manager 0.5.6](https://github.com/ecojust/pureTV/releases/tag/desktop-v0.5.6) · Windows / macOS / Linux · Updated APK Market name layout

[Download putrtv Store 0.1.1 for TV](resource/apps/putrtv-store/putrtv-store-0.1.1.apk?raw=1) · Browse, install and check updates on your TV; use an [updated launcher](resource/README.md) to choose where to add an app.

![Current source preview in the Sky theme using simulated device data](docs/previews/manager-en.png)

## Connection and app management

1. Connect your computer and TV to networks that can reach each other, then enable ADB or network debugging in the TV's developer options.
2. Enter the TV's IP address or hostname and debugging port on the home page, then authorize the computer on the TV. Port 5555 is common; use the port configured on your TV.
3. If ADB is missing, read and accept the Android SDK license, then click “Download and configure ADB.” The manager tries Google first and uses the Tencent mirror if that fails. You can also select an existing ADB installation.

Once connected, the home page displays the model, Android version, SDK version, security patch level, CPU, memory, `/data` storage capacity, resolution, and uptime. Other pages show the current connection status at the top.

- **App management:** search and filter apps, enable or disable them in batches, uninstall them for the current user, and restore system apps whose APKs are still present.
- **Package information:** click the circled **i** in an app row to look up its purpose, uninstall risk, source and retrieval time. Unknown packages stay unassessed, and protection for core components and the current launcher takes precedence.
- **Manager updates:** check the Gitee store's `client` directory at startup or manually, matching the current platform. **Download and install** verifies the package, installs it and restarts the manager. See [client updates](desktop/docs/client-updates.md) for platform behavior and the first upgrade from an older version.
- **Pending installations:** import local APKs, install one from its row, or select several for batch installation. Successful items leave the queue; failed and unprocessed items remain.
- **Launchers:** import and install launcher APKs directly from this page, choose a default home screen, or restore the previous default. The active launcher shows “Adjust layout” when it supports the interface.
- **Market:** browse apps and launchers dynamically from [pure-tv-store](https://gitee.com/juzisang331/pure-tv-store), search and preview them, download them to the pending installation queue, or install them on a connected TV. Versions of the same app or launcher share one card, with a dropdown for the latest five versions and the newest selected by default. Refresh to discover newly added APKs. Downloads also cache a sibling `logo.svg`; adding an app block or changing its app in the layout editor automatically uses the saved icon.
- App and launcher sizes include the main APK and split APKs. Private data, caches, and optimized files are excluded. Unreadable sizes are explicitly shown as unknown.
- Lists scroll within their own tables, with fixed headers and batch actions above them. Core system components and the current default launcher are protected.

Uninstalling a system app affects only the current Android user, preserves its data, and leaves the APK on the system partition. Newly installed user apps with a launchable activity can be added to the launcher layout.

Actions such as connecting, refreshing, managing apps, switching launchers, and applying layouts show a loading state followed by a result dialog. Batch results distinguish successful, failed, and unprocessed items. Automatic background reads do not interrupt you with dialogs.

## Launcher and TV app resources

The public [resource/](resource/) directory contains [launcher/](resource/launcher/) and [apps/](resource/apps/). Launcher and app sources previously stored at the repository root have moved into these directories. Launcher and TV app APKs are available in their software folders and separate `android-v*` releases; the desktop manager keeps its own `desktop-v*` versions and latest-release entry. Each software folder contains at least one actual APK and may also include matching source code, cover images, author details, licenses, and SHA256 checksums. Click a software name to open its folder. Every TV app directory provides a 64×64 `logo.svg` for launcher layouts; see the [resource convention](resource/README-development.md#应用资源与-logosvg-约定) for new apps.

The [0.5.1 game fidelity review](docs/game-fidelity-0.5.1.md) records rule and interaction improvements across the nine games, together with remaining map and content differences. The games retain the shared 0.5.0 certificate and support in-place updates from 0.5.0.

The launchers and first-party TV apps support English. Select English in the TV system settings to use it. User-provided app names, playlists, and media titles keep their original text. Native previews below use English test content; they are not physical TV captures.

Launcher layout customization uses this manager's **layout.json version 5 users/system interface**. Cards for launchers that support the layout protocol automatically display the Home background color and image, including inactive launchers, and update after layout changes are applied. The list has no choose-cover or remove-cover actions; edit the home-screen background in “Adjust layout.” Pending APKs use their embedded Home background when available, falling back to a sibling `thumb.png` or `APK-name.thumb.png` only when no layout background can be read.

This page currently features eight games from the new hundred-game collection alongside the earlier games. Browse every title in the [complete resource catalog](resource/README.md).

<!-- resource-index:start -->

### Launchers (10)

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/sol/"><img src="docs/previews/en/launcher-sol.png" width="180" alt="Sol TV preview"><br>Sol TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/pixel/"><img src="docs/previews/en/launcher-pixel.png" width="180" alt="Pixel TV preview"><br>Pixel TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/moss/"><img src="docs/previews/en/launcher-moss.png" width="180" alt="Moss TV preview"><br>Moss TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/mono/"><img src="docs/previews/en/launcher-mono.png" width="180" alt="Mono TV preview"><br>Mono TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/forma/"><img src="docs/previews/en/launcher-forma.png" width="180" alt="Forma TV preview"><br>Forma TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/drift/"><img src="docs/previews/en/launcher-drift.png" width="180" alt="Drift TV preview"><br>Drift TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/circuit/"><img src="docs/previews/en/launcher-circuit.png" width="180" alt="Circuit TV preview"><br>Circuit TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/aster/"><img src="docs/previews/en/launcher-aster.png" width="180" alt="Aster TV preview"><br>Aster TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/nova/"><img src="docs/previews/en/launcher-nova.png" width="180" alt="Nova TV preview"><br>Nova TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/puretv/"><img src="docs/previews/en/launcher-puretv.png" width="180" alt="pureTV Launcher preview"><br>pureTV Launcher</a></td>
    <td width="25%"></td>
    <td width="25%"></td>
  </tr>
</table>

### Apps - Media (5)

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/bilibili/"><img src="docs/previews/en/app-bilibili.png" width="180" alt="BiliTV preview"><br>BiliTV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cctv/"><img src="docs/previews/en/app-cctv.png" width="180" alt="CCTV Live preview"><br>CCTV Live</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hifini/"><img src="docs/previews/en/app-hifini.png" width="180" alt="HIFINi TV preview"><br>HIFINi TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/webtv/"><img src="docs/previews/en/app-webtv.png" width="180" alt="WebTV preview"><br>WebTV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shortvideo/"><img src="docs/previews/en/app-shortvideo.png" width="180" alt="ShortVideo TV preview"><br>ShortVideo TV</a></td>
    <td width="25%"></td>
    <td width="25%"></td>
    <td width="25%"></td>
  </tr>
</table>

### Apps - Games (19)

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/twenty-four/"><img src="docs/previews/en/app-twenty-four.png" width="180" alt="Twenty Four preview"><br>Twenty Four</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/torch-bridge/"><img src="docs/previews/en/app-torch-bridge.png" width="180" alt="Torch Bridge preview"><br>Torch Bridge</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tower-overlap/"><img src="docs/previews/en/app-tower-overlap.png" width="180" alt="Tower Overlap preview"><br>Tower Overlap</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/packing-sculptor/"><img src="docs/previews/en/app-packing-sculptor.png" width="180" alt="Packing Sculptor preview"><br>Packing Sculptor</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/conveyor-window/"><img src="docs/previews/en/app-conveyor-window.png" width="180" alt="Conveyor Window (Chinese UI) preview"><br>Conveyor Window (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/glass-fold/"><img src="docs/previews/en/app-glass-fold.png" width="180" alt="Glass Fold (Chinese UI) preview"><br>Glass Fold (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tension-span/"><img src="docs/previews/en/app-tension-span.png" width="180" alt="Tension Span (Chinese UI) preview"><br>Tension Span (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/prism-relay/"><img src="docs/previews/en/app-prism-relay.png" width="180" alt="Light Relay (Chinese UI) preview"><br>Light Relay (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/alien-shooter/"><img src="docs/previews/en/app-alien-shooter.png" width="180" alt="Alien Shooter TV preview"><br>Alien Shooter TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/used-car-racing/"><img src="docs/previews/en/app-used-car-racing.png" width="180" alt="Used Car Racing TV preview"><br>Used Car Racing TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cozy-island/"><img src="docs/previews/en/app-cozy-island.png" width="180" alt="Cozy Island TV preview"><br>Cozy Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/coast-kart/"><img src="docs/previews/en/app-coast-kart.png" width="180" alt="Coast Kart TV preview"><br>Coast Kart TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/super-mario/"><img src="docs/previews/en/app-super-mario.png" width="180" alt="Super Mario TV preview"><br>Super Mario TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/bomb-jack/"><img src="docs/previews/en/app-bomb-jack.png" width="180" alt="Mighty Bomb Jack TV preview"><br>Mighty Bomb Jack TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/adventure-island/"><img src="docs/previews/en/app-adventure-island.png" width="180" alt="Adventure Island TV preview"><br>Adventure Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tetris/"><img src="docs/previews/en/app-tetris.png" width="180" alt="Tetris TV preview"><br>Tetris TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jewel/"><img src="docs/previews/en/app-jewel.png" width="180" alt="Magic Jewelry TV preview"><br>Magic Jewelry TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jackal/"><img src="docs/previews/en/app-jackal.png" width="180" alt="Jackal TV preview"><br>Jackal TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tank/"><img src="docs/previews/en/app-tank.png" width="180" alt="Tank TV preview"><br>Tank TV</a></td>
    <td width="25%"></td>
  </tr>
</table>

### Apps - Tools (1)

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/putrtv-store/"><img src="docs/previews/en/app-putrtv-store.png" width="180" alt="putrtv Store preview"><br>putrtv Store</a></td>
    <td width="25%"></td>
    <td width="25%"></td>
    <td width="25%"></td>
  </tr>
</table>

<!-- resource-index:end -->

Third-party apps under 10 MB are collected in the [fork/ catalog](fork/README.md): 14 apps and 23 APKs from TVAPP, with icons, catalog covers and manifests.

## MCP / Agent

Open “Device connection → MCP · Agent debugging,” copy the configuration into your client, and keep the manager window open. Its 34 tools cover system information, connections, app management, APK installation, launcher switching and layouts, market browsing/downloads/installation, background images, ADB configuration, language and theme settings, cancellation, and logs. The Agent and the interface share the same state.

See the [complete MCP setup and parameter guide](desktop/docs/mcp.md), currently available in Chinese.

## Development documentation

Build and test instructions are in the [resource development README](resource/README-development.md). The detailed development and protocol guides are currently available in Chinese.

<a id="layoutjson-规范与画面对照"></a>

<a id="layoutjson-协议规范与画面对照"></a>

### Custom launcher layouts

`layout.json` is the protocol connecting the launcher and the manager's visual editor. The TV and computer use the same layout, allowing the manager to reproduce the home screen and edit app tiles. Home and Apps support independent backgrounds, layouts, and page navigation. User app components are editable; system components are read-only.

Choose “Adjust layout” on the launcher page to add installed user apps, drag tiles, select multiple items, and align or distribute them. Confirm the changes to apply them to the TV. Update both the manager and the corresponding launcher to use a newer layout version.

For field definitions, JSON examples, and comparisons with the rendered screen, see the [layout.json protocol specification](resource/README-development.md#layoutjson-协议规范与画面对照), currently in Chinese.

## License and acknowledgments

pureTV is licensed under [MIT](LICENSE). Some TV launcher code is based on [Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv); the original authors' copyright and license notices are retained in [NOTICE.md](NOTICE.md). See the [OFL license](resource/launcher/puretv/FONT-LICENSE-OFL.txt) for the font. Third-party code, fonts, and other assets used by the apps retain their respective copyright and license notices.
