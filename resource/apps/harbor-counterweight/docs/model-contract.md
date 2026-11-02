# 港口配重 / Harbor Counterweight — frozen public model contract

Game 27, version 0.1.0. Production implementation is authorized; execution and release still require the separately reviewed formal, ordinary, independent and visual gates. Numerical design is frozen. No private witness or solution route is included.

Source public rules SHA-256: `0de0713c9a2e470aa130eecd98f9952c390d3e00cb6aa9c834e1b1a4ddf29376`.
Source public design JSON SHA-256: `bdb0c3ed71718aa69845a7d51a1d3d629f04bae925f17ff9dee723193ba0b307`.
Design-only first feasibility report SHA-256: `9b3f837d134cc75dfef9d20f159cde43053f222c24f3308211f1c92c58179946`. Its three positives and three legal negatives passed without parameter changes; this is not production or browser evidence. Interface and canonical arithmetic clarifications below add no mechanism or numerical tuning.

## What the player does

Six different cargo IDs arrive in a fixed, visible loading queue. Four ship columns, left to right at x = −3, −1, +1, +3 m, hold at most two cargo units each. The player selects a column and requests the next loading job. After all six full crane cycles, four specified IDs must be unloaded in a fixed, visible order. Only a column's top cargo is accessible. Two named export cargo IDs remain aboard and must sail away stable. Both full queues and the export pair are visible before starting.

The player must leave future unload cargo accessible while keeping the vessel stable throughout actual transfers. The shore crane owns a lifted cargo; it is no longer aboard. Slow movable ballast can counter the changing moment while the crane runs. A final balanced arrangement does not erase an earlier dangerous heel. This is an active loading/unloading and damped-roll game, not a static equality puzzle.

The ship starts empty. Hull base mass is **24 t plus a separate 8 t ballast**; initial ship mass is therefore 32 t. Ballast starts at x=0 with target 0, angle and angular velocity are zero, and the empty crane rests at shore x=−6 m. These values are wholly reset on retry.

## Controls and input lifetime

The cursor is one of four horizontal columns. x must be a finite number (not a boolean); any other value is neutral0. With abs(x) <= 0.25 it is neutral. Otherwise sign(x) chooses left/right; y is ignored. Movement is clamped, never wraps. The first nonneutral tick of a new horizontal direction has held age1 and moves once immediately; later same-direction ticks repeat at ages20,30,40,... . Real neutral resets repeat to0. Both runtime cancellation and changed cancelEpoch reset navigation and quarantine all navigation/A/B until an actual noncancelled sample has x neutral and both action samples false. That neutral sample only releases quarantine; it performs no action. This does not rewind crane, ballast, elapsed time, or cargo.

For each button, sampleDown = held || Pressed. An armed fresh sample fires once and disarms it; only a real noncancelled false sample rearms. Fresh B has priority over navigation and A. Real x still updates navigation direction/age on a B-priority interval, but its movement is suppressed and not queued; later repeat opportunities remain at ages20,30,... . Simultaneous fresh A/B consumes both edges but executes only B, so A cannot happen on a later held tick. Otherwise navigation precedes a fresh A on the same interval.

**A — 吊机搬运:** only when the crane is idle. During loading, request the next loading-queue ID into the selected non-full column. During unloading, request the next required ID only if that exact ID is the selected column's top. A wrong column/ID, covered required cargo, empty source, full destination, busy crane, or completed task is rejected. Rejection priority is busy, then task-complete; loading then checks load-full, while unloading checks empty, then required-covered (the needed ID is in the selected stack below its top), then wrong-column. A rejection does not queue work, move cargo, or alter any physics state other than the ordinary passage of that tick. Show the actual reason. There is no hidden automatic restow and no force-completion path.

**B — 配重到此 / 配重归中:** if the current target equals the selected column's x, set the target to0; otherwise set the target to that column's x. Thus public target values are −3, −1, 0, +1, +3 m. Canonical actual `ballastPositionUnits` and `ballastTargetUnits` are integers at60units/m, initially0. Targets are −180, −60, 0, +60, +180. Each physical tick moves actual units by at most1 toward target, clamping on arrival. Actual and target XM are derived by units/60; equality for arrival uses integer units. This exactly represents1 m/s without accumulating fractional position or adding an epsilon. It never jumps to a new target. B remains usable during crane work and departure stabilization. UI distinguishes actual position from target and changes the label to “配重归中” when selected x is the current target. Targets may be retargeted; a new target does not refund movement or restore earlier angle.

The shared runtime owns start, pause/resume and fresh retry. Pausing means no model steps: no crane, ballast, roll, deadline or safety counter advances. Held input after a runtime cancellation cannot trigger a new job/target change until rearmed. Runtime cancellation does not cancel an already accepted physical job. After terminal success/failure all fields freeze.

## Time and step order

State tick t is already committed time t/60. One accepted step advances [t,t+1] with fixed dt1/60. Active dt=0 returns the same state without consuming input. Otherwise only finite abs(dt−1/60)<=1e−12 is accepted; an invalid active dt throws RangeError before mutation. Terminal state returns unchanged before dt validation. This is not a variable-dt or arbitrary-partition model.

For each active interval:

1. Resolve real input edges/cancellation, then fresh B or navigation/fresh A. A new job starts with stage elapsed0 and consumes its first physical tick immediately below.
2. Move canonical ballast units by at most1 (1/60 m) toward the post-input integer target, clamping on arrival; derive XM from units/60.
3. Advance one crane stage tick. At a stage boundary commit the specified ownership transfer exactly once; transition to the next stage with elapsed0, but do not also advance that next stage in this interval. A completed full job increments its task counter and can change loading→unloading→departure.
4. Recompute actual aboard mass, first moment, inertia, restoring stiffness and damping, using the post-ballast/post-transfer configuration. Preserve old angle and angular velocity at the ownership boundary.
5. Integrate one roll interval by the formula below. Commit tick t+1 and post-angle/post-angular-velocity.
6. Update peak angle and consecutive unsafe counter from this post-angle. Check overboard, sustained heel and deadline in that priority. If a spill occurs, commit that one real ownership transfer and recompute displayed mass/moment without integrating again.
7. If there is no failure, update the departure stable counter using the post-state. Win when the full240 qualifying intervals have elapsed.

