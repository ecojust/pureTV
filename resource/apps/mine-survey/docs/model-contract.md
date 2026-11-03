# Mine Survey — public deduction contract

Written before implementation. Three fixed 6×6 survey boards contain 5, 6 and 7 mines. Their initial safe areas are already open. Each board can be completed by logical deductions from visible eight-neighbor counts and the public mine total; no guessing is required. The game never supplies a hidden answer route or solver.

| Layout | Total mines | Initial safe opening indices | Initial revealed safe | Safe cells still hidden |
| --- | ---: | --- | ---: | ---: |
| copper-ridge / 铜丘台地 | 5 | [20] / C4 | 17 | 14 |
| riverbank / 溪岸旧矿 | 6 | [5] / F1 | 9 | 21 |
| basalt-slope / 玄岩坡地 | 7 | [5] / F1 | 8 | 21 |

Indices are row-major, A1=0 to F6=35. Initial openings expand by the same zero-flood rule as later reveals. The already-open area supplies the safe start; later mine clicks are not protected by first-click immunity. No time or move budget applies.

## Information boundary

Public API is exactly `create(seed,level)`, `step(state,dt,input)`, deeply frozen `config`. Config contains defaultSeed759,width6,height6,maxElapsed86400,maxCounter2147483647 and layouts `{id,name,nameZh,width:6,height:6,mineCount,initialOpen}` above. It contains **no mine coordinates, hidden clue map, solution route or private board reference**.

Private immutable authored mine data lives only inside the production model closure. A private WeakMap binds each actual create-returned state to its private clue map. Neither state nor event nor playing-state snapshot contains hidden mines. Before losing, cells are only null (hidden) or visible safe counts0..8; flagging never reveals a hidden value. A loss may publicly show all mines as -1. A win need not reveal mines. Public snapshots can be copied safely; passing a copied/foreign state back to step is unsupported and returns unchanged because it lacks the private binding. Seed is recorded but does not change the fixed board or encode a supplied route.

QA strategies must use only public snapshots/config. Tests may verify known negative cases, but a normal-play win must be produced by deductions from visible clues and total mine count, not source-code mine data or an answer list.

## Reveal, flood, flags and victory

Arrows move cursor one cell, clamped at the grid edge. A on a hidden unflagged safe cell reveals its eight-neighbor mine count. If it is zero, expand through eight-neighbor zero cells and reveal their numbered boundary cells. Already visible cells and flags are skipped; flags are never auto-opened, including incorrectly flagged safe cells. Revealing a numbered cell does not expand beyond it. A on a flag or already visible cell is blocked and consumes nothing.

A on an unflagged mine immediately loses (`phase:lost`,reasonmine,score0), records exploded index and reveals all mines as -1. Other unseen safe cells remain null. There is no mine relocation or information-dependent board mutation.

B toggles a flag only on a hidden cell. Removing a flag is always allowed while playing. Placing one is blocked when flagsUsed==mineCount; it never reports whether the flag is correct. B on visible safe cells is blocked. Flag changes do not themselves reveal cells or win. Victory occurs exactly when all safe cells have been revealed (`phase:won`,reasonempty,score100), regardless of whether any mines are flagged. Incorrect flags can therefore hold back a win until removed and their safe cells opened. Terminal calls are exact no-ops.

## State

Fresh state fields: schema1,seed uint32 or759,level integer0..2 or0,phaseplaying,reasonempty,score0; width6,height6,mineCount,safeTotal36−mineCount; cells flat36 visible/null, flags flat36 booleans false, cursor initialOpen[0]; flagsUsed0,revealedSafe initial flood count, reveals0,flagChanges0,lastOpened initial safe indices, explodednull, terminalReceiptnull.

After a valid reveal, reveals increments, lastOpened is the newly opened safe indices (empty on mine loss), and revealedSafe counts visible safe cells. FlagChanges saturates at maxCounter. Final detached receipt is `{phase,reason,score,cells,flags,flagsUsed,revealedSafe,safeTotal,exploded,reveals}`; on loss its cells may include visible -1 mines. No history grows with flag toggles. lastOpened≤36, events≤1.

Input/lifecycle fields: elapsed0,elapsedCappedfalse,calls0,blockedActions0,inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],message. Calls/blockedActions saturate2147483647; elapsed saturates86400 and is informational only. Every array is detached from config, other states and receipts. Supported states always contain finite values.

## Input gate

Only finite numeric0<dt<=.25 is admitted. Terminal, foreign-state, invalid-dt and pausedtrue calls are exact no-ops. Read own data descriptors x,y,a,b,cancelEpoch,cancelled,paused only; accessors/inherited fields ignored. Classification/descriptor exceptions discard the complete input to neutral; nonthrowing Proxy traps can execute. Finite numeric axes clamp[-1,1]; other axes0; booleans require literaltrue; epoch nonnegative safe integer.

Direction is none when both magnitudes<=.5, otherwise dominant axis with vertical ties. Positive y means down. One edge command per call: B before A before changed direction. Held keys do not repeat; consumed competing edges never queue. Fresh create requires a neutral admitted sample. First valid epoch establishes baseline; a later changed epoch or false→true cancelled edge disarms before commands and cannot rearm on that call. Subsequent noncancelled full-neutral input rearms. Held fields are saved even when suppressed. Physical release quarantine after pause/reconnect belongs to the shared host.

## Verification

Independent tests must solve each fixed board using only visible constraints, verify at least12 initially hidden safe cells, actual zero expansion/numbered boundaries, flag protection/cap, victory without complete flags, ordinary mine loss, fresh-state isolation, no hidden-data exposure, cancellation and terminal freeze. Browser traces use ordinary inputs. Synthetic boundaries, software recording and physical-device verification remain distinct evidence categories.
