# Pressure Seal — public model contract

Status: canonical public specification accepted on 2026-11-02 after model, QA, independent and root static review. This is a specification, not evidence of implementation, play or performance. No private solution or hidden calibration route is included.

## API and configuration

The model exports `create(seed, level)`, `step(state, dt, input)` and `config` through CommonJS and `window.PureModel`. `create` returns an independent fresh mutable state; `step` mutates that state and returns that same state. `config` is an immutable public descriptor, with no mutable state references.

- `config.tickSeconds = 0.05`, `burstPressure = 110`, `maxCounter = 2147483647`, `defaultSeed = 740`.
- `config.materials` keys are `tin`, `fiber`, `foil`, with respective `{name,safeHeat,doseBudget}` values TIN/68/90, FIBER/62/105, FOIL/58/120.
- `config.scenarios` contains exactly three `{id,name,stages}` descriptors. Each stage is `{material,low,high,holdTicks}`. The exact tables are:
  - STARTER / `starter`: `tin,22,38,120`; `fiber,46,62,130`; `foil,70,86,140`.
  - SWAP / `swap`: `fiber,42,56,130`; `tin,20,34,130`; `foil,58,72,140`.
  - HEAVY / `heavy`: `foil,66,80,140`; `tin,36,50,140`; `fiber,78,92,150`.
- A valid seed is an integer in `[0,4294967295]`; otherwise seed 740 is used. A valid level is integer 0, 1 or 2; otherwise level 0 is used. The normalized seed is stored but not consumed by RNG. Inputs never change a round's level or seed.
- No debug mutation, alternate initial condition, force-win, hidden search, warmup or time-travel API is part of this interface.

## State shape and initial identity

Every key below exists immediately after creation. New arrays and objects are allocated per round; no array or object is shared with another state or mutable configuration.

| Field | Initial value | Meaning and bound |
| --- | --- | --- |
| `schema` | `1` | Public schema version |
| `seed`, `level` | normalized arguments | Immutable round identity |
| `phase` | `playing` | `playing`, `won` or `lost` |
| `reason` | empty string | Empty, `burst` or `overheat` |
| `tick` | `0` | Saturating count of completed logical ticks |
| `remainder` | `0` | Fractional seconds in `[0,0.05)` after each admitted call |
| `counterSaturated` | `false` | True forever if a saturating counter would overflow |
| `materialIndex` | `0` | Active stage 0–2; 3 only on win |
| `pressure`, `heat` | `0`, `0` | Pressure `[0,110]`, heat `[0,100]` |
| `dose` | `0` | Current material's cumulative heat dose; remains on failure; zero on transition/win |
| `totalHeatDose` | `0` | Sum of dose additions over the round; never reset on material change |
| `holdTicks` | `0` | Current uninterrupted qualifying tick count, bounded by current requirement |
| `inBandTicks` | `0` | Saturating count of safe ticks with both pressure endpoints in band, including interrupted holds |
| `dwellResets` | `0` | Saturating count of positive-hold resets caused by a safe tick with either pressure endpoint outside |
| `materialInBandTicks` | `0` | Saturating safe in-band count for current material; zeroed on seal |
| `materialPeakHeat` | `0` | Highest post-update heat observed for current material, including a failing tick |
| `inputArmed` | `false` | Held action eligibility; one genuine neutral sample arms fresh state |
| `cancelEpoch` | `null` | Last valid nonnegative safe-integer input epoch, or null before one arrives |
| `cancelledLast` | `false` | Whether the last admitted sample carried `cancelled:true` |
| `lastAction` | `{a:false,b:false}` | Effective A/B used on the last completed logical tick |
| `seals` | `[]` | At most three immutable-by-convention completed-seal receipts |
| `score` | `0` | Exactly `100*seals.length`, bounded 0–300 |
| `events` | `[]` | At most one event from the current admitted call; described below |
| `message` | `按住 A 加热加压，提前松手；按住 B 泄压。` | Display-only Chinese instruction/status text, maximum 160 characters |

`dose` may exceed its current budget only by one tick's dose addition on the failing tick. `totalHeatDose` is the independently accumulated per-tick dose sum; its conservation identity with sealed receipts plus current dose uses the audit-only floating tolerance below. On win current dose is zero. It is bounded by the sum of the three scenario material budgets plus 6.3. Temperature and pressure are the complete plant memory: there is no hidden thermal reservoir, velocity, pending transition or filter history. Every display `message` is concise Chinese; ASCII material names and action letters may appear within it.

Integer counters use `min(maxCounter, old+increment)` and set `counterSaturated=true` on a would-overflow increment. Saturation does not end or freeze the plant. Audit receipts used for exact counter differences must have `counterSaturated=false`. Normal 30–90 second play is far below saturation. There is no variable-length trace, unbounded log, timer handle, DOM reference, wall clock or RNG cursor in state.

