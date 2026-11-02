# Frost Brake / 冰面刹停 — public design

Public identity: game 39/100, `frost-brake`, package `com.ecojust.frostbraketv`, version `0.1.0`, versionCode `1`, seed `739`. Core module: inertial timing. This document, model-contract.md and public-interface.md form the accepted public ruleset. Implementation is authorized after root acceptance; execution requires a separate full static review. No private route or executable witness is part of the design.

## Player task and controls

Push a loaded sled along one horizontal ice lane. Release the direction to coast. Hold A to lower the ice claw: it adds braking only where the sled's center lies on a visible frost band. Deliver at three ordered docks, each smaller than the previous one. The entire sled must fit inside the current dock, with speed at most 0.30 m/s, continuously for 0.60 s. Crossing the center, briefly passing through the dock, or merely holding A cannot deliver. The sled's existing position, velocity and cargo damage carry into the next delivery.

- Left/right, or the horizontal phone stick: push left/right. Absolute stick x below 0.35 is neutral; at or beyond 0.35 it commands full signed push. Up/down do nothing during play.
- A held: lower claw. A released: retract claw. Direction and A combine additively, so opposite push plus claw stops faster, while continuing to push with the motion stops more slowly. A has no physical effect outside frost. A held on frost keeps a stationary sled still even if direction is held.
- B: no gameplay action; the shared host uses B for sound in its menu. Set game.json `actions:1`, `actionA:'按住冰爪'` and matching GameDef.actionLabels `['按住冰爪']`. The generated public config, rather than the GameDef label alone, selects the phone's whole broad right action zone.
- Pause: independent host P / START / pause button. ENTER confirms menu choices and, with `holdConfirmAsA: true`, can hold the claw during play. Menu confirmation and pause resume are quarantined by the host and cannot leak into a claw hold.

Lose when the finite sled exits either lane end, or cargo load damage reaches 100. There is no time-limit defeat; the elapsed clock measures actual unpaused simulation time. Normal feedback-based rounds should take about 30–90 seconds, including careful corrections. Retry recreates the selected scenario from its initial state.

## World and scenarios

Units are meters and seconds. Keep the complete lane [0,100] visible in an overview, with a separate main view spanning exactly20 m at one fixed scale in all scenarios. The main camera center is clamp(x,10,90), a purely presentational function of current position. Its688 logical pixel width gives34.4 logical pixels per meter. The sled center is x and its half-length is1.20, so its footprint is [x−1.20,x+1.20]. Initial velocity and damage are zero. Frost bands are fixed through the entire round and never disappear when a dock is completed. A band's contact test uses the center claw, not the cargo footprint. Docks and frost bands overlap intentionally, but are separate markings. The active dock's full footprint and its allowable sled-center bracket must both be understandable visually. The overview always shows all bands, docks, both lane ends and the current main-view window; clipping in the main view never hides route geometry from the player.

| Scenario index / name | Initial x | Fixed frost bands | Ordered dock centers | Ordered full dock widths |
| --- | ---: | --- | --- | --- |
| 0 晨霜直道 | 10 | [18,32], [45,61], [71,85] | 53, 25, 78 | 12, 9, 6 |
| 1 回程冰湾 | 88 | [13,27], [36,52], [65,80] | 44, 72, 20 | 12, 9, 6 |
| 2 窄岸货线 | 12 | [23,38], [58,74], [77,91] | 66, 30, 82 | 12, 9, 6 |

All three use identical forces, tolerances, controls and loss rules. Their distinct starting positions, band gaps, and alternating dock positions change the timing task. All dock numbers remain visible; emphasize only the current dock and show completed docks softly. On delivery the next dock becomes active at the exact completion time, without moving the sled or resetting the clock.

## Motion and cargo feedback

Full push contributes signed acceleration 2.40 m/s². Ordinary ice drag is 0.12 m/s² against motion. An engaged claw adds 4.80 m/s² against motion, giving total friction 4.92 on frost. There is no speed cap and no automatic velocity reset. At zero speed, friction is static: it cancels available push up to its strength. See the model contract for exact piecewise integration.

Cargo damage represents sustained high-speed loading through the claw, rather than a once-per-press penalty or a general acceleration limit. While the claw actually engages frost, damage grows at `12 × max(|v| − 5, 0)` per second. Below or at 5 m/s, claw braking is damage-free. Outside frost, with A released, or at rest, this claw-load damage is zero. Reverse push shortens high-speed claw exposure and therefore reduces this particular load. Damage never heals. The HUD must make the safe speed 5 visible and show an amber/red load response when the claw is both engaged and above that speed.

Present speed with a direction arrow, cargo integrity `100−damage`, dock progress `0/3…3/3`, and elapsed seconds. A compact docking meter shows the continuous 0.60 s settling requirement only while both containment and speed are valid. Distinguish claw requested outside frost (raised/ineffective indication) from claw engaged on frost (visible teeth/contact trail). Do not show a computed brake point, route, recommended input, or future trajectory solver.

## Complete interaction and presentation

Use the shared start/scenario menu, instructions, pause/continue, sound control, win/loss and retry flows. Popups use the shared DOM's genuine blurred backdrop, including its blur(14px); a translucent painted rectangle is not a substitute. Suggested concise instructions: “左右推货橇，松开仍会滑行。按住 A：冰爪只在结霜带刹车。整辆货橇停在亮区，速度 ≤0.30 持续0.60秒交付。高速下冰爪会伤货；速度 ≤5 可安全刹车。完成三个越来越窄的停靠区；越出冰面或货损满格失败。”

Win copy states all three docks delivered and remaining integrity. Loss copy identifies the actual reason: lane exit or exhausted cargo. Score is `100 × deliveries + (won ? floor(max(0,100−damage)) : 0)`, yielding a simple completion/integrity best score; elapsed time is informative only.

Art direction: smooth painted polar freight miniature, a warm orange loaded sled against muted blue ice, dark water beyond both physical ends, clear textured frost bands and bright rounded dock brackets. Use one per-game baked atlas and one normal WebGL draw submission, with Chinese text in the shared DOM. Decorative snow, shadows, tooth sparks and meter motion must never alter physics. The art/layout owner supplies the final nonoverlapping atlas and screen-space plan from these rules.

Cancellation is not a hidden brake or a free pause. Cancelled or quarantined input makes push and claw neutral while unpaused simulation continues to coast and accumulate physical docking dwell. Only host pause stops calls and the model clock. The public input contract states the real-release gate and zero-time semantics.

## Required regressions

1. For otherwise identical time-indexed input outside frost, toggling A makes no difference to x, v or damage, including while direction is held.
2. Delivery requires full-footprint containment, speed threshold and uninterrupted dwell together; a fast center crossing cannot succeed.
3. The same held-command timeline integrated through different positive-dt partitions produces nearly equal motion, stopping distance, load and event times under the declared tolerances. Browser RAF rates must separately verify the shared fixed-step accumulator rather than pretend it calls variable dt.
