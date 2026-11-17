# Shadow Foundry — public model contract

This is the normative public model contract. Geometry and all task tables are the exact public data in the [public design](public-design.md); the [public interface](public-interface.md) defines host integration and evidence requirements. This contract is not a report of implementation or execution.

## API and configuration

Export `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config` through CommonJS and `window.PureModel`. `create` allocates a fresh mutable state and fresh arrays/objects; `step` mutates and returns that same state. Accept integer seed in `[0,4294967295]`, else default742; accept integer level0–2, else0. Seed is recorded and no RNG is consumed. There is no state injection, solver, alternative origin, submit or undo API.

`config` is exactly `{defaultSeed:742,boardMin:-6,boardMax:6,focusNames:['WORK','LIGHT'],lampNames:['E','SE','S','SW','W','NW','N','NE'],lampVectors:[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]],maxCounter:2147483647,maxElapsed:3600,tasks:[three public descriptors]}`. Each task descriptor is `{id,name,nameZh,pivot,prisms,initialYaw,initialLamp,footPrism,lightPrism,guideFoot,guideTip,targetCells,forbiddenCells,requiredTargetHits,maxForbiddenHits,budget}` using the design tables and prism objects `{center,height}`. Config contains no winning orientation, future-state table or private witness.

## State and bounds

| Field | Initial value and definition |
| --- | --- |
| `schema`, `seed`, `level` | 1, normalized seed, normalized level; fixed round identity |
| `phase`, `reason`, `score` | `playing`, `''`, 0; phase is `playing/won/lost`, only loss reason `budget`; score100 iff won |
| `yaw`, `lamp`, `focus` | Task initial yaw/lamp, focus0; canonical physical indices yaw0–3, lamp0–7; focus0=WORK,1=LIGHT |
| `geometry` | Fresh complete derived object specified below; never a second physical authority |
| `adjustmentsUsed`, `workRotations`, `lightRotations` | All0; integers bounded by task budget12; no refunds |
| `adjustments` | Empty array of actual rotation receipts; maximum12; never rewritten |
| `calls`, `focusChanges`, `elapsed` | All0; admitted calls and changed-focus counters saturate at maxCounter; admitted seconds cap at maxElapsed |
| `counterSaturated`, `clockSaturated` | false; persistent overflow/cap flags, never end play |
| `inputArmed`, `cancelEpoch`, `cancelledLast` | false, null, false |
| `lastHeld` | `{a:false,b:false,direction:'none'}`; previous normalized held sample, including suppressed samples |
| `lastCommand`, `events` | `none`, `[]`; reset on each admitted call; at most one event per call |
| `message` | `选择工件或灯光，A 顺时针，B 逆时针；覆盖目标并避开禁区。`; display-only Chinese text, maximum160 characters |

There is no hidden pose, history, timer loss, cooldown, wall clock, held-repeat timer or unbounded log. Geometry and receipts never share mutable arrays with config, each other, or another round. Increment calls/focusChanges by `min(maxCounter,old+1)` and set counterSaturated only when the uncapped result exceeds the bound. Add dt once to elapsed, cap3600 and set clockSaturated only if the uncapped sum exceeds3600. Bounded rotation counters/receipts are exact, not saturating.

## Exact geometry cache

For canonical yaw/lamp, freshly transform the three prisms and project their eight corners using the public formula. Store `geometry={prisms,shadowHulls2,shadowMask,coveredCells,targetHitCells,forbiddenHitCells,targetHits,forbiddenHits,shadowCells,targetPassed,forbiddenPassed,matched,lightVector,lightRay,footPoint,lightCenter,lightHeight,tipPoint}`. `lightVector` is source direction d; `lightRay=[-dx,-dy,-1]`; do not interchange their signs.

