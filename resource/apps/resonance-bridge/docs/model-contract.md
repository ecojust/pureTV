# 共振浮桥 — public model contract

This public contract defines the rules, not a passed execution result. Immutable numeric data is embedded under Public level data below. It defines three complete scenarios; a retry uses exactly the same selected scenario. The author-only finite hand witness is deliberately excluded from this contract and from production/pilot/auditor inputs.

## Simulation and continuity

`create({seed:731,difficulty})` selects level `difficulty+1`, with difficulty restricted to integer 0, 1 or 2. The model begins at tick 0, phase `playing`, stage `tuning`, no dispatched people, cursor 0 and zero score. The runtime's external menu does not call `step`.

Each active `step` consumes one interval `[t,t+1]` of exactly 1/60 second. `dt=0` is a complete no-op, including input handling. A finite positive dt within 1e-12 of 1/60 is accepted as that single fixed interval; every other active dt throws before mutation. An already won/lost model returns unchanged before inspecting dt or input. `elapsed=tick/60` is derived, not accumulated floating time.

Each of three plates has integer, unwrapped `phaseUnits`. Reduce it modulo 6000 only for the displayed phase and the sine evaluation. A plate's endpoint height is:

`amplitude = 0.8 + resonanceUnits / 3000`

`height = amplitude * sin(2*pi*(phaseUnits mod 6000)/6000)`.

The two banks are fixed at height 0. Between successive model endpoints, plate heights move by continuous linear interpolation. This interpolation is the physical path used for contact safety; the contract does **not** claim that it audited the interior extrema of a continuous sine curve. The phase itself advances linearly over that interval at the chosen integer phase speed. This fixed-step approximation is explicit and applies equally to rendering and independent review.

An input command changes frequency or schedules a pulse at the **beginning** of the interval. It never assigns phase, resonance, amplitude or height at that instant. The next endpoint then advances from the old endpoint. Thus a frequency change has no instantaneous position jump, and even a phase correction moves continuously.

The base speeds are 10, 15, 20 phase units per tick, corresponding to 0.10, 0.15 and 0.20 Hz. A phase action adds 25 phase units in each of exactly ten consecutive intervals, totaling 250 units (15 degrees). If accepted at fromTick `t`, it covers `[t,t+1]` through `[t+9,t+10]`; its final increment occurs in the state ending at `t+10`. It cannot stack with another pulse. A new phase action on the pulse's final interval is still rejected because that pulse was active at the command instant.

The actual effective speed for an interval is base speed plus 25 if a pulse is active in that interval. Only effective speed 15 excites the resonance envelope. It increases `resonanceUnits` by 1 per interval; all other available effective speeds decrease it by 2, clipped at zero. This quantity is an amplitude-envelope accumulator, not a claim of energy measured in joules. Its evolution depends on actual driving time and speed, never the number of button presses. Pulse completion changes the next interval's effective speed; it does not retroactively change the just-completed interval.

Resonance 1200 and amplitude 1.2 m are still safe. A resulting resonance strictly above 1200 is `unstable-amplitude`. There is no clipping at the upper limit: the true overshoot is retained. Equality is inclusive for both the amplitude safety limit and the 0.35 m contact-gap limit.

## Selection and controls

The four cursor items are plate 1, plate 2, plate 3 and the dispatch gate. Left/right clamp to 0..3. Navigation is applied before a fresh action on that same interval.

Fresh A on a plate cycles its base-frequency index once: 0→1→2→0. Fresh B on a plate requests one 250-unit phase pulse. B during an active pulse produces a rejected action receipt with reason `phase-pulse-active`; it does not alter or extend that pulse. Held buttons never repeat actions. Fresh A on the gate dispatches the queue once; another A there is rejected with `already-dispatched`. B on the gate is rejected with `no-oscillator`.

If A and B are fresh together, B has priority and both fresh edges are consumed. No second action is deferred to the next interval. A released button rearms only when that button is false in a permitted sample. Input axis values are clamped to [-1,1]; absent/nonfinite axes become 0. A horizontal axis at or beyond ±0.45 selects direction. The first held-direction interval navigates once; subsequent moves occur at direction ages 24, 36, 48, ... . Neutral resets direction and age. A direction reversal starts a new age-1 press. At a clamped edge, the attempted navigation still ages but applied delta is 0. The vertical axis is ignored for navigation but counts when establishing full neutral.

