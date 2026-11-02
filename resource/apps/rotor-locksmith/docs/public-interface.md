# 旋环锁匠 — 公开接口

状态：公开规则已接受；实现与实际验证结果另行记录。与 `model-contract.md` 一起使用；参数取 `public-design.md`。公开状态不含推荐动作、路线或隐藏通关窗口。

## 入口、不可变参数与基本状态

`PureModel.create(seed=738,difficulty=0)`、`PureModel.step(state,dt,input)`、`PureModel.snapshot(state)`。导出模式沿 game-kit；step 返回原 state，snapshot 返回以下全部字段的深分离冻结副本。width=960，height=540，schemaVersion=1。GameDef actions=2、holdConfirmAsA=true；方向提示为“左右拨转外环”，A 为“推进 A（上区）”，B 为“退回 B（下区）”。

identity=`{gameId:38,name:"旋环锁匠",englishName:"Rotor Locksmith",slug:"rotor-locksmith",packageId:"com.ecojust.rotorlocksmithtv",versionName:"0.1.0",versionCode:1,seed,actionCount:2}`。

physics 固定：

```text
ticksPerSecond:60, timeBudgetTicks:5400
startRadius:210, coreRadius:18, exitRadius:210
initialDurability:4, baseRadialSpeed:7.5, resistanceSpeedPenalty:0.5
ringHalfThickness:5
emptyProbe:{radialHalfLength:2,angularHalfWidthDegrees:2}
keyProbe:{radialHalfLength:4,angularHalfWidthDegrees:5}
neutralAxisThreshold:0.35,driveAxisThreshold:0.55
radialBoundaryMargin:1e-9,angularBoundaryMarginDegrees:1e-9
independentNumericComparisonTolerance:1e-8
keyScore:100,winScore:1000
```

scenario=`{id,name,outerRateDegreesPerSecond,rings}`，rings 按 outer/middle/inner 顺序，每项 `{id,radius,halfThickness:5,gapHalfWidthDegrees,initialAngleDegrees,gearRatio}`。三关全部具体参数见公共设计表，不按 seed 改变。identity、physics、scenario 都深分离冻结。

基础状态字段：

```text
width,height,schemaVersion,identity,physics,scenario
seed,difficulty,level,levelName,scenarioId
phase,mission,tick,elapsed,remainingTicks,remainingSeconds
probeRadius,driveAngleDegrees,hasKey,durability,resistance,radialSpeed
score,lostReason,message,terminal,events
inputState,rings,probeEnvelope
contactReceipts,travelReceipts,lastInput,lastStep,lastContact,lastTravelReceipts
```

初态：phase=playing、mission=approach、tick=0、elapsed=0、remainingTicks=5400、remainingSeconds=90；probeRadius=210，driveAngleDegrees=0，hasKey=false，durability=4，resistance=0，radialSpeed=7.5，score=0；lostReason/terminal/lastInput/lastStep/lastContact 为 null，所有银行/lastTravelReceipts/events 为空。levelName=scenario.name，scenarioId=scenario.id。

## 当前几何和控制状态

`probeEnvelope={radialHalfLength,angularHalfWidthDegrees,innerRadius,outerRadius}`；前两值取当前 hasKey 的公开包络，后两为 probeRadius±radialHalfLength。不存在另一个不可见的“完整钥匙半径”。世界角固定 0°，无需旋转探头状态。

rings 每项为完整当前派生视图：

```text
id,radius,halfThickness,gapHalfWidthDegrees,initialAngleDegrees,gearRatio
unwrappedAngleDegrees,angleDegrees
effectiveInnerRadius,effectiveOuterRadius,effectiveSafeHalfWidthDegrees
wrappedGapOffsetDegrees,probeAngularlyClear,probeRadiallyInside
```

