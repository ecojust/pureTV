# Triangular Tessera / 三角拼域 — public model contract

This contract defines the public geometry, state and rules. The three fixed starting boards below contain no reference action route. Independent planners derive their actions from these public facts. Existing shared runtime is unchanged.

## Exact geometry and physical pieces

There are six equilateral triangular tiles around one common vertex. Global vertices are `V1=(0,0)` and `V2…V7=(1,0),(0,1),(-1,1),(-1,0),(0,-1),(1,-1)` in integer triangular-lattice coordinates `(u,v)`. Canvas is 960×540; projection is `x=324+190*(u+v/2)`, `y=270+190*sqrt(3)*v/2`. `projection={x:324,y:270,unit:190}`. Actual triangle side length on the drawing is190. Vertex coordinates define topology exactly; do not infer shared edges from approximate screen distances.

`T1=[V1,V2,V3]`, `T2=[V1,V3,V4]`, …, `T6=[V1,V7,V2]`. This vertex order is **clockwise on the screen**, whose y coordinate increases downwards. Tile world slot `i=0,1,2` faces the full edge from local vertex `i` to `(i+1)%3`; its triangular sector is `[tileCenter,vertex_i,vertex_(i+1)]`. Tile center is the arithmetic mean of its three projected vertices.

Each tile owns three stable physical sector IDs: `T1S1,T1S2,T1S3`, …, `T6S3`. Each has a fixed color and visible mark1/2/3. The public tile `slotSectorIds` array gives the actual physical sector occupying each world slot. Color is fixed to the physical sector and is never merged or recolored. Mark numbers move with sectors, even between equal-colored slots.

- A rotates clockwise120°: `newSlotSectorIds=[old2,old0,old1]`.
- B mirrors: `newSlotSectorIds=[old0,old2,old1]`. It preserves edge slot0 and reflects across the line through local vertex2 and the midpoint of edge0. This is mirror, not undo, a back face, or a free reset.
- Both operations always change the physical permutation and cost1. If repeated colors make the color pattern look unchanged, the moved sector marks remain visible and the feedback explicitly says the operation still cost1.

Within one tile, every pair of its three distinct slots shares a positive-length centroid-to-vertex radial segment. Equal-colored sectors across such a segment connect. Across tiles, sectors connect only when their world slots face the **same entire geometric edge** and their colors match. A common endpoint or common central vertex alone never connects regions. Boundary edges do not need matching and do not connect to an exterior color. No hidden region or boundary constraint exists.

The actual goal is the conjunction of all six shared-edge color matches and the exact public component count for each of the three colors. All18 physical sectors participate in the component graph, including external-facing sectors. Region counting is independent of sector ID: IDs identify physical membership, while only color and positive-length adjacency determine connectivity.

## Public schema

`PureModel` UMD exports `create(seed=1,difficulty=0)`, `step(state,dt,input)`, `TICK_HZ:60`. Three authored fixed boards are selected by clamped integer difficulty0/1/2. Seed is retained but does not change the puzzle. All state is JSON serializable and public except ordinary underscore-prefixed input bookkeeping; no solver or reference solution is exported.

