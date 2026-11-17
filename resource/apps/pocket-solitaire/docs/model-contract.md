# Pocket Solitaire / 口袋接龙 — public model contract

Written before implementation. Mini FreeCell with four suits C(clubs,black), D(diamonds,red), S(spades,black), H(hearts,red). Every card is visible. There are four tableau columns (bottom→top), two one-card freecells, and four fixed suit foundations. Move ONE exposed top card at a time; no multi-card sequence moves.

## Public deals

Cards are numeric IDs0..4R−1; `suit=floor(id/R)`, `rank=id%R+1`, `color=suit%2` (0 black/1 red). Public state cards includes `{id,suit,rank,color}` for every card. All foundations start0; both freecells null.

| Level | ID / English / 中文 | R / moveLimit | Tableau bottom→top |
| --- | --- | --- | --- |
| 0 | first-reserve / FIRST RESERVE / 初识暂存 | 3 /50 | [0,1,2];[3,4,5];[6,7,8];[9,10,11] |
| 1 | woven-suits / WOVEN SUITS / 花色交织 | 4 /70 | [0,5,10,15];[4,9,14,3];[8,13,2,7];[12,1,6,11] |
| 2 | pocket-weave / POCKET WEAVE / 口袋织局 | 5 /90 | [0,6,12,18,4];[5,11,17,3,9];[10,16,2,8,14];[15,1,7,13,19] |

Independent test search supplies complete witnesses of20/24/39 valid moves, including8/8/19 temporary placements (destinations other than foundations). These are witnesses, not an unsupported claim of minimality. Initial deals may have any card order; only NEW placements obey tableau rules. No solver or solution route ships in assets.

## Locations, controls and legality

Location indices0..3 tableau,4..5 freecells,6..9 foundationsC/D/S/H. Left/right cycle all10 locations. Up from tableau0..3 goes to4+index; up from any top-row location4..9 is a blocked navigation bound. Down from top row goes to tableau `min(cursor−4,3)`; down from tableau is a blocked bound. The renderer labels all locations and the HUD names the cursor location; left/right alone can reach every area.

With no source marked, A on a nonempty tableau/freecell marks its exposed top card. Foundations can never be sources of a forward move, including nonempty foundations. Empty tableau/freecell cannot be selected. With a source marked, A on the SAME location cancels freely; A elsewhere attempts to place that top card. It does not silently switch source on a blocked destination.

Destination rules: an empty tableau accepts ANY card; a nonempty tableau accepts only opposite color and exactly one LOWER rank than its top. A freecell accepts one card only if empty, including transfer between the two freecells. A foundation accepts only its own suit and the next rank, starting1. No automatic moves or auto-promotion. Each successful transfer increments movesUsed once, clears source, and saves the previous positions. Rejected operations and selection/navigation do not spend moves.

After a successful move, all four foundations reaching maxRank wins `complete` before budget exhaustion. Otherwise movesUsed>=moveLimit loses `moves`. No additional stuck-position loss, timer or automatic undo. A player can retry via the host if a position cannot be repaired.

## Two undo tickets

B has priority over A/directions. It undoes the latest successful forward move when a ticket and history entry exist. Restore tableau/freecells/foundations, clear selectedSource, clear lastMove, consume exactly one of2 tickets, increment undosUsed, and KEEP movesUsed unchanged. Cursor stays where it is. The previous positions are held in history, capped to the two most recent entries, sufficient for at most two remaining consecutive undos. New forward moves append a snapshot and discard the oldest if needed. No redo.

Forward foundations are monotone and cannot be manually withdrawn. Undo is the explicit exception: it may restore a previous lower foundation rank and return that card to its prior place. History is unavailable after terminal freeze. An empty/no-ticket undo changes no positions or selection and spends no resource. Blocking priority is no-tickets before no-history.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, CommonJS or window.PureModel. Config defaultSeed779,maxElapsed86400,maxCounter2147483647,historyLimit2,suits `[{id,name,nameZh,color}]`,layouts `{id,name,nameZh,maxRank,moveLimit,tableau}`. Valid seed integer0..4294967295 else779; valid level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason '',complete,moves,score100 iff won else0; cards[],maxRank,tableau[],freecells[null,null],foundations[0,0,0,0],cursor0,selectedSourcenull,movesUsed0,moveLimit,undoTickets2,undosUsed0,history[],foundationCount0,remaining=cards.length,lastMovenull,lastUndonull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

history snapshots `{tableau,freecells,foundations}` are detached. lastMove `{card,from,to,move}`; lastUndo `{ticket,movesUsed,foundationsBefore,foundationsAfter}`. Derived foundationCount=sum foundations and remaining=card count−foundationCount refresh on admitted calls and after mutations. Foundation card identities are reconstructed by suit and ranks1..foundation[suit]; every ID exists exactly once across tableau/freecells/reconstructed foundations. External state mutation unsupported; focused boundary tests labelled synthetic.

Events at most one per call, include call: cursor `{from,to}`, select `{source,card}`, cancel `{source}`, move `{card,from,to,move}`, undo `{ticket,movesUsed}`, blocked `{reason}`, win `{reason}`, collision `{reason}`. Block reasons navigation-bound,foundation-source,empty-source,occupied-freecell,tableau-rule,foundation-rule,no-tickets,no-history. Terminal result replaces move event. Terminal receipt detached `{cause,level,call,elapsed,tableau,freecells,foundations,movesUsed,moveLimit,undoTickets,undosUsed,lastMove,score,phase,reason}`. Terminal freezes exactly.

## Input lifecycle

Terminal or invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis>.5 chooses direction; vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch change or false→true cancelled edge disarms before actions and cannot rearm same call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rise, else A rise, else changed nonneutral direction. Suppressed simultaneous edges consumed, no held repeat. Cancellation preserves marked source; host owns release quarantine. Active elapsed/counters saturate but there is no deadline.

## Verification

Ordinary3wins with at least4 temporary placements each, independent reference transitions/solver witnesses, every destination rule, uniqueness/conservation, forward foundation monotonicity and documented undo exception, freecell capacity, source cancellation, two undo tickets/no move refund/history bound, natural budget losses and reachable exact-budget successes using reversible legal moves, lifecycle and terminal. Browser planning uses only visible snapshots.