unwrappedAngleDegrees=initialAngleDegrees+gearRatio*driveAngleDegrees；angleDegrees=wrap360(unwrappedAngleDegrees)。effective 三字段就是合同的 L/U/W，以当前包络计算。wrappedGapOffsetDegrees 在 [-180,180)，+180 规范成 -180；probeAngularlyClear 当存在整数 k 使当前未取模角在 [360k-W,360k+W]；probeRadiallyInside 当 L<probeRadius<U。二者是当前几何展示，**不是整个下一 tick 的安全许可**。

inputState=`{cancelEpoch,quarantined,impactLocked}`，初值 null/true/false。requested 与 effective 控制只在 lastInput/lastStep 显示，本作没有输入队列、一次点击自动过环或动作路线字段。

lastInput 初值 null，每有效 step 生成：

```text
tick
raw:{x,y,menuDelta,cancelEpoch,a,b,aPressed,bPressed,start,select,
     startPressed,selectPressed,confirm,retry,cancelled}
x,y,menuDelta,axesValid,menuDeltaValid,cancelEpoch,epochChanged,fullNeutral
mode                         // active / neutral_ack / quarantine / impact_lock
quarantinedBefore,quarantinedAfter,impactLockedBefore,impactLockedAfterInput
neutralAcknowledged
requested:{drive,radial,a,b}
effective:{drive,radial,a,b}
```

raw 数字只留输入中有限 number 原值，否则 null；缺失默认有效 0 与显式无效由 validity 区分。raw 按钮是 literal true 的布尔值。requested.a/b 是 held||pressed 的归一结果，drive/radial 为它们提出的 -1/0/+1 意图；effective 在隔离 / 接触制动 / neutral_ack 时 drive=radial=0、a=b=false，active 则等于 requested。impactLockedAfterInput 只记录输入阶段是否仍锁定；本 tick 新撞击在 lastStep.impactLockedAfter 及最终 inputState 中体现。

## 本 tick 的全部真实检查

lastStep 创建 null；每有效 step 写一份深分离冻结摘要：

```text
fromTick,toTick,inputMode,requested,effective
probeRadiusBefore,rawTargetRadius,candidateRadius,probeRadiusAfter
driveAngleBefore,plannedOuterDeltaDegrees,actualOuterDeltaDegrees,driveAngleAfter
motionFraction,hasCollision,primaryRingId,tiedRingIds,contactReceiptId
envelopeBefore,envelopeAfter
ringMotion:[{id,unwrappedAngleBefore,angleBefore,plannedDeltaDegrees,
             actualDeltaDegrees,unwrappedAngleAfter,angleAfter}]
ringChecks:[...三环检查]
durabilityBefore,durabilityAfter,resistanceBefore,resistanceAfter
radialSpeedBefore,radialSpeedAfter,hasKeyBefore,hasKeyAfter
missionBefore,missionAfter,scoreBefore,scoreAfter
quarantinedAfter,impactLockedAfter,travelReceiptIds,terminalAfter
```

rawTargetRadius=r0+dr（未 clamp），candidateRadius=clamp(rawTargetRadius,18,210)，probeRadiusAfter=r(λ)。motionFraction=λ 是合同数值规范后的实际共同提交 fraction。解析候选 λ0 可由所有 ringChecks.firstUnsafeFraction 的非 null 最小值独立推导，全部为 null 时 λ0=1，无需新状态字段。通常 λ=λ0；仅安全起态的候选回代落墙内时，按合同向 0 取最近安全可表示值且 λ0-λ<=1e-8。无碰撞的候选 1 同样适用，因此其实际 motionFraction 也可略小于 1，但 hasCollision 仍为 false，不能为此产生 hit。radius 即使先到 18/210 停住，角仍可走到实际 λ。actualOuterDeltaDegrees=plannedOuterDeltaDegrees*λ，ringMotion.actualDeltaDegrees=gearRatio*actualOuterDeltaDegrees。terminalAfter 为 reason 或 null。

