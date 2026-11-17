# 电芯交换 / Battery Exchange — implementation contract

This is the public implementation contract for game 26. All authored electrical parameters and stage requests are fixed below. It describes a simplified circuit game, not a full electrochemical battery model. The six individual cells have actual different initial charge (coulombs) and internal resistance; the load power, current split, consumption and heat follow the published circuit, not a display-only meter.

Creation uses finite Math.trunc(seed)>>>0 or default 528; seed is metadata and changes no authored cell or request. Finite difficulty is floored then clamped to 0..2, otherwise zero. A win scores 1000+2*floor(remainingSeconds)+floor(sum(remainingChargeC)); all other phases score zero. Score uses committed real charge, not display rounding.

## Board and controls

The board is a 2×3 navigation grid. Each row's first two slots belong to one load, and its third slot is a visibly separate spare tray. Initial slots are all occupied; ordinary atomic swaps always preserve exactly one instance of each C1–C6. Cell identities, current slot, initial/remaining/consumed C, ohms, temperature, and generated/removed heat are public. The topology of each row is series or parallel. Both loads' complete future demands and the next safe window are visible from the start.

Direction input selects a clamped cardinal neighbour. The larger absolute axis wins, horizontal on a tie, with ≤0.25 neutral, first movement immediate, repeat at 20 then every 10 ticks. During a safe off window, A marks a source slot without removing anything; the next fresh A on another slot atomically swaps the two cell IDs. A on the same slot cancels. B has priority over A/navigation: if a source is marked it cancels only; otherwise it switches the selected row's topology during the window. Without B, navigation precedes A on the same interval. Outside the window, A/topology B are blocked without a command or resource change. B cancellation can never move a cell. Mark cancellation is an accepted UI action affecting only the mark; it is distinct from runtime input cancellation and does not reset edge or cancelEpoch tracking. The first supply tick clears an unfinished source mark. There is no carried cell, timer-changing input, external wiring command, or force-win API.

The design proof must respect at most two swaps, two topology changes and 18 fresh navigation/action presses per window. Each counted press reserves nine ticks (including a neutral/release interval), so it does not depend on extremely fast dispatch. Full input sequences stay private to the design verifier; the public summary reports totals and maximum per-window counts only.

## Time and boundary convention

State tick t names the already committed time t/60. A step from t to t+1 uses the segment containing the **start tick t**. Windows and supply stages are half-open [startTick,endTick). Thus the input at t=359 is still legal in [0,360), and input at t=360 is already supply and cannot swap. Input receipts are timestamped to the resulting tick t+1 but also expose fromTick and the actual segment start used for legality. In a committed poststate, viewSegment is schedule(state.tick), describing the next input's actual phase, while lastInterval.segment is schedule(lastInterval.fromTick), describing the interval just integrated. The UI must expose current segment plus remaining ticks and the next segment/demand, rather than infer safety from an ambiguous rounded second count. At the final deadline, the view is a terminal/end segment rather than a nonexistent fourth stage.

At each interval: identify the start segment and clear an obsolete source mark; apply B-priority fresh input; reset per-stage work/bad-power counters on the first interval of a new supply stage; calculate each unfinished load's actual connected circuit; integrate charge, electrical energy, work and thermal energy for one full 1/60-second interval from the post-input configuration; commit all work completions; resolve safety failures, stage-deadline failure and final victory in the stated order below. A load that reaches its quota still consumes the entire finishing interval, and disconnects next interval. Other unfinished loads continue independently. During off windows and after a load finishes, its electrical current is zero; all cells and loads continue passive cooling. The shared runtime pauses by not calling step and creates a wholly fresh retry.

The model must distinguish a segment's request from actual connected supply, show both, and expose actual per-cell current and delivered load power. Empty or single-cell circuits exist only as pure circuit boundary fixtures: ordinary gameplay keeps two cells in each load and must not be described as having a normal one-cell route.

The API accepts exactly one fixed physical tick for finite abs(dt−1/60)<=1e−12. Active dt=0 returns the same state unchanged, consuming no input or event. All other active dt values throw RangeError before any state mutation. Terminal state returns unchanged before even checking dt. There is no accumulator, variable-length physics, or claim of arbitrary dt-partition equivalence. The shared runtime already advances physical ticks at 60 Hz independently of render-frame frequency, so temperature follows simulated elapsed time rather than render calls. Each committed state exposes viewSegment=schedule(tick), including an end sentinel at tick>=closeTick; controlsOpen requires model phase playing as well as an off segment. A failure records its actual lastInterval.fromTick/tick/segment even if viewSegment has already crossed to the next scheduled window. No lost state can become editable because its next scheduled segment happens to be off.

## Electrical quantities and resource accounting

Every cell has the same fixed open-circuit voltage E=12 V. This approximation deliberately does not make voltage a function of remaining charge. Each load resistance is RL=6 Ω. For series, Voc=ΣE, R=ΣRi and I=Voc/(RL+R); every cell carries I. For parallel, G=Σ(1/Ri), R=1/G, I=E/(RL+R), and Ii=I(1/Ri)/G. One cell gives the same result in both topologies; no cells gives zero current/power. Loaded terminal voltage is I·RL and must not be labelled the cell's nominal 12 V.

The pure solveCircuit object API accepts 0/1/2 cells only. More cells, duplicate or invalid IDs, nonpositive/nonfinite E/R/Rload, unknown topology, unequal parallel nominal voltage, or nonfinite outputs are rejected before returning. Empty internal resistance is null rather than Infinity. Parallel voltage equality is exact; ordinary inputs are uniformly 12 V. This solver never mutates its inputs.

