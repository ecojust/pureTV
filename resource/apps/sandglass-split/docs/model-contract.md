# 分流沙漏 / Sandglass Split — frozen public model contract

Game 28, version 0.1.0. Numerical rules and public observations are frozen for production implementation. Execution still requires separately reviewed formal, ordinary, independent and visual evidence. No private design plan or solution route is included.

Public source SHA-256:
- design-proposal.json: `67899d38b5b2303da215295550b69183bd28fdefa5d96a99d1b573737af376cb`
- model-contract-proposal.md: `2fd851fa36aa6db61ab2e2a11fd5cfea1cdf67f55f257da0eaa5d542be858402`
- model-interface-proposal.md: `b06531789ba6e14c73f8c902c3330fd250251142ec1af252467c48070221fa99`
- design-feasibility-summary.json: `a6b600582e78f5855abf6242e393c6d8a4e95d556a6bae46f2f2bc22b2c6b29d`

The isolated first design run passed all six precommitted cases without search, retries or parameter changes. It is design-only evidence, not a production or browser claim. Only stale proposal status and private-proof process metadata are omitted from the numerical JSON below; all gameplay constants are unchanged.

# 完整规则

本合同只描述规则和可观察事实，不含获胜输入计划。关卡常量以本文末尾冻结数值表 为唯一数值表；下述公式固定其解释，不允许生产实现自行调参。默认三关分别为 difficulty 0、1、2。

## 有限系统与真实运动

两个独立出口共用有限料斗。左挡片只能把左股导向左杯或中央杯；右挡片只能把右股导向中央杯或右杯。中央杯累加两股实际到达的质量。两块挡片初始都为 outer，选择器初始在左，料斗夹阀初始关闭。开阀后不需要持续按 B。

质量单位是整数克，每个沙束恒为 1 g，整个回合至多 480 束。束有永不重复的整数 ID，两个出口同时发射时左先右后分配 ID。任意实际状态须满足：

`initialMassG = reservoirMassG + packets.length + sum(cups[i].massG) + spillMassG`。

四类所有权互斥：料斗、真实在途数组、实际杯内质量、实际落失质量。被发射的束只从料斗扣一次；碰到挡片不增减质量；离开在途只发生于杯平面的捕获/落失。终局可有剩余料斗或在途，全部冻结，不能为使账面好看而删除。杯内累计质量不能被任一输入降低。守恒误差必须恒等于整数 0。

逻辑画布 960×540。物理坐标 `xU,yU` 单位为 0.1 像素，全部真实位置和速度为整数。每 tick 向下移动 `vyU=20`，即每秒 120 像素；这是透明导槽内的定速下滑模型，无未声明的重力积分、随机抖动或隐含阻尼。所有源点、挡片接触点、杯平面具有偶数像素的距离，恰在整数 tick 到达。导槽为可见固定几何，不能用尚未发生的目的杯来瞬移或伪造动画。

每个出口的源 x 等于其挡片 x。新束在源点创建，`stage='fall'`、`vxU=0`、`route=null`；发射时不读取挡片方向或预分杯。该束在本 interval 随同旧束推进一次。处于 fall 的束沿竖线下落，第一次到达本支路实际挡片接触点才读取该挡片当时的 mode。它在接触点保持同一 x/y，改为 `stage='guided'`、固定该次 `route='outer'|'center'` 及常量表对应 vxU，vyU 仍为20。改向发生的 interval 不再额外执行一次 guided 位移。之后每 tick 为 `xU += vxU; yU += 20`，且永不重新读取挡片、选择器或夹阀。两条导槽相交时束可交错通过，不合并、复制或互相碰撞。

挡片是一条以接触点为中心、半长42像素、与该 mode 出射向量平行的有限线段。其实际 `angleRad = Math.atan2(20,vxU)`；端点为 `pivot ± 420*(vxU,20)/sqrt(vxU*vxU+400)`，端点仅用于几何显示，不参与质量取整。fall 束沿 x=pivotX 的线必然恰在中心与当前有限挡片相交，因而两种角度的真实碰撞位置均是 pivot。不得把整个屏幕 y 平面当成跨支路捕获器：束只检查自身来源挡片；普通合法 fall 状态恒有 x=pivotX。未碰到挡片的束不拥有 route。