Failure at the deadline tick wins priority over a simultaneous last required stable interval. A crane task or B target on the last interval does not pause the clock. No result uses rounded display values.

## Crane stages, ownership and visible motion

Horizontal travel ticks to a selected column are `D=abs(columnX−shoreX)*60/3`, exactly60/100/140/180 ticks. Lift and lower are each24 ticks. A full job takes `2D+48`, exactly168/248/328/408 ticks. Empty approach/return time is real gameplay time.

Loading has four stages:

- `lift-shore`, 24 ticks: cargo remains in shore queue until the stage's last tick, then remove that exact queue head and attach it to the hook.
- `carry-to-ship`, D ticks: hook owns cargo throughout.
- `lower-ship`, 24 ticks: hook owns cargo until the last tick; then clear hook and append the ID to the chosen stack.
- `return-shore`, D ticks: hook is empty; on the last tick the full load job completes and the crane becomes idle at shore.

Unloading has four stages:

- `approach-ship`, D ticks: empty hook travels to selected source; cargo remains fully aboard.
- `lift-ship`, 24 ticks: on its last tick remove the specified top ID and attach it to the hook. The current top must still be that ID; ordinary accepted work cannot change it while the crane is busy.
- `carry-to-shore`, D ticks: cargo is owned only by the hook.
- `lower-shore`, 24 ticks: on its last tick clear hook, append that ID to delivered IDs, increment unload completion and become idle at shore.

An accepted job snapshots its type, cargo ID, column, source/destination and tier. The cargo cannot be duplicated or replaced when the cursor later moves. A full loading job count increments at empty return completion, not merely deposit. The loading queue pointer and current job are separate: a cargo removed from shore may still be in flight. Unload order increments only on completed shore delivery. The next task is a request for a physical job, not a license to bypass its stages.

Every original C1–C6 exists exactly once in one of: remaining shore IDs, one ship stack, hook, delivered IDs, or overboard IDs. Each location's tonnage and the total initial cargo tonnage are public. Transfer records retain from/to, cargo ID, mass, fromTick/toTick, source job ID and exact boundary name. `sum(location cargo mass)` always equals initial cargo mass. A lift-shore or deposit event cannot also count as an unload delivery. The ballast is a distinct always-aboard mass, not a seventh cargo or a removable container.

Public crane view includes idle/type/job ID, cargo ID, column/tier, current stage, stage elapsed/duration/progress, overall job elapsed/total, actual carried ID, railXM, source and destination. Rail x is interpolated across actual D-tick carry/approach/return; it is fixed at shore or ship column during lift/lower. An accepted task does not instantly move the hook to a new source.

Vertical clearance is presentation geometry only: it does not enter inertia, moment, timing, collision or safety. Rendering must use the actual stage/progress and ownership. Lift raises a cargo, lower descends it, and empty approach/return may coordinate the hoist with rail travel. The current rotated ship slot is the visual handoff target. No swinging, collision, waves, dynamic draft or extra physical safety implication may be invented. When an ID remains in a stack during lift preparation, do not draw another detached duplicate on the hook; at the ownership boundary the carried drawing replaces its stack drawing. An illustrated attachment before that boundary is an empty hook at the top of that same cargo.

## Roll equations and units

Use tonnes (t), metres (m), seconds (s), radians, kN and kN·m. Since a tonne times m/s² is a kilonewton, these equations are dimensionally consistent without a hidden1000 factor.

Let M = 24 + 8 + sum(aboard cargo massT). The signed first moment is J = 8*ballastXM + sum(aboard cargo massT*columnXM), in t·m. Center of mass x = J/M. Positive x is the right-hand side. Positive theta means the right side tilts down, a clockwise rotation in a screen coordinate system with y downward.

I = M*3² t·m². K = M*9.81*2 kN·m/rad. C = 2*0.68*sqrt(I*K) kN·m·s/rad. Gravity torque G = 9.81*J kN·m. With old theta and omega:

```
alpha = (G - K*theta - C*omega) / I
omegaNext = omega + alpha/60
thetaNext = theta + omegaNext/60
```

This is semi-implicit Euler: theta uses the new omega. All arithmetic is finite IEEE-754 with no per-tick rounding. An actual pickup/deposit changes M/J/I/K/C for that same interval. Theta and omega are continuous at handoff; there is intentionally no impulse or angular-momentum rescaling. This models a controlled shore-supported transfer in a simplified roll system, not angular-momentum conservation. I/M, K/M and C/M are constant; mass loss changes the forcing through J/M.

GM is fixed at2 m and roll radius at3 m. Stack height affects access and artwork only. It does not alter GM/inertia. This is a small-angle game model, not an exact hydrostatic vessel. No waves, pitch/trim, draft, elastic crane, collision or suspended-cargo load on the hull are simulated. Shore-owned, hook-owned, delivered and overboard cargo never contribute to ship M/J. Signed mirror layouts/ballast produce equal mass, opposite J/theta/omega and equal absolute safety results from mirrored initial conditions.

`lastInterval` retains old/new theta and omega, ballast before/after/target, pre-roll aboard IDs and mass/moment/I/K/C/G/alpha, the crane stage advanced, transfer events and the safety sample. This lets independent arithmetic validate the real trajectory. If a spill happens afterward, lastInterval must not be relabeled as though the lighter post-spill vessel was used for that already-completed roll calculation.

## Safety, loss and departure

Constants are computed in radians from the published degree values, never compared against a rounded angle label.

After every real roll interval, abs(theta)>12° increments unsafeTicks; abs(theta)<=12° resets it to0. The sustained-heel failure occurs at90 consecutive unsafe intervals. A good final arrangement does not erase maxUnsafeTicks or peakAbsRollRad; a prior failure cannot be recovered by later input. A render frame, rejection or title preview is not an unsafe tick.

