# 旋环锁匠 — 模型合同

状态：公开规则已接受；实现与实际验证结果另行记录。场景参数以 `public-design.md` 为准；字段以 `public-interface.md` 为准。本文仅规定公开行为，不是已验证的运行结果。

## 1. 身份与唯一时钟

`PureModel.create(seed=738,difficulty=0)`；有限 number seed 截断，否则为 738；difficulty 有限时截断夹取 0..2，否则 0。level=difficulty+1。seed 不改变三关公开几何或初相位；不存在私有生成路线。identity、physics、scenario 深分离冻结。

`step(state,dt,input)` 原位更新并返回 state。仅 phase=playing 且 dt 为有限正 number 时有效；每个有效调用恰好一个 1/60 秒 tick，不按传入 dt 的大小补步。无效 dt、非正 dt 和终局调用完整 no-op，包括 events、last 字段、输入状态和永久银行。

tick 初值 0，elapsed=tick/60，remainingTicks=5400-tick，remainingSeconds=remainingTicks/60。无第二机械时钟或墙钟补偿。运动 fraction λ 是一个 tick 内实际提交运动的位置，受第 4 节首接触与数值规范约束，不是减少已耗游戏时间：碰撞、接触制动、输入隔离和空操作仍各耗完整一个 tick。宿主暂停则完全不调用 step，所有字段冻结；恢复没有准备倒计时或补拍。

phase 为 playing/won/lost；任务阶段 `mission=approach/return/complete`，与宿主 menu/pause 分开。没有钥匙时 approach，取钥匙后 return，成功完整带出后 complete；失败保留原任务阶段和真实钥匙状态。

## 2. 输入与接触制动

输入字段沿共享框架：x,y,a,b,aPressed,bPressed,start,select,startPressed,selectPressed,confirm,retry,menuDelta,cancelled,cancelEpoch。按钮仅 literal true 为真。缺失轴/菜单为有效 0；显式非 number 或非有限值归一显示 0，但 validity=false。有效轴夹到 [-1,1]；menuDelta 不夹取。cancelEpoch 无效/缺失为 0，有限时 floor(max(0,value))。

fullNeutral 要求两轴有效且绝对值均 <=0.35，menuDelta 有效且等于 0，上述全部按钮和 cancelled 均 false。y 不参与操纵，但必须中立才能解除隔离/接触制动；无效输入不能伪装成松手。

inputState 初始 `{cancelEpoch:null,quarantined:true,impactLocked:false}`。有效 step 先归一；epoch 改变或 cancelled=true 时更新 epoch 并置 quarantined=true，不清 impactLocked、不清阻力/耐久/位置/钥匙。若锁定且本步 fullNeutral，则清 quarantined 和 impactLocked，mode=neutral_ack，本步所有执行控制为 0。否则任一锁存在时 mode=quarantine 或 impact_lock（quarantine 优先），全部执行控制为 0。锁定不停止本局时钟。

无锁时 mode=active，控制是连续 held，**不使用一次点按自动走完一层**：

- 有效 x>=0.55 时 drive=+1，x<=-0.55 时 drive=-1，其余为 0；直接左右翻转允许，0.35/0.55 之间无驱动力。无效任一轴时 drive=0。
- A 有效值为 a||aPressed，B 为 b||bPressed；仅 A 真时 radial=-1（向内），仅 B 真时 radial=+1（向外），两者同真或同假时为 0。两键互不取消各自的真实按住状态，A+B 只制动径向。
- 其他宿主按钮不作为局内 A/B 别名；竖向、menuDelta 不产生径向移动。Native Enter 的持续 A 映射由 GameDef `holdConfirmAsA:true` 声明。

普通松手不会重置任何机械状态；主动碰撞后全中立只解除制动，不回退、吸附或修复。玩家可以在接触位置反向转环/退回，也可以再次向实体内部尝试并再受一次损伤。保持顶墙期间至多一条 contactReceipt，不能每帧扣血。

重试由共享宿主创建同 seed / difficulty 的新 state，恢复本合同的全部初态：q、位置、耐久、阻力、钥匙、得分、时钟、输入隔离与银行全部重新初始化。输入里的 retry 仅是宿主按钮事实，不在 step 中偷偷重建状态；终局 step 仍完整 no-op。新局仍要求初始全中立确认，避免旧 held 输入直接穿透重试。

## 3. 公共机械状态与候选连续轨迹

径向位置 `probeRadius` 初值 210；未取模总外环驱动角 `driveAngleDegrees=q` 初值 0。每环实际角始终由公开初相位和 q 派生：`wrap360(initialAngleDegrees + gearRatio*q)`。wrap360 返回 [0,360)，0 和 -0 均公开为 0；碰撞计算不得使用两个已 wrap 角的差来代替有符号增量。

本 tick 取输入前 resistance 和 hasKey。`radialSpeed=7.5-0.5*resistance`，无钳位；耐久 4→0 对应 resistance 0→4，终局 resistance=4 时派生速度仍是 5.5，不误写成最低存活速度 6。

