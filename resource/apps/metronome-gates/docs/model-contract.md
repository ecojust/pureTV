# Metronome Gates — 模型合同

本合同与 `public-interface.md` 共同定义规则；地图与精确门表见 `public-design.md`。

## 1. 身份与唯一时钟

`PureModel.create(seed=737,difficulty=0)`；seed 为有限 number 时截断，否则用 737；difficulty 有限时截断夹取 0..2，否则 0；level=difficulty+1。seed 不改变地图、门相位或生成隐藏障碍。identity、scenario、physics 深分离冻结。

`step(state,dt,input)` 原位更新并返回 state。仅 phase=playing 且 dt 为有限正 number 时有效；每次有效调用恰好 tick+1，不按 dt 大小积分。宿主固定 60 Hz。无效/非正 dt 或终局调用是完整 no-op，包括 events、所有 last 字段、输入闩和永久收据。`elapsed=tick/60`，没有第二套运行时钟、墙钟补拍或恢复准备时间。

创建 tick=0、beatNo=0；`beatPhaseTicks=tick%72`，`ticksUntilBeat=72-beatPhaseTicks`。仅当新 tick 是 72 的正整数倍时消费一拍，先令 beatNo+1。门按这个新 beatNo 判定。`beatsRemaining=beatBudget-beatNo`，范围 0..beatBudget；预算耗尽当拍结算后失败，不出现负数或第 budget+1 拍。无论队列是否为空，每拍都消耗预算。

暂停由宿主停止 step，保留所有模型字段与拍内余量；恢复无赶拍。输入取消/epoch 变化只隔离新输入，不冻结拍钟、不清队列。断线若宿主没有实际进入 pause，既有队列仍会按拍执行，不能把隔离宣传为暂停。

## 2. 输入归一与 fresh

实际平铺输入为 x/y、a/b、aPressed/bPressed、start/select、startPressed/selectPressed、confirm、retry、menuDelta、cancelled、cancelEpoch。按钮只认 literal true。缺失 x/y 为有效 0；显式非 number 或非有限值归一显示为 0，但 axesValid=false。有限轴夹到 [-1,1]；x 正右负左，y 正下负上。

menuDelta 缺失为有效 0；显式非有限/非 number 则显示 0、menuDeltaValid=false。cancelEpoch 缺失或无效为 0，有限值取 floor(max(0,value))。fullNeutral 要求 axesValid、两轴绝对值均 <=0.35、menuDeltaValid 且为 0、上述所有按钮与 cancelled 均 false。confirm/start/select/retry 不作为局内 A/B 别名，宿主先处理它们。

初始 inputState：cancelEpoch=null、quarantined=true、directionArmed=false、aArmed=false、bArmed=false，三个 edgeOrdinals 为 0。每个有效 step 先归一输入；epoch 改变或 cancelled=true 时更新 epoch、设 quarantined=true、三个 armed=false。若当步是 fullNeutral，可以同 tick 确认中立：quarantined=false、三个 armed=true，mode=neutral_ack，本步不产生 fresh。仍隔离时 mode=quarantine，无 fresh。两个模式仍推进本局拍钟。

非隔离普通输入 mode=active：

- 方向只用一个 armed。有效轴都在 <=0.35 的中立框才重武装；直接从左拨到右或上下转向不重武装。armed 且 max(abs(x),abs(y))>=0.55 时产生一次方向 fresh，立即卸武装。取绝对值较大的主轴；相等时纵轴优先。比如 x=y=0.55 是 down。无效轴既不重武装也不触发；0.35<主轴绝对值<0.55 的带区不重武装、不触发。direction 候选可显示，但没有 fresh 不入队。
- A/B 独立：该键 held 与 pressed 均 false 时重武装；armed 且二者之一 true 时 fresh，随即卸武装。held 与 pressed 同真仍只算一次；持续 held 或重复 pressed 不连发；另一键和方向保持不阻止本键释放重武装。
- 每个真实 fresh 使对应 direction/a/b ordinal+1；即使满队或空队拒绝也消耗这个 fresh。隔离或 neutral_ack 不增加 ordinal。

## 3. 队列编辑与同 tick 顺序

容量 6，命令 kind 为 up/right/down/left/wait，FIFO。方向 fresh 请求其方向；A fresh 请求 wait；B fresh 请求撤队尾。命令 id 只在成功入队时从 1 连续增加，撤销不回收 id。每个命令记录 queuedTick、source、edgeOrdinal；对象深分离冻结。