这是实际几何投射：所有出射向量满足 `gateXU + vxU*guidedTicks = targetCupCenterXU`，`gateYU + 20*guidedTicks = cupPlaneYU`。各关源至挡片时间、挡片至杯时间见数值表；无需根据帧率估算“将在多久后到杯”。实际位置必须来自逐 tick 运动。所有合法轨迹都在整数 tick 接触挡片或杯面，不存在跳过接触面再补传送的情况。若内部产生非整数坐标、越过尚未处理的面、fall 横向漂移或重复接触，属于实现不变量错误，不能静默修复。

## 出口节拍与夹阀

`sourceOpen=false`、`sourceAgeTicks=0`、`reservoirMassG=initialMassG` 创建。每个物理 interval 的输入完成后，如果源开且料斗非空，sourceAgeTicks 精确加1；否则保持。出口 i 当且仅当**本 interval 源开且 sourceAgeTicks 实际加了1**、`(sourceAgeTicks-1) % emitPeriodTicks[i] === 0` 且检查该出口时真实剩余料斗至少1g才发射。左右发射资格由同一个加1后的 age 计算，依次检查左、右。关阀保留的age即使恰为发射相位也不重复发射。若左耗尽最后1g，右不凭空生成。普通配置最终两路配额由此节拍和总质量自然得到，不另设隐形支路配额或按杯目标自动停流。

B 是夹阀开关，只变更 sourceOpen。B 关阀发生在本 interval 发射之前，本 interval 不发射；既存全部沙束仍正常移动、碰撞、入杯。重开沿原 sourceAge 继续，不追补关闭期间的“遗漏发射”。sourceAge 仅在源开且有沙时计时，不能混用总 tick。料斗耗尽后 B 仍可切换空阀并记真实命令，不能恢复沙量、重置节拍或更改在途。名义 sourceTicks 仅说明关卡量级，不是第二计时器或另一个发射截止规则。

## 杯口边界、存量和同 tick 次序

三杯从左至右固定 ID `left,center,right`。各杯 `leftU=(centerX-70)*10`、`rightU=(centerX+70)*10`，共用本关杯面 y。杯口统一使用半开区间 **[leftU,rightU)**，包括最右杯；没有最后一杯的特别闭边。恰在杯左沿归该杯，恰在右沿不归该杯。杯间缝隙、最左杯左侧和最右杯右沿及以外均是落失。区间互不重叠；分类按左、中、右扫描但不能依赖扫描来消解重叠。显示刻度/圆整重量不改变分类。

guided 束在本 interval 推进至杯平面时，先按**真实 xU**分类，不能按 route 或预测目的杯直接记账。成功分类后，若当前该杯质量严格小于 `capacityG=targetG+toleranceG`，完整1g入杯；否则整束进入 spillMassG，记录 overflow。无杯归属则整束进入 spillMassG，记录 missed-cup。容量恰等于上限的杯不因此失败，只有下一束真实到达产生溢出才失败；束不得消失在容量上限。一个1g束不得同时入杯和落失。

每个 interval 中：

1. 校验可接受 dt，清空瞬时 events，记录 fromTick；处理取消/真实释放/新鲜输入。
2. 依据输入后的夹阀推进源时钟并按左后右生成束。
3. 将全部既存和新束按 ID 升序推进一次；每束仅做一个 stage 的位移。处理本次实际挡片接触、或实际杯面归属/存入/落失。
4. 完成该 interval 所有束，重建精确账本与派生显示事实，提交 `tick=fromTick+1`。
5. 汇集所有本 interval 失败事实，再判失败或排空胜负；不会在本 interval 第一颗溢出粒出现时提前跳过其他束。

