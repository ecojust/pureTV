# Rooftop Runner — public model contract

Stationary screen runner progresses through public world geometry at a forced145/165/185 units per active second. No direction input changes speed or position. Levels have8/11/14 separate decision obstacles and lengths2540/3220/3920. The player's world x is the foot center; y is foot height above roof, positive upward. Body width24, standing height48, crouch height26. Gravity980, jump impulse400, natural apex~81.63 and flight~0.816s on level ground.

A fresh allowed A edge jumps only while grounded at a supported foot point and B is not held. B is continuous crouch, including in air; it changes only body height, never velocity or gravity. B+A means crouch; the A edge is consumed and not buffered. Airborne A is also free blocked and consumes its edge. A held across landing cannot repeat without release. Direction buttons have no gameplay action.

## Public obstacles and support

Each layout is {id,name,nameZh,speed,length,obstacles}; obstacle is {id,type,x,width,bottom,top}. Types are box,beam,gap. Boxes have bottom0, top32/35/38 and width34/39/44; beams bottom34,top100,width84/96/108. Gaps width72/86/100, bottom/topnull. All positions/geometry are public. No route or action sequence is shipped.

Boxes/beams are fatal obstacles, never landing platforms. The body rectangle is [x-12,x+12] horizontally and [y,y+height] vertically. Positive overlap in both dimensions is collision. Merely touching with no positive-overlap interval is safe. Spatial overlap comparisons use1e-10 tolerance to ignore floating-point residue at exact tangency; this is separate from the1e-8 roof-height canonicalization. On a crossing collision the receipt time is the entry-time infimum of the positive-overlap interval, since a first strict-overlap instant mathematically has no minimum.

Roof support is determined by the foot center outside every open gap interval (gap.x,gap.x+width). At the exact near boundary there is support for a fresh A, processed before departure. If no jump occurs, the immediately following positive-time segment is unsupported and gravity starts there, without a delayed physics tick. At the far boundary, downward y=0 may land. Crossing the far roof edge with y<0 is an immediate roof-edge fall; never snap a fallen character back atop the roof. y<=-84 is fall loss even before that far edge. y within1e-8 of zero at a real ground/roof-edge event is canonicalized to0 to avoid floating residue misclassifying exact landings. Gap coordinates are canonicalized only at their computed crossing events. When such a physical event and the admitted interval end differ by at most8 machine-epsilon units scaled by max(1,absolute active time), they share the interval-end time and exact event coordinate. This removes floating residue at a theoretically exact edge without dropping admitted time; a separate positive-time sample, however tiny, still advances and departs normally.

## Physics, timing and outcome

Motion uses analytic x=x0+speed*t and airborne y=y0+vy*t−490*t², vy=vy0−980*t. Grounded y=vy=0. Integration uses absolute1/240s grid boundaries and splits at gap edges, obstacle faces, apex, downward y=0, fall depth and finish. Within each interval, exact quadratic y cuts and linear x cuts divide the rectangle-overlap inequalities; midpoint testing on each open subinterval determines whether positive overlap exists. This is analytic parabolic AABB sweeping, not endpoint overlap or a scripted action lookup.

At admitted sample start apply pose change, then allowed fresh jump. Immediate pose expansion is collision-checked: releasing B under a beam can fail at the sample's starting time. Cancellation suppresses crouch and also expands the body; the world continues. Pause freezes everything exactly, including pose, before input mutation. Resuming does not inject artificial time or restore a previously held action.

Physical collision/fall precedes finish at the same instant. Crossing x>=length with y>=0 wins, including airborne; crossing below0 loses fall. Finite authored levels leave the finish clear. Obstacles count as passed when the player's rear x-12 reaches their far edge; this is reporting only, never the winning predicate. Terminal uses the earliest physical event, truncates unused dt and freezes all fields on later calls before input reads. Won score100/reasonempty; losses score0 with reasonbox/beam/fall. Cause may box/beam/roof-edge/fall-depth/finish-below/finish.

## API and state

Only create(seed,level),step(state,dt,input),deeply frozen config. Config constants: defaultSeed797,width24,standHeight48,crouchHeight26,gravity980,jumpSpeed400,fallDepth84,quantum1/240,heightEpsilon1e-8,maxElapsed86400,maxCounter2147483647 and public layouts. Seed integer0..4294967295 else797; level0..2 else0. Seed records but does not alter geometry.

State schema,seed,level,phase,reason,score,x,y,vy,height,grounded,crouching,speed,length,time,elapsed,elapsedCapped,passed,cleared,jumps,landings,crouchEntries,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message. Cleared holds passed obstacle IDs, bounded by obstacle count. No collision predictor or solution field. LastCommand idle/jump/crouch/jump-blocked. TerminalReceipt detached {cause,obstacleId|null,time,x,y,vy,height,grounded,crouching,passed,total,jumps,landings,crouchEntries,level,score,phase,reason}. Events include jump,crouch,stand,depart,land,clear,blocked,win,collision with call/time and relevant public geometry.

## Admission and release lifecycle

Finite numeric0<dt<=0.25 admitted; invalid dt, pausedtrue and terminal exact no-ops. Preserve all representable positive time spans, including1e-12 at create. Input reads only own data descriptors of x/y/a/b/cancelEpoch/cancelled/paused on nonarray objects; getters/inherited ignored, descriptor failure whole-neutral. Literaltrue flags, finite axesclamped[-1,1], nonnegative safe integer epoch. aPressed/bPressed ignored.

Initially unarmed. Changed non-null epoch after baseline or cancelledfalse→true disarms before controls. Disarming or cancelled samples cannot rearm. A later noncancelled sample with a/bfalse and both axes magnitude<=0.5 arms future samples. A fresh edge requires armed at entry; B requires armed for its whole held sample. Held values recorded even while suppressed. World movement and gravity continue when controls are unarmed/cancelled. No jump buffering or wall-clock source. Calls/blockedActions cap maxCounter; elapsed caps maxElapsed with sticky elapsedCapped.

## Evidence

Ordinary80ms pilots with small interval jitter inspect public upcoming obstacles and emit only A/B inputs; routes and solvers stay in tests. Synthetic interval/tangency/edge cases are explicitly labelled. Browser real-time keyboard and software frames are not physical TV/phone evidence.
