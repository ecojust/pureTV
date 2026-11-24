# Chromium 离线实玩记录

四次测试均从发行页 `dist/tv.html` 进入。方向键切换画家，进入设置并返回后，START 开始六对六比赛。表中位移为暂停时角色位置与初始出生点的水平距离，发射次数直接读取原作成功发射颜料的计数。

| 输入 | 送入游戏的输入 | 窗口 | 位移（游戏单位） | 发射次数 | 画面与状态 |
| --- | --- | --- | ---: | ---: | --- |
| 键盘 | Chromium 键盘事件 | 960×540 | 1.26 | 1 | [大厅](960-keyboard-lobby.jpg) · [对局](960-keyboard-match.jpg) · [状态](960-keyboard.json) |
| 无线手柄 | pureTV Wi-Fi 宿主快照 | 1280×720 | 1.69 | 2 | [大厅](1280-wifi-lobby.jpg) · [对局](1280-wifi-match.jpg) · [状态](1280-wifi.json) |
| 手机手柄 | pureTV 手机宿主快照 | 960×540 | 1.26 | 2 | [大厅](960-phone-lobby.jpg) · [对局](960-phone-match.jpg) · [状态](960-phone.json) |
| 标准手柄 | 标准 Gamepad API 输入 | 960×540 | 5.63 | 2 | [大厅](960-gamepad-lobby.jpg) · [对局](960-gamepad-match.jpg) · [状态](960-gamepad.json) |

四次运行均观测到十二位画家、转身、垂直瞄准、切换副装备与暂停。标准手柄测试记录录像后继续运行到了重生，角色重新携带主装备。每步成功的日志保留了切换当时的判断条件。[逐步检查记录](input-checks.log)

三条手柄测试在发射键按下时断开，再以按住发射键的状态重连。恢复必须显式按 START，重连没有触发额外射击。所有资源通过本机 HTTP 服务器读取，未出现资源错误。

[标准手柄操作录像](paint-clash.webm) 捕获 Chromium 实际合成的游戏画面与 HUD，无音轨。共享 Linux 测试机使用 Mesa llvmpipe 软件渲染。录像保留截图之间的时间间隔，可以核对输入与游戏反应。原生设备帧率需使用对应安装包测量。

在游戏目录运行 `python3 tests/browser.py --evidence docs/browser` 可生成各输入路径的截图和收据。安装 FFmpeg 后，运行 `python3 tests/browser.py --mode gamepad --evidence docs/browser --video docs/browser/paint-clash.webm` 可重新记录标准手柄路径。浏览器手柄输入由测试夹具提供。

本次验证的游戏脚本 SHA-256 为 `3ddb752ad369cb5ff1a0c2b7e1afbbf78cb5727665c1bbfe35be8c571aa9a4e5`。
