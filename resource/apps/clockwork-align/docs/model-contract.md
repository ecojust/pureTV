# Clockwork Alignment — public model contract

This contract defines game 32, not an execution result. The complete authored parameter set is embedded under Public level data below. Seed 732 is recorded for reproducibility; these three authored scenarios do not randomize their geometry, targets or speeds.

## Exact mechanical state

Simulation is fixed at 60 ticks/second. One turn is P = 43200 integer angular units, zero is screen-up and positive is clockwise. Store signed **unwrapped displacement** for every physical gear, initially zero. Normalize only display/instant circular comparisons with `mod(x,P) = x - P*floor(x/P)`. Do not round a floating-point angle back into model state. Every declared speed is an integer number of units/tick. All pointers have permanent mounting offset zero, so their unwrapped angle equals their gear displacement. Targets are independent, visible fixed dial marks.

The motor bus is a rotating shaft, with displacement `30*t` and velocity +30. Each train has its own ideal friction clutch between that bus and its 24-tooth driver shaft. The train is initially engaged. There is **no external toothed mesh across this clutch boundary**. Opening it applies an ideal brake to the entire downstream train; all its gears stop together. Closing it imposes the bus velocity on the driver while retaining every existing displacement. A friction clutch can adopt its current relative shaft phase; it does not key the shafts to a shared angular index. This is an explicit zero-inertia abstraction, not a claim of physical coasting or tooth-phase snapping.

Consecutive IDs in `meshChain` are the only external mesh edges. An engaged driver has velocity +30. For each parent/child edge, `v_child = -v_parent * teeth_parent / teeth_child`. Disengaged train velocities are all exactly zero. Thus the published chains have speeds:

| Teeth along chain | Velocities in units/tick |
| --- | --- |
| 24 → 36 → 48 | +30, −20, +15 |
| 24 → 48 → 60 | +30, −15, +12 |
| 24 → 60 → 30 | +30, −12, +24 |
| 24 → 30 → 60 → 36 | +30, −24, +12, −20 |

For every mesh, `teeth_i*v_i + teeth_j*v_j = 0` at all times, and `teeth_i*displacement_i + teeth_j*displacement_j = 0` relative to its initial neutral assembly. Physical body displacement, fixed tooth-artwork mounting offset, and pointer mounting offset are separate quantities. A monitored intermediate wheel is also a real idler. The added unmonitored 30-tooth idler in the third scenario changes parity on the following wheels, rotates at its own correct speed and cancels from the end-to-end tooth ratio. No independent per-pointer motor exists.

Each chain is drawn left-to-right along a horizontal centerline. A tooth crest is at angle `displacement + toothArtworkOffsetUnits`, measured clockwise from screen-up, with exactly the authored tooth count of equally spaced crests. The fixed initial artwork offsets, in chain order, are `[0,600,0]` for 24/36/48, `[0,450,0]` for 24/48/60, `[0,360,720]` for 24/60/30, and `[0,0,0,600]` for 24/30/60/36. These static offsets appear in the public JSON and snapshots; they never alter physical displacement, pointer orientation or target position. At a right/left contact, the authored neutral tooth phases satisfy `mod(Z_i*(10800-offset_i) + Z_j*(32400-offset_j),43200)=21600`: crest opposes trough. Since `Z_i*v_i + Z_j*v_j=0`, the relation stays fixed during rotation and braking. Use compatible small tooth profiles around the tangent pitch circles; do not apply hidden dynamic visual phase compensation. Exact center coordinates and shared pitch scale remain renderer choices.

All state changes at a command boundary retain exact displacement: `gearBefore == gearAfter` for every gear, including on reengagement. There are no angle resets, nearest-target snaps, mesh-index corrections or phase refunds. The closed train determines future velocity from connectivity, not from a target or a remembered release time.

## Instant and full-interval circular alignment

The tolerance is the inclusive circular band of radius 360 units (3 degrees) around each published target τ. For a boundary angle q, signed error is `mod(q-τ+21600,43200)-21600`, in [−21600,21600). Instant alignment is `abs(error) <= 360`.

During an interval with unwrapped pointer endpoints a and b, the **whole closed interval** is aligned iff there exists one integer k such that

`τ − 360 + k*43200 <= min(a,b)` and `max(a,b) <= τ + 360 + k*43200`.

The same k must contain both endpoints and therefore the entire linear path. Equivalently, `ceil((max(a,b)-τ-360)/43200) <= floor((min(a,b)-τ+360)/43200)`. This rejects an entire revolution whose two modulo endpoints happen to fit. A band centered on zero works across the visual wrap because the unwrapped band may be centered at any integer multiple of P. Both band edges are accepted. Every monitored pointer must pass independently in the same interval. Unmonitored driver/idler angles are never secretly included in the goal.

## Appointment window and one continuous hold

Each scenario publishes integer `windowStartTick`, `windowEndTick`, and `holdRequiredTicks`. The deadline is exactly `windowEndTick`. A simulated interval `[t,t+1]` is eligible iff `windowStartTick <= t` and `t+1 <= windowEndTick`. Count one global hold tick only when the interval is eligible and **every** monitored pointer satisfies the complete closed-interval test. If either condition fails, reset `holdTicks` to zero and `holdStartTick` to null. On the first valid interval after zero, set `holdStartTick=t`; on each continuing valid interval increment hold by one. Never keep earned per-pointer hold or combine disjoint visits. Instant alignment before the appointment does not earn or preserve hold.

