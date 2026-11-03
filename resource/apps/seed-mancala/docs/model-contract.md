# Seed Mancala / 播子棋盘 — public model contract

Written before implementation. Kalah uses fourteen indexed compartments. Player pits0..5 and store6; opponent pits7..12 and store13. Every position contains exactly24 seeds, including stored seeds. The player acts first. No concealed information, randomized opponent, solver or solution route is shipped in assets.

## Public positions

| Level | ID / English / 中文 | Counts in indices0..13 |
| --- | --- | --- |
| 0 | amber-harvest / AMBER HARVEST / 琥珀丰收 | 2,0,1,1,0,1,6,1,1,1,1,1,4,4 |
| 1 | narrow-margin / NARROW MARGIN / 一籽之差 | 1,1,0,2,2,0,4,0,2,1,1,0,3,7 |
| 2 | winding-return / WINDING RETURN / 回环收籽 | 0,2,2,2,0,0,5,2,1,1,1,2,1,5 |

## Sowing and completion

A sow removes all seeds from the chosen nonempty own pit and deposits one at a time in increasing indices, wrapping13→0 and SKIPPING the other side's store. Thus the player skips13 and opponent skips6. A full lap may revisit the source pit. Store seeds can never be selected.

If the last seed lands in an own pit that was empty immediately before that deposit, and its opposite pit `12-last` is nonempty, capture that final seed PLUS all opposite seeds into the mover's store. An empty opposite means no capture; leave the final seed in its pit. Last seed in one's own store grants another sow by the same side, unless the board ends naturally. A player's extra turn suppresses the entire opponent response. A human chooses any nonempty player pit on an extra turn.

After EVERY individual sow and capture, if either side's six pits are all empty, sweep every remaining pit into its OWNER'S store. Compare player store6 with opponent store13: greater wins `majority`; equal loses `tie`; lower loses `minority`. Stores hold all24 seeds after a natural finish. Otherwise, reaching160 total sows ends an unsuccessful draw `sow-limit`; leave the unswept position unchanged. Natural sweep and its score take precedence over the cap. Empty selections and cursor movement never spend a sow. There is no time deadline.

## Deterministic opponent and synchronous burst

Simulate each nonempty opponent pit7..12 using the SAME sow/capture/sweep rules. Choose by this complete ordered comparator:

1. A still-unfinished own-store extra turn first. A naturally terminal own-store sow has extraTurnfalse.
2. Highest captured seed count, INCLUDING the final deposited seed.
3. Highest increase in opponent store, INCLUDING any end sweep.
4. Lowest source pit index.

The simulation does not itself consume a sow or apply the global cap. Once chosen, apply one real sow, increment counters and resolve natural finish before cap. If still playing and it grants an extra turn, choose again by the same comparator. Otherwise return control to the player. The whole opponent burst happens synchronously after one human sow. The160-sow global cap bounds any burst to at most159 opponent sows after a human input, even in an artificial repeating position. Public `lastAiSows` contains the complete bounded burst; the renderer highlights the final sow and reports the burst count. The comparator and all transitions depend only on visible counts.

## Input

Left/right cycle selected player pit modulo6. Up/down ignored. A rising edge sows the selected pit; an empty selected pit is blocked/free. B unused. A wins simultaneous priority over a changed horizontal direction, and suppressed edges are consumed. Held A/directions do not repeat.

Terminal or invalid dt (not a finite JS number in `(0,.25]`) is an exact no-op before input reads. Atomically read only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects/arrays/descriptor exceptions normalize to neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Only horizontal absolute value>.5 is relevant to navigation. Epoch must be nonnegative safe integer.

Pausedtrue is exact no-op. Initial neutral (no A/B/horizontal) arms. First valid epoch establishes baseline. Later epoch change or false→true cancelled edge disarms before actions and cannot rearm that call. Cancelled input never commands; a later noncancelled neutral rearms. Require armed-at-start. Vertical-only input is neutral for this game. No time deadline, but active elapsed includes cancellation calls. Host owns release quarantine. Counters and elapsed saturate.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, exported as CommonJS or window.PureModel. Config defaultSeed770,maxSows160,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,pits}`. Valid seed integer0..4294967295 else770; valid level integer0..2 else0. Seed recorded only; all boards and AI are deterministic.

State: schema1,seed,level,phase playing/won/lost,reason '',majority,tie,minority,sow-limit; score100 iff won else0; pits detached14-element array, selected0,totalSeeds24,playerStore,aiStore; sowCount0,playerSows0,aiSows0,playerCaptured0,aiCaptured0,playerExtraTurns0,aiExtraTurns0; lastPlayerSow null,lastAiSows[],lastSow null,aiBurstCount0; elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message.

Sow receipt `{side,from,seeds,path,last,captured,opposite,extraTurn,storeGain,swept,storesAfter,sowNumber}`: side player/opponent; path lists each deposited index in order (at most24 entries); opposite is captured opposite index ornull; swept `{player,opponent}` counts collected at natural finish; storesAfter `[playerStore,opponentStore]`. extraTurn reflects own-store finish and no natural sweep, before the global cap. lastAiSows resets only on an actual human sow; empty blocked selections preserve the previous trace. Every receipt/state array is detached. No unrestricted full-game history.

Derived store counts refresh on admitted calls and after mutation. External state mutation is unsupported; focused boundary tests may use explicitly labelled synthetic positions. Events at most one per call: cursor `{from,to}`, blocked `{reason:'empty-pit'}`, sow `{player,opponentSows,extraTurn}`, win `{reason}`, collision `{reason}`; terminal result replaces a sow event. All events include call. Terminal receipt is detached `{cause,level,call,elapsed,pits,sowCount,playerSows,aiSows,playerStore,aiStore,lastPlayerSow,lastAiSows,score,phase,reason}`. Terminal state freezes exactly.

## Verification

Ordinary unchanged public positions must each need at least4 human sow actions for a winning route and admit a natural losing route. Independently reproduce the opponent comparator. Cover24-seed conservation after every sow, skipping rival store on wrapped paths, extra turns suppressing AI, capture and empty-opposite exception, end sweep/tie, the160-sow bound and natural result precedence, no-op empty pit, edge/held/cancel/paused/terminal behavior. All solver code remains tests-only.
