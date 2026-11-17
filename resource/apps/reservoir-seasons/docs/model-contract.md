# 四季蓄水 — 公开规则合同

数值以本文末尾「Public level data」中的公开 JSON 为准。本文件定义规则，不代表运行结果，也不包含通关路线。三关使用相同规则、固定四季预报；种子保留为身份字段，不改变天气。地图支路只是三个独立去向的示意，不能新增模型不存在的在途水量或水压。

## 数量与时间

所有水量为非负整数，1 单位 = 1 万 m³。计划调整粒度为 5；年度需求等于该类别四季需求之和。三个类别的顺序恒为居民、农田、生态河流；四季恒为春、夏、秋、冬。所有预报、季需求、居民底线和年度目标从开局完整公开。

`create(seed, difficulty)` 采用 0–2 的关卡索引，默认种子 730、难度 0；有限数值种子截断后转 uint32，有限难度向下取整并夹入 0–2，其他值采用默认。返回的模型 `phase='playing'`、`stage='planning'`、`tick=0`，但公共运行时先显示菜单。创建时只做一次春季入季准备；菜单停留不推进模型。

活动模型只接受 `dt=1/60`（绝对误差 ≤1e-12）；`dt=0` 完全不动，其他值在改动前抛出异常。已胜/负模型在任何调用上返回原样。有效步进使全局 `tick` 加 1、`elapsed=tick/60`。规划无时限；每季实际放水 480 tick。暂停由公共运行时停止调用模型，没有补帧或时间补算。

## 入季、规划与撤销

每季入场只做一次，次序不可互换：

1. 从上季结转库存扣除 `min(本季预报蒸发, 结转库存)`，计入累计蒸发损失。
2. 加入本季预报来水，计入累计来水。
3. 超过水库容量的部分计入累计溢流损失，库存封顶；溢流永久离开水库，不可回流。
4. 建立 `[0,0,0]` 新计划、清空本季撤销栈，将选择器设为居民。除开局外，进入新规划必须等待完整中立输入才能重新接受操作。

左右选择四栏：居民、农田、河流、提交。选择器夹在 0–3；纵轴不编辑水量。A 在前三栏增加该类别 5 单位计划量，按“需求已满”优先于“预算不足”的顺序拒绝超额操作；本季该类计划不得超过其需求，计划合计不得超过当前库存。计划只是预约，没有取水或交付。每次成功增加将该类别索引压入本季后进先出撤销栈。

B 只在规划时撤销最近一次成功增加：弹栈并将对应类别计划减 5；不改变当前选择器。空栈拒绝。被拒绝的增加不入栈。A 在提交栏无条件接受当前合法计划（包括全零），立即锁定计划并清空撤销栈，进入放水。不能预先以居民底线或年度目标拒绝一个合法坏计划；失败必须来自实际交付后的结算。

## 放水与季末

提交的这一 tick 即为放水的第一个真实区间。提交发生于全局 `fromTick=t`，第一个区间完成于 `tick=t+1`，放水年龄由 0 变 1。对每个类别独立计算年龄 `k` 的累计本季实际交付 `floor(锁定计划[类别] * k / 480)`；本区间增量是该值减去年龄 `k-1` 的值。仅该增量从库存扣除并计入该类别的本季、全年交付；不把某类取整余数转给其他类别。

在年龄 480 的区间完成后，三类本季实际交付必须逐项等于锁定计划；追加一份完整季节水账并增加已完成季数。然后更新河流断流连季数：本季河流交付恰为 0 则 +1，正数则归零。依次收集以下失败事实，首个事实决定 `lostReason`：

- 本季居民实际交付 `< residentFloorUnits`：`resident-floor`。等于底线是安全的。
- 河流连续断流季数 `>=2`：`river-dry-streak`。
- 仅冬季：逐类别检查 `全年交付*100 >= 年需求*最低满足百分数`，不足者记 `annual-target`，按居民、农田、河流排列。类别不能互相抵消。

有任何失败即 `phase='lost', stage='finished', score=0`，完整保留已结算季账和剩余水量，不准备下一季。无失败且冬季结束才胜利，得分为 `1000 + 三类全年交付之和`。其他季无失败则在同一完成 tick 内准备下一季一次；这一步不会再次执行下一季放水。

放水期间不能新增、撤销或再次提交； fresh A/B 会留下 `release-locked` 拒绝记录，方向不移动选择器。取消输入、断线恢复隔离不停止既有放水；公共运行时进入暂停才冻结全部模型。终局保持冻结。

