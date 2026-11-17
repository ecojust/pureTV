# Triangle Pegs — public model contract

Normative design written before implementation and execution. This document is not a test or publication claim.

## Board and fixed openings

The board has five triangular rows, with positions `(row,col)` where `0<=row<=4` and `0<=col<=row`. Zero-based index is `row*(row+1)/2+col`; visible labels are index+1. There are15 holes and each opening has14 pegs.

| Level | id | English | 中文 | Initially empty index / label |
| --- | --- | --- | --- | --- |
| 0 | corner-start | CORNER START | 顶角启局 | 0 / 1 |
| 1 | centre-gap | CENTRE GAP | 中层空位 | 4 / 5 |
| 2 | lower-turn | LOWER TURN | 侧翼回旋 | 7 / 8 |

A legal jump moves an occupied source across an occupied adjacent middle peg into an empty landing exactly two lattice steps away. The six one-step vectors are `(0,1),(0,-1),(1,0),(-1,0),(1,1),(-1,-1)`. Source and middle become empty; landing becomes occupied. Adjacent moves, bent paths, out-of-board landings, empty sources/middles and occupied destinations are invalid. The target is exactly one peg anywhere; every successful jump removes exactly one peg.

## Inputs and recovery

- Left/right move the cursor one column within its row, clamping at its edges.
- Up moves to `(row-1,min(col,row-1))`, clamping on the top row. Down moves to `(row+1,col)`, clamping on the bottom row. The two sloping choices at equal distance are resolved deterministically; all holes are reachable by ordinary directions.
- A with no source selects the current occupied hole; an empty hole blocks free.
- A with an active source performs a legal jump to the cursor, then clears source; invalid landings keep source, board, history and undo credits unchanged.
- B with a source cancels selection, free. B without a source undoes the last jump only if history is nonempty and at least one of3 credits remains. Undo restores source/middle pegs, empties the landing, moves cursor to the restored source, clears source and spends one credit. Credits are never refunded.
- A dead end with more than one peg remains playing if both history and an undo credit are available. The message explains B recovery. Without recovery it loses. A one-peg board wins immediately, before dead-end logic. Terminal states cannot undo or change.

A jump spends no separate move allowance. Undoing and repeating jumps is allowed within the finite credits. Selection is never an implicit undo.

## API and canonical state

Export only `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config` through CommonJS/window.PureModel. Config contains `defaultSeed:753`, `undoCredits:3`, `maxElapsed:86400`, `maxCounter:2147483647`, `positions`, `jumps` and `layouts`. `positions` entries are `{index,row,col,label}`. `jumps` is the36 public geometrical triples `{from,over,to}`; it is not a winning route or solver. Layouts contain `id,name,nameZh,blank`.

Create accepts integer seeds0..4294967295, otherwise753; levels0..2, otherwise0. Seed records identity but does not randomize the fixed openings. Each state is independent and detached from config. Step mutates and returns its state. No I/O, clocks, solution search or state-setting API is exposed.

State fields: `schema,seed,level,phase,reason,score,cursor,source,occupied,pegsRemaining,legalJumps,history,undoRemaining,jumpsMade,undosUsed,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message`. Initial cursor is the empty opening hole; source null; phase playing; reason empty; score0; undoRemaining3; history empty. `occupied` is fifteen booleans. `legalJumps` is a detached derivation of the current board. History holds detached executed triples, newest last; at most13 entries. `jumpsMade<=16`, `undosUsed<=3`; `pegsRemaining=14-jumpsMade+undosUsed`, and `history.length=14-pegsRemaining`. Undo does not reset jumpsMade. Legal jumps are derived afresh after jumps/undo and immediately before judging A; stale cached legalJumps never authorize a move.

Won/lost score is100/0, reason empty/dead-end. No growing action log exists. Current events has at most one entry. Source/cursor selection does not mutate occupancy or history. No deadline; elapsed is informational and capped86400 with sticky elapsedCapped. Calls and blockedActions saturate at2147483647.

## Input admission and cancellation

Terminal states and invalid dt are exact no-ops before input inspection. Admit only finite numeric `0<dt<=.25`. Normalize own data descriptors of x/y/a/b/cancelEpoch/cancelled/paused on nonnull nonarray objects; never invoke getters or consume inherited properties. Descriptor failures discard all partial input to neutral; nonthrowing Proxy traps may execute. Only literaltrue enables booleans; finite numeric axes clamp to[-1,1]; valid cancelEpoch is a nonnegative safe integer. A normalized pausedtrue call is an exact no-op.

Direction is neutral for both magnitudes<=.5; otherwise dominant axis wins with vertical ties. Positive x/y is right/down. Only new button/direction edges command; held inputs do not repeat, but direct direction changes do. Simultaneous priority B>A>direction consumes unchosen new edges. aPressed/bPressed and unknown properties are ignored.

The initial state needs an admitted neutral sample to arm. Changed valid epoch after the first baseline or false→true cancelled disarms before command eligibility. Cancelled samples always suppress commands. A disarm sample cannot rearm; a later noncancelled full-neutral sample is required. Commands require armed-at-entry. Every admitted nonpaused sample records held fields, including suppressed edges. Model neutral does not prove physical release; the host supplies cancellation and release quarantine for phone absence, pauses and reconnects.

Each admitted call advances bounded calls/time, clears events and lastCommand, then handles one command. No-event calls preserve the previous message. Invalid/paused/terminal calls preserve everything.

## Events and settlement

Events include call and type: cursor `{from,to}`, source `{position}`, cancel `{position}`, jump `{from,over,to,pegsRemaining}`, undo `{from,over,to,undoRemaining}`, blocked `{reason}`, win `{from,over,to,pegsRemaining}`, collision `{reason:'dead-end',from,over,to,pegsRemaining}`. Blocked reasons: boundary,empty-source,invalid-jump,no-history,no-undo. Choosing a bound-clamped direction is blocked, not a move.

After a legal jump, update the actual board/history/counts/source first. If one peg remains, win. Else if no legal jumps and no recovery, lose. Otherwise emit jump; if a recoverable dead end, message explicitly says B undo. TerminalReceipt independently captures `{cause,call,elapsed,level,cursor,source,occupied,pegsRemaining,undoRemaining,jumpsMade,undosUsed,score,phase,reason}`; cause success/dead-end. It shares no arrays with live occupancy. History and cached legalJumps never share mutable entries with config or each other.

## Verification boundaries

Test-only bitmask search may prove all openings solvable and find natural bad routes. No search, routes or hints beyond current legal jumps are packaged. All ordinary run claims use create/step through input events. Deliberately changed fixtures are labelled synthetic. Browser keyboard operation and software rendering do not claim physical TV, phone or emulator coverage.
