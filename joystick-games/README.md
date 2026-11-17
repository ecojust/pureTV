# pureTV 手柄游戏

这里集中放置为 pureTV Wi-Fi 手柄适配的游戏、Android TV APK 和 macOS 桌面安装包。首批两款来自 [riba2534/claude-opus-5-5-demo](https://github.com/riba2534/claude-opus-5-5-demo)，固定上游提交 `54adc1fb64155f9dd7c1c90ecae7b8185ac540b8`。

- [运输船 CF](cf-transport-ship/)：保留运输船地图、机器人队伍对战、枪械和换装，增加九键移动、瞄准与射击。
- [QQ 飞车](qq-speed/)：保留四张赛道、竞速与道具模式，以及漂移、氮气和小喷。

## 安装包

首版 **0.1.0** 提供 Android TV APK，以及同时包含 Apple Silicon 与 Intel 的 macOS DMG／ZIP。

| 游戏 | Android TV | macOS 通用安装包 |
| --- | --- | --- |
| [运输船 CF](cf-transport-ship/) | [APK](cf-transport-ship/cf-transport-ship-0.1.0.apk) | [DMG](cf-transport-ship/macos/CFTransportShip-0.1.0-macos-universal.dmg) · [ZIP](cf-transport-ship/macos/CFTransportShip-0.1.0-macos-universal.zip) |
| [QQ 飞车](qq-speed/) | [APK](qq-speed/qq-speed-0.1.0.apk) | [DMG](qq-speed/macos/QQSpeed-0.1.0-macos-universal.dmg) · [ZIP](qq-speed/macos/QQSpeed-0.1.0-macos-universal.zip) |

Android 要求 **8.0 及以上**；Mac 要求 **macOS 11 及以上**，安装包同时包含 Apple Silicon 与 Intel。两平台均需要 **WebGL2**，旧电视的系统 WebView／GPU 可能无法运行。Mac 包采用 ad-hoc 签名，尚未 Apple 公证。

已有 20 款支持手柄的游戏仍在原目录，入口见[原游戏接入说明](../docs/controller-client-status/README.md)。

## 连接与操作

电视或 Mac 与手柄加入同一局域网，启动游戏后，按手柄 **GPIO 23 搜索键**连接。游戏通过 `_puretv._tcp` 广播，默认 TCP 端口 **63485**；发生端口占用时以游戏显示的实际端口为准，同一次连接期间不会自行更换端口。当前固件只在发现一个服务时自动连接，连接前关闭其他游戏。

两款都是单人游戏，每个游戏同时接受一只手柄连接；第二只连接会被拒绝，不会抢走操作。侧边显示手柄图标、席位和实际客户端 ID；进入游戏后继续显示。断线或窗口失焦会清除输入并暂停，重新连接后主动继续。现有固件没有上报 RSSI，界面不显示信号强度。

菜单用方向键选择、A 确认，START 开始或暂停。运输船使用 B 配合方向键精细瞄准；飞车使用 A 漂移、B 氮气／道具、X 小喷。详细组合键及键鼠操作见各游戏说明。

## 平台与源码

两款都使用本地打包的 Three.js 与程序化素材，无需下载场景。运行要求 **WebGL2**；系统版本达到安装条件，也需要 WebView／GPU 实际支持。具体来源与验证记录见各游戏目录。实体电视、手机和 ESP32 联调尚未执行。

- 各游戏 `src/` 保留上游玩法代码，`dist/tv.html` 为可复现的离线页面；不要将其他版本的素材或录像用于当前包验收。
- `shared/web/` 负责九键输入与连接显示；每帧只消费一次原生快照，诊断只读缓存。
- Android 复用现有 pureTV 原生 TCP／NSD 宿主，macOS 使用独立的共享桌面宿主；重建方法见 [Android 构建说明](shared/android/README.md) 与 [Mac 构建说明](shared/macos/README.md)。
- `qa/` 放置正常输入验收工具；`docs/` 留存原报告、来源哈希及失败记录。

上游 CF 没有声明许可证，QQ 的 `package.json` 声明 ISC，仓库没有单独 LICENSE。准确来源与第三方许可事实保留在各游戏 `NOTICE.md` 和[上游审计](docs/upstream-audit.json)，不将上游全部代码重新标为本仓库许可证。本目录为非官方适配，与游戏品牌方无隶属关系。

## 验证记录

两款正式签名 APK 在 Android TV 模拟器中完成实际安装、原 SDK 手柄输入、游戏画面、暂停、断线重连与端口占用回退，共 92 项检查、985 条真实 ACK；24 张截图逐张复核，4 段录像解码通过。详见 [Android 核验](docs/qa/android/runtime-attempt-3-review/summary.json)。

两款 Mac 原包均完成 Apple Silicon 原生运行、端口占用回退和 Rosetta 验证；安装包和测试资产逐字节绑定。Intel 托管运行机出现 WebGL 上下文丢失，仅完成协议与生命周期检查，不能据此宣称 Intel 图形运行已通过。独立复核见 [运输船 CF](docs/qa/macos-cf-run-44124342900-review.json) 与 [QQ 飞车](docs/qa/macos-qq-run-44120745068-review.json)。

浏览器还完成了 QQ 飞车的一整圈正常比赛结算；各类测试范围、原始失败记录与来源分别保存在 [QA 说明](docs/qa/README.md) 和 [构建来源](docs/source-scope.json)。这些结果不代替实体电视与 ESP32 联调。
