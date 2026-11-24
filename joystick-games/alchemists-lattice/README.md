# 炼金方阵 · Alchemist's Lattice

[Android TV 0.1.3 · APK](alchemists-lattice-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/alchemists-lattice-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/alchemists-lattice-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

在 9 × 9 的炼金台上放置手牌。填满一行或一列即可消除方块、剥开矿藏并收获元素。通过学徒任务取得金币和经验，在地图上前往商店、技能树和坩埚。完整棋盘、战斗、对白、三章旅程与原作的 56 幅 WebP 图画均可离线运行。[原作与许可证](NOTICE.md)

| 手柄 | 炼金台中的操作 |
| --- | --- |
| X | 切换手牌并显示可放置的位置 |
| 十字键 | 移动所选牌的落点 |
| A | 确认放置或选定目标 |
| Y | 已学习 Tile Swap 时，按原作规则将多格手牌旋转四分之一圈，冷却为六次放置 |
| B | 进入或退出道具栏，方向键选中后以 A 使用；在地图切换操作栏，剧情中跳至下一选择 |
| START | 开始学徒旅程、暂停或继续；A 可逐句阅读对白 |

炼金台支持原版键鼠和本地手柄。Wi-Fi 手柄断线或窗口失焦会取消待执行操作并暂停，重新连接后须显式继续。存档保留当前棋盘、手牌和旅程。软件图形后端使用原作 3D 棋盘的直接渲染路径；硬件支持时启用原版泛光和镜头效果。

使用 Node.js 执行 `npm ci`、`npm run build`、`npm run build:check` 和 `npm test`。Android TV、macOS 和 Windows 宿主使用同一份 `dist/tv.html`。[跨平台验收计划](qa-plan.json) · [浏览器执行记录](docs/browser/report.json) · [原版文件校验](upstream.json)

<!-- puzzle-downloads -->
## 0.1.1 版安装包与验证记录

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](alchemists-lattice-0.1.1.apk?raw=1) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-alchemists-lattice-v0.1.1/AlchemistsLattice-0.1.1-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-alchemists-lattice-v0.1.1/AlchemistsLattice-0.1.1-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-alchemists-lattice-v0.1.1/AlchemistsLattice-0.1.1-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-alchemists-lattice-v0.1.1/AlchemistsLattice-0.1.1-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用包为预览版，Apple Silicon 原生、Apple Silicon 端口占用以及 Rosetta 2 三种模式均已实玩通过。托管 Intel Mac 未提供可用的游戏图形加速，Intel 实体机游玩仍待验证。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)