因此同 tick 两束入中央杯会先后真实加1，容量只剩1g时较小ID束入杯、较大ID束溢出；每束 receipt 保留当时前后质量。A 和碰撞同 tick 时采用本 interval 输入后的角度。A 不改变任何已存在束的当前位置或已锁定 route。没有同 tick 的再次碰撞、再次 guided 移动或第二次杯面处理。

## 三关与可操作容差

关1左右各每12 tick/1g，源总360g，目标100/140/120g，容差每杯±4g，截止60秒。关2左右每12/15 tick，源总378g，目标110/173/95g，容差±5g，左右实际下落延迟不同，截止68秒。关3左右每10/15 tick，源总480g，目标166/213/101g，容差±6g，两块挡片高度和斜槽角度不同，截止78秒。全部目标、节拍、几何公开，没有随机隐藏任务。

普通80–120ms约5–8 tick。此处容错论证精确限定为：**阀门开闭历史与实际所选挡片保持不变，只将A被接受的实际旋转时间提前或推迟最多8 tick**；不泛化为所有输入、导航、阀动作或网络累计延迟。最快支路每10 tick才1g，这种单个改向相对计划推迟或提前8 tick至多使该支路1g改变去向。保守地将±8tick整个敏感带两端都计入，一次改向至多涉及该路2g；两个挡片对共享杯总计至多4g，仍落在最小±4g容差内（前提是名义结果在目标中央）。这只是有限误差界，不授权模型自动吸附重量、提前显示入杯或替玩家停流。B提供真实上游思考窗口，但在途仍将抵达；源需约36/42/48秒实际开阀时间，因此关卡时限不能被无限暂停料斗规避。

## 输入、取消与重新武装

框架调用固定60Hz `step(state,dt,input)`。只有有限数字且 `abs(dt-1/60)<=1e-12` 提交一个标准 interval；不按传入浮点dt积分。活动状态 dt=0 完全不变，不消耗按键边缘、不更新取消epoch、不清events。其他活动 dt 在任何修改前抛 RangeError。终局调用优先直接返回完全相同状态，连非法dt也不验证。模型没有累积器。框架暂停期间不调用step且清空自身累积器，恢复后绝不补暂停tick。

input缺失、null或非对象当作空对象。x仅接受有限number，夹到[-1,1]；其他类型为0。y始终忽略。方向为x<-0.45左、x>0.45右，否则中立（恰±0.45中立）。方向非中立的首sample age=1立即尝试移动；相同方向在age24、36、48…重复；变号重新age1；真实中立清age0。选择器夹在0/1，不环绕；夹边尝试记lastInput但不伪造移动receipt。

每个动作 sampleDown 分别为 `!!(input.a || input.aPressed)` 和 B对应值。只有 armed且down 才 fresh；fresh当即解除armed，包括被优先级压制的fresh A。任何后续**非取消**false sample才重新armed；连续pressed-only true不能视为连续新按。开始默认aArmed/bArmed=true。

input.cancelEpoch只接受非负安全整数，缺失/非法保留上个值；任何有效变化（包括下降）或 `input.cancelled===true` 均取消本tick输入。取消更新epoch、清方向age、将aArmed/bArmed置false并置quarantined=true；不改变阀、挡片、包、杯或物理进程。取消所属sample不能用于释放。必须等**后续**非取消、x方向中立且两动作down均false的真实sample才能解除quarantine并将两键armed；这个解除sample不执行动作或导航。quarantine中持续按键不执行也不排队。y不参与解除。运行时暂停才停物理，取消本身不等同于暂停或自动关阀。

非quarantine sample先计算方向真实age和fresh A/B。fresh B具有优先级：只切换阀，压制本sample全部导航及fresh A；这些边缘/导航时机已消费，不排队。被B压制时真实方向age仍推进，因此首右按被压制后下个持续右sample是age2，不得补发初次导航。没有fresh B时先做本tick合格导航，再做fresh A切换**导航后**所选挡片outer↔center。A没有冷却、延迟作业或拒绝队列，角度立即变更，束仍只在真实接触时读取。不存在按住A连转或按住B连开关。

## 胜负、分数和冻结