## 输入顺序

输入为 `{x,y,a,b,cancelEpoch,cancelled}`。有限轴值夹入 [-1,1]，其他轴值为 0；按钮只有 `===true` 才为按下。`cancelEpoch` 只有非负安全整数有效，其他值沿用旧值。任意有效 epoch 改变（包括减小）或 `cancelled===true` 都开启隔离，并清空方向连按、撤销 A/B 的武装；隔离期间不接收操作，已有放水仍照常推进。

完整中立为 `abs(x)<.45 && abs(y)<.45 && !a && !b`。必须在无新取消、`cancelled!==true` 的完整中立区间消除隔离；该区间只重新武装，不发出动作。新季规划采用相同隔离。未隔离时，按钮释放重新武装，fresh 按下消耗自己的武装，按住不重复。

同 tick fresh B 优先：忽略该 tick 的 A 和方向导航，并清零方向连按计数；被同时按下的 A 也消耗武装，之后必须释放才能再用。否则先处理导航再处理 fresh A，因此右移加 A 作用于移动后的栏。规划方向仅看 x；x≥.45 为右，x≤-.45 为左，中立清零，方向改变重新计龄。第一次 held tick 导航，之后 held 年龄 24、36、48……导航；夹边界也正常计龄。放水中方向计龄保持清零。

每个有效 tick 的顺序：归一输入/取消与重武装 → 本阶段导航/动作 → 若已进入或原本处于放水，计量本区间 → 季末结算及必要的新季准备 → 提交全局 tick、库存账与 `lastInterval`。输入记录中的 before/after 库存是动作瞬间，计划编辑、撤销、提交均不直接取水；同 tick 随后的计量另由区间记录证明。

## 守恒与审计界限

任何快照必须满足：`初始库存 + 累计来水 = 当前库存 + 累计蒸发 + 累计溢流 + 三类累计实际交付`。计划和锁定未交付部分都仍属于当前库存，不能额外加入守恒右侧。三个类别的本季和全年交付各有独立数组，所有值为非负整数。

每份完成季账必须满足：`入季前结转 + 本季来水 = 本季实际蒸发 + 本季溢流 + 三类本季实际交付 + 季末结转`。下一季的 carry-in 等于上一季 carry-out。前三类完整数组与四份季账足以独立核算；不需要逐滴实体、空间轨迹或无界导航日志。年度比例用整数交叉相乘，不能依赖浮点百分比舍入来决定胜负。

# 四季蓄水 — 最小公开接口

UMD 导出 `PureModel` / CommonJS `{create, step}`，`step(state, dt, input)` 原地更新并返回同一 state；所有公开嵌套数组/对象在 create 时独立创建。公共运行时 `PureTVQA.snapshot().model` 是这份模型状态的深拷贝。游戏绘制器和正常输入 pilot 只读取公开快照，不能写模型或更改时钟。

## 状态字段

- 身份：`width=960, height=540, seed, difficulty(0..2), level(1..3), levelName, levelNameEn, physics`；physics 与文末公开 JSON 的同名对象一致。
- 流程：`phase:'playing'|'won'|'lost'`, `stage:'planning'|'releasing'|'finished'`, `tick, elapsed, score, lostReason:null|失败kind, failures:[]`。
- 关卡常量：`capacityUnits, initialStorageUnits, minimumFulfillmentPercent:[3], annualDemandUnits:[3], seasons:[4]`。seasons 元素为公开 JSON 的四个本季规则对象，数值不随游玩改变。
- 进度：`seasonIndex:0..3, completedSeasons:0..4, cursor:0..3, releaseAgeTicks:0..480, releaseSecondsRemaining`；后者仅 releasing 为 `(480-age)/60`，其余为 0，不是全局期限。
- 计划：`planUnits:[3], undoStack:[categoryIndex...], committedUnits:null|[3], currentDeliveredUnits:[3]`。提交后 plan 保留可视化但栈清空；非终局进入下一季时全部清零/置 null。终局保留最后一季锁定计划与交付。
- 水量：`storedUnits, totalInflowUnits, totalEvaporationUnits, totalOverflowUnits, deliveredUnits:[3], annualTargetsMet:[bool,bool,bool], riverDryStreak`。全年 delivered 包含当前正在放水区间的实际交付；targetsMet 只是实时分类比较，不会提前触发胜利。
- 预算显示：`planTotalUnits=sum(planUnits)`；`reservedUndeliveredUnits` 在 planning 为 planTotal，在 releasing 为 `sum(committedUnits-currentDeliveredUnits)`，finished 为 0；`unallocatedStoredUnits=storedUnits-reservedUndeliveredUnits`。这三个字段只做公开算术派生，不是额外水量。
- 证据：`seasonEntries:[<=4], seasonLedgers:[<=4], actionReceipts:[], commits:[<=4], lastAction:null|receipt, lastInput:null|归一输入记录, lastInterval:null|区间, inputState`。不新增逐滴实体或导航收据流。
- `message` 为真实当前操作/季末结果的中文提示；绘制不得由外部时钟伪造水量、季数、预报或交付。

