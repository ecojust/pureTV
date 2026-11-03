# Codebreaker — public model contract

Normative public specification written before implementation and execution. This document alone is not evidence of passed checks or publication.

## Public challenge

Each game has a private four-symbol code. Symbols may repeat. Three rounds use4/5/6 available symbols and7/8/9 attempts:

| Level | id / English | 中文 | Symbols | Attempts |
| --- | --- | --- | --- | --- |
| 0 | quartet-code / FOUR SYMBOLS | 四纹密匣 | 4 | 7 |
| 1 | quintet-code / FIVE SYMBOLS | 五纹密匣 | 5 | 8 |
| 2 | sextet-code / SIX SYMBOLS | 六纹密匣 | 6 | 9 |

Symbols have zero-based internal values0..symbols−1 and visible numbers1..symbols with distinct shapes. A guess must fill all four slots before submission. Feedback gives only two aggregate counts: exact symbols in their correct positions, and matching symbols in other positions. Each occurrence is counted at most once. Exact matches are removed first, then misplaced matches are the sum of the minima of the unmatched secret/guess multiplicities. No per-slot hints are given.

Four exact matches wins, including the final attempt. Otherwise the last attempt loses. Only complete submissions cost attempts. Incomplete submissions, navigation, symbol changes, clearing and blocked moves are free. The guess stays in place after feedback for editing. No time limit.

## Controls

Left/right move among the four slots, clamped at ends. Up cycles the selected symbol forward (blank→0); down cycles backward (blank→symbols−1). Nonblank cycling wraps within the symbol alphabet and never implicitly blanks a slot. A submits the whole guess; an incomplete guess blocks free. B clears the current slot; clearing an already blank slot blocks free. These two actions use the phone's upper/lower right control regions.

## API and private information

Expose only create(seed,level), step(state,dt,input) and deeply frozen config through CommonJS/window.PureModel. Config is {defaultSeed:761,slots:4,maxElapsed:86400,maxCounter:2147483647,layouts}; each layout contains id,name,nameZh,symbols,attemptLimit. No secret, feedback oracle, search, fixtures, solution vectors or alternate constructor is exported.

Valid seeds are integers0..4294967295, otherwise761; levels integers0..2, otherwise0. The seed and level deterministically establish the private code, allowing reproducible tests and retry. The code is stored in a closure-private WeakMap keyed by the original created state. It is absent from config and the playing snapshot. This is application-level information separation, not cryptographic security against inspecting client source. A JSON copy is only an observation; step on an object not produced by this model is an exact no-op.

Only terminal won/lost state reveals a detached code copy. A successful guess already identifies the code. While playing, reveal is null. Every other field contains public information only.

## State and lifetime

State fields: schema,seed,level,phase,reason,score,cursor,guess,history,attemptsUsed,attemptsRemaining,reveal,edits,clears,elapsed,elapsedCapped,calls,blockedActions,inputArmed,cancelEpoch,cancelledLast,lastHeld,lastCommand,events,terminalReceipt,message.

Initial phase playing, reason empty, score0, cursor0, guess=[null,null,null,null], history=[], attemptsUsed0, attemptsRemaining=level allowance, reveal null. History entries are detached {guess,exact,misplaced,attempt}; attempt is one-based. History length equals attemptsUsed and is bounded by the allowance≤9. Each guess has four symbol values. Exact/misplaced are integers0..4 and their sum≤4.

Every valid submission appends one record and decrements attemptsRemaining. Won score100/reasonempty; lost score0/reasonattempts. Playing always has at least one remaining attempt and reveal null. A terminal state never changes again. A new create starts a fresh independent state/private code.

Edits counts actual up/down changes; clears counts actual nonblank→blank changes. These and calls/blockedActions saturate at2147483647. Elapsed is informational, capped86400 with sticky elapsedCapped. There is no growing input/selection history; events holds at most one item.

TerminalReceipt is a detached {cause,call,elapsed,level,cursor,guess,attemptsUsed,attemptsRemaining,reveal,score,phase,reason}; cause success/attempts. Neither history guesses, terminal arrays nor revealed code share mutable arrays with live guess or the private code.

## Atomic input/cancellation

Only original created states can step. Terminal and invalid-dt calls are exact no-ops before reading input. Admit finite numeric0<dt<=.25. Normalize own data descriptors of x/y/a/b/cancelEpoch/cancelled/paused on nonnull nonarray objects, ignoring getters and inherited/unknown fields. Descriptor failures discard the whole sample to neutral; nonthrowing Proxy traps may run. Only literaltrue enables booleans; finite numeric axes clamp[-1,1]; cancelEpoch is a nonnegative safe integer or ignored. Normalized pausedtrue is an exact no-op.

Neutral direction means both magnitudes<=.5; otherwise dominant axis wins with vertical ties. Positive x/y is right/down. Only changed direction or newly held button edges command; held input does not repeat, while direct direction changes do. Priority B>A>direction consumes other new edges without queueing. aPressed/bPressed are ignored.

Initial unarmed input needs an admitted noncancelled full-neutral sample. A changed valid epoch after baseline or false→true cancelled disarms before any command. All cancelled samples suppress commands. A disarm call cannot rearm; a subsequent admitted noncancelled full-neutral sample is needed. Commands require armed at entry. The host handles actual release/phone disappearance; neutral model input alone is not a physical-release guarantee.

Each admitted unpaused call advances bounded calls/time, clears events/lastCommand, then applies at most one command. Every such call records the normalized held sample, including suppressed edges. No-event calls preserve message. Invalid/paused/terminal calls preserve all fields.

## Events

Events contain call and type:
- cursor {from,to}
- edit {position,from,to}
- clear {position,from}
- blocked {reason}, where reason is boundary/empty-slot/incomplete
- feedback {attempt,exact,misplaced,attemptsRemaining}
- win {attempt,exact:4,misplaced:0}
- collision {reason:'attempts',attempt,exact,misplaced}

Incomplete A does not evaluate or disclose code information. Complete A copies the current guess, computes private feedback once, appends public history, then tests exact==4 before remaining-attempt exhaustion. An ordinary nonwinning submission preserves the guess and exposes no secret. Nothing in cursor/symbol edit/clear events evaluates hypothetical guesses.

## Evidence

Test-only solvers may enumerate codes and retain candidates consistent with actual public feedback. They must not access the WeakMap or recompute the private generator. Duplicate-feedback reference tests can first solve through normal inputs, then use the resulting known code in another round with the same seed/level. Synthetic malformed-input/counter probes must be labelled. Browser keyboards/software rendering are separate from physical TV, phone and emulator validation.