At every electrical interval, Psource=Σ(E·Ii), Pload=I²RL, and Pinternal=Σ(Ii²Ri). The identity Psource=Pload+Pinternal must hold within the explicit arithmetic tolerance. Charge is coulombs, not joules: usedC+=Ii/60 and remainingC=initialC−usedC. Each cell retains its counters when swapped or resting. Nothing charges cells or resets their heat. Initial charge equals remaining plus consumed for every cell and the whole round.

Use finite IEEE-754 numbers in SI units, fixed 60 Hz, no rounding per frame. Public resource ledgers retain actual accumulated deltas. Power-band comparisons use an absolute 1e−9 W tolerance; independent resource comparisons use absolute 1e−8 in the corresponding SI unit. Display rounding is never input to the model. A complete interval may push remaining C nonpositive; raw state preserves that amount and the round loses without clipping or pretending the full power was free. A valid playing state therefore starts with every cell strictly positive. A boundary fixture that starts with a nonpositive cell must fail before supplying current, not produce negative-source power.

Each load records delivered electrical J and credited service J separately. Only intervals whose actual power lies inside the inclusive band earn work. Work credit=min(Pload/60, remaining quota); the rest of a finishing interval is electrical overflow and is still consumed and heated. Out-of-band delivery earns zero work and records its delivered J as uncredited. The load ledger must partition all delivered J into credited work, finishing overflow and out-of-band delivery; its counters remain cumulative while stage work is separately indexed by stage. Every completion, stage deadline and final-win check uses the same done predicate: max(0,targetWorkJ−stageCreditedJ)<=1e−8 J. The actual tiny deficit is retained, never added as invented credited energy. Charge exhaustion and temperature thresholds retain their specified comparisons; this work tolerance is not a free-charge allowance. Closed-form ceil((target−tolerance)*60/P) estimates are checked against the actual fixed-tick trace rather than claiming arbitrary floating-point boundary equality.

## Thermal quantities and limits

Cell heat power is Ii²Ri. Load heat power is 0.3·Pload; the remaining 0.7·Pload is other electrical service energy, not separately converted into a second work-energy balance. Service work J is a measure of accepted electrical service, not a claim that all input becomes mechanical output.

For each cell or load, let θ=T−24°C. With thermal capacity Cth and ambient conductance K, use explicit Euler: generatedJ=heatPower/60, removedJ=K·θ/60, nextT=T+(generatedJ−removedJ)/Cth. The published constants have 0<K/(60·Cth)<1, so normal ambient/above-ambient starts do not overshoot below ambient. Inactive cells and disconnected loads still use this cooling law. Cell Cth=8 J/K, K=0.3 W/K and limit 52°C; load Cth=15 J/K, K=0.35 W/K and limit 40.5°C. Initial temperature is ambient. Public heat accounting is Cth·(T−ambient)=generatedHeatJ−removedHeatJ.

## Power bands, grace, stages and outcome

Each stage names independent high/low requirements for both loads. Each requirement contains target work J and an inclusive power band. An unfinished requested load increments its consecutive out-of-band counter once after a bad supply interval; a good interval resets it. Exactly 75 consecutive bad intervals (1.25 s) cause a power fault. There is no work credit during grace. Windows and already completed loads reset that counter to zero and do not accrue a power fault. Each new stage begins at zero; its first interval is still a real requested interval with the same 75-tick limit.

For the nonpositive-charge pre-supply fixture guard, ordinary window/completed-load/new-stage counter resets still happen first. The guard then preserves any other consecutive counter without incrementing it and creates no new power-fault fact. Public failure kind names are cell-charge, cell-overheat, load-overheat, power-fault and stage-quota. Each fact includes an explicit SI unit; a quota failure records actual credited work against the target and retains the real deficit separately.

After integration, collect all failures rather than silently discard later facts. Primary terminal priority: nonpositive cell charge (stable C1…C6 order), cell overheat, load overheat (stable L1/L2), then consecutive power fault, then any unmet quota at the end of its published stage. Temperature at or above its limit loses. Charge at or below zero loses; there is no tolerance that creates free charge. A finishing target and a safety limit on the same interval are a loss. Otherwise, both quotas completed in the final stage wins immediately. Earlier stages can finish early but wait for the next scheduled window/request. Missing a stage quota at its end loses even if the power counter is below 75. A cell already nonpositive in an explicit fixture is detected after the ordinary input stage: the interval still advances one tick and every entity passively cools, but all electrical currents, source/load electrical J, active heat and work increments are zero. It then commits the pre-supply charge failure. Ambient heat removal can therefore be nonzero; no statement of zero electrical input may erase that cooling. This fixture path is not reachable after an ordinary prior interval because that prior interval already lost.

Published levels end at 52/58/64 s at the latest. The last real work request starts at 40/44/48 s, so victory cannot be an artificial early shortcut. Every initial layout includes a load whose first demand cannot be met by either topology without exchanging cells. The verified author routes also use later-window redistribution; the bounded search is not a proof that every possible solution requires the same actions. All three levels use the same physics/control rules.

## Public evidence interface