Normalize only explicit `cancelled === true` as cancellation; a changed finite cancellation epoch is a separate trigger. Either trigger quarantines controls, clears navigation and disarms A/B, but does not stop phase, resonance, an existing pulse or pedestrian movement. The cancelling interval cannot also acknowledge neutral. A later sample with abs(x)<0.45, abs(y)<0.45 and neither A nor B clears quarantine and rearms both, but performs no navigation/action in that same interval. Partial neutral cannot clear it. A normal button release outside quarantine is not labelled a neutral acknowledgement. The runtime separately freezes the entire model during pause/disconnect; there is no catch-up time on resume.

## Queue and pedestrian movement

There are five path nodes: left bank 0, plates 1..3, right bank 4. Four gaps have edge indices 0..3, connecting consecutive nodes. A scenario contains 3, 4 or 5 distinct people. Their initial stage is `pending` and there are no global contact credits they can borrow.

Dispatch at fromTick `d` creates fixed release times `d + 600*(id-1)` for people with ids 1..N. A person whose release time equals the current fromTick enters `waiting` at node 0 at the beginning of that interval. The first person may therefore start accumulating contact during the dispatch interval. Release receipts are observed in the resulting state and retain both the scheduled/from tick and the resulting receipt tick.

People do not collide, push, or alter plate loads. Each follows the same path independently. The renderer may spread waiting avatars or show a count, but must not invent collision delays in the physics.

For each interval, calculate gapFrom and gapTo from the actual old/new heights of the nodes forming each edge. Because each node interpolates linearly, the maximum absolute gap over the **entire interval** is exactly `max(abs(gapFrom),abs(gapTo))`. An interval is safe iff that maximum is <=0.35 m. Its `closing` flag is exactly `abs(gapTo) <= abs(gapFrom)`.

For a person already waiting at an edge at interval start, a safe interval adds one to that person's consecutive contact count, capped at 24; an unsafe interval resets it to zero. At the interval's end, count 24 **and** the current closing flag allow that person to begin crossing. The crossing starts with age 0 at that end tick. Its first moving interval is the following interval: the qualifying interval is never counted twice.

This closing requirement matters. Someone arriving midway through an opening window can accumulate past contact but must wait for a closing interval rather than being forced to step into the end of that window. The rule uses current actual heights, not a guessed future route or a private solution.

For a person already crossing at interval start, check that entire actual interval first. If it is unsafe, mark that person fallen, preserve the last safe movement progress/height, and append the failed edge/interval/gaps. Do not increment a successful crossing tick for that failed interval. If safe, increment crossing age and movement progress once. Age 24 finishes the crossing. Entering plate 1..3 begins `walking` at age 0; entering node 4 marks `passed`. An arrival cannot also walk, count new contact or cross again during the same interval.

Walking across one plate takes 120 actual intervals and increments movement progress once per interval. At its completion, the person becomes waiting at that plate's outgoing edge, with contact count 0. The walking-completion interval is not credited as contact. The person follows that plate's actual height while walking or waiting. A safe crossing follows the linear interpolation between its current adjacent node heights using crossing age/24 as its horizontal progress. Pending and passed people stand on the zero-height banks.

There are exactly 456 successful movement intervals in a full journey: three plate walks of 120 plus four crossings of 24. Waiting time is additional. A fallen person's stored height/progress stop at the failed interval's beginning. Other people still receive their actual interval transition so all simultaneous failure facts are retained.

Tuning remains possible after dispatch. A new phase/frequency command can genuinely break a crossing already in progress; the start qualification is not immunity. Current amplitude differences are always accounted for in actual gaps. An illustrative phase-alignment bound is never substituted for these checks.

## Exact interval order and terminal rules

