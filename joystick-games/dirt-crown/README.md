# Dirt Crown · 尘土王冠

[Android TV 0.1.3 · APK](dirt-crown-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/dirt-crown-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/dirt-crown-windows-x64-setup.exe)

历史安装包（Android 0.1.2） · [Android TV 0.1.2 · APK](dirt-crown-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/dirt-crown-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/dirt-crown-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

Andrew Wooldridge 的乡间赛车生涯游戏。保留原版程序美术、20 条赛道、7 个地区、26 个生涯赛事、六类升级，以及竞速、淘汰、计时、单挑和故事。

## Android TV 0.1.0 版交付记录

[Dirt Crown 0.1.0 APK](dirt-crown-0.1.0.apk) · [SHA256 校验](SHA256SUMS.txt) · [原包与运行验证](docs/android-runtime-44608423645/README.md)

需要 **Android 8.0 / API 26 或更新版本，以及支持 WebGL 2 的系统 WebView**。APK 为 1,124,106 字节，沿用 `06f1ab2b77e4` 构建的固定证书原签名包，未重新打包或签名。正常端口和占用回退两种模式各 62 项原生检查通过，覆盖原菜单、新建生涯、实际驾驶、九键、暂停恢复、断线和客户端 ID；未做实体电视或 ESP32 手柄验证，也未完成全部赛事。初次运行失败和本次原包复验的完整证据均保留。

## Windows 0.1.0 版交付记录

0.1.0 x64：[安装 EXE](DirtCrown-0.1.0-windows-x64-setup.exe)（1,212,925 字节）· [便携 ZIP](DirtCrown-0.1.0-windows-x64.zip)（1,138,201 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本／Windows 11 x64、Microsoft Edge WebView2 Runtime 和可用的 WebGL 2**；便携版请完整解压后运行 `PureTVGame.exe`。安装包未做 Authenticode 签名。

原 Windows CI 的正常端口与占用回退两种模式各通过 10 项检查，包含实际游戏、原 SDK 手柄、失焦／断线取消、存档重启与窗口检查；安装／卸载／重装及无关文件保留也通过。检查覆盖 96 DPI 下 960×540、1280×720，未做其他 DPI 缩放、实体手柄或完整通关测试。同批其他四款失败仍保留，以上结论仅针对本游戏。安装文件沿用原始字节，未重新编译，详见 [Windows 交付记录](docs/windows-delivery/) 和 [版本清单](windows-release.json)。

## 源码版 0.1.1 的连接与操作

标题页用方向键选 Free Race，Enter 确认。赛中用方向键或 WASD 驾驶，空格漂移。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 0.1.0 版交付记录

0.1.0 Universal：[DMG](macos/DirtCrown-0.1.0-macos-universal.dmg) · [ZIP](macos/DirtCrown-0.1.0-macos-universal.zip) · [SHA256 校验](macos/SHA256SUMS.txt) · [包来源与验证范围](packages.json)。DMG 内的应用可拖入 Applications；ZIP 解压后也可运行同一个应用。

需要 **macOS 11 或更新版本及 WebGL 2**。包包含 arm64 / x86_64；Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式的原生游戏与 pureTV SDK 检查已通过。**Intel 原生运行仍未验证**，不能据 Universal 架构推断 Intel 可玩。应用采用 ad-hoc 签名，未经过 Apple 公证；未做实体手柄或用户设备测试。

下载包沿用源提交 `ed27d8e4cd5f`、原流程 [44605769518](https://github.com/ecojust/pureTV/actions/runs/44605769518) 的已核验字节，未重新打包。Intel 原失败及有限覆盖说明见[验证记录](../../docs/racing-nine/native-readiness/ci-44605769518-attempt-1/README.md)。

Android、macOS、Windows 安装包及各自验证范围见上方。原版固定提交和逐文件来源见 [upstream.json](upstream.json)，依赖锁定见 [dependency-lock.json](dependency-lock.json)，美术/玩法比较与此前未到驾驶的限制见 [比较记录](../../docs/racing-nine/reviews/rally/dirt-crown/review.json)。旧的未提交适配丢失，本目录是重新从固定原源实现。

| 手柄键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 油门 / 刹车 | 上一项 / 下一项 |
| ← / → | 左右转向 | 焦点移动、数值调整 |
| A | 按住漂移 | 确认；剧情下一句 |
| B | 按住氮气 | 返回 |
| X | 复位车辆 | 剧情跳过、编辑删字 |
| Y | 切换镜头 | 车库换页；编辑保存 |
| START | 暂停 / 继续 | 开始、暂停剧情 |

电视端没有隐式自动油门；按住 ↑ 才供油。文本输入支持手柄逐字编辑。窗口失焦、原生暂停或手柄断线会清除控制并冻结当前场景；重连后需松开按键，再主动继续。侧边卡片读取原生快照中的实际客户端 ID，不推算信号强度。电脑键盘也保留 WASD/方向驾驶、空格漂移、Shift/B 氮气、R/X 复位、C/Y 镜头、Esc/P 暂停。

构建不需要 npm 下载依赖：

```sh
npm test
npm run build
npm run build:check
```

`src/` 为适配源，`dist/tv.html` 与其同目录资源是可离线重建的多文件页面。Three.js 0.165.0 及原 Bungee/Rubik 字体已锁定到本地，整个 dist 约 2.7 MB。运行需要 WebGL2；保留原 High/Medium/Low 图形设置。默认档位未为软件渲染测试强制降画质。

`game.json` 的 storageKeys 保留原生涯和设置两个存档键，assetPolicy 用于本地字体扩展，必须与根注册表匹配。原生宿主负责 `_puretv._tcp`、默认 63485、占用回退和存档，不在游戏中另开 socket。

MIT 原文见 [LICENSE](LICENSE)，Three MIT 与字体 OFL 详见 [NOTICE.md](NOTICE.md)。浏览器合成输入、真实 SDK、原生包与实体设备结果必须分别记录；macOS 的签名与验证范围见上方，其他平台状态以各自证据为准。
