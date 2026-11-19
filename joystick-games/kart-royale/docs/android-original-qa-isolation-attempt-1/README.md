# Kart Royale 原签名 Android 包：最小菜单 QA 候选

此目录只保存候选 QA 与本地证据，尚未创建隔离提交或运行原生验收。原 APK/Observer、宿主、渲染器、资源和原失败记录保持不变；不能把本地 TCP/合成快照测试称作 Android 游戏通过。

以 `6c7cb4fdb99dce236b634c842326bae6aed5f232` 为唯一父提交，仅覆盖 `executed-overlay/` 中三个文件。`candidate-three-files.json` 是精确字节清单，`source.diff` 是相对原父提交的完整差异；勿用现行 live QA 工作流替换原工作流。`dispatch-template.json` 仅供后续独审与冻结，未提交或发送。

- 计划：六个 Y 菜单步骤新增 `menuTap: true` 和实际原 DOM 的完整 focus 文本。全部 20 个原 60 秒超时、所有原 holdMs 及其他步骤不变。
- 运行器：从 `f3e1e9f6634e35d1c9ae0cfbf1f8a51d42de7965` 提取四个通用短按 helper 与分支，排除 Night 重载/计数归零例外。原计划已有五个 menuTap 标记在旧 Android runner 中并未执行；此候选现在让这五步与六个修正步骤都走真实 SDK 短按检查。
- 每次短按只发一个键的 16 ms down/release，同连接两个唯一原 ACK、同 ID/session/cancelSeq、窗口与文档焦点、九键 raw/semantic 松开均要成立。先看到释放后匹配的基线，再有两个连续新 poll 且目标仍匹配才通过；恒定/回退计数、缺 ACK、断线、旧焦点都会失败。它不声称 Android 有 Windows 原生按钮计数器。

`logs/test_runner-attempt-1.log` 保留首轮 54 项中的一个新增测试范围错误：它误把 SDK 连接时九个同步包算入按键对。只修测试的 seq 起点后，10 项新边界全部通过；原 44 项已通过且完整 AST 未改。原工作流其他三套 16/15/11 项也通过。没有重复跑原生或无关测试。

12 条真实 Windows stale-focus 失败快照已逐原报告 SHA 与内容核对；旧“仍在 controls 菜单”谓词会通过，而六个新焦点谓词会拒绝。四个相关菜单/控制源码在旧 Windows 与本原 Android 包源码之间逐字节相同，但这些样本仍是 Windows 证据。`static-boundaries.json` 还证明 198 个原签名源输入中除允许的 QA 计划外 197 个未改，原运行器完整 AST 去掉四 helper 和 dispatch 后相同。

Vulkan、模拟器内存和镜像配置属于另一个决策，此候选保持原 6c7 工作流字节。原包运行曾出现 boot HUD/0 帧后 Observer/ADB 失联；现有证据没有证明图形根因。须等待独立审查和后续真实原包验收。
