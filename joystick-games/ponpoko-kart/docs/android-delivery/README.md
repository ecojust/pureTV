# Ponpoko Kart Android TV 0.1.5

[下载签名 APK](../../ponpoko-kart-0.1.5.apk) · [SHA256 校验](../../SHA256SUMS.txt) · [逐模式签名、截图和录像](verification.json)

原始安装包共 8,783,465 字节，版本代码 6，最低 Android API 26，目标 API 35，包名 `com.ecojust.joystick.ponpokokart`。SHA-256 为 `cd2e62444b145d9e947d7f11c0b9e593c1c9ad7b3c569456fbcda20497418d13`。

默认端口 63485 和占用回退端口 38447 各通过 49 项，分别收到了 922 和 841 个匹配的原始 SDK 回复。 两组 Android TV 14 / 720p 模拟器测试都安装了同一签名 APK 与原观察器，操作来自原 pureTV TCP SDK。覆盖九键、赛车加速与转向、暂停冻结、手工继续、失焦、拒绝第二手柄、断线重连与持续按住 START 的重连。

[原签名收据](original/signing-receipt.json) · [默认端口原报告](original/normal-report.json) · [回退端口原报告](original/occupied-report.json) · [工作流验收收据](original/runtime-verification.json)

| 端口模式 | 运行与原证据 | Android 系统驾驶截图 |
| --- | --- | --- |
| 默认 · 63485 | [运行 44691399510](https://github.com/ecojust/pureTV/actions/runs/44691399510) · [报告](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-normal/report.json) · [原始协议](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-normal/wire.jsonl) · [录像](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-normal/controller-gameplay.mp4) | [45 km/h 原图](normal-driving.png) |
| 占用回退 · 38447 | [运行 44691399510](https://github.com/ecojust/pureTV/actions/runs/44691399510) · [报告](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-occupied/report.json) · [原始协议](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-occupied/wire.jsonl) · [录像](https://github.com/ecojust/pureTV/blob/47bfd89f8a322209807a1054cc5058e1e008bc97/reports/joystick-android-report-runtime-ponpoko-kart/ponpoko-kart-occupied/controller-gameplay.mp4) | [后续 3D 赛道原图](occupied-playing.png) |

默认端口加速截图中可见赛道、对手和 45 km/h。占用回退的早期加速截图显示 80 km/h 和小地图，背景为暗色；同一进程后续截图显示赛车、村落和自动售货机，此时车速为 0 km/h。两种端口的原始模型数据都确认了加速和赛程变化。两份录像仅覆盖开场部分。[回退端口早期 HUD 原图](occupied-hud-checkpoint.png)比赛和菜单采用实际 WebGL 2 场景与原始时间。测试覆盖第一条赛道，实体电视、实体 ESP32 手柄、三条赛道完整通关以及 Android 跨进程存档恢复仍待另测。
