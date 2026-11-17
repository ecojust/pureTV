# Metronome Gates — 公开接口

与 `model-contract.md` 一并定义公开接口。字段为公开事实，没有推荐动作、已解路线或隐藏胜利时间。所有坐标对象都是 `{x,y}`，数组顺序除特别说明外稳定。

## 入口、配置与基本状态

- `PureModel.create(seed=737,difficulty=0)`、`PureModel.step(state,dt,input)`、`PureModel.snapshot(state)`。step 返回原 state；snapshot 返回下列全部公共状态的深分离冻结副本。导出沿既有 game-kit。
- 输入字段：x,y,a,b,aPressed,bPressed,start,select,startPressed,selectPressed,confirm,retry,menuDelta,cancelled,cancelEpoch；归一见模型合同。
- GameDef actions=2、holdConfirmAsA=true；方向排队，A 等待，B 撤尾。手机沿用真实摇杆及现有上下 A/B 大操作区，不增加新手势或共享 controller 字段。
- width=960、height=540、schemaVersion=1；identity=`{gameId:37,name:"节拍闸道",englishName:"Metronome Gates",slug:"metronome-gates",packageId:"com.ecojust.metronomegatestv",versionName:"0.1.0",versionCode:1,seed,actionCount:2}`。

基础字段：`width,height,schemaVersion,identity,seed,difficulty,level,levelName,scenarioId,phase,tick,elapsed,beatNo,beatPhaseTicks,ticksUntilBeat,beatBudget,beatsRemaining,score,lostReason,message,terminal,events`。

phase=playing/won/lost；菜单/暂停属宿主 phase。lostReason=null/closed_gate/trap/beat_budget。message 是纯展示文案，不是规则输入。所有初始时钟为 0（ticksUntilBeat=72）、beatsRemaining=beatBudget、score=0、lostReason/terminal=null。

`physics={ticksPerSecond:60,ticksPerBeat:72,queueCapacity:6,neutralAxisThreshold:0.35,directionAxisThreshold:0.55,markerScore:100,winScore:1000}`。

`scenario={id,name,cols:13,rows:11,grid,start,exit,markers,traps,gates,beatBudget}`。grid 为公开地图 11 个原始行字符串；start/exit 为坐标；markers 按公开 m1…顺序为 `{id,x,y}`，traps 按公开顺序为坐标，gates 按字母顺序为 `{id,x,y,period,openResidues}`。配置与 physics/identity 深分离冻结。levelName=scenario.name，scenarioId=scenario.id；预算对应 48/64/62。

## 玩家、队列与门

`player={x,y}` 初始 scenario.start；`collectedMarkerIds=[]`，收集顺序保留、无重复；`markerCount=scenario.markers.length`、`collectedCount=collectedMarkerIds.length`、`exitUnlocked=(collectedCount===markerCount)`。出口状态只由收集事实决定。

`queue=[]`，元素固定为 `{id,kind,queuedTick,source,edgeOrdinal}`：id 为成功入队的递增正整数；kind=up/right/down/left/wait；source=direction/a；edgeOrdinal 对应当时输入计数。命令及其嵌套值冻结，queue 数组本身可由 Model push/shift/pop。`nextCommandId=1` 起，每次成功入队后加 1；拒绝/撤销/执行不减少或增加它。

`gateStates` 按 gates 顺序为：

```text
id,period,openResidues
currentBeatNo,openNow,nextBeatNo,openNext
preview:[{beatNo,open}]
```

currentBeatNo=state.beatNo；nextBeatNo=beatNo+1；preview 的拍号依次为 beatNo+1…beatNo+min(6,beatsRemaining)，无剩余预算时空。openNow 在首拍前按 beat 0 运算，并不代表首次进入可用；UI必须明确标出“下一拍”。gateStates 是每步后完整一致的派生视图，无独立可修改门时钟。

## 输入事实

`inputState={cancelEpoch,quarantined,directionArmed,aArmed,bArmed,edgeOrdinals:{direction,a,b}}`，初值 null/true/false/false/false/0,0,0。

lastInput 初始 null，每有效 step 生成深分离冻结摘要：

```text
tick
raw:{x,y,menuDelta,cancelEpoch,a,b,aPressed,bPressed,
     start,select,startPressed,selectPressed,confirm,retry,cancelled}
x,y,menuDelta,axesValid,menuDeltaValid,cancelEpoch,epochChanged,fullNeutral
mode                                      // quarantine / neutral_ack / active
quarantinedBefore,quarantinedAfter,neutralAcknowledged
armedBefore:{direction,a,b},armedAfter:{direction,a,b}
direction                                 // null / up / right / down / left
fresh:{direction,a,b},edgeOrdinals:{direction,a,b}
```