- `colors[]`, fixed orderR,G,B: `{id,name,rgb:[r,g,b]}`. Final palette: R 珊瑚红 `[203,102,93]`, G 湖绿 `[92,158,135]`, B 靛蓝 `[94,126,182]`.
- `vertices[]`: global orderV1…V7, `{id,u,v,x,y}`.
- `sectors[]`: physical source orderT1S1,T1S2,T1S3,T2S1,…, `{id,tileId,mark:1…3,colorId,slotIndex:0…2}`. `slotIndex` is derived from actual tile placement; all other sector fields are fixed.
- `tiles[]`: T1…T6 order, `{id,vertexIds,vertices,center:{x,y},x,y,slotSectorIds,slotColors,slots,mirrorAxis}`. `vertices` are detached copies of the three global vertex records. `x,y` duplicate center for simple focus/render use. `slotSectorIds` is the authoritative physical arrangement, and `slotColors` is derived. `mirrorAxis={a:{x,y},b:{x,y}}` goes from vertex2 to the midpoint of edge0.
- `tiles[].slots[]`: world index0…2, `{index,edgeId,sectorId,mark,colorId,polygon:[{x,y},{x,y},{x,y}],regionId}`. Polygon order is center, localvertex_i, localvertex_next. It describes actual committed geometry, not a future answer or animation.
- `edges[]`: E1…E12, assigned by first encounter while visiting tiles and slots in public array order, deduplicated by the unordered pair of **global vertex IDs**. `{id,vertexIds,a:{x,y},b:{x,y},incidences:[{tileId,slotIndex}],shared:boolean,colorIds,matched}`. `vertexIds` is in global vertex-array order; incidence order is tile then slot order. Boundary edges have one incidence and `matched:null`; shared edges have exactly two and boolean `matched`. `colorIds` follows incidence order.
- `regions[]`: `{id,colorId,sectorIds,tileIds}`. Each ID is `'region-'+firstMemberSectorId`. First member and member `sectorIds` use sectors-array order; `tileIds` use tiles-array order. Regions are sorted by palette order then first member sector order. Every physical sector belongs to one region, copied into its current world slot's `regionId`.
- `regionCounts` and `targetRegions`: integer objects `{R:n,G:n,B:n}`. `colorRegions[]` follows palette order `{colorId,actual,target,matched}`. `matchedRegionColorCount` counts exact-color target matches, `allRegionsMatched` is their conjunction.
- `sharedEdgeCount:6`, `matchedEdgeCount`, `matchingEdgeIds`, `conflictEdgeIds`, `allEdgesMatched`, `goalReady=allEdgesMatched&&allRegionsMatched`. Edge ID lists use edges-array order and contain shared edges only. Readiness is derived from actual committed placement, never preview.
- `focusItems[]`: T1…T6 order, `{id,kind:'tile',x,y}`; `selectedId` initiallyT1, `cursor` detached current item.
- `previewRotate` and `previewMirror`: `{kind:'rotate'|'mirror',tileId,beforeSectorIds,afterSectorIds,beforeColors,afterColors,colorChanged,cost:1,matchedEdgeCount,regionCounts,allEdgesMatched,allRegionsMatched,willWin,willExhaustMoves}`. These are public exact hypothetical results for the selected tile, with no mutation/reservation. `willWin` means the resulting board meets both targets; it cannot override the earlier deadline. `willExhaustMoves` means this operation would reach the charged limit without meeting both goals.

## Charged budget, input and terminal priority

`movesUsed` is the permanent count of actual A/B operations. `rotationCount+mirrorCount=movesUsed`; `movesRemaining=max(0,moveLimit-movesUsed)`. There is no undo action or refunded history. Every physical rotate/mirror costs1 even when `colorChanged:false`. The selected public board has a limit of6/7/8 operations. The author feasibility analysis gives a shortest solution of4/5/6 operations, leaving two charged operations for a real mirror-twice inspection; independent verification is recorded separately. Initial boards do not already satisfy both goals.

`history[]` contains detached copies of actual operation receipts only, in chronological order: `{id:movesUsed,kind,tileId,beforeSectorIds,afterSectorIds,beforeColors,afterColors,colorChanged,at,tick}`. `historyDepth=history.length=movesUsed`. `lastOperation` is a detached copy of the latest actual operation. `lastAction` and `events` describe real navigation, operations or terminal results; events reset each outer nonterminal step and are capped32. These records are not an undo control and never become a scoring input.

Direction navigation uses the six real tile centers, strict forward half-plane, and minimum `distanceSquared+2*perpendicularSquared`, then distance squared, absolute perpendicular distance, original focus-array index. If no forward candidate exists, focus remains unchanged. Dominant input axis selects the direction, horizontal ties, deadzone.25. New direction moves once immediately, first held repeat after20 fixed ticks, then every10; neutral/direction change resets the delay.