Success is detected at the end boundary of the first interval whose global hold reaches the required length. A hold ending exactly at `windowEndTick` wins; otherwise reaching that boundary loses with `deadline`. There is no integration beyond that boundary. Quantization is intentional: success requires a continuous interval whose endpoints are integer ticks, rather than estimating sub-tick entry time. Each counted tick certifies all real times within it, so tick sampling cannot hide an excursion.

Normal earliest successful durations are 34, 47 and 60 simulation seconds. Deadlines are 38, 50 and 64 seconds. Pause duration and instructions are outside simulation time.

## Adjustments and budget

The selected train is initially the first JSON train. A toggles that train. B atomically brakes all currently engaged trains. One actual clutch state change costs one adjustment; B therefore costs the number of engaged trains at its command boundary. It is a genuine multi-train emergency brake. Selection, release of a control, waiting and pause cost zero.

A and B are rising-edge commands. Both fresh edges on the same boundary reject the pair as `conflicting_buttons` with no mechanical or budget change. A held button is not a new command. B with all trains already braked records `already_braked`, is not an accepted adjustment, and costs zero. If a request costs more than the remaining budget, reject it atomically as `insufficient_budget`; do not partially brake, spend, or implicitly fall back to A. Rejected commands do not change phase, velocity, hold or budget by themselves. The ensuing simulated interval may of course reset hold if its actual motion leaves tolerance.

After an accepted adjustment leaves budget zero, continue only if all trains are braked and every pointer is instantaneously aligned. Otherwise terminate at that same boundary with `budget_exhausted`, without integrating another interval. Safe zero-budget alignment can wait for the appointment and earn its hold. This rule makes the last budget unit usable. With no budget, attempting A is an unaffordable rejection; B is the zero-cost already-braked no-op. A zero-budget rejection does not turn a safe wait into failure.

This is an intentional final-adjustment rule, not a future-reachability calculation: spending the last unit commits a completely braked, already aligned machine. It applies even if a global hold was partly earned before that last command. The instructions state this restriction explicitly. A same-boundary budget loss has no actual interval, so it preserves holdTicks, holdStartTick, lastEligible, lastAllFullInterval and lastResetReason exactly as historical facts; it does not invent a reset event. The lost terminal state forbids continuing that partial hold, and a partial hold never exempts an unsafe last command from budget failure. Separately, every running train carries a pointer with speed at least 15 units/tick, so a running train cannot earn a whole fresh 120-tick hold while crossing a 720-unit acceptance band; that observation does not override the stated final-adjustment rule.

## Shared runtime and one boundary transaction

Use the frozen framework exports `create(seed=732,difficulty=0)` and `step(state,dt,input)` in that argument order. Difficulty 0/1/2 selects the public scenarios in JSON order. `create` returns a mechanical state already in `phase='playing'`, at tick zero, with initially engaged trains and quarantined input. The host owns instructions/menu/start/pause/resume/retry/scenario selection and simply does not call `step` while stopped. There is no Model `ready` or `paused` phase, lifecycle method, pause input field, or separate snapshot method. The shared framework may expose the returned public model state through its existing snapshot surface.

The following transaction order is normative:

1. If `phase` is won/lost, return a complete no-op before inspecting dt or input. For playing state, dt exactly zero is also a complete no-op. Otherwise dt must be finite, positive, and within absolute 1e-12 of 1/60; reject an invalid dt by throwing before any mutation. Use one exact tick, never fractional integration or dt accumulation.
2. Begin one transaction: increment `transactionCount`, capture fromTick=t, clear this transaction's `lastActionReceipts` and `lastInterval`, normalize the shared input and record its raw/effective fields. Transaction IDs count active valid calls, not mechanical ticks.
3. Process cancellation/quarantine. A true cancelled flag or changed finite cancelEpoch enters quarantine immediately, clears navigation/repeat, and disarms buttons. That same sample cannot clear quarantine. A later uncancelled fully neutral sample clears quarantine but produces no navigation or action. Otherwise quarantined controls remain suppressed. These input operations do not themselves change phase, hold or budget; this transaction still normally integrates and evaluates its real interval.
4. When input was eligible for gameplay at the start of the sample, update selection/repeat first, then resolve fresh A/B in this order: conflict, B already-braked no-op, required-cost calculation, affordability, accepted atomic change. There is no deferred command from a quarantined sample.
5. Apply the zero-budget exhaustion rule immediately after an accepted change. If it loses, publish the action and terminal transaction at t, with `advanced=false`, `fromTick=toTick`, `intervalId=null` and `lastInterval=null`. Do not integrate, advance navigation age, award hold or alter the historical hold/alignment interval facts. Instant alignment is still derived from the unchanged current gear phases.
6. Otherwise record actual post-command engaged states and velocities; integrate every gear and the motor linearly for `[t,t+1]`. Inputs cannot change halfway through this interval. Advance mechanical tick to t+1 and advance repeat age only for a nonquarantined nonzero held direction.
7. Evaluate exact whole-interval alignment/window eligibility, update the one global hold, then resolve win before deadline loss. Publish `lastInterval` and the completed transaction with `advanced=true`. Interval IDs equal toTick; transactions and intervals remain separately identified.

Consequently an interval that won at a boundary finishes before any later request is considered. Deadline resolution likewise precedes any later request. A command at `windowStartTick` acts on the first eligible interval. There is no extra command at `windowEndTick` after its last interval has resolved. A budget-ending transaction can have an action and terminal outcome with no mechanical interval, so an evidence frame/transaction index must never be assumed equal to mechanical tick.

## Shared input, pause and lifecycle