1. Return immediately for terminal state or dt=0; otherwise validate dt before any mutation and normalize input.
2. At fromTick t, process cancellation/quarantine or navigation and at most one fresh action. Command receipts preserve the pre-command and post-command physical position, which must match. A newly accepted pulse is active for this interval.
3. Release every scheduled pending person whose time is t. Remember each person's stage after release; later transitions are based on that one start-stage only.
4. Advance all three phases by their actual effective speeds. Integrate their resonance envelopes, derive amplitude and endpoint height, then decrement active pulse duration. Append a completed-pulse receipt when its tenth actual interval ends.
5. Derive the four complete interval contact records. Advance each person by exactly the rule for their remembered start-stage: waiting, crossing, walking or already passed/pending. This includes any real fall and any natural pass.
6. Set tick=t+1 and elapsed=tick/60. Retain all amplitude-limit and fall facts for this interval. If none exist and people remain at tick>=5400, add the deadline failure.
7. Any failure ends phase `lost`, stage `finished`, score 0. Priority is unstable amplitude, then pedestrian fall, then deadline; within an amplitude/fall type, smaller plate/person id wins `lostReason` detail while all facts remain available. If no failure and everyone passed, end phase `won`, stage `finished`, and compute the declared score. Otherwise remain playing, stage tuning before dispatch or crossing after dispatch.

Passing exactly at tick 5400 succeeds if no amplitude/fall event occurred in that same interval. Mechanical failure still wins over simultaneous last-person arrival. There are no further actions, receipts, elapsed time or motion after a terminal state.

## Evidence and independent review

All scenario constants, initial states and numerical rules are public. The pilot may derive its own control strategy solely from them and actual snapshots; it must not read the author-only witness. No model, planner or executable design checker has been run during this design step.

Action, completed-pulse and pedestrian-event receipts are immutable append-only facts. They describe actual inputs/transitions, not predicted safe paths. Every interval exposes the actual phase/resonance/height endpoints and actual contact and pedestrian decisions. Sparse capture observations must stay sparse; absent intervals cannot be invented in a review.

An independent auditor can derive phase from the initial phase plus piecewise constant base-speed durations and actual pulse increments, and derive each resonance segment from its actual effective speed and clipped envelope equation. Sine endpoint values may be compared to 1e-10 m numerical tolerance, but integer phase, ticks, contact decisions, receipt indices and state transitions are exact. This tolerance does not widen the production gap threshold.

The design's finite hand feasibility certificate supplies only aggregate bounds. It is not a success report for production, ordinary inputs, hardware, browser, video or performance. Those require the later actual runs.
# 共振浮桥 — concrete public snapshot API

This interface fixes field spelling before implementation execution. Model module exports `create` and `step` for both CommonJS and the browser `PureModel`. Shared runtime owns its outer menu, pause, connection status and best score. No private planning field belongs in the public model.

## Top-level state

`width=960`, `height=540`, `seed=731`, `difficulty`, `level`, `levelName`, `levelNameEn`, immutable `physics`, and immutable selected `scenario` expose the public setup. Other scenarios remain public through the embedded Public level data and menu configuration.

`phase` is playing/won/lost. `stage` is tuning/crossing/finished. `tick`, derived `elapsed`, `score`, nullable `lostReason`, and the actual `failures` array describe the run. `cursor` is 0..3. `dispatchAtTick` is null until the one accepted dispatch; `scheduledReleaseTicks` is initially empty. `passedCount`, `fallenCount`, `remainingCount` and `deadlineTicksRemaining=max(0,5400-tick)` are derived from actual state.

## Boards

`boards` has exactly three records with 0-based `index` and a human-facing label. Each contains:

- `phaseUnits`: unwrapped integer phase; `phaseWrappedUnits`: its residue 0..5999; `phaseRadians`: radians of that residue.
- `frequencyIndex`, `basePhaseUnitsPerTick`, and `effectivePhaseUnitsPerTick`. The last describes the **next** interval implied by current frequency and remaining pulse; the actual just-finished effective speed is in `lastInterval`.
- `resonanceUnits`, derived `amplitudeMetres`, and `heightMetres` at this state endpoint.
- `trimTicksRemaining` 0..10, nullable `activePulseId` and `activePulseStartedAtTick`, and integer `completedPulseCount`. Completed pulses clear the active fields. A fresh pulse action uses the next globally sequential pulse id only when accepted.

## People

