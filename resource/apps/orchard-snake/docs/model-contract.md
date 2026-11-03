# 果园游蛇 / Orchard Snake — public model contract

Written before implementation. A snake continuously advances one grid cell at fixed intervals. Collect fruit to grow by one segment; meet the fruit quota to win. Border, rock and nonvacating body collisions lose. There is no overall countdown. Three finite brake tokens temporarily stop movement while active time continues.

## Public orchards

All grids are12 columns×8 rows with zero-based `(x,y)` coordinates and flat position `y*12+x`. Initial body head-first is `[38,37,36]`, i.e. head `(2,3)` facing right, neck `(1,3)`, tail `(0,3)`. No border cells are implicit walls; stepping outside loses.

| Level | ID / English / 中文 | Rocks `(x,y)` | Fruit quota | Movement interval |
| --- | --- | --- | ---: | ---: |
| 0 | meadow-path / MEADOW PATH / 草甸果径 | (5,2),(6,2),(5,5),(6,5) | 5 | 0.35s |
| 1 | hedge-lanes / HEDGE LANES / 树篱曲径 | (5,1),(5,2),(5,5),(5,6),(9,2),(9,3),(9,4),(9,5) | 7 | 0.30s |
| 2 | stone-grove / STONE GROVE / 石间果林 | (4,0),(4,1),(4,2),(7,4),(7,5),(7,6),(9,1),(9,2),(9,5),(9,6) | 9 | 0.26s |

Direction edges may queue one perpendicular turn for the NEXT movement tick. Reversing180° is blocked. Requesting the current direction is blocked/free and does not consume the turn slot. Once a turn is queued, subsequent direction edges cannot overwrite it until the tick applies it. This prevents two quick inputs reversing into the neck between movement ticks. The queued turn clears after that tick. Holding a direction does not repeatedly queue commands.

A spends one of3 brake tokens if no brake is active and a token remains. It sets brakeRemaining0.6s without resetting moveClock or refilling tokens. A while already braking or out of tokens is blocked/free. B has no action. Direction changes may queue during a brake. At each step, apply accepted input at its start, then freeze movement for min(dt,brakeRemaining), decrement brakeRemaining, and add only remaining dt to moveClock. The accumulated partial movement interval is preserved while braking. Active elapsed includes frozen movement time. When moveClock reaches interval, subtract interval and move once. A numerical comparison tolerance1e-10s only suppresses floating-point partition drift; no speed-changing clamp. Valid dt≤0.25 is below every interval, so normal steps have at most one movement tick.

At a tick apply queued turn first, then compute next head. If next cell is a boundary/rock, lose `wall` without changing body. If it is occupied by a body segment, lose `body`, except the current tail may be entered on a non-growing move because it vacates simultaneously. If next head equals fruit, retain tail, grow, increment eaten and immediately win when quota reached. Otherwise remove the old tail. Nonterminal consumed fruit is replaced; growth never permits tail entry. `moves` counts completed safe movement ticks, not collision attempts.

## Deterministic fruit placement

From the current head, breadth-first traverse rock-free cells that are not occupied body, except the current tail may be traversed as a vacating gateway. Eligible fruit cells are reached cells not occupied by ANY current segment. Sort them by flat index and select with a deterministic32-bit mixing function of normalized seed, level and foodSerial. Never place food on a rock or segment. Increment foodSerial only on successful placement. If no eligible free cell exists, food=null and retry after later safe ticks; don't invent an unrelated instant loss. No future food list or solution route is stored. Current food is public. Defaults seed763; seed integer0..4294967295 otherwise763, level integer0..2 otherwise0.

## Public state and interface

Expose only `create(seed,level)`, `step(state,dt,input)`, deeply immutable config. Config width12,height8,defaultSeed763,initialBody,initialDirection'right',brakeTokens3,brakeSeconds0.6,timeEpsilon1e-10,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,walls,goalFruit,interval}`. Walls are flat booleans. No solver in assets.

State: schema1,seed,level,phase playing/won/lost,reason ''/wall/body,score0 or100 iff won; width,height,walls,goalFruit,interval display copies; body head-first; direction'right',queuedDirection null; moveClock0,brakeRemaining0,brakes3,brakesUsed0,eaten0,moves0,food position|null,foodSerial; elapsed0,elapsedCappedfalse,calls0,turnsQueued0,blockedActions0; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. Body length always3+eaten. Terrain/timing/quota judgments use immutable config; external state changes unsupported and fixture tests must be marked synthetic.

Events at most one per call and include call: turn `{direction}`, brake `{remainingTokens}`, blocked `{reason:'reverse'|'same-direction'|'turn-queued'|'braking'|'no-brakes'}`, move `{from,to}`, eat `{from,to,eaten}`, win `{eaten}`, collision `{reason,attempted}`. Movement/terminal events take precedence over input events within a call. LastCommand retains attempted input. Terminal receipt detached `{cause,level,call,elapsed,body,direction,queuedDirection,food,eaten,moves,brakes,brakeRemaining,moveClock,score,phase,reason}`. Collision leaves body intact; terminal steps freeze all fields.

## Input lifecycle

Terminal and invalid dt (not finite JS number in `(0,.25]`) exact no-op before input access. Atomic own data descriptors x/y/a/b/cancelEpoch/cancelled/paused only; no getters/inherited fields. Invalid objects/arrays/descriptor errors normalize neutral. Literaltrue booleans; finite axes clamp[-1,1]; epoch nonnegative safe integer or ignored. Pausedtrue exact no-op. Dominant axis over0.5 chooses direction, vertical wins ties.

Initial full-neutral arms input while simulation still advances. First valid epoch is baseline. Later epoch change or false→true cancelled edge disarms and clears queuedDirection before simulation. Cancelled input suppresses commands but active clocks and existing brake continue. A later noncancelled full-neutral sample rearms; disarm call cannot rearm. Commands require armed-at-start: rising A else changed nonneutral direction. B has no action but participates in full-neutral release. Save all held input even when suppressed; no queued extra edges. Host owns physical release quarantine. Informational elapsed/counters saturate, never changing win conditions.

Verification: ordinary3wins from public maps/body/food; spawned fruit reachable/free, body conservation/growth, tail vacancy, reversals and single-turn slot, time partition invariance, finite brakes/partial interval preservation, wall/body collisions, pause/cancel/held/terminal. Test-only route planners and synthetic boundary fixtures remain separate from real-input recordings.
