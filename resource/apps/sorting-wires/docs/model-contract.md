# PureModel contract — Sorting Wires 0.1.0

Only create(seed,level), step(state,dt,input) and deeply frozen config are exported. Config layouts contain only id,names,wires,layers,inventory:3/3/3,4/3/5,5/5/9. No answer network, route or search algorithm exists in production assets. All rounds begin with empty network layers; default seed775 is identity only, never randomized.

## Editing rules

State selectedLayer and selectedWire are zero-based. Left/right changes layer and up/down changes wire, one position per fresh direction, clamped to bounds. Each layer is a sorted array of pairs `{a,b}`, where0<=a<b<wires. A wire can belong to at most one pair in any layer. Two pairs may geometrically nest or cross; they still cannot share endpoints.

With no marked source, A on an occupied endpoint removes that comparator and refunds one inventory unit. A on a free endpoint marks `{layer,wire}`, unless inventory is exhausted. A with a mark on that same endpoint cancels it; a different free wire in the same layer installs the normalized pair and clears the mark. A in another layer or on an occupied second endpoint is blocked and preserves the mark. Arrows may change layer while a source remains marked; the player can return or cancel. Pending marks do not reserve inventory or alter the network.

B while marked cancels free. B while unmarked checks the entire current network and consumes exactly one of three attempts. Installing/removing increments bounded edits and networkVersion, recalculates comparatorsUsed/inventoryLeft and marks any previous result stale. No other editing/navigation input consumes a check. There is no automatic win or timer.

## Full binary validation

For n wires, check indices0..2^n−1 ascending. Input bits are most-significant first: wire0 is bitn−1. Each layer reads the entire previous-layer vector and writes a copy; pair(a,b) sends min(previous[a],previous[b]) to a and max to b. Unpaired wires retain values. Because endpoints are disjoint, installation/pair order within one layer cannot affect results.

Every case is evaluated, even after finding a failure. Count outputs nondecreasing from wire0 to wire n−1. Retain the first failing case by input index; do not reveal or install an answer. `lastCheck={passed,total,sortedCount,firstFailure,networkVersion}`. Failure is null or `{index,input,output,trace}`; trace[0] is the input, followed by one detached result per layer, so its length is layerCount+1. Input/output/trace arrays are detached from each other and state edits.

Each check decrements attemptsLeft and increments checks. If all inputs sorted, phase becomes won immediately, including the third check when attemptsLeft becomes0. Otherwise the third failure becomes lost with reason checks. Checking an empty n-wire network passes exactly n+1 already-sorted binary cases. The game never equates comparator count with success.

## State, receipts and bounds

- Identity/outcome: schema1,seed,level,phase playing/won/lost,reason empty/checks,score100 only when won.
- Problem: wires,layerCount,inventoryLimit. Editor: network,selectedLayer,selectedWire,marked,comparatorsUsed,inventoryLeft,edits,networkVersion.
- Validation: attemptsLeft0..3,checks0..3,lastCheck or null,lastCheckCurrent,checkReceipts and terminalReceipt. Each receipt deep-copies `{network,result}` at that actual check; at most3.
- lastCheck is retained after edits, including its networkVersion. `lastCheckCurrent` is the authoritative freshness flag: true on check, false on install/remove. It remains correct even if the bounded version counter eventually saturates. Marking/cancelling or moving cursor does not change it.
- terminalReceipt deep-copies outcome,network,comparatorsUsed,attemptsLeft,checks,lastCheck. No receipt aliases live editor arrays.
- calls,blockedActions,elapsed,elapsedCapped,lastCommand,events,message and input gate fields follow the lifecycle below. Events describe only the latest admitted call and are cleared by neutral input.

Network has at most9 comparators and5 layers. State contains no unbounded edit history; numeric editing/call counters saturate at2147483647, elapsed at86400 seconds. Cursor/mark coordinates are finite and validated through normal editor rules. Tests may set saturated counters in explicitly labelled boundary fixtures; ordinary model/browser wins use normal inputs without modifying network state.

## Input lifecycle

Only finite numeric0<dt<=.25 is admitted; invalid timing, literal pausedtrue and every terminal call are exact no-ops. Inputs read only own data descriptors, never accessors/inherited fields. Literal booleans are required; finite axes clamp[-1,1]. Above.5 dominant direction wins, vertical on ties. Fresh B takes priority over fresh A, then changed nonneutral direction. Pressed/released claims are ignored.

Fresh state is unarmed. A fully neutral sample arms it. A changed nonnegative safe cancelEpoch or rising literal cancelled disarms it. Held buttons/directions during or after cancellation cannot edit/check until a subsequent neutral sample rearms. Pending source is retained, but no latent completion or check occurs. Holding a button/direction never repeats. Terminal state freezes exactly, including editor selection and diagnostic counters.
