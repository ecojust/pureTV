# Shade Duplicates — public model contract

This specification defines rules and evidence boundaries before implementation/testing; it does not claim publication.

## Standard Hitori constraints and boards

Three authored number grids are 4×4, 5×5 and 6×6. Values are public integers 1..size, stored row-major. Every cell is either white or black, initially all white. A toggles the current cell; black cells retain their original readable number. There is no third state, fixed clue, preset black cell or answer lookup.

A submitted board is valid if and only if:
1. Among white cells, each row has no repeated number and each column has no repeated number. Equal numbers at unrelated rows/columns are allowed.
2. No two black cells share an orthogonal edge. Diagonal black adjacency is allowed.
3. All white cells form one nonempty orthogonally connected component. Diagonal contact alone does not connect whites.

Each grid is independently authored to have exactly one legal black/white assignment. The first requires five black cells; later grids require seven and ten. This is test evidence, not a required count or production clue. The model accepts any assignment satisfying the three rules; it does not compare a stored solution. The original desired minimum six black cells is geometrically impossible on 4×4: exhaustive enumeration of all65,536 masks gives a maximum of five under rules2/3. Standard rules and4×4/5×5/6×6 progression are preserved; authoring notes record this boundary.

## Controls and manual checking

Arrows move a cursor within the bounded grid. A toggles black/white freely, with no automatic victory. B manually checks the entire board. Start with three failed-check opportunities: an invalid B decreases checks by one, preserving the board/cursor; the third invalid B loses. A valid B wins before any decrement, including with one check left. Submissions counts every admitted B, successful or not. There is no timer or toggle budget. Input priority B > A > direction; dominant axis selects direction and vertical wins equal magnitudes. No held repeat.

## Public API and state

Export only create(seed,level), step(state,dt,input), deeply frozen config. Config contains defaultSeed783,checkLimit3,maxElapsed86400,maxCounter2147483647,layouts. Layouts contain id/name/nameZh,size,numbers only, never a solution, mask or expected black count. Integer seeds0..4294967295 accepted else783; level0..2 else0. Seed is recorded but does not change puzzles. Create returns fresh state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,size,cursor,black,checks,submissions,toggles,violations,valid,checkHistory,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Cursor is flat index, initially0. Black is a detached boolean array initiallyfalse. Checks3, submissions/toggles0. Phase playing/reason empty/score0. Violations is derived from current black cells and public numbers:
- duplicates: [{axis:'row'|'col',line,value,cells:[sorted IDs]}] for every white repeated-value group with at least two cells. Enumerate rows first then columns, line ascending, value ascending. A cell can participate in both a row and column duplicate.
- adjacent: [{a,b}] for every black orthogonal pair, a<b, sorted by a then b.
- regions: white connected components, each sorted by point ID, ordered by their smallest ID.
- whiteCount: actual count of unshaded cells.

Valid is true exactly when duplicate/adjacent arrays are empty, whiteCount>0 and regions.length=1. Derivation runs initially and after each toggle/check. It contains current constraint facts, not solution hints or an answer oracle.

CheckHistory has at most three detached entries: {submission,valid,checksRemaining,blackCount,duplicateGroups,adjacentPairs,regions,whiteCount}. Success is phase won/reason empty/score100; third invalid check is phase lost/reason checks/score0. TerminalReceipt is detached {cause,call,elapsed,level,black,violations,valid,checks,submissions,toggles,score,phase,reason}; cause success/checks. Terminal freezes every field before input inspection.

Events include call and at most one item: cursor {from,to}; toggle {point,black}; blocked {reason:'boundary'}; reject {checksRemaining,duplicateGroups,adjacentPairs,regions}; win {checksRemaining}; collision {reason:'checks',checksRemaining:0,duplicateGroups,adjacentPairs,regions}. LastCommand b/a/up/down/left/right/none. No-event calls preserve message. Toggles/calls/blockedActions saturate at maxCounter; submissions is bounded by3 because the first successful check or third failure terminates play.

## Input lifecycle

Admit only finite numeric0<dt<=0.25. Invalid dt or terminal state is an exact no-op before reading input. Read only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on a non-null non-array object; ignore getters, inheritance and unknown fields. Descriptor failure discards all partially read data to neutral; nonthrowing Proxy traps may execute. Literaltrue enables flags, finite axes clamp[-1,1], epoch must be a nonnegative safe integer or ignored. Pausedtrue is an exact no-op.

Initially unarmed. A valid changed epoch after baseline or cancelledfalse→true disarms before commands. Every cancelled sample suppresses commands and cannot rearm. A disarm sample cannot rearm. Later noncancelled neutral input (a/bfalse, both axes magnitude<=0.5) arms future commands. Commands require armed at entry and a fresh A/B edge or changed nonneutral direction. Held values are recorded even for suppressed commands. aPressed/bPressed are ignored. Host cancellation guarantees physical release and disconnected-phone isolation.

Admitted unpaused calls increment bounded informational elapsed/calls, clear events/lastCommand, then apply at most one command. Elapsed caps at maxElapsed with sticky elapsedCapped. It never affects puzzle validity or checks.

## Evidence boundaries

Test-only CSP/backtracking must independently prove uniqueness, not read a shipped answer. Ordinary wins toggle derived solutions through create/step and submit B. Synthetic constraint-specific fixtures and4×4 shape enumeration are separately labelled. Browser keyboard/software rendering do not claim physical TV, phone or emulator testing.
