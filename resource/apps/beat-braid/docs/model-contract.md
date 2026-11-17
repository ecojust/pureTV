# Beat Braid — 模型合同

这是经 root 静读接受的公开合同；不含生产实现或输入路线。入口与字段见 `public-interface.md`。

## 1. 固定身份、输入与时间

`create(seed=736,difficulty=0)` 创建 playing 状态。seed 必须有限数，取截断整数；无效用 736，不决定隐藏谱面。difficulty 必须有限数，截断后夹取 0..2，无效用 0。level=difficulty+1。身份、scenario、physics 在一局内深分离冻结。

`step(state,dt,input)` 在 playing 且 dt 为有限正数时恰好处理一次宿主逻辑调用，不用 dt 大小积分；有效调用 `tick += 1`，`elapsed=tick/60`。无效 dt、dt<=0 或终局调用完整不变，包括输入、所有 last 字段和 receipts。宿主固定 60 Hz；暂停不调用模型。

`activeTick` 是独立节奏时钟，初始 0，只有本步 mode 为 running 时增加 1；`activeElapsed=activeTick/60`。quarantine 和 preparing 都只增加 tick，不推进 activeTick。谱面只使用 activeTick，不能使用墙钟、host frame、累计 dt 或第二套窗口偏移。

输入平铺为 runtime 实际字段：`x,y,a,b,aPressed,bPressed,start,select,startPressed,selectPressed,confirm,retry,menuDelta,cancelled,cancelEpoch`。按钮仅 literal true 为 true。缺失 x/y 视作有效 0；显式非 number 或非有限 x/y 归一显示值为0，但 `axesValid=false`，绝不能确认中立。有限轴夹取 -1..1，完整中立要求两轴绝对值<=0.35。menuDelta 缺失为有效0；显式非有限/非 number 无效且不能确认中立。有限 menuDelta 非0时不中立。

完整中立还要求 a/b、两 pressed、start/select、两 pressed、confirm、retry 全 false 且 cancelled=false。`cancelEpoch` 缺失或非有限/非 number 归一为0；否则取 floor(max(0,value))。初始已记 epoch 为 null，所以首次实际 epoch 也触发隔离。

## 2. 安全门与两键独立边缘

输入安全状态初始为 `cancelEpoch:null,quarantined:true,recoveryRemainingTicks:0,aArmed:false,bArmed:false`。两线 edge ordinal 初始均0。

每次有效 step 先归一输入，再按唯一顺序处理：

1. 若 epoch 变化，或 cancelled=true，则进入/维持 quarantine，准备余量设0、两 armed=false；记录最新 epoch。持续 cancelled=true 只维持隔离，不创建60准备，不改变谱面进度。
2. 若处于 quarantine 且当步是真完整中立，确认中立：quarantined=false、余量=60、两 armed=true。本步 mode=`neutral_ack`，不减余量，不推进节奏，不产生边缘。epoch 变化但本步本来就是真中立时也可如此确认；cancelled=true 不能确认。
3. 未确认的 quarantine 本步 mode=`quarantine`，有效 held 和 fresh 均false，不推进节奏。
4. 在不隔离的普通输入处理中，每键独立：该键 held=false 且 pressed=false 才重新 armed；当 armed 且 (held 或 pressed) 时产生一次 fresh，立即清 armed，并使该线 edge ordinal+1。同键 held 与 pressed 同真仍只有一个 fresh；持续 held 与重复 pressed 都不能再触发。另一键的保持不阻止此键释放重武装。
5. 有效 held 只取对应 a/b held 本身，pressed-only 不算连续保持。准备余量若在本步开始时>0，则 mode=`preparing`，余量减1但节奏冻结；本步 fresh 被真实消耗、记 ordinal，但不命中拍点。即使本步归零也不推进 activeTick。若本步开始时余量已0，则 mode=`running`，按下一节推进节奏。

准备期出现新取消/epoch变化优先回隔离。所有安全门均保留谱面状态、tap结果、保持缺口、段收据与得分。恢复倒计时不会自动按住任何线；玩家必须在倒计时内重新按住指定经线。`clockMode` 是步后派生值 quarantine/preparing/running；`lastStep.mode` 保留实际本步处理模式，neutral_ack 只在 lastStep 中出现。

## 3. 公开谱面

共享常量：ticksPerSecond=60、segmentTicks=360、holdStartLocalTick=61、holdEndLocalTick=330、tapCentersLocalTick=[120,210,300]、tapHalfWindowTicks=24、recoveryTicks=60、neutralAxisThreshold=0.35、maxBreaks=2。

| difficulty | 名称 | holdLane 段序 | requiredStreak |
| --- | --- | --- | --- |
| 0 | 双线入门 | left,right,left,right,left,right | 3 |
| 1 | 双结回环 | left,left,right,right,left,left,right,right | 4 |
| 2 | 交错长辫 | left,right,right,left,right,left,left,right,left,right | 5 |

