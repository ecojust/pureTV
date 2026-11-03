# Lens Distance — public model contract

Normative public specification before implementation/execution. [Public design](public-design.md) fixes all six cards, optical formulas, ray geometry and controls; [public interface](public-interface.md) fixes host/evidence boundaries. No execution is claimed here.

## Pure API and configuration

Expose exactly `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config`, through CommonJS and `window.PureModel`. Create allocates fresh state; step mutates and returns that same state. No randomness, clock, I/O, solver, alternate constructor, fixture setter, answer vectors, routes or future-evaluation helpers are exposed. External malformed/mutated states are unsupported; deliberately corrupted fixtures are synthetic, never ordinary play.

Config is `{defaultSeed:747,focalLength:4,objectHeight:3,railMin:0,railMax:36,apertureMin:1,apertureMax:6,exposureEnergy:4,maxElapsed:86400,maxCounter:2147483647,layouts}`. Each layout is `{id,name,nameZh,cards}` in public level order. Each card is `{id,name,nameZh,objectX,lensMin,lensMax,screenMin,screenMax,startLens,startScreen,startAperture,sourcePower,brightnessMin,brightnessMax,adjustmentLimit}`, exactly the public table. `name` is the table's English label. There are three layouts with two cards each. A seed is accepted only if an integer0..4294967295, otherwise747; level only integer0..2, otherwise0. Seed is recorded without changing cards. Created state, derived objects and receipts are detached from config and from one another.

## Canonical state

| Field | Initial value / meaning |
| --- | --- |
| schema,seed,level | 1, normalized identity |
| phase,reason,score | `playing`,`''`,0; phase playing/won/lost; reason empty/energy/adjustments; score100 iff won |
| cardIndex,completed | 0,0; cardIndex0..1; completed0..2 |
| card | Detached copy of current public card descriptor |
| objectX,lensX,screenX,aperture | Card objectX/startLens/startScreen/startAperture |
| selected | `lens`; otherwise `screen` |
| energy,adjustmentsUsed | 4,0; per-card resources |
| optics | Fresh derived structure below |
| elapsed,elapsedCapped | 0,false; bounded active informational seconds; no deadline |
| exposureReceipts,terminalReceipt | [],null; at most8 exposure receipts, one terminal receipt |
| calls,railMoves,apertureChanges,selections,exposures,totalAdjustments,blockedActions | All0; saturating counters |
| counterSaturated | false; sticky on attempted counter overflow |
| inputArmed,cancelEpoch,cancelledLast | false,null,false |
| lastHeld | `{a:false,b:false,direction:'none'}`; includes suppressed normalized samples |
| lastCommand,events | `none`,[]; reset each admitted call; at most one event |
| message | `左右移动透镜，B 切换屏幕；上下调光阑，A 曝光验收。` |

ObjectX is always the current immutable card's object coordinate. Lens/screen always stay within that card's fixed independent bounds; aperture1..6. Selected is lens/screen. Energy stays0..4, adjustmentsUsed0..adjustmentLimit+1. Playing state has energy≥1 and adjustmentsUsed≤adjustmentLimit. A successful last-charge exposure may leave energy0 only in final won state; a nonfinal success immediately loads the next card's energy4. On a final win cardIndex remains1, completed=2. Otherwise completed=cardIndex, including either kind of loss. There is no separate hidden pose or cached success flag.

Counters increment as min(maxCounter,old+1); counterSaturated becomes true only when attempted sum>maxCounter. Every admitted call sets elapsed=min(86400,oldElapsed+dt); elapsedCapped becomes true only if the sum exceeds86400. Reaching the cap does not settle play. A tiny positive dt may increment calls without changing rounded elapsed under ordinary IEEE-754 addition. No growing undo/input/event history exists. Exposure receipts≤8, events≤1, message≤160characters; every numerical state value is finite, and singular optical quantities are explicitly null.

## Derived optics

Use canonical lensX/screenX/aperture and the IMMUTABLE current card selected by level/cardIndex. Do not use a stale copied card or optics cache to judge exposure. Recompute optics at create, after each applied rail/aperture change, after card transition, and immediately before every A exposure. B/blocked input preserves the unchanged optics. Recompute does not alter controls, resources, counters or receipts.

`optics={u,v,imageKind,imageDistance,imageX,magnification,defocusNumerator,blurNumerator,blurDenominator,blur,brightnessNumerator,brightnessDenominator,brightness,brightnessOk,clarityOk,canExpose}`.

