# PureModel contract — Traffic Escape 0.1.0

Only `create(seed, level)`, `step(state, dt, input)` and deeply frozen `config` are exported. Public config includes `size:6`, `exitRow:2`, `targetId:0`, `initialUndoTokens:3`, numeric bounds and all fixed layouts. A layout contains names, moveLimit and cars `{id,axis:'H'|'V',length:2|3,x,y,target:boolean}`. IDs equal array indices. Coordinates are zero-based top/left anchors; display labels are id+1. Only id0 is the horizontal length2 target on row2. Public-layouts.json mirrors this data. No solver or solution path is shipped as an asset.

## Selection, movement, exit and undo

The cursor is a cell0..35. While unselected, arrows move it one row/column with boundaries clamped. A selects the car occupying that cell; an empty cell is blocked. While selected, A releases that car without moving it. Arrows instead request a unit slide on its fixed axis. Wrong-axis, occupied and boundary requests do not alter positions or movesUsed. There is no hold repeat.

Every valid slide stores a detached snapshot of all car positions and the pre-slide cursor, translates the car by one cell, increments movesUsed and translates the cursor by the same delta. The cursor therefore stays on the selected vehicle at its original relative cell. Coordinates are clamped0..5 for the one terminal exit case.

Exit is allowed only for id0, target=true, H, length2, row2, x4 receiving a right slide. It sets target x5 and escaped=true, counts one move and immediately wins before testing the budget. The target's second cell is then outside the board atx6. Public occupancy lists only its in-bounds cellx5; no other car can leave, and no car is removed before this actual exit action. A terminal leading-cell cursor remainsx5 instead of wrapping into the next row. All nonterminal vehicles are wholly inside the grid and nonoverlapping.

If an ordinary slide reaches moveLimit without exiting, phase becomes lost with reason moves. Releasing/selecting, cursor motion, invalid requests and undo are free, but cannot be used after terminal freeze.

B succeeds only with a nonempty history and an undo ticket. It pops the last snapshot, restores positions and its saved cursor, clears selection, consumes one ticket, increments undos and clears lastSlide. It does not decrement movesUsed or incur an extra move. Empty-history/zero-ticket B leaves selection unchanged. Undo has no redo. History cannot exceed movesUsed or moveLimit, because only successful slides push and undo pops. No timer.

## State

- Identity: schema1,seed,level. Defaults seed772/level0; seed never randomizes layouts.
- Outcome: phase playing/won/lost; reason empty/moves; score100 only when won; escapedboolean.
- `cars`: detached mutable public descriptors/positions. `occupancy`:36 integers, -1empty or car ID, recomputed after moves/undo; terminal exit clips out-of-board cells. `cursor`:cell0..35; `selected`:car ID or null.
- `movesUsed`, `moveLimit`30/45/60; `undoTokens`0..3, `undos`0..3.
- `history:[{positions:[{x,y}],cursor}]`, bounded by moveLimit; no alias with live positions. `lastSlide:{car,from:{x,y},to:{x,y},exit:boolean}` or null.
- `terminalReceipt` deep-copies cars,occupancy,cursor,selected,budget,tokens,undos and outcome. It does not alias live arrays/objects.
- Input gate, calls,blockedActions,elapsed,elapsedCapped,lastCommand,events,message follow the contract below. `events` retains the event from the current admitted call only; neutral samples clear it. Renderer uses persistent state rather than transient events for selection and placement.

Every layout is nonoverlapping with6/8/10 cars, contains length3 vehicles and starts with a non-exited target. Test-only BFS proves shortest unit-slide exit distances8/11/13, including the exit action. Those distances exclude cursor/select/release input cost. Production does not consult those routes.

## Input lifecycle

Admit only finite numeric0<dt<=.25. Invalid dt, literal pausedtrue and all terminal calls are exact no-ops. Inputs are read only from own data descriptors, never getters or inherited fields. Buttons require literaltrue; finite axes clamp to[-1,1]. The dominant axis above.5 supplies one direction, vertical wins ties. Fresh B has priority over fresh A, then changed nonneutral direction. No reported pressed/released flags are used.

Fresh state starts unarmed. A fully neutral admitted sample arms it. A change of a nonnegative safe cancelEpoch, or a rising literal cancelled, disarms it. Held input after cancellation cannot execute until a later neutral sample rearms. Selection is retained through cancellation but no latent slide or undo occurs. Subsequent explicit fresh input works normally.

Elapsed saturates at86400 seconds; generic counters at2147483647. Moves and history are bounded by60, tickets/undos by3, cursor and positions by the fixed board/one terminal target extension. Tests that change a board to probe other-car exit permission are labelled synthetic; ordinary model and browser wins use actual layouts and public input only.
