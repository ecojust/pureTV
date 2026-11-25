# Night Racer · 霓虹街区

[Android TV 0.1.3 · APK](night-racer-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/night-racer-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/night-racer-windows-x64-setup.exe)

历史安装包（Android 0.1.2） · [Android TV 0.1.2 · APK](night-racer-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/night-racer-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/night-racer-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

来自 [zhuqipaopao-maker/night-racer-public](https://github.com/zhuqipaopao-maker/night-racer-public) 的非官方 pureTV 手柄适配，固定上游 `3a432cd3bf059dbaaa00d700f0f83e0e5313d40b`。保留雨夜街道、山路、海岸、长安等原场景，以及竞速／计时、漂移氮气、车库改装、金币任务和本地幽灵。

下文按平台记录旧版安装包的系统要求和实测范围。画面比较与来源见[赛车评审](../../docs/racing-nine/reviews/driving/comparison.json)，浏览器实际输入与画面检查见[验证记录](docs/VERIFICATION.md)。

## Android TV 0.1.0 版交付记录

[Night Racer 0.1.0 APK](night-racer-0.1.0.apk)（22,465,268 字节）· [SHA256 校验](SHA256SUMS.txt) · [原包与运行核验](docs/android-delivery/README.md)

需要 **Android 8.0 / API 26 或更新版本，以及支持 WebGL 2 的系统 WebView**。APK 沿用固定发布证书的原签名文件，未重新打包或签名。原生模拟器正常端口与占用回退两种模式各通过 58 项检查，覆盖原菜单、实际驾驶、左右转向、氮气、视角、复位、九键、暂停恢复、断线与真实手柄 ID。测试通过原菜单选择原有 Low 画质，安装包默认 High 保持不变。

已逐张检查 14 张原截图，逻辑视口为 960×540、截图为 1920×1080。菜单底部部分键盘提示被固定手柄提示条遮住，实际九键说明与可操作按钮仍可读。原视频仅录制最初约 180 秒，涵盖菜单、倒计时和初始比赛，不作为完整驾驶录像。原首次 reload 验证失败记录保留；本次未做专项持久存档、完整职业或实体电视／ESP32 手柄测试。

## Windows 0.1.0 版交付记录

0.1.0 x64：[安装 EXE](NightRacer-0.1.0-windows-x64-setup.exe)（21,423,109 字节）· [便携 ZIP](NightRacer-0.1.0-windows-x64.zip)（21,323,745 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本／Windows 11 x64、Microsoft Edge WebView2 Runtime 和可用的 WebGL 2**；便携版请完整解压后运行 `PureTVGame.exe`。安装包未做 Authenticode 签名。

原 Windows CI 的正常端口与占用回退两种模式各通过 10 项检查，包含实际游戏、原 SDK 手柄、失焦／断线取消、存档重启与窗口检查；安装／卸载／重装及无关文件保留也通过。检查覆盖 96 DPI 下 960×540、1280×720，未做其他 DPI 缩放、实体手柄或完整通关测试。同批其他四款失败仍保留，以上结论仅针对本游戏。安装文件沿用原始字节，未重新编译，详见 [Windows 交付记录](docs/windows-delivery/) 和 [版本清单](windows-release.json)。

## 源码版 0.1.1 的连接与操作

标题页按 P 开赛。W / S 给油和刹车，A / D 转向，Shift 漂移，空格释放氮气。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 0.1.0 版交付记录

0.1.0 Universal：[DMG](macos/NightRacer-0.1.0-macos-universal.dmg) · [ZIP](macos/NightRacer-0.1.0-macos-universal.zip) · [SHA256](SHA256SUMS.txt)。要求 **macOS 11+、WebGL2**，包含 arm64 与 x86_64。Apple Silicon 原生、端口占用及 Rosetta 模式各通过9项实际检查，包括原 SDK 控制、暂停／断线取消和真实存档重启。**Intel Mac 图形运行仍未验证**；ad-hoc 签名，未经过 Apple 公证，未做实体手柄或完整通关测试。

沿用原始构建文件，未重新打包；首次测试和能力探针失败记录保留，具体范围见 [Mac 交付核验](docs/macos-delivery/verification.json)。原截图可见完整连接 ID；端口占用模式的展开卡中小图标／席位标题未绘出，完整 ID 和游戏名仍可见，赛中截图的紧凑卡正常显示。

| 手柄按键 | 驾驶 | 菜单 |
| --- | --- | --- |
| ↑／↓ | 油门／刹车 | 选择 |
| ←／→ | 左／右转向 | 选择；调节滑块 |
| A | 漂移 | 确认 |
| B | 氮气 | 返回 |
| X | 原作赛道复位 | 文字键盘完成 |
| Y | 切换原作视角 | 返回 |
| START | 暂停 | 开始／手动继续 |

默认 TCP **63485**，占用时以实际显示端口为准；连接期间保持端口稳定。连接侧卡使用原生快照中的客户端 ID，不生成信号数值。断线、失焦和进入后台取消输入并暂停；重新连接后按 START 继续。取消漂移不会触发松手加速。

安装版采用离线资源，保留原车辆、赛道和程序音乐，不连接原托管房间和全球排行榜。原 Chakra Petch 字体已本地化，中文沿用系统字体回退。车型、赛道和依赖来源及许可见 [NOTICE](NOTICE.md) 和 [上游清单](upstream.json)。

本地进度／设置与各赛道两组幽灵分别持久保存，避免多赛道回放挤入同一个原生存档字段；单段幽灵超过原生 1 MiB 上限时保留上一段并显示提示，成绩与其他进度继续保存。

```sh
npm ci
npm test
npm run build
npm run build:check
```

`dist/` 包含离线页面和原始模型／纹理，测试不会更改游戏时钟或物理规则。各平台的原包、原 SDK 运行及验证范围见上方；Android 尚未专项测试持久存档，实体电视和 ESP32 尚未测试。运行要求 WebGL2。
