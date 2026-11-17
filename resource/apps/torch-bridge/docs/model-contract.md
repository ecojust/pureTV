# Torch Bridge — public model contract

Rules and public data are specified before execution. This file does not claim publication or verification results.

## Travelers, torch and logical budget

All travelers start on the left bank (0); destination is the right bank (1). The torch starts left. A crossing must take one or two selected travelers from the torch's current bank; the torch travels with them. Returning has the same capacity and cost rule. Cost is the maximum of the selected travelers' public integer times, charged once when the crossing animation completes. Idle planning is free in this logical minute budget. Animation takes 0.4 active real seconds and does not itself add logical minutes.

| Level | id / English | 中文 | Times (logical minutes) | Deadline |
| --- | --- | --- | --- | --- |
| 0 | first-lantern / FIRST LANTERN | 初灯渡口 | 1, 2, 5, 10 | 19 |
| 1 | misty-span / MISTY SPAN | 雾桥同行 | 1, 3, 6, 8, 12 | 31 |
| 2 | midnight-relay / MIDNIGHT RELAY | 午夜接力 | 1, 2, 4, 7, 11, 16 | 37 |

The entire public configuration consists of the rules and these times/budgets. No optimum costs, routes, solver or hidden answer data ship in game assets. Independent test-only Dijkstra must prove solvability and at least five crossings per victory.

On landing, update traveler positions and torch bank, charge the maximum cost and increment trips. If everyone is right and spent <= deadline, immediately win (including exact deadline). Otherwise spent >= deadline loses, either while people remain left or after arriving over budget. A crossing whose cost exceeds remaining budget can still be started and visibly settles as a loss. There is no undo or arbitrary move limit. Positive integer costs and finite deadline bound actual play.

## Controls

The roster is ordered by traveler ID (zero-based in state, one-based on screen). Left/up selects previous, right/down next, clamped at either end. Dominant axis chooses direction, vertical wins equal magnitudes. A toggles the cursor traveler in the selected party if that person is on the torch bank; maximum selection is two. Deselecting is always allowed before checking capacity. Wrong-bank A and over-capacity A block free. B starts a crossing with a nonempty party; empty B blocks free. B > A > direction priority. No held repeat.

All gameplay commands are suppressed during crossing. At landing, selection clears and input is disarmed; only a later noncancelled neutral sample can rearm it. A press held across landing cannot select or cross again. Cursor may remain focused on either bank; selecting someone on the wrong side is free and explicitly reported.

## API and state

Export only create(seed,level), step(state,dt,input), deeply frozen config. Config has defaultSeed 774, crossingDuration 0.4, capacity 2, maxElapsed 86400, maxCounter 2147483647 and layouts. Layout fields: id,name,nameZh,times,deadline. Seed accepts integers 0..4294967295, otherwise 774; level 0..2, otherwise 0. Seed is recorded but does not change authored data. Create returns independent mutable state; step mutates and returns it.

State: schema,seed,level,phase,reason,score,positions,torch,cursor,selected,spent,deadline,trips,mode,crossing,lastCrossing,receipts,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initial positions all 0, torch 0, cursor 0, selected [], spent/trips 0, phase playing, reason empty, score 0, mode selecting. Crossing is null, otherwise {travelers:[sorted IDs],from,to,cost,elapsed,duration:0.4}; it is a detached snapshot of selected IDs. Positions and torch retain the departure values until landing. Selected remains the committed party while crossing, then clears. LastCrossing is null initially, otherwise {trip,travelers,from,to,cost,spent}; receipts contains detached completed crossings. Natural receipts count is bounded by deadline+1 (every crossing costs at least one). No mutable receipt, selection or crossing array shares references.

Mode is selecting or crossing while playing, settled when terminal. Won has score 100/reason empty. Lost has score 0/reason deadline. TerminalReceipt is a detached {cause,call,elapsed,level,positions,torch,spent,deadline,trips,score,phase,reason}; cause success/deadline. Terminal freezes before reading input.

Events include call and are at most one per admitted step: cursor {from,to}; select {traveler,selected}; blocked {reason:'boundary'|'wrong-bank'|'capacity'|'empty'}; depart {travelers,from,to,cost}; arrive {trip,travelers,from,to,cost,spent}; win {trip,travelers,from,to,cost,spent}; collision {reason:'deadline',trip,travelers,from,to,cost,spent}. Message persists on no-event steps. Animation-suppressed input does not increase blockedActions.

## Active-time and input lifecycle

Admit only finite numeric 0<dt<=0.25. Invalid dt and terminal calls are exact no-ops before input inspection. Normalize only own data descriptors x/y/a/b/cancelEpoch/cancelled/paused on non-null non-array objects; getters/inherited/unknown fields ignored. Descriptor failure discards all partially read values to neutral. Nonthrowing Proxy traps may run. Literal true enables flags; finite axes clamp [-1,1]; epoch is a nonnegative safe integer or ignored. Paused true is an exact no-op, including animation.

Each admitted call advances bounded informational active elapsed by dt and increments calls, clears events/lastCommand, handles cancellation, then at most one selectable command. A B departure captures the party before integrating this call's dt. A crossing then advances by dt, clamped at 0.4. Boundary comparisons use 1e-10 tolerance to absorb floating accumulation. A landing happens once; remainder of the call cannot trigger a new command or crossing. Informational elapsed records the full admitted frame, distinct from crossingDuration and logical spent.

Initially unarmed. A changed valid epoch after baseline or a cancelled false→true edge disarms before commands. All cancelled samples suppress commands, but active crossing animation continues unless paused. Cancellation preserves the party, cursor and trip state. Commands require armed at entry, selecting mode and a new A/B edge or changed nonneutral direction. Held values are recorded even while commands are suppressed or animation runs. aPressed/bPressed are ignored.

A disarm sample or landing sample cannot rearm. Otherwise a noncancelled neutral sample in selecting mode (a/b false, both axes magnitude <=0.5) arms subsequent inputs. Neutral samples during animation do not arm. The host supplies physical release/disconnected-phone safeguards.

Calls/blockedActions saturate at maxCounter. Informational elapsed caps at maxElapsed with sticky elapsedCapped; it is not a deadline. Pausing or planning cannot consume logical minutes.

## Evidence boundary

Normal win/loss claims use create/step inputs and public configuration. Test-only search computes routes; synthetic boundary fixtures are labelled separately. Browser gameplay uses wall time and keyboard events, no state or clock injection. Software browser or synthetic protocol checks do not claim physical TV/phone/emulator testing.
