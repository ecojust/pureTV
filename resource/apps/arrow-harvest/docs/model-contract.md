# Arrow Harvest / 箭田收获 — public model contract

Approved public geometry, rules and three fixed boards. The tables below contain every initial cell and arrow, with no solution arrow table or action route. The separate scratch author feasibility record used no production Model or pilot; its design exploration is not a formal model-test or gameplay claim. Author witnesses are not supplied to the public planner.

## Geometry and cells

Canvas960×540. One4×4 orthogonal grid, row-major `C1…C16`, rows/columns0…3. Drawing origin `(104,108)`, cell size84; centers are `x=104+(col+.5)*84`, `y=108+(row+.5)*84`. Geometry is integer row/column adjacency; arrows never wrap across rows or the outer border.

Each cell has one exclusive role: `source`, `field`, `stop`, or `forbidden`. **Every non-forbidden cell is a required target, including sources and stops.** There is no neutral transit cell. Sources and fields carry one cardinal arrow. Some arrows are editable; the rest are visibly fixed. Stops and forbidden cells have no arrow. Directions cycle clockwise `N,E,S,W`; A rotates90° only on an editable cell. Fixed arrows must have a visibly different base/lock mark.

Direction selection visits all16 grid cells, including fixed/stop/forbidden cells, one cardinal cell at a time with clamped edges and no wrapping. Thus every editable cell is reachable without a separate focus-graph assumption. Selection starts on the first editable cell in row-major order. A on a noneditable cell leaves geometry and `editCount` unchanged and explains that it cannot turn. There is no edit-count budget; the90-second active clock limits the whole round.

## One sow, synchronous batches and exact coverage

One stable seed `S1…Sn` is assigned to each source in row-major source order. Before sowing its status is `waiting`, its displayed position is its source, and all coverage counts are0. B starts the only sow of this round, snapshots the entire current arrow table into a detached `runArrows`, activates all seeds, and covers every source exactly once. **Source tiles count as covered at sowing.**

Every30 fixed ticks (0.5 active seconds), all currently active seeds propose one step along the frozen arrow at their old cell. No seed splits. Form the complete intent array and destination arrival groups before changing any seed or coverage. Sort seed records by stable source order and all cell lists by row-major order; results may not depend on incidental iteration order.

For the complete proposed batch:

1. If any destination is outside the grid or forbidden, fail with `lostReason:'forbidden'`.
2. Otherwise, if any destination already has committed coverage1, or two or more seeds propose the same destination in this batch, fail with `lostReason:'overlap'`.
3. On either failure, commit **none** of the proposed positions, coverage, per-seed step counts or retirements. Keep every intent and every diagnostic issue in `lastWave`; do not stop collecting at the first error. A valid seed's simultaneous arrival at a stop cannot partially commit while another seed fails.
4. On a valid batch, commit every destination and coverage together. Seeds entering a stop immediately become `stopped` and never move again. Other seeds remain active.
5. After the atomic commit, if all seeds have stopped, win only if every target is covered exactly once; otherwise fail `incomplete`. If any seed remains active, continue to the next batch.

Re-entering a source or a previously used stop is ordinary repeat coverage. Swapping cells, following into another seed's just-vacated cell, and the first return around a loop all fail through the old committed coverage rule; no separate edge-crossing rule is added. A same-tick destination collision is detected from all proposals even though that destination was previously unvisited.

With T targets and S sources, sowing covers S targets. Each successful movement batch adds at least one new target. Therefore there are at most T−S successful movement batches, and any remaining active seed must resolve on the next attempt: **at most T−S+1 attempted batches**. This is a theorem/diagnostic bound, not an unrelated extra loss mechanism. Stop count equals source count in the authored boards. Since stops are targets and single-use, exact total coverage already implies all seeds have stopped; no reverse counterexample is required. The explicit all-stopped-then-coverage check still defines terminal ordering clearly.

## Input, clock and retry

`phase` is `playing|won|lost`; `mode` is `editing|propagating|finished`. Fresh state is playing/editing. B transitions editing→propagating, after which all direction/A/B inputs are ignored: they cannot edit arrows, move selection, relaunch, or cancel the sow. P/START remains the independent shared pause. R/standard retry recreates the same fixed level with its authored initial arrows, no coverage, waiting seeds, zero edit/launch counters, initial selection and a fresh90-second clock; edited arrows are not retained.

