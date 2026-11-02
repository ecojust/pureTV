# Cable Unweaver — public model contract

Status: accepted public contract. The exact geometry and three task tables are in [public design](public-design.md); no implementation, import, test or solver execution is authorized by this document alone.

## API and immutable data

Export `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config` through CommonJS and `window.PureModel`. Create returns fresh mutable state with detached arrays/objects; step mutates and returns that same state. Accept integer seed0..4294967295, else743; accept integer level0..2, else0. Seed is recorded without RNG. No public fixture, geometry-solver, forced-state, submit, undo or alternate-origin API exists.

`config={defaultSeed:743,board:{minX:-2,maxX:10,minY:0,maxY:10},maxCounter:2147483647,maxElapsed:3600,tasks:[three public descriptors]}`. Each task is `{id,name,nameZh,fixed,terminals,groups,edges,budget}`. Fixed entries are `{id,position}`; terminal entries `{id,group,offset,rail:{axis,fixed,min,max}}`; group entries `{id,initial,guideNode}`; edge entries `{id,from,to}`. Use exact public order, names, IDs, coordinates and budgets. All references are valid, each terminal belongs to exactly one nonempty group, all group rails are parallel, every feasible interval is nonempty and each authored graph is simple. There is no desired group-position vector.

Every ordinary world-coordinate record is an object `{x,y}`, with integer coordinates: fixed/node `position`, rail `start`/`end`, segment `a`/`b`, and overlap endpoints. Rational conflict points alone use the separately defined `{xNum,yNum,den}` record.

## State

| Field | Initial value / definition |
| --- | --- |
| `schema`, `seed`, `level` | 1, normalized seed, normalized level; fixed round identity |
| `phase`, `reason`, `score` | `playing`, `''`, 0; phase playing/won/lost; only loss reason `budget`; score100 iff won |
| `positions` | Fresh array of group initial scalars; the only canonical physical placement |
| `selected` | 0, indexing movable terminals a,b,c in public order; fixed nodes cannot be selected |
| `geometry` | Complete freshly derived object specified below; not a physical authority |
| `movesUsed`, `moves` | 0 and []; actual nonzero moves and bounded immutable-by-convention receipts, maximum task budget18 |
| `calls`, `selectionChanges`, `blockedMoves` | All0; saturating admitted-call, successful-selection and along-axis zero-move counters |
| `elapsed`, `counterSaturated`, `clockSaturated` | 0,false,false; elapsed caps3600 and never causes loss |
| `inputArmed`, `cancelEpoch`, `cancelledLast` | false,null,false |
| `lastHeld` | `{a:false,b:false,direction:'none'}` including suppressed samples |
| `lastCommand`, `events` | `none`, []; reset every admitted call; maximum one event per call |
| `message` | `A、B选择端子，方向沿轨道移动；消除线冲突和端子重合。`; display-only Chinese text, max160 characters |

No history, hidden placement, pending drag, collision physics, cooldown, hold-repeat timer, wall clock or unbounded log exists. Arrays/objects in geometry, config, positions, receipts and different rounds do not share mutable references. Increment each saturating counter by `min(maxCounter,old+1)` and set counterSaturated only if the uncapped value exceeds the bound. Elapsed adds dt exactly once per admitted call, caps3600, and sets clockSaturated only if the uncapped sum exceeds3600. Both saturation flags are sticky: once true, they remain true for that round. MovesUsed and receipt count stay exact and bounded by the budget.

## Derived geometry and validity

Derive from task data and canonical group positions: `geometry={nodes,rails,groups,segments,conflicts,conflictEdgeIds,conflictCount,coincidentNodes,zeroLengthEdges,railViolations,railsValid,matched}`. Fixed nodes precede movable terminals in their respective public order. Each node is `{id,position,terminalIndex,groupIndex}`, with null indices for fixed anchors; each terminal's varying coordinate is its group position plus its configured offset. `rails` follows terminal order with `{terminal,axis,start,end,min,max,fixed}`; start/end are the true world endpoints at rail min/max. Nothing wraps or clamps during derivation.