tapLane 是相反一线；expectedCrossing 为 holdLane=left 时 left-over-right，否则 right-over-left。segmentIndex 从0开始；第 s 段 startActiveTick=s*360+1、endActiveTick=(s+1)*360。保持和拍点位置为 s*360 加对应 local tick。拍点 id 为 s*3+j+1（j=0..2），全曲唯一且严格递增。窗 `[dueTick-24,dueTick+24]` 两端均包含，窗口没有重叠。deadlineActiveTick=segmentCount*360。

## 4. 一个 running step 的唯一顺序

先记 fromActiveTick，再令 toActiveTick=fromActiveTick+1。处理的段索引为 floor((toActiveTick-1)/360)，localTick=((toActiveTick-1)%360)+1。首次到该段 localTick=1 时 pending→active。本步输入来自第2节已经形成的真实有效 held/fresh。

1. **保持检查**：若 localTick在[61,330]，该段 holdCheckedTicks+1；若指定经线有效held=false，holdMissingTicks+1，首次缺失写 firstMissingActiveTick。holdBroken 等价于 holdMissingTicks>0。只记缺口，不在此处增加 breaks。
2. **点拍命中**：只考察指定 tapLane 的本步 fresh。若当前 tick 位于一个尚 pending 拍点窗口，且经线有效held=true，该拍点变 hit，产生唯一 hit tap receipt。经线此前是否断过不妨碍记录这次真实命中，但无法修复该段既有缺口。无合格拍点时，该 fresh 无奖励、无罚、无缓存。经线的 fresh 仅建立 held，不能作为点拍；同 tick 两键 fresh 可在经线确实 held 时命中指定 tapLane 一次。
3. **过窗**：对仍 pending 且 toActiveTick=closeTick+1 的拍点写一次 missed receipt。最后一个可命中 tick 是 closeTick；closeTick+1 的 fresh 不命中也不缓冲。每个拍点仅会出现一次 hit 或 missed 最终结果。
4. **段结算**：localTick=360 时，必须已经检查270个保持 tick 且三个拍点均已解决。holdMissingTicks=0且3hit时 woven，否则 frayed。completedSegments+1；woven时 wovenSegments+1、currentStreak+1、longestStreak=max；frayed时 breaks+1、currentStreak=0。生成唯一 segment receipt，实际 crossing 仅woven时为本段 expectedCrossing，frayed时null。每段最多贡献一次 breaks，不依据每个缺口或miss重复扣除。
5. **得分与终局**：每个真实 tap hit 加10；woven段加100再加20*该段结算后的currentStreak；missed/frayed不扣回已获分。score恒等于10*tapHitCount+100*wovenSegments+chainBonus，chainBonus为所有woven段的20*streakAfter之和。得分不取总tick或墙钟。breaks>2优先lost/broken_threads；否则只有 completedSegments=segmentCount 才判：longestStreak>=requiredStreak则won/braid_complete，否则lost/continuity_not_met。达到连续性要求不提前胜利，不做提前不可达推断。

每个有缺口的段 firstFaultActiveTick 是首次 hold 缺失 tick 或首次 miss 的 closeTick+1 中较早者。holdBroken、faulted、tapHits、missedTaps 与原始计数/结果一致。faulted可在active段显示，但breaks只在段结算增加。

## 5. 可观察事实与不变量

永久 `tapReceipts` 和 `segmentReceipts` 只追加真实解决事件；收据及嵌套值必须深分离冻结，不回写、不删历史。tap id按实际解决顺序递增且等于公开谱面pulseId，因为窗口不交叠。segment id=index+1。每个hit绑定实际线的 edgeOrdinal，同一 `(lane,edgeOrdinal)` 不能命中两拍；missed没有edgeOrdinal。

currentSegmentIndex=completedSegments，未完时 currentSegment 指该索引的状态与公开配置，已经结算前一段的 tick360 边界处下一段 localTick=0；下一步才进入其localTick1。全曲处理完 currentSegment=null、currentSegmentIndex=segmentCount、localTick=0。若第三个断段提前失败且仍有未来段，currentSegment仍是下一个pending段，但phase已lost且完整状态冻结。

`events` 是本步实际音效事件，初始[]，每次有效step先清空；只允许hit、woven、frayed、win、lose，均带tick/activeTick，不用于驱动判定。lastInput/lastStep是本次真实摘要；无本步tap/segment事件时对应lastTap/lastSegment=null。最近稳定提示读取永久收据末项，不能把上一步事件伪称本步。

正式规则测试应覆盖闭窗端点、fresh去重与双键独立、保持区两个端点、一次断段、两种终局、完整neutral/无效轴、cancel持续与重入、恢复倒计时归零不推进、暂停时钟分离和终局/无效dt不变。普通自动玩家只能按公开当前状态局部反应；不得导入模型内部、私有见证、预录动作或直接改状态。独立审计使用实际输入区间、公开整数窗和永久事件，不回放生产模型。