Read the existing shared fields `x`, `y`, `a`, `b`, `aPressed`, `bPressed`, `cancelled` and `cancelEpoch`. Missing input is neutral. Clamp each finite x/y to [−1,+1]; a nonfinite/missing axis becomes zero. Threshold the values actually received by the Model, after any host diagonal normalization: an axis at least +0.55 maps to +1, at most −0.55 to −1, and otherwise to zero. A nonzero Y takes priority over X. No host or mobile control change is required.

Boolean input is true only when the field is literal true. Set effectiveA = raw a OR raw aPressed, and effectiveB likewise. Preserve all four raw booleans and both effective levels in lastInput. The pressed pulses let an observed quick press/release reach the next step; the existing runtime clears pulses after the first step that consumes them. Initial inputState is `{cancelEpoch:0,quarantined:true,aArmed:false,bArmed:false,direction:0,repeatAgeTicks:0}`. In an eligible gameplay sample, freshA = effectiveA AND aArmed, and freshB likewise; then set aArmed = NOT effectiveA and bArmed = NOT effectiveB. Both fresh edges still form one conflicting request and disarm both buttons. A held level or duplicate pulse cannot spend repeatedly. Cancellation/quarantine keeps both buttons disarmed until full neutralization. Do not read or invent pause/start/select/sampleId fields.

Store the last finite cancelEpoch, initially zero. A finite incoming epoch replaces it exactly; a missing/nonfinite epoch retains the prior value. `cancelled===true` or a changed epoch enters quarantine and disarms actions even if the same sample otherwise looks neutral. A first host epoch greater than zero is a real change, not a baseline exception. A later sample clears quarantine only if it has no cancellation, both normalized axes are strictly within (−0.55,+0.55), and all four raw a/b/aPressed/bPressed booleans are false. This clearing sample sets both armed flags true and navigation age zero, integrates normally, and synthesizes no command. Gameplay can respond only to a new subsequent edge. While quarantined, observed held levels cannot become delayed commands.

Negative direction selects the previous train and positive the next, wrapping in authored order. A transition from zero or a direct sign change selects immediately and sets direction age zero. If that first selection is at boundary t and the direction remains held without cancellation, repeat at t+18, t+27, t+36, and so on. At an unchanged-direction boundary, repeat iff age>=18 and `(age-18) mod 9 = 0`. Increment age at the end of an actually integrated interval only while nonquarantined and direction nonzero. Neutral direction and cancellation reset age to zero; budget termination without an interval does not increment it. Navigation at a boundary precedes A, so A acts on the newly selected train.

Host pause, focus loss and disconnect stop Model.step entirely, freezing every model field. Resume retains the mechanical state; the host's existing cancellation epoch/flag makes the next actual step quarantine controls as above. That first resumed step still performs its ordinary mechanical interval: cancellation alone cannot clear hold or brake a train, but actual motion and window/alignment evaluation may advance, reset or complete hold normally. No wall-clock catch-up is introduced. Host start/retry/scenario change creates a fresh quarantined model with zero phases and the authored initial budget/trains. Gameplay B never exits or retries. Host lifecycle UI stays outside the adjustment budget and the two gameplay actions.

## Public evidence and invariants

The concrete public interface below defines model state, action receipts, actual intervals, transactions and hold records. These expose actual physical data rather than an author-supplied solution. An independent consumer must be able to recompute each mesh velocity, phase continuity, circular interval predicate, adjustment expenditure and the one global hold from the public parameter set and records captured after every step. Rendering must use model angles and engaged states, without its own simulated pointer phases. UI countdowns and audit use the Model's mechanical tick, never wall-clock time or a host call counter. Shared display fields such as score/message are public and do not feed back into mechanics.

No public file contains an executable solver, action recommendation, success schedule or embedded witness. Finite manual design arithmetic is kept separately under `author-private/design-handcheck`; downstream implementers, root, pilot and QA must not read that path. They receive the public feasibility summary only.
# Clockwork Alignment — concrete public interface

This is a data/API contract, not an execution result. The embedded Public level data is the only scenario source. Mechanical phase, tick, velocity, budget and hold quantities are integers; framework elapsed/dt and raw analog input retain their usual numeric types. Public Model state must not expose a recommended action/stopping schedule or embed author witness data. An explicitly authorized ordinary test pilot may use public actual state for feedback control, keep its planning diagnostics separate from actual evidence, and submit ordinary input. It may not rewrite model state, omit mechanical steps, or synthesize missing evidence.

## Model boundary

Use the shared UMD/CommonJS surface `create(seed=732,difficulty=0)` and `step(state,dt,input)`; difficulty 0/1/2 maps to scenarios in JSON order. No new exported lifecycle methods or audit callbacks are required. The host owns menu/start/pause/resume/retry/scenario selection, creates fresh models for fresh rounds, and does not step while paused. Input fields are the existing x/y, a/b, aPressed/bPressed, cancelled/cancelEpoch. Their normalization, pulse, quarantine and repeat semantics are fixed in the model contract. Terminal calls and dt=0 are complete no-ops; active positive dt must equal 1/60 within 1e-12 or throw before mutation. Each accepted active step is one transaction with zero or one mechanical intervals.

Also export the pure predicate `intervalBand(fromUnits,toUnits,targetUnits,toleranceUnits,turnUnits)`, used by the production step itself. It returns the unique integer containing-band index k, or null when no single closed band contains the entire interval; k=0 is positive zero. All five arguments must be safe integers, with turnUnits>0, 0<=targetUnits<turnUnits, 0<=2*toleranceUnits<turnUnits, and both integer numerators max(from,to)-target-tolerance and min(from,to)-target+tolerance also safe; otherwise it throws RangeError. Integer quotient/remainder floor/ceil comparisons implement the published inequality without enlarging tolerance. This function has no state, lifecycle, clock, cache or stepping side effects. It permits testing a whole-turn interval that cannot occur at the authored running speeds; that synthetic predicate case is not ordinary gameplay.

