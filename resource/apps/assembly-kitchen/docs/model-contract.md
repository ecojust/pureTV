# 装配厨房 / Assembly Kitchen — model contract

This is the authoritative public rules and state contract for game25. The authored parameters were checked once by a separate bounded design simulator; that feasibility result is not production or browser evidence. No private author route is part of this contract.

## Layout and interaction

Three shared stations run concurrently: `cook` 煮锅, `cool` 冷却台, `pack` 装盒机. Each station holds at most one food attempt, including its completed-but-uncollected state. There are three order cards, O1/O2/O3; each has its own tray. A tray is storage, not a fourth processing station. At most one item exists per order. An item is drawn exactly once, at its committed station or tray; no invented transit state.

Left/right selects an order card, initially O1, clamped without wrapping. Up/down has no movement effect. A executes the selected order's next context action in the table below. B switches the single cooler between FAST 快风 and SLOW 慢风, initially FAST. B does not undo, pause, refund or dispose of food. The fan setting persists between orders. The usual separate P/menu pause freezes the complete simulation, timers and food temperatures. R starts a wholly fresh round.

Input is 60 Hz with fresh A/B edges; B takes precedence over A/navigation on its tick. Navigation uses a 0.25 deadzone, horizontal direction, immediate first step, then repeat after 20 ticks and every 10 ticks. Neutral horizontal input resets the repeat tracker even when B takes precedence. Selection never changes automatically on delivery/error. Held A/B cannot repeatedly act after completion or reset; a new released-then-pressed edge is required.

| Food phase | Actual location | A action |
|---|---|---|
| raw | tray | Start cooking if cook station is free |
| cooking | cook | Blocked: not ready |
| cooked | cook | Collect to its own tray, release cook station |
| cooked | tray | Start cooling if cool station is free |
| cooling | cool | Blocked until the two-second minimum cooling process completes |
| cooled | cool | Collect to its own tray, release cool station |
| cooled | tray | Start packing if pack station is free |
| packing | pack | Blocked: not ready |
| packed | pack | Attempt delivery and release pack station |
| delivered | delivered | Blocked: already delivered |

Thus a successful order normally needs six A actions: start cook, collect cook, start cool, collect cool, start pack, deliver. A completed item does not jump to the next station. Cook/cool collections themselves consume no simulated duration beyond the input tick; subsequent start needs another fresh edge. There is no A operation that skips a prerequisite. Busy/not-ready/already-delivered actions create a blocked receipt only, without strikes, command-count increment, progress or inventory changes. Time nevertheless continues.

## Integer temperature and simultaneous work

`temperatureQ` is an integer in units of 1/240 degree Celsius; display `temperatureQ / 240`. Ambient temperature is exactly 20 C = 4800 Q. Every completed tick is 1/60 s. Rates below are signed integer Q per tick, with cooling clamped at ambient:

| State after this tick's input | Temperature delta per tick |
|---|---:|
| raw | 0, remains ambient |
| cooking | +20 Q (5 C/s) |
| cooked, whether waiting in cook or on tray | -2 Q (0.5 C/s) |
| cooling or cooled while still in cool, SLOW | -2 Q (0.5 C/s) |
| cooling or cooled while still in cool, FAST | -12 Q (3 C/s) |
| cooled on its tray | -2 Q (0.5 C/s) |
| packing or packed waiting in pack | -1 Q (0.25 C/s) |
| delivered | frozen recorded delivery temperature |

Cook, minimum-cool and pack progress independently in the same tick. Cooking lasts the order's fixed duration; its final heating interval is included. Starting at 20 C, 10/12/14 seconds therefore finishes at exactly 70/80/90 C. After cooking completes, the heater stops: a cooked item still occupying cook loses 0.5 C/s. There is no automatic temperature restoration.

Cooling has a two-second minimum process. Once complete the item is `cooled`, but occupies cool and continues cooling at the current fan rate until collected. Readiness is a prerequisite completion flag, not an assertion that the delivery temperature is correct. B changes this ongoing rate immediately for the next completed interval. Packing lasts the recipe duration; completed `packed` food still occupies pack and loses 0.25 C/s until delivery or expiry.

