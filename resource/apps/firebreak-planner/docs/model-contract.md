# 防火带：模型合同

Version 0.1.0. The authored maps and rules below are public. Feasibility design, synthetic unit fixtures, ordinary gameplay and hardware testing are separate evidence scopes.

## Public rules

- The board uses four orthogonal neighbours, row/column coordinates starting at zero, and stable cell IDs `C0` … `C(rows*columns-1)` in row-major order. Cursor starts on the central high-fuel ignition cell, as specified below. Grid navigation clamps at the boundary; every cell can be selected.
- `F` is standing forest with initial fuel 3 fire steps. `X` is an already-burning coarse-timber forest cell with the explicitly listed higher fuel. `.` is cleared natural ground, `~` is wetland, and `V` is an intact village. Both ground and wetland completely block heat transmission. There are no diagonal neighbours, jumping embers or paths through a blocker.
- One fire step occurs every 120 completed 60 Hz ticks (2 seconds). The first is at tick 120. No minimum viewing period delays victory: remaining fire fuel determines when the last fire expires.
- Heat is an integer 0…5. Standing forest and intact villages begin at zero; heat persists without cooling. An old burning neighbour contributes 3 along the wind vector, 2 perpendicular to it, or 1 against it. Contributions from all old burning neighbours add. Cap accumulated heat at 5; reaching 5 ignites standing forest or destroys a village.
- **All propagation is simultaneous.** Capture the old burning set, compute all target heat from that set, then commit all heat/ignitions and decrement each old burning cell's fuel by one. Even its last fuel unit contributes. Newly ignited forest starts with its full initial fuel and cannot contribute until the next fire step. Fuel reaching zero becomes burnt ground and cannot reignite. Heat on newly cleared/burnt cells is zero.
- The immutable terrain remains `forest` for initial forest cells even after clearing/burning; its status distinguishes standing, burning, burnt and player-cleared. Ground/wetland are permanently inert. Villages are separate from forest, with intact/destroyed status.
- A fresh A edge clears the selected **standing forest only**, immediately sets its heat/fuel to zero, and spends one AP. Burning, burnt, already-cleared, ground, wetland and village cells are invalid. Insufficient AP or invalid targets give a blocked receipt, spend no AP and do not undo prior work.
- B toggles a terrain/heat-map view. It spends no AP, clears nothing, refunds nothing and does not pause the clock. All physical fields and the full wind schedule are always public, independent of this display mode. A/B held buttons act once per fresh edge. B has priority and suppresses A/navigation on the same tick; otherwise navigation precedes A. Standard 0.25 dominant-axis navigation (horizontal tie, first step immediately, held repeat after 20 ticks then every 10) applies.
- The forest denominator is the fixed number of initial F+X cells, including initial ignitions. The surviving numerator is **standing forest only**: player-cleared, currently burning and burnt cells all count as forest loss. Required standing count is `ceil(initialForestCount*7/10)`, using integers `(7*N+9)//10`.
- On each completed tick: process input, advance the clock; when due, execute one fire step using its numbered weather entry; then check destroyed village first, standing count below its floor second, no burning cells third (win), and 90 seconds last (timeout). Thus a lawful cut on the same tick precedes that fire step; no-village/adequate-forest extinction on the last budget tick wins. Pause freezes all ticks, heat, fuel, weather and input effects. Terminal state freezes; retry restores the authored map/AP/cursor/weather.
- Score is zero before a win; a win scores `1000 + 10*standingCount + 25*apRemaining`. There is no elapsed-time bonus or score-based survival exception.

## Fixed maps and weather

All rows below are literal maps, not suggested cuts. Wind names describe the direction heat travels: N=(0,-1), E=(1,0), S=(0,1), W=(-1,0). Entries select by the **fire step about to execute**, starting at step 1. After each step, show that actual wind separately from the upcoming step's wind; the full schedule remains readable.