The model exposes exact actual topology/slot inventory, six cell objects, two load objects, current/next segment, stage-indexed requests/work, actual circuit solution, cumulative charge/electrical/heat ledgers, blocked inputs, swaps/topology/cancel operations, interval facts and terminal failures. Input after snapshots describe the immediate input mutation; interval facts separately describe electrical and thermal integration and any completion/disconnect. These must come from actual state transitions rather than a predictive second simulation. Each button's sampleDown is held||Pressed; an armed fresh sample fires once then disarms, and only a real noncancelled false sample rearms it. Simultaneous fresh A/B fires only B while consuming/disarming A too, so A is not deferred. Runtime input.cancelled or a changed cancelEpoch clears navigation repeat and a marked source, with a separate runtime-cancel UI receipt that does not increment accepted A/B command count; quarantine releases only after a subsequent real noncancelled sample with both actions false and direction neutral. Window-close automatic mark cleanup has its own reason and also is not an A/B command. Deliberate A/B mark cancellation remains an accepted UI command and does not itself quarantine buttons. Terminal state freezes every field. The exact receipt keys and normalization rules are defined in the schema below.

## Design feasibility scope

The isolated author checker passed its first bounded run for all three levels before production implementation. Its literal fixed-tick input replay completed at 48.45, 56.1666666667 and 59.7333333333 seconds, using both topologies and later-window redistribution. The largest window required nine fresh presses under the declared nine-tick-per-press proof budget. This is design feasibility only; it is not the production model, independent arithmetic review, browser regression or physical-device evidence. Full author routes remain private and are not inputs to the production model or pilot. The proof interaction budget is not a runtime limit on how many legal presses a player may make.

Public feasibility report SHA-256: `c30ffb6262426a4ed55a72473a52dc55c38d4e2d7ef0b63b15544c458cec5610`. Public design JSON SHA-256: `2432f2133cd3ff347524b43e599e8e8faf1090f051ed16a833611446c89d14b5`.

## Canonical parameters and three levels

