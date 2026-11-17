# Shadow Shutter — public model contract

This contract defines game 33, seed 733, and is not an execution result. The complete authored public JSON embedded under Public level data below supplies every shape, depth, pose, motion segment, target and resource limit. The three scenarios share exactly the same rules. Their paper kits, relative compositions, stage locations and initial motion phases differ.

## Geometry and photographic registration

Use 60 ticks/second and 480 integer spatial units/cell. The finite stage is `[0,13440) × [0,7680)`, corresponding to 28×16 logical cells. X points right and Y down. A cell is its complete half-open rectangle, not its center sample. An actor is the exact union of its published occupied cells. The cells are a geometry authoring unit, not a visible tile grid. Rectangle edges can render as continuous paper-cut outlines with material details inside the actual region.

An actor has a fixed local bounding-box width and height. For an unmirrored occupied cell `(x,y)`, its local rectangle is `[480*x,480*(x+1)) × [480*y,480*(y+1))`. Mirroring substitutes `widthCells-1-x` for x before world translation. It does not change the actor origin or bounding-box size. All origins, rectangle coordinates, velocities and captures use exact integers. No rounding, angular interpolation, pixel-center sampling or approximate mask rescaling belongs to the match rule.

The player moves an opaque board whose single exposure window is landscape 9×7 cells or portrait 7×9. Store its center as odd integer doubled-cell coordinates `(cx2,cy2)`. Its upper-left in spatial units is `((cx2-widthCells)*240,(cy2-heightCells)*240)`. Thus the upper-left always lies on the whole-cell lattice. Clamp cx2 to `[widthCells,56-widthCells]` and cy2 to `[heightCells,32-heightCells]`. Direction changes one center coordinate by ±2, then clamps. B toggles mode, preserves center, then applies the new mode's clamp. This is a visible move of the exposure window; it never moves the stage. A boundary clamp can turn a navigation request into no actual movement without any film cost.

Each target is its pose's published frame mode and three identified local actor regions, built from that pose's local origins and mirror states. `stageOriginCells` positions the authored moving scene in world space; it is not an automatic registration adjustment. During matching, subtract the **actual current aperture upper-left** from each actual actor region and compare with its corresponding target region. There is no translation search, bounding-box recentering, scaling, rotation, reflection equivalence, or acceptance of a target-shaped subset. All three local component registrations and the full union must be exact.

The full target and its component identities are visible in the blueprint and contact sheet. Use three distinguishable dark paper tones or persistent seams in both the scene and target; otherwise same-color overlap could conceal the distinction the complete-visibility rule needs. The right-facing and left-facing targets are intentionally different photographs. Every complete authored target is horizontally asymmetric. A symmetric individual piece is allowed to look unchanged when its holder flips: compare its actual region, never reject solely because a mirror metadata bit differs.

## Actual depth, clipping and occlusion

World depth from back to front is part-a, part-b, part-c, paper-strip. All are opaque. Required pieces deposit ink; the front strip is illuminated paper that replaces covered ink with the photographic background. The opaque player board exposes only the aperture. A separate clearly labelled full-stage navigation preview may show beyond the window, but it is not an exposure image. The actual board and front strip cannot become translucent or reveal ghosted hidden pieces in the exposure view or saved photograph.

Let W be the finite world, A the current aperture, `S_i` the complete world region of required actor i and O the foreground strip. The actual visible part of i is

`V_i = (S_i ∩ W ∩ A) minus (union of all higher required S_j and O)`.

The photographed ink is `E = union(V_i)`. In particular, the strip can erase ink; it is not merely drawn behind the scene. Required parts also occlude lower required parts. The same completeness rule applies to both kinds of blocker. Touching edges have no overlapping area under the half-open convention. There is no tolerance for a positive-area cut or overlap, even one spatial unit wide.

For every required actor, separately compute:

- `insideWorld`, `insideAperture`: its entire S_i is contained in the corresponding rectangle.
- `occludedRegion`: the part of S_i covered by any higher opaque actor, independent of aperture clipping; `unoccluded` means that region is empty.
- `fullVisible`: `V_i` exactly equals S_i.
- `registered`: its complete un-clipped region, translated into current aperture coordinates, equals its identified target component region.

A photo matches iff the frame mode matches, all three actors are fully visible and registered, and the full local exposed ink set equals the complete target union. The final union check includes all negative space inside the frame. Do not substitute total area, bounding boxes, component counts or a preselected motion phase. The complete-visibility check is independent of the union comparison: hiding a required fragment behind another dark piece cannot be excused by an identical-looking union.

All region operations are exact set operations on half-open integer rectangles. An implementation may use rectangle subtraction, interval sweeps or another exact method. Evidence represents regions as positive-area, pairwise interior-disjoint rectangles sorted by `(y0,x0,y1,x1)`. Different exact partitions of the same set are equivalent; compare regions geometrically, not by incidental list length or vertex order.

## Moving paper stage

Motion phase is `mod(tick+phaseOffsetTicks,2160)` in `[0,2160)`. There are three repeating compositions, each with an eight-second transit followed by a four-second dwell. The JSON gives all six phase segments. A pose's world origin for an actor is 480 times the sum of stageOriginCells and that actor's local originCells.

During a transit of age n in `[0,480]`, origin is `fromOrigin+(toOrigin-fromOrigin)*n/480`. The endpoints are whole-cell multiples, so each coordinate's velocity is an integer units/tick. The whole path is exact; do not snap actors to a target merely because a dwell is near. Mirror state is the source pose for ages 0–239, and the destination pose for ages 240–479. At age 240 the paper holder reverses instantaneously within its fixed local bounding box. This explicit idealized reversal is part of the actual geometry, not a renderer-only flip or an acceptance shortcut.