If abs(theta)>=24° and at least one cargo is aboard, one actual cargo falls overboard. Positive theta selects the largest-x occupied column; negative selects the smallest-x occupied column. Remove that column's top ID, append to overboard IDs, record its real mass and source slot, and lose with reason `overboard`. No cargo aboard means no overboard event; sustained heel can still cause loss. This is a terminal simplified loss rule, not free sliding simulation. Exactly one actual cargo spills, even if several are aboard. Recompute current displayed inventory/mass/moment after the spill; retain the pre-spill integration inputs and post-roll angle.

Collect failure facts deterministically. Primary priority is overboard, then sustained-heel, then deadline. Facts include observed angle/counter/tick, threshold and units. An unsafe terminal cannot become editable. Fixed unloading ID blocked beneath another ID does not trigger a hidden rearrangement: A is rejected and time/roll continue. If no legal jobs can finish in time, deadline failure is ordinary gameplay.

After six load cycles and four ordered deliveries, operational phase becomes `departure`. Exactly the published two export IDs must remain aboard; hook empty, crane idle at shore, remaining shore empty, delivered IDs exactly the fixed unload sequence, and overboard empty. If any invariant is wrong it is an implementation error, not an alternate victory.

During departure, stableTicks increments only when abs(theta)<=3°, abs(omega)<=1°/s, and canonical ballastPositionUnits exactly equals ballastTargetUnits after the normal final-step clamp. Otherwise it resets0. All qualifying conditions are inclusive. On the interval of the final shore delivery it may become1 if all conditions hold after the roll update. At240 consecutive qualifying ticks (4 s), and no same-tick safety/deadline failure, the round wins. Until then ballast may still be retargeted and physics keeps running; a new target normally restarts stability counting. No arbitrary waiting timer grants victory despite motion or wrong inventory.

Win score is1000 + 2*floor(remainingSeconds) +100−min(100,blockedCommands); every other phase scores0. This uses committed deadline/tick and actual rejection count. No score is granted for shore pickups or provisional placements.

## Required public observations and evidence

A read-only snapshot must expose model phase playing/won/lost separately from operational phase loading/unloading/departure, tick, elapsed/deadline/time left, current cursor, input quarantine, current/next/all tasks, six immutable cargo IDs/masses and each actual location, stacks bottom-to-top, remaining shore queue, hook/delivered/overboard IDs, load/unload completed counts, crane job/view, canonical actual/target ballast units and derived x, all location mass totals, M/J/center of mass/I/K/C/G, theta/omega, unsafe/maxUnsafe/peak angle and stable ticks.

Preserve accepted and rejected input receipts, job starts/completions, target changes and cargo transfers in permanent chronological arrays. Each receipt contains event sequence and actual interval tick, relevant before/after ownership or target, and reason. Events are actual transitions, not a second predictive simulation. Include lastInterval as above. Terminal facts and all receipt arrays freeze. Re-rendering or taking snapshots may not mutate them.

Exact production key names are fixed in the interface below. Tests must distinguish ordinary completed/failed rounds from fixtures. Important checks include pure mass/moment and mirrors; actual lift/deposit exclusion and total cargo conservation; top access and prescribed unload order; clamp/no-teleport ballast; dynamic roll integration; unsafe-counter boundary and failure priority; real neutral input rearming; pause/retry/terminal freeze; three complete ordinary rounds plus legal failure rounds.


# Exact public model interface

This approved interface fixes observation and input semantics without supplying any solution route.

## API, time and normalization

UMD/CommonJS exports are `create(seed, difficulty)`, `step(state, dt, input)`, and the root-approved pure `measureShip({cargo, stacks, ballastPositionUnits})`. The mass helper returns only the mass properties described below, using the fixed published geometry/constants, without changing its inputs or running time. The independent oracle must not call this production helper.

Create normalizes finite numeric seed with `Math.trunc(seed) >>> 0`, otherwise 729. Finite numeric difficulty is floored/clamped to 0–2, otherwise zero. No string/null/boolean coercion. Seed is metadata, not a source of hidden layout randomization. Every state/configuration/request/receipt array is detached from module constants and other creates.

Terminal calls return the same wholly unchanged state before validating dt or inputs. Active dt=0 is also a complete no-op. Only finite abs(dt−1/60)<=1e−12 commits one canonical 1/60-second physical interval; other active dt throws RangeError before mutation. No accumulator or variable-dt equivalence is claimed.

Input omissions/null/nonobjects act as an empty input object. Only finite numeric x is accepted and clamped to [-1,1], otherwise zero; y has no gameplay or quarantine effect. cancelEpoch uses a nonnegative-safe-integer policy: malformed or absent values retain the previous epoch, and any valid change, including a decrease, causes cancellation. Initial tracked epoch is zero.

## Top-level state and immutable tasks

```js
{
  width: 960, height: 540, seed, difficulty, level: difficulty + 1,
  levelName, levelNameEn,
  phase: 'playing', operationPhase: 'loading',
  tick: 0, elapsed: 0, deadlineTick, remaining: deadlineTick / 60,
  score: 0, lostReason: null, failures: [],
  physics: { /* exact published motion, mass and roll constants */ },
  limits: { /* published degree constants and their once-converted radians */ },
  columnXM: [-3, -1, 1, 3], maximumStackHeight: 2, shoreXM: -6,
  cursor: 0,
  loadOrder: [...], unloadOrder: [...], exportIds: [...],
  cargo: [ /* stable C1..C6 order, immutable id/mass plus derived location */ ],
  shoreIds: [...loadOrder], stacks: [[], [], [], []], hookId: null,
  deliveredIds: [], overboardIds: [],
  loadQueueIndex: 0, loadJobsCompleted: 0, unloadJobsCompleted: 0,
  tasks: [ /* six load requests then four unload requests */ ],
  currentTask: {}, nextTask: {},
  ballastPositionUnits: 0, ballastTargetUnits: 0,
  ballastXM: 0, ballastTargetXM: 0,
  ship: { /* current mass properties plus actual roll state */ },
  inventory: { /* all five cargo locations and exact mass balance */ },
  crane: { /* the exact current physical job/stage view */ },
  unsafeTicks: 0, maxUnsafeTicks: 0, peakAbsRollRad: 0, stableTicks: 0,
  commandCount: 0, blockedCommands: 0, navigationCount: 0,
  ballastTargetChangeCount: 0, jobsStarted: 0, jobsCompleted: 0,
  commandReceipts: [], blockedReceipts: [], navigationReceipts: [],
  targetChangeReceipts: [], jobStartReceipts: [], jobCompletionReceipts: [],
  craneStageReceipts: [], transferReceipts: [],
  eventCount: 0, events: [], lastEvent: null, lastOperation: null,
  lastInput: null, lastInterval: null,
  inputState: { cancelEpoch: 0, quarantined: false,
    aArmed: true, bArmed: true, navigationDirection: null, navigationHeldTicks: 0 },
  message: '...'
}
```

