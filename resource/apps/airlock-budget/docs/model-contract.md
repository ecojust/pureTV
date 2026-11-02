# 气闸值守：公开模型合同

本合同描述第23款的公开规则。定量设计可行性已通过独立脚本有限枚举；该设计结果不代替生产模型、普通输入、浏览器或实体设备测试。

## 三舱与批次

- B `WAITING` 是外侧真空待援舱，压力0，三组人员初始均在B。
- A `AIRLOCK` 是唯一气闸，容量12氧单位，初始满气且无人。压力为当前气量/12。
- C `SAFE` 是第三个、安全舱，固定压力1；不是额外的第四舱。抵C人员从本任务呼吸统计退出，C不提供预算气体。
- 救援服仅说明人员可通过低压B/A；没有另一个未展示的服内氧气库。所有尚未抵C的人员持续从同一有限储罐耗氧。
- B门只允许A压力0且C门关闭时打开；C门只允许A压力1且B门关闭时打开。人数和位置只在真实载入/送达完成事件改变一次。

## 少量决定，自动安全操作

左右选择 `G1/G2/G3/leak` 四项，上下按同样前后次序，边界钳制。空闲B切换 `recover/vent`；A启动所选未撤离组，或启动漏点封堵。已救组不可重复启动。

批次是一个保留身份的事务：`recover或vent → load → fill → unload`。

1. 关好两门，以所选方式把A清空。
2. 到0才打开B门，载入耗时2秒；完成时所选组由B迁到A并关门。
3. 唯一泵从罐向A充气；到满才打开C门。
4. 送达耗时2秒；完成时所选组由A迁到C并关门，事务结束。A保留实际满气。

事务运行时B停止设备/转运计时，A恢复同一事务、同一人员、同一模式；不得退款、重置进度或丢弃人员。停止时呼吸、漏气、人员期限和任务时钟继续；独立P暂停入口才冻结整个模拟。连续按住A/B不重复触发。

同一时刻仅一个批次或封堵事务。泵在 `recover/fill/isolate` 阶段占用，在 `vent/load/unload` 阶段不转气。任务选择不能在运行中切换到另一事务；停止后也必须恢复原事务。

漏点是B服务支路对外泄漏，不是新的舱。封堵是泵驱动阀作业，实际运行3秒后关闭该支路，下一完整区间起停止漏失。人员供氧使用独立救援服总管，不因封堵支路增加或减少另一个库存。

## 通量与账本

固定步长1/60秒，任务最多90秒。所有流量按实际数量封顶，不允许负库存或容量溢出。

| 项目 | 数值 |
|---|---:|
| A容量 | 12 |
| 回收：A流出速率 | .75/秒 |
| 回收效率 | .9 |
| 快排：A流出速率 | 6/秒 |
| 充气：罐→A | 3/秒 |
| 漏失：罐→外部 | .5/秒，未封堵时 |
| G1 / G2 / G3呼吸 | .14 / .10 / .08 每秒 |
| 载入 / 送达 / 封堵 | 2 / 2 / 3 秒 |

回收A流出量=`min(.75dt, A气量, (罐容量−罐库存)/.9)`；罐入账为流出量的.9，差额计效率损失。罐满时泵受限而不是丢弃可回收空气。充气量=`min(3dt, 罐库存,12−A气量)`。快排量=`min(6dt,A气量)`，全部成为永久排气损失。

预算总账：`initialTotal = tank.oxygen + A.air + breathing + leak + vent + recoveryLoss`。
`recoveredTransferred` 是实际净回罐量，`filledTransferred` 是实际罐→A量；均为内部转移审计量，不再从总账扣一次。A移出总量=净回罐量+回收效率损失。
储罐满时的限流必须真实延长回收，不能仅显示一个“满”标志。

## 每个完整区间的顺序

1. 在新tick处理一次输入，恢复/停止不追补过去时间。
2. 依当前阶段计算实际设备通量；暂停中的事务通量和进度为0。
3. 按区间开始时的漏点状态扣实际漏失。
4. 按区间开始时尚未抵C人员计算呼吸需求；有不足则按各组需求比例分摊最后可用量并记缺氧。将实际使用量入账。
5. 完成本区间阶段：开关互锁门、载入/迁移、封堵等真实事件统一记在区间结束tick。完成封堵不会免掉本区间漏失；本区间末抵C的人仍需本区间氧气。
6. 先判实际非法暴露/供氧不足，再判尚未抵C人员期限；抵C恰在deadline的人员有效。随后若三组全安全且漏点已隔离，以罐内实际库存对任务底线判赢/储备不足。最后判90秒上限；最终完成恰在90秒优先正常判定。

