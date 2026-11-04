[简体中文](README.md) | **English**

<div align="center">
  <img src="docs/branding/puretv-logo.png" width="112" alt="pureTV Chinese zodiac dragon logo">
</div>

pureTV is a desktop system manager for Android TV and Google TV. Connect to your TV over ADB to view system information, install and uninstall apps, enable or disable them, choose a launcher, and customize supported home screens with a visual canvas. Agents can also control the open manager through MCP.

[![Release](https://img.shields.io/github/v/release/ecojust/pureTV?style=flat-square&label=release&color=0f766e&sort=date)](https://github.com/ecojust/pureTV/releases/latest)
[![Platforms](https://img.shields.io/badge/platforms-Windows%20%7C%20macOS%20%7C%20Linux-2563eb?style=flat-square)](desktop/README.md)
[![Launcher count](https://img.shields.io/badge/launchers-10-7c3aed?style=flat-square)](resource/launcher/)
[![App count](https://img.shields.io/badge/apps-115-f97316?style=flat-square)](resource/apps/)
[![MCP](https://img.shields.io/badge/MCP-34%20tools-5c4ee5?style=flat-square)](desktop/docs/mcp.md)
[![Layout](https://img.shields.io/badge/layout-v5-0891b2?style=flat-square)](resource/README-development.md#layoutjson-协议规范与画面对照)
[![Android TV](https://img.shields.io/badge/Android%20TV-ADB-3ddc84?style=flat-square&logo=android&logoColor=white)](#connection-and-app-management)
[![License](https://img.shields.io/badge/license-MIT-f4c430?style=flat-square)](LICENSE)

![Manager preview using simulated device data](docs/previews/manager-en.png)

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

<!-- resource-index:start -->

### Launchers

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/aster/"><img src="docs/previews/en/launcher-aster.png" width="180" alt="Aster TV preview"><br>Aster TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/circuit/"><img src="docs/previews/en/launcher-circuit.png" width="180" alt="Circuit TV preview"><br>Circuit TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/drift/"><img src="docs/previews/en/launcher-drift.png" width="180" alt="Drift TV preview"><br>Drift TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/forma/"><img src="docs/previews/en/launcher-forma.png" width="180" alt="Forma TV preview"><br>Forma TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/mono/"><img src="docs/previews/en/launcher-mono.png" width="180" alt="Mono TV preview"><br>Mono TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/moss/"><img src="docs/previews/en/launcher-moss.png" width="180" alt="Moss TV preview"><br>Moss TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/nova/"><img src="docs/previews/en/launcher-nova.png" width="180" alt="Nova TV preview"><br>Nova TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/pixel/"><img src="docs/previews/en/launcher-pixel.png" width="180" alt="Pixel TV preview"><br>Pixel TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/puretv/"><img src="docs/previews/en/launcher-puretv.png" width="180" alt="pureTV Launcher preview"><br>pureTV Launcher</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/launcher/sol/"><img src="docs/previews/en/launcher-sol.png" width="180" alt="Sol TV preview"><br>Sol TV</a></td>
    <td width="25%"></td>
    <td width="25%"></td>
  </tr>
</table>

### Apps - Media

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cctv/"><img src="docs/previews/en/app-cctv.png" width="180" alt="CCTV Live preview"><br>CCTV Live</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hifini/"><img src="docs/previews/en/app-hifini.png" width="180" alt="HIFINi TV preview"><br>HIFINi TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shortvideo/"><img src="docs/previews/en/app-shortvideo.png" width="180" alt="ShortVideo TV preview"><br>ShortVideo TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/webtv/"><img src="docs/previews/en/app-webtv.png" width="180" alt="WebTV preview"><br>WebTV</a></td>
  </tr>
</table>

### Apps - Games

<table>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/adjacency-forge/"><img src="docs/previews/en/app-adjacency-forge.png" width="180" alt="Adjacency Forge (Chinese UI) preview"><br>Adjacency Forge (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/adventure-island/"><img src="docs/previews/en/app-adventure-island.png" width="180" alt="Adventure Island TV preview"><br>Adventure Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/airlock-budget/"><img src="docs/previews/en/app-airlock-budget.png" width="180" alt="Airlock Budget (Chinese UI) preview"><br>Airlock Budget (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/alien-shooter/"><img src="docs/previews/en/app-alien-shooter.png" width="180" alt="Alien Shooter TV preview"><br>Alien Shooter TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/arrow-harvest/"><img src="docs/previews/en/app-arrow-harvest.png" width="180" alt="Arrow Harvest (Chinese UI) preview"><br>Arrow Harvest (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/assembly-kitchen/"><img src="docs/previews/en/app-assembly-kitchen.png" width="180" alt="Assembly Kitchen (Chinese UI) preview"><br>Assembly Kitchen (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/battery-exchange/"><img src="docs/previews/en/app-battery-exchange.png" width="180" alt="Battery Exchange (Chinese UI) preview"><br>Battery Exchange (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/beat-braid/"><img src="docs/previews/en/app-beat-braid.png" width="180" alt="Beat Braid preview"><br>Beat Braid</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/binary-weave/"><img src="docs/previews/en/app-binary-weave.png" width="180" alt="Binary Weave preview"><br>Binary Weave</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/bomb-jack/"><img src="docs/previews/en/app-bomb-jack.png" width="180" alt="Mighty Bomb Jack TV preview"><br>Mighty Bomb Jack TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/brick-paddle/"><img src="docs/previews/en/app-brick-paddle.png" width="180" alt="Brick Paddle preview"><br>Brick Paddle</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cable-unweaver/"><img src="docs/previews/en/app-cable-unweaver.png" width="180" alt="Cable Unweaver preview"><br>Cable Unweaver</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/clockwork-align/"><img src="docs/previews/en/app-clockwork-align.png" width="180" alt="Clockwork Alignment (Chinese UI) preview"><br>Clockwork Alignment (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/coast-kart/"><img src="docs/previews/en/app-coast-kart.png" width="180" alt="Coast Kart TV preview"><br>Coast Kart TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/codebreaker/"><img src="docs/previews/en/app-codebreaker.png" width="180" alt="Codebreaker preview"><br>Codebreaker</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/color-frontier/"><img src="docs/previews/en/app-color-frontier.png" width="180" alt="Color Frontier preview"><br>Color Frontier</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/color-paths/"><img src="docs/previews/en/app-color-paths.png" width="180" alt="Color Paths preview"><br>Color Paths</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/conveyor-window/"><img src="docs/previews/en/app-conveyor-window.png" width="180" alt="Conveyor Window (Chinese UI) preview"><br>Conveyor Window (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/cozy-island/"><img src="docs/previews/en/app-cozy-island.png" width="180" alt="Cozy Island TV preview"><br>Cozy Island TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/domino-chain/"><img src="docs/previews/en/app-domino-chain.png" width="180" alt="Domino Chain preview"><br>Domino Chain</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/dots-boxes/"><img src="docs/previews/en/app-dots-boxes.png" width="180" alt="Dots and Boxes preview"><br>Dots and Boxes</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/draughts-trail/"><img src="docs/previews/en/app-draughts-trail.png" width="180" alt="Draughts Trail preview"><br>Draughts Trail</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/echo-cartographer/"><img src="docs/previews/en/app-echo-cartographer.png" width="180" alt="Echo Cartographer (Chinese UI) preview"><br>Echo Cartographer (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/firebreak-planner/"><img src="docs/previews/en/app-firebreak-planner.png" width="180" alt="Firebreak Planner (Chinese UI) preview"><br>Firebreak Planner (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/fleet-ledger/"><img src="docs/previews/en/app-fleet-ledger.png" width="180" alt="Fleet Ledger preview"><br>Fleet Ledger</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/four-in-row/"><img src="docs/previews/en/app-four-in-row.png" width="180" alt="Four in Row preview"><br>Four in Row</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/frost-brake/"><img src="docs/previews/en/app-frost-brake.png" width="180" alt="Frost Brake preview"><br>Frost Brake</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/glass-fold/"><img src="docs/previews/en/app-glass-fold.png" width="180" alt="Glass Fold (Chinese UI) preview"><br>Glass Fold (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/gravity-courier/"><img src="docs/previews/en/app-gravity-courier.png" width="180" alt="Gravity Courier (Chinese UI) preview"><br>Gravity Courier (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/greenhouse-dials/"><img src="docs/previews/en/app-greenhouse-dials.png" width="180" alt="Greenhouse Dials (Chinese UI) preview"><br>Greenhouse Dials (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/harbor-counterweight/"><img src="docs/previews/en/app-harbor-counterweight.png" width="180" alt="Harbor Counterweight (Chinese UI) preview"><br>Harbor Counterweight (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hex-connection/"><img src="docs/previews/en/app-hex-connection.png" width="180" alt="Hex Connection preview"><br>Hex Connection</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/hidden-corridors/"><img src="docs/previews/en/app-hidden-corridors.png" width="180" alt="Hidden Corridors (Chinese UI) preview"><br>Hidden Corridors (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/island-dominoes/"><img src="docs/previews/en/app-island-dominoes.png" width="180" alt="Island Dominoes (Chinese UI) preview"><br>Island Dominoes (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/island-ink/"><img src="docs/previews/en/app-island-ink.png" width="180" alt="Island Ink preview"><br>Island Ink</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jackal/"><img src="docs/previews/en/app-jackal.png" width="180" alt="Jackal TV preview"><br>Jackal TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/jewel/"><img src="docs/previews/en/app-jewel.png" width="180" alt="Magic Jewelry TV preview"><br>Magic Jewelry TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/kaleido-keys/"><img src="docs/previews/en/app-kaleido-keys.png" width="180" alt="Kaleido Keys preview"><br>Kaleido Keys</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/knight-circuit/"><img src="docs/previews/en/app-knight-circuit.png" width="180" alt="Knight Circuit preview"><br>Knight Circuit</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lane-bowling/"><img src="docs/previews/en/app-lane-bowling.png" width="180" alt="Lane Bowling preview"><br>Lane Bowling</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lantern-rhythm/"><img src="docs/previews/en/app-lantern-rhythm.png" width="180" alt="Lantern Rhythm (Chinese UI) preview"><br>Lantern Rhythm (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/lens-distance/"><img src="docs/previews/en/app-lens-distance.png" width="180" alt="Lens Distance preview"><br>Lens Distance</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/liberty-stones/"><img src="docs/previews/en/app-liberty-stones.png" width="180" alt="Liberty Stones preview"><br>Liberty Stones</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/light-chambers/"><img src="docs/previews/en/app-light-chambers.png" width="180" alt="Light Chambers preview"><br>Light Chambers</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/logic-workbench/"><img src="docs/previews/en/app-logic-workbench.png" width="180" alt="Logic Workbench preview"><br>Logic Workbench</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/loop-orchard/"><img src="docs/previews/en/app-loop-orchard.png" width="180" alt="Loop Orchard (Chinese UI) preview"><br>Loop Orchard (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/magnetic-warehouse/"><img src="docs/previews/en/app-magnetic-warehouse.png" width="180" alt="Magnetic Warehouse (Chinese UI) preview"><br>Magnetic Warehouse (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/measure-pour/"><img src="docs/previews/en/app-measure-pour.png" width="180" alt="Measure Pour preview"><br>Measure Pour</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/memory-gallery/"><img src="docs/previews/en/app-memory-gallery.png" width="180" alt="Memory Gallery preview"><br>Memory Gallery</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/merge-tiles/"><img src="docs/previews/en/app-merge-tiles.png" width="180" alt="Merge Tiles preview"><br>Merge Tiles</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/metronome-gates/"><img src="docs/previews/en/app-metronome-gates.png" width="180" alt="Metronome Gates preview"><br>Metronome Gates</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/mine-survey/"><img src="docs/previews/en/app-mine-survey.png" width="180" alt="Mine Survey preview"><br>Mine Survey</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/moire-atelier/"><img src="docs/previews/en/app-moire-atelier.png" width="180" alt="Moiré Atelier preview"><br>Moiré Atelier</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/nim-orbit/"><img src="docs/previews/en/app-nim-orbit.png" width="180" alt="Nim Orbit preview"><br>Nim Orbit</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/number-dunes/"><img src="docs/previews/en/app-number-dunes.png" width="180" alt="Number Dunes (Chinese UI) preview"><br>Number Dunes (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/orbit-turret/"><img src="docs/previews/en/app-orbit-turret.png" width="180" alt="Orbit Turret preview"><br>Orbit Turret</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/orchard-snake/"><img src="docs/previews/en/app-orchard-snake.png" width="180" alt="Orchard Snake preview"><br>Orchard Snake</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/packing-sculptor/"><img src="docs/previews/en/app-packing-sculptor.png" width="180" alt="Packing Sculptor preview"><br>Packing Sculptor</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/parallax-skyline/"><img src="docs/previews/en/app-parallax-skyline.png" width="180" alt="Parallax Skyline preview"><br>Parallax Skyline</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/parity-garden/"><img src="docs/previews/en/app-parity-garden.png" width="180" alt="Parity Garden (Chinese UI) preview"><br>Parity Garden (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/path-glyphs/"><img src="docs/previews/en/app-path-glyphs.png" width="180" alt="Path Glyphs (Chinese UI) preview"><br>Path Glyphs (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pixel-clues/"><img src="docs/previews/en/app-pixel-clues.png" width="180" alt="Pixel Clues preview"><br>Pixel Clues</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pocket-golf/"><img src="docs/previews/en/app-pocket-golf.png" width="180" alt="Pocket Golf preview"><br>Pocket Golf</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pocket-solitaire/"><img src="docs/previews/en/app-pocket-solitaire.png" width="180" alt="Pocket Solitaire preview"><br>Pocket Solitaire</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pollinator-contract/"><img src="docs/previews/en/app-pollinator-contract.png" width="180" alt="Pollinator Contract (Chinese UI) preview"><br>Pollinator Contract (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pressure-seal/"><img src="docs/previews/en/app-pressure-seal.png" width="180" alt="Pressure Seal preview"><br>Pressure Seal</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/prism-relay/"><img src="docs/previews/en/app-prism-relay.png" width="180" alt="Prism Relay (Chinese UI) preview"><br>Prism Relay (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/pulse-vault/"><img src="docs/previews/en/app-pulse-vault.png" width="180" alt="Pulse Vault (Chinese UI) preview"><br>Pulse Vault (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/quadrant-five/"><img src="docs/previews/en/app-quadrant-five.png" width="180" alt="Quadrant Five preview"><br>Quadrant Five</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/queen-constellation/"><img src="docs/previews/en/app-queen-constellation.png" width="180" alt="Queen Constellation preview"><br>Queen Constellation</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rectangle-atlas/"><img src="docs/previews/en/app-rectangle-atlas.png" width="180" alt="Rectangle Atlas preview"><br>Rectangle Atlas</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/reservoir-seasons/"><img src="docs/previews/en/app-reservoir-seasons.png" width="180" alt="Reservoir Seasons (Chinese UI) preview"><br>Reservoir Seasons (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/resonance-bridge/"><img src="docs/previews/en/app-resonance-bridge.png" width="180" alt="Resonance Bridge (Chinese UI) preview"><br>Resonance Bridge (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/reversi-relay/"><img src="docs/previews/en/app-reversi-relay.png" width="180" alt="Reversi Relay preview"><br>Reversi Relay</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/ring-towers/"><img src="docs/previews/en/app-ring-towers.png" width="180" alt="Ring Towers preview"><br>Ring Towers</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/river-guard/"><img src="docs/previews/en/app-river-guard.png" width="180" alt="River Guard preview"><br>River Guard</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/river-hopper/"><img src="docs/previews/en/app-river-hopper.png" width="180" alt="River Hopper preview"><br>River Hopper</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rooftop-runner/"><img src="docs/previews/en/app-rooftop-runner.png" width="180" alt="Rooftop Runner preview"><br>Rooftop Runner</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rook-rescue/"><img src="docs/previews/en/app-rook-rescue.png" width="180" alt="Rook Rescue preview"><br>Rook Rescue</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/rotor-locksmith/"><img src="docs/previews/en/app-rotor-locksmith.png" width="180" alt="Rotor Locksmith preview"><br>Rotor Locksmith</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sandglass-split/"><img src="docs/previews/en/app-sandglass-split.png" width="180" alt="Sandglass Split (Chinese UI) preview"><br>Sandglass Split (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/seed-mancala/"><img src="docs/previews/en/app-seed-mancala.png" width="180" alt="Seed Mancala preview"><br>Seed Mancala</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shade-duplicates/"><img src="docs/previews/en/app-shade-duplicates.png" width="180" alt="Shade Duplicates preview"><br>Shade Duplicates</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shadow-foundry/"><img src="docs/previews/en/app-shadow-foundry.png" width="180" alt="Shadow Foundry preview"><br>Shadow Foundry</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/shadow-shutter/"><img src="docs/previews/en/app-shadow-shutter.png" width="180" alt="Shadow Shutter (Chinese UI) preview"><br>Shadow Shutter (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/skyline-numbers/"><img src="docs/previews/en/app-skyline-numbers.png" width="180" alt="Skyline Numbers preview"><br>Skyline Numbers</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sliding-order/"><img src="docs/previews/en/app-sliding-order.png" width="180" alt="Sliding Order preview"><br>Sliding Order</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/solar-shift/"><img src="docs/previews/en/app-solar-shift.png" width="180" alt="Solar Shift (Chinese UI) preview"><br>Solar Shift (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sorting-wires/"><img src="docs/previews/en/app-sorting-wires.png" width="180" alt="Sorting Wires preview"><br>Sorting Wires</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/stack-dispatch/"><img src="docs/previews/en/app-stack-dispatch.png" width="180" alt="Stack Dispatch preview"><br>Stack Dispatch</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/star-formation/"><img src="docs/previews/en/app-star-formation.png" width="180" alt="Star Formation preview"><br>Star Formation</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/stone-bay/"><img src="docs/previews/en/app-stone-bay.png" width="180" alt="Stone Bay preview"><br>Stone Bay</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/sum-crossings/"><img src="docs/previews/en/app-sum-crossings.png" width="180" alt="Sum Crossings preview"><br>Sum Crossings</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/super-mario/"><img src="docs/previews/en/app-super-mario.png" width="180" alt="Super Mario TV preview"><br>Super Mario TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/switchyard-minute/"><img src="docs/previews/en/app-switchyard-minute.png" width="180" alt="Switchyard Minute (Chinese UI) preview"><br>Switchyard Minute (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tank/"><img src="docs/previews/en/app-tank.png" width="180" alt="Tank TV preview"><br>Tank TV</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tension-span/"><img src="docs/previews/en/app-tension-span.png" width="180" alt="Tension Span (Chinese UI) preview"><br>Tension Span (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tetris/"><img src="docs/previews/en/app-tetris.png" width="180" alt="Tetris TV preview"><br>Tetris TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tetro-islands/"><img src="docs/previews/en/app-tetro-islands.png" width="180" alt="Tetro Islands preview"><br>Tetro Islands</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/thermal-glider/"><img src="docs/previews/en/app-thermal-glider.png" width="180" alt="Thermal Glider (Chinese UI) preview"><br>Thermal Glider (Chinese UI)</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tide-lock/"><img src="docs/previews/en/app-tide-lock.png" width="180" alt="Tide Lock (Chinese UI) preview"><br>Tide Lock (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tile-garden/"><img src="docs/previews/en/app-tile-garden.png" width="180" alt="Tile Garden preview"><br>Tile Garden</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/torch-bridge/"><img src="docs/previews/en/app-torch-bridge.png" width="180" alt="Torch Bridge preview"><br>Torch Bridge</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/tower-overlap/"><img src="docs/previews/en/app-tower-overlap.png" width="180" alt="Tower Overlap preview"><br>Tower Overlap</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/traffic-escape/"><img src="docs/previews/en/app-traffic-escape.png" width="180" alt="Traffic Escape preview"><br>Traffic Escape</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/triangle-pegs/"><img src="docs/previews/en/app-triangle-pegs.png" width="180" alt="Triangle Pegs preview"><br>Triangle Pegs</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/triangular-tessera/"><img src="docs/previews/en/app-triangular-tessera.png" width="180" alt="Triangular Tessera (Chinese UI) preview"><br>Triangular Tessera (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/twenty-four/"><img src="docs/previews/en/app-twenty-four.png" width="180" alt="Twenty Four preview"><br>Twenty Four</a></td>
  </tr>
  <tr>
    <td align="center" valign="top" width="25%"><a href="resource/apps/used-car-racing/"><img src="docs/previews/en/app-used-car-racing.png" width="180" alt="Used Car Racing TV preview"><br>Used Car Racing TV</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/weight-ledger/"><img src="docs/previews/en/app-weight-ledger.png" width="180" alt="Weight Ledger (Chinese UI) preview"><br>Weight Ledger (Chinese UI)</a></td>
    <td align="center" valign="top" width="25%"><a href="resource/apps/word-ladder/"><img src="docs/previews/en/app-word-ladder.png" width="180" alt="Word Ladder preview"><br>Word Ladder</a></td>
    <td width="25%"></td>
  </tr>
</table>

<!-- resource-index:end -->

TV app APKs and source code developed by ecojust are available in [resource/apps/](resource/apps/).

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
