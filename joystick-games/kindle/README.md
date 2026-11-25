# 星球点灯人 · KINDLE

[Android TV 0.1.2 · APK](kindle-0.1.2.apk?raw=1) · [macOS · DMG](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kindle-macos.dmg) · [Windows x64 · 安装程序](https://github.com/ecojust/pureTV/releases/download/games-zh-cn-2026.11.25/kindle-windows-x64-setup.exe)

历史安装包（Android 0.1.1） · [Android TV APK](kindle-0.1.1.apk?raw=1) · [macOS DMG](macos/Kindle-0.1.0-macos-universal.dmg?raw=1) · [Windows x64 安装程序](windows/Kindle-0.1.0-windows-x64-setup.exe?raw=1) · [SHA-256](SHA256SUMS.txt)

在极光下环绕小行星，寻找并点亮九座灯塔。方向上下行走，左右转向，A 跳跃（长按滑翔），B 点灯，X 呼唤，Y 奔跑，START 开始或暂停。

电脑小键盘 8/2/4/6 对应方向，5 对应 START，1/3/7/9 对应 A/B/X/Y。运行 `npm ci && npm run build` 后打开 `dist/tv.html`。

[原作与固定版本](https://github.com/TonyDowney/kindle/tree/dfe9240c75e50a9e77719f361b48719f078e8f28) · [MIT 许可证](LICENSE)

### 手柄验证

在仓库根目录运行以下命令，可复查便携电脑宿主中的 TCP 手柄连接、输入和断开后的键盘接管。记录使用官方 Python SDK 和 Chromium。


```sh
python3 joystick-games/qa/controller-input/payloads.py --output .local-games kindle
python3 joystick-games/qa/controller-input/pc.py --payloads .local-games --output .local-games/results kindle
```

[电脑 SDK 验证结果](docs/controller/pc-sdk.json)

电视菜单中的二维码经 ZXing 从截图解码。第二个 Chromium 实例打开手机手柄网页，触屏方向键触发游戏输入，断开后按键释放。测试使用项目的 Java 局域网服务。

[二维码菜单截图](docs/controller/phone-menu.png) · [手机房间测试记录](docs/controller/phone-room.json)

macOS 需要 WebGL 2。Apple Silicon 原生及 Rosetta 运行验证通过，Intel Mac 测试机未完成初始化。

Android TV 0.1.1 使用适合电视的地形网格和阴影分辨率。桌面版为 0.1.0。

KINDLE 的 Android TV 0.1.1 已签名，模拟器未通过完整的原生手柄验证。 [Android TV 测试记录](docs/releases/0.1.1/android.json)