<!-- BATTERY_PARAMETERS_BEGIN -->
```json
{
  "game": {
    "id": 26,
    "slug": "battery-exchange",
    "name": "电芯交换",
    "version": "0.1.0"
  },
  "createPolicy": {
    "seed": "finite Math.trunc(seed) >>> 0, otherwise 528; metadata only",
    "difficulty": "finite Math.floor then clamp 0..2, otherwise 0"
  },
  "score": "won: 1000 + 2*floor(remainingSeconds) + floor(sum(remainingChargeC)); all other phases: 0",
  "simulation": {
    "tickHz": 60,
    "dtApi": "Terminal state returns unchanged first. Active dt=0 returns unchanged without consuming input. Otherwise accept exactly one tick only for finite abs(dt-1/60)<=1e-12; all other values throw RangeError before any mutation.",
    "units": {
      "voltage": "V",
      "resistance": "ohm",
      "current": "A",
      "charge": "C",
      "energy": "J",
      "temperature": "degC",
      "thermalCapacity": "J/K",
      "conductance": "W/K"
    },
    "nominalCellVoltageV": 12,
    "ambientC": 24,
    "cellThermalCapacityJK": 8,
    "cellConductanceWK": 0.3,
    "cellMaximumTemperatureC": 52,
    "loadThermalCapacityJK": 15,
    "loadConductanceWK": 0.35,
    "loadHeatFraction": 0.3,
    "loadMaximumTemperatureC": 40.5,
    "consecutivePowerFaultTicks": 75,
    "powerCompareToleranceW": 1e-09,
    "workCompletionToleranceJ": 1e-08,
    "ledgerComparisonTolerance": 1e-08,
    "thermalIntegrator": "explicit Euler at fixed 1/60 second, using start-of-interval temperature",
    "chargeIntegrator": "Canonical: consumedC += I/60; remainingC = initialChargeC - consumedC. Never clip; terminal may retain nonpositive remainingC. Qnext=Qbefore-I/60 is an independent real-arithmetic identity, not a second competing update.",
    "openCircuitVoltageDependsOnCharge": false,
    "regenerationOrCharging": false
  },
  "controls": {
    "board": "2 rows x 3 columns; each row has load slot 0, load slot 1, spare tray slot 2",
    "initialCursor": 0,
    "navigation": "cardinal clamped grid; abs(axis)<=0.25 neutral; larger magnitude axis wins, horizontal on exact tie; fresh step then repeat 20/10 ticks",
    "a": "During an off window, mark source slot; next fresh A atomically swaps both slot cell IDs; same slot cancels mark.",
    "b": "B has priority. With a source mark, cancel it; otherwise during an off window toggle selected row's series/parallel topology.",
    "illegal": "Outside an off window, A and topology-changing B are blocked without moving cells or changing any electrical configuration. B may only cancel a source mark; it cannot exchange cells.",
    "markAtWindowClose": "clear source selection before input on first supply tick, without changing inventory",
    "windowInteractionBudget": {
      "maximumSwaps": 2,
      "maximumTopologyChanges": 2,
      "maximumFreshNavigationAndActionPresses": 18,
      "designProofTicksPerPress": 9
    },
    "pauseRetry": "shared runtime owns pause and wholly fresh retry; runtime cancelled/new cancelEpoch clears mark with separate runtime-cancel UI receipt, not an A/B command; held buttons require an observed real neutral to rearm. Window-end mark cleanup uses its own reason."
  },
  "circuit": {
    "loadResistanceOhm": 6,
    "series": "Voc=sum(Ei); Rinternal=sum(Ri); I=Voc/(Rload+Rinternal); every connected cell carries I",
    "parallel": "All connected cells have the same fixed E. G=sum(1/Ri); Rinternal=1/G; I=E/(Rload+Rinternal); Ii=I*(1/Ri)/G",
    "loadPower": "I*I*Rload",
    "cellHeatPower": "Ii*Ii*Ri",
    "sourcePower": "sum(Ei*Ii)",
    "oneCell": "Series and parallel produce exactly the same physical result.",
    "zeroCells": "All current, power and charge use are zero; an unfinished requested load accumulates power-fault ticks.",
    "pureSolverDomain": "0, 1 or 2 cells only; reject >2, invalid/duplicate IDs, nonpositive/nonfinite E/R/Rload, unknown topology, unequal parallel E, or nonfinite outputs. Empty internal resistance is null, not Infinity.",
    "ordinarySlotScope": "Every ordinary board always has six cell entities, one in each slot; ordinary swaps keep both load slots occupied. One/zero-cell circuit cases are boundary fixtures only, never claimed as ordinary scene evidence."
  },
  "work": {
    "measure": "Electrical joules of service delivered while the requested power is inside its inclusive band; not mechanical output energy.",
    "outOfBand": "No work credited. Consecutive fault counter increments; 75 completed bad supply ticks causes loss. A good interval resets the counter.",
    "completion": "The entire final interval is electrically and thermally integrated, useful work is capped to remaining target, electrical overflow is recorded; done iff max(0,target-stageCredited)<=1e-8 J, with the actual tiny deficit retained and never added as credit. Automatic disconnect takes effect next interval.",
    "stageTransition": "At each stage end, remaining required work causes loss; completed earlier loads remain disconnected until the next published stage.",
    "finalWin": "After full interval accounting and all safety failures, win when both final-stage quotas are met. No artificial wait until stage end."
  },
  "loads": [
    {
      "id": "L1",
      "name": "机械泵",
      "nameEn": "SERVICE PUMP"
    },
    {
      "id": "L2",
      "name": "信标塔",
      "nameEn": "BEACON"
    }
  ],
  "cells": [
    {
      "id": "C1",
      "resistanceOhm": 1
    },
    {
      "id": "C2",
      "resistanceOhm": 1
    },
    {
      "id": "C3",
      "resistanceOhm": 2
    },
    {
      "id": "C4",
      "resistanceOhm": 2
    },
    {
      "id": "C5",
      "resistanceOhm": 3
    },
    {
      "id": "C6",
      "resistanceOhm": 3
    }
  ],
  "levels": [
    {
      "level": 1,
      "name": "港口试供",
      "nameEn": "Port Trial",
      "initialChargeC": [
        54,
        56,
        70,
        73,
        42,
        46
      ],
      "initialSlots": [
        "C1",
        "C2",
        "C5",
        "C3",
        "C4",
        "C6"
      ],
      "initialTopologies": [
        "series",
        "parallel"
      ],
      "windows": [
        [
          0,
          360
        ],
        [
          1080,
          1380
        ],
        [
          2100,
          2400
        ]
      ],
      "stages": [
        {
          "startTick": 360,
          "endTick": 1080,
          "requirements": [
            "high",
            "low"
          ]
        },
        {
          "startTick": 1380,
          "endTick": 2100,
          "requirements": [
            "low",
            "high"
          ]
        },
        {
          "startTick": 2400,
          "endTick": 3120,
          "requirements": [
            "high",
            "high"
          ]
        }
      ],
      "requirements": {
        "high": {
          "minimumPowerW": 32,
          "maximumPowerW": 46,
          "targetWorkJ": 360
        },
        "low": {
          "minimumPowerW": 16,
          "maximumPowerW": 21,
          "targetWorkJ": 180
        }
      },
      "closeTick": 3120
    },
    {
      "level": 2,
      "name": "轮值负载",
      "nameEn": "Alternating Loads",
      "initialChargeC": [
        62,
        64,
        78,
        81,
        48,
        51
      ],
      "initialSlots": [
        "C1",
        "C2",
        "C3",
        "C5",
        "C6",
        "C4"
      ],
      "initialTopologies": [
        "parallel",
        "series"
      ],
      "windows": [
        [
          0,
          360
        ],
        [
          1200,
          1500
        ],
        [
          2340,
          2640
        ]
      ],
      "stages": [
        {
          "startTick": 360,
          "endTick": 1200,
          "requirements": [
            "low",
            "high"
          ]
        },
        {
          "startTick": 1500,
          "endTick": 2340,
          "requirements": [
            "high",
            "low"
          ]
        },
        {
          "startTick": 2640,
          "endTick": 3480,
          "requirements": [
            "high",
            "high"
          ]
        }
      ],
      "requirements": {
        "high": {
          "minimumPowerW": 32,
          "maximumPowerW": 46,
          "targetWorkJ": 420
        },
        "low": {
          "minimumPowerW": 16,
          "maximumPowerW": 20,
          "targetWorkJ": 210
        }
      },
      "closeTick": 3480
    },
    {
      "level": 3,
      "name": "夜间双机",
      "nameEn": "Night Double Duty",
      "initialChargeC": [
        72,
        74,
        82,
        85,
        54,
        58
      ],
      "initialSlots": [
        "C1",
        "C2",
        "C5",
        "C3",
        "C4",
        "C6"
      ],
      "initialTopologies": [
        "parallel",
        "parallel"
      ],
      "windows": [
        [
          0,
          360
        ],
        [
          1320,
          1620
        ],
        [
          2580,
          2880
        ]
      ],
      "stages": [
        {
          "startTick": 360,
          "endTick": 1320,
          "requirements": [
            "high",
            "low"
          ]
        },
        {
          "startTick": 1620,
          "endTick": 2580,
          "requirements": [
            "low",
            "high"
          ]
        },
        {
          "startTick": 2880,
          "endTick": 3840,
          "requirements": [
            "high",
            "high"
          ]
        }
      ],
      "requirements": {
        "high": {
          "minimumPowerW": 38,
          "maximumPowerW": 46,
          "targetWorkJ": 500
        },
        "low": {
          "minimumPowerW": 16,
          "maximumPowerW": 20,
          "targetWorkJ": 240
        }
      },
      "closeTick": 3840
    }
  ]
}
```
<!-- BATTERY_PARAMETERS_END -->

