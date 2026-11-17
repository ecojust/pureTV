# Shadow Foundry / 影形铸坊 — public design

This public design defines game 42. Slug `shadow-foundry`, package `com.ecojust.shadowfoundrytv`, version `0.1.0` / code `1`, default seed `742`, two action regions. The [model contract](model-contract.md) and [public interface](public-interface.md) specify its implementation and evidence requirements; these rules are not execution evidence.

## Play and identity

Rotate a small metal workpiece and its directional side light until its actual ground shadow covers the cyan target cells without entering the amber forbidden cells. The workpiece is three grounded, opaque unit-square prisms with different heights; changing the light projects the real top vertices onto the floor. This differs from game 41's two-view building profiles and Shadow Shutter's moving paper photography: there are no depth-scaled profile plates, moving actors, photographs or framing windows.

Up or left selects **WORK**; down or right selects **LIGHT**. These are absolute selections, not repeated navigation. A rotates the selected item clockwise; B rotates it counterclockwise. Workpiece steps are 90 degrees and lamp compass steps are 45 degrees. Every rotation costs one of 12 adjustments; selection costs nothing. Long holds do not repeat. There is no submit, undo, refund or timed deadline. After every rotation, freshly computed target/forbidden checks win immediately if both pass, including the twelfth rotation; otherwise the twelfth rotation loses.

The phone's entire right third is split into upper A / lower B regions. Show focus, current workpiece bearing, lamp source compass sector, target hit count and required count, forbidden hit count and permitted count, and remaining adjustments. The target and forbidden conditions remain separately visible. Chinese instructions: “上下或左右选择工件／灯光；A 顺时针，B 逆时针。覆盖全部青色目标格，避开琥珀色禁区。每次旋转消耗一次调整，合格立即完成。”

## Exact public geometry

World coordinates are x east/right, y south/down, z upward. The finite board comprises the 169 unit cells whose integer centers have x,y in `[-6,6]`. Count a cell if its **center** belongs to the closed shadow projection. These are sampled coverage counts, not continuous polygon areas or percentage-of-cell coverage. Board-exterior shadow receives no count; no polygon wraps or clamps to the board. Target and forbidden lists contain distinct in-board centers and are disjoint.

A prism descriptor is `{center:[localX,localY],height:h}`. Its square footprint extends one half unit from its center on each horizontal axis, from ground z=0 to z=h. All three prisms rotate rigidly about the task pivot. With yaw `q=0,1,2,3`, apply the quarter-turn `R(x,y)=(-y,x)` q times, then add pivot. This is clockwise when looking down at an x-right/y-down board. Every footprint remains axis-aligned at these discrete bearings; all original corner vertices undergo the same rotation.

Lamp indices clockwise from east are `0:E [1,0]`, `1:SE [1,1]`, `2:S [0,1]`, `3:SW [-1,1]`, `4:W [-1,0]`, `5:NW [-1,-1]`, `6:N [0,-1]`, `7:NE [1,-1]`. These vectors d describe the horizontal direction **toward the source per unit height**. Ray travel is `[-dx,-dy,-1]`; ground projection of `(x,y,z)` is `(x-z*dx,y-z*dy)`. Thus light from east casts west, light from north casts south. Integer diagonal directions deliberately have a different elevation from cardinal directions: their horizontal displacement per height is √2, not 1. Do not label the lamp a constant-elevation orbit or a finite point source.

For each prism, project all four bottom and all four top corners and take their convex hull. The bottom footprint belongs to the shadow. Use doubled coordinates: ground corners are `[2*cx±1,2*cy±1]`; projected top corners subtract `[2*h*dx,2*h*dy]`. Hull vertices and center-test points `[2*x,2*y]` are exact integers. Canonical hulls remove duplicate and collinear interior vertices, start at the lexicographically smallest `(x,y)` vertex, follow positive-cross-product order, and omit a repeated closing vertex. A center on any hull edge is inside. No epsilon is used.

Sample each board center against the three closed hulls and OR the results. A cell shadowed by two or three prisms counts once. Intersect this unique union independently with target and forbidden sets. Success means `targetHits >= requiredTargetHits` AND `forbiddenHits <= maxForbiddenHits`; no total-shadow-size or guide-marker shortcut is allowed. All three tasks require every target cell and permit zero forbidden cells.

## Three finite public tasks

All coordinates below are world cell centers except the explicitly local prism centers. Lists are ordered by y, then x. Every task has `budget:12`, `maxForbiddenHits:0`. `initialYaw` and `initialLamp` are ordinary starting values, not a saved continuation. A round contains one selected task; retry starts it over and the menu selects a different task.

