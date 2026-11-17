# PureModel contract — Quadrant Five 0.1.0

Exports only create(seed,level), step(state,dt,input), deeply frozen config. Config contains public6×6 boards, quadrantSize3,winLength5, AI weights/priorities, defaultSeed781 and finite bounds. No historical route, solution or test solver appears in production assets.

## Complete turns and outcome

Board is row-major0empty/1player/2AI. Four quadrants are0upper-left,1upper-right,2lower-left,3lower-right. A complete turn places in one empty cell, then mandatorily rotates any quadrant90degrees. Local clockwise map(x,y)→(2−y,x), anticlockwise→(y,2−x). Other quadrants retain positions. Check results only after the rotation, even if placement already formed five or filled the final cell.

Enumerate all32 contiguous length5 windows across horizontal,vertical,two diagonal directions. Six in a row contains two winning windows. Both actors with a window means unsuccessful simultaneous tie; otherwise player-only won, AI-only lost/opponent, full board with no window lost/draw, else playing. No artificial success for a tie. After a nonterminal player rotation, AI immediately completes one legal placement+rotation and resolves the same outcomes. Terminal player result suppresses an AI reply.

AI scans cell0..35, quadrant0..3, direction[1,-1]. Candidate priority is opponent4,playing3,simultaneous2,draw1,player0. Within equal priority, maximize sum(open AI window weights)−sum(open player window weights), weights[0,1,4,12,40,1000]. An open window contains no opposing stones; empty contributes0. Equal score keeps the first scanned action. This is a public one-turn decision rule, not the puzzle solver. Board symmetry is not quotiented because scan-order tie-breaking depends on coordinates.

## Controls and state phases

phase is playing/won/lost. Separate turnPhase is place/rotate. Place arrows move cursor0..35; A on empty puts1, updates counts, sets pendingPlacement, changes turnPhase to rotate, sets quadrantCursor to that cell's quadrant and rotationDirection=1. Occupied A and place-phaseB are blocked/free.

Rotate arrows select the2×2 quadrant grid; board cursor stays at placement coordinate. B negates rotationDirection. Fresh A applies rotation, increments playerTurns, records the complete turn and returns turnPhase to place before resolving outcomes/AI. There is no pending-turn undo or rotation skip. Cancellation refers to input gating: it preserves the staged stone and selection, without confirming it.

Public state:

- schema1,seed,level,board,counts{player,opponent,empty}; phase,reason empty/opponent/simultaneous/draw,score100 only for won.
- turnPhase,cursor,quadrantCursor,rotationDirection,pendingPlacement cell/null.
- playerTurns,aiTurns count completed turns only. Counts include the pending player stone during rotate, so player count=14+playerTurns+(pending?1:0), AI count=14+aiTurns.
- lastPlayerTurn{cell,quadrant,direction,rotatedCell}; lastAiTurn adds priority,score,outcome. `cell` is the input coordinate before its rotation; receipt.rotatedCell is immediately after that actor's rotation.
- lastPlayerCell,lastAiCell track each latest stone through every subsequent rotation by either side. Renderer uses these current coordinates for markers, rather than stale receipt locations.
- winningLines[{actor,cells}] only at terminal. receipts retain completed turns with actor and detached counts, at most8 for these authored boards. terminalReceipt deep-copies outcome,board,counts,turn counters,winning lines and last-turn records.
- Standard elapsed/counter/input-gate diagnostics, events and message. Events reset on admitted calls and may include both actors' rotations; persistent receipts survive neutral release.

All initial positions contain14 stones per actor and8 empties, no existing winning line. Tests replay28 nonterminal alternating legal historical turns from an empty board to each exact start. Histories prove game-rule reachability, not historical adherence to the current endgame AI. Exact board-state search proves no player win in1..3 complete turns and supplies a4-turn win for all three. Natural opponent,simultaneous and draw routes are independently replayed through ordinary inputs.

## Input lifecycle and bounds

Only finite numeric0<dt<=.25 is admitted. Invalid dt, literal pausedtrue and all terminal calls are exact no-ops. Own data descriptors only; getters/inherited fields/pressed claims are ignored. Buttons require literaltrue; finite axes clamp[-1,1], magnitude>.5 dominant axis wins, vertical on ties. FreshB precedes freshA then changed nonneutral direction.

Fresh state begins unarmed and requires a fully neutral sample. Changed nonnegative safe cancelEpoch or rising cancelled disarms; held input cannot act until later neutral rearms. Held A cannot place and confirm rotation in one press; a cancelled pending confirmation retains the stone/turnPhase until an explicit fresh input. No held direction repeat.

Boards and cursors remain finite; at most8 new placements/completed receipts and4 turns per actor. No unbounded history. Generic counters saturate2147483647; elapsed86400 sets elapsedCapped. Terminal state freezes exactly, including phase-selection fields and all diagnostics.
