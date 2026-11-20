# Pon 原 QEMU 崩溃栈诊断方案

状态：方案和本地边界原型已验证，尚未接入监督器或 CI，未派发工作流。不是崩溃修复，也不构成新的 Android 玩法通过记录。

## 原证据与范围

- Vulkan 对照 `44630011092 / 467670b4e43189dc8fc4786a5c6b3a14b6f9b2bd` 已确认实际 `-feature -Vulkan`，同 PID/start 的原 QEMU 仍由原父进程 wait 得到 `-11 / SIGSEGV`，131.1458 秒退出，无主动终止。没有恢复到原生崩溃栈。
- 下一次只增加诊断附件，保持该源的原签名 APK、observer、SDK 16970787、API 36 android-tv/x86_64、2048MB、swiftshader_indirect 和 Vulkan-off argv。由根代理建立隔离 QA ref，禁止把随后生产 Java 或游戏修改带入。
- 默认关闭，仅原 Pon artifact source/run/export 和监督方式允许开启。不能接受用户指定任意 PID、GDB 命令、可执行文件或额外游戏。

## 拟接入路径

| 路径 | 最小变化 |
| --- | --- |
| `joystick-games/tools/android-qemu-stack.py` | 新增有界 GDB/MI 驱动，严格身份验证、有限栈、信号与脱离状态记录 |
| `joystick-games/qa/android/test_qemu_stack.py` | 身份/解析/预算反例，真实受控 ELF 的信号与清理语义；在 CI 使用当次实际 GDB 先执行 |
| `joystick-games/tools/android-emulator-supervisor.py` | 默认 off 可选 hook；只在原 same-PID QEMU exec 已观测并匹配固定二进制后单次尝试，记录诊断介入 |
| `.github/workflows/joystick-catalog-android-runtime.yml` | 默认 false 的独立诊断输入；精确 Pon/Vulkan-off scope，准备系统 GDB，保存工具版本、执行源与结果 |

旧 `test_emulator_supervisor.py` 只按必要增加默认 off/错误 scope 回归。正式变化须另列冻结清单；本目录不是可直接派发的实现。

## 进程身份与附加

1. 从可信监督器 state 和 launch report 推导目标，绑定 run/attempt/QA source、原 APK identity、监督器 PID/start/exe、owned child PID/start/parent、SDK 下准确 QEMU 路径与 SHA256。启动前拒绝已被其他 tracer 附加、退出/zombie、路径或 SHA 不一致的目标。
2. 防止“检查 PID 后进程退出并被重用”的窗口：首次附加握手期间监督器不能 reap 该子进程；可用 `waitid(WNOWAIT)` 观测退出而保留 PID。握手结束或明确未附加后再回到原 wait。不能仅靠时间接近或 pidfd 的存在声称排除了 PID 重用。
3. GDB 完成 attach-stop 后再次核对同 PID/start/parent/exe 和本次 GDB tracer，再允许取栈。状态有差异先正常脱离，标记诊断无效。
4. 优先同用户附加。如果 CI 权限不允许，只允许在上述验证完成后，对这个精确 owned PID 用一次固定 `sudo -n ... /usr/bin/gdb`；记录是否使用。不得更改 ptrace_scope、core_pattern、权限策略或其他全局内核设置。

## 数据与信号边界

- GDB 使用 `-nx -nh`；在 attach 前禁用 auto-load、debuginfod、frame 参数和 entry values。不载入项目外 `.gdbinit` 或 Python pretty-printer，不执行表达式、变量读取或任意用户命令。
- 只用有限 `-stack-list-frames --no-frame-filters 0 11` 读取栈。计划最多 4 个 SIGSEGV 事件，每事件最多 4 个线程，优先发生信号的线程；每线程 12 帧。输出只保留地址、函数名、模块 basename、映射对应偏移和可验证的模块文件 SHA；没有符号时保留 unknown，不伪造函数名。
- 必要的栈展开会由 GDB 读取目标栈，但不调用 `x`、`read_memory`、locals、args、environment、变量求值、core/gcore/generate-core-file。不得导出任意内存块、完整 core、完整环境或参数值。
- 从 `/proc/<owned PID>/maps` 只构造栈地址所需的可执行模块映射；输出路径 basename，不归档任意映射内容或文件内容。
- 初始建议上限：单行 64 KiB、保留报告 128 KiB、GDB 字节读取/日志独立有界；调试窗口最多 300 秒、单命令有超时。达到栈/日志预算仍须保留原信号并安全脱离，不能因为“已有足够栈”杀掉 QEMU。
- `handle SIGSEGV stop print pass`。首个 SIGSEGV 可能被 QEMU 自己处理，只记事件；取栈后继续，让原信号交付。原监督器最终真实 wait 仍是是否终局 SIGSEGV 的唯一依据。
- 所有诊断运行标记 debuggerAttached/perturbed；原 QA 报告不改写。即使游戏随后通过，也不能把附加调试器的运行冒充未经干预的原生验收。

## 脱离与尚需接入验证的边界

- 正常超时优先 MI async `-target-detach`，不先向目标注入 SIGINT。已在本机实际证明 running 状态能直接 detach，健康进程继续执行并正常退出。
- 停在 pending SIGSEGV 时 detach 的本机实测保留原父 wait=-11；该语义必须在 CI 的实际 GDB 版本运行同样 fixture 后才启用真实 QEMU 附加。
- 不盲目 kill GDB，不用 `signal 0` 吞掉信号。命令失联、无法确认 detached、tracer 残留、身份变化或信号转发不确定都标为 blocked/diagnostic interference，不能宣称获得有效崩溃栈或原生通过。
- 附加握手的失败/超时与“不 reap”的释放协议尚未落到生产 hook，必须用真实短子进程验证，包括目标在附加前/附加期间退出。该项仍是正式集成的硬门槛。
- strip 后的 QEMU 可能只有模块与偏移；附加导致暂停和时间扰动，单次栈不能自动证明 GPU、游戏或宿主的根因。

## 已执行的本地边界

本机没有系统 GDB。使用官方 Debian 包只解压到 `/dev/shm` 的 GDB 13.1，未系统安装、未 sudo、未修改全局安全设置。工具下载元数据和实际二进制 SHA 在本目录；不把二进制包提交进仓库。

| 场景 | 实际结果 |
| --- | --- |
| 真实空指针 SIGSEGV，有限栈后 continue | 原父 wait=-11 |
| 程序处理第一次 SIGSEGV 并恢复，第二次致命 | 两次 stop，第一次确实恢复，原父最终 wait=-11 |
| MI interrupt 后 detach 的健康进程 | 继续输出，原父 wait=0；保留为比较原型，正式方案优先无 interrupt 路径 |
| pending SIGSEGV 直接 detach | 原父 wait=-11 |
| running 直接 detach，SIGINT 设置为 pass | 不发送人工 interrupt，进程继续输出且原父 wait=0 |
| 8 项身份边界 | 正确 owned 进程通过；错误 start、父进程、SHA、路径、PID、tracer、已退出目标均拒绝 |

所有实际 GDB 输出检查均未出现植入的参数/局部秘密字符串。首次原型没有正确消费异步 attach-stop，导致一个断言失败；原脚本和日志保留，修订显式等待 attach-stop 后再 continue。没有把这次原型错误归为原游戏或 QEMU 故障。

这些是本地受控 ELF 与身份原型证据，不是实际 Android/QEMU 附加证据。官方手册原页和 URL 保留在 `official-manual/`，重点依据为 Signals、Attach 和 GDB/MI execution/stack/target 文档。
