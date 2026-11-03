# 环塔迁移 / Ring Towers — public model contract

Written before implementation. Three pegs hold numbered rings. Ring size equals its positive integer number. A peg is an array from bottom to top, always strictly descending. Only a top ring may move; a larger ring may never sit on a smaller ring. Move the entire tower from peg0 to peg2.

## Public layouts and actions

| Level | ID / English / 中文 | Rings | Allowed transfers |
| --- | --- | ---: | ---: |
| 0 | copper-three / COPPER THREE / 铜环初阶 | 3 | 11 |
| 1 | cobalt-four / COBALT FOUR / 钴蓝四环 | 4 | 21 |
| 2 | coral-five / CORAL FIVE / 珊瑚五环 | 5 | 39 |

Initially peg0 is `[N,N-1,...,1]`, other pegs empty, selected0, source null. Left/right wraps selection among pegs0..2. With no source, A marks a nonempty selected peg as the source but does NOT pick up or remove its ring. Then choose destination and press A again. Legal transfer pops exactly one top ring from source and pushes it onto the selected destination; source clears to null. Same-peg and larger-on-smaller transfers are blocked/free and retain source selection. Selecting an empty source is blocked/free. B cancels the source only, free; with no source it is blocked/free. There is no undo.

Only completed legal transfers spend moves. Immediately after each transfer, all N rings on targetpeg2 wins (including the final allowed transfer). Otherwise reaching the allowance loses with reason `moves`. Source selection, cancellation, selection and blocked inputs never spend moves. There is no clock deadline.

## Public API and state

Expose only `create(seed,level)`, `step(state,dt,input)` and deeply immutable `config`, as CommonJS or `window.PureModel`. No solution or future-evaluation helper is shipped. Config defaultSeed755,target2,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,diskCount,moveLimit}`. Normalize seed integer0..4294967295 or755; level integer0..2 or0. Seed is recorded but puzzles are fixed.

State: schema1,seed,level,phase playing/won/lost,reason ''/moves,score0 or100 iff won,diskCount,target2,pegs,selected0,source null,movesUsed0,moveLimit,transfers[],lastMove null,elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. Every ring1..N exists exactly once across pegs; source selection doesn't own a detached ring. Create allocates fresh state; step mutates and returns it. Transfer receipts `{index,from,to,disk,call}` are detached from lastMove; at most moveLimit receipts. Config judges target and allowance, not mutable display copies. External state corruption is unsupported; fixture mutation must be labelled synthetic.

Events at most one per admitted call, each includes call: select `{from,to}`, source `{peg,disk}`, cancel `{peg}`, blocked `{reason:'empty-source'|'same-peg'|'larger-on-smaller'|'no-source'}`, transfer `{from,to,disk,movesUsed}`, win `{from,to,disk,movesUsed}`, collision `{reason:'moves'}`. Terminal result replaces transfer event but still appends its receipt and updates lastMove. Terminal receipt detached `{cause,level,call,elapsed,pegs,selected,source,movesUsed,score,phase,reason}`. Terminal step is exact no-op.

## Input lifecycle

Terminal and invalid dt (not finite JS number in `(0,.25]`) return exact no-op before input reads. Read own data descriptors x/y/a/b/cancelEpoch/cancelled/paused atomically; no inherited keys or getter calls. Arrays/nonobjects/descriptor exceptions become fully neutral. Literaltrue booleans only; finite numeric axes clamp[-1,1]. Epoch nonnegative safe integer or ignored. Pausedtrue is exact no-op. Dominant axis above0.5 chooses direction; vertical wins ties. Up/down have no action.

Initial full-neutral arms. First valid epoch sets baseline. Later epoch change or false→true cancelled edge disarms before processing; that call cannot rearm. All cancelled samples suppress commands. A later noncancelled full-neutral sample rearms. A command needs armed-at-start: B rising edge, else A rising edge, else changed nonneutral direction. Save all held values even when suppressed, consuming simultaneous extra edges without queues. Held inputs never repeat. Device disconnect quarantine belongs to host; malformed input may normalize to neutral.

Each admitted call clears events/lastCommand, advances calls/elapsed bounded at config maximum, with sticky elapsedCapped on overflow. blockedActions also saturates. Time is informational. No-event calls retain message.

Verify ordinary recursive legal solutions all levels, ring conservation and descending stacks each step, exact-budget wins via reversible legal padding, exhausted losses, source selection without removal, cancellation and all blocked cases, priority/held/cancelled/paused/invalid/terminal handling. Independent browser automation reads snapshots and sends normal keys; never imports a solver from assets or mutates state.
