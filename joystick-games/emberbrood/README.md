# Emberbrood · pureTV

[Android TV 0.1.3 · APK](emberbrood-0.1.3.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/emberbrood-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/emberbrood-windows-x64-setup.exe)

[用手机扫码加入](../../docs/guide/README.md#在电视上扫码加入) · [在电脑上用键盘或无线手柄玩](../../docs/guide/README.md#在电脑上玩)

0.1.0 版原始安装包与校验记录：[Android TV APK](emberbrood-0.1.0.apk) · [macOS DMG](Emberbrood-0.1.0-macos-universal.dmg) · [macOS ZIP](Emberbrood-0.1.0-macos-universal.zip) · [SHA256](SHA256SUMS.txt)。

Android 包最低 Android 8.0（API 26），需要可正常运行现代网页的 WebView；本游戏使用 DOM/Canvas 2D，不要求 WebGL2。macOS 为 Apple Silicon / Intel 通用包，声明最低系统 11.0；使用 ad-hoc 签名，未做 Apple 公证。下载 DMG 后将 App 拖到“应用程序”；首次运行按系统提示允许本地网络，供 pureTV 手柄发现并连接。

保留原种子世界、28地点、龙种/遗传繁育、五幕剧情、捕捉、队伍回合战和任务；原DOM像素界面与Canvas精灵保持。方向键选择、A确认、B返回，X滚动长页，Y切页签。文本A编辑、方向改字/光标、X删除、Y确认。START暂停，剧情和战斗菜单均无需鼠标。

原UI/音频定时器改为游戏唯一RAF的可暂停调度器，暂停、失焦、断线同时停止计时，取消输入后重连不会继续。游戏快照只读实际状态；每RAF仅一次消费pureTV输入。侧栏显示真实ID，默认TCP63485。原四个存档键登记供macOS跨HTTP端口保存。

原作 Andrew Wooldridge / triptych `web-games-andrew/game-038`，固定commit `a7051c34fe2e7550fd206e6272f758df171855b0`，MIT。原规则/生成/数据模块字节一致，31项原回归通过（docs/upstream-simtest.log、source-model-integrity.json）。无需Three或网络资源。

运行 `npm ci && npm test && npm run build && npm run build:check`。浏览器测试正常按键进入剧情、实际地图旅行与遭遇战；使用禁GPU Chromium验证原DOM/2D，不冒称3D或电视实机。各次失败/截图/报告保留于docs/browser-attempt-*；当前固定证书 Android APK 与 macOS 通用安装包已完成原生验收并归档，实体设备未验。

当前dist已通过960×540/1280×720完整输入及画面复验。短屏战斗卡紧凑排列，命令重建后焦点保持在战斗区；实际方向导航证明敌方名称与选中命令可完整读取，长内容仍按焦点滚动。旧裁切截图与修正依据均保留，汇总docs/verification.json；Android 普通/端口占用两场景各 53 项通过；macOS 的 Intel、Apple Silicon、Rosetta、端口占用四场景各 9 项通过，均实际验证非空存档跨服务端口重启恢复。原 Android 批次因另一款 GLUP 的旧测试路线失败，本款两场景均通过。完整来源与限制见 [安装包验证说明](docs/native-delivery/README.md)。实体电视、手机和 ESP32 手柄未测，也没有完成全游戏通关。
