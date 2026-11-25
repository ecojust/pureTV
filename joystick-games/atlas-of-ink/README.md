# 墨绘地图集 · Atlas of Ink

[Android TV 0.1.4 · APK](atlas-of-ink-0.1.4.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/atlas-of-ink-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/atlas-of-ink-windows-x64-setup.exe)

历史安装包（Android 0.1.3） · [Android TV 0.1.3 · APK](atlas-of-ink-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/atlas-of-ink-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/atlas-of-ink-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

为各类客户探索未知地形，画出一季的地图。地图、羊皮纸与页面装饰由原版 Canvas 2D 程序离线绘制。

方向键移动羽毛笔。按住 A 集中感知，松开把地形绘到羊皮纸上。B 重读委托，X 打开交图确认。每个客户按自己的用途评价地图。 START 从标题开始、暂停或继续。Wi-Fi 中断或应用失焦后，按 START 继续。原版键盘及触控操作也可用。

本目录提供 0.1.1 的离线源包。三端宿主通过 `game.json` 加载 `dist/tv.html`，以 `qa-plan.json` 核验实际玩法和存档。

使用 Node.js 运行 `npm ci`、`npm test`、`npm run build` 和 `npm run build:check`。

[上游固定版本](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-123) · [许可与归属](NOTICE.md)

<!-- puzzle-downloads -->
## 0.1.1 版安装包与验证记录

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](atlas-of-ink-0.1.1.apk?raw=1) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-atlas-of-ink-v0.1.1/AtlasOfInk-0.1.1-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-atlas-of-ink-v0.1.1/AtlasOfInk-0.1.1-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-atlas-of-ink-v0.1.1/AtlasOfInk-0.1.1-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-atlas-of-ink-v0.1.1/AtlasOfInk-0.1.1-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用版已通过 Apple Silicon 原生、Apple Silicon 端口占用、Rosetta 2 及 Intel 原生四项实玩验收。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)
