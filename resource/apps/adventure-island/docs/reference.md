# Adventure Island TV — reference and implementation scope

[应用说明 / App README](../README.md) · [English README](../README.en.md)

## 参考对象与来源

本应用以第一代 **Adventure Island / 高桥名人的冒险岛**（1986 年 Famicom/NES 作品）的玩法为参考。它是独立 JavaScript/Canvas 重写，不运行 ROM，不包含从商业游戏提取的图像、地图、声音或代码，也不声称是原作官方发行版。

公开规则参考：[Adventure Island (video game), Gameplay](https://en.wikipedia.org/wiki/Adventure_Island_(video_game)#Gameplay)。核对内容包括 8 地区 × 4 小关、体力、食物、斧头与火球、蛋、滑板、石头、隐藏奖励以及每地区末尾的首领；具体实现以随应用公开的 `game-model.js` 为准。

**地图采用重建坐标，非逐像素原关移植。** 物理常量、体力减少周期、敌人轨迹、道具位置和音符由本项目独立设计，没有从原作程序或 ROM 逆向提取。

## 已实现的核心规则

| 项目 | 本应用行为 |
| --- | --- |
| 结构 | 8 个地区，每地区 4 小关，共 32 关；第 4 小关包含首领，最终首领后抵达终点进入结局 |
| 移动 | 左右移动；按住 B 加速，按下 A 起跳，持续按住 A 获得较高跳跃；画面单向向右滚动 |
| 体力 | 每命初始 11 格，上限 16；正常每 110 个模拟帧减少一格，茄子状态每 25 帧减少一格；体力耗尽失命 |
| 食物 | 香蕉、苹果、葡萄、西瓜回复 2 格并加分；牛奶补满并解除茄子状态 |
| 武器 | 每命初始徒手；斧头沿抛物线飞行；已有斧头时火球道具升级为火球，无武器时先得到斧头；同时最多两枚投射物 |
| 火球 | 比斧头射程长，碰地面可反弹，能够破坏岩石与滚石；斧头不能破坏这些障碍 |
| 蛋 | 碰到可见蛋或两次武器命中后破壳，内容先弹出再落地，需角色接触才能取得；滑板道具会向前滚动，掉入深坑或留在屏幕后方的道具会消失；隐藏蛋可通过在其位置起跳揭示，武器命中也会揭示 |
| 滑板 | 自动向前移动，B 加速、向左减速；抵挡一次普通碰撞后损坏；不能防止掉坑、落水或体力耗尽 |
| 障碍 | 小石头扣两格体力并短暂绊倒；火焰、敌人、首领及敌方投射物导致失命；不能通过踩踏消灭敌人 |
| 蜜蜂精灵 | 提供 600 帧接触无敌，可碰撞消灭普通敌人；仍需避免坑、水及体力耗尽 |
| 隐藏奖励 | 隐藏陶壶使关末剩余体力奖励翻倍；部分隐藏蛋包含会加快体力消耗的茄子 |
| 隐藏云朵 | 武器经过隐藏云点会消失并留下短暂闪光；在该处站稳 90 帧后云朵升起，带角色进入水果奖励段。奖励段水果统一 500 分，仍补充体力；落下不会失命，返回原关下一检查点并保留武器、滑板及原地图已拾取状态 |
| 敌人 | 蜗牛、蛇、鸟、蝙蝠、蜘蛛、青蛙、鱼、滚石具有不同移动方式，含巡逻、振翅、垂降、跳跃与滚动；飞鸟接近时锁定目标高度俯冲，随后抬升飞离，躲避后不会持续追踪角色 |
| 检查点 | 每关四个安全落脚点；失命后从当前玩家最近检查点继续，体力恢复 11，武器和滑板失去 |
| 首领 | 每地区第 4 关，只有头部受武器伤害；生命值从 8 递增至 22，射击间隔及移动速度随地区提高 |
| 计分与生命 | 吃食物、命中/击败敌人与首领、过关取得积分；50,000、100,000、200,000 分分别奖励一命 |
| 结局 | 第 8 地区末关击败首领并走到终点后显示岛屿获救画面；START 返回标题 |

模拟固定为 60 Hz，渲染帧率变化不改变规则速度。长时间失焦不会一次补算大量游戏时间。

## 32 关路线组成

路线不是随机生成的；每关在源码中明确安排。森林树冠、阶梯、海岸短岛、瀑布跳台、冰地、洞穴低顶、熔岩火焰、遗迹与夜间沼地使用不同平台高度、坑宽、地表摩擦、敌人与道具组合。下表的顺序对应 `AdventureGame.ROUTES`：

| 地区 | 第 1 小关 | 第 2 小关 | 第 3 小关 | 第 4 小关（首领） |
| --- | --- | --- | --- | --- |
| 1 | 草地→树冠→桥→草地→阶梯 | 海岸→桥→瀑布→海岸→沼地 | 洞穴→遗迹→阶梯→洞穴→桥 | 树冠→草地→遗迹→桥→阶梯 |
| 2 | 阶梯→树冠→桥→沼地→草地→树冠 | 瀑布→海岸→桥→沼地→海岸→阶梯 | 冰地→阶梯→桥→冰地→瀑布→遗迹 | 洞穴→遗迹→熔岩→阶梯→桥→洞穴 |
| 3 | 沼地→树冠→阶梯→桥→树冠→草地 | 夜路→桥→沼地→夜路→遗迹→瀑布 | 海岸→瀑布→阶梯→沼地→桥→海岸 | 遗迹→熔岩→洞穴→桥→阶梯→熔岩 |
| 4 | 冰地→瀑布→桥→阶梯→冰地→遗迹 | 树冠→沼地→桥→树冠→阶梯→草地 | 夜路→遗迹→桥→夜路→瀑布→阶梯 | 熔岩→洞穴→阶梯→遗迹→熔岩→桥 |
| 5 | 树冠→桥→沼地→阶梯→树冠→瀑布→草地 | 瀑布→海岸→沼地→桥→瀑布→海岸→阶梯 | 冰地→阶梯→瀑布→冰地→桥→遗迹→冰地 | 遗迹→洞穴→熔岩→阶梯→桥→熔岩→洞穴 |
| 6 | 夜路→沼地→桥→遗迹→夜路→瀑布→树冠 | 阶梯→树冠→瀑布→沼地→桥→树冠→草地 | 海岸→桥→瀑布→阶梯→沼地→海岸→瀑布 | 熔岩→遗迹→阶梯→洞穴→桥→熔岩→遗迹 |
| 7 | 冰地→瀑布→阶梯→桥→冰地→遗迹→瀑布 | 夜路→遗迹→沼地→桥→树冠→夜路→瀑布 | 树冠→桥→阶梯→沼地→瀑布→树冠→遗迹 | 洞穴→熔岩→遗迹→阶梯→熔岩→桥→洞穴 |
| 8 | 树冠→阶梯→桥→沼地→瀑布→遗迹→树冠 | 瀑布→沼地→海岸→桥→阶梯→瀑布→海岸 | 冰地→遗迹→瀑布→阶梯→桥→冰地→瀑布 | 熔岩→遗迹→洞穴→桥→熔岩→阶梯→遗迹→熔岩 |

## 独立实现的边界

- 背景、角色、敌人、首领、图标均为本项目自绘像素图；配乐是新编写的短 8-bit 合成循环，音效通过 Web Audio 生成，不是原作旋律或录音。
- 路线的地形坐标、敌人和道具排列不同于原版。隐藏云朵的探查、停留召出、奖励水果及无损返回流程已实现，但每关云点位置和共用的八平台奖励路线为独立重建；并未还原原版所有秘密奖励位置、续关秘籍及逐帧敌人行为。
- 云朵等待 90 帧、升空 60 帧、奖励段暂停体力计时以及返回时 60 帧保护是本项目的调校选择，不宣称与原版时序完全一致。主关体力和茄子状态在返回后继续，不能把奖励段出口当作过关或跳过首领。
- 首领采用同一攻击状态机，随地区改变外观配色、血量、移动和火球节奏；不是原版八个首领逐像素移植。
- 蛋壳碎片、道具弹出/落地、滑板滚动以及拾取分数采用独立绘制的动画；弹出速度、拾取窗口和飞鸟俯冲参数由项目自行调校，未宣称逐帧一致。
- 原作单人规则以外，**两部手机轮流挑战属于本应用扩展**：各自保存本局生命、积分、关卡和检查点；一方失命后轮到另一方，生命耗尽者跳过。不会同屏同时操纵两名角色。
- 当前玩家手机断线自动暂停；等待玩家断线不打断游戏；手动暂停不会被自动重连取消。
- 本局进度不跨应用退出保存。最高分与音乐开关保存在应用本地存储。退出、Home 离开时服务和进程清理由 Android 宿主执行。

## 可验证接口和测试范围

模型公开 `step(dt, inputs)`、`status()`、`players`、`phase`、`current()`；`activePlayer` 是 1 或 2。`loadStage(index, checkpoint)` 接受从 0 开始的关卡索引，`status().stage`/`level` 则从 1 开始，`stageLabel` 使用 `1-1` 至 `8-4`。`finishStage()` 和 `loseLife(reason)` 使用正常过关/失命过渡，供回归测试复用。

运行：

```sh
node --test resource/apps/adventure-island/tests/game-model.test.cjs
```

自动测试区分了不同证据，不把受控测试说成完整实机通关：

1. **32 关地形可达性**：通过真实移动与可变高度跳跃积分器走过每条完整路线，地形不修改；为单独证明跳跃可达性，测试移除敌人、道具并补充体力。
2. **前两关完整规则通关**：从出生点使用普通方向、A、B 输入走到终点，保留全部敌人、障碍、体力消耗、道具与武器规则。
3. **8 个首领正常战斗**：测试从各首领区域设置初始位置并取得斧头，其后仅使用方向和 B 输入；保留真实投射物、碰撞、首领 AI、伤害间隔和体力，击败首领并走过出口，最后一关进入结局。
4. 另测破蛋远程命中不自动装备、道具弹出落地与一次拾取、滑板滚动和落坑、飞鸟锁定俯冲与离屏休眠，以及体力/食物、石头和火焰、斧头/火球、滑板、隐藏蛋、接触无敌、额外生命、关末奖励、双人独立进度、断线与手动暂停。
5. **隐藏云朵流程**：用实际投射物查探、停留与升空触发奖励段，验证 500 分水果、无损返回与装备保留、32 关入口安全及下一检查点、暂停/断线与玩家状态隔离；奖励路线另外用普通移动/跳跃输入走过全部八个平台并从末端落下返回，没有在路线中修改坐标。

浏览器测试另验证手机多点触控、TV 桥接、启动诊断和退出时音频/定时器释放。截图来自浏览器实际渲染；尚不等于 Android 电视和真实手机的实机验证。

## English implementation summary

This app independently recreates the core rules of the **first Adventure Island**. It contains 32 deliberately composed stages across eight areas, continuous vitality loss, fruit/milk, axes/fireballs, visible/hidden eggs, a skateboard, rocks/fire, multiple enemy movement types, four checkpoints per stage, head-only boss damage, and a final ending.

**Maps use reconstructed coordinates, not tile-for-tile original stage data.** Terrain, physics, item placement, enemy motion, artwork, sound effects and music are independently authored. No ROM, extracted sprite/map data, commercial recording or original soundtrack is bundled. The public gameplay reference is [Wikipedia's Adventure Island gameplay overview](https://en.wikipedia.org/wiki/Adventure_Island_(video_game)#Gameplay).

Hidden cloud spots now absorb thrown weapons, appear after standing still, and lift Higgins into a fruit bonus route. Each bonus fruit gives 500 points; falling returns to the next main-stage checkpoint without losing a life or equipment. Bonus layouts and secret positions are independently reconstructed. Waiting/lift durations, frozen vitality during the bonus and a short return grace period are project tuning, not verified original frame timings. Still missing: every original secret location, continuation cheats, exact frame timing and original boss sprite sheets. Eggs release physical pickups with a visible upward arc, landing and contact collection; skateboard pickups roll forward. Birds commit to a target height for their dive and then climb away. Two-phone alternating play is a project extension to the single-player game, with separate lives, scores, stages and checkpoints. Only losing the active controller auto-pauses play.

Tests prove terrain reachability through the real movement integrator on all 32 routes (combat and energy isolated), ordinary-input completion of the first two stages with full rules, and ordinary-input defeats of all eight bosses from an explicitly seeded arena position and axe pickup. Boss tests retain real vitality, damage windows and projectiles and walk through the exit. These are automated model/browser checks, not a claim of a complete physical-TV playthrough.

## 0.5.2 源码：按首代画面整理 HUD

本轮观察 [Wikipedia 所示 NES 实际游戏画面](https://en.wikipedia.org/wiki/Adventure_Island_(video_game))（[截图](https://upload.wikimedia.org/wikipedia/en/d/d9/Adventure_Island_%28NES%29_gameplay.gif)）：分数居中、体力短条与左上生命头像直接叠在场景上。渲染器据此移除本项目自加的深色 P/HI/武器仪表条，改用本作单独绘制的 8px 数字、生命头像和细分体力条。分数、生命与体力继续读取原有模型，低体力颜色提示保留；本轮不修改玩法、地形或 256×240 原生画布比例。

该公开图为缩小后的参考，不能证明精确 CHR 像素、颜色和全部关卡 HUD 坐标。本轮只恢复已能确认的构图；人物、敌人、场景、调色与具体像素仍属项目自绘近似，不能由 HUD 调整推出整作已经视觉精确复刻。现代暂停/连接提示仍用项目字体。`tests/renderer.test.cjs` 验证透明叠加、原生坐标边界、生命头像与体力显示；控制截图仅用于检查实际 Canvas 绘制。
