# Packing Sculptor / 异形装箱 — public design

Public specification, before production implementation or execution. Game46/100; `packing-sculptor`; `com.ecojust.packingsculptortv`; version0.1.0/code1; seed746; actions2. This document, [model contract](model-contract.md) and [public interface](public-interface.md) are normative. Static feasibility is not executed-play evidence.

## Pack a shape; preserve a way out

Place every distinct physical polygon into a notched container without positive-area overlap or crossing a wall. Some pieces have an explicit exit stamp. Each stamped piece must be able to translate continuously along one of its listed cardinal directions, keeping its current orientation, through that exact finite door until the entire piece lies outside the container's bounding rectangle. Every other piece remains fixed during that test. Different stamped pieces are checked independently against the same complete packing: there is no sequence of removals that silently opens a route.

This is free packing, not matching a hidden target arrangement. Any complete packing with all required exits clear wins when explicitly submitted. Invalid placement previews cost no rejection. Only a failed CHECK/A submission spends one of four rejections. The fourth failure loses; a correct fourth submission after three failures wins. There is no deadline. Informational active time is bounded; the intended ordinary human round is approximately30–90seconds, to be assessed later rather than asserted here.

## Two visible control modes

The rack lists this task's pieces in the published order, followed by CHECK. Its index is bounded0..pieceCount; there is no wrapping and no disabled extra piece slot. Initial mode is `rack`, index0. In rack mode, Up or Left selects the preceding index; Down or Right selects the following index. An attempted move past an end is blocked. A on a piece enters `place` mode. B on a placed piece returns that exact physical piece to the rack; B on an unplaced piece is blocked. CHECK/A submits and CHECK/B clears all actual placements while retaining rack index, elapsed time, failures and receipts.

Entering placement creates a preview for the currently selected piece. A previously unplaced piece starts at anchor(0,0), turn0. A placed piece starts at its existing anchor and turn. The original placement stays committed while previewing; replacing it is atomic only when A accepts a legal preview. Collision preview excludes that same piece's old footprint, but every other piece stays an obstacle. Show the old footprint as a clearly labeled dim `OLD` outline when it differs from the preview. Do not count old and preview as two inventory pieces.

In place mode, directions move the preview anchor by one cell. Anchor y is clamped0..H−1; x is clamped0..W, where x=W is a visible BACK strip outside the right side. No wrap. Attempting to step beyond these ranges is blocked. Shapes may extend beyond the container even when their anchor is in range; the full shape, not just its anchor, determines validity. A at x<W commits only an inside, nonoverlapping preview, then returns to rack at the same index and sets preview=null. An invalid A is blocked and preserves the preview. A at x=W cancels preview and returns to rack without changing any actual placement. B always rotates the preview clockwise90° modulo4, including while over BACK; rotation may create an invalid red preview and is not automatically reverted. No long press, double click or invisible gesture is needed.

Quarter turns use a normalized bounding-box anchor: rotate the whole polygon clockwise about its local origin, translate its minimum x/y back to zero, then place that normalized polygon at the unchanged anchor. This is not rotation around its center or the television cursor. The precise formula is below. Symmetric pieces still retain the explicit turn0..3 for consistent controls and receipts.

Only fresh A/B/direction edges act. Priority is B>A>direction, consuming all other fresh edges without queueing. Pause/continue/retry are independent shared-host actions. Enter has held-A semantics (`holdConfirmAsA=true`); start/resume/cancel require a genuine neutral release. Phone right third is one continuous upper-A/lower-B split, midpoint belonging to B.

Short Chinese instructions: “把全部零件装入缺角箱体，为标记零件留出直线出口。零件架：方向选择，A 选取，B 取回。摆放：方向移动，A 落定，B 旋转；右侧 BACK 可取消。CHECK 验收，四次错误结束。长按不连动。”

## Exact original polygons

World x increases rightward and y downward. One cell is the closed unit square `[x,x+1]×[y,y+1]`; boundary contacts have zero area and are allowed. Geometry uses the union of the listed filled cells, not their bounding rectangle or total area. The outline vertices below give that same simple polygon, with positive screen-coordinate winding. There are no holes in a piece. Each task includes at most one of each ID.

