# River Hopper / 渡河跃步 — public model contract

Written before implementation. Frogger-like real-time crossing: horizontal moving cars, floating logs that physically carry the player, four distinct home docks. No winning timetable, path or predictor in production. All lane positions, velocities and geometric rules are public.

## Board and control

World420×420,7 rows of60 units, row center y=30+60*row. Player radius10; starts continuous x210,row6. Rows6(start) and3(bank) are safe; rows5/4 roads; rows2/1 river; row0 home docks. Four homes IDs1..4 at x30/150/270/390, width48.

Arrows perform one instantaneous hop: left/right change current continuous x by60; up/down change row by1 retaining x. No horizontal grid snap after riding. A/B unused. An attempted manual hop outside row0..6 or whole-player horizontal bounds10..410 is blocked free `edge`. Valid hop then checks destination immediately at current lane positions, before this call's physical ticks. No swept vertical hop through intervening positions; each hop changes at most one row.

Home support requires abs(x−home.x)+10≤24+1e-9. Entering an unvisited home records it and resets to start with36 ticks(0.3s) input lock; enough distinct homes wins immediately. A repeated home costs one life `repeat-home`, does not increase goal count. Row0 outside docks costs one life `home-miss`. Other deaths are car/water/drift. Three lives; death resets to safe start plus36-tick input lock if lives remain, else terminal `lives`. No invulnerability on a lane. Death/arrival resets only player/support; lanes and active clock keep moving during respawn. Input commands during lock blocked `respawn` and consume edges.

## Public layouts

Each lane `{id,type:'road'|'river',row,speed,width,objects:[{id,x}]}` has objects centered at public x, same width and horizontal speed. IDs1..N are local to each lane. All centers normalize modulo420. Positive speed right.

| Level | Name | Goal / active seconds | row5 road(speed,width,centers) | row4 road | row2 logs | row1 logs |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | quiet-crossing / QUIET CROSSING / 初渡河岸 |2/45|+52,58,[80,290]|−42,48,[30,170,310]|−30,130,[70,210,350]|+36,150,[60,270]|
| 1 | split-current / SPLIT CURRENT / 分流水道 |3/60|+62,62,[45,255]|−52,48,[85,225,365]|−36,124,[30,170,310]|+44,156,[60,270]|
| 2 | busy-banks / BUSY BANKS / 四岸归家 |4/80|+70,50,[55,195,335]|−62,54,[25,165,305]|−42,120,[0,140,280]|+52,110,[60,200,340]|

## Geometry and real-time order

Fixed h=1/120; accumulate all admitted active dt, execute floor((remainder+dt+1e-10)/h) ticks; keep fractional remainder, zero tiny negatives. Terminal stops the loop. All lane bodies move each tick, including while player respawns. Velocities≤70 imply body travel≤0.584 per tick, below player diameter20. No game-state time injection in browser tests.

Periodic horizontal distance to object is `min(abs(x−center),420−abs(x−center))`. This represents clipped object interval parts at both board edges, without teleporting the player. Roads: player on that row collides if this distance≤width/2+10 (contact counts). Cars occupy same-row rectangular bodies; player is at the row center, making this the exact horizontal circle/rectangle contact test. River: entire player foot must be supported, distance+10≤width/2+1e-9. Choose first supporting object ID ascending; no support means `water`.

Each tick:
1. If respawnTicks>0, mark this tick locked; else, when currently on a river row, find support at old positions. Lack of support costs life immediately; if supported, add lane.speed*h DIRECTLY to player.x and increment rideTicks and carriedDistance(abs displacement). Never modulo player.x.
2. Move EVERY lane center by speed*h modulo420 in config/lane/object order.
3. If tick began locked, decrement respawnTicks and skip all player hazard checks for this tick; if a death occurred in step1, leave its new respawn counter unchanged this tick. Otherwise assess current player: bounds outside10..410→drift; road collision→car; river no support→water. Home handling is normally at the hop, but any assessment of row0 uses the same dock rule. Update supportId/supportLane for river, null elsewhere.
4. Increment activeTicks, physicsTicks and update timeLeft=max(0,timeLimit−activeTicks*h). If still playing and activeTicks≥timeLimit*120, terminal `timeout`, regardless of lives. A third-life death during this last tick precedes timeout. A home-winning hop is processed before the call's ticks, so its immediate win precedes timeout. Arrival/death without terminal still allows the clock to expire.

