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


## 新候选适配进度

另有正在进行的[九款赛车三平台适配](../docs/racing-nine/README.md)：从 31 个赛车候选中比较画面与玩法，选出 Backroad Rally、Ponpoko Kart、Night Racer、Penguintrack、Last Track、Dirt Crown、Turbo Kart Rush、Kart Rush 和 Kart Royale。九款源码已提交，Android TV、macOS 通用包及 Windows x64 正在实际构建和运行验证，暂不计入下面已交付的安装包数量。

赛车已有以下可下载包，均为 **0.1.0**；九款三平台完整交付仍在进行。

| 游戏 | Android TV | macOS | Windows x64 |
| --- | --- | --- | --- |
| [Backroad Rally](backroad-rally/) | 验证中 | [DMG／ZIP 预发布](backroad-rally/macos/) | 验证中 |
| [Ponpoko Kart](ponpoko-kart/) | 验证中 | [DMG](ponpoko-kart/macos/PonpokoKart-0.1.0-macos-universal.dmg) · [ZIP](ponpoko-kart/macos/PonpokoKart-0.1.0-macos-universal.zip) | [EXE](ponpoko-kart/PonpokoKart-0.1.0-windows-x64-setup.exe) · [ZIP](ponpoko-kart/PonpokoKart-0.1.0-windows-x64.zip) |
| [Night Racer](night-racer/) | [APK](night-racer/night-racer-0.1.0.apk) | [DMG](night-racer/macos/NightRacer-0.1.0-macos-universal.dmg) · [ZIP](night-racer/macos/NightRacer-0.1.0-macos-universal.zip) | [EXE](night-racer/NightRacer-0.1.0-windows-x64-setup.exe) · [ZIP](night-racer/NightRacer-0.1.0-windows-x64.zip) |
| [Penguintrack](penguintrack/) | [APK](penguintrack/penguintrack-0.1.0.apk) | [DMG](penguintrack/macos/Penguintrack-0.1.0-macos-universal.dmg) · [ZIP](penguintrack/macos/Penguintrack-0.1.0-macos-universal.zip) | [EXE](penguintrack/Penguintrack-0.1.0-windows-x64-setup.exe) · [ZIP](penguintrack/Penguintrack-0.1.0-windows-x64.zip) |
| [Last Track](last-track/) | 验证中 | [DMG](last-track/macos/LastTrack-0.1.0-macos-universal.dmg) · [ZIP](last-track/macos/LastTrack-0.1.0-macos-universal.zip) | [EXE](last-track/LastTrack-0.1.0-windows-x64-setup.exe) · [ZIP](last-track/LastTrack-0.1.0-windows-x64.zip) |
| [Dirt Crown](dirt-crown/) | [APK](dirt-crown/dirt-crown-0.1.0.apk) | [DMG](dirt-crown/macos/DirtCrown-0.1.0-macos-universal.dmg) · [ZIP](dirt-crown/macos/DirtCrown-0.1.0-macos-universal.zip) | [EXE](dirt-crown/DirtCrown-0.1.0-windows-x64-setup.exe) · [ZIP](dirt-crown/DirtCrown-0.1.0-windows-x64.zip) |
| [Turbo Kart Rush](turbo-kart-rush/) | 验证中 | [DMG](turbo-kart-rush/macos/TurboKartRush-0.1.0-macos-universal.dmg) · [ZIP](turbo-kart-rush/macos/TurboKartRush-0.1.0-macos-universal.zip) | [EXE](turbo-kart-rush/windows/TurboKartRush-0.1.0-windows-x64-setup.exe) · [ZIP](turbo-kart-rush/windows/TurboKartRush-0.1.0-windows-x64.zip) |
| [Kart Rush](kart-rush/) | [APK](kart-rush/kart-rush-0.1.0.apk) | [DMG](kart-rush/macos/KartRush-0.1.0-macos-universal.dmg) · [ZIP](kart-rush/macos/KartRush-0.1.0-macos-universal.zip) | [EXE](kart-rush/KartRush-0.1.0-windows-x64-setup.exe) · [ZIP](kart-rush/KartRush-0.1.0-windows-x64.zip) |
| [Kart Royale](kart-royale/) | 验证中 | [DMG](kart-royale/macos/KartRoyale-0.1.0-macos-universal.dmg) · [ZIP](kart-royale/macos/KartRoyale-0.1.0-macos-universal.zip) | 验证中 |