`holdingAgeTicks` starts at zero on the tick cooking completes. Every following interval increments it once until delivery or disposal, including completed occupied stations, trays and active downstream work. It is not reset by cooling, packing, collection, changing fan or pause/resume. `expiresAtTick = cookedAtTick + holdTicks`. Raw/cooking food has no holding deadline yet. Time in an indefinitely blocked raw/cooking queue is still constrained by closing time.

## Delivery, rework and terminal conditions

Each level publishes one delivery order list. `nextOrderId` is its first not-yet-successfully-delivered entry, not the selected card. Only A on a packed item attempts delivery. Its current temperature, before this tick's thermal interval, must be within that recipe's inclusive delivery band, and its order ID must equal `nextOrderId`. Neither packing start nor pack completion accepts/rejects temperature or order. The UI calls the band DELIVERY, not a cooling-ready band.

Correct delivery records actual temperature/tick/attempt, marks that order delivered and frees pack. Incorrect order or temperature disposes of this one food attempt, records a strike and frees pack; the same order returns to raw on its tray at ambient and can be cooked again. If both are wrong, one disposal/strike is recorded with both issue flags, primary reason `wrong-order` before `wrong-temperature`. All earlier successful deliveries remain successful.

Delivery and incorrect-delivery receipts preserve the pre-interval holding age and temperature used by the input. In an uninterrupted cooked attempt, a delivery at `deliveredTick` therefore freezes `holdingAgeTicks = deliveredTick - 1 - cookedAtTick`; do not substitute a post-interval age. Expiry receipts instead use the just-advanced age at their interval's end. Completed delivery does not receive another thermal or age update that tick.

Expiry similarly disposes of the affected attempt and frees its current station atomically, if any. A partially completed task is cancelled; it must not increment completion or collection counts. Already completed station work retains its historical completion count but expiry is not a collection. The order returns to raw with `attempt` incremented; initial attempt is 1. Replacement raw ingredients are unlimited, bounded by strikes and closing time. Each disposal increments exactly one `discardedAttempts` and one strike. `strikeLimit=2` in every level; all same-tick disposals are still recorded, so the actual strike counter may exceed 2 and must not be clamped. Rejected impossible A actions do not count as disposal or strike.

For each completed interval `[oldTick,newTick]`, where `newTick=oldTick+1`:

1. Apply fresh inputs at newTick against the previous committed state. A correct delivery at its exact expiry/closing tick is allowed here. New starts participate in this interval; collection transfers the item before this interval's temperature rule. B consumes A/navigation and changes the cooler rate before the interval.
2. Advance all three station tasks and every undelivered food's temperature from that post-input state. Increment holding ages only for food already cooked at interval start; newly finished cooking starts age zero. Accumulate actual per-order thermal deltas.
3. Commit all station completions together. A task finishing now stays ready/occupied until a future input tick; it cannot be collected in the same tick because input already happened. Completion increments its stage counter once only.
4. Process all still-present cooked items whose `newTick >= expiresAtTick`, in stable O1/O2/O3 order. Record all expiry/disposal facts for this interval before terminal resolution; do not stop midway when the strike limit is reached. An item delivered in step 1 is no longer present and cannot also expire.
5. Resolve terminal priority: strikes >= 2 => lost `mistakes`; otherwise all three delivered => won; otherwise newTick >= closeTick => lost `closing`; else playing. A final valid delivery on closeTick wins. Incorrect delivery on closeTick still produces its actual strike before closing resolution.

Win score = `1000 + 2 * floor((closeTick-tick)/60) + 50 * (2-strikes)`; other phases score zero. Terminal states are entirely frozen. No artificial minimum-win delay: the three non-overlapping cooking jobs alone require at least 30/36/36 seconds, before the last downstream processes.

## Authored levels

All levels use the same three stations, 2-second minimum cooling, rates, input semantics and two-strike limit. All orders and raw ingredients are visible from tick zero. Cook/pack/hold seconds below are exact integer multiples of 60 ticks. Temperature bands are inclusive integer Celsius endpoints multiplied by 240. No hidden arrival, random recipe or unlisted station capacity.

