# Hidden Corridors model contract

UMD `PureModel` exports only `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. Three fixed authored 4×4 hidden-wall puzzles expose row passable counts, known-open entry/exit cells and their exact shortest path distance measured in **edges**, not cells. Retry uses the identical hidden board for that difficulty; it never silently rerolls a wall after a failed inference.

## Private truth and public observations

The true wall mask is stored in a module-scoped WeakMap keyed by the original state object returned from create. It is never attached to state, nested cell data, symbols, nonenumerable fields, events, configuration or renderer input. Exported API contains no map reader, inference solver, reference path or forced outcome. Fixed authored wall constants necessarily exist in module source; this is a snapshot/render information boundary, not a claim of secrecy against inspecting JavaScript source.

JSON snapshots are complete **public observations**, not restorable simulation states. step accepts only original states registered by the same model instance; a deserialized copy or state from another instance is rejected with a generic error. Boundary fixtures must mutate an original create-state, not try to clone the WeakMap registration. Renderer and pilot receive public snapshots only.

Unknown cells have no hidden passability property. Only a paid probe changes unknown to open/wall. Entry and exit are publicly known open for free. Navigation and route marking never consult private truth. Submission may return accepted or a generic unsafe-route verdict after all public shape requirements pass; it never identifies an unprobed offending cell, number of hidden walls on the route, or a suggested safe step. A successful submission certifies the route but does not automatically reveal any cell or the rest of the board.

## Geometry and public schema

Canvas is 960×540. `grid={cols:4,rows:4,x:110,y:106,cellSize:84}` gives the board's top-left corner. Cell id is row*4+col; north is row−1. Main cell centers are `(110+(col+.5)*84,106+(row+.5)*84)`. `rowClueX=480` is the intended centerline for the four public row-count labels.

- `cells[]`: row-major `{id,col,row,x,y,role,knowledge,probed}`. Role is null, `entry` or `exit`. Knowledge is exactly `unknown`, `open`, or `wall`. Probed is true only after a charged probe; the two free endpoints start known-open with probed=false.
- `entry` and `exit` are `{id,col,row,x,y}`. `rowOpenCounts[]` counts all passable cells in each complete row, including known endpoints. `requiredDistance` is the true entry-to-exit shortest edge distance, not a route cell count or Manhattan assumption. All these clues are public.
- `mode` is `probe` or `route`. `probeCursorId` remembers the freely movable probe cursor; `selectedId` and `cursor={id,col,row,x,y}` are the current actual selection. In route mode they refer to the route endpoint, not a hidden movable character.
- `path[]` is the actual player-marked sequence of `{cellId,col,row,x,y}`, initially just the entry. `visited[]` contains 16 public route-occupancy booleans. `pathEdges=path.length-1`, `lengthMatches=pathEdges===requiredDistance`, and `atExit` describe only the public shape. None of these claims the route is secretly safe.
- `probeBudget` is 3/4/5, `probesUsed`, and `probesRemaining=probeBudget-probesUsed`. `revealedCount` counts currently known cells including the free endpoints. `probeLog[]` has at most probeBudget charged observations `{cellId,result,at,tick}`. `probeAttempts`, `repeatedProbes` and `blockedProbes` are lifetime counters; repeated known-cell probes never spend a resource.
- `lastProbe` is null or `{cellId,result,charged,reason,at,expiresAt}`. Result is open/wall only for a revealed or already-known cell; it is null for a blocked unknown-cell probe after exhaustion. Reason is `revealed`, `known` or `exhausted`. The highlight lasts .6 active seconds and does not imply hidden queued work.
- `submissions`, `totalWrong`, `exhaustedStrikes`, and `maxExhaustedStrikes=3` are explicit lifetime counters. `lastSubmission` is null or `{id,accepted,reason,routeIds,pathEdges,requiredDistance,probesRemaining,chargedStrike,exhaustedStrikes,at}`. RouteIds is an independent copy of the actual submitted path. Reason is `accepted`, `shape`, `endpoint`, `length`, or generic `unsafe`; it contains no offending cell.
- `routeMoves`, `backtracks` and `modeSwitches` count actual appends, pops and mode transitions. `lastAction` and bounded `events[]` contain actual public actions/results only; events resets each step and is capped at 32.
- `width`, `height`, `level` 1…3, `difficulty` 0…2, `levelName`, `phase` (`playing`, `won`, `lost`), `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `message`, and `lostReason` (null, `strikes` or `timeout`).