先收集本interval所有失败事实，稳定类别优先级为 overflow、missed-cup、deadline、shortfall。overflow/missed-cup事实为本interval真实落失，按发生束ID排序；deadline在提交tick>=deadlineTick时成立。只有料斗为0且在途为空才检查shortfall，任一杯质量小于target−tolerance则成立。无需额外above-target失败，因为允许到capacity且超出的束已经产生overflow。失败优先于同tick排空成功，主lostReason取首类；所有事实仍保留。

没有失败且料斗/在途都为空且三杯分别位于闭区间[target−tolerance,target+tolerance]且spillMassG=0，phase='won'。任何杯提前达到目标或三杯暂时都达标都不能提前胜利。其余继续playing。恒等质量账错误是实现错误，不应伪装成游戏失败。

胜利分数为 `1000 + 2*floor((deadlineTick-tick)/60) + max(0,100-5*sum(abs(massG-targetG)))`；其余score=0。不奖励虚拟在途投影。终局后所有字段、events、receipts、输入锁存和tick全部冻结。elapsed=tick/60，remaining=max(0,(deadlineTick-tick)/60)。

## 证据范围与隔离

独立设计checker只用公共规则自行实现有限解释器；不读取或调用生产Model、pilot、渲染器。预先固定每关1正例和1自然负例，共6条，不搜索、不重试、不更换布局。单次每条最多4680tick、总最多28080tick、每条最多480束；启动标记使用独占创建，重复运行必须另行请求root明确授权。实际计划、操作帧和逐束witness只存author-private/28-design，root和其它代理不读；checker源允许root逐字静审。公共结果只给成功/失败、用时、守恒、几何触达与容差摘要，不含解序列。

checker不代替生产单测、独立算术复核、真实浏览器按键/取消/暂停回归、图集和画面目视、实际游玩录像、APK尺寸或发布审核。生产pilot只能从最终公开当前快照和规则规划，不能导入设计checker或私有计划。

# 精确公开接口

本接口与上述规则及文末数值表共同固定观测与真实边界，不提供控制计划。

## API与创建

UMD/CommonJS导出 `create(seed,difficulty)`、`step(state,dt,input)`、纯几何 `locateCup(difficulty,xU)`。create的seed仅接受有限number，`Math.trunc(seed)>>>0`，否则728；difficulty仅接受有限number后floor并夹到0..2，否则0。seed只作元数据，不随机化布局。每次创建的配置/状态/数组与常量和其他实例完全分离。step返回传入同一state，终局和dt0语义见合同。

locateCup严格要求difficulty是0..2的整数number、xU是安全整数number，否则在任何操作前抛RangeError；不做create式归一化。按本关公开三个半开杯口返回'left'|'center'|'right'或null，不读取状态、不推进时间、不修改输入。此纯helper仅便于边界测试；独立oracle不得调用它代替独立分类。

```js
{
  width:960, height:540, seed, difficulty, level:difficulty+1,
  levelName, levelNameEn,
  phase:'playing', tick:0, elapsed:0, deadlineTick, remaining,
  score:0, lostReason:null, failures:[],
  physics:{tickHz:60,unitsPerPixel:10,massPerPacketG:1,
    downwardUnitsPerTick:20,gateHalfLengthUnits:420},
  cursor:0, sourceOpen:false, sourceAgeTicks:0,
  initialMassG, reservoirMassG:initialMassG, spillMassG:0,
  emitPeriodsTicks:[...], sourcePositionsU:[{xU,yU},{xU,yU}],
  emittedBySource:[0,0], nextPacketId:1,
  gates:[ /* left then right, schema below */ ],
  cups:[ /* left,center,right, schema below */ ],
  packets:[], inventory:{ /* exact derived ledger */ },
  commandCount:0, navigationCount:0, deflectionCount:0,
  capturedCount:0, spilledCount:0,
  commandReceipts:[], navigationReceipts:[], flowReceipts:[],
  eventCount:0, events:[], lastEvent:null, lastOperation:null,
  lastInput:null, lastInterval:null,
  inputState:{cancelEpoch:0,quarantined:false,aArmed:true,bArmed:true,
    navigationDirection:0,navigationHeldTicks:0},
  message:'...'
}
```