普通危险开门请求被互锁拒绝并记blocked，不把拒绝本身误写为已经造成危险暴露。`pressure` 用于实际不合法门状态；正常可达流程应始终保证门不变量。终局冻结全部任务、门、人员、事件和资源；重试清空所有账本与历史。

## 三关数据

| 关卡 | 初始罐 / 上限 / 最终罐底线 | G1期限 | G2期限 | G3期限 |
|---|---|---:|---:|---:|
| 1 抢修撤离 / REPAIR WATCH | 48 / 58 / 20 | 18s | 42s | 68s |
| 2 医疗优先 / MEDICAL FIRST | 54 / 64 / 20 | 42s | 68s | 12s |
| 3 满罐困局 / FULL RESERVOIR | 48 / 48 / 24 | 40s | 66s | 89s |

三关遵循同一规则，参数只改变储备、容量和期限。公开可行性报告只发布结果数量、时长/库存范围、失败原因及容量实际受限事实；具体作者调度存于独立私有见证，不进入生产、QA、独立审查或录像控制器。

## 公开状态与画面

- `chambers`: A气量/容量/压力/两门；B压力0、C压力1；三舱拓扑明确显示B→A→C。
- `tank`: capacity/oxygen/reserveFloor；`groups`: ID、呼吸率、截止tick、真实B/A/C位置、已撤离、累计耗氧、抵达tick。
- `task`: kind、groupId、mode、phase、stopped、phaseTicks、totalTicks、累计实际回收/排气/充气。phaseTicks是本阶段实际已用tick，totalTicks是本事务实际运行tick；不是剩余时间。
- `leak`: isolated、服务进度/实际漏失；`selectedId` 与 `modeSelection`。
- `ledger`: initialTotal、breathing、leak、vent、recoveryLoss、recoveredTransferred、filledTransferred。
- `lastInterval` 采用root生产字段：fromTick/toTick、tankBefore/After、airBefore/After、taskId/taskPhase/taskStopped；airRemoved为A移出总量，recovered为净回罐，recoveryLoss为差额，vented/filled/breathing/leak为实际量，groupBreathing含requested/actual/location；初态null。动画按实际流量而非所选模式触发。
- `events`/`lastEvent`/`lastOperation`: 启动/模式/停止/恢复/互锁拒绝/门开关/载入/送达/封堵/终局，携带实际tick与对象身份。
- 人员卡同时显示期限、当前位置和呼吸率；右侧画共享泵与实际库存/底线；A同时显示真实阶段、停止状态和受容量限制原因。不能只让玩家观察压力数值。

## 输入、计时与收据精确定义

- `create(seed,difficulty)` 产生独立状态，difficulty有限整数钳制0–2。固定60Hz；step的dt有限值钳制0–.25s并累积，不足一步不推进；终局调用不改变任何字段。
- 每个tick首先把tick加一，在该编号区间处理输入，再从fromTick=tick−1到toTick=tick积分。命令收据的tick是其生效区间编号；实际物理流量另带fromTick/toTick。阶段完成、门操作、人员迁移收据位于区间末端，同tick最多完成一个阶段，新阶段从下一tick运行。
- 方向死区.25，主轴决定前后，绝对值相等时取横向；上/左为前项，下/右为后项；连续按住先等20tick，再每10tick移动一次。边界钳制。B优先于同tick A和导航，否则先导航后A；中立方向始终清除连走状态。
- A/B使用按下边沿；同一按住不重复。cancelled或cancelEpoch变化清除尚未执行的输入和方向连走，不撤销已经开始的任务。设备stop不是运行时pause；停止时任务phaseTicks、totalTicks、设备通量不变，呼吸、漏气、deadline和elapsed仍走。运行中A（未停止）或停止中B均拒绝，不启动第二任务。
- 所有阶段的phaseTicks/totalTicks只统计设备未停止的实际tick，包括回收因罐容量受限而等待的tick。每次阶段变化清phaseTicks；任务完成后复制到completedTasks，当前task=null。completedTasks正常最多4个（3组+1次封堵）。
- 初始组为G1工程队/ENGINEERS 2人、G2勘测队/SURVEYORS 2人、G3医疗组/MEDIC 1人。breathingRate是整组耗氧率，不要再乘people。location B/A/C只在完成转运时变更；arrivalTick只有抵C才写入。
- events是最近一次step产生的事件，最多保留32条；eventCount和各事件id递增。lastEvent保留最后事件；lastOperation保留最后接受的用户命令，其id独立按commandCount递增。command事件有commandId与operation；task事件有taskId。blockedCommands只统计被拒绝的用户命令，不消耗库存或改变任务身份。
- lastInterval中全部通量是1/60秒内的实际数量，乘60才是每秒速率。airRemoved是从A移出的回收总量，recovered是其中实际回罐净量，recoveryLoss是差额；vented另计。breathingDemand是总需求，groupBreathing保存每组区间开始位置、需求与实际量。因不足触发终局的最后区间也保留真实部分用量。
- 浮点安全余量EPS=1e−9：气闸空/满与最终储备判定使用此量，实际通量始终由现有气量与空位封顶，不把不足的一整单位凭空补齐。缺氧按每组actual < requested−EPS判定。所有账本值保留未舍入精度；界面显示可四舍五入，独立验算不可据界面小数反推精确状态。
- ledger.error=initialTotal−tank.oxygen−A.air−breathing−leak−vent−recoveryLoss。回收、充气内部流量不在总消耗中重复扣除。每组consumedOxygen合计应与ledger.breathing一致（浮点容差1e−8）。
- 终局优先级：实际非法门状态/互锁失败(pressure)，本区间供氧不足(oxygen)，未抵C的组达到自己的deadline(deadline)，全部抵C且封堵后按罐内实际储备判won/reserve，最后90秒timeout。准时完成的迁移先于deadline判定。模型不会提供绕过互锁的普通开门按钮。
- 分数每个已撤离组300；胜利额外1000+10*floor(罐内氧+EPS)。分数不参与资源、期限或安全判断。

