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


## 赛车手柄版与其他候选游戏

按画面和玩法比较 31 个赛车候选后，选出 Backroad Rally、Ponpoko Kart、Night Racer、Penguintrack、Last Track、Dirt Crown、Turbo Kart Rush、Kart Rush 和 Kart Royale。九款均已提供 Android TV、macOS 通用版与 Windows x64 安装文件。[候选评分与画面对比](../docs/racing-nine/README.md)

### 九款赛车游戏下载

首次连接与开赛方式见[九款赛车手柄操作](#九款赛车手柄操作)。所有 Android APK 均沿用项目的固定发布证书，各款实测的系统版本和图形配置见游戏说明。

| 游戏 | Android TV | macOS | Windows x64 |
| --- | --- | --- | --- |
| [Backroad Rally](backroad-rally/) | [APK 0.1.2](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-android-v0.1.2/backroad-rally-0.1.2.apk) | [DMG 预发布](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.zip) | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-windows-v0.1.0/BackroadRally-0.1.0-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-windows-v0.1.0/BackroadRally-0.1.0-windows-x64.zip) |
| [Ponpoko Kart](ponpoko-kart/) | [APK 0.1.5](https://raw.githubusercontent.com/ecojust/pureTV/3bf22a01c62439afdc7352e2f7529cc23ea575ad/joystick-games/ponpoko-kart/ponpoko-kart-0.1.5.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/ponpoko-kart/macos/PonpokoKart-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/ponpoko-kart/macos/PonpokoKart-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/ponpoko-kart/PonpokoKart-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/ponpoko-kart/PonpokoKart-0.1.0-windows-x64.zip) |
| [Night Racer](night-racer/) | [APK](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/night-racer/night-racer-0.1.0.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/night-racer/macos/NightRacer-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/night-racer/macos/NightRacer-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/night-racer/NightRacer-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/night-racer/NightRacer-0.1.0-windows-x64.zip) |
| [Penguintrack](penguintrack/) | [APK](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/penguintrack/penguintrack-0.1.0.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/penguintrack/macos/Penguintrack-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/penguintrack/macos/Penguintrack-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/penguintrack/Penguintrack-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/penguintrack/Penguintrack-0.1.0-windows-x64.zip) |
| [Last Track](last-track/) | [APK 0.1.0](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/last-track/last-track-0.1.0.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/last-track/macos/LastTrack-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/last-track/macos/LastTrack-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/last-track/LastTrack-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/last-track/LastTrack-0.1.0-windows-x64.zip) |
| [Dirt Crown](dirt-crown/) | [APK](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/dirt-crown/dirt-crown-0.1.0.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/dirt-crown/macos/DirtCrown-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/dirt-crown/macos/DirtCrown-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/dirt-crown/DirtCrown-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/dirt-crown/DirtCrown-0.1.0-windows-x64.zip) |
| [Turbo Kart Rush](turbo-kart-rush/) | [APK 0.1.1](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/turbo-kart-rush/turbo-kart-rush-0.1.1.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/turbo-kart-rush/macos/TurboKartRush-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/turbo-kart-rush/macos/TurboKartRush-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/turbo-kart-rush/windows/TurboKartRush-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/turbo-kart-rush/windows/TurboKartRush-0.1.0-windows-x64.zip) |
| [Kart Rush](kart-rush/) | [APK](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-rush/kart-rush-0.1.0.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-rush/macos/KartRush-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-rush/macos/KartRush-0.1.0-macos-universal.zip) | [EXE](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-rush/KartRush-0.1.0-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-rush/KartRush-0.1.0-windows-x64.zip) |
| [Kart Royale](kart-royale/) | [APK 0.1.4](https://raw.githubusercontent.com/ecojust/pureTV/36b91f81533f10ff5d37ec091c3701913d4a42e4/joystick-games/kart-royale/kart-royale-0.1.4.apk) | [DMG](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-royale/macos/KartRoyale-0.1.0-macos-universal.dmg) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-royale/macos/KartRoyale-0.1.0-macos-universal.zip) | [EXE 0.1.1](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-royale/windows/KartRoyale-0.1.1-windows-x64-setup.exe) · [ZIP](https://raw.githubusercontent.com/ecojust/pureTV/515250931fa4203132ab658d81567682184651de/joystick-games/kart-royale/windows/KartRoyale-0.1.1-windows-x64.zip) |

**九款均已通过 Android TV、Mac 与 Windows 的原生手柄实玩验收。** Mac 的实测架构见下方。共 45 个安装文件均已从公开地址完整下载并核对 SHA-256。[当前 45 个文件的下载校验](../docs/racing-nine/download-verification-20261120.json) · [0.1.2 三个签名测试包](../docs/racing-nine/test-download-updates-20261120.json) · [首批测试包校验](../docs/racing-nine/test-downloads-20261120.json)

Android TV 在模拟器上使用原版 pureTV TCP SDK 实测，各款均有默认端口和端口占用回退的游戏记录。Backroad Rally 0.1.2 在宿主 Mesa 软件图形配置上通过双端口芬兰赛段，旧版 GLES 翻译器存在画面异常。[Backroad 的适用范围](backroad-rally/docs/android-delivery/README.md) · [九款 Android TV 赛中画面总览](../docs/racing-nine/android-driving.jpg)

以上 Mac 赛车需要 macOS 11+ 与 WebGL2；Apple Silicon 原生、端口占用及 Rosetta 均有通过记录，**Intel 图形运行仍未验证**。Backroad Rally 的预发布 ZIP 已通过 Apple Silicon 原生存档重启复验；包采用 ad-hoc 签名，未经过 Apple 公证。Windows 需要 Windows 10 1903+ x64／Windows 11、WebView2 Runtime 和相应 WebGL 支持；未做 Authenticode 签名，原生检查覆盖 96 DPI，其他显示缩放和实体手柄未测试。各游戏目录列出原包哈希、实际测试范围和保留的失败记录。

### 九款赛车手柄操作

把电视或电脑与 pureTV 手柄接到同一局域网，一次打开一款游戏。按手柄搜索键（GPIO 23），等画面出现手柄 ID 后即可操作。比赛时用 ←/→ 转向。断线或失焦后，重新连接并手动恢复比赛。

| 游戏 | 怎样开赛 | 油门、刹车和特殊操作 | Android TV 画面 |
| --- | --- | --- | --- |
| [Backroad Rally](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/backroad-rally/README.md#L31-L39) | 选 Quick Stage 进入车库，选 Choose Stage，再选 Start，用 A 确认。 | ↑ 油门，↓ 刹车，A 手刹，B 扶正车辆（有罚时）。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/1e2d4ba2812a5d719e04493bcf5a39ee00e5baf1/evidence/joystick-android-runtime-backroad-rally/backroad-rally-normal/accelerating.png) |
| [Ponpoko Kart](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/ponpoko-kart/README.md#L55-L63) | START 选角色，A 确认后选赛道，START 开赛。A 可跳过片头。 | ↑ 加速，↓ 刹车／倒车。点 A 跳跃，按住 A 并转向漂移。B 用道具，↓＋B 向后投掷。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-normal/driving-checkpoint.png) |
| [Night Racer](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/night-racer/README.md#L27-L35) | 在标题页按 START 开赛，等倒数结束。 | ↑ 油门，↓ 刹车，A 漂移，B 氮气。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/night-racer/docs/android-delivery/original-export/evidence/joystick-android-runtime-night-racer/night-racer-normal/playing.png) |
| [Penguintrack](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/penguintrack/README.md#L29-L36) | 选 Play 按 A 进入战役，再选首条赛道按 A 起跑。 | ↑ 或 A 加速，↓ 或 B 制动。X 回检查点，Y 换镜头。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/penguintrack/docs/android-delivery/original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-normal/playing.png) |
| [Last Track](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/last-track/README.md#L25-L33) | 选 New Game 和车辆，在车库选 TO THE TRACK。选赛道后，依次用 A 确认 NEXT: SETUP、START RACE。 | ↑ 油门，↓ 刹车，B 漂移。A 射击，X 换武器，Y 氮气。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/last-track/docs/android-delivery/race-normal.png) |
| [Dirt Crown](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/dirt-crown/README.md#L27-L37) | 在标题页选 Free Race 按 A，选 Race 再按 A 开赛。 | 按住 ↑ 给油，↓ 刹车。按住 A 漂移，按住 B 用氮气。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/dirt-crown/docs/android-runtime-44608423645/original-export/evidence/joystick-android-runtime-dirt-crown/dirt-crown-normal/playing.png) |
| [Turbo Kart Rush](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/turbo-kart-rush/README.md#L33-L41) | START 选车手，A 确认后选赛道，START 开赛。 | ↑ 加速，↓ 刹车／倒车。点 A 跳跃，按住 A 漂移。B 用道具，配合刹车或回看可向后投掷。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/dee5a42698422aaf0de64c3f1c312e6a102a67c3/reports/joystick-android-report-runtime-turbo-kart-rush/turbo-kart-rush-occupied/playing.png) |
| [Kart Rush](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/kart-rush/README.md#L21-L33) | 首次按 A 进入姓名键盘，用方向键选字母、A 输入、Y 完成。按 START 开始单场比赛。 | ↑ 油门，↓ 刹车／倒车。持续转向自动漂移。A 用道具，B 反向投掷。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/kart-rush/docs/android-attempt-2/original/reports/joystick-android-report-runtime-kart-rush/kart-rush-normal/playing.png) |
| [Kart Royale](https://github.com/ecojust/pureTV/blob/624f79b3e9a439ea07ec204a564fbf6d21a7462b/joystick-games/kart-royale/README.md#L28-L36) | 在标题页选 Start 按 A，进入车手选择后选 Start race，再按 A 起跑。 | ↑ 或 A 给油，↓ 制动，B 漂移，X 用道具。 | [赛中原图](https://raw.githubusercontent.com/ecojust/pureTV/f42bad392bf2444cfe4573653805d83f2f8a6a90/evidence/joystick-android-runtime-kart-royale/kart-royale-occupied/driving-checkpoint.png) |

### 其他游戏适配进度

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
