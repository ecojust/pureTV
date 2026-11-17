# Greenhouse Dials / 温室旋钮 — public model contract

## Scope and controls

One greenhouse has a shared temperature T (°C), air relative humidity H (%), soil moisture index M (%), and finite reservoir W (litres). All three crops experience this same climate but have different comfort bands, maturity requirements and lethal-damage thresholds. All three are required; there is no optional crop. The moisture index is a bounded game approximation, not a conserved physical mass. Three authored parameter sets use identical rules, a 90-second active-time deadline, and intended successful rounds of roughly 40–70 seconds. No hidden forecast, random weather, author route or automatic solution is exposed.

Three dials, in order VENT / SHADE / DRIP, each have levels 0, 1, 2. Directions select the previous/next dial without wrapping: W/N previous, E/S next; dominant absolute axis wins, horizontal wins ties, finite axes clamp to [-1,1], max absolute value < .25 is neutral. New direction moves once, repeats after 20 ticks and then every 10. A raises the selected dial's requested level by one; B lowers it by one. B has priority over A and navigation on the same fixed tick. Otherwise navigation precedes A. A/B are fresh edges; blocked attempts at 0/2 do not enqueue commands. Shared P/START pauses; R/menu retry starts the same authored level from its initial state.

Each accepted input changes `requestedLevel` immediately and enqueues an absolute requested level. It does **not** change `appliedLevel` yet. Command `{id,dialId,beforeRequested,afterRequested,issuedTick,dueTick}` has consecutive accepted-command ID, `issuedTick=newTick`, `dueTick=issuedTick+delayTicks`. Every pending command is retained FIFO, not replaced or coalesced. At each tick, all commands due at or before newTick apply in (dueTick,id) order; later selection cannot redirect them. A command that eventually sets the same applied level still represents its genuine earlier requested-level change. Only command counters, pending commands and latest receipts are retained, not an unbounded archive. Pending is naturally bounded by delayTicks (at most one accepted input per tick). Final states freeze pending commands; no post-result actuation.

Pause calls no model steps: physical time, growth, damage and command deadlines all freeze. Cancel/reconnect clears only pending input edges and direction repeat state, not deliberately queued actuator commands. Fresh retry clears all command IDs, queue, receipts, progress, damage and resource usage. Initial requested/applied levels are all 0; initial last interval/command/application are null.

## Fixed tick and climate

Use dt=1/60 s and integer ticks. At newTick: consume one input action; apply due commands; sample weather at oldTick/60; compute **all** climate deltas from the same old T/H/M/W and newly applied levels; update crops and exhaustion counter; decide terminal result. Events have committed newTick and `at=newTick/60`; command issue time is `issuedTick/60`, and application receipts have `appliedTick` and application `at`. lastInterval covers `[oldTick/60,newTick/60)`. Large outer dt runs fixed ticks; no physics runs for an incomplete tick. Subtick A/B edges may wait until a tick, whereas direction uses the current held axes. Finite outer dt is clamped to [0,.25] seconds; nonfinite dt is zero. First cancelEpoch binds without cancellation; a changed epoch clears pending edges/repeats. input.cancelled suppresses controls for all ticks of that call without freezing environment or deliberately queued actuators. A neutral direction resets repeat state even on a B-priority tick. Terminal calls change nothing, including receipts/events.

Let v,s,d be applied vent/shade/drip levels. Weather heat input q(t) has three public periods [0,18), [18,42), [42,90]. Approved authored parameters are below. Common constants:

```
outsideTemperature = 24 °C; outsideHumidity = 45 %
temperatureRelax = .08 /s; ventCooling = .35 °C/(s·level)
shadeHeatFraction = .30 /level
humidityRelax = .035 /s; naturalHumidity = .55 %/s
ventDrying = .40 %/(s·level); irrigationHumidity = .80 %/litre
dripRatePerLevel = .50 litre/s; soilGain = 2.0 %/litre
baseEvaporation = .35 %/s; hotEvaporation = .025 %/(s·°C above24)
ventEvaporation = .08 %/(s·level); shadeConservation = .06 %/(s·level)
```

```
usedLitres = min(W, d * .50 * dt)
actualDripLps = usedLitres / dt
evaporationPctPerSec = max(0, .35 + .025*max(T-24,0) + .08*v - .06*s)
T' = clamp(T + [q(t)*(1-.30*s) - .35*v - .08*(T-24)]*dt, 0, 60)
H' = clamp(H + [.55 - .40*v - .035*(H-45)]*dt + .80*usedLitres, 0,100)
M' = clamp(M - evaporationPctPerSec*dt + 2*usedLitres, 0,100)
W' = max(0, W-usedLitres)
waterUsedLitres' = waterUsedLitres + usedLitres
```

The reservoir ledger is initialWater = W + waterUsedLitres (numerical tolerance 1e-8 L). Drip can keep spending water at saturated M; discarded excess moisture is not refunded. No water means no irrigation humidity or soil gain, regardless of the applied drip setting. Shade is not a growth multiplier; cooling too far below comfort stops growth. Ventilation simultaneously changes temperature, air humidity and evaporation.

