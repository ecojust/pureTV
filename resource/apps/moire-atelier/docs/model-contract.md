# Moiré Atelier — public model contract

Status: accepted public contract; implementation and verification pending. Exact rules, reference geometry and three tasks are in the paired [public design](public-design.md). Preserved draft versions remain in the development evidence archive. Model imports, tests, browser, build and gameplay require subsequent complete source acceptance.

## Exports and immutable configuration

Expose `create(seed,level)`, `step(state,dt,input)`, `transmission(cycles)`, `sampleAt(state,x,y)`, and deeply immutable `config` through CommonJS and window.PureModel. Create allocates fresh state; step mutates and returns the same state. Helpers only observe and never mutate. No target-control vector, route, future-state evaluator, solver, force-state, checkpoint or alternate creation API exists.

Config contains exactly `{defaultSeed:744,board:{minX:-0.5,maxX:0.5,minY:-0.5,maxY:0.5},sampleBounds:{min:-1,max:1},frequencies:[24,25],phaseSteps:24,angleStepDegrees:3,angleBounds:[-4,4],timeLimit:90,attemptLimit:4,probeTolerance:0.035,guideTolerance:1e-9,maxCounter:2147483647,tasks}`. Tasks are exactly the three public tables in order. Each descriptor is `{id,name,nameZh,initialLayers,guides,probes}`; initialLayers entries are `{phaseTick,angleTick}`, guides are `{pin:{x,y},end:{x,y}}`, and probes are `{id,position:{x,y},targetPhases:[number,number],targetBrightness,tolerance:0.035}`. Probe IDs are `C,1,2,3,4` strings. The design's P is pin and Q=P+D is end. Compute reference normals and immutable target measurements by the published fiducial expressions, never from current/initial layer controls. IDs and labels are exact.

Seed accepts only a JavaScript integer0..4294967295, otherwise744. Level accepts only integer0..2, otherwise0. Seed is recorded; no RNG is used. All arrays/objects are fresh or deeply immutable. Different rounds, canonical state, caches, receipts and config share no mutable references.

## State and helper schemas

| Field | Initial value / meaning |
| --- | --- |
| schema, seed, level | 1, normalized seed and level; immutable round identity |
| phase, reason, score | `playing`, `''`,0; phase playing/won/lost; reason empty/time/attempts; score100 iff won |
| layers | Detached two-element initialLayers array; the only canonical physical controls |
| selected | 0, indexing MASK1/MASK2 |
| optics | Fresh optical cache defined below, derived at creation and after adjustments/submission/timeout |
| elapsed | 0; active admitted seconds in[0,90], stops exactly at deadline |
| failures, submissions | 0,[]; failures0..4, at most4 actual submission receipts |
| terminalReceipt | null until one terminal event, then detached preserved receipt |
| calls, adjustments, switches, blockedTurns | All0; saturating admitted-call/nonzero-adjustment/switch/bounded-rotation counters |
| counterSaturated | false; sticky true if an increment's uncapped result exceeds maxCounter |
| inputArmed, cancelEpoch, cancelledLast | false,null,false |
| lastHeld | `{a:false,b:false,direction:'none'}`, including suppressed samples |
| lastCommand, events | `none`,[]; reset each admitted call; at most one event |
| message | `左右滑纹，上下旋转；B 切换膜，A 同时验收五个测点。`; display-only Chinese text≤160 characters |

No history, pending drag, auto-repeat, accumulator, external clock, hidden placement, per-probe completion memory or unbounded log exists. Saturating increment is min(maxCounter,old+1); set counterSaturated only on actual attempted overflow, never reset it. Failures and submission length remain exact within4; score is solely100 for won, otherwise0.

`transmission(cycles)` accepts only a finite JavaScript number; otherwise returns null without coercion. For accepted cycles, return `(1+Math.cos(2*Math.PI*(cycles-Math.floor(cycles))))/2`. It creates no state and accesses no clocks. Wrap before cosine, so the trig argument stays within one period; ordinary precision of a supplied huge number is not recovered. This helper supports atlas opacity sampling and logical probes alike.

`sampleAt(state,x,y)` accepts a valid model-owned state plus finite JavaScript-number x/y inside inclusive[-1,1], otherwise returns null for invalid coordinates. External malformed/mutated states are not supported input; there is no state injection API. It reads canonical layers and the fixed frequencies, computes θ=angleTick*Math.PI/60 and n=(cosθ,sinθ), and returns a fresh `{x,y,cycles,phases,transmissions,brightness}`. Each middle array has two entries; cycles=f*(nx*x+ny*y)+phaseTick/24, phases=cycles−floor(cycles), transmissions=transmission(cycles), brightness=transmissions[0]*transmissions[1]. It ignores optics and all guide/target/matched flags. It works on playing or terminal states without changing any byte. Coordinates beyond the visible square are permitted solely to sample clipped mask artwork; they are not hidden probes.

