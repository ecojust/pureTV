# Bloom Hop · 莲池跃蛙

青蛙沿一个方向跃向三格内的第一片莲叶，吃掉全部苍蝇，池塘就会开花。叶面光点表示还能承受几次起跳。12 个故事关卡依次引入甲虫、潜水龟、鱼赠道具和长跳，主菜单还有 Wild Ponds 模式。首关向下、下、右、上即可完成。

| 操作 | 手柄 | 电脑键盘 |
| --- | --- | --- |
| 开始、暂停、继续 | START | P |
| 跳跃、菜单移动 | 方向键或左摇杆 | 方向键 |
| 弹开甲虫、确认或长跳 | A + 方向，A 确认 | Z + 方向，Z 确认 |
| 撤销上一步 | B | X |
| 使用鱼赠道具 | X | C |
| 提示 | Y | V |

按 START 可直接开始首个未完成的故事关卡，也可在菜单选择帮助、选关或野外池塘。手柄掉线或窗口失焦时暂停，重新连接后按 START 继续。关卡进度、金色花朵和音量设置保存在本机。

Android TV、Windows 和 macOS 共用 [离线游戏](dist/tv.html)，字体、图像、音乐和音效均随包提供。手机和 Wi-Fi 手柄通过安装版连接面板加入。电脑支持键盘及浏览器识别的标准手柄。[连接指南](../../docs/guide/game-controls.md)

原作由 zeveck 开发，程序、原画和声音使用 MIT 许可，Fredoka 字体使用 SIL OFL 1.1。移植保留原作的关卡、求解器、动画和声音。[上游源码](https://github.com/zeveck/bloom-hop/tree/9642dc350515038081948a10c95394b388618c76) · [授权与改动](NOTICE.md) · [逐文件来源](upstream.json)

~~~sh
npm ci
npm test
npm run build
npm run build:check
npx playwright install chromium
npm run test:browser
~~~

系统已安装 Chromium 时可设置 CHROME_BIN。浏览器回归用普通按键移动、撤销、解首关、确认下一关、断开与恢复输入。只读 JoystickGameQA.snapshot() 返回实际青蛙位置、剩余苍蝇、回合和当帧手柄状态。[输入脚本](tests/browser.mjs) · [原生平台测试步骤](qa-plan.json) · [游玩画面](thumb.png)

## 下载

[Android TV APK](bloom-hop-0.1.0.apk?raw=1) · [Windows x64 安装版](windows/BloomHop-0.1.0-windows-x64-setup.exe?raw=1) · [Windows x64 便携版](windows/BloomHop-0.1.0-windows-x64.zip?raw=1) · [macOS 通用 DMG](macos/BloomHop-0.1.0-macos-universal.dmg?raw=1) · [macOS 通用 ZIP](macos/BloomHop-0.1.0-macos-universal.zip?raw=1)

[文件校验值](SHA256SUMS.txt) · [Android TV 验证](docs/releases/0.1.0/android.json) · [Windows 验证](docs/releases/0.1.0/windows.json) · [macOS 验证](docs/releases/0.1.0/macos.json)
