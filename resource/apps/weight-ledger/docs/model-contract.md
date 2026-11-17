# Weight Ledger model contract

UMD `PureModel` exports `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. Three fixed authored puzzles use six uniquely identified physical weights, three shared active trays and one storage bank. The production model contains only public puzzle facts, never a solver, reference placement, prescribed move sequence or forced outcome. Retry selects the same authored puzzle and restores independent state.

## Shared integer loads

Each physical weight has one positive integer mass in grams and exactly one trayId. Equal masses are separate instances with different IDs. Each tray's totalMass is the sum of the masses actually assigned to it; picking a weight changes no assignment or total.

Three scales independently compare public integer weighted loads. A side is `{terms:[{trayId,coefficient}],constant}`. Its value is the constant fixed load plus the sum of `coefficient*tray.totalMass`. Coefficients are positive integers 1 or 2; coefficient 2 is an explicitly labeled **2:1 lever ratio**, not a duplicate physical weight or creation of mass. The display must write `2×A`, rather than depicting a second copy of tray A. A tray is physically represented once and referenced by several scale equations.

For every scale, `delta=leftTotal-rightTotal`, and balanced means exactly delta===0. There is no tolerance, floating mass, scale drift or animation-based judgement. Every authored relocation between distinct trays changes the integer delta of at least two scales. Storage is excluded from all equations. Victory additionally requires **all six weights deployed outside storage**, so an empty bank of scales cannot produce a trivial win.

## Geometry and public state

The canvas is 960×540. Four tray rectangles have width 220 and height 145:

| id | label | center x/y | counts toward equations |
| --- | --- | --- | --- |
| A | A盘 | 160,170 | yes |
| B | B盘 | 410,170 | yes |
| C | C盘 | 160,365 | yes |
| bank | 库存 | 410,365 | no |

Each tray has capacity 6, sufficient for all six physical weights, and six display slots. Assigned weights are sorted by numeric ID within their actual tray. Slot k has center `x=tray.x+(k%3-1)*54`, `y=tray.y+(floor(k/3)-.5)*48+10`; a 40-pixel body fits each slot. Repacking these display slots changes no mass, allocation or move counter.

- `weights[]`: `{id,mass,trayId,slot,x,y}`. IDs are integers 1…6, stable through every pickup, placement and undo. The actual weight remains at its source position while selected for carrying; do not draw a second physical weight at the target.
- `trays[]`: `{id,label,x,y,width,height,capacity,weightIds,totalMass,isBank}` in A,B,C,bank order. weightIds is sorted; a weight occurs in exactly one list. `inventoryIds` is the bank's current ID list. `totalMass`, `deployedCount`, `inventoryCount`, and `allDeployed` summarize the actual allocation.
- `scales[]`: `{id,label,left,right,leftTotal,rightTotal,delta,balanced}` with the side structure above. `balancedCount` and `allBalanced` summarize all three. All geometry, coefficients, fixed loads, masses and targets are public.
- `phase` is `playing`, `won`, or `lost`; `mode` is `selecting` or `placing`. `selectedWeightId` is always a weight ID. `heldWeightId` is null or the picked weight ID; it is a preview selection, not an inventory location. `selectedTrayId` is null in selecting mode and a tray ID in placing mode.
- `selectionItems[]` is the current navigation domain: `{kind,id,x,y}` for weights in selecting mode or trays in placing mode. `selectedId` identifies its selected member. It is a numeric weight ID or string tray ID according to mode.
- `moveBudget` is 3/4/5, `movesUsed` counts current committed relocations, and `movesRemaining=moveBudget-movesUsed`. `historyDepth` and `canUndo` expose past committed actions; canUndo is true only while playing, with no pickup and nonempty history. A held pickup is canceled by B instead of undoing history.
- Lifetime counters are `totalMoves` (successful placement commits, including later undone ones), `pickups`, `cancels` (B cancellation or same-tray return), `undos`, and `invalidPlacements`. They never roll back on undo. Selection has no cost. There is no action budget for cursor movement or pickup.
- `lastTransfer` is null or `{kind,weightId,fromTrayId,toTrayId,changedScaleIds,at,expiresAt}`. Kind is `place` or `undo`; changedScaleIds is computed from actual before/after deltas, never a predicted effect. The highlight lasts .6 active seconds. `lastAction` records actual selection/action/blocked feedback; `events[]` resets each step and is capped at 32.
- `width`, `height`, `level` 1…3, `difficulty` 0…2, `levelName`, `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `message`, and `lostReason` (null, `moves`, or `timeout`).

