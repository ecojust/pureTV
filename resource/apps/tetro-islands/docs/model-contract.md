# Pure model contract

`PureModel` exports only `create(seed, level)`, `step(state, dt, input)` and deeply frozen `config`. Defaults: seed789, level0. The three layouts expose only identifiers, translated names, size, regionCount and row-major `regions`. No answers, private routes, random placement or shipping solver exist. All generated states are detached from config and one another.

The partition covers every cell with IDs0..regionCount−1; each public region is cardinal-connected, larger than4 cells, and admits at least2 I/L/T/S placements. All3 complete black occupancies are independently unique. Production validation accepts any legal occupancy, without comparing an answer board.

State includes size/regionCount/regions; `marks`0unknown/1black/2white; cursor0..n²−1; black ID array and blackCells/whiteCells/unknown counts; regionCells, regionCounts, regionConnected booleans and regionTypes; squares and contacts; globalConnected; phase playing/won/lost, reason, score; edits/editVersion, attemptsLeft, checks/incompleteChecks, lastCheck/lastCheckCurrent, checkReceipts and terminalReceipt. Type is I/L/T/S/O or `invalid` (wrong size or disconnected). O is classified for feedback but rejected. A degree/bounding-box validator distinguishes all free tetrominoes. The production classifier does not enumerate placements.

Cardinal neighbors never wrap. I/L/T/S shape classification identifies all rotations and reflections; O is forbidden. Every region must contain exactly4 black cells and a legal connected shape. The union of all black cells must be cardinal-connected. Every ordinary2×2 cell square must contain at least one nonblack cell. For every cardinal black contact across different regions, both types must be legal and different. Equal types may exist if their regions' black cells do not touch. `squares` contains four-ID arrays, `contacts` contains `{cells:[a,b],regions:[idA,idB]}` with a<b. White cells need not connect. Unknown cells are not black but prevent a successful check.

Arrows move one cell and clamp at the edge. A cycles selected mark0→1→2→0; updates derived geometry and invalidates lastCheckCurrent without discarding lastCheck. No auto-win. B derives:

- complete, regionExact (all counts4), shapeValid (all I/L/T/S), globalConnected, noSquares, differentTouching, matched (all previous true);
- unknown, copies of regionCounts/regionConnected/regionTypes/squares/contacts, editVersion and charged.

If incomplete, lastCheck is a free hint, incompleteChecks increases and checks/attempts/receipts stay unchanged. A complete check increments checks, decrements attemptsLeft, and appends detached `{marks,result}` to checkReceipts. Matched wins before zero-attempt loss, so a correct third charged check wins. Three complete rejected checks lose with reason `checks`. Terminal score100 for a win,0 otherwise; terminalReceipt is detached. All model calls freeze exactly after terminal. No timer, undo or hidden phase.

Input protocol: admit finite0<dt≤.25 while playing and not paused. Input uses own data descriptors only; literal boolean buttons and finite clamped axes. Dominant axis >.5 selects direction, with vertical ties. Start disarmed: neutral arms. A fresh B edge outranks A, which outranks a changed nonneutral direction; held inputs never repeat. Changed nonnull cancelEpoch or rising cancelled quarantines until neutral. Paused/invalid-time calls are exact no-ops. Admitted calls reset current events/lastCommand. Counters saturate2147483647, elapsed saturates86400; at most3 receipts and n² cells bound state growth. `lastCheckCurrent` is authoritative even if the editVersion counter saturates.

Public test solvers and independent reference live only under tests. Test ordinary pilots use public snapshots and keyboard-equivalent inputs. The authoring search and bounded search experiments do not enter production assets.