## Probe and route controls

In probe mode, directions move the cursor freely one cell, clamped at the board edges. A probes the selected cell. If it is already known, report that same public result without consuming a probe, even when probesRemaining is zero. If it is unknown and a probe remains, consume exactly one and reveal its real state. If it is unknown and no probe remains, report exhaustion with result=null and leave knowledge unchanged. The final available probe reveals normally and does not end the round or charge a prior submission retroactively.

Probe-mode B enters route mode at the entry, preserving all observations and the saved probe cursor. Directions append an adjacent unvisited cell. Known walls, board edges and re-entry are blocked; unknown cells are allowed and are **not** secretly collision-tested while marking. At the exit, further append input is locked; A submits or B backs up. There is no automatic dead-end rejection and no automatic victory on reaching the exit.

Route-mode A submits at any endpoint. Route-mode B removes exactly one marked cell when the path contains more than the entry. At the entry, B returns to probe mode at the saved probe cursor. B does not refund probes, time, wrong submissions or strikes. Holding B does not repeatedly undo. Each pop releases that route occupancy, so the player may correct the drawing; this differs from moving through the actual hidden corridor.

## Submission checks and failure ledger

Check these in order before a submission can win:

1. Public shape: valid in-bounds cell IDs, starts at entry, every step orthogonally adjacent, no repeated cell.
2. Public endpoint: the current path ends at exit.
3. Public length: exactly requiredDistance edges.
4. Private safety: none of those route cells is a real wall.

Only the fourth check accesses hidden truth. An incomplete, malformed or wrong-length route cannot be used as a free one-cell wall query. An unsafe result reports only that the complete submitted route is invalid, never which unknown cell is blocked. Production validates the real board, not the player's claims or cell.knowledge. No public-candidate solver is needed in production. Ordinary inference validation will separately show routes safe under every map consistent with the public clues and probes.

Every fresh invalid A submission increments totalWrong, including repeated fresh submissions of an unchanged bad route. Held A never repeats. **Only an invalid submission made when probesRemaining===0 increments exhaustedStrikes.** Earlier wrong submissions are never retrospectively converted to strikes when the last probe is spent. The third exhausted strike immediately loses. With probes remaining, a wrong submission gives feedback but does not spend a probe or strike. Probe exhaustion by itself is not a loss; a valid route may still win. The 90-second active deadline independently ends the round.

## Timing, score, retry and validation

Directional input uses the larger absolute axis, horizontal on ties, with .25 deadzone. A new direction acts immediately; held repeat starts after 20 ticks and continues every 10 ticks. Release/direction change resets the delay. Buttons are edge-triggered, including explicit pressed-edge metadata cached until a full tick.

Each tick advances and checks the deadline first. B then has priority, discards a simultaneous A edge, and suppresses navigation on that tick. Otherwise navigation occurs before A, so A probes/submits the resulting cursor/path. A still-held direction may act on later fixed ticks, including substeps of a larger-dt call after B. Zero dt performs no movement, probe, mode change, pop or submission. Cancellation-owned input clears pending edges/repeat state and acts neutral while time advances; it preserves current mode, cursor, knowledge and marked route. Shared pause/disconnect freezes by not calling step.

Playing/loss score is `probesUsed*40+min(pathEdges,requiredDistance)*10`, using only public progress. A win adds `1000+probesRemaining*100+floor(remaining)*5`. Probe results have equal point value; score never depends on unseen walls or secretly safe partial-route length. Repeated probes, failed submissions and undo/re-marking cannot accumulate score. Terminal step calls freeze every field, including timers, counters, events and transient feedback.

Authoring will verify at least two candidate boards per initial clue set with no common safe required-length route before probing, plus a bounded public-probe strategy within each budget. At least one puzzle has requiredDistance greater than entry/exit Manhattan distance. Retry restores full resources and no probes while registering the exact same hidden map for that level. Solver/proof data and example routes stay in tests/scratch, never in production state.