| Level | Name / nameEn | Close seconds | Required delivery IDs |
|---|---|---:|---|
| 1 | 午间三味 / Lunch Trio | 75 | O1, O2, O3 |
| 2 | 热餐先行 / Hot Plate First | 80 | O2, O1, O3 |
| 3 | 晚间流水 / Evening Service | 85 | O3, O1, O2 |

| Level | ID | recipeId / Chinese / nameEn | Cook s | Pack s | Delivery C | Hold s |
|---|---|---|---:|---:|---|---:|
| 1 | O1 | custard / 蒸蛋 / STEAMED EGG | 10 | 4 | 64..68 | 20 |
| 1 | O2 | tomato-soup / 番茄汤 / TOMATO SOUP | 10 | 4 | 52..58 | 24 |
| 1 | O3 | compote / 温果羹 / FRUIT COMPOTE | 10 | 4 | 40..46 | 26 |
| 2 | O1 | pumpkin-soup / 南瓜汤 / PUMPKIN SOUP | 12 | 5 | 56..62 | 24 |
| 2 | O2 | custard / 蒸蛋 / STEAMED EGG | 10 | 4 | 64..68 | 18 |
| 2 | O3 | stew / 炖菜 / VEGETABLE STEW | 14 | 5 | 64..70 | 25 |
| 3 | O1 | stew / 炖菜 / VEGETABLE STEW | 14 | 6 | 58..64 | 25 |
| 3 | O2 | bean-soup / 豆汤 / BEAN SOUP | 12 | 5 | 48..54 | 26 |
| 3 | O3 | custard / 蒸蛋 / STEAMED EGG | 10 | 4 | 64..68 | 18 |

The hot custard's high delivery band is intended to make slow cooling useful for precise control; cooler dishes give fast cooling a different scheduling role. These are design intentions, not claims that either mode is necessary in every level or that a constant mode is impossible. Own trays allow cook, cool and packing schedules to differ from delivery sequence and let multiple stations work at once. Queuing completed food consumes both station capacity and its finite holding budget. Overcooled food can still be packed and delivered for an explicit strike/rework, or expire naturally; it is never trapped behind a hidden temperature gate.

## API and tick boundary

Export `create(seed, difficulty)`, `step(state, dt, input)` and `TICK_HZ = 60` through the existing CommonJS/browser wrapper. `create` returns fresh, detached state, with difficulty clamped to integer 0..2, level 1..3, model phase `playing`, tick zero and O1 selected. The shared runtime owns menu, pause, retry, best score and sound; a paused runtime does not call `step`. `step` returns the same state object. Once model phase is terminal, it returns before changing any field, including events and internal accumulators.

Input fields remain `x`, `y`, `a`, `b`, `aPressed`, `bPressed`, `cancelled`, `cancelEpoch`. Finite `dt` is clamped to 0..0.25; non-finite dt contributes zero. Fractional time accumulates into 1/60-second fixed intervals. A/B rising edges latch until a completed interval; cancellation clears pending edges and navigation repeat state. Held actions require neutral release before another action. Horizontal x alone controls selection, with the public deadzone/repeat timing; y has no effect. B consumes A and navigation on that tick, while neutral x still resets the navigation tracker. Otherwise selection precedes A on the same input tick.

Every completed interval is named by `tick = oldTick + 1`. Inputs act against the previous committed state, then the interval advances. Input receipts therefore must **not** pretend their immediate `after` object is the final post-interval state. The complete public ordering remains input, simultaneous temperature/work, simultaneous completions, all expiries in O1/O2/O3 order, then terminal priority.

## Top-level fields