### Level 1 — 山口初防 / Ridge Watch

9 columns × 7 rows; AP 2; cursor (3,3). X at (3,3) has fuel 16.
Wind: steps 1–2 N, 3–6 W, 7–10 S, 11 onward E.

```text
..FFFFVFF
...F.....
...F.....
FFFX~....
...F.....
...F.....
FFFFFFFFF
```

### Level 2 — 双村岔口 / Two Villages

9 columns × 9 rows; AP 3; cursor (4,4). X at (4,4) has fuel 20.
Wind: steps 1–3 E, 4–6 N, 7–12 W, 13 onward S.

```text
..FFFFVFF
....F....
....F....
....F....
FFFFXFFFV
....F....
....F....
....F....
FFFFFFFFF
```

### Level 3 — 湿地守望 / Wetland Watch

9 columns × 9 rows; AP 3; cursor (4,4). X at (4,4) has fuel 24; X at (1,1) has fuel 12. The latter is genuinely surrounded by wetland. This is an authored second ignition, not a runtime fixture.
Wind: steps 1–3 S, 4–6 E, 7–12 N, 13 onward W.

```text
.~..F..FF
~X~.F.~..
.~..F....
....F....
VFFFXFFFF
....F..FF
....F..FF
....F..FF
..FFVFFFF
```

## Production interface and public observation schema

`PureModel.create(seed, difficulty)` returns a new detached state; difficulty 0/1/2 selects the three maps (finite inputs floor/clamp). Seed is retained for provenance; these three authored maps contain no randomness. `PureModel.step(state, dt, input)` is the only progression API. No solve, force-win or level-completion API exists. `TICK_HZ` is 60.

The complete next tick is labelled before processing its input effects. An operation accepted on tick120 is stamped120; its clear is applied before propagation at tick120. Exact input/wave coincidence therefore has one unambiguous order. Elapsed is tick/60. `dt` is clamped to0..0.25; non-finite dt contributes0 time. An accumulator preserves partial ticks. Input edges may be latched before a whole tick and are consumed once. Terminal states return unchanged including input latches. Pausing and disconnect handling live in the shared runtime, which does not step the model while paused.

