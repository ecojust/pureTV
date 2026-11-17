# Claude 游戏扩展研究：策略、解谜、经营

核查日期：2026-11-17。本轮最终冻结为 **41 个独立游戏、37 个仓库**，不再继续扩张。未改 README/catalog，未提交或推送，未运行上游代码、未执行上游测试、未试玩。

## 交付与计数

- 候选数据：`expansion-strategy-puzzle.json`。沿用现有目录分类：策略、塔防与卡牌 23；解谜与益智 11；经营、沙盒与休闲 7。
- 校验记录：`expansion-strategy-puzzle-validation.json`，状态 `passed`。
- 与原有 93 条目录按仓库和固定源码 URL 去重：无重复仓库、无重复源码 URL。
- Stillplay 同仓库五款分别拥有独立 C 规则核和不同玩法：扫雷、FreeCell、Klondike、Spider、Hearts；不是同一玩法的皮肤。
- 31 项 Claude 证据来自源码提交共同作者署名；全部含非空 `sourcePathAffected`，等于已读游戏源码与该提交变更文件的交集。10 项来自固定提交 README 原话。
- 57 条源码记录均下载完整文件，检查了固定提交目录树、路径、字节数、SHA-256 与 Git blob SHA-1；合计 11,207,716 字节。Blight Siege 的内联 HTML 含嵌入素材，已完整下载约 9.3 MB，未把截断正文当作完整源码。
- 13 项许可原文检查通过：MIT 12、AGPL-3.0 1；其余 28 项注明未明确。数字按游戏计数，Stillplay 的 MIT 为五款共同根许可。
- 入口 40 项 HTTP 200，1 项 HTTP 401；其中 25 项给演示入口、16 项仅有项目源码入口。HTTP 200 只证明能收到页面，不证明实际游戏能启动或已试玩。

## 搜索过程

先读取原有 `docs/claude-games/catalog.json`，再进行 GitHub 仓库搜索。查询原文、响应、实际返回条数保存在 `strategy-puzzle/search-*.json`。默认按 stars 降序，每轮最多取 50 项，不宣称穷尽搜索。

| 查询 | API 总命中 | 本轮取得 |
| --- | ---: | ---: |
| `claude "tower defense" in:readme stars:>2` | 140 | 50 |
| `claude "deck building" in:readme stars:>2` | 43 | 43 |
| `"built with claude" puzzle in:readme` | 338 | 50 |
| `"claude code" "strategy game" in:readme stars:>1` | 151 | 50 |
| `claude puzzle in:name,description -awesome` | 0 | 0 |
| `claude "tower defense" in:name,description` | 42 | 42 |
| `claude "city builder" in:readme -awesome in:name` | 36 | 36 |
| `"built with Claude" "card game" in:readme -awesome in:name` | 8 | 8 |

随后使用队友发现的 `expansion-3d-raw/curated-games.json`（4,128 项）作为线索，按目标类型与现有目录去重初筛出 447 项。第三方目录的评分、verified 标签和 Claude 标记均未作为收录证据。逐仓回到 GitHub 原项目读取固定 HEAD、完整目录树、README、原许可和游戏规则源码。本轮保留了 46 个仓库的原仓元数据快照，最终选入其中 37 个。

抓取资料与脚本保存在 `strategy-puzzle/`：

- `repos/<owner>__<repo>/summary.json`：仓库元数据、固定提交、完整目录树、README/许可文字、证据提交。
- `repos/.../source/`：实际读取的完整游戏源码。
- `repos/.../evidence-reviewed-source.json`：替换掉不触及已读核心源码的旧提交证据。
- `accepted.json`：人工填写的玩法、技术、适配观察与源码阅读结论。
- `collect.py`、`evidence.py`、`source-fetch.py`、`align-evidence.py`、`export.py`、`finalize.py`：本轮抓取和可重复核验脚本。

## 收录边界与重要例外

