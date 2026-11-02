# Cable Unweaver / 解线工 — public design

Status: accepted public rules for game43; not implementation or execution evidence. Slug `cable-unweaver`, package `com.ecojust.cableunweavertv`, version0.1.0/code1, seed743, actions2. Root and public peers reviewed these rules before implementation.

## The cable workbench

Slide cable terminals along their marked rails until the straight cable segments have no illegal intersections. Some terminals belong to a rigid clamp: moving either member translates the entire clamp by the same amount, preserving its offsets. Fixed wall anchors cannot move. This is a constrained graph-embedding puzzle, with actual endpoint movement, segment intersections and linked rail limits; there is no lighting, shadow projection, rotation or area coverage from game42.

A selects the next movable terminal; B selects the previous one, cyclically in the visible a,b,c order. Selection is free. A direction parallel to the selected rail requests one unit of movement: left/right on horizontal rails, up/down on vertical rails. Orthogonal directions do nothing. The whole selected group moves or stops together; a member cannot stretch away from the clamp. Each nonzero physical move consumes one adjustment; a blocked zero move consumes none. Held inputs do not repeat. There is no undo, submit or time deadline. The phone's entire right third is split into upper A and lower B regions.

Only the resulting discrete placement is judged; cable sweeps between positions are not simulated. Crossing cables and temporarily coincident terminals may remain on the board while being repaired: they do not block a legal rail move or cause immediate loss. After each actual move, freshly check the complete layout. Valid geometry wins immediately, including on the last adjustment; otherwise budget exhaustion loses. Initial state, selection, blocked/orthogonal input and neutral input do not settle a round.

Chinese instructions: “A 下一个端子，B 上一个端子；方向沿轨道移动。带金属夹的端子整组联动。消除所有非法线交叉与端子重合；每次实际移动用一次调整，合格立即完成。”

## Coordinates, rails and rigid groups

World coordinates are integer x right, y down on a workbench `x=-2..10`, `y=0..10`. Every movable terminal has an axis `x` or `y`, a fixed perpendicular coordinate, inclusive integer rail min/max, a group index and an integer offset. A group has one canonical integer position q. Its member's varying coordinate is `q+offset`; its perpendicular coordinate stays fixed. All members of a group must have parallel rails, so one shared translation preserves their full two-dimensional relative vectors. Mixed-axis groups are forbidden configuration.

The group's admissible position interval is `[max(member.min-member.offset), min(member.max-member.offset)]`. For a requested signed step r=−1 or+1, intersect every member's allowable displacement intervals `[min-current,max-current]` and clamp r once to this common interval. Apply that one delta uniformly to every member. Current legal integer positions make the actual delta either r or0. Never independently clamp members or charge a blocked zero displacement. The selected terminal may still have spare rail length when a different member stops the whole group.

Each cable is the closed straight segment between its two node IDs. Fixed anchors and movable terminals are all graph nodes. Graph IDs, not merely equal coordinates, identify a shared endpoint. Configuration has no self-edge or duplicate unordered endpoint pair; all authored legal placements have nonzero cable length, but a zero-length edge is explicitly invalid if encountered by a labeled mathematical/invalid-state check. Different nodes at the same coordinate are invalid even when their connected segments only meet at that coordinate.

## Exact intersection truth table

| Relation between two nonzero cable segments | Illegal? |
| --- | --- |
| Disjoint closed segments | No |
| Single intersection at their common graph node ID, with no positive-length overlap | No |
| Proper interior crossing | Yes, `cross` |
| Endpoint touching another segment's interior (T contact) | Yes, `touch` |
| Distinct node IDs touching at the same coordinate, including collinear single-point contact | Yes, `touch` |
| Positive-length collinear overlap, even when the edges share a graph node | Yes, `overlap` |