u/v and all numerator/denominator fields are the exact integers specified in public design; defocusNumerator is `d=abs(v*(u−4)−4*u)`. `imageKind` is real/virtual/focal. For nonfocal cases imageDistance=q, imageX=lensX+q, magnification=−q/u; for focal ALL THREE are null. Blur is blurNumerator/blurDenominator; brightness is brightnessNumerator/brightnessDenominator. ClarityOk includes real-image classification; brightnessOk is the separate inclusive integer-band comparison; canExpose requires a real image and both checks. No rounding, tolerance, viewport clipping or cached display reading changes these flags.

Diagram rays are a renderer derivation from current public state using public-design equations, not extra model state or judging samples. The model's full optical cache still contains exact finite/null image geometry even if the image is outside the display.

## Atomic input and admitted time

1. Terminal state returns exact no-op before reading dt/input. Events, message and receipts remain unchanged.
2. Only finite JavaScript-number dt with0<dt<=0.25 is admitted. Otherwise return exact no-op without coercion or input reads.
3. Within one try/catch, classify input and gather own descriptors for `x,y,a,b,cancelEpoch,cancelled,paused` before mutation or paused handling. Accept own DATA values from a non-null non-array object only; never invoke getters, inherit properties or write input. Classification/descriptor exceptions discard all partial reads to wholly empty neutral. Use a null-prototype temporary. Nonthrowing Proxy traps may run; no side-effect-free Proxy claim is made.
4. Only literaltrue enables a/b/cancelled/paused. Normalized pausedtrue makes the call exact no-op. Finite numeric axes clamp to[−1,1]; others become0. Valid cancelEpoch is a nonnegative safe integer, otherwise ignored. Ignore aPressed/bPressed, raw direction strings and every other property.
5. Direction is none when both magnitudes<=0.5; otherwise the greater magnitude wins, vertical winning ties. Positive x/y means right/down. A held unchanged direction does not repeat; switching directly to a different nonneutral direction creates an edge.
6. Clear events, set lastCommandnone, increment calls and advance/saturate elapsed. Cancelled/unarmed admitted calls still consume informational active time.
7. Apply the gate and at most one command, then save the entire normalized held sample. Invalid/paused/terminal calls do not change gates or consume input.

The first valid epoch establishes baseline without disarming. A later different valid epoch or false→true cancelled edge makes this a disarm call and sets inputArmed=false BEFORE command eligibility. A disarm call cannot command or rearm, even if noncancelled/full-neutral. Every cancelled sample suppresses commands. Store each valid epoch and current cancelled flag. Only a call that does not disarm, was armed at call start and is not cancelled may choose B rise, else A rise, else changed nonneutral direction. Consume all other new edges without queueing. Save held A/B/direction even when suppressed. A nondisarming noncancelled full-neutral sample sets inputArmed=true for future calls and emits no command. Therefore disarm requires a SUBSEQUENT admitted noncancelled full-neutral sample to rearm. Fresh create may arm on its first neutral sample, including one establishing the initial epoch. Malformed/nonobject input can normalize to neutral and arm: the model cannot infer phone absence, so the host supplies cancelled samples and physical-release quarantine.

Successful card advance DOES NOT reset inputArmed/cancelEpoch/cancelledLast/lastHeld. At the end of the exposing call save its actual held A sample normally. Holding A into the next card therefore produces no edge. It must be released and pressed again. Transition also preserves elapsed/calls, all round counters, exposure history and saturation flags. Host retry/level change is a fresh create, not a partial card reset.

## Commands, two resources and events

Set lastCommand to chosen a/b/up/down/left/right even if blocked. Each event is detached and includes current `call=state.calls`. Events below have at most one entry. Counters saturate as above.

| Command | Effect and event |
| --- | --- |
| B | Toggle selected lens↔screen; selections++; `{type:'select',from,to,call}`. No resource cost. |
| Left/Right | Candidate selected coordinate−1/+1. Beyond its immutable card bounds: blockedActions++, `{type:'blocked',reason:'boundary',control:selected,call}`, no resource change. Otherwise apply coordinate; railMoves++,totalAdjustments++,adjustmentsUsed++; recompute optics. If within allowance emit `{type:'adjust',control:selected,from,to,used,remaining,call}`. Overrun settles as below. |
| Up/Down | Candidate aperture+1/−1. Beyond1..6: blockedActions++, `{type:'blocked',reason:'boundary',control:'aperture',call}`, no resource change. Otherwise apply aperture; apertureChanges++,totalAdjustments++,adjustmentsUsed++; recompute optics. If within allowance emit `{type:'adjust',control:'aperture',from,to,used,remaining,call}`. Overrun settles as below. |
| A | Freshly derive optics; exposures++; energy−=1. Judge/receipt/transition below. |