所有几何/目标/节拍都是公开确定常量。gate/cup/packet顺序稳定，state中不存在预测计划、下一杯订单、隐藏自动停流或用于胜利的渲染时间。

## 几何与质量行

gate行为真实几何，只存在两个立即稳定的角度：

```js
{
  id:'left'|'right', index:0|1, sourceIndex:0|1,
  pivotXU,pivotYU,halfLengthU:420,
  mode:'outer'|'center', angleRad,
  outgoingVxUnits:{outer,center}, outgoingVyU:20,
  outerCupId:'left'|'right', centerCupId:'center',
  fallTicks,guidedTicks
}
```

mode就是当前实际状态；没有不同步的targetMode、虚假转动动画或角度插值。renderer可以突出本tick新角度，但不在物理角度之间画出一个误导性的“实际中间角”。角度仅由公开向量atan2派生，允许绝对数值误差1e-12；整数运动和任何门槛不使用角度浮点值。

cup为 `{id,index,centerXU,planeYU,leftU,rightU,targetG,toleranceG,minimumG,capacityG,massG,contributionsG:[leftSource,rightSource],withinTarget,full}`。minimum=target−tolerance；withinTarget是当前真实mass位于闭区间；full是mass===capacity。贡献只累加真正存入该杯的束，不含该方向的在途或溢出。mass初始0；两项贡献和严格等于mass。

packet为 `{id,massG:1,sourceIndex,bornFromTick,bornAtTick,stage:'fall'|'guided',xU,yU,vxU,vyU:20,route:null|'outer'|'center',contactTick:null|integer,contactGateId:null|'left'|'right'}`。bornAtTick=bornFromTick+1。刚发射时route/contact为空，vx0；stage改变后固定route/vx/contact。current位置是本物理tick已推进后的实际位置。任何packet已被捕获/落失便不在packets里；receipt留它的原始身份。没有仅供动画的第二包集合。

inventory为 `{initialMassG,reservoirMassG,inFlightMassG,cupMassG,spillMassG,totalMassG,errorG,emittedMassG,capturedMassG,packetsExactlyOnce,packetCount,bySource:[{emittedG,inFlightG,capturedG,spilledG},{...}]}`。inFlight=packets.length，cupMass为三杯实际和，emitted=两路实际发射和，captured=cupMass，total=四项所有权和，error=total−initial。packetsExactlyOnce检查ID唯一、正整数、来源合法和每束1g；emittedG=inFlightG+capturedG+spilledG逐源成立。溢出不能混入capturedG。

## 真实事件和永久receipt

瞬时events只含最后一次提交interval的事件；永久receipt和计数累计至终局。lastEvent是最近一次实际event的深拷贝，初始null；无事件interval保留此前lastEvent，不清null，而events仍为空。所有event均有 `{id,type,fromTick,tick,...link}`，event id从1严格递增，tick=fromTick+1。每条永久receipt拥有自身数组内从1递增id和引用其唯一事件的eventSeq。事件只能从step实际边界发出，渲染/快照/dt0不得生成事件。

事件类型与link：`command:{commandId}`；`navigate:{navigationId}`；`flow:{flowId,kind}`；`loss:{reason}`；`win:{score}`。同interval先输入事件，再左/右实际emit事件，再按packet ID推进时的contact/capture/spill事件，终局事件最后。commandCount仅A/B接受次数，navigationCount仅cursor实际变化次数；B压制A不记假command或拒绝事件。

commandReceipts为 `{id,eventSeq,fromTick,tick,inputKey:'a'|'b',action:'rotate-gate'|'toggle-source',gateId:null|'left'|'right',before,after}`。before/after固定为真实输入配置 `{cursor,sourceOpen,gateModes:[leftMode,rightMode]}` 的深拷贝。A的gateId是导航后选择器；B为null。lastOperation是最后一条command的深拷贝。输入receipt不宣称任何在途位置或杯存量改变。