- Identity: `width:960`, `height:540`, `seed`, `difficulty`, `level`, `levelName`, `levelNameEn`.
- Clock/outcome: `tick`, `elapsed:tick/60`, `timeLimit:closeTick/60`, `closeTick`, `remaining:max(0,(closeTick-tick)/60)`, `phase`, `score`, `lostReason:null|'mistakes'|'closing'`, `failure:null|{reason,tick,strikes,undeliveredOrderIds}`, `message`.
- Controls: `selectedOrderId`, `fanMode:'fast'|'slow'`, `fanRateQ:-12|-2`. This is the configured cooler rate; it is not a claim of actual heat loss when the cooler is empty or clamped at ambient.
- Immutable rules: `physics:{tickHz:60,temperatureScale:240,ambientQ:4800,cookRateQ:20,passiveRateQ:-2,packRateQ:-1,fastCoolRateQ:-12,slowCoolRateQ:-2,minCoolTicks:120}`, `strikeLimit:2`, `deliveryOrder:[...]`.
- Progress: `nextOrderId` (null after all delivery), `deliveredCount`, `strikes`, `discardedAttempts`, `fanChangeCount`.
- Public entities: `orders` is an array in stable O1/O2/O3 order. `stations` is an object keyed by `cook`, `cool`, `pack` in that insertion order; each value is its `{id,task}` station record. It is not an array.
- Task ledger: `taskCount`, `taskStats`, `taskStartReceipts`, `completionReceipts`, `collectionReceipts`, `disposalReceipts`, `deliveryReceipts`, plus the derived `inventory` and `thermalLedger` below.
- Input/event ledger: `commandCount`, `lastOperation`, `actionReceipts`, `blockedCommands`, `lastRejected`, `eventCount`, `events`, `lastEvent`, `lastInterval`.

Only simulation bookkeeping is underscore-prefixed: time accumulator, last held A/B, pending edges, held horizontal direction, next repeat tick and cancel epoch. Gameplay facts and authored parameters are public. Renderer and pilot need no underscore field.

## Order and station records

Each order contains immutable `id`, `recipeId`, `name`, `nameEn`, `cookTicks`, `packTicks`, `holdTicks`, `deliveryMinQ`, `deliveryMaxQ`, and current-attempt fields:

`attempt`, `phase`, `location`, `temperatureQ`, `heatingAddedQ`, `coolingRemovedQ`, `cookedAtTick`, `holdingAgeTicks`, `expiresAtTick`, `taskId`, `delivery`.

The phase/location combinations are exactly those in the public design. `taskId` is non-null exactly when location is cook, cool or pack, and identifies that station's current task. Raw starts at ambient with zero thermal counters, null cooking/deadline/task fields and age zero. Cooking also has no cooked deadline until its completion. A successfully delivered order keeps its attempt, temperature, thermal counters and cooking/deadline/age history frozen; its taskId becomes null and `delivery` is a detached copy of its accepted delivery receipt. Other orders have `delivery:null`.

The per-attempt identity is always `(orderId,attempt)`. Disposal increments this order's attempt exactly once and immediately installs a new raw item; the prior attempt survives only in its receipts. An order has exactly one current attempt, including a completed delivery record; it cannot simultaneously have an independent item on its tray and in a station.

Each station is `{id,task:null|Task}`. A non-null Task contains `id`, `stage` (equal to station id), `orderId`, `attempt`, `startedTick`, `durationTicks`, `progressTicks`, `completedAtTick:null|integer`, `ready:boolean`. It stays in the station after completion. A start sets progress zero during input; the same interval advances it to one. Completion occurs at `startedTick+durationTicks-1`. Once ready, progress stays exactly duration and completion timestamp never changes. Collection, delivery or disposal clears the station task atomically with the order location/taskId change. There is no interpolated transit or hidden slot.

For active, already cooked food, post-interval `holdingAgeTicks = tick-cookedAtTick`. Newly completed cooking sets age zero at that tick. Delivery uses and freezes the **pre-interval** age, so an uninterrupted delivered attempt has `holdingAgeTicks = delivery.tick-1-cookedAtTick`; do not apply the active formula to it. Expiry uses its just-advanced age before resetting the order. Every receipt states whether its snapshot belongs to the input boundary or interval end.

## Counters and permanent receipts

`taskStats` is keyed by cook/cool/pack; each value has integer `started`, `completed`, `collected`, `cancelled`, `discardedReady` counters. The meanings are deliberately separate:

| Event | started | completed | collected | cancelled | discardedReady |
|---|---:|---:|---:|---:|---:|
| Start a stage | +1 | 0 | 0 | 0 | 0 |
| Stage first reaches duration | 0 | +1 | 0 | 0 | 0 |
| A collects cooked/cooled item | 0 | 0 | +1 | 0 | 0 |
| A correctly delivers ready packed item | 0 | 0 | +1 for pack | 0 | 0 |
| A incorrectly delivers ready packed item | 0 | 0 | 0 | 0 | +1 for pack |
| Expiry while a task is still working | 0 | 0 | 0 | +1 | 0 |
| Expiry while a task is ready | 0 | 0 | 0 | 0 | +1 |
| Expiry on own tray | 0 | 0 | 0 | 0 | 0 |

Thus `collected` means a successful normal departure of completed station work; pack's successful normal departure is delivery, not a tray collection. An incorrect delivery is a disposal, never a collection. A task that completes and then expires in the same interval increments both completed and discardedReady, never cancelled. Historical earlier stage completions/collections remain counted if that food later expires downstream.

For each stage at every committed state:

`started = completed + cancelled + numberOfWorkingTasksAtThatStation`

`completed = collected + discardedReady + numberOfReadyTasksAtThatStation`

The live-task numbers are each 0 or 1. `taskCount` equals the sum of stage started counts. Task IDs are unique, monotonic positive integers, independent from input command IDs and event IDs.

Permanent receipt arrays contain detached facts, never live references:

- `taskStartReceipts`: `{taskId,stage,orderId,attempt,tick,at,durationTicks,commandId}`. The input start's immediate progress is zero; these are not completion facts.
- `completionReceipts`: `{id,taskId,stage,orderId,attempt,tick,at,startedTick,durationTicks,temperatureQ,holdingAgeTicks}`. `id` is its own one-based array sequence; temperature/age are after that interval's temperature/work and completion commit.
- `collectionReceipts`: `{id,taskId,stage,orderId,attempt,tick,at,commandId,kind:'collect'|'deliver',temperatureQ,holdingAgeTicks}`. They are input-boundary facts. Kind deliver is only an accepted correct pack delivery.
- `deliveryReceipts`: `{id,commandId,taskId,orderId,attempt,tick,at,expectedOrderId,temperatureQ,holdingAgeTicks,deliveryMinQ,deliveryMaxQ,issues:{wrongOrder,wrongTemperature},accepted,disposalId,nextOrderIdAfter}`. All actual packed-delivery attempts appear here, including errors. A wrong-order+wrong-temperature attempt has both flags but exactly one disposal. Correct delivery has disposalId null. Its temperature and age are pre-interval values.
- `disposalReceipts`: `{id,orderId,attempt,replacementAttempt,tick,at,boundary:'input'|'interval-end',reason:'wrong-order'|'wrong-temperature'|'expired',issues,commandId,before,stationTask,cancelledTaskId,discardedReadyTaskId,strikesBefore,strikesAfter,after}`. `before` is the actual current attempt snapshot at that boundary; `after` is the replacement raw snapshot. `stationTask` is its actual occupied task or null. Exactly one of cancelledTaskId/discardedReadyTaskId can be non-null; both are null for a tray item. commandId is null for expiry. Reasons follow the approved wrong-order-before-wrong-temperature priority. An expiry's issues has `expired:true`, no invented delivery assessment.

Receipt id sequences belong to their named arrays; they must not be mistaken for event IDs. All task identities survive through their receipts. `discardedAttempts = strikes = disposalReceipts.length`; the value is **not** clamped at strikeLimit, because multiple expiries are recorded before terminal resolution. `deliveredCount` equals the number of accepted delivery receipts and delivered order records, never the total delivery-attempt count.

## Inventory and thermal identities

`inventory = {initialAttempts:3,issuedAttempts,liveAttempts,deliveredAttempts,discardedAttempts,byOrder,error}`. Here live excludes successfully delivered orders, but includes replacement raw items even if this interval ended the round. Each byOrder row is `{orderId,issued:order.attempt,live:0|1,delivered:0|1,discarded:order.attempt-1}`. Consequently:

`issuedAttempts = 3 + discardedAttempts = sum(order.attempt)`

`issuedAttempts = liveAttempts + deliveredAttempts + discardedAttempts`, with `error = 0`.

Each current attempt satisfies `temperatureQ = ambientQ + heatingAddedQ - coolingRemovedQ`. Counters add actual integer deltas, so cooling clamped at ambient cannot remove more heat than present. Disposal records the old counters before the replacement resets them.