本实现是有限氧预算的游戏模型：安全舱固定压力作为边界条件，其气体不加入预算；救援服不另外创造隐藏库存。它不声称模拟现实气体混合、医学呼吸或航天设备。

## 精确公共字段索引（结构说明，不是运行快照）

```text
state: width=960, height=540, seed, difficulty(0..2), level(1..3), levelName,
  levelNameEn, phase(playing|won|lost), tick, elapsed, timeLimit=90, remaining,
  score, message, lostReason(null|oxygen|deadline|reserve|pressure|timeout),
  failure(null|{reason,groupIds,tick,tankOxygen}),
  selectedId(G1|G2|G3|leak), modeSelection(recover|vent),
  chambers: {
    B:{pressure:0},
    A:{capacity:12,air,pressure,doorBOpen:boolean,doorCOpen:boolean,groupId:null|G1|G2|G3},
    C:{pressure:1}
  },
  tank:{oxygen,initialOxygen,capacity,reserveFloor},
  groups:[{id,name,nameEn,people,breathingRate,deadlineTick,location:B|A|C,
           evacuated:boolean,consumedOxygen,arrivalTick:null|integer}],
  physics:{recoveryRate:.75,recoveryEfficiency:.9,ventRate:6,fillRate:3,
           loadTicks:120,unloadTicks:120},
  leak:{rate:.5,isolated:boolean,isolatedTick:null|integer,serviceTicks:180},
  task:null|{
    id,kind:batch|isolate,groupId:null|G1|G2|G3,mode:null|recover|vent,
    phase:recover|vent|load|fill|unload|isolate,stopped:boolean,startedTick,
    phaseTicks,totalTicks,recovered,vented,filled,recoveryLoss,capacityLimitedTicks
  },
  completedTasks:[same task plus completedTick],
  taskCount,commandCount,blockedCommands,evacuatedCount,capacityLimitedTicks,
  eventCount,events:[],lastEvent:null|event,lastOperation:null|operation,
  ledger:{initialTotal,breathing,leak,vent,recoveryLoss,recoveredTransferred,
          filledTransferred,error},
  lastInterval:null|{
    fromTick,toTick,tankBefore,tankAfter,airBefore,airAfter,
    breathing,breathingDemand,leak,recovered,recoveryLoss,airRemoved,vented,filled,
    groupBreathing:[{groupId,requested,actual,location}],
    taskId:null|integer,taskPhase:null|string,taskStopped:boolean
  }
```

`lastOperation`基础字段为`{id,type,tick,at}`，type为`mode/start/stop/resume`：mode附`mode`；start附`taskId,kind,groupId,mode`；stop/resume附`taskId`。选择方向不计commandCount。`leak`服务进度读取当前kind=isolate的task.phaseTicks，完成后读isolated/isolatedTick，不另维护虚构倒计时。字段名以下划线开头的内部输入状态不属于自动控制器或独立核算API。