raw 数字只保留输入有限 number 原值，否则 null；按钮为 literal true 归一布尔。缺失轴/菜单项的默认有效 0 与显式无效通过 validity 区分。direction 是该步有效轴达到 0.55 时的主轴候选，即使未 armed 也可有值；隔离/neutral_ack 时 direction=null。fresh.direction 为布尔；真正入队 kind 使用 direction 候选。所有 tick 是本次增加后的 tick。fresh/ordinals 来自真实闩处理，不受容量拒绝回滚。

## 两银行永久收据

queueReceipts 创建为空。每个 B/方向/A fresh 按处理顺序追加一条；id 从 1 连续递增，不因成功与否改变：

```text
id,tick,beatNo,source,edgeOrdinal           // source=b/direction/a
operation,requestedKind,result            // operation=undo/enqueue
command                                   // 完整命令副本或 null
queueBeforeIds,queueAfterIds
```

undo 的 requestedKind=null，result=undone/empty；undone.command 是被撤队尾，empty.command=null。enqueue 的 requestedKind=方向或 wait，result=enqueued/full；enqueued.command 是新命令，full.command=null。beatNo 是编辑时尚未执行本 tick 拍点的拍号。队列 id 数组包括所有实际项，拒绝时前后相同。每个 fresh 恰一条，无 fresh 不伪造收据；cancel 不编辑队列、不单独造此银行项。

beatReceipts 创建为空，每拍一条，id=beatNo，从 1 起：

```text
id,tick,beatNo,remainingBefore,remainingAfter
queueBeforeIds,queueAfterIds
command,action,waitSource                  // command完整副本或null
from,candidate,to,targetCell,outcome
gateCheck                                 // null或{id,period,residue,open}
collectedMarkerId,markersBeforeIds,markersAfterIds
scoreBefore,scoreAfter,terminalReason
```

command 为实际弹出的命令；action 是其 kind，空队为 wait。waitSource=explicit/empty/null（方向时 null）。queueBefore 是本 tick 编辑结束、取队首之前；queueAfter 是取队首之后。remainingBefore=beatBudget-(beatNo-1)，remainingAfter=beatBudget-beatNo。from/candidate/to 都为坐标，等待 candidate=from；targetCell 为候选格的原始字符，越界为 null，等待为当前格字符。

outcome=moved/blocked/waited/closed_gate/trap。gateCheck 仅方向候选为门时非 null，residue=beatNo%period；开门、闭门都保留检查事实；原地等待在门上不产生 gateCheck。闭门 to=from，陷阱 to=candidate；blocked to=from。collectedMarkerId 为本拍新收集 id 或 null。markersBefore/After 按实际收集顺序。terminalReason 为本拍实际终局原因或 null；门/陷阱/预算与胜利优先级照合同。

两银行的项和全部嵌套数组/对象深分离冻结。`lastQueueReceipts=[]` 每有效调用先清空，再按本步真实新增项排列，最多三项；`lastBeat=null` 每有效调用先清空，仅边界时指向新 beat 收据。可指向银行冻结项，snapshot 须仍深分离。完整历史不能被 last 字段替代。

## 步摘要、终局与 events

lastStep 初始 null；每有效 step 生成深分离冻结副本：

```text
fromTick,toTick,fromBeatNo,toBeatNo
phaseTicksBefore,phaseTicksAfter,inputMode
queueBeforeIds,queueAfterIds,queueReceiptIds,beatReceiptId,consumedCommandId
positionBefore,positionAfter,markersBeforeIds,markersAfterIds
scoreBefore,scoreAfter,terminalAfter
```

此 queueBefore 是整个 step 输入前，queueAfter 是所有编辑与可选边界结算后；queueReceiptIds 可为 0..3 个 id，beatReceiptId 非边界为 null，consumedCommandId 无消费命令（含空队边界）为 null。inputMode 等于 lastInput.mode。terminalAfter 为最终 reason 或 null。toTick=fromTick+1，toBeatNo-fromBeatNo 仅 0/1；真实最后终局一步必须留下完整摘要。

terminal=null 或 `{reason,tick,beatNo,position,markerIds,beatsRemaining,commandId}`，reason=all_markers_exit/closed_gate/trap/beat_budget。commandId 是终局拍消费命令 id，空队则 null；position 与 markerIds 为最终深分离冻结事实。lostReason 只在 lost 时等于 reason。

events 项仅 `{type,tick,beatNo}`，type=enqueue/undo/reject/beat/marker/win/lose；顺序按合同实际发生。empty/full 对应 reject。每个边界恰一个 beat，标记恰有新收集才有 marker，终局仅一个 win 或 lose；事件不承担判定，也不代替永久收据。

Renderer 可读取全图、门未来公开周期、当前球、队列与最后收据；禁止读取或自造胜利路线。普通浏览器输入证据应保留每次真实调用的原 input、dt、完整当前队列与 last 摘要。独审可按实际拍点和事件索引压缩重复银行前缀，但不能删掉当前 mutable 字段或把前缀压缩冒充缺失事件。
