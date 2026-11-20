# Backroad Rally · 乡野拉力

基于 [jason-c-dev/backroad-rally](https://github.com/jason-c-dev/backroad-rally/tree/e5542f96b9a9a2912fdaa160396054e81f022f23) 的 pureTV 手柄适配。保留原作五辆车、六个地区、天气、正反赛段、幽灵车、生涯、存档和 Rapier 物理；不是重新实现或换皮。

## WebGL2 兼容性

不提供浮点颜色缓冲区扩展的设备使用 RGBA8，直接绘制原作场景。在 Chromium 中屏蔽两项扩展后，芬兰赛段的第 219 帧就绪采样可见起跑线、赛车和道路。独立 Chrome 复验在起跑后按下 W，Swift Mk1 驶出 23.4 米，驾驶截图显示 51 km/h。[起跑截图](docs/browser-rgba8-0.1.1/finland.png) · [驾驶截图](docs/browser-rgba8-0.1.1/driving.png) · [环境、脚本与日志](docs/browser-rgba8-0.1.1/README.md)

0.1.1 Android TV 模拟器在两种端口模式中各通过 77 项手柄与生命周期检查，驾驶截图均只有 HUD 和暗底。0.1.2 为使用 SwiftShader 等软件渲染器的设备调整了输出格式和绘制分辨率。[Android 原始截图与同包后处理对照](docs/android-0.1.1/README.md)

0.1.2 的 Chrome 复验保留了 SwiftShader 提供的两项浮点扩展。设备像素比为 2，逻辑窗口为 960 × 540，游戏按 50% 分辨率绘制，实际缓冲区为 480 × 270。芬兰赛段使用原作的直接渲染路径，按 W 后车辆从 x=54.00 米驶至 67.44 米，随后截图仪表盘显示 45 km/h。[驾驶截图](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/driving.png) · [原始输入、扩展与画面记录](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/driving.log) · [当次脚本](https://github.com/ecojust/pureTV/blob/18f32db4c550ca50ee864b9ff4b14998ed4146ae/drive.cjs)

0.1.2 的 Android TV 原包在 ANGLE/Vulkan 后端可见芬兰赛段的赛车、起跑门和道路。相同 APK 在 swiftshader_indirect 后端只显示 HUD，新渲染帧的 14,400 个画布样本全部透明。[Android TV 原包报告与截图](docs/android-0.1.2/README.md)

## macOS 下载

0.1.0 Universal 预发布：[DMG](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-backroad-rally-v0.1.0/BackroadRally-0.1.0-macos-universal.zip) · [SHA256](macos/SHA256SUMS.txt)。两个原包超过 GitHub 单文件 100 MiB 限制，存放在 Release；源码和记录仍在本目录。要求 **macOS 11+、WebGL2**，包含 arm64 与 x86_64，ad-hoc 签名，尚未 Apple 公证。

原包首次复验中，Apple Silicon 原生、端口占用及 Rosetta 模式各9项检查通过。后续同包复验的占用与 Rosetta 模式仍各9项通过；原生模式前8项通过，最后存档重启检查在系统通知占据前台时超时。实际观察到新本地地址及四个存档值一致，但后续断言未完成，这份失败记录保留。**Intel Mac 图形运行未验证**，未做实体手柄或完整通关测试。具体源、原报告和画面范围见 [Mac 交付核验](docs/macos-delivery/verification.json)。

## Android TV 测试下载

0.1.2 APK 支持 Android 8.0 及以上，包名为 `com.ecojust.joystick.backroadrally`，版本号为 3。公开文件与构建签名收据的 SHA-256 一致。包内 333 份网页构建文件与上面 Chrome 驾驶复验使用的文件逐份相同。Android TV API 36 模拟器显示的赛道画面取决于图形后端。[APK](https://github.com/ecojust/pureTV/releases/download/joystick-racing-nine-test-20261120/backroad-rally-0.1.2.apk) · [SHA-256](https://github.com/ecojust/pureTV/releases/download/joystick-racing-nine-test-20261120/SHA256SUMS-Backroad-0.1.2.txt) · [原签名包复核](https://github.com/ecojust/pureTV/actions/runs/44688535161/job/136128536372)

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

源码与资源核验见 `docs/source-changes.json`、`docs/asset-closure.json`。浏览器合成手柄、真实 SDK TCP、安装包和实体设备验证分别记录；macOS 原包及限定范围见上方；Android、Windows 与实体电视验收尚未完成。
