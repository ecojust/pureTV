# Glass Fold model contract

UMD `PureModel` exposes only `create(seed=1,difficulty=0)`, `step(state,dt,input)`, and `TICK_HZ=60`. All logical geometry is exact integer coordinates on a 4×4 work frame. Every level begins with sixteen colored, double-sided unit-square glass pieces. The entire current board, palette, candidates and target are public; there is no hidden reference fold sequence or completion API.

## Public geometry and color

Canvas size is `width=960,height=540`. `grid={cols:4,rows:4}` uses unit coordinates, not pixels. `view={current:{x:130,y:114,cellSize:64},target:{x:566,y:114,cellSize:64}}` maps unit corners to canvas positions.

- `palette[]`: `{id,rgb:[r,g,b]}` with four pigments. `layerAlpha=.5`, `substrateColor=[246,244,234]` apply equally to current and target panels.
- `pieces[]`: sixteen `{id,pigment,vertices:[{x,y},...four corners],face,movedFolds}`. IDs and pigments never change. Integer reflection changes vertex coordinates and winding, flips `face` between +1/-1, and increments `movedFolds` only for a physically moved piece. Glass has the same pigment on both faces. `movedFolds` is descriptive; the fold limit belongs to the whole mosaic, not sixteen independent material quotas.
- `cells[]`: sixteen row-major `{col,row,layers:[pieceId,...],depth,color,reverseColor}` entries. Layers are ordered **bottom to top**. Empty cells have depth 0 and null colors. `color` and `reverseColor` are RGB integer triples, the latter composited with this stack's order reversed. They contain no target information.
- `target={cells:[{col,row,color:[r,g,b]}],occupiedCount}` is a sparse, fully visible goal. No hidden target stack or piece identity is required. `materialArea=16`, `occupiedArea`, `matchedCells`, `outlineMatches`, and `targetMatched` are derived public metrics.

Each pigment layer uses exactly one-half alpha. Begin with the same opaque substrate RGB. For every layer from bottom to top, apply `Cnew=(Cold+Cpigment)/2`. Accumulate the exact rational number, then round each channel once to the nearest integer (half rounds up). At depth ≤16, numerator/denominator fit safely in JavaScript integers. The renderer uses `cells[].color` / `target.cells[].color` directly for the settled glass centers and must not apply a second alpha blend over wood or add different colored overlays to current/target comparison areas.

Winning compares **exact occupied footprint and visible 8-bit RGB at every occupied cell**. It does not compare material IDs, a prescribed fold sequence, layer count, or an invisible target stack. Different stack histories that genuinely produce the same displayed RGB and outline are valid. Color order still matters because half-alpha composition is noncommutative; there is no color-distance tolerance.

## Creases and selection

`candidates[]` contains twelve `{id,axis,at,movingSide,selectorRow,selectorCol,valid,reason}` entries. `axis` is `x` or `y`; `at` is 1, 2 or 3; `movingSide` is `low` or `high`. The selector is four rows by three columns:

| Row | Operation | Moving half |
| --- | --- | --- |
| 0 | → vertical fold | x < at |
| 1 | ← vertical fold | x ≥ at |
| 2 | ↓ horizontal fold | y < at |
| 3 | ↑ horizontal fold | y ≥ at |

Columns choose crease 1/2/3. `selectedIndex` and `selectedId` identify the current candidate; the initial selection is row 0, column 1 (x=2, low side). Joystick left/right changes the column, up/down changes the row, clamped at the selector edges. Axis choice uses the larger absolute input, horizontal on ties, with .25 deadzone. A new direction acts once immediately, repeats first after 20 ticks, then every 10 ticks. Release/direction change resets that delay. Selection never spends a fold.

## Exact folding and animation

A is edge-triggered and folds the selected half-plane. A fold is valid only if at least one occupied cell remains stationary, at least one occupied cell moves, and every reflected moving cell stays within columns/rows 0…3. Invalid A attempts are free and show a reason; they cannot produce empty/no-op folds or spend a mismatch.

For a moving cell, reflect its index by `col'=2*at-1-col` for x creases, or the same formula for row. Reflect every actual piece vertex using `x'=2*at-x` or `y'=2*at-y`. For each destination, keep its stationary stack in the original order and append the **reversed entire moving stack** above it. Reflection is one-to-one within the moving half, so there is no array-order conflict winner. Total physical piece area remains exactly 16 even though projected occupied area decreases. Vertices never become fractional or get clipped.

Logical geometry updates atomically, then `mode='folding'` for .6 active seconds. `foldAnimation` is public, bounded data:

`{axis,at,movingSide,startedAt,duration:.6,endsAt,progress,beforeCells,beforePieces}`.

The two before-arrays are independent snapshots of actual pre-fold state. Final geometry is the current `cells/pieces`. No target answers are added to animation. To draw an intermediate fold, keep the non-fold axis unchanged and project each moving vertex's fold-axis coordinate as `at+(old-at)*cos(pi*progress)`: the fold collapses to an edge halfway through and reaches the exact mirrored endpoint. Draw stationary before-cells underneath; the moving face may use its public color before the half-turn and reverseColor after it. Settled panels always use the exact final composite RGB. Input selection/A/B during folding is ignored, without queuing an action for the end. The active clock still runs.

## Budget, review and undo

`level` 1…3, `difficulty` 0…2, `levelName`, `foldLimit` 3/3/4, `foldsUsed`, and `foldsRemaining` describe the current construction. `mode` is `editing`, `folding`, or `review`. `phase` is `playing`, `won`, or `lost`.

After the final allowed fold's animation settles, the model automatically reviews the public result. A correct outline/color wins. An incorrect result increments `mismatches` once, increments `reviewCount`, and enters `review`; further A presses are locked and cannot charge repeated failures. `maxMismatches=3`; the third mismatch loses permanently until an ordinary runtime retry. There is no separate submit/score button.

B is an edge-triggered undo in editing or review. It restores the complete pre-fold geometry, layer order, per-piece face/movedFolds, folds-used budget and selected crease from the last successful fold. It pops one bounded history entry, clears the current review lock, and increments `undoCount`. It does **not** restore elapsed time, mismatch count, review count or lifetime action statistics. Undo with no history is free and does nothing. Undo is ignored during animation. In a tick with both B and A edges, B has priority and A is discarded; navigation is processed before the chosen button action. A held button never performs repeated folds/undos. Public `historyDepth` and `canUndo` describe availability; `_history` is internal past geometry, never a solution.

`foldCount` counts lifetime successful folds (including redone folds), `undoCount` counts real undos, and `invalidFolds` counts invalid/locked A requests. `lastAction` describes the latest event. `lastReview` is null or `{at,matched,outlineMatches,matchedCells,mismatches}` and retains the most recent inspection result; undo does not erase the failure ledger. `events[]` resets per step and is capped at 32 entries.

## Time, terminal priority and scoring

`tick`, `elapsed=tick/60`, `timeLimit=90`, `remaining=max(0,90-elapsed)` use active time. The 90-second deadline is checked before animation completion, review or new inputs. A final fold that has not settled before the deadline cannot rescue an expired round. Shared pause/disconnection works by not calling `step`. Cancellation-owned input samples are ignored rather than queued.

During play, `score=matchedCells*100`, recalculated from the actual board, so undo/repeat cannot farm points. Winning adds `1000+floor(remaining)*5+(maxMismatches-mismatches)*100`; losing keeps the current matched-cell score. `lostReason` is null, `mismatches`, or `timeout`. Terminal steps freeze every field. Retry creates independent pieces, cell stacks, candidates, animation and undo history with all starting resources restored.