Each derived group is `{id,axis,members,position,min,max,guideNode,guideCurrentNumerator,guideDenominator,guideReference,guideErrorNumerator,guideAligned}`. Members are terminal IDs in terminal order; min/max are the intersection-derived position limits; guideCurrentNumerator is the sum of actual member coordinates on the common axis, denominator is member count, reference is the fixed guide node's coordinate on that axis, error numerator is current numerator minus denominator*reference, and guideAligned means exact zero error. These guide fields are visible aids only and never enter matched.

Segments follow edge order with `{id,from,to,a,b}`; a/b are detached actual endpoint coordinates. Classify all unordered nonzero edge pairs i<j by the exact public integer rule. Conflicts are ordered by (i,j) and stored as `{edges:[edgeIdI,edgeIdJ],kind,point,overlap}`. Kind is cross/touch/overlap. Point conflicts have the canonical reduced rational `{xNum,yNum,den}` and overlapnull; overlap conflicts have pointnull and `[start,end]` integer endpoints sorted lexicographically. Positive overlap always takes precedence over a shared-ID exemption. ConflictEdgeIds are the unique affected IDs in edge order, and conflictCount is conflicts.length, not the number of distinct marker positions.

`coincidentNodes` lists every pair of distinct node IDs with identical coordinates as `[nodeIdI,nodeIdJ]` arrays, for node indices i<j in node-index pair order. `zeroLengthEdges` lists equal-endpoint-coordinate edge IDs in edge order. `railViolations` lists terminal IDs whose varying coordinate is noninteger or outside its inclusive range, in terminal order. RailsValid means no violations; authored fixed coordinates and group rigid offsets follow directly from configuration/derivation. Matched means railsValid AND zero coincident-node pairs AND zero zero-length edges AND zero conflicting nonzero edge pairs. Thus omitting degenerate edges from pair classification cannot create a win. All authored starts have matchedfalse.

Recompute the complete object at creation and after every nonzero move, before evaluating victory. Do not trust cached conflict counts, markers, validity or guide flags. Selection, blocked, orthogonal and neutral commands leave geometry unchanged and do not settle outcomes. A temporarily invalid contact/crossing remains repairable until a real move exhausts the budget. Discrete final placements alone are judged; interpolation/swept intersections have no gameplay effect.

## Admitted calls and input normalization

1. A terminal state is an exact no-op before reading dt/input, including events, geometry, gates and clocks.
2. Admit only finite JavaScript-number dt with `0<dt<=0.25`; every other duration is an exact no-op without coercion. There is no physics accumulator; one admitted call selects at most one command and adds dt once.
3. Input must be a non-null non-array object, else empty neutral. Atomically collect all recognized own descriptors in one try/catch, including classification, before paused checks or state mutation. Read own data values only; do not invoke getters, inherit values or write input. Any classification/descriptor throw, including revoked Proxy or throwing descriptor trap, discards all partial reads and becomes wholly empty neutral. Nonthrowing descriptor traps may run; no side-effect-free Proxy claim is made.
4. Only literal true enables a,b,cancelled,paused. After complete normalization, pausedtrue is exact no-op. Finite-number x/y clamp to[-1,1]; invalid/missing axes become0. Only a nonnegative safe-integer cancelEpoch is recognized; others are ignored. Ignore unknown keys, raw direction names, start/select and aPressed/bPressed pulses.
5. Direction is none when both axis magnitudes are<=0.5; otherwise use the larger-magnitude axis, vertical on exact tie. Positive x/y means right/down. Unchanged held direction never repeats; a direct change between nonneutral tokens is a new edge.
6. Clear events, set lastCommandnone, increment calls and advance bounded elapsed once. Cancelled/quarantined admitted calls still advance these observations but issue no command. Host pause normally makes no calls.

## Gate and priority

The first valid epoch establishes its baseline. A later different valid epoch, or false-to-true cancelled edge, disarms input. Every cancelled sample suppresses commands. Store any valid epoch and the current cancelled flag. If armed after cancellation and not cancelled, derive A/B rises and changed nonneutral direction against the previous lastHeld.

