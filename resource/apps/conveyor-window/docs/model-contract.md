# Conveyor Window — public model contract

Reviewed public rules and observable interface. Geometry, input ordering, ownership and terminal priority are canonical below. Validation evidence is recorded separately.

```json
{
  "schemaVersion": 1,
  "designStatus": "reviewed-public-rules",
  "identity": {"gameId":34,"name":"窗口装配","englishName":"Conveyor Window","slug":"conveyor-window","packageId":"com.ecojust.conveyorwindowtv","versionName":"0.1.0","versionCode":1,"seed":734,"actionCount":2,"assignmentSha256":"a5bb4b25c666c96c558e8ad9d08e901deb42b8b12ce4eff22be8bfe43cd0ecd7"},
  "premise": "Use a magnetic gripper to take shaped components from an upper conveyor and seat them in matching sockets on a different-speed lower conveyor. The divider's timed shutter must be open when a held component is sent through it. Rotate the component to the visible socket orientation. Build the required unbroken streak before three mistakes or the deadline.",
  "geometry": {
    "unitsPerCell":60,"ticksPerSecond":60,"trackLengthUnits":720,"sourceY":90,"heldY":150,"targetY":270,"barrierYRange":[198,222],
    "partSizeUnits":36,"partHalfSizeUnits":18,"gripperXRange":[36,684],"initialGripperX":360,
    "gripperSpeedUnitsPerTick":4,"pickupRadiusUnits":60,"placementRadiusUnits":60,
    "origin":"x increases right; y increases down; both conveyor centers occupy x in [0,720)",
    "distanceRule":"ordinary absolute x distance, never wrap-around distance; equality at a pickup/placement limit is accepted",
    "windowFit":"the held component's full square footprint [gripperX-18,gripperX+18] must be contained in the scenario windowXRange; equality is accepted",
    "transfer":"An admitted held A is an instantaneous vertical dispatch at the current gripper x through the shutter. Below the divider, a magnetic seat snaps the part to a socket within placementRadiusUnits. This is an explicit atomic interaction, not a simulated flight. The socket itself need not be directly inside the divider opening; the displayed magnetic reach bracket explains the snap.",
    "nearest":"choose the minimum absolute-x-distance object, then lexicographically smallest carrier/slot ID for an exact tie; never ignore an occupied or wrong-type nearer slot to select a farther one",
    "rotation":"quarter turns 0,1,2,3, clockwise in screen coordinates; 0 is the published profile orientation. Types use asymmetric silhouettes plus a keyed corner mark, so all four orientations are visibly distinct."
  },
  "partTypes": [
    {"id":"elbow","name":"直角件","tone":"copper","profile":[[-14,-14],[14,-14],[14,-4],[-4,-4],[-4,14],[-14,14]]},
    {"id":"arrow","name":"箭头件","tone":"teal","profile":[[-14,-6],[2,-6],[2,-14],[14,0],[2,14],[2,6],[-14,6]]},
    {"id":"fork","name":"叉形件","tone":"violet","profile":[[-14,-14],[14,-14],[14,-4],[0,-4],[0,4],[8,4],[8,14],[-14,14]]},
    {"id":"hook","name":"钩形件","tone":"gold","profile":[[-14,-14],[0,-14],[0,4],[6,4],[6,-4],[14,-4],[14,14],[-14,14]]}
  ],
  "motion": {
    "phase":"conveyor x is mod(initialX+velocityUnitsPerTick*tick,720), with nonnegative modulo",
    "wrapping":"on each actual one-tick interval, compute rawX=currentX+velocity; wrap when rawX>=720 or rawX<0, not merely when rawX==0. Set x=mod(rawX,720) and increment that carrier/slot generation exactly once. All authored speed magnitudes are below720.",
    "sourceWrap":"If a source carrier still contains its current part, retire that unpicked part at the exit. Then increment generation and create exactly one new part with the carrier's authored type and initial orientation. If its old part was held, seated, completed or damaged, do not change that old part; the replacement has a new ID.",
    "targetWrap":"If a target slot is occupied, move that part to completed storage and clear the slot, without changing score or streak. Increment slot generation; the same visible slot returns empty with the same type/orientation. An empty slot also increments generation.",
    "ownershipOrder":"Input B/A changes ownership first. Then compute every carrier/slot's new position and wrap facts. Apply source retire/refill and target completed/clear on their own wrap facts. Finally update the gripper x and the positions of source/held/seated parts from their current unique owner. A part held before its source wraps is never retired by that wrap. A newly seated part may legitimately complete at a target exit in this same interval.",
    "partCoordinates":"source parts follow their source carrier at sourceY; the one held part follows only gripperX at heldY; seated parts follow only their target slot at targetY. Completed/retired parts keep their exit coordinate x=720 for positive direction or x=0 for negative direction; damaged parts keep the actual dispatch origin at heldY. Nonactive history is not rendered on the belts."
  },
  "gate": {
    "phase":"phaseTick=mod(tick+scenario.gate.phaseOffsetTicks,scenario.gate.periodTicks)",
    "open":"openFromPhaseTick <= phaseTick < openUntilPhaseTick",
    "singleBoundary":"create, input eligibility, held-A collision, HUD and rendering all consume the same gate value for the same model.tick. One A receipt records that exact boundary value. After a real interval, recompute gate at the new tick for the new state. No check uses next tick's gate to judge a current action.",
    "physicalScope":"Only an explicit held-A dispatch crosses the divider. Ordinary horizontal carrying above it never collides with the closed shutter; opening or closing alone cannot crush a waiting part."
  },
  "controls": {
    "horizontal":"raw x is clamped to[-1,1]; x>=0.55 requests right velocity4, x<=-0.55 requests left velocity-4, otherwise zero. Movement is continuous per fixed tick and clamped to gripperXRange. y is retained for input observability and neutral acknowledgement but does not move the one-axis gripper.",
    "a":{"label":"抓取 / 投送","empty":"take the nearest occupied source carrier only if distance<=60; otherwise record an empty-grab miss without a fault","held":"dispatch the currently held part once; successful seating increments streak, a rejected dispatch damages the part and resets streak"},
    "b":{"label":"旋转90°","meaning":"rotate the held part clockwise once, modulo4; empty-handed B does nothing"},
    "sameBoundaryOrder":"normalize input and apply cancellation/neutral quarantine; fresh B; fresh A; then advance both belts and the gripper exactly one actual tick; then apply terminal priority",
    "sameFresh":"Held B+A rotates first and dispatches the changed orientation. Empty-handed B+A cannot rotate the part that A is about to pick up. Horizontal input affects only the following interval: pickup, gate, fit, slot and orientation are all judged at the original gripper x and original tick.",
    "edges":"effectiveA=rawA OR rawAPressed and effectiveB=rawB OR rawBPressed, with independent armed latches. One held press acts once; false effective input rearms the corresponding latch only outside quarantine.",
    "cancellation":"Initially quarantined with both latches disarmed. cancelled=true or a changed finite cancelEpoch suppresses B/A and horizontal velocity for the entire call; it does not pause belt motion. A later noncancelled complete neutral sample clears quarantine, rearms both latches, and still issues no action or movement. Complete neutral means both normalized axes below threshold and all raw held/pressed A/B fields false. A cancelled synthetic neutral never rearms.",
    "pause":"host pause stops Model.step and freezes every model field; resume uses existing cancel/neutral handling, with no wall-clock catch-up"
  },
  "dispatch": {
    "qualificationOrder":["shutter_closed","outside_window","no_slot_in_reach","occupied_slot","wrong_type","wrong_orientation","seated"],
    "shutter_closed":"gate.open is false",
    "outside_window":"the held footprint does not fit windowXRange",
    "no_slot_in_reach":"the nearest lower slot is farther than60 units",
    "occupied_slot":"that nearest in-reach slot has an occupant; never overwrite it",
    "wrong_type":"the held type differs from that slot's requiredType",
    "wrong_orientation":"types match but quarter turns differ from requiredQuarterTurns",
    "seated":"place exactly that held part into exactly that empty slot generation; clear heldPartId; increment totalCorrect and streak once",
    "fault":"Any of the six rejected dispatch reasons damages exactly the held part, clears heldPartId, increments faults once and resets streak to0. Wrong orientation, a missed socket and an occupied socket are assembly mistakes. Empty grabs and empty B are harmless. No silent part return or destruction is permitted."
  },
  "roundRules": {
    "goal":"streak>=scenario.requiredStreak; only consecutive correct dispatches count. Any damaged dispatch resets the streak, while totalCorrect and previously completed parts remain factual history.",
    "faultLimit":3,
    "deadline":"tick reaches scenario.deadlineTick after the real interval; no later action is admitted",
    "terminalPriority":"After B/A and one complete actual interval: required streak wins; otherwise faults>=3 loses with fault_limit; otherwise deadline loses with deadline. A final correct dispatch at deadlineTick-1 wins at deadlineTick. An action at or after deadlineTick is impossible in an active ordinary state.",
    "lastStep":"Every valid positive active call advances tick by exactly1, even if its starting action earns the win or reaches the fault limit. No input-only transaction counter or zero-interval terminal is needed. Action receipts use boundaryTick=t, state ends at tick=t+1, and lastStep records that actual interval.",
    "score":"100*totalCorrect while active/lost; on win 1000+100*requiredStreak+100*(3-faults). Score never changes collision or matching.",
    "retry":"create the same scenario and seed at tick0: restore all initial belt coordinates, source parts, empty target slots, gripperx360, no held part, streak/faults/totalCorrect0, empty receipts, initial gate and quarantine"
  },
  "scenarios": [
    {"id":"copper-starter","name":"铜件初装","sourceVelocity":2,"targetVelocity":1,"windowXRange":[240,480],"requiredStreak":6,"deadlineTick":5040,
      "gate":{"periodTicks":360,"phaseOffsetTicks":0,"openFromPhaseTick":120,"openUntilPhaseTick":240},
      "sourceCarriers":[{"id":"source-a","initialX":180,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":540,"type":"arrow","initialQuarterTurns":0}],
      "targetSlots":[{"id":"slot-a","initialX":180,"requiredType":"elbow","requiredQuarterTurns":1},{"id":"slot-b","initialX":540,"requiredType":"arrow","requiredQuarterTurns":3}]},
    {"id":"reverse-feed","name":"逆送三件","sourceVelocity":-2,"targetVelocity":1,"windowXRange":[420,600],"requiredStreak":6,"deadlineTick":5400,
      "gate":{"periodTicks":480,"phaseOffsetTicks":0,"openFromPhaseTick":180,"openUntilPhaseTick":300},
      "sourceCarriers":[{"id":"source-a","initialX":630,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":150,"type":"arrow","initialQuarterTurns":1},{"id":"source-c","initialX":390,"type":"fork","initialQuarterTurns":3}],
      "targetSlots":[{"id":"slot-a","initialX":270,"requiredType":"elbow","requiredQuarterTurns":2},{"id":"slot-b","initialX":510,"requiredType":"arrow","requiredQuarterTurns":3},{"id":"slot-c","initialX":30,"requiredType":"fork","requiredQuarterTurns":0}]},
    {"id":"counterflow-keys","name":"对流精装","sourceVelocity":2,"targetVelocity":-1,"windowXRange":[120,264],"requiredStreak":5,"deadlineTick":5400,
      "gate":{"periodTicks":540,"phaseOffsetTicks":0,"openFromPhaseTick":120,"openUntilPhaseTick":240},
      "sourceCarriers":[{"id":"source-a","initialX":192,"type":"elbow","initialQuarterTurns":0},{"id":"source-b","initialX":372,"type":"arrow","initialQuarterTurns":0},{"id":"source-c","initialX":552,"type":"fork","initialQuarterTurns":1},{"id":"source-d","initialX":12,"type":"hook","initialQuarterTurns":2}],
      "targetSlots":[{"id":"slot-a","initialX":372,"requiredType":"elbow","requiredQuarterTurns":3},{"id":"slot-b","initialX":552,"requiredType":"arrow","requiredQuarterTurns":1},{"id":"slot-c","initialX":12,"requiredType":"fork","requiredQuarterTurns":2},{"id":"slot-d","initialX":192,"requiredType":"hook","requiredQuarterTurns":0}]}
  ],
  "sharedRuntime": {
    "exports":["create(seed=734,difficulty=0)","step(state,dt,input)"],
    "createInputDomain":"nonnegative safe-integer seed; difficulty exactly integer0,1,2; omitted/undefined uses defaults; invalid values throw RangeError. Valid seeds are recorded but do not randomize authored scenarios.",
    "dt":"dt=0 and terminal calls are complete no-ops; active positive dt must be finite and within1e-12 of1/60, otherwise throw before mutation",
    "inputDomain":"missing/nonfinite x/y become0; finite axes clamp to[-1,1]; only literal true button/cancel flags count. Finite cancelEpoch is tracked, other epoch values are ignored. The first observed finite epoch is stored and counts as changed relative to null.",
    "selectionPreview":"only current-boundary nearest source/slot IDs, distances, current gate, window fit and held/required type/orientation. Do not publish future opening actions, a route or a recommended input. A always recomputes after this call's B rather than trusting the old preview.",
    "ownedState":"the model publishes current positions and exclusive owners plus detached action and wrap/output receipts. The renderer observes these facts; it does not independently choose gate state, advance belts or move a held part with its old carrier."
  },
  "presentation": {
    "logicalResolution":[960,540],"renderer":"one shared WebGL1 atlas and one draw submission, static baked material/shape sprites, no per-frame texture uploads",
    "visualDirection":"bright enamel-blue assembly bench, brushed metal rails, copper/teal/violet/gold keyed components; smooth continuous vector profiles and bevels, no pixel grid",
    "requiredViews":["two visibly moving conveyors with direction/speed labels","upper source components and lower empty/occupied keyed sockets","one visible held component at the gripper, never duplicated on its source carrier","physical shutter and its actual open/closed state","magnetic pickup/seating reach bracket","actual current streak, required streak, total correct, faults and deadline","last action result and recent completed output strip"],
    "blueprint":"menu and pause show upper/lower belt directions, actual keyed type/orientation pairs, window width, two-second open duration and cycle duration, required consecutive count and three-error limit",
    "instructions":["左右移动磁力夹具；A抓取，再按A穿窗投送。","B将手中零件顺时针旋转90°，让形状与缺口朝向匹配下带槽位。","只在闸窗打开、夹具完整位于窗口且下方槽位进入吸附范围时投送。投错会损坏零件并清零连装。","槽位到出口后会清空返回；抓起的零件只跟随夹具。连续完成目标数量即可过关。"]
  },
  "authorizationBoundary":"Reviewed public rules. Implementation and validation results are tracked separately; this contract is not evidence of executed tests or gameplay."
}
```