`thermalLedger = {issuedAmbientQ,heatingAddedQ,coolingRemovedQ,discardedTemperatureQ,recordedCurrentTemperatureQ,error}` is an exact arithmetic ledger, not a model of continued cooling outside the kitchen. issuedAmbientQ is issuedAttempts times ambientQ. Heating/cooling totals include current attempts plus their archived discarded attempts. discardedTemperatureQ sums disposed attempts' boundary temperatures. recordedCurrentTemperatureQ sums the three current order records, including successfully delivered food frozen at delivery. Therefore:

`issuedAmbientQ + heatingAddedQ - coolingRemovedQ = discardedTemperatureQ + recordedCurrentTemperatureQ`, with `error = 0`.

All these values are integers. The delivery record's frozen thermal quantity remains explicitly counted; it is not silently removed or warmed again. Both ledgers may be derived from current order records and the bounded disposal history rather than independently mutated counters.

## Input operations, rejection and events

Every accepted A or B increments `commandCount` once and produces a detached `lastOperation`. A has `{id,type:'action',action,orderId,attempt,taskId,tick,at,before,after,deliveryReceiptId,disposalId}`. Action is one of start-cook, collect-cook, start-cool, collect-cool, start-pack or deliver. `before/after` are `{order:OrderSnapshot,station:StationSnapshot,strikes,nextOrderId}` immediately around the input mutation. The station is the affected stage's actual station, including null/free task if applicable. A wrong packed delivery is still an accepted action command; its delivery receipt accepted flag is false. Do not conflate those meanings.

B has `{id,type:'fan',tick,at,before:{fanMode,fanRateQ},after:{fanMode,fanRateQ}}`; fanChangeCount increases once. `actionReceipts` permanently stores detached A-operation copies, while B is available through lastOperation and the event stream without an unbounded full fan-history array.

`OrderSnapshot` is the minimal dynamic current-attempt record: id, attempt, phase, location, temperatureQ, heatingAddedQ, coolingRemovedQ, cookedAtTick, holdingAgeTicks, expiresAtTick, taskId. Immutable recipe fields belong to the actual order and are not silently re-authored inside a snapshot. `StationSnapshot` is a detached `{id,task}` record as defined above.

Invalid context A increments only blockedCommands and sets `lastRejected:{id,tick,at,orderId,attempt,phase,location,stationId,reason}`. Reasons are not-ready, station-busy and already-delivered, selected according to the public context table. There is no externally supplied action or destination that can bypass prerequisites. The blocked input itself leaves progress/temperature/inventory unchanged; the interval still advances afterward. This distinction must appear in tests.

Event shape is `{id,type,tick,at,...facts}`, with a separate monotonically increasing eventCount. Each step call clears its public `events` array before processing intervals; multiple fixed intervals append in real order, with the last 256 retained if necessary. `lastEvent` persists. Selection changes emit `selection`; accepted actions emit `command` with commandId and an operation copy; blocked emits `blocked`. Input side-effect facts follow their command event: collected, delivered, or discarded. Station-completion events follow in cook/cool/pack order after simultaneous work. Expiries emit discarded in O1/O2/O3 order. Exactly one won/lost event follows terminal resolution. Future steps on a terminal state do not clear or regenerate events.

## Last interval: inspectable boundaries, not an invented replay

`lastInterval` is null at create, then replaced once per completed interval with:

`{fromTick,toTick,inputCommandId,blockedId,fanMode,orders,work,completionReceiptIds,disposalReceiptIds,terminalPhase}`.

fromTick is oldTick; toTick is oldTick+1. inputCommandId/blockedId are the actual command or blocked action from this interval, or null. fanMode is the post-input fan configuration used for this interval. disposalReceiptIds lists all disposals in the interval, including an input delivery error and later expiries; completion IDs are only actual new completions. terminalPhase is the final playing/won/lost result.

`orders` always has exactly three stable O1/O2/O3 rows:

`{orderId,before,nominalDeltaQ,actualDeltaQ,afterWork,after}`.

