# 像素线索 / Pixel Clues — public model contract

Written before implementation. Fill a square grid so that each row and column has exactly the listed runs of consecutive filled cells, in order. Different runs require at least one unfilled cell between them. Crosses are optional notes on unfilled cells and never count as filled. Any pattern satisfying all public clues is accepted; the game contains no hidden solution bitmap.

## Fixed public clue sheets

| Level | ID / name / 中文 | Size | Row clues | Column clues | Active seconds |
| --- | --- | ---: | --- | --- | ---: |
| 0 | arrowhead / ARROWHEAD / 箭羽 | 5 | [1],[3],[5],[1],[1] | [1],[2],[5],[2],[1] | 60 |
| 1 | twin-wings / TWIN WINGS / 双翼 | 6 | [2,2],[2,2],[6],[4],[2],[2] | [3],[4],[4],[4],[4],[3] | 90 |
| 2 | gatehouse / GATEHOUSE / 门楼 | 7 | [3],[5],[2,2],[7],[2,1,2],[2,1,2],[7] | [5],[6],[2,1,1],[2,4],[2,1,1],[6],[5] | 120 |

All cells begin blank; cursor starts top-left. Directions move one cell and clamp at edges without wrapping. A toggles filled→blank and blank/cross→filled. B toggles cross→blank and blank/filled→cross. A/B always change a cell; filling or removing a mark costs no resource other than active time. Matching row/column clues turn grey; all matches immediately win. Marked white cells need not all be crossed.

## Clock boundary

Every admitted nonpaused dt advances active elapsed time, including neutral and cancelled samples. Input is sampled at the END of dt. If the endpoint is at or before the deadline, its command may run; after marks, matching all clues wins before timeout adjudication. Thus an exactly-on-deadline correct mark wins. If dt overshoots the deadline, no command may run, elapsed is capped at timeLimit and the game loses immediately with reason `timeout`. At the exact deadline a nonwinning/no command also loses. No rounding or epsilon permits late input. Invalid dt and paused samples consume no time.

## Public model and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, exposed through CommonJS or window.PureModel. Config defaultSeed758,maxCounter2147483647, layouts `{id,name,nameZh,size,rowClues,colClues,timeLimit}`. No solution cells or solver in assets. Seed integer0..4294967295 or758; level integer0..2 or0. Puzzles fixed; seed is recorded only.

State: schema1,seed,level,phase playing/won/lost,reason ''/timeout,score0 or100 iff won; size,rowClues,colClues,timeLimit detached/display copies; cells flat row-major 0blank/1filled/2cross; cursor0; rowRuns/colRuns derived integer arrays; rowMatched/colMatched booleans; filledCount0; elapsed0,remaining=timeLimit; calls0,marks0,cursorMoves0,blockedActions0,lastMark null; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. Derive runs at create and after every mark, and judge against immutable config clues. Externally mutated state is unsupported; fixture mutation must be labelled synthetic.

Events at most one per admitted call, always include call: move `{from,to}`, mark `{index,from,to}`, blocked `{reason:'edge'}`, win `{index,from,to}`, collision `{reason:'timeout'}`. A winning mark records lastMark and marks counter normally; timeout replaces any nonwinning move/mark event. lastMark is a detached `{index,from,to,call}` of latest mark. No unbounded history. Terminal receipt detached `{cause,level,call,elapsed,remaining,cells,cursor,rowRuns,colRuns,filledCount,marks,score,phase,reason}`. Terminal steps exact no-op.

## Input lifecycle

Terminal calls and invalid dt (not finite JS number in `(0,.25]`) are exact no-op before input access. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused, ignoring getters and inherited keys. Arrays/nonobjects/descriptor exceptions become neutral. Only literaltrue booleans; finite numeric axes clamp[-1,1]; epoch nonnegative safe integer or ignored. Pausedtrue exact no-op. Dominant axis above0.5 chooses direction, vertical wins ties.

Initial full-neutral arms input. First valid epoch sets baseline. Later epoch changes or false→true cancelled edge disarm before eligibility and cannot rearm in that call. Cancelled samples never command; a later noncancelled fully neutral sample rearms. Command needs armed-at-start, and a timely endpoint: B rise, else A rise, else changed nonneutral direction. Other new edges are consumed; held inputs never repeat. Save all held input even when suppressed. Host owns disconnected-device quarantine; malformed input can be neutral. Calls/marks/cursorMoves/blockedActions saturate at maxCounter. No-event calls preserve message.

Tests must independently solve public clues and establish uniqueness separately, replay ordinary three wins, verify true run grouping and row/column agreement rather than filled count, edge boundaries, marks semantics, neutral timeout, exact deadline win versus late-input rejection, pause/cancel/time behavior, immutable config/detached state and terminal freeze. Browser scripts use read-only snapshots and normal keyboard events only.
