# Cable Unweaver — public interface and evidence

Status: accepted public interface, not execution evidence. Read [public design](public-design.md) and [model contract](model-contract.md). Root approval and complete source review precede implementation execution.

## Existing host integration

Use the unchanged shared `resource/game-kit/web/runtime.js` API: PureModel.create(seed,level), PureModel.step(state,1/60,input), and GameDef render with current state and host inputs. GameDef seed743, actions2, action labels NEXT/PREV and holdConfirmAsA=true. Menu tasks use the three exact config labels. Enter and phone A share held-edge semantics; the model ignores pressed pulses. Host time/tick and model admitted elapsed/calls are different observations.

A/B cycle the movable a,b,c terminal selection; fixed anchors cannot be selected. Directions slide the selected terminal's group on its common axis; orthogonal input does nothing. A/B plus a fresh direction performs selection only and consumes the direction edge. B in play is previous terminal, not undo or menu. Shared pause/retry stay independent; retry creates a fresh complete state and a new observed run, never patches only group positions or refunds the old run.

The phone's entire right third is upper A / lower B, with midpoint owned by the lower half. Both prevent text selection and browser context actions, track actual held touches and release on pointerup/cancel. Start, pause/resume, hidden/blur, retry, disconnect/reconnect and source-session changes quarantine stale holds. A host-marked cancelled neutral cannot arm the model; missing phone input must carry cancelledtrue rather than bare undefined. Verify real release followed by renewed input for local and remote sources.

PureTVQA.snapshot() remains observation-only: host phase/paused/level/time, full actual model state, renderer metrics and connection status. PureGame.key(name,down) remains normal keyboard input. These do not authorize state injection, internal solver access, searched routes, patched starts, precomputed future shadows/intersections, or unreported warmups.

## Truthful workbench rendering

Draw fixed anchors, all terminal IDs, complete rails and stops, actual straight cable segments and the selected terminal directly from public geometry/config. Use smooth cable materials and small metal screw/clamp sprites in one atlas with existing batched lines/sprites. A rail or clamp is mechanically distinct from a cable; dashed thin guide lines are clearly non-cables. Do not add curves, overpasses or decorative gaps that imply an actual segment crossing is legal.

Group braces show that both members move together, including across two parallel rails in task2. When either member is selected, highlight the whole rigid group while keeping the exact selected terminal identifiable. Display its shared feasible bounds and any member responsible for a blocked move. The shorter member's rail must visibly stop the whole clamp; never animate members separately and then snap them together.

Render actual conflicts using geometry.conflicts: highlight both edge IDs and use the published rational point or integer overlap extent. Marker division is a rendering conversion only, not a second epsilon-based classifier. Co-located pair markers may share one visible badge, but the HUD still states the true number of conflicting edge pairs. Different nodes at the same position remain identifiable through distinct labels/outlines; do not hide one and suggest the layout is valid. Shared-ID hub joints are drawn normally unless their incident edges also have illegal positive overlap.

Keep conflict pair count, coincident-node pair count, zero-length/rail validity, remaining adjustments and selected terminal/group visible as separate facts. A compact status row can say CABLE PAIRS / PORT CONTACTS / RAILS & LENGTH, with actual pass/fail values. Zero edge-pair conflicts alone must never be presented as sufficient if another geometric validity check fails. No “submit now” screen exists: a valid move wins immediately.

Visible public guides are fixed-anchor projection lines and each group's actual center tick. Display current center, referenced anchor and signed alignment gap. For two-member clamps, the center is the arithmetic mean on the moving axis; it is not a midpoint along the whole drawn wire. Guides explain a constructive approach but are not goal conditions. The physical cable layout and validity feedback remain decisive, including an earlier win before every guide aligns.

Use actual original captures at960×540 and1280×720 to inspect all three tasks, horizontal/vertical rails, rigid clamp motion and shared-node/overlap distinction, guide legibility, all critical counters, selection, blocked moves, pause and both outcomes. Essential ASCII canvas text should be at least24 logical pixels; Chinese instructions use DOM. Modal backgrounds must visibly use the existing blurred/frosted treatment. Actual draw calls, frame times, atlas size and hardware context require measurements; an atlas plan or exported video FPS is not performance evidence.