## Public state and receipt schema

## API and mutation boundaries

UMD export `PureModel` in the browser and CommonJS export in Node:

```js
{ create, step, solveCircuit }
```

`create(seed, difficulty)` returns a wholly independent JSON-serializable state for difficulty 0, 1, or 2. If seed is a finite number, normalize it with `Math.trunc(seed) >>> 0`; otherwise use 528. If difficulty is a finite number, normalize it with `Math.max(0, Math.min(2, Math.floor(difficulty)))`; otherwise use 0. Do not coerce strings, null or booleans into numbers. Seed is API metadata only and never changes the three published level layouts or parameters. All configuration arrays, cells, loads, requests, and receipts are detached from other states and module constants.

`step(state, dt, input)` mutates that state only. Terminal states return unchanged before reading or validating other arguments. For a playing state, `dt === 0` returns unchanged and consumes no input. A finite `dt` with `abs(dt - 1 / 60) <= 1e-12` commits exactly one canonical 1/60-second interval. All other `dt` values throw `RangeError` before any mutation. There is no hidden elapsed-time clamp or accumulator. Physical time is `tick / 60`; rendering frequency does not determine heating or charge consumption. Arbitrary-dt partition equivalence is not claimed.

The runtime's snapshot already deep-copies the model. The model itself must additionally detach each historical receipt and interval record from live arrays/objects, so an old receipt cannot change when a slot, cell, load, mark, or input changes later. The exported solver is pure and never mutates its input.

## Pure circuit solver

Explicit signature:

```js
solveCircuit({
  topology: 'series' | 'parallel',
  loadResistanceOhm: 6,
  cells: [{ id: 'C1', voltageV: 12, resistanceOhm: 1 }, ...]
})
```

The solver returns:

```js
{
  topology,
  connected: true,
  cellIds: ['C1', 'C3'],
  loadResistanceOhm: 6,
  openCircuitVoltageV: 24,
  internalResistanceOhm: 3,
  parallelConductanceS: null,
  currentA: 24 / 9,
  terminalVoltageV: (24 / 9) * 6,
  sourcePowerW: 24 * (24 / 9),
  loadPowerW: (24 / 9) ** 2 * 6,
  internalHeatPowerW: (24 / 9) ** 2 * 3,
  powerBalanceErrorW: 0,
  branches: [
    { cellId: 'C1', voltageV: 12, resistanceOhm: 1,
      currentA: 24 / 9, sourcePowerW: 12 * (24 / 9),
      heatPowerW: (24 / 9) ** 2 },
    // C3 has the same series current and its own I²R heat.
  ]
}
```

Actual results contain computed finite numbers, not the symbolic expressions above. Empty cells produce `connected: false`, empty branch/ID arrays, zero voltage/current/power/error, `internalResistanceOhm: null`, and `parallelConductanceS: null`; no Infinity or NaN enters public state. A single cell has the same physical result in either topology. For nonempty parallel circuits, `parallelConductanceS` is the sum of reciprocal cell resistances and branch currents use those conductance fractions. Series leaves that field null.

Reject unknown topology, non-array cells, more than two cells, duplicate IDs, IDs that are not nonempty strings, nonfinite or nonpositive load/cell resistance, and nonfinite or nonpositive cell voltage with `RangeError` before calculation. Parallel cells must have exactly equal nominal voltage; production always supplies 12 V. Reject any nonfinite computed result rather than exposing NaN or Infinity, and do not mutate caller objects on success or failure. The public fixed model has two cells per connected ordinary load. Zero/single-cell solver calls are explicitly boundary fixtures, not ordinary game scenes.

## Top-level state

Use arrays with stable identity order for cells and loads; do not mix object-map and array shapes between reports.

```js
{
  width: 960, height: 540, seed, difficulty, level: difficulty + 1,
  levelName, levelNameEn,
  tick: 0, elapsed: 0, closeTick, remaining: closeTick / 60,
  phase: 'playing', score: 0, lostReason: null, failures: [],
  physics: { /* all published SI constants and fixed 60 Hz */ },
  schedule: [ /* three window segments and three supply segments */ ],
  viewSegment: { /* schedule at committed tick: next-input legality */ },
  controlsOpen: true /* phase === 'playing' && viewSegment.kind === 'window' */,
  nextSegment: { /* following segment, or null */ },
  cursor: 0, sourceSlot: null,
  slots: ['C1', 'C2', 'C5', 'C3', 'C4', 'C6'],
  topologies: ['series', 'parallel'],
  cells: [ /* C1, C2, C3, C4, C5, C6 */ ],
  loads: [ /* L1, L2 */ ],
  chargeLedger: {}, electricalLedger: {},
  commandCount: 0, blockedCommands: 0, navigationCount: 0,
  swapCount: 0, topologyChangeCount: 0, markCount: 0,
  markCancelCount: 0, automaticMarkClearCount: 0,
  commandReceipts: [], blockedReceipts: [], navigationReceipts: [],
  automaticMarkClearReceipts: [], stageStartReceipts: [],
  workCompletionReceipts: [], stageEndReceipts: [],
  eventCount: 0, events: [], lastEvent: null,
  lastOperation: null, lastInput: null, lastInterval: null,
  inputState: { /* explicit deterministic edge/repeat state */ },
  message: '...'
}
```

