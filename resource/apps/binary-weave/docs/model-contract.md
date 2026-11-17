# Binary Weave / 二元织格 — public model contract

Written before implementation. Takuzu with public 0/1 givens only. Fill every remaining cell so each row and column contains exactly half zeros and half ones; no horizontal/vertical consecutive three equal values; no two complete rows are identical and no two complete columns are identical. Only row-to-row and column-to-column equality matters: a row may equal a column. There is no wraparound or diagonal constraint. Any valid completed grid is accepted. No completed answer bitmap, solver or solution route ships in assets.

## Public puzzles

Indices are row*width+column, zero based; width=height, all even. Givens `{cell,value}` are fixed.

| Level | ID / English / 中文 | Size | Public givens cell:value |
| --- | --- | --- | --- |
| 0 | first-threads / FIRST THREADS / 初织经纬 | 4×4 | 0:0,2:0,6:1,7:0,12:1,14:1 |
| 1 | cross-stitch / CROSS STITCH / 交织纹样 | 6×6 | 0:1,1:0,2:1,8:0,11:1,15:1,17:1,18:1,20:1,22:0,26:1,29:1,35:0 |
| 2 | grand-weave / GRAND WEAVE / 八方锦织 | 8×8 | 0:1,3:1,6:0,7:1,17:0,18:1,19:0,22:1,25:0,26:0,29:0,31:1,33:1,34:1,36:1,37:0,38:1,39:0,40:1,48:0,50:0,53:0,55:1,58:0,60:0,62:1 |

Editable cells10/23/38 respectively. Test-only legal-row-pattern enumeration with column constraints proves exactly one solution each. Givens never include a fully filled row or column at start.

## Editing and submission

Arrows move one cell, clamped at edges without wrap. A cycles an editable cell `-1 unset → 0 → 1 → -1`; A on a given is blocked `fixed`, free. Editing is unlimited and never spends a mistake. An actual edit increments edits and clears stale lastCheck highlights. Cursor movement and blocked commands preserve lastCheck.

B with any unset cell is blocked `incomplete` and does not increment checks or mistakes. Full B increments checks and validates every rule. A valid full grid wins `solved`, score100, even after two previous mistakes. An invalid full grid spends exactly one mistake regardless of error count. The third invalid full submission loses `mistakes`; identical layouts may be resubmitted after release. No auto-win while editing, timer or move cap. B beats simultaneous A/direction. Terminal state is frozen.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply frozen config via CommonJS/window.PureModel. Config defaultSeed790,mistakeLimit3,maxElapsed86400,maxCounter2147483647; layouts `{id,name,nameZh,width,height,givens}`. Seed integer0..4294967295 else790; level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason `''`/`solved`/`mistakes`,score0 unless won100; width,height,givens detached,fixedValues map cell→0/1,cells flat values-1/0/1,cursor0,editableCount,filledCount,zeros,ones,rowStatus,columnStatus,edits0,checks0,mistakes0,mistakeLimit3,lastChecknull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

Line status `{index,filled,zeros,ones,complete,balanced,triples,duplicateWith,matched}`. `triples` contains every start offset of a consecutive equal length3 window, including overlapping windows within a longer run. `duplicateWith` contains ascending OTHER line indices whose complete pattern is identical; no incomplete line can duplicate. `balanced` means exact half0/half1. `matched` means complete, balanced, no triples and no duplicates. Derived counts/statuses recompute after edits and on admitted active calls, entirely from the visible cells. They contain no answer hints. Row and column status families are separate.

lastCheck exists only for full submissions: `{call,complete:true,valid,errors,mistakesAfter}`. Errors in deterministic order:
1. Fixed clue violations in given order `{type:'fixed-clue',cell,cells:[cell],expected,actual}`; ordinary editing cannot cause these, defensive validation only.
2. For each row in ascending index, balance first if needed `{type:'row-balance',row,cells,zeros,ones,expected}` (expected is width/2), then each triple start ascending `{type:'row-triple',row,start,cells:[three],value}`.
3. Each duplicate complete row pair a<b ascending `{type:'duplicate-rows',rows:[a,b],cells:[all a then all b]}`.
4. For each column, analogous `column-balance` with `column`, `column-triple` with `column,start,cells,value`.
5. Duplicate complete column pairs a<b ascending `{type:'duplicate-columns',columns:[a,b],cells:[all a then all b]}`.

Errors detached and bounded. No diagonal, cross-family equality or last-to-first triple checks. Coverage failure is the free incomplete gate. State mutation from outside unsupported; any counterexample fixture that replaces givens/cells is labelled synthetic rather than claimed ordinary gameplay.

Events at most one per call, all include call: cursor `{from,to}`, edit `{cell,from,to}`, blocked `{reason:'edge'|'fixed'|'incomplete'}`, check `{errors,mistakes}`, win/collision `{reason}`. Terminal event replaces check. Detached terminalReceipt `{cause,level,call,elapsed,cells,edits,checks,mistakes,lastCheck,score,phase,reason}`.

## Input lifecycle

Terminal or invalid dt (not finite numeric `(0,.25]`) exact no-op before input reads. Atomically read own data descriptors x/y/a/b/cancelEpoch/cancelled/paused, ignore getters/inherited keys; invalid objects/arrays/descriptor exceptions become neutral. Only literaltrue flags. Finite axes clamp[-1,1]; dominant magnitude>.5 selects direction, vertical on ties. Epoch nonnegative safe integer elseignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline; later changes or false→true cancelled edge disarm before commands and cannot rearm on that call. Cancelled input never commands; subsequent noncancelled full-neutral rearms. Require armed-at-start and act on B rise, else A rise, else changed nonneutral direction; consume suppressed simultaneous edges. Held controls do not repeat. Cancellation preserves ink. Host owns release quarantine. Active elapsed/diagnostics saturate with no deadline.

## Verification boundary

Test-only row-pattern/column solver uniqueness and three ordinary arrows/A/B wins; separate balance/triple/uniqueness row+column counterexamples; fixed protection, no wrap/diagonal/cross-family extra rule; A cycle, incomplete free, natural three-error losses, corrected third-check wins, input cancellation/pause/priority/freeze. Production contains clues and rule evaluation only. Browser and physical-device evidence remain separate.
