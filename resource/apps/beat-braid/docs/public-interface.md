# Beat Braid — 公开接口

与 `model-contract.md` 同时接受；此处固定字段和值域，不提供操作路线。

## 入口与公共常量

- `PureModel.create(seed=736,difficulty=0)`；`PureModel.step(state,dt,input)` 原位更新当前局，终局/无效dt完整不变。导出方式沿已有game-kit。
- 平铺输入包括 x/y、a/b、aPressed/bPressed、start/select、startPressed/selectPressed、confirm、retry、menuDelta、cancelled、cancelEpoch。只有模型合同所列归一规则生效。
- GameDef `holdConfirmAsA:true`、actions=2。A逻辑左线（手机上区），B逻辑右线（手机下区）；不得宣称新左右半屏、dualFinger字段或共享controller改动已存在。
- 逻辑画布 width=960,height=540。身份 `identity={gameId:36,name:"双线节律",englishName:"Beat Braid",slug:"beat-braid",packageId:"com.ecojust.beatbraidtv",versionName:"0.1.0",versionCode:1,seed,actionCount:2}`。

## 当前状态

基础字段：`width,height,schemaVersion=1,identity,seed,difficulty,level,levelName,scenarioId,phase,tick,elapsed,activeTick,activeElapsed,clockMode,score,lostReason,message,terminal,events`。

phase=playing/won/lost；宿主菜单、暂停在外层host phase。clockMode为步后派生 quarantine/preparing/running；tick累计有效模型调用，activeTick只累计真正运行的节奏步。UI节奏计时/事件距离只用activeTick。总tick不用于计分、期限或拍点位置。

`physics` 深冻结并含模型合同第3节全部共享常量，另含 tapHitScore=10,wovenSegmentScore=100,streakStepScore=20。`scenario` 深冻结：`{id,name,segmentCount,requiredStreak,maxBreaks,deadlineActiveTick,segments}`。id=`beat-braid-1`..`beat-braid-3`；每段配置：

```text
index,id,holdLane,tapLane,expectedCrossing
startActiveTick,endActiveTick,holdStartActiveTick,holdEndActiveTick
pulses:[{id,segmentIndex,localIndex,lane,dueActiveTick,openActiveTick,closeActiveTick}]
```

segment index为0-based，id=`segment-1`起；pulse id全曲1-based，localIndex为0..2。配置的所有时刻都是activeTick。未来公开谱面是玩家能在菜单/预览读到的规则，没有隐藏推荐动作、胜利预计时刻或下一次按键建议。

顶层进度：`segmentCount,requiredStreak,maxBreaks,deadlineActiveTick,currentSegmentIndex,localTick,completedSegments,wovenSegments,breaks,currentStreak,longestStreak,tapHitCount,tapMissCount,chainBonus,segmentStates,currentSegment`。

segmentStates 按全部谱面段顺序保留，不删已完成或未开始项。每项：

```text
index,status                          // pending/active/woven/frayed
holdCheckedTicks,holdMissingTicks,firstMissingActiveTick
holdBroken,faulted,firstFaultActiveTick
tapHits,missedTaps
taps:[{pulseId,status,resolvedActiveTick,resolvedTick,edgeOrdinal}]
```

未解决tap的status=pending，其余三字段为null；hit/missed取对应永久receipt，missed edgeOrdinal=null。firstMissing/firstFault初始null。当前段 `currentSegment={config,state}` 是实际 scenario.segments[currentSegmentIndex] 与 segmentStates[currentSegmentIndex] 的只读视图；无当前项时null。消费者不得改写，导出snapshot须深分离。无需复制一套预测状态。

## 输入与时钟安全状态

`inputState={cancelEpoch,quarantined,recoveryRemainingTicks,aArmed,bArmed,edgeOrdinals:{left,right}}`；创建值 null/true/0/false/false/0/0。`effectiveHeld={left,right}` 创建为false/false，隔离时为false；准备期和运行期为实际a/b。边缘hint不当held。准备期余量允许0..60，只有真正neutral确认才从0置60。

lastInput 初始null。有效调用时为深分离冻结摘要：

```text
tick
raw:{x,y,menuDelta,cancelEpoch,a,b,aPressed,bPressed,
     start,select,startPressed,selectPressed,confirm,retry,cancelled}
x,y,menuDelta,axesValid,menuDeltaValid,cancelEpoch,epochChanged,fullNeutral
quarantinedBefore,quarantinedAfter
recoveryBefore,recoveryAfter,neutralAcknowledged
aArmedBefore,aArmedAfter,bArmedBefore,bArmedAfter
held:{left,right},fresh:{left,right},edgeOrdinals:{left,right}
```