navigationReceipts为 `{id,eventSeq,fromTick,tick,direction:-1|1,heldTicks,mode:'initial'|'repeat',beforeCursor,afterCursor}`，只在实际移动时写。边界夹住的尝试只在lastInput出现。

flowReceipts共有四种kind，每条都有 `{id,eventSeq,fromTick,tick,kind,packetId,massG:1,sourceIndex}`：

- emit附加 `{position:{xU,yU},reservoirBeforeG,reservoirAfterG,sourceAgeTicks}`。position是源点，receipt早于本tick位移。
- contact附加 `{gateId,mode,position:{xU,yU},beforeVelocity:{vxU:0,vyU:20},afterVelocity:{vxU,vyU:20},routeBefore:null,routeAfter}`。记录实际交点，不是下一杯预告。
- capture附加 `{position:{xU,yU},cupId,cupBeforeG,cupAfterG,massToCupG:1,massToSpillG:0,route,contactTick}`。
- spill附加 `{position:{xU,yU},reason:'overflow'|'missed-cup',cupId:null|id,cupBeforeG:null|integer,cupAfterG:null|integer,massToCupG:0,massToSpillG:1,spillBeforeG,spillAfterG,route,contactTick}`。overflow时杯前后相等且为capacity；missed时杯相关字段均null。

每束恰有1个emit、最多1个contact、最多1个capture或spill；终局未到杯的束当然没有伪造落杯receipt。deflectionCount累加contact，capturedCount累加capture，spilledCount累加spill，均为实际整数。每条flow的position为边界当时位置，即emit源点、contact中心、capture/spill真实杯面位置。

## 单个真实interval与输入观察

```js
lastInterval = {
  fromTick,tick,seconds:1/60,
  inventoryBefore,inventoryAfter,
  source:{openBefore,openAfterInput,ageBefore,ageAfter,
    reservoirBeforeG,reservoirAfterEmissionG,emittedPacketIds:[]},
  gatesBefore:[modes],gatesAfterInput:[modes],
  commandIds:[],navigationIds:[],flowIds:[],
  emitFlowIds:[],contactFlowIds:[],captureFlowIds:[],spillFlowIds:[],
  advancedPacketIds:[],
  failures:[],terminal:null|{phase:'lost'|'won',reason:null|string}
};
lastInput = {
  fromTick,tick,
  sample:{x,aDown,bDown,cancelled,cancelEpoch},
  cancelled,quarantinedBefore,quarantinedAfter,quarantineReleased,
  freshA,freshB,navigationEligible,navigationSuppressed,
  navigationAttempt:null|{direction,heldTicks,mode,beforeCursor,afterCursor},
  commandIds:[],navigationIds:[],before,after
};
```

interval的所有before在输入前，source.openAfterInput和gatesAfterInput在输入后发射前；inventoryAfter在全部packet处理后。advancedPacketIds含本tick真正推进的全部旧/新束，ID升序；刚产生就位移的束必须同时出现在emit与advance，不能漏记。所有数组/对象为脱离实时可变对象的深拷贝。frame录入不提供每个packet的假终点；独立oracle可由前一真实snapshot、input和这些边界核对全部位置。

lastInput.before/after分别是本interval输入处理前、输入处理后完整inputState的深拷贝，字段精确为cancelEpoch、quarantined、aArmed、bArmed、navigationDirection、navigationHeldTicks；它们不复用commandReceipts的配置快照结构。sample.cancelEpoch是按合同规范化后的有效epoch（非法/缺失保留旧epoch），sample.cancelled仅表示原始input.cancelled===true，外层lastInput.cancelled表示原始true或有效epoch变化造成的实际取消判定。lastInput只声明Model实际看到的sample及接受动作，不证明浏览器真的发出过事件；浏览器输入证据单独记录。取消sample的freshA/freshB均false，quarantine解除sample不动作。B压制navigation时navigationSuppressed=true、navigationAttempt=null；其方向age仍真实推进。未压制的夹边尝试afterCursor等于beforeCursor但有navigationAttempt。

