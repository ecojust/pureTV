# 29 传粉契约：公开规则

所有常量、几何、花期、前置和需求见本文末尾公开关卡数据，不隐藏随机任务。两个独立蜂群B1/B2各6只，始终共12只；每群只能处于home、flying、field一种实际模式，不分群、不死亡删实体、不克隆。选择器只是控制对象，不能搬运蜂群。两群可共同停在同一田合作，无预约/容量/排队系统。

## 真实航行与调配

左右选花田、上下选蜂群，均夹边；A将选中群派往选中田，允许未开花/前置未完成的田，抵达后会真实等待并耗耐力；B将选中群改航回巢。完成的田不接受新派遣。正在飞的群可随时改航，命令从当前实际x/y新建线段，不回到旧起点，不修改耐力、当前位置、已做工作或累计飞行距离。没有命令扣费，疲劳只按后述实际interval计。

设命令接受前坐标P=(x,y)，目的Q，原始欧氏距离L0=hypot(Q−P)，速度v=3像素/tick。为避免整步长度附近的浮点误差多走一tick，n0=round(L0/3)；仅若abs(L0−3*n0)<=1e−9像素，令调度长度L=3*n0，否则L=L0。D=max(1,ceil(L/3))，实际方向使用(Q−P)/L0。命令接受interval即走第1步，段age由0加1；age k<D时位置=P+(Q−P)*min(3*k/L0,1)，age到D时**精确赋Q**并产生一次arrival。L0=0时age1原地抵达。每段只有一次抵达，无一个interval中连续多个航段。每步距离按实际前后位置的hypot累计；不会因改航退款或清零。1e−9只服务接近整步的调度长度，坐标观察允许绝对误差1e−8；到达、花期、耐力和胜负不得另加epsilon。

同目标A被拒绝，不能刷新段起点/age；已在田/正在飞向该田都算同目标。A拒绝优先级field-complete→rest-required（巢内耐力0）→same-destination。B拒绝优先级already-home→already-returning。拒绝只产生真实blocked receipt，原目标/物理状态保持。完成田时仍在路上的群继续真实抵达该田，原地等待，必须由玩家再派遣或回巢；没有隐式自动回家。

## 唯一物理interval顺序

fromTick=t、提交后tick=t+1。先处理输入，取得**输入后、移动前**每群mode和全部田完成状态快照。然后：

1. mode=home的群本interval驻巢恢复min(6,1800−耐力)；其余群耐力减1，最低0。刚从巢出发因输入后为flying只扣1，不恢复；改航不另扣。每群每interval恰一笔实际耐力变化。
2. flying按独立线段绝对age公式推进，抵达后mode变home/field。原为field/home者不移动。回巢到达interval已经扣1且不恢复；下一interval仍驻巢才恢复。
3. **只有输入后、移动前已经mode=field的群**才可能工作；新抵达本interval不得工作。工作资格仅用起始完成快照、fromTick时间和实际驻田ID：田未完成、全部前置已完成、openTick<=t<closeTick。飞行/巢内/锁定/未开花/已过花期不授粉。
4. 确定全部群资格后按B1、B2顺序分配实际工作，每合格群最多+1工作tick，且不超过该田尚缺量。最后只差1时B1先得1、B2实际0；B2仍真实在外故仍扣耐力，不产生重复功劳。需求达标才锁存completed并记completedAtTick=t+1。完成进度从不回退。
5. 根据此次真实完成批量更新unlocked及unlock收据。后继可在提交后显示已解锁，但本interval不能倒用这项新资格工作；最早下个interval开始。
6. 收集全部失败，再决定终局。派遣、飞行、工作、恢复均只来自这一次interval，不因读取/渲染调用而发生。

每群初始耐力1800（可在巢外30秒），飞行、授粉和在田等待一律每tick扣1；巢内恢复6/tick，上限1800，未满也可出发。结束时耐力0且mode不是home即exhausted；恰在本interval耐力降至0并实际抵达home是安全的，下一tick才能恢复。耗尽与最后工作同tick时保留已真实完成的工作，但失败优先，不能借完成免除巢外疲劳。

## 花期、完成与结算

