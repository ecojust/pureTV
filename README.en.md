[简体中文](README.md) | **English**

<div align="center">
  <img src="docs/branding/puretv-logo.png" width="112" alt="pureTV logo">
  <h1>pureTV</h1>
  <p>Manage your TV system, apps, and home screen.</p>
</div>

pureTV is a desktop system manager for Android TV and Google TV. Connect to your TV over ADB to view system information, install and uninstall apps, enable or disable them, choose a launcher, and customize supported home screens with a visual canvas. Agents can also control the open manager through MCP.

[![Release](https://img.shields.io/github/v/release/ecojust/pureTV?style=flat-square&label=release&color=0f766e&sort=date)](https://github.com/ecojust/pureTV/releases/latest)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-2563eb?style=flat-square)](desktop/README.md)
[![MCP](https://img.shields.io/badge/MCP-31%20tools-5c4ee5?style=flat-square)](desktop/docs/mcp.md)
[![Layout](https://img.shields.io/badge/layout-v5-0891b2?style=flat-square)](resource/README-development.md#layoutjson-协议规范与画面对照)
[![Android TV](https://img.shields.io/badge/Android%20TV-ADB-3ddc84?style=flat-square&logo=android&logoColor=white)](#connection-and-app-management)
[![License](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)

![Manager preview using simulated device data](docs/previews/manager-031.png)

## Connection and app management

1. Connect your computer and TV to networks that can reach each other, then enable ADB or network debugging in the TV's developer options.
2. Enter the TV's IP address or hostname and debugging port on the home page, then authorize the computer on the TV. Port 5555 is common; use the port configured on your TV.
3. If ADB is missing, read and accept the Android SDK license, then click “Download and configure ADB.” The manager tries Google first and uses the Tencent mirror if that fails. You can also select an existing ADB installation.

Once connected, the home page displays the model, Android version, SDK version, security patch level, CPU, memory, `/data` storage capacity, resolution, and uptime. Other pages show the current connection status at the top.

- **App management:** search and filter apps, enable or disable them in batches, uninstall them for the current user, and restore system apps whose APKs are still present.
- **Pending installations:** import local APKs, install one from its row, or select several for batch installation. Successful items leave the queue; failed and unprocessed items remain.
- **Launchers:** import and install launcher APKs directly from this page, choose a default home screen, or restore the previous default. The active launcher shows “Adjust layout” when it supports the interface.
- App and launcher sizes include the main APK and split APKs. Private data, caches, and optimized files are excluded. Unreadable sizes are explicitly shown as unknown.
- Lists scroll within their own tables, with fixed headers and batch actions above them. Core system components and the current default launcher are protected.

Uninstalling a system app affects only the current Android user, preserves its data, and leaves the APK on the system partition. Newly installed user apps with a launchable activity can be added to the launcher layout.

## Launcher and TV app resources

[![Native Android previews of eight v5 launchers](docs/previews/launcher-collection-010.png)](resource/launcher/)

The public [resource/](resource/) directory contains [launcher/](resource/launcher/) and [apps/](resource/apps/). Launcher and app sources previously stored at the repository root have moved into these directories. GitHub Releases contain only the desktop manager; launcher and TV app APKs are available in their individual software directories. Each software folder contains at least one actual APK and may also include matching source code, cover images, author details, licenses, and SHA256 checksums. Click a software name to open its folder.

“Customizable” in the launcher table means support for this manager's **layout.json version 5 users/system interface**. Launcher cards use the Home background image by default. A provided `thumb.png`, `APK-name.thumb.png`, or manually selected cover takes precedence.

```text
resource/
├── launcher/
│   ├── puretv/        # Each folder has its own APK, source, layout example, and cover
│   ├── nova/          # tvOS style
│   ├── aster/         # Starry sky
│   ├── sol/           # Nordic daylight
│   ├── moss/          # Misty forest
│   ├── forma/         # Bauhaus
│   ├── mono/          # Monochrome editorial
│   ├── drift/         # Pastel dreamscape
│   ├── circuit/       # Neon circuitry
│   └── pixel/         # Retro pixels
└── apps/
    ├── music/         # Music TV source and APK
    ├── shortvideo/    # ShortVideo TV source and APK
    ├── webtv/         # WebTV source and APK
    ├── tvbro/         # TV Bro APK and corresponding source
    └── jellyfin-tv/   # Jellyfin TV APK and corresponding source
```

<!-- resource-index:start -->

### Launchers

| Name | Author | Version | APK size | Customizable | Preview |
| --- | --- | --- | --- | --- | --- |
| [Aster TV · 星轨](resource/launcher/aster/) | ecojust / 桔子桑 | 0.1.0 | 435.6 KB | Yes | <img src="resource/launcher/aster/thumb.png" width="180" alt="Aster TV · 星轨 preview"> |
| [Circuit TV · 回路](resource/launcher/circuit/) | ecojust / 桔子桑 | 0.1.0 | 431.6 KB | Yes | <img src="resource/launcher/circuit/thumb.png" width="180" alt="Circuit TV · 回路 preview"> |
| [Drift TV](resource/launcher/drift/) | ecojust / 桔子桑 | 0.1.0 | 455.7 KB | Yes | <img src="resource/launcher/drift/thumb.png" width="180" alt="Drift TV preview"> |
| [Forma TV](resource/launcher/forma/) | ecojust / 桔子桑 | 0.1.0 | 439.7 KB | Yes | <img src="resource/launcher/forma/thumb.png" width="180" alt="Forma TV preview"> |
| [Mono TV 墨白](resource/launcher/mono/) | ecojust / 桔子桑 | 0.1.0 | 439.7 KB | Yes | <img src="resource/launcher/mono/thumb.png" width="180" alt="Mono TV 墨白 preview"> |
| [Moss TV](resource/launcher/moss/) | ecojust / 桔子桑 | 0.1.0 | 463.7 KB | Yes | <img src="resource/launcher/moss/thumb.png" width="180" alt="Moss TV preview"> |
| [Nova TV](resource/launcher/nova/) | ecojust / 桔子桑 | 0.1.1 | 471.7 KB | Yes | <img src="resource/launcher/nova/thumb.png" width="180" alt="Nova TV preview"> |
| [Pixel TV 像素](resource/launcher/pixel/) | ecojust / 桔子桑 | 0.1.0 | 439.7 KB | Yes | <img src="resource/launcher/pixel/thumb.png" width="180" alt="Pixel TV 像素 preview"> |
| [pureTV Launcher](resource/launcher/puretv/) | ecojust / 桔子桑 | 0.3.6 | 740.1 KB | Yes | <img src="resource/launcher/puretv/thumb.png" width="180" alt="pureTV Launcher preview"> |
| [Sol TV](resource/launcher/sol/) | ecojust / 桔子桑 | 0.1.0 | 435.7 KB | Yes | <img src="resource/launcher/sol/thumb.png" width="180" alt="Sol TV preview"> |

### TV apps

| Name | Author | Version | APK size | Purpose | Preview |
| --- | --- | --- | --- | --- | --- |
| [Jellyfin for Android TV](resource/apps/jellyfin-tv/) | Jellyfin contributors | 0.19.10 | 20.93 MB | Android TV client for Jellyfin media servers | <img src="resource/apps/jellyfin-tv/thumb.png" width="180" alt="Jellyfin for Android TV preview"> |
| [Music TV](resource/apps/music/) | ecojust / 桔子桑 | 0.1.2 | 40.8 KB | Native TV music player | <img src="resource/apps/music/thumb.png" width="180" alt="Music TV preview"> |
| [ShortVideo TV](resource/apps/shortvideo/) | ecojust / 桔子桑 | 0.1.0 | 28.7 KB | Short video player with remote control support | <img src="resource/apps/shortvideo/thumb.png" width="180" alt="ShortVideo TV preview"> |
| [TV Bro](resource/apps/tvbro/) | Fedir Tsapana (truefedex) | 2.1.6 | 6.48 MB | TV browser with remote control support, using the system WebView | <img src="resource/apps/tvbro/thumb.png" width="180" alt="TV Bro preview"> |
| [WebTV](resource/apps/webtv/) | ecojust / 桔子桑 | 0.1.0 | 36.8 KB | Live TV and M3U player | <img src="resource/apps/webtv/thumb.png" width="180" alt="WebTV preview"> |

<!-- resource-index:end -->

TV app APKs and source code are available in [resource/apps/](resource/apps/). Third-party resources retain their respective authors, original signatures, and licenses; they are not covered by pureTV's MIT license.

## MCP / Agent

Open “Device connection → MCP · Agent debugging,” copy the configuration into your client, and keep the manager window open. Its 31 tools cover system information, connections, app management, APK installation, launcher switching and layouts, background images, ADB configuration, language and theme settings, cancellation, and logs. The Agent and the interface share the same state.

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

pureTV is licensed under [MIT](LICENSE). Some TV launcher code is based on [Gathin23/cleanyourtv](https://github.com/Gathin23/cleanyourtv); the original authors' copyright and license notices are retained in [NOTICE.md](NOTICE.md). See the [OFL license](resource/launcher/puretv/FONT-LICENSE-OFL.txt) for the font. Third-party APKs, screenshots, and source code use the licenses in their respective resource folders.
