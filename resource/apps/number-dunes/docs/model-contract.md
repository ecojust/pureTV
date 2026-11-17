# Number Dunes / 沙丘数列 — model contract

Implementation contract approved for game 18. Scope is game 18 only. All rules below are common to three fixed boards; retry restores the same board. No production solver, authored reference route, merge rule, automatic number sort, or hidden placement target exists.

## Board, stable compaction, and actual goal

The board is 4 rows × 4 columns. Cells are `C1`…`C16` in row-major order. A cell is `sand` or a fixed `pillar`. Each stone has one stable physical ID `S1`…`Sn`, one integer `value`, and exactly one sand-cell location. Authored values are distinct `1`…`n`; the rule checks strict numeric inequality rather than relying on distinct IDs, a numeric sum, or a precomputed route. Equal-value fixtures must retain both physical stones and cannot satisfy strict ordering.

There are 16 selectable compaction arrows: each row west/east, each column north/south. Selecting an arrow does not move anything. A press compacts **all** contiguous sand segments of that one line simultaneously from the same pre-action state. Pillars split a line; no stone crosses or enters a pillar. Singleton and empty segments remain valid segments. Read each segment in fixed left-to-right or top-to-bottom order, retain the existing sequence of physical stone IDs, and place that sequence in the first `n` cells for west/north or last `n` cells for east/south. Do not reverse the sequence for east/south. Holes gather on the other end. There is no merge, value-based sorting, pushing another line, or wrapping at an edge.

A successful action changes at least one stone's cell; moving multiple stones still charges exactly one move. An unchanged action is a no-op: it increments the no-op attempt counter, but charges no move and creates no history entry. Repeating the same compaction is idempotent until another action changes that line.

The fixed snake order over all 16 positions is `C1,C2,C3,C4,C8,C7,C6,C5,C9,C10,C11,C12,C16,C15,C14,C13`. To read the actual number sequence, skip every pillar and every currently empty sand cell. The win conditions are both:

1. Every consecutive actual number is strictly increasing, and all physical stones occur exactly once.
2. The set of **all** currently empty sand cells equals the public target-hole set exactly. Pillars are never holes. The target-hole count is `16 - pillarCount - stoneCount`.

These predicates are independently meaningful. Every authored board admits a normal reachable position with correct ordering but wrong holes, and another with exact holes but wrong ordering. There is no additional all-used or unannounced stone-ID placement requirement. A renderer or solver may derive a target arrangement from the public holes and sorted values; the model need not carry that derived arrangement.

## Physical geometry and public arrays

Canvas is 960×540. `grid={cols:4,rows:4,x:180,y:136,cellSize:72}` describes the top-left of the board. A cell center is `(180+(col+.5)*72,136+(row+.5)*72)`. Cell positions describe committed state, never an in-flight collision state.

Array order is fixed unless explicitly stated:

- `cells[]`: row-major `{id,col,row,x,y,kind:'sand'|'pillar',stoneId:null|S#,targetHole:boolean}`. Pillars always have `stoneId:null,targetHole:false`.
- `stones[]`: numeric ID order `{id,value,cellId}`. No inventory bank or duplicated display instance exists.
- `lines[]`: rows 1–4 followed by columns 1–4, `{id:'row1'…'row4'|'column1'…'column4',axis:'row'|'column',index:0…3,cellIds,segments}`. `cellIds` includes pillars in increasing row/column position. `segments` is an array of nonempty sand-cell ID arrays in that same order, with no pillars or duplicates.
- `actions[]`: row 1 W,E, row 2 W,E, … row 4 W,E, then column 1 N,S, … column 4 N,S. Each is `{id,lineId,direction:'W'|'E'|'N'|'S',x,y}`. IDs are `R1W,R1E,…,R4W,R4E,C1N,C1S,…,C4N,C4S`. Row-arrow x is 140 for W / 508 for E, with y at the row center. Column-arrow y is 96 for N / 464 for S, with x at the column center. Arrows are controls, not extra board cells.
- `focusItems[]`: same action order, copied `{id,kind:'compact',x,y}`. `selectedId` initially `R1W`; `cursor` is a detached copy of the current focus item.
- `targetHoleIds`, `holeIds`, `pillarIds`: IDs in cells-array order. Targets are fixed public facts; actual holes change after a commit or undo.
- `snakeOrder`: the full fixed 16-cell order above. `readCellIds`, `readStoneIds`, `readValues`: only currently occupied sand cells in snake order. The three arrays align elementwise.
- `stoneCount`, `pillarCount`, `targetHoleCount`, `orderedPairs`, `orderPairCount=stoneCount-1`, `strictlyIncreasing`, `matchedHoleCount`, `holesCorrect`, `goalReady`. `orderedPairs` counts strict adjacent comparisons that pass; `matchedHoleCount` counts target-hole cells that are actually empty. `holesCorrect` also checks actual hole-set size; `goalReady = strictlyIncreasing && holesCorrect`.
- `preview={actionId,lineId,direction,changed,movedCount,moves,afterAssignments,willWin,willExhaustMoves}` is derived only from the currently selected public compaction. `moves` contains only changed stones in stones-array order, each `{stoneId,fromCellId,toCellId}`. `afterAssignments` contains all occupied `{cellId,stoneId}` pairs in cells-array order. `willExhaustMoves` means this changed action would reach the lifetime limit without winning; it is false for no-ops. `willWin` is true only when a changed hypothetical layout meets both goals; it does not promise that an action can beat the earlier deadline check. Preview reserves and mutates nothing.

