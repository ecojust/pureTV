# Pulse Vault — 模型合同

本合同定义第 35 款，不允许实现者用隐藏补能、时间跳变、逐关路线或提前结算代替规则。只导出 `PureModel.create(seed=735,difficulty=0)` 与 `step(state,dt,input)`，复用当前游戏壳。

## 身份、时间与公共常量

create 接受非负安全整数 seed，difficulty 仅为整数 0、1、2；省略/undefined 使用默认值，其他值抛 RangeError。seed 不改变场景。`width=960,height=540,level=difficulty+1`。phase 为 playing/won/lost，起始 playing；tick=0，elapsed=tick/60。

active 的正 dt 必须有限且与 1/60 相差不超过 1e−12，否则在任何状态写入前抛 RangeError。dt=0 完整不变；terminal 状态的调用完整不变。每个有效 active 调用恰好推进一个 tick，包括终局调用。没有 wall-clock 补算、批次脉冲或额外 transactionCount。

共享常量：capacityEU=72；doseOptionsEU=[12,24,36,48,60]；initialDoseIndex=1；initialEnergyEU=0；initialHeatHU=0；heatLimitHU=100；captureHeatHU=8；overflowHeatPerEU=2；dischargeHeatDivisor=6；coolEveryTicks=30；coolHU=1；axisThreshold=.55。

场景如下，数组均为固定 authored order，所有数据须作为冻结副本公开：

| id | name | periodTicks | pulsePatternEU | pulseCount | lockThresholdsEU | reserveEU | deadlineTick |
| --- | --- | --- | --- | --- | --- | --- | --- |
| steady-current | 均流试验 | 180 | [12] | 18 | [24,36,24,48] | 12 | 3600 |
| twin-crest | 双峰接力 | 180 | [8,16] | 20 | [36,24,48,36] | 16 | 3840 |
| triple-beat | 三拍深锁 | 150 | [18,6,12] | 21 | [48,36,60,24] | 18 | 3600 |

第 k 脉冲 tick=k*periodTicks，量=pattern[(k−1)%length]，k=1..pulseCount。最后一脉冲之后 nextPulse=null。pulseCursor 为已处理数量，初始 0；每到达一次严格加 1，A 未按住也必须加 1。在每个完整公开状态中，pulseCursor=min(pulseCount,floor(tick/periodTicks))。

## 当前状态

公开 `schemaVersion=1,identity,seed,difficulty,level,levelName,scenarioId,scenario,physics`。identity、scenario、physics 是冻结副本；当前状态自身可由 Model 更新。

identity 的精确字段为 `{gameId:35,name:"脉冲储库",englishName:"Pulse Vault",slug:"pulse-vault",packageId:"com.ecojust.pulsevaulttv",versionName:"0.1.0",versionCode:1,seed,actionCount:2}`，其中 seed 为 create 实际接收的种子。physics 另显式包含 `ticksPerSecond:60`，其余字段为合同列出的全部共享常量；这是已定 60 Hz 的公开单位，不增加新的时间规则。

资源字段：`energyEU,heatHU,doseIndex,selectedDoseEU,charging,pulseCursor,currentLockIndex,openedCount,locks`。selectedDoseEU 必须等于 doseOptionsEU[doseIndex]；charging 是最近实际间隔的有效 A，不是粘滞开关。currentLockIndex 为首个未开的索引，全部开启后等于 locks.length；openedCount=currentLockIndex，是同一事实的显式计数，不能独立累加。

locks 初始四项 `{id:'lock-1'..'lock-4',thresholdEU,status:'closed',openedAtBoundaryTick:null,openedByDischargeId:null,acceptedEU:0}`。status 仅 closed/open。成功时 status=open、acceptedEU=thresholdEU，并记录真实 B 起点 tick 和该放电收据 ID。没有 partial/accumulated 状态；当前门之前的门必须全 open，之后全 closed。

公开不可变常量 `capacityEU,heatLimitHU,reserveEU,deadlineTick,doseOptionsEU`。另公开 `energyLedger:{offeredEU,harvestedGrossEU,missedEU,dischargedEU,overflowLostEU,usefulToLocksEU,dischargeWasteEU}` 和 `thermalLedger:{captureAddedHU,overflowAddedHU,dischargeAddedHU,cooledHU}`，初始各 0。

恒等式始终成立：

- offeredEU=harvestedGrossEU+missedEU。
- energyEU=initialEnergyEU+harvestedGrossEU−dischargedEU−overflowLostEU，且 0<=energyEU<=72。
- dischargedEU=usefulToLocksEU+dischargeWasteEU。
- usefulToLocksEU=sum(open lock.thresholdEU)，每个 open lock.acceptedEU=thresholdEU，closed 为 0。
- heatHU=initialHeatHU+captureAddedHU+overflowAddedHU+dischargeAddedHU−cooledHU，heatHU>=0。热量不伪造夹取到 100，失败状态保留实际超限量。

