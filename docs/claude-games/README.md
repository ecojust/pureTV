# Claude 游戏参考清单的来源

完整分类清单直接放在[根 README](../../README.md#claude-游戏参考清单)。检查日期为 **2026-11-17**；星标与仓库状态是当日快照，不会实时刷新。

当前共 **301项、178个仓库**，本轮在原93项基础上新增208项。按竞速体育、3D动作探索、平台弹幕、策略卡牌、解谜、经营休闲、音乐节奏和单键街机分为8类。Gabriel同一绘画游戏入口中的8种玩法合为一项；Treant的相近棋类变体按家族合并，保留各自规则与源码依据，不把模式数量直接当作独立项目数。

## 如何筛选

每个条目都需要实际游戏源码，以及明确的 Claude 参与依据：作者的制作说明、逐游戏模型记录，或确实涉及游戏源码的 Claude 署名提交。仅有 `CLAUDE.md`、提示词、空模板或引擎工具的仓库不算游戏。署名提交只说明 Claude 参与开发，不表示全部代码、美术或音乐均由 Claude 生成。

优先选择具有明确操作、规则、反馈、计分／胜负／进度，以及可运行入口的项目；同时查看玩法差异、源码结构、项目维护情况和公开演示。星标用于辅助了解关注度，低星但规则完整的作品也可能收录。清单以参考条目计数：同仓库中有独立源码入口的不同游戏可分别列出；Ink Arcade 的 Ink Rail 与 Ink Dash 共用一条项目入口，合并计一项。同一游戏的重命名、镜像或多个版本不重复计数。

这是一份源码与资料初筛清单。演示链接的 HTTP 检查只说明检查时能够取得页面，不代表完成了游戏试玩，更不代表已适配 Android TV、macOS 或 pureTV 手柄。原来的两款已适配游戏仍在[手柄游戏目录](../../joystick-games/README.md)。

## 可核查数据

- [catalog.json](catalog.json)：收录项目、固定源码提交、Claude 依据、玩法、运行方式、许可及链接检查信息。
- [research-notes.json](research-notes.json)：查询入口、排除原因与去重记录。
- [expansion/](expansion/)：本轮三组发现记录、排除原因、独立引文与实际源码提交核对、固定路径和字节数核对。
- [expansion-verification.json](expansion-verification.json)：当前301项清单计数、链接与文档一致性核验。
- 原93项的[citation-checks.json](citation-checks.json)、[independent-review.json](independent-review.json)、[verification.json](verification.json)及[首次检查](citation-checks-attempt-1.json)保留当时结果；它们对应[原始快照](porting-baseline-93.json)，不是新增208项的核验报告。

README 中的「Claude 依据」链接指向原作者说明或具体提交；源码链接尽量固定到检查时的提交。演示站点由各自作者维护，之后可能迁移或下线。许可证按检查到的原文件或范围说明记录，未找到明确声明时直接标注「未明确」。

本轮进一步核对了Claude署名提交实际修改的游戏规则文件，换掉仅涉及文档、测试或辅助回放的引用。玩法也以源码核对：例如Purrfect Logic是按行、列、区域放猫并禁止相邻，不是数独；没有把源码不支持的门将写进Goal Kick。演示返回401/404、需要自备API、多人服务器或外部信令的情况分别保留，HTTP200仍只表示页面或项目入口可访问。

## 原93项的双平台适配

[逐项评估](tv-assessment.md)和[tv-assessment.json](tv-assessment.json)绑定[原始93项快照](porting-baseline-93.json)。当前Web宿主路线可继续51项，其余逐项记录素材、许可或另建运行层的条件；这不是已发布数量，也不表示其它引擎永远不能适配。扩大参考目录不改变原93项适配任务的边界。

## 后续维护

新增条目时同时更新结构化清单与 README 分类计数。重新核对仓库是否迁移、源码是否仍完整，以及运行时是否需要服务器、AI API、WebGPU 或外部 CDN；不要把搜索摘要和聚合站评分直接写成已验证的玩法结论。参考清单不改变 pureTV 已发布游戏数量、商城目录或安装包。
