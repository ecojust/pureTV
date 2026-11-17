# Dots and Boxes — public model contract

This specification defines the rules and evidence boundary before execution. It does not claim publication or passed checks.

## Geometry and prepared positions

Three layouts contain 3×3, 3×4 and 4×4 boxes (columns × rows), with 10, 12 and 14 undrawn edges. Dots have row 0..rows and column 0..cols. Horizontal edges connect an anchor dot to its right neighbor; vertical edges connect it to the dot below. Edge IDs enumerate all horizontal edges in row-major order, then all vertical edges in row-major order. Thus H=(rows+1)*cols, horizontal ID=row*cols+col and vertical ID=H+row*(cols+1)+col. Box IDs are row*cols+col.

Public layout fields are id/name/nameZh, cols, rows, edges and owners. Edges use 0=undrawn, 1=drawn by player, 2=drawn by AI. Box owners use 0=unclaimed, 1=player, 2=AI; an owned box has all four edges drawn and every completed box has an owner. Initial scores are derived from owners, respectively 2–0, 2–3 and 2–4. Test-only initial-prefixes.json proves every prepared position is reachable by ordinary alternating play with capture extra turns, and that it is the player's turn. Prefixes do not contain future solutions.

Draw any unclaimed in-bounds edge. Completing one or two boxes assigns all newly completed boxes to the mover and grants another turn. If no box was completed, pass to the opponent. Human capture leaves the game ready for another human action; otherwise the visible deterministic AI draws synchronously and keeps drawing while it captures. Its chain ends after its first noncapture or when all edges are drawn. The chain is bounded by remaining edges. No early score clinch: settle only when all edges are drawn. Player wins with strictly more boxes; equal score is an unsuccessful draw and fewer boxes an opponent loss. Score is 100 only on victory, otherwise 0.

## Controls and AI

Arrows move the anchor dot within the bounded dot grid. A toggles h/v orientation, initially h. B draws the previewed edge. An edge outside the board or already drawn blocks free and does not invoke AI. Input priority is B, then A, then direction; direction uses the dominant axis above 0.5, with vertical winning equal magnitudes. No held repeat. Every completed synchronous response returns control to the player.

The AI considers free edge IDs in ascending order. First maximize the number of immediately completed boxes (0, 1 or 2), breaking ties by smallest ID. If every candidate captures zero, choose the first edge that does not increase any adjacent box from two drawn sides to three. If no such safe edge exists, choose the smallest free ID. The policy uses only the public current edges; no hidden state, randomness or search table. An AI chain recomputes this choice after every captured edge.

## API and state

Only create(seed,level), step(state,dt,input), and deeply frozen config are exported. Config contains defaultSeed 771, maxElapsed 86400, maxCounter 2147483647, layouts and aiPolicy text. Integer seeds 0..4294967295 are accepted, otherwise 771. Level 0..2 is accepted, otherwise 0. Seeds are recorded but do not change the authored boards or AI. Creation returns fresh detached data; step mutates and returns it.

State fields: schema, seed, level, phase, reason, score, cols, rows, cursor:{row,col}, orientation, edges, owners, playerBoxes, aiBoxes, remaining, playerMoves, aiMoves, lastPlayer, lastAI, aiTrail, receipts, elapsed, elapsedCapped, calls, blockedActions, inputArmed, cancelEpoch, cancelledLast, lastHeld, lastCommand, events, terminalReceipt, message.

Initial cursor is {row:0,col:0}; orientation h; phase playing/reason empty/score 0. Moves count newly drawn edges after the prepared start. LastPlayer/lastAI are null initially, else {edge,boxes:[new box IDs]}. At each valid human edge, lastAI is cleared and aiTrail is reset before any response. aiTrail contains detached AI placements of the most recent chain. receipts contains at most the initial remaining-edge count entries, one per valid human placement: {move,player,ai:[placements],remaining,playerBoxes,aiBoxes,outcome,reason}. Arrays and receipt placements do not share mutable references.

Events are at most one per admitted call: cursor {from,to}; orient {from,to}; blocked {reason:'boundary'|'outside'|'claimed'}; turn {player,ai}; win {player,ai}; collision {reason:'draw'|'opponent',player,ai}. Each includes call. LastCommand is b/a/up/down/left/right/none. No-event samples preserve message.

Phase won has reason empty, score 100; lost has reason draw or opponent, score 0. TerminalReceipt is a detached {cause,call,elapsed,level,edges,owners,playerBoxes,aiBoxes,remaining,playerMoves,aiMoves,score,phase,reason}; cause success/draw/opponent. Terminal calls freeze every field before reading input.

## Input lifecycle

Admit only finite numeric 0<dt<=0.25. Invalid dt or terminal state is an exact no-op. Read only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on a non-null, non-array object. Ignore inherited/getter/unknown fields; descriptor failure discards partial reads to neutral. Nonthrowing Proxy traps may execute. Literal true enables booleans. Finite axes clamp to [-1,1]; cancellation epoch must be a nonnegative safe integer, otherwise ignored. Paused true is an exact no-op.

Initially unarmed. A noncancelled neutral sample arms future inputs. A changed valid epoch after baseline or false→true cancelled disarms before commands; every cancelled sample suppresses commands. The disarming call cannot rearm. Later physical neutral is required: a/b false and both axis magnitudes <=0.5. Commands require armed at entry; held values are recorded even for suppressed commands. A/B require rising edges, direction requires a changed nonneutral direction. aPressed/bPressed are ignored. Host cancellation ensures physical release and disconnected-phone handling.

Each admitted unpaused sample increments calls and bounded informational elapsed, clears events/lastCommand, then handles at most one human command and any resulting AI chain. Calls/blockedActions saturate at maxCounter. Elapsed caps at maxElapsed with sticky elapsedCapped; there is no deadline.

## Evidence boundaries

Independent test-only search must use public boards and documented AI to prove three ordinary-input victories and natural losses. Synthetic box/score/input fixtures are separately labelled. Test solvers and initial prefixes do not ship as runtime assets. Browser keyboard/software-rendering evidence does not claim physical TV, phone or emulator testing.
