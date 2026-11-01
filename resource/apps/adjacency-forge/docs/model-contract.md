# Adjacency Forge model contract

UMD `PureModel` exports only `create(seed=1,difficulty=0)`, `step(state,dt,input)` and `TICK_HZ=60`. Each of three fixed, fully public puzzles has seven occupied hexagonal cells and seven physical metal tiles with unique IDs. Retry restores the same puzzle. No solver, reference assignment, future route or forced outcome appears in production.

## Hex adjacency, material recipes and actual heat routing

Cells use integer axial coordinates q,r. The ordered six directions are:

| Index / displayed priority | Name | dq | dr |
|---|---|---:|---:|
| 0 / 1 | E | 1 | 0 |
| 1 / 2 | SE | 0 | 1 |
| 2 / 3 | SW | -1 | 1 |
| 3 / 4 | W | -1 | 0 |
| 4 / 5 | NW | 0 | -1 |
| 5 / 6 | NE | 1 | -1 |

Only an existing cell at that exact offset is a neighbor. A missing edge is not wrapped, clamped or replaced. Each neighbor is counted once. Each cell holds exactly one physical tile; every tile occurs in exactly one cell. The three materials are copper/Cu, iron/Fe and silver/Ag. Their recipe and heat rule move with the material, not with the location or physical ID. Each material's public recipe requires an exact count of one specified neighbor material; other material counts are displayed but are not extra hidden requirements.

The heat target cycle is copper→iron, iron→silver, silver→copper. A non-mold cell's actual outlet is the first existing neighbor of its heatTarget material in the fixed world direction priority 1…6 above. If there is no such neighbor it is blocked. An outlet is computed even when that tile's recipe is currently wrong, so count satisfaction and routing remain separate facts.

The furnace/source and mold/sink are fixed cell roles. They are different cells, with exactly one source role and exactly one mold role in every puzzle. The mold absorbs heat and has no outgoing outlet; its own local material recipe must still be satisfied. Trace starts at the furnace and follows actual outlets. Reaching the mold succeeds immediately, before consulting any further outlet. A missing outlet stops as blocked. Revisiting a cell stops as a loop. At most seven distinct cells and seven directed edges are inspected. This is a discrete, current-layout heat-routing rule, not a continuous temperature simulation: swapping or undoing recomputes the actual outlets and trace atomically. Renderer animation may illustrate the public trace but cannot create extra connections or affect its result.

An explicit submission wins only when every cell's local recipe is satisfied **and** the current heat trace reaches the mold. Correct global material totals alone are insufficient. Every authored puzzle must have a reachable arrangement in which all local recipes pass but the heat route fails, establishing that the heat direction rule has an independent effect on acceptance.

## Public coordinates and state

Canvas is 960×540. Pointy-top hex radius is 48. For each level, take raw centers `(sqrt(3)*48*(q+r/2),1.5*48*r)`, translate the bounding box of centers to center (320,250), then round each screen x/y to the nearest integer. `board={centerX:320,centerY:250,hexRadius:48,originX,originY}` publishes that translation. Axial adjacency never uses rounded screen coordinates. Spatial focus uses the actual displayed integer x/y. The separate FORGE submit focus is `{id:'forge',kind:'submit',x:790,y:414}`.

