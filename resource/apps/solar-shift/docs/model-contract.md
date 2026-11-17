# Solar Shift / 逐日供电 — public model contract

This approved contract defines a 60-second compressed day/night resource simulation, not a physical solar installation model. It contains three fixed-priority devices, one battery and a globally oriented panel. The public parameters below passed the first approved bounded author design exploration without adjustment. That is arithmetic/control feasibility, not production, public-pilot, browser or hardware success. Author control witnesses are not part of the public contract or production source.

## Controls and clock

- Three vertically ordered device cards, priorities 1/2/3, IDs D1/D2/D3. Up/Left selects the preceding card, Down/Right the next, clamped without wrap. Direction inputs use finite values clamped to[-1,1]; max(abs(x),abs(y))<.25 is neutral, exactly.25 is active. Otherwise use horizontal when abs(x)>=abs(y), otherwise vertical; positive selects next and negative selects previous. Initial focus D1. All three devices initially enabled, panel initially E. All-on with no actions must not win.
- A rotates the **global panel**, regardless of selected card, E→S→W→E. B toggles **the selected device**. Turning off a critical device does not remove its supply obligation. These are fresh-edge actions; holding does not repeat. B takes precedence and discards A/navigation for that tick; otherwise navigation then A. Direction repeats use immediate/20-tick/10-tick shared behavior.
- Fixed60Hz. The existing finite-dt/.25-second call cap applies. Pending subtick input stores A/B edges; directions use the current held axes. First cancelEpoch binds without cancellation; a changed epoch clears pending edges/repeats. input.cancelled suppresses controls for all ticks of that call; it never pauses energy/weather/heat integration. Cancellation preserves switches/orientation/history-free actual state and cannot turn an old held button into a fresh operation. Shared pause performs no Model steps. R recreates the same initial level, not the last configuration.
- Every playing tick applies permitted input, integrates exactly one interval [oldTick/60,newTick/60), then assesses loss and day completion. Operation/event tick is that committed newTick, at=newTick/60; the action affects the just-completed [old,new) interval, not a future interval. Duration60seconds/3600ticks; there is no extra90-second waiting period and no early quota win. Terminal calls freeze the entire state.

## Public sunlight: phase model, no geometric shadow inference

Panel angles E/S/W are −60/0/+60 degrees. Public periods: dawn [0,14) angle−60, noon [14,28) angle0, dusk [28,42) angle+60, night [42,60) angle null. Irradiance multipliers are .8/1/.8/0. Each level also lists public shadow intervals; any shadow makes generation exactly0. Otherwise alignment is1 for identical orientation, .5 for adjacent positions,0 for opposite E/W. `generationW=ratedSolarW*irradiance*alignment`.

Stable public period id/name pairs are `dawn/晨光`, `noon/正午`, `dusk/夕照`, `night/夜间`. Device `nameEn` is an ASCII display label only; it does not change priority or any physical rule.

Use the interval's **start time** for all solar/weather coefficients and the just-applied orientation. No device sees a different weather sample. All telemetry from the last completed interval retains `fromTime/toTime`; a phase boundary is represented on the next interval. The renderer may show the public schedule but must identify it as phase/weather information, not cast invented geometric shadows. Flow animation is based only on actual delivered/charge/discharge power.

## One auditable energy allocation

Units: W=J/s, E in J, dt=1/60s. Battery efficiency is1; no hidden conversion loss. Let G=generationW×dt. Device i requests Ri=demandWi×dt when enabled, otherwise0; R=ΣRi.

1. Discharge D=min(max(0,R−G),oldE,maxDischargeW×dt).
2. Charge C=min(max(0,G−R),capacityJ−oldE,maxChargeW×dt). C and D are mutually exclusive.
3. Allocate the single available G+D to devices in ascending priority. Xi=min(Ri,remaining available); subtract Xi once. A low-priority device may be partially supplied; disabled devices receive0. Do not reuse discharge limits per device.
4. NewE=oldE−D+C; spill=G+D−ΣXi−C. Both energy and power limits act simultaneously. Numeric checks allow1e−8J accounting tolerance, but production values must stay in [0,capacity] and spill cannot become negative; tiny floating subtraction residue may be normalized consistently, never counted as generation.
5. Each device's cumulative supplied energy adds **actual Xi**, including partial supply and any excess after its quota. Enabled devices keep consuming after meeting quota; quota completion does not switch them off automatically. Separate quota gates are `deliveredJ>=quotaJ−1e−8`; oversupply to one device never pays another's quota.

