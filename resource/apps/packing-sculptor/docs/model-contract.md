# Packing Sculptor — public model contract

Normative public specification before implementation/execution. The [public design](public-design.md) fixes every polygon, box, door, control and swept-geometry rule; [public interface](public-interface.md) fixes host/evidence boundaries. These documents do not claim tests have run.

## Pure API and fixed configuration

Expose exactly `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config`, through CommonJS and `window.PureModel`. Create allocates fresh state; step mutates and returns that same state. No randomness, clock, I/O, solver, alternate constructor, fixture setter, answer vector or replay route is exposed. External malformed/mutated states are unsupported; deliberately corrupted test fixtures must be labeled synthetic, never ordinary play.

Config is `{defaultSeed:746,attemptLimit:4,maxElapsed:86400,maxCounter:2147483647,pieces,tasks}`. Pieces are in rail/elbow/crate/bar/tee/zig order, each `{id,name,nameZh,cells,vertices,width,height}` using exactly the public table and its original bounds. Tasks are in published level order, each `{id,name,nameZh,width,height,rows,pieceIds,doors,requirements}`. Door/requirement descriptors match the public design exactly. No solved placement or hidden target geometry is present. A seed is accepted only if it is a JavaScript integer0..4294967295, otherwise746; level only integer0..2, otherwise0. The seed is recorded without changing tasks. Every created state, input record, derived structure and receipt is detached from mutable state/config objects.

## Canonical state and limits

| Field | Initial value / meaning |
| --- | --- |
| schema,seed,level | 1, normalized seed/level; fixed identity |
| phase,reason,score | `playing`, `''`,0; phase playing/won/lost, reason empty/attempts, score100 iff won |
| mode,rackIndex,preview | `rack`,0,null; mode rack/place; rackIndex0..N, N=pieceCount and CHECK |
| pieceIds | Detached ordered task.pieceIds, fixed visible public identity |
| container | Detached `{width,height,rows,doors,requirements}` from task, fixed visible public context |
| placements | N nulls; each later null or `{x,y,turn}` for the corresponding unique piece |
| inventory | Object keyed by task piece IDs, each1 initially, then1 iff unplaced else0 |
| geometry,previewCheck | Fully derived public structures below; previewCheck null in rack mode |
| elapsed,elapsedCapped | 0,false; admitted active seconds, cap86400; no deadline |
| failures,submissions,terminalReceipt | 0,[],null; at most4 submission receipts and one terminal receipt |
| calls,moves,pickups,placementsMade,rotations,removals,clears,blockedActions | All0; saturating counters |
| counterSaturated | false; sticky only on attempted overflow |
| inputArmed,cancelEpoch,cancelledLast | false,null,false |
| lastHeld | `{a:false,b:false,direction:'none'}`; includes suppressed raw samples |
| lastCommand,events | `none`,[]; reset each admitted call, at most one event |
| message | `选择零件后装入箱内；为标记零件留出指定直线出口。` |

N is4/5/6. `placements` is the canonical actual packing; a physical piece exists exactly once, either unplaced or at one pose. Inventory never changes during preview. Preview is null in rack mode and `{x,y,turn}` in place mode; rackIndex<N then identifies it. Preview x is0..W inclusive (W=BACK), y0..H−1, turn0..3. Committed poses have x0..W−1, y0..H−1, turn0..3 and normally passed the complete placement check. The model never serializes an uncommitted preview as an extra actual piece.

Increment a counter by min(maxCounter,old+1); set counterSaturated only if old+1>maxCounter. On each admitted call elapsed=min(86400,oldElapsed+dt), with elapsedCapped becoming true only if that sum exceeds86400. Reaching the informational cap never settles play. One tiny positive dt may increment calls without changing rounded elapsed under ordinary IEEE-754 addition. There is no timing epsilon, repeat accumulator or growing undo/event history. N≤6, each piece≤4cells/8vertices; total actual cells≤20; at most2 required pieces, each one door in these tasks; events≤1; submissions≤4. Messages stay at most160characters.