目前 Kart Rush、Dirt Crown、Night Racer、Penguintrack 已具备三个平台的下载文件；共有 4 款 Android、9 款 Mac 与 7 款 Windows 赛车包，其余继续验证。

以上 Mac 赛车需要 macOS 11+ 与 WebGL2；Apple Silicon 原生、端口占用及 Rosetta 均有通过记录，**Intel 图形运行仍未验证**。Backroad Rally 后续原生存档重启检查未完成，已按预发布注明具体范围；包采用 ad-hoc 签名，未经过 Apple 公证。Windows 需要 Windows 10 1903+ x64／Windows 11、WebView2 Runtime 和相应 WebGL 支持；未做 Authenticode 签名，原生检查覆盖 96 DPI，其他显示缩放和实体手柄未测试。各游戏目录列出原包哈希、实际测试范围和保留的失败记录。

原清单的 **93 款**已完成逐项[电视适配评估](../docs/claude-games/tv-assessment.md)：51 款可继续使用现有 Web 宿主，42 款需补齐许可、素材或其他引擎运行方案。后续新增的 GitHub 参考清单与这 93 款适配范围分开记录。

已提交 **20 款**候选的适配源码，批次见[游戏注册表](catalog-registry.json)，逐款状态、来源和构建记录见[适配进度](porting-progress.json)。已完成安装包列在下方；源码已提交与双平台正式包已完成分别记录。其余适配按用户要求暂停，等待下一步指令。

环境重启后，未提交的 Dirt Crown、Hexapod Rising、Munch Maze、Wiggle Snakes 版本未能恢复，因此未计入本次交付；其他草稿及未提交修正的状态见[收尾恢复记录](docs/submission-2026-11-19/recovery.json)。

### 本次完成的安装包（3）

| 游戏 | Android TV | macOS 通用安装包 |
| --- | --- | --- |
| [Sugarplum Drop](sugarplum-drop/) | [APK](sugarplum-drop/sugarplum-drop-0.1.0.apk) | [DMG](sugarplum-drop/SugarplumDrop-0.1.0-macos-universal.dmg) · [ZIP](sugarplum-drop/SugarplumDrop-0.1.0-macos-universal.zip) |
| [Emberbrood · 余烬龙裔](emberbrood/) | [APK](emberbrood/emberbrood-0.1.0.apk) | [DMG](emberbrood/Emberbrood-0.1.0-macos-universal.dmg) · [ZIP](emberbrood/Emberbrood-0.1.0-macos-universal.zip) |
| [GLUP · 沼泽猫鱼](glup/) | [APK](glup/glup-0.1.0.apk) | [DMG](glup/Glup-0.1.0-macos-universal.dmg) · [ZIP](glup/Glup-0.1.0-macos-universal.zip) |

Sugarplum Drop 另提供 [Windows x64 安装版](sugarplum-drop/SugarplumDrop-0.1.0-windows-x64-setup.exe) 和 [便携版](sugarplum-drop/SugarplumDrop-0.1.0-windows-x64.zip)，原生运行与安装／卸载已验证；它是共享宿主样本，不计入九款赛车。

以上均为 **0.1.0**，Android 8.0+、macOS 11+；三款使用 Canvas 2D 或 DOM，不要求 WebGL2。APK 使用固定发布证书，Mac 包包含 Apple Silicon 与 Intel，采用 ad-hoc 签名，尚未 Apple 公证。两平台原 SDK 手柄输入、暂停／断线、端口占用回退，以及 Mac 原生／Rosetta 和非空存档重启均有既有运行证据；实体电视与 ESP32 尚未联调。

GLUP 的 Android 重验工作流整体被取消，但归档中两个运行模式的完整检查报告均通过；这一限制及独立复核记录保留在游戏目录中。其余未完成游戏不计入安装包数量。