令计划外环增量 `dq=drive*scenario.outerRateDegreesPerSecond/60`；各环计划有符号增量 `gearRatio*dq`。令 `dr=radial*radialSpeed/60`。在 tick fraction f∈[0,1] 上：

- `q(f)=q0+dq*f`。
- `r(f)=clamp(r0+dr*f,18,210)`，即先匀速移动，到端点后停住。**不能将 clamp 后的两个端点再按全 tick 线性插值**。角运动仍贯穿本 tick，除非先发生碰撞。
- 每环未取模角 `theta_i(f)=initialAngle_i+gearRatio_i*q(f)`。

ring 的实际增量由同一个最终 λ 缩放为 `gearRatio*dq*λ`，不是经过取模的角差。`plannedDeltaDegrees*60` 是本 tick 提议驱动角速，`actualDeltaDegrees` 是实际已提交运动；`actualDeltaDegrees*60` 只代表这一个 tick 的平均转速。碰撞后显示制动，不把请求速度当成仍在运动。接口无需另添一套速度字段。

## 4. 有限厚度的整段碰撞

空头包络 p=2、a=2°；携钥匙 p=4、a=5°。每环半厚 5、缺口半宽 H。为避免浮点运算把恰好贴边反复判成穿墙，固定且公开：`radialBoundaryMargin=1e-9` 单位，`angularBoundaryMarginDegrees=1e-9` 度。它们直接定义下面的有效安全边界，不得随速度、帧率、关卡或测试调整。

对每环定义 `L=R-5-p+radialBoundaryMargin`、`U=R+5+p-radialBoundaryMargin`、`W=H-a+angularBoundaryMarginDegrees`。在本 tick 的候选轨迹上，实体内部接触的不安全集合为：

`B_i={ f∈[0,1] : L<r(f)<U 且 不存在整数 k 使 360k-W <= theta_i(f) <= 360k+W }`。

这就是规则本身，不能再另加“上一帧已穿过”“已经拿到钥匙”等豁免。径向/角向等号均允许贴边。独审数值输出比较最大绝对误差预算为 1e-8（角、长度或 fraction 对应自身单位），它只用于核查浮点表示；不能拿此预算扩大上述安全区、跳过时刻或把碰撞改成通过。

计算必须先求候选 r(f) 与 `(L,U)` 的实际时间交集，再在这个交集中看 theta_i(f) 是否始终留在**同一个**周期安全分量 `[360k-W,360k+W]`。不得只检查 tick 起点/终点或两端 wrap 值。每 tick 最大计划角幅为 2.4°，但这仅是当前参数的事实，不是允许省略检查的理由。静止探头若位于径向带内部，同样检查完整角运动；A+B 不是碰撞免疫。

若 B_i 非空，该环的首接触 fraction 是 infimum(B_i)。边界本身可安全而它之后紧接着不安全，所以首接触可以是 0；从贴边位置朝实体内部继续走会被挡，从同一点向安全侧离开应当允许。只在边缘接触而未出现不安全时刻时 B_i 为空，不扣血。空交集和只在 f=1 恰达安全边界都不算碰撞。

对全部三环求出解析候选首接触，取最小 fraction 为候选 λ0；所有 B_i 为空时 λ0=1。有碰撞时 0<=λ0<1（若数学上只有 f=1 内部不安全，由连续性必有此前不安全时刻，仍按其 infimum）。数学同值按 scenario.rings 的 outer/middle/inner 顺序取 primaryRingId；共同最早者保留在 tiedRingIds。hasCollision、primaryRingId、tiedRingIds 只由这些 B_i 及解析首根决定。禁止用“只看最近一环”跳过其他检查。正常三环带不相交，但代码规则对潜在同 tick 多环提出运动仍按首次接触处理。

数值提交只采用以下固定规范，不能改碰撞分类或再添加 EPS。可表示数值为 JavaScript number 的 IEEE 754 binary64。先令实际 λ=λ0，并按 `r=clamp(r0+dr*λ,18,210)`、`q=q0+dq*λ` 回代；再由 `initialAngle+gearRatio*q` 检查所有三环，使用本 tick 初始钥匙包络和原有严格 L/U/W 条件。

- 若 tick 起态安全且该回代末态也安全，必须保持 λ=λ0，不得任意退让。
- 仅当 tick 起态安全、但 λ0 回代末态因浮点舍入落入任一实体内部时，从 `[0,λ0)` 的可表示 fraction 中取使上述实际回代末态对三环都安全的**最大值**作为 λ，即朝 0 的最近安全可表示值。要求 `0<=λ0-λ<=1e-8`；若找不到该界内的安全值，则报数值规范错误，不得放宽 L/U/W、静默越墙或伪装成正常游戏失败。
- 此规范同时覆盖解析碰撞的 λ0 和无碰撞的 λ0=1；纯数值缩减不制造 hit，不改变 hasCollision 或 primaryRingId。明确已在实体内的局部 fixture 仍按 B_i 在 fraction=0 碰撞，λ 保持 0，不要求把不安全起态修成安全。