## Crops, growth, damage and terminal order

Each crop has exact closed comfort intervals for T/H/M and wider closed safe intervals. Evaluate against **new** T'/H'/M'. `inRange` means all three comfort tests; named booleans and failed comfort dimensions are public. Each not-yet-mature in-range crop gains exactly one `growthTick`, capped at its maturityTicks. Out-of-range crops gain none: partial satisfaction or overheating never earns growth. A crop is dangerous if any new value is strictly outside its safe interval; it gains one `damageTick` at most per tick even if multiple dimensions are dangerous. Damage never heals. Mature crops stop accumulating growth but remain subject to danger until the round ends. `dead = damageTicks >= damageLimitTicks`; `mature = growthTicks >= maturityTicks`.

After water becomes zero, residual soil moisture can still support growth. Define U as unfinished crops. `dryStallTicks` increments only when W' <= 1e-9, U is nonempty, and **none of U gained a growth tick this tick**; otherwise it resets to zero. A mature crop does not conceal an unfinished crop's stall; an empty U is never an exhaustion failure. The public loss rule is 180 consecutive such ticks (3 active seconds), not a claim of permanent mathematical impossibility. UI must show the counter and queued actuation delay.

Terminal order after the completed interval: (1) any dead crop → `crop`; (2) all three mature → won; (3) dryStallTicks>=180 → `water`; (4) tick>=5400 → `timeout`. Thus lethal damage beats same-tick maturity; completing the last required growth tick at the deadline can win. Full maturity never requires spending all water. Dead crop IDs and unfinished crop IDs use fixed crop order.

Score: sum over crops of `mature ? 200 : floor(200*growthTicks/maturityTicks)`; won adds 1000 + floor(remainingWater+1e-8). No score for opening controls, issuing commands, damage, or wasted water.

## Authored levels

Crop order/IDs are C1 叶菜 / LEAF, C2 豆苗 / BEAN, C3 香草 / HERB. All are required and all can die. Comfort and safe intervals do not change between levels:

| Crop | Comfort T / H / M | Safe T / H / M | Damage limit |
|---|---|---|---|
| C1 | [22,28.5] / [55,75] / [45,68] | [12,37] / [25,95] / [15,90] | 8 s |
| C2 | [25,32] / [45,68] / [35,60] | [12,41] / [20,95] / [10,88] | 10 s |
| C3 | [24,30] / [50,72] / [40,64] | [12,39] / [25,95] / [12,90] | 9 s |

Common comfort intersection is T[25,28.5], H[55,68], M[45,60], but each crop has distinct tolerance and maturity time. Initial values are actual game values, not inferred equilibria.

| Level | Name | Heat input q dawn/noon/late | Initial T/H/M/W | Delay | Maturity C1/C2/C3 |
|---|---|---|---|---|---|
| 1 | 晨光苗圃 | .90 / 1.45 / .60 | 30 / 60 / 48 / 24 | 90 ticks | 30 / 38 / 34 s |
| 2 | 正午玻璃房 | 1.05 / 1.65 / .65 | 31 / 58 / 44 / 23 | 120 ticks | 33 / 41 / 37 s |
| 3 | 傍晚育苗台 | .80 / 1.55 / .55 | 29 / 62 / 52 / 22 | 150 ticks | 36 / 44 / 40 s |

## Public schema

UMD `PureModel` exports only `create(seed=1,difficulty=0)`, `step(state,dt,input)`, and `TICK_HZ=60`. Difficulty is an integer clamped to 0…2; level=difficulty+1. Retry restores the authored level without random changes. State width=960,height=540. Public fields: seed,level,difficulty,name,nameEn,levelName; phase,tick,elapsed,timeLimit=90,remaining,score,message,lostReason; selectedId; dials[{id,name,nameEn,requestedLevel,appliedLevel}]; pendingCommands; commandCount,appliedCommandCount,blockedCommands; lastCommand,lastAppliedCommands; weatherPeriods[{id,from,to,heatInput}],currentWeather; physics; environment{temperature,humidity,soilMoisture}; reservoir{initialLitres,remainingLitres,usedLitres}; delayTicks,dryStallLimitTicks,dryStallTicks; crops[{id,name,nameEn,comfort,safe,maturityTicks,damageLimitTicks,growthTicks,damageTicks,mature,dead,inRange,growing,dangerous,comfortChecks,failedComfortDimensions,unsafeDimensions}]; matureCount,deadCropIds,unfinishedCropIds; lastInterval{fromTick,toTick,fromTime,toTime,beforeEnvironment,afterEnvironment,beforeWater,usedLitres,actualDripLps,evaporationPctPerSec,appliedLevels,heatInput,growthCropIds,damagedCropIds}; events,lastAction. Fields prefixed with `_` are input bookkeeping, not observations for independent planning.

`lastAppliedCommands` is the application list for the most recently committed fixed tick, empty when that tick applies none; the outer-step event list retains actual application events from earlier ticks of that outer call. `currentWeather` is the weather sampled for lastInterval, not recomputed from the new endpoint time. At create it describes the t=0 public weather only, with lastInterval=null. Initial crop inRange/dangerous/comfortChecks are computed from initial environment, but growing=false because no interval has completed.

