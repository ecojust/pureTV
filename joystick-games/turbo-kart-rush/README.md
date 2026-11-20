# Turbo Kart Rush

[下载当前 Android TV 手柄版 0.1.2](https://github.com/ecojust/pureTV/releases/download/catalog-tv-controls-v1.0.0/turbo-kart-rush-0.1.2.apk) · [用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

[BridgeMind 原作](https://github.com/bridge-mind/turbo-kart-rush/tree/6c0456c7642447eae29e0832e7e542fec07ec07d)的独立 pureTV 适配：八位车手、四条赛道、三档难度，保留程序生成场景、道具的全部变体、漂移加速、跳跃、原版音乐与后处理。原资源无需网络即可运行；不是 pureTV 自创游戏。

## Android TV 下载

[下载 0.1.1 签名 APK](turbo-kart-rush-0.1.1.apk)（545,968 字节）。需要 Android 8.0（API 26）或更新版本，以及支持 WebGL 2 的系统 WebView。 [SHA256 校验](SHA256SUMS.txt)

在 1920×1080 的 Android TV 16 模拟器中，默认端口和默认端口占用两种模式各通过 48 项检查。原版 pureTV SDK 完成了选车、选赛道、油门、转向、漂移键、暂停及断线重连。赛中帮助卡展开时会覆盖右下小地图的一部分。测试使用虚拟手柄，未测试实体电视或完整通关。 [赛中截图](https://github.com/ecojust/pureTV/blob/dee5a42698422aaf0de64c3f1c312e6a102a67c3/reports/joystick-android-report-runtime-turbo-kart-rush/turbo-kart-rush-occupied/playing.png) · [原始报告与录像](https://github.com/ecojust/pureTV/tree/dee5a42698422aaf0de64c3f1c312e6a102a67c3/reports/joystick-android-report-runtime-turbo-kart-rush) · [签名和核验记录](docs/android-delivery/verification.json)

同一签名 APK 也在 1280×720 的 Android TV 16 模拟器上使用 Mesa Lavapipe 通过了两种端口模式，每种 48 项检查。两场分别收到 651 和 635 个匹配的 SDK 回执。 [720p 赛中截图](https://github.com/ecojust/pureTV/blob/c861baaa826082178c792d26ef4eed987118f0b5/evidence/joystick-android-runtime-turbo-kart-rush/turbo-kart-rush-occupied/playing.png) · [720p 验证记录](docs/android-delivery/720p-verification.json)

0.1.1 的渲染器会在不支持半浮点渲染目标的 WebGL 2 设备和已识别的软件 GPU 上直接绘制赛道与赛车，跳过辉光、环境反射和阴影，并将 3D 画面限制在 960×540 以内。菜单与 HUD 保持原显示尺寸。下方 0.1.0 的下载及其验证范围按各平台列出。

在 Chromium 的 Mesa 软件 GPU 上，960×540 与 1280×720 两种布局都已用键盘选车、选赛道、起跑并加速。起跑后的原始截图分别显示 13 km/h 与 14 km/h，可见车身、其他车手、跑道与比赛 HUD。[960×540](docs/software-renderer-0.1.1/driving-960x540.png) · [1280×720](docs/software-renderer-0.1.1/driving-1280x720.png) · [逐步观测与执行脚本](docs/software-renderer-0.1.1/)

## Windows 下载

0.1.0 x64：[安装版 EXE](windows/TurboKartRush-0.1.0-windows-x64-setup.exe)（646,837 字节）· [便携 ZIP](windows/TurboKartRush-0.1.0-windows-x64.zip)（563,888 字节）· [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本、已安装 Microsoft Edge WebView2 Evergreen 和 WebGL 2**。安装包未作 Authenticode 签名。

原安装、卸载及文件完整性验证通过；默认端口和端口占用回退两种模式各通过10项原 SDK 检查，包括真实加速、转向、暂停、三次最小化恢复和断线重连。**没有验证实际游戏存档保存与恢复**：本游戏没有声明持久存档字段，原报告明确记为 `not_exercised`。未做实体手柄、其他 DPI 缩放或完整通关测试。

12张原截图已逐张核对：最小菜单为960×540，其余为1280×720、96 DPI；两张赛中图显示3 km/h，原始状态和消息记录另证实按住油门后速度、位置变化。展开的帮助卡会叠到赛中小地图面板上沿，路线仍可见；暂停时右侧连接卡会遮住背景地图，但完整 ID、圈数、计时和三个暂停按钮可读。详见 [Windows 交付核验](docs/windows-delivery/independent-verification.json) 与 [原图目视记录](docs/windows-delivery/visual-review.json)。包沿用源码 `039d210cfa4cc65f59adf0859a777f3591853a70`、原流程 [44621752383](https://github.com/ecojust/pureTV/actions/runs/44621752383) 的原始字节，未重新打包；同批其他游戏失败没有改变本游戏原成功结果。

## 源码版 0.1.2 的连接与操作

按 Enter 依次确认车手与赛道，进入倒计时。↑ 给油，↓ 刹车，← / → 转向。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## macOS 下载

0.1.0 Universal：[DMG](macos/TurboKartRush-0.1.0-macos-universal.dmg)（1,199,951 字节）· [ZIP](macos/TurboKartRush-0.1.0-macos-universal.zip)（850,314 字节）· [SHA256 校验](SHA256SUMS.txt)。DMG 内应用可拖入 Applications；ZIP 解压后提供相同应用。需要 **macOS 11 或更新版本及 WebGL 2**，包包含 arm64 / x86_64，采用 ad-hoc 签名，未经过 Apple 公证。

Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式各通过 9 项原 SDK 和实际游戏检查。**Intel Mac 图形运行仍未验证**；Intel 原失败和初始化分类结果保留，独立探针的 context-loss 不能证明游戏失败原因。本游戏没有声明持久存档字段；原测试只验证无存档状态下重启与换本地地址后的恢复一致，没有宣称实际存档保存已验。 未做实体手柄或完整通关测试。

已知界面限制：原三种模式的赛中帮助卡遮住右下小地图上部，暂停展开卡也会盖住背景地图；圈数、计时、完整手柄 ID 和三个暂停按钮仍可见。三张赛中截图均显示 0 km/h，实际驾驶依据原运行记录，不能由静态图推断。 本次 Mac 原截图为 1024×642／1024×645，浏览器的 960×540／1280×720 布局检查是另一组证据。详情见 [Mac 交付核验](docs/macos-delivery/) 与 [逐张目视记录](docs/macos-ci-44615880581-visual-review.json)。安装文件沿用源码 `6c7cb4fdb99dce236b634c842326bae6aed5f232`、原流程 [44615880581](https://github.com/ecojust/pureTV/actions/runs/44615880581) 的原始字节，未重新打包。Android 与 Windows 验证范围见各自下载说明。

| pureTV 键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 加速 / 刹车与倒车 | 上 / 下 |
| ← / → | 转向 | 左 / 右 |
| A | 跳跃 / 按住漂移 | 确认 |
| B | 使用道具；配合刹车或回看向后投掷 | — |
| X | 回看 | — |
| Y | 操作说明 | 返回 |
| START | 暂停 / 手动继续 | 确认 |

共享原生宿主默认监听 TCP **63485**，占用时显示实际回退端口。侧边卡片展示真实席位与 controller ID；无 RSSI 数据时不显示虚构信号。原键盘和标准 Gamepad 继续有效。菜单可用方向与确认操作，无需鼠标或指针锁。

断线、后台和失焦会取消动作、道具待处理输入与未释放的蓄力漂移，并暂停比赛；不奖励漂移释放。已获得的道具、加速、位置和速度不会被重置。重连不能自动继续，需重新确认。加载中断线也会在进入比赛后保持暂停。

三个平台的安装包均需要 **WebGL 2**，系统版本与验证范围见各自下载说明。

```sh
npm ci --ignore-scripts
npm run typecheck
npm test
npm run build
npm run build:check
```

`dist/tv.html` 可用本地 HTTP 服务离线预览；浏览器预览没有原生 TCP 服务器。生产包排除上游可写调试全局和开发自动驾驶入口；`window.JoystickGameQA.snapshot()` 只读取状态与缓存控制器帧。

`upstream.json` 固定原始 72 文件与提交；`docs/source-changes.json` 记录有限输入/取消改动。原 `package-lock.json` 运行依赖及工具版本保留，额外 esbuild 0.28.2 用于平铺打包。初期 npm HTTP 503 的尝试保留在 `docs/dependency-attempts.json`；网络恢复后精确依赖安装、原配置及完整源码的 TypeScript 检查均通过，见 `docs/npm-ci-attempt-3.json` 与 `docs/typecheck-exact.log`。这些源码检查与上方 macOS 原生结果分别记录，不能据此推断其他平台已通过。

[浏览器验证记录](docs/browser-validation.json)包含两种分辨率实际驾驶、暂停冻结、持续 START 恢复、回看、说明展开与漂移断线。[角色页面布局记录](docs/character-layout-validation.json)单独记录实测发现的 960×540 溢出及后续 CSS 修正；保留原八位车手、属性和确认操作。[缩略图来源](docs/thumb-source.json)记录未编辑的实际比赛截图。

许可证见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。源码 MIT，Three.js MIT；构建工具许可证单独保留。没有为适配新增商业模型或在线资源。
