# Queen Constellation — public model contract

Public rules established before implementation/execution. This file is not a test or release claim.

## Three visible puzzles

Cells use zero-based `row*size+column` IDs. All fixed queens and blocked cells are visible from the beginning.

| Level | id / English | 中文 | Size | Blocked IDs | Fixed queen IDs |
| --- | --- | --- | --- | --- | --- |
| 0 | aurora-six / AURORA SIX | 六芒初航 | 6 | 0,5,14 | none |
| 1 | orbit-seven / ORBIT SEVEN | 七曜轨道 | 7 | 0,6,42,48,24 | 22 |
| 2 | eclipse-eight / ECLIPSE EIGHT | 八方星域 | 8 | 0,7,56,63,27 | 20,40 |

Place exactly `size` queens total, including fixed queens. No pair may share a row, column or diagonal. A diagonal conflict means absolute row difference equals absolute column difference. Queens cannot occupy blocked cells. Fixed queens cannot be removed. There is no hidden target placement; every placement satisfying these public conditions is accepted.

The player may place conflicting queens while planning. Conflicts are shown immediately. Merely reaching a valid arrangement never auto-wins: B must submit it. Every B spends one of3 checks. A valid third/final check wins before exhaustion is considered. The third invalid check loses. Placements, removals, cursor navigation and blocked attempts cost no checks. There is no time limit.

## Controls

Arrows move the cursor in its row/column, clamping at board edges. A toggles a queen on the current free cell. A on a fixed or blocked cell is a free blocked attempt. An existing movable queen can always be removed; adding another beyond `size-fixed.length` movable queens blocks free. B submits the current board. Input priority is B>A>direction, consuming suppressed new edges without queueing.

## API and state

Expose only `create(seed,level)`, `step(state,dt,input)` and deeply frozen `config` through CommonJS/window.PureModel. Config is `{defaultSeed:757,checkLimit:3,maxElapsed:86400,maxCounter:2147483647,layouts}`. Layouts contain only the public fields shown above, with `name,nameZh` separated. There are no solution vectors, solvers, routes, randomness, I/O or state setters in shipped assets.

Valid seed is an integer0..4294967295, otherwise757; valid level an integer0..2, otherwise0. Seed is recorded without changing the puzzle. Create returns an independent state; step mutates and returns it. State fields are `schema,seed,level,phase,reason,score,cursor,queens,queenCount,movableCount,conflicts,canSubmit,checksRemaining,submissions,placements,removals,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,checkReceipts,terminalReceipt,message`.

Queens is a boolean array of lengthsize², initially true only at fixed IDs. Cursor starts0. Phase initially playing, score0, reason empty, checksRemaining3, submissions0, placements/removals0. Conflicts is a detached ordered array `{a,b,kind}` with a<b and kind row/column/diagonal. Pair order is ascending a then b. `queenCount` counts all true cells; `movableCount` counts occupied nonfixed cells. `canSubmit` requires exact queenCount=size, zero conflicts, all fixed occupied and all blocked empty. Judging uses immutable layout clues, not renderer state or stale conflict caches. Recompute all derived fields at create, after placement/removal and before every B.

No ordinary state exceeds size queens. Fixed queens remain occupied and blocked cells remain empty. ChecksRemaining stays0..3 and submissions=3−checksRemaining; playing always has at least1 check. Score100 iff won, otherwise0. Reason is empty/ checks. Events has at most one item; checkReceipts at most3. Counters calls/blockedActions/placements/removals saturate at2147483647. Elapsed is informational and capped86400 with sticky elapsedCapped. No history of cursor or placement actions grows indefinitely.

## Input lifecycle

Terminal state and invalid dt return exact no-op before reading input. Admit only finite numeric `0<dt<=.25`. Input normalization reads own data-property descriptors for x/y/a/b/cancelEpoch/cancelled/paused from a nonnull nonarray object; ignore getters, inherited and unknown fields. Descriptor failure discards the whole sample to neutral. Nonthrowing Proxy traps may run. Only literaltrue enables booleans; finite numeric axes clamp[-1,1]; valid cancelEpoch is a nonnegative safe integer. Normalized pausedtrue is an exact no-op.

A direction exists only when at least one axis magnitude>.5. The dominant axis wins, vertical on ties. Positive x/y means right/down. Held unchanged directions/buttons do not repeat; direct changes between nonneutral directions create edges. aPressed/bPressed are ignored. Every admitted sample records the held values even when suppressed.

Initially unarmed, the model needs a noncancelled full-neutral sample. A changed valid epoch after baseline or false→true cancelled disarms before commands. Every cancelled sample suppresses commands. A disarm sample cannot itself rearm; a subsequent admitted noncancelled full-neutral sample is required. Commands require armed at entry. The host, not model-neutral input, establishes physical release and handles phone disappearance.

Each admitted unpaused call advances bounded time/calls, clears events/lastCommand, then applies at most one command. No-event calls preserve message. Invalid/paused/terminal calls preserve all fields.

## Events and receipts

Events carry type/call: cursor `{from,to}`, place/remove `{position,queenCount}`, blocked `{reason}`, reject `{queenCount,conflictCount,checksRemaining}`, win `{queenCount,checksRemaining}`, collision `{reason:'checks',queenCount,conflictCount}`. Blocked reasons are boundary/fixed/forbidden/queen-limit. All blocked attempts increment saturating blockedActions.

Every B derives the current arrangement, decrements checksRemaining and increments submissions. Record detached `{index,call,queens,queenCount,movableCount,conflicts,matched,checksBefore,checksAfter,outcome}`. Outcome playing/won/lost. Match wins first, otherwise zero remaining loses, otherwise reject and continue. A failed check preserves all placements, so they can be repaired without losing them. A valid board can be altered again before submission.

Every terminal transition also captures detached `{cause,call,elapsed,level,cursor,queens,queenCount,movableCount,conflicts,checksRemaining,submissions,score,phase,reason}`; cause success/checks. No receipt shares mutable arrays or conflict objects with live state or another receipt. No later call changes terminal state.

## Verification

Test-only DFS may solve the public puzzles. Ordinary winning runs must toggle through normal inputs and submit. Synthetic cache/normalization probes must be labelled. Browser keyboard operation is separate from physical TV/phone/emulator validation.
