# Parallax Skyline — public model contract

Status: accepted public model contract. All task geometry and targets are the exact public tables in the [public design](public-design.md).

## API and immutable configuration

Export `create(seed,level)`, `step(state,dt,input)` and immutable `config` through CommonJS and `window.PureModel`. `create` allocates a fresh mutable state with fresh arrays/objects. `step` mutates that state and returns the same state. No force-state, hidden solver, alternate start, RNG search or time-travel API exists.

`config` contains `defaultSeed:741`, `columns:20`, `maxHeight:6`, `scales:[2,1]`, `offsets:[[0,0],[-4,-1]]`, `bounds:[[2,5],[4,14]]`, `focusNames:['NEAR','FAR','VIEW']`, `attemptLimit:4`, `historyLimit:32`, `maxCounter:2147483647`, `maxElapsed:3600`, and exactly three task descriptors in public order. A descriptor is `{id,name,nameZh,profiles,initialPositions,targets,landmarks}`. Exact `(id,name,nameZh)` values are `('courtyard','COURTYARD','庭院遮挡')`, `('riverfront','RIVERFRONT','河岸交错')`, and `('twin-spires','TWIN SPIRES','双塔视差')`; the canvas and Chinese DOM derive their labels from these fields. `profiles` is two five-number arrays; `targets` is two twenty-number arrays; `landmarks` is two `{layer,localColumn,column,height}` objects. There is no stored target position pair. Creation accepts only integer seeds in `[0,4294967295]`, else 741, and integer levels 0–2, else 0. Seed is retained but no RNG is consumed.

## State and bounds

| Field | Initial value | Meaning |
| --- | --- | --- |
| `schema` | `1` | Public schema |
| `seed`, `level` | normalized arguments | Immutable round identity |
| `phase`, `reason` | `playing`, empty string | Phase `playing/won/lost`; only loss reason is `attempts` |
| `positions` | fresh task initial pair | Only canonical physical placement; near/far inclusive bounds |
| `focus`, `view` | `0`, `0` | Focus 0=near,1=far,2=view; highlighted view 0 or1 |
| `views` | freshly derived two-view data | Exact cache described below, never an alternate physical authority |
| `undoStack` | `[]` | At most32 fresh prior full position pairs, oldest first |
| `failures`, `score` | `0`, `0` | Failures0–4; score exactly100 on win, otherwise0 |
| `submissions` | `[]` | At most4 immutable-by-convention actual submission receipts |
| `calls`, `moves`, `undos`, `viewChanges`, `focusChanges` | all `0` | Saturating admitted-call/successful-command counters |
| `elapsed` | `0` | Active admitted seconds, capped3600, never a losing timer |
| `counterSaturated`, `clockSaturated` | `false`, `false` | Persistent overflow/cap flags |
| `inputArmed` | `false` | Requires an actual noncancelled neutral sample before actions |
| `cancelEpoch`, `cancelledLast` | `null`, `false` | Last valid host epoch and last admitted cancellation flag |
| `lastHeld` | `{a:false,b:false,direction:'none'}` | Previous normalized held sample, including suppressed samples |
| `lastCommand` | `none` | This admitted call's selected edge command; reset each admitted call |
| `events` | `[]` | At most one event per admitted call |
| `message` | `上下选近层、远层或视角，左右调整；A 验收，B 撤销。` | Display-only Chinese status, maximum160 characters |

There is no hidden placement, pending edit, cooldown, acceleration, repeated-direction timer, wall clock, unbounded log or mutable reference to configuration. Caches and receipts never share mutable arrays with positions, history, config or other rounds. Counter increment is `min(maxCounter,old+1)` and sets `counterSaturated=true` if the unsaturated result would exceed the bound. `elapsed=min(maxElapsed,oldElapsed+dt)` and `clockSaturated` becomes true only when that uncapped sum exceeds3600. Saturation never ends play. No counter is refunded by undo.

## Projection and four exact checks

For each view, initialize heights20 to0 and owners20 to−1. Project every plate/local-column/width-cell using the public integer formula. The larger height wins; equal positive heights choose near owner0 regardless of iteration order. Bounds guarantee every projection is within the20 cells, so there is no clipping or tolerance. Exact integer equality decides all geometry checks.