`pedestrians` contains ids 1..N, with `stage` pending/waiting/crossing/walking/passed/fallen and:

- Nullable `scheduledReleaseTick`, `releasedAtTick`, `passedAtTick` and `fallenAtTick`.
- `node` 0..4. While crossing, node remains the source node. `edgeIndex` is the outgoing/source edge for waiting/crossing, and null for pending/walking/passed/fallen; a fall separately retains `failedEdgeIndex`.
- `contactTicks` 0..24 only while waiting, otherwise 0. It begins at 0 on every arrival at a new edge.
- `crossingAgeTicks` and nullable `crossingStartedAtTick`, meaningful while crossing; reset to 0/null after crossing completion or fall. The completion/fall event preserves the actual completed age.
- `walkingAgeTicks`, meaningful while walking, otherwise 0. Arrival starts at age 0; the next interval is the first walking interval.
- `movementTicks` 0..456, counting only successful crossing/walking intervals. Pending starts at 0, passed ends at 456; waiting does not change it.
- `heightMetres`, evaluated from the current actual path nodes and crossing age. A fallen person's value is the last safe starting height of its failed interval and then freezes.
- `crossingMaxGapMetres` tracks maximum actually checked endpoint gap during the active crossing only; reset after it finishes or fails, with the completed value retained in the event receipt.

## Append-only receipts

`actionReceipts`, `phasePulseReceipts` and `pedestrianEvents` start empty. Each bank uses sequential ids starting at 1; old records never mutate. All have `fromTick` and resulting `tick=fromTick+1`. Fields recording a transition at the end of an interval use that resulting tick explicitly. Release/dispatch at the interval beginning retain the fromTick explicitly, so a receipt at resulting tick 1 can correctly describe a release at fromTick 0 without pretending it existed in the initial state.

Action receipts include raw button key a/b, kind frequency/phase/dispatch, selected plate index or null, accepted flag, rejection reason or null, cursor, and the actual command-state before/after. For a selected plate, both command-state objects expose phase, resonance, amplitude, height, frequency index and pulse remaining. Physical phase/resonance/amplitude/height must remain equal across a command even when frequency or pulse state changes. Accepted phase receipts add `pulseId`, `pulseStartedAtTick` and 250 requested extra units; accepted dispatch adds the actual release schedule. An ignored held button is not an action receipt.

Completed phase-pulse receipts contain `pulseId`, originating action receipt id, plate index, start tick, completed tick, actual interval count 10 and actual extra phase units 250. They are appended only on the tenth real interval, not at scheduling time. Cancellation does not silently delete an existing pulse.

Pedestrian event kinds are released, crossing-started, crossing-completed, walking-completed, passed and fallen. Each includes person id and the actual transition details. Crossing-started includes source edge, started-at tick, the achieved 24 contact intervals and its final qualifying gapFrom/gapTo/closing values. Crossing-completed/fallen includes started-at tick, actual successful crossing intervals and maximum actually inspected gap. Fallen additionally preserves the failed interval endpoints and gap values. A passed event is the actual final crossing completion; do not append both a redundant crossing-completed and passed event for edge 3. A board crossing completion similarly appends crossing-completed and changes stage to walking, without a synthetic walking event at age 0.

## Per-interval evidence

`lastAction` is the latest actual receipt from the current interval, or null when there was no fresh action. It must not be a stale pointer to a previous interval's action.

`lastInterval` is null initially. Afterwards it exposes fromTick/toTick, stageBefore/stageAfter, the actual three oscillator interval records, the four contact interval records and the actual per-person transition records. Oscillator records include phase/resonance/amplitude/height from/to, base/effective phase speed, pulse increment used, remaining pulse from/to and any actual completion. Contact records include node indices, gapFrom/gapTo, full-interval maximum, safe and closing. Person records include its start-stage after any actual release, end-stage, contact/age/progress changes and actual event receipt ids. The interval also exposes all actual failure facts and whether the deadline was reached.

`lastInput` is null initially. It exposes normalized axes/buttons, explicit cancellation flag, epoch-change flag, quarantine state before/after, actual neutral acknowledgement, fresh edges, navigation direction/age/applied delta, action receipt id or null, and the final cursor. `inputState` retains cancellation epoch, quarantined, aArmed, bArmed, navigationDirection and navigationHeldTicks. Input details follow the public contract; no heuristic or planner hint is stored in them.

