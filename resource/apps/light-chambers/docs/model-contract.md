# PureModel contract — Light Chambers0.1.0

Only create(seed,level),step(state,dt,input),deeply frozen config exported. Layouts contain id,names,size and row-major walls: nullwhite,−1plain black wall,0..4numbered black wall. Sizes5/6/7. No bulb-answer bitmap, test solver or author solution exists in production. Default seed785 is reported identity, not randomization.

## Editing and geometry

Cursor always selects a white cell during valid play. Arrow scans along that row/column, skipping any walls until the nearest white cell or the board edge. If none found, blocked/free. The authored white cursor graphs are connected. A wall-edit guard remains explicit even though normal cursor navigation cannot select a wall.

A cycles marks0empty→1bulb→2excluded→0. Marks on walls remain0. Excluded cells are ordinary white cells for light propagation and validation. They never block rays, contribute to wall counts or constrain solution uniqueness. Editing may intentionally violate constraints; no automatic failure or success.

Every bulb illuminates its own cell, plus straight cardinal rays until any wall or boundary. Other bulbs do not stop rays. Both endpoints of any visible bulb pair are listed as conflicts. Diagonal bulbs cannot directly light or see one another. Every numbered wall counts only cardinal adjacent bulbs, never diagonals, exclusions or distant bulbs; zero is an active exact constraint, plain−1 is not.

B always consumes one check, including an empty/incomplete board. Check succeeds iff every white cell is lit, no bulb conflicts, and all numbered walls have exact counts. Check three succeeds before exhaustion loss is evaluated. Third invalid check loses reason checks. No timer or auto-win. Correctness is evaluated from rules, not against an answer layout.

## State and feedback

- schema1,seed,level,size,walls copy,marks,cursor; phase playing/won/lost,reason empty/checks,score100 only when won.
- lit:boolean[] withfalse on walls; conflicts sorted bulb cell IDs; wallCounts number only at numbered walls, null elsewhere.
- counts{totalWhite,litWhite,bulbs,conflictingBulbs,numberedWalls,matchedWalls}. Refreshed after every A edit, derived from actual marks and public walls.
- edits,editVersion; attemptsLeft0..3,checks0..3; lastCheck ornull,lastCheckCurrent,checkReceipts,terminalReceipt.
- lastCheck{allLit,noConflicts,wallsExact,matched,litWhite,totalWhite,bulbs,conflicts,wrongWalls,editVersion}. Four named predicate fields are booleans; matched is their conjunction. wrongWalls lists numbered cells whose actual count differs from its clue.
- A preserves the previous lastCheck but sets lastCheckCurrentfalse. A new B sets ittrue. Navigation alone does not stale a check. The boolean remains authoritative when bounded editVersion saturates.
- Each checkReceipts entry deep-copies marks and result. At most3 entries. terminalReceipt deep-copies outcome,marks,lit,conflicts,wallCounts,counts,checks,attemptsLeft,lastCheck. No alias to live editor arrays.
- Standard elapsed/counters/input gate,lastCommand,events,message. Events are current admitted-call diagnostics and clear after neutral samples.

Public-constraint solvers prove unique7/11/12-bulb arrangements for18/26/32 white cells. Removing any one of4/5/6 numbered clues admits a second arrangement. These are independent test facts, never validation shortcuts. Ordinary-input counterexamples isolate each constraint: unlit cells with exact walls/no conflicts; visibility conflict with full lighting/exact walls; wrong walls with full lighting/no conflicts.

## Input lifecycle and bounds

Only finite numeric0<dt<=.25 admitted; invalid timing,literal pausedtrue,all terminal calls exact no-op. Only own data descriptors are read; accessors/inherited keys/pressed claims ignored. Buttons require literaltrue. Finite axes clamp[-1,1], dominant magnitude>.5 direction selected, vertical wins ties. FreshB has priority over freshA then changed nonneutral direction.

Fresh state unarmed; neutral admitted sample arms. Changed nonnegative safe cancelEpoch or rising cancelled disarms. Held input cannot edit/check until later neutral rearm; no held button or direction repeat. Cancellation preserves puzzle edits and cursor without an extra operation.

Board arrays<=49,mark0..2,cursorwhite cell,check history<=3. Generic calls/blockedActions/edits/editVersion saturate2147483647 and elapsed86400. No unbounded edit history. Terminal state freezes all fields exactly. The only wall-cursor test fixture is explicitly synthetic; ordinary solver/browser plays use normal white-cell navigation.