failure为 `{kind,fromTick,tick,packetIds:[],cupIds:[],actualValue,limitValue,unit}`。overflow/missed-cup逐束各一条，packetIds仅该束、cupIds为真实杯或空，actualValue=1、limitValue=0、unit='g-spilled'。deadline仅一条，空ID数组、actualValue=tick、limitValue=deadlineTick、unit='ticks'。shortfall按左中右每欠量杯一条，空packetIds、cupIds仅该杯、actualValue=massG、limitValue=minimumG、unit='g'。同类顺序按实际处理束ID或杯序。无失败时failures=[]；发生终局后保留完整失败列表。lostReason只取首failure.kind。

## renderer与QA边界

GameDef采用框架默认确认键脉冲（holdConfirmAsA=false），双按钮大触控区，原生独立暂停菜单。HUD最少呈现两路出料状态、真实储量、在途总g、三杯真实mass与目标窗、当前选中挡片和剩余秒。可以显示杯的两路真实贡献，但不能把在途route当作已入杯，也不把fall束分配给未来杯。允许画静态导槽及当前挡片指向，不允许把预测计入账本或终局。

仅一张自有atlas、一个批量WebGL draw目标；物理最大480束，实际同时在途远低于此。描绘尾迹必须从同一束的真实位置和已锁定速度派生，属于该束外观，不能增加粒数或虚构运动阶段。真实帧回归须覆盖关阀后继续落杯、挡片改向前后不同束、两路同tick入中杯、选择器/动作、取消重新武装、暂停无补帧、终局冻结。

公共schema不是实现通过证明。正式单测还须覆盖半开杯沿、双粒容量只余1g、同tick改向接触、同tick关阀发射抑制、重开节拍、deadline与排空同tick优先、质量守恒、序号唯一以及无任何state直写的普通通关/自然失败。单纯fixture不冒充普通游玩。

## Frozen numerical data