`supply:{nextPulse,remainingPulseCount,futureSupplyEU,minimumSpendEU,requiredEU,optimisticAvailableEU,feasibleByEnergy}` 是当前事实视图，不是策略。nextPulse 为 null 或 `{index,dueTick,amountEU,ticksUntil}`；index 为 1-based。minimumSpendEU 对剩余门逐项取 minDose 后求和，requiredEU=minimumSpendEU+reserveEU，optimisticAvailableEU=energyEU+futureSupplyEU，feasibleByEnergy 使用 >=。

还需公开 `score,lostReason,message,terminal,lastInput,lastDischarge,lastPulse,lastCooling,lastStep,inputState,dischargeReceipts,pulseReceipts`。后三个 last 事件为本调用局部事件，没有发生则为 null；稳定显示最近事件应读永久数组，不复用旧 last 字段。lastStep 只存最新真实一步。

## 输入归一化与隔离

input 是现行 runtime 直接传入的平铺对象，可缺省。x/y 直接取 input.x/input.y；有限数字夹取[-1,1]，其他归零；轴 token 为 x>=.55 则1、x<=−.55 则−1，否则0，y 同理。按钮/cancel 只接受 literal true。epoch 直接取 input.cancelEpoch，仅有限数字有效；首次有限 epoch 相对于 null 也算变化。不得改为嵌套 move/actions 或依靠隐式适配器。

rawA=input.a，rawAPressed=input.aPressed；rawB=input.b，rawBPressed=input.bPressed。有效原始 A 为 rawA OR rawAPressed，**只对这次调用**生效；aPressed 不创建跨调用的充能标志。原始 B 为 rawB OR rawBPressed，受独立 bArmed latch 管理；取消直接取 input.cancelled。

inputState 初始 `{cancelEpoch:null,quarantined:true,bArmed:false,axisArmed:false}`。cancelled=true 或有限 epoch 改变：记录新 epoch，隔离置 true，bArmed/axisArmed 置 false；本调用 A/B/方向全部抑制，charging=false，但时钟、错过脉冲和冷却照常推进。

其后非取消调用只有完整中立才能解除隔离：两轴 token 均0，rawA/rawAPressed/rawB/rawBPressed全 false。此调用解除隔离并重武装 bArmed/axisArmed，但不执行动作、也不充能。取消帧即使全部零不能解除隔离。

非隔离时，A有效便在本次间隔 charging=true，无额外锁存；B原始false重武装，B原始true且bArmed才 freshB，随后解除 bArmed。方向 tokenX=0重武装轴；非零且axisArmed才新拨一档，随后解除 axisArmed，方向直接反号不能替代回中。选档夹取0..4不循环；即使在端点被夹取也消耗该次拨动。

Y 不改变档位，但参与完整中立确认。A 持续充能期间仍允许横轴回中后再拨、B松开后再放；日常独立 latch 重武装不要求 A 也松开，只有取消隔离的解除需要完整中立。

host pause 不调用 step，整个状态和时钟必须逐字冻结。resume 采用既有 cancel/epoch/neutral 过程，没有补收暂停期间的脉冲或补冷却。

GameDef 必须设置既有 `holdConfirmAsA=true`，使游玩中的遥控确认/Enter按住与空格、手机A同为连续充能。进入游玩时 Model 的初始隔离仍要求中立样本；菜单开始的长按不得自动收能。此项是现有壳的游戏配置，不修改共享 runtime，也不添加另一个生命周期接口。

## 放电原子动作（边界 t）

方向选择先于 B。一次 freshB 拷贝当前门与新选档位。判定顺序：

1. currentLockIndex==locks.length：result=no_current_lock，spent/useful/waste/heatAdded 均0。
2. energyEU<selectedDoseEU：result=insufficient_stock，所有上述量均0，不局部释放、不积累。
3. 否则 spentEU=selectedDoseEU，energyEU-=spentEU，热加 spentEU/6。
4. 若 spentEU<thresholdEU：result=below_threshold，usefulEU=0，wasteEU=spentEU，当前门保持闭合。
5. 否则 result=opened，usefulEU=thresholdEU，wasteEU=spentEU−thresholdEU，只将这一个门改 open，currentLockIndex 加1。

能量与热账按实际 spent/useful/waste 增量更新。一次 B 收据必然只带一份起点 target；即使所有后门阈值合计小于 excess，也不能再次迭代。B 在 t 的账户结算之后尚未处理 t+1 脉冲。

dischargeReceipts 为永久深分离冻结数组项，1-based严格连续 ID；包括无当前门、库存不足的尝试。每项为 `{id,boundaryTick,selectedDoseIndex,selectedDoseEU,targetIndex,targetBefore,targetAfter,result,energyBeforeEU,energyAfterEU,spentEU,usefulEU,wasteEU,heatBeforeHU,heatAddedHU,heatAfterHU,currentLockIndexBefore,currentLockIndexAfter}`。targetIndex 是当时 currentLockIndex；无当前门时 targetBefore/After=null。库存不足和低于阈值时 targetBefore/After 内容相等。开放成功的 targetAfter 已带 openedByDischargeId=本项 id。

## 间隔端的供能与冷却（新边界 t+1）

