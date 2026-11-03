# Kaleido Keys / 万花钥匙 — public design

Public specification; implementation and execution evidence are recorded separately. Game45/100; slug `kaleido-keys`; package `com.ecojust.kaleidokeystv`; version0.1.0/code1; seed745; actions2. The paired [model contract](model-contract.md) and [public interface](public-interface.md) are normative. This specification makes no implementation or execution claim.

## Build a small source; see a whole key

Place a limited set of enamel glyphs into six sockets in one wedge of a circular key. Mirrors repeat that source wedge around the circle. Changing symmetry order changes every copy at once, while the six editable sockets and physical inventory remain the same. The workbench shows the source, the whole live key, the whole target key, and an enlarged pair of corresponding inspection wedges. The first target inspects an ordinary sector; the next two inspect reflected sectors. A player must account for exchanged left/right lanes, reversed quarter turns and the actual reflected shape.

Submit only when the complete generated key has the target order, occupied/empty sockets, glyph identities, quarter turns and mirror handedness. Exact discrete semantics decide the result; there is no pixel, outline or angular tolerance. Four rejected submissions end the round. Correct submission wins, including after three rejections. No deadline exists; active elapsed time is informational. The intended human round is about30–90seconds, to be assessed later through ordinary play, not a promise about every player.

## A bounded 3×3 focus board

The source contains three radial rows, inner to outer, and two angular lanes, left to right. A third column contains tools. The nine focus locations are:

| Row | Column0 | Column1 | Column2 |
| --- | --- | --- | --- |
| 0, inner | source slot0 | source slot1 | ORDER |
| 1, middle | source slot2 | source slot3 | GLYPH |
| 2, outer | source slot4 | source slot5 | CHECK |

Directions move focus one cell in this table, clamping at the edge without wrapping. The editable area is explicitly labeled `SOURCE GRID` / 源扇区展开: a logical unrolled grid with inner row above outer row, so screen Up/Down follows the focus table directly. This grid is not a rotated physical wedge. Its glyphs keep ordinary source-frame quarter turns. The actual upward source wedge and physical socket positions remain highlighted in sector0 of the complete live circle. Each occupied editor socket shows the glyph and quarter-turn numeral0–3. Focus begins at row0/column0. The selected palette entry begins at HOOK.

| Focus | A | B |
| --- | --- | --- |
| Empty source socket | Place one selected glyph, at turn0, if stock remains | No edit |
| Occupied source socket | Rotate its existing glyph clockwise90°, modulo four | Remove it and refund one matching glyph |
| ORDER | Next order, 3→4→5→3 | Previous order, 3→5→4→3 |
| GLYPH | Next glyph, HOOK→FLAG→SPROUT→HOOK | Previous glyph |
| CHECK | Submit the whole key | Clear all six source sockets and refund every piece |

An occupied socket never changes glyph type on A; replace it with B then A. Selecting a depleted glyph is allowed, but placing it is blocked without spending a rejection. Rotation uses no stock. Order changes retain every source glyph and turn, the selected palette, focus and rejection count. Clear retains order, selected palette, focus, elapsed time and all rejected-submission records. Only independent host retry recreates the task. B on CHECK has the visibly labeled meaning `CLEAR`; it does not submit and does not reset attempts.

All directions and A/B act on fresh held edges. Holding does not repeat. A changed nonneutral direction is a new edge. Simultaneous priority is B, then A, then direction; all other fresh edges are consumed, not queued. Pause is the separate shared-host control. Keyboard arrows/WASD navigate; Space/Z/Enter is A; X/B is B; P/Escape/START pauses; R/SELECT retries. Set `holdConfirmAsA=true`. The phone's entire right third is split into upper A and lower B touch regions. After start, resume or cancellation, release controls genuinely before pressing again.

Chinese instructions: “在源扇区六个插槽摆放图符，镜面会复制整圈。方向键移动；A 放置或顺时针旋转，B 取回。右侧依次是阶数、图符、验收；在验收格按 B 清空。镜像窗口会左右交换、旋转方向相反。整幅图的阶数、图符和朝向完全一致后验收，四次错误即失败。长按不连动，暂停后先松手。”

