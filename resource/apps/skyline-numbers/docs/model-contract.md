# Skyline Numbers — public constraint contract

Written before implementation. Fill a square city grid with tower heights1..N, once per row and once per column. Looking inward from an edge, a tower is visible only when strictly taller than all towers before it. A nonzero edge clue specifies how many towers are visible; zero means no clue. There is no stored answer grid, hidden target pose, RNG or solver in production assets.

The three fixed puzzles are 4×4, 5×5 and 6×6. Public givens contain respectively1,2,10 fixed towers; nonzero edge clues count8,10,12, with clues on all four sides. Exact public arrays are in [public-layouts.json](public-layouts.json), and are the only puzzle data in config. Independent enumeration must verify exactly one solution for each. Sparse edge clues are essential constraints, not cosmetic hints.

## Actions and validation

Arrows move cursor one cell with edge clamping. A at an editable cell cycles height0→1→…→N→0, where0 is empty. Fixed givens cannot change. Duplicates are allowed during editing and visibly marked; there is no automatic correction. Held keys do not repeat. B manually checks the entire city and consumes one of three attempts, even if incomplete.

A valid check requires every cell1..N, no duplicate in any row/column, and every nonzero visibility clue matched. Check from top reads each column top-to-bottom; bottom reverses that column; left/right read/reverse each row. Tall towers hide all shorter towers behind them, and a new tower is counted only if it raises the running maximum.

If a check is correct, win immediately (`phase:won`,reasonempty,score100), including on the third attempt when attemptsLeft becomes0. An incorrect check stays playing while attempts remain; the third incorrect check loses (`phase:lost`,reasonchecks,score0). Merely filling a valid board never wins: B is required. No timer, edit budget, undo or automatic submit exists. Terminal state is an exact no-op.

## Pure API and config

Export exactly create(seed,level),step(state,dt,input),deeply frozen config through CommonJS or window.PureModel. Config has defaultSeed762,maxChecks3,maxElapsed86400,maxCounter2147483647 and layouts `{id,name,nameZh,size,fixed,clues:{top,right,bottom,left}}`. Each fixed array is flatN² numeric0..N; zero is editable. Each clue array is lengthN. Seed uint32 else762; level integer0..2 else0. Creates detach all mutable state from config and other rounds. External malformed/mutated states are unsupported; deliberately changed boundary fixtures are synthetic.

State: schema1,seed,level,phase,reason,score,size; board initialized from fixed, givens detached copy of fixed, clues detached public object,cursor0; attemptsLeft3,checks0,edits0; filled countnonzero, conflicts booleanN² marking every occurrence of a duplicated nonzero value in any row/column, visibility `{top,right,bottom,left}` arrays with actual count for a complete line and null for an incomplete line. Displayed visibility numbers never replace the fresh check. Givens are protected using immutable config, not a mutable display cache.

lastCheck initiallynull or a detached report `{complete,latin,edges,matched}`; every valid edit clears it. checkReceipts initially[] (at most3), each detached `{index,board,report,attemptsBefore,attemptsAfter,outcome:'reject'|'won'|'lost'}`. terminalReceipt null or detached `{phase,reason,score,board,attemptsLeft,checks,report}`. A check recomputes validation from current board and immutable clue data, not stale conflicts/visibility/report caches. Editing refreshes filled/conflicts/visibility; cursor changes preserve them. Check also refreshes them. No answer bitmap or solved-route field is exposed.

Lifecycle state: calls,blockedActions,edits saturating2147483647; elapsed saturating86400,elapsedCapped sticky, informational only; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],message. Events≤1, reset each admitted call, identifying select/edit/blocked/reject/win/collision. All supported-state numeric values finite; no edit history grows.

## Input

Admit only finite numeric0<dt<=.25 and nonterminal, unpaused state. Invalid dt, pausedtrue and terminal calls are exact no-ops. Read own data descriptors x,y,a,b,cancelEpoch,cancelled,paused only; inherited/accessor fields ignored. Classification/descriptor exceptions discard complete input to neutral; nonthrowing Proxy traps may run. Finite axes clamp[-1,1]; nonnumeric0. Booleans require literaltrue, epochs nonnegative safe integers. Ignore pressed flags and all other fields.

Direction is none when both magnitudes<=.5; dominant axis otherwise, vertical winning ties. Positive y goes down. One command per admitted call: B rise before A rise before changed nonneutral direction. Held inputs do not repeat; unchosen simultaneous edges are consumed. Fresh input requires a neutral call. First valid epoch establishes baseline. Later epoch change or false→true cancelled edge disarms before action; disarming call cannot rearm. A subsequent noncancelled full-neutral sample rearms. Save actual normalized held sample even if suppressed. Shared host handles physical-release quarantine.

## Verification boundary

Use a test-only solver restricted to public givens/clues to enumerate unique solutions and drive ordinary inputs to three wins. Check all four visibility orientations, row and column duplicates, fixed protection,0↔N cycle, incomplete checks, exact third-attempt success/failure, manual submit requirement, fresh/cache independence, input cancellation and terminal freezing. Keep synthetic boundary cases, browser keyboard play and physical-device tests separately labelled.
