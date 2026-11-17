# Twenty Four / 四则二十四 — public model contract

Written before implementation. Four public integer cards must be used exactly once, combining two current values at a time using +,−,×,÷ until the one remaining value is EXACTLY24. Intermediate values may be negative, zero or rational fractions. Production contains initial cards and arithmetic rules only; no answer expressions, routes or solver.

## Public puzzles and exact values

| Level | ID / English / 中文 | A,B,C,D |
| --- | --- | --- |
|0|first-equation / FIRST EQUATION / 初算四牌|1,2,3,4|
|1|split-calculation / SPLIT CALCULATION / 分支合算|2,4,7,8|
|2|fraction-bridge / FRACTION BRIDGE / 分数之桥|3,3,8,8|

Each term `{id,mask,n,d,expr}`. Initial masks/id1,2,4,8, expr A/B/C/D, denominator1. Equal-valued physical cards remain distinct through masks. Result id=mask=bitwise OR of the two operand masks. All current masks are nonzero, pairwise disjoint and union15. Expressions use source LETTERS with parentheses and ASCII +,-,*,/; original A=number… legend remains visible. Never reuse a source bit.

Rational n/d is normalized: integer safe numerator and denominator, d>0, gcd(abs(n),d)=1; zero is0/1. Addition/subtraction use cross-products, multiplication numerator×numerator/denominator×denominator, division multiply by reciprocal. Normalize denominator sign and reduce gcd. Exact equality to24 is n===24*d. No float tolerance. Four given cards are small enough that ordinary arithmetic stays within safe integer products; defensive unsafe-integer arithmetic is blocked `arithmetic-limit` free. Division by zero is blocked `zero-divisor` free and leaves selection/operator intact.

## Interaction

Stages first,second,operator,retry. Left/right cycle current choice with wrap; up/down ignored.

1. first: cursor indexes current terms. A selects left operand L by mask and enters second; cursor moves to next distinct term.
2. second: left/right cycle terms EXCLUDING firstMask. A selects right operand R and enters operator at opIndex0.
3. operator: left/right cycle six menus in order: `add` L+R, `subtract` L−R, `reverse-subtract` R−L, `multiply` L×R, `divide` L/R, `reverse-divide` R/L. A performs that exact order. Selected labels L/R and directional expression are visible before confirmation. Remove both terms, append result to preserved remaining order, cursor=result index, clear selection, stagefirst, opIndex0. No automatic simplification other than exact rational reduction.
4. retry: a wrong complete result remains visible. A resets to the four original terms with history cleared; currentAttempt becomes failures+1. Undo tickets and global mergesUsed are NOT replenished/refunded.

B in second/operator freely cancels the WHOLE pending selection, returnsfirst with cursor at former first term, opIndex0. B in first/retry undoes last successful merge if a history entry exists and tickets remain. Check no-history before no-tickets; blocked reason `no-history` or `no-tickets`. Undo restores terms/cursor/attemptMerges from that entry, consumes one of TWO global tickets, clears selection and lastOperation, entersfirst. It never reduces global mergesUsed, failures or completed attempt history. If undoing a wrong complete retry result, currentAttempt becomes failures+1: the failed chance stays spent. A fresh retry reset discards history, so undo cannot cross that reset. Pending selection cancellation takes precedence over undo and spends no ticket.

Every successful merge increments global mergesUsed and current attemptMerges. Selecting/cancelling/rejected division costs nothing. After a merge leaves ONE term:
- mask15 and exact24 wins immediately `twenty-four`, including after two previous failures.
- otherwise failures increments; one completed-attempt receipt is retained. If failures<3, enterretry and show result, await A fresh reset or B ticket undo. Third wrong completion loses `attempts`; terminal forbids undo/reset.

No move cap or countdown; mergesUsed is an honest cumulative diagnostic, never refunded. Attempts3 and undo tickets2 limit successful arithmetic to at most11 merges before terminal. Free selection/cancel inputs do not grow history. A partial term24 with unused cards is not a win.

## API and state

Only `create(seed,level)`, `step(state,dt,input)`, deeply frozen config via CommonJS/window.PureModel. Config defaultSeed799,target24,fullMask15,attemptLimit3,undoLimit2,maxElapsed86400,maxCounter2147483647,operators `{id,label,symbol,reverse}`,layouts `{id,name,nameZh,cards}`. Seed integer0..4294967295 else799; level integer0..2 else0. Seed recorded only.

State schema1,seed,level,phase playing/won/lost,reason `''`/twenty-four/attempts,score0/100,stagefirst,cards detached,terms fresh,cursor0,firstMasknull,secondMasknull,opIndex0,target24,fullMask15,currentAttempt1,failures0,attemptLimit3,attemptsRemaining3,attemptMerges0,mergesUsed0,undoTickets2,undoUsed0,history[],lastOperationnull,lastAttemptnull,attemptHistory[];
elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message.

history entries `{terms,cursor,attemptMerges}` snapshot pre-merge terms, cursor at first selected term; maximum3. lastOperation `{operation,first,second,left,right,result,merge,attempt}` detached term copies, first/second reflect selections and left/right actual mathematical order. Completed attempt `{attempt,mergesUsed,result,correct,failuresAfter}` detached, attemptHistory≤3; lastAttempt separate copy. attemptsRemaining=3−failures even duringretry. A successful completion also records an attempt receipt; failure count unchanged.

Events at most one per call with call: cursor `{cursor}`, select `{role:'L'|'R',mask}`, operator `{index,id}`, cancel `{from}`, merge `{receipt}`, undo `{restoredMasks,ticketsLeft}`, reset `{attempt}`, blocked `{reason:'zero-divisor'|'arithmetic-limit'|'no-history'|'no-tickets'}`, attempt-failed `{receipt}`, win/collision `{reason}`. Complete-result event replaces ordinary merge. terminalReceipt `{cause,level,call,elapsed,terms,currentAttempt,failures,mergesUsed,undoUsed,lastOperation,lastAttempt,score,phase,reason}` detached.

## Input lifecycle

Terminal or invalid dt (not finite numeric `(0,.25]`) exact no-op before reads. Atomically normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused; ignore getters/inherited keys; invalid objects/arrays/descriptor exceptions neutral. Only literaltrue flags. Finite axes clamp[-1,1]; dominant magnitude>.5 chooses direction, vertical wins ties. Epoch nonnegative safe integer elseignored.

Pausedtrue exact no-op. Initial full-neutral arms. First epoch establishes baseline; later changes or rising cancelled disarm before commands and cannot rearm same call. Cancelled input never commands. Later noncancelled full-neutral rearms. Armed-at-start B rise, else A rise, else changed nonneutral direction. B>A>direction; up/down produce no game action. Consume suppressed held edges, no repeat. Cancellation preserves selections/history; explicit B is in-game cancel. Active elapsed/diagnostics saturate with no deadline. Terminal exact freeze.

## Verification

Independent exhaustive expression search from public cards, ordinary three wins, and no integer-only intermediate solution for3,3,8,8 (fraction necessity). Exact signed rational arithmetic, every operation direction, zero division rejection, masks conservation, pending cancellation, ticket undo without attempt/merge refund, natural wrong completions and third-failure loss, correct third attempt, partial24 notwon, initial/pause/cancel/terminal. Test-only enumeration/routes never enter assets. Synthetic arithmetic-limit/input fixtures explicitly labelled.
