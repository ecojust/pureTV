# Penguintrack Android 原包交付核验

本次原流程 [44634808045](https://github.com/ecojust/pureTV/actions/runs/44634808045) 的 `normal`、`occupied` 两种模式各 **56 项检查全部通过**。QA 源 `3cf2452db9853a3a189c47342a291f046e411b5a`，attempt 1，原导出 `111c827624d21b4149079a4d9b453d29d7d4a7b6`。未写模型、改时钟或重签游戏。

安装包来自原源 `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`、原构建/签名流程 `44606071748` attempt 1、原导出 `35fca55f5a05d38785fb531004eca9add6913f04`。APK 2,342,332 字节，SHA256 `e1f9aa255413819bda917543c2d2258dd685a8eff61f982f26a98dfcfc827827`。既有[原包独立审计](../android-original-packages-44606071748-44606074787/report.json)覆盖固定证书、442 源输入和 156 资产；本次原生 preflight 再确认 422 个生产输入不变、包和 Observer 原字节复用。当前交付核对实际本地 APK 的 Git blob、全部 162 内容条目与签名回执，并对当前 151 个直接 dist 文件逐字节核验。没有重跑签名工具，也未重新下载完整大导出。

正常端口为 63485，占用回退为 41323。原 wire 分别含 602 / 598 条被接纳 SDK 消息及同连接唯一 ACK，第二客户端的 10 条消息分别以明确 busy 响应单列。唯一新增短菜单操作 DOWN 的实际 wire 持键为 17.149778 / 15.758334 ms，随后全松并在同会话取得两个后续新鲜 Play 样本；UP 顶部归一化与驾驶长按保持原样。18 个计划步骤的原 before/after 谓词重新核对通过。

真实驾驶覆盖 First Flakes 首条赛道油门、左右转向、制动、镜头、检查点重生、暂停、正常偏好写入、明确恢复与继续驾驶。九键独立观察、第二客户端拒绝、失焦/断线取消、相同 ID 重连和旧 START 同步不恢复亦通过。虽然计划写有 storageRestartRequired，旧 c5 Android runner **没有执行存档重启场景**；只观察到自然保存偏好，不能声称退出应用后恢复通过。未完整通关、未测试实体电视或实体 ESP32。

已逐张查看 14 张原 PNG（1920×1080，原网页 CSS 960×540）；比赛雪地/赛车/小地图可见，完整 ID 换行显示在卡片内。暂停画面可能保留非零速度 HUD，模型冻结依据原连续只读快照。原版 Android 触屏 Brake 覆盖部分速度表，底部操作提示与触控区域相交；手柄 ID 与中央驾驶画面仍可读。未新增独立 1280 CSS Android 测试。

[正常模式原录像](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-normal/controller-gameplay.mp4) 与 [占用回退原录像](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-occupied/controller-gameplay.mp4) 均完整解码通过，分别约 180.005 / 180.057 秒。实际查看每段 5 / 60 / 120 / 175 秒抽帧，包含菜单、真实首赛道驾驶及暂停/ghost 控件；并未逐帧人工播放。原 screenrecord 限制 180 秒，因此 **不覆盖后段 busy、失焦、断线和重连检查**，后段由原 PNG、wire 和报告证明。录像容器帧率不作为游戏/电视性能结论。

- [交付核验与原谓词/ACK](verification.json)
- [逐图及录像抽帧观察](visual-review.json) · [完整录像解码记录](video-review/verification.json)
- [正常原报告](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-normal/report.json) · [占用回退原报告](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack-occupied/report.json)
- [原包复用 preflight](original-export/evidence/joystick-android-runtime-penguintrack/penguintrack/verified-inputs/input-verification.json)
- [前次 v1 失败](../android-runtime-44630032256/) · [DOWN 修正来源及独审](../android-down-menu-tap-attempt-1/)

`original-export/` 仅保留本次所需 52 个原导出文件，35,194,745 字节，全部逐 Git blob、SHA256 与原 manifest 验证。未复制原1008项大归档，也未改变原报告。首次媒体恢复因合法零字节 screenrecord.log 被工具拒绝，失败日志保留；第二次严格验证成功。初次原 job log 获取尚未可用的失败也保留，流程完成后另取成功原日志。Mac、Windows 元数据及已有包不变；本步骤不创建 GitHub Release、不上架市场，公开提交由主任务完成。