`optics={layers,probes,matched}`. Optical layer entries are `{index,frequency,phase,angleDegrees,angleRadians,normal:{x,y},tangent:{x,y},guide}`. Guide is `{pin,end,referenceNormal,turnErrorDegrees,phaseError,phaseErrorTicks,turnAligned,phaseAligned}`; every point/vector is a detached{x,y}. ReferenceNormal comes only from the configured pin/end segment; current normal/tangent follow canonical θ. Turn error uses atan2(cross(reference,current),dot(reference,current))*180/Math.PI. PhaseError=centerWrap(f*dot(currentNormal,pin)+phase), phaseErrorTicks=24*phaseError. Aligned flags test absolute error<=1e-9, degrees/cycles respectively. The guides never decide optics.matched or a result.

Optical probes follow config order and are `{id,position,targetPhases,targetBrightness,tolerance,sample,error,matched}`. Sample is an exact fresh sampleAt result at position. Error=sample.brightness−targetBrightness; matched=abs(error)<=tolerance without extra epsilon. Optics.matched is the conjunction of all five current matched flags. Derive from canonical layers at creation and after each nonzero adjustment, and recompute on every A and timeout. Do not trust a corrupted optical cache or any guide flag. Rendering/current swatches read these same sample values or call sampleAt; no second optical formula is permitted.

## Admitted call, timer and input

1. If phase is terminal, return exact no-op before reading dt/input, preserving every field, event and receipt.
2. Admit only finite JavaScript-number dt with0<dt<=0.25. Every other duration is exact no-op without coercion. There is no fixed-step accumulator inside the model.
3. Input must be a non-null non-array object, else an empty neutral record. Atomically collect all recognized own descriptors (`x,y,a,b,cancelEpoch,cancelled,paused`) within one try/catch, including classification, before checking paused or mutating state. Read only own data properties; never invoke getters, inherit values or write input. Any classification/descriptor throw discards every partial read and becomes wholly empty neutral. A null-prototype temporary record avoids inherited pollution. Nonthrowing Proxy descriptor traps may run; no side-effect-free Proxy claim is made.
4. Only literaltrue enables a/b/cancelled/paused. After complete normalization pausedtrue makes the entire call exact no-op. Finite x/y numbers clamp to[-1,1]; invalid/missing axes become0. A recognized epoch is a nonnegative safe integer; invalid/missing epochs are ignored. Ignore pressed pulses, raw directional names, start/select and unknown keys.
5. Direction is none when both axis magnitudes<=0.5. Otherwise use greater magnitude, with vertical winning an exact tie. Positive x/y is right/down. A held unchanged direction does not repeat; a deliberate change between nonneutral tokens is a fresh direction edge.
6. Clear events, set lastCommandnone, increment calls and let nextElapsed=oldElapsed+dt. Set elapsed=min(90,nextElapsed). If nextElapsed>=90, **timeout now before gate/command processing**: recompute optics; settle lost/reasontime/score0; emit `{type:'collision',reason:'time',call:calls}` and preserve the terminal receipt. Leave layers, selected, failures, submissions and all gate/lastHeld fields unchanged. No A/B/direction is consumed or applied. The call spends only90−oldElapsed model seconds; there is no carried remainder. Timeout prevails even if the unchanged optics already matches.
7. Otherwise process gate/edges and at most one command below. Cancelled/quarantined admitted calls still consume their dt and can time out. The shared host normally pauses by making no model calls; cancellation itself is not a free pause.

Timer rounding follows ordinary IEEE-754 addition/comparison; no broad timing epsilon, rounded display value or host tick is used for judgment. A tiny positive accepted dt may add to the same floating elapsed value; calls/gating still follow these rules. At a terminal submit elapsed is that call's advanced value<90; after timeout it is exactly90. Invalid/paused calls never arm, cancel or advance any field.

## Release gate and simultaneous edges

The first valid cancelEpoch establishes a baseline. A later different valid epoch, or a false-to-true cancelled edge, disarms input. Every cancelled sample suppresses commands. Store a valid epoch and current cancelled flag. If armed after applying cancellation and not currently cancelled, derive A/B rises and changed nonneutral direction against previous lastHeld. Choose exactly one command with **B rise>A rise>direction edge**; other simultaneous fresh edges are consumed, not queued.

