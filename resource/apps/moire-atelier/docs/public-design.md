# Moiré Atelier / 纹幕校准 — public design

Status: accepted public rules; implementation and verification pending. Game44/100, slug `moire-atelier`, package `com.ecojust.moireateliertv`, version0.1.0/code1, seed744, actions2. Read the paired [model contract](model-contract.md) and [public interface](public-interface.md). Root reviewed the24/25 fine-mask rules before implementation; preserved draft versions and exact changes remain in the development evidence archive.

## An optical calibration bench

Slide and rotate two fine periodic transmission masks on one square light table. Their actual transmission multiplies: wherever either mask is dark, the overlap darkens. Nearby stripe pitches create moving bands as the masks slide and turn. Five fixed probes each have a different public target measurement. Only a single submitted arrangement in which **all five current brightness readings** are within tolerance wins. Matching probes at separate times never accumulates progress. Guide alignment is useful but neither a separate win condition nor a bypass of the optical checks.

Left/right slides the selected mask toward the negative/positive normal, visually left/right throughout the legal angle range. Left increases phase by1/24 turn; Right decreases it by1/24, wrapping through all24 detents. This follows the positive phase term in the optical equation: increasing phase moves a stripe crest toward negative coordinates. Up/down rotates its normal counterclockwise/clockwise by3°, bounded from−12° to+12°. **B switches MASK1/MASK2**. **A submits the current pair together**. All commands use held edges: holding does not repeat; release and press again, or deliberately change direction, for a new adjustment. Priority for simultaneous fresh commands is B, then A, then direction; other fresh edges are consumed. A+B switches once, without submitting. No undo, drag gesture or private phone action exists.

Each round has90 active simulation seconds and permits four incorrect submissions. A correct submission wins without using a rejection allowance. The fourth incorrect submission loses. Reaching the deadline loses before any command from that same model call is applied, including an otherwise correct submission. A correct-looking board remains in play until A is accepted before the deadline. Pause/continue and retry are independent shared-host controls. Pause freezes the model; retry recreates the entire original task, timer, gate and counters. Intended human rounds are30–90seconds; this is a design target requiring actual later observation.

The phone's whole right third is split into upper A / lower B touch regions. Keyboard arrows/WASD adjust; Space/Z/Enter submit; X/B switches; P/Escape/START pauses; R/SELECT retries. Use holdConfirmAsA=true so Enter shares the held-edge rule. Chinese instructions: “左右滑动条纹，上下旋转当前膜；B 切换两层，A 同时验收五个测点。先对齐参考方向，再把亮纹移到标针。所有实测亮度进入目标范围才合格；90秒或四次错误验收后结束。长按不连动，暂停后先松手。”

## One coordinate system and one optical law

The light table is `x,y∈[−0.5,0.5]`, with x right and y down. Render it isotropically: one world unit has the same pixel length on both axes. Each layer L has frequency fL, phase pL and normal nL. Frequencies are `[24,25]` cycles/world-unit, creating fine individual stripes with a low-frequency beat when nearly parallel. Canonical controls are integer `phaseTick∈[0,23]` and `angleTick∈[−4,4]`; p=phaseTick/24, θ=angleTick×π/60, n=(cosθ,sinθ), and stripe tangent=(-sinθ,cosθ). Positive θ turns clockwise in this y-down world. Rotation is about the world origin; do not rotate probes or use screen coordinates in the sampler.

For any world point P=(x,y):

`uL(P)=fL*(nL.x*x+nL.y*y)+pL`

`wrap(u)=u−floor(u)`; `T(u)=(1+cos(2π*wrap(u)))/2`

`brightness(P)=T(u0(P))*T(u1(P))`.

The target is the physical product of two sinusoidal masks, not a beat-envelope approximation or sum. Phase wrapping changes only representation: values immediately on either side of a whole cycle converge to the same transmission. The renderer and logical probes use this exact same law and world coordinates. Texture interpolation is an ordinary display raster approximation, not a second judging formula. Every displayed live probe swatch and percentage derives from the exact public sampler; rounding percentages never affects acceptance.

A probe matches when `abs(currentBrightness-targetBrightness)<=0.035`, inclusive, without any extra epsilon. All five checks are recomputed together on A from canonical controls. The target phases at a probe are public reference measurements, not additional predicates: different arrangements producing the accepted brightnesses are valid.

## Visible reference geometry

Each layer has a fixed, visible pair of physical fiducials P and Q. The line P→Q shows the desired **stripe tangent**, and P is the crest pin where a bright stripe should pass. The reference normal is `(dy,−dx)/hypot(dx,dy)` for D=Q−P; all authored segments have dy>0. The renderer shows the fixed dashed reference, actual stripe orientation, the crest pin, and current signed TURN and SLIDE errors for the selected layer. Keep these registration aids identifiable as bench markings, separate from the five brightness probes.

The signed turn error is atan2(cross(referenceNormal,currentNormal),dot(referenceNormal,currentNormal)), in degrees. Positive means the current normal is too clockwise: use Up; negative means use Down. The signed crest error is `centerWrap(uL(P))`, where centerWrap(v)=wrap(v+0.5)−0.5 in[−0.5,0.5). Positive asks for Right, negative for Left. Show it in phase detents by multiplying by24. At the exact half-cycle tie, this convention chooses Left. First correct the direction, then the crest; rotating changes the crest reading. Display current angle and phase detent as well as these errors. Guide “aligned” display uses absolute error≤1e−9 (degrees for turn, cycles for crest), solely to suppress floating noise in guide text.