`phase` is only playing/won/lost, for the shared runtime. `operationPhase` is loading/unloading/departure, for actual cargo work. It changes to unloading only after the sixth full empty-return loading completion, and to departure only after the fourth shore delivery. A completed deposit does not itself complete a loading job. All fields freeze after terminal outcome, including input latches, derived fields, messages and receipt arrays.

Each public task is `{id,index,type,orderIndex,cargoId,massT,status,jobId,column,startedAtTick,completedAtTick}`. IDs are `load-1`…`load-6`, then `unload-1`…`unload-4`; index is 0…9 and orderIndex is within that type. Status is pending/active/completed. Column/job/timestamps start null and are assigned only on a real accepted job. CurrentTask is a detached copy of the first not-completed task, including an active job's original cargo ID. NextTask is its immediate authored successor, or null; both are null once all ten tasks complete. The complete immutable load/unload queues and export IDs remain available independently.

`loadQueueIndex = loadOrder.length - shoreIds.length` counts actual shore pickups, not completed loading jobs. `unloadJobsCompleted` counts actual completed shore deliveries and equals deliveredIds.length on ordinary paths. Job counts and task status never advance merely because a job was requested, a ship deposit occurred, or the cursor changed.

## Geometry, ballast and ship state

Four columns are screen-left to screen-right at x −3, −1, +1, +3 m. Stack arrays are bottom-to-top; tier 0 is bottom and tier 1 is top. The ship's physical reference x=0 is the rendering pivot's horizontal reference. Positive rollRad means right side down, clockwise in screen coordinates. The renderer chooses pixel scale/vertical placement; vertical presentation geometry does not feed back into the model.

Canonical ballast positions are integers: `ballastPositionUnits` moves by −1, 0 or +1 toward `ballastTargetUnits` each physical tick and clamps at the target. Target choices are −180, −60, 0, +60, +180. Derived metre fields equal units/60 exactly. B compares/changes target units; it does not change actual units before the physical movement step. Departure arrival compares the canonical units, avoiding floating accumulation ambiguity.

`physics` exposes baseMassT=24, ballastMassT=8, gravityMS2=9.81, rollRadiusM=3, metacentricHeightM=2, dampingRatio=0.68, tickHz=60, craneSpeedMS=3, liftTicks=24, lowerTicks=24, ballastSpeedMS=1 and ballastUnitsPerM=60. `limits` exposes unsafeRollDegrees=12, overboardRollDegrees=24, departureMaximumRollDegrees=3, departureMaximumAngularVelocityDegreesS=1 and computed `unsafeRollRad`, `overboardRollRad`, `departureMaximumRollRad`, `departureMaximumAngularVelocityRadS`, unsafeConsecutiveTicks=90 and departureStableTicks=240. Compute `degreeScale = Math.PI / 180` once, then each radian constant as `degrees * degreeScale`; do not substitute `(degrees*Math.PI)/180` or rounded display labels.

`ship` is `{aboardIds,aboardCargoMassT,massT,firstMomentTM,centerOfMassXM,inertiaTM2,restoringKNmPerRad,dampingKNmSPerRad,gravityTorqueKNm,rollRad,angularVelocityRadS}`. Aboard IDs are flattened by column left-to-right, bottom-to-top. All mass properties describe the current actual post-transfer/post-spill ownership and actual ballast position. Hook and shore cargo do not contribute. Roll angle and velocity retain the real integrated values; recomputing mass does not integrate or rescale angular velocity.

The pure mass helper accepts an id/mass cargo list, four bounded bottom-to-top stacks and canonical ballast units in [-180,180]. It rejects nonfinite/nonpositive mass, duplicate/unknown IDs, over-height stacks or invalid ballast units with RangeError, and returns the above ship properties excluding rollRad/angularVelocityRadS. It does not require all six cargo IDs aboard; an empty ship is a valid boundary case. The full model still keeps every original cargo in exactly one of its five locations. Exact pure-helper collection-size/ID-domain checks are: cargo array length0–6, unique nonempty string IDs, exactly four stack arrays of length0–2, each stacked ID known and present once across all stacks, and nonnegative/negative signed safe-integer ballast units in the closed permitted range. No input is clamped or mutated by the pure helper, and nonfinite intermediate/result values are rejected rather than returned.

Canonical arithmetic order is explicit. Sum aboard cargo mass and `cargoMassT*columnXM` in column-left-to-right/bottom-to-top order. Ordinary cargo masses and column positions are integers, so that cargo first-moment sum is exact. First derive `ballastXM=ballastPositionUnits/60`, then compute `ballastMomentTM=8*ballastXM`, and only then `J=ballastMomentTM+cargoMomentTM`; do not substitute `(8*units)/60`. Compute `M=24+8+aboardCargoMassT`, `I=M*3*3`, `K=M*9.81*2`, `C=(2*0.68)*Math.sqrt(I*K)`, `G=9.81*J`, and centerOfMassXM=J/M. Each roll interval uses `alpha=(G-K*oldTheta-C*oldOmega)/I`, then `omegaNext=oldOmega+alpha/60`, then `thetaNext=oldTheta+omegaNext/60`. Division by60 is canonical; do not replace it with multiplication by a separately rounded dt. Non-gate independently derived floating quantities permit absolute error <=1e-8 in their stated units; IDs, integer values, ownership and receipt times must match exactly. Reports disclose measured maximum errors. Safety and departure gates always use the original actual post-state values without epsilon, while safety/departure gates use the actual post-state values and strict/inclusive comparisons specified by the contract.