After selecting a command, store all normalized raw held fields in a fresh lastHeld, including cancelled/blocked samples. Only a noncancelled neutral sample with Afalse/Bfalse/directionnone arms future calls. Newly arming neutral cannot issue a command. Empty or malformed nonobject input normalizes to neutral and can arm: model does not infer phone presence. Host must mark a missing/disconnected source cancelledtrue or stop calls while paused. A synthetic cancelled neutral is never release acknowledgement; held local/remote controls remain quarantined by the shared host until genuine physical release. Create/retry starts unarmed. Timeout bypasses all of this as stated above.

B+A rising switches once. A remains held after B release: no submission. B plus fresh direction switches only; keeping direction held on the next call cannot move the newly selected layer. Holding A while a new direction edge occurs may adjust, but does not resubmit. Enter and phone use held states, not aPressed/bPressed pulses.

## Commands, submissions and terminal receipt

Set lastCommand to a/b/up/down/left/right for the selected command, even at a rotation bound. B sets selected=1−oldSelected, increments switches, emits `{type:'switch',selected,call:calls}`. It changes no optics, attempts or layer. Left/right sets selected phaseTick=(old+1)%24 / (old+23)%24, increments adjustments, recomputes optics, emits `{type:'adjust',layer:selected,axis:'phase',from:old,to:new,call:calls}`. Because phase enters u positively, these changes move stripe crests toward negative/positive normal respectively, matching physical left/right. Up/down requests angleTick−1/+1. Outside[-4,4], leave layers/optics unchanged, increment blockedTurns, emit `{type:'blocked',layer:selected,axis:'angle',requested:-1/+1,call:calls}`. Otherwise update angleTick, increment adjustments, recompute optics, emit the analogous adjust event with axisangle. Movement never settles victory, even if all probes currently match.

A recomputes all optical data. If all five fresh checks match, phasewon/reasonempty/score100 with failures unchanged; emit `{type:'win',call:calls}`. Otherwise increment failures exactly once. When failures becomes4, phaselost/reasonattempts/score0; emit `{type:'collision',reason:'attempts',call:calls}`. Earlier rejected submissions remain playing/reasonempty/score0; emit `{type:'reject',matchedCount,call:calls}`. MatchedCount counts this submission's current passing probes only and is not progress. No adjustment, switch, release or retry of the same state refunds a failed submission.

Append exactly one receipt for each actual A command: `{index,call,elapsed,selected,layers,probes,matched,failuresBefore,failuresAfter,remaining,phase,reason}`. Index is old submission length; layers is a detached canonical pair; probes are detached complete current optical probe entries; matched is all five fresh checks; remaining=4−failuresAfter. All fields describe the result of this one submission. Maximum receipt count is4: after3 failures, a fourth submission either wins or ends in the fourth failure. Timeout appends no submission.

On any terminal transition preserve `{cause,call,elapsed,layers,probes,matched,failures,remaining,score,phase,reason}` as terminalReceipt, with causesuccess/time/attempts. Copy complete canonical layers and current optical probes independently of caches and submission receipt objects. No later step or helper mutates earlier receipts. One terminal event replaces rather than accompanies an adjustment/rejection event. Subsequent calls are exact no-ops. Messages describe selected operation/result but never decide rules.

Required identities: failures equals the number of unmatched submission receipts; matched receipts exist only as a single final won submission; submissions.length<=4; score100 iff won; remaining=4−failures; attempts loss has failures4 and last unmatched receipt; time loss has elapsed90 with no timeout-created submission; won has elapsed<90 and a matching final receipt. Playing may have optics.matchedtrue until A; no per-probe historical acceptance is stored. Retry uses new create and resets every state field.

## Static and later regression scope

Cover three fresh starts and reference feasibility; both mask factors; negative/wrapped phase continuity; rotation on the same world coordinates; all five simultaneous samples; individual historic matches not accumulating; inclusive brightness tolerance; exact current sampler versus cache corruption; phase wrap and rotation bounds; hold/release/direction tie; B>A>direction edge consumption; cancellation epoch baseline/change/real release; getter avoidance/atomic normalization fallback; invalid dt/paused/terminal no-ops; correct last-allowance submission; fourth rejected submission; timeout before same-call A/B/direction; accepted submission just before deadline; immutable bounded receipts; aliases/defaults/counters; complete retry reset. Boundary/corrupted-state fixtures must be labeled synthetic, separate from actual ordinary play. Source approval precedes execution.
