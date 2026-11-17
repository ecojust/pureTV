# Liberty Stones — public model contract

This specification fixes public rules before implementation/checks. It does not claim publication or passed verification.

## Board, liberties and capture race

Three authored legal positions use square boards of size 5, 6 and 7. Flat point IDs are row*size+column, row/column zero-based. Values are 0 empty, 1 black player, 2 white AI. Orthogonal neighbors only; a group is all connected same-color stones, and its liberties are the distinct adjacent empty points. No diagonal connection or territory scoring is used.

All initial groups have positive liberties. Test-only initial-prefixes.json gives a legal alternating sequence from an empty board, black first; entries are point IDs, or null for a pass. Replaying it exactly reconstructs both the public board and the public koBoard immediately before the most recent ply. Every prefix has even length, so black moves next. Captures before the authored start do not count toward this round.

The visible objective is to capture four enemy stones before the opponent captures four. Player turn limits are 10, 12 and 14. A valid player placement or pass consumes one turn; invalid placement/navigation is free. Player reaching four captures wins immediately before AI response, including the last allowed turn. Otherwise AI responds once. AI reaching four then loses for the player; otherwise two consecutive passes end as an unmet-target loss; otherwise reaching the player turn limit ends as an unmet-target loss. No territory scoring or lower-score tiebreak is implied. Passing is always allowed, even when legal placements exist. There is no wall-clock timer.

## Placement legality and simple ko

To try a stone on an empty point:
1. Add the stone to a temporary board.
2. Find all distinct orthogonally adjacent opponent groups with zero liberties and remove them simultaneously.
3. Find the new stone's own group after those captures. Reject if it has zero liberties (suicide).
4. Reject if the entire resulting board equals koBoard, the position immediately before the previous accepted ply (simple ko).

Capture comes before suicide, so a placement with no empty neighbor before removal may be legal after it captures. A legal placement replaces board, adds removed count to the mover's round capture total, sets koBoard to a detached copy of the previous board and resets passStreak to 0. An illegal attempt does none of these. Passing sets koBoard to a copy of the current board and increments passStreak, so a pass lifts the prior immediate-ko restriction. No superko, handicap, komi or hidden history rule is used.

## Public opponent and controls

Arrows move a bounded grid cursor. A attempts a black placement; B passes. B > A > direction; dominant axis chooses direction, vertical wins equal magnitudes. There is no held repeat.

The AI enumerates every legal white placement under the same capture/suicide/ko rules. Rank by (1) most stones captured, (2) most distinct liberties in the resulting group containing the new white stone, (3) smallest squared distance to geometric center, (4) smallest row-major point ID. Center distance uses integer-scaled coordinates: (2*row-(size-1))²+(2*col-(size-1))². If no legal placement exists, AI passes. This is a fully public fixed policy, not a perfect-play claim. It uses no answer route, randomness or hidden information.

## API and state

Export only create(seed,level), step(state,dt,input), deeply frozen config. Config includes defaultSeed 780, maxElapsed 86400, maxCounter 2147483647, aiPolicy and layouts. Layouts contain id/name/nameZh,size,board,koBoard,target,turnLimit; they contain no solutions. Seeds integer 0..4294967295 accepted, otherwise 780. Level 0..2 accepted, otherwise 0. Seed is recorded but changes neither position nor AI. Creation returns independent state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,size,board,koBoard,cursor,groups,captures:{player,ai},target,turnLimit,playerTurns,aiTurns,playerPasses,aiPasses,passStreak,lastPlayer,lastAI,receipts,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initial cursor is the point at row=floor(size/2),col=floor(size/2). Initial phase playing/reason empty/score 0, captures and turn/pass counters 0, last moves null. Groups are sorted by smallest stone ID and contain {color,stones:[sorted IDs],liberties:[sorted IDs]}; this is a derived cache of the entire current board and updates after each completed valid human turn/AI response. The renderer may inspect the cursor's group and mark its exact liberties. No legal-move oracle or state setter is exported.

A placement record is {type:'place',point,captured:[sorted IDs],liberties:[sorted IDs of newly placed group immediately after that ply]}; a pass is {type:'pass'}. After each valid human action lastAI clears before any response. Receipts append detached {turn,player,ai,captures,passStreak,outcome,reason}, bounded by turnLimit. All receipt/move/capture arrays are independent of mutable board/cache state.

Won has score 100/reason empty. Lost score 0/reason opponent, passes or limit. TerminalReceipt is detached {cause,call,elapsed,level,board,koBoard,captures,target,playerTurns,aiTurns,passStreak,score,phase,reason}; cause success/opponent/passes/limit. Terminal calls freeze every field before reading input.

Events include call and at most one item: cursor {from,to}; blocked {reason:'boundary'|'occupied'|'suicide'|'ko'}; turn {player,ai}; win {cause,player,ai}; collision {cause,player,ai}. LastCommand b/a/up/down/left/right/none. No-event calls preserve message.

## Input lifecycle

Admit only finite numeric 0<dt<=0.25. Invalid dt or terminal state is an exact no-op before input inspection. Read only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on a non-null non-array object. Getters, inherited and unknown fields are ignored. Descriptor failure discards partially read values to neutral; nonthrowing Proxy traps may run. Flags require literal true. Finite axes clamp [-1,1]. Epoch is a nonnegative safe integer or ignored. Paused true is an exact no-op.

Initially unarmed. A changed valid epoch after baseline or false→true cancelled disarms before commands. Every cancelled sample suppresses commands, cannot rearm, and preserves board/cursor/ko. A disarming sample cannot rearm. A later noncancelled neutral sample (a/b false, both axes magnitude <=0.5) arms future commands. Commands require armed at entry and A/B rising edge or changed nonneutral direction. Held values are recorded even when suppressed. aPressed/bPressed are ignored. The host enforces physical release and phone-disconnection quarantine.

Each admitted unpaused step increments bounded informational elapsed/calls, clears events/lastCommand and performs at most one human command plus one synchronous AI response. Calls/blockedActions saturate at maxCounter. Elapsed caps at maxElapsed with sticky elapsedCapped and never determines victory.

## Evidence boundaries

Independent test-only flood-fill/AI reference must reconstruct legal starting histories, prove ordinary win/loss routes and minimum four meaningful human turns, and check capture-before-suicide, simple ko and pass lifting. Synthetic tactical fixtures are explicitly labelled. Browser input/software rendering do not claim physical TV, phone or emulator testing.