No state exposes or consults `solution`, `recommendedStopTick`, private witness data, accumulated per-pointer victories or an equivalent hidden success flag. Public targets are ordinary scenario data. Optional development diagnostics may inspect state and inject ordinary canonical controls only; any raw state inspection surface must remain read-only and must not be required for play.

## Public model state and existing host snapshots

The returned public model state includes the following fields; existing host snapshots may wrap it with their own paused/menu lifecycle fields. The Model does not claim to observe host pause directly:

- Framework fields `width:960`, `height:540`, seed/difficulty, `level` (1–3), `levelName`, scenarioId, `phase` (`playing`, `won`, `lost`), `stage` (`tuning`, `appointment`, `finished`), `tick`, `elapsed=tick/60`, `score`, `lostReason`, `message`, `cursor` and `selectedTrainId`. Cursor is the zero-based selected train row. Stage is tuning before the window, appointment in the eligible window, finished after either terminal result. Score is 1000+100*remainingBudget when won and zero otherwise; message is display text, not a rule input. Seed 732 is the authored/default run seed; another recorded seed does not randomize these authored scenario data.
- `schemaVersion`, game identity, a frozen public copy of scenario/physics configuration, and `terminal` (`null` or `{reason,boundaryTick,transactionId}`). Loss reasons are `deadline` and `budget_exhausted`; success reason is `global_hold_complete`.
- `appointment:{windowStartTick,windowEndTick,holdRequiredTicks,phase}` where phase is `before`, `eligible`, or `closed` according to the current boundary. The eligible boundary range is `[windowStartTick,windowEndTick)`; the end boundary is closed even when a winning last interval ended there.
- `budget:{initial,spent,remaining}` with `initial=spent+remaining` and no negative values.
- `motor:{unwrappedUnits,normalizedUnits,velocityUnitsPerTick}`. This velocity denotes the next-running mechanical rate +30, not wall-clock animation. Gear velocities use the same convention. Host pause stops calls and leaves these fields unchanged; render angles must remain frozen. Actual interval records certify elapsed motion.
- `trains:[{id,engaged,clutchState,gearIds}]` in selection order; `clutchState` is `engaged` or `braked`.
- `gears:[{id,trainId,teeth,role,meshParentId,unwrappedUnits,normalizedUnits,toothArtworkOffsetUnits,velocityUnitsPerTick}]`. The driver has null mesh parent. `velocityUnitsPerTick` is derived from real train connectivity and engagement. The fixed public artwork offset rotates tooth crests only; physical body displacement and pointer mounting remain separate.
- `pointers:[{gearId,mountOffsetUnits,targetUnits,toleranceUnits,unwrappedUnits,normalizedUnits,signedErrorUnits,instantAligned}]`; list all and only authored target-bearing gears.
- `alignment:{allInstantAligned,holdTicks,holdStartTick,lastEligible,lastAllFullInterval,lastResetReason}`. `holdStartTick` is null exactly when holdTicks is zero. Initial holdTicks is zero and the other interval-history fields are null. allInstantAligned is always the actual current-phase predicate. No separate earned hold appears on individual pointers. A zero-interval budget loss preserves every historical hold/last-interval field; terminal lost prevents further accrual.
- `inputState:{cancelEpoch,quarantined,aArmed,bArmed,direction,repeatAgeTicks}` with the exact initial values and armed-edge rules in the model contract. `lastInput` is initially null, then records each active transaction: `{transactionId,rawX,rawY,x,y,axisX,axisY,rawA,rawB,rawAPressed,rawBPressed,effectiveA,effectiveB,cancelled,rawCancelEpoch,cancelEpoch,epochChanged,quarantinedBefore,quarantinedAfter,neutralAcknowledged,freshA,freshB,direction,repeatAgeBefore,repeatAgeAfter,selectionBefore,selectionAfter,navigationApplied,actionReceiptIds}`. rawX/rawY/rawCancelEpoch retain finite received numbers and are null for missing/nonfinite values; x/y are clamped normalized axes. Raw button fields are the literal-true booleans. Selection fields are zero-based row indices before and after navigation; navigationApplied is boolean. freshA/freshB are the eligible edges actually considered, hence false for quarantine/cancellation/neutral acknowledgement. No pause field or synthetic lifecycle event appears here.
- `transactionCount` (initially zero), `lastTransaction` (initially null), immutable `actionReceipts` bank, transaction-local `lastActionReceipts`, and `lastInterval`. A new valid active transaction clears lastInterval before work; an immediate budget loss leaves it null. A terminal or zero-dt no-op changes nothing, including previous evidence fields, and cannot be mistaken for a new transaction because transactionCount remains unchanged.

Each `lastTransaction` is `{id,fromTick,toTick,advanced,actionReceiptIds,intervalId,terminalAfter}`. IDs increase once per valid active positive-dt step. A budget-ending transaction has equal fromTick/toTick, advanced=false and null intervalId; ordinary transactions advance one tick and use intervalId=toTick. Interval records also contain transactionId. The permanent receipt bank stores actual requests only; the Model need not copy an ever-growing interval history into each snapshot. LastTransaction, lastInterval, receipt records and their nested facts are deep-frozen once published; later steps replace last-record pointers without mutating prior records. Scenario/physics copies are also frozen. Every terminal-valued field uses the same null-or-`{reason,boundaryTick,transactionId}` shape.

## Action receipt