Cumulative ledger: `initialBatteryJ+solarJ = energyJ+deliveredJ+spilledJ` within1e−8J. `deliveredJ=Σdevice.deliveredJ`; chargedJ/dischargedJ are additional throughput diagnostics, not extra terms in that conservation equation.

## Critical service, heat and terminal ordering

Critical device brownoutTicks increments on each tick its actual Xi/dt < demandW−1e−8, **including OFF**, and resets only on a full-power tick. Noncritical brownoutTicks stays0. Limits are integral fixed-tick counts, displayed in seconds. A device can accumulate quota from partial power while still accumulating a continuous brownout.

Battery thermal rate = heatChargeCoefficient×chargeW² + heatDischargeCoefficient×dischargeW² − coolingPerSecond×(oldTemperatureC−ambientC). New temperature=max(ambientC,oldTemperatureC+rate×dt). This is a disclosed simplified thermal approximation; generated/delivered electrical energy is not altered by this diagnostic temperature formula. High sustained battery power can overheat even while stored energy remains.

After energy/quota/heat/brownout updates, priority is: (1) temperature>=thermalLimitC → `heat`; (2) any critical brownoutTicks>=its limit → `brownout`; (3) at tick3600, all three independent quotas met → won, otherwise `quota`. The final interval contributes real energy before this decision; a same-tick thermal or service failure takes precedence over quota completion. Quotas met earlier must still survive through night.

Score: each quotaMet device contributes200; otherwise floor(200×min(1,device.deliveredJ/device.quotaJ)). Sum these contributions, plus when won1000+2×floor(energyJ+1e−8). The scoring-only epsilon avoids losing a whole-joule bonus to floating representation and never changes physical battery energy. Thus the quota tolerance cannot show a completed device worth199. Initial score0. No points for requested power, switching, spilled generation or one device's excess quota.

## Public level table

All levels use the periods/alignment above, initial all-on/E/D1 and exactly three devices. Device rows are priority order; quota is J, demand W. `criticalLimit` null means no continuous-service requirement. Temperatures are °C; thermal coefficients are the exact game constants, not a chemistry specification.

| level | name | ratedSolarW | shadows [start,end) | capacity / initial J | charge / discharge W | ambient / initial / limit C | heat charge / discharge / cooling |
|---|---|---:|---|---|---|---|---|
|1|海边信标|15|[10,13), [25,28)|90 / 36|5 / 8|24 / 26 / 58|.05 / .10 / .08|
|2|山谷泵站|17.5|[5,11), [30,33)|105 / 55|4.5 / 8|26 / 32 / 54|.05 / .10 / .10|
|3|夜间诊所|20|[8,12), [24,28)|120 / 65|6 / 8|25 / 29 / 62|.05 / .10 / .10|

| level | D1 | D2 | D3 |
|---|---|---|---|
|1|信标/BEACON:4W,224J,critical2.5s|水泵/PUMP:3W,72J,noncritical|工坊/WORKSHOP:5W,60J,noncritical|
|2|监测站/MONITOR:4W,224J,critical2.5s|水泵/PUMP:4W,76J,noncritical|通信站/RADIO:5W,70J,noncritical|
|3|诊疗灯/CLINIC:3W,170J,critical2s|冷藏箱/FRIDGE:2W,110J,critical1.5s|净水泵/PURIFIER:5W,100J,noncritical|

## Public state schema

UMD Model.create(seed=1,difficulty=0),step,TICK_HZ60; no solution/controller/forced outcome. Standard width960/height540/seed/level/difficulty/levelName/phase/tick/elapsed/remaining/timeLimit60/score/message/lostReason. `phase:playing|won|lost`; no separate editable/simulating mode. All required public data is non-underscore; private input bookkeeping is not planner/renderer data.