For a successful adjustment event used=adjustmentsUsed and remaining=adjustmentLimit−used. At used==limit remain playing with remaining0: exposure is permitted, and B/bound-blocked changes remain free. If an actual change makes used==limit+1, the changed coordinate/aperture and fresh optics remain visible, immediately set phase lost/reason adjustments/score0 and emit ONLY `{type:'collision',reason:'adjustments',control,from,to,call}`. No exposure receipt is appended and no light energy is spent. The over-limit applied change counts in railMoves/apertureChanges/totalAdjustments. An attempted bound-blocked change can never trigger this loss.

On A, capture a detached optical setup BEFORE any card transition. If canExpose is false, remain playing unless energy is now0. A nonterminal rejection emits `{type:'reject',cardIndex,energy,call}`. At energy0 set phase lost/reason energy/score0 and emit `{type:'collision',reason:'energy',call}`. Controls/selection/adjustments do not otherwise change.

If canExpose is true, increment completed BEFORE considering energy exhaustion. If completed==2, set phase won/reasonempty/score100 and emit `{type:'win',cardIndex:1,call}`. Otherwise set cardIndex=1 and load a detached copy of its card; reset objectX/lensX/screenX/aperture to new public values, selected=lens, energy=4, adjustmentsUsed=0, and derive fresh optics. Emit `{type:'advance',fromCard:0,toCard:1,call}`. No other command runs in the same call; lastCommand remains a. A successful final-charge exposure never loses the round through energy exhaustion, and a nonfinal success always gets the next card's full resources. All per-round fields/input history persist as stated above.

## Receipts and settlement

Every A appends an independently detached receipt of the just-exposed card, including a nonfinal success that has already changed live state:

`{index,call,elapsed,cardIndex,cardId,objectX,lensX,screenX,aperture,selected,optics,energyBefore,energyAfter,adjustmentsUsed,adjustmentLimit,matched,completedBefore,completedAfter,outcome}`.

Index is prior receipt length. All setup/card fields refer to the exposed OLD card; optics is its fresh judgment. energyAfter=energyBefore−1 even if live state then resets to4. matched=optics.canExpose. completedAfter=completedBefore+(matched?1:0). Outcome is exactly reject/advance/won/lost; lost here only means energy exhaustion. A successful first-card receipt has outcomeadvance and cardIndex0; only the second card can have outcomewon. There are at most4 exposures on each card, hence≤8 records overall. The current exposed pose is not a target or a scripted answer.

Every terminal transition creates an independently detached live terminal snapshot:

`{cause,call,elapsed,level,cardIndex,cardId,completed,objectX,lensX,screenX,aperture,selected,optics,energy,adjustmentsUsed,adjustmentLimit,score,phase,reason}`.

Cause is success/energy/adjustments. This snapshot describes the final current card and applied controls, including an over-budget change if that caused loss. It shares no mutable objects with live optics or any exposure receipt. An adjustments loss need not have any exposure receipt; an energy loss always has a last unmatched receipt with energyAfter0. A won round has exactly two matched receipts, one per card, with the second last. No later admitted call can alter terminal state. Neither intermediate capture nor any adjustment auto-wins.

## Deterministic visible messages

A call with no event preserves the previous message, including neutral/cancelled samples. Invalid/paused/terminal no-ops preserve it exactly. Event templates below are exact; Chinese control name is 透镜/屏幕/光阑. Values print ordinary base10 integers; these strings never judge optics.

| Event | Message |
| --- | --- |
| select | `已选择{controlName}；左右移动，上下调光阑。` |
| adjust | `{controlName}调至 {to}；剩余 {remaining} 次调整。` |
| blocked | `{controlName}已到调节边界；不消耗次数。` |
| reject | `成像未通过；实像、清晰度和亮度须同时合格。剩余 {energy} 次曝光电量。` |
| advance | `第一张底片已完成；第二张已重置，请重新调焦。` |
| win | `两张底片均已清晰曝光，实验完成。` |
| collision/energy | `曝光电量耗尽，本次实验结束。` |
| collision/adjustments | `超过本张底片的调整次数，本次实验结束。` |

Select uses event.to; adjust/blocked uses event.control. Live separate meters show detailed failed requirements. The host derives contextual selected carriage/bounds and A/B labels from current state, not stale event text.

## Later verification

Verify every fixed card/range/start; exact lens equation signs, real/virtual/focal/null handling; bounded finite values; cross-product thresholds including equality, separate DIM/OVER/SOFT causes, and aperture6 rejection. Check every end stop, both selected carriages, aperture controls, B>A>direction, no repeat, neutral/cancellation epochs, malformed/Proxy/paused/terminal handling, counters/time bounds and detached immutable config/receipts. Verify exactly-allowed adjustment then valid exposure, adjustment allowance+1 loss, failed final-energy exposure, successful last-energy exposure, complete next-card reset with history/gates retained, both captured plates required, and fresh retry/level change. Ordinary complete runs, synthetic boundary fixtures and sparse browser observations remain separately labelled.
