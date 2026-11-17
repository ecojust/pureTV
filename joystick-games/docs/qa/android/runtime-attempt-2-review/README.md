# Android 第二轮原始失败复核

原运行 [44115154856](https://github.com/ecojust/pureTV/actions/runs/44115154856) 的两款 normal 检查均在 `two-identities` 超时，结论保留为失败。QA 源为 `8d6475980ce2312df8839a38dd724794eb59b83b`；安装包与 Observer 复用 `d30e1ce26abbf27d07d149b708c6a491abb105b3` 的签名原件。不可变原件导出为 [`1163ce4f6f0d902b302ffd5e4730aa192ba39fe2`](https://github.com/ecojust/pureTV/tree/1163ce4f6f0d902b302ffd5e4730aa192ba39fe2)。

`MainActivity.java:251` 调用无参 `WifiControllerServer()`；原构造器固定一个席位，两款 `game.json` 也声明单人。真实第二连接均收到唯一 `{ "type": "error", "message": "controller_busy", "seq": 1 }`。QA 错误等待两个同时连接的 ID；没有证据表明产品丢失主手柄连接。

- CF 已通过前 18 项，包括实际移动、瞄准、射击/换弹进入、九键与暂停恢复；主连接 218 条消息对应 218 条真实 ACK。
- QQ 已通过前 16 项，包括加速后的转向/漂移、九键与暂停恢复；主连接 202 条消息对应 202 条真实 ACK。
- 第二连接各有 11 / 10 条实际 SDK 消息和 1 条 busy 错误，不能把错误记作 ACK。第二连接尚有旧脚本心跳时，服务器关闭会导致该连接后续消息无 ACK。
- 断开清键、同 ID 重连、held-sync 抑制、最终同 PID/端口检查与 occupied 模式均未完成，不能由这些部分通过项推算为成功。

`analysis.json` 绑定原报告、wire、PNG、视频、实际执行源码哈希和部分结果。`visual-review.json` 逐张记录全部六张原始 PNG 的目视结论，完整 ID 均可读；QQ 菜单/暂停侧栏底部的 TCP 文本触及并略被边框截断，单独列为布局限制。两段原视频完整解码；未声称逐帧观看或实体电视性能。默认 null 输出首次因变帧率时间戳量化产生 DTS 提示而被审计拒绝，原脚本与 stderr 保留；随后仅对解码输出使用原 demuxer 时间基，未修改录像。

此次导出还遗漏了两个 job 各自当前及旧构建的 `.github/workflows/` 源副本，共四份隐藏路径；android_host 已另行记录并修正后续上传配置。这里的源码校验仅针对原 `report.sourceFiles` 四份，不能代替完整导出来源校验。

QA 修正仅要求精确 busy 拒绝、原手柄完整 ID/席位/会话/PID 保留，以及拒绝后真实 START 暂停和恢复。随后继续原有断线重连和 occupied 流程。原 `8d` 脚本保存在 `8d-original/`；完整失败 wire 和 timeout snapshot 保存在 `qa/android/fixtures/single-seat-run-44115154856.json`。17 项本地契约回归已通过，包含错误身份、连接、seq、布尔 seq、非 busy 错误、抢占、首连接丢 ACK 和重复 ACK 负例；仍须新的 Android 实包运行完成。

未修改游戏、原生宿主、Observer、原 SDK 或签名包。实体电视、手机和 ESP32 未测试。