Each fixed tick: advance clock and check deadline first → if B is pending, mirror the currently selected tile and discard coalesced A and navigation for that tick → otherwise navigate if due, then A rotate if pending. A/B do not both charge on the same fixed tick. A may operate on a newly navigated tile; B operates on the pre-navigation tile. A still-held direction may act on later fixed ticks within the same larger outer step after the B tick. Held A or B does not repeat. Common fixed60Hz accumulator, per-call dt cap.25, finite numeric sanitization, zero/subtick pending edges, `cancelEpoch`/`cancelled` dropping pending input and repeat state apply. Cancellation-owned ticks still advance active time but do not change the arrangement or charge operations. The first epoch only establishes a baseline. Shared P/START pause stops model stepping; B remains mirror.

After one operation: commit the physical permutation, charge1, recompute actual edges/regions, then win if both targets match; otherwise lose with `lostReason:'moves'` if the charged limit is reached. Thus the last permitted operation can legitimately win. At90 active seconds, timeout precedes input and any possible win. Terminal state freezes all fields, history, clock, events and selection; retry produces independent arrays with the same fixed board and zero charged moves.

No animated transform is required: committed slots change immediately and marks/receipt show the actual result. This avoids a terminal result freezing halfway through a visual rotation. Feedback distinguishes rotation, mirror, and an equal-color physical exchange that still consumed a move.

Standard fields: `width,height,seed,level:1…3,difficulty:0…2,levelName,phase:'playing'|'won'|'lost',tick,elapsed=tick/60,timeLimit:90,remaining,score,message,lostReason:null|'moves'|'timeout`, plus schema above.

`score = matchedEdgeCount*40 + matchedRegionColorCount*100 + (phase==='won' ? 1000+floor(remaining)*5+movesRemaining*40 : 0)`. Initial score is derived from the public starting state, not assumedzero. There are no points solely for history length, pressing keys, or redoing a physical permutation.

## Bounded public-board feasibility requirements

All three boards use two ABC tiles and four repeated-color AAB/ABB-family tiles, with no monochrome tile. Their physical sector identities are distinct even when colors repeat. The color-only state space is exactly `6^2*3^4=2916` per board; quotienting equal-color physical permutations is sound for goal search because the goal ignores IDs and discarding positive-cost color-self-loops cannot improve a shortest solution. Production still executes and charges those visible physical moves.

The author feasibility analysis reports each board has: a valid goal; a normal reachable all-edges-matched/regions-wrong counterexample; an actual same-color region spanning at least three tiles; and an initial state whose goal cannot be reached using rotations alone or mirrors alone, so both controls are substantively required. The public initial color tables, targets and budgets follow below. Author search statistics are not independent or ordinary-play evidence; subsequent verification reports identify their own actual execution scope. No reference action sequence belongs to the production model or this contract.

### Accepted mathematical limitation

For these six-fan boards, each of four repeated-color tiles contributes two internal color components and each of two three-distinct-color tiles contributes three: 14 in total. The only cycle in tile adjacency traverses all six tiles; a three-distinct-color tile cannot connect its two incident shared-edge sectors into the same color path. Thus all color graphs are forests and `sum(regionCounts)=14-matchedEdgeCount` in every arrangement. Goal totals are8, so correct counts for all colors imply all six shared edges match. The reverse counterexample is mathematically impossible and is not an acceptance requirement. The model still explicitly calculates both predicates. Matching edges alone remains insufficient: all three boards have an ordinary budget-safe state where all edges match but the per-color component distribution is wrong. This is not a claim of bidirectional independence.

## Fixed public boards

On a fresh board, physical sector `TiSj` occupies world slot `j-1` and has the color shown in that slot below. The physical color never changes; later operations permute these IDs. Three-letter strings are world slots0,1,2 in that order.

| Level | Name | T1 | T2 | T3 | T4 | T5 | T6 | Target R/G/B | Move limit | Initial score |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 初片连彩 | BGR | BBR | BGR | RRB | RBB | BGG | 2/2/4 | 6 | 80 |
| 2 | 镜边回域 | BRG | GBR | GGR | RGR | BBR | BGB | 2/3/3 | 7 | 220 |
| 3 | 六角交织 | GBR | GBG | GBB | BGR | RGG | RBR | 3/2/3 | 8 | 220 |

All three levels use the geometry, palette and public array ordering defined above. Retry recreates the same chosen level. Initial scores80/220/220 follow the score formula; no initially solved board is supplied.
