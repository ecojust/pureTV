# Parity Garden model contract

UMD `PureModel` exports `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. Three fixed authored 4×4 puzzles expose their whole current garden, target and nozzle effects. Production stores public puzzle facts only, with no solver, answer mask, prescribed action list or forced completion API.

## Two independent state rules

Every cell has a binary open/closed flower and a nonnegative integer directWaterCount. One A action consumes one water drop, flips the selected flower and its current nozzle's valid neighboring flowers, and increments **only the selected cell's directWaterCount**. A neighbor flipped by the spray receives no direct count. Every valid affected cell is flipped once; edges clip without wrapping.

- Cross nozzle: center, north, east, south, west.
- Diagonal nozzle: center, northwest, northeast, southeast, southwest.

B switches cross↔diagonal on an edge. Switching is free, changes the actual next spray neighborhood, and neither undoes an action nor refunds water. Consecutive A actions on the same center with the same nozzle restore the entire flower pattern and every direct-count parity, while consuming two drops and adding two to that center's directWaterCount. Exact counts are not reset or capped at a parity bit.

Victory requires the entire flower pattern to match the public target AND every marked flower to be **open with an even directWaterCount**. Zero is even. Being indirectly opened does not increment a marked flower's direct count. Even count alone does not satisfy a marked flower that is closed. Every authored marked cell has targetOpen=true, so these conditions are compatible. Unmarked cells have no direct-count condition. Every authored initial state is unsolved.

## Geometry and public fields

Canvas size is 960×540. `grid={cols:4,rows:4,x:304,y:100,cellSize:78}` uses the main board's top-left corner. `targetView={x:72,y:150,cellSize:40}` is the target board's top-left corner. Cell id is row*4+col, north is row−1, and main cell center is `(304+(col+.5)*78,100+(row+.5)*78)`.

- `cells[]`: row-major `{id,col,row,x,y,open,targetOpen,requiresEven,directWaterCount,directParity,conditionMet,matched}`. DirectParity is directWaterCount%2 (0 even, 1 odd). ConditionMet is true for an unmarked cell, otherwise `open && directParity===0`. Matched compares only open with targetOpen. These separate indicators must not be conflated in rendering.
- `targetPattern[]` contains 16 public booleans. `markedIds[]` lists the actual marked cell IDs, with 4/6/8 marks across levels. Every marked target is open. `selectedId` initially equals 5; `cursor={id,col,row,x,y}` is the actual selected cell center.
- `nozzles[]` is ordered cross, diagonal, each `{id,label,offsets:[{dx,dy}]}`. Offsets include `{dx:0,dy:0}`. `nozzle` is `cross` or `diagonal`, initially cross. `previewIds[]` is the sorted, unique, in-bounds affected set for selectedId and the current nozzle. Render this public set directly; it is a preview, not an already applied change.
- `waterBudget` is 6/8/10, `waterUsed`, and `waterRemaining=waterBudget-waterUsed`. The sum of all directWaterCount values equals waterUsed. `nozzleSwitches` counts real B changes. `totalAffectedToggles` counts actual flower flips, including indirectly affected flowers.
- `matchedCells` counts matching current/target flowers; `patternMatched` is matchedCells===16. `markedCount`, `satisfiedMarked`, and `allMarkedSatisfied` count/check marked cells satisfying both open and even. `goalMatched=patternMatched && allMarkedSatisfied`.
- `lastWater` is null or `{id,cellId,nozzle,affectedIds,changes,directBefore,directAfter,at,expiresAt}`. Its ID is the committed waterUsed number. Changes is an array of `{cellId,beforeOpen,afterOpen}` for actual affected cells. Its fixed emission center/nozzle and affected set do not move when the cursor or nozzle changes. The highlight lasts .6 active seconds; no pending spray is hidden in this field.
- `lastAction` records actual action/selection feedback. `events[]` resets each step and is capped at 32. No unbounded spray history is stored.
- `width`, `height`, `level` 1…3, `difficulty` 0…2, `levelName`, `phase` (`playing`, `won`, `lost`), `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `message`, and `lostReason` (null, `water`, or `timeout`).

## Controls, timing and priority

Directional input chooses its larger absolute axis, horizontal on ties, with .25 deadzone. It moves the cursor one cell, clamped at the board edges without wrapping. New direction acts immediately, first held repeat after 20 ticks, then every 10 ticks. Release/direction change resets the initial delay. Selection consumes no water.

Every fixed tick advances the active clock and checks the deadline first. Then a pending B edge changes the nozzle, discards a simultaneous A edge, and suppresses navigation on that tick. Otherwise navigation occurs before pending A, so A applies to the resulting selected cell. A and B are edge-triggered, including explicit pressed-edge metadata; holding either does not repeat watering or mode switching. Button edges received before a full tick are cached. A zero-dt call performs no watering, switch or selection movement.

The priority applies per fixed tick. A direction still held may act on later ticks, including later substeps of the same larger-dt call after B. A discarded coalesced A is never replayed on those ticks. Cancellation-owned samples (`cancelEpoch`/`cancelled`) clear pending button edges and repeat state, act as neutral input, and never queue a later spray; selected cell, nozzle, flowers and counts remain unchanged by cancellation itself. The active clock still advances. Shared pause/disconnect freezes the model by not calling step.

After a committed A action, atomically update all flower flips, only the selected direct count, water usage and the public goal metrics. Check goalMatched first, then exhausted water. The last drop can win; a last drop leaving either pattern or marked conditions unmet immediately loses. At tick 5400 the deadline precedes watering and both outcome checks, so an expired round cannot be rescued. Terminal step calls freeze all fields, including events and transient highlights. Retry creates the same authored puzzle with independent arrays, zero direct counts, full water and time, cross nozzle and cursor 5.

## Score and validation scope

Playing/loss score is `matchedCells*20+satisfiedMarked*40`. Winning adds `1000+waterRemaining*100+floor(remaining)*5`. Repeatedly restoring a pattern cannot farm points: score is derived from current flowers/conditions, and the water spent is never returned.

Authoring verification targets minimum water costs 4/6/8, with budgets 6/8/10 retaining two drops for an actual double-spray demonstration. Marked parity adds independent constraints to the flower-pattern equations. At least one authored puzzle requires both nozzle modes in an optimal solution; verification will record the exact independent result. Public solvers may build 32 binary action columns from the two nozzles and 16 centers, using current flower XOR target and marked direct parity. Their search/oracle data belongs in tests/scratch, never in production state.
