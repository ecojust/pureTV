# Sliding Order — public rules and model contract

Normative specification before implementation. A classic 3×3 sliding-tile puzzle has eight individually numbered ceramic tiles and one empty cell. The goal is `[1,2,3,4,5,6,7,8,0]`, read left-to-right then top-to-bottom; 0 means empty. All three fixed starts are solvable, not already solved, and fully visible.

| Layout | Initial row-major board | Slide allowance |
| --- | --- | ---: |
| morning-grid / 晨光棋格 | `[2,3,5,1,0,4,7,8,6]` | 14 |
| afternoon-grid / 午后排布 | `[2,5,4,1,3,6,7,8,0]` | 18 |
| evening-grid / 暮色归序 | `[0,6,8,1,2,5,4,3,7]` | 24 |

A breadth-first test-only proof gives shortest distances 8, 12 and 18. No solution path or search routine is packaged in game assets.

## Actions and settlement

Directions move the **empty cell** one square in that direction, exchanging it with the adjacent numbered tile. For example, Right moves the empty space right and its right-hand tile left. Board edges block movement without consuming budget. A valid slide pushes a detached pre-slide board/blank snapshot onto history and increases movesUsed and slides by one. If the resulting board equals the goal, the round wins immediately, including on the last allowed slide. Otherwise, reaching movesUsed==moveLimit loses. There is no state with playing and movesUsed>=moveLimit.

A undoes the most recent retained slide by restoring and removing its history entry. Undo does not consume another move, **does not refund movesUsed**, and increments undos. Undo with empty history is blocked. There is no redo; a new slide after undo stores the actual current board. Because the total number of valid slides is bounded by moveLimit, history and undos are bounded too. B has no gameplay action. Terminal rounds cannot undo or change in any way; retry is a new create supplied by the host. No countdown or randomness influences the result.

## API and data

Expose exactly `create(seed,level)`, `step(state,dt,input)` and deeply frozen `config`, through CommonJS or `window.PureModel`. `config` has defaultSeed754,size3,goal,maxElapsed86400,maxCounter2147483647 and layouts `{id,name,nameZh,board,moveLimit}` above. Valid seed is uint32, otherwise754; valid level integer0..2, otherwise0. Each create owns its board/history; no alias with config or another round exists. No solver, fixture setter, answer list or global mutable state is public. External malformed states are unsupported; tests that deliberately alter state are explicitly synthetic.

State: schema1,seed,level,phaseplaying/won/lost,reasonempty/moves,score100 iff won; board flat9,blank equal board.indexOf(0),movesUsed0,moveLimit,slides0,undos0,matched (number of numbered tiles in goal cells,0..8), history[] of `{board,blank}`, lastSlide null or `{from,to,tile}`, terminalReceipt null or detached `{phase,reason,score,board,blank,movesUsed,moveLimit,undos,historyDepth}`. Undo clears lastSlide. Every valid slide preserves exactly the multiset0..8 and board solvability.

Input fields: inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`; calls0,elapsed0,elapsedCappedfalse,blockedActions0,lastCommandnone,events[],message. Calls/blockedActions saturate at maxCounter; elapsed saturates at86400. No timer deadline. Events are reset on each admitted call and contain at most one slide/undo/blocked/win/collision record with its call number. Terminal transitions preserve their event thereafter. All model numbers remain finite under supported play.

## Input gate

An admitted call has finite numeric 0<dt<=0.25, nonterminal state and paused not literaltrue. Invalid dt, paused and terminal calls are exact no-ops. Read only own data descriptors x,y,a,b,cancelEpoch,cancelled,paused; ignore inherited values/accessors. If classification or descriptors throw, discard the entire input to neutral. Nonthrowing Proxy traps may execute. Numeric finite axes clamp[-1,1], other values0. Booleans require literaltrue; epochs require nonnegative safe integer. Ignore pressed flags and other properties.

Direction is none if both magnitudes<=.5; dominant axis otherwise, vertical winning ties. Positive y moves down. A rising edge has priority over a changed nonneutral direction; B is saved for full-neutral gate purposes but never commands and does not suppress A/direction. Held A and held same direction do not repeat; skipped edges do not queue.

A neutral admitted sample arms fresh input. The first valid epoch establishes baseline. A later changed epoch or false→true cancelled edge disarms before commands; this call cannot rearm. Cancelled samples suppress commands. A subsequent admitted noncancelled full-neutral sample rearms; held samples are saved even when suppressed. Pausing/retry and physical key release quarantine remain the shared host's responsibility.

## Required evidence

Verify ordinary-input wins for each layout, solvable parity and independent shortest distances, edge blocks, last-allowed success, budget exhaustion, undo without refund, branch history, cancellation and no-repeat, detached data and terminal freeze. Browser evidence uses ordinary keyboard/phone inputs without writing state. Software rendering/recording, synthetic boundaries and physical-device testing are reported separately.