| Level / id / labels | Pivot | Local prisms in index order `(x,y,height)` | Initial yaw/lamp | Foot prism / light prism | Guide foot / guide tip | Required target hits |
| --- | --- | --- | --- | --- | --- | --- |
| 0 / `west-cast` / `WEST CAST` / 西光落影 | `[0,0]` | `(0,0,3),(1,0,1),(1,1,2)` | `2 / 0` | `2 / 0` | `[1,1] / [3,0]` | 7 |
| 1 / `north-cast` / `NORTH CAST` / 北光长脊 | `[-1,0]` | `(0,0,2),(1,0,3),(0,1,1)` | `3 / 2` | `2 / 1` | `[-2,0] / [-1,4]` | 7 |
| 2 / `diagonal-pour` / `DIAGONAL POUR` / 斜光交叠 | `[0,1]` | `(0,0,3),(1,0,1),(1,1,2)` | `1 / 7` | `2 / 0` | `[1,0] / [3,-2]` | 11 |

Task 0 target cells: `[[0,0],[1,0],[2,0],[3,0],[1,1],[2,1],[3,1]]`.

Task 0 forbidden cells: `[[0,-1],[1,-1],[2,-1],[3,-1],[-3,0],[-2,0],[-1,0]]`.

Task 1 target cells: `[[-2,0],[-1,0],[-2,1],[-1,1],[-1,2],[-1,3],[-1,4]]`.

Task 1 forbidden cells: `[[-3,-1],[-2,-1],[-1,-1],[0,0],[0,1],[0,2]]`.

Task 2 target cells: `[[2,-2],[3,-2],[0,-1],[1,-1],[2,-1],[3,-1],[0,0],[1,0],[2,0],[0,1],[1,1]]`.

Task 2 forbidden cells: `[[-2,1],[-1,1],[-2,2],[-1,2],[0,2],[1,2]]`.

## Visible calibration and hand checks

Each blueprint has an engraved hollow registration dot `guideFoot` and a hollow tall-post shadow-tip pin `guideTip`. Show their actual counterparts: the designated foot prism's world center, and the ground projection of the designated light prism's top center. Also show that tall prism's center, height and a ray joining its top to the projected tip. Use distinct shapes and a legend so neither guide is mistaken for an extra target cell. The clues remain visible on both the workbench and an unobstructed plan view. They are workshop aids only; neither guide equality is a victory condition.

An ordinary public-feedback player can first rotate WORK until the marked foot meets its hollow registration dot. The noncentral marked local vector uniquely selects one of four yaw bearings. Then the displayed tall-post center and desired tip give `d=(center-guideTip)/height`, directly identifying one of the eight public lamp sectors. Rotate LIGHT toward that sector using the shown compass; observe the actual coverage after every action. This uses visible current geometry and clues, not a hidden target pose, enumerated future states or searched action route. No configuration field stores a goal yaw/lamp pair.

Hand check task 0: aligning the foot places the tall prism at `(0,0)` and the height-two prism at `(1,1)`; the tip `(3,0)` specifies source west. Their eastward shadows cover row y=0 at x=0..3 and row y=1 at x=1..3. Individual prism counts are 4,2,3, but their union is 7, with 7 target hits and 0 forbidden hits.

Hand check task 1: the registered centers become `(-1,0),(-1,1),(-2,0)` with heights 2,3,1. The tall tip `(-1,4)` specifies source north. Union coverage is column x=-1 at y=0..4 plus column x=-2 at y=0..1: 7 target hits and 0 forbidden hits despite individual counts 3,4,2.

Hand check task 2: registration gives centers `(0,1),(0,0),(1,0)` with heights 3,1,2. The tall tip `(3,-2)` specifies source southwest, casting northeast. A unit prism centered c with height h casting diagonally along s has center samples `c+k*s` for k=0..h plus `c+(k*sx,(k-1)*sy)` and `c+((k-1)*sx,k*sy)` for k=1..h; the latter lie on included hull boundaries. Thus an unclipped cardinal prism covers h+1 centers, while a diagonal prism covers 3h+1. Here prism 0 contributes 10 cells, prism 1 adds only `(0,-1)`, and prism 2 adds none. The union is the listed 11 targets and hits no forbidden cell; summing individual 10+4+7 would be wrong.

Initial `(union,target,forbidden)` counts are respectively `(7,1,3)`, `(7,1,2)`, `(11,1,4)`. Thus every round begins invalid; task 0 even has the same total shadow count before and after success. Each visible-guide alignment needs at most six rotations from its stated start, leaving time to inspect intermediate effects. A natural loss is achievable by spending all 12 rotations on WORK while retaining the initial lamp: each task has a far target cell unreachable with that initial source direction. This is a public geometric observation, not an alternative starting state or a private solution script.

## Presentation intent

Use a warm industrial workbench, smooth beveled metal prisms, restrained baked surface detail and cool/amber floor inlays. Three low-poly height sprites share one atlas and the existing batch. Draw each sampled shadow cell once, with smooth isometric diamond tiles and actual public hull outlines; do not claim a filled continuous-shadow-area measurement. Keep a complete top-down coverage panel visible beside the physical scene so tall prisms cannot hide judged cells. No forced pixel-art treatment. Aim for a readable 30–90 second genuine recording including menu, clues, deliberate adjustments and actual result; this is an acceptance target, not a claimed measured runtime.
