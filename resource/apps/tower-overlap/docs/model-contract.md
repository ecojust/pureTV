# Tower Overlap — public model contract

Public design written before implementation/execution. No passed-check or publication claim is made here.

## Timing and geometric goal

One slab moves horizontally over the tower. A commits its current horizontal position and starts a0.3active-second drop. It does not slide horizontally while dropping. At landing, only its horizontal intersection with the previous slab remains. Removed material becomes falling offcuts. A zero-width intersection loses as a miss; a positive intersection narrower than16 units loses as too-narrow. Exactly16 units is safe. Computed overlap below1e−10 is canonicalized to0; overlap within1e−10 of16 is canonicalized to16 to absorb floating-point integration error. The retained left edge remains max(sourceX,previousX); its right edge and trim/offcut geometry use the canonical width, so endpoint discrepancies are bounded by that same tolerance. Other widths are not rounded.

Every safe landing adds one floor. Reach6/8/10 new floors above the starting base to win. A failed landing does not count toward the goal. Goal judgment occurs before spawning another slab. Starting widths are220/200/180 on a600unit-wide field. The initial base is centered and not counted as a built floor. The moving slab starts at the left edge and alternates spawn sides after each safe floor; its width is the retained width of the new top.

| Level | id / English | 中文 | Width | Base speed | Goal | Motion profile |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | steady-yard / STEADY YARD | 匀速工地 | 220 | 145 | 6 | constant factor1, cycle1 second |
| 1 | pulse-yard / PULSE YARD | 节拍工地 | 200 | 170 | 8 | period1.6s: first0.8s factor1.2, next0.8s factor0.8 |
| 2 | swell-yard / SWELL YARD | 渐速工地 | 180 | 195 | 10 | period2.4s: factor rises linearly0.7→1.3 in1.2s, then falls linearly1.3→0.7 |

Profile phase resets to0 for each new slab. Slab.cycle is the profile phase in seconds modulo layout.period, always in [0,period); it is not a lifetime duration. Profile clock advances only while moving. Horizontal movement reflects at x=0 and x=600−width, preserving leftover travel distance. Exact left/right boundary direction after integration is right/left respectively. Signed velocity always reflects the current profile speed and direction; while dropping it is0. No direction/B action steers the slab; only an A rising edge commits a drop.

## API, state and bounded data

Expose only create(seed,level), step(state,dt,input), deeply frozen config via CommonJS/window.PureModel. Config contains defaultSeed764,fieldWidth600,minWidth16,dropDuration0.3,offcutLifetime1.2,maxElapsed86400,maxCounter2147483647,layouts. Layouts contain id,name,nameZh,width,speed,goal,profile,period. Seed records identity without randomness; integer0..4294967295 accepted, otherwise764; level integer0..2, otherwise0. Create allocates detached state; step mutates and returns it. No solver, wall clock, I/O, forced placement or state setter exists.

State fields: schema,seed,level,phase,reason,score,mode,floors,floorsBuilt,goal,slab,dropElapsed,drops,offcuts,lastLanding,elapsed,elapsedCapped,calls,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Floors is [{index:0,x:(600−width)/2,width}] initially; it stores at mostgoal+1 safe slabs including the base. FloorsBuilt=floors.length−1. Slab is {x,width,direction,velocity,cycle}, initially x0,direction1,cycle0 and the appropriate profile velocity. Playing modes moving/dropping have a slab. Terminal mode settled has slab null. Initial phase playing/reasonempty/score0. Won score100, lost score0; lost reason miss/too-narrow.

DropElapsed is0 while moving,0..0.3 while dropping, and0.3 after terminal landing. Drops counts accepted A actions and is bounded bygoal+1. LastLanding null until first landing, then detached {drop,index,sourceX,sourceWidth,previousX,previousWidth,x,width,leftTrim,rightTrim,accepted,cause}. x=max(sourceX,previousX), width=max(0,min(right edges)−x); the retained interval is meaningful only if width>0. Cause safe/success/miss/too-narrow. Accepted means width>=16. Index is the proposed next floor number, even for failure.

Offcuts contains at most2 fragments from the latest landing: {x,width,side,age}, side−1/1, age0..1.2. A zero-overlap miss produces one whole-slab offcut toward its side. Positive overlap produces left/right excess fragments; a too-narrow retained fragment is represented by lastLanding rather than counted as a floor. Offcuts expire after1.2 active seconds and never affect collision or scoring. A later landing replaces this decorative list. Terminal state freezes all fragments and fields.

TerminalReceipt copies {cause,call,elapsed,level,floors,floorsBuilt,goal,drops,lastLanding,score,phase,reason}; it is independent of live floors/lastLanding.

## Integration and action order

Admit only finite numeric0<dt<=0.25. Terminal and invalid-dt calls are exact no-ops before input inspection. Normalized pausedtrue calls are exact no-ops. An admitted call advances informational elapsed/calls with saturation, clears events/lastCommand and handles at most one A edge at the current visible position BEFORE integrating that call's time. A during an existing drop is consumed without starting another drop. A held through landing never triggers the next slab; a release and new press are required.

Then integrate exactly dt of active simulation unless a terminal landing occurs. Moving speed is integrated analytically across the profile's piecewise breakpoints; reflected travel preserves its remainder. Dropping consumes time until0.3, lands, and a surviving new slab receives any remaining dt in the same call. Existing offcut ages advance by each consumed segment; newly generated fragments start at landing and age only for remaining active time. Floating calculations use1e−10 boundary tolerance and tests compare independent partitions within numerical tolerance.

A won/lost landing stops further physics in that call. Informational elapsed already includes the admitted dt, so a terminal receipt can include the remainder of its final sampling frame. It is not a subframe timestamp. Elapsed is capped86400 with sticky elapsedCapped; calls saturates2147483647. These caps do not end the game.

## Input isolation and cancellation

Normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused from nonnull nonarray objects. Ignore getters, inherited and unknown fields; descriptor failure discards all partial input to neutral. Nonthrowing Proxy traps may run. Only literaltrue activates booleans; finite numeric axes clamp[-1,1]; valid cancelEpoch is a nonnegative safe integer.

Initially unarmed, the state needs a noncancelled full-neutral sample. Changed valid epoch after baseline or false→true cancelled disarms before commands. Every cancelled sample suppresses A. A disarm sample cannot rearm; a later admitted noncancelled full-neutral sample is required. Commands require armed at entry. A uses a held false→true edge; aPressed is ignored. B/directions have no action and do not override A, but all fields must be neutral to rearm after cancellation. Every admitted call saves normalized held values.

Cancelled/unarmed samples still advance active slab/drop motion. Actual pause is pausedtrue or a host that stops stepping; cancelling controls alone is not a pause. The host establishes real release/phone disappearance, not neutral model input alone.

Events at most one: drop {x,width,drop}, land {index,x,width,leftTrim,rightTrim}, win with the same landing fields, collision {reason,width}. No-event calls preserve message; invalid/paused/terminal preserve everything.

## Verification

Ordinary wins must time A from public slab/top-floor observations. Real browser checks must use normal wall time and keyboard events without writing state, clocks or forcing alignment. Synthetic exact-boundary/fixture probes are separately labelled. Offline model timing and browser software rendering do not claim physical TV/phone performance.