`events` contains only events from the most recently committed interval, preventing the shared runtime from replaying earlier sound events every tick. `eventCount` is cumulative. Permanent receipts retain their own stable monotonic IDs; `events` may reference those IDs rather than duplicate whole histories. `message` is ordinary localized feedback, not an alternate source of simulation truth. All fields, including input state, messages and receipts, freeze after termination.

The public `physics` object contains exact contract constants for voltage, ambient temperature, 60 Hz, thermal capacities/conductances, heat fraction, temperature limits, `powerCompareToleranceW: 1e-9`, `workCompletionToleranceJ: 1e-8`, and fault ticks. Public `schedule` and requirements are copies of immutable authored configuration, never modified by play.

## Schedule and boundary labels

An immutable schedule row has this stable base shape:

```js
{
  index: 0, kind: 'window' | 'supply' | 'end',
  windowIndex: 0 /* or null */, stageIndex: null /* or 0,1,2 */,
  startTick: 0, endTick: 360,
  inputWindowOpen: true,
  requirements: [ /* the two requests during supply, else [] */ ]
}
```

The immutable row never acquires a changing `remainingTicks`. `viewSegment` is a detached row copy evaluated at the committed poststate tick and adds `remainingTicks = max(0, endTick - tick)`. `lastInterval.segment` is another detached row copy evaluated at its `fromTick` and adds `remainingTicks = max(0, endTick - fromTick)`; it contains the exact legality/request used for that interval. At poststate tick 360 the view can say supply while the interval just committed was the final legal off-window interval from 359 to 360. The UI must not infer legality from rounded seconds or label last-interval power as a freshly integrated next-segment result. `nextSegment` is an immutable-shaped copy of the authored following row, including future requests, without a moving remaining-tick field. At `tick === closeTick`, the derived end segment has zero remaining ticks, no requests and no safe window. Top-level `controlsOpen` is exactly `phase === 'playing' && viewSegment.kind === 'window'`. On an earlier win/loss, phase is terminal even if the frozen schedule position remains inside a supply segment; no control becomes legal merely because the schedule says window.

## Cells and charge/heat accounting

Every cell retains identity and cumulative counters through all swaps and rests:

```js
{
  id: 'C1', voltageV: 12, resistanceOhm: 1,
  initialChargeC: 54, consumedChargeC: 0, remainingChargeC: 54,
  temperatureC: 24, generatedHeatJ: 0, removedHeatJ: 0,
  sourceEnergyJ: 0,
  slot: 0, loadId: 'L1' /* null for either spare slot */,
  lastCurrentA: 0, lastSourcePowerW: 0, lastHeatPowerW: 0,
  heatBalanceErrorJ: 0
}
```

`slot` and `loadId` are recomputed from the authoritative `slots` inventory after an input swap, not independently mutable routing state. A source mark never removes a cell from its slot. The canonical charge update is `consumedChargeC += currentA / 60; remainingChargeC = initialChargeC - consumedChargeC`. Negative/zero remaining charge on a terminal interval is retained. A passive cell keeps its actual cumulative counters and cools; it does not receive charge or reset its temperature.

The three `last...` electrical values describe `lastInterval` and must not be presented as the nominal voltage or next-frame prediction. At create they are zero. Heat balance is `Cth * (temperatureC - ambientC) - generatedHeatJ + removedHeatJ`, not an invented conservation of temperature alone.

Round `chargeLedger` records `initialChargeC`, `consumedChargeC`, `remainingChargeC`, and `errorC` derived from the six actual cell values. Round `electricalLedger` records accumulated cell source energy, accumulated delivered load energy, accumulated cell internal heat, and `errorJ = source - delivered - internal`. Per-load generated heat is already a portion of delivered load energy and must not be added again to this source/load/internal balance.

## Loads, stage work and actual delivery

```js
{
  id: 'L1', name: '机械泵', nameEn: 'SERVICE PUMP', row: 0,
  resistanceOhm: 6, slotIndices: [0, 1],
  temperatureC: 24, generatedHeatJ: 0, removedHeatJ: 0,
  deliveredEnergyJ: 0, creditedWorkJ: 0,
  overflowEnergyJ: 0, outOfBandEnergyJ: 0,
  consecutiveBadPowerTicks: 0,
  stages: [
    { index: 0, requirementId: 'high', startTick: 360, endTick: 1080,
      minimumPowerW: 32, maximumPowerW: 46, targetWorkJ: 360,
      workJ: 0, deficitJ: 360, deliveredEnergyJ: 0,
      overflowEnergyJ: 0, outOfBandEnergyJ: 0,
      goodIntervals: 0, badIntervals: 0, peakBadPowerTicks: 0,
      startedAtTick: null, completedAtTick: null, endedAtTick: null },
    /* two more immutable requests with mutable actual counters */
  ],
  lastElectrical: {
    fromTick: null, toTick: null, stageIndex: null,
    requested: false, connected: false, disconnectReason: 'not-started',
    powerInBand: null, circuit: null,
    currentA: 0, terminalVoltageV: 0,
    loadPowerW: 0, sourcePowerW: 0, internalHeatPowerW: 0
  },
  workPartitionErrorJ: 0, heatBalanceErrorJ: 0
}
```