All level facts, actual state, and diagnostic fields are public and serializable. Rendering must consume actual values/locations and exact public preview; it must not sort stones to make a demonstration look correct.

## Input, history, and charged budget

UMD `PureModel` exports `create(seed=1,difficulty=0)`, `step(state,dt,input)`, and `TICK_HZ:60`. Difficulty clamps to integer 0–2; seed is retained but does not randomize a board. Standard `phase` is `playing|won|lost`; no extra select/hold stage exists.

Directions navigate the physical 16 arrow foci. Eligible targets have positive forward dot product. Choose minimum `distanceSquared + 2*perpendicularSquared`, then minimum distance squared, absolute perpendicular distance, and original focus-array index. No eligible target leaves the focus unchanged. Direction uses the dominant input axis, horizontal on ties, with deadzone .25. A new direction moves immediately; a held direction repeats after 20 fixed ticks, then every 10 ticks. Release or direction change resets that initial delay. The public 16-focus graph must be strongly connected.

- **A press edge:** attempt the selected whole-line compaction. A held button never repeatedly compacts. Every A attempt increments `compactionAttempts`; changed actions increment `movesUsed` and append one history record, no-ops increment `noOpAttempts` only.
- **B press edge:** pop the last successful compaction and restore its exact full physical ID layout plus its original action focus. It increments `undos` and does **not** refund `movesUsed`, active time, attempts, or any lifetime counters. With empty history it changes no layout/counter. It is not an inverse compaction; compaction is non-injective and requires a snapshot. No-op A does not become an undo entry.
- **P / START:** remains the independent shared pause control. It is not B.

`movesUsed` is the sole lifetime count of successful compactions, even those later undone. `moveLimit` is 6/7/8. `movesRemaining=max(0,moveLimit-movesUsed)`. `historyDepth=history.length=movesUsed-undos`. `compactionAttempts=movesUsed+noOpAttempts`. Undo cannot be used after a terminal loss to reclaim a charged move.

`history[]` entries and `lastCompaction` are detached copies of `{id:movesUsed,actionId,lineId,direction,beforeAssignments,afterAssignments,moves,movedCount,at,tick}`. Assignments contain every occupied cell/stone pair in cells-array order; moves are in stones-array order. `lastUndo={edit:<detached popped record>,at,tick}`. Undo restores the before assignments and action selection; `lastCompaction` remains the most recent lifetime successful action. Current score/reading/holes/preview recompute from the restored layout. Actual arrays/receipts must not share mutable nested history objects.

Each fixed tick: advance time → deadline check → B priority (discard coalesced A and direction for that tick) → navigation → A. A still-held direction may act on later ticks of the same larger outer `step` call after the B tick; B does not suppress an entire outer sample. One A edge is coalesced only once across multiple fixed ticks. A navigation+A combination first selects then compacts the new action.

