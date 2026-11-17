# PureModel contract — Fleet Ledger0.1.0

Only create(seed,level),step(state,dt,input),deeply frozen config exported. Layouts contain id,names,size,fleet,rows,cols,givens. Givens are0editable,1fixed ship,2fixed sea. Sizes5/6/7; fleets[3,2,1]/[3,2,2,1]/[4,3,2,1,1]. No answer bitmap/ship placements/solver is shipped. Default seed786 is identity only.

## Editor and completion

Marks0unknown/1ship/2sea initially copy givens. A editable cell cycles0→1→2→0; fixed cells reject edits and preserve counters. Arrows move a clamped grid cursor, including fixed cells for inspection. No held repeats or timer.

B with any unknown cell computes feedback for free: incompleteChecks increments, attemptsLeft/checks do not change, no completed check receipt is appended. All unknowns must become explicit ship/sea, even if the already-placed ships meet every structural constraint. B on a complete diagram always consumes one of3 checks. Success on check3 wins before exhaustion; third complete failure loses reason checks. No automatic win.

## General validation

Count all ship cells per row and column; both vectors must exactly match public targets. Build maximal cardinal-connected ship components, with no row wrapping. A component is straight iff all its cells share a row or column; connectivity guarantees contiguity. A singleton is straight. Actual fleet is component lengths sorted descending and must equal the normalized required length multiset, not merely its sum.

NoTouch forbids8-neighbour contact between DIFFERENT cardinal components. Cardinal contact already merges components, so detected inter-component contacts are diagonal. Diagonal cells within the same bent component are handled by straightness, not called contact between separate ships. Thus a bent length3 component may have straightfalse but noTouchtrue/fleetExacttrue; its occupancy is still rejected. Orthogonally touching purported ships cannot be split into separate identities by the user.

A complete solution needs rowsExact,colsExact,straight,noTouch,fleetExact all true. Fixed clue values are protected by every editing command. Validation is derived from current marks and public rules, never compared against an author answer.

## State and feedback

- schema1,seed,level,size,fleet sorted descending,rows,cols,givens,marks,cursor; phase playing/won/lost,reason empty/checks,score100 only when won.
- Live rowCounts,colCounts,unknown,shipCells,seaCells; components[{id,cells,length,straight,orientation}], orientation single/H/V/bent. IDs are stable only for the current row-major component enumeration.
- actualFleet sorted descending; diagonalContacts as unique[cell,to] pairs withcell<to and distinct component IDs.
- edits/editVersion,attemptsLeft0..3,checks0..3,incompleteChecks bounded counter,lastCheck,lastCheckCurrent,checkReceipts,terminalReceipt.
- lastCheck{complete,rowsExact,colsExact,straight,noTouch,fleetExact,matched,unknown,actualFleet,rowCounts,colCounts,components,diagonalContacts,editVersion,charged}. Named predicates are booleans, matched includes complete; charged equals complete.
- Every editable A retains lastCheck but sets lastCheckCurrentfalse. Navigation/fixed blocked A does not stale it. Every B sets currenttrue. This flag is authoritative even at saturated editVersion.
- Only charged complete checks append detached{marks,result} receipts, at most3. Incomplete hints retain one bounded lastCheck, not an ever-growing history. Terminal receipt deep-copies outcome,marks,row/column counts,components,fleet,contacts and lastCheck.
- Standard elapsed/counter/gate,lastCommand,events,message fields. Events reset per admitted call, persistent check data remains.

Public constraints have unique ship occupancies with6/8/11 ship cells and23/33/46 editable cells. Author test solver enumerates legal separated straight ship placements; independent QA enumerates row masks and derives components. Exclusions/unknowns are not alternate solutions: a full valid occupancy determines all sea cells. Ordinary-input counterexamples cover row-only/column-only count mismatches, bent components, diagonal inter-ship contact and correct-area wrong fleet lengths.

## Input lifecycle and bounds

Admit only finite numeric0<dt<=.25; invalid timing,literal pausedtrue and all terminal calls are exact no-ops. Read only own data descriptors; inherited/accessor/pressed flags cannot create actions. Literal booleans required; finite axes clamp[-1,1], dominant>.5 direction, vertical wins ties. FreshB before freshA then changed nonneutral direction.

Fresh state unarmed until neutral admitted sample. Changed nonnegative safe cancelEpoch/rising cancelled disarms; held input cannot edit/check until later neutral. Cancellation retains all editor marks and cursor, with no latent action. Terminal state freezes every field.

Board arrays<=49,marks0..2,component count<=49,completed receipt history<=3. Generic calls,blockedActions,edits,editVersion,incompleteChecks saturate2147483647; elapsed86400. No unbounded edit history or hidden information.