Each `views[v]` is exactly `{heights,owners,silhouetteMatched,anchor}`. `heights` and `owners` are complete20-element arrays. `silhouetteMatched` is true only if every height equals `config.tasks[level].targets[v]`. The fresh anchor object is `{layer,localColumn,column,height,visible,matched}`: its layer/local column come from that view's configured landmark; column comes from the actual position formula with `k=0`; height comes from the actual profile; `visible` is true only when the projected owner at that column equals its layer and the skyline height equals its height. `matched` additionally requires exact configured target column and height. A far equal-height roof loses the ownership tie and is hidden.

Derive both views at creation and after every successful physical move or undo. A submission recomputes both from canonical positions before checking, then replaces the cache; it does not trust old match flags. Focus/view selection cannot change either projection. The four required booleans are both `silhouetteMatched` and both `anchor.matched`; all must be true to win. There is no nearest-position, partial-score, silhouette-only or single-view shortcut.

## Admitted calls and normalized input

1. A terminal call is an exact no-op, including cache, gate, events, counters and elapsed.
2. Admit only finite JavaScript-number `dt` with `0<dt<=0.25`. All other durations are exact no-ops, without coercion. There are no fixed physics ticks or accumulator in this turn-based model. One admitted call can select at most one command edge and adds its exact `dt` once to elapsed.
3. Input is a non-null, non-array object; otherwise it becomes an empty neutral sample. Collect all recognized own property descriptors atomically inside one try/catch, including the object/array classification, **before** checking paused or changing any state. Read recognized **own data properties only**, never invoke accessor getters or use inherited values, and never write input. If any classification/descriptor operation throws, including a revoked Proxy or throwing descriptor trap, discard every partial read and use a wholly empty neutral sample. Nonthrowing Proxy descriptor traps may run; this interface does not claim they are side-effect-free. Ordinary LAN input is plain JSON. Only literaltrue enables `a`, `b`, `cancelled`, or `paused`. After successful complete normalization, own-data `paused:true` makes the whole call an exact no-op. `x/y` must be finite numbers; otherwise each is0; valid values clamp to `[−1,1]`. A valid `cancelEpoch` is a nonnegative safe integer; invalid/missing epochs are ignored. Pulse fields `aPressed/bPressed`, unknown keys, start/select and raw directional names are ignored by this model.
4. Direction is `none` when both axis magnitudes are `<=0.5`. Otherwise use the axis with greater magnitude; exact ties choose vertical. Positive x=right, negative x=left, positive y=down, negative y=up. This makes diagonal intent deterministic. A direction held unchanged does not repeat. A deliberate change from one non-neutral direction to another produces a new direction edge.
5. Clear events and set lastCommand=`none`. Increment calls once and advance bounded elapsed once. Then process the gate and command below. A cancelled or quarantined admitted sample still advances this active clock, but cannot edit, undo, submit or alter focus/view. The host normally pauses by making no calls at all.

## Gate, edges and simultaneous input

Raw A/B/direction mean the normalized held sample above. A first valid epoch establishes its baseline. Any later different valid epoch, or a false-to-true `cancelled` transition, is a cancellation edge and sets inputArmed=false. A cancelled sample always suppresses commands. Store a supplied valid epoch and this sample's cancelled flag.

Only when armed after applying cancellation edges and not currently cancelled, derive edges against the **previous** lastHeld: A rise means rawAtrue and previousAfalse; B rise similarly; a direction edge means raw direction is non-neutral and differs from previous direction. Select one command with priority **B rise, then A rise, then direction edge**. Other simultaneous edges are consumed, not queued. For example A+B rising together selects undo; keeping A held after B is released must not submit. Holding A while a new direction edge occurs may move the selected row, but does not resubmit.