若新 tick 等于下一 dueTick，严格处理这一脉冲一次：offeredEU+=Q，pulseCursor+=1。charging=false 则 missedEU+=Q，其余能量与热量不变。charging=true 则 harvestedGrossEU+=Q，overflow=max(0,energyBeforeEU+Q−72)，energyAfterEU=energyBeforeEU+Q−overflow，overflowLostEU+=overflow；热量加8+2*overflow，同时把两项分别加入 thermalLedger。

pulseReceipts 为永久深分离冻结项，ID=index=1..pulseCount。每项 `{id,index,endedTick,amountEU,charging,result,energyBeforeEU,harvestedGrossEU,missedEU,overflowLostEU,energyAfterEU,heatBeforeHU,captureAddedHU,overflowAddedHU,heatAfterHU}`。result 是 missed/collected/overflow；按是否收取与 overflow>0 唯一决定。missed 项各热增量、harvestedGrossEU、overflowLostEU为0；收取项 missedEU=0。记录 pulse 后、cool 前的实际热量。

若新 tick%30==0，实际 cooledHU=min(1,heatHU)，从 heat 减去、向总账加上。lastCooling 为 `{endedTick,heatBeforeHU,cooledHU,heatAfterHU}`，包括 heat=0 的零冷却事实。其他步 lastCooling=null。无需保存每步冷却数组；独立审计可按已知30tick格点和事件之间分段冷却计算。

本次 peakHeatHU 为起点热量、放电后热量、脉冲后热量三者最大值，至少包含起点。不被冷却后的数值覆盖。有效 active call 结束后 recompute supply 当前视图，随后终局：

1. peakHeatHU>=100：phase=lost,lostReason=overheat。
2. 全门开且energyEU>=reserveEU：phase=won,lostReason=null。
3. optimisticAvailableEU<requiredEU：phase=lost,lostReason=energy_exhausted。
4. tick>=deadlineTick：phase=lost,lostReason=deadline。
5. 否则仍 playing。

terminal 为 null 或 `{reason,endedTick,peakHeatHU}`；win reason=reserve_ready。所有终局 endedTick 等于当前 tick。最后门可先开后等储备；恰在期限到达的储备可赢；同步超热优先失败。energy_exhausted 是必要总能量不足，不能声称除此以外都可解。

score：playing/lost 为 100*openedCount；won 为 1000+100*openedCount+energyEU（四门时1400+实际终储备）。不因热量/浪费负扣积分；规则本身惩罚能量浪费。重试 create 同场景，还原一切时钟、门、账本、输入锁和历史，设置/最高分由壳处理。

## 可独立核对的一步摘要

lastStep 为冻结深分离 `{fromTick,toTick,doseIndexBefore,doseIndexAfter,energyBeforeEU,energyAfterEU,heatBeforeHU,heatAfterHU,peakHeatHU,charging,dischargeId,pulseId,cooling,currentLockIndexBefore,currentLockIndexAfter,energyLedgerDelta,thermalLedgerDelta,supplyAfter,terminalAfter}`。toTick=fromTick+1；没有事件的 ID 为 null，cooling 与本次 lastCooling 内容相同。账本 delta 来自真实 before/after，不用预测未来或重播来填。

lastInput 须记录原始与归一化 axes、原始held/pressed旗标、rawEpoch/cancelEpoch、epochChanged、quarantinedBefore/After、neutralAcknowledged、effectiveA、freshB、freshAxis、axisStep 与边界 tick。effectiveA 专指隔离处理后的实际 charging；原始 OR 可由 rawA/rawAPressed 得到。freshAxis 表示消耗一次新拨动，axisStep 是夹取后的实际 doseIndex 增量，故端点拨动时可 freshAxis=true 而 axisStep=0。非有限原始数字在公开快照中用 null 表示，归一化有效值仍有限；receipt 与 lastStep 不得引用后续会改变的 locks/账本对象。

energyLedgerDelta / thermalLedgerDelta 的 key 集合分别与对应总账完全相同，每项为本次真实 after-before。lastDischarge、lastPulse、lastCooling 在每个有效 active 调用开头清空；无本次事件则为 null。dt0 与 terminal 调用连这些局部字段也完全不改变。

## 必须分开的后续验证

正式边界测试可使用清楚标注的隔离夹具；不得作为正常通关录像或普通证据。至少覆盖：到达前/恰到达/到达后、先放后收容量与不可花未来脉冲、低档全浪费、超量只开一门、库存不足零扣款、终门后继续补储备、等号可行、未来供给排除已错过与已到达、capacity严格上限、溢流总账只扣一次、热量先越100再冷却到99仍失败、热/赢/能量/期限优先、取消A不粘连、B/方向独立latch与完整neutral隔离、暂停全冻结、重复terminal/dt0全不变、重试、收据深分离。

三关各一普通胜和一普通负，正常操作来源与合成夹具分开。独立审计消费已有普通观测、供能闭式序列、放电账本与分段冷却，不导入生产 Model 或重新运行游戏。模型和自动玩家不能读取作者私有手算路线。最终浏览器候选图与实际运行录像要另行核对，不能以纯模型测试代替。