Receipts hold fresh copies, not mutable aliases. events clear per outer step and retain the final32 actual events. Event types are select,select-blocked,command,limit,applied,won,lost. Each event has type/at/tick plus public details. No per-tick climate event flood. Renderer uses applied levels and lastInterval actual flow, not requested levels, for window/shade/water animation. Actual soil and climate are global; crop cards must not imply separate climate zones. Pending commands and requested vs applied are visibly distinct.

## Exact IDs, receipts and small schema details

- Dial IDs/array order: `vent` 通风 / VENT, `shade` 遮阳 / SHADE, `drip` 滴灌 / DRIP. Initial selectedId is vent. `appliedLevels` is `{vent,shade,drip}`. `physics` uses exactly the named constants from the formula section, with their shown numeric values. Environment and crop range keys are `temperature`, `humidity`, `soilMoisture` in that order; `comfort`/`safe` map each key to its two-element interval. Climate bounds are fixed by the formulas, with no additional state bounds object.
- Crop IDs/order C1/C2/C3 and names/nameEn are fixed by the authored table. Each `maturityTicks` is the authored seconds times 60, each damageLimitTicks likewise. `comfortChecks` maps each environment key to a boolean; `failedComfortDimensions` lists failed comfort checks; `unsafeDimensions` lists safe-range violations, both in key order. `inRange` is the conjunction of comfortChecks; `dangerous` means unsafeDimensions is nonempty. `growing` means this most recently completed interval actually added one growth tick, even if that tick completed maturity; it is false at create. `unfinishedCropIds` is evaluated after that interval's growth and excludes crops that just matured. `deadCropIds` is separate and may include a mature crop.
- Weather IDs are `dawn` [0,18), `noon` [18,42), `late` [42,90]. Each item is exactly `{id,from,to,heatInput}`. `currentWeather` is a detached full item from the sampled interval. At elapsed=18 the last interval still sampled dawn; the next tick samples noon. The final endpoint reports the last sampled period. Level names/nameEn: 晨光苗圃 / DAWN NURSERY, 正午玻璃房 / NOON GLASSHOUSE, 傍晚育苗台 / EVENING SEEDLINGS. levelName equals name.
- `lastCommand` is null or the persistent latest accepted `{id,dialId,beforeRequested,afterRequested,issuedTick,dueTick}`. Each pendingCommands entry has this same detached shape. Issue time is issuedTick/60. A blocked A/B input increments blockedCommands but neither consumes a command ID nor replaces lastCommand.
- An applied receipt copies the command and adds `{beforeApplied,afterApplied,appliedTick,at}` where afterApplied=afterRequested and at=appliedTick/60. `lastAppliedCommands` contains only the latest committed fixed tick's applications, and appliedCommandCount counts all applications. At all times pendingCommands.length=commandCount−appliedCommandCount. Fixed per-level delay and one accepted command per tick ensure append order is already increasing dueTick then id; no re-sort or coalescing is needed. No command changes its target after enqueue.
- `lastInterval.appliedLevels` is a fresh object of the actual settings used, not requested settings. beforeEnvironment/afterEnvironment contain the three climate values; beforeWater/usedLitres are litres; actualDripLps is usedLitres/dt. `growthCropIds` and `damagedCropIds` are actual increments in crop order. It is valid for pending commands to remain at a terminal win/loss; they never apply after the result.
- `events` use detached `{type,at,tick,...details}`. select/select-blocked details are `{direction,dialId}`; command details are `{command:<base command>}`; limit details are `{dialId,requestedLevel,delta}` where delta is 1 or -1; applied details are `{command:<applied receipt>}`; won/lost details are `{reason:null|lostReason,deadCropIds,unfinishedCropIds}`. lastAction is null initially and otherwise persists as a detached copy of the latest actual event. Held A/B generates no repeat command; physics still advances normally. Terminal inputs change no field.
- Phase is playing/won/lost. lostReason is null/crop/water/timeout. elapsed=tick/60, remaining=max(0,90−elapsed). All public arrays, receipts, before/after objects and pending commands are independent copies where they represent history. Private input bookkeeping is excluded from rendering and independent public planning.

## Evidence scope

The approved independent design arithmetic confirms that each authored level admits all three maturity quotas with zero damage and remaining water. This is design feasibility, not a production model test, browser run or physical-hardware validation. Public feasibility contains parameters and aggregate outcomes only. Accepted input schedules remain private design witnesses and are not imported by the production model, public pilot or renderer. The exact public rules and facts above are sufficient to devise a separate strategy.

`tests/game-model.test.cjs` contains 14 focused rule/input tests. Explicit synthetic fixtures mutate public environment, coefficients, counters or crop bands solely to isolate arithmetic and boundary precedence; they are not ordinary play or feasibility evidence. The separately reviewed observation pilot and normal-input harness establish ordinary outcomes. Browser recording and physical-device validation are distinct evidence classes; no physical television test is claimed.