raw 的 x/y/menuDelta/cancelEpoch 为输入有限number原值，否则null；其余为literaltrue判定后的布尔。缺失x/y/menuDelta的默认有效0与显式无效值通过axesValid/menuDeltaValid区分。raw数字不代表归一后的合法值。tick是本次增加后的模型tick。fresh与edgeOrdinals依据当步实际latch处理，隔离/neutral_ack步没有fresh；准备期fresh有真实ordinal但不命中谱面。

## 两类永久收据

`tapReceipts`（最多segmentCount*3项），每项固定字段：

```text
id,segmentIndex,localIndex,lane,result       // result hit/missed
resolvedTick,resolvedActiveTick
dueActiveTick,openActiveTick,closeActiveTick
edgeOrdinal,holdLane,holdEffectiveAtResolution
```

id等于pulseId。hit必须在闭窗口内且tapLane fresh、经线有效held；edgeOrdinal取真实消费边缘。missed必须在closeActiveTick+1，edgeOrdinal=null；holdEffectiveAtResolution保留当步事实而非成功暗示。每个pulse永久只写一次；后续fresh不会覆盖收据。

`segmentReceipts`（最多segmentCount项），每项固定字段：

```text
id,index,result                           // result woven/frayed
resolvedTick,resolvedActiveTick
holdLane,tapLane,expectedCrossing,actualCrossing
holdCheckedTicks,holdMissingTicks,firstMissingActiveTick,firstFaultActiveTick
tapIds,tapHits,missedTaps
breaksBefore,breaksAfter,streakBefore,streakAfter,longestStreakAfter
scoreBefore,scoreAfter,segmentScoreAdded,chainBonusAdded
```

tapIds为本段三个谱面id，scoreBefore为本步段结算前的实际score（已经含此前tap分）。woven的segmentScoreAdded=100、chainBonusAdded=20*streakAfter；frayed两者0。scoreAfter-scoreBefore等于这两个增量和。actualCrossing仅woven时为expectedCrossing，否则null。永久项和嵌套tapIds深分离冻结。

`lastTap,lastSegment` 初始null、每有效step先清空再指向本次新收据；不会同step解决两个拍点，也不会同时点拍与段结算（窗口表保证）。两类收据数组可由Model追加，旧项绝不改写。

## 步摘要与终局

lastStep 初始null，其后每次有效step为冻结副本：

```text
fromTick,toTick,fromActiveTick,toActiveTick,mode
processedSegmentIndex,processedLocalTick
holdChecked,holdPresent,holdMissingAdded
tapReceiptId,segmentReceiptId
scoreBefore,scoreAfter,tapHitsAdded,tapMissesAdded,completedSegmentsAdded
wovenSegmentsAdded,breaksAdded,streakBefore,streakAfter
recoveryBefore,recoveryAfter,terminalAfter
```

mode=quarantine/neutral_ack/preparing/running。非running的processed索引与local为null，holdChecked=false、holdPresent=null、全部游戏增量0，两receiptId=null；running但不在保持区时holdPresent=null。holdMissingAdded为0或1，只有检查经线却未held时为1。toTick=fromTick+1；toActiveTick-fromActiveTick仅running为1，其余0。所有last字段包含真实终局最后一步。

`events` 每项仅含 `{type,tick,activeTick}`，type 为 hit/woven/frayed/win/lose；按实际处理顺序追加：点拍 hit、段 woven/frayed、终局 win/lose。missed 不单独产生音效事件，事件不额外携带预测或重复收据字段。

terminal=null或`{reason,endedTick,endedActiveTick,completedSegments,breaks,longestStreak}`。reason=braid_complete/broken_threads/continuity_not_met；lostReason仅后两者或null。结束在真正段结算tick，不因为恢复准备归零、达到分数或满足最长连续提前结束。终局后任何调用冻结整个状态。

## Renderer、普通输入与独立证据边界

Renderer依实际activeTick和公开窗绘制正在接近的拍点；不能按动画直接授予命中。必须把经线/点拍线、当前有效held、准备倒计时、已经hit/missed、段缺陷与已结算断线区分。点拍hit不等于整段woven；编带交叉只从真实segmentReceipts画出。暂停与恢复显示两个不同状态，节奏时间不能在准备期间倒走或偷偷流逝。

普通自动玩家按当前公开窗口和角色局部反馈，不读取私有见证或生产函数内部。独立审计可把原始输入的held区间与公开保持区求交、核对fresh边缘和互不重叠窗口、核算固定段边界/最长连续/计分；必须区分tick和activeTick，记录暂停或准备造成的步差，不重演生产Model。浏览器双指测试应使用真实controller两pointerId及实际发送消息，不把mock TV bridge等同实体手机或电视实测。
