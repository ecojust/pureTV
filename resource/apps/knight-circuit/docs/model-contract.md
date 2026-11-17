# Knight Circuit — public rules and model contract

Written before implementation. Visit every playable chess square exactly once with a knight. This is an **open tour**: returning to the start is neither required nor allowed. The knight starts on an already visited square. All boards and blocked cells are public; no target route, hints solver or randomness is packaged.

| Layout | Grid | Blocked row-major cells | Start | Playable squares |
| --- | --- | --- | --- | ---: |
| moon-court / 月庭起步 | 5×5 | none | A1 / index0 | 25 |
| hollow-court / 中庭留白 | 5×5 | C3 / index12 | E5 / index24 | 24 |
| long-court / 长庭巡游 | 6×5 | none | F1 / index5 | 30 |

Columns A–F run left-to-right; rows1–5 top-to-bottom. Each level starts with three undo tokens.

## Legal actions

Arrows move a selection cursor one grid cell, clamped at the edges. The cursor may cross visited or blocked cells and does not move the knight. A jumps the knight to the cursor only if the destination is playable, unvisited and differs by `(abs(dx),abs(dy))=(1,2)` or `(2,1)`. All eight orientations are valid. The knight jumps over intermediate cells; they are neither visited nor checked as obstacles. Invalid A is free and does not append history.

A valid jump marks the destination visited, appends its index to `path`, updates knight and increases jumps. Path includes the initial square; visit order is path index+1. B requires path.length>1 and an undo token: remove the last path square, unvisit it, move knight and cursor back to the new last square, decrement undoTokens and increment undos. Undo does not remove the initial visit, refund tokens or decrement the cumulative jumps counter. Invalid B is free. No other move budget, deadline, score penalty or redo exists.

After each successful jump/undo, recompute legal destinations and remaining squares. All visited wins first (`phase:won`, `score:100`, reasonempty). Otherwise, if no legal destinations remain, keep playing when path.length>1 and undoTokens>0 so the player can recover with B. If such recovery is unavailable, lose (`phase:lost`, `reason:'dead-end'`, score0). A route with legal jumps remains playable even if the broader puzzle is no longer solvable; there is no hidden solver judging partial paths. A dead end with available undo does not auto-consume a token. Terminal calls are exact no-ops, including undo.

## Pure API and state

Expose only `create(seed,level)`, `step(state,dt,input)`, deeply frozen `config`, through CommonJS or window.PureModel. Config includes defaultSeed756,undoLimit3,maxElapsed86400,maxCounter2147483647 and layouts `{id,name,nameZh,width,height,blocked,start}` above. Seed accepts uint32 else756; level integer0..2 else0. Independent creates detach all mutable arrays from config and each other. No I/O, clock, RNG, test setter or tour search exists in assets. External corrupted states are unsupported; geometry boundary tests using altered states are synthetic.

State fields: schema1,seed,level,phase,reason,score; width,height,blocked detached array; knight,cursor initiallystart; path[start],visited boolean width×height array true only atstart; legalMoves current unvisited destination indices, remaining=width×height−blocked.length−path.length; undoTokens3,jumps0,undos0,lastJumpnull or `{from,to,order}`, terminalReceiptnull or detached `{phase,reason,score,path,knight,remaining,undoTokens,jumps,undos}`. Undo clears lastJump. No separate history is needed: path is the reversible current route. Path never exceeds playable square count; cumulative jumps never exceeds playable count+2 because at most3 undos are available.

Other fields: calls0,blockedActions0 saturating2147483647; elapsed0 saturating86400,elapsedCappedfalse, informational only; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`; lastCommandnone,events[],message. Events reset on each admitted call and contain at most one select/jump/undo/blocked/win/collision event with its call. Event/receipt/config objects never alias mutable path arrays. All values remain finite under supported play.

## Input lifecycle

Only finite numeric0<dt<=.25 is admitted. Invalid dt, pausedtrue and terminal calls are exact no-ops. Read own data descriptors x,y,a,b,cancelEpoch,cancelled,paused only; ignore inherited/accessor fields and pressed flags. Descriptor/classification exceptions discard the entire input to neutral; nonthrowing Proxy traps can execute. Finite numeric axes clamp[-1,1], other values0; booleans require literaltrue; epoch is a nonnegative safe integer.

Direction is none if both magnitudes<=.5, otherwise dominant axis; vertical wins ties. Positive y means down. One command per admitted step: B rise, else A rise, else changed nonneutral direction. Held keys do not repeat and skipped edges never queue. Fresh input requires a neutral sample to arm. First valid epoch establishes baseline; subsequent epoch change or false→true cancelled edge disarms before actions, and that call cannot rearm. Cancelled input suppresses actions. A later noncancelled fully neutral sample rearms. Held values are saved even when suppressed. Physical release quarantine on pause/reconnect belongs to the shared host.

## Evidence

Test-only Warnsdorff-ordered DFS must prove a complete route for each authored board, then ordinary create/step inputs must replay it. Cover all eight jumps, non-knight/revisit/blocked rejection, freely moved cursor, undo token accounting, recoverable and unrecoverable dead ends, all-visited precedence, cancellation and terminal freeze. Keep browser actions, synthetic fixtures and physical-device validation separate. No frame-rate or real-TV claim follows from software-browser recording.