## Derived geometry and fresh judging

Use the public quarter-turn formulas and integer anchor. Cells are sorted y then x; transformed outline vertices retain original order. `geometry.pieces` has N entries in rack order: `{id,pose,cells,vertices,outsideCells,overlapIds}`. For an unplaced entry pose=null and all arrays empty. Pose is detached. OutsideCells are cells not in the task's `1` floor, including outside the bounding rectangle, sorted y then x. OverlapIds are other placed IDs sharing a positive-area polygon intersection, in rack order. Because aligned unit squares have integer coordinates, positive-area overlap is exactly sharing a cell; touching adjacent cell boundaries does not overlap. Never substitute bounding-box overlap for polygon overlap.

`geometry={pieces,placedCount,missingIds,allPlaced,allInside,noOverlap,validPacking,extractions,canShip}`. MissingIds follow rack order; placedCount=N−missingIds.length; allPlaced iff no missing IDs. AllInside is true iff every placed entry has no outsideCells (vacuously true when empty). NoOverlap iff every overlapIds is empty. ValidPacking=allPlaced&&allInside&&noOverlap. None of these flags is historical progress.

Extractions follow task.requirements order. Each is `{pieceId,placed,options,canExit}`. Unplaced means false,[],false. For a placed required piece, options follow its explicit doorIds order, each `{doorId,direction,distance,doorFits,sweptRects,wallHits,blockerIds,clear}`. Distance and one swept rectangle per sorted occupied cell are exactly those in public design. Rectangles are `{minX,minY,maxX,maxY}` integers. WallHits are every zero floor cell inside the W×H rectangle with positive-area intersection against any swept rectangle, once each, sorted y then x. BlockerIds are every OTHER placed piece with any cell intersecting the sweep, once each, in rack order. DoorFits uses the whole orthogonal span, including its far edge. Clear iff doorFits, this piece has no outsideCells, wallHits empty and blockerIds empty. Other required pieces stay fixed. CanExit=some option.clear. CanShip=validPacking&&every extraction.canExit. All task doors/requirements come from immutable config, not a possibly stale state.container copy.

`previewCheck` in place mode is `{id,pose,cells,vertices,outsideCells,blockerIds,valid}`. It uses the current preview pose and excludes ONLY that selected piece's old committed pose when finding blockers. BlockerIds lists each other blocking piece exactly once, in task rack order. Valid iff preview.x<W, no outsideCells and no blockers. At x=W it is always invalid as a packing pose, but A has the separate BACK meaning. Preview validity does not require a clear extraction channel: a legal packing edit may temporarily or permanently obstruct an exit until fixed. Recompute previewCheck whenever preview changes and freshly derive it from canonical preview/placements/config before every non-BACK A commit; a stale preview cache cannot authorize placement. Recompute inventory/geometry at create, after every commit/remove/clear, and on every CHECK submission. On submit, derive afresh from canonical placements and immutable task data; stale display caches, preview geometry or copied container data never grant success.

## Atomic input and admitted time

1. Terminal state returns exact no-op before reading dt or input. Events, message and receipts remain unchanged.
2. Only finite JavaScript-number dt with0<dt<=0.25 is admitted. All other durations return exact no-op without coercion or input reads.
3. Within one try/catch, classify input and gather own descriptors for `x,y,a,b,cancelEpoch,cancelled,paused` before any mutation or paused handling. Accept own data values from a non-null non-array object only; never invoke getters, inherit properties or write input. Classification/descriptor exceptions discard all partial reads to wholly empty neutral; use a null-prototype temporary. Nonthrowing Proxy traps may run; no side-effect-free Proxy claim is made.
4. Only literaltrue enables a/b/cancelled/paused. Normalized pausedtrue makes the whole call an exact no-op. Finite numeric axes clamp to[-1,1], all other values become0. A valid cancelEpoch is a nonnegative safe integer, otherwise ignored. Ignore aPressed/bPressed, raw direction strings and every other property.
5. Direction is none when both magnitudes<=0.5; otherwise take the greater magnitude, vertical winning ties. Positive x/y means right/down. An unchanged held direction does not repeat; switching to a different nonneutral direction creates an edge.
6. Clear events, set lastCommandnone, increment calls and advance/saturate elapsed. Cancelled or unarmed admitted calls still consume active time.
7. Apply the gate and at most one command, then save the normalized held sample. Invalid, paused and terminal calls do not change gates or consume input.

