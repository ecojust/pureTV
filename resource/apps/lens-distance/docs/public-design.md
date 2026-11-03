# Lens Distance / 焦距实验室 — public design

Normative public specification before implementation or execution. Game47/100; `lens-distance`; `com.ecojust.lensdistancetv`; version0.1.0/code1; seed747; actions2. Read with [model contract](model-contract.md) and [public interface](public-interface.md). All authored tasks, bounds, starts and acceptance formulas are public. This is not executed-play evidence.

## An optical bench with two independent quality requirements

Slide a convex lens and a screen along a marked rail. Light from the object must form a REAL image on the screen with acceptable clarity and brightness. Adjust the aperture: a wider opening collects more light, but increases defocus and the explicitly simplified aberration penalty. Maximum aperture never passes clarity, even at exact focus. A exposes the current plate and checks all requirements; a green live reading alone does not capture it.

There are three selectable layouts, each containing exactly two sequential imaging cards. Capture both cards to win that round. This is one consistent optical mechanic, with different object locations, carriage ranges, source powers and brightness bands. There is no hidden target lens/screen pose: any setting satisfying the public formulas passes. A task transition loads the next card's object, both positions, aperture, control ranges and resources; it does not inherit the old object distance.

Each card starts with4 light-energy charges and its public mechanical-adjustment allowance. Every A exposure spends1 energy, including a successful exposure. An incorrect exposure at energy0 loses. A successful exposure takes priority over exhaustion: even the final charge can complete a card or win. Each actual in-range carriage/aperture change spends1 adjustment. Exactly the allowance is legal and still permits exposure; actual adjustment number allowance+1 applies and immediately loses. Boundary-blocked inputs and B selection are free. No elapsed-time deadline exists. The intended ordinary human round is30–90seconds, subject to later actual observation.

## Controls that remain visible

- Left/Right slides the selected carriage by−1/+1 rail unit. Selection starts at LENS.
- B toggles LENS/SCREEN. It never moves either carriage or changes the aperture.
- Up/Down increases/decreases aperture by1, regardless of carriage selection.
- A exposes and judges the current optical setup.

All controls are bounded, with no wrap or key repeat. A blocked end-stop press leaves resources unchanged. Only fresh held-input edges act. Priority is B>A>direction; other simultaneous rises are consumed, never queued. On successful card advance selection becomes LENS, while held-input/gate history is retained, so holding A cannot expose the new card. Pause/retry are independent shared-host controls. Enter uses held-A semantics (`holdConfirmAsA=true`). Start/resume/cancellation requires genuine release and rearming. Phone right third is the complete upper-A/lower-B split, midpoint in B.

Chinese instructions: “左右移动当前透镜或屏幕，B 切换；上下调光阑。实像、清晰度和亮度都合格时按 A 曝光。每张底片有4次曝光电量；调整次数有限，正好用完仍可曝光。完成两张底片获胜。长按不连动。”

## Frozen coordinate and optical rules

World x runs rightward along rail0..36. The object is at O, lens at L, screen at S; all are integers. Every public card guarantees `O<L<S` throughout its fixed independent ranges. The focal length is f=4 rail units. Aperture a is an integer1..6. Object height is3 diagram units above the axis. Define positive object distance `u=L−O`, positive screen distance `v=S−L`, and `n=u−4`.

The thin-lens IMAGE classification and position are:

| Condition | Kind | Image distance q from lens | Image x | Signed magnification |
| --- | --- | --- | --- | --- |
| u>4 | `real` | `4u/(u−4)` | `L+q` | `−q/u` (inverted) |
| u<4 | `virtual` | `4u/(u−4)`, negative | `L+q` | `−q/u` (upright) |
| u=4 | `focal` | null | null | null |

At u=4 outgoing rays are parallel and no finite image exists. Never divide by zero, serialize Infinity/NaN, or substitute an arbitrary large focal distance. For every nonfocal public setting q lies in[−12,20]. A virtual image is located on the object side and cannot be captured by this screen. Real-image classification is required independently of any quality number. Offscreen finite image points remain their exact finite values in state; only drawing is clipped.

Brightness and blur are openly simplified TEACHING METRICS, not a physical camera calibration, diffraction simulator or complete radiometry model. Thin-lens geometry is ideal paraxial geometry; source power and the following aperture penalty are authored game units.

For the current card's public sourcePower P, brightness is `B=P*a*a/(v*v)`. The inclusive required band is `[brightnessMin,brightnessMax]`. This deliberately simple inverse-square screen-distance metric remains finite even when no real image forms. Brightness alone cannot capture a virtual/focal image.

Let `d=abs(v*(u−4)−4*u)`. The geometric defocus component is `a*d/(4*u)`; for a real image this equals `a*abs(v−q)/q`. Add the public wide-aperture aberration penalty `(a−1)^2/16`. The total blur index is

`blur = a*d/(4*u) + (a−1)^2/16`.

Clarity passes only for a real image with blur≤1. Thus aperture6 has a minimum blur25/16>1 and never passes; smaller apertures trade brightness against blur. The metric remains finite in focal/virtual cases, but they always fail clarity/capture.

All acceptance uses exact integer cross products, never rounded display text or epsilons:

`blurNumerator = 16*a*d + (a−1)^2*(4*u)`

`blurDenominator = 16*(4*u)`

`clarityOk = imageKind==='real' && blurNumerator<=blurDenominator`

`brightnessNumerator = P*a*a; brightnessDenominator = v*v`