Every active, nonquarantined fresh A/B command, including a conflict or a rejected no-op, receives one ordered immutable receipt. Suppressed/held input and selection-only changes have no mechanical receipt; lastInput and inputState expose their actual handling:

- `receiptId` (independent bank sequence starting at 1), `transactionId`, `boundaryTick`, `request` (`toggle_selected`, `brake_all`, or `conflicting_buttons`), `selectedTrainBefore`, `selectedTrainAfter`, and `requestedTrainIds`. Selected IDs are before and after this transaction's navigation, respectively. A requests the post-navigation selected train; B requests only trains engaged immediately before its command, in scenario order; conflict requests an empty list. An all-braked B therefore also has an empty requested list.
- `accepted`, `reason` (`applied`, `conflicting_buttons`, `already_braked`, `insufficient_budget`), `requiredCost` (null for conflict; otherwise actual requested state-change count), `chargedCost`, and complete `budgetBefore`/`budgetAfter` objects `{initial,spent,remaining}`. Rejection/no-op charges zero.
- `clutchesBefore`/`clutchesAfter` are complete arrays of `{trainId,engaged}` in scenario order; `changedTrainIds` contains only actually switched IDs in that order.
- `gearsBefore`/`gearsAfter` are complete arrays of `{id,unwrappedUnits,velocityUnitsPerTick}` in authored train/gear order. They bracket the command after navigation, not an integration interval. Accepted switching preserves every phase exactly; rejected actions preserve phases and velocities.
- `holdBefore`/`holdAfterCommand` are `{holdTicks,holdStartTick,lastEligible,lastAllFullInterval,lastResetReason}` and are always equal because commands alone do not advance or reset interval history. `terminalAfterCommand` uses the common terminal shape. Budget exhaustion may end the round at this boundary while retaining the previously earned partial-hold facts.

When two fresh buttons conflict, issue one combined receipt, not two independent attempts. At most one mechanical action receipt occurs in a transaction. Cancelled, quarantined or held input never becomes an applied command later without a new fresh edge. There are no Model pause/start/lifecycle receipts.

## Actual interval record

Publish one record for **every simulated tick**, not only interesting or successful ticks:

- `intervalId=toTick`, `transactionId`, `fromTick`, `toTick=fromTick+1`, and `precedingActionReceiptIds`.
- `motor:{fromUnwrappedUnits,toUnwrappedUnits,velocityUnitsPerTick}`.
- `trains:[{id,engaged,gears:[{id,teeth,fromUnwrappedUnits,toUnwrappedUnits,velocityUnitsPerTick}]}]`. All start phases are post-command; end minus start equals actual velocity exactly. Engagement is constant throughout the interval.
- `pointerIntervals:[{gearId,mountOffsetUnits,targetUnits,toleranceUnits,fromUnwrappedUnits,toUnwrappedUnits,fromNormalizedUnits,toNormalizedUnits,containingBandIndex,fullIntervalAligned}]`. `containingBandIndex` is the unique integer k containing the entire phase interval, or null if no such k exists. This is an auditable consequence, not authority to override the raw endpoints.
- `windowEligible`, `allPointersFullInterval`, and `hold:{beforeTicks,afterTicks,startBeforeTick,startAfterTick,resetReason}`. Reset reason is `outside_window`, `pointer_outside_band`, or null; outside-window has priority if both predicates fail. Record a reset reason even when beforeTicks was already zero.
- `budgetAtInterval:{initial,spent,remaining}`, `terminalAfter` in the common terminal shape, and `phaseAfter` (`playing`, `won`, `lost`). Budget cannot change inside an interval.

From records captured immediately after every actual step, an independent checker can partition a run into maximal intervals of constant velocity and verify it by piecewise linear algebra. The ordinary evidence collector must save one frame per transactionIndex with `actualFixedTicks=model.tick`, capture every nonnull lastInterval once, and retain immediate zero-interval terminal transactions. Never assume transaction/frame index equals tick. At most 3840 actual intervals occur in an authored round; pausing adds no transactions or intervals. A terminal/zero-dt no-op must not duplicate the prior lastInterval in evidence.

The existing runtime has no Model-specific audit callback. Use the returned lastInterval and transaction fields; do not add a new shared-runtime sink or force full interval history into every browser snapshot. A browser render frame may include several steps, so browser snapshots/video can be sparse and must be labelled as such. They must not be presented as a complete 60 Hz mechanical stream or filled with predicted/missing ticks. Complete independent algebra evidence comes from the authorized ordinary collector reading each actual step. Host pause markers belong to host evidence, not invented Model lifecycle records.

## Renderer and controls

The existing 960×540 WebGL1 atlas/one-draw renderer and mobile joystick plus A/B framework are reused without changing shared runtime contracts. Render state is derived from actual model phases, not wall-clock gear animation. Interpolation may visually interpolate the last completed interval for smoothness but cannot predict beyond authoritative phases, cross a host pause, hide a clutch command or drive gameplay. Mechanical countdowns use model.tick even if the host's own call/time counter differs at a zero-interval budget termination.

Use two or three separate train rows. Counts are 6, 9 and 10 real gears; monitored pointer counts are 4, 6 and 6. Every train has its own clutch at the motor-shaft boundary. Gears joined by a declared edge must appear meshed with pitch radii proportional to true tooth counts; no row-to-row gear contact may imply an undeclared constraint. Exact centers are a renderer choice. A common pitch radius of roughly 0.7–1.0 logical pixels per tooth gives largest radius 42–60 pixels and permits all three rows; no target-bearing wheel may be shrunk until its fixed mark and actual pointer become indistinguishable.

