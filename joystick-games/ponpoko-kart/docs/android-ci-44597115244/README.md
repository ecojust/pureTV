# Ponpoko Android 首轮原证据

原运行 [44597115244](https://github.com/ecojust/pureTV/actions/runs/44597115244)、attempt **1**、冻结源 `8f283c73f52f857777306eafc88f710262367834`。本轮 build / sign 成功，runtime 失败，最终原证据导出成功，固定导出提交为 `4249f5c0ec3053a1dec652a7880a040e1bb143f0`。本次只读取原产物，没有重新构建、签名、运行游戏或修改生产代码。

独立核验 **267 个导出文件、205 份冻结源码输入、9 个 APK 资源**均通过。APK 为 **1,602,736 字节**，SHA-256 `a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22`；`apksigner` 和 `aapt` 独立确认固定证书、包名 `com.ecojust.joystick.ponpokokart`、版本 `0.1.0 / 1`。APK 仅保留 scratch，没有放入游戏发布目录。见 [independent-verification.json](independent-verification.json) 和实际执行的 [verify-export.py](verify-export.py)。

本次失败发生在初始化阶段，还未走到倒计时、油门或 SDK 玩法检查：

- **normal**：仅清理应用数据通过；`initial-menu` 等待超时。最后保留的诊断中 `game: null`，没有 canvas 或手柄卡片；Observer 的 instrumentation 日志曾报告 ready，但最后诊断 HTTP 请求为 `ConnectionRefused`。
- **occupied**：随后 `adb wait-for-device` 超过 45 秒，尚未进入应用初始化，没有快照。
- 两种模式均没有生成截图或录屏，不能声称已经观察到游戏菜单、驾驶或暂停。

这些证据表明初始化未完成、随后设备或诊断连接不可用；**尚未证实**模拟器 OOM、进程崩溃、JavaScript 错误或图形驱动故障。具体原错误与精简诊断在 [runtime-analysis.json](runtime-analysis.json)。不能把这次失败归为输入时序问题，也不能根据它修改游戏计时。

直接下载 Actions artifact 和原 runtime job `135821097274` 日志曾遇到重定向存储 403；artifact 已通过上述固定 Git 导出完整恢复。三次失败读取记录保留：首次为本机旧 `gh` 不支持 `--allow-escape-sequences`，之后普通 GET 与带 cache-busting 的 GET 均返回 403。第四次通过 `gh run view --job 135821097274 --log` 成功取回 [完整 job 日志](original-runtime-job.log)，共 425,227 字节，SHA-256 `8cd2317364714b196430eb2a3ee3c271a9371a640dd72371cc25b89799760b4e`。这是 GitHub CLI 导出的日志格式，不冒称与 API 原始压缩日志字节相同。

原日志显示启动时有 ColorBuffer 错误，之后仍于 19:29:39 UTC 报告 `Emulator booted`，19:29:50 应用数据清理成功。初始化超时后，两次 `adb logcat` 均等待 45 秒超时；最后停止模拟器时 TCP 5554 返回 `Connection refused`。日志没有明确的模拟器进程退出码、OOM-kill、致命信号或 WebView 崩溃栈，不能将启动时的 ColorBuffer 错误认定为后续故障根因。

现有 Android runtime-only 工作流可以复用该次原签名 APK 与 observer，在新建无快照模拟器中重验，并绑定原 run / attempt / source / export；无需重新编译或签名。精确请求建议与静态核验范围见 [runtime-reuse-static-review.json](runtime-reuse-static-review.json)。本次没有派发该请求；新验收结果也不会覆盖首轮失败事实。

`original-evidence/` 中的原报告、执行源码和签名回执保持原字节。未测试实体电视或 ESP32，当前 APK 尚未完成 Android 原生玩法验收。
