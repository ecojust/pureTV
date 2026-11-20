# Ponpoko 原签名包第二次 Android 验证

QA run [44602772007](https://github.com/ecojust/pureTV/actions/runs/44602772007)、attempt 1，固定 QA 源 `8f283c73f52f857777306eafc88f710262367834`。它直接复用原 run `44597115244` / attempt 1 / export `4249f5c0ec3053a1dec652a7880a040e1bb143f0` 的已签 APK 与 observer，没有重新构建或签名。

该次 select 成功、runtime 失败、原证据导出成功；不可变导出为 `f97e7ba929e9e215450a5289f1933d3ae9c7e086`。独立核对 **271 个导出文件、205 份原 APK 源码输入、合并后的 214 份原源及实际 QA 源**通过。APK 仍是 1,602,736 字节、SHA-256 `a1c9a0f6de56fd5ec87e25d4a6b5be541c9a04686e76b31484d99cc890b86e22`，与首轮已独立验证证书的原包完全相同。实际脚本和结果见 [verify-export.py](verify-export.py)、[verification.json](verification.json)；原报告和完整执行 QA 源保留在 `original-evidence/`。

新建无快照模拟器仍复现首轮模式：normal 仅清理应用数据通过，`initial-menu` 超时，最后快照 `game:null`、无 canvas，最后诊断连接拒绝；occupied 随后 `adb wait-for-device` 超过 45 秒。两模式均没有游戏截图或录像。完整原 job 日志为 [original-runtime-job.log](original-runtime-job.log)，471,353 字节、SHA-256 `e64ca16fac4b3c697547c446ef879af57c976a698d93d68aa7ee8b3b27d0179d`。

两次完整日志均未采集 `/proc/meminfo`、cgroup 内存事件、进程 RSS、kernel OOM 或被监控模拟器的真实退出码。启动时 ColorBuffer 错误之后仍能启动并清理应用数据，不能据此确定后续根因。最小诊断建议与检索依据在 [diagnostic-evidence-gaps.json](diagnostic-evidence-gaps.json)：保留原签名包与渲染配置，增加有界系统观察和启动前的连续 logcat，不盲重试、不降低画质、不改游戏时钟。

本次只恢复与核验既有证据，没有另发 CI。首轮与第二轮失败均保留；没有 Android 原生玩法验收通过声明，也未测试实体电视或 ESP32。APK 与重复原源码副本留在原不可变导出和 scratch；归档子集的排除范围在验证结果中明确记录。