## Selection and A/B controls

Direction input uses its larger absolute axis, horizontal on ties, with .25 deadzone. Selection is spatial over selectionItems. Consider candidates strictly in the requested cardinal half-plane; minimize `3*abs(perpendicularDistance)+abs(forwardDistance)`. Break ties by numeric weight ID or published tray order. If there is no candidate, selection stays put. A new direction acts immediately, first held repeat after 20 ticks, then every 10 ticks. Release or direction change resets the initial delay.

When selecting, A picks selectedWeightId, sets heldWeightId to it, switches to placing mode and initially selects its source tray. This changes **no actual position, inventory, scale total, score, history or move budget**. In placing mode, directions select destination trays. A at the same source tray returns the pickup freely, clears heldWeightId and increments cancels; it does not create history. A at a different valid tray atomically relocates exactly that ID, spends one move, records a pre-commit snapshot, returns to selecting mode with that weight selected, recomputes every scale, and evaluates the outcome. A full destination is rejected without changing inventory, history or budget, leaving the pickup available; capacities are public.

B while holding cancels only the pickup, increments cancels and returns to selecting mode. It never also undoes a prior placement. B without a pickup undoes one committed relocation if history is available. It restores all weight assignments, movesUsed and the selected weight from that action's pre-commit snapshot, then recomputes positions, tray memberships and all scales. The restored mode is selecting with no pickup or destination selected. Thus the snapshot represents the full allocation immediately before the commit, with the picked weight's idle selection, rather than reopening its placement preview. Undo pops one bounded history entry and increments undos. It does not restore elapsed time or lifetime counters. Empty-history B is a free explanatory no-op.

## Fixed ticks, priority and cancellation

Each fixed tick first advances and checks the 90-second deadline. If B has a pending edge, process B and discard a simultaneous A edge, with no navigation on that tick. Otherwise process directional selection, then a pending A action using the resulting selected item. A and B are rising-edge actions (or explicit pressed-edge metadata), never held repeats. Edges received before a full tick are cached. A direction still held may act on later ticks, including later substeps within the same larger-dt step call; B priority does not suppress the entire outer call. A zero-dt call does not move inventory or perform pickup/undo.

`cancelEpoch`/`cancelled` neutralize cancellation-owned samples, clear pending input edges and directional repeat state, and never queue an action. They do **not** cancel a deliberate current pickup preview; only the player's B or same-tray A does that. The clock continues on a cancellation tick. Shared pause/disconnect freezes by not calling step.

After a successful relocation, check **allDeployed and allBalanced first**, then exhausted move budget. Therefore the last allowed move can win; a last unbalanced move immediately loses. The active deadline precedes both and cannot be rescued by a move on tick 5400. A loss is terminal: B cannot undo an already exhausted or expired round. R creates a fresh round through the shared runtime.

## Score, bounded history and validation

Playing/loss score is `balancedCount*200+deployedCount*25`. Winning adds `1000+movesRemaining*50+floor(remaining)*5`. Score is recomputed from actual allocation, so pickup, cancel and undo/repeat cannot accumulate points. Internal history contains only past allocations and selections, at most moveBudget entries; it is not a solution table. Terminal step calls freeze all state, including transients, counters, selections and events.

The three puzzles are 三盘初衡, 对侧配重 and 杠杆合账. Their public facts will be independently enumerated for solvability within the real 3/4/5 move budgets, and normal input checks will cover both winning and budget-exhaustion routes. Verification data and any example placements remain in tests/scratch, never in production state.