Respawn resets player `{x:210,row:6,facing:'up'}`, supportId/supportLane=null. Original lane phase persists. There is no arbitrary log detach timer: holding still on a supported log is safe until real carrying moves the player's body beyond a world edge. Same-speed overlapping intervals, if any, are harmless; support chooses stable first ID.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply frozen config via CommonJS/window.PureModel. defaultSeed796,maxElapsed86400,maxCounter2147483647,width420,height420,cell60,rows7,playerRadius10,startX210,startRow6,homeWidth48,homes[{id,x}],tick1/120,respawnLimit36,lives3,layouts{name,id,nameZh,target,timeLimit,lanes}. Seed integer0..4294967295 else796; level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason `''`/homes/lives/timeout,score round(100*goalCount/target),width420,height420,cell60,rows7,playerRadius10,player{x,row,facing},homes detached,lanes detached,visited[],goalCount0,target,lives3,maxLives3,timeLimit,timeLeft,activeTicks0,physicsTicks0,physicsRemainder0,respawnTicks0,supportIdnull,supportLanenull,rideTicks0,carriedDistance0,jumps0,deaths0,lastDeathnull,deathHistory[],arrivals[];
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld{a:false,b:false,direction:'none'},lastCommandnone,events[],terminalReceiptnull,message.

`elapsed` is admitted dt diagnostic, including the whole terminal call; physical-clock receipts use activeTicks*h. `timeLeft` is displayed physical active clock at120Hz (not elapsed); no hidden shorter budget.

Death receipt `{cause,x,row,activeTicks,time,objectId,livesAfter}` with objectId car ID or repeated home ID, else null. History≤3; lastDeath separate detached copy. Arrival `{home,x,activeTicks,time,count}`; arrivals≤target≤4, visited in arrival order. terminalReceipt `{cause,level,call,elapsed,activeTicks,timeLeft,lives,visited,goalCount,jumps,deaths,lastDeath,player,lanes,score,phase,reason}` detached.

Events≤16 most recent per call: jump `{from:{x,row},to:{x,row}}`, blocked `{reason:'edge'|'respawn'}`, death `{receipt}`, home `{receipt}`, win/collision `{reason}`. Movement of lanes and carrying are state updates, not per-tick event spam. Diagnostics saturate; no growing path history.

## Input lifecycle

Terminal or invalid dt (not finite numeric `(0,.25]`) exact no-op before input reads. Atomically read own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited flags; invalid objects/arrays/descriptor failures neutral. Literaltrue flags; finite axes clamp[-1,1], magnitude>.5 selects dominant direction, vertical on ties. Epoch nonnegative safe integer elseignored.

Pausedtrue exact no-op. Initial full-neutral arms. First epoch sets baseline; later change or rising cancelled disarms before input and cannot rearm same call. Cancelled never jumps but active motion/clock continue. Later noncancelled full-neutral rearms. Only changed nonneutral direction triggers a hop when armed-at-start; A/B unused. Held direction does not repeat. Simultaneous button flags do not suppress an otherwise valid direction, but neutral release requires no A/B/direction. During respawn, attempted direction is consumed. Terminal freezes.

## Verification

Separate public-lane predictor/normal-input routes clear2/3/4 distinct homes, with80ms sampling and bounded jitter. Ordinary car/water/drift/repeat-home/timeout outcomes; independent containment/contact edge cases and no rider teleport on log wrap; fractional x retained by hops, lane motion during respawn, last-home/timeout ordering, lives/terminal and pause/cancel. Synthetic boundary fixtures clearly labelled. Browser uses real keys and wall-clock time; no precomputed winning schedule or planner ships in assets.