这三款的 9 个安装文件已随提交 [`e37ac19`](https://github.com/ecojust/pureTV/commit/e37ac19af4762461a0ce28e43f75780c1bb16d6c) 推送到 `master`。本次变更的 **413 份公开文件**完成全文下载与逐字节、大小及 SHA256 核对，见[公开下载核验](docs/submission-2026-11-19/public-verification.json)。

## 连接与操作

电视或 Mac 与手柄加入同一局域网，启动游戏后，按手柄 **GPIO 23 搜索键**连接。游戏通过 `_puretv._tcp` 广播，默认 TCP 端口 **63485**；发生端口占用时以游戏显示的实际端口为准，同一次连接期间不会自行更换端口。当前固件只在发现一个服务时自动连接，连接前关闭其他游戏。

以上五款均为单人游戏，每个游戏同时接受一只手柄连接；第二只连接会被拒绝，不会抢走操作。侧边显示手柄图标、席位和实际客户端 ID；进入游戏后继续显示。断线或窗口失焦会清除输入并暂停，重新连接后主动继续。现有固件没有上报 RSSI，界面不显示信号强度。

菜单用方向键选择、A 确认，START 开始或暂停。运输船使用 B 配合方向键精细瞄准；飞车使用 A 漂移、B 氮气／道具、X 小喷。详细组合键及键鼠操作见各游戏说明。

## 平台与源码

运输船 CF 和 QQ 飞车使用本地打包的 Three.js 与程序化素材，无需下载场景。运行要求 **WebGL2**；系统版本达到安装条件，也需要 WebView／GPU 实际支持。具体来源与验证记录见各游戏目录。实体电视、手机和 ESP32 联调尚未执行。

- 各游戏 `src/` 保留上游玩法代码，`dist/tv.html` 为可复现的离线页面；不要将其他版本的素材或录像用于当前包验收。
- `shared/web/` 负责九键输入与连接显示；每帧只消费一次原生快照，诊断只读缓存。
- Android 复用现有 pureTV 原生 TCP／NSD 宿主，macOS 使用独立的共享桌面宿主；重建方法见 [Android 构建说明](shared/android/README.md) 与 [Mac 构建说明](shared/macos/README.md)。
- `qa/` 放置正常输入验收工具；`docs/` 留存原报告、来源哈希及失败记录。

上游 CF 没有声明许可证，QQ 的 `package.json` 声明 ISC，仓库没有单独 LICENSE。准确来源与第三方许可事实保留在各游戏 `NOTICE.md` 和[上游审计](docs/upstream-audit.json)，不将上游全部代码重新标为本仓库许可证。本目录为非官方适配，与游戏品牌方无隶属关系。

## 验证记录

首批运输船 CF、QQ 飞车的正式签名 APK 在 Android TV 模拟器中完成实际安装、原 SDK 手柄输入、游戏画面、暂停、断线重连与端口占用回退，共 92 项检查、985 条真实 ACK；24 张截图逐张复核，4 段录像解码通过。详见 [Android 核验](docs/qa/android/runtime-attempt-3-review/summary.json)。

两款 Mac 原包均完成 Apple Silicon 原生运行、端口占用回退和 Rosetta 验证；安装包和测试资产逐字节绑定。Intel 托管运行机出现 WebGL 上下文丢失，仅完成协议与生命周期检查，不能据此宣称 Intel 图形运行已通过。独立复核见 [运输船 CF](docs/qa/macos-cf-run-44124342900-review.json) 与 [QQ 飞车](docs/qa/macos-qq-run-44120745068-review.json)。

浏览器还完成了 QQ 飞车的一整圈正常比赛结算；各类测试范围、原始失败记录与来源分别保存在 [QA 说明](docs/qa/README.md) 和 [构建来源](docs/source-scope.json)。这些结果不代替实体电视与 ESP32 联调。

六个安装文件已随提交 [`97a87e3`](https://github.com/ecojust/pureTV/commit/97a87e3c2ce8afde3849a57a199bdce7410e818c) 推送到 `master`。安装包及说明等 50 份文件均通过公开完整下载和 SHA256 核对，见[下载核验记录](docs/publication-verification.json)。
