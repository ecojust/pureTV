# Parallax Skyline — public design

Status: accepted public design. This specification states the rules; it is not execution or gameplay evidence.

Related specifications: [model contract](model-contract.md) and [public interface](public-interface.md).

## Identity and play

Game 41 is **视差天际 / Parallax Skyline**, slug `parallax-skyline`, package `com.ecojust.parallaxskylinetv`, version `0.1.0` / code 1, seed 741. It is a single-player architectural alignment puzzle. Slide two physical building plates along separate depth rails. A near plate moves twice as far on the projected screen as a far plate. Two fixed observation points expose different overlaps; a front silhouette alone can conceal a wrong far plate.

Both observation panels stay visible. Each has a complete target skyline and one designated roof landmark. A submission succeeds only when **both full silhouettes and both designated landmarks** match. The highlighted observation point changes emphasis, not the physical buildings or the checks used by submission. Four incorrect submissions lose the round. There is no time-limit loss. Intended human rounds are about 30–90 seconds; this is a design target to assess in actual play, not an already measured result.

Three menu tasks use different physical profiles, initial arrangements and targets: COURTYARD / 庭院遮挡 teaches a far building hidden by the near skyline; RIVERFRONT / 河岸交错 interleaves roof heights; TWIN SPIRES / 双塔视差 separates two tall landmarks at the second observation point. They use the same public rules. Each task is one independently restartable puzzle, not three unseen stages within a single win.

## Discoverable controls

- Up/down selects one of three always-visible rows: **NEAR / 近层**, **FAR / 远层**, **VIEW / 视角**. Selection wraps through that order.
- Left/right moves the selected building plate by one world unit. On VIEW, left selects observation 0 and right selects observation 1; this never moves a plate.
- **A / 验收** always submits the complete two-view arrangement. **B / 撤销** restores the full pair of positions from the most recent successful physical move. Undo never refunds a failed submission. View/focus changes do not enter the undo stack.
- Directions are discrete: hold does not repeat a move. Release and press again, or deliberately change direction, for another step. No chord, long press, tilt, hidden gesture or separate phone UI action is required.
- Phone right third is split into full upper A and lower B surfaces. Pause/continue and retry remain independent shared-host controls; they do not consume a submission. Standard keyboard arrows/WASD, Space/Z/Enter for A, X/B for B, P/Escape/START for pause and R/SELECT for retry remain available.

The initial focus is NEAR and the initial highlighted view is 0. The TV continuously shows both physical rail positions, the selected row, undo availability, and four separate check indicators. Label the budget **剩余容错** or **剩余可错次数**: it counts allowed incorrect submissions, and a successful submission does not consume it. Explain the controls in concise Chinese before start and on pause. After a rejected submission, distinguish a silhouette mismatch from an obscured or misplaced landmark. Do not report a front-view match as a win.

## Public board geometry and target data

Every projection has columns `0..19` and integer roof heights `0..6`. There are two plates, indexed NEAR=0 and FAR=1, each with five adjacent local building columns `j=0..4`. The profile arrays below give their heights. World position bounds are near `2..5`, far `4..14`, inclusive. Near scale is 2; far scale is 1. Observation 0 offsets are `[0,0]`; observation 1 offsets are `[-4,-1]`.

For plate `L`, world position `p`, local column `j`, and integer width cell `k=0..scale[L]-1`, its projected cell is:

`u = scale[L] * (p + j) + offset[view][L] + k`, height `profile[L][j]`.

The skyline at each `u` is the maximum of the two plate heights. At an equal nonzero height, NEAR owns the visible roof; empty cells have height 0 and owner -1. All legal projected cells are inside `0..19`; no legal geometry is clipped, wrapped or rounded. Negative camera offsets are real integer subtraction. This is a discrete maquette projection model, not a claim of physically exact perspective rendering.

Each view has exactly one designated landmark. A landmark is attached to a layer and local column; its screen column is the **leftmost** projected cell of that local column (`k=0`) and its height is that profile height. It matches only at the exact target column and height **and when that layer owns the visible roof there**. A far roof hidden by an equally high near roof is not visible and does not match. Target silhouettes alone do not waive this ownership check.

The following arrays each contain all 20 columns, in order. These are complete public target measurements; no target position pair, solution sequence or privileged win flag is shipped.

| Task | NEAR profile | FAR profile | Initial positions `[near,far]` | View 0 landmark `(layer,j,targetU,targetHeight)` | View 1 landmark |
| --- | --- | --- | --- | --- | --- |
| COURTYARD / `courtyard` | `[2,4,5,4,2]` | `[1,3,2,3,1]` | `[5,4]` | `(0,2,10,5)` | `(1,3,11,3)` |
| RIVERFRONT / `riverfront` | `[3,5,3,6,2]` | `[2,4,5,2,4]` | `[2,13]` | `(0,3,14,6)` | `(1,4,9,4)` |
| TWIN SPIRES / `twin-spires` | `[2,6,3,5,4]` | `[4,2,6,3,2]` | `[5,4]` | `(0,1,6,6)` | `(1,2,13,6)` |

- COURTYARD view 0: `[0,0,0,0,0,0,2,2,4,4,5,5,4,4,2,2,0,0,0,0]`
- COURTYARD view 1: `[0,0,2,2,4,4,5,5,4,4,2,3,1,0,0,0,0,0,0,0]`
- RIVERFRONT view 0: `[0,0,0,0,0,0,2,4,5,3,5,5,3,3,6,6,2,2,0,0]`
- RIVERFRONT view 1: `[0,0,0,0,3,3,5,5,3,4,6,6,2,2,0,0,0,0,0,0]`
- TWIN SPIRES view 0: `[0,0,0,0,2,2,6,6,3,3,5,5,4,4,6,3,2,0,0,0]`
- TWIN SPIRES view 1: `[2,2,6,6,3,3,5,5,4,4,0,4,2,6,3,2,0,0,0,0]`

COURTYARD has a concrete legal main-view false placement: positions `[3,8]` match view 0's entire silhouette and near landmark, but not view 1's target. Both positions are reachable from its initial arrangement by ordinary bounded moves. This is a public geometric regression example, not a recorded play, a forged target, or permission to inject that state into ordinary play.

## Art and visibility

Use a warm architectural maquette, not pixel art: ivory/copper near façades, indigo/teal far façades, baked roof highlights, window recesses, subtle material grain and a quiet drafting-table background. Two equal projection panels make both checks assessable at once. Distinguish target outlines from live filled buildings and hollow target landmarks from solid live landmarks. Draw an obscured live landmark with an explicit hidden treatment, never as a falsely visible roof. The near/far identity must remain readable without relying only on color. Camera emphasis, focused control row and selected physical layer are distinct visual states.

At the shared 960×540 logical canvas, use clear numbers and essential ASCII labels of at least 24 logical pixels, with Chinese DOM instructions. Avoid twenty tiny numeric column labels; the grid and roof outlines can communicate geometry. Full-scale 1280×720 and 960×540 original screenshots must establish legibility and no clipping. Static material detail should be baked into one small atlas and batched; actual draw calls and frame costs must later be measured. Exports and browser software rendering do not establish television performance.

## Acceptance before counting

All three tasks need ordinary reachable wins and natural four-rejection losses, model boundary tests, independent public-rule checks, actual keyboard/phone control and cancellation tests, pause/retry checks, original visual review, bounded histories, measured performance, signed APK and decoded actual-play video each below 10,000,000 bytes. Freeze/sign only after candidate acceptance. Publish this individual game before beginning the next. Drafts, mathematical plausibility and synthetic fixtures are not completed games.
