# 记忆陈列 / Memory Gallery — public model contract

Written before implementation. Remember a brief face-up gallery preview, then reveal two cards at a time to find identical numbered symbols. Every symbol appears exactly twice. A completed pair stays face up. The hidden deck lives only in a private WeakMap closure; public state exposes only currently visible faces or null, never a hidden answer array.

## Galleries

| Level | ID / English / 中文 | Grid | Pairs | Preview active seconds | Mistake limit |
| --- | --- | --- | ---: | ---: | ---: |
| 0 | small-salon / SMALL SALON / 小厅初展 | 4×3 | 6 | 2.5 | 4 |
| 1 | square-hall / SQUARE HALL / 方厅巡展 | 4×4 | 8 | 2 | 5 |
| 2 | grand-gallery / GRAND GALLERY / 长廊终展 | 5×4 | 10 | 1.5 | 6 |

Symbols1..10 have distinct shapes plus visible number cues. Initialize two of each symbol1..pairCount then seeded Fisher–Yates shuffle. Same normalized seed and level reproduce a deck. The default seed is760; seed integer0..4294967295 otherwise760, level integer0..2 otherwise0. The brief preview shows every face. No gameplay API exposes hidden identities after that preview; remembering previously visible faces in tests or normal play is allowed.

Directions move one cell with no wrap, including during preview/comparison. A reveals the cursor card only while choosing. Empty first slot stores the first face-up index. Selecting that same card or a locked card is blocked/free. Revealing a second matching face locks both immediately, clears first/second and increments matchedPairs. Matching every pair wins. A mismatch enters compare with both faces visible for one ACTIVE second. At its end hide both, clear first/second, add one mistake, and return to choosing unless the limit has been reached, in which case lose with reason `mistakes`. The last mistake is charged only after the visible delay. There is no overall time deadline, no score for speed, and B has no action.

A is blocked on any call that STARTED in preview or compare even if that call ends the timer. Held A does not trigger after a stage change: a true release and new press are required. New mismatch timers do not consume the dt of the revealing call; only later compare calls count. Preview/comparison decrement by the admitted dt, clamped at zero. Excess dt at a stage boundary is discarded rather than used for an action in the new stage. Pause and invalid dt freeze timers; cancelled and neutral admitted calls still advance active timers.

## API and public state

Only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`, exported as CommonJS or window.PureModel. Config defaultSeed760,comparisonSeconds1,maxElapsed86400,maxCounter2147483647,layouts `{id,name,nameZh,width,height,pairCount,previewSeconds,mistakeLimit}` and symbol names. No deck positions or solver in config/assets data. Private WeakMap associates each original create state with its shuffled deck. Passing a copied/foreign state to step is an exact no-op; such copies are read-only snapshots, not resumable games.

State: schema1,seed,level,phase playing/won/lost,reason ''/mistakes,score0 or100 iff won; stage preview/choosing/compare; width,height,pairCount,mistakeLimit; cursor0; visibleFaces (symbol IDs or null),locked booleans; firstnull,secondnull; matchedPairs0,mistakes0,previewRemaining,compareRemaining0; elapsed0,elapsedCappedfalse,calls0,flips0,cursorMoves0,blockedActions0; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceipt null,message. All public arrays detached. During preview all faces visible; afterwards only first/second revealed cards and locked pairs are visible. No growing reveal history or identity receipts.

Events at most one per admitted call, always include call: move `{from,to}`, flip `{index}`, match `{indices:[first,second],matchedPairs}`, compare `{indices:[first,second]}`, ready `{}`, hide `{indices:[first,second],mistakes}`, blocked `{reason:'preview'|'compare'|'locked'|'same-card'|'edge'}`, win `{matchedPairs}`, collision `{reason:'mistakes'}`. A timer transition takes event/message precedence over a same-call cursor move or blocked A, while lastCommand records the attempted input. No events expose hidden symbol IDs. Terminal receipt detached `{cause,level,call,elapsed,stage,cursor,visibleFaces,locked,matchedPairs,mistakes,flips,score,phase,reason}`. A loss occurs after hiding the mismatched pair; no terminal reveal of hidden cards. Terminal steps exact no-op.

## Input lifecycle

Terminal/foreign-state and invalid dt (not finite JS number in `(0,.25]`) are exact no-op before input access. Normalize own DATA descriptors x/y/a/b/cancelEpoch/cancelled/paused atomically; ignore getters/inherited keys. Arrays/nonobjects/descriptor exceptions normalize fully neutral. Literaltrue booleans; finite numeric axes clamp[-1,1]; epoch nonnegative safe integer or ignored. Pausedtrue exact no-op. Dominant axis over0.5 chooses direction, vertical wins ties.

Initial full-neutral arms input. First valid epoch establishes baseline. Later epoch changes or false→true cancelled edge disarm before commands, and cannot rearm that call. Cancelled input never commands. Later noncancelled full-neutral rearms. Require armed-at-start: rising A else changed nonneutral direction; B never commands but participates in full-neutral release. Other simultaneous edges consumed; held inputs never repeat. Host owns disconnected-device quarantine. Informational elapsed/counters saturate; time overflow cannot end a game. No-event calls preserve message.

Verify 3 ordinary wins from remembered preview only; exactly two of each initial symbol, deterministic independent seeds/states, hidden-state JSON/privacy and copied snapshots no-op; first/same/locked choices; matching and visible mismatch delay, limit loss, preview/compare A suppression and release, cursor boundaries, pause/cancel timers, terminal freeze and finite bounded data. Browser scripts may memorize visible snapshots but must never derive or access the hidden deck.