Differentiate a fixed target sector from the moving mounted pointer, and show tooth counts and actual CW/CCW/braked state. The full mesh chain, including the added true idler, stays visible. A driver or unmonitored idler must not have a decorative arrow that looks like an additional goal pointer. Show one global hold bar, the published appointment window, current simulation time, remaining adjustments and selected train. Before the window, an aligned train may show “已对准 · 等待预约”, but must not fill a private progress meter. Once eligible, the single global bar either advances for the whole simultaneous set or resets.

The blueprint/instruction view exposes targets and topology before start. A game-local read-only DOM blueprint block in game.js, synchronized to the actual scenario from existing hud(s), is permitted for the menu/paused dialog; this requires no shared-runtime change and introduces no gameplay inputs. Pause preserves the same observable mechanical state and permits reading that blueprint; it does not advance time or make adjustments. Result screens distinguish exhausted adjustment budget from missed appointment. Retry and scenario choice remain reachable with fresh keyboard/mobile controls.

## Acceptance examples without solution routes

These are semantic boundary obligations, not a runnable test script: opposite mesh signs and exact inverse-tooth ratios; braked whole train with motor still advancing; reengagement at unchanged nonzero phase; a wrapped target at zero; a synthetic full revolution with aligned endpoints rejected by the full-interval predicate; alignment before the appointment earning zero; separate pointer visits earning zero global hold; a break resetting an already growing global hold; an unaffordable multi-brake leaving every clutch and budget unchanged; a safe final adjustment retaining zero-budget wait; an unsafe final adjustment losing immediately; a hold finishing exactly at the deadline winning; pause/resume and held-input quarantine preserving mechanical continuity.

## Concrete configuration and field conventions

- `schemaVersion=1`. `identity` is a deep-frozen copy of the public JSON identity object, retaining its exact keys (`gameId,name,englishName,slug,packageId,versionName,versionCode,seed,actionCount,assignmentSha256`). Its seed is the authored default; top-level `seed` records the run seed. `scenario` is the complete deep-frozen selected scenario object, with unchanged `id,name,adjustmentBudget,windowStartTick,windowEndTick,holdRequiredTicks,windowLabel,trains`; each configured train retains `id,name,meshChain,gears` and all authored gear fields. `scenarioId=scenario.id`, `levelName=scenario.name`.
- `physics` is a deep-frozen object containing every public `units` key at its top level, plus `mechanics` equal to the complete public mechanics object, and `stepSeconds=1/60`, `dtTolerance=1e-12`, `axisThreshold=0.55`, `navigationFirstRepeatTick=18`, `navigationRepeatPeriodTicks=9`. Thus rendering reads `physics.angleUnitsPerTurn`, `physics.angleUnitsPerDegree` and `physics.ticksPerSecond`. No rules are inferred from artwork.
- `create(seed=732,difficulty=0)` accepts a finite nonnegative safe-integer run seed; any other supplied seed throws RangeError. Difficulty must be an integer 0..2, otherwise RangeError. Only omitted arguments use defaults. There is no object/lifecycle overload. Different valid seeds record identity without changing these authored scenarios.
- Dynamic `trains` additionally include their authored `name`, for display. All other train/gear/pointer keys are exactly the shapes above. Gear/pointer lists follow scenario train order and gear order; pointers include only target-bearing gears. No future-control or suggested-stop field is added.
- `lastInput.direction` is the resulting latch direction (-1/0/+1); `repeatAgeBefore` is the latch age before this transaction's input handling, `repeatAgeAfter` is its final age after any real interval. `selectionBefore` and `selectionAfter` bracket navigation; `navigationApplied` is true only when navigation actually selected the adjacent wrapped row. The final cursor equals selectionAfter. Input source normalization does not itself advance repeat age.
- `lastActionReceipts` starts as an empty frozen array and is replaced with a frozen array of the actual current transaction's zero or one immutable receipt. `actionReceipts` is append-only; each record and nested value is deeply frozen. `lastInput` is also deep-frozen after the transaction completes. No `status`, `simulationAdvancing`, `events`, `failures`, synthetic lifecycle bank or redundant `mostRecentCompletedInterval` is added; terminal reasons use `terminal` and the framework `lostReason`.
- Initially `terminal`, `lastInput`, `lastInterval`, and `lastTransaction` are null; `actionReceipts` is empty, transactionCount/tick/elapsed/score/cursor are zero, all trains are engaged, all gear and motor displacements are zero. `alignment` has allInstantAligned derived from those actual pointers, holdTicks=0, holdStartTick=null, lastEligible=null, lastAllFullInterval=null, lastResetReason=null. `lostReason` is null unless phase is lost, then it equals terminal.reason.
- `message` is Chinese display text reflecting the actual appointment/hold or terminal result. It never controls mechanics. No additional derived display state is required; the UI computes time remaining from appointment.windowEndTick and model.tick.

## Public level data