The first valid epoch establishes a baseline and is not a disarm. A later different valid epoch or false→true cancelled edge marks this admitted call as a disarm call and sets inputArmed=false BEFORE command eligibility. A disarm call never emits a command and cannot rearm, even if that same sample is noncancelled and full-neutral. Every cancelled sample suppresses commands. Store each valid epoch and current cancelled flag. Only on a call that does not disarm, was armed at call start and is not cancelled, choose B rise, else A rise, else changed nonneutral direction. Other new edges are consumed, never queued. Save all raw held A/B/direction fields even when suppressed. A call that does not disarm and is noncancelled full-neutral sets inputArmed=true for future calls and emits no command. Therefore a disarm requires a SUBSEQUENT admitted noncancelled full-neutral call to rearm; the disarming call itself never counts as that release. Fresh create can arm on its first admitted full-neutral call, including one that only establishes the initial epoch baseline. Malformed/nonobject input can normalize to neutral and arm: the model cannot infer phone absence, so the host supplies appropriate cancelled samples. Shared-host stale-input quarantine and actual physical release remain separate requirements.

## Commands and events

Set lastCommand to chosen a/b/up/down/left/right even when blocked. Events below are detached, each with current `call=state.calls`; no event is retained from a previous admitted call. Counter increments are saturating.

| Command/context | Exact effect and event |
| --- | --- |
| Direction in rack | Up/Left index−1, Down/Right index+1. Inside0..N: set rackIndex, moves++, `{type:'rack',from,to,call}`. Outside: blockedActions++, `{type:'blocked',reason:'boundary',call}`. |
| Rack A on piece | Set modeplace; preview=existing pose copy or{x:0,y:0,turn:0}; pickups++; recompute previewCheck; `{type:'pick',pieceId,pose,wasPlaced,call}`. Actual packing unchanged. |
| Rack B on placed piece | Set only that placement null; removals++; recompute inventory/geometry; `{type:'remove',pieceId,pose,call}` with old pose. |
| Rack B on empty piece | blockedActions++; `{type:'blocked',reason:'empty',pieceId,call}`. |
| Direction in place | Move x/y by one; beyond x0..W/y0..H−1 is blockedboundary. Otherwise moves++, update preview and previewCheck, `{type:'move',from,to,call}`, where from/to are full preview poses. |
| Place B | Turn=(turn+1)%4 with unchanged x/y; rotations++; recompute previewCheck; `{type:'rotate',pieceId,from,to,call}` with full poses. Invalid/outside previews are retained. |
| Place A at x=W | mode=rack,preview=null,previewCheck=null; `{type:'cancel',pieceId,call}`. No packing/counter change beyond calls/time. |
| Place A at x<W, invalid | blockedActions++; `{type:'blocked',reason:'outside' or 'overlap',pieceId,call}`. Outside has priority if both; preview/actual packing remain unchanged. |
| Place A at x<W, valid | Replace selected actual placement with preview copy; placementsMade++; mode=rack,preview=null,previewCheck=null; recompute inventory/geometry; `{type:'place',pieceId,from,to,call}` where from is old pose/null, to new pose. Even identical-pose recommit counts once. |
| CHECK B in rack | Set all placements null; clears++; recompute inventory/geometry; `{type:'clear',removed,call}` where removed is old placedCount. Keep indexN, mode/rack, time, failures and receipts; empty clear still counts. |
| CHECK A in rack | Freshly judge below; this is the sole submission action. |