花期按工作interval起点采用[openTick,closeTick)。fromTick=closeTick−1的最后有效interval能工作并在提交tick=closeTick完成，这算赶上；到closeTick边界仍未完成的田立刻missed-bloom。在最后有效interval才抵达者不能工作，若田仍欠量会失败。锁定不能延长或推迟花期。田的completed、unlocked、bloomPhase分别独立，已完成田也可能处于closed花期。

失败稳定优先级exhausted（B1/B2序）→missed-bloom（田ID序）→deadline。每项当tick事实都保留；主lostReason取首。deadline在提交tick>=deadlineTick成立，包括与全部回巢同tick。无失败且所有田completed且两群实际mode=home才won；无需回满耐力，也不把飞往巢的群算已回巢。其余继续playing。胜分1000+2*floor((deadlineTick−tick)/60)，其他0。所有终局字段全冻结，包括输入锁存/events/位置/耐力/花期；不删除疲劳耗尽的蜂群。

三关截止66/76/86秒；关1四田两条合流前置，关2五田两个并行后继再合流，关3六田最终继续解锁下一花期。关3需求3960群工作tick严格大于两群初始耐力3600；每个工作tick消耗至少1且飞行另耗，合作仅加速墙上时间而不减少群工作量，因此任意胜利都需要真实返巢恢复后再出发。候选正例目标30–90秒，并用公开剩余耐力/回巢行程量判断；不要求精确到单tick的操作。可行性checker只验证预提交计划及实际余量，不据此承诺任意控制延迟都安全。

## 固定时间、输入寿命

create归一化见API。活动step只有有限number且abs(dt−1/60)<=1e−12才提交一个标准tick；dt=0全字段不变且不消费输入；其他dt在修改前RangeError。终局先直接返回原state而不验证dt。模型不积累时间；框架暂停不调用step且清累积器，因此恢复不补花期/疲劳。

input缺失/null/非对象为空。x/y仅有限number并夹[-1,1]；绝对值<=0.45中立。两轴均活动时取绝对值较大者，等大取横轴；方向分别left/right/up/down。非中立新方向age1立即尝试；持续同向age24、36、48…重复；换向age1，中立age0。水平只改fieldCursor，垂直只改swarmCursor。fresh B优先，压制本sample全部导航和fresh A；真实方向age仍推进，消费而不排队。没有fresh B时先导航再fresh A，因此动作使用导航后的选择。

A/B down=!!(held||Pressed)，仅armed且down为fresh并立即disarm（含被B压制的A）；后续非取消false才rearm。cancelEpoch仅非负安全整数有效，非法/缺失保留，任意有效变化或input.cancelled===true取消本sample；清方向age、两键disarm、quarantined=true，不改变蜂群命令或物理过程。必须后续非取消、**两个轴都中立**且两键false的真实sample才解除隔离并rearm；解除sample不动作。取消本身不暂停飞行/花期/疲劳，框架暂停才冻结。


## 公开API

导出create(seed,difficulty)、step(state,dt,input)。seed仅有限number经Math.trunc>>>0，否则729；difficulty仅有限number后floor并夹0..2，否则0。seed为元数据，不改变任务。每个实例/常量数组深度隔离。step返回传入state；终局/非法dt/dt0语义遵守合同。

```js
{
 width:960,height:540,seed,difficulty,level:difficulty+1,levelName,levelNameEn,
 phase:'playing',tick:0,elapsed:0,deadlineTick,remaining,score:0,
 lostReason:null,failures:[],physics:{/* Public level data.physics */},hive:{id:'hive',x:112,y:270},
 swarmCursor:0,fieldCursor:0,swarms:[],fields:[],inventory:{},
 commandCount:0,flightCount:0,blockedCommands:0,navigationCount:0,eventCount:0,
 commandReceipts:[],blockedReceipts:[],navigationReceipts:[],arrivalReceipts:[],
 completionReceipts:[],unlockReceipts:[],restCompleteReceipts:[],
 events:[],lastEvent:null,lastInput:null,lastInterval:null,lastOperation:null,
 inputState:{cancelEpoch:0,quarantined:false,aArmed:true,bArmed:true,
   navigationDirection:null,navigationHeldTicks:0},message:'...'
}
```