- `width,height` are the960×540 rendering coordinate system. `columns,rows` describe the board. `authoredMap,authoredIgnitions`, `level,levelName,levelNameEn`, `difficulty,seed` identify immutable initial data.
- `cells` is row-major. Each cell has stable `id` (`C` plus row-major index), `row,column,terrain,initialFuel`, and mutable `status,heat,fuelRemaining`. Terrain is forest/ground/wetland/village. Forest statuses are standing/burning/burnt/cleared; village statuses intact/destroyed; inert terrain status inert. Initial X cells have heat5 and burning status. All other cells start heat0. Non-forest fuel is0. A burnt or cleared cell has heat0/fuel0, and cannot receive heat or re-ignite.
- `cursor:{row,column}` always identifies a selectable board cell. `viewHeat` is a display toggle; B changes it without changing AP, heat or fuel. All ordinary clocks continue while that display is active.
- `ap:{initial,remaining,spent}`, `clearCount`, and `clearReceipts` retain accepted cuts. Spent equals clearCount, receipts length and the number of cleared forest cells; initial equals remaining+spent. Receipts are bounded by initial AP, at most3.
- `forest:{initial,minimum,numerator:7,denominator:10,standing,burning,burnt,cleared}` uses immutable initial terrain counts. The four status counts sum to initial, and minimum uses the integer formula above. `villages:{initial,intact,destroyed}` is counted separately.
- `fuel:{initial,remaining,burned,cleared,error}` is an integer conservation ledger. Fuel.initial equals the sum of initialFuel. Fuel.remaining is the sum of all current fuelRemaining. Each old burning cell spends exactly1 per wave, counted in fuel.burned. Clearing discards all that standing cell's remaining fuel into fuel.cleared. `error=initial-remaining-burned-cleared` must stay0. Initial fuel in a standing cell is not spent merely because it is warm.
- `physics:{tickHz,fireStepTicks,ignitionHeat,downwindHeat,crosswindHeat,upwindHeat,ordinaryFuel}` exposes60/120/5/3/2/1/3. The full immutable `weather` array consists of `{from,direction}` segments, with from an inclusive fire-step number.
- `fireStep` counts completed waves. `lastWind` is null before the first wave, then the wind actually used by the last wave. `nextWind` is the direction that the next numbered wave will use. `nextFireTick=(fireStep+1)*120` and `secondsToFireStep=(nextFireTick-tick)/60`; they distinguish the next event from the last event. These values freeze in terminal states with the rest of the model.
- `lastWave` persists between waves. It contains `step,fromTick,toTick,previousWaveTick,wind,oldBurningIds,contributions,changes,ignitedIds,burntOutIds,destroyedVillageIds,fuelConsumed`. The wave is instantaneous on toTick; fromTick is toTick-1, while previousWaveTick is toTick-120. Every contribution is an actual old-source-to-eligible-target `{from,to,direction,amount}`. `changes` contains each affected target and each old burning source once, with `{id,before,after,addedHeat}`; before/after contain status/heat/fuelRemaining. addedHeat is the uncapped incoming sum, not the clamped heat delta. Source fuel rows have addedHeat0. This snapshot follows any cut accepted on the same tick. No heat transfer goes to non-standing forest, destroyed villages or inert terrain.
- `phase` is playing/won/lost. `lostReason` is null, village, forest or timeout. Failure stores reason/tick/destroyedVillageIds/standing/minimum. `timeLimit`90, `elapsed,remaining,tick`, `score,message` expose current status. Score is zero for playing and lost; on victory it is exactly1000+10×standing+25×APremaining.

## Inputs, receipts and bounds

Input uses normalized x/y and fresh A/B edges (`a,b,aPressed,bPressed`). Dominant axis and .25 deadzone follow the rules above. Zero direction clears the repeat tracker. Boundary movement clamps and creates no false cursor event. B suppresses navigation and A on that tick; otherwise navigation then A means a simultaneous direction+A clears the newly selected cell.

`cancelled` or a changed finite `cancelEpoch` clears pending A/B and direction-repeat state. The current sample is suppressed; cancellation spends no AP and does not pause a progressing game. A/B currently held during cancellation remain held in the edge tracker and need neutral release before another level-triggered edge. Explicit aPressed/bPressed pulses are fresh-edge inputs supplied by the runtime after its own quarantine.

`commandCount` counts accepted clear/view operations; `lastOperation` has distinct operation `id,type,tick,at`. Clear includes cellId, before/after cell state and apBefore/apAfter. Each clearReceipts entry is a detached copy of that complete clear lastOperation, with the same operation id; it has no separate commandId field. View includes viewHeat. Every accepted operation also creates a command event with its own event id and commandId. Invalid A increments `blockedCommands`, stores `lastRejected:{tick,cellId,reason}`, emits blocked, and leaves AP/accepted operation IDs unchanged. Reason is not-standing-forest before no-ap when both apply.

`eventCount` is monotonic; `events` contains only the most recent step call, bounded to256; `lastEvent` persists. Events are cursor, command, blocked, fire-step, won or lost. Fire-step has the distinct wave step number, actual wind, oldBurningIds and the three actual result lists. Navigation and B toggles never alter the immutable weather or cell terrain/fuel capacities. Underscore-prefixed values are internal latches/accumulator only; rendering and public strategy must not inspect them.

Ordinary evidence should retain every actual wave and accepted/blocked command with full before/after state, plus sparse checkpoints. Synthetic unit fixtures that replace cells/ticks/AP/floors must be explicitly labelled and are not ordinary wins. Browser captures require neutral real-input observation windows; they must not substitute a planned cellular state for a played one.