## Observable interface

Static game 34. Keep `PureModel.create(seed=734,difficulty=0)` and `step(state,dt,input)`. No shared runtime change or extra lifecycle API. Every active positive call advances exactly one physical tick after its start-boundary actions. No separate transaction counter.

## Current public state

Framework fields: `width=960,height=540,seed,difficulty,level=1..3,levelName,scenarioId,phase,tick,elapsed=tick/60,score,lostReason,message`. `phase` is playing/won/lost. `lostReason` is null/fault_limit/deadline. `terminal` is null or `{reason,actionBoundaryTick,endedTick}` where reason is required_streak/fault_limit/deadline. For deadline without a deciding action, actionBoundaryTick is null; action-earned win/fault terminal records its action's t, and endedTick is t+1.

Also publish `schemaVersion`, frozen copies of `identity`, selected `scenario`, `physics:{geometry,motion,gate,dispatch,roundRules}`, and `partTypes`. `deadlineTick`, `requiredStreak`, `faultLimit=3`, `streak`, `totalCorrect`, `faults` are explicit. At create these counters are zero. Keep `gripper:{x,y:heldY,heldPartId}`. `gate:{tick,phaseTick,open,windowXRange}` is the one canonical current gate fact used by UI and model.

`sourceCarriers` array, in authored order, contains `{id,x,y:sourceY,generation,type,initialQuarterTurns,partId}`. Initial generation is 0. `partId` is null after grabbing, until that carrier wraps. `targetSlots` contains `{id,x,y:targetY,generation,requiredType,requiredQuarterTurns,occupantPartId}`. Initial generation is 0 and occupants are null.