## Cargo locations and mass accounting

Cargo rows are `{id,massT,location,column,tier}`. `id`/`massT` are immutable authored data. Locations are shore/ship/hook/delivered/overboard. Column/tier are actual ship indices only when location is ship; otherwise both are null. A hook cargo's job column/tier remains on the crane job metadata, not as a false claim that it remains aboard.

`inventory` is `{initialCargoMassT,shoreMassT,shipCargoMassT,hookMassT,deliveredMassT,overboardMassT,totalLocationMassT,errorT,counts,allIdsExactlyOnce}`. Counts has the five matching location keys. Sum mass uses actual ownership, and errorT is totalLocationMassT−initialCargoMassT. The ballast is excluded from this cargo ledger and always included separately in ship.massT. A valid ordinary state has allIdsExactlyOnce true and zero errorT; receipts may not duplicate one transfer under another location.

## Crane view and stage timing

```js
{
  idle: true, jobId: null, taskId: null, type: null,
  cargoId: null, column: null, tier: null,
  source: null, destination: null,
  startedFromTick: null, startedAtTick: null,
  stage: null, stageIndex: null, stageFromTick: null,
  stageElapsedTicks: 0, stageDurationTicks: 0, stageProgress: 0,
  jobElapsedTicks: 0, jobTotalTicks: 0, travelTicks: 0,
  carriedId: null, railXM: -6
}
```

An accepted job snapshots `type:'load'|'unload'`, cargoId, column, tier, source/destination and timing; later cursor changes cannot retarget it. A job endpoint is `{location:'shore'|'ship',column,tier}`. Transfer endpoints use the same keys with location shore/ship/hook/delivered/overboard. All non-ship endpoints have column:null and tier:null. Loading tier is the actual destination stack length when accepted. Unloading tier is the current accessible top index. `carriedId` always equals top-level hookId; cargoId names the accepted job's cargo even while it is still shore-owned or already deposited.

If A is accepted during interval fromTick=t to tick=t+1, its physical stage initially has elapsed 0, stageFromTick=t, startedFromTick=t and startedAtTick=t+1. It advances one tick in that same interval. A duration-N stage completes after intervals starting t through t+N−1, at committed tick t+N. The next stage starts with elapsed 0 and stageFromTick=t+N; it does not advance again in that boundary interval. StageProgress is elapsed/duration, using actual state; it is not a fake animation clock.

Travel duration is exactly 60/100/140/180 ticks for column 0/1/2/3. Full job duration is 2D+48. Loading stages are lift-shore(24), carry-to-ship(D), lower-ship(24), return-shore(D). Unloading stages are approach-ship(D), lift-ship(24), carry-to-shore(D), lower-shore(24). Overall jobElapsedTicks increments once per busy physical interval, including the interval of job acceptance and completion.

RailXM is shoreXM during lift-shore/lower-shore, columnXM during lift-ship/lower-ship, and the actual stage-elapsed interpolation between endpoints during travel. On transition it equals the endpoint of the completed stage and start of the next stage. On full completion the crane returns to the idle shape above at shore; the completion receipt retains the finished job's elapsed/total metadata. No accepted input teleports an idle crane to the selected column.

## Permanent receipts and event ordering

All permanent arrays use independent one-based `id` values. Every receipt additionally carries global `eventSeq`, `fromTick`, and `tick=fromTick+1`, identifying its real transition. Events are transient for the latest committed interval, with `{id:eventSeq,type,fromTick,tick,...references}`; eventCount is cumulative and lastEvent is detached. There is no event generation from rendering, reading snapshots, dt0 or invalid/terminal calls.

`commandCount` counts accepted A/B commands only. Navigation, blocked A, runtime cancellation, crane stages, transfers and completions never increment it. `blockedCommands` counts rejected fresh A only.

Ownership snapshots are detached `{shoreIds,stacks,hookId,deliveredIds,overboardIds}`. Input configuration snapshots are detached `{cursor,ballastPositionUnits,ballastTargetUnits,crane}`. They describe the immediate input boundary, before ballast/crane/roll progression. `lastOperation` is a detached last accepted input receipt.

- `commandReceipts`: `{id,eventSeq,fromTick,tick,inputKey,action,before,after,jobId,targetChangeId}`. Lowercase inputKey is a/b. Actions are request-load/request-unload/retarget-ballast; the unrelated linked ID is null. B before/after keeps actual ballastPositionUnits unchanged and changes only the target. A after contains the accepted crane job with stage elapsed0.
- `blockedReceipts`: `{id,eventSeq,fromTick,tick,inputKey:'a',reason,expectedCargoId,actualTopId,column,before,after}`. Before/after input configuration is equal. Root-approved deterministic priority is crane-busy → task-complete → load-full for loading, or empty-column → required-covered → wrong-column for unloading. Required-covered means the required ID is in the selected stack but has another ID above it. An incorrect nonempty selected column that does not contain the required ID is wrong-column. A rejection does not create a job or transfer.
- `navigationReceipts`: `{id,eventSeq,fromTick,tick,direction,heldTicks,mode,beforeCursor,afterCursor}`. Only actual moved cursors get receipts; mode is initial/repeat. A clamped attempt is still visible in lastInput without inventing a move.
- `targetChangeReceipts`: `{id,eventSeq,fromTick,tick,commandId,column,beforeTargetUnits,afterTargetUnits,actualPositionUnits}`. It records a target change, not a physical ballast move or reset.
- `jobStartReceipts`: `{id,eventSeq,fromTick,tick,commandId,job}`. Job is `{jobId,taskId,type,cargoId,column,tier,source,destination,startedFromTick,startedAtTick,travelTicks,jobTotalTicks,stages}` where stages is the ordered four-element array `{stage,index,durationTicks}`. All identity/endpoints/durations/started timestamps are detached immutable records; id is jobId. No cargo transfer is implied by this receipt.
- `craneStageReceipts`: `{id,eventSeq,fromTick,tick,jobId,type,cargoId,stage,stageIndex,stageFromTick,durationTicks,completedElapsedTicks,nextStage,jobComplete}`. Emitted exactly once when a full stage finishes. The next stage can be null at full job completion.
- `transferReceipts`: `{id,eventSeq,fromTick,tick,jobId,boundary,cargoId,massT,from,to,before,after}`. Boundary is shore-pickup/ship-deposit/ship-pickup/shore-delivery/overboard. Endpoints use location/column/tier; ship endpoints retain the actual slot. Ownership before/after are actual transfer boundaries. For overboard, jobId is null because it is a safety event, plus `activeJobId` records any still-active crane job; it must not falsely count a spill as that job's intended transfer.
- `jobCompletionReceipts`: `{id,eventSeq,fromTick,tick,jobId,taskId,type,cargoId,column,tier,jobElapsedTicks,jobTotalTicks,loadJobsCompleted,unloadJobsCompleted,operationPhaseBefore,operationPhaseAfter,ownership}`. Counts and ownership are after that real full job completion. Loading completion occurs only after empty return; unloading completion only after shore delivery.