Each `prisms[i]` is `{center,height,footprint2,vertices2}`. Center is the transformed world `[x,y]`; height is unchanged. `footprint2` starts at `[2cx-1,2cy-1]`, then east, south, west in four-corner order. `vertices2` is those four `[x2,y2,0]` corners followed by matching top corners with `z2=2*height`. All three coordinates in vertices2 are doubled. Optional rendering faces use the fixed public vertex order, not a second model transformation. `shadowHulls2[i]` is the canonical integer projected convex hull in the design; it includes the footprint and is not clipped.

`shadowMask` is exactly169 booleans with index `(y+6)*13+(x+6)`. For each point `(2x,2y)`, a positive-cross-product hull includes it iff every directed-edge cross product with the point is >=0. Build the hull by lexicographic monotone chain with `cross<=0` popping collinear/interior vertices; these legal prism hulls are never degenerate. OR all three containments; do not sum per-object hits. All generated hull coordinates have absolute value <=11, tested points <=12, so even conservative cross-product absolute bound1012 is an exact small integer in JavaScript.

`coveredCells` enumerates the true mask centers exactly once, ordered by y then x. `targetHitCells` and `forbiddenHitCells` are its intersections with the corresponding task lists, in the same order. Counts are the lengths of these lists; `shadowCells=coveredCells.length`. `targetPassed=(targetHits>=requiredTargetHits)`, `forbiddenPassed=(forbiddenHits<=maxForbiddenHits)`, `matched=targetPassed&&forbiddenPassed`. No floating percentage or area approximation decides these checks. Outside-board projected geometry remains available for drawing but contributes no samples.

`footPoint` is the designated foot prism's world center. `lightCenter/lightHeight` come from the designated light prism. `tipPoint=lightCenter-lightHeight*lightVector`. These current public guide observations do not decide matched and do not store a desired yaw/lamp. Derive complete geometry at creation and after every rotation; rotate evaluation replaces old geometry and never trusts cached counts, masks or matched flags. Focus selection changes no geometry.

## Admitted calls and input normalization

1. Terminal states are exact no-ops before reading dt/input, including geometry, gates, events and clocks.
2. Admit only finite JavaScript-number dt with `0<dt<=0.25`; every other duration is an exact no-op without coercion. One admitted call may select at most one command edge and adds its dt once; there are no accumulated physics ticks.
3. Input must be a non-null, non-array object, otherwise use an empty neutral sample. Collect all recognized own property descriptors atomically inside one try/catch, including classification, before checking paused or mutating state. Read own data values only: no getters, inherited values or input writes. If any classification/descriptor operation throws, including a revoked Proxy or throwing descriptor trap, discard all partial reads and use wholly empty neutral input. Nonthrowing Proxy descriptor traps may run; no side-effect-free trap claim is made. Ordinary LAN input is plain JSON.
4. Only literal true enables `a,b,cancelled,paused`. After complete normalization, own-data pausedtrue is an exact no-op. Finite-number x/y clamp to `[-1,1]`; each invalid/missing axis is0. Only a nonnegative safe-integer cancelEpoch is recognized; otherwise ignore it. Ignore unknown keys, raw directional names, start/select and aPressed/bPressed pulses.
5. Direction is none if both magnitudes are <=0.5; otherwise use the larger-magnitude axis, vertical on an exact tie. Positive x/y is right/down. A held token never repeats; changing directly between nonneutral tokens creates a new direction edge.
6. Clear events, set lastCommandnone, increment calls and advance bounded elapsed once. Cancelled/quarantined admitted samples still advance these, but issue no command. Host pause normally makes no calls.

## Gate and edge priority

The first valid epoch establishes a baseline. A later different valid epoch, or a false-to-true cancelled transition, disarms input. Every cancelled sample suppresses commands. Store supplied valid epoch and current cancelled flag. When armed after cancellation processing and not cancelled, compare normalized held values with the previous lastHeld: A/B rising edges and any changed nonneutral direction token are candidates.

Select one command with priority **B rise > A rise > direction edge**. Unselected simultaneous edges are consumed, not queued. Thus simultaneous A+B rotates counterclockwise once; releasing B while A remains held cannot rotate clockwise. A/B rising together with a direction edge rotates the old focus; the unselected focus request is consumed. Holding A while changing direction can change focus, but cannot repeat rotation.