Segments use half-open phase ranges. Their positional endpoints agree. At phase zero, actors have pose 2's exact origin and mirror state and begin the next transit toward pose 0. A boundary crossing into a transit does not jump the origin. An interval ending at a holder-reversal boundary records the mirror change at that end boundary. All photos use the geometry defined at their integer capture boundary, including the applicable mirror state there.

The front strip is a 9×1-cell opaque rectangle. At a dwell's first boundary its origin is stageOriginCells plus `[0,1]`. Over the first 60 dwell ticks it moves linearly to stageOriginCells plus `[0,frameHeightCells+1]`, then stays there. During the preceding 480-tick transit it moves from the previous pose's exit origin to this next start origin. These are integer velocities too. The guaranteed capture interval is the closed interval `[dwellStart+60,dwellEnd]`, lasting 180 ticks (3 seconds) and containing 181 integer boundaries. At dwellEnd the next half-open transit segment has the same endpoint actor/strip geometry. Throughout that closed capture interval the strip lies wholly below the aperture and the required pieces remain fully visible and correctly composed when framed properly. A photo can also match at any other actual boundary satisfying the exact geometric predicates; there is no hidden eligibility timer.

Motion continues after every nonterminal photograph and after a target advance. Targets do not move the stage, restart a phase or change actor shapes. Actors remain the same three paper pieces for the whole round. On retry the host recreates tick zero and all initial values, so the same authored motion phase returns exactly.

## Film, ordered targets and terminal priority

The active target starts at index zero. The three targets are the three poses in their authored order. A single photograph is compared only with the active target captured at that boundary. A matching photograph credits exactly that target and advances the index once. It cannot simultaneously credit a later target, even if some component geometry is shared. Photographing a previous or future composition is an ordinary miss against the current target.

Every fresh admitted A consumes exactly one film sheet, successful or not. Apply the resulting target credit first. If all three are now credited, win even if the last sheet was used. Otherwise, if remaining film is zero, lose `film_exhausted` immediately. Both capture terminal outcomes occur at the current mechanical boundary, without advancing a motion interval or tick. A last-sheet successful photograph of a nonfinal target still loses film exhaustion after recording that genuine credit. Preserve the captured geometry and result; do not invent another chance or refund the sheet.

When there is no capture terminal, integrate one actual interval and then resolve the deadline. If tick reaches deadlineTick, lose `deadline`; no A can be admitted at that boundary afterward. Thus a final successful shot at the last playable boundary wins before any later deadline test. The successful shot uses that boundary's pre-motion geometry, not a scene extrapolated to the next tick. Terminal calls are immutable no-ops.

## Existing shared runtime and exact input order

Export the existing UMD/CommonJS `create(seed=733,difficulty=0)` and `step(state,dt,input)`, in that argument order. Seed must be a nonnegative safe integer; difficulty must be exactly integer 0, 1 or 2. Missing/undefined arguments use the published defaults; null, strings, fractions, negative values and all other invalid inputs throw RangeError before creating state. Valid seeds are recorded without randomizing these authored scenarios. Difficulty 0/1/2 maps to the three authored scenarios. Create returns `phase='playing'`, tick zero, initial film/target/aperture and public geometry at tick zero. The host owns menu/start/pause/resume/retry/scenario selection and stops calling step while paused. Do not introduce Model lifecycle exports, Model pause state, a new shared renderer API or a model-specific audit callback.

For a terminal state, step is a full no-op before reading dt/input. For an active state, dt exactly zero is a full no-op. Otherwise require finite positive dt within 1e-12 of 1/60; invalid dt throws before mutation. A valid call creates one transaction, which advances zero or one mechanical intervals. It never integrates a fractional tick or consumes extra time to catch up privately.

Read existing x/y, a/b, aPressed/bPressed, cancelled/cancelEpoch. Finite axes are clamped to [−1,+1]; missing/nonfinite axes become zero. Apply the 0.55 threshold to received values after any host normalization: x≥0.55 is right, x≤−0.55 left, and likewise Y down/up. Nonzero Y takes priority. Direction is the full token left/right/up/down, so changing axis is a fresh direction even when the sign stays the same. Every direction-token change resets repeatAgeTicks to zero before its immediate move. If held, repeat at ages 12,18,24,... completed simulation ticks. Increment age only after a real integrated interval with a nonquarantined nonzero direction; neutral direction or cancellation resets it. Clamp after each individual move.

All button fields are true only when literal true. EffectiveA is a OR aPressed; effectiveB likewise. Initial inputState is `{cancelEpoch:0,quarantined:true,aArmed:false,bArmed:false,direction:null,repeatAgeTicks:0}`. In an eligible sample, freshA is effectiveA AND aArmed, then aArmed becomes NOT effectiveA; likewise B. Holding A through a target change therefore cannot shoot again. Both fresh buttons are allowed together: B applies before A, so the photograph uses the changed and clamped frame. Neither button repeats merely because it is held.

A finite incoming cancelEpoch replaces the stored value exactly; missing/nonfinite retains the old one. A changed epoch or literal-true cancelled enters quarantine, disarms buttons and clears direction/age. The same cancellation sample cannot acknowledge neutrality. A later uncancelled sample clears quarantine only with both received normalized axes strictly between −0.55 and +0.55 and all four raw button/pulse fields false. It arms both buttons but issues no movement, mode change or photo. Quarantined and neutral-acknowledgement samples still execute their ordinary real motion interval and deadline evaluation. Cancellation alone does not reset the stage, film, target, aperture or motion.

One valid transaction is ordered as follows:

