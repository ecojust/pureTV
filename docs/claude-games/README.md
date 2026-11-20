# Claude 游戏参考清单的来源

[完整分类清单](catalog.md) · [English guide](catalog.en.md)

本轮检查日期为 **2026-11-19**；新增项的星标与仓库状态是当日快照，原301项保留2026-11-17的检查结果，不会实时刷新。

当前共 **380项、236个仓库**，本轮在已有301项上新增79项，分为竞速体育、动作角色扮演、平台弹幕、策略卡牌、解谜、经营休闲、音乐节奏和单键街机8类。新增条目排在各分类前面；原“3D动作”分类改为“动作、角色扮演与探索”，容纳本轮的2D角色扮演作品。

Gabriel同一绘画入口中的8种玩法、Treant的相近棋类变体、ROMANCER的游戏修复与编辑模式、Dora & Enzo’s Arcade的合集分别按一个参考入口计数。AMAR.IO的旧仓库地址已重定向到既有项目，本轮不重复计数；动画短片、引擎和缺少明确Claude依据的候选另记排除原因。

## 如何筛选

每个条目都需要实际游戏源码，以及明确的 Claude 参与依据：作者的制作说明、逐游戏模型记录，或确实涉及游戏源码的 Claude 署名提交。仅有 `CLAUDE.md`、提示词、空模板或引擎工具的仓库不算游戏。署名提交只说明 Claude 参与开发，不表示全部代码、美术或音乐均由 Claude 生成。

优先选择具有明确操作、规则、反馈、计分／胜负／进度，以及可运行入口的项目；同时查看玩法差异、源码结构、项目维护情况和公开演示。星标用于辅助了解关注度，低星但规则完整的作品也可能收录。清单以参考条目计数：同仓库中有独立源码入口的不同游戏可分别列出；Ink Arcade 的 Ink Rail 与 Ink Dash 共用一条项目入口，合并计一项。同一游戏的重命名、镜像或多个版本不重复计数。

这是一份源码与资料初筛清单。演示链接的 HTTP 检查只说明检查时能够取得页面，不代表完成了游戏试玩，更不代表已适配 Android TV、macOS 或 pureTV 手柄。部分作者公开截图经过目视检查，仍与本轮实玩区分；Gale Kart的AI宣传插画明确不作为实机画面证据。已交付的独立手柄游戏见[手柄游戏目录](../../joystick-games/README.md)。

## 可核查数据

- [catalog.json](catalog.json)：收录项目、固定源码提交、Claude 依据、玩法、运行方式、许可及链接检查信息。
- [research-notes.json](research-notes.json)：查询入口、排除原因与去重记录。
- [expansion-2026-11-19/](expansion-2026-11-19/)：本轮79项的四组研究、排除原因、逐项引文与源码重新取回校验、独立语义抽查和文档一致性核验。
- [expansion/](expansion/)及[expansion-verification.json](expansion-verification.json)：上一轮新增208项、合计301项的历史研究与核验，保留原报告，不冒充当前380项的报告。
- 原93项的[citation-checks.json](citation-checks.json)、[independent-review.json](independent-review.json)、[verification.json](verification.json)及[首次检查](citation-checks-attempt-1.json)保留当时结果；它们对应[原始快照](porting-baseline-93.json)，不是新增208项的核验报告。

分类清单中的「Claude 依据」链接指向原作者说明或具体提交；源码链接尽量固定到检查时的提交。演示站点由各自作者维护，之后可能迁移或下线。许可证按检查到的原文件或范围说明记录，未找到明确声明时直接标注「未明确」。

每轮都核对Claude署名提交是否实际修改游戏代码，不能仅以文档、测试或提示词改动证明完整游戏出自Claude。上一轮已校正Purrfect Logic的规则和Goal Kick的功能范围。本轮的Bee Garden明确是GPT Astra主开发、Claude后续参与；OpusSkate保留作者“Opus 5.5”的原词，不补写独立验证结论。演示返回401/404、需要自备API、多人服务器、外部信令或特殊宿主的情况分别保留，HTTP200仍只表示页面或项目入口可访问。

## 原93项的双平台适配

[逐项评估](tv-assessment.md)和[tv-assessment.json](tv-assessment.json)绑定[原始93项快照](porting-baseline-93.json)。其中Web宿主路线可继续51项，其余逐项记录素材、许可或另建运行层的条件；这不是已发布数量，也不表示其它引擎永远不能适配。该批量任务剩余部分按用户要求暂停。

正在推进的[九款赛车三平台任务](../racing-nine/README.md)以本轮扩充前冻结的31候选为比较范围。新增79项是参考清单，不自动扩大赛车任务，也不改变商城或已发布游戏数量。

## 后续维护

新增条目时更新 [catalog.json](catalog.json)，从仓库根目录执行以下命令生成并核对两份文档。

```sh
python3 docs/claude-games/render-catalog.py
python3 docs/claude-games/render-catalog.py --check
```

2026-11-19 的 380 项快照还可运行 `python3 docs/claude-games/expansion-2026-11-19/verify-catalog.py`，核对原 301 项和新增 79 项的来源。重新核对仓库是否迁移、源码是否仍完整，以及运行时是否需要服务器、AI API、WebGPU 或外部 CDN；不要把搜索摘要和聚合站评分直接写成已验证的玩法结论。参考清单不改变 pureTV 已发布游戏数量、商城目录或安装包。