## Numerical and observation limits

All ticks, phase units, resonance units, counters, ids and ages are integers. Heights/amplitudes are finite doubles; reported sine-derived heights may have numerical comparison tolerance 1e-10 m. Runtime safety itself uses the declared exact <=0.35 comparison and never adds that tolerance.

No predicted crossing, future solution trace, exact future button schedule or author witness is exposed. Read-only snapshots must not let renderers mutate model state. Every consumer must use this same concrete schema before production execution.

## Concrete schema and conventions

`create(seed=731,difficulty=0)` supports the shared positional interface and `create({seed:731,difficulty:0})`. The fixed published seed is 731; any other supplied seed, or a supplied difficulty outside integer 0..2, throws before creating state. Omitted arguments take the defaults. `a` and `b` normalize only literal true; pressed aliases are not separate action sources. A finite numeric cancellation epoch is retained exactly; an absent/nonfinite epoch retains the previous epoch. `physics` contains every field in public `simulation`, plus axisThreshold/navigationFirstRepeatTick/navigationRepeatPeriodTicks. `scenario` is a deep-frozen copy of the selected public level. `physics` is also deeply frozen.

`remainingCount` counts pending/waiting/crossing/walking people; consequently `passedCount + fallenCount + remainingCount = scenario.pedestrianCount`. `lostReason` is the first failure's `kind` string, or null; ordered failure facts retain all details. Board labels are `桥板 1` through `桥板 3`. Gap signs are **destination height minus source height**. Node heights are `[0,...boards.map(b=>b.heightMetres),0]`. Initial nullable person fields, including `failedEdgeIndex`, are null. `message` is human-facing text, not a decision field.

All receipt objects are deep-frozen on append. Last-interval objects contain detached endpoint values, never aliases to mutable boards/people. `lastAction` references the frozen current-interval action receipt. Banks use sequential `id` starting at 1 independently.

**Action receipt, every key present:**

`{id,fromTick,tick,key,kind,boardIndex,accepted,reason,cursor,before,after,pulseId,pulseStartedAtTick,extraPhaseUnits,scheduledReleaseTicks}`.

`key` is a/b. `kind` is frequency/phase/dispatch; B on dispatch is kind phase with boardIndex null. Plate command `before`/`after` are `{phaseUnits,resonanceUnits,amplitudeMetres,heightMetres,frequencyIndex,trimTicksRemaining}`; dispatch-selection commands instead use `{dispatchAtTick,scheduledReleaseTicks}`. `pulseId` and `pulseStartedAtTick` are null except an accepted phase action; `extraPhaseUnits` is 250 only then, otherwise 0. `scheduledReleaseTicks` is a copied schedule only for an accepted dispatch, otherwise null. Rejected action `before`/`after` match exactly. Rejection `reason` is phase-pulse-active/no-oscillator/already-dispatched, otherwise null.

**Completed pulse receipt:** `{id,fromTick,tick,pulseId,actionReceiptId,boardIndex,startedAtTick,completedAtTick,intervalCount,extraPhaseUnits}`. `fromTick/tick` describe its actual final interval; `completedAtTick=tick`, `intervalCount=10`, `extraPhaseUnits=250`. All three pulse-origin fields (`pulseStartedAtTick`, `activePulseStartedAtTick`, and this `startedAtTick`) equal the accepting action's fromTick; completion is exactly startedAtTick+10. `phaseRadians=2*Math.PI*phaseWrappedUnits/6000`; independent comparisons may use 1e-12 radians for this derived value, never for integer phase or contact decisions.

**Pedestrian event common keys:** `{id,fromTick,tick,kind,personId}` plus only the keys for its kind below:

