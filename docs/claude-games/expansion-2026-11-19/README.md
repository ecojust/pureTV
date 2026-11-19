# 2026-11-19 · 新增79个Claude游戏参考

本轮在301项基础上新增79项，合计**380项、236个仓库**。完整清单直接列在[根README](../../../README.md#claude-游戏参考清单)，本目录保存出处与核验。

| 分类 | 当前总数 |
| --- | ---: |
| 竞速与体育 | 46 |
| 动作、角色扮演与探索 | 56 |
| 平台、弹幕与街机 | 58 |
| 策略、塔防与卡牌 | 81 |
| 解谜与益智 | 65 |
| 经营、沙盒与休闲 | 51 |
| 音乐与节奏 | 7 |
| 单键街机 | 16 |

## 研究与验证

- [动作、3D与竞速26项](karts-research.json)：26个新仓库，含固定来源、原作者模型声明/提交与实际源码。
- [策略、经营与角色扮演24项](strategy-research.json)：记录网页、Godot、Unity、Go及特殊电视宿主的差异。
- [解谜、休闲与节奏21项](arcade-research.json)：Triptych合集中的独立游戏入口，排除此前12项与同一作品的多个模式。
- [补充8项](root-research.json)：体素无双、线描经营、滑雪、飞行模拟等，并记录迁址重复、动画和依据不足的排除项。
- [首29项重新取回验证](independent-first29.json)、[策略24项](independent-strategy-attempt-1.json)、[动作26项](independent-karts-attempt-1.json)：79项引文原文、实际受影响游戏源码、全部已记录源码大小/SHA256及许可重新取回核验。
- [最终79项重新取回验证](independent-final79.json)：绑定最终四组输入哈希，79项出处和172份实际源码文件全部通过。
- [跨组语义抽查](audit-external-groups.json)：另读8项README/源码/许可，补精确默认周数、NOTICE和素材许可范围。
- [整合输入](assembly-inputs.json)与[最终一致性检查](verification.json)：去重、分类、README数量与结构化数据一致性。

## 范围

这次是资料与源码初筛，没有逐款浏览器试玩；演示HTTP200只证明页面可取得。作者公开截图和宣传插画分别标识，不以宣传图替代实机证据。所有模型出处均保留原词；Bee Garden是GPT Astra主开发、Claude后续参与，OpusSkate为作者明确的Opus 5.5制作声明。

有些项目需要构建、服务端或特殊宿主。例如Spinlings需要Claude Code插件环境，Couch Colony面向已root的LG webOS，Tales of Dorlune是iOS源码。参考清单不等于电视兼容或自由再分发许可；对应运行条件、代码及素材许可见条目。

原301项的源数据、星标和研究不重复刷新，只将原“3D动作”分类名称拓宽为“动作、角色扮演与探索”，并标明原检查日期。原93项适配快照、商城及已发布游戏计数均不改变；九款赛车任务仍使用此前冻结的31候选。