- `directions[]`: `{index,label,dq,dr}` in the exact priority order above. Render a visible 1…6 compass rather than an unspecified clockwise rule.
- `materials[]`: `{id,label,glyph,rgb,neighborMaterial,requiredCount,heatTarget}`. IDs are copper, iron, silver; glyphs are Cu, Fe, Ag; rgb is three 8-bit channel integers. The material's neighborMaterial equals its heatTarget in these authored puzzles.
- `cells[]`: `{id,q,r,x,y,role,tileId,material,neighborIds,neighborByDirection,neighborCounts,requiredCount,actualCount,recipeMet,outletCellId,outletDirection}`. IDs are C1…C7. Role is null, `source` or `mold`. neighborByDirection contains six neighbor IDs or nulls in direction order; neighborIds contains those actual neighbors once. neighborCounts maps all three material IDs to integer counts. actualCount is the count of this tile material's required neighborMaterial. outletDirection is 0…5 or null, and outletCellId is the corresponding cell or null; the absorbing mold always has both null.
- `tiles[]`: `{id,material,cellId}`. Unique IDs T1…T7 remain attached to the same material forever. Swapping equal materials is a real physical-ID swap, although it does not change recipe counts or heat routing.
- `sourceCellId`, `moldCellId`, and `materialCounts` are public. Counts never change through a swap or undo.
- `heat={status,delivered,pathCellIds,edges,stopCellId,hops}`. status is delivered, blocked or loop. pathCellIds contains the unique visited sequence beginning at the source; edges are `{fromId,toId,direction}`. A loop includes its actual closing edge without repeating the cell in pathCellIds. stopCellId is the mold, the blocked cell, or the revisited loop cell. hops equals edges.length.
- `matchedCells`, `allRecipesMet`, `goalReady` describe current acceptance requirements; goalReady is allRecipesMet && heat.delivered. A ready layout does not win before explicit submission.
- `forge`, `focusItems[]` and `selectedId` describe actual focus. focusItems is cells-array order followed by forge, each `{id,kind,x,y}`, with kind cell or submit. `cursor` is a copied current focus item. `stage` is select or holding, separate from terminal phase. `heldTileId` and `heldCellId` are null in select stage; picking is only a preview and leaves that tile in its original cell until a real swap commits.
- `history[]` contains copied actual swap records `{aCellId,bCellId,aTileId,bTileId,beforeTileIds,at,tick}`; beforeTileIds is the complete seven-item cells-order assignment before that swap. `historyDepth` is its current length. `totalSwaps`, `undos`, and `cancels` are lifetime counters, with totalSwaps===historyDepth+undos. At most 2,699 swaps can commit before the 90-second deadline because picking and committing require separate action ticks; history has that finite clock-derived bound. No author solution is stored as history.
- `lastSwap` is null or a copied committed swap record. `lastUndo` is null or `{swap,at,tick}` with its own copied swap record. Undo never mutates these earlier records. `lastAction` and `events[]` describe real public actions; events reset each outer step and are capped at 32.
- `submissions`, `mistakes`, `maxMistakes=3`, and `lastSubmission`. The latter is null or `{id,accepted,reason,assignment,matchedCells,allRecipesMet,heatDelivered,heatStatus,at,tick}`; id is the incremented positive integer submissions count, and assignment is an independent list of `{cellId,tileId}` copied from the submitted board. reason is accepted, recipes, heat, or recipes-and-heat. A submission never repairs or rearranges the board.
- `width,height,seed,level` (1…3), `difficulty` (0…2), `levelName`, `phase` (playing/won/lost), `tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining`, `score`, `message`, and `lostReason` (null, mistakes or timeout).

## Controls, exchange and undo

Initially select stage has no held tile, empty history and the first cell selected. Directions navigate the actual displayed focus items, including FORGE. Eligible items lie strictly forward on the chosen screen axis. For displacement dx,dy, let distanceSquared=dx²+dy² and perpendicular be dy for horizontal input or dx for vertical input. Choose the smallest axis-biased cost `distanceSquared+2*perpendicular²`, then distanceSquared, absolute perpendicular displacement, and focusItems array index. This favors a nearby aligned hex over a nearly equidistant diagonal when integer screen rounding would otherwise reverse them. No eligible item leaves focus unchanged; there is no wrap and no rectangular-grid shortcut. All authored focus graphs must be strongly connected.

A on a cell while empty-handed picks its physical tile as a preview. Directions can then select another cell. A on a different cell swaps the two exact tile IDs atomically, records the pre-swap assignment, refreshes every inventory location, local recipe and heat outlet/trace, and returns to select stage focused on the destination cell. No intermediate empty or double-occupied cell is exposed. A on the held tile's own cell cancels without swapping. B while holding also cancels without changing the assignment or undoing any previous swap; both cancellation forms increment cancels and restore focus to the held origin cell.

