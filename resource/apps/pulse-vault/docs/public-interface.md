# Pulse Vault — 公开接口

对应 [模型合同](model-contract.md)；这里固定生产模型、renderer、普通自动玩家与独立证据读取者共享的字段，不提供路线或未来动作。

## 入口与宿主

- `PureModel.create(seed=735,difficulty=0)`：纯创建当前场景，缺省值与合法域见合同。
- `PureModel.step(state,dt,input)`：有效 active 正调用恰好一 tick；不返回隐藏策略。使用现行壳的调用方式，不要求增加生命周期或 audit export。
- **input 是平铺** `{x,y,a,b,aPressed,bPressed,cancelled,cancelEpoch}`。不使用 input.move 或 input.actions。
- GameDef 使用现有 `holdConfirmAsA=true`，让游玩中的遥控确认/Enter持续映射 A；空格和手机 A 同样按住收能。菜单确认开始、P/START暂停、R重试仍由壳处理。开始与恢复的旧按住输入须经 Model 中立隔离。
- `phase` 是 playing/won/lost；菜单/暂停属于 host phase。host 暂停不调用 step。

## 当前公共状态

基础字段为 `width=960,height=540,schemaVersion=1,seed,difficulty,level,levelName,scenarioId,phase,tick,elapsed,score,lostReason,message,terminal`。冻结身份为 `identity,scenario,physics`；scenario 带合同三关表的全部对应值，physics 带全部共享能量、热与输入常量。

identity 的精确字段为 `{gameId:35,name:"脉冲储库",englishName:"Pulse Vault",slug:"pulse-vault",packageId:"com.ecojust.pulsevaulttv",versionName:"0.1.0",versionCode:1,seed,actionCount:2}`，其中 seed 为 create 实际接收的种子。physics 另显式包含 `ticksPerSecond:60`，其余字段为合同列出的全部共享常量；这是已定 60 Hz 的公开单位，不增加新的时间规则。

当前资源为 `energyEU,heatHU,capacityEU=72,heatLimitHU=100,reserveEU,deadlineTick,doseOptionsEU,doseIndex,selectedDoseEU,charging,pulseCursor,currentLockIndex,openedCount,locks`。openedCount=currentLockIndex；四门全开后二者为4，仍可能等待储备。doseOptionsEU 为冻结 `[12,24,36,48,60]`，selectedDoseEU=doseOptionsEU[doseIndex]，初始doseIndex=1。

`locks` 每项 `{id,thresholdEU,status,openedAtBoundaryTick,openedByDischargeId,acceptedEU}`；ID 固定 `lock-1`..`lock-4`，顺序不变。没有积累型门进度；closed acceptedEU=0，open acceptedEU=thresholdEU。

`energyLedger` 精确 key 集合：`offeredEU,harvestedGrossEU,missedEU,dischargedEU,overflowLostEU,usefulToLocksEU,dischargeWasteEU`。

`thermalLedger` 精确 key 集合：`captureAddedHU,overflowAddedHU,dischargeAddedHU,cooledHU`。energy 和 heat 分开守恒；收取总量为 gross，漏损单扣，冷却只扣实际存在热量。

`supply` 精确字段：

```text
nextPulse: null | {index,dueTick,amountEU,ticksUntil}
remainingPulseCount
futureSupplyEU
minimumSpendEU
requiredEU
optimisticAvailableEU
feasibleByEnergy
```

所有字段使用当前 tick 的事实；nextPulse.index 1-based，dueTick>tick，ticksUntil=dueTick−tick。remainingPulseCount=pulseCount−pulseCursor。futureSupplyEU 只计当前 tick 之后未到达且不晚于期限的脉冲；minimumSpendEU 是所有 closed 门的最小足档之和，requiredEU 再加 reserve，optimisticAvailableEU=energyEU+futureSupplyEU，feasibleByEnergy 使用 >=。禁止加未来推荐档位、预计B时刻或解法轨迹。

terminal 为 null 或 `{reason,endedTick,peakHeatHU}`，reason 为 reserve_ready/overheat/energy_exhausted/deadline。lostReason 仅后三种或 null。终局都拥有真实最后一步，endedTick=tick；peakHeatHU 保留冷却前越线事实，HUD/失败说明可据此解释当前温度已冷却但已触发过热。

