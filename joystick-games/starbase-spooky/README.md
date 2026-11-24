# 幽灵空间站 · Starbase Spooky

[Android TV 0.1.4 · APK](starbase-spooky-0.1.4.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/starbase-spooky-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/starbase-spooky-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

你是空间站的新管理员 Kit。和机器人 Orby 一起巡查八个房间、迎接五批访客，找出站里半夜发出响动的原因。找回第一条线索前，先去 Star Garden：在灯光面板里，把左右两侧相同颜色的电线接好，再调查地面发光的东西。

五天的故事包含科学问答、线索笔记以及五种谜题：接线、给零食机配电池、按太阳系顺序排列行星、记忆保险丝闪烁顺序和重现旋律。答错可以重试。保留原作英文界面、字幕、角色配音、音乐和场景画面。游戏进度保存在当前安装内，重新打开后选择 **Continue**。

## 手柄

使用安装版时，让手柄和设备连到同一局域网，按游戏侧栏显示的地址和 TCP 端口连接。单人游戏支持一位活动手柄。

| 操作 | Wi‑Fi 手柄 |
| --- | --- |
| 新游戏、暂停、继续 | START |
| 依次选中场景热点、地图目的地或谜题部件 | ↑ / ↓ |
| 调查、确认、继续对话 | A |
| 自由探索时走到相邻房间 | ← / → |
| 展开或收起地图 | X |
| 打开背包、关闭背包或返回 | B |
| 打开线索笔记 | Y |
| 调整设置、切换背包物品 | ← / → |

Kit 会自动走向选中的热点。连接中断时游戏暂停，重新连接后按 START 继续。键盘和标准浏览器游戏手柄保留原作键位：方向键选热点，Enter 调查，Q / E 换房间，M 打开地图，P 暂停。原作也支持鼠标和触摸。

## 构建与复核

在本目录运行 `npm ci`、`npm test`、`npm run build` 和 `npm run build:check`。构建将原作脚本和 pureTV 控制器整合到 `dist/tv.html`，画面、音效和音乐均随包提供。可在本目录运行 `python3 -m http.server --directory dist 8080`，浏览器访问 `http://127.0.0.1:8080/tv.html`。

原作模拟的 333 项检查通过，包含五天流程、谜题、线索、问答和存档。浏览器检查通过仓库的 Python SDK 发送 TCP 按键，在 960×540 和 1280×720 画面完成第一天的接线、取线索和存档续玩。主机层在这项浏览器检查中由本地测试服务提供。两种分辨率均在断线时停钟，重新连接后手动继续。重开后保留花园维修和发光线索，记录到的脚本异常和外部网络请求均为零。安装 Python Playwright 和 Chromium 后可用 `python3 tests/browser-sdk.py` 重现。三端原生宿主另按本目录的验收计划测试。[浏览器记录](docs/browser/report.json) · [维修画面](docs/browser/wires-960.png) · [线索画面](docs/browser/clue-1280.png) · [原生验收计划](qa-plan.json)

原始作者为 Andrew Wooldridge。基于 MIT 许可版本 `a7051c34fe2e7550fd206e6272f758df171855b0` 的 `game-130`。本地改动包括 Wi‑Fi 手柄、断线处理、电视布局与离线打包。[原作](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-130) · [许可](LICENSE) · [素材说明](NOTICE.md) · [原始文件校验](upstream.json)

### Android 安装版本

0.1.2（versionCode 3）面向 Android API 35 构建，最低支持 API 26。此前 0.1.1 的签名包含 target 29。在 Android TV 16 模拟器上，两次安装均出现 Google Play Protect 的旧版目标警告，54 秒后超时，游戏尚未启动。[原签名包及构建记录](https://github.com/ecojust/pureTV/tree/aa38c2dde1fe0269f7a20d5c3503865dba3ad0d5/packages/starbase-spooky) · [默认端口系统画面](docs/android-0.1.1-install/normal-screen.png) · [占用回退系统画面](docs/android-0.1.1-install/occupied-screen.png)

<!-- puzzle-downloads -->
## 0.1.2 版安装包与验证记录

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](starbase-spooky-0.1.2.apk?raw=1) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-starbase-spooky-v0.1.2/StarbaseSpooky-0.1.2-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-starbase-spooky-v0.1.2/StarbaseSpooky-0.1.2-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-starbase-spooky-v0.1.2/StarbaseSpooky-0.1.2-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-starbase-spooky-v0.1.2/StarbaseSpooky-0.1.2-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用版已通过 Apple Silicon 原生、Apple Silicon 端口占用、Rosetta 2 及 Intel 原生四项实玩验收。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)
