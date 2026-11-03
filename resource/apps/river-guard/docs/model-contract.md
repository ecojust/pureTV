# River Guard / 渡河守则 — public model contract

Written before implementation. A farmer pilots a boat between bank0 (left/start) and bank1 (right/goal). Each cargo item always belongs to exactly one bank. Capacity counts cargo only; the farmer has a separate seat and always crosses with the boat. A bank is unsafe only when it contains both members of a listed undirected conflict pair AND the farmer is absent. Animal knowledge is not a rule source; the published numbered pairs are the whole rule.

## Three public graphs

All items and farmer start at bank0; no initial cargo selected. IDs below are zero-based; UI labels are ID+1.

| Level | ID / English / 中文 | Items in index order | Conflict pairs | Capacity / crossing limit |
| --- | --- | --- | --- | --- |
| 0 | familiar-crossing / FAMILIAR CROSSING / 经典渡口 | fox狐狸,hen母鸡,grain谷物 | [0,1],[1,2] | 1 /12 |
| 1 | garden-boat / GARDEN BOAT / 菜园小舟 | goat山羊,cabbage卷心菜,turnip萝卜,beans豆苗 | [0,1],[0,2],[0,3] | 2 /14 |
| 2 | chain-of-care / CHAIN OF CARE / 连环照看 | cat猫,bird鸟,grub虫,leaf叶子,goat山羊 | [0,1],[1,2],[2,3],[3,4] | 2 /18 |

Independent graph search finds minimum7/5/7 crossings. The graphs are P3, K1,3 and P5. They are all public, distinct and solvable. No solver or winning route is present in production assets.

## Controls and atomic crossing

All directions navigate the entire fixed item roster cyclically: left/up previous, right/down next. The roster does not reorder when cargo changes banks. A toggles the focused item in the planned cargo list. Adding requires that the item is at the farmer's bank and the list is below capacity. Removing a selected item is free. Selection does NOT move the item yet: its bank changes only when the boat crosses. Wrong-bank/capacity actions are blocked and spend no crossings.

B crosses to the other bank with all selected cargo; empty crossings are valid. Apply farmer and all cargo bank changes atomically, increment crossingsUsed once, and clear the cargo list. Record the exact carried IDs in lastCrossing before clearing. Check the now-unattended departure bank against every conflict pair. If any pair remains there, lose `danger`; preserve every conflicting pair in dangerPairs. If safe and all items AND the farmer are at bank1, win `delivered`. Otherwise, reaching crossingLimit loses `crossings`. Precedence is danger, delivered, budget. There is no undo and no timer. Loading choices, navigation and rejected operations have no resource cost.

Normal solutions always finish on an odd crossing, while requested budgets12/14/18 are even. Therefore a victory on the exact last budget is unreachable from these normal starts by parity. Precedence is still enforced generally and tested by an explicitly synthetic boundary fixture; ordinary wins and actual budget losses are tested separately, without claiming a natural last-budget win.

## Public API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, exported as CommonJS or window.PureModel. Config defaultSeed773,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,items:[{id,name,nameZh}],conflicts,capacity,crossingLimit}`. Valid seed integer0..4294967295 else773; valid level integer0..2 else0. Seed only recorded.

State: schema1,seed,level,phase playing/won/lost,reason '',danger,delivered,crossings; score100 iff won else0; items and conflicts detached from config; sides array of bank0/1 values; farmer0,selected0,cargo[],capacity,crossingsUsed0,crossingLimit,bankCounts[itemCount,0],deliveredCount0,dangerPairs[],lastCrossingnull;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

lastCrossing `{from,to,cargo,unattended,unsafePairs,crossing}` contains detached arrays. Items remain one per sides entry, and cargo is a bounded unique subset of the farmer's bank. bankCounts and deliveredCount refresh on admitted calls and after crossings. No unrestricted action history. External state mutation unsupported; focused boundary tests are explicitly synthetic.

Events at most one per call, include call: cursor `{from,to}`, board/unboard `{item,cargo}`, cross `{from,to,cargo}`, blocked `{reason:'other-bank'|'capacity'}`, win `{reason}`, collision `{reason}`. Terminal result replaces the cross event. Terminal receipt detached `{cause,level,call,elapsed,sides,farmer,crossingsUsed,crossingLimit,dangerPairs,lastCrossing,score,phase,reason}`. Terminal state freezes exactly.

## Input lifecycle

Terminal and invalid dt (not finite JS number in `(0,.25]`) exact no-op before input reads. Atomically normalize only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid objects, arrays and descriptor exceptions become neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]. Dominant axis>.5 selects a direction; vertical wins ties. Epoch nonnegative safe integer or ignored.

Pausedtrue exact no-op. Initial full-neutral arms. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before commands and cannot rearm that call. Cancelled input never commands; later noncancelled full-neutral rearms. Require armed-at-start: B rising edge, else A rising edge, else changed nonneutral direction. Suppressed simultaneous edges are consumed; held inputs never repeat. Cancellation does not unload planned cargo. Host owns device release quarantine. Counters and active elapsed saturate; active cancellation calls advance elapsed, but there is no deadline.

## Verification

Ordinary3wins with independent shortest search, cargo conservation and both-bank safety after every crossing; capacity, location, unboarding and empty-return behavior; farmer supervision; natural dangerous departures and budget losses; explicitly synthetic last-budget victory precedence; immutable config, receipt detachment, initial/held/cancel/paused/terminal behavior. Public snapshots alone suffice for browser planning; solver and routes remain test-only.