`inventory={initialStorageUnits,totalInflowUnits,totalEvaporationUnits,totalOverflowUnits,storedUnits,deliveredUnits:[3],totalDeliveredUnits,totalAccountedUnits,balanceErrorUnits}`；totalAccounted 为库存+损失+交付总和，balanceError 为初始+来水−totalAccounted。快照的 inventory 数组独立拷贝，不共享可变引用。

## 四类紧凑记录

所有记录的 ID 从 1 各自递增，追加后内容不再改变。数据数组均为记录当时的拷贝。全局 tick 是区间结束时间。

`seasonEntries`：`{id, seasonIndex, atTick, carryInUnits, requestedEvaporationUnits, actualEvaporationUnits, inflowUnits, overflowUnits, preparedStorageUnits}`。初始春季 `atTick=0`；之后 atTick 为上一季放水完成 tick。记录逐项满足公开入季顺序。当前 seasonEntries 最后一项就是当前季的真实准备。

`actionReceipts`：每次未隔离的 fresh A/B 尝试一份 `{id, fromTick, tick, seasonIndex, key:'a'|'b', kind:'add'|'undo'|'commit', accepted, reason:null|'release-locked'|'demand-full'|'budget-short'|'nothing-to-undo', categoryIndex:null|0..2, cursor, planBefore:[3], planAfter:[3], undoDepthBefore, undoDepthAfter, storedBefore, storedAfter, commitId:null|id}`。每条 tick=fromTick+1。拒绝保持计划/撤销栈/库存不变；所有动作记录中 storedBefore=storedAfter。accepted 的 undo.categoryIndex 是实际弹栈类别；nothing-to-undo 的 categoryIndex 为 null；add 是选择类别；commit 和任何 release-locked 的 categoryIndex 为 null。A 的 kind 由 cursor 决定（0..2 add，3 commit），B 恒为 undo。`lastAction` 为最后 actionReceipt 的拷贝。

`commits`：每季至多一份 `{id, seasonIndex, fromTick, tick, plannedUnits:[3], preparedStorageUnits, unallocatedUnits}`。tick=fromTick+1，unallocated=preparedStorage−sum(planned)。只有有效 A 提交创建；整份记录之后不变。持续480区间的季末完成 tick 必须是 `fromTick+480`。

`seasonLedgers`：只在真实放水480tick后追加 `{id, seasonIndex, entryId, commitId, commitFromTick, completedAtTick, carryInUnits, inflowUnits, requestedEvaporationUnits, actualEvaporationUnits, overflowUnits, preparedStorageUnits, plannedUnits:[3], deliveredUnits:[3], carryOutUnits, demandUnits:[3], residentFloorUnits, residentFloorMet, riverDryStreakBefore, riverDryStreakAfter, balanceErrorUnits}`。entry/commit 字段来自对应不可变记录，delivered逐项等于planned，carryOut是准备下一季之前的实际库存。即使本季失败，也先保存完整本季 ledger。

## 最后区间与输入

`inputState={cancelEpoch:0, quarantined:false, aArmed:true, bArmed:true, navigationDirection:0|-1|1, navigationHeldTicks:0}` 初态如列。导航只读横轴；纵轴仍参与完整中立。提交进入 releasing 时立即清空 navigationDirection 和 navigationHeldTicks；放水期间二者保持 0。具体优先级和重复年龄见合同。

