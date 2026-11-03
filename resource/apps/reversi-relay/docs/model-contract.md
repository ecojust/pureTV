# Reversi Relay — public rules and model contract

Written before implementation. This is a **6×6 Reversi endgame puzzle**, not a full opening-to-finish match. Three fixed, fully visible positions have 8, 9 and 10 empty cells. Ivory (1) is the player; jade (2) is the computer. Empty is 0. No randomness, timer deadline, hidden information, undo or stored winning route exists in the shipped assets.

## Published positions

Rows are top-to-bottom; columns A–F, rows 1–6. `X` is ivory, `O` is jade, `.` is empty. Each layout starts at A1, on the player's turn.

| Layout | Rows |
| --- | --- |
| corner-leaf / 角隅新叶 | `OXXXX.` / `OXXXX.` / `OXOOOO` / `OXOXOX` / `OO.OOX` / `O.....` |
| edge-weave / 边线交织 | `OOO..X` / `.XOOX.` / `OOOOX.` / `OOOXOX` / `OOXX.O` / `OX.O..` |
| fern-crown / 蕨冠回合 | `OOOOXX` / `.XOOX.` / `.XXOO.` / `.XXXOO` / `..XXXX` / `.OXO..` |

## Legal moves and opponent

A move must occupy an empty cell and bracket one or more contiguous opponent discs between the new disc and an existing own disc in at least one of eight straight directions. All bracketed lines flip simultaneously. Empty gaps and board edges stop a line; rows never wrap. The new disc itself is not a flipped disc.

After each valid player placement, the computer immediately chooses the legal move that flips the most discs. Ties choose the lowest row-major cell index (A1=0, F6=35). This is a deliberately simple, deterministic opponent, not a perfect player. Its choice is computed only from the current board. A computer with no legal move automatically passes. If the player has no legal move while the computer does, the player must explicitly press B to pass; B is blocked while any legal player move exists. Invalid placements and invalid passes consume no turn and cause no computer reply.

After a placement or pass, the round ends when the board is full **or neither player has a legal move**; remaining empty cells are not awarded. More ivory discs wins (`phase:won`, `reason:''`, `score:100`); fewer loses (`lost`, `opponent`, 0); a draw is a non-winning result (`lost`, `draw`, 0). No arbitrary move cap or deadline determines a winner. A valid pass necessarily allows a computer placement, so ordinary play terminates after at most the initial number of empty cells is filled. Terminal state is an exact no-op on every later step.

## Pure interface and state

Export only `create(seed,level)`, `step(state,dt,input)`, deeply frozen `config` through CommonJS or `window.PureModel`. `config` contains defaultSeed751, size6, maxElapsed86400, maxCounter2147483647 and the layouts `{id,name,nameZh,board,cursor:0}` above. Seed is recorded if uint32 else751; level integer0..2 else0. No global mutable state, I/O, time source, test fixture or solver is exposed. Create allocates independent data. Step mutates and returns its input state; malformed external state is unsupported (synthetic test fixtures are labelled separately).

State includes schema1,seed,level,phase,reason,score; `board` flat36, `cursor`0..35, `legalMoves` current legal indices, `counts:{player,opponent,empty}`; `playerMoves`, `aiMoves`, `movesPlayed` placements total, `playerPasses`, `aiPasses`, and `lastPlayerMove` / `lastAiMove` (null or detached `{cell,flipped}`); `receipts` (max20 for authored positions: `{actor:'player'|'ai',cell:null for pass,flipped,counts}`), `terminalReceipt` null or detached final `{phase,reason,score,board,counts,movesPlayed,playerPasses,aiPasses}`. The most recent player and AI placements persist across automatic passes, so a pass never fabricates a new move marker. Counts and legal moves are derived from board at creation and after each accepted turn. Each turn recomputes legal captures directly, not from a stale display cache.

Other fields: elapsed0 (informational, saturates86400), elapsedCappedfalse; calls0 and blockedActions0 (saturating maxCounter); inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`; lastCommandnone, events[] (reset on each admitted call, at most3), message. Events identify place/pass/blocked/select/win/collision, actor where relevant; receipts are not erased by neutral frames. Cached arrays, receipts and terminal receipt are detached, and never alias config. Finite values only.

## Input

Accept finite numeric 0<dt<=0.25; invalid dt, pausedtrue and terminal state are exact no-ops. Read only own data descriptors for x,y,a,b,cancelEpoch,cancelled,paused; never invoke getters or inherit properties. A throwing descriptor/Proxy discards the complete input to neutral. Nonthrowing Proxy traps can run. Axes finite numeric clamp[-1,1], other values0; boolean flags require literaltrue; epoch requires nonnegative safe integer. Ignore aPressed/bPressed and unrelated properties.

Direction is none when both magnitudes<=.5; otherwise dominant axis wins, vertical winning ties. Positive y goes down. Direction edges move the cursor one cell, clamped to the board; no wrap, no held repeat. At most one command per admitted step: B rise before A rise before changed direction. Unchosen edges are consumed, never queued. All admitted calls increment calls/time even when input is cancelled.

An initial neutral call arms input. First valid epoch establishes a baseline. Later epoch changes or a false→true cancelled edge disarm before actions; the disarming call cannot rearm. Cancelled calls suppress actions. A subsequent noncancelled fully neutral sample rearms. Actual held values are saved even when suppressed. Begin/pause/retry physical-release quarantine belongs to the shared host; no model input can infer absence of a real phone. A long hold across the computer's immediate response cannot place twice.

## Verification boundaries

Tests must cover eight-direction flips, edge/gap blocking, simultaneous flip sets, deterministic AI ties, invalid actions, manual player pass, automatic computer pass, full-board and both-stuck settlement, winning/losing/draw counts, fresh state, detached receipts, cancellation, pause, exact terminal freeze, and ordinary-input victories for all authored layouts. Test-only search stays outside packaged assets. Browser input, software rendering, synthetic boundary fixtures and physical-device testing must be reported separately.
