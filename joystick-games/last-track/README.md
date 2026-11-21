# Last Track · 末路战车

[Android TV 0.1.2 · APK](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/last-track-0.1.2.apk) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/last-track-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/last-track-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

基于 [Alexander Uspenskiy / LastTrack](https://github.com/alexander-uspenskiy/LastTrack/tree/7fdf7cfb6affb84748e11980f837255b12130bb7) v0.10.6 的 pureTV 手柄适配。保留原作 PBR 车模、赛道、AI 对手、武器、商店、装甲升级和存档。

## Android TV 0.1.0 版交付记录

[Last Track 0.1.0 APK](last-track-0.1.0.apk)（8,900,372 字节） · [SHA256 校验](SHA256SUMS.txt)。需要 Android 8.0 或更新版本以及支持 WebGL 2 的 WebView。

Android TV 16 模拟器中，默认 TCP 63485 与端口占用回退各通过 57 项原生检查。实际手柄输入完成选车、选赛道、低画质驾驶、射击、漂移、氮气和暂停恢复。实体电视及 ESP32 手柄尚未实测。[赛中截图及验证范围](docs/android-delivery/)

## Windows 0.1.0 版交付记录

0.1.0 x64：[安装 EXE](LastTrack-0.1.0-windows-x64-setup.exe)（8,934,793 字节）· [便携 ZIP](LastTrack-0.1.0-windows-x64.zip)（8,881,237 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本／Windows 11 x64、Microsoft Edge WebView2 Runtime 和可用的 WebGL 2**；便携版请完整解压后运行 `PureTVGame.exe`。安装包未做 Authenticode 签名。

原 Windows CI 的正常端口与占用回退两种模式各通过 10 项检查，包含实际游戏、原 SDK 手柄、失焦／断线取消、存档重启与窗口检查；安装／卸载／重装及无关文件保留也通过。检查覆盖 96 DPI 下 960×540、1280×720，未做其他 DPI 缩放、实体手柄或完整通关测试。同批其他四款失败仍保留，以上结论仅针对本游戏。安装文件沿用原始字节，未重新编译，详见 [Windows 交付记录](docs/windows-delivery/) 和 [版本清单](windows-release.json)。

## 源码版 0.1.1 的连接与操作

在 New Game 用方向键选择，Enter 确认。赛中 W / S 或 ↑ / ↓ 给油和刹车，A / D 或 ← / → 转向。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 0.1.0 版交付记录

0.1.0 Universal：[DMG](macos/LastTrack-0.1.0-macos-universal.dmg) · [ZIP](macos/LastTrack-0.1.0-macos-universal.zip) · [SHA256 校验](macos/SHA256SUMS.txt) · [包来源与验证范围](packages.json)。DMG 内的应用可拖入 Applications；ZIP 解压后也可运行同一个应用。

需要 **macOS 11 或更新版本及 WebGL 2**。包包含 arm64 / x86_64；Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式的原生游戏与 pureTV SDK 检查已通过。**Intel 原生运行仍未验证**，不能据 Universal 架构推断 Intel 可玩。应用采用 ad-hoc 签名，未经过 Apple 公证；未做实体手柄或用户设备测试。

下载包沿用源提交 `ed27d8e4cd5f`、原流程 [44605769518](https://github.com/ecojust/pureTV/actions/runs/44605769518) 的已核验字节，未重新打包。Intel 原失败及有限覆盖说明见[验证记录](../../docs/racing-nine/native-readiness/ci-44605769518-attempt-1/README.md)。

| 按键 | 比赛中 | 菜单中 |
| --- | --- | --- |
| 上 / 下 | 油门 / 刹车 | 选择 |
| 左 / 右 | 左转 / 右转 | 选择 / 调整 |
| A | 射击 | 确认 |
| B | 漂移 | 返回 |
| X | 切换武器 | — |
| Y | 氮气 | — |
| START | 暂停 / 继续 | 确认 / 关闭设置 |

pureTV 原生服务默认 TCP **63485**；连接侧栏显示实际手柄 ID。断开、失焦和后台切换清空操作并暂停，重新连接保持暂停。所有诊断读取缓存，不额外消费原生输入或游戏事件。

```sh
npm ci
npm run build
npm run build:check
npm test
```

完整固定源码及原锁保存在 `src/upstream/`。保留上游 vendored Three.js r170 和全部 `assets/`；静态复制构建不升级依赖。安装包不包含原仓库的录制/宣传工具和测试目录，但它们仍保留在源码中。网页统计脚本移除；开始新存档的原生确认框改为可用遥控器/手柄操作的界面确认。

上游项目 MIT，Three.js MIT，许可证随包保留。原版开发调试器的写入/跳关/快进接口不对安装包页面暴露，`JoystickGameQA.snapshot()` 只返回副本。

macOS、Windows 安装包与各自验证范围见上方。Android TV 包与原生验证范围见上方。
