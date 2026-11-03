# Island Ink / 岛海墨图 — public model contract

Written before implementation. Nurikabe on a rectangular grid with only public numbered island seeds (and an optional public givenSea list). Every cell is undecided0, sea1 or island2. Numbered seeds are fixed island cells. Other cells cycle undecided→sea→island→undecided. No complete answer bitmap, answer comparison or solver ships in assets; ANY full coloring satisfying the public rules is accepted.

## Public clues and unique puzzles

Indices are row*width+column, zero-based. givenSea is empty in all three authored levels; no prefilled sea is needed.

| Level | ID / English / 中文 | Size | Seeds `{cell:size}` | Editable cells |
| --- | --- | --- | --- | --- |
| 0 | coastal-notes / COASTAL NOTES / 海岸笔记 | 4×4 | 2:1,5:1,13:4 | 13 |
| 1 | reed-islands / REED ISLANDS / 芦洲分界 | 5×5 | 0:1,7:4,14:4,17:1,20:3 | 20 |
| 2 | open-water / OPEN WATER / 连海群岛 | 6×6 | 1:1,9:2,12:2,20:4,31:1,33:3 | 30 |

Test-only connected-island shape enumeration proves exactly one legal coloring for each public puzzle. Validation below does not depend on uniqueness and does not compare against those test solutions.

## Legal full coloring

1. Every numbered seed remains island, and any explicitly given sea remains sea.
2. Every orthogonally connected island component contains EXACTLY ONE numbered seed.
3. That component's cell count equals its seed number.
4. All sea cells form ONE NONEMPTY orthogonally connected component. Diagonal contact does not connect sea or islands.
5. No2×2 square consists entirely of sea.

Different numbered islands cannot touch orthogonally because that would put two seeds in the same island component; diagonal island contact is permitted. An island component with no seed is invalid even if its size happens to equal another clue. Seed numbers count the seed cell itself.

## Controls and mistakes

Four arrows move one grid cell, clamped at edges without wrap; fixed cells can be focused. A on an editable cell cycles0→1→2→0. A on a fixed seed/givenSea blocks freely. Editing never spends mistakes. B submits only when ALL cells are decided1/2. An incomplete B is blocked/free, spending neither a mistake nor a completed check. A full B increments checks and evaluates all rules. Valid full coloring wins `solved`, only on B. Invalid full coloring spends exactly ONE mistake regardless of error count; third wrong submission loses `mistakes`. An identical wrong complete grid may be submitted again after release and costs another mistake. A later valid third check with only2 mistakes still wins.

An actual edit clears lastCheck so old highlights do not misrepresent a revised board. No timer, move budget or undo. B beats simultaneous A and direction. Held actions are edge-triggered.

## Public API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config, CommonJS/window.PureModel. Config defaultSeed784,mistakeLimit3,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,width,height,seeds:[{cell,size}],givenSea:[]}`. Valid seed integer0..4294967295 else784; valid level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason '',solved,mistakes,score100 iff won else0; width,height,seeds,givenSea detached; fixedValues object maps fixed indices to1/2; cells flat array of0/1/2,cursor first editable cell (or0),filledCount,seaCount,islandCellCount,targetIslandCells(sum of public numbers),editableCount; edits0,checks0,mistakes0,mistakeLimit3,lastChecknull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

lastCheck only records complete submissions: `{call,complete:true,valid,errors,mistakesAfter}`. Every error has `{type,cells}` plus fields described below. Deterministic order: fixed-cell errors ascending index, then island components by smallest index, then sea connectivity, then2×2 sea squares row-major.

- fixed-cell: `{cell,expected,actual}` and singleton cells. Normal inputs cannot violate fixed cells, but validation still rejects them.
- unseeded-island: component cells, no seed.
- merged-islands: component cells and `seeds:[seedCell...]`.
- island-size: component cells and `{seed,expected,actual}`.
- missing-sea: `cells:[]` when no sea exists.
- split-sea: all sea cells and `{components}`.
- sea-square: four square cells ordered row-major.

All error cell lists are sorted, detached and bounded by the grid. No unbounded history. Derived counts refresh on admitted calls and edits. External state mutation unsupported; rule counterexamples using it are explicitly synthetic.

Events at most one per call, include call: cursor `{from,to}`, edit `{cell,from,to}`, blocked `{reason:'edge'|'fixed'|'incomplete'}`, check `{errors,mistakes}`, win `{reason}`, collision `{reason}`. Terminal result replaces check event. Terminal receipt detached `{cause,level,call,elapsed,cells,edits,checks,mistakes,lastCheck,score,phase,reason}`. Terminal freezes exactly.

## Input lifecycle

Terminal or invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis>.5 chooses direction; vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch change or false→true cancelled edge disarm before actions and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rise, else A rise, else changed nonneutral direction. Consume suppressed simultaneous edges; held controls never repeat. Host owns release quarantine. Active elapsed/counters saturate but no deadline.

## Verification

Independent unique-solution proof from seeds only; three normal arrow/A/B wins with≥10 editable cells; every rule's counterexamples, exact seed-cell area counting, orthogonal versus diagonal connectivity, fixed cells, cycle/clear, incomplete free, no automatic win, natural3-error loss, revised third-check win, lifecycle and terminal. Test-only solutions/planners never enter production assets.
