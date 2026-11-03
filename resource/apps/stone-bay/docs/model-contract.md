# 石箱归位 / Stone Bay — public model contract

Written before implementation. A worker walks through a walled courtyard and pushes stone crates onto sockets. Crates cannot be pulled, moved diagonally or pushed in chains. Every crate must occupy a distinct target; any crate fits any target. All terrain is visible; there is no time deadline or hidden target arrangement.

## Public courtyards

Rows use `#` wall, space floor, `.` target, `$` crate, `@` worker. Coordinates are row-major, zero-based positions. Each border is closed. Every row has the same width. Initial crates are not on goals.

| Level | ID / English / 中文 | Rows, top to bottom | Push limit |
| --- | --- | --- | ---: |
| 0 | twin-gate / TWIN GATE / 双石门庭 | `#######`, `#..   #`, `# $$  #`, `#  #  #`, `# @   #`, `#######` | 8 |
| 1 | pillar-court / PILLAR COURT / 柱影庭院 | `########`, `#  .   #`, `#  #.  #`, `# $$ $ #`, `# .#   #`, `#   @  #`, `########` | 11 |
| 2 | winding-yard / WINDING YARD / 曲径石场 | `########`, `#  . . #`, `# #    #`, `# $$$  #`, `#   #. #`, `# @    #`, `########` | 13 |

Directions move one cell. If the destination contains a crate, move it one further cell only if that cell is floor and contains no crate. Walking is free. A successful push spends one push. Wall/chain/blocked pushes are free. Immediately after a push, all targets occupied wins, including the final allowed push. Otherwise reaching the push allowance immediately loses with reason `pushes`; no post-loss undo is possible. Dead corners are not automatically adjudicated: the player can undo or retry.

A undoes the latest successful walk or push, restoring worker position, crates and facing, but NEVER refunds pushCount or steps. This permits correcting routes while preserving resource cost. Empty-history undo is blocked/free. B has no action. History keeps the most recent128 successful walk/push states; on overflow the oldest is dropped and historyDropped increments. Undo consumes history. Selection/menu/retry belong to host.

## Model interface and state

Expose only `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config`, through CommonJS or `window.PureModel`. No solution paths or solver in assets. Config: defaultSeed752, historyLimit128, maxElapsed86400, maxCounter2147483647, layouts. Each layout has `{id,name,nameZh,rows,width,height,walls,targets,crates,player,pushLimit}`; walls is a flat boolean array, targets/crates arrays of flat positions, crate initial row-order establishes visual ID. Seed integer0..4294967295 or752; level integer0..2 or0. Seed is recorded, not used for randomness.

State: schema1,seed,level,phase playing/won/lost,reason ''/pushes,score0 or100 iff won; width,height,walls,targets,crates,player,pushLimit copied from layout; facing'down'; matched count, pushCount0,steps0,undos0,historyDropped0,history[]; elapsed0,elapsedCappedfalse,calls0,blockedActions0; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message. Crates preserve their identities/array order during movement. History entries are detached `{player,crates,facing}`. Matched is recomputed after pushes and undos. Terrain, targets, dimensions and push budget judgments use immutable config; external state mutation is unsupported and synthetic tests must be labelled.

Events are at most one per admitted call and include call: walk `{from,to}`, push `{from,to,crateFrom,crateTo,pushCount,matched}`, undo `{player,pushCount}`, blocked `{reason:'wall'|'crate-wall'|'crate-chain'|'no-history'}`, win `{pushCount,matched}`, collision `{reason:'pushes'}`. Over-budget final loss replaces push event. Successful walking changes facing; blocked motion changes neither position nor facing. Undo restores prior facing. Terminal receipt is detached `{cause,level,call,elapsed,player,crates,facing,matched,pushCount,steps,undos,score,phase,reason}`. Terminal steps are exact no-op.

## Input and clocks

Terminal calls and invalid dt (not finite JS number in `(0,.25]`) return exact no-op before reading input. Normalize only own DATA descriptors x/y/a/b/cancelEpoch/cancelled/paused in one try/catch; don't call getters or inherit keys. Arrays/nonobjects/descriptor exceptions normalize to complete neutral. Literaltrue booleans; numeric finite axes clamp[-1,1]; epochs nonnegative safe integers or ignored. Normalized pausedtrue is exact no-op. Dominant axis above0.5 chooses direction; vertical wins ties.

Initial neutral arms input. First valid epoch establishes baseline. Later epoch changes or a false→true cancelled edge disarm before commands; that same call cannot rearm. Cancelled samples always suppress commands. A subsequent noncancelled full-neutral sample rearms. Commands need armed status at call start: rising A, else changed nonneutral direction. B never commands but participates in neutral release. Save all held data even when suppressed; no queued simultaneous commands or held repeat. Missing device quarantine belongs to host, since malformed input may normalize to neutral.

Admitted calls reset events/lastCommand, saturate calls and elapsed at config limits, and set elapsedCapped on time overflow. Informational counters steps/undos/historyDropped/blockedActions saturate. No-event calls preserve message; time never settles the game. Fresh retry is create.

Verification: independent ordinary solutions for all maps, crate conservation and nonoverlap, no pulling/chains/diagonals/wall entry; exact final push success versus budget exhaustion; undo walk/push without refund; bounded history; A priority/no repeat/cancellation/invalid input/terminal freeze; separate synthetic fixtures from ordinary traces. Browser tests and recordings use normal keyboard events and read-only snapshots, never model writes or forced victories.