Each fixed60Hz tick advances active time first. At90 seconds, timeout wins priority over B, A or a due propagation batch; no same-tick arrival commits. While propagating, perform the due batch if not timed out. While editing, pending B takes priority and discards coalesced A and navigation for that tick; otherwise due navigation precedes A rotation. The first movement batch is30 ticks after launch, not on the launch tick. Held A/B do not repeat. Direction movement is immediate, then first repeat after20 ticks and further repeats every10. The common finite-dt/per-call .25-second cap, pending subtick edges and cancellation epoch semantics apply. Cancellation drops pending input/repeat state; it does not undo an edit, erase a launched run or pause active time. Shared pause does not call Model.step.

Terminal states freeze the complete model, coverage, arrows, seeds, receipts and clock. All loss reasons are `forbidden|overlap|incomplete|timeout`. No mistakes counter, undo action or move budget is inherited from another game.

## Public state schema

UMD API `PureModel.create(seed=1,difficulty=0)`, `step(state,dt,input)`, `TICK_HZ:60`. Difficulty0/1/2 selects fixed levels; seed does not randomize them. No reference solution, route, solver, hidden target or forced-win API.

- Standard `width,height,seed,level:1…3,difficulty,levelName,phase,mode,tick,elapsed=tick/60,timeLimit:90,remaining,score,message,lostReason:null|reason`.
- `grid={rows:4,cols:4,x:104,y:108,cellSize:84}`; `cells[]` row-major `{id,row,col,x,y,role,target,editable,initialArrow,arrow,coverageCount,covered,seedIds}`. `initialArrow` and `arrow` are `N|E|S|W|null`. `seedIds` contains all actual seeds currently on the cell, including waiting/stopped ones; never failed destinations. All role/geometry/initial fields are fixed.
- `sourceIds,stopIds,targetIds,forbiddenIds,editableIds` row-major; `sourceCount,stopCount,targetCount,editableCount`. Target count12/14/14; source/stop count2/2/3; editable count5/6/7.
- `selectedId` and detached `cursor` copy `{id,row,col,x,y,editable,role}`. There is no answer preview. Selection over a fixed cell may show its role and arrow without changing it.
- `editCount` counts actual successful clockwise rotations. `lastEdit` is null or detached `{id:editCount,cellId,before,after,at,tick}`. `launchCount` is0 or1. `runArrows` is null while editing, then a detached16-entry nullable direction array in cell order that never changes. `sowingStartedAt,sowingStartedTick` are null before B, then the actual launch time/tick.
- `seeds[]` stable source order `{id,sourceId,cellId,status:'waiting'|'active'|'stopped',steps,stopId,stoppedAtWave}`. `steps` counts accepted moves only. `stopId/stoppedAtWave` are null until retired. `activeSeedCount,stoppedSeedCount,allSeedsStopped` are derived. Waiting seeds do not count as active or stopped.
- `coverageCounts[]` is the authoritative16-entry committed0/1 array. Cell coverage fields are derived; forbidden entries remain0. `coveredTargetIds,uncoveredTargetIds` are row-major; `coveredCount,remainingTargetCount,allTargetsCovered`; `goalReady=allTargetsCovered&&allSeedsStopped`. Once launched, `coveredCount=sourceCount+sum(seed.steps)`; before launch all are0.
- `waveIntervalTicks:30,waveIndex,acceptedWaves,nextWaveTick,waveProgress`. `waveIndex` counts attempted movement batches (including a rejected last batch); `acceptedWaves` counts committed batches. In editing/finished, `nextWaveTick:null,waveProgress:0`. During propagation, `waveProgress=(tick-(nextWaveTick-30))/30`, clamped0…1, is a **countdown phase**, not fractional seed movement. Actual tokens jump simultaneously at commit. Renderer may pulse actual positions and show the previous batch's lines; it must not interpolate unaccepted future destinations or use an external clock. After a nonterminal batch schedule the next at current tick+30.
- `lastWave` is null before the first movement attempt, then detached `{id:waveIndex,at,tick,accepted,failureReason,intents,arrivals,issues,newlyCoveredIds,stoppedSeedIds}`. `failureReason` is null for an accepted batch, otherwise forbidden/overlap. An accepted batch may subsequently end the round as incomplete.
- `lastWave.intents[]` includes every previously active seed in stable seed order: `{seedId,fromId,direction,toId,toRow,toCol,outside}`. `toId:null` only outside. `arrivals[]` contains all in-bounds proposed destinations, even forbidden ones, row-major: `{cellId,seedIds,count,previousCoverage}`. These are proposals and must never be displayed as committed coverage on a rejected batch.
- `lastWave.issues={outsideSeedIds,forbiddenCellIds,revisitedCellIds,simultaneousCellIds}` retains **all** violations, regardless of displayed reason priority. Revisited cells had old coverage1; simultaneous cells have arrival count≥2. `newlyCoveredIds/stoppedSeedIds` are empty when rejected; otherwise exactly actual accepted changes.
- `failure` is null unless lost, then `{reason,waveIndex,cellIds,seedIds,missingTargetIds}`. For forbidden/overlap, cellIds is the row-major union of all in-bounds issue cells and seedIds are all participating offending seeds, not merely the first; outside participants remain available through intents. For incomplete, cellIds/seedIds empty and missingTargetIds is actual uncovered targets. For timeout, waveIndex null, no extra move, cellIds/seedIds empty; missingTargetIds reflects the actual board.
- `lastAction` starts null. Actual event objects have `{type,at,tick,...details}`. Types are `select` (changed focus), `select-blocked` (attempt at a grid boundary), `rotate`, `locked` (A on a noneditable cell), `sow`, `wave`, `won`, and `lost`. Each nonterminal outer step clears `events[]`, then collects only events actually produced during that call and retains its last32; `lastAction` remains the most recent actual event across idle steps. Terminal calls return without clearing anything. Ignored propagation inputs do not produce edit/selection events. These types are model events, not a promise of particular sound effects. Underscore-prefixed input bookkeeping is not puzzle data and is not consumed by renderer/planner.
- Event details: `select/select-blocked={direction,id}` where id is the resulting current cell; `rotate` copies the complete `lastEdit`; `locked={cellId,role}`; `sow={sourceIds,seedIds,coveredIds}` with coveredIds equal to the newly covered sources in public order; `wave` copies the complete `lastWave`; `won/lost={reason:null|lostReason}`. Records and nested arrays are detached copies.