For integer points use exact orientation `orient(A,B,C)=(Bx-Ax)*(Cy-Ay)-(By-Ay)*(Cx-Ax)`, inclusive endpoint bounding boxes and integer sign comparisons, with no epsilon. If both segments are collinear, intersect their closed intervals on x when the first segment is nonvertical, otherwise y: empty interval is disjoint, positive-length interval is always illegal overlap, and a single-point interval uses the shared-ID exemption above. Otherwise the standard closed-segment orientation/on-segment test decides whether they meet; a shared-ID point alone is legal. A crossing with all four orientations nonzero is `cross`; any other unexempted point meeting is `touch`.

Count unordered conflicting edge pairs, not unique geometric intersection points. Three wires meeting at one unshared crossing can produce three conflict pairs. A pair with a zero-length edge is omitted from this nonzero-segment classification, but the separate zero-length validity check prevents a false win. Independently count coincident pairs of distinct graph nodes. Win requires zero conflicting edge pairs, zero coincident node pairs, zero zero-length edges and every movable terminal on its legal integer rail. Rigid offsets are preserved by the canonical representation; guide alignment is not a victory condition.

Conflict markers may have rational coordinates although all terminals are integer. For nonparallel lines set `r=B-A`, `s=D-C`, `den=cross(r,s)`, `tNum=cross(C-A,s)`; the exact point is `((Ax*den+rx*tNum)/den,(Ay*den+ry*tNum)/den)`. Make den positive and divide both numerators and den by their joint positive gcd. Publish `{xNum,yNum,den}`; rendering may divide to pixels, but qualification never uses that division. A touch has denominator1. Overlap endpoints are existing integer endpoints of the collinear intersection, sorted lexicographically. Coordinate differences are at most12, determinants at most288 in absolute value and unreduced point numerators below10000, safely exact JavaScript integers.

## Three public tasks

Fixed nodes are listed first, followed by movable terminals a,b,c. Cable IDs e0,e1,e2 follow the edge order below. In rail notation `y@10 [1,9]` means the terminal varies in y on the vertical rail x=10, inclusive min1/max9. Group descriptors are `{id,initial,guideNode}`; terminal descriptors are `{id,group,offset,rail:{axis,fixed,min,max}}`. Group indices follow the stated group order. `guideNode` is an actual visible fixed anchor, not a stored solution position.

| Level / id / labels | Fixed anchors | Groups in index order | Budget |
| --- | --- | --- | --- |
| 0 / `straight-rack` / `STRAIGHT RACK` / 直排接线 | P=(0,2), Q=(0,5), R=(0,8) | ga: initial8, guideP; gb: initial5, guideQ; gc: initial2, guideR | 18 |
| 1 / `coupled-fan` / `COUPLED FAN` / 联动分线 | H=(0,3), K=(0,8) | gAB: initial6, guideH; gC: initial2, guideK | 16 |
| 2 / `staggered-clamp` / `STAGGERED CLAMP` / 错层线夹 | H=(0,0), K=(8,0) | gAB: initial3, guideH; gC: initial−1, guideK | 16 |

| Task | Terminal a | Terminal b | Terminal c | Edges e0,e1,e2 |
| --- | --- | --- | --- | --- |
| 0 | group0, offset0, y@10 [1,9] | group1, offset0, y@10 [1,9] | group2, offset0, y@10 [1,9] | P→a, Q→b, R→c |
| 1 | group0, offset0, y@10 [1,8] | group0, offset2, y@10 [3,9] | group1, offset0, y@10 [1,9] | H→a, H→b, K→c |
| 2 | group0, offset0, x@6 [−2,4] | group0, offset2, x@10 [0,7] | group1, offset0, x@10 [−1,9] | H→a, H→b, K→c |

Task0 initial coordinates are a=(10,8), b=(10,5), c=(10,2); all three edge pairs cross at (5,5). Initial conflict count3. Each independent group's feasible range is [1,9]. Fixed left-anchor order is visibly opposite the right-terminal order.