1. Allocate transactionId, save fromTick and the pre-input aperture, clear transaction-local lastPhoto/lastInterval fields, and normalize input/cancellation. No actor has moved yet.
2. If eligible, apply direction movement/repeat and clamp. Then apply a fresh B toggle and its clamp. Record before/after aperture values even if navigation was clamped to no movement.
3. If eligible fresh A exists, deep-detach the actual scene at this boundary and the final aperture after steps 1–2. Consume film, evaluate the current target, record the photograph and any single target credit, then apply final-target win before zero-film loss. A terminal capture publishes a zero-interval transaction and leaves actor positions, motion phase and mechanical tick unchanged.
4. Otherwise integrate exactly `[t,t+1]`, using the published piecewise motion for all actors/strip; update tick and input repeat age. Record start/end origins, mirrors, segment phase and any mirror change at the end boundary.
5. Resolve deadline and publish the interval and transaction. Targets/film do not change inside a motion interval.

Host pause freezes every field because no call occurs. Resume's existing cancel flag/epoch is handled only on the next actual step. Ordinary evidence indices count transactions; mechanical tick counts actual intervals. They must not be equated when a capture ends the game before motion.

## Public data and review boundary

The Concrete public interface section below defines exact evidence shapes. Public Model state and receipts may contain actual geometry, motion phase, targets, film and the last captured photograph. A lightweight preview reports only current-boundary geometric match facts for the current target, and becomes null once activeTargetIndex is 3. It is recomputed from actual current state at create and after each valid transaction. Capture must independently evaluate this transaction's post-navigation/post-B aperture with its pre-motion scene and current target; it cannot reuse an older preview. A nonterminal shot may advance the target and then move the scene, producing a new live preview that is separate from the immutable old photograph. Public state must not embed an author witness, recommended exposure boundary or a hidden target-success schedule. Later authorized ordinary feedback control may read public actual state and submit ordinary inputs; its planning diagnostics remain separate from actual evidence, and it cannot omit steps, replace state or invent missing intervals.

Private finite manual existence witnesses remain only under `author-private/design-handcheck`. Root, implementers, renderer, pilot and independent QA do not read that material. The public feasibility summary contains bounds and geometric hand-check conclusions, not an action route. None of these static documents authorizes production or executable simulation.

## Concrete public interface

Static game-33 contract. Use the frozen shared `create(seed=733,difficulty=0)` / `step(state,dt,input)` surface. Create accepts only nonnegative safe-integer seed and exact integer difficulty 0..2; omitted/undefined uses defaults and any other invalid value throws RangeError. Valid seeds are recorded, with no scenario randomization. The model owns mechanics and publishes actual facts; the host owns lifecycle, controls and pause. No extra lifecycle export or shared-runtime change is required. All geometric coordinates are integer spatial units; raw input and dt retain their usual numeric types.

## Public state

Framework fields are width=960, height=540, seed, difficulty, level=1..3, levelName, scenarioId, phase (`playing`,`won`,`lost`), tick, elapsed=tick/60, score, lostReason, message. Score is `1000+100*film.remaining` when won and otherwise `100*creditedTargetCount`; it never affects matching. Terminal is null or `{reason,boundaryTick,transactionId}`, with reasons `all_targets_captured`, `film_exhausted`, `deadline`. Every nested terminal field uses this same shape.

Additional public state:

- `schemaVersion`, `scenario` (the frozen selected JSON scenario), and `physics:{geometry,aperture,motion}` containing frozen copies of those three corresponding top-level public JSON objects. `targets` is the frozen ordered array of `{targetIndex,targetId,name,mode,widthCells,heightCells,actors,unionRects}`; each target actor is `{id,localRects}` and regions use the exact convention below. Also expose `deadlineTick`, `activeTargetIndex` (0..3), `activeTargetId` (null at index 3), and immutable `targetCredits` in order.
- `film:{initial,used,remaining}` with initial=used+remaining, used equal to photoReceipts length and no negative count.
- `aperture:{mode,centerX2,centerY2,widthCells,heightCells,rect}` where rect is `{x0,y0,x1,y1}` in world units. No camera coordinate is implicit in rendering.
- `scene:{motionPhaseTick,segmentIndex,actors,strip}`. Each actor is `{id,depth,originX,originY,mirrorX,widthCells,heightCells,worldRects}`. Strip is `{id,depth,originX,originY,worldRect}`. Depth is the zero-based index in physics.geometry.depthOrder: 0,1,2 for the required actors and 3 for the strip. These are actual boundary values, not positions predicted for the next frame.
- `preview` is null when activeTargetIndex is 3; otherwise `{tick,activeTargetIndex,activeTargetId,actors,modeMatches,allFullyVisible,allRegistered,exposureEqualsTarget,matched,reason}`, where actors is the ordered array of `{id,fullVisible,registered}` and reason uses the same fixed priority as a photo receipt. It contains only present geometry facts at the state's current boundary and target, with no complete photo geometry, future sample or recommended input. Recompute it at create and after each valid transaction; terminal/dt0 no-ops leave it unchanged. Never reuse the previous preview to judge a shot after navigation/B or a target change.
- `inputState:{cancelEpoch,quarantined,aArmed,bArmed,direction,repeatAgeTicks}` and `lastInput`, initially null. Direction is null or left/right/up/down.
- `transactionCount` initially zero; `lastTransaction`, `lastInterval`, `lastPhoto`, `lastFrameChange` initially null; immutable permanent `photoReceipts` and `targetCredits` banks initially empty.

`lastInput` records `{transactionId,rawX,rawY,x,y,axisX,axisY,rawA,rawB,rawAPressed,rawBPressed,effectiveA,effectiveB,cancelled,rawCancelEpoch,cancelEpoch,epochChanged,quarantinedBefore,quarantinedAfter,neutralAcknowledged,freshA,freshB,direction,repeatAgeBefore,repeatAgeAfter}`. Raw axes/epoch retain finite numbers, otherwise null; x/y are clamped normalized axes. Raw buttons mean literal-true booleans. fresh fields are the eligible edges actually processed and are false under quarantine. All actual input decisions are observable without treating a pressed pulse as a continuously held button.