```json
{
  "schemaVersion": 1,
  "designStatus": "static-proposal-awaiting-root-review",
  "identity": {
    "gameId": 32,
    "name": "齿轮同刻",
    "englishName": "Clockwork Alignment",
    "slug": "clockwork-align",
    "packageId": "com.ecojust.clockworkaligntv",
    "versionName": "0.1.0",
    "versionCode": 1,
    "seed": 732,
    "actionCount": 2,
    "assignmentSha256": "64fa9389dcdd00f485f383087953f69f0b60c63e32aed8187408f7097b8264c9"
  },
  "premise": "A motor drives separately clutched meshed gear trains. Brake each whole train when its two mounted pointers jointly fit their published marks. Every pointer must then share one uninterrupted hold inside the future appointment window.",
  "units": {
    "ticksPerSecond": 60,
    "angleUnitsPerTurn": 43200,
    "angleUnitsPerDegree": 120,
    "zeroDirection": "screen-up",
    "positiveDirection": "clockwise",
    "phaseRepresentation": "signed integer unwrapped angular displacement; normalized display angle in [0,43200)",
    "normalization": "mod(x,P)=x-P*floor(x/P), P=43200",
    "pointerToleranceUnits": 360,
    "toleranceBoundary": "inclusive",
    "integration": "one exact constant-velocity closed interval [t,t+1] per running tick"
  },
  "mechanics": {
    "motor": {"id": "motor", "shaftSpeedUnitsPerTick": 30, "initialUnwrappedUnits": 0},
    "trainDriverTeeth": 24,
    "initialTrainEngaged": true,
    "initialGearUnwrappedUnits": 0,
    "pointerMountOffsetUnits": 0,
    "clutchKind": "ideal phase-preserving friction clutch with brake on the whole downstream train",
    "clutchBoundary": "motor shaft to the independent train driver shaft; this is a coaxial coupling, not a toothed mesh",
    "engagedRule": "driver velocity equals +30; each external mesh reverses sign and multiplies angular velocity by parentTeeth/childTeeth",
    "releasedRule": "all gears in that train have exactly zero velocity; other trains and the motor retain their velocities",
    "switchRule": "all unwrapped gear phases and pointer mounting offsets remain exactly unchanged at command time; only subsequent velocities change",
    "inertia": "none; the ideal clutch and brake impose velocity instantly without a position jump",
    "meshDisplacementInvariant": "for each edge i--j, teeth_i*unwrapped_i + teeth_j*unwrapped_j = 0, relative to the authored neutral assembly",
    "idlerRule": "an intermediate gear is a real external mesh at both edges; it changes downstream direction parity, its teeth set its own speed, and its teeth cancel out of the final driver-to-output speed ratio",
    "pointerRule": "only gears with targetUnits are monitored; all pointer marks and tolerances are visible from the instruction/blueprint screen onward",
    "geometryRule": "render only declared mesh edges; each chain lies left-to-right on one horizontal centerline with common pitch-radius-per-tooth and tangent pitch circles; do not depict a rigid mesh from motor bus to a braked train",
    "toothArtworkConvention": "a gear's tooth crest is at screen-up when displacement plus fixed toothArtworkOffsetUnits is zero; repeat exactly teeth crests per turn. Tooth artwork offsets do not affect physical displacement or the pointer mounting offset.",
    "toothArtworkOffsetsByChain": [
      {"teeth": [24,36,48], "offsetUnitsInChainOrder": [0,600,0]},
      {"teeth": [24,48,60], "offsetUnitsInChainOrder": [0,450,0]},
      {"teeth": [24,60,30], "offsetUnitsInChainOrder": [0,360,720]},
      {"teeth": [24,30,60,36], "offsetUnitsInChainOrder": [0,0,0,600]}
    ]
  },
  "controls": {
    "directions": "up/left selects the previous train; down/right selects the next; selection wraps",
    "a": {"label": "切换离合", "meaning": "toggle the selected train between engaged and braked", "cost": "one actual clutch state change"},
    "b": {"label": "全部制动", "meaning": "atomically brake every currently engaged train", "cost": "number of actually changed clutches; reject the entire request if that exceeds remaining budget"},
    "bWhenAllBraked": "no-op with zero cost",
    "freshAAndBTogether": "reject both as conflicting_buttons, with zero cost; selection may still move",
    "pause": "separate fixed host entry, never mapped onto B; the host freezes the model by not calling step",
    "sharedRuntimeInput": "step(state,dt,input) consumes x/y floats, literal-true a/b/aPressed/bPressed, cancelled and cancelEpoch; threshold x/y at +/-0.55 inside the Model after any host normalization",
    "cancellation": "cancelled or a changed finite cancelEpoch enters input quarantine without skipping the ordinary mechanical interval; a subsequent uncancelled neutral sample clears quarantine but issues no gameplay command",
    "instructionText": [
      "同一列的齿轮一起转、一起停。啮合相邻轮转向相反，齿数越多转得越慢。",
      "方向键选列；A接合/制动该列；B全部制动。每改变一个离合器消耗1次调节。",
      "指针停在各自金色目标带内。所有指针只能在预约时间窗里共同连续保持，之前对齐不计时。",
      "最后一次调节用完时，只有全部列已制动且所有指针已在目标带内，才能继续等待成功。"
    ]
  },
  "roundRules": {
    "holdKind": "one contiguous global interval, aligned to integer tick boundaries, entirely contained in the published target window",
    "wholeIntervalAlignment": "for each pointer, one integer k must satisfy target-tolerance+k*P <= min(pointerStart,pointerEnd) and max(pointerStart,pointerEnd) <= target+tolerance+k*P; endpoint-only modulo checks are forbidden",
    "eligibleInterval": "windowStartTick <= fromTick and toTick <= windowEndTick",
    "accumulation": "increment one global hold tick only if the entire eligible interval satisfies every pointer; otherwise reset global hold to zero; never store per-pointer earned hold",
    "beforeWindow": "zero eligible hold even if all pointers already fit",
    "deadline": "windowEndTick is also the round deadline",
    "deadlinePriority": "resolve the completed interval first; reaching holdRequiredTicks exactly at windowEndTick wins; otherwise lose deadline at that boundary",
    "budgetExhaustion": "after an accepted command leaves zero budget, allow continuation only if every train is braked and every pointer instantaneously fits its inclusive circular tolerance; otherwise lose budget_exhausted immediately at that command boundary",
    "zeroBudgetSafeWait": "braked aligned trains may wait for the target window and complete the hold with zero budget",
    "budgetRejection": "an unaffordable request changes nothing and costs nothing; insufficient budget for B does not prohibit a cheaper A",
    "terminal": "first terminal result is immutable; no further interval, adjustment, selection or hold progress is applied",
    "pause": "host stops calling Model.step, so mechanical tick, phases, hold and deadline all freeze; on resume shared cancelled/cancelEpoch input requires neutralized controls; no wall-clock catch-up",
    "normalRoundDurationSeconds": [30, 90]
  },
  "scenarios": [
    {
      "id": "twin-appointment",
      "name": "双列合拍",
      "adjustmentBudget": 4,
      "windowStartTick": 1920,
      "windowEndTick": 2280,
      "holdRequiredTicks": 120,
      "windowLabel": "32.0–38.0秒 · 同时保持2.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 12000},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 23400}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 16200},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 21600}
          ]
        }
      ]
    },
    {
      "id": "three-train-meeting",
      "name": "三列会时",
      "adjustmentBudget": 5,
      "windowStartTick": 2640,
      "windowEndTick": 3000,
      "holdRequiredTicks": 180,
      "windowLabel": "44.0–50.0秒 · 同时保持3.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 6000},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 27900}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 10800},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 25920}
          ]
        },
        {
          "id": "jade", "name": "翡翠列", "meshChain": ["jade-drive", "jade-mid", "jade-tip"],
          "gears": [
            {"id": "jade-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "jade-mid", "teeth": 60, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -12, "targetUnits": 12960},
            {"id": "jade-tip", "teeth": 30, "role": "monitored-output", "engagedVelocityUnitsPerTick": 24, "targetUnits": 17280}
          ]
        }
      ]
    },
    {
      "id": "idler-parity",
      "name": "惰轮换向",
      "adjustmentBudget": 7,
      "windowStartTick": 3360,
      "windowEndTick": 3840,
      "holdRequiredTicks": 240,
      "windowLabel": "56.0–64.0秒 · 同时保持4.0秒",
      "trains": [
        {
          "id": "amber", "name": "琥珀列", "meshChain": ["amber-drive", "amber-mid", "amber-tip"],
          "gears": [
            {"id": "amber-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "amber-mid", "teeth": 36, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -20, "targetUnits": 38400},
            {"id": "amber-tip", "teeth": 48, "role": "monitored-output", "engagedVelocityUnitsPerTick": 15, "targetUnits": 36000}
          ]
        },
        {
          "id": "cobalt", "name": "钴蓝列", "meshChain": ["cobalt-drive", "cobalt-mid", "cobalt-tip"],
          "gears": [
            {"id": "cobalt-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "cobalt-mid", "teeth": 48, "role": "monitored-idler", "engagedVelocityUnitsPerTick": -15, "targetUnits": 0},
            {"id": "cobalt-tip", "teeth": 60, "role": "monitored-output", "engagedVelocityUnitsPerTick": 12, "targetUnits": 34560}
          ]
        },
        {
          "id": "jade", "name": "翡翠列", "meshChain": ["jade-drive", "jade-idler", "jade-mid", "jade-tip"],
          "gears": [
            {"id": "jade-drive", "teeth": 24, "role": "driver", "engagedVelocityUnitsPerTick": 30},
            {"id": "jade-idler", "teeth": 30, "role": "unmonitored-idler", "engagedVelocityUnitsPerTick": -24},
            {"id": "jade-mid", "teeth": 60, "role": "monitored-idler", "engagedVelocityUnitsPerTick": 12, "targetUnits": 38880},
            {"id": "jade-tip", "teeth": 36, "role": "monitored-output", "engagedVelocityUnitsPerTick": -20, "targetUnits": 21600}
          ]
        }
      ]
    }
  ],
  "presentation": {
    "logicalResolution": [960, 540],
    "renderer": "shared WebGL1 atlas, one draw submission; no additional runtime assets required",
    "trainRows": "two or three horizontal rows; exact centers belong to renderer, with tangent declared meshes and equal pitch-radius-per-tooth within each row",
    "gearCountsByScenario": [6, 9, 10],
    "monitoredPointerCountsByScenario": [4, 6, 6],
    "requiredVisibleFacts": ["each tooth count", "actual signed direction/speed", "clutch engaged or braked", "actual pointer and fixed target sector", "selected train", "remaining adjustment units", "published window and current time", "single global hold bar", "before-window versus eligible versus terminal state"],
    "targetBlueprint": "instructions and paused view show every tooth count, full actual mesh chain, target angle in degrees or clock dial form, tolerance and appointment window; no hidden target plan",
    "readability": "motor bus and clutch plates use shaft symbols, not invented mesh edges; driver and unmonitored idler have no target-pointer decoration"
  },
  "sharedRuntime": {
    "exports": ["create(seed=732,difficulty=0)", "step(state,dt,input)"],
    "difficultyMapping": "0/1/2 select scenarios in authored JSON order",
    "modelPhase": "playing, won, or lost; ready/menu/paused lifecycle belongs to the host",
    "fixedDtSeconds": "1/60, accepted within absolute tolerance 1e-12; zero dt and terminal steps are complete no-ops",
    "transactionCount": "increment once per valid active positive-dt step; one transaction advances zero or one mechanical ticks",
    "score": "1000 + 100*remainingBudget on win, otherwise zero; display only, never a mechanical input"
  },
  "authorizationBoundary": "Static design only. This proposal authorizes no production change, model execution, solver, automated search, browser run, packaging or publication."
}
```