Score is `coveredCount*40 + (phase==='won' ? 1000+floor(remaining)*5 : 0)`. Initial editing score0; launch covers sources and increases score accordingly. Failed proposals award no coverage or points. Editing/focus does not earn score.

## Public boards and bounded design feasibility

The following tables define all immutable cells and initial arrows; row-major cell IDs determine source/stop/target lists. In the tables below `*` marks editable arrows; arrows without `*` are fixed; S=source, K=stop, X=forbidden. Stops/forbidden have no arrow. All non-X cells are targets. Rows and columns correspond directly to C1…C16.

### 1 环田分流 —12 targets,2 seeds/stops,5 editable arrows

```text
S:E*   K      W      W
 N*    X      X      W*
 S     X      X      N
 E     N*     K     S:W*
```

### 2 交口避让 —14 targets,2 seeds/stops,6 editable arrows

```text
 E      N*     E      W*
S:S*    X      K      W
 S     S:W*    X      K
 E      N*     E      W*
```

### 3 三路归仓 —14 targets,3 seeds/stops,7 editable arrows

```text
S:S*    N*     S      X
S:E*    K      E      K
 E      S*    S:N*    N*
 X      K      E*     W
```

Scratch design enumeration examined exactly1024/4096/16384 editable-direction configurations. Each board has at least one valid exact-cover run and the authored initial arrows are not solved. Actual initial outcomes are incomplete/one-batch simultaneous overlap/revisit overlap. The second and third public boards admit same-wave destination collisions. The finite enumeration reports design feasibility only, not production rule tests, model integration, browser wins or recording duration; no uniqueness or optimality requirement is imposed. Public report omits witness arrow assignments and routes.
