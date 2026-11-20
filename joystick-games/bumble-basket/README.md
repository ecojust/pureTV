# 蜜蜂果篮 · Bumble Basket

在野餐毯上连起至少三颗相邻的水果，再让蜜蜂采摘。第一座果园要求相邻水果同类，后续果园逐步引入颜色、大小和家族。原版关卡、果酱罐、图鉴、无尽野餐、程序化 3D 场景和音效均在本地运行。[原作与许可证](NOTICE.md)

| 手柄 | 果园中的操作 |
| --- | --- |
| 十字键 | 在格子间移动选框；横纵方向可组合 |
| A | 确认第一颗水果或向连线添加一颗；选择倒数第二颗可以撤销最近一步 |
| B | 采摘已连的水果；少于三颗时取消连线 |
| X | 指向原作提示路线的起点或下一颗候选水果；仍需按 A 确认 |
| Y | 切换道具罐，A 选用；需要目标的道具再以 A 指定水果 |
| START | 开始、暂停或继续；菜单方向键选择，A 确认 |

断线或窗口失焦会取消正在选择的连线并暂停。重新连接后按一次新的 START 才继续。星级、最高分、图鉴和设置保存在本机。

使用 Node.js 执行 `npm ci`、`npm run build`、`npm run build:check` 和 `npm test`。Android TV、macOS 和 Windows 宿主使用同一份 `dist/tv.html`。浏览器验收在两个电视分辨率按真实按钮逻辑逐颗选果，核对采摘、积分、暂停和重连。[跨平台验收计划](qa-plan.json) · [浏览器执行记录](docs/browser/report.json) · [原版文件校验](upstream.json)

<!-- puzzle-downloads -->
## 安装包 0.1.2

| 平台 | 安装文件 |
| --- | --- |
| Android TV | [APK](https://github.com/ecojust/pureTV/releases/download/joystick-bumble-basket-v0.1.2/bumble-basket-0.1.2.apk) |
| macOS | [DMG](https://github.com/ecojust/pureTV/releases/download/joystick-bumble-basket-v0.1.2/BumbleBasket-0.1.2-macos-universal.dmg) · [ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-bumble-basket-v0.1.2/BumbleBasket-0.1.2-macos-universal.zip) |
| Windows x64 | [安装版 EXE](https://github.com/ecojust/pureTV/releases/download/joystick-bumble-basket-v0.1.2/BumbleBasket-0.1.2-windows-x64-setup.exe) · [便携 ZIP](https://github.com/ecojust/pureTV/releases/download/joystick-bumble-basket-v0.1.2/BumbleBasket-0.1.2-windows-x64.zip) |

Android TV 和 Windows x64 均已通过默认端口和端口占用两种手柄实玩测试。macOS 通用包为预览版，Apple Silicon 原生、Apple Silicon 端口占用以及 Rosetta 2 三种模式均已实玩通过。托管 Intel Mac 未提供可用的游戏图形加速，Intel 实体机游玩仍待验证。 macOS 包采用 ad-hoc 签名，尚未经过 Apple 公证。实体电视和 ESP32 实物手柄仍待验证。

[SHA-256 校验](SHA256SUMS.txt) · [平台验收记录](packages.json)