- released: `{scheduledReleaseTick,releasedAtTick,node}` with release at fromTick and node 0.
- crossing-started: `{edgeIndex,startedAtTick,qualifiedContactTicks,gapFrom,gapTo,closing,movementTicks}` with startedAtTick=tick and qualifiedContactTicks=24.
- crossing-completed or passed: `{edgeIndex,sourceNode,destinationNode,startedAtTick,completedAtTick,successfulCrossingIntervals,maxGapMetres,movementTicks}`; completedAtTick=tick, successfulCrossingIntervals=24. The final edge emits passed only.
- walking-completed: `{node,completedAtTick,successfulWalkingIntervals,movementTicks}` with successfulWalkingIntervals=120.
- fallen: `{edgeIndex,startedAtTick,fallenAtTick,successfulCrossingIntervals,maxGapMetres,gapFrom,gapTo,intervalMaxGapMetres,movementTicks,heightMetres}`. maxGapMetres includes the unsafe interval just inspected; height/progress remain the previous endpoint.

**Failure fact common keys:** `{kind,fromTick,tick}` plus:

- unstable-amplitude: `{boardIndex,resonanceUnits,amplitudeMetres,maximumSafeResonanceUnits}`.
- pedestrian-fall: `{personId,edgeIndex,eventId,gapFrom,gapTo,maxGapMetres,maximumContactGapMetres}`; maxGapMetres is this failed interval's full maximum.
- deadline: `{remainingCount,deadlineTicks}`.

Failure order is all amplitude facts in board-index order, then all falls in person-id order. A deadline fact is appended only if these are empty and tick>=5400 with people remaining.

**lastInterval:** `{fromTick,toTick,stageBefore,stageAfter,actionReceiptId,oscillators,contacts,pedestrians,failures,deadlineReached}`. deadlineReached means toTick>=5400 regardless of whether completion wins. `actionReceiptId` is null or the actual fresh action's id.

- Oscillator record: `{boardIndex,phaseFrom,phaseTo,resonanceFrom,resonanceTo,amplitudeFrom,amplitudeTo,heightFrom,heightTo,frequencyIndex,basePhaseUnitsPerTick,effectivePhaseUnitsPerTick,pulseIncrementUnits,trimTicksFrom,trimTicksTo,pulseId,completedPulseReceiptId}`. The source values and trimTicksFrom are captured after the beginning-of-interval command, when physical position is unchanged. pulseId is the pulse used in this interval or null; completion id is null except its actual tenth interval.
- Contact record: `{edgeIndex,sourceNode,destinationNode,gapFrom,gapTo,maxGapMetres,safe,closing}`.
- Person record: `{personId,before,after,eventIds}`. before/after are detached full public pedestrian records; before is after this interval's actual release. eventIds includes any release event as well as the actual end transition. Pending/pass/fallen stages also get an unchanged transition record when applicable.

**lastInput:** `{x,y,a,b,cancelEpoch,cancelled,epochChanged,quarantinedBefore,quarantinedAfter,neutralAcknowledged,aFresh,bFresh,navigationDirection,navigationHeldTicks,navigationApplied,actionReceiptId,cursorBefore,cursorAfter}`. `cancelled` is solely the raw explicit flag. Fresh flags are false when quarantined/cancelled; simultaneous fresh edges are both recorded true, although B alone acts. Navigation happens before either action, including B. `navigationApplied` is actual cursor delta (0 at clamp), and cursorAfter is the complete interval's final cursor. Direction/age report the resulting latch state. No season-like automatic cursor reset exists in this game.

## Public level data

