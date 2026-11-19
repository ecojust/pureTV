# Ponpoko Android 首轮原证据

原运行 [44597115244](https://github.com/ecojust/pureTV/actions/runs/44597115244)、attempt **1**、冻结源 `8f283c73f52f857777306eafc88f710262367834`。本轮 build / sign 成功，runtime 失败，最终原证据导出成功，固定导出提交为 `4249f5c0ec3053a1dec652a7880a040e1bb143f0`。本次只读取原产物，没有重新构建、签名、运行游戏或修改生产代码。

独立核验 **267 个导出文件、205 份冻结源码输入、9 个 APK 资源**均通过。APK 为 **1,602,736 字节**，SHA-256 `a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22`；`apksigner` 和 `aapt` 独立确认固定证书、包名 `com.ecojust.joystick.ponpokokart`、版本 `0.1.0 / 1`。APK 仅保留 scratch，没有放入游戏发布目录。见 [independent-verification.json](independent-verification.json) 和实际执行的 [verify-export.py](verify-export.py)。

本次失败发生在初始化阶段，还未走到倒计时、油门或 SDK 玩法检查：

- **normal**：仅清理应用数据通过；`initial-menu` 等待超时。最后保留的诊断中 `game: null`，没有 canvas 或手柄卡片；Observer 的 instrumentation 日志曾报告 ready，但最后诊断 HTTP 请求为 `ConnectionRefused`。
- **occupied**：随后 `adb wait-for-device` 超过 45 秒，尚未进入应用初始化，没有快照。
- 两种模式均没有生成截图或录屏，不能声称已经观察到游戏菜单、驾驶或暂停。

这些证据表明初始化未完成、随后设备或诊断连接不可用；**尚未证实**模拟器 OOM、进程崩溃、JavaScript 错误或图形驱动故障。具体原错误与精简诊断在 [runtime-analysis.json](runtime-analysis.json)。不能把这次失败归为输入时序问题，也不能根据它修改游戏计时。

直接下载 Actions artifact 和原 runtime job `135821097274` 日志遭遇重定向存储 403；artifact 已通过上述固定 Git 导出完整恢复。job 日志仍未取得，三次读取记录保留：首次为本机旧 `gh` 不支持 `--allow-escape-sequences`，之后普通 GET 与带 cache-busting 的 GET 均返回 403。现有 Android 只读 evidence 工作流仅携带相同 runtime artifact，不会增加缺失的模拟器 job 日志，所以本次没有重复派发它。下一步需要原 job 日志中的模拟器退出、ADB 断连和 Android/WebView 崩溃信息，再判断最小修复范围。

`original-evidence/` 中的原报告、执行源码和签名回执保持原字节。未测试实体电视或 ESP32，当前 APK 尚未完成 Android 原生玩法验收。
