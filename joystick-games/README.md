# pureTV 手柄游戏

[按类型浏览当前游戏与下载](../README.md#games) · [上一批客户端版本与 SHA-256 校验值](../docs/releases/gameplay-icons-2026.11.21/clients.json) · [电视扫码和电脑游玩指南](../docs/guide/README.md#安装游戏与连接手柄)

首次安装后，游戏默认使用简体中文。[本次桌面安装包](https://github.com/ecojust/pureTV/releases/tag/games-zh-cn-2026.11.25)

各款游戏的签名 Android TV 安装包位于 `joystick-games/<游戏 ID>/`。解压源码包后即可在游戏目录中找到 APK。Backroad Rally 使用 Git LFS；如果解压出的 APK 只有一百多字节，可从[游戏详情页](backroad-rally/)下载完整文件，或在安装了 Git LFS 的克隆中运行 `git lfs pull`。

这里集中放置为 pureTV Wi-Fi 手柄适配的游戏、Android TV APK、macOS DMG 和 Windows x64 安装程序。首批两款来自 [riba2534/claude-opus-5-5-demo](https://github.com/riba2534/claude-opus-5-5-demo)，固定上游提交 `54adc1fb64155f9dd7c1c90ecae7b8185ac540b8`。

- [运输船 CF](cf-transport-ship/)：保留运输船地图、机器人队伍对战、枪械和换装，增加九键移动、瞄准与射击。
- [QQ 飞车](qq-speed/)：保留四张赛道、竞速与道具模式，以及漂移、氮气和小喷。

## 新增中文游戏

| 候选编号 | 游戏 | 玩法 |
| --- | --- | --- |
| 230 | [克劳德坦克](claude-of-tanks/) | 从车库选择车辆和地图，和电脑队友一起进行单人对局。 |
| 455 | [达拉斯飞行模拟](openaero-dfw/) | 在达拉斯－沃思堡地区自由飞行，或选择任务练习起飞和降落。 |

## 清单移植的七款游戏

| 序号 | 游戏 | 玩法 |
| --- | --- | --- |
| 25 | [爆破竞技场 · Kaboom Arena](kaboom-arena/) | 在格子竞技场里放炸弹、炸开通道，跟电脑对手或同屏玩家争夺道具。 |
| 1 | [账本保卫战 · Nerd of Duty](nerd-of-duty/) | 选择职业，在会场街区守住金色账本，抵挡一波波敌人。 |
| 48 | [梵高突击 · Gogh Strike](gogh-strike/) | 从十二位画家中选一位，与队友在小镇展开颜料枪对战。 |
| 82 | [莲池跃蛙 · Bloom Hop](bloom-hop/) | 规划跳跃顺序，在会下沉的莲叶间吃掉所有苍蝇。 |
| 89 | [机甲蜈蚣 · Mechapede](mechapede/) | 在机器底部移动切割器，用脉冲切断沿齿轮下行的履带。 |
| 97 | [Dolmuş · 伊斯坦布尔小巴](dolmus/) | 驾驶小巴沿途接客，在乘客的目的站停车并赚取车费。 |
| 64 | [Martı · 博斯普鲁斯海鸥](marti/) | 飞过博斯普鲁斯海峡，从渡轮上叼走芝麻面包，避开桥梁和船只。 |

每个游戏目录提供手柄按键表、安装包和校验值。七款均在 Android TV 模拟器和 Windows 上通过手柄实玩，包括按住方向键时断线、重连后保持暂停。七款 macOS 版均通过 Apple Silicon 原生和 Rosetta 实玩验证。Intel 测试机上，Kaboom Arena、Bloom Hop 和 Mechapede 也通过了实玩。其余四款 3D 游戏的验证范围见各自的下载说明。[三端下载入口](../README.md#games)

## 探索与场景解谜

| 游戏与安装包 | 玩法 | 手柄操作 |
| --- | --- | --- |
| [星球点灯人 · KINDLE](kindle/) | 在有极光、海岸和山丘的小行星上寻找九座灯塔。 | 上下行走，左右转向，A 跳跃或滑翔，B 点灯，X 呼唤，Y 奔跑。 |
| [静默子午线 · Silent Meridian](silent-meridian/) | 穿过四章七个场景，在「现在」与「回声」之间解开十三道谜题。 | 方向键切换焦点，A 操作，B 返回，X 切换时间，Y 打开日志。 |

两款游戏均可使用 START 开始、暂停或继续。游戏详情页提供独立安装包、原作 MIT 许可证及逐平台验证记录。

<a id="game-expansion"></a>

## 新增与更新的六款游戏

| 游戏 | 玩法 | Android TV |
| --- | --- | --- |
| [Kart Royale](kart-royale/) | 在原有 Sunset Bay 之外，新增高低落差较大的 Cape Crown 和连续转弯的 Marina Esses。 | [APK 0.1.8](kart-royale/kart-royale-0.1.8.apk?raw=1) |
| [Turbo Kart Rally](turbo-kart-rally/) | 在 Palm Cove 与七位 AI 车手竞速。 | [APK 0.1.3](turbo-kart-rally/turbo-kart-rally-0.1.3.apk?raw=1) |
| [Clawd Pop 3D](clawd-pop/) | 在随机生成的实验室中使用黑洞炮，迎战新增怪物和 Codex 主题敌人。 | [APK 0.1.3](clawd-pop/clawd-pop-0.1.3.apk?raw=1) |
| [光刃魔塔 · Saber Magic Tower](saber-magic-tower/) | 在 21 层立体迷宫中规划钥匙和属性，用连击、重斩和适时格挡迎战守卫。 | [APK 0.1.3](saber-magic-tower/saber-magic-tower-0.1.3.apk?raw=1) |
| [Operation Ironhold](operation-ironhold/) | 在三分钟内清除集装箱堆场的十名对手。 | [APK 0.1.3](operation-ironhold/operation-ironhold-0.1.3.apk?raw=1) |
| [Lumenrift · 光隙守望](lumenrift/) | 建塔、升级并守住敌人进攻的路线。 | [APK 0.1.3](lumenrift/lumenrift-0.1.3.apk?raw=1) |

[Android TV 安装与逐款手柄验收](docs/expansion/android.md) · [Windows 与 macOS 手柄输入](docs/expansion/pc/native/) · [手机扫码操作](docs/expansion/phone/)

在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，然后打开 `http://127.0.0.1:8000/joystick-games/<游戏目录>/dist/tv.html` 即可用键盘试玩。每行链接指向对应的游戏目录，内含具体键位。

电脑要使用局域网无线手柄时，可以在仓库根目录运行下列命令启动同一版本。把两处游戏 ID 和 ZIP 文件名换成表内的目录名即可切换游戏。

```sh
python3 -m pip install -r tools/pc-games/requirements.txt
python3 joystick-games/qa/controller-input/payloads.py --output .local-games lumenrift
python3 tools/pc-games/host.py --game lumenrift --apk .local-games/lumenrift.zip
```


## 安装包

从下表选择游戏平台。0.1.0 版的安装文件和原生验收记录可在各游戏详情页查看。

| 游戏 | Android TV | macOS | Windows x64 |
| --- | --- | --- | --- |
| [运输船 CF](cf-transport-ship/) | [APK 0.1.3](cf-transport-ship/cf-transport-ship-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/cf-transport-ship-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/cf-transport-ship-windows-x64-setup.exe) |
| [QQ 飞车](qq-speed/) | [APK 0.1.3](qq-speed/qq-speed-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/qq-speed-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/qq-speed-windows-x64-setup.exe) |

Android 要求 **8.0 及以上**；Mac 要求 **macOS 11 及以上**，安装包同时包含 Apple Silicon 与 Intel。两平台均需要 **WebGL2**，旧电视的系统 WebView／GPU 可能无法运行。Mac 包采用 ad-hoc 签名，尚未 Apple 公证。

电视商城中的八款手柄游戏也在本目录提供源码、APK 和操作说明：[霓虹飞车](neon-rush/) · [极品二手车](used-car-racing/) · [孤胆枪手](alien-shooter/) · [超级玛丽](super-mario/) · [赤色要塞](jackal/) · [坦克大战](tank/) · [俄罗斯方块](tetris/) · [钻石方块](jewel/)。


## 解谜与益智手柄游戏

这批有九款独立游戏。从水果连线、炼金方阵和引力弹射，到修理电器、绘制地图和探索空间站，每款都提供 Android TV、macOS 和 Windows x64 下载。目录内含实际游戏画面、当前下载与逐款 Intel Mac 实测记录。[九款解谜游戏与下载](../docs/puzzle-nine/README.md#下载安装)

## 赛车手柄版与其他候选游戏

按画面和玩法比较 31 个赛车候选后，选出 Backroad Rally、Ponpoko Kart、Night Racer、Penguintrack、Last Track、Dirt Crown、Turbo Kart Rush、Kart Rush 和 Kart Royale。九款均已提供 Android TV、macOS 通用版与 Windows x64 安装文件。[候选评分与画面对比](../docs/racing-nine/README.md)

### 九款赛车游戏下载

首次连接与开赛方式见[九款赛车手柄操作](#九款赛车手柄操作)。所有 Android APK 均沿用项目的固定发布证书，各款实测的系统版本和图形配置见游戏说明。

| 游戏 | Android TV | macOS | Windows x64 |
| --- | --- | --- | --- |
| [Backroad Rally](backroad-rally/) | [APK 0.1.9](backroad-rally/backroad-rally-0.1.9.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/backroad-rally-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/backroad-rally-windows-x64-setup.exe) |
| [Ponpoko Kart](ponpoko-kart/) | [APK 0.1.8](ponpoko-kart/ponpoko-kart-0.1.8.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/ponpoko-kart-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/ponpoko-kart-windows-x64-setup.exe) |
| [Night Racer](night-racer/) | [APK 0.1.3](night-racer/night-racer-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/night-racer-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/night-racer-windows-x64-setup.exe) |
| [Penguintrack](penguintrack/) | [APK 0.1.3](penguintrack/penguintrack-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/penguintrack-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/penguintrack-windows-x64-setup.exe) |
| [Last Track](last-track/) | [APK 0.1.3](last-track/last-track-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/last-track-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/last-track-windows-x64-setup.exe) |
| [Dirt Crown](dirt-crown/) | [APK 0.1.3](dirt-crown/dirt-crown-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/dirt-crown-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/dirt-crown-windows-x64-setup.exe) |
| [Turbo Kart Rush](turbo-kart-rush/) | [APK 0.1.4](turbo-kart-rush/turbo-kart-rush-0.1.4.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/turbo-kart-rush-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/turbo-kart-rush-windows-x64-setup.exe) |
| [Kart Rush](kart-rush/) | [APK 0.1.3](kart-rush/kart-rush-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kart-rush-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kart-rush-windows-x64-setup.exe) |
| [Kart Royale](kart-royale/) | [APK 0.1.8](kart-royale/kart-royale-0.1.8.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kart-royale-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kart-royale-windows-x64-setup.exe) |

首发验收覆盖九款游戏当时的 Android TV、macOS 与 Windows 客户端。原批次共 45 个安装文件，均已从公开地址完整下载并核对 SHA-256。[首批 45 个文件的下载校验](../docs/racing-nine/download-verification-20261120.json) · [0.1.2 三个签名测试包](../docs/racing-nine/test-download-updates-20261120.json) · [首批测试包校验](../docs/racing-nine/test-downloads-20261120.json)

首发 Android TV 安装包在模拟器上使用原版 pureTV TCP SDK 实测，各款均有默认端口和端口占用回退的游戏记录。Backroad Rally 0.1.2 在宿主 Mesa 软件图形配置上通过双端口芬兰赛段，旧版 GLES 翻译器存在画面异常。[Backroad 的适用范围](backroad-rally/docs/android-delivery/README.md) · [九款 Android TV 赛中画面总览](../docs/racing-nine/android-driving.jpg)

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

### 三款冒险与休闲游戏

| 游戏 | Android TV | macOS | Windows x64 |
| --- | --- | --- | --- |
| [Sugarplum Drop](sugarplum-drop/) | [APK 0.1.3](sugarplum-drop/sugarplum-drop-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/sugarplum-drop-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/sugarplum-drop-windows-x64-setup.exe) |
| [Emberbrood · 余烬龙裔](emberbrood/) | [APK 0.1.4](emberbrood/emberbrood-0.1.4.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/emberbrood-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/emberbrood-windows-x64-setup.exe) |
| [GLUP · 沼泽猫鱼](glup/) | [APK 0.1.3](glup/glup-0.1.3.apk?raw=1) | [DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/glup-macos.dmg) | [安装 EXE](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/glup-windows-x64-setup.exe) |

Sugarplum Drop 的 Windows 0.1.0 [安装版](sugarplum-drop/SugarplumDrop-0.1.0-windows-x64-setup.exe) 和 [便携版](sugarplum-drop/SugarplumDrop-0.1.0-windows-x64.zip)，原生运行与安装／卸载已验证；它是共享宿主样本，不计入九款赛车。

原批次的验收使用 **0.1.0** 安装包，Android 8.0+、macOS 11+；三款使用 Canvas 2D 或 DOM，不要求 WebGL2。APK 使用固定发布证书，Mac 包包含 Apple Silicon 与 Intel，采用 ad-hoc 签名，尚未 Apple 公证。两平台原 SDK 手柄输入、暂停／断线、端口占用回退，以及 Mac 原生／Rosetta 和非空存档重启均有既有运行证据；实体电视与 ESP32 尚未联调。

GLUP 的 Android 重验工作流整体被取消，但归档中两个运行模式的完整检查报告均通过；这一限制及独立复核记录保留在游戏目录中。其余未完成游戏不计入安装包数量。

原批次的 9 个安装文件已随提交 [`e37ac19`](https://github.com/ecojust/pureTV/commit/e37ac19af4762461a0ce28e43f75780c1bb16d6c) 推送到 `master`。当时发布的 **413 份公开文件**完成全文下载与逐字节、大小及 SHA256 核对，见[公开下载核验](docs/submission-2026-11-19/public-verification.json)。

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
