# Rectangle Atlas / 矩形图册 — public model contract

Written before implementation. Shikaku: partition a rectangular grid into nonoverlapping axis-aligned rectangles. Every rectangle must contain EXACTLY ONE public number and have area equal to that number. All cells must be covered. Public numbers are immutable clues. No target rectangles, solution bitmap or planner ships in assets; any full partition meeting the rules is accepted.

## Public puzzles

Indices are row*width+column, zero-based. Seeds use `{cell,area}`.

| Level | ID / English / 中文 | Size | Seed cell:area |
| --- | --- | --- | --- |
| 0 | corner-parcels / CORNER PARCELS / 转角分区 | 4×4 | 0:2,3:2,12:3,14:9 |
| 1 | narrow-pages / NARROW PAGES / 长幅书页 | 5×5 | 2:5,3:5,9:5,11:6,16:4 |
| 2 | grand-atlas / GRAND ATLAS / 大幅图册 | 6×6 | 0:16,4:2,16:2,22:3,23:5,27:8 |

Independent legal-rectangle enumeration plus exact-cover search proves exactly one solution for each. The unique partitions have4/5/6 rectangles, include both1×N thin rectangles (N≥3) and squares larger than1. Only dimensions and these numbers are production data.

## Editing and checking

Four arrows move one cell, clamped at edges without wrap. With no anchor:
- A on an uncovered cell sets the first corner anchor.
- A on a covered cell removes that WHOLE rectangle. This is free editing, not a limited undo.

With an anchor, A chooses the second corner, inclusive. Normalize corners so drawing works in any direction. The same cell twice makes a1×1 rectangle. Any overlap with an existing rectangle is rejected/free, preserving anchor for adjustment. Otherwise place the rectangle and clear anchor. Geometry is accepted even if it contains zero numbers, multiple numbers or the wrong numeric area: those rule errors are deliberately checked on full B submission. Numbers are never modified. Region IDs reuse the lowest unused positive ID, so at most1..36; they are labels, not part of puzzle constraints.

B while an anchor exists CANCELS it freely and does not submit. With no anchor, B on an incomplete grid is blocked `incomplete`, costing no mistake or completed check. Full B increments checks and validates every rectangle. Exactly one clue and matching area for every region, no overlap and full coverage wins `solved`. Otherwise the complete check spends ONE mistake regardless of errors; third wrong submission loses `mistakes`. Identical wrong full layouts may be resubmitted after release. A valid third check with only2 mistakes wins. There is no timer or move budget.

Actual placement/removal clears old lastCheck highlights. Anchoring, cancellation and navigation do not change the drawn partition and preserve lastCheck. Remove/rebuild as often as desired before terminal. Terminal freeze forbids further editing. B beats simultaneous A and direction.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config, CommonJS/window.PureModel. Config defaultSeed788,mistakeLimit3,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,width,height,seeds}`. Seed integer0..4294967295 else788; level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason one of `''`/`solved`/`mistakes`,score100 iff won else0; width,height,seeds detached,cursor0,anchornull,rectangles[],owners flat array0,coveredCount0,rectangleCount0,overlapCells[],candidatenull; placements0,removals0,edits0,checks0,mistakes0,mistakeLimit3,lastChecknull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

Rectangle `{id,left,top,right,bottom,area,cells}` has inclusive integer bounds and sorted flat cells. rectangles sorted by ID. owners[p] is0 if uncovered or the first rectangle ID covering p; overlapCells contains any multiply covered cells. Derived ownership/counts refresh on admitted calls and edits. A candidate from anchor/current cursor exposes `{left,top,right,bottom,area,cells,overlap,seedCount}` for visible geometry feedback only. All IDs/cells are user drawn; no hidden solution data.

lastCheck only records full submissions `{call,complete:true,valid,errors,mistakesAfter}`. Error order: overlap first, then rectangle ID order. Error types:
- overlap `{type,cells}`: multiply covered cells (ordinary placement rejects these immediately; checker still rejects a synthetic corrupted full arrangement).
- missing-number `{type,rect,cells}`.
- multiple-numbers `{type,rect,cells,seeds:[seedCell...]}`.
- wrong-area `{type,rect,cells,seed,expected,actual}`.

All error lists detached and bounded. Coverage failure is the free incomplete-B gate, never a success. Every internal rectangle is valid in-bounds geometry; external state mutation unsupported, synthetic overlap fixtures explicitly labelled. No unbounded history.

Events at most one per call, include call: cursor `{from,to}`, anchor `{cell}`, cancel `{anchor}`, place/remove `{rectangle}`, blocked `{reason:'edge'|'overlap'|'incomplete'}`, check `{errors,mistakes}`, win `{reason}`, collision `{reason}`. Terminal result replaces check. Terminal receipt detached `{cause,level,call,elapsed,rectangles,owners,placements,removals,edits,checks,mistakes,lastCheck,score,phase,reason}`. Terminal exact freeze.

## Input lifecycle

Terminal or invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis>.5 chooses direction; vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before commands and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rise, else A rise, else changed nonneutral direction. Consume suppressed simultaneous edges; held controls never repeat. Lifecycle cancellation preserves the anchor (explicit B is the in-game cancel). Host owns release quarantine. Active elapsed/diagnostics saturate without deadline.

## Verification

Independent unique exact cover from number clues only; three ordinary corner/A/B wins; square/thin rectangles; corner normalization and1×1; removal and ID reuse; geometry overlap rejection, coverage gate, zero/multiple-number and wrong-area full counterexamples; natural3-error losses and corrected third-check wins; candidate feedback, lifecycle and terminal. Solvers and solutions stay in tests only.