All three requests and zeroed stage records exist from create, so future planning never depends on hidden configuration. `deficitJ = max(0, targetWorkJ - workJ)` is the nonnegative actual deficit; it is never snapped to zero by completion tolerance. Completion, stage deadlines and final victory all use `deficitJ <= physics.workCompletionToleranceJ`; a tolerated tiny deficit is retained and is never added as invented work credit. `startedAtTick` is the committed tick of the first real interval for that stage (`startTick + 1`). A completion at tick n consumes and heats for the entire interval n−1→n; the receipt gives `disconnectFromTick: n`, meaning the following interval is disconnected. A completed earlier-stage load waits for the next supply request rather than completing the whole game early.

`requested` in `lastElectrical` means that the last interval belonged to a supply stage and that load was unfinished at the interval start. `connected` additionally means the pre-supply charge guard passed and a circuit actually supplied energy. Reasons are `off-window`, `stage-complete`, `pre-supply-charge-failure`, `empty-circuit` or null for an actual connected circuit. A disconnected load has `circuit: null` and `powerInBand: null`, with zero current/voltage/power fields. Ordinary boards never have an empty circuit; a zero/single-cell pure solver test does not require mutating a gameplay state. On a pre-supply-charge-failure fixture interval, normal window/completed-load/new-stage resets happen first if applicable; otherwise the prior consecutive bad-power counter is preserved. That suppressed-supply interval does not increment the counter or emit a new power fault. For example, a prior value of 74 remains 74 rather than fabricating a 75th delivered bad interval. The charge failure still terminates the round after passive cooling.

`consecutiveBadPowerTicks` is the current consecutive counter, reset by a good interval, window, completed load, or new stage. Archived stage rows store total good/bad intervals and their maximum consecutive count, avoiding ambiguous reuse of a previous stage's live counter. Delivered energy partitions as `creditedWorkJ + overflowEnergyJ + outOfBandEnergyJ`. A good finishing interval caps work to the remaining quota and records its excess as overflow. A bad requested interval credits zero and puts all delivered electrical joules in out-of-band energy. A disconnected load has zero delivered energy and zero credited work for that interval.

## Input receipts and cancellation

Capture configuration snapshots as detached copies:

```js
{ cursor, sourceSlot, slots: [...], topologies: [...] }
```

`commandReceipts` contains accepted player A/B actions only: `mark-source`, `cancel-mark-same-slot`, `cancel-mark-b`, `swap`, and `toggle-topology`. Each has `{id, fromTick, tick, segmentIndex, windowIndex, action, inputKey, before, after}` plus explicit `fromSlot/toSlot/cellIds` or `row/fromTopology/toTopology` where applicable. `tick === fromTick + 1`; these before/after configurations describe the immediate input mutation before electrical/thermal integration. `commandCount` is the receipt length, including accepted mark/cancel UI actions; `swapCount` and `topologyChangeCount` count only those actual configuration mutations.

Blocked A/B edges go to `blockedReceipts` with their own IDs, action, reason, from/result ticks, actual segment, and identical before/after configurations. They increment `blockedCommands`, not `commandCount`. A held action without a new edge is neither a second command nor a second blocked command. Navigation receipts separately describe accepted cursor movement and whether it was initial or repeat; clamped movement does not fabricate a moved cursor.

`automaticMarkClearReceipts` is separate from player commands. Causes are `window-close` and `runtime-cancel`, with source slot and before/after configurations. Identify the actual start segment first and clear an obsolete mark on the first supply interval; then process new cancel epoch/cancelled input. If the earlier clear removed the only mark, do not create a second clear of that same mark. Runtime cancellation suppresses the entire interval's navigation and A/B effects, clears held/repeat state, and quarantines actions until a subsequent non-cancelled true neutral sample. A player's mark-cancel action does not perform this runtime quarantine or reset cancel epochs.

`lastInput` records the actual sampled booleans/axes, cancel epoch, cancellation decision, actual start segment, accepted receipt IDs, blocked receipt IDs, navigation result, and any automatic clear ID. It does not claim the external browser dispatched a key; that remains separate harness evidence. B fresh-edge priority suppresses both A and navigation in the same interval, even if the B attempt is blocked. With no fresh B, navigation occurs before a fresh A.

Input omission, null, or any non-object value is normalized to an empty object without mutating the caller. For each axis, accept only a finite number and clamp it to [-1, 1]; any other value becomes zero without string/boolean coercion. `cancelEpoch` is accepted only when `Number.isSafeInteger(value) && value >= 0`; otherwise retain the previous tracked epoch. An absent or malformed epoch therefore cannot invent an input cancellation. The initial tracked epoch is zero. A changed accepted epoch, including a decrease, is a real cancellation signal; it is an identity-change test, not an ordering test.

Determine the cardinal navigation direction from these normalized axes: both absolute magnitudes <= 0.25 are neutral; otherwise the larger magnitude wins, horizontal on an exact tie. Neutral sets `navigationDirection` to null and `navigationHeldTicks` to zero. A different nonneutral direction immediately becomes the tracked direction with heldTicks 1. The same nonneutral direction increments heldTicks by one. Movement is eligible exactly at heldTicks 1, 21, 31, 41, ...; that is 20 ticks after the initial move and every 10 ticks thereafter. Direction reversal/change is a new immediate eligible movement, without requiring an intervening neutral. Clamp the target to the 2x3 board; reaching an edge does not reset the held timer or create a movement receipt for an unchanged cursor.

The navigation timer samples the real normalized direction on every noncancelled, nonquarantined tick, even if a fresh B occupies that tick. Fresh B suppresses that tick's eligible movement and does not queue it. For example, if a new right direction and fresh B arrive together, the tracked direction becomes right with heldTicks 1 but no movement; the next still-held tick has heldTicks 2 and no delayed initial move, and the first later repeat is heldTicks 21. A neutral sample or new direction subsequently follows the same rules. Runtime cancellation clears direction and timer to neutral/zero; while quarantined, hold them there until a real all-neutral sample clears quarantine. Do not advance the direction timer from a synthetic cancelled-neutral sample.

