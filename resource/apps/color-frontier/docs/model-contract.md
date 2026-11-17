# 染色连疆 — public model contract

Written before implementation. The board is a rectangular colored map with no holes. The owned area begins as the entire orthogonally connected component containing the top-left cell. Diagonals never connect. A selects the currently highlighted dye: recolor every owned cell, then absorb every same-colored cell reachable by four-neighbor connectivity. No hidden target arrangement exists.

## Fixed maps

Colors 0–3 are CORAL / GOLD / JADE / INDIGO (珊瑚／金黄／青玉／靛蓝). All boards are public. Seed is recorded only and never randomizes a puzzle.

| Level | ID / name / 中文 | Row strings | Move limit |
| --- | --- | --- | ---: |
| 0 | spring-cove / SPRING COVE / 春湾渗染 | 00122 / 03122 / 03312 / 33011 / 22211 | 6 |
| 1 | delta-weave / DELTA WEAVE / 三角洲纹 | 001122 / 301232 / 330230 / 223130 / 211103 / 221003 | 8 |
| 2 | island-chain / ISLAND CHAIN / 岛链回染 | 012301 / 112301 / 002233 / 032110 / 033100 / 222003 | 9 |

Left/right wraps among four palette colors; up/down does nothing. A recolors to selected color. Choosing current color is blocked and free. A different color always costs one move, even when it absorbs no new cell. Immediately after that move, owning the full board wins (including the final allowed move). Otherwise, reaching the allowance loses with reason `moves`. No timer or automatic win before A exists.

B restores the board, owned mask/count and owned color from the most recent actual recolor. The history entry is removed. It NEVER refunds movesUsed or undos; palette selection is preserved. Undo with no history is blocked and free. Undo is available only while playing, so it cannot rescue an exhausted failed round. Retry is a fresh model through the host.

## Interface and state

API only `create(seed,level)`, `step(state,dt,input)`, deeply immutable `config`. Browser global `PureModel` or CommonJS. Config: defaultSeed749, maxElapsed86400, maxCounter2147483647, colors `[{name,nameZh,hex}]`, layouts `[{id,name,nameZh,width,height,cells,moveLimit}]`. Create normalizes seed to integer0..4294967295 or749; level integer0..2 or0. State is fresh; step mutates and returns it.

State: schema1, seed,level, phase playing/won/lost, reason ''/moves, score0 or100 iff won; width,height,cells flat row-major integer palette indices; owned flat boolean mask, ownedCount; color=cells[0]; selected1 initially; movesUsed0, moveLimit; history[]; undos0; lastGain0; elapsed0,elapsedCappedfalse,calls0,blockedActions0; inputArmedfalse,cancelEpochnull,cancelledLastfalse,lastHeld `{a:false,b:false,direction:'none'}`,lastCommandnone,events[],terminalReceiptnull,message. All initial contiguous color0 cells belong to owned. History entries are detached `{cells,owned,ownedCount,color}`, at most moveLimit; no unlimited input/event history. Rules use immutable layout limit/dimensions; external state corruption is unsupported and tests using it must be marked synthetic.

Each admitted call resets events and lastCommand; no-event calls preserve message. At most one event: select `{from,to}`, flood `{color,gained,ownedCount,movesUsed}`, undo `{ownedCount,movesUsed}`, blocked `{reason:'same-color'|'no-history'}`, win `{color,gained,ownedCount,movesUsed}`, collision `{reason:'moves'}`. All include call. Flood updates lastGain; undo resets it to0; select/blocked retain it. Every terminal transition saves detached `{cause,level,call,elapsed,cells,owned,ownedCount,color,selected,movesUsed,undos,score,phase,reason}`. Terminal steps are exact no-op.

## Inputs

Same release protocol as preceding Game Kit games. Terminal state, nonnumber/nonfinite dt or dt outside `(0,.25]` is exact no-op before reading input. Normalize own data descriptors x/y/a/b/cancelEpoch/cancelled/paused atomically; never invoke getters or read inherited properties. Invalid objects, arrays and descriptor exceptions normalize entirely to neutral. Literaltrue only; finite numeric axes clamp[-1,1]. Epoch is nonnegative safe integer or ignored. Pausedtrue is exact no-op. Dominant axis above0.5 chooses direction, vertical wins ties.

Initial full-neutral arms input. First valid epoch sets baseline. A later epoch change or false→true cancelled edge disarms before actions; that call cannot rearm. Every cancelled sample suppresses commands; later noncancelled full-neutral rearms. Save held sample even when suppressed. A command requires armed status at call start: rising B, else rising A, else changed nonneutral direction. Other simultaneous edges are consumed; held inputs never repeat. Nonobject input can act as neutral; disconnected-phone quarantine belongs to host. Admitted calls increment calls and elapsed, saturating at config bounds, with sticky elapsedCapped on overflow. Time has no game effect.

Required tests: independent ordinary wins on all boards; exact last-charge success versus exhausted failure; orthogonal cascade/no diagonals; same-color free; nonexpanding recolor still charged; undo exact restore/no refund/empty history; priority, held input, cancellation, paused/invalid input, terminal freeze, independent state/history/config. Browser evidence uses snapshots and normal keys only; no solver ships in assets.