## 输入状态与可观察的本步输入

`inputState:{cancelEpoch,quarantined,bArmed,axisArmed}`，初始 null/true/false/false。

`lastInput` 初始 null，每次有效 active 调用变为以下冻结普通数据：

```text
boundaryTick
rawX,rawY,x,y,axisX,axisY
rawA,rawB,rawAPressed,rawBPressed
cancelled,rawCancelEpoch,cancelEpoch,epochChanged
quarantinedBefore,quarantinedAfter,neutralAcknowledged
bArmedBefore,bArmedAfter,axisArmedBefore,axisArmedAfter
effectiveA,freshB,freshAxis,axisStep
```

rawX/rawY/rawCancelEpoch 的非有限或缺省项为 null；有限原始值保留，x/y 是归一化后的有限数字。按钮与 cancelled 仅 literal true 变成true，其他为false。effectiveA 是实际允许的充能，不是 raw OR；charging=effectiveA。freshAxis 代表本次消耗了轴新拨动，axisStep 是实际新旧 doseIndex 差，端点夹取可为0。完整中立解除隔离和独立 latch 的普通重武装必须按合同区分。

## 永久事件与一步摘要

`dischargeReceipts` 和 `pulseReceipts` 是当前局永久事件数组；各项及嵌套对象深分离冻结，后续状态不可回写它们。数组本身可由 Model 追加实际事件。不得为了限制历史而删除已有收据；一局最多有 deadlineTick 次B尝试，脉冲不多于21，边界均有确定上界。

discharge item：

```text
id,boundaryTick,selectedDoseIndex,selectedDoseEU
targetIndex,targetBefore,targetAfter,result
energyBeforeEU,energyAfterEU,spentEU,usefulEU,wasteEU
heatBeforeHU,heatAddedHU,heatAfterHU
currentLockIndexBefore,currentLockIndexAfter
```

result=no_current_lock/insufficient_stock/below_threshold/opened。targetBefore/After 是锁完整副本或 null，单次只有一个 target。id 连续1-based；openedByDischargeId 指向同一次成功收据。

pulse item：

```text
id,index,endedTick,amountEU,charging,result
energyBeforeEU,harvestedGrossEU,missedEU,overflowLostEU,energyAfterEU
heatBeforeHU,captureAddedHU,overflowAddedHU,heatAfterHU
```

result=missed/collected/overflow；id=index 按公开供能表递增。heatAfterHU 是 pulse 后、cool 前，不能被最后状态温度替换。

`lastDischarge,lastPulse,lastCooling` 初始 null，本次无事件也为null；前两者引用本次冻结收据，lastCooling 为 `{endedTick,heatBeforeHU,cooledHU,heatAfterHU}`。每30tick一次，包含热量为0的实际零冷却。稳定最近事件提示从永久数组读取，不把旧事件标成“本步”。

`lastStep` 初始null，其后为：

```text
fromTick,toTick,doseIndexBefore,doseIndexAfter
energyBeforeEU,energyAfterEU,heatBeforeHU,heatAfterHU,peakHeatHU,charging
dischargeId,pulseId,cooling,currentLockIndexBefore,currentLockIndexAfter
energyLedgerDelta,thermalLedgerDelta,supplyAfter,terminalAfter
```

toTick=fromTick+1；事件ID无则null。cooling与本次lastCooling内容相等。两个ledgerDelta逐字段使用对应完整账本key集，值是实际after-before。supplyAfter/terminalAfter是本步末端深分离副本。dt0和终局调用完整不变，包括所有last字段。

## Renderer 与证据的边界

Renderer 只读取实际 state：能量液位、独立温度、选择档、当前门阈值、已开顺序、有限脉冲时间轴和真实最近事件。不再运行供能/热模型，也不根据动画推开门。以一图集批量呈现，DOM显示中文和数值；菜单/暂停必须完整显示四门、脉冲模式、容量、储备和危险阈值。

普通自动玩家只可用公开规则与当前观察做局部反馈，不能读取作者私有见证、Model函数内部、预录输入或完整未来步骤。正式测试、普通输入、独立分析和浏览器运行应分别记录来源。独立分析从既有永久事件、整数供能前缀与分段冷却审计资源，不复跑生产游戏。