## Public geometry and true reflection

World coordinates use x right, y down; the circular key has radius1 and an isotropic display scale. Allowed order `n∈{3,4,5}` means exactly `2n` alternating mirror sectors, each width `α=π/n`. Sector0 is centered upward. Sector j is centered at angle `−π/2+jα`, with boundaries half a sector to either side. Indices run clockwise from0. Order n is a separate required structural property, even if an incomplete or nearly symmetric silhouette looks similar at another n.

Rows have radii `[0.42,0.66,0.90]`. Source lane c=0/1 has angular offset `t=(2c−1)*α/4`. A source socket center is `p=(r*sin(t),−r*cos(t))`. Thus source0 is left of the upward bisector, source1 right. All glyphs have local x right/y down at turn0. Turn q is integer0..3 and applies the clockwise screen rotation `R(qπ/2)` to the local glyph. It is relative to the source's upward frame, not the socket's radial ray. Glyph vertex scale is0.007 world units.

Let `R(a)(x,y)=(cos(a)*x−sin(a)*y,sin(a)*x+cos(a)*y)`, `F(x,y)=(−x,y)`, and `s=1` for even j, `−1` for odd j. Copy j transforms BOTH the socket center and every already-oriented glyph vertex by `Tj=R(jα)*F^(j mod2)`. A source glyph vertex v therefore appears at:

`Tj(p) + 0.007 * R(jα) * F^(j mod2) * R(qπ/2) * v`.

Equivalently bake an ordinary tile and a left/right-mirrored tile for each glyph, choose the mirrored tile iff j is odd, and rotate it by `jα+s*qπ/2`. Merely negating the rotation of an ordinary tile is wrong: odd copies must change chirality. In the inspection frame, which removes the sector's whole `jα` rotation, an even sector keeps lane c and turn q; an odd sector has lane `1−c`, turn `(4−q)%4`, and `mirrored=true`. This formula applies at every order, including odd orders3/5 and even order4. No mirror copy is independently editable.

Public instance x/y/angle outputs round the final result to12 decimal places with `Math.round(value*1e12)/1e12`, normalizing negative zero to zero. Intermediate trigonometry is unrounded. This explicitly bounds displayed coordinate precision across JavaScript engines; winning still uses exact integer/boolean cell semantics, never these display coordinates.

Each glyph consists of the union of these filled polygons; polygon order and vertices are public. Decorative bevels must preserve the silhouette and handedness. The shapes have distinct quarter turns and are not interchangeable rotations.

| Glyph / label | Local polygon vertices `(x,y)` |
| --- | --- |
| `hook` / HOOK / 钩 | `[[-4,-5],[-1,-5],[-1,2],[4,2],[4,5],[-4,5]]` |
| `flag` / FLAG / 旗 | `[[-4,-5],[-2,-5],[-2,5],[-4,5]]`; `[[-2,-5],[5,-2],[-2,1]]` |
| `sprout` / SPROUT / 芽 | `[[-1,-5],[1,-5],[1,5],[-1,5]]`; `[[1,-3],[5,-5],[5,-1],[1,1]]`; `[[0,1],[-4,2],[-4,4],[0,3]]` |

The greatest glyph vertex radius is `sqrt(50)*0.007<0.050`; at the narrowest inner socket, order5, center-to-sector-boundary distance is `0.42*sin(π/20)>0.065`. Thus even rotated glyphs stay inside their sectors. A full key may have up to40 visible glyphs in these tasks, but only three or four physical source pieces.

## Three fixed public target plates

All starts have six empty source sockets. Their initial orders intentionally differ from the target. Inventory entries are physical source-piece counts, not rendered-copy counts. Each task uses the same rules and four-rejection budget. Seed is recorded but does not randomize anything.

