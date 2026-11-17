# Lane Bowling / 球道击柱 — public model contract

Written before implementation. A simplified top-down circle/impulse bowling game, not a professional bowling simulation. Real active dt advances ball/pins. No angle-based awards, target trajectory or winning route. Every fallen pin has a physical collision-speed or displacement receipt. Public initial layouts and all live positions/velocities are visible.

## Aim and objective

World320×420, x right/y down. Launch ball at(160,385), forward toward decreasing y. Angle degrees−24..24 in steps3; left decreases/right increases. Power index0..3, up increases/down decreases; speeds230/275/320/365. Initial angle0/power2. In aiming stage A spends one throw and launches `(sin(angle)*speed,-cos(angle)*speed)`. B unused and ignored. During rolling, aiming/launch commands are blocked free but consume their edges; held A cannot launch the next throw automatically.

Three public layouts have6/8/10 pins and2/3/3 throws:

- triangle-six / TRIANGLE SIX / 六柱三角: (160,148),(147,124),(173,124),(134,100),(160,100),(186,100).
- twin-diamonds / TWIN DIAMONDS / 双菱八柱: (125,145),(112,121),(138,121),(125,97),(195,145),(182,121),(208,121),(195,97).
- broad-crown / BROAD CROWN / 十柱冠阵: (160,168),(138,140),(182,140),(116,112),(160,112),(204,112),(94,84),(138,84),(182,84),(226,84).

At shot end all fallen pins are swept from collision physics (kept as inactive public records); remaining standing pins retain actual positions and active=true. Every pin velocity becomes0, ball becomesnull, physicsRemainder0 and stage becomesaiming, including terminal. Aim/power persist. Clear all pins wins `cleared`; otherwise exhausted throws loses `throws`; winning final throw takes precedence. Score round(100*fallen/total),100 on win. No professional frame/spare/strike bonus.

## Deterministic physics

Step dt must be finite numeric `(0,.25]`. Fixed tick h=1/120; accumulate dt only while rolling, execute floor((remainder+dt+1e-10)/h) ticks, preserve fractional remainder, zero tiny negative remainder. A launch is processed before the same call's physics dt. Pause freezes everything; input cancellation still advances active rolling physics. All substeps use doubles and stable ascending pin IDs.

Ball radius12,mass3; pins radius10,mass1. Ball friction38 and pin friction90 are constant speed reductions per second, preserving direction; speeds below rest threshold5 are set exactly0. Speed cap480 after impacts. Restitution0.65 for every circle contact. Pin wall restitution0.2.

Each tick, in order:

1. Reduce each active body's speed by friction*h; if remaining speed<5, set velocity0. Integrate position using new velocity*h. Ball can move at most4 units per tick, pins likewise; maximum relative travel8 is less than a pin diameter20.
2. Apply boundaries. Ball center x<18 or x>302 is gutter: deactivate and zero velocity; y<−12 or y>432 is out. Pin centers clamp to x10..310,y10..410, reflecting only outward velocity with factor0.2. Boundary contact alone is not a score award.
3. Two contact passes. Each pass visits ball with active pins in ID order, then all active pin pairs i<j in ID order. If center distance<radius sum, normal points a→b (coincident centers use(1,0)). Separate FULL overlap weighted by inverse masses. If relative normal velocity `(vb−va)·n < −1e-8`, apply `j=−(1+0.65)*relative/(1/ma+1/mb)` and equal/opposite impulse. Clamp each resulting speed to480. Record collision only for j>1e-6. The same law applies to ball-pin and pin-pin; fallen pins stay collidable until this shot ends.
4. Reapply boundaries after separation. For any still-standing pin, an impulse leaving its speed≥48 knocks it down immediately with source ball/pin; additionally distance≥6.5 from its ORIGINAL public layout position knocks it down with source displacement. All such falls record actual coordinates, speed, displacement, shot/tick and source ID. There is no random fall chance.
5. Increment shot tick and elapsed=ticks/120. If ball absent or exactly stopped AND every active pin is exactly stopped, quietTicks increments, else resets.12 quiet ticks (0.1s) ends the shot. A mechanical sweep also ends the shot after720 ticks(6 active seconds), freezing current positions/velocities without awarding any additional falls; this finite roll limit is visible in the rules. Clear/exhaustion evaluates after sweep. No unbounded simulation loop.

