# 霓虹飞车 · macOS

独立 Mac 客户端，复用霓虹飞车 0.1.1 的三条赛道、六车竞速和漂移／氮气玩法。需要 macOS 11 或更新版本及支持 WebGL 的图形环境；通用安装包包含 Apple 芯片和 Intel 代码，不需要 Android 模拟器、ADB 或另装 Python。

## 下载与安装

- **[下载 DMG（881 KB）](https://raw.githubusercontent.com/ecojust/pureTV/master/resource/apps/neon-rush/macos/NeonRush-0.1.1-macos-universal.dmg)**：打开后将 `Neon Rush.app` 拖入 Applications。
- [下载 ZIP（551 KB）](https://raw.githubusercontent.com/ecojust/pureTV/master/resource/apps/neon-rush/macos/NeonRush-0.1.1-macos-universal.zip)：解压后将应用移入“应用程序”。
- [SHA256 校验清单](SHA256SUMS.txt) · [构建与验证记录](docs/verification-0.1.1/README.md)

首次打开时，允许 Neon Rush 访问本地网络，以便 pureTV 手柄发现并连接游戏。若曾拒绝，可在系统设置的“隐私与安全性 → 本地网络”中重新允许。安装包直接随仓库存放。

## 连接pureTV手柄

让Mac与手柄处在同一局域网，打开游戏并保持窗口在前台，按手柄GPIO23搜索键。当前固件仅在发现恰好一个 `_puretv._tcp` 服务时自动连接；同网同时运行多个游戏服务时，请先关闭其他接收服务。界面显示实际IPv4地址、端口和发现状态；手动配网也可填写该地址。

- START开始、暂停或继续；LEFT／RIGHT转向，DOWN刹车。
- A／X按住漂移，配合转向，正常松开获得小喷；B／Y使用氮气。
- UP参与九键协议；本作自动加油，无需持续按住。
- 断线、隐藏、最小化或切到其他应用时清除输入并暂停，撤销发现服务；回到游戏后重新连接并按START继续。

键盘也可操作：方向键转向／刹车，Shift或空格漂移，B或Ctrl氮气，Enter开始，P暂停，R重开；Control-Command-F切换全屏。语言和最佳积分保存在Mac本机。

原版虚拟手柄可用于联调（开发电脑需要Python3）：

```sh
python3 puretv-joystick/bridge.py Mac的局域网IP --port 游戏显示的端口
```

浏览器打开 `http://127.0.0.1:8767/`，点“连接游戏”。游戏本身不需要该桥接程序或浏览器。完整协议见[手柄规范](../../../../puretv-joystick/README.md)和[根目录兼容要求](../../../../README.md#游戏客户端开发兼容手柄的要求)。

## 构建

Mac安装Xcode命令行工具后，在仓库根目录执行：

```sh
python3 resource/apps/neon-rush/macos/build.py --output /tmp/neon-rush-macos-build
```

输出通用 `.app`、ZIP、DMG、SHA256清单和准确构建输入记录。构建输出需位于仓库外；最终经验证的ZIP／DMG才放入本目录。游戏资源、Three.js及字体均随应用提供，保留原许可；网页只从应用内的环回HTTP服务加载。

应用使用ad-hoc签名，未做Apple公证；首次打开可能需要在“系统设置→隐私与安全性”选择“仍要打开”。这与pureTV管理器既有Mac包的签名方式一致。

## 验证

```sh
node --test resource/apps/neon-rush/macos/tests/web-bridge.test.mjs
xcrun swiftc -swift-version 5 resource/apps/neon-rush/macos/Sources/ControllerServer.swift resource/apps/neon-rush/macos/tests/ControllerServerTests.swift -o /tmp/neon-controller-tests
/tmp/neon-controller-tests
```

原生验收由 `tests/verify-native.py` 驱动实际AppKit／WKWebView应用，使用原Python SDK与原虚拟手柄页面发送普通按键，通过只读诊断快照检查游戏；不写入游戏状态或修改时钟。[最终工作流 43709816079](https://github.com/ecojust/pureTV/actions/runs/43709816079) 已验证同一份通用包：

- Apple 芯片原生与 Rosetta 下的 Intel 程序各通过 9 组验收，包括真实游戏驾驶和原版虚拟手柄网页。
- 原生 Intel 云端运行机缺少 WebGL，通过安装包及 6 组通信／生命周期检查，未在该机验证 3D 驾驶。
- 两个平台各通过 20 项协议测试，网页桥接通过 13 项测试。

最低部署版本为 macOS 11，实际 CI 使用较新系统；未实测 macOS 11、实体 Intel 显卡或 ESP32 实物手柄。详细范围与原始记录见[验证说明](docs/verification-0.1.1/README.md)。