`lastInput={x,y,a,b,cancelEpoch,cancelled,quarantinedBefore,quarantinedAfter,neutralAcknowledged,actionIds:[],navigationApplied:0|-1|1,cursorBefore,cursorAfter}`。归一值如合同。cancelled 只记录原始 input.cancelled===true；epoch 变化导致的取消可由相邻 inputState.cancelEpoch 与本次规范化 cancelEpoch 判断，不合并到 cancelled。navigationApplied 仅记录本步导航实际造成的 cursor 差值，边界 clamp 为 0；不包含季末入季自动重置。cursorBefore 是输入处理前值，cursorAfter 是整个 tick 完成后的最终值（含季末自动重置）。quarantinedAfter 取本区间最终 inputState.quarantined（包括季末新规划再次隔离）；neutralAcknowledged 仅当已有隔离、无本次新取消且完整中立，输入处理实际解除隔离并重武装时为 true；普通未隔离区间的按钮释放不计为 neutralAcknowledged。季末仍可再次进入隔离，因此 neutralAcknowledged 与 quarantinedAfter 不必互斥。取消不伪装为动作或暂停。被 B 压制的同时 A 没有独立拒绝收据；它已消耗自己的武装。

`lastInterval={fromTick,tick,stageBefore,stageAfter,seasonIndexBefore,seasonIndexAfter,actionIds:[],release:null|object,completedSeasonIndex:null|0..3,enteredSeasonIndex:null|0..3,terminalReason:null|失败kind|'won',inventoryBefore,inventoryAfter}`。inventoryBefore 是本步输入之前；inventoryAfter 是完成计量/季末/入季之后。即使没有交付的规划区间也保留本区间，不拼接未观测 tick。

`release={seasonIndex,commitId,fromAgeTicks,toAgeTicks,committedUnits:[3],deliveredBeforeUnits:[3],creditedUnits:[3],deliveredAfterUnits:[3],storageBeforeUnits,storageAfterUnits}`。独立逐类 `after=floor(committed*toAge/480)`，before对应fromAge，credit=after-before；fromAge+1=toAge。storageBefore/After 只涵盖该区间的放水，不包含随后发生的新季准备。首次提交同 tick 可有 actionIds 和 release；结束同 tick 可同时有 release、completedSeasonIndex 和 enteredSeasonIndex，但没有第二份放水。

## 失败事实与 UI 边界

`failures` 是终局当 tick 的事实数组：每项 `{kind,seasonIndex,tick,categoryIndex:null|0..2,actualValue,limitValue,unit}`。
- resident-floor：categoryIndex=0，actualValue=本季居民交付，limitValue=本季居民底线，unit='water-units'。
- river-dry-streak：categoryIndex=2，actualValue=更新后的连续断流季数，limitValue=2，unit='seasons'。
- annual-target：对应类别，actualValue=全年交付*100，limitValue=全年需求*最低百分数，unit='water-percent-product'。

赢局 failures=[]、lostReason=null；输局按合同优先级保留全部适用事实，lostReason=failures[0].kind。终局 stage='finished'，current plan/delivery/seasonIndex 不清零；重试必须通过 create 获得相同预报和全新初态。

渲染画布可选择地形/水坝/三个支路示意，不约束实际像素坐标。水库填充、三方接收量、当季计划、四季需求预报和各年度目标必须从本接口直接取值或做简单显示换算。地图不承担压力、速度或旅行距离物理。公共菜单/暂停/结算的毛玻璃与二维码布局由现有框架提供。

## Public level data