| ID / English / Chinese | Filled local cells `(x,y)` | Outline vertices `(x,y)` |
| --- | --- | --- |
| `rail` / RAIL / 长轨 | `[[0,0],[1,0],[2,0]]` | `[[0,0],[3,0],[3,1],[0,1]]` |
| `elbow` / ELBOW / 弯角 | `[[0,0],[0,1],[1,1]]` | `[[0,0],[1,0],[1,1],[2,1],[2,2],[0,2]]` |
| `crate` / CRATE / 方块 | `[[0,0],[1,0],[0,1],[1,1]]` | `[[0,0],[2,0],[2,2],[0,2]]` |
| `bar` / BAR / 短条 | `[[0,0],[1,0]]` | `[[0,0],[2,0],[2,1],[0,1]]` |
| `tee` / TEE / 丁板 | `[[0,0],[1,0],[2,0],[1,1]]` | `[[0,0],[3,0],[3,1],[2,1],[2,2],[1,2],[1,1],[0,1]]` |
| `zig` / ZIG / 折板 | `[[0,0],[1,0],[1,1],[2,1]]` | `[[0,0],[2,0],[2,1],[3,1],[3,2],[1,2],[1,1],[0,1]]` |

Cells are the authoritative polygon decomposition; the explicit outline must agree with their union and is supplied for rendering/review. All cells in a piece are unique. Original bounds w/h are one plus the greatest cell x/y. For a cell(x,y), normalized turn q gives:

| q | Rotated cell | Rotated vertex `(u,v)` |
| --- | --- | --- |
| 0 | `(x,y)` | `(u,v)` |
| 1 | `(h−1−y,x)` | `(h−v,u)` |
| 2 | `(w−1−x,h−1−y)` | `(w−u,h−v)` |
| 3 | `(y,w−1−x)` | `(v,w−u)` |

Add the integer anchor to every rotated cell and vertex. Rotated cells are sorted y then x; retain the published outline's vertex order after transformation. Even q has bounds w×h, odd q has h×w. All judging coordinates stay integers. The screen mapping is one isotropic affine scale/translation; visual rounding or antialiasing never changes snap coordinates or collision results. No arbitrary float placement exists. Edge/point contact is accepted exactly; any positive-area penetration is rejected. Thus the requested boundary tolerance is satisfied by exact snapped contact, not by an epsilon that admits a thin wall crossing.

## Three fully public container tasks

A row string contains W cells, left to right; `1` is usable floor and `0` is solid wall/notch. Rows run top to bottom. All cells outside the W×H rectangle are solid except the outward continuation of the particular door being tested. A door is a zero-thickness opening on the stated bounding face. Its two endpoints are frame boundaries: touching an endpoint is allowed, crossing past it with positive area is not. Physical wall thickness beyond this exact floor/exterior rule is not simulated.

Each door descriptor is `{id,direction,start,end}`. Right/left doors use the y interval `[start,end]` on x=W/x=0. Up/down doors use the x interval on y=0/y=H. A requirement is `{pieceId,doorIds}` and lists the only permitted doors/directions for that piece. No unnamed exit is valid, even if another empty gap or another piece's door is nearby.

| Level / id / English / Chinese | W×H and row strings | Piece IDs in rack order | Doors | Requirements |
| --- | --- | --- | --- | --- |
| 0 / `side-hatch` / SIDE HATCH / 侧门小箱 | 5×4; `11110`, `11111`, `11111`, `01111` | rail, elbow, crate, bar | `{id:'east',direction:'right',start:1,end:2}` | rail→[east] |
| 1 / `two-way-crate` / TWO WAY CRATE / 双向货箱 | 5×5; `11111`, `11111`, `01111`, `01111`, `01110` | rail, elbow, crate, bar, tee | `{id:'north',direction:'up',start:1,end:3}`; `{id:'south',direction:'down',start:1,end:4}` | elbow→[north]; rail→[south] |
| 2 / `opposite-dispatch` / OPPOSITE DISPATCH / 对向出库 | 6×5; `011110`, `111111`, `111111`, `111111`, `011110` | rail, elbow, crate, bar, tee, zig | `{id:'east',direction:'right',start:1,end:3}`; `{id:'west',direction:'left',start:3,end:4}` | zig→[east]; rail→[west] |

Every round starts with all pieces unplaced and the entire rack available. Seed is recorded only; these authored tasks never randomize. All containers are connected, irregular simple floor regions; they have18,21,26 usable cells respectively. Required total polygon areas are12,16,20. The spare area is deliberate: packing does not require filling every floor cell, and empty exit corridors matter. Equal available area alone proves neither feasibility nor success.

Static geometric review found complete nonoverlapping arrangements with all required channels clear for each task by reasoning about the visible floor pockets and door widths. This is only a feasibility claim, not ordinary-play evidence. No solved placement vectors, hidden target poses, stored input routes or solution API are supplied in the specification, configuration, production source or pilot.

## Continuous straight extraction, not endpoint sampling

For an actually placed required piece, let loX/loY be minimum occupied cell coordinates, and hiX/hiY be one plus maximum occupied cell coordinates. Its entire polygon lies in `[loX,hiX]×[loY,hiY]`. For a permitted door, use positive displacement D:

- right: `D=W−loX`; translation `(t,0)` for all `0≤t≤D`;
- left: `D=hiX`; translation `(−t,0)`;
- down: `D=H−loY`; translation `(0,t)`;
- up: `D=hiY`; translation `(0,−t)`.

At t=D the whole polygon is outside the open bounding rectangle; its nearest edge may touch the named outer face. D is an exact finite integer, not a search timeout. No rotation is allowed while extracting. A placed valid piece always has D>0.

The door fits only if the piece's entire orthogonal span lies within its aperture: for left/right, `start≤loY` and `hiY≤end`; for up/down, `start≤loX` and `hiX≤end`. A narrow door cannot be bypassed by starting near a corner or clipping the jamb. Outside the bounding rectangle the only allowed space for this test is this door's straight outward half-infinite strip, including its boundary. Other exterior locations and all other doors are closed for this test.

For each occupied unit square, its exact continuous swept set is a rectangle:

| Direction | Sweep of cell `(x,y)` |
| --- | --- |
| right | `[x,x+1+D]×[y,y+1]` |
| left | `[x−D,x+1]×[y,y+1]` |
| down | `[x,x+1]×[y,y+1+D]` |
| up | `[x,x+1]×[y−D,y+1]` |

Take the union of those rectangles. A positive-area intersection occurs between rectangles A/B exactly when `max(A.minX,B.minX)<min(A.maxX,B.maxX)` AND the corresponding strict y inequality. Reject if this swept union intersects any zero floor cell inside the bounding rectangle, or any cell of another placed piece. Door fit plus this interior-wall test ensures the entire sweep remains in floor or the specified exterior strip. The tested piece's own starting cells are not obstacles; every other piece, including another required piece, is fixed and remains an obstacle. No gap is inferred from endpoint positions and no sampled time step substitutes for the swept union. Testing integer translations can only be used if explicitly derived as this exact unit-cell swept union, never as approximate samples.

An unplaced required piece has no exit option geometry and cannot exit. An invalid packing cannot win even if some extraction option seems clear. For each required piece, at least one explicitly listed option must be clear; these tasks list one each. Full acceptance is: every listed unique piece placed exactly once, each polygon contained in floor, no positive-area pair overlap, and every required piece has a clear permitted full extraction. Recompute all of this from actual placements on each CHECK. Preview, cached green badges, occupied area, a moved anchor or an unrelated doorway never decide acceptance.

## Presentation and later acceptance

Use a polished packing bench: navy work surface, warm cut-metal/wood tray walls, beveled anodized pieces with distinct coral/teal/gold/violet/blue/cream identities, crisp dark outlines and etched ID/turn marks. Bake local highlights/shadows once into a compact atlas; use batched sprites/rectangles/lines afterward. Show polygon outlines and interior silhouette clearly instead of drawing every part as a plain bounding rectangle. The irregular walls, exact door spans, outward arrows and required-piece stamps must be legible without color alone. No automatic pixel-art style.

The main box dominates the canvas. Rack cards show original shape, piece ID, placed/in-rack status and exit stamp. In place mode draw a translucent full-shape ghost, an unambiguous top-left anchor mark, turn0..3, validity and the visible BACK strip. A placed piece's old pose is a dim labeled outline, not a second solid piece. Show each required exit as `CLEAR`, `BLOCKED` or `UNPLACED`, with a distinct arrow and optionally a temporary swept-corridor overlay. Show current selected focus actions, placed/total pieces and remaining rejection allowance. There is no target silhouette or hidden-answer overlay.

Essential ASCII canvas text is at least24 logical pixels. Chinese rules/HUD/results use the shared DOM. Keep the shared actual blurred menu/pause/result backdrop. Review complete original960×540 and1280×720 images, ordinary start/play/win/loss, invalid ghosts, exact touches, a truly blocked exit and a truly clear one. Target one atlas and fewer than8192 quads, then measure real WebGL submissions and observer intervals instead of assuming device FPS.

Later acceptance requires three ordinary wins and three natural empty-rack four-CHECK losses; exact nonconvex geometry and rotations; wall/corner touch vs positive overlap; ghost cancellation and atomic replacement; every door/forbidden direction; full swept blocking even when endpoints are clear; fixed other-piece semantics; all-pieces requirement independent of area; last-allowance win and fourth-failure loss; bounded input/timing/receipts; controller/pause/retry regressions; original visual review; and signed APK plus actual-play MP4 each strictly below10,000,000bytes. Preserve first failures and complete revisions. No physical device claim follows from this document.