Select one command with priority **B rise > A rise > direction edge**. Other simultaneous edges are consumed, not queued. A+B selects the previous terminal once; holding A after releasing B cannot select next. A/B plus a fresh direction selects only: neither the old nor the newly selected terminal moves, and releasing A/B while still holding the direction does not replay that consumed edge. Holding A while changing direction may move the selected group without a new selection.

After choosing the command, store all raw normalized held fields in a fresh lastHeld even when suppressed. Only a noncancelled sample with Afalse/Bfalse/directionnone arms future calls; newly arming neutral issues no command. Bare undefined/non-object normalizes to such neutral and can arm: the model does not infer phone presence. The host must represent missing/disconnected phone input as cancelledtrue, not bare undefined, or stop calls while paused. A synthetic cancelled neutral does not acknowledge release. Create/retry starts unarmed; resume/reconnect requires host cancellation then genuine neutral release.

## Commands, uniform movement and receipts

Set lastCommand to selected a/b/up/down/left/right. A sets selected=(old+1)%terminalCount; B sets selected=(old+terminalCount−1)%terminalCount. Each changes selection, increments selectionChanges and emits `{type:'select',terminal:terminalId,group:groupId,call:calls}`. Physical positions, geometry, moves and budget stay unchanged.

For a direction, inspect the selected terminal's rail axis. An orthogonal direction is a no-op with no move, blocked counter or event; its display message may explain the valid axis. A parallel direction requests r=−1 for left/up or+1 for right/down. Compute the common admissible displacement interval from every actual member position, clamp r once, and apply the same delta via the group's canonical scalar. All other group positions remain unchanged.

If delta0, do not alter positions, geometry, move budget or receipts. Increment blockedMoves and emit `{type:'blocked',terminal,group,requested:r,limiting,call:calls}`; limiting is an array of terminal IDs for group members at the requested-direction rail bound in terminal order. If nonzero, copy the entire old positions array, update the selected group once, increment movesUsed, then freshly derive all geometry. Crossing/touching another cable or node never blocks this otherwise legal rail move.

If fresh geometry.matched, settle won with reasonempty and score100, emitting only `{type:'win',call:calls}`. Otherwise if movesUsed==budget, settle lost with reasonbudget and score0, emitting only `{type:'collision',reason:'budget',call:calls}`. Otherwise remain playing and emit only `{type:'move',terminal,group,delta,call:calls}`. Victory is checked before exhaustion; no partial move or preemptive last-step loss occurs. The terminal result freezes on later calls.

Append one receipt per nonzero move: `{index,call,elapsed,terminal,group,axis,delta,fromPositions,toPositions,conflictCount,nodeCollisionCount,zeroLengthCount,railsValid,matched,remaining,phase}`. IDs name the selected terminal and moved group; from/to are detached full position arrays; counts and flags come from the fresh resulting geometry; remaining=budget−movesUsed; index is old receipt length. Preserve all previous receipts. Blocked, orthogonal, selection and neutral calls append none. Messages never decide outcomes.

Identities: movesUsed=moves.length<=budget, remaining>=0. Playing states are geometrically invalid with used<budget. Won has a matched final receipt at used1..budget and score100; lost has an unmatched final receipt at usedbudget and score0. Only the last receipt may be matched. Actual moves never refund or restore prior budget. Selection may target another member of the same group without any geometric change.

## Regression scope and evidence separation

Aim at roughly35 meaningful checks: three public starts and guide-feasible layouts; proper crossing and repeated-location pair counting; shared-ID point exemption; distinct-ID endpoint contact; T contact; collinear disjoint/touch/positive overlap including shared ID; zero-length validity; canonical rational marker values separate from predicates; unique coincident-node pairs; axis movement and orthogonal no-op; selected-member-independent rigid offsets; intersection bounds and uniformly blocked group; blocked moves free; selection cycling and simultaneous consumption; intermediate contact repair; fresh geometry over corrupted caches; last-budget win and natural loss; bounded receipts; creation/defaults/alias isolation; dt/paused/terminal no-ops; literal own-data normalization and atomic failure fallback; threshold/tie/held edges; cancellation and true neutral; bounded counters/clocks. Unreachable degenerate/math boundary fixtures must be labeled synthetic and never represented as ordinary public play. No extra public fixture API is introduced. Actual execution waits for approval and source review.