An ordinary player/pilot can choose a layer whose visible turn error is nonzero, rotate one detent toward its reference, inspect the updated cue, then slide one detent toward its crest. Switch layers with B as needed. Submit when all five real probe indicators pass. This uses only currently visible measurements. Do not enumerate future states, test hypothetical arrangements, import a private solver, read a desired control vector or replay a stored action route. No target layer-angle/phase vector is shipped; only fixed public fiducial geometry, initial controls and local probe target measurements exist.

## Three authored tasks

Let c3=cos(π/60), s3=sin(π/60), c6=cos(π/30), s6=sin(π/30). Each listed Q equals P plus the listed tangent vector D; D has length0.36. These expressions define exact public geometry in ordinary JavaScript double arithmetic, not concealed author-only data.

| Level / id / labels | Initial layers `[phaseTick,angleTick]` | MASK1 P and D | MASK2 P and D |
| --- | --- | --- | --- |
| 0 / `parallel-light` / `PARALLEL LIGHT` / 平行光纹 | `[[6,-2],[18,2]]` | P=(0,0), D=(0,0.36) | P=(0,0), D=(0,0.36) |
| 1 / `crossed-silk` / `CROSSED SILK` / 交织细幕 | `[[2,-1],[22,1]]` | P=(c3/192,s3/192), D=(−0.36*s3,0.36*c3) | P=(−c3/150,s3/150), D=(0.36*s3,0.36*c3) |
| 2 / `oblique-study` / `OBLIQUE STUDY` / 斜光习作 | `[[12,-2],[10,2]]` | P=(−c6/96,−s6/96), D=(−0.36*s6,0.36*c6) | P=(c6/75,−s6/75), D=(0.36*s6,0.36*c6) |

Each task has five noncollinear probes in this order. C is always the central probe; numbers1–4 name the others.

| Task | C | 1 | 2 | 3 | 4 |
| --- | --- | --- | --- | --- | --- |
| parallel-light | (0,0) | (−3/8,−1/4) | (−1/96,1/4) | (13/48,−0.22) | (5/24,0.26) |
| crossed-silk | (0,0) | (−0.34,−0.25) | (−0.20,0.28) | (0.16,−0.30) | (0.34,0.24) |
| oblique-study | (0,0) | (−0.32,−0.28) | (−0.27,0.25) | (0.25,−0.25) | (0.32,0.29) |

The calibration card is authored directly from those public reference fiducials. For each probe X and layer L, let `rL(X)=fL*dot(referenceNormalL,X−PL)`. Its public targetPhases are `[wrap(r0),wrap(r1)]`; targetBrightness is `T(r0)*T(r1)`. These exact expressions define the immutable numeric target fields. Derive them once from reference geometry, independently of initial/current controls. There is no stored reference control placement. All task data, including the target measurements, are public; no target is revised after play starts.

Hand checks establish feasibility without a hidden route. Each reference normal corresponds to a legal3° angular detent. Its pin displacement is an integer multiple of1/24 of that mask's period along its normal, so a legal wrapped phase detent puts the bright crest on the pin. When both guides align, `uL(X)` differs from `rL(X)` by an integer at every X, so all five probe targets match under the exact same periodic law. These alignments require at most20 actual directional adjustments from each start, plus layer selection and submission, leaving time for inspection. Earlier optical matches are valid even if guides are not perfect.

The center alone proves all three starts invalid. For task0, initial brightness is1/4 and target1. For task1, initial brightness is `((1+cos(π/6))/2)^2`, while target is `((1+cos(π/4))/2)*(3/4)`. For task2, initial brightness0 and target1/8. All differences exceed0.035. Consequently four actual A press/release submissions at the untouched start cause an ordinary rejection loss; waiting90 admitted active seconds there causes an ordinary timeout loss. Neither needs fabricated near-terminal state. At task0 the noncentral target brightnesses are `(1−sqrt(2)/2)/2`, `(1+cos(25π/48))/4`, 0 and`(1+cos(5π/12))/2`: the probes genuinely ask for different light levels/local phases. Each task's nonzero center target also rules out an all-black accepted arrangement under0.035 tolerance.

## Art and acceptance

Use a smooth optical laboratory: ivory transmitted light, dark ink-blue instrument housing, cyan and warm amber mask rims, etched alignment markings, softly shaded adjustment knobs and clear glass highlights. Fine stripes and their overlap remain continuous-looking; no pixel-art grid. Keep the square field large and all five target/live swatches and tolerance bars legible. Use at least24 logical pixels for essential ASCII canvas labels, Chinese DOM instructions, and the shared actual blurred modal backdrop. Distinguish MASK1/MASK2 numerically as well as by color. Show remaining seconds, remaining permitted rejections, selected mask, current phase/angle, and all five simultaneous checks. Do not label previously hit probes as completed.

Use one small baked atlas and shared batched rendering. Black alpha=1−T over white for each layer gives the actual product by ordinary source-over composition. Crop both layers to the same square. Draw registration hardware outside the judged field or identify overlays clearly; do not accidentally tint the sampled light into a different claimed brightness. Five point readouts use the exact sampler even where a marker covers field pixels. Keep rendered quads below8192 for one normal WebGL submission, then measure actual draw calls/frame costs later.

Acceptance requires three fresh ordinary wins and natural losses, phase-boundary continuity, common-coordinate rotation, simultaneous rather than historical checks, unchanged retry starts, exact preview-law use, held-edge/cancel/pause/phone regressions, original960×540 and1280×720 visual review, measured performance and size, signed APK and actual-play video each below10,000,000 bytes. Source approval precedes any execution. Drafts and mathematical feasibility are not completion, play or hardware evidence.
