# Penguintrack · 雪地竞速

[Android TV 0.1.2 · APK](penguintrack-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/penguintrack-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/penguintrack-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

基于 [SilverNinja71/Penguin-Track](https://github.com/SilverNinja71/Penguin-Track/tree/0369367ff5aa76902bdf0736e4644efbbd3f1d82) 的 pureTV 手柄适配。保留原作者的雪地赛车物理、画面和关卡；不是 pureTV 原创游戏。

## Android TV 0.1.0 版交付记录

0.1.0：[签名 APK](penguintrack-0.1.0.apk)（2,342,332 字节）· [SHA256 校验](SHA256SUMS.txt) · [包与验收记录](android-release.json)。需要 **Android 8.0 / API 26 或更新版本，以及支持 WebGL 2 的系统 WebView**；不支持 Android 4.4/6 的旧 WebView。

正常端口和端口占用回退两种 Android 模式各通过 56 项原生检查，包括实际首条赛道驾驶、九键原 SDK 输入、客户端 ID、暂停、失焦和断线取消、重连后手动恢复；两模式分别核对 602 / 598 条唯一 ACK。安装包沿用原固定证书字节，未重新构建或签名。原菜单路线失败记录保留，见 [Android 交付说明及原始录像](docs/android-delivery/)。

原生检查在模拟器完成，未验证实体电视／ESP32、完整通关或退出应用后的存档恢复。原版触屏 Brake 按钮会遮住部分速度表；手柄操控和中央赛道画面可见。

## Windows 0.1.0 版交付记录

0.1.0 x64：[安装 EXE](Penguintrack-0.1.0-windows-x64-setup.exe)（2,424,280 字节）· [便携 ZIP](Penguintrack-0.1.0-windows-x64.zip)（2,360,273 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本／Windows 11 x64、Microsoft Edge WebView2 Runtime 和可用的 WebGL 2**；便携版请完整解压后运行 `PureTVGame.exe`。安装包未做 Authenticode 签名。

原 Windows CI 的正常端口与占用回退两种模式各通过 10 项检查，包含实际游戏、原 SDK 手柄、失焦／断线取消、存档重启与窗口检查；安装／卸载／重装及无关文件保留也通过。检查覆盖 96 DPI 下 960×540、1280×720，未做其他 DPI 缩放、实体手柄或完整通关测试。同批其他四款失败仍保留，以上结论仅针对本游戏。安装文件沿用原始字节，未重新编译，详见 [Windows 交付记录](docs/windows-delivery/) 和 [版本清单](windows-release.json)。

## 源码版 0.1.1 的连接与操作

选择 Play 进入战役，再选赛道。↑ 给油，↓ 刹车，← / → 转向。连接手柄后自动收起本机触控按钮，方便看清速度表。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 0.1.0 版交付记录

0.1.0 Universal：[DMG](macos/Penguintrack-0.1.0-macos-universal.dmg) · [ZIP](macos/Penguintrack-0.1.0-macos-universal.zip) · [SHA256 校验](macos/SHA256SUMS.txt) · [包来源与验证范围](packages.json)。DMG 内的应用可拖入 Applications；ZIP 解压后也可运行同一个应用。

需要 **macOS 11 或更新版本及 WebGL 2**。包包含 arm64 / x86_64；Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式的原生游戏与 pureTV SDK 检查已通过。**Intel 原生运行仍未验证**，不能据 Universal 架构推断 Intel 可玩。应用采用 ad-hoc 签名，未经过 Apple 公证；未做实体手柄或用户设备测试。

下载包沿用源提交 `ed27d8e4cd5f`、原流程 [44605769518](https://github.com/ecojust/pureTV/actions/runs/44605769518) 的已核验字节，未重新打包。Intel 原失败及有限覆盖说明见[验证记录](../../docs/racing-nine/native-readiness/ci-44605769518-attempt-1/README.md)。

保留 35 条赛道（25 Race、5 Platform、5 Training）、奖牌、检查点重生、个人纪录、ghost、回放、赛道编辑器、自制赛道和分享码。离线包包含原 Three.js 与 Baloo 2 字体。基础计时赛、编辑器和本地存档不需要互联网。

| 按键 | 驾驶 | 菜单 / 编辑器 |
| --- | --- | --- |
| ↑ / A | 油门 | 方向移动焦点；A 选择或编辑文字 |
| ↓ / B | 制动 | B 返回 |
| ← / → | 转向 | 移动焦点；调节滑块/选择项 |
| X | 回到检查点 | 上一个控件；编辑网格中旋转 |
| Y | 切换镜头 | 下一个控件；编辑器切换网格/控件 |
| START | 暂停 / 明确恢复 | 返回 / 帮助；编辑器操作单 |

编辑器网格模式用方向键移动格点，A 放置。START 操作单提供删除、撤销、重做、保存、试驾和上下楼层；原键鼠操作仍可用。文字输入可用手柄屏幕键盘，文件导入仍使用系统文件选择器，分享码可用屏幕键盘输入。原双人分屏保留键盘规则；此版 Wi-Fi 手柄控制一个席位，本地轮流比赛可传递手柄。

连接卡显示真实手柄客户端 ID；未提供 RSSI 的固件不伪造信号值。默认 TCP 63485，由共享原生宿主负责服务发现与端口冲突处理。断线、失焦或进入后台清除按键并暂停；重连不会自动继续，释放旧按键后重新按 START 或选择 Resume。

原版账号、在线 PeerJS 房间、金币服务与 Pro 付费服务未配置到这个离线版。Pro TAS / Pro AI 不提供购买或恢复，也不通过 localhost 开发开关解锁。免费 Quick TAS 和免费 AI Lab 保留；没有把未验证的在线/付费功能描述为已支持。

```bash
npm ci --ignore-scripts
npm test
npm run build
npm run build:check
python3 -m http.server 8080 --directory dist
# 打开 http://127.0.0.1:8080/tv.html
```

`src/` 是可维护源码，`dist/` 为确切离线运行资产。`upstream.json` 保存原始 198 文件的固定提交/Git blob匹配与 SHA256；`docs/build-inputs.json` 保存编译输入和输出哈希。上游 MIT 版权行原为 “Spear-Mace PVP Contributors”，已原样保留；Three.js 为 MIT，Baloo 2 为 OFL 1.1，见 NOTICE 和 dist/THIRD-PARTY-NOTICES.txt。

Android、macOS、Windows 安装包及各自验证范围见上方。需要 WebGL2 与现代系统 WebView，不承诺 Android 4.4/6 的旧 WebView 可用。实体电视、手机/ESP32 手柄及各平台原生验证状态见本目录证据，不把 Linux SwiftShader 当作设备性能。