共同作者署名仅说明对应提交有 Claude 参与，不证明整个项目由 Claude 独立生成。README 自述同样标为上游作者声明，未声称现场见证模型生成。模型名按上游原话引用，不自行确认模型产品名称。CLAUDE.md、仓库名称含 Claude、第三方标签、部署提交和文档提交均不足以单独收录。

质量建议来自可读的规则实现、游戏循环、作者说明的完成度和功能范围，不来自本站试玩或沿用第三方评分。原型明确标注原型；已有测试文件也不等于本轮测试通过。Stars 是查询时的观察值，不是质量评分。

- **THE SPIRE**：`https://wai-lau.net/spire` 返回 HTTP 401，保留失败结果并在 notes 明写访问验证；固定提交源码页另核 HTTP 200，见 `sourceAccess`。不能称该演示已可进入或已试玩。
- **Stillplay**：从项目首页实际链接确认 `/minesweeper`、`/freecell`、`/solitaire`、`/spider`、`/hearts`，五条均 HTTP 200。各核心初建提交分别有 Claude 共同作者署名。
- **Immortal Snail Chess**：唯一嵌套许可位于 `.claude/skills/oil-ui/LICENSE`，它只覆盖工具技能，不把它算成游戏整体许可。
- **Heroes Clone**：根 LICENSE 为 MIT，package 许可字段有不一致，notes 已指出；较旧 README 的六边格描述与当前方格实现不同，玩法描述按当前源码核对。
- **Lastlight**：完整 AGPL-3.0 许可有记录；package 的 `-or-later` 表述差异在 notes 中保留。
- **Tower of Time**：README 明示主要 Claude Sonnet 4，同时偶尔使用 OpenAI o3 与 Claude Opus 4，未写成纯 Claude 制作。
- **Tilekeeper**：README 明确游戏设计/代码 Claude、美术 Gemini、人类指导，按分工记录。
- **Arrakis Wars、Blight Siege、Trading Card Game Fable5** 等有已有 IP 或项目名称关联；未把未知素材授权推断为可再分发授权。
- **Ruinaccord**：固定 README 已更名，主标题使用新名并保留旧名 Ashen Crown；演示入口使用上游当前新域名。

## 排除与暂缓

不把未完成核查自动理解为项目质量差；本轮冻结时只有材料完整的候选进入最终 JSON。

| 仓库/线索 | 本轮处理原因 |
| --- | --- |
| `PierreHoule/SpaceHo2` | 当前所取 README 与提交范围未确认明确 Claude 开发证据；不凭目录标记收录。 |
| `paulofcmello/rea-chess` | 声称复刻第三方棋站的画面/资产，整体许可与资产来源未解决；只发现引擎局部许可，未作为整体项目许可。 |
| `ErrorSoul/soliter` | 已取元数据，但本轮未完成足够的核心规则源码与对应署名提交核对。 |
| `kglazier/Ages-Of-Aether-Native`、`zhubby/Shogun`、`aviate15/chessweeper`、`natemiller39/Snake-D`、`Deedubsy/Relight` | 有候选资料，但在冻结前未完成本轮同等强度的逐项规则源码核查，暂缓。 |
| `zsidiadi/Ball-Heckaton-ascii-game` | 目标更接近街机动作，本分工未继续核查；不重复队友的动作类搜集。 |
| `adsouza/africa2ice` | 第三方线索给出的证据 commit 在原仓查询返回 422 / No commit found，未复用失效证据。 |
| `suhdonghwi/invariant-frog`、`Funashigiri/dawnmark`、`yoonwoojeong/APOLLONIUS` | 查询时原仓接口 404，未确认可公开访问的固定源码。 |
| `swan4er/opus-100-projects` | 队友已负责独立游戏核查，本组避免重复收集。 |
| 仅 GPT/Codex 标记、仅 CLAUDE.md、awesome 列表、开发工具仓库 | 非本轮目标或缺少可确认的 Claude 游戏开发证据，未收录。 |

最终数据冻结后只允许修正事实、证据或格式，不继续扩大候选数。