Explicit `inputState` keys include `cancelEpoch`, `quarantined`, `aArmed`, `bArmed`, `navigationArmed`, `navigationDirection`, and `navigationHeldTicks`. For A, `sampleDown = !!(input.a || input.aPressed)`; B uses the corresponding B fields. An armed action with sampleDown true is a fresh edge and immediately disarms, whether accepted, blocked or suppressed by B priority. Only a later real noncancelled sampleDown false rearms that action. A short pressed pulse therefore executes once even if its held boolean is already false, then waits for a true neutral later sample. If both actions are fresh in one interval, B wins and A is consumed rather than deferred to the next tick. Runtime quarantine clears only after A, B and both direction axes are all truly neutral in one noncancelled sample; a synthetic cancelled neutral can never clear it. The neutral release itself performs no action; subsequent fresh input may act.

## Last committed interval and permanent outcomes

`lastInterval` is a detached exact observation of the most recently committed real transition:

```js
{
  fromTick, tick: fromTick + 1, seconds: 1 / 60,
  segment: { /* start-tick segment, with actual legality/request */ },
  configuration: { /* after ordinary input, before physics */ },
  preSupplyChargeFailureCellIds: [],
  cells: [
    { cellId, slot, loadId,
      currentA, sourcePowerW, heatPowerW,
      chargeBeforeC, chargeUsedC, chargeAfterC,
      temperatureBeforeC, generatedHeatJ, removedHeatJ, temperatureAfterC,
      sourceEnergyJ }
  ],
  loads: [
    { loadId, stageIndex, requested, connected, disconnectReason,
      circuit, powerInBand,
      workBeforeJ, creditedWorkJ, workAfterJ,
      deliveredEnergyJ, overflowEnergyJ, outOfBandEnergyJ,
      badPowerTicksBefore, badPowerTicksAfter,
      temperatureBeforeC, generatedHeatJ, removedHeatJ, temperatureAfterC,
      completedNow }
  ],
  stageStarted: null /* or index */,
  workCompletionReceiptIds: [], stageEndReceiptIds: [],
  failures: [], terminal: null /* or won/lost with primary reason */
}
```

Per-interval `generatedHeatJ`/`removedHeatJ` are deltas; entity fields with the same names are accumulated totals. This naming distinction must be stated in docs and consumed consistently by independent calculations. Resting cells and all loads still have thermal rows. When `stageIndex` is null, a load interval has `workBeforeJ: null` and `workAfterJ: null` because no stage is active; its electrical energy and work deltas remain numeric zero. On the pre-supply nonpositive-charge fixture path, current/source/load electrical energy/active heat/work deltas are zero but passive cooling rows remain real.

Stage-start receipts contain actual start/result ticks and the two public requests. Work-completion receipts contain actual stage/load identity, target, before work, full interval electrical joules, credited joules, actual after-work deficit, overflow, completion tick and next-interval disconnect boundary. Stage-end receipts at an authored boundary contain both loads' final stage work, actual deficits and tolerance-based completeness, including incomplete outcomes. Do not fabricate receipts for future stages after an earlier loss.

After full integration, collect all terminal facts into `failures` and the final interval, in stable priority order: `cell-charge` for nonpositive charge C1…C6, `cell-overheat` for cells C1…C6, `load-overheat` for L1/L2, `power-fault` for consecutive bad power L1/L2, and `stage-quota` for unmet stage work L1/L2. A failure item contains `{kind, entityId, stageIndex, fromTick, tick, actualValue, limitValue, unit}`. Units are respectively `C`, `degC`, `degC`, `ticks`, and `J`. For quota failures, actualValue is the actual credited work and limitValue is the authored target, with an extra actual `deficitJ`; it is not a deficit comparison disguised as delivered work. For cell-charge, limitValue is zero. For overheating or power fault it is the authored maximum temperature or fault tick count. `lostReason` is the first failure kind. A safety failure and completion in the same interval retain both the completion receipt and failure facts and lose. Victory is evaluated only after failures and only after both last-stage quotas complete.

Score is zero while playing or after a loss. On victory it is `1000 + 2 * Math.floor((closeTick - tick) / 60) + Math.floor(sum(cells.map(c => c.remainingChargeC)))`. Use actual unrounded remaining charge and integer-tick remaining time; never use display-rounded fields. This score remains frozen with the terminal state.

## Required rule-boundary coverage

Meaningful boundary groups: empty/single/paired pure circuits and source/load/internal energy identity; same-voltage inverse-resistance parallel current; invalid solver input detachedness; authored schedule and 359/360 input legality; source marks and atomic exchange identity/charge preservation; B priority and same-slot cancel; short pulses/held-repeat/cancellation re-arm; canonical consumption with no clipping; requested versus actually connected current; exact 75th bad interval; good-power counter reset; full finishing-interval consumption and next-interval disconnect; work/overflow/out-of-band partition; explicit Euler active and passive heat, equal-limit loss; simultaneous completion/safety loss; stage deadline and final-stage early victory; pre-supply nonpositive fixture with passive cooling but zero electrical work; no-op/invalid dt state immutability; full terminal freeze and independent creates.

These are rule-boundary fixtures. Ordinary complete play, resource traces, independent arithmetic review and browser input/visual evidence remain separate gates, and no authored solution is embedded in the formal tests.