Within an interval, accepted input events/target or job start come before stage work. A completed stage has one stage-completion event, any specified cargo transfer event, and then any full-job completion event. Roll then uses the resulting ownership. A later spill is a separate transfer after the safety sample, never folded into the earlier crane transfer. Terminal event is last. Event type/reference keys are fixed below. Every event also has id/fromTick/tick. There are no additional predictive events.

| type | exact additional keys | permanent record |
| --- | --- | --- |
| command | commandId | commandReceipts |
| blocked | blockedId | blockedReceipts |
| navigate | navigationId | navigationReceipts |
| target-change | targetChangeId | targetChangeReceipts |
| job-start | jobId | jobStartReceipts |
| crane-stage-complete | stageReceiptId | craneStageReceipts |
| cargo-transfer | transferReceiptId | transferReceipts |
| job-complete | jobCompletionId, jobId | jobCompletionReceipts |
| loss | reason | top-level failures/lostReason |
| win | score | top-level score |

Cancellation and quarantine release are recorded in lastInput, not counted as player command/event. Receipt eventSeq is the id of its single referenced event.

## Last actual physical interval

```js
{
  fromTick, tick: fromTick + 1, seconds: 1 / 60,
  operationPhaseBefore, operationPhaseAfterCrane,
  inputCommandIds: [], blockedInputIds: [],
  ballast: { beforeUnits,targetUnits,afterUnits,deltaUnits,
    beforeXM,targetXM,afterXM },
  crane: { beforeAdvance, advancedStage, afterAdvance,
    stageReceiptIds: [], transferReceiptIds: [], jobCompletionReceiptIds: [] },
  roll: {
    aboardIds, aboard: [/* {id,massT,column,tier,columnXM} */],
    ballastXM, massT, firstMomentTM, centerOfMassXM,
    inertiaTM2, restoringKNmPerRad, dampingKNmSPerRad, gravityTorqueKNm,
    thetaBeforeRad, omegaBeforeRadS, alphaRadS2, omegaAfterRadS, thetaAfterRad
  },
  safety: {
    absoluteRollRad, unsafe, unsafeTicksBefore, unsafeTicksAfter,
    maxUnsafeTicksBefore, maxUnsafeTicksAfter,
    peakAbsRollRadBefore, peakAbsRollRadAfter,
    overboardEligible, overboardTransferId
  },
  departure: {
    eligible, inventoryValid, angleWithinLimit, velocityWithinLimit,
    ballastAtTarget, stableTicksBefore, stableTicksAfter, blockedByFailure
  },
  transferReceiptIds: [],
  failures: [], terminal: null
}
```

Crane beforeAdvance is the post-input crane view, so a newly accepted job is visible at elapsed0; afterAdvance is the actual stage or idle view after this interval's one stage tick. advancedStage is null for an idle interval, otherwise `{jobId,stage,stageIndex,stageFromTick,elapsedBefore,elapsedAfter,durationTicks,completed}`. A boundary's elapsedAfter equals the completed stage duration even though afterAdvance shows the next stage at elapsed0. All snapshots are detached.

`roll.aboard` is a detached ordered row per actual aboard cargo, matching aboardIds, with its true column/tier and columnXM at integration. `roll` records the actual post-ballast/post-crane, **pre-spill** mass configuration used for this one integration. ThetaBefore/OmegaBefore are the previous physical angular state; handoff does not reset/rescale them. Semi-implicit integration uses omegaAfter for thetaAfter. If a spill follows, current `ship` gets the lighter mass properties but this interval retains the true heavier roll inputs. No second integration or torque sample is fabricated.

Safety uses post-roll angle only. Unsafe is strictly abs(theta)>12°; otherwise consecutive count resets. Spill eligibility is abs(theta)>=24° and at least one aboard cargo. Positive roll chooses the occupied largest-x column's top; negative roll the smallest-x occupied column's top. At most one cargo spills. The interval's top-level transferReceiptIds lists both crane and any later spill transfers in true chronological order.

Departure counter is evaluated only if there are no safety/deadline failures. With operationPhase departure, inventory must match the published export/delivery invariants; failure-free wrong inventory is an implementation error, not an alternate win. A legitimate overboard failure on the final crane-completion interval must remain a recorded loss rather than being relabeled an invariant exception. Outside departure, stable count resets to zero. On a failed interval, keep the prior stable counter and mark blockedByFailure; do not fabricate a successful 240th sample. Eligibility requires inclusive angle<=3°, angular speed<=1°/s, exact canonical ballast-target equality, departure phase and valid inventory. The final shore-delivery interval may count as the first stable interval.