## Ordinary visible-feedback pilot

For success, inspect current geometry and select the first group whose visible guideErrorNumerator is nonzero, keeping current selection if it already belongs to that group. Otherwise use ordinary A/B to reach a member, then release. Move one step along its axis opposite the error sign and inspect the resulting actual feedback. Repeat with current observations only, and stop immediately on any actual terminal outcome. If all guides appear aligned but play remains invalid, retain that real failure/uncertainty for review; never force success or substitute a stored solution.

This policy uses only the same anchor/clamp-center cue actually shown to players. It does not enumerate group positions, test future segment arrangements, import Model helpers, read target vectors or replay hidden witnesses. The public task tables prove the full alignment is feasible within budget; they do not justify replacing actual observations with calculated continuations. All policy mistakes and retries remain recorded.

For natural loss, select the first terminal and alternate +1/−1 along its rail axis, leaving other groups at their actual initial positions. Public fixed-anchor ordering proves a conflict persists in each task as described in the design. Every budget charge must come from a real nonzero movement, not blocked spam or an injected near-loss state. Separate synthetic fixtures may test last-step priority and degeneracy, but they are not ordinary runs.

## Actual observations and independent checking

Each ordinary model run records its actual public create origin, normalized seed/level and every actual step. Every browser/video run visibly starts at menu/start or result/retry with a fresh model. Use runId, channel, task, origin type, source hashes and monotone observation sequence outside the model. Retry starts another runId; a model create does not prove a visible browser transition.

Complete model-call records retain exact dt, recognized raw own-data input values with missing distinct from false, and actual before/after snapshots. Preserve group positions, selection, every derived node/segment/conflict/validity field, bounded move receipts, budget, gates, cancellation/epoch, counters, elapsed and outcome. An independent checker uses only public docs/config and each actual adjacent before/after observation; it must not import Model, pilot, renderer, private helpers or a hidden witness, and must not feed calculated after states forward as if observed.

The checker can recompute all actual node coordinates, rail/group bounds, exact integer segment predicates, shared-node exemptions, rational marker coordinates, coincident nodes and separate win conditions. It can validate an observed one-step translation, uniform member offsets, blocked-free movement, selection-only changes, unchanged prior receipts and final-step win priority. A rational marker is checked as an exact reduced numerator/denominator record, not a floating approximate crossing oracle.

Browser reads and recordings are sparse: retain real timestamps/read windows and source observation indices. Missing spans remain not-observed or review-required. An unchanged endpoint at two snapshots does not exclude intervening forward/back movement, and a valid final graph does not prove a complete ordinary action history. Do not invent releases, intermediate collisions, input timing, clock continuity or hardware behavior from endpoints alone.

## Public JSON record format

Every complete model run and sparse corpus carries a nonempty top-level `sourceHashes` object: nonempty source names map to lowercase 64-character SHA256 digest strings. Names may identify Model, automation, harness, shared helpers or public docs; no source-code contents accompany these digests. `publicDocHashes`, when present, separately records the exact canonical public-doc digests. Provenance maps identify claimed source bytes; they do not prove unobserved inputs, transitions or source authenticity. Preserve errors and incomplete first attempts rather than filling missing evidence.

The complete ordinary-run producer uses this public wrapper; extra provenance fields remain intact:

```text
{schema:1,kind:'cable-unweaver-ordinary-run',runId,channel:'model',sourceHashes,
 origin:{kind:'create',seed,level,state,publicConfig,completeCallCapture:true,inputRepresentation,sourceHashes,publicDocHashes,observedAt,clock},
 calls:[{kind:'call',seq,dt,input,before,after,observedAt,error}],
 end:{kind:'end',observedAt,outcome,reason,calls,complete,final,failure}}
```

`calls` records every actual invocation, including no-ops, with seq starting at1. Each own `dt` and `input` field is required; recognized raw input values are retained, with missing keys remaining missing. Ordinary inputs are JSON-safe own-data records; accessor/proxy and non-JSON fixtures require separate labeled evidence. Origin, before, after and final states are complete snapshots. `end.calls` equals the invocation-array length, distinct from admitted model calls; actual adjacent snapshots must agree. The checker uses each recorded before state independently, and never substitutes a calculated continuation for an actual observation.