`input.cancelEpoch` changes and cancellation-owned `input.cancelled` samples discard pending edges/repeat state and produce no action; active clock still advances. They preserve actual board, history, charged moves and focus. The first epoch is only initialization. Zero/sub-tick `dt` may retain a pending edge but cannot move, compact, undo, win or lose before a fixed tick. Nonfinite/negative `dt` contributes zero, each call caps at .25 s. Input numeric components sanitize to finite values. Shared pause does not call `step`.

## Terminal priority, movement presentation, and scoring

On a successful A compaction, commit all segments atomically, charge `movesUsed`, recompute the real conditions, then:

1. If both goal predicates hold, win—even on the last allowed successful move.
2. Otherwise, if `movesUsed >= moveLimit`, lose with `lostReason:'moves'`.
3. Otherwise remain playing.

At `elapsed >= 90`, timeout is checked before any input or success and wins priority, with `lostReason:'timeout'`. No-op A and B do not independently perform a move-limit adjudication. Initial boards are not already solved. All public/private fields, events, selection, clock, history, and animation data freeze after either terminal phase. Retry creates independent arrays/history with the same original puzzle.

Optional read-only movement uses one public `transition={kind:'compact'|'undo',actionId,startedAt,duration:.24,moves}`. The actual board is committed immediately; the transition is only interpolation between actual before/after positions. It does not block or queue input. A later real edit replaces it; a no-op leaves its expiry unchanged. While playing it expires after .24 active seconds. Any terminal result clears it so the final board is visibly settled rather than freezing half a move. No claim of physical collision simulation is made.

State includes `width,height,seed,level:1…3,difficulty:0…2,levelName,phase,tick,elapsed=tick/60,timeLimit:90,remaining,score,message,lostReason:null|'moves'|'timeout`, plus the fields above. `lastAction` records actual input outcomes; `events` resets each outer nonterminal step and is capped at 32. Messages describe settled results (for example “已压实，段内顺序保持不变”), not an enduring “正在移动” state after an animation expires.

`score = orderedPairs*25 + matchedHoleCount*20 + (phase==='won' ? 1000 + floor(remaining)*5 + movesRemaining*50 : 0)`. No-op, undo, or repeated movement creates score independent of the current board. Undo can restore current-layout points but never refunds charged moves. Initial scores are derived, not assumed zero.

For the three public starting boards below, the initial scores are respectively **155, 210, 170**.

## Three public boards and bounded feasibility

In the tables, `#` is a pillar, `.` is an empty sand cell, and integers are actual values. Stone `S#` initially carries the matching integer value and keeps that identity for the round. Target holes below are **all** empty target sand cells. They are not unspecified wildcards.

| Level | Name | Initial rows (top to bottom) | Target holes | Move limit |
|---|---|---|---|---:|
| 1 | 风纹初序 | `. 1 . 2` / `. # 3 .` / `6 5 # .` / `. . . 4` | C1,C3,C4,C5,C7,C9,C10,C15 | 6 |
| 2 | 岩隙回排 | `1 # 2 .` / `. 3 # .` / `4 . 5 6` / `# . . 7` | C3,C5,C8,C11,C15,C16 | 7 |
| 3 | 双向沙阵 | `1 . 2 3` / `# 5 # .` / `. . 4 .` / `8 # 7 6` | C1,C10,C11,C15,C16 | 8 |

The separately retained route-free planning report `public-feasibility.json` contains exact public arrays, derived initial scores, shortest depths and search bounds, target derivation, independent-goal counterexample existence, multi-stone and pillar exercise, and 16-focus reachability. It contains no reference action sequence or author witness arrangement.

Author feasibility uses target snake filling → backward predecessor distributions that provably compact to their successor → separate forward breadth-first shortest-path verification. No compaction is assumed reversible. Search limits are 100,000 visited states per board; observed visited states are only 988 / 3,005 / 4,289, shortest depths 4 / 5 / 6. Stone counts are 6 / 7 / 8. These are proofs for the selected boards and search scenarios, not exhaustive claims about every 4×4 permutation.

Each board has a genuine nonwinning multi-stone trial; trial → B → shortest solution charges 5 / 6 / 7 successful moves and leaves one move. Each board also has an ordinary successful-compaction sequence that reaches its budget without a goal and therefore really loses. Full public layouts are pairwise distinct under square rotations/reflections. Author actions remain scratch-only and must not be copied into the production model or passed to independent QA planners.
