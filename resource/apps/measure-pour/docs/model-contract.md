# Measure Pour — public model contract

This specification is written before implementation and execution. No completion or test claim is made by this document.

## Fixed problems and goal

Three sealed-volume transfer problems use three jugs labelled 1, 2 and 3. All volumes and capacities are integer units. No filling from an external tap, draining, arbitrary partial pours, hidden solution or timer is provided. A pour transfers exactly `min(source volume, destination capacity − destination volume)` units, stopping when the source is empty or destination full. The sum of all three volumes is conserved.

| Level | English label | 中文 | Capacities | Initial volumes | Target volumes | Pour allowance |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | HALF MEASURE | 对半分装 | 8, 5, 3 | 8, 0, 0 | 4, 4, 0 | 9 |
| 1 | LONG TRANSFER | 长程倒量 | 10, 7, 3 | 10, 0, 0 | 5, 5, 0 | 11 |
| 2 | THREE-WAY LOT | 三杯配额 | 12, 7, 5 | 12, 0, 0 | 6, 1, 5 | 13 |

Only a successful nonzero pour spends one allowance. After that pour, matching all three target volumes wins first; otherwise reaching the allowance loses immediately. A successful last-allowance pour wins. Source selection, navigation, cancelling, and blocked pours are free. There is no automatic victory from selection alone.

## API, state and input

Expose only immutable `config`, `create(seed, level)` and `step(state, dt, input)` through CommonJS and `window.PureModel`. Create returns fresh state. Step mutates and returns that state. Config is deeply frozen; it contains `defaultSeed:750`, `maxElapsed:86400`, `maxCounter:2147483647`, and `layouts` with `id,name,nameZh,capacities,initial,target,pourLimit`. No I/O, randomness or solver is exposed. Seed is recorded only; invalid seeds default to750, invalid levels to0. Valid seeds are integers0..4294967295 and levels integers0..2.

State contains: `schema,seed,level,phase,reason,score,selected,source,volumes,capacities,target,pourLimit,poursUsed,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,pourReceipts,terminalReceipt,message`. Initial phase is playing, reason empty, score0, selected0, source null, poursUsed0. Capacities and target are detached display copies. Immutable configuration judges capacities, targets and allowance. Volumes are the mutable live jug contents. Every jug remains integer0..capacity and total liquid is conserved. Terminal phase is won/lost, score100/0, reason empty/pours. No later step changes a terminal state.

Only finite numeric `0 < dt <= .25` is admitted. Invalid dt and terminal states are exact no-ops before reading input. Input is normalized using own data-property descriptors from non-null, non-array objects; no getters or inherited fields are consumed. Descriptor failures discard the whole sample to neutral. Nonthrowing Proxy traps may run. Only literaltrue activates a/b/cancelled/paused; finite numeric axes clamp to[-1,1]; valid cancelEpoch is a nonnegative safe integer. Normalized pausedtrue is an exact no-op. Other fields are ignored.

Direction is neutral if both axis magnitudes<=.5; otherwise the dominant axis wins, vertical on ties. Positive x/y is right/down. Up/down have no gameplay effect. A changed nonneutral direction is an edge, so direct left→right works; unchanged holds never repeat. New button edges use held a/b; `aPressed` is ignored. Simultaneous priority is B>A>direction, with other edges consumed rather than queued.

First neutral input arms the initially unarmed state. A changed valid cancelEpoch after a baseline, or false→true cancelled, disarms before commands. Every cancelled sample suppresses input. The disarm sample cannot itself rearm; a later admitted noncancelled full-neutral sample is required. A sample must have been armed at entry to command. Every admitted call records the normalized held values, even suppressed edges. The host handles actual phone absence and physical-release quarantine; the model cannot infer absence from neutral input.

Admitted unpaused calls increment calls with saturation and elapsed up to86400; elapsedCapped becomes sticky if time would exceed that bound. This is informational and never settles the game. Each call clears events and lastCommand. At most one event is emitted; no-event calls retain the prior message. Pour receipts are bounded by the allowance.

## Actions

- Left/right wrap selected0..2, preserving any source. Emit `select:{from,to,call}`.
- A with source null: if selected jug empty, blocked `empty-source`; otherwise set source=selected, emit `source:{jug,call}`. The selection is explicit; it does not automatically navigate.
- A with a source: same selected jug blocks `same-jug`; otherwise empty source blocks `empty-source`, full destination blocks `full-destination`; all preserve source and volumes. A positive transfer atomically updates two volumes, increments poursUsed, clears source, preserves selected destination, records a detached receipt and emits pour/win/collision.
- B with a source clears it and emits `cancel:{jug,call}`; B with no source blocks `no-source`. Neither changes volumes, selection or poursUsed.
- Every blocked action increments a saturating blockedActions counter and emits `blocked:{reason,call}`.

An ordinary pour event is `{type:'pour',call,from,to,amount,poursUsed}`. A successful final pour emits win with the same details. An unmatched last pour emits collision with reason pours and those details. Each receipt is `{index,call,from,to,amount,before,after,poursUsed,matched,outcome}`; outcome playing/won/lost. Before/after arrays and receipts share no mutable array with live state or one another. On terminal settlement, independently capture `{cause,call,elapsed,level,selected,source,volumes,poursUsed,pourLimit,score,phase,reason}`; cause success/pours. Terminal source is null because the final pour completed.

## Evidence boundaries

Tests may implement their own search using these public rules, but shipped assets contain no route, planner, answer vectors beyond visible targets, state setter or force-win entry point. Ordinary runs must use create/step inputs. Synthetic boundary fixtures and browser rendering probes must be labelled separately. Browser keyboard recordings do not claim physical phone, TV or emulator execution.
