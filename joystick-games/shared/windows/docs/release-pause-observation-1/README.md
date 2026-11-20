# Royale Windows 独立观察窗口

仅修改五个 QA 源文件。原 `44636807407 / d750c0c` 两模式失败报告不变；`kart-royale/docs/windows-44636807407-analysis/` 保留实际 22 件原证据及失败分析。本目录没有新的原生验收或安装包。

Royale 第 13 步只新增 `windowsReleaseWait: {timeoutSeconds: 45}`，顶层只新增 `windowsPauseWait: {timeoutSeconds: 45}`。原单键 UP、holdMs、60 秒行动期限、semantic held、速度大于 1 和位置改变条件不变。首次满足时立即发送原 SDK release；只有释放在行动期限内完成，才能开始一次独立的 45 秒观察窗口。仍须全松基线加两个后续 fresh frame/poll，完整唯一 ACK、原身份/会话/cancelSeq/文档 epoch 及前台守卫不变；任何读回越过本阶段期限都不能通过。

暂停窗口保持四个新 native timestamp、前台实际 poll 增长、六项模型值精确冻结、原后台规则，至少观察基线后的 0.5 秒。读回、基线获取和最终 poll 检查都在同一个 45 秒硬限内，末尾没有额外 `until()` 预算。只有显式新增字段启用此分支，其余游戏保持旧暂停方法和默认期限。

实际执行既有 CI 入口：

```sh
TMPDIR=/dev/shm/racing-review-arcade/tmp python3 -B joystick-games/shared/windows/tests/window-lifecycle.test.py -v
```

最终 53 项通过、0 skip；原 42 个测试方法及 fixture 方法 AST 未变。16 款计划 schema 检查通过；Mac、Android runner 与 Windows 55 分钟 workflow 字节不变。`verify-static.py` 是实际执行的静态核验脚本，`executed-source/` 与日志绑定最终五源。

新测试中的 66.1 秒释放后帧、30.4 秒第四暂停帧是明确的合成样本；原 CI 没有观察到它们。测试验证预算与拒绝边界，不能将旧失败改判为通过。原先 51 和 52 项检查日志保留；第一轮源码通过逆向恢复后续三个精确小改动保存，第二轮源码在继续修改前实际复制，来源区别见 `attempt-1-source-provenance.json`。

状态：实现及本地合成回归完成，等待独审与 root 统一原生复验。没有派发、上传、游戏物理或时钟修改。
