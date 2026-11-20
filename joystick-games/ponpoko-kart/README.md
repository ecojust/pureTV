# ぽんぽこカート · Ponpoko Kart

日本乡村、樱花鸟居、夏祭花火三条原版赛道；八位动物车手、三档难度、道具、蓄力漂移、跳跃特技和和伞滑翔。保留 [たぬ的原作](https://github.com/tanuu5/ponpoko-kart/tree/88edb72d25c2f957431cc4d12547d3138d1bca48) 的完整程序生成场景、原 HUD 与日文菜单，不依赖在线模型、图片、音频或字体。

## Android TV 适配

0.1.1（versionCode 2）根据 WebGL 2 设备支持的颜色缓冲和多重采样格式选择渲染路径。支持 HDR 的设备保留泛光效果；其余设备以 RGBA8 绘制赛道、角色和水面倒影。八位车手的头像和九张道具图使用原版模型预先渲染，进入菜单时只需创建游戏画布。Android TV 安装包正在验证中。

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

## 验证范围

需要支持 **WebGL 2** 的宿主 WebView / 系统浏览器；不宣称 Android 4.4 或未测试的旧电视能运行。当前目录中的浏览器报告独立标注合成桥接输入，不等于原始 SDK TCP、实体手机/电视或安装包验收。`window.JoystickGameQA.snapshot()` 只读已有游戏状态与缓存手柄帧，不修改模型，也不额外消费原生快照。

上游未提供自动化单元测试套件。本适配的测试覆盖九键独立、跨菜单输入隔离、断线/重连、键盘取消与原有漂移奖励函数的取消边界。正式 Android、macOS、Windows 包及其签名、启动、原生 SDK 和显示验证由仓库的对应构建流程另行记录；源码构建通过不代表这些平台已验收。

[浏览器验证记录](docs/browser-validation.json)保留了前两次超时及第三次完整验证：正常菜单进入比赛、两种分辨率实际驾驶、暂停冻结、漂移中断线和手动恢复。[逐图检查](docs/visual-review.json)与[缩略图来源](docs/thumb-source.json)记录实际截图及散列。

授权见 [LICENSE](LICENSE) 与 [NOTICE.md](NOTICE.md)。原作 MIT；Three.js MIT；三组字体 SIL OFL 1.1。