`brightnessOk = brightnessMin*brightnessDenominator <= brightnessNumerator && brightnessNumerator <= brightnessMax*brightnessDenominator`

`canExpose = imageKind==='real' && clarityOk && brightnessOk`.

Every integer operand/product is far below JavaScript's exact safe-integer bound. Decimal display may round; exact flags remain authoritative. Brightness above the band means OVER, below means DIM; blur above1 means SOFT. Show the actual brightness band and `BLUR <= 1.00` beside their separate meters. A wrong exposure reports the current image kind and both checks, rather than merging the requirements into a single opaque score.

## Three layouts, six fully public cards

Each row is one card. Bounds and starts below are ABSOLUTE rail coordinates, not offsets. No randomization or target solution coordinates exist. Layout order is level0/1/2 and each layout's card order is its table order. All cards have energy4 and aperture bounds1..6.

| Level / layout ID / English / Chinese | Card ID / English / Chinese | O | Lens bounds | Screen bounds | Start L,S,a | P | Brightness band | Adjustment allowance |
| --- | --- | ---: | --- | --- | --- | ---: | --- | ---: |
| 0 / `brass-bench` / BRASS BENCH / 黄铜光台 | `arrow-plate` / ARROW PLATE / 箭羽底片 | 2 | 4..12 | 14..26 | 5,24,2 | 160 | 32..52 | 24 |
| 0 / `brass-bench` / BRASS BENCH / 黄铜光台 | `leaf-plate` / LEAF PLATE / 叶片底片 | 6 | 8..13 | 20..32 | 10,30,6 | 288 | 40..60 | 24 |
| 1 / `long-bench` / LONG BENCH / 长距光台 | `star-plate` / STAR PLATE / 星芒底片 | 1 | 8..13 | 15..25 | 8,25,1 | 100 | 30..45 | 22 |
| 1 / `long-bench` / LONG BENCH / 长距光台 | `key-plate` / KEY PLATE / 钥匙底片 | 7 | 9..14 | 21..34 | 10,29,2 | 256 | 32..48 | 22 |
| 2 / `precision-bench` / PRECISION BENCH / 精密光台 | `petal-plate` / PETAL PLATE / 花瓣底片 | 4 | 6..16 | 20..21 | 8,21,6 | 128 | 24..36 | 16 |
| 2 / `precision-bench` / PRECISION BENCH / 精密光台 | `spire-plate` / SPIRE PLATE / 塔尖底片 | 0 | 2..6 | 19..26 | 4,20,1 | 768 | 38..54 | 16 |

The six object glyphs identify the plate and do not change the formulas. Object distance is recomputed from the new O/L on each card. In particular, do not carry O, lens/screen bounds, initial aperture or current-card acceptance caches across card changes. Round-level completed progress, elapsed time, counters, exposure receipts and input lifecycle history do persist. Host retry/level selection creates an entirely fresh round.

Static arithmetic review supports feasible real-image settings for all cards within their allowances, with different distance/aperture tradeoffs. This is a feasibility statement only: no solved-pose list, precomputed input route or solution API is part of public configuration, production or pilot.

## A real diagram and an inviting bench

Use a polished pearl/cream optical laboratory with teal sliding carriages, an actual convex-glass lens silhouette, engraved brass rail, amber construction rays and a luminous paper projection screen. The object plate, lens and screen must occupy their actual x coordinates. Show both focal ticks at L−4/L+4. Bounds appear as labelled end stops or range bars for the selected carriage; a fixed point or clipped image must not masquerade as an adjustable control.

The ray diagram uses the public source top `(O,3)` and three lens entry heights `h=0,+a/2,−a/2`. Each incoming segment runs from `(O,3)` to `(L,h)`. Each outgoing ray is the line

`y(x)=h+(x−L)*((h−3)/u−h/4)` for x≥L.

All three intersect the finite image top `(L+q,−3*q/u)` when n≠0. In the virtual case only DASHED backward extensions intersect there; actual outgoing rays continue right and do not converge on the screen. At u=4 the outgoing rays are parallel. Use one consistent affine plot mapping for all points/rays, with finite segment clipping to the diagram rectangle. Separate x/y scales are acceptable if used consistently. No unbounded screen coordinates are sent to the renderer. Label `REAL`, `VIRTUAL` or `FOCAL / NO FINITE IMAGE`; retain a visible directional marker when an image is outside the plot. A projected plate preview is visibly soft/dim/overexposed according to the actual current metrics; virtual/focal states never show a crisp captured image on the screen.

The large rail diagram is the primary interaction, with separate bottom LENS/SCREEN controls and a six-stop iris indicator. Show selected carriage and current absolute position/range, O/u/v/f, card1/2, both independent target meters, energy remaining and `max(0,allowance−adjustmentsUsed)` adjustment remaining. At exact allowance say exposure is still available; after loss do not display a negative allowance. Current-card start values are not a target-pose hint.

Bake glass highlights, carriage metal, plate motifs and trim once into a compact local atlas, then batch sprites/lines/rectangles. No per-frame canvas textures or automatic pixel-art style. Essential ASCII canvas text≥24 logical pixels; Chinese rules/HUD/results use shared DOM. Preserve actual shared blurred menu/pause/result backdrops. Later review original960×540 and1280×720 screenshots, ordinary title/play/pause/win/loss, virtual/focal/real diagrams, distinct DIM/OVER/SOFT readings and both successful card transitions. Target one atlas and<8192 quads; measure actual WebGL submissions and observer intervals. Signed APK and actual-gameplay MP4 must each be strictly<10,000,000bytes.