每个有效 step 先清 events、lastQueueReceipts 和 lastBeat，再执行输入归一/fresh，然后严格执行：

1. B fresh：非空时移除队尾并写 undone 收据；空时写 empty 收据。
2. 方向 fresh：有容量时追加并写 enqueued；满时保留全队并写 full。
3. A fresh：同样尝试追加 wait，写 enqueued 或 full。
4. tick 前进一格，更新派生时钟；若到拍边界，按第 4 节消费一拍。

上面所有收据 queuedTick/tick 均使用本次的新 tick，虽然编辑语义先于该 tick 的边界消费。满队不能预借同 tick 即将出队的空间：若 B 没释放容量，方向/A 先遭 full；随后边界仍正常取旧队首。B 可以在拍点取消原队尾；队列仅一项时也会取消那项。B 不撤销历史移动、标记或已结算的拍。

## 4. 拍边界唯一结算

令 beatNo 增 1，记录当拍编辑后的 queueBefore，非空则移出队首，空则生成不占 commandId 的 implicit wait。显式 wait 与 implicit wait 均不移动并消耗一拍。每拍至多处理一个命令、一步格子；队列的其余项不预执行。

方向命令的 candidate 是 from 加一个单位向量，按以下顺序决定结果：

1. 越界或 `#`：blocked，位置保留，游戏继续等待后续判定；不退还命令或拍数。
2. 目标为门：用本次 beatNo 与公开 period/openResidues 检查。闭门 outcome=closed_gate、位置保留在 from，立即 lost/closed_gate。开门可正常进入。只检查进入目标格，离开已关闭的原门不受限；wait 或 blocked 原地也不重新检查原门。
3. 合法可入目标：位置立即提交为 candidate。若为 X，outcome=trap、立即 lost/trap；真实球停在陷阱格。其他可入格 outcome=moved。wait 则 candidate=from、to=from、outcome=waited，不检查当前格门。
4. 非致命结果后，若当前位置有未收集标记，收集一次。已收集标记格仍是普通可行走格，重复踩入不计分。不在陷阱/闭门失败后补收集。
5. 非致命且全部标记已收集、当前位置是出口，则 won/all_markers_exit。提前经过出口仅当普通地面，不会清空或补齐标记。最后预算拍也允许此胜利。
6. 仍未终局且 beatsRemaining=0，则 lost/beat_budget。顺序即 **闭门/陷阱优先 → 合法位置与标记 → 合格出口胜利 → 预算失败**；不存在到时优先夺走最后一拍合法胜利。

计分只为公开结果：score=100*已收集标记数 + (phase=won ? 1000 : 0)。没有时间奖励、隐形连击或提前不可达判断。终局保留所有未执行队列项以供复核；后续任何 step 不更改一字节状态。

## 5. 事实、预览与永久收据

每个 fresh 编辑恰有一条 queueReceipts；每个真正消费的拍恰有一条 beatReceipts。两银行只追加，旧项与所有嵌套值深分离冻结，不能覆盖或删除。queue 收据包括拒绝和空撤；beat 收据绑定真正取出的 command 或 implicit wait、实际 from/candidate/to、目标门检查、标记变化及终局。不能只保留成功或最终状态。

`gateStates` 的 openNow 对应已完成的 beatNo，openNext 对应 beatNo+1；preview 按接下来最多 6 个预算内绝对拍号列出开闭。它们是公开周期运算，不是路线规划。所有门共用 beatNo，step 内不会出现门各自先走一拍的中间可观察状态。

`lastInput`、`lastStep`、本步 `lastQueueReceipts` 与 `lastBeat` 必须来自实际处理，不得用预测重建。events 只供 UI/声音，创建为空，每次有效 step 清空；按执行顺序追加 enqueue/undo/reject，边界 beat，然后真实 marker，再 win 或 lose。每项仅 `{type,tick,beatNo}`；队列事件的 beatNo 用编辑时尚未消费的新拍前拍号，beat/marker/终局用已消费后的拍号。

公共 snapshot 逐字段包含当前状态、完整待执行队列、两银行和 last 摘要；返回深分离冻结副本，读取不会改变模型。Renderer 不授予移动/收集/胜负。普通玩家只能通过公开页面输入和公开地图/状态玩；独立核验以实际输入/收据、整数拍日历与 FIFO 前缀核算，不导入生产模型或私有路线。
