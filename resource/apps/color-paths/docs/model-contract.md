# Color Paths — public model contract

This document fixes the cell-color Numberlink rules before implementation/testing. It does not claim publication or completed QA.

## Grid and immutable endpoints

Three public square grids have size4/5/6 and3/4/5 endpoint pairs. Flat point IDs are row*size+column, zero-based. A color is also a visible number1..K and a distinct shape: circle, square, triangle, diamond, plus. Each color has exactly two immutable endpoint cells. Endpoints begin with their color; every other cell begins0 (empty).

Public layout fields are id/name/nameZh,size,endpoints:[{color,pair:[pointA,pointB]}]. No path, full color map, solution, expected route or solver ships in assets. Independent induced-path enumeration plus disjoint full-cover search must prove exactly one valid cell coloring for every puzzle.

Arrows move a bounded grid cursor. A cycles a mutable cell0→1→...→K→0; revisiting and recoloring is always allowed. Endpoint A blocks free, with no change or consumed check. B manually checks the board. B > A > direction; dominant axis decides direction and vertical wins equal magnitudes. No held repeat, no timer and no edit budget.

## What counts as a path

Every pair of orthogonally adjacent cells with the same nonzero color automatically connects. Diagonal cells do not connect. The player edits cell colors, not independent edges, so touching the same color sideways also creates an edge and can produce a branch.

A submitted board is valid if and only if:
- Every grid cell is nonempty and has a color1..K.
- Each fixed endpoint retains its prescribed color.
- Each endpoint has exactly one same-color orthogonal neighbor (degree1).
- Each colored nonendpoint has exactly two same-color orthogonal neighbors (degree2).
- For each color, all its cells form one connected component containing both of its fixed endpoints.

These conditions form one nonbranching simple path per color, with no overlaps, gaps, detached cycles or extra components, and cover the whole board. A color can already be complete while other cells remain empty; whole-board victory still requires all conditions.

## Manual checks and state

Start with three failed-check opportunities. An invalid B decreases checks by one and preserves all colors; third failure loses. A valid B wins before any decrement, including the last remaining opportunity. There is no automatic win when the board first becomes valid.

Export only create(seed,level), step(state,dt,input), deeply frozen config. Config includes defaultSeed787,checkLimit3,maxElapsed86400,maxCounter2147483647,shapes,layouts. Seeds integer0..4294967295 accepted else787; level0..2 else0. Seed is recorded but changes neither endpoints nor rules. Creation returns independent state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,size,cursor,colors,endpointMap,checks,submissions,changes,validation,paths,covered,valid,checkHistory,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Cursor flat ID initially0. Colors is the current assignment. EndpointMap is a detached derived array with prescribed endpoint color or0; production endpoint protection uses immutable public layout data. Checks3, submissions/changes0, phase playing/reason empty/score0. Changes counts successful mutable-cell cycles, including clearing; it saturates at maxCounter.

Derived validation is {empty:[sorted IDs],wrongEndpoints:[{point,color,actual}],degreeErrors:[{point,color,actual,expected,endpoint}],disconnected:[{color,components:[[sorted point IDs]]}]}. WrongEndpoints follows public color order and pair order. DegreeErrors follows ascending point ID. Expected is1 for fixed endpoints,2 otherwise. Empty cells have no degree entry. Disconnected contains colors whose cells are not exactly one component containing both prescribed endpoint IDs. Components are internally sorted, ordered by smallest ID.

Paths is [{color,cells:[sorted IDs],components,complete}] in color order. Complete means the two endpoints retain color, exactly one component contains them, and every cell of that color has its required degree. It does not depend on other colors or coverage. Covered counts nonempty cells; valid requires full coverage, no wrong endpoints/degree errors/disconnected colors, and every path complete. These are current public facts, not answer hints. Derivation runs initially and after every cycle/check.

CheckHistory has at most3 detached entries: {submission,valid,checksRemaining,covered,empty,wrongEndpoints,degreeErrors,disconnected,completePaths}; numeric error fields are counts. Won has score100/reason empty; third failure has phase lost/reason checks/score0. TerminalReceipt is detached {cause,call,elapsed,level,colors,validation,paths,covered,valid,checks,submissions,changes,score,phase,reason}; cause success/checks. Terminal calls freeze all fields before reading input.

Events include call and at most one item: cursor {from,to}; cycle {point,from,to}; blocked {reason:'boundary'|'endpoint'}; reject {checksRemaining,empty,degreeErrors,disconnected}; win {checksRemaining}; collision {reason:'checks',checksRemaining:0,empty,degreeErrors,disconnected}. LastCommand b/a/up/down/left/right/none. No-event samples preserve message.

## Input lifecycle

Admit only finite numeric0<dt<=0.25. Invalid dt and terminal state are exact no-ops before input inspection. Only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused are read on non-null non-array objects. Getter/inherited/unknown fields ignored. Descriptor failure discards partial reads to neutral; nonthrowing Proxy traps may run. Literaltrue enables flags, finite axes clamp[-1,1], epoch must be a nonnegative safe integer or ignored. Pausedtrue is an exact no-op.

Initially unarmed. A changed valid epoch after baseline or cancelledfalse→true disarms before commands. Every cancelled sample suppresses commands and cannot rearm. A disarm sample cannot rearm. A later noncancelled neutral sample (a/bfalse, both axes magnitude<=0.5) arms subsequent commands. Commands require armed at entry and A/B rising edge or changed nonneutral direction. Held values are recorded even when suppressed. aPressed/bPressed are ignored; host isolation requires physical release after cancellation or phone disconnection.

Each admitted unpaused sample advances bounded informational elapsed/calls, clears events/lastCommand and applies at most one command. Calls/blockedActions/changes saturate maxCounter. Elapsed caps maxElapsed with sticky elapsedCapped; it never determines victory or checks.

## Evidence boundaries

Test-only path enumeration must respect automatic same-color adjacency, avoiding chords in a path, before searching disjoint full covers. Ordinary victories color cells via create/step and submit B; rule-specific counterexamples and synthetic disconnected cycles are labelled separately. Browser keyboard/software rendering is not physical TV, phone or emulator testing.