| Level / id / English / Chinese | Initial order | Target order | Inspected sector | Inventory HOOK,FLAG,SPROUT |
| --- | --- | --- | --- | --- |
| 0 / `first-rosette` / FIRST ROSETTE / 初见花钥 | 4 | 3 | 0, NORMAL | `[1,1,1]` |
| 1 / `mirror-bloom` / MIRROR BLOOM / 镜中花钥 | 3 | 4 | 1, MIRROR | `[2,1,1]` |
| 2 / `fivefold-crown` / FIVEFOLD CROWN / 五重冠钥 | 4 | 5 | 3, MIRROR | `[1,1,2]` |

The following are the actual six displayed TARGET inspection cells in row-major order. `—` is an empty socket. `glyph:q` gives the depicted quarter turn in that inspection frame. Every occupied cell in sector0 has mirrored=false; every occupied cell in sectors1/3 has mirrored=true. The `MIRROR` badge and the visibly mirrored glyph explain this, independent of color. These are public visible plate descriptions, not a concealed source answer or an action route.

| Task | Inner left0 | Inner right1 | Middle left2 | Middle right3 | Outer left4 | Outer right5 |
| --- | --- | --- | --- | --- | --- | --- |
| first-rosette | hook:0 | — | — | flag:1 | sprout:3 | — |
| mirror-bloom | — | hook:3 | flag:1 | — | sprout:0 | hook:2 |
| fivefold-crown | sprout:1 | flag:2 | — | hook:3 | sprout:2 | — |

The whole target plate is defined uniquely from this visible window. For each occupied window cell `(row,c,glyph,v)`, its implied source cell is `(row,c,glyph,v)` when the inspected sector is even; for an odd sector it is `(row,1−c,glyph,(4−v)%4)`. Apply the published mirror transform to that implied source to populate all target sectors. Empty cells transform as empty cells too. This inverse is a public geometry rule, not a stored hidden solution. Do not ship a separate desired-source vector, prepared action list or solution-loading entry point.

Exact acceptance first requires current n equal target n, then equality of every generated sector/cell's occupancy, glyph, normalized local quarter turn and mirror flag. With equal n the published center geometry also agrees. Judge all `2n×6` cells from freshly generated current source data; never accept just the enlarged window, a rendered image or a cached match badge. Per-window feedback is a helpful current comparison only, never banked progress.

Feasibility follows directly from the visible table: inverse reflection is a bijection on the six sockets, all turns remain legal0..3, and each table uses exactly its inventory. The mirrored glyph geometry is generated rather than purchased. Empty starts fail because each target contains three/four occupied source orbits. Four genuine CHECK/A submissions from a fresh unchanged start therefore give an ordinary loss without fabricated state. Feasibility is not executed-play evidence.

## Art and later acceptance

Use a smooth enamel-and-brass key atelier: dark plum/navy background, warm ivory inset paper, teal glass mirrors, gold socket rims, and coral/teal/lilac glyph identities. Show an illuminated source sector and alternating mirror boundaries on the complete live and target circles. The SOURCE GRID editor and row-major LIVE/TARGET inspection strips must keep the asymmetric glyph silhouettes, lane positions, quarter-turn numerals and NORMAL/MIRROR badges legible. The unrolled editor makes navigation direct; the full live circle shows its true physical wedge and every reflected copy. No automatic pixel-art treatment.

Essential canvas labels use ASCII at least24 logical pixels, with Chinese instructions/results in DOM. Show current/target order, selected glyph stock, all three finite stocks, remaining rejection allowance, focus actions and current inspection differences. Target order and every target window cell remain visible during play. Preserve the shared actual blurred pause/result backdrop. One local atlas can bake the three glyphs and their mirrors, sockets, glass/brass trim and shadows; all runtime art uses shared batched sprites/lines. Aim well below8192 quads and later measure actual calls.

After source acceptance require three ordinary wins and three ordinary four-rejection losses, exact order/occupancy/identity/orientation/mirror checks, both reflection parities at all three orders, finite-stock conservation across order changes and clear, no editable copies, proper retry restoration, edge/cancel/pause/phone regressions, bounded long-run state, original960×540 and1280×720 review, measured calls/frame costs, and signed APK plus actual-play video each strictly below10,000,000bytes. Preserve first failures and complete revisions. No timeout evidence is required because this game has no deadline.