```json
{
  "schemaVersion": 1,
  "game": "resonance-bridge",
  "name": "共振浮桥",
  "number": 31,
  "seed": 731,
  "version": "0.1.0",
  "mechanic": "Tune the frequency and phase of three continuously moving bridge plates; people require sustained contact and a closing gap before stepping across. Resonant driving grows the physical amplitude envelope.",
  "simulation": {
    "tickHz": 60,
    "stepSeconds": 0.016666666666666666,
    "dtTolerance": 1e-12,
    "deadlineTicks": 5400,
    "phaseUnitsPerTurn": 6000,
    "frequencyPhaseUnitsPerTick": [10, 15, 20],
    "frequencyHertz": [0.1, 0.15, 0.2],
    "resonantEffectivePhaseUnitsPerTick": 15,
    "phasePulseUnits": 250,
    "phasePulseTicks": 10,
    "phasePulseUnitsPerTick": 25,
    "baseAmplitudeMetres": 0.8,
    "resonanceUnitsPerAmplitudeMetre": 3000,
    "resonanceGainPerTick": 1,
    "resonanceDecayPerTick": 2,
    "maximumSafeResonanceUnits": 1200,
    "maximumSafeAmplitudeMetres": 1.2,
    "maximumContactGapMetres": 0.35,
    "contactQualificationTicks": 24,
    "crossingTicks": 24,
    "plateWalkingTicks": 120,
    "pedestrianSpacingTicks": 600,
    "heightInterpolation": "Continuous linear interpolation between successive 60 Hz sine-derived endpoint heights.",
    "contactIntervalRule": "An entire interval is safe iff the maximum absolute gap at its two endpoints is at most 0.35 m.",
    "crossingStartRule": "A waiting person needs 24 consecutive safe intervals since arriving at this edge, then abs(gapTo) <= abs(gapFrom). Crossing begins at that interval's end; its first of 24 intervals is the next interval.",
    "resonanceRule": "Use actual effective phase speed, including an active phase pulse: exactly 15 units/tick gains 1 resonance unit; every other available speed decays 2 units to zero.",
    "failurePriority": ["unstable-amplitude", "pedestrian-fall", "deadline"],
    "completionRule": "All people passed, with no amplitude or fall failure in the same interval. Passing exactly at tick 5400 is allowed; deadline failure applies only while people remain.",
    "scoreRule": "On win only: 1000 + 100 * pedestrianCount + floor((5400 - tick) / 60). Otherwise zero."
  },
  "controls": {
    "cursorItems": ["plate-1", "plate-2", "plate-3", "dispatch"],
    "horizontalAxis": "Select the adjacent item, clamped at either end.",
    "aOnPlate": "Cycle the base-frequency index 0 -> 1 -> 2 -> 0 once per fresh press.",
    "bOnPlate": "Start one +250-unit phase pulse over the next 10 intervals; reject a new pulse while the previous pulse is active.",
    "aOnDispatch": "Release the configured queue once. First person is released at this interval's beginning, following people every 600 ticks.",
    "bOnDispatch": "Rejected with no-oscillator; it does not cancel a released queue.",
    "simultaneousFreshButtons": "B takes priority and consumes both fresh edges.",
    "axisThreshold": 0.45,
    "navigationFirstRepeatTick": 24,
    "navigationRepeatPeriodTicks": 12,
    "cancelRule": "Cancel/epoch changes quarantine controls until a later complete neutral sample; physics and any already-started pulse continue. Quarantine cannot silently release a queue or repeat an action.",
    "runtimePause": "The shared runtime stops Model.step entirely. Pause/resume does not move phase, grow resonance, qualify contact, or advance people."
  },
  "levels": [
    {
      "level": 1,
      "difficulty": 0,
      "name": "晨雾渡口",
      "nameEn": "Morning Crossing",
      "initialPhaseUnits": [0, 500, 1000],
      "initialFrequencyIndices": [0, 1, 2],
      "initialResonanceUnits": [0, 120, 240],
      "pedestrianCount": 3
    },
    {
      "level": 2,
      "difficulty": 1,
      "name": "错拍长廊",
      "nameEn": "Out-of-Step Walkway",
      "initialPhaseUnits": [1000, 1750, 2500],
      "initialFrequencyIndices": [1, 2, 0],
      "initialResonanceUnits": [360, 180, 540],
      "pedestrianCount": 4
    },
    {
      "level": 3,
      "difficulty": 2,
      "name": "暮潮接力",
      "nameEn": "Dusk Relay",
      "initialPhaseUnits": [3250, 4250, 5250],
      "initialFrequencyIndices": [2, 1, 2],
      "initialResonanceUnits": [480, 720, 600],
      "pedestrianCount": 5
    }
  ],
  "publicInformation": "Every initial phase, frequency, resonance envelope, queue size and rule is visible from the start. No hidden weather, random force or solution schedule exists.",
  "scope": "An original timing-and-oscillator game, not a calibrated engineering model. Pedestrians do not collide with or add loads to one another. All safety decisions use actual model endpoints; feasibility bounds never replace runtime contact checks."
}
```