Every valid active transaction publishes `lastFrameChange:{transactionId,apertureBefore,navigationRequested,navigationChanged,apertureAfterNavigation,modeToggleRequested,modeToggleApplied,apertureAfterB}`, including no-control, cancelled, neutral-acknowledgement and no-photo transactions. navigationRequested is a direction token only when an edge/repeat requested a move, otherwise null; navigationChanged is false on a fully clamped move. modeToggleRequested is freshB, and an eligible requested toggle always applies once. Suppressed/neutral controls have null navigationRequested and false change/toggle booleans. No frame change consumes film.

`lastTransaction` is `{id,fromTick,toTick,advanced,photoReceiptIds,creditIds,intervalId,terminalAfter}`. An input-time capture terminal has equal from/to tick, advanced=false, intervalId=null and lastInterval=null. Otherwise toTick=fromTick+1 and intervalId=toTick. Terminal/dt0 no-op calls mutate nothing, including existing last-record fields, and do not allocate IDs. Invalid active dt throws before mutation. The collector identifies a new record by transactionCount, not by whether an old lastInterval is nonnull.

All geometry arrays, photograph records, target-credit records, last interval and last transaction are deep-detached facts once published. Freeze those records and nested arrays. Later motion replaces current scene/last-record references without altering a photograph, previous receipt or target blueprint. The renderer must not mutate model state.

## Exact regions and capture receipt

A rectangle is `{x0,y0,x1,y1}`, half-open and positive area. A region is a sorted list of pairwise interior-disjoint such rectangles representing its exact union; sort by y0,x0,y1,x1. Rectangle partitions need not be identical to compare equal sets. Evidence includes actual raw geometry as well as derived flags, so an independent sweep/intersection calculation can recompute every claim.

Every admitted fresh A produces exactly one permanent receipt, with receiptId starting at 1. No rejected/held/quarantined A produces a pretend photograph. Receipt fields are:

- `receiptId`, `transactionId`, `boundaryTick`, `motionPhaseTick`, `segmentIndex`, `targetIndexBefore`, `targetIdBefore`, `targetIndexAfter`, `targetIdAfter`.
- `aperture` after this transaction's direction and B changes; `sceneAtCapture` containing every actual actor and strip field above. This is the **input-boundary scene before any motion interval**, even if the transaction later moves the live scene.
- `expected` is a detached copy of `targets[targetIndexBefore]` with its complete defined target shape, including targetIndex/name. The target union and expected parts are in fixed aperture-local coordinates.
- `actorChecks` in depth order, each `{id,worldRects,localRawRects,visibleWorldRects,visibleLocalRects,outsideWorldRects,outsideApertureRects,occludedWorldRects,expectedLocalRects,insideWorld,insideAperture,unoccluded,fullVisible,registered}`. OccludedWorldRects covers overlap with higher required actors and the strip before aperture clipping.
- `exposureLocalRects`, `modeMatches`, `allFullyVisible`, `allRegistered`, `exposureEqualsTarget`, `matched`, and `reason`. Compute every predicate, not only the first failure. Primary reason priority is `wrong_frame_mode`, `required_piece_clipped`, `required_piece_occluded`, `component_registration_mismatch`, `exposure_mismatch`, otherwise `matched`. A piece clipped by world or aperture uses required_piece_clipped.
- Full `filmBefore` and `filmAfter` objects; `chargedFilm:1`; `creditedTargetId` or null; `terminalAfterCapture` in the common terminal shape.

The exposure image may have the same black union as a target while some component is incomplete; the flags must still report the actual missing/occluded component and matched=false. Conversely, a symmetric component's mirror metadata alone is not a failure when its actual geometry equals its expected region. Compare actual oriented regions, never canonicalize the whole silhouette through a reflection.

A target credit is `{creditId,targetIndex,targetId,photoReceiptId,transactionId,boundaryTick}`. It refers to the actual matching photograph and increments once. At most one credit occurs per receipt. Film/credit records remain valid even if the last sheet credits a nonfinal target and immediately loses. lastPhoto references the most recent immutable receipt for presentation; after a no-photo active transaction it is null transaction-locally, while the renderer can display `photoReceipts[photoReceipts.length-1]` as the stable last photograph.

## Actual motion interval

Every real integration publishes one `lastInterval`:

- `intervalId=toTick`, `transactionId`, `fromTick`, `toTick=fromTick+1`, `fromMotionPhaseTick`, `toMotionPhaseTick`, `sourceSegmentIndex`, and `precedingPhotoReceiptIds`.
- `actors:[{id,fromOriginX,fromOriginY,toOriginX,toOriginY,velocityX,velocityY,fromMirrorX,toMirrorX,mirrorChangedAtEnd}]`. The origin difference equals its actual velocity in units/tick. MirrorChangedAtEnd records the published midpoint reversal if this interval ends there; it never changes the already-captured image.
- `strip:{fromOriginX,fromOriginY,toOriginX,toOriginY,velocityX,velocityY}`. Its constant size is referenced explicitly from `physics.motion.occluder.sizeCells` ([9,1]) and converted with physics.geometry.unitsPerCell; no extra unnamed size field is implied.
- `apertureDuringInterval`, `filmDuringInterval`, `targetIndexDuringInterval`, `terminalAfter`, `phaseAfter`. Film, target and aperture do not change halfway through an interval.

No interval is invented for an input-time win or film loss. Ordinary evidence stores one frame per actual transactionIndex, independently of `actualFixedTicks=model.tick`, and captures every nonnull interval once. It can independently reconstruct piecewise linear origin motion, midpoint mirror changes, geometric exposure and resource accounting from these records. A terminal/dt0 no-op cannot duplicate the previous interval. The longest round has at most 5400 real intervals.