Each boundary value is an OrderSnapshot. `before` is **post-input**, just before this interval's thermal/work stage; it may already be a delivered order or a replacement raw attempt. nominalDeltaQ is the phase/location/fan rate or zero for raw/delivered. actualDeltaQ is the actual clamped change. `afterWork` includes that temperature change, holding-age increment and all simultaneous station completion commits, but precedes expiry. `after` is the final committed order after any expiry/reset. Thus a cooked completion has age zero in afterWork, an expiry exposes the old heated/aged attempt in afterWork and the replacement in after, and a correct delivery has identical before/afterWork/after.

`work` contains the actual post-input occupied stations in cook/cool/pack order, including ready tasks with zero progress increment:

`{stationId,taskId,orderId,attempt,progressBefore,increment,progressAfter,durationTicks,completedNow}`.

increment is exactly 1 for working tasks and 0 for ready ones. A station released during input is absent; a task started during input appears at progressBefore zero. completedNow is true only for that task's first completion in this interval. These are stored observations of the actual update, not a second predictor or counterfactual schedule.

The independent offline reviewer can bind input.before/after to the prior full observation and this interval's before, then verify integer temperature/work into afterWork and receipt-driven expiry into after. It never needs a private solution, renderer coordinates, hidden scheduler state or a fabricated full-step alias for an input receipt.

## Exact input and receipt conventions

Difficulty is truncated and clamped to 0..2, with non-finite values using zero. Seed is Math.trunc(seed) converted to an unsigned integer for finite numeric input, or1 for non-finite input. It is metadata only and never changes the authored recipes or hidden arrival times. Non-finite x is zero; abs(x) <= 0.25 is neutral, otherwise its sign selects left/right. y is ignored. A neutral horizontal direction resets repeat even on a B-priority interval. A/B simultaneous edges produce only B, with A consumed rather than deferred.

Order holdingAgeTicks is zero while raw/cooking and has no deadline until cooking completes. Delivery snapshots keep their pre-interval age; expiry snapshots keep their post-work age. These different boundaries are intentional. Station task durations are always the authored cookTicks,120cool ticks,or packTicks. A operation taskId is the newly started task for starts, or the departing task for collection/delivery. Nullable receipt links are explicitly null when that operation has no such side effect.

A fan command has no permanent actionReceipt; commandCount = actionReceipts.length + fanChangeCount. lastRejected.id equals the one-based blockedCommands count. Task and receipt IDs remain independent from event IDs. Every snapshot, receipt and event payload must be detached from mutable current entities.

Event payloads after the common id/type/tick/at fields are:

- selection: {fromOrderId,toOrderId}; emit only when selection actually changes.
- command: {commandId,operation}; operation is the exact accepted immediate input receipt.
- blocked: {rejection}; rejection is the exact lastRejected record.
- task-completed: {completion}; the exact newly appended completion receipt.
- collected: {collection}; the exact newly appended collection receipt.
- delivered: {delivery}; the accepted successful delivery receipt only.
- discarded: {disposal}; the exact new disposal receipt, including replacement and any released task.
- won: {score,deliveredOrderIds}; exactly once after all three correct deliveries.
- lost: {reason,strikes,undeliveredOrderIds}; exactly once after final priority resolution.

An ordinary collect emits command then collected. A correct packed delivery emits command, collected, then delivered. A wrong packed delivery emits command then discarded; its failed delivery receipt still appears in deliveryReceipts, but is never a successful delivered event. A start or fan toggle emits command only. All task-completed events follow input side effects in cook/cool/pack order, followed by expiry discarded events in O1/O2/O3 order and finally terminal events. Selection, if any, precedes A command on its interval.

Disposal issues is {wrongOrder:boolean,wrongTemperature:boolean} for input errors, or {expired:true} for expiry. A correct delivery keeps both delivery issue flags false and disposalId null. A completed task subsequently expiring is discardedReady, not cancelled; no disposal invents a collection. The replacement raw snapshot uses the same immutable order data with attempt+1,ambient temperature,zero thermal counters and age,and null cookedAtTick/expiresAtTick/taskId.

The record of an interval must be generated from the actual update, not from a second predictive model. Renderers and pilots may read only these public fields. No hidden route, forced-win action, externally writable station assignment, timer override or temperature-setting input is part of the API.