After command selection store all normalized held fields in a fresh lastHeld, even when suppressed. Only a noncancelled sample with Afalse, Bfalse and directionnone arms future samples. A newly arming neutral call cannot also command. Bare undefined/non-object input normalizes to a noncancelled neutral and can arm: the model cannot infer phone presence from it. The host must mark a missing/disconnected phone sample cancelledtrue, or stop calls while paused; it must not represent source loss as bare undefined. A synthetic cancelled neutral, host-marked missing-phone sample or still-held input is not release acknowledgement. Creation/retry starts unarmed; pause freezes; resume/reconnect requires host cancellation and genuine neutral release.

## Commands, fresh checks and terminal order

Set lastCommand to the selected `up/down/left/right/a/b`, including a same-focus selection. Up or left selects focus0; down or right selects focus1. If it changes focus, increment focusChanges and emit `{type:'focus',focus,call:calls}`; otherwise emit nothing. Focus never consumes an adjustment or changes yaw/lamp/geometry.

A rotates the selected index +1 clockwise modulo4 for WORK or modulo8 for LIGHT. B rotates it -1 counterclockwise with positive modulo. Every such edge changes its index and costs exactly one adjustment. Copy the old `{yaw,lamp}`, change only the selected index, increment adjustmentsUsed and that focus's rotation counter, then recompute complete geometry from the resulting canonical indices.

Evaluate both fresh coverage predicates **before** exhaustion: if matched, set phasewon, reasonempty, score100 and emit only `{type:'win',call:calls}`; otherwise, if adjustmentsUsed==budget, set phaselost, reasonbudget, score0 and emit only `{type:'collision',reason:'budget',call:calls}`; otherwise remain playing, score0 and emit only `{type:'rotate',focus,turn,call:calls}`. Here turn is +1 for A and -1 for B. No neutral/focus call settles a round; all authored starts are invalid.

Append exactly one receipt `{index,call,elapsed,focus,turn,from,to,targetHits,forbiddenHits,shadowCells,matched,remaining,phase}` for every rotation. Index is previous receipt length; call/elapsed are this call's advanced values; from/to are fresh pre/post yaw/lamp objects; all counts/flags come from this fresh projection; remaining=budget-adjustmentsUsed; phase is the actual resulting phase. Preserve all earlier receipts. Terminal receipt, geometry, gates and event are frozen by subsequent no-op calls; message may describe the actual result but never decides it.

Identities: `adjustmentsUsed=adjustments.length=workRotations+lightRotations<=12`; remaining is never negative. A normal playing state is invalid with used<12. Won has a matched final receipt at used1..12 and score100; lost has an unmatched final receipt at used12 and score0. Only the last receipt may be matched. No command restores budget or physical placement.

## Bounded regression scope

Target roughly35 meaningful checks, grouped rather than duplicated: all three public initial masks/counts and hand-check geometries; source/ray signs in all quadrants; cardinal versus diagonal displacement; exact included diagonal boundaries; height scaling; footprint inclusion; hull vertex ordering; the finite169-cell sampling domain; unique overlap union; separate target/forbidden rejection despite equal total count; fresh geometry instead of forged cached flags; free absolute focus mapping; CW/CCW modulo wrap; one rotation per press; simultaneous priority/consumption; success on final budget; natural budget loss; immutable receipts and identities; seed/level defaults and fresh allocation; normalization, atomic throwing-proxy fallback, inert accessors, invalid dt; neutral gating and cancellation; pause and terminal exact freeze; bounded clocks/counters. Every legal task pose has its full hull inside the board; no reachable pose exercises exterior clipping. A separately labeled synthetic mathematical boundary test may verify that exterior centers receive no samples, but is not a reachable game posture or proof of ordinary play. No public geometry-fixture API is required or introduced. Synthetic fixtures are never presented as ordinary play; actual results belong in verification records.
