# Sum Crossings / 交叉数和 — public model contract

Written before implementation. Kakuro on an irregular black/white grid. Each white cell belongs to exactly one horizontal across run and one vertical down run. Every run has length2..4, requires digits1..9 with NO repeated digit within that run, and its digits must sum to the published clue. Equal digits in unrelated runs are allowed. This is a crossing sum puzzle, not Latin-square row/column uniqueness over the entire board.

## Public authored puzzles

Mask strings use # black and . white; indices are row*width+column, zero-based. Runs are enumerated all across starts in row-major order, then all down starts in row-major order. A run's clueCell is the immediately preceding black cell (left for across, above for down). Every run is contiguous and includes no black cell. Config explicitly publishes each run's cell indices, direction and sum. No complete solution bitmap or answer array exists in production assets.

| Level | ID / English / 中文 | Mask rows | Across sums | Down sums | Fixed cells |
| --- | --- | --- | --- | --- | --- |
| 0 | corner-sums / CORNER SUMS / 转角数和 | #### / #... / #... / #..# | 23,16,4 | 11,19,13 | none |
| 1 | linked-ledger / LINKED LEDGER / 交织账页 | ##### / ##... / #.... / #.... / #..## | 12,25,21,8 | 29,8,21,8 | index18=2 |
| 2 | stepped-cross / STEPPED CROSS / 阶梯交叉 | ###### / #..### / #....# / ##.... / ##.... / ###..# | 10,25,28,26,7 | 14,27,29,16,10 | index16=1 |

Sizes4×4/5×5/6×6 contain8/13/16 white cells. Separate test-only sum-permutation propagation/branch search proves exactly one solution for each. Only clues, masks and0/1/1 fixed cells are shipped; normal browser input solves from visible data.

## Controls and submission

Arrow keys find the next white cell along the SAME row or column, skipping black cells, without wrapping. At a boundary the cursor stays put. Fixed white cells can be focused. A on an editable white cycles0(blank)→1→2→...→9→0. A on a fixed cell is blocked/free. Editing never spends mistakes, even when a run temporarily has duplicates or a wrong sum. Public runStatus gives complete/actualSum/duplicate/matched for visible-rule feedback; this contains no answer information.

B submits. If ANY white remains blank, it is blocked `incomplete`, with no mistake and no completed check spent. A full board increments checks once and checks every run's uniqueness and exact sum. All valid wins `solved`, only on B (no auto-win during editing). Otherwise consume ONE mistake for the complete submission, regardless of how many runs fail; at3 mistakes lose `mistakes`. An identical wrong full board submitted again after release costs another mistake. There is no timer or other resource. A subsequent successful edit clears lastCheck so old error highlights cannot misrepresent new entries.

B beats simultaneous A/direction. All held actions are edge-triggered and do not repeat. Same-row/column digits in different separated runs have no relation; only the explicit run lists constrain them.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config, exported CommonJS/window.PureModel. Config defaultSeed782,mistakeLimit3,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,width,height,mask,runs,givens}`. Run `{id,direction:'across'|'down',clueCell,cells,sum}`. Givens object maps flat cell keys to public fixed digits. Valid seed integer0..4294967295 else782; valid level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason '',solved,mistakes,score100 iff won else0; width,height,mask,runs,givens detached; whiteCells sorted flat indices,cells flat(-1 black/0 blank/1..9 digit),cursor first editable white (or first white),filledCount,givensCount,editableCount,runStatus[]; edits0,checks0,mistakes0,mistakeLimit3,lastChecknull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

runStatus per run `{id,complete,actualSum,duplicate,matched}` uses only nonzero entries for duplicate detection, complete iff all run cells are1..9, matched iff complete+distinct+sum. Derived fields refresh after editing and on admitted calls. lastCheck only records full submissions: `{call,complete:true,valid,errors:[{run,duplicate,actualSum,expectedSum}],mistakesAfter}`. Every object/array detached. No unrestricted history. External state mutation unsupported; focused rule fixtures explicitly synthetic.

Events at most one per call, include call: cursor `{from,to}`, edit `{cell,from,to}`, blocked `{reason:'edge'|'fixed'|'incomplete'}`, check `{errors,mistakes}`, win `{reason}`, collision `{reason}`. Terminal result replaces the check event. Terminal receipt detached `{cause,level,call,elapsed,cells,edits,checks,mistakes,lastCheck,score,phase,reason}`. Terminal exact freeze.

## Input lifecycle

Terminal or invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis>.5 chooses direction, vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before commands and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rise, else A rise, else changed nonneutral direction. Suppressed simultaneous edges consumed, no held repeat. Host owns device-release quarantine. Active elapsed and diagnostics saturate, with no deadline.

## Verification

Independent uniqueness proof from clues/givens; three ordinary-input solves and explicit B wins; black and fixed cell protection, navigation skips/no-wrap, cycle/clear, run duplicate and exact sums, full wrong checks one mistake each, incomplete free, natural3-error loss, valid fill without B remains playing, successful third allowed check, descriptor/cancel/held/paused/terminal. No answer board in assets or browser pilot imports from production solver (there is none).