envelopeBefore / envelopeAfter 都严格采用 probeEnvelope 的四字段形状。envelopeBefore 的尺寸按旧 hasKey，innerRadius / outerRadius 以旧 r0 为中心；envelopeAfter 的尺寸按本 tick 结算后的 hasKey，innerRadius / outerRadius 以实际提交的 r(λ) 为中心。取钥匙 tick 的 before / after 尺寸因此不同，不能只复制旧包络。

每项 ringCheck 如下，必须来自实际那一次候选连续运动计算，不能只从终点反推：

```text
id,effectiveInnerRadius,effectiveOuterRadius,effectiveSafeHalfWidthDegrees
unwrappedAngleBefore,plannedDeltaDegrees
radialInterval                 // null或{start,end,startIncluded,endIncluded}
angleAtIntervalStart,angleAtIntervalEnd
safeComponentIndex            // 整个radialInterval安全时的整数k，否则null
firstUnsafeFraction           // 无碰撞null，有则infimum(B_i)
unsafeComponent               // null或{start,end,startIncluded,endIncluded}
```

radialInterval 是 `{f∈[0,1]:L<r(f)<U}` 的完整时间交集。r(f) 单调或常数，因而至多一个区间；空则 null。角度两端是该区间边界时刻的未取模角，即使边界不包含也记录其极限值；radialInterval=null 时两角也为 null。startIncluded/endIncluded 指该时间点是否同时属于 [0,1] 和严格径向带。只有单点且实际位于带内的退化情况应按集合定义处理，不能把空集写成非空碰撞。

safeComponentIndex 仅整个径向交集（含其极限边界，等号安全）落在同一 `[360k-W,360k+W]` 时给 k；无径向交集时 null。unsafeComponent 是候选 B_i 的第一个非空连通分量，边界包含性严格按合同；当前最大角步和 W 保证一个 tick 不可能跨过两个完整周期，但不能以两个 wrap 值代替这个区间。firstUnsafeFraction=unsafeComponent.start，始终保存解析首根，不用数值规范后的 motionFraction 改写。正常始态安全；形式测试若显式设成已重叠实体的局部 fixture，应得到 f=0 不安全且实际 λ=0，不对该起态作不可能的安全化，也不能把这种 fixture 写成普通游玩。

## 永久接触银行

contactReceipts 只在真实发生碰撞时追加一项，id 从 1 连续递增，每有效 step 至多一项；并令 lastContact 指向本项。没有接触的有效 step 将 lastContact 置 null。

```text
id,tick,fraction,primaryRingId,tiedRingIds
radialDirection,driveDirection,hasKey,envelope
probeRadiusBefore,rawTargetRadius,candidateRadius,probeRadiusAtContact
driveAngleBefore,plannedOuterDeltaDegrees,actualOuterDeltaDegrees,driveAngleAtContact
ringChecks,ringMotion
durabilityBefore,durabilityAfter,resistanceBefore,resistanceAfter
impactLockedAfter:true,terminalReason
```

fraction 是规范后的实际共同提交 λ，等于本 tick motionFraction；解析最早首根仍在所附 ringChecks 中，可与实际 λ 比较规范缩减上限。radialDirection/driveDirection 为本 tick effective 意图。probeRadiusAtContact 和 driveAngleAtContact 是实际提交值。terminalReason 只在本次撞击直接耗尽耐久时为 durability；否则 null，即使本 tick 随后因为时限失败。接触发生前/后的库存不变，钥匙不丢失；返回、暂停、取消输入不删银行。是否追加本项只看严格 B_i 碰撞分类，不能因为无碰撞路径发生数值缩减而制造接触项。

contact.envelope 同样是 probeEnvelope 的四字段形状，尺寸由本 tick 旧 hasKey 决定，innerRadius / outerRadius 以实际接触中心 r(λ) 为锚；它不是 r0 处的 before 包络，也不是整段运动的并集。

## 永久径向和任务银行

travelReceipts 从空开始，仅追加实际事件；id 从 1 连续递增。统一条目形状：

