# 跳吃棋径 / Draughts Trail — public model contract

Written before implementation. A6×6 draughts endgame against a deterministic opponent. Only dark squares `(row+column)%2==1` are playable. Board values:0 empty,1 player man,2 player king,−1 opponent man,−2 opponent king. Player moves toward row0, opponent toward row5. Men both MOVE AND CAPTURE forward only. Kings move one diagonal cell or jump over one adjacent enemy in either diagonal direction; there are no flying kings.

## Public positions

Positions are flat `row*6+column`, zero-based. Empty elsewhere. Player acts first.

| Level | ID / English / 中文 | Player men | Player kings | Opponent men | Opponent kings |
| --- | --- | --- | --- | --- | --- |
| 0 | first-crossing / FIRST CROSSING / 初渡棋径 | 30,32,34 | none | 1,3,5 | none |
| 1 | broken-ranks / BROKEN RANKS / 断阵棋径 | 25,29,32,34 | none | 1,3,6,10 | none |
| 2 | crown-passage / CROWN PASSAGE / 王冠通路 | 25,27,30,34 | 20 | 1,3,10,17 | 8 |

## Turn rules and controls

If ANY friendly piece can capture, all ordinary noncapture moves are forbidden. A jump lands on the empty cell two diagonals away and removes the intervening enemy. Multiple jumps must continue with that SAME piece while another jump exists. The human may choose among available capture continuations and need not maximize captures. A man reaching the far row becomes a king, and promotion IMMEDIATELY ENDS the turn even if the new king could capture backward.

Cursor directions move one square over the full grid, clamped without wrap. A selects a legal friendly source, then executes a highlighted legal destination. Before the first capture A on a different legal friendly piece may switch source. B cancels a selection only before the first capture. During an unfinished capture chain, source switching and cancellation are forbidden; selected stays the capturing piece and only its jump destinations are legal. Light squares, occupied destinations and illegal moves are blocked/free. Once a full human turn finishes, the opponent completes one whole turn synchronously in the same model call. Public last-turn receipts show every opponent jump; no hidden moves.

At the end of a player turn, opponent elimination or no legal opponent turn wins. After opponent response, player elimination or no legal player turn loses. Count every completed human/opponent turn as one half-turn; at80 half-turns, an otherwise unresolved game is a draw treated as loss `turn-limit`. Wins/elimination/no-move take precedence over the limit. No wall-clock deadline.

## Deterministic opponent

Enumerate complete legal capture sequences, ending on promotion. If captures exist, choose most captured pieces, then prefer a promotion, then lexicographically smallest full index path `[source,...destinations]`. Do not force maximum capture on the human. Without captures, choose a legal single-step move: prefer promotion, then highest destination row (opponent's forward direction), then lexicographically smallest source/destination path. Existing kings are not counted as newly gained kings. All choices use visible board only; there is no randomness.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config, exported through CommonJS or window.PureModel. Config size6,defaultSeed768,maxHalfTurns80,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,board}`. Seed integer0..4294967295 or768; level integer0..2 or0. Seed recorded only. No solver or winning route in assets.

State schema1,seed,level,phase playing/won/lost,reason '',opponent-empty,opponent-blocked,player-empty,player-blocked,turn-limit; score100 iff won else0; board detached; cursor first positive piece index; selectednull,chainActivefalse,legalDestinations[],forcedPieces[]; halfTurns0,playerTurns0,aiTurns0,playerCaptures0,aiCaptures0; playerPieces/aiPieces derived counts; pendingPath[],pendingCaptured[],lastPlayerTurn null,lastAiTurn null; elapsed0,elapsedCappedfalse,calls0,blockedActions0; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. Derived legal arrays refresh on admitted calls and after board changes. All state/receipts detached; no full unbounded history. External mutation unsupported; boundary fixtures labelled synthetic.

Completed-turn receipt `{from,path,captured,promoted,halfTurn}`. pendingPath begins with the selected source and grows for a capture chain; pendingCaptured records actual removed positions. Completing a turn clears pending data and selection. lastAiTurn is the most recent completed AI turn, possibly from an earlier human turn if the human just won without a response.

Events at most one per call, include call: cursor `{from,to}`, select `{piece}`, cancel `{}`, capture `{from,to,captured,continuations}`, turn `{player,ai}`, blocked `{reason}`, win `{reason}`, collision `{reason}`. A completed turn or terminal result replaces the intermediate move/jump event. Block reasons include edge,select-piece,capture-required,no-move,same-piece,illegal-destination,capture-chain,no-selection. Terminal receipt detached `{cause,level,call,elapsed,board,halfTurns,playerTurns,aiTurns,playerCaptures,aiCaptures,lastPlayerTurn,lastAiTurn,score,phase,reason}`. Terminal calls exact no-op.

## Input lifecycle

Terminal or invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions become neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]; epoch nonnegative safe integer or ignored. Pausedtrue exact no-op. Dominant axis above0.5 selects direction, vertical wins ties.

Initial full-neutral arms. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before actions and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rise, else A rise, else changed nonneutral direction. Consume suppressed simultaneous edges, no held repeats. Cancellation does not cancel a compulsory capture chain. Host owns device-release quarantine. Calls/blockedActions/elapsed saturate; elapsedCapped sticky. No-event calls preserve message.

Verify ordinary3wins with at least3 completed human turns and captures; independent deterministic AI and global mandatory capture; no cancelling/switching chains; promotion ending a turn; men versus kings, legal ordinary moves, natural loss/no-move/turn limit, conservation across captures and input/terminal behavior. Independent solve routes remain tests-only; browser sends ordinary keys on public snapshots.
