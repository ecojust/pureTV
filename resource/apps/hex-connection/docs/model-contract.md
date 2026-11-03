# PureModel contract — Hex Connection 0.1.0

Only `create(seed, level)`, `step(state, dt, input)` and deeply frozen `config` are exported. No production solver, answer route, state injection hook or hidden board exists. Config layouts expose the complete starting board, size, names and cursor. `docs/public-layouts.json` mirrors this public authoring data.

## Rules and deterministic AI

The board is a row-major array, `0` empty, `1` player and `2` opponent. Cell `y*n+x` neighbours `(x±1,y)`, `(x,y±1)`, `(x+1,y−1)`, `(x−1,y+1)` inside the board. Rows do not wrap. Player 1 connects x=0 to x=n−1; opponent 2 connects y=0 to y=n−1. A connected path uses only that actor's stones. More stones alone never imply a win.

A on an empty selected cell places exactly one player stone. Check the player's connectivity immediately; if connected, win without an AI reply. Otherwise select and place exactly one AI stone, then check its connectivity. On valid play every full Hex board has one winner; there is no draw phase, passing, capture, undo or move limit. Occupied A and unused B are blocked without consuming a turn. Cursor arrows move one row/column, clamped at edges. No hold repeat.

AI selection scans empty cells row-major:

1. First cell that immediately connects actor 2.
2. First cell that would immediately connect actor 1, occupied by actor 2 to block.
3. Evaluate each hypothetical actor-2 placement. Minimize actor-2 connection cost, then maximize actor-1 cost, then choose the first tied cell.

The cost is the minimum sum of empty cells on a goal-to-goal path: friendly stone=0, empty=1, opposing stone blocked. A disconnected/unreachable goal costs `n*n+1`, a finite sentinel greater than any finite valid path cost. Production uses deterministic Dijkstra selection; it does not predict an entire solution. Multiple immediate threats are resolved by lowest index, even when a different threat remains.

All three starting positions have equal actor counts and neither actor connected. Any alternating ordering of their occupied cells is legal: prefixes cannot contain a connection absent from the complete start because connections are monotonic. Empty counts11/13/14; board sizes5/5/6. The test-only exhaustive tree proves the shortest player wins against this exact AI need4/3/3 placements, and each position has a natural losing route.

## Public state

- Identity: `schema:1`, `seed`, `level`, `size`; invalid seed/level defaults to769/0. Seed is reported but does not randomize boards or replies.
- `phase`: playing/won/lost; `reason`: empty or opponent; `score`:100 only when won.
- `board`, `cursor`, sorted `legalMoves` containing all empty indices; detached `counts:{player,opponent,empty}`.
- `playerMoves`, `aiMoves`, `movesPlayed`: new placements after the authored start, bounded by initial empty count.
- `lastPlayerMove`, `lastAiMove`: index or null; `lastAiDecision:{cell,reason,ownCost,playerCost}` or null. Reason is win/block/cost; cost fields are null for immediate win/block, exact selected costs for cost decisions. A player's final winning move leaves the previous AI receipt intact.
- `winner`:0 during play,1/2 at terminal; `winningPath`: actual same-actor path in edge-to-edge order. BFS tie order follows the public adjacency list. Empty during play.
- `receipts`: one `{actor:'player'|'ai',cell,counts}` per placed stone, bounded by initial empties. `terminalReceipt` is a detached board, outcome, counts, path and placement counts.
- `elapsed`, `elapsedCapped`, `calls`, `blockedActions`, `events`, `message`, `lastCommand` and input gate fields.

`events` are reset on each admitted playing step and record selection, blocked inputs, placements and terminal outcome. Neutral input after an action can clear events; persistent move/decision receipts preserve the last moves for the renderer. Winning path and receipt arrays do not alias each other. Renderer reads the actual board and public facts only.

## Input lifecycle and bounds

Only finite numeric `0 < dt <= .25` is admitted. Invalid dt, literal `paused:true`, and every terminal call are exact no-ops. Read only own data descriptors from input; getters, inherited fields and pressed/released claims cannot manufacture commands. Buttons must be literal booleans; axes finite and clamped to[-1,1]. Dominant axis above.5 selects direction, vertical wins ties. Priority is fresh B, fresh A, then changed nonneutral direction.

Fresh states are unarmed. An admitted neutral sample arms input. A changed nonnegative safe `cancelEpoch` or a rising literal `cancelled` disarms it; cancellation and subsequent held input cannot cause a command. A later fully neutral sample rearms. Held direction and buttons do not repeat. No partial turn/AI work crosses calls: each legal placement and AI response resolve synchronously.

Elapsed saturates at86400 seconds and sets `elapsedCapped`; generic counters saturate at2147483647. Board, cursor, placements and receipts are naturally finite. There is no game timer. Tests may use explicitly labelled synthetic boards to probe geometry; browser pilots use normal input against actual authored states only.