## Admitted calls, time and malformed input

1. A terminal state's `step` is an exact no-op, including its events, input gate and remainder.
2. `dt` must be a finite JavaScript number with `0 < dt <= 0.25`. Zero, negative, nonnumeric, nonfinite or greater-than-0.25 durations are exact no-ops, including input/gate/events. Do not coerce strings. Reject a large duration rather than silently simulating an arbitrarily long stall.
3. Accept input only when it is a non-null, non-array object; missing/null, primitives, arrays and functions normalize to an empty neutral sample. Read only recognized own data properties; inherited properties and accessors are ignored without invoking a getter. Other object types contribute only such own data properties. Only literal `true` enables a recognized boolean. Own-data `paused:true` is an exact no-op; the shared host normally freezes by not calling `step`, and this explicit guard has the same state identity.
4. Recognized action fields are `a`, `b`, `cancelled`, `cancelEpoch` and `paused`. `aPressed`, `bPressed`, directions, start, select and unknown fields never operate the plant. Edge pulses do not substitute for held booleans. A malformed epoch is ignored, without cancelling or arming by itself. Recognized fields in later rules mean these normalized own-data values; no input property is written by the model.
5. For each admitted active positive-duration call, clear `events`, process the input gate below, then set `span=oldRemainder+dt`, `count=min(5,floor((span+1e-12)/0.05))`, and `remainder=max(0,span-count*0.05)`. Subtract the whole `count*0.05` ONCE; repeated per-tick subtraction is not equivalent at the upper floating boundary. Run exactly `count` logical ticks unless one settles the outcome. The epsilon can forgive only a tiny negative remainder, which is clamped to zero. Count is never six, including a span rounded near 0.3. A terminal tick discards the leftover remainder to zero and ends the loop.
6. The same effective held sample from this call is used for every logical tick crossed by the call. A call with no crossed tick can change the gate/epoch and fractional remainder but cannot change pressure, heat, hold, damage, score, tick or lastAction. A sufficiently short press between logical boundaries can have no plant effect; the contract does not promise integration of sub-50 ms pulse widths.
7. Determinism means identical normalized creation arguments and identical admitted `dt`/input sequences give identical states. Different input sampling partitions need not agree, because a crossed tick uses the current call's command. There is no wall-clock catch-up hidden inside the model.

The current shared host supplies `1/60` second calls, caps frame gaps at 0.1 seconds and runs at most six host steps per frame. The model's public accumulator converts those calls into the 50 ms plant ticks above. Its epsilon repairs only floating point threshold arithmetic; it does not widen pressure bands or heat limits.

## Cancellation and real-release gate

Gate processing happens on every admitted call, even when it does not cross a logical tick. Let rawA/rawB be the strict booleans from this sample. A valid epoch first establishes a baseline if `cancelEpoch` is null; a subsequent different valid epoch is a cancellation edge. A `cancelled:true` sample sets `cancelledLast=true`; a false-to-true transition is also a cancellation edge. A subsequent noncancelled sample sets `cancelledLast=false`.

- Any cancellation edge sets `inputArmed=false`. A currently cancelled sample suppresses both A and B regardless of `inputArmed`.
- Resolve effective A/B from the gate at the start of this sample, after applying any cancellation edge. Effective A/B are rawA/rawB only when armed and not cancelled; otherwise both are false.
- After resolving effective commands, a sample with `cancelled !== true` and both raw held fields false arms future samples. A cancelled synthetic neutral sample never acknowledges release. An already-unarmed sample with either raw held field true remains unarmed.
- Store the valid epoch, if supplied, and the sample's cancelled flag. Cancellation and release acknowledgement never alter pressure, heat, dose, hold, counters, seals or remainder directly. The admitted duration still advances neutral physics, including possible dwell, damage or failure, while the input is suppressed. Quarantine must never become a gameplay freeze.
- Ordinary A/B release is simply an admitted neutral sample; it does not clear heat or pressure. Pause preserves every model field because no model calls occur. Resume/reconnect/cancel may change only gate fields until a physics boundary is crossed. Retry creates a fresh state, with zero heat/pressure/damage/hold/remainder/counters/receipts and `inputArmed=false`.

The shared host owns local keyup and remote raw-false acknowledgements, cancellation epochs, phone identity/cancel-sequence changes, pointer cancellation, disconnect/background auto-pause and source quarantine. Missing phones are not releases. It must quarantine held local and remote A/B until actual releases and must not reuse a stale pre-start/pre-resume sampled action. The model consumes the host's `cancelled` flag; it does not invent a remote release from absent data.

## Exact tick order and outcome priority

All following arithmetic is IEEE-754 JavaScript Number arithmetic, with no hidden rounding or epsilon comparison except the clock epsilon above. `clamp(v,l,h)=min(h,max(l,v))`. Stage and material below are those active at the start of the tick.