```text
id,tick,fraction,kind                // boundary / key-acquired / key-extracted / lost
ringId,boundary,direction            // 非boundary为null；boundary=inner/outer
radius,driveAngleDegrees,hasKeyBefore,hasKeyAfter
endpointReachedFraction             // 仅key-acquired/key-extracted为number，其余null
scoreBefore,scoreAfter,reason        // reason仅lost为durability/timeout，其余null
```

boundary 只表示真实到达当前有效几何边界，不声称已完成穿环。其 direction 精确取本 tick effective.radial 的数值 -1（向内）或 +1（向外）；其他 kind 的 direction 为 null，不使用方向字符串。对每环 L/U，若向内实际路径满足 `r0>edge && rAfter<=edge`，或向外满足 `r0<edge && rAfter>=edge`，则在真实径向达到 edge 的 f 写一项（必须 f<=规范后实际 λ）。从恰在边界出发不会重复发“到达”项；一次触边后反向离开不会伪造一次完整穿越。停在边界的多个 tick 也不重复计。无径向移动不产生 boundary；候选 λ0 曾抵达、但实际 λ 缩减后尚未抵达的边界也不产生 boundary。

同 tick boundary 按 fraction 升序、同 fraction 按环顺序、再 inner/outer 稳定排序；此后才追加 key-acquired、key-extracted 或 lost。boundary 时刻的 q=q0+dq*f；hasKeyBefore/After 都是本 tick 初始值，scoreBefore/After 都是当时已提交旧得分。全时刻路径由每 tick lastStep 独立核查，银行仅保留这些离散已发生事实。

key-acquired 和 key-extracted 是合同规定的 tick 末资格结算，fraction=1、radius 为 18/210、driveAngleDegrees 为该 tick 末实际 q；endpointReachedFraction 单独保存 r(f) 首次抵达端点的 f。若旧 r0 已在被结算端点，则该值为 0，包括 dr=0 的情况；否则为真实的 `(endpoint-r0)/dr`，不能除以 0 或用 clamp 后两端线性插值代替。hasKey 和 score 前后与实际结算一致。它们不能冒称 phase 在提前抵达的 f 就改变。取钥匙只发生一次。若恰在最后预算 tick 取钥匙，银行按 key-acquired、lost/timeout 顺序追加，保留 hasKey=true、mission=return、score=100。

lost/durability 的 fraction=接触 λ，lost/timeout 的 fraction=1；位置和 q 都是该 tick 已提交最终值。碰撞非致命但随后 timeout 时只有一个 lost/timeout。lost 的 hasKeyBefore=hasKeyAfter，score 不变。

lastTravelReceipts 每有效 step 先清空，再依序包含本步新增项；两银行的项及嵌套数组/对象均冻结，snapshot 还需深分离。没有永久逐 tick 快照副本或重复完整路径，避免浏览器采样不断放大历史体积。

## 终局与展示事件

terminal 初值 null；终局为 `{reason,tick,fraction,probeRadius,driveAngleDegrees,hasKey,durability,resistance,score}`。reason=key-extracted/durability/timeout；fraction 与对应 travelReceipt 一致。lostReason 仅 phase=lost 时等于 reason，否则 null。终局同一状态再被 step 时必须完整 no-op。

events 是短展示项 `{type,tick,fraction}`。type=boundary/hit/key/win/lose；顺序为实际 boundary 项，然后 hit（若有），最后实际任务结算事件。key 和 lose 可在最后预算 tick 依此顺序同时出现；win 和 lose 不可同时出现。无碰撞时不写 hit；没有任务变更时不写 key/win；最后预算 tick 不产生双重终局。声音 / 光效只能消费这些真实事件，不能负责规则判定。

Renderer 可读全部当前几何、lastStep 真实接触、库存与输入锁状态；不得读取 Model 函数、作者路线、预测碰撞结果或隐藏获胜时间。普通回放证据保存每次真实 input/dt/完整当前 mutable 字段与 last 摘要；允许只对已经追加的银行做前缀压缩，不得省略真实运动区间。