## Input lifetime and terminal facts

Direction age uses these fixed indices: first nonneutral direction age1 moves immediately; same-direction repeats at age20,30,40…; a changed sign is a new age1; real neutral resets age0. Root-approved B suppression advances real-axis age but consumes that tick's movement eligibility without queuing a delayed first movement. A new right hold suppressed by fresh B at age1 therefore next becomes eligible only at actual age20 if held unchanged, not at age2.

Each action uses sampleDown=!!(held||Pressed). Armed fresh input disarms even when blocked or when fresh B suppresses fresh A. Real noncancelled false rearms; a repeated pressed-only pulse is not repeated fresh input without a neutral. Cancellation/epoch change clears direction age, quarantines navigation and both actions, and changes no physical job/ballast/cargo. Only a subsequent noncancelled x-neutral and both-actions-false sample releases quarantine; that release sample performs no action. Y is ignored, including for quarantine release.

`lastInput` is `{fromTick,tick,sample:{x,aDown,bDown,cancelled,cancelEpoch},cancelled,quarantinedBefore,quarantinedAfter,quarantineReleased,freshA,freshB,navigationEligible,navigationSuppressed,navigationAttempt,commandIds,blockedIds,navigationIds,before,after}`. NavigationAttempt is null or `{direction,heldTicks,mode,beforeCursor,afterCursor}` and includes clamped attempts; suppressed B navigation has no attempt. Before/after are immediate input configurations, and link arrays contain actual receipt IDs. It is model-observed input only, not a claim about external key dispatch; actual browser dispatch/timing is separate QA evidence.

Failure objects are `{kind,fromTick,tick,actualValue,limitValue,unit,...facts}` in stable order. `overboard` uses absoluteRollRad against the 24° radian threshold, unit rad, with signedRollRad/cargoId/column/tier/massT/transferReceiptId. `sustained-heel` uses actual unsafeTicks against90, unit ticks, with signedRollRad/unsafeThresholdRad. `deadline` uses committed tick againstdeadlineTick, unit ticks. Collect all true same-interval facts; primary lostReason is the first kind. Terminal is null, `{phase:'lost',reason}`, or `{phase:'won',reason:null}`. Failure has priority over a simultaneous stability qualification.

Score on victory is `1000 + 2*Math.floor((deadlineTick-tick)/60) + 100-Math.min(100,blockedCommands)`; otherwise zero. It uses unrounded physical tick and actual rejection count. No provisional transfer or placement earns a completion score.

## Formal and ordinary evidence boundaries

Formal fixtures should cover mass/moment mirrors, empty/hook exclusion, all four stage boundaries, exact job durations, full-load-count versus deposit distinction, top access/rejection without queued action, canonical ballast arrival/retarget, semi-implicit roll with post-transfer mass and no impulse, sustained-angle strictness, overboard inclusivity/direction/top choice, simultaneous transfer+spill and failure priority, exact 240 departure samples/deadline tie, input cancellation and terminal freeze. Fixture state construction is explicitly synthetic.

The ordinary pilot will consume only the final public snapshot and public rules, never a design witness or internal state mutation. Its bounded planning, modes and createPilot/prime/keys/assertion interface are a later separately reviewed artifact. No sequence of winning placements or private assignments is included in this schema. Ordinary trajectories, independent arithmetic, browser input/visual review and real capture remain separate gates.

## Frozen numerical design data