The permanent `parts` array contains every actual part instance created so far, in creation order. Each is `{id,sourceCarrierId,birthGeneration,type,quarterTurns,owner,ownerId,ownerGeneration,x,y,createdTick,endedTick,endReason}`. ID is `<sourceCarrierId>@<birthGeneration>`. `owner` is source/held/slot/completed/retired/damaged. For source and slot, ownerId and ownerGeneration identify the exact current carrier/slot generation; held uses ownerId='gripper',ownerGeneration=null; completed/retired/damaged use null ownerId/ownerGeneration. endedTick/endReason are null for source/held/slot. Completed uses target_exit, retired uses source_exit, damaged uses the actual rejected dispatch reason. A held piece keeps its original sourceCarrierId/birthGeneration even when the original source carrier has wrapped and created a new part. Active x/y come exclusively from the current owner; exit/damage history keeps the actual terminal coordinate.

Initial parts have createdTick=0. A source-wrap replacement is created at the interval end t+1. Damaged parts have endedTick equal to the dispatch action boundary t; retired and completed parts have endedTick equal to their wrap boundary t+1. These event times are not silently normalized to the later snapshot tick.

There is at most one held part, one part in each source carrier, and one part in each target slot. Each part has exactly one owner class. The part registry is never pruned during a round, so source/held/slot/completed/retired/damaged counts always sum to all parts created. Streak and totalCorrect change at successful seating, not again at the target exit.