A on FORGE while holding only explains that the tile must be placed or canceled first. It neither submits nor charges a mistake. Empty-handed A on FORGE explicitly submits. B while empty-handed reverses the latest successful swap from its full copied beforeTileIds assignment, restores exact tile inventory and all derived recipe/heat fields, focuses that swap's origin cell, and increments undos. With no history B is a harmless no-op. Undo does not refund elapsed time, mistakes, submissions, totalSwaps or cancels. Terminal states cannot be undone; shared retry starts a fresh puzzle.

Every fresh rejected FORGE submission increments mistakes, even if the arrangement is unchanged. Third rejection loses. Holding A does not submit repeatedly. Ready layouts can still be inspected or changed before the player chooses to submit; there is no automatic victory after a swap.

## Fixed clock, action priority and score

Each tick first advances the active clock and loses at elapsed≥90 before any action, including a would-be winning submission. Pending B then has priority and discards simultaneous A and navigation on that tick. Otherwise navigation precedes A on the resulting focus. Priority is per fixed tick: a held direction may move on later substeps of a larger-dt call after B. Direction uses the larger absolute axis, horizontal on ties, .25 deadzone, immediate new-direction movement, first repeat after 20 ticks and subsequent repeats every 10. A/B are press-edge actions; zero/subtick dt can cache edges but performs no action before a full tick, and coalesced edges produce one action.

Finite dt is clamped to [0,.25] with a 60 Hz accumulator. Cancellation-owned input or a changed cancelEpoch clears pending buttons/repeat and acts neutral for that sample while clock advances; assignment, current held preview and focus are preserved. First epoch initializes without canceling ordinary input. Shared pause freezes by not calling step. Terminal step calls freeze every field, including history, events, preview and input bookkeeping.

Current score is `matchedCells*40+(heat.delivered?120:0)`; victory adds `1000+floor(remaining)*5`. It is derived only from the current public arrangement, so undo/repeated swapping cannot accumulate points. Formal synthetic adjacency/clock fixtures are distinct from ordinary input demonstrations. Three authored-puzzle statistics and feasibility certificates are recorded in scratch before production implementation is approved.

## Authored public puzzles

Coordinates and initial materials below are in C1…C7 order. Each initial tile Ti occupies Ci; physical IDs remain unique when material labels repeat. The required counts are listed as Cu requiring Fe, Fe requiring Ag, and Ag requiring Cu. None of these public initial arrangements satisfies the complete goal.

| Level | Axial coordinates C1…C7 | Initial materials | Required counts Cu/Fe/Ag | Source → mold |
|---|---|---|---|---|
| 环芯炉阵 | (0,0), (1,0), (0,1), (-1,1), (-1,0), (0,-1), (1,-1) | Fe, Cu, Fe, Fe, Ag, Ag, Ag | 3 / 2 / 1 | C1 → C2 |
| 斜岸合金 | (0,0), (1,0), (2,0), (0,1), (1,1), (2,1), (1,2) | Cu, Fe, Cu, Cu, Fe, Ag, Ag | 1 / 1 / 2 | C1 → C7 |
| 折列传热 | (0,0), (1,0), (0,1), (1,1), (0,2), (1,2), (0,3) | Cu, Cu, Fe, Fe, Ag, Ag, Fe | 2 / 1 / 1 | C7 → C3 |

Authoring exhaustively examines 5,040 unique-ID assignments per puzzle. Distinct material assignments number 140/210/210. Respectively 2/3/6 material assignments satisfy every recipe, but only one per puzzle also delivers heat; the other recipe-correct assignments loop. The initial minimum swap counts to a full goal are 2/3/4, proven by breadth-first exchange search. Example solutions and heat counterexample assignments remain in scratch/tests, never in production state or production tables.
