# PureModel contract — Tile Garden 0.1.0

Only create(seed,level), step(state,dt,input) and deeply frozen config are exported. Every tile is public: layout `{id,name,nameZh,width,height,layers,tiles}`; tile `{id,layer,x,y,family}`. IDs equal array indices. Zero-based coordinates map exactly between separate layer panels. All family multiplicities are4; numeric families1..7 have distinct visual shapes. No hidden face, solution route or solver is shipped.

Layouts contain12/20/28 tiles, with1/2/2layers. The first is a full4×3 bottom board; second is full5×3 bottom plus5 upper tiles; third full6×4 bottom plus4 upper tiles. They start nonterminal with at least one available equal free pair. Default seed778 is reported identity only, not randomization.

## Geometry and commands

A live tile is free iff no live tile on any higher layer has the same x/y, and at least one immediate own-layer horizontal neighbour (x−1,y) or(x+1,y) is absent. Board boundaries supply an absent neighbour. A higher tile in an adjacent cell does not cover, a different row does not block sides, and a gap counts as absence even if farther tiles remain. These facts derive entirely from public tile positions/removal flags.

Arrows move cursor one cell in the current layer, clamped to width/height. B cycles layerCursor while retaining cell coordinate and selected tile. Single-layer B is blocked/free and retains selection. Any family's free pair may span layers.

A on empty or blocked tile is a free no-op apart from diagnostics. With no selection, A on a free tile selects its ID. A on that same tile cancels. A on another free tile clears selection and either removes both if families match or increments mistakes if different. A blocked second tile preserves the original selection. No other game operation can make a selected free tile become blocked.

After an equal pair, recompute free tiles/pairs and remaining. All removed wins first. Otherwise no equal free pair means immediate lost/deadlock, even with zero mistakes. Third mismatch means immediate lost/mistakes. Mismatches never remove tiles. No undo, timer or shuffle; terminal input cannot recover a game.

## Public state and receipts

- schema1,seed,level,width,height,layerCount; phase playing/won/lost,reason empty/deadlock/mistakes,score100 only when won.
- `tiles`: detached descriptors with removedboolean. Tiles keep stable array positions/IDs after removal.
- `cursor`: row-major cell index; `layerCursor`: active panel. `selected`: tile ID or null, independent of cursor/panel.
- `freeTiles`: sorted free IDs; `availablePairs`: all equal-family combinations among those IDs, lexicographic by their sorted iteration. These are derived convenience fields, no hidden oracle.
- remaining,pairsRemoved,mistakes,maxMistakes3; invariant remaining+2*pairsRemoved=initial tile count, every removed-family count is even.
- `lastPair`: null or `{tiles:[a,b],family}`; `lastMismatch`: null or `{tiles:[a,b],families:[f,g]}`. IDs follow actual selection order.
- `receipts`: pair/mismatch records, at most14 successful pairs plus3 mistakes. Pair records include family and remaining; mismatch records include cumulative mistakes.
- `terminalReceipt`: detached outcome,tiles,remaining,pairsRemoved,mistakes,selection,cursor/layer and free/pair arrays. It never aliases live tiles or diagnostics.
- Standard input gate,elapsed/counters,lastCommand,events,message. Events reset on each admitted playing sample; persistent selection/receipts remain visible after neutral release.

Tile count<=28, pair count<=14, mistakes<=3, positions/cursor bounded by6×4×2. Generic counters saturate2147483647 and elapsed86400; no unbounded move history exists. Test-only public search proves full6/10/14-pair wins and natural zero-mistake deadlocks after4/7/10 pairs. Production checks actual geometry and remaining pairs, never those stored test routes.

## Input lifecycle

Only finite numeric0<dt<=.25 is admitted. Invalid dt, literal pausedtrue and terminal calls are exact no-ops. Inputs are read from own data descriptors only, without getters or inherited values. Buttons require literaltrue; finite axes clamp[-1,1], dominant magnitude>.5 determines direction, vertical wins ties. Fresh B precedes fresh A, then changed nonneutral direction. Pressed/released claims do not manufacture edges.

Fresh states begin unarmed. Neutral admitted input arms. Changed nonnegative safe cancelEpoch or rising literal cancelled disarms. Held input remains suppressed until a later neutral sample rearms. Cursor, layer and first selection remain intact through cancellation; no latent match, mismatch or layer switch occurs. Holding a button or direction never repeats. Terminal state freezes all fields exactly.