`preview` contains only current-boundary facts: `{tick,gripperX,heldPartId,gateOpen,windowFits,nearestSource,nearestSlot}`. A nearest entry is null only if no relevant object exists; otherwise it is `{id,generation,x,distance,inReach,partId}` for the nearest occupied source, or `{id,generation,x,distance,inReach,occupantPartId,requiredType,requiredQuarterTurns}` for the nearest slot including occupied slots. This is selection feedback, not a future plan. Do not add a future intercept/phase target or recommended input. The actual A action recomputes after B.

## Input and one-tick order

`inputState:{cancelEpoch,quarantined,aArmed,bArmed}` starts `{null,true,false,false}`. `lastInput` starts null, then each valid call records `{boundaryTick,rawX,rawY,x,y,axisX,axisY,rawA,rawB,rawAPressed,rawBPressed,effectiveA,effectiveB,cancelled,rawCancelEpoch,cancelEpoch,epochChanged,quarantinedBefore,quarantinedAfter,neutralAcknowledged,freshA,freshB,velocityX}`. Nonfinite raw axes/epoch are recorded as null; normalized axes are finite clamped numbers. Axis tokens are -1/0/1 at the documented inclusive .55 threshold. Y has no movement effect but participates in complete-neutral acknowledgement. Armed-edge and cancellation semantics are the public design's exact rules.

