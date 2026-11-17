# Path Glyphs model contract

UMD `PureModel` exports `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. Three authored, fully public 5×5 puzzles use identical rules. There are no production solver, reference-route or forced-outcome APIs. All state is serializable and bounded.

## Geometry and public fields

Canvas coordinates are 960×540. `grid={cols:5,rows:5,cellSize:70,x:305,y:90}`. Cell `(col,row)` has integer id `row*5+col` and center `(305+(col+.5)*70,90+(row+.5)*70)`. North is row−1, east col+1, south row+1, west col−1. Movement is discrete, without physical radii or hidden traversable edges.

- `cells[]` is row-major `{id,col,row,x,y,type,role,rune,visited,visitIndex}`. Type is `floor` or `wall`; role is null, `start`, or `exit`. A rune is null or `{symbol,enterFrom}`, where symbol is N/E/S/W and enterFrom is null (unconditional) or one of those four sides. **enterFrom W means entering eastward from the western neighbor**, not moving west. Walls contain no rune. Every fact is visible.
- `start` and `exit` are `{id,col,row,x,y}`. `player={cellId,col,row,x,y,enteredFrom}` gives the actual current endpoint; enteredFrom is null initially.
- `path[]` contains `{cellId,col,row,x,y,enteredFrom,emitted}` in actual traversal order, starting with the start tile. Emitted is the actual emitted symbol or null. The maximum path length is 25. Start does not emit without an entry, even if a test fixture assigns it a rune.
- `visited[]` is a 25-element occupancy array. `cells[].visited` and `visitIndex` are matching public views; visitIndex is null when unvisited. Occupancy is never released by reversing direction. B is the only route-clear operation.
- `symbols[]` is the actual emitted symbol stack. `emissions[]` is its corresponding provenance stack of `{cellId,symbol,enteredFrom,pathIndex}`. A conditional rune entered from another side emits nothing; it is still visited and cannot be retried on this route. `conditionHits` and `conditionSkips` count actual conditional entries on the current route. These reset on B.
- `target[]` is the public exact ordered target, 6/7/8 symbols in the three authored puzzles. A wrong route may collect up to 24 symbols; render the real entire sequence, including extra symbols, rather than silently truncating it to target length.
- `prefixLength` is the length of the matching initial prefix of symbols and target. `sequenceMatches` requires identical lengths and every corresponding symbol equal. A correct prefix alone cannot win.
- `routeStatus` is `drawing`, `at-exit`, or `rejected`; `phase` is independently `playing`, `won`, or `lost`. A rejected route remains visible until B. Terminal renderers use phase for the final result.
- `availableMoves[]` lists currently legal direction letters in N,E,S,W order. It is empty at the exit, after rejection and at terminal states.
- `mistakes`, `maxMistakes=3`, and `rejections[]` form a persistent failure ledger. Each rejection is `{attempt,reason,at,tick,path,symbols}`, with reason `dead-end` or `wrong-sequence`, and copies of the rejected cell-id path and actual symbol stack. The ledger has at most three entries. `rejection` is null or the current route's rejection record; B clears this pointer but preserves the ledger.
- `moves=path.length-1`, `totalMoves`, `clears`, `submissions`, and `blockedMoves` are actual counters. Total counters are finite within the 90-second round. Submissions counts exit A submissions, not explanatory A presses elsewhere.
- `lastMove` is null or `{fromCellId,toCellId,enteredFrom,emitted,conditionalResult,at,expiresAt}`. ConditionalResult is `active`, `skipped`, or null, and expiresAt=at+.6. This is an actual transition for optional rendering, not a predicted path. B clears it.
- `lastAction` records the latest accepted action or blocked attempt; `events[]` resets each step and is capped at 32. Actions and events contain actual results, never suggested answers.
- `width`, `height`, `level` 1…3, `difficulty` 0…2, `levelName`, `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `message`, and `lostReason` (null, `mistakes`, or `timeout`).

## Input, traversal and submission

Input is `{x,y,a,b,aPressed,bPressed,cancelEpoch,cancelled}`. Larger absolute directional axis wins; equal axes choose horizontal. Both axes below .25 are neutral. A new nonzero direction moves immediately. Its first held repeat occurs 20 ticks later (333 ms), and subsequent repeats every 10 ticks (167 ms). Release or direction change resets this initial delay. Blocked moves use the same cadence, but do not extend the path, emit symbols or consume a failure.

Each fixed tick checks the deadline first, then chooses at most one atomic action: **B clear, otherwise A submit/no-op, otherwise direction**. Simultaneous A is discarded when B wins; it is never queued for the next tick. A elsewhere explains that submission requires the exit and does not move that tick. After either A or B, a direction still held may act on later fixed ticks, including later substeps of the same larger-dt `step` call. For example, `step(state,.25,{b:true,x:1})` clears on its first tick and may move east from the start on its second tick; priority does not suppress direction for the entire outer call. A and B use rising edges or explicit pressed-edge metadata, never held repetition. Edges before a full fixed tick are cached. Cancellation clears pending edges and directional repetition, neutralizes the cancellation-owned sample, and never queues an action; active time still runs. Shared pause freezes by not calling step.

A legal move enters one orthogonally adjacent floor tile that has never been visited. It appends one path item and marks occupancy. It appends exactly one symbol/provenance item if that cell has an unconditional rune or its entry-side condition matches. Wrong entry does not substitute another symbol. Walls, outside cells, and visited cells are blocked; there is no backtracking or force-pushing.

Reaching the exit enters `at-exit`: movement is locked, A explicitly submits, and B may clear. Arrival itself never wins or fails, and the exit is never treated as an automatic dead end. At a non-exit endpoint with no unvisited orthogonal floor neighbor, reject the route once. A wrong exit submission also rejects once. Exact target matching at an exit A wins. Incomplete, extra, or reordered sequences fail even if they contain all target symbols.

Rejected routes ignore movement and A. B clears the entire path, occupancy, symbols, provenance and current conditional counts back to start. It does **not** refund elapsed time, persistent mistakes, rejection records or total counters. A proactive B before any rejection is allowed. There is no one-step undo. The third rejection loses immediately; B cannot repair a terminal round. R retry is the shared runtime creating a fresh independent model.

## Time, score and bounds

The clock increments to tick/60, then checks `elapsed>=90` before any action. A submission on the expiry tick cannot win. With fewer than three failures, time continues during route inspection, exit waiting and rejected-route inspection.

Playing/loss score is `prefixLength*100`. A win adds `1000 + floor(remaining)*5 + (maxMistakes-mistakes)*100`. B resets route progress and its prefix points, preventing score accumulation by repeated clearing. No point is awarded for merely visiting an empty tile or repeatedly pressing a blocked direction. Terminal step calls freeze every field, including timers, events, counters and transient render records.

Each authored puzzle has at least one independently enumerated valid route. Its public rune layout includes both triggered and skipped conditional entries on verified solutions. Authoring and verification routes belong only in tests/scratch; production stores only public board facts and the public target.