```json
{
  "game": {
    "id": 27,
    "slug": "harbor-counterweight",
    "name": "港口配重",
    "nameEn": "Harbor Counterweight",
    "version": "0.1.0"
  },
  "scope": "Deterministic simplified harbor crane and vessel-roll game. Shore-supported hoisting and damped small-angle roll are modeled; waves, heave, trim, fluid slosh, cargo deformation and engineering certification are not.",
  "createPolicy": {
    "seed": "finite Math.trunc(seed) >>> 0, otherwise 729; metadata only",
    "difficulty": "finite Math.floor then clamp 0..2, otherwise 0"
  },
  "score": "won: 1000 + 2*floor(remainingSeconds) + 100 - min(100,blockedCommands); all other phases zero",
  "layout": {
    "columnXM": [
      -3,
      -1,
      1,
      3
    ],
    "maximumStackHeight": 2,
    "shoreXM": -6,
    "initialCursor": 0,
    "initialStacks": [
      [],
      [],
      [],
      []
    ],
    "initialBallastXM": 0,
    "initialBallastTargetXM": 0
  },
  "ship": {
    "baseMassT": 24,
    "ballastMassT": 8,
    "gravityMS2": 9.81,
    "rollRadiusM": 3,
    "metacentricHeightM": 2,
    "dampingRatio": 0.68,
    "initialRollRad": 0,
    "initialAngularVelocityRadS": 0
  },
  "motion": {
    "tickHz": 60,
    "craneSpeedMS": 3,
    "liftTicks": 24,
    "lowerTicks": 24,
    "ballastSpeedMS": 1,
    "ballastUnitsPerMeter": 60,
    "ballastUnitsPerTick": 1,
    "ballastTargetUnits": [
      -180,
      -60,
      0,
      60,
      180
    ]
  },
  "limits": {
    "unsafeRollDegrees": 12,
    "unsafeConsecutiveTicks": 90,
    "overboardRollDegrees": 24,
    "departureMaximumRollDegrees": 3,
    "departureMaximumAngularVelocityDegreesS": 1,
    "departureStableTicks": 240
  },
  "controls": {
    "navigation": "Four-column horizontal clamped cursor. Only finite numeric non-boolean x is used; all others are0. abs(x)<=0.25 is neutral; sign(x) moves immediately at new-direction age1, then repeats at held ages20,30,40,... . Neutral resets age0. y is ignored.",
    "a": "Only while the crane is idle: load the next shore-queue cargo into the selected non-full column, or unload the required next cargo if it is the selected column's top. No queuing. Wrong, full, empty, busy or completed requests are rejected without transfer.",
    "b": "If selected column x*60 already equals ballastTargetUnits, set targetUnits to0; otherwise set targetUnits to selected column x*60. Actual integer ballastPositionUnits moves by at most1 toward target each tick, and XM=units/60. No immediate mass or position jump.",
    "priority": "Fresh B outranks A and navigation. Otherwise horizontal navigation precedes fresh A. Simultaneous fresh A/B consumes both edges and runs only B.",
    "pauseRetry": "Shared runtime pauses by not stepping; retry recreates every entity/counter. Cancel/new cancelEpoch resets only input/navigation latches, never cancels crane motion or teleports cargo/ballast. Quarantine blocks all navigation/A/B until a real noncancelled x-neutral/A-false/B-false sample; that sample only rearms."
  },
  "phases": [
    "loading",
    "unloading",
    "departure"
  ],
  "transfer": {
    "loadingStages": [
      "lift-shore",
      "carry-to-ship",
      "lower-ship",
      "return-shore"
    ],
    "unloadingStages": [
      "approach-ship",
      "lift-ship",
      "carry-to-shore",
      "lower-shore"
    ],
    "horizontalTicks": "abs(columnXM-shoreXM)*60/craneSpeedMS, exactly60/100/140/180ticks for the4columns",
    "jobTicks": "2*horizontalTicks+liftTicks+lowerTicks; exactly168/248/328/408ticks",
    "shipPickupBoundary": "At completion of lift-ship, remove the top cargo from its ship stack and attach it to the shore-supported hook.",
    "shipDepositBoundary": "At completion of lower-ship, remove cargo from hook and append it to the destination ship stack.",
    "shorePickupBoundary": "At completion of lift-shore, remove next cargo from shore queue and attach to hook.",
    "shoreDeliveryBoundary": "At completion of lower-shore, remove cargo from hook and append to delivered cargo IDs."
  },
  "roll": {
    "massT": "M=baseMassT+ballastMassT+sum(actual onboard cargo massT)",
    "firstMomentTM": "J=ballastMassT*ballastXM+sum(actual onboard cargo massT*columnXM)",
    "centerOfMassXM": "J/M",
    "inertiaTM2": "I=M*rollRadiusM^2",
    "restoringKNmPerRad": "K=M*gravityMS2*metacentricHeightM",
    "dampingKNmSPerRad": "C=2*dampingRatio*sqrt(I*K)",
    "gravityTorqueKNm": "G=gravityMS2*J",
    "integration": "At each interval, advance ballast and crane, commit any cargo transfer, recompute M/J/I/K/C, then alpha=(G-K*theta-C*omega)/I; omegaNext=omega+alpha/60; thetaNext=theta+omegaNext/60.",
    "transferImpulse": "theta and omega are continuous at cargo transfer. Inertia changes without an angular-momentum impulse: a deliberately simplified controlled shore-crane transfer, not a claim of angular-momentum conservation.",
    "stackHeight": "Stack height affects access and drawing only; fixed rollRadius and GM do not depend on stack height.",
    "sampling": "Post-integration theta/omega determine safety and departure counters. No render interpolation enters physics."
  },
  "failurePriority": [
    "overboard",
    "sustained-heel",
    "deadline"
  ],
  "overboard": "If abs(postRollRad)>=24degrees while any cargo is aboard, remove exactly one top cargo from the downhill-most occupied column (largest x for positive theta, smallest x for negative theta), append it to overboard IDs, and lose. Recompute displayed mass/moment after removal but do not integrate a second time. lastInterval retains the pre-spill actual dynamics inputs. If no cargo is aboard this condition creates no overboard event; sustained heel still applies.",
  "sustainedHeel": "Increment unsafeTicks when abs(postRollRad)>12degrees, otherwise reset0. Lose at unsafeTicks>=90. Retain maximumUnsafeTicks and peakAbsRollRad for the complete round.",
  "departure": "After all6 load jobs and all4 ordered unload deliveries are complete, require exactly the2 published export IDs aboard, no cargo on hook, crane idle atshore, and no remaining shore cargo. Increment stableTicks only while abs(theta)<=3degrees and abs(omega)<=1degree/s and ballastPositionUnits==ballastTargetUnits; otherwise reset0. Win at240stableticks. Safety/deadline failure outranks success on the same interval.",
  "levels": [
    {
      "level": 1,
      "name": "日班靠港",
      "nameEn": "Day Shift",
      "massTByCargo": {
        "C1": 6,
        "C2": 3,
        "C3": 5,
        "C4": 4,
        "C5": 2,
        "C6": 6
      },
      "loadOrder": [
        "C1",
        "C2",
        "C3",
        "C4",
        "C5",
        "C6"
      ],
      "unloadOrder": [
        "C2",
        "C5",
        "C1",
        "C4"
      ],
      "exportIds": [
        "C3",
        "C6"
      ],
      "deadlineTick": 4500
    },
    {
      "level": 2,
      "name": "交错转运",
      "nameEn": "Cross Transfer",
      "massTByCargo": {
        "C1": 5,
        "C2": 7,
        "C3": 4,
        "C4": 3,
        "C5": 6,
        "C6": 5
      },
      "loadOrder": [
        "C3",
        "C1",
        "C5",
        "C2",
        "C6",
        "C4"
      ],
      "unloadOrder": [
        "C1",
        "C6",
        "C3",
        "C2"
      ],
      "exportIds": [
        "C4",
        "C5"
      ],
      "deadlineTick": 4800
    },
    {
      "level": 3,
      "name": "夜航重载",
      "nameEn": "Heavy Night Sailing",
      "massTByCargo": {
        "C1": 7,
        "C2": 4,
        "C3": 6,
        "C4": 5,
        "C5": 3,
        "C6": 7
      },
      "loadOrder": [
        "C4",
        "C1",
        "C6",
        "C2",
        "C5",
        "C3"
      ],
      "unloadOrder": [
        "C1",
        "C5",
        "C4",
        "C2"
      ],
      "exportIds": [
        "C3",
        "C6"
      ],
      "deadlineTick": 5100
    }
  ]
}
```