At CHECK/A, if canShip, set phasewon/reasonempty/score100, failures unchanged, event `{type:'win',call}`. Otherwise increment failures once. Below4, remain playing/reasonempty/score0, event `{type:'reject',placedCount,clearRequired,call}` where clearRequired counts extraction.canExit. At4 set phaselost/reasonattempts/score0 and event `{type:'collision',reason:'attempts',call}`. An entirely correct packing may remain playing until this explicit submission. No edit, current badge or preview auto-wins.

Append one independently detached submission `{index,call,elapsed,placements,inventory,geometry,matched,failuresBefore,failuresAfter,remaining,phase,reason}` on each CHECK/A. Index is prior length; geometry is the fresh complete judgment; matched=geometry.canShip; remaining=4−failuresAfter. At most4 records: each earlier submission was rejected, so fourth either wins after3 failures or loses at4. No other action appends or rewrites a receipt.

On terminal transition create independent detached `{cause,call,elapsed,placements,inventory,geometry,matched,failures,remaining,score,phase,reason}`; cause success/attempts. Terminal receipt, submission receipt and live caches share no mutable arrays/objects. Failures equals unmatched submission count; a matched receipt occurs only last in a won round; a lost round has four unmatched receipts. Host retry is a fresh create restoring every field, not a partial clear.

## Deterministic visible messages

When an admitted call emits no event, preserve the prior message, including neutral/cancelled samples. Event messages use the exact templates below; braces interpolate public Chinese names, integers or fixed words. Rack name is the newly selected piece.nameZh or 验收 at indexN. A pose prints ordinary base10 x/y/turn; no judging uses this text.

| Event | Message |
| --- | --- |
| rack | `已选择{rackName}。` |
| pick | `正在摆放{nameZh}：A 落定，B 旋转；右侧 BACK 可取消。` |
| move with to.x<W | `锚点 ({x},{y})，朝向 {turn}。` |
| move with to.x=W | `已到 BACK 栏；A 取消预览，原摆放保持不变。` |
| rotate | `已将{nameZh}旋转到朝向 {turn}；锚点保持不变。` |
| place | `已放入{nameZh}，锚点 ({x},{y})，朝向 {turn}。` |
| remove | `已取回{nameZh}。` |
| cancel | `已取消预览，原摆放保持不变。` |
| clear | `已取回 {removed} 件零件；错误记录保留。` |
| blocked/boundary | `已到选择边界。` |
| blocked/empty | `该零件尚未放入箱体。` |
| blocked/outside | `零件越过箱壁，不能落定。` |
| blocked/overlap | `零件相互重叠，不能落定。` |
| reject | `装箱或抽出通道未通过，剩余 {4−failures} 次错误额度。` |
| win | `全部零件已装箱，指定抽出通道畅通。` |
| collision/attempts | `四次错误验收，本次装箱结束。` |

For rotate use event.to.turn; place uses event.to; move uses event.to. The host displays message, while contextual A/B labels derive from current mode/focus. Invalid/paused/terminal no-ops preserve message exactly.

## Required later verification

Verify all fixed data/areas/outline-cell agreement; four exact rotations and anchor normalization; nonconvex gaps vs bounding boxes; identical/partial overlap vs boundarytouch; no duplicate physical inventory; picked-old-pose cancellation and replacement; invalid ghost kept without rejection; BACK reachability and edge bounds; missing pieces despite sufficient area; blocked wall or otherpiece along the middle of a sweep; too-narrow/wrong door and forbidden direction; all required pieces independently checked with others fixed; rejection history and final-allowance success; immutable receipts/config; full invalid/Proxy/paused/terminal normalization and saturation; actual fresh wins/losses and retry/input regressions. Ordinary complete calls, synthetic fixtures and sparse browser observations remain separately labeled.