After selecting the command, set lastHeld to a fresh copy of all normalized raw held fields, even when suppressed or cancelled. Only a noncancelled sample with Afalse, Bfalse and directionnone arms future samples. A synthetic cancelled neutral sample, a missing phone and a still-held key are not release acknowledgement. Gate processing happens on every admitted call. Newly arming a neutral call cannot also issue a command. Retry creates the original unarmed gate; pause is exact freeze; resume/reconnect relies on host cancellation and genuine release.

## Command semantics and order

For the selected edge set lastCommand to `up/down/left/right/a/b`, even when its requested operation is a bounded no-op. Apply exactly one operation:

- Up/down: focus becomes `(oldFocus+2)%3` / `(oldFocus+1)%3`; increment focusChanges; emit `{type:'focus',focus,call:calls}`. Physical positions, view, history and failures stay unchanged.
- Left/right while focus0 or1: candidate selected position is old−1 / old+1. If it exceeds that layer's inclusive bounds, do not move, append history, increment moves or emit an event. If valid, append a fresh copy of the **whole old position pair**, removing only the oldest item if length becomes33; change only the selected position; increment moves; recompute both views; emit `{type:'move',layer:focus,from:oldPosition,to:newPosition,call:calls}`.
- Left/right while focus2: select view0 / view1. If already selected, no counter/event; otherwise increment viewChanges and emit `{type:'view',view,call:calls}`. No physical or undo change.
- B: if undoStack empty, no positions/counter/event change. Otherwise pop its newest full pair and replace positions with a fresh copy, increment undos, recompute both views, emit `{type:'undo',call:calls}`. Focus/view, elapsed/calls, moves, failures, submissions and score are not restored. The popped state does not enter a redo stack.
- A: recompute both views and perform the submission procedure below. An A hold never repeats. An unsuccessful submission remains charged even after later undo, camera selection or focus change.

Display messages may change to describe the selected operation or why a bound/empty-history command did nothing. They do not decide gameplay. A neutral call clears events/lastCommand but may retain its prior message. No operation other than A settles an outcome: a correctly arranged board remains `playing` until submitted.

## Submission, terminal state and receipts

Evaluate all four booleans after fresh projection. If all true, settle won, reasonempty, score100, with failures unchanged; emit only `{type:'win',call:calls}`. Otherwise increment failures exactly once; score remains0. If failures reaches4, settle lost with reasonattempts and emit only `{type:'collision',reason:'attempts',call:calls}`; otherwise remain playing and emit only `{type:'reject',call:calls}`. A correct submission with only one failed attempt remaining still wins; there is no pre-emptive attempt-exhaustion check before matching.

Append exactly one receipt `{index,call,elapsed,positions,checks,matched,failuresAfter,attemptsLeft}`. Index is the previous receipt count, `call/elapsed` are the admitted call's updated values, positions is a fresh pair, checks is two fresh `{silhouette,anchor}` objects from the evaluated views, matched is their conjunction, failuresAfter is the actual resulting failures, and attemptsLeft=`4-failuresAfter`. All receipts remain bounded by4 because the fourth failure is terminal and a successful receipt is terminal. Prior receipts never change. Outcome freeze retains actual final geometry, focus/view, history, failure count, clocks and final receipt/event. Later calls are exact no-ops.

Identities: failures equals the number of unmatched receipts; at most one matched receipt exists and it is last; phasewon iff a matched receipt exists; phaselost iff failures4; a playing state has0–3 failures and no matched receipts. Score is100 iff won. Submission count is failures plus1 on win, otherwise failures. With unsaturated counters, undoStack.length is no greater than moves−undos, because old history can be discarded at its32-entry cap.

## Required regression scope

Tests cover both depth coefficients, all target profiles/anchors, visible-owner tie handling, legal boundary projections with negative offsets, front-only geometric false placement, both-view submission, last-chance success, nonrefunded rejection and exact full-pair undo,32-entry history cap, direction threshold/tie/edge/no-repeat, simultaneous-edge consumption, invalid input/accessors/dt, real neutral gating, fresh creation/retry and exact pause/terminal no-ops. Synthetic fixtures are explicitly labeled boundary tests; ordinary runs must start from public create and use only ordinary controls. Clock comparisons use the specified JavaScript addition order, not guessed model ticks.