最后只提交同一个实际 λ 下的 q/r，全部环由该 q 派生。ringChecks.firstUnsafeFraction 保留解析首根；motionFraction、实际角增量、接触收据 fraction 和真实边界到达收据以规范后的实际 λ 为准。锁定或零运动 tick 仍完整检查，不得靠跳过检查避免浮点问题；缩减上限也不授权忽略更早的不安全区间。没有弹回起点、越过整环、补完剩余 fraction 或碰撞后自动前进。若实际提交尚未到径向边界，就不能仅因解析候选曾到达它而发 boundary 收据。

## 5. 同 tick 结果顺序与不可重置的损伤

每次有效 step 先清 events、lastContact、lastTravelReceipts，再处理输入并计算计划。即使执行控制均为 0，仍有完整 lastInput / lastStep 和新 tick；不得伪造接触。

1. 以上一状态的钥匙包络检查整个候选路径、确定解析 λ0，再按第 4 节数值规范提交同一个实际 λ。中心取钥匙区 r=18 与所有膨胀环带分离，所以本 tick 末扩大包络不会漏掉一个可能碰撞；其效果从提交末态及下一 tick 生效。
2. 根据实际提交路径写 radial-boundary travelReceipt（见接口）；这些仅表示真实到达边界，不自称已完整穿环。相同 fraction 的边界按环顺序及 inner/outer 标签稳定排列。
3. 有碰撞：durability-=1、resistance+=1、impactLocked=true；写恰一条 contactReceipt。若 durability=0，立即 lost/durability。该 tick 不再发取钥匙或胜利。
4. 无碰撞且未持钥匙并实际到达 r=18：在本 tick 末令 hasKey=true、mission=return，写一次 key-acquired，score 从 0 变 100。此任务结算事件 fraction=1，另用 endpointReachedFraction 记录径向路径首次达到 18 的真实时刻。
5. 无碰撞且实际携钥匙到达 r=210：在本 tick 末 won/key-extracted、mission=complete，写一次 key-extracted，score=1100。此结算事件 fraction=1，endpointReachedFraction 单独记录真实抵达 210 的时刻。没钥匙到 210 不算终局。径向已到端点后的剩余本 tick 内角运动仍按第 3 节完成；这是明确的端点停靠 / tick 末结算规则，不能声称 phase 在 endpointReachedFraction 就提前改变。
6. tick 变为 oldTick+1，若仍 playing 且 tick=5400，lost/timeout。所有当步收据统一记新 tick；fraction 只描述这一个完整有效 tick 的内部位置。

endpointReachedFraction 是本 tick 径向轨迹首次位于被结算端点的时刻：若 r0 已等于该端点则为 0（包括 dr=0）；否则为 `(endpoint-r0)/dr`，必须在 [0,1] 内且该 tick 确实抵达。不能在 dr=0 时作 0/0。第 5400 tick 无碰撞取得钥匙但尚未提取时，允许先 key-acquired 再 lost/timeout，保留 hasKey=true、mission=return、score=100，展示事件为 key 然后 lose；这不是两个终局。只有该 tick 碰撞才排除取钥匙 / 胜利，合法完整提取则排除 timeout。

耐久和阻力总满足 `durability+resistance=4`；hasKey 只可 false→true，终局不会掉钥匙或恢复损伤。score 永远等于 `(hasKey?100:0)+(phase==='won'?1000:0)`。最后预算 tick 的合法完整提取优先于 timeout；碰撞耗尽耐久优先于 timeout，非致命碰撞同时到时则 lostReason=timeout。终局保留最后接触制动、精确位置、q、钥匙和所有收据，不再响应 step。

## 6. 记录、渲染和独审范围

每个有效 step 的 lastInput 保存原始归一依据与实际执行控制；lastStep 保存从 / 到 tick、计划路径、所有三环的完整碰撞检查、实际 λ、实际角增量与径向位置、损伤 / 钥匙 / 得分 / 终局变更。不得由 Renderer 或离线预测补写成功。

contactReceipts 只在真实碰撞时追加；travelReceipts 只追加实际到达径向边界、取钥匙、提取成功或失败的事件。两银行的条目及嵌套值都深分离冻结，旧条目永不改写。稀疏浏览器观察可能看不到某 tick 的 lastStep；不得因此声称它完整覆盖了全部运动。普通 full-tick 语料负责连续规则独审，浏览器永久银行负责保留实际接触与任务里程碑。

snapshot 深分离冻结全部公开状态；读取无副作用。Renderer 仅画当前事实、真实钥匙包络、连续环形缺口与已发生事件，不读 Model 函数、作者路线或自动规划建议。普通 pilot 只读取公开快照和几何，发真实 held 输入；不得注入 r/q、损伤、钥匙、终局或游戏时钟。
