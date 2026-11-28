# Android TV 验收

0.1.0 安装包大小为 570,289 字节，SHA-256 为 `a72fddf7b643ba2d1f4f5090386ce94d962902ae0bc635a44fa68acf70c60699`。独立构建与签名 APK 内的 11 项内容逐字节一致，包括 classes.dex、清单、资源、手柄页面和中文指南。[签名工作流](https://github.com/ecojust/pureTV/actions/runs/46105928279) · [逐文件校验](signed-package.json)

Android TV API 36 模拟器上的系统 WebView 版本为 143.0.7499.24。扫码手柄使用真实的 HTTP 页面和 WebSocket 加入，Wi-Fi 手柄使用 TCP 加入，两种协议客户端都通过 ADB 转发连接到电视。各自连接后，手柄从《金库大盗》向下选中了《鱼群环线》，断开后电视更新了连接状态。数据来自模拟器和协议客户端，实体电视、手机和手柄尚未实测。[原始报告](https://github.com/ecojust/pureTV/blob/build-assets/hosted-games-46105928279-1/release-staging/hosted-games/report.json)

| 游戏 | 已观察到的游戏内结果 |
| --- | --- |
| 金库大盗 | 断网时出现重试入口，恢复网络后用方向键移动光标并按确定进入作者的多人等候室，打开指南并返回原卡片。[模拟器记录](https://github.com/ecojust/pureTV/blob/build-assets/hosted-replay-46106962589-bandit/report.json) |
| 鱼群环线 | 当前签名包中，选中第一辆鱼车并按确定后，截图拍到一条蓝鱼游入管道和水花，当时计数仍为 0/5。Wi-Fi 手柄可移动光标，用 START 打开和关闭指南。较早的 `b50b268` 构建另有计数从 0/5 变为 1/5 的截图。旧脚本依赖撤销按钮亮起，放鱼瞬间该按钮仍为灰色。[当前正式包放鱼前后截图](https://github.com/ecojust/pureTV/tree/c0bf9e57b13982406aa1b5a311f70c8e809fcef5) · [Wi-Fi 手柄记录](https://github.com/ecojust/pureTV/blob/build-assets/hosted-games-46105928279-1/release-staging/hosted-games/report.json) · [较早版本的验收](https://github.com/ecojust/pureTV/actions/runs/46105512858) |
| 黑色侦探：雨夜 | 电视在启动后约 110 秒显示 NOIR CITY 标题、雨夜餐馆街景和 BEGIN。该次验收在识别按钮时超时，未验证电视上进入首章。触控 Chromium 在默认画质和作者的低分辨率模式下均已进入餐馆首章游玩。[电视截图与原始记录](https://github.com/ecojust/pureTV/tree/b45c4f156bab856aab97cdaf1a3c0e9703f5012e) · [浏览器实玩记录](../../../../joystick-games/catalog/hosted-originals.md) |
| 飞天涂色巴士 | 飞行场景、金门大桥、巴士和 HUD 在电视上绘制。已切换驾驶模式，发送转向及喷彩输入并返回列表。转向角度和喷彩效果未在电视上单独量化。[模拟器记录与截图](https://github.com/ecojust/pureTV/tree/build-assets/hosted-replay-46106962589-struggle-bus) |
| 暮海点灯人 | 当前签名包进入第一夜并显示出航选项。较早的 `b50b268` 构建实测出航、显示 DAWN、按 Y 回岸。回到中文指南后的界面采集失败。[第一夜界面记录](https://github.com/ecojust/pureTV/blob/build-assets/hosted-games-46105928279-1/release-staging/hosted-games/report.json) · [出航与回岸记录](https://github.com/ecojust/pureTV/blob/build-assets/hosted-games-46105512858-1/release-staging/hosted-games/report.json) |
| 大田都市科学高中专业探索 | 电视已绘制校园标题画面、「입장하기」参观按钮和「미니게임」小游戏按钮。该次电视验收读取韩文时超时，尚未验证电视上进入小游戏。浏览器已进入六个专业的选择页，完成首份糕点订单后营业额由 0 增至 1,500 韩元。[电视截图与原始记录](https://github.com/ecojust/pureTV/tree/8a40a6de02fdd6f04649985be895b6bd64161932) · [浏览器实玩记录](../../../../joystick-games/catalog/hosted-originals.md) |

Robolectric API 28 的三项回归还检验了手柄选游戏和确认、退到后台时关闭两个监听端口，以及作者站点外的跳转回到中文重试页。回到前台后会生成新房间令牌，并保留同一游戏页面和已打开的指南。[复现命令](../README.md#构建)