The existing browser can perform several steps per rendered frame. Its snapshots/video are therefore sparse observations, not a guaranteed complete 60 Hz mechanical stream. Do not fill missing ticks with a predicted route or relabel sparse browser frames as actual intervals. Complete independent algebra evidence is collected by an authorized ordinary runner reading each actual step. No new Model audit callback is needed.

## Rendering and host integration

Use the shared 960×540 WebGL1 atlas/one-draw path. Each required region has at most eight cells and the strip is one rectangle; contiguous opaque rectangles or faithful sprites can show the exact paper shape without per-frame CPU texture generation. Do not draw cell borders or a pixel grid. Use smooth continuous paper edges, three distinguishable dark tones, restrained surface grain and a bright foreground strip. Decoration must not cover key contours or fake an unmodeled occlusion.

The main composition shows the actual exposure window and moving pieces. A separately labelled full-stage navigation preview may reveal scene positions beyond the window; it must not be presented as the exposure result or as translucency of the board. In the actual exposure view and photograph, the board and foreground strip are fully opaque and hidden fragments never show through. The target panel shows its complete asymmetric silhouette, required frame mode and identifiable components. The contact sheet shows the three ordered targets and actual credited photos. Film and deadline remain legible. The last photograph must render receipt geometry at its saved capture tick, alongside that receipt's target/result if shown; never substitute current moving actor state or the newly advanced target.

The blueprint may use a game-local read-only DOM block synchronized by existing hud(s), visible in the host menu and pause dialog, without a shared-runtime change. Pausing itself never calls the model or changes geometry. Retry recreates the same scenario/seed and restores tick-zero scene, film, target, aperture and input quarantine. Both keyboard and mobile use the shared input fields.

## Semantic acceptance boundaries

Later authorized validation must include a capture whose result differs from the next moved frame; a required fragment clipped at the window edge; lower-part occlusion by another required part and by the paper strip; a complete opposite-facing composition rejected for the current target; symmetric component flip handled geometrically; A held across target advancement consuming only one sheet; B+A using the changed frame; a last-sheet final success winning; a last-sheet nonfinal success preserving its credit but losing; capture-terminal zero interval; deadline refusing a later shot; cancelled/neutral samples advancing only real motion; retry restoring exact initial phase and film. These are obligations, not an executable test, private route or permission to run production now.

## Concrete configuration and field conventions

- `schemaVersion=1`. `identity` is a deep-frozen copy of the public JSON identity, retaining exactly `gameId,name,englishName,slug,packageId,versionName,versionCode,seed,actionCount,assignmentSha256`. Its authored seed remains 733; top-level `seed` records the valid run seed. `scenario` is the complete deep-frozen selected JSON scenario, with `id,name,phaseOffsetTicks,initialFilm,deadlineTick,actors,poses` unchanged. `scenarioId=scenario.id`, `levelName=scenario.name`, `deadlineTick=scenario.deadlineTick`. `physics` has exactly the three nested keys `geometry,aperture,motion` specified above; their contents are complete frozen copies of the corresponding public JSON objects, not flattened aliases.
- `targets` has exactly three entries in scenario.poses order. For entry i, targetIndex=i, targetId=pose.id, name=pose.name, mode=pose.mode, and widthCells/heightCells come from that public aperture mode. Its actors are ordered by physics.geometry.requiredActors. Each local region applies the pose's own mirror state within the authored actor width, then translates by that pose's local originCells multiplied by unitsPerCell; it excludes stageOriginCells. unionRects is the exact union of those target actor regions. Every target/actor/region key is the shape stated above; no target adds a recommended world aperture or future capture time.
- `scene.actors`, preview.actors, receipt.actorChecks and interval.actors use physics.geometry.requiredActors order. `scene.segmentIndex` and interval.sourceSegmentIndex are zero-based indexes into physics.motion.segments; sourceSegmentIndex refers to the interval's start boundary. `sceneAtCapture` is a deep-detached copy of the entire defined scene shape, including motionPhaseTick and segmentIndex as well as actors and strip. Receipt motionPhaseTick/segmentIndex equal those capture-scene fields. Actor worldRects are complete transformed regions before clipping or occlusion; strip.worldRect uses the public constant strip size. An empty derived region is `[]`, never null or a zero-area rectangle.
- `lastInput.axisX/axisY` are -1, 0 or +1. `lastInput.direction` is the resulting input latch token after this transaction's handling; repeatAgeBefore is the pre-input latch age, and repeatAgeAfter is its final age after any actual interval. `lastInput.cancelled` is only the normalized raw cancelled flag, while epochChanged separately records the comparison with the stored prior epoch. neutralAcknowledged is true only when an uncancelled complete-neutral sample actually clears existing quarantine. Raw numeric fields accept finite numbers only; strings and other types become null and normalized axes become zero.
- Every lastFrameChange aperture field is a full detached aperture object. apertureBefore is the transaction's pre-navigation/pre-B aperture, apertureAfterNavigation is immediately after navigation and its clamp, and apertureAfterB is after B and its clamp. navigationChanged means the actual center changed, not merely that a held direction requested a move. These three objects are equal when neither movement nor mode toggle applies. A terminal shot keeps this same final aperture without an invented interval.
- `photoReceipts` and `targetCredits` are append-only banks of deep-frozen records; their previously published entries never change. Receipt IDs and credit IDs are independent consecutive sequences starting at 1. lastTransaction.photoReceiptIds and creditIds contain only this transaction's IDs, each with length zero or one. `lastPhoto` is this transaction's sole actual receipt or null; lastFrameChange is present for every valid transaction. lastInput, lastFrameChange, lastTransaction, lastInterval, preview when nonnull, current scene geometry and their nested facts are deep-frozen after publication and replaced rather than mutated by a later step. A photo's aperture, sceneAtCapture, expected, actorChecks, exposure and film facts remain detached from every later live state.
- `activeTargetIndex=targetCredits.length`; activeTargetId is targets[activeTargetIndex].targetId while that index is below three, otherwise null. On a capture, targetIndexBefore/targetIdBefore identify the target actually evaluated; targetIndexAfter/targetIdAfter identify the result after at most one real credit. creditedTargetId is the evaluated target's ID exactly when matched, otherwise null. A nonfinal last-sheet match still records that credit and then loses. `preview` always refers to the final current scene, aperture and active target of the returned state; after nonterminal capture it may therefore describe a different target and later physical boundary from the saved photo. At final success preview is null. It never supplies or substitutes a future shot result.
- `lastInterval.actors[].velocityX/Y` and strip.velocityX/Y are exact end-origin minus start-origin for that actual one-tick interval, including segment boundaries. mirrorChangedAtEnd is exactly fromMirrorX!==toMirrorX; an actual bit flip is recorded even when a symmetric piece's region is unchanged, while an unchanged bit yields false. There is no interpolated intermediate mirror state. apertureDuringInterval and filmDuringInterval are full detached objects; targetIndexDuringInterval is the post-capture target index. interval.terminalAfter may contain a deadline loss, while any receipt from that same earlier boundary retains terminalAfterCapture=null if the capture itself was nonterminal.
- Initially transactionCount/tick/elapsed/score/activeTargetIndex are zero; film is `{initial:scenario.initialFilm,used:0,remaining:scenario.initialFilm}`; aperture uses the published initial mode and doubled-cell center; scene is the exact tick-zero geometry for the selected phaseOffsetTicks. phase is playing, terminal/lostReason/lastInput/lastTransaction/lastInterval/lastPhoto/lastFrameChange are null, and both receipt banks are empty. activeTargetId is targets[0].targetId. Preview is evaluated from that real initial scene and target, not hard-coded to a false result. InputState has exactly the initial values in the model contract.
- `lostReason` is null unless phase is lost, then it equals terminal.reason. Score uses targetCredits.length as the creditedTargetCount; no redundant earned-count field is required. `message` is Chinese display text reflecting actual composition/photograph or terminal facts, never a rule input. There is no added `stage`, `status`, `cursor`, `events`, `failures`, lifecycle bank, future-window hint, or duplicate interval history. Renderers derive countdown from deadlineTick and model.tick; the outer host snapshot tick remains a different call counter.