At valid boundary t: clear transaction-local `lastAction`; normalize and gate input; apply fresh B to an already-held part; apply fresh A to the resulting ownership/orientation; compute both conveyor intervals and wrap facts; apply source retire/refill and target output/clear; move/clamp the gripper with this call's allowed velocity; put each active part at its resulting unique owner's coordinates; set tick=t+1 and elapsed; recompute the canonical gate/preview; then decide win, fault limit, deadline in that priority and compute score/message. No other action or input is processed at t+1 in this call. Terminal/dt0 calls mutate no field, including lastInput/lastAction/lastStep.

All action matching uses t's old gripper/carrier/slot x, t's gate and the orientation after B. Horizontal movement does not silently happen before a grab/drop. A final correct or third faulty dispatch still has one real conveyor/gripper interval before the frozen terminal state. A source or slot that wraps during that interval follows ownership as changed by the action first.

## Detached actual event records

Use one permanent `actionReceipts` array for fresh B and fresh A, including harmless empty B/empty-grab outcomes. IDs are strictly 1-based in actual B-then-A order. Each receipt is `{id,boundaryTick,action,partId,result,gripperX,gateAtAction,sourceAtAction,slotAtAction,partBefore,partAfter,streakBefore,streakAfter,totalCorrectBefore,totalCorrectAfter,faultsBefore,faultsAfter}`. `action` is rotate or grab_or_dispatch; result is rotated/empty_rotate/grabbed/empty_grab or one dispatch qualification result. Missing context is null. sourceAtAction/slotAtAction are complete detached carrier/slot objects immediately before that individual B or A action, not later moved or already modified objects. A successful grab therefore copies the old nonnull source partId, and a successful seating copies the old null slot occupantPartId. gateAtAction is the same current gate object for every receipt at t. partBefore/partAfter are full detached part records; partAfter means immediately after the action, before belt motion. partAfter already has coordinates consistent with its new owner: a grabbed part is at the old gripper.x/heldY, a seated part is at the old slot.x/targetY, and a damaged part remains at the old gripper.x/heldY. The subsequent actual interval may move a held/seated part again; that later coordinate never overwrites the action receipt. `lastAction` is the last receipt created in this call or null; stable feedback can read the permanent array.

