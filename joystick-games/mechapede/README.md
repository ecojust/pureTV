# Mechapede · 机甲蜈蚣

在机器底部移动切割器，将沿齿轮下降的履带切开。持续发射会在上一发脉冲消失后再次射击。击中链头、链身、机架与齿轮的收益各不相同。穿越画面边界的传送带、活塞和失控飞轮会改变避让路线。

## 下载

[Android TV APK](mechapede-0.1.0.apk?raw=1) · [Windows x64 安装版](windows/Mechapede-0.1.0-windows-x64-setup.exe?raw=1) · [Windows x64 便携版](windows/Mechapede-0.1.0-windows-x64.zip?raw=1) · [macOS 通用 DMG](macos/Mechapede-0.1.0-macos-universal.dmg?raw=1) · [macOS 通用 ZIP](macos/Mechapede-0.1.0-macos-universal.zip?raw=1)

[文件校验值](SHA256SUMS.txt) · [Android TV 验证](docs/releases/0.1.0/android.json) · [Windows 验证](docs/releases/0.1.0/windows.json) · [macOS 验证](docs/releases/0.1.0/macos.json)

Android TV 模拟器使用 `-gpu lavapipe` 启动时，默认端口和端口占用两种场景均通过手柄实玩测试。早期使用 `-gpu swiftshader_indirect` 的模拟器曾与 ADB 断开连接。[逐次结果](docs/releases/0.1.0/android.json)

## 操作

| 操作 | 手柄 | 电脑键盘 |
| --- | --- | --- |
| 启动、暂停、继续 | START | P |
| 移动切割器 | 方向键或左摇杆 | 方向键、WASD |
| 持续发射 | 按住 A | 按住 Z 或空格 |
| 暂停 | B | X |
| 静音 | X | C |
| 选择与调整菜单 | 上下选择、左右调整、A 确认 | 方向键与 Z |

可直接用手柄或键盘开始。鼠标玩家也可选择原作的轨迹球模式。最高分、音量、灵敏度及轨迹球偏好保存在本机。手柄掉线或窗口失焦时暂停，重新连接后按 START 继续。原作的固定步长碰撞、履带运动、机械背景和程序声音均在本地运行。

Android TV、macOS 与 Windows 共用 [离线游戏](dist/tv.html)。手机和 Wi-Fi 手柄通过安装版连接面板加入。电脑支持键盘或浏览器识别的标准手柄。[连接指南](../../docs/guide/game-controls.md)

原作者为 David Bachman，程序与原图按 MIT 许可分发。移植接入宿主手柄、暂停和离线资源加载。[上游源码](https://github.com/davbachman/Mechapede/tree/b29536289e3fc6010f7cd0acef817c2101033bcf) · [授权与改动](NOTICE.md) · [逐文件来源](upstream.json)

~~~sh
npm ci
npm test
npm run build
npm run build:check
npx playwright install chromium
npm run test:browser
~~~

可用 CHROME_BIN 指定已安装的 Chromium。上游规则测试覆盖齿轮、飞轮、履带、轨迹球与生命状态。浏览器回归通过普通输入移动切割器、发射、暂停和恢复。只读 JoystickGameQA.snapshot() 返回切割器实际坐标、已发射次数、分数、剩余生命、模拟帧和当帧手柄状态。[输入脚本](tests/browser.mjs) · [原生平台测试步骤](qa-plan.json) · [游玩画面](thumb.png)
