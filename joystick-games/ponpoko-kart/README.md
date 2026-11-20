# ぽんぽこカート · Ponpoko Kart

[下载当前 Android TV 手柄版 0.1.6](https://github.com/ecojust/pureTV/releases/download/catalog-tv-controls-v1.0.0/ponpoko-kart-0.1.6.apk) · [用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

日本乡村、樱花鸟居、夏祭花火三条原版赛道；八位动物车手、三档难度、道具、蓄力漂移、跳跃特技和和伞滑翔。保留 [たぬ的原作](https://github.com/tanuu5/ponpoko-kart/tree/88edb72d25c2f957431cc4d12547d3138d1bca48) 的完整程序生成场景、原 HUD 与日文菜单，不依赖在线模型、图片、音频或字体。

## Android TV 下载

[下载 Ponpoko Kart 0.1.5 签名 APK](ponpoko-kart-0.1.5.apk) · [SHA256 校验](SHA256SUMS.txt) · [原生验证及驾驶画面](docs/android-delivery/README.md)

最低 Android 8.0（API 26），需要支持 WebGL 2 的系统 WebView。安装后连接 pureTV 手柄，用 START 进入选人，A 确认，↑ 加速。Android TV 14 / 720p 模拟器已完成两种端口的原 SDK 驾驶、暂停、焦点切换和重连。默认端口 63485 和占用回退端口 38447 各通过 49 项，分别收到了 922 和 841 个匹配的原始 SDK 回复。

默认端口加速截图可见赛车、赛道和 45 km/h。回退端口的早期加速截图只有 HUD，后续比赛截图已绘出赛车和村落。[默认端口驾驶](docs/android-delivery/normal-driving.png) · [回退端口比赛](docs/android-delivery/occupied-playing.png) · [回退端口早期截图](docs/android-delivery/occupied-hud-checkpoint.png)

此前的 0.1.4 和 0.1.3 各在默认端口通过 49 项。0.1.3 的目标 SDK 为 29，部分系统会提示旧版本警告。[0.1.4 历史测试包](https://github.com/ecojust/pureTV/releases/download/joystick-racing-nine-test-20261120/ponpoko-kart-0.1.4.apk) · [0.1.3 原包](https://raw.githubusercontent.com/ecojust/pureTV/dbb43456edd22d2b5f349c43b1f9852ef330dd02/packages/ponpoko-kart/ponpoko-kart-0.1.3.apk)

## Android TV 适配

0.1.5（versionCode 6）在软件 GPU 上暂停时保留赛道画面，继续逐帧读取手柄；窗口尺寸变化或 WebGL 上下文恢复时重绘。恢复比赛仍需重新按下 START。Mesa 软件渲染的浏览器测试中，暂停后 0.49 秒内读取了 9 次手柄，原赛道背景的 21,600 个像素均保持一致。调整窗口后重绘一帧，断线重连后仍需主动恢复。Android 最低 API 26，目标 API 35。[暂停与恢复的原始读数和截图清单](docs/browser-0.1.5-software-pause/verification.json) · [恢复驾驶原图](docs/browser-0.1.5-software-pause/resumed.png)

0.1.4（versionCode 5）面向 Android API 35 构建，最低仍为 API 26。0.1.2（target 29）在 API 34 / 720p 的这次复验中，Google Play Protect 的旧目标版本警告阻止了两个模式的首次安装。安装器已经收到原包，两种场景都停在确认界面，尚未启动游戏。[旧签名包两种安装会话及原始系统画面](docs/android-0.1.2/api34.json)

0.1.4 的同一签名 APK 已在 Android TV 14 / 720p 模拟器的两种端口模式下分别通过全部 49 项。默认端口收到 1,078 个匹配回复，完成加速、转向、暂停、手动继续和断线重连。原生驾驶截图显示首圈第 7 名、42 km/h。首次占用回退测试通过 6 项后，在选赛道的松键观察阶段超时。独立复验使用同一 APK 和观察器，在回退端口 37001 收到 1,065 个匹配回复。[默认端口驾驶原图](docs/android-0.1.4/default-driving.png) · [原始测试和占用回退复验](docs/android-0.1.4/api34.json)

0.1.4 的分发资源在关闭可选浮点缓冲的 Chromium 软件渲染器上完成了选人、选赛道、倒数和实际驾驶。游戏读数确认低画质水面和 512 × 512 动态阴影已生效。原始截图显示首圈第 7 名、42 km/h、对手和已连接的手柄。[驾驶截图](docs/browser-0.1.4-software/driving.png) · [按键输入、速度、帧数和范围](docs/browser-0.1.4-software/report.json)

0.1.3（versionCode 4）在 WebGL 明确识别出 SwiftShader、llvmpipe 等软件渲染器时，沿用原作的低画质水面，并把赛道动态阴影调为 512 × 512。硬件 GPU 和未能识别的设备沿用原画质。对 Inaka 同一机位做实际 GPU 像素回读，软件渲染的绘制调用由 929 次降为 634 次，赛道水面、太阳直射光、车辆阴影和八名车手都保留。[画质对照、原始计时及像素值](docs/software-course-effects.json)

0.1.3 的签名 APK 已在 Android TV 14 / 720p 模拟器默认端口通过本轮全部 49 项检查。原 SDK 收到 1,048 个匹配回复；九键、驾驶、暂停和手动恢复、失焦、断线重连及拒绝第二手柄均已验证。Android 系统原图显示首圈第 7 名和 79 km/h。占用回退端口的原运行通过 6 项后，在观察选赛道后的松键状态时超时。[原生驾驶截图](docs/android-0.1.3/default-driving.png) · [两个模式、原始录像和签名收据](docs/android-0.1.3/api34.json)

0.1.2（versionCode 3）随包提供三条赛道的路面颜色和法线贴图，选定赛道后才解码。六张 PNG 的逐像素 RGBA 校验都与原作程序生成结果一致。Linux 软件渲染 Chromium 的一次冷启动测量中，第一条赛道的路面材质生成耗时 91.7 秒，直接读取两张本地贴图约 0.76 秒。这个数字只覆盖路面材质。[每条赛道的原始参数、像素校验和计时](docs/course-textures.json)

以 0.1.2 正式 Web 资源启动 Chromium，关闭可选浮点缓冲后，手柄桥输入从选人、选赛道、起跑阵列和倒数进入实际驾驶。两张赛道路面贴图均从本地分发成功读取，抓图显示首圈第 6 名和 42 km/h。[驾驶原图](docs/browser-0.1.2-rgba8/driving.png) · [逐阶段帧数、速度与资源响应](docs/browser-0.1.2-rgba8/report.json)

0.1.2 已使用发布证书签名。Android TV API 36 / 1080p 的两种端口均通过安装、连接、选人和选赛道，赛道加载期间的 WebView 观察超时。[原生运行记录与 APK 校验](docs/android-0.1.2/api36.json)

0.1.1（versionCode 2）根据 WebGL 2 设备支持的颜色缓冲和多重采样格式选择渲染路径。支持 HDR 的设备保留泛光效果；其余设备以 RGBA8 绘制赛道、角色和水面倒影。八位车手的头像和九张道具图使用原版模型预先渲染，进入菜单时只需创建游戏画布。

Android TV 0.1.1 已签名。API 36 / 1080p 模拟器的默认端口与占用回退均通过安装启动、连接、手柄 ID 显示、选人和选赛道。进入所选赛道时，两种模式的画面观察请求均超时。两份录像止于赛道选择，Android 驾驶和后续项目仍待验证。[原始运行](https://github.com/ecojust/pureTV/actions/runs/44680918757) · [逐项结果、原图及录像](docs/android-0.1.1/api36.json)

同一份 0.1.1 APK 在 Android TV API 34 / 720p 模拟器上，两种端口都进入了起跑阵列。默认端口在观察跳过开场的 A 键时超时。占用回退端口通过了倒数、加速、跳跃左转、右转及操作帮助，原 SDK 收到 540 个匹配回复；暂停步骤发出的 START 已收到 SDK 回复，末次可读帧仍处于比赛。两个模式的系统日志都记录了图形缓冲区 fence 停滞，随后 Android 终止了游戏进程。暂停及后续步骤待验。[原生驾驶数据和两种端口的原报告](docs/android-0.1.1/api34.json) · [Android 原始日志、进程时间及按键回复](docs/android-0.1.1/api34-graphics-fence.json)

在 Chromium 中关闭可选浮点扩展后，浏览器合成手柄输入完成了选人、选赛道、倒数和起跑加速。RGBA8 路径的驾驶截图显示首圈第 7 名、赛道、对手和小地图。实测环境为 480 × 270 的软件渲染浏览器。另附 HDR 与 RGBA8 渲染回读值和原生验收范围。[驾驶截图](docs/browser-0.1.1-rgba8/driving.png) · [浏览器验证记录](docs/browser-0.1.1-rgba8/report.json)

## Windows 下载

0.1.0 x64：[安装程序](PonpokoKart-0.1.0-windows-x64-setup.exe) · [便携 ZIP](PonpokoKart-0.1.0-windows-x64.zip) · [SHA256 校验](SHA256SUMS.txt)。需要 **Windows 10 1903 或更新版本、Microsoft Edge WebView2 Runtime 和 WebGL 2**；缺少 WebView2 时程序会提示前往微软页面安装。游戏资源随包离线提供，安装程序没有捆绑 WebView2 运行时，也未作 Authenticode 签名。

实际 Windows 检查已通过默认端口与占用回退两种模式各 10 项，包括原 SDK 驾驶、暂停冻结、三次后台/恢复、断线重连不自动继续、正常安装卸载，以及清空浏览器缓存后恢复 `ponpoko.prefs` 的角色/赛道/难度选择。12 张原图已逐张检查：960×540 为未连接菜单，连接与游戏画面为 1280×720；两张驾驶图分别显示 67 / 79 km/h，卡片未遮住主要 HUD 与暂停按钮。仅验证 96 DPI，未做其他缩放、实体手柄或全赛道通关测试。详见[原包、运行与逐图证据](docs/windows-delivery/README.md)。

此前 Windows bootstrap 超时原件保持，新一轮通过不等于已经证明旧失败原因；同批 Backroad / Royale 的失败也没有改成通过。

## macOS 下载

0.1.0 Universal：[DMG](macos/PonpokoKart-0.1.0-macos-universal.dmg) · [ZIP](macos/PonpokoKart-0.1.0-macos-universal.zip) · [SHA256 校验](macos/SHA256SUMS.txt) · [包来源与验证范围](packages.json)。DMG 内的应用可拖入 Applications；ZIP 解压后也可运行同一个应用。

需要 **macOS 11 或更新版本及 WebGL 2**。包包含 arm64 / x86_64；Apple Silicon 原生、默认端口占用回退及 Rosetta 三种模式的原生游戏与 pureTV SDK 检查已通过。**Intel 原生运行仍未验证**，不能据 Universal 架构推断 Intel 可玩。应用采用 ad-hoc 签名，未经过 Apple 公证；未做实体手柄或用户设备测试。

Intel 原报告保留精确的渲染初始化异常、零游戏帧及终止时 `active=false`（前台为系统 UserNotificationCenter）；前台与玩法均未验证，不把独立图形探针观察解释为已证明失败原因。同批其他游戏的失败也保留。详见[原包审计与逐款复评](docs/macos-ci-44602407034/README.md)。

pureTV 控制采用共享原生宿主：默认 TCP **63485**；如果端口被其他实例占用，显示实际回退端口。侧边卡片显示实际连接席位与 controller ID；传输协议没有提供 RSSI 时不编造信号强度。浏览器预览不提供局域网 TCP 服务，需对应的安装版。

| pureTV 按键 | 比赛 | 菜单 |
| --- | --- | --- |
| ↑ / ↓ | 加速 / 刹车与倒车 | 上 / 下 |
| ← / → | 转向 | 左 / 右 |
| A | 跳跃；按住配合转向漂移；片头跳过 | 确认 |
| B | 使用道具；配合 ↓ 向后投掷 | — |
| X | 回看 | — |
| Y | 展开操作说明 | 返回 |
| START | 暂停 / 手动继续 | 确认 |

原键盘与标准浏览器 Gamepad 操作继续有效，详见 [原版说明](src/upstream/README.md)。角色、赛道、难度选择和暂停菜单均可用方向键与确认完成，不需要鼠标锁定。九个实体键不会合并成两个动作键。

断开手柄、应用进入后台或失去焦点时中和输入并暂停。取消未释放的漂移不会获得加速，尚未消费的道具按键会清除；重新连接后需要主动继续。进入比赛或恢复时原先按住的确认/动作键必须先松开，防止误触。已获得的加速、道具、位置和计时不因取消而伪造变化。

## 构建

要求 Node.js 20+。在本目录运行：

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run build:check
```

`dist/` 为可离线打包的平铺文件；可用任意本地 HTTP 服务器预览 `tv.html`。Three.js **0.186.1** 与原始 lock 的 npm 完整性值一致，esbuild **0.28.2** 仅用于打包。原始 104 个文件的基线字节/散列在 [upstream.json](upstream.json)，适配差异在 [docs/source-changes.json](docs/source-changes.json)，字体与许可证固定来源在 [src/fonts/sources.json](src/fonts/sources.json)。字体的完整许可随发布分发文件保留。

## 源码版 0.1.6 的连接与操作

按 Enter 进入角色和赛道选择，用方向键选项、Enter 确认。↑ 给油，↓ 刹车，← / → 转向。 电脑也可以连接同一局域网的 pureTV 无线手柄，按手柄搜索键（GPIO 23）配对。Android TV 可用同一 Wi-Fi 下的手机扫描菜单连接卡中的二维码，打开虚拟手柄。比赛时连接卡缩小，断线后重新连接，再手动继续。

## 验证范围

需要支持 **WebGL 2** 的宿主 WebView / 系统浏览器；不宣称 Android 4.4 或未测试的旧电视能运行。当前目录中的浏览器报告独立标注合成桥接输入，不等于原始 SDK TCP、实体手机/电视或安装包验收。`window.JoystickGameQA.snapshot()` 只读已有游戏状态与缓存手柄帧，不修改模型，也不额外消费原生快照。

上游未提供自动化单元测试套件。本适配的测试覆盖九键独立、跨菜单输入隔离、断线/重连、键盘取消与原有漂移奖励函数的取消边界。正式 Android、macOS、Windows 包及其签名、启动、原生 SDK 和显示验证由仓库的对应构建流程另行记录；源码构建通过不代表这些平台已验收。

[浏览器验证记录](docs/browser-validation.json)保留了前两次超时及第三次完整验证：正常菜单进入比赛、两种分辨率实际驾驶、暂停冻结、漂移中断线和手动恢复。[逐图检查](docs/visual-review.json)与[缩略图来源](docs/thumb-source.json)记录实际截图及散列。

授权见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。原作 MIT；Three.js MIT；三组字体 SIL OFL 1.1。