1. Increment `tick` with the saturating rule. Set `lastAction` to this call's effective booleans. Let numeric A/B be 1 for true, otherwise 0.
2. Set `heat = clamp(oldHeat + (100*A-oldHeat)/60,0,100)`.
3. Compute `rawP = oldPressure + 0.05*(3*A + 0.15*heat - 5 - 12*B)`; store `pressure=clamp(rawP,0,110)`.
4. Compute `doseAdd=max(0,heat-material.safeHeat)*0.05`; add it to `dose` and `totalHeatDose`. Set `materialPeakHeat=max(oldMaterialPeakHeat,heat)`.
5. If `rawP >= 110`, settle loss with reason `burst`, leave the pre-tick hold counters unchanged, add no seal, emit only `{type:'collision',reason:'burst',materialIndex,tick}`, and stop. Even if dose also reaches its limit, burst is the sole reason.
6. Otherwise, if `dose >= material.doseBudget`, settle loss with reason `overheat`, leave the pre-tick hold counters unchanged, add no seal, emit only `{type:'collision',reason:'overheat',materialIndex,tick}`, and stop.
7. Otherwise compare BOTH oldPressure and stored pressure against the inclusive `[stage.low,stage.high]`. Only if both are in band, increment `holdTicks` by one, plus saturating `inBandTicks` and `materialInBandTicks`. If either is out of band: if old `holdTicks>0`, increment saturating `dwellResets`; then set `holdTicks=0`. The represented pressure segment is straight between these endpoints, so the whole qualifying segment stays in the band. An entry tick earns no hold. No heat recovery or completion occurs merely from being near the band.
8. If `holdTicks < stage.holdTicks`, this tick ends. Otherwise append one completed receipt, increment `materialIndex`, and set `score=100*seals.length`. Receipt fields and reset values are below.
9. Reset `dose`, `holdTicks` and `materialInBandTicks` to zero. Set `materialPeakHeat=heat` for a new stage, so its inherited starting heat is visible. Preserve pressure, heat, totalHeatDose, cumulative counters, tick, gate and remainder. There is no free cooling interval or loading delay. A new stage is first evaluated on the next logical tick; it cannot earn hold or damage on the just-completed old stage's tick.
10. After seal three, `materialIndex=3`, set phase `won`, reason empty, `materialPeakHeat=heat`, emit only `{type:'win',tick}`, and stop. Otherwise emit `{type:'delivery',materialIndex:completedIndex,tick}`. No call can complete two stages because five ticks is less than the minimum requirement of 120.

Settling either outcome also sets remainder to zero, leaves the actual final plant/receipts/counters visible and writes a truthful short result message. No post-outcome physics, additional damage, duplicate score or second event is permitted.

## Completed-seal receipts

Each receipt is exactly `{index,material,low,high,requiredTicks,holdTicks,completedTick,pressure,heat,dose,peakHeat,inBandTicks}`. Values come from the completing old stage before its reset. `index` is 0, 1 or 2 in order; its material/band/requiredTicks match public configuration; `holdTicks=requiredTicks`; `completedTick` is the current logical tick; `pressure` is in the inclusive band; `dose < doseBudget`; `inBandTicks >= requiredTicks` includes earlier interrupted attempts for that material. A receipt certifies the model's uninterrupted final hold; independent verification still needs observed adjacent state pairs, not trust in a lone receipt.

Global conservation identities are `score=100*seals.length`, `materialIndex=seals.length`, `totalHeatDose=sum(seals.dose)+dose`, and `inBandTicks=sum(seals.inBandTicks)+materialInBandTicks`, except the last identity becomes a saturated-counter statement if `counterSaturated=true`. Heat-dose regrouping is not promised bit-exact: independently sum sealed doses left-to-right, then add current dose to obtain `ledger`; accept only `abs(totalHeatDose-ledger) <= 64*Number.EPSILON*(tick+4)*max(1,abs(totalHeatDose),abs(ledger))` while counters are unsaturated. This tolerance is only for the conservation audit; local recurrence calculations and all pressure, heat-limit, hold and outcome decisions retain their specified exact arithmetic/comparisons. Every settled win has exactly three qualified receipts, holdTicks/dose/materialInBandTicks zero, pressure at the final band's completing endpoint and heat retained.

## Required public regression coverage

Model-author tests cover exact recurrence/lag, inclusive band endpoints and reset, damage accumulation and budget equality, A+B combination, old-material heat attribution, reset/carry semantics, burst-overheat-completion priority, initial/retry identity, no-time/malformed calls, bounded structures, and terminal immutability. Interface/browser checks separately cover actual source cancellation, clean release acknowledgement, independent pause/retry, phone halves, continuous actual controls and truthful rendering. Synthetic unit boundary states are test-only and must never be passed off as ordinary gameplay, reachability, screenshots or videos.