## Public level data

```json
{
  "schemaVersion": 1,
  "designStatus": "static-draft-awaiting-root-review",
  "identity": {
    "gameId": 33,
    "name": "影窗快门",
    "englishName": "Shadow Shutter",
    "slug": "shadow-shutter",
    "packageId": "com.ecojust.shadowshuttertv",
    "versionName": "0.1.0",
    "versionCode": 1,
    "seed": 733,
    "actionCount": 2,
    "assignmentSha256": "4f804d95a15a5e732b72425a9a2dbf2cb43483be04442d69112ce99df0fea451"
  },
  "premise": "Move the opaque board's exposure window around a miniature paper-shadow stage. Three separately moving paper cutouts must form each published photograph with every required part visible. The foreground paper strip can hide a part. Capture the three ordered compositions with limited film.",
  "geometry": {
    "unitsPerCell": 480,
    "ticksPerSecond": 60,
    "worldSizeCells": [28,16],
    "origin": "world upper-left; x increases right, y increases down",
    "cellRegion": "cell [x,y] denotes the half-open rectangle [480*x,480*(x+1)) by [480*y,480*(y+1)); geometry is the exact union of those rectangles",
    "boundaryRule": "shared edges have zero overlap; exact containment at an aperture edge is accepted",
    "mirrorRule": "reflect a shape within its fixed published widthCells: local cell x becomes widthCells-1-x; no automatic reflection, rotation or recentering is allowed during matching",
    "registration": "target coordinates are fixed relative to the exposure window's upper-left; each identified required actor must exactly equal its own target region in that coordinate frame",
    "spatialToleranceUnits": 0,
    "humanMargin": "window movement is in exact one-cell steps; successful scene poses dwell, so exposure timing has a multi-second interval rather than a one-tick coincidence",
    "depthOrder": ["part-a","part-b","part-c","paper-strip"],
    "requiredActors": ["part-a","part-b","part-c"],
    "actorTones": ["deep-indigo","warm-charcoal","muted-plum"],
    "occluderTone": "opaque illuminated paper, replacing ink with background in a photograph",
    "fullVisibility": "every required actor's complete world region must lie inside world and aperture, and no part may intersect any higher opaque actor or the foreground paper strip",
    "sameColorOverlap": "overlap still occludes the lower actor even if display colors are similar; visible component tints and seams identify the three required parts",
    "exposure": "compose back-to-front inside the aperture; required actors deposit ink and the paper strip overwrites covered ink with paper; compare the entire resulting local ink set to the target union",
    "match": "correct frame mode AND exact per-required-actor local region equality AND complete visibility of every required actor AND exact full exposure union equality"
  },
  "aperture": {
    "initialMode": "landscape",
    "initialCenterDoubledCells": [27,15],
    "modes": [
      {"id":"landscape","sizeCells":[9,7]},
      {"id":"portrait","sizeCells":[7,9]}
    ],
    "centerLattice": "odd integer doubled-cell coordinates; one navigation step changes one center coordinate by 2",
    "clampRule": "for width w and height h in cells, clamp centerX2 to [w,56-w] and centerY2 to [h,32-h]",
    "modeChange": "B toggles landscape/portrait, keeps the center, then clamps that center to the new mode's legal range",
    "board": "the opaque player board blocks the world outside the exposure rectangle; it does not translate the stage or the target geometry"
  },
  "motion": {
    "periodTicks": 2160,
    "phaseRule": "phaseTick=mod(tick+scenario.phaseOffsetTicks,2160), with mod returning [0,2160)",
    "poseWorldOrigin": "actor origin at pose k is 480*(pose.stageOriginCells + pose.parts[actorId].originCells)",
    "segments": [
      {"fromPhaseTick":0,"toPhaseTick":480,"kind":"translate","fromPose":2,"toPose":0},
      {"fromPhaseTick":480,"toPhaseTick":720,"kind":"dwell","pose":0},
      {"fromPhaseTick":720,"toPhaseTick":1200,"kind":"translate","fromPose":0,"toPose":1},
      {"fromPhaseTick":1200,"toPhaseTick":1440,"kind":"dwell","pose":1},
      {"fromPhaseTick":1440,"toPhaseTick":1920,"kind":"translate","fromPose":1,"toPose":2},
      {"fromPhaseTick":1920,"toPhaseTick":2160,"kind":"dwell","pose":2}
    ],
    "translation": "linear exact integer-origin interpolation over 480 ticks; all waypoint differences are whole cells so each per-tick velocity is an integer number of units",
    "mirrorDuringTransit": "use fromPose mirror state for transit ages 0..239 and toPose mirror state for ages 240..479; this is an explicit instantaneous paper-holder reversal at the transit midpoint",
    "segmentBoundary": "segments are [from,to); endpoint positions agree; phase 0 is pose 2's exact position and mirror state at the start of its departing transit",
    "occluder": {
      "id":"paper-strip",
      "sizeCells":[9,1],
      "dwellStartOrigin": "pose.stageOriginCells + [0,1]",
      "dwellExitOrigin": "pose.stageOriginCells + [0,frameHeightCells+1]",
      "dwellExitTravelTicks":60,
      "dwellRule":"move linearly from start to exit during the first 60 dwell ticks, then remain at exit through the dwell end",
      "transitRule":"during each 480-tick actor transit, move linearly from the previous pose's exit origin to the next pose's dwell-start origin",
      "guaranteedClearDwellInterval":"closed capture interval [dwellStart+60,dwellEnd], lasting 180 ticks and containing 181 integer capture boundaries; at dwellEnd the next transit has the same endpoint geometry, with no strip overlap with the whole aperture"
    }
  },
  "controls": {
    "direction":"move the window one cell on the selected axis; nonzero Y takes priority over X; every direction-token change resets age to zero and acts immediately, held repeat at ages 12,18,24,... actual integrated ticks",
    "a":{"label":"拍摄","meaning":"one fresh A captures the actual scene at the input boundary and consumes one film sheet"},
    "b":{"label":"横竖画幅","meaning":"one fresh B toggles aperture mode, with no film cost"},
    "sameBoundaryOrder":"navigation, then fresh B mode change/clamp, then fresh A capture, then (only if nonterminal) one tick of silhouette motion",
    "freshAAndBTogether":"both apply in the published order: change frame first, then take exactly one photograph in the resulting aperture",
    "pause":"fixed host pause entry; the host stops Model.step",
    "instructionText":[
      "移动遮光板的窗口，把三块纸影拼成右侧目标。目标里的分色与接缝对应三块必需纸片。",
      "方向键移动窗口；B切换横幅/竖幅；A拍摄。每次拍摄消耗一张胶片，长按只拍一张。",
      "纸片必须完整入窗，不能被前层纸片或浅色纸带挡住。目标朝向固定，镜像不能替代。",
      "按顺序拍齐三张。拍摄取按键当刻的舞台，成功换目标不会重置运动。"
    ]
  },
  "roundRules": {
    "targetOrder":"poses 0,1,2 in order; only the currently active target can earn credit",
    "targetSwitch":"on a matching photo, credit exactly one target and advance once; retain all world motion phase, aperture, film history and input armed states",
    "film":"every admitted fresh A photo consumes one sheet, including a miss, an already-credited-looking composition or a future-target-looking composition",
    "lastFilmPriority":"after capture, apply the current target result; if all three are credited, win even when film is now zero; otherwise film zero loses immediately",
    "captureTerminal":"a win or film-exhausted loss at input time ends that transaction with no motion interval and no mechanical tick increment",
    "deadline":"if no capture terminal occurred, advance exactly one interval and then lose when tick reaches deadlineTick; no capture is admitted at or after that boundary",
    "heldShutter":"effective A uses raw a OR aPressed and an armed edge latch; one held press cannot create a second photo even if the target changes",
    "retry":"host creates the same authored scenario from tick zero, restoring film, target index, aperture center/mode, all initial phases and quarantined input",
    "pause":"no Model.step means every model field freezes; resume uses existing shared cancellation and neutralization, without a wall-clock catch-up"
  },
  "scenarios": [
    {
      "id":"paper-bird","name":"纸鸟回眸","phaseOffsetTicks":0,"initialFilm":5,"deadlineTick":4560,
      "actors":[
        {"id":"part-a","name":"鸟身","widthCells":3,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1]]},
        {"id":"part-b","name":"长翼","widthCells":2,"heightCells":3,"cells":[[0,0],[0,1],[0,2],[1,2]]},
        {"id":"part-c","name":"鸟首与喙","widthCells":3,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[0,1]]}
      ],
      "poses":[
        {"id":"bird-right","name":"向右展翼","mode":"landscape","stageOriginCells":[2,2],"parts":{"part-a":{"originCells":[2,4],"mirrorX":false},"part-b":{"originCells":[2,1],"mirrorX":false},"part-c":{"originCells":[5,3],"mirrorX":false}}},
        {"id":"bird-rise","name":"昂首高栖","mode":"portrait","stageOriginCells":[11,4],"parts":{"part-a":{"originCells":[2,5],"mirrorX":false},"part-b":{"originCells":[2,2],"mirrorX":false},"part-c":{"originCells":[3,1],"mirrorX":false}}},
        {"id":"bird-left","name":"向左回眸","mode":"landscape","stageOriginCells":[18,1],"parts":{"part-a":{"originCells":[4,4],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[1,3],"mirrorX":true}}}
      ]
    },
    {
      "id":"folded-sail","name":"纸帆远航","phaseOffsetTicks":-480,"initialFilm":5,"deadlineTick":5040,
      "actors":[
        {"id":"part-a","name":"船身","widthCells":5,"heightCells":2,"cells":[[0,0],[1,0],[2,0],[3,0],[4,0],[1,1],[2,1],[3,1]]},
        {"id":"part-b","name":"桅杆","widthCells":1,"heightCells":3,"cells":[[0,0],[0,1],[0,2]]},
        {"id":"part-c","name":"三角帆","widthCells":3,"heightCells":3,"cells":[[0,0],[0,1],[1,1],[0,2],[1,2],[2,2]]}
      ],
      "poses":[
        {"id":"sail-right","name":"顺风右帆","mode":"landscape","stageOriginCells":[17,2],"parts":{"part-a":{"originCells":[2,4],"mirrorX":false},"part-b":{"originCells":[3,1],"mirrorX":false},"part-c":{"originCells":[4,1],"mirrorX":false}}},
        {"id":"sail-high","name":"高挂风帆","mode":"portrait","stageOriginCells":[3,3],"parts":{"part-a":{"originCells":[1,6],"mirrorX":false},"part-b":{"originCells":[2,3],"mirrorX":false},"part-c":{"originCells":[3,1],"mirrorX":false}}},
        {"id":"sail-left","name":"逆向左帆","mode":"landscape","stageOriginCells":[11,7],"parts":{"part-a":{"originCells":[2,4],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[2,1],"mirrorX":true}}}
      ]
    },
    {
      "id":"tea-lantern","name":"壶影茶灯","phaseOffsetTicks":-960,"initialFilm":6,"deadlineTick":5400,
      "actors":[
        {"id":"part-a","name":"壶身","widthCells":4,"heightCells":3,"cells":[[1,0],[2,0],[0,1],[1,1],[2,1],[3,1],[1,2],[2,2]]},
        {"id":"part-b","name":"壶盖","widthCells":3,"heightCells":2,"cells":[[1,0],[0,1],[1,1],[2,1]]},
        {"id":"part-c","name":"长壶嘴","widthCells":3,"heightCells":3,"cells":[[1,0],[2,0],[0,1],[1,1],[0,2]]}
      ],
      "poses":[
        {"id":"tea-right","name":"向右注茶","mode":"landscape","stageOriginCells":[3,7],"parts":{"part-a":{"originCells":[1,3],"mirrorX":false},"part-b":{"originCells":[1,1],"mirrorX":false},"part-c":{"originCells":[5,2],"mirrorX":false}}},
        {"id":"tea-high","name":"提盖高注","mode":"portrait","stageOriginCells":[17,2],"parts":{"part-a":{"originCells":[1,5],"mirrorX":false},"part-b":{"originCells":[1,3],"mirrorX":false},"part-c":{"originCells":[4,2],"mirrorX":false}}},
        {"id":"tea-left","name":"向左收壶","mode":"landscape","stageOriginCells":[9,1],"parts":{"part-a":{"originCells":[4,3],"mirrorX":true},"part-b":{"originCells":[5,1],"mirrorX":true},"part-c":{"originCells":[1,2],"mirrorX":true}}}
      ]
    }
  ],
  "sharedRuntime": {
    "exports":["create(seed=733,difficulty=0)","step(state,dt,input)"],
    "createInputDomain":"seed must be a nonnegative safe integer; difficulty must be exactly integer 0,1,2; omitted/undefined arguments use defaults, all other invalid values throw RangeError; valid seeds are recorded but do not randomize these authored scenarios",
    "difficultyMapping":"0/1/2 map to authored scenarios in array order",
    "dt":"active positive dt must be finite and within 1e-12 of 1/60; dt=0 and terminal calls are full no-ops",
    "input":"existing x/y, a/b, aPressed/bPressed, cancelled/cancelEpoch; 0.55 axis threshold; initial quarantine and complete neutral acknowledgement before armed actions",
    "cancelRule":"cancelled or changed finite cancelEpoch suppresses inputs but still permits the actual ordinary interval; a later neutral sample clears quarantine without issuing an action",
    "transaction":"each valid active call creates one transaction, independently of whether a capture terminal allows any motion interval",
    "preview":"only current tick/active target and current geometric match facts; null when activeTargetIndex is 3; a shot always reevaluates after this transaction's navigation/B, never reuses an old preview",
    "score":"1000 + 100*remainingFilm on win, otherwise 100*creditedTargetCount; display only"
  },
  "presentation": {
    "logicalResolution":[960,540],
    "renderer":"reuse shared WebGL1 atlas and one draw submission; opaque orthogonal unions can be emitted as batched rectangles or faithful pre-baked sprites",
    "visualDirection":"warm darkroom and illuminated paper theatre, continuous paper edges and restrained material grain; no visible cell grid, pixel tiles or numeric timer-only play",
    "requiredViews":["live stage and actual exposure window","three identifiable required cutouts and front paper strip","complete current target with per-part tints/seams and fixed direction","ordered target contact sheet","remaining film and deadline","immutable last photograph with its original result and target"],
    "photoRule":"last photograph uses detached geometry from the actual capture receipt, never the next live frame",
    "outsideAperture":"a separate clearly labelled full-stage navigation preview may show the scene beyond the window; it is not the exposure image. The actual board and the foreground paper strip remain opaque in the exposure view and saved photograph, with no ghosted hidden parts",
    "blueprint":"all target masks, component identities, frame modes and direction are visible before play and in the host pause view"
  },
  "authorizationBoundary":"Static design only; no production code, executable design simulation, Model import, test, browser run, solver or automatic search is authorized by these files."
}
```

