# Nim Orbit / 取石回合 — public model contract

Written before implementation. Choose one nonempty pile and remove at least one stone, up to that pile's current count. Only one pile changes per move. The player acts first, followed synchronously by a deterministic mathematically optimal opponent. All piles and rules are public. Total stones strictly decrease, so there is no timer, move budget or unrestricted history.

## Public starts and final-stone rule

| Level | ID / English / 中文 | Initial piles | Rule |
| --- | --- | --- | --- |
| 0 | first-orbit / FIRST ORBIT / 初始轨道 | [2,3,4] | normal: the side removing the last stone WINS |
| 1 | four-moons / FOUR MOONS / 四月列阵 | [3,5,6,2] | normal: the side removing the last stone WINS |
| 2 | leave-one / LEAVE ONE / 留下一颗 | [1,3,4,5] | misère: the side removing the last stone LOSES |

Against the specified opponent, independent shortest-route search finds4/7/5 human moves to win; all three also have natural losing routes. A final human move is checked before any opponent response. A final opponent move is checked immediately after it. Reason `player-last` or `opponent-last` names who removed the last stone, while phase identifies the player's result: normal player-last→won/opponent-last→lost; misère player-last→lost/opponent-last→won.

## Deterministic optimal opponent

Define whether the side about to move is in a losing position:
- Normal: XOR of all pile counts is0. Empty normal position is losing for the next side.
- Misère: if every nonempty pile contains exactly1, the position is losing iff the number of nonempty piles is odd. Otherwise use XOR0. An empty misère position is winning for the next side because the previous side already lost.

Enumerate all legal moves with source index ascending and amount ascending. Pick the FIRST move leaving the next side in a losing position. If none exists, remove exactly1 stone from the currently largest pile; tie by lowest index. A candidate empty board is evaluated using the rule above, so normal AI takes a winning last stone but misère AI avoids it when possible. There is no hidden randomness or search solution table. Independent tests use recursive game outcomes rather than this XOR formula.

## Controls

Left/right cycle ALL piles, including empty ones. Up increases chosen removal amount by1; down decreases by1, clamped to1..the selected pile count. Reaching a bound is a blocked/free input. On changing pile or after a completed round, preserve and clamp the amount to the selected pile; an empty pile has amount0, and leaving an empty pile restores at least1 on a nonempty pile. A commits the chosen amount from that one pile; selected empty pile is a no-op. B unused. A takes priority over directions; vertical wins equal-magnitude axis ties. Held inputs do not repeat.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, exported as CommonJS or window.PureModel. Config defaultSeed776,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,piles,misere}`. Valid seed integer0..4294967295 else776; valid level integer0..2 else0. Seed recorded only.

State: schema1,seed,level,phase playing/won/lost,reason '',player-last,opponent-last,score100 iff won else0; piles detached,selected0,amount1,misere,lastStoneRule wins/loses,remaining,initialTotal; playerMoves0,aiMoves0,totalMoves0,playerRemoved0,aiRemoved0; lastPlayerMovenull,lastAiMovenull,lastRoundnull; elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

Move receipt `{side,pile,removed,before,after,remaining,moveNumber}`: side player/opponent; before/after are counts in that pile, remaining is total AFTER that individual move, moveNumber counts both sides. lastRound `{player,opponent}` contains detached receipts; opponentnull if the human just ended the game. lastAiMove resets to null on an actual human move, but an empty blocked attempt preserves previous receipts. All snapshots detached from config and from each other. No unlimited history. External mutation unsupported; isolated boundary fixtures are labelled synthetic.

Remaining and amount clamp refresh on admitted calls and after each mutation. Events at most one per call, include call: cursor `{from,to,amount}`, amount `{from,to}`, blocked `{reason:'empty-pile'|'min-amount'|'max-amount'}`, move `{player,opponent}`, win `{reason}`, collision `{reason}`. Terminal outcome replaces the move event. Terminal receipt detached `{cause,level,call,elapsed,piles,misere,remaining,playerMoves,aiMoves,totalMoves,playerRemoved,aiRemoved,lastRound,score,phase,reason}`. Terminal state freezes exactly.

## Input lifecycle

Terminal and invalid dt (not finite JS number in `(0,.25]`) exact no-op before reading input. Atomically normalize only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore accessors/inherited keys. Invalid objects/arrays/descriptor exceptions neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis above.5 chooses direction; vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before commands and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: A rise, else changed nonneutral direction. B has no action. Suppressed simultaneous edges are consumed. Cancellation preserves selected pile and chosen amount. Host owns release quarantine. Active elapsed/counters saturate; elapsed includes active cancellation calls, with no gameplay deadline.

## Verification

Unmodified ordinary3wins and natural losses; normal/misère final-stone attribution, all-ones parity, pile/amount clamping and empty no-op, conservation and strict decrease, independent exhaustive small-state opponent optimality and deterministic tie breaks, initial/held/cancel/pause/terminal. Solvers and winning routes remain tests-only and never ship in assets.
