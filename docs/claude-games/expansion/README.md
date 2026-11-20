# 本轮扩充核查

2026-11-17：新增208项，合并原93项后为301项、178个仓库。这里只记录参考清单的来源与筛选，不是游戏试玩、设备兼容或安装包验收。

三组研究分别为[动作竞速68项](action-research.json)、[策略解谜41项](strategy-research.json)、[合集休闲99项](collections-research.json)。各组[动作记录](action-research.md)、[策略记录](strategy-research.md)、[合集记录](collections-research.md)包含检索覆盖、去重、排除与运行限制。聚合目录仅用于发现线索，没有直接采信其评分或“verified”标签。

- [最终引文核验](citation-final.json)：独立重新读取原作者README或署名提交，逐字核对引文；提交类依据同时检查实际修改的游戏源码路径。
- [最终路径核验](paths-final.json)：208项、117份固定Git树；源码入口、许可及已读源码路径存在，报告的源码字节数与原Git对象一致。
- [独立复核](independent-review.json)：玩法描述、仅文档署名、引文拼接等问题及解决结果。
- [各组自检](collections-self-audit.json)保留含嵌套模式/变体的补充证据；另有[动作自检](action-self-audit.json)、[策略自检](strategy-self-audit.json)。嵌套来源记录数不增加README条目数。
- [整合输入](assembly-inputs.json)记录三份最终研究原件的哈希；[运行方式标签](runtime-labels.json)将已核到的CDN、API、服务器等条件明确写进README。

[首31项失败](citation-first31.json)保留一次非连续署名被拼接为引文的问题；[首33项检查](citation-first33.json)当时仅能证明引文匹配，其中数条仅涉及文档/测试的引用后来已更换。早期合集拆分记录也保留，不能把它们的数量当作最终301项数量。

[实际执行脚本原件](executed-scripts/)保留当时的工作区和缓存路径，用于复查流程；重跑需将这些路径指向新工作区。公开使用的来源是JSON内的固定GitHub提交链接，临时缓存不是发布资源。HTTP200仅说明获得了页面或项目入口；受访问验证、返回404或尚无公开试玩的项目均保留具体记录。
