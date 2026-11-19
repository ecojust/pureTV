# Last Track / Turbo Android 原包隔离复验准备

仅为固定源码与依赖审核方案，未创建 ref、修改生产代码或启动 CI。两款原失败保留。

| 项目 | Last Track | Turbo Kart Rush |
| --- | --- | --- |
| QA 唯一父提交 | `c5ad63e8` | `c5ad63e8`，沿用最新复验 |
| 原包 source / run | `c5ad63e8` / `44606071748` | `06f1ab2b` / `44600152694` |
| 原包 export | `35fca55f` | `e01ab3ba` |
| 当前必要 QA 改动 | 仅复用已审的嵌套资产 verifier 与其 4 项附加测试，共 2 文件 | 0 文件；有界 Observer 重试已在最新复验执行 |
| 原玩法计划 | 21 步原样 | 10 步原样 |
| 原生产文件 | 484 路径 Git 对象一致 | 145 路径 Git 对象一致 |

Last 原失败是正常模式第 5 项后 Observer/TCP/ADB 失联，占用模式未开始。Turbo 应以最新复验 `44606216069` 为准：5 项通过后 3 次新 GET 耗尽，ADB 明确 offline；不能用更早生产运行中的单次回调超时替代此结论。无需再移植 snapshot 重试，也无依据改菜单、物理或判据。

等待 Pon 对照 `44630011092` 的实际结果后，由根代理决定是否仅在原工作流第 181 行 `emulator-options` 末尾增加 `-feature -Vulkan`。若选择，Last 共 3 个变化路径、Turbo 仅 1 个；原 API 36、3072 MiB、SwiftShader、双模式和全部严格断言保持。原工作流未固定 emulator build，实际版本若变化，不能声称与历史运行只有一个环境变量不同。

完整 SHA、原包/Observer 身份、闭包、6 字段请求模板和限制见 [recipe.json](recipe.json)。Last 原 APK 全包独立交付审计仍待做；本次未下载 APK 或重跑测试。两款都没有新增 Android 通过结论。
