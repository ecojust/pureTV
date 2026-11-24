# Sugarplum Drop · pureTV

[Android TV 0.1.2 · APK](sugarplum-drop-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/sugarplum-drop-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/sugarplum-drop-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

0.1.0 版原始安装包与校验记录：[Android TV APK](sugarplum-drop-0.1.0.apk) · [macOS 通用 DMG](SugarplumDrop-0.1.0-macos-universal.dmg) · [macOS 通用 ZIP](SugarplumDrop-0.1.0-macos-universal.zip) · [Windows x64 安装 EXE](SugarplumDrop-0.1.0-windows-x64-setup.exe) · [Windows x64 便携 ZIP](SugarplumDrop-0.1.0-windows-x64.zip)。[SHA256 校验](SHA256SUMS.txt)。

Android 需要 Android 8.0（API 26）及以上和可用的 WebView；游戏使用 Canvas 2D。macOS 需要 11.0 及以上，单包支持 Apple Silicon 与 Intel。Mac 包采用 ad-hoc 签名，未经过 Apple 公证；首次启动按系统安全提示允许打开，手柄联网时允许本地网络访问。

Windows 需要 Windows 10 1903／Windows 11 x64 和 [Microsoft Edge WebView2 Runtime](https://developer.microsoft.com/microsoft-edge/webview2/)。安装版按当前用户安装；便携版完整解压后运行 `PureTVGame.exe`，保留旁边的 `Web` 目录。Windows 包未做 Authenticode 签名，游戏素材均离线打包。

左右瞄准，A 投下糖果；相同糖果碰撞会合成更高级糖果。保留11级糖果、连锁、圆盘碰撞物理、红线溢出判定及本地存档。

改编自 [Andrew Wooldridge / triptych 的 game-078](https://github.com/triptych/web-games-andrew/tree/a7051c34fe2e7550fd206e6272f758df171855b0/game-078)，固定上游提交 `a7051c34fe2e7550fd206e6272f758df171855b0`，MIT 许可。原始规则、Canvas 2D 渲染及程序音效保留；此目录不是原创 pureTV 游戏。

方向左右：移动投放位置；A：投放；Y：暂停/菜单返回。 START 开始、暂停、明确继续；菜单上下选择、A 确认，设置左右调整。断线、失焦、取消输入清除所有按键并暂停真实模拟；重连不会继续游戏。九键保持独立，最低在线座位控制单人游戏。侧栏显示桥接协议提供的真实客户端ID，只有源提供有效信号时才显示信号。

`src/` 是编辑入口，`dist/tv.html` 是 Android TV、macOS 与 Windows 共用的离线负载。无CDN、远程图片、网络字体或音频；系统字体代替Google字体，音效与音乐由原WebAudio代码生成。可选系统语音只允许已安装的本地语音。程序图形保持原作风格，当前安装包的启动图标取自糖果棋盘的游玩画面。

```sh
npm ci
npm test
npm run build
npm run build:check
```

精确锁定 esbuild 0.28.2；完整原MIT见 [LICENSE](LICENSE)，来源与修改范围见 [NOTICE.md](NOTICE.md)，上游逐文件Git blob校验见 `docs/upstream-source.json`。上游模型测试位于 `src/dev/simtest.mjs`，原始执行输出留在 `docs/upstream-simtest.log`。

`window.JoystickGameQA.snapshot()`只读返回实际菜单阶段、RAF计数、冻结的模型时间、模型动作计数和当帧控制器缓存；没有写状态、快进或自动获胜接口。`qa-plan.json`使用普通按键驱动真实玩法，并声明暂停期间必须稳定的模型字段。`docs/browser-attempt-*/`保留串行浏览器输入、960×540/1280×720截图、布局尺寸与原始失败。

0.1.0 的固定证书 APK 与经原生验收的 Mac DMG/ZIP 已入库。Android 的正常端口、63485 被占用两种运行检查，以及 Mac 的 Intel、Apple Silicon、Rosetta、占端口回退和非空存档重启恢复均通过；两平台使用同一份已验 `dist/`。原始证据和精确来源见 [交付验证](docs/native-delivery/README.md)、[Android 清单](android-release.json) 与 [Mac 清单](macos-release.json)。

0.1.0 的 Windows 安装版和便携版经过真实 Windows CI 核验：正常端口及占端口回退各 10 项检查通过，覆盖原 SDK、真实玩法、断线／失焦取消、窗口尺寸与清理浏览器缓存后的原生存档恢复；安装、卸载保留无关文件和重新安装均已验证。见 [Windows 清单](windows-release.json) 与 [原包复验](docs/windows-delivery/README.md)。这款既有游戏用于验证 Windows 宿主，不计入九款新赛车。

默认手柄 Socket 服务端口为 **63485**，仅该端口确实被占用时才回退并广播实际端口。`physicalTvTested:false`、`physicalPhoneTested:false`、`physicalEsp32Tested:false`；CI 原SDK与原生应用验证不等同实体电视/手柄实测，也未声明完整通关。
