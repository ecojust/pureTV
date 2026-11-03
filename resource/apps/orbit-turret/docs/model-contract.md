# Orbit Turret — public model contract

Fixed origin cannon; no player translation. Positive angles and rotation are clockwise in screen coordinates, zero points right. The initial angle is -π/2 modulo2π. Left/right input x rotates continuously at2.4 radians/second, multiplied by clamped x. Up/down has no gameplay action. Held A emits actual straight bullets, speed300, radius4, muzzle distance32, lifetime1.1s, cadence0.22 active seconds. Fresh B activates a1.25s circular shield of radius64, at most twice per round. Shield cannot be refreshed while active, and a blocked B is free. Rotation, fire and fresh shield can act together.

The base has radius24 and3HP. An enemy disk radius11 touching the base removes that enemy and costs1HP. A shield absorbs only actual intersecting enemy disks (center radius<=75), including enemies already inside when activated. Shield is not a global clear. One bullet hit destroys one enemy and consumes the bullet. No enemies shoot; only physical contact harms the base. Nothing depends on aim being near a preset angle.

## Public schedules and paths

Levels have8/12/16 enemies in2/3/4 public waves of4. Each layout exposes id/name/nameZh,goal,waves,spawns. Every spawn entry is {id,at,wave,angle,speed,spin}; radius starts206. At active age t its radius is206-speed*t, polar angle is angle+spin*t, and x/y follow cos/sin. Some entries have spin0 and move straight inward. All begin outside the shield and base. No routes, aiming hints or solver are shipped. Seed is recorded but does not randomize schedules.

## Time, emission and collisions

All admitted time is active time. Pause freezes everything exactly. Cancel/disconnection gates controls but the existing world continues; it is not a pause. Cooldown continues while A is released or input is cancelled. When A is allowed and ready, the first shot is immediate. Thereafter readyAt=lastShotTime+0.22. A ready shot uses the current angle before subsequent rotation. At the end of an admitted interval, due spawn/fire/contact boundaries are processed under that interval's controls too; a later release never retracts a shot already emitted.

At admitted sample start, a fresh allowed B may activate shield. At each time boundary: expire shield, spawn due entries, emit a ready held-A shot, then resolve immediate contacts. Motion divides at absolute1/240s grid boundaries, input boundaries, spawn times, ready shot times, shield expiry and bullet lifetime expiry. Enemy motion endpoints are analytic polar coordinates. Between endpoints, collision uses the swept *linear chord* of each enemy and relative bullet segment, not an asserted exact curved-path intersection. The step size limits the approximation; partition comparisons allow2e-5 coordinate tolerance away from contact ambiguity.

Within each interval, calculate the first intersection fraction for each bullet/enemy pair and each enemy/base or active shield. Sort by physical time; ties within1e-10 use bullet hit before shield before base, then enemyID and bulletID. Skip pairs whose enemy/bullet was already removed. Shield is active on [activation,expiry), so a contact exactly at expiry is not absorbed. A surviving bullet stops at lifetime1.1 and cannot hit later. Exact disk tangency counts as contact within1e-10 numerical tolerance.

On each resolved enemy, apply the cause then check HP<=0 first: immediate loss even if that was the final scheduled enemy. Otherwise, resolving all scheduled enemies wins. Thus simultaneous final bullet+base contacts can still lose when base reaches zero. Terminal state advances only to the terminal contact instant; unused dt and all future physics are discarded. Subsequent terminal calls are exact no-ops before input inspection. Score100 only on victory, else0. Impacts survived by the base count as resolved; up to two leaks may still win.

## API and snapshots

Only create(seed,level),step(state,dt,input), deeply frozen config. Config includes defaultSeed794, geometry/physics constants, maxElapsed86400,maxCounter2147483647,maxBullets8,effectLifetime0.45 and public layouts. Seed accepts integer0..4294967295 else794; level0..2 else0.

State: schema,seed,level,phase,reason,score,time,elapsed,elapsedCapped,angle,health,goal,spawned,resolved,shotKills,shieldKills,impacts,shots,shieldUses,shieldCharges,shieldUntil,shieldRemaining,readyAt,cooldown,enemies,bullets,effects,collisions,nextBulletId,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Enemy: {id,wave,spawnedAt,angle0,speed,spin,age,r,angle,x,y}. Bullet: {id,x,y,vx,vy,bornAt,angle}. Effects: {x,y,cause,age}, expire after0.45 active seconds. At most8 bullets; normal cadence/TTL permit at most6. Collisions have one receipt per resolved enemy: {time,cause:'shot'|'shield'|'impact',enemyId,bulletId|null,x,y,bulletX|null,bulletY|null}; bounded by goal. Enemy IDs index their public spawn. Enemies/bullets are detached active arrays, not future answer data. Current wave is derived from spawned entry count.

Events may contain spawn,fire,shield,blocked,shot,absorb,impact,win,collision; each includes call and time and relevant ID/position. Events clear each admitted sample and are bounded by finite per-sample actions. LastCommand is a descriptive string: idle,turn,fire,turn+fire,shield or their +shield combination. TerminalReceipt copies cause,level,time,health,goal,spawned,resolved,shotKills,shieldKills,impacts,shots,shieldUses,score,phase,reason,collisions; cause cleared/base-destroyed. Won reason empty; lost reason base-destroyed.

## Input and resource boundaries

Finite numeric0<dt<=0.25 only. Invalid dt, pausedtrue and terminal state are exact no-ops. Input reads only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on a non-array object; getters/inherited fields ignored, descriptor failure discards partial reads to neutral. Literaltrue flags, finite axes clamp[-1,1], nonnegative safe-integer epochs. aPressed/bPressed are ignored.

Initially unarmed. Changed non-null epoch after baseline or cancelledfalse→true disarms before controls. All cancelled samples suppress all controls. Disarming/cancelled samples cannot rearm. A later noncancelled sample with both axes magnitude<=0.5 and a/bfalse arms future input. Full x is applied continuously once armed; deadzone abs(x)<=0.1 produces no rotation. Fresh B needs a rising edge; A intentionally repeats while held at the documented cadence. Held states are recorded even while suppressed. Terminal freezes; calls/blockedActions saturate; elapsed caps and elapsedCapped is sticky. Existing physics remains active while unarmed. No wall-clock access or random source.

## Validation boundaries

Normal success/loss claims use public create/step or real browser keyboard controls. Independent pilots use current public enemy positions/velocities and normal x/A/B, with80ms observation periods and timing jitter; they do not set aim, spawn or phase. Synthetic contact/tie/edge fixtures are explicitly labelled. Browser and encoded video evidence do not claim physical TV/phone testing.
