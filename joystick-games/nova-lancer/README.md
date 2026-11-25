# Nova Lancer · 新星枪骑兵

这是 たぬ 制作的单人 3D 轨道射击游戏。战机会自动前进，玩家负责驾驶、瞄准和调速。第一关 Azure Coast 从海上编队飞行开始，穿过峡谷和要塞城，最后迎战机械海龙。第二关 Violet Sargasso 将战场移到太空。游戏保留原版日语界面。网页试玩直接打开作者的版本。[原版试玩](https://tanuu5.github.io/nova-lancer/) · [上游源码与 MIT 许可](https://github.com/tanuu5/nova-lancer/tree/63b63953299994baa05ac27c15c6b836fff0179b)

## 下载

[Android TV 0.1.2 · APK](nova-lancer-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/nova-lancer-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/nova-lancer-windows-x64-setup.exe)

历史安装包（Android 0.1.1） · [Android TV 0.1.1 · APK](nova-lancer-0.1.1.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/nova-lancer-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/gameplay-icons-2026.11.21/nova-lancer-windows-x64-setup.exe)

Windows 客户端需要 Microsoft Edge WebView2 Runtime。macOS 安装包包含 arm64 和 x86_64，采用临时签名，未经 Apple 公证。0.1.0 的 Apple Silicon 原生运行和 Rosetta 测试均通过实玩；Intel 测试机未能初始化 WebGL 2，原生 Intel 游戏兼容性尚未验证。

## 操作

在标题画面按 START 快速出击，或按 A 浏览原版菜单。游戏需要 WebGL 2。[电视扫码和电脑手柄连接指南](../../docs/guide/README.md#安装游戏与连接手柄)

| 动作 | pureTV 手柄 | 电脑键盘 |
| --- | --- | --- |
| 驾驶、选择菜单项 | 方向键 | 方向键或 WASD |
| 射击、确认 | A；按住蓄力，松开发射 | J 或空格；菜单可用 Enter |
| 投放智能炸弹、返回 | B | K |
| 加速、减速 | X、Y | L、I |
| 翻滚 | 按住 X，快速按两次左或右 | 快速按两次 Q 或 E |
| 快速出击、暂停及继续 | START | P |

要从剧情开始，选「ストーリー / STORY」→「はじめから / NEW GAME」。任务简报会给出十位口令，可从「ストーリー / STORY」→「パスワード / PASSWORD」恢复该关和装备。

## 0.1.0 验证记录

[Android TV 安装版实玩](docs/releases/0.1.0/android-runtime.json) · [Android TV 包签名与内容](docs/releases/0.1.0/android-package.json) · [手机扫码与重连](docs/browser/phone/README.md) · [macOS 架构与实玩结果](docs/releases/0.1.0/macos.json) · [Windows 安装和手柄测试](docs/releases/0.1.0/windows.json)

## 本地运行

在仓库根目录运行 `python3 -m http.server 8000 --bind 127.0.0.1`，在浏览器打开 `http://127.0.0.1:8000/joystick-games/nova-lancer/dist/tv.html`。重新生成离线游戏时，在本目录执行 `npm ci`、`npm run build` 和 `npm run build:check`。[来源和第三方声明](NOTICE.md)
