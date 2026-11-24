# 霓虹秘仪 · NEON ARCANA

[Android TV 0.1.3 · APK](neon-arcana-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/neon-arcana-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/neon-arcana-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

把每手三枚符块放上 8×8 格盘。填满行或列即可清除、得分并积累星光。主线「Begin the Restoration」依次点亮 22 张大阿卡纳，点亮指定卡牌后可用火花发动能力。「Free Reading」可单独挑战分数。游戏使用原作的 Three.js 着色器、卡面绘制和程序化音乐。

| 场景 | Wi-Fi 手柄操作 |
| --- | --- |
| 标题和菜单 | ↑↓ 选项，A 确认。START 开始主线，有存档时继续上次占读。菜单内 Y 返回。 |
| 格盘 | B 切换剩余符块，方向键移动落点，A 放置。没有选中手牌时，A 会先选择第一枚。Y 取消能力瞄准或取消当前选择。 |
| 能力栏 | X 打开，方向键浏览，A 查看锁定条件或发动已解锁能力。定点能力用方向键瞄准后按 A 确认，Y 返回。格盘无可放位置时，栏末可选择结束本局。 |
| 暂停与存档 | START 暂停，再按 START 继续。暂停菜单可查看卡册、帮助和设置，或保存回标题。断连、应用失焦或系统挂起会保留局面并挂起游戏声音，回到前台后按 START 同时恢复画面和声音。 |

三端共用离线页面，运行环境需要 WebGL 2。Android 包名为 `com.ecojust.joystick.neonarcana`，版本为 `0.1.1`（Android versionCode 2）。本次更新补上真实音频上下文的生命周期处理；原作玩法版本仍为 1.0.0。控制器的服务地址和席位显示在屏幕右侧。

## 构建和验证

在本目录执行 `npm ci`、`npm test`、`npm run build`、`npm run build:check`。产物为 `dist/tv.html` 与 `dist/THIRD-PARTY-NOTICES.txt`。原版 Three.js 0.165.0、Cinzel / Orbitron 的 Latin 字体子集与全部着色器随包内嵌，卡面、格盘、粒子与音效在本地生成。

原作模拟测试覆盖放置、连线清除、能力、存档、确定性及自动玩家的完整恢复进程。浏览器手柄复验使用仓库的 Python TCP SDK、Playwright 和 Chromium。构建后在本目录执行 `python docs/browser/verify.py --output /tmp/neon-arcana-test`。[浏览器手柄记录](docs/browser/results.json) · [540p 浏览器截图](docs/browser/board-960x540.png) · [720p 浏览器截图](docs/browser/board-1280x720.png)

[音频对照记录](docs/browser/audio.json) 显示 0.1.1 在应用失焦和挂起时将 AudioContext 切到 suspended，返回后按 B 保持静音，按 START 才切回 running。真实音频上下文的暂停与恢复可用 `python docs/browser/verify-audio.py --output /tmp/neon-audio.json` 复验。三端原生验收步骤见 [qa-plan.json](qa-plan.json)。

[Andrew Wooldridge 的原作与固定源版本](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-111) · [上游文件清单](upstream.json) · [许可证与字体归属](NOTICE.md)

<!-- puzzle-downloads -->
## 0.1.1 版安装包与验证记录

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](neon-arcana-0.1.1.apk?raw=1) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-neon-arcana-v0.1.1/NeonArcana-0.1.1-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-neon-arcana-v0.1.1/NeonArcana-0.1.1-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-neon-arcana-v0.1.1/NeonArcana-0.1.1-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-neon-arcana-v0.1.1/NeonArcana-0.1.1-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用包为预览版，Apple Silicon 原生、Apple Silicon 端口占用以及 Rosetta 2 三种模式均已实玩通过。托管 Intel Mac 未提供可用的游戏图形加速，Intel 实体机游玩仍待验证。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)