For empty_rotate and empty_grab, partId, partBefore and partAfter are all null: no actual part was operated on. This also applies when the nearest occupied source is beyond pickup reach; sourceAtAction still retains that candidate carrier to explain the miss. For a successful grab, an actual rotation or any dispatch, all three fields identify and describe the one real operated part, including its immediate before/after ownership and coordinates.

For rotation, sourceAtAction and slotAtAction are null. For grabbing, sourceAtAction is the nearest occupied source even if beyond reach, or null if none; slotAtAction is null. For dispatch, sourceAtAction is null; slotAtAction is the nearest current slot even when an earlier gate/fit reason rejects the dispatch. Every rejected dispatch retains all current eligibility facts through those exact copied objects, but `result` uses the published first-failure order. No occupied slot is overwritten. A correct receipt's partAfter owner is slot and ownerGeneration equals slotAtAction.generation; the actual slot immediately receives partId and gripper immediately clears.

`wrapReceipts` is a permanent array with `{id,endedTick,belt,carrierId,fromGeneration,toGeneration,fromX,rawToX,toX,exitedPartId,newPartId}`; belt is source or target, target newPartId is null. exitedPartId is the actual unpicked source part retired, or actual occupied target part completed, otherwise null. Source newPartId is the single newly spawned replacement; held old generations do not appear as exitedPartId. Order simultaneous wraps by all source carriers in authored order then all target slots in authored order. IDs are 1-based. All actual completed/retired/damaged transitions remain visible in parts plus these or action receipts.

`lastStep` is null at create, otherwise `{fromTick,toTick,gateBefore,gateAfter,gripperBefore,gripperAfter,allowedVelocityX,sourceMotion,targetMotion,actionReceiptIds,wrapReceiptIds,countersBefore,countersAfter,terminalAfter}`. A motion entry is `{id,generationBefore,generationAfter,fromX,rawToX,toX,velocity,wrapped}`. SourceMotion/targetMotion follow authored array order. Counters contain streak,totalCorrect,faults. Every toTick equals fromTick+1; no receipt is counted by reusing old lastStep. Store the actual one-tick wrap delta even for a negative velocity departing x=0.

Every event receipt and nested copied object, and each published lastStep, must be deep-detached and immutable after publication. Mutable current parts/carriers must never alias receipt copies. Renderer must not mutate state. The existing framework snapshot remains a deep copy; no execution callback or extra audit export is needed.

## Visible rules and required boundary checks

Show the two moving lanes, current direction and different speed, full physical gate opening, actual gripper footprint/reach, keyed component and socket orientation, exact occupied/empty slots, streak/total/faults/time and meaningful result feedback. A grabbed part appears only at the gripper; once seated only at the destination slot; exited inventory is represented in an output/history panel rather than reappearing on a belt. Menu and pause show the type/orientation blueprint and shutter rhythm. Use smooth vector profiles in a baked atlas and one draw; DOM handles Chinese text.

Later authorized checks must include both open endpoints, current-tick versus next-tick gate disagreement, held source crossing its wrap without changing held position/ownership, grabbing just before source wrap, placing just before target wrap, negative-direction wrap at x=0, nearest occupied slot not skipped, orientation mismatch and B+A rotated match, empty B+A not rotating the newly grabbed part, all six dispatch fault reasons and streak reset, source retire/refill, target completion without duplicate credit, success and fault terminal with their real final interval, final-boundary win priority, held key suppression, cancellation/real neutral, retry and paused whole-state freeze. These are obligations, not permission to execute the draft.