elapsed=tick/60，remaining=max(0,(deadlineTick−tick)/60)。selection索引对应稳定数组；全部衍生状态取当前真实值。所有receipt/lastInterval/input快照为深拷贝，不跟随实时对象变化。

## 实体与路径

swarm稳定B1/B2顺序：`{id,index,beeCount:6,mode:'home'|'flying'|'field',x,y,assignment:'hive'|fieldId,fieldId:null|id,staminaTicks,staminaCapacityTicks:1800,remainingAwaySeconds,flight:null|Flight,cumulativeDistancePx,awayTicks,recoveredTicks,workTicks,contributions:[每田实际工作tick],lastArrivalTick:null|tick,lastWorkTick:null|tick,directHomeTicks,homeReserveTicks,workedLastInterval:false}`。

mode=home当且仅当实际在巢驻留，x/y精确巢坐标且assignment=hive、fieldId=null、flight=null；flying时fieldId=null且flight非空；field时x/y精确该田坐标、assignment=fieldId、flight=null。位置模式互斥，不能靠距离近就当巢内。remainingAwaySeconds=staminaTicks/60。directHomeTicks为从当前坐标按相同1e−9长度规范和3px/tick推导的所需tick（实际在巢为0）；homeReserveTicks=staminaTicks−directHomeTicks，可能负数，是公开预测而非已扣耐力；不参与胜负自动保护。awayTicks累计实际扣1的interval数，recoveredTicks累计实际恢复的耐力单位，恒有stamina=1800−awayTicks+recoveredTicks。workTicks等于贡献和。

Flight为`{id,fromTick,startedAtTick:fromTick+1,origin:{x,y},destination:{id,x,y},dx,dy,rawLengthPx,scheduleLengthPx,durationTicks,ageTicks,nominalDirection:{x,y}}`。新段age0，同interval物理推进到age1；elapsed位置按合同原点解析式计算。direction=L0=0时{0,0}，否则dx/L0、dy/L0。活动flight在抵达后置null，arrival receipt保留完整完成段。retarget只建立下一真实段，不伪造旧段arrival。所有flight id全局从1递增，包含后来被改航中断的段；公开flightCount恒等于commandCount，因为每条接受的A/B都新建恰一段，拒绝不增，全部段ID恰为1..flightCount。swarm.lastWorkTick仅在实际credit>0时写本次提交tick(t+1)，workedLastInterval也仅表示实际credit>0；eligible但demand-filled credit0不得标记为已工作。

field稳定F1…顺序：`{id,index,name,species,x,y,openTick,closeTick,requiredWorkTicks,prerequisites:[],workTicks:0,contributions:[B1,B2],completed:false,completedAtTick:null,unlocked,unlockedAtTick:null|0|tick,bloomPhase:'unopened'|'open'|'closed'}`。workTicks恰为两群贡献和且<=需求；unlocked为当前所有前置completed（无前置初始true且unlockedAtTick=0）。bloomPhase使用当前提交tick与半开窗，无需等实际授粉才开花。无前置的初始解锁不伪造unlock事件。

inventory为`{swarmCount:2,totalBees:12,homeIds:[],flyingIds:[],fieldIds:[],idsExactlyOnce,counts:{home,flying,field},bees:{home,flying,field},totalCreditedWorkTicks,totalSwarmWorkTicks,errorWorkTicks}`，ID集合按B1/B2顺序互斥分区，三分区蜂数和12；totalCreditedWork为田work和，totalSwarmWork为群work和，error恒0。合作不复制蜂群，也不重复记录最后需求。

## 真实边界记录

event通用`{id,type,fromTick,tick,...link}`，id全局从1递增。每提交interval清events，lastEvent保留最近一次实际event深拷贝（无事件interval不清），lastOperation只更新接受命令。永久receipt各自id从1递增、eventSeq引用唯一事件。事件顺序：输入导航/command或blocked→B1/B2实际arrival→田ID序completion→田ID序unlock→B1/B2首次恢复至满的rest-complete→最后loss/win。每tick工作/恢复明细在lastInterval，不另复制成长年逐tick事件数组。

