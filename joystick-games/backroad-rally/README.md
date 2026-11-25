# Backroad Rally · 乡野拉力

[Android TV 0.1.9 · APK](backroad-rally-0.1.9.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/backroad-rally-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/backroad-rally-windows-x64-setup.exe)

历史安装包（Android 0.1.8） · [Android TV 0.1.8 · APK](backroad-rally-0.1.8.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/backroad-rally-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/backroad-rally-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

基于 [jason-c-dev/backroad-rally](https://github.com/jason-c-dev/backroad-rally/tree/e5542f96b9a9a2912fdaa160396054e81f022f23) 的 pureTV 手柄适配。保留原作五辆车、六个地区、天气、正反赛段、幽灵车、生涯、存档和 Rapier 物理；不是重新实现或换皮。

## Android TV 0.1.2 版交付记录

0.1.2 版支持 Android 8.0 及以上，需要 WebGL 2。APK 共 105,024,551 字节，使用 pureTV 发布证书签名。[下载签名 APK](backroad-rally-0.1.2.apk?raw=1) · [SHA-256](android/SHA256SUMS.txt) · [版本清单](android-release.json)

在 720p Android TV 16 模拟器上，原手柄 SDK 在默认端口和端口占用回退两次都完成芬兰快速赛的驾驶、暂停和断线重连，每种模式各通过 56 项检查并收到 552 条输入确认。四张系统截图都能看清赛车、碎石路和绿色草地。此配置的 Android 合成器报告 Mesa llvmpipe；旧版 GLES 模拟器上可能只显示 HUD。实体电视与 ESP32 手柄尚未实测。[双端口截图、录像及验收范围](docs/android-delivery/) · [其他图形配置](docs/android-0.1.2/)


## WebGL2 兼容性

不提供浮点颜色缓冲区扩展的设备使用 RGBA8，直接绘制原作场景。在 Chromium 中屏蔽两项扩展后，芬兰赛段的第 219 帧就绪采样可见起跑线、赛车和道路。独立 Chrome 复验在起跑后按下 W，Swift Mk1 驶出 23.4 米，驾驶截图显示 51 km/h。[起跑截图](docs/browser-rgba8-0.1.1/finland.png) · [驾驶截图](docs/browser-rgba8-0.1.1/driving.png) · [环境、脚本与日志](docs/browser-rgba8-0.1.1/README.md)

0.1.1 Android TV 模拟器在两种端口模式中各通过 77 项手柄与生命周期检查，驾驶截图均只有 HUD 和暗底。0.1.2 为使用 SwiftShader 等软件渲染器的设备调整了输出格式和绘制分辨率。[Android 原始截图与同包后处理对照](docs/android-0.1.1/README.md)

0.1.2 的 Chrome 复验保留了 SwiftShader 提供的两项浮点扩展。设备像素比为 2，逻辑窗口为 960 × 540，游戏按 50% 分辨率绘制，实际缓冲区为 480 × 270。芬兰赛段使用原作的直接渲染路径，按 W 后车辆从 x=54.00 米驶至 67.44 米，随后截图仪表盘显示 45 km/h。[驾驶截图](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/driving.png) · [原始输入、扩展与画面记录](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/driving.log) · [当次脚本](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/drive.cjs)

0.1.3 在旧版 GLES 软件驱动上恢复了可见像素和驾驶操作，芬兰赛段仍有大片紫色地面和黑色车身。[Android 原生驾驶截图与 RGBA 记录](docs/android-0.1.3/README.md)

## macOS 0.1.0 版交付记录

0.1.0 Universal 预发布：[DMG](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.zip) · [SHA256](macos/SHA256SUMS.txt)。两个原包超过 GitHub 单文件 100 MiB 限制，存放在 Release；源码和记录仍在本目录。要求 **macOS 11+、WebGL2**，包含 arm64 与 x86_64，ad-hoc 签名，尚未 Apple 公证。

原包首次复验中，Apple Silicon 原生、端口占用及 Rosetta 模式各9项检查通过。后续同包复验的占用与 Rosetta 模式仍各9项通过；原生模式前8项通过，最后存档重启检查在系统通知占据前台时超时。2026-11-20 在 Apple Silicon 上从 Release 下载相同 ZIP 再次验证，9 项全部通过，包括实际手柄驾驶，以及退出后从新本地地址重启并恢复原存档。[原生复验记录](https://github.com/ecojust/pureTV/actions/runs/44679547282)。**Intel Mac 图形运行未验证**，未做实体手柄或完整通关测试。具体源、原报告和画面范围见 [Mac 交付核验](docs/macos-delivery/verification.json)。

## 源码版 0.1.7 的连接与操作

方向键选择 Quick Stage，Enter 确认。赛中用方向键驾驶，空格拉手刹。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## Windows 0.1.0 版交付记录

0.1.0 支持 Windows 10 1903 及以上 x64 系统，需要 WebView2 Evergreen Runtime 与 WebGL2。原生安装、卸载、手柄驾驶及存档重启已通过验证。 [安装器](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-windows-v0.1.0/BackroadRally-0.1.0-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-windows-v0.1.0/BackroadRally-0.1.0-windows-x64.zip) · [SHA256](windows/SHA256SUMS.txt) · [原生测试记录](docs/windows-delivery/verification.json)


| 按键 | 比赛中 | 菜单中 |
| --- | --- | --- |
| 上 / 下 | 油门 / 刹车 | 选择 |
| 左 / 右 | 左转 / 右转 | 调整选项 |
| A | 手刹 | 确认 |
| B | 扶正车辆（原规则罚时） | 返回 |
| X | 切换视角 | 下一首音乐 |
| Y | 牵引力辅助开关 | 上一首音乐 |
| START | 暂停 | 确认；暂停菜单中继续 |

pureTV 原生宿主默认在 TCP **63485** 提供服务。连接后侧栏显示实际手柄 ID；固件未提供信号强度时不虚构数值。断开、失焦、进入后台会清空操作并暂停；重新连接不会自动继续。

```sh
npm ci
npm run build
npm run build:check
```

原作完整固定源码与依赖锁在 `src/upstream/`。安装版使用原作自带的 **WebGL2 后端**，保留相同 TSL 材质、模型与规则；原网站会优先尝试硬件 WebGPU。资源使用本地相对路径，原始 GLB 由安装包无损压缩，避免旧 WKWebView 缺少 `DecompressionStream`。325 份原始 public 资源均保留，不转码或删减音乐、音效和模型。

上游代码声明 MIT；README 说明美术原创，音乐/部分音效由 ElevenLabs 生成，其他音效合成。Three.js 为 MIT、Rapier 为 Apache-2.0、Inter 字体为 OFL-1.1，许可证随包保留。上游音乐仅有 Ogg Opus：不支持此格式的旧 WKWebView 没有背景音乐，音效仍可使用原有 M4A 备选。

源码与资源核验见 `docs/source-changes.json`、`docs/asset-closure.json`。浏览器合成手柄、真实 SDK TCP、安装包和实体设备验证分别记录；macOS 原包及限定范围见上方；Windows 原包及实测范围见上方。
