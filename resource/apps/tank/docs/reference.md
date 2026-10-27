# 坦克大战规则与关卡参考

本实现是 JavaScript 独立重写的 1985 年《Battle City》规则模型，运行于 Android WebView。它不运行 NES ROM，也不把反汇编代码翻译为 JavaScript。手机是局域网手柄；原作的 Select、Start、A、B 和方向输入仍分别处理。

## 来源与许可

| 内容 | 可核对的来源 | 使用方式 |
| --- | --- | --- |
| 35 个关卡的地图初稿 | [hec9527/BattleCity，固定提交的 data.ts](https://github.com/hec9527/BattleCity/blob/62d7bc667709c33b7c008a2049e2d30cb8f032fd/src/map/data.ts) | 从 MIT 项目的 13×13 数字地图转换为字符地图，保留半块墙；许可副本见 [hec9527-MIT.txt](../licenses/hec9527-MIT.txt)，Copyright (c) 2022 hec9527 |
| 地图校对依据 | [romhack/battle-city-disassembly，固定提交的 levels](https://github.com/romhack/battle-city-disassembly/tree/629ecc214f1b7c9e10ff103bc05e7b40e0b2fba7/levels) | 只用文本关卡参考核对位置；没有取得或打包 ROM |
| 原作规则、敌人波次和计时依据 | [Battle City (J).asm，固定提交](https://github.com/romhack/battle-city-disassembly/blob/629ecc214f1b7c9e10ff103bc05e7b40e0b2fba7/Battle%20City%20(J).asm) | 只读参考，独立编写状态机、碰撞和输入处理；没有复制反汇编代码 |

反汇编参考仓库没有开源许可，其说明保留原作权利。这不是对原作图像、音乐、名称等内容的许可授予。MIT 许可对应上表地图初稿的项目贡献；本文件不会把原作所有内容统称为 MIT。图像和声音的来源另见对应资源说明。

## 地图核对与格式

`src/main/assets/levels.js` 保存 35 张 13×13 字符地图；每格对应原生 16×16 像素。规则模型把它展开成 52×52 个 4×4 像素单元，以支持砖墙分层破坏。

| 字符 | 含义 |
| --- | --- |
| 空格 | 空地 |
| `#`、`]`、`_`、`[`、`-` | 完整砖、右半砖、下半砖、左半砖、上半砖 |
| `@`、`}`、`v`、`{`、`^` | 完整钢墙、右半钢、下半钢、左半钢、上半钢 |
| `~` | 水，阻挡坦克，不阻挡炮弹 |
| `T` | 树林，覆盖坦克，不阻挡移动和炮弹 |
| `*` | 冰，玩家松开方向后继续滑行 |

原始 MIT 地图含已绘制的基地围墙；转换时先分离运行时基地，再恢复参考原始地图在该区域的地形。随后每关开始按原作重绘基地的 48×32 区域；玩家和敌人出生时清空自身 16×16 出生格。

另外校正了以下 17 个非基地格。坐标从 0 开始，格式为「关卡：(行, 列) → 正确字符」。

- 2：(8,9)、(8,10) → 空格。
- 3：(0,7) → 空格；(0,8) → `#`。
- 5：(0,6) → `#`。
- 6：(10,10) → `]`；(10,11) → `#`。
- 8：(10,4)、(11,4) → `[`。
- 9：(2,10)、(3,7) → `T`。
- 12：(0,6) → `#`。
- 15：(7,4)、(8,4) → 空格；(12,4) → `T`。
- 26：(12,0)、(12,1) → `@`。

基地原始地形恢复包括第 10 关的 5 格与第 21 关的 3 格。最终 35 张原始字符地图与参考文件逐格相同；测试以全部地图拼接后的 SHA-256 固定校验，避免重新出现三张地图循环或未经核对的地图替代。

## 已落实的原作规则

| 项目 | 模型行为 | 参考标签或位置 |
| --- | --- | --- |
| 战场 | 208×208 原生像素；显示屏 256×240 中战场位于 (16,16) | 关卡文本、出生坐标表 |
| 菜单 | 1 PLAYER、2 PLAYERS、CONSTRUCTION；Start 确认，Select 切换 | `Title_Screen_Loop` |
| 开局选关 | A 增关、B 减关，范围 1–35，Start 开始；后续过关自动进入下一关 | `StageSelect_Loop` |
| 玩家 | 每人总计 3 条命；玩家出生点 (72,200)/(136,200) | `Init_Level_VARs`、`X_Player_Respawn` |
| 波次 | 每关 20 辆，按原始四组敌人表依次出现；不是随机混排 | `EnemyType_ROMArray`、`EnemyCount_ROMArray`，约第 6477/6514 行 |
| 敌人上限 | 单人 4 辆、双人 6 辆 | `Selected_1player`、`Selected_2players` |
| 出生位置 | 左/中/右为 (8,8)/(104,8)/(200,8)；原始索引先加一，因此首次在中间 | `Make_Respawn`、`X_Enemy_Respawn` |
| 出生间隔 | `190 - stage × 4 - (players - 1) × 20` 帧 | `Respawn_Delay_Calc` |
| 四种敌人 | 普通、快速、强力、装甲；分值 100/200/300/400；装甲要命中 4 次 | `Load_New_Tank`、`BulletToTank_Impact_Handle` |
| 速度 | 玩家每 4 帧移动 3 像素；快速敌人每帧 1 像素，其他敌人隔帧 1 像素 | `Ice_Move`、`Motion_Handle` |
| 射击 | A 和 B 都是按下沿射击；长按不自动连射；B 不提供护盾 | `Make_Player_Shot` |
| 炮弹 | 普通 2 像素/帧；一星后及强力敌人 4 像素/帧 | `Make_Shot`、炮弹属性表 |
| 星级 | 一星加快炮弹；二星允许两发；三星能破坏钢墙；死亡归零，过关保留 | `Bonus_Star`、`Make_Player_Shot` |
| 友军伤害 | 玩家击中队友不会扣命，但冻结 200 次玩家运动处理；出生保护和头盔可抵挡 | `BulletToTank_Impact_Handle`、`Ice_Move` |
| 基地 | 玩家炮弹也能摧毁基地；基地毁坏或所有玩家用尽生命后结束 | `BulletToObject_Impact_Handle`、`FreezePlayer_OnHQDestroy` |
| 闪烁敌人 | 每关第 4、11、18 辆；首次命中掉落道具，装甲敌人仍需后续命中 | `Make_BonusEnemy`、`BulletToTank_Impact_Handle` |
| 道具 | 头盔、时钟、铲子、星星、手雷、坦克；每个 500 分 | `Bonus_JumpTable`、`Bonus_Handle` |
| 道具抽取 | 八个等概率槽依次为头盔/时钟/铲子/星星/手雷/坦克/手雷/星星；最多同时一个 | `BonusNumber_ROM_Array`、`Make_BonusEnemy` |
| 道具坐标 | 两轴分别从 32、80、128、176 中选择，可能出现在水面；避免直接生成在玩家身上 | `Bonus_Appear_Handle`、`Multiply_Bonus_Coord` |
| 道具时间 | 出生保护计数 3，头盔与时钟 10，铲子 20；每 64 帧递减一次，不当作整数秒 | `Invisible_Timer_Handle`、`Motion_Handle`、`HQ_Handle` |
| 手雷 | 摧毁已出生敌人，不影响正在出生者；不额外取得击杀分和击杀统计 | `Bonus_Grenade` |
| 奖命 | 20,000 分获得一次额外生命；坦克道具每次加命 | `Add_Life`、七位得分数组、`Bonus_Life` |
| 统计 | 按四种敌人统计；双人击杀数多的一方加 1,000，平局不加 | 得分画面处理 |
| 周回 | 第 36–70 关重复 35 张地图，使用第 35 关敌人表及间隔；下一周回恢复普通表 | `Level_Mode`、`Load_New_Tank` |
| Construction | 14 种完整/半块地形，A/B 正反切换；按住移动可连续绘制；Start 返回菜单，所画地图替代下一场地图 | `Construction`、`Construct_Draw_TSA`、`Start_Level` |

## 模型接口

`game-model.js` 在 WebView 中导出 `TankGame`，在 Node 中导出 `{TankGame, TILE, WIDTH, HEIGHT}`；`levels.js` 必须先加载。调用 `game.step(dtSeconds, inputs)` 推进，内部固定 60 Hz，并把一次长停顿限制到最多 6 帧，防止网页恢复时突然补算数秒。

每个输入是 `{id:1|2, connected, x, y, a, b, start, select}`。`x/y` 是 -1～1 的方向量。真实界面由 title 菜单开始；`start(inputs)` 仅供集成与测试直接进入游戏。`togglePause()` 供电视宿主暂停；玩家 Start 同样可暂停。选中模式的所有控制器断线时保留战场，重连后继续；此项是局域网手柄的宿主行为。

| 字段 | 含义 |
| --- | --- |
| `phase` | `title/stageintro/playing/paused/results/gameover/construction` |
| `phaseFrames` | 当前阶段已走过的帧数 |
| `stageSelect` | 当前 stageintro 是否等待选关 |
| `stage`、`loop` | 当前 1–35 关、普通/困难周回 0/1 |
| `map` | 52×52 运行时地形；0 空、1 砖、2 钢、3 水、4 树、5 冰 |
| `players` | 两个玩家：中心 x/y、方向 dir（0 上/1 右/2 下/3 左）、lives（含当前生命）、score、stars、alive、joined、connected、spawnFrames、shieldFrames、freezeFrames、moving |
| `enemies` | 敌人类型 type、hp、bonus、中心、方向、出生时间和存活状态 |
| `bullets` | 中心、方向 dx/dy、speed、owner ID、team、steel |
| `powerUp` | 道具 `{type,x,y}` 或 null |
| `base` | `{x:104,y:200,alive}` |
| `remaining` | 尚未出生的敌人数 |
| `stats` | 两个玩家的 basic/fast/power/armor 击杀数、total 和双人 bonus |
| `explosions`、`scorePopups` | 给渲染器的短时效果数据 |
| `events` | 最近事件 `{type,frame,...}`；声音适配器消费并去重 |
| `construction` | 光标 row/col、palette 索引 tile |

## 验证与尚未逐帧一致的部分

运行 `node --test resource/apps/tank/tests/game.test.cjs`。测试覆盖所有地图/敌人表的参考摘要、移动频率、半墙、射击升级、友军冻结、六种道具、计分、选关、编辑、周回、暂停，以及 12,000 帧双人稳定性。

地图、敌人配比与顺序、主要数值和输入含义有逐项依据，但这不等于整个程序与原作逐帧一致：

- 敌人采用同样的随机巡航、追踪玩家、后期攻击基地的阶段，但使用可复现的 xorshift 随机数与独立寻路处理，未复制原作随机数序列和 6502 状态机。
- 墙体破坏用 4 像素碰撞单元和 8 像素破坏范围表达；边缘碰撞顺序未对照 NES 的每一帧执行顺序。冰面的检测和转向也使用独立几何处理。
- 出生/爆炸、幕间、结算、Game Over 的可见时长采用本实现的帧数；没有宣称原作逐周期一致。敌人出生位置被其他敌人占用时会等待，防止实体重叠。
- 原作标题待机的自动演示、隐藏制作人信息和秘籍没有实现。方向键也可操作标题选择，是手机使用上的补充。
- Construction 地图按原作只替代下一场，不替代后续 35 关；当前编辑状态在该游戏会话内保存，不写入电视存储。

这些边界应在后续真机对照中继续缩小，不能用像素画面或相似名称代替玩法、关卡和操作的核对。