- `selectedId`, `deviceCount:3`, `devices[]` priority order `{id,name,nameEn,priority,demandW,quotaJ,critical,maxBrownoutTicks,enabled,requestedW,deliveredW,deliveredJ,quotaMet,brownoutTicks,brownoutSeconds}`. Noncritical maxBrownoutTicks=null. Initial delivered/requested telemetry0 and totals0 despite enabled=true; rated demand remains visible separately.
- `sunPeriods[]` `{id,name,start,end,angleDeg,irradiance}`, `shadowWindows[]` `{start,end}` are immutable and public. `solar={ratedW,orientationIndex,orientation,panelAngleDeg,periodId,sunAngleDeg,irradiance,shadowed,alignment,generationW}`. At create weather describes t0/orientationE but generationW=0 until the first integrated interval; lastFlow is null.
- `battery={capacityJ,initialEnergyJ,energyJ,maxChargeW,maxDischargeW,chargeW,dischargeW,ambientC,initialTemperatureC,temperatureC,thermalLimitC,heatChargeCoefficient,heatDischargeCoefficient,coolingPerSecond,thermalRateCPerSecond}`. Last-interval charge/discharge/rate initially0.
- `ledger={initialBatteryJ,solarJ,deliveredJ,spilledJ,chargedJ,dischargedJ,energyErrorJ}`. Initial cumulative flows0; energyErrorJ=initialBatteryJ+solarJ−energyJ−deliveredJ−spilledJ.
- `lastFlow=null|{id:tick,fromTime,toTime,solarW,requestedW,deliveredW,unservedW,chargeW,dischargeW,spillW,solarJ,deliveredJ,chargeJ,dischargeJ,spillJ,batteryBeforeJ,batteryAfterJ,temperatureBeforeC,temperatureAfterC,deviceFlows:[{deviceId,requestedW,deliveredW,deliveredJ}]}`. All W/J describe that completed interval, not a hypothetical prediction; arrays and receipts detached.
- `panelTurns,toggleCount,lastOperation:null|{id,kind:'rotate'|'toggle',at,tick,before,after,deviceId:null|id}`; operation id=tick=committed newTick, at=tick/60; orientation before/after are E/S/W and toggles boolean. Sparse IDs identify actual operation ticks; counters independently count actual rotations/toggles. No history/undo budget.
- `quotaMetCount,allQuotasMet`. `failure:null|{reason:'heat'|'brownout'|'quota',deviceIds,missingQuotaDeviceIds,temperatureC}`. heat deviceIds=[], brownout deviceIds=all currently breached critical IDs in priority order, quota deviceIds=missing quota IDs. All loss types retain actual missingQuotaDeviceIds.
- `lastAction/events` common detached `{type,at,tick,...details}`; select/select-blocked `{direction,id}`, rotate/toggle copies lastOperation, won/lost `{reason}`. Outer step clears events then retains its last32 actual events; terminal calls change nothing. No per-tick flow event spam and no private source consulted by renderer/planner.

## Design exploration and acceptance scope

Root reviewed the new scratch exploration source before its single first execution. The search was bounded to24 feedback parameter sets per level,3600 arithmetic ticks each, and at most one discrete A/B/navigation operation per15ticks; all three succeeded with their first candidate. No initial parameter was changed. The route-free `design-first/public-feasibility.json` retains exact public facts and aggregates; private witnesses remain outside QA/renderer/production. No uniqueness or optimality claim is made.

Actual design outcomes: all three complete60seconds, with25/17/7 discrete operations; final batteries18/33/30J and maximum temperatures40.691/40.287/46.723°C. Critical brownout duration remains0. No-action all-on outcomes are brownout/heat/heat, so the puzzle is not automatic. Separate bounded author probes demonstrate brownout, end-of-day missing quotas and heat failures on every level. All electrical ledger residuals are below3.1e−11J. These are author arithmetic witnesses, not additional ordinary Model games or an independent second implementation.

Formal tests later cover focused arithmetic/priority/limits/quotas/thermal/brownout/clock boundaries. QA owns the only three ordinary wins and three meaningful losses; independent review reuses their saved telemetry instead of executing a duplicate control matrix. No browser/hardware/real-game claims arise from this author exploration.