```json
{
  "gameId": 28,
  "slug": "sandglass-split",
  "name": "分流沙漏",
  "baseCommit": "ffbe20c824ebfb5f877cbd5ae39114fb4f11c15a",
  "mechanic": "两股持续落沙通过两块可旋转挡片进入左杯、中央共享杯、右杯；改向只在沙束实际碰到挡片时生效，已经离开挡片的束保持实际运动。",
  "distinctiveState": [
    "两个同时供沙的出口",
    "中央杯承受两个分支的实际叠加流量",
    "整数质量及每束真实在途坐标",
    "上游夹阀与下游在途流量的时间差",
    "固定杯容量与目标容差"
  ],
  "controls": {
    "leftRight": "选择左/右挡片，边界夹住不环绕",
    "a": "切换所选挡片：外侧杯 / 中央杯",
    "b": "开关共用料斗夹阀；关阀不停止在途沙束",
    "pause": "由框架独立暂停整个物理世界",
    "defaultCursor": 0,
    "defaultGateModes": [
      "outer",
      "outer"
    ],
    "defaultSourceOpen": false,
    "holdConfirmAsA": false
  },
  "physics": {
    "tickHz": 60,
    "unitsPerPixel": 10,
    "massPerPacketG": 1,
    "downwardUnitsPerTick": 20,
    "gateHalfLengthUnits": 420,
    "cupMouthHalfWidthUnits": 700,
    "emitPhaseTicks": [
      1,
      1
    ],
    "advanceNewPacketsImmediately": true,
    "sourceAgeAdvancesOnlyWhenOpenAndNonempty": true
  },
  "levelSchema": "Coordinates are logical pixels; integer model coordinates are these values multiplied by ten. Vectors are model units per physical tick. Target and tolerance arrays are left/center/right.",
  "levels": [
    {
      "difficulty": 0,
      "name": "双流初衡",
      "nameEn": "Twin Streams",
      "deadlineTick": 3600,
      "nominalSourceTicks": 2160,
      "initialMassG": 360,
      "targetsG": [
        100,
        140,
        120
      ],
      "toleranceG": 4,
      "cupCentersX": [
        180,
        480,
        780
      ],
      "cupPlaneY": 420,
      "emitPeriodsTicks": [
        12,
        12
      ],
      "sourcePositions": [
        [
          300,
          100
        ],
        [
          660,
          100
        ]
      ],
      "gatePositions": [
        [
          300,
          220
        ],
        [
          660,
          220
        ]
      ],
      "outgoingVxUnits": [
        {
          "outer": -12,
          "center": 18
        },
        {
          "outer": 12,
          "center": -18
        }
      ],
      "fallTicks": [
        60,
        60
      ],
      "guidedTicks": [
        100,
        100
      ]
    },
    {
      "difficulty": 1,
      "name": "错拍刻度",
      "nameEn": "Offset Measures",
      "deadlineTick": 4080,
      "nominalSourceTicks": 2520,
      "initialMassG": 378,
      "targetsG": [
        110,
        173,
        95
      ],
      "toleranceG": 5,
      "cupCentersX": [
        160,
        480,
        800
      ],
      "cupPlaneY": 430,
      "emitPeriodsTicks": [
        12,
        15
      ],
      "sourcePositions": [
        [
          280,
          80
        ],
        [
          680,
          120
        ]
      ],
      "gatePositions": [
        [
          280,
          230
        ],
        [
          680,
          230
        ]
      ],
      "outgoingVxUnits": [
        {
          "outer": -12,
          "center": 20
        },
        {
          "outer": 12,
          "center": -20
        }
      ],
      "fallTicks": [
        75,
        55
      ],
      "guidedTicks": [
        100,
        100
      ]
    },
    {
      "difficulty": 2,
      "name": "斜庭合流",
      "nameEn": "Converging Glass",
      "deadlineTick": 4680,
      "nominalSourceTicks": 2880,
      "initialMassG": 480,
      "targetsG": [
        166,
        213,
        101
      ],
      "toleranceG": 6,
      "cupCentersX": [
        165,
        510,
        800
      ],
      "cupPlaneY": 450,
      "emitPeriodsTicks": [
        10,
        15
      ],
      "sourcePositions": [
        [
          280,
          90
        ],
        [
          700,
          90
        ]
      ],
      "gatePositions": [
        [
          280,
          220
        ],
        [
          700,
          250
        ]
      ],
      "outgoingVxUnits": [
        {
          "outer": -10,
          "center": 20
        },
        {
          "outer": 10,
          "center": -19
        }
      ],
      "fallTicks": [
        65,
        80
      ],
      "guidedTicks": [
        115,
        100
      ]
    }
  ],
  "endRules": {
    "win": "料斗为空且实际在途为空，所有杯重量在各自闭区间目标±容差内，且无落失",
    "failurePriority": [
      "overflow",
      "missed-cup",
      "deadline",
      "shortfall"
    ],
    "capacityG": "targetG+toleranceG",
    "timeLimitTie": "达到截止tick即失败，优先于同tick排空成功",
    "earlyTargetMatch": "不结算，继续处理在途和剩余料斗"
  },
  "presentation": {
    "style": "暖白玻璃实验台、琥珀沙、深梅色刻度和黄铜挡片；避免港口、水面、货箱或甲板",
    "canvas": [
      960,
      540
    ],
    "atlasCount": 1,
    "batchDrawCallsTarget": 1,
    "renderActualOnly": true,
    "chineseInDom": true,
    "alwaysVisible": [
      "所选挡片",
      "两块实际倾角及去向",
      "料斗开闭和剩余克数",
      "三个实际重量/目标容差窗",
      "在途总克数",
      "时间"
    ],
    "noPredictedCupOwnershipBeforeContact": true
  },
  "sharedKitDifference": "No shared kit change required. Use its canonical 1/60 step, transient aPressed/bPressed, cancelEpoch/cancelled quarantine, dual large phone action area and one custom atlas. This game owns its geometry, timing, ledger, rules and renderer."
}
```