Browser producers use `{schema:1,kind:'cable-unweaver-public-observations',channel:'browser',runId,originKind,sourceHashes,publicDocHashes,startedAt,calls:[],observations,inputs,clock,scope}` with optional captures and producer status. Each observation is `{seq,sourceObservationIndex,label,observedAt,readWindow:{start,end},snapshot}`. Retain the full host snapshot wrapper, with its own `model` object or null; read windows are finite seconds with start<=end in the stated parent clock, and observedAt is the actual UTC read-completion timestamp. Original seq>=1 and sourceObservationIndex>=0 increase strictly within each segment and are not renumbered at retry. An empty calls array does not assert complete model-call capture.

The sparse projection wrapper is `{schema:1,kind:'cable-unweaver-public-browser-segments',sourceHashes,sourceHashSources,segments,boundaryGaps,projection}`. Each segment retains `{segmentId,runId,channel:'browser',originKind,level,seed,parentContext,observations,inputs,captures,boundaryFromPreviousObservedModel,scope}`; parentContext includes the actual nonempty clock description, original public parent, source file/hash/pointer, and any explicit public context. Segment IDs and run IDs are distinct, every original observation appears exactly once, and each adjacent segment pair has a boundaryGaps record naming fromSegmentId/toSegmentId. Split at observed identity changes or decreases in calls, elapsed or movesUsed, retaining null-menu rows and comparing the actual model observations across them. Invisible same-identity resets remain unproven. All sparse interval continuity stays not-observed and lifecycle/input/gates remain review-required.

Projection manifests name existing public JSON through explicit file paths and RFC6901 pointers, with `sourceHashSelections:[{label,file,pointer}]` selecting actual recorded nonempty digest maps. Labels are unique nonempty strings; output sourceHashes uses `label+'/'+originalKey` without collisions or overwrites. `sourceHashSources` retains each `{label,file,sha256,pointer,hashes}` original map and provenance. Selectors and mappings are authored only after actual inputs exist; source files must remain unchanged through exclusive output creation. Helpers do not import or read Model, pilot or solver source. Private pilot diagnostics are excluded from public context, including nested context. Digest metadata, full observed calls and sparse endpoints remain separate evidence categories.

Final recording projection preserves both setupObservations and states as distinct parent streams. It retains every original row field while adding aliases: seq=index+1, sourceObservationIndex=index, label=kind and snapshot=state. Setup readStartedPerformanceMs/readCompletedPerformanceMs are divided by1000 without rebasing; capture-relative readStartedAt/readCompletedAt seconds remain unchanged. Original inputs, frameManifest and the full public recording wrapper remain context. These aliases are labeled conversions, not newly observed calls, exact frame/state matches or an inferred clock relation across streams.

## Required evidence before release

Obtain three fresh ordinary wins and three natural budget losses, each from public create and normal controls. Visibly demonstrate a shared graph-node contact that is legal, positive collinear overlap that remains illegal even with a shared node, a rigid group moved by selecting either member, a shorter member blocking the whole group without budget charge, and a temporarily coincident terminal placement that can still be repaired. Use the true current conflict/validity fields rather than expected target captions.

Exercise real start with A held, release/repress, selection changes, parallel/orthogonal directions, pause/resume, hidden/blur or equivalent actual host cancellation, disconnect/reconnect and result/retry/task selection. Record which evidence is browser, phone, complete model calls or synthetic fixture; none substitutes for another. Preserve first attempts and any helper/startup failures with their actual source hashes.

The actual30–90second gameplay recording begins at its real menu/start, shows an understandable task, selection and coupled rail adjustments, current conflict feedback and actual result. Use actual play, not slides, private auto-solvers, title-card padding or injected solutions. Keep video and APK each strictly below10,000,000 bytes and record original dimensions, duration, byte size and source. Final original images require actual individual review; no future capture is pre-marked accepted.

These documents specify rules and evidence requirements only. They make no claim that implementation, tests, screenshots, video, hardware validation, packaging or publication have occurred.