- command：`{id,eventSeq,fromTick,tick,key:'a'|'b',action:'dispatch'|'retarget'|'recall',swarmId,destinationId,before,after,flightId}`；before/after=`{mode,x,y,assignment,fieldId,staminaTicks,flight}`。A原mode=flying为retarget，其他A为dispatch；B统一recall。命令快照after在本interval移动前，坐标和耐力必须与before相同。lastOperation为其深拷贝。
- blocked：`{id,eventSeq,fromTick,tick,key,swarmId,fieldId:null|selectedId,reason,before,after}`，快照同command且相等。
- navigation：`{id,eventSeq,fromTick,tick,direction,heldTicks,mode:'initial'|'repeat',axis:'field'|'swarm',beforeIndex,afterIndex}`，仅实际选择改变才记录；夹边只入lastInput。
- arrival：`{id,eventSeq,fromTick,tick,swarmId,flight,position:{x,y},destinationId,modeAfter,staminaTicks}`，flight.ageTicks=durationTicks，stamina是本interval已扣值，回巢尚未恢复。
- completion：`{id,eventSeq,fromTick,tick,fieldId,workBefore,workAfter,requiredWorkTicks,contributions:[B1,B2]}`，仅首次真实达标；workBefore固定为该田本interval起点总进度，workAfter为本interval末总进度，不能把最后一个群获credit之前的中间值当起点。
- unlock：`{id,eventSeq,fromTick,tick,fieldId,prerequisites:[{fieldId,completedAtTick}]}`，只能在真实前置完成后首次生成。
- rest-complete：`{id,eventSeq,fromTick,tick,swarmId,beforeStamina,afterStamina:1800}`，仅本interval原为home、实际恢复从<1800首次达到1800，不为已经满耐力驻巢反复记录。

事件type及link分别command:{commandId}、blocked:{blockedId}、navigate:{navigationId}、arrival:{arrivalId}、complete:{completionId}、unlock:{unlockId}、rest-complete:{restCompleteId}、loss:{reason}、win:{score}。授粉和耐力不得凭事件动画补记。

## 单interval与输入

```js
lastInterval={fromTick,tick,seconds:1/60,completedAtStart:[fieldIds],
 commandIds:[],blockedIds:[],navigationIds:[],arrivalIds:[],completionIds:[],unlockIds:[],restCompleteIds:[],
 groups:[{swarmId,modeAfterInput,assignmentAfterInput,
   positionBefore:{x,y},positionAfter:{x,y},flightBefore:null|Flight,flightAfter:null|Flight,
   staminaBefore,staminaAfter,awayDebit:0|1,recoveryCredit:0..6,
   movedDistancePx,arrivalId:null|id,
   work:{fieldId:null|id,eligible,reason,fieldWorkBefore,fieldWorkAfter,credit:0|1}}],
 inventoryBefore,inventoryAfter,failures:[],terminal:null|{phase,reason}};
lastInput={fromTick,tick,sample:{x,y,aDown,bDown,cancelEpoch,cancelled},
 cancelled,quarantinedBefore,quarantinedAfter,quarantineReleased,freshA,freshB,
 navigationEligible,navigationSuppressed,navigationAttempt:null|{direction,heldTicks,mode,axis,beforeIndex,afterIndex},
 commandIds:[],blockedIds:[],navigationIds:[],before,after};
```

interval.inventoryBefore取输入前，groups其余before为输入后移动前（接受命令不改变位置/耐力）。groups恒B1/B2序；work.fieldWorkBefore/After是该群按稳定顺序尝试分配时的真实田进度，未驻田时为null。work.reason稳定优先home→flying→field-complete（起始已完成）→locked→unopened→closed→demand-filled（前群已吃掉最后1）→credited。仅最后两项eligible=true，demand-filled credit0；其余eligible=false。new arrival仍reason=flying。all eligible判定先用起始完成快照，不倒用本interval新完成。

lastInput.before/after仅完整inputState深拷贝。sample.cancelEpoch是规范化有效值，sample.cancelled仅原始===true，外层cancelled表示原始true或有效epoch变化引起的实际取消。quarantine解除不动作，freshB即使被拒绝也压制导航/A；navigationSuppressed只在本sample本有导航资格且freshB时true。无input情况下样本x/y0、两down false，可作为普通真实neutral；cancelled sample不能rearm。

