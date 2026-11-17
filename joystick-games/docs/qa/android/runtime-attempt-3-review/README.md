# Android 最终实际运行复核

[44118366855](https://github.com/ecojust/pureTV/actions/runs/44118366855) 的 CF / QQ 两款游戏，默认端口与占用端口两种模式均完成。四场共 92 项运行检查通过；985 条已接受 SDK 消息均有同连接、同 seq 的唯一真实 ACK。另有 40 条预期被拒绝连接的 SDK 消息及 4 条明确 `controller_busy` 响应，单独统计，不当作 ACK。

| 运行 | 通过项 | 实际 ACK | TCP 端口 |
| --- | ---: | ---: | ---: |
| CF normal | 24 | 245 | 63485 |
| CF occupied | 24 | 245 | 43429 |
| QQ normal | 22 | 252 | 63485 |
| QQ occupied | 22 | 243 | 45165 |

每场验证真实 WebGL 2、SDK 九键、菜单开始/暂停/恢复、实际游戏操作、单席拒绝且主手柄继续操作、断开清键、同 ID 重连、held-sync 抑制，以及同进程中服务端口稳定。CF 原快照包含实际位置、yaw/pitch、耗弹/射击计数和换弹进入；QQ 包含速度、转向与实际漂移。验收不宣称 Android 完整比赛通关或测得完整换弹时长。

QA 源：`06c73fa33c332736876a0c5324a5d9bb9bf3afe3`。APK 与独立 Observer 继续使用 `d30e1ce26abbf27d07d149b708c6a491abb105b3` / run `44110295680` 的原签名字节，没有重编或重签。原件导出：[`464a4482a4e74b2d652c9fc4deb63f494bfd12a8`](https://github.com/ecojust/pureTV/tree/464a4482a4e74b2d652c9fc4deb63f494bfd12a8)。

- `summary.json`：原报告与 wire 的哈希、四场统计和证据索引。
- `independent-runtime-review.json` / `review-runtime.py`：独立读取原件、源码提交、APK/Observer 哈希、逐 seq ACK、缓存帧、会话、端口、截图哈希和视频完整解码的执行结果及原脚本。其 `allImagesManuallyReviewed:false` 仅指该自动脚本不代替人工看图。
- `visual-review.json`：全部 24 张原生 1920×1080 PNG 已逐张目视。逻辑视口 960×540；完整 ID 和图标可读，断开后卡片消失，同 ID 重连后卡片恢复。QQ 菜单/暂停的 TCP 文本略触侧栏底边，但数字和完整 ID 仍可读，保留为布局限制。
- `gameplay-review.json`：只读实际游戏快照与已执行判据的核对。QQ 右转使用当时的 heading 基准，原 runner 未单独序列化该基准；不能把前一张左转样本当成右转前的数值。

四段实际屏幕录像均完整解码。录像只覆盖每场最初约 180 秒，后续快照/PNG 单独提供证据；未声称完整流程均有录像。未做实体电视、手机、ESP32、局域网广播发现或真实设备帧率测试。先前两轮失败原件与 QA 修正来源保留，未改写为通过。