Task1 initial coordinates are a=(10,6), b=(10,8), c=(10,2). Only e0/e2 and e1/e2 conflict, at `(50/9,14/3)` and `(50/11,58/11)` respectively. e0/e1 legally share H and have no other contact. Initial conflict count2. Group gAB's range is [1,7], restricted at the upper end by b although a could individually reach8; gC's range is [1,9].

Task2 initial coordinates are a=(3,6), b=(5,10), c=(−1,10). e0/e1 overlap from H=(0,0) to a=(3,6), despite sharing H; e0/e2 and e1/e2 cross at `(20/7,40/7)`. Initial conflict count3. gAB's range is [−2,4], restricted at the upper end by a even though b can individually reach7; gC's range is [−1,9]. This task changes rail orientation and uses a genuine two-rail rigid clamp and illegal collinear overlap.

All three starts have zero coincident node pairs, zero zero-length edges and valid rails. A coincident-node count may become positive during ordinary repair; it makes the current layout invalid without blocking the next move. Every task is one independent round, selected at the menu; retry restores its original full state.

## Visible hints and hand-verifiable feasibility

Each fixed guide anchor projects a faint alignment line toward the corresponding rail or clamp. For a single-terminal group, compare the terminal's varying coordinate with the guide anchor's coordinate on that same axis. For a rigid group, use the arithmetic mean of its members' varying coordinates, marked by a physical center tick on the metal clamp. Show that current center, the referenced anchor coordinate and the signed gap; color and label identify which hub belongs to which clamp. The rails, stops, group brace and these fixed-anchor cues are visible to the player. Guides are not cables and use a visibly different thin dashed style.

The guide error can be computed without fractions: sum all member varying coordinates minus `memberCount*guideAnchorAxisCoordinate`. A positive error asks for an up/left move, a negative error for down/right; zero means that guide is aligned. An ordinary pilot may select the first currently unaligned group, move one step toward its visible guide and inspect the fresh feedback. It must stop at any earlier actual win. It may not enumerate placements, simulate future crossings, look up fixture answers, inject state or replay a hidden action route. The configuration contains no target group-position vector or solution script.

Hand check: for task0, aligning each visible anchor row makes three separated horizontal wires, with at most12 physical moves from the start. For task1, the rigid pair straddles H's row one unit above/below, and the independent wire aligns with K's lower row; their only shared contact is H. Full guide alignment needs at most10 moves and lies within both member rails. For task2, the rigid pair straddles H's column one unit left/right on rows6 and10, while the independent wire aligns vertically with K at x=8; the H fan is separated from that wire, and full guide alignment takes at most13 moves. All bounds fit their budgets, and no guide is a hidden extra win condition.

A public natural-loss policy leaves all other groups at their initial positions and alternates +1/−1 along the first group's axis until budget expires. In task0, a alternates8/9 while b5 and c2 retain an inverted fixed-anchor order, so e1/e2 always cross. In task1, gAB alternates6/7 while c remains2, smaller than both fan-terminal coordinates, so both fan wires continue crossing K→c. In task2, gAB alternates3/4 while c remains−1, and K→c crosses both H wires in either placement. These are ordinary legal moves, not blocked moves or fabricated loss states.

## Art direction

Use an overhead terminal rack on a dark brushed-metal cable bench: smooth colored straight wires with rounded caps, detailed screw terminals, clean ticked rails and visibly mechanical rigid clamps. Rails, rigid braces and alignment guides are mechanical/visual aids, not cable edges, and never enter intersection counts. Keep cables straight in the judged plane; no decorative bridges or curves may imply crossings are already solved. Render actual public conflict locations or overlap extents, not a second intersection simulation. Shared hub contacts use ordinary joint styling; illegal contacts are highlighted. Show edge-pair conflicts separately from terminal coincidence and rail/length validity. Use one atlas and existing batched line/sprite drawing; avoid a forced pixel-art style. A readable ordinary recording should take roughly30–90seconds, with video and APK each strictly below10,000,000 bytes; these are targets, not measured claims.