failure=`{kind,fromTick,tick,swarmId:null|id,fieldId:null|id,actualValue,limitValue,unit}`：exhausted为实际非home群stamina0，对应0/0、unit='stamina-ticks'；missed-bloom对应欠量田work/required、unit='work-ticks'；deadline为tick/deadlineTick、unit='ticks'。全部当tick事实按合同排序，终局后保留并冻结。

## 实现/观察界限

真实浏览器回归必须保留可核对的每interval输入/lastInterval与命令、抵达、完成、解锁事实；导航不是空间移动，预计回巢行程不是实际抵达。renderer只画真实x/y、实际剩余耐力、花期/解锁/完成三个独立事实，工作动画只取workedLastInterval或lastWorkTick。一个自有atlas批量draw，中文DOM；画面位置严格使用公开几何。暂停/终局装饰取冻结的state.elapsed。设计checker/private witness不能供生产pilot，pilot只读公开当前快照。

## Public level data

```json
{
  "id": 29,
  "slug": "pollinator-contract",
  "name": "传粉契约",
  "baseCommit": "3b94dfeae2c925e2d0541080e5fb672ef308037a",
  "core": "两支固定蜂群在真实花园中飞行、途中改航、在花期和前置条件同时满足后授粉；巢外持续疲劳，实际回巢才恢复；完成全部花田且两群回巢才成功。",
  "physics": {
    "tickHz": 60,
    "speedPixelsPerTick": 3,
    "beesPerSwarm": 6,
    "swarmCount": 2,
    "initialTotalBees": 12,
    "staminaCapacityTicks": 1800,
    "awayCostPerTick": 1,
    "homeRecoveryPerTick": 6,
    "workPerEligibleSwarmTick": 1,
    "coordinateAuditAbsoluteTolerance": 1e-08,
    "flightLengthSnapTolerancePixels": 1e-09
  },
  "controls": {
    "leftRight": "选择花田，夹边不环绕",
    "upDown": "选择蜂群，夹边不环绕",
    "a": "派往所选花田，途中可改航",
    "b": "所选蜂群立即改航回巢",
    "pause": "框架独立暂停",
    "defaultSwarm": 0,
    "defaultField": 0,
    "holdConfirmAsA": false
  },
  "hive": {
    "id": "hive",
    "x": 112,
    "y": 270
  },
  "swarmIds": [
    "B1",
    "B2"
  ],
  "levels": [
    {
      "difficulty": 0,
      "name": "初夏双约",
      "nameEn": "First Blossoms",
      "deadlineTick": 3960,
      "fields": [
        {
          "id": "F1",
          "name": "苜蓿",
          "species": "clover",
          "x": 280,
          "y": 150,
          "openTick": 0,
          "closeTick": 1200,
          "requiredWorkTicks": 420,
          "prerequisites": []
        },
        {
          "id": "F2",
          "name": "金盏",
          "species": "calendula",
          "x": 290,
          "y": 390,
          "openTick": 180,
          "closeTick": 1440,
          "requiredWorkTicks": 480,
          "prerequisites": []
        },
        {
          "id": "F3",
          "name": "蓝星",
          "species": "bluestar",
          "x": 490,
          "y": 150,
          "openTick": 720,
          "closeTick": 2220,
          "requiredWorkTicks": 540,
          "prerequisites": [
            "F1"
          ]
        },
        {
          "id": "F4",
          "name": "鼠尾",
          "species": "salvia",
          "x": 590,
          "y": 330,
          "openTick": 1680,
          "closeTick": 3480,
          "requiredWorkTicks": 600,
          "prerequisites": [
            "F2",
            "F3"
          ]
        }
      ]
    },
    {
      "difficulty": 1,
      "name": "交错花期",
      "nameEn": "Crossing Seasons",
      "deadlineTick": 4560,
      "fields": [
        {
          "id": "F1",
          "name": "苜蓿",
          "species": "clover",
          "x": 260,
          "y": 130,
          "openTick": 0,
          "closeTick": 1380,
          "requiredWorkTicks": 480,
          "prerequisites": []
        },
        {
          "id": "F2",
          "name": "金盏",
          "species": "calendula",
          "x": 250,
          "y": 410,
          "openTick": 0,
          "closeTick": 1500,
          "requiredWorkTicks": 480,
          "prerequisites": []
        },
        {
          "id": "F3",
          "name": "蓝星",
          "species": "bluestar",
          "x": 440,
          "y": 130,
          "openTick": 840,
          "closeTick": 2580,
          "requiredWorkTicks": 660,
          "prerequisites": [
            "F1"
          ]
        },
        {
          "id": "F4",
          "name": "鼠尾",
          "species": "salvia",
          "x": 460,
          "y": 400,
          "openTick": 960,
          "closeTick": 2820,
          "requiredWorkTicks": 600,
          "prerequisites": [
            "F2"
          ]
        },
        {
          "id": "F5",
          "name": "紫苑",
          "species": "aster",
          "x": 630,
          "y": 260,
          "openTick": 2100,
          "closeTick": 3900,
          "requiredWorkTicks": 720,
          "prerequisites": [
            "F3",
            "F4"
          ]
        }
      ]
    },
    {
      "difficulty": 2,
      "name": "暮园续契",
      "nameEn": "Late Garden Pact",
      "deadlineTick": 5160,
      "fields": [
        {
          "id": "F1",
          "name": "苜蓿",
          "species": "clover",
          "x": 245,
          "y": 120,
          "openTick": 0,
          "closeTick": 1500,
          "requiredWorkTicks": 600,
          "prerequisites": []
        },
        {
          "id": "F2",
          "name": "金盏",
          "species": "calendula",
          "x": 250,
          "y": 410,
          "openTick": 120,
          "closeTick": 1620,
          "requiredWorkTicks": 600,
          "prerequisites": []
        },
        {
          "id": "F3",
          "name": "蓝星",
          "species": "bluestar",
          "x": 415,
          "y": 120,
          "openTick": 1080,
          "closeTick": 2760,
          "requiredWorkTicks": 660,
          "prerequisites": [
            "F1"
          ]
        },
        {
          "id": "F4",
          "name": "鼠尾",
          "species": "salvia",
          "x": 430,
          "y": 410,
          "openTick": 1140,
          "closeTick": 2880,
          "requiredWorkTicks": 660,
          "prerequisites": [
            "F2"
          ]
        },
        {
          "id": "F5",
          "name": "紫苑",
          "species": "aster",
          "x": 590,
          "y": 160,
          "openTick": 2520,
          "closeTick": 4200,
          "requiredWorkTicks": 720,
          "prerequisites": [
            "F3",
            "F4"
          ]
        },
        {
          "id": "F6",
          "name": "晚菊",
          "species": "daisy",
          "x": 620,
          "y": 360,
          "openTick": 3000,
          "closeTick": 4800,
          "requiredWorkTicks": 720,
          "prerequisites": [
            "F5"
          ]
        }
      ]
    }
  ],
  "invariants": [
    "B1/B2身份与各6只蜂永不增减或复制，12只恒守恒",
    "每群只占home/flying/field一种实际位置模式",
    "命令不改当前位置/耐力/累计工作；只改真实飞行目标和段",
    "新抵达interval不授粉；前置完成下一interval才影响工作资格",
    "花期半开[fromTick open,close)，最后有效interval可完成，close边界仍未完成才失败",
    "回巢抵达interval只耗1不恢复；到达巢内恰0安全，之后驻巢才恢复"
  ],
  "necessaryRecoveryProof": "关3总需求3960群工作tick；每个实际工作tick必耗1耐力，两个初始耐力仅3600且飞行另耗。因此任何胜利都必须至少一次实际返巢恢复后再出发。合作授粉不改变总群工作量。",
  "presentation": {
    "canvas": [
      960,
      540
    ],
    "worldRegion": [
      60,
      65,
      720,
      480
    ],
    "notebookRegion": [
      740,
      60,
      940,
      480
    ],
    "style": "冷薄荷纸色的植物野外笔记；粉紫蓝花田、森林绿墨线、真实蜂群航迹",
    "atlasCount": 1,
    "drawCallsTarget": 1
  }
}
```