```json
{
  "id": 30,
  "slug": "reservoir-seasons",
  "name": "四季蓄水",
  "nameEn": "Reservoir Seasons",
  "packageName": "com.ecojust.reservoirseasonstv",
  "version": "0.1.0",
  "versionCode": 1,
  "seed": 730,
  "actions": 2,
  "actionA": "配水 / 提交",
  "actionAEn": "ADD / COMMIT",
  "actionB": "撤销配水",
  "actionBEn": "UNDO",
  "physics": {
    "tickHz": 60,
    "stepSeconds": 0.016666666666666666,
    "dtTolerance": 1e-12,
    "allocationQuantumUnits": 5,
    "releaseDurationTicks": 480,
    "unitCubicMetres": 10000,
    "targetDenominator": 100,
    "drySeasonFailureCount": 2,
    "axisThreshold": 0.45,
    "navigationFirstRepeatTick": 24,
    "navigationRepeatPeriodTicks": 12
  },
  "categories": [
    {
      "id": "residents",
      "name": "居民",
      "nameEn": "RESIDENTS"
    },
    {
      "id": "farms",
      "name": "农田",
      "nameEn": "FARMS"
    },
    {
      "id": "river",
      "name": "生态河流",
      "nameEn": "RIVER"
    }
  ],
  "seasonNames": [
    "春",
    "夏",
    "秋",
    "冬"
  ],
  "seasonNamesEn": [
    "SPRING",
    "SUMMER",
    "AUTUMN",
    "WINTER"
  ],
  "controls": {
    "move": "左右选择居民、农田、生态河流或提交本季；纵轴不编辑水量",
    "a": "在需求方增加 5 单位计划水量；在提交栏锁定并开始本季放水",
    "b": "按后进先出撤销本季最近一次成功配水；提交后不可撤销",
    "pause": "由公共运行时独立暂停；不推进模型或补算暂停时间"
  },
  "rules": {
    "planningUntimed": true,
    "allFourForecastsPublicAtStart": true,
    "seasonEntryOrder": [
      "evaporate min(evaporation, carried storage)",
      "add forecast inflow",
      "overflow above capacity",
      "open a fresh zero-allocation plan"
    ],
    "allocationBound": "Each category plan cannot exceed its current-season demand; the three plans together cannot exceed prepared stored water.",
    "commit": "Any affordable plan, including all zero, can be committed. The plan locks immediately and meters real integer deliveries for 480 fixed ticks.",
    "delivery": "For each category separately, cumulative current-season delivery at release age k is floor(committedUnits * k / 480). Only each interval increment is removed from storage and added to that category.",
    "seasonFinishOrder": [
      "commit exact final deliveries",
      "append one complete seasonal water ledger",
      "resident floor check",
      "two-consecutive-zero-river check",
      "after winter check each category annual fulfillment independently",
      "otherwise prepare next season once"
    ],
    "failurePriority": [
      "resident-floor",
      "river-dry-streak",
      "annual-target"
    ],
    "annualTargetComparison": "deliveredUnits[category] * 100 >= annualDemandUnits[category] * minimumFulfillmentPercent[category] for all three separately; no cross-category offset.",
    "scoreOnWin": "1000 + sum of all three cumulative deliveredUnits; score is zero before or after a loss.",
    "terminalFrozen": true,
    "retryForecastChanges": false,
    "hydraulicScope": "Abstract seasonal water balance with gradual delivery. Eight seconds represents a season's release process in game time; branch paths are schematic, not a pressure, pipe-travel or real-quarter-duration simulation."
  },
  "levels": [
    {
      "name": "春汛入库",
      "nameEn": "Spring Catchment",
      "capacityUnits": 100,
      "initialStorageUnits": 60,
      "minimumFulfillmentPercent": [
        90,
        80,
        75
      ],
      "seasons": [
        {
          "inflowUnits": 55,
          "evaporationUnits": 5,
          "demandUnits": [
            20,
            15,
            10
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 45,
          "evaporationUnits": 10,
          "demandUnits": [
            20,
            30,
            15
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 40,
          "evaporationUnits": 10,
          "demandUnits": [
            20,
            25,
            15
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 35,
          "evaporationUnits": 5,
          "demandUnits": [
            20,
            10,
            10
          ],
          "residentFloorUnits": 10
        }
      ]
    },
    {
      "name": "旱季留水",
      "nameEn": "Dry Season Reserve",
      "capacityUnits": 90,
      "initialStorageUnits": 55,
      "minimumFulfillmentPercent": [
        90,
        60,
        60
      ],
      "seasons": [
        {
          "inflowUnits": 50,
          "evaporationUnits": 5,
          "demandUnits": [
            20,
            20,
            10
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 15,
          "evaporationUnits": 15,
          "demandUnits": [
            25,
            30,
            10
          ],
          "residentFloorUnits": 15
        },
        {
          "inflowUnits": 65,
          "evaporationUnits": 5,
          "demandUnits": [
            20,
            20,
            20
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 15,
          "evaporationUnits": 10,
          "demandUnits": [
            20,
            15,
            10
          ],
          "residentFloorUnits": 10
        }
      ]
    },
    {
      "name": "洪峰与冬储",
      "nameEn": "Flood and Winter",
      "capacityUnits": 80,
      "initialStorageUnits": 40,
      "minimumFulfillmentPercent": [
        90,
        55,
        65
      ],
      "seasons": [
        {
          "inflowUnits": 70,
          "evaporationUnits": 5,
          "demandUnits": [
            20,
            15,
            15
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 10,
          "evaporationUnits": 15,
          "demandUnits": [
            20,
            25,
            10
          ],
          "residentFloorUnits": 10
        },
        {
          "inflowUnits": 90,
          "evaporationUnits": 5,
          "demandUnits": [
            25,
            15,
            20
          ],
          "residentFloorUnits": 15
        },
        {
          "inflowUnits": 30,
          "evaporationUnits": 15,
          "demandUnits": [
            25,
            25,
            15
          ],
          "residentFloorUnits": 15
        }
      ]
    }
  ]
}
```
