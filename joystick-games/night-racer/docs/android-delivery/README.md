# Night Racer Android 0.1.0 原包交付

[下载原 APK](../../night-racer-0.1.0.apk) · [校验值](../../SHA256SUMS.txt) · [平台清单](../../packages.json)

原签名 APK 为 22,465,268 字节，包名 `com.ecojust.joystick.nightracer`，版本 0.1.0 / code 1，最低 API 26（Android 8.0），需要 WebGL 2 系统 WebView。原生产源 `315f8889ea677ed6a9211bf7d66c8c78dff57f01`、流程 `44613335670` attempt 1、signed artifact `14571679832`，完整 APK 从不可变导出 `8a27f4906bd9e3c29c91500ffd593d36a1889bd1` 逐字节恢复。固定发布证书 SHA256 为 `eb31978a5bd768fe3cedf483530c51df1e901cf00da5c822d3a7e98fc492cf23`。没有重新编译、打包、签名或改游戏时钟。

本次原包复验为流程 `44618869289` attempt 1，QA 源 `f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965`，原运行导出 `c6328e03941bbc70a650f33dabcdbd7c555f15c0`。正常端口 63485 与占用回退 32849 两种模式各 58 项通过；有效原 SDK 消息分别 644、641 个，各有唯一同序号 ACK，两个模式还分别拒绝第二手柄的 10 条消息。两模式各 20 个原计划期望均独立按原快照重算，覆盖原菜单选择 Low、正常 reload、等待原倒计时结束、真实加速和双向转向、氮气、视角、复位及暂停恢复。原包默认 High 没有被测试预设替换。

[独立原包与运行核验](independent-package-runtime-verification.json) 逐一核对 200 个原生产输入、35 个实际 QA 输入、30 个 APK 资产、36 个包内容条目及当前 25 个 dist 文件，并保留原签名工具与 aapt 日志。原始 337 文件及其哈希范围固定在 [delivery-audit-manifest.json](delivery-audit-manifest.json)；该记录保留在物化前的实际状态，不因新增本文和交付准备文件而重写。最早生产运行中 reload 相关 QA 失败及中间预检记录保持原样。

[逐张目视记录](visual-review.json) 已实际查看 14 张未修改截图，逻辑视口 960×540、物理截图 1920×1080，原车/赛道、HUD、完整 ID 与可操作控件可读；底部部分键盘说明受固定手柄提示条遮挡。UI 中的 FPS 不是实体电视性能测试。

原录像长度分别为 179.391 秒和 180.258 秒：[正常模式](original-export/evidence/joystick-android-runtime-night-racer/night-racer-normal/controller-gameplay.mp4)、[端口占用模式](original-export/evidence/joystick-android-runtime-night-racer/night-racer-occupied/controller-gameplay.mp4)。它们只覆盖最初约三分钟：5 秒抽帧为菜单，170 秒正常模式仍为倒计时 2，占用模式是 0 km/h 的初始比赛。未声称逐帧看完或录下全部驾驶验收；后续加速、动作和断线依据完整原快照、wire 与另行截图。

原生产流程整体失败记录仍保留，但本 APK 的原 build 与 sign job 成功；签名上传时间窗、唯一 artifact、同源／同 attempt 的 [只读来源重算](producer-origin-recheck.json) 与原 producerVerification 完全一致，[实际重算脚本](executed-producer-origin-recheck.py) 一并保留。

本 Android 场景没有专项持久存档生命周期、完整职业、实体电视或 ESP32 手柄测试。Windows、Mac 的原清单与各自限制不变。新增交付文件和原 APK 硬链接记录见 [delivery-verification.json](delivery-verification.json) 与 [delivery-preparation.json](delivery-preparation.json)。
