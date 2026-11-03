# 数字汇聚 / Merge Tiles — public model contract

Written before implementation. On a4×4 board, slide every tile in one direction. Equal adjacent values combine once per move; a newly formed tile cannot combine again in that same move. Thus `[2,2,2,2]` left becomes `[4,4,0,0]`, not8. Slide traversal starts at the moving edge, preserving order. The aim is to form the target tile within a finite number of changed moves.

## Authored starts

Rows are separated by `/`; zero is an empty cell.

| Level | ID / name / 中文 | Starting rows | Target | Move limit |
| --- | --- | --- | ---: | ---: |
| 0 | amber32 / AMBER 32 / 琥珀初聚 | 2,0,0,2 / 0,0,0,0 / 0,0,0,0 / 2,0,0,2 | 32 | 30 |
| 1 | jade64 / JADE 64 / 青玉汇合 | 8,0,4,0 / 0,2,0,8 / 4,0,2,0 / 0,8,0,4 | 64 | 40 |
| 2 | cobalt128 / COBALT 128 / 钴蓝高阶 | 32,0,4,0 / 0,8,0,32 / 4,0,8,0 / 0,16,0,0 | 128 | 55 |

These starts total target−24. The first9 spawned tiles total22, so no normal route can form the target before its11th valid changed move. Tests separately prove actual routes within each allowance; this mass bound is not a claim of exact optimality.

## Spawn, resources and settlement

Directions slide and merge. No change means blocked/free: no move spent, no history, no points and no spawn. Every actual changed slide records its prior board, increments movesUsed, adds each newly merged value to points, and updates lastMerges. If it formed target or greater, immediately win BEFORE spawn or checking resource exhaustion. Otherwise collect empty cells in ascending flat-index order. Value is spawnValues[spawnIndex%8], where public spawnValues=`[2,2,4,2,2,2,4,2]`. Empty rank is `(normalizedSeed + spawnIndex*7) % emptyCount`. Spawn there, record lastSpawn, then increment spawnIndex. The order is deterministic and public. nextSpawnValue describes the value for the NEXT changed slide; its cell depends on the post-slide empties, so the interface does not promise a fixed future cell.

After a nonwinning spawn, lose with reason `stuck` if no directional slide could change the board. Otherwise lose with reason `moves` if movesUsed reached the allowance. Thus a final allowed winning merge succeeds. Deadlock takes precedence if both loss conditions hold. No overall time deadline.

A spends one of2 undo tickets to restore the most recent changed slide's prior cells, spawnIndex, points, lastSpawn and lastMerges. It NEVER refunds movesUsed. Pop the history entry, decrement tickets, increment undos and recompute nextSpawnValue. Empty history or no tickets is blocked/free. B has no action. Terminal states cannot be undone. Because undo restores spawnIndex, replaying the same slide gives the same value and empty-rank spawn. History is bounded by moveLimit because only changed slides add entries.

## Public API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config, through CommonJS or window.PureModel. Config width4,height4,defaultSeed766,spawnValues,spawnStride7,undoTickets2,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,cells,target,moveLimit}`. Seed integer0..4294967295 or766; level integer0..2 or0. No solver or solution route in assets.

State schema1,seed,level,phase playing/won/lost,reason ''/stuck/moves,score0 or100 iff won; cells detached, target,moveLimit,movesUsed0,points0,spawnIndex0,nextSpawnValue2,undoTickets2,undos0,history[],lastSpawn null,lastMerges[]; elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. History entries detached `{cells,spawnIndex,points,lastSpawn,lastMerges}`. Rules use immutable target/limit. External state corruption unsupported; synthetic tests explicitly labelled.

Events at most one per admitted call, include call: slide `{direction,mergePoints,movesUsed,spawn}`, undo `{movesUsed,tickets}`, blocked `{reason:'no-change'|'no-history'|'no-tickets'}`, win `{direction,mergePoints,movesUsed}`, collision `{reason:'stuck'|'moves'}`. LastSpawn `{index,value}` ornull; lastMerges `{index,value}` array at most8. Terminal receipt detached `{cause,level,call,elapsed,cells,movesUsed,points,spawnIndex,lastSpawn,undoTickets,score,phase,reason}`. Final win retains newly merged board without a spawn and sets lastSpawn null. Terminal step exact no-op.

## Inputs

Terminal and invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize own DATA descriptors x/y/a/b/cancelEpoch/cancelled/paused, ignoring getters and inherited data. Invalid objects/arrays/descriptor errors become neutral. Literaltrue booleans; finite axes clamp[-1,1]; epoch nonnegative safe integer or ignored. Pausedtrue exact no-op. Dominant axis above0.5 chooses direction, vertical wins ties.

Initial neutral arms. First valid epoch establishes baseline; later epoch changes or false→true cancelled edge disarm before actions and cannot rearm that call. Cancelled samples never command. Later noncancelled full-neutral rearms. Require armed-at-start: rising A else changed nonneutral direction. B unused but participates in neutral release. Consume all held edges even when suppressed; no repeats or queued extras. Host owns disconnected-device quarantine. Calls/blockedActions/elapsed saturate at config bounds; elapsedCapped sticky on overflow; no-event calls preserve message.

Verify all three ordinary wins from public rules, merge order/one-merge-per-tile, pre-spawn sum conservation plus exact public spawn, no-op, undo/restored spawn without refunds, last-budget win, budget loss and deadlock, config/state isolation, cancellation/held/paused/invalid/terminal behavior. Independent solver remains tests-only and browser uses snapshots plus ordinary keys.