Impacts test fall speed immediately after each impulse, before later contacts can reduce it; displacement fallback happens after the two passes. Boundary check may deactivate a ball during the tick. All credited pins have a stored fall receipt even if later velocity becomes zero. Physical friction and collisions determine routes; exact floating point ties are not used as puzzle clues.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply frozen config, via CommonJS/window.PureModel. defaultSeed792; seed integer0..4294967295 else792; level integer0..2 else0. Config includes all constants above and public layouts `{id,name,nameZh,throws,pins:[{x,y}]}`. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason `''`/cleared/throws,score,stage aiming/rolling,angle0,power2,width320,height420,ballnull,pins `{id,x,y,vx,vy,radius:10,mass:1,originX,originY,fallen:false,active:true,fall:null}`,totalPins,standingCount,fallenCount,shotsUsed0,shotLimit,shotsRemaining,shotTicks0,shotElapsed0,physicsRemainder0,quietTicks0,shotGutterfalse,shotExit'',shotBallHits0,shotPinHits0,totalBallHits0,totalPinHits0,shotStartFallen[],lastShotnull,shotHistory[],fallReceipts[],physicsTicks0;
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message. Ball when present `{id:0,x,y,vx,vy,radius:12,mass:3,active:true}`.

Fall `{pin,shot,tick,source:'ball'|'pin'|'displacement',sourceId,x,y,speed,displacement}`; tick is1-based(current shotTicks+1), displacement sourceId=null; ball sourceId0; pin sourceId=other pin ID. fallReceipts one per pin, bounded10. Shot receipt `{shot,angle,power,ticks,elapsed,end:'settled'|'sweep',gutter,exit,ballHits,pinHits,newlyFallen,fallenIds,standingCount,cleared}` detached. History bounded by initial shot budget≤3. Last shot is a separate copy. terminalReceipt `{cause,level,call,elapsed,shotsUsed,fallenCount,standingCount,score,lastShot,pins,phase,reason}` detached.

Events array at most32 most recent entries per call, each includes call: aim `{angle,power}`, launch `{shot,angle,power}`, impact `{a,b,impulse}`, fall `{receipt}`, shot-end `{receipt}`, blocked `{reason:'rolling'|'angle-limit'|'power-limit'}`, win/collision `{reason}`. Some physics calls naturally contain multiple collision/fall events. `shotExit` is first ball exit `gutter` or `out`; the ball's absence does not skip remaining moving pins.

## Input lifecycle

Terminal or invalid dt exact no-op before input reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys. Invalid object/array/descriptor failure neutral. Literaltrue flags; finite axes clamp[-1,1]; dominant magnitude>.5 selects direction, vertical on ties. Epoch nonnegative safe integer elseignored.

Pausedtrue exact no-op. Initial full-neutral arms. First epoch establishes baseline; later changes or false→true cancelled edge disarm before commands and cannot rearm same call. Cancelled input never commands, but active physics continues. Later noncancelled full-neutral rearms. Armed-at-start A rise, else changed nonneutral direction; B unused. Consume suppressed simultaneous edges. Held controls do not repeat. Neutral means no A/B/direction. Elapsed/diagnostics saturate(maxElapsed86400,maxCounter2147483647), with no overall deadline. Terminal freezes.

## Verification

Test-only aim/power search and ordinary input routes win all three, with actual collision receipts; naturally repeat gutter throws to lose. Independent physics reference compares full public body evolution. Checks include chain impacts, collision speed/displacement thresholds, finite-speed head-on no tunneling, momentum/restitution/friction boundaries, fallen sweep, final-throw precedence, dt partition, pause/cancel/held/terminal. Synthetic physics fixtures are explicitly labelled and never used as gameplay wins. Browser QA uses real keys and wall-clock time only.
