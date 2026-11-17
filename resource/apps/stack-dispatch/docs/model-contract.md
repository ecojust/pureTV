# 序栈货运 / Stack Dispatch — public model contract

This contract is written before implementation. This game models a single-item crane and three last-in-first-out cargo bays; it is not a physical crane simulator. All cargo and required departures are visible. There is no secret target arrangement or time limit.

## Fixed public layouts

Inbound cargo IDs are the integers 1 through N, in that order. Bays start empty; each bay has the stated capacity.

| Level | ID / English / 中文 | N | Departure order | Bay capacity | Crane moves |
| --- | --- | ---: | --- | ---: | ---: |
| 0 | first-shift / FIRST SHIFT / 首班分拣 | 6 | 4,1,5,2,6,3 | 2 | 24 |
| 1 | mixed-freight / MIXED FREIGHT / 交错货单 | 7 | 5,2,7,1,4,6,3 | 3 | 28 |
| 2 | reverse-tide / REVERSE TIDE / 逆序回港 | 8 | 8,1,7,2,6,3,5,4 | 3 | 32 |

Left/right cycles between inbound position 0 and bays 1–3. Up/down has no action. A at inbound takes its next crate only with an empty crane. A at a bay takes its top crate with an empty crane, or places the held crate onto that bay if it has space. Bays are arrays from bottom to top. Cargo cannot be put back on the inbound conveyor.

B dispatches the held crate from any selected position if its ID equals the next departure. A wrong held crate remains held and adds one mistake; the third mistake loses. B with an empty crane is blocked and free. Successful dispatch is free. Completion requires every crate to be dispatched in order, and does not depend on selecting a special exit location.

Every actual pickup or placement costs one crane move. Exactly the move allowance remains playable: selection, blocked operations, and dispatch still work. The next actual pickup/placement is applied and then loses with reason `moves`. It cannot be rescued by simultaneous B: command priority is B, then A, then direction, with other new edges consumed. No automatic deadlock loss occurs; players may retry using the host.

## Public model and state

The only API members are `create(seed, level)`, `step(state, dt, input)` and deeply frozen `config`, exported through CommonJS or `window.PureModel`. No solver or answer route ships in game assets. Create allocates detached mutable state; step mutates and returns that same state. Config contains `defaultSeed:748`, `mistakeLimit:3`, `maxElapsed:86400`, `maxCounter:2147483647` and the layouts above as `{id,name,nameZh,inbound,delivery,capacity,moveLimit}`. Valid seed is integer 0..4294967295, otherwise748; valid level is integer0..2, otherwise0. Seed is recorded only; puzzles are fixed.

Initial state: `{schema:1,seed,level,phase:'playing',reason:'',score:0,selected:0,inboundIndex:0,bays:[[],[],[]],held:null,nextDelivery:0,movesUsed:0,mistakes:0,elapsed:0,elapsedCapped:false,calls:0,blockedActions:0,inputArmed:false,cancelEpoch:null,cancelledLast:false,lastHeld:{a:false,b:false,direction:'none'},lastCommand:'none',events:[],dispatchReceipts:[],terminalReceipt:null,message}` plus detached `inbound`, `delivery` and scalar `capacity`, `moveLimit`. Score is100 iff won, otherwise0. Phase is playing/won/lost; loss reason is moves/mistakes. Completed count is `nextDelivery`. Every cargo ID exists exactly once among unconsumed inbound, bays, held cargo and successful dispatch receipts. Capacity and judging rules always come from immutable config, not mutable display copies. Externally altered state is unsupported; corruption tests must be labelled synthetic.

## Admitted input and release gate

Terminal states and nonnumber/nonfinite dt or dt outside `(0,0.25]` return exact no-op. Read input own data properties x/y/a/b/cancelEpoch/cancelled/paused atomically; ignore getters, inherited data and other keys. Nonobjects/arrays or descriptor exceptions normalize entirely to neutral. Only literal true is true. Finite numeric axes clamp to [-1,1]. Epoch is a nonnegative safe integer or absent. Normalized paused true is exact no-op.

Dominant axis determines direction above a 0.5 deadzone; vertical wins ties. Held direction never repeats; changing directly to another direction creates a new edge. Initial neutral arms input. First valid epoch establishes baseline. Later epoch changes or a false-to-true cancelled edge disarm before action processing. Every cancelled call suppresses commands. A disarm call cannot rearm; a subsequent noncancelled fully neutral sample rearms. Commands require armed status at call start. Save the whole held sample even when suppressed, so ignored simultaneous edges never queue. Nonobject input can normalize to neutral and arm; host cancellation and physical-release quarantine own disconnected-device handling.

Admitted calls reset events/lastCommand, increment calls up to maxCounter and advance elapsed up to maxElapsed; elapsedCapped is sticky when its sum exceeds the cap. Time is informational. Empty/no-event calls preserve message. Exactly one command runs at most: new B, else new A, else changed nonneutral direction. Vertical commands are ignored without cost. Selection wraps 0↔3 and costs no move. Neither held A/B nor held direction repeats.

## Evidence and settlement

Events are at most one per call and include `call`: select `{from,to}`, pick/place `{crate,position,movesUsed}`, dispatch `{crate,index}`, reject `{crate,expected,mistakes}`, blocked `{reason}`, win `{crate,index}`, collision `{reason}`. Blocked reasons are `crane-full`, `inbound-empty`, `bay-empty`, `bay-full`, `crane-empty`. A move allowance overrun emits collision instead of pick/place; third mistake emits collision instead of reject. Every admitted call sets lastCommand to a/b/left/right/up/down or none, including blocked commands.

Every successful B appends a detached `{crate,index,call,movesUsed}` receipt. At most N receipts exist. The last successful dispatch sets won/score100 immediately and emits win. Lost states retain already dispatched cargo and score0. Terminal receipt is detached `{cause,level,call,elapsed,selected,inboundIndex,bays,held,nextDelivery,movesUsed,mistakes,score,phase,reason}` where cause is success/moves/mistakes. It describes the final applied state. Terminal step is exact no-op, including receipts, messages and events.

Verification must distinguish complete runs through ordinary inputs from synthetic boundary fixtures. Required coverage includes fixed configuration, conservation/LIFO/capacity, all layouts solvable, wrong-order refusal, all losses, exact move allowance, final dispatch, blocked actions, B>A>direction, no repeat, cancellation/release, malformed/paused/terminal calls, independent state and receipts, and time bounds. Browser automation may read snapshots and send ordinary keys; it cannot write state or import a hidden model solver.
