# Pressure Seal / 压力封装 — public design

Status: canonical public specification accepted on 2026-11-02 after model, QA, independent and root static review. This is a specification, not evidence of implementation, play or performance. No private solution or hidden calibration route is included.

## Identity and play

- Game 40; slug `pressure-seal`; package `com.ecojust.pressuresealtv`; version `0.1.0`, code 1; default seed 740.
- Control a heated pressure vessel to seal three materials in the displayed order. Each material needs pressure to remain continuously inside its inclusive target band. Leaving the band discards that material's current uninterrupted hold.
- Hold A to power the heater and pressure pump. Hold B to open the vent. Release both to coast: stored heat decays gradually, so pressure can keep rising after A is released.
- Pressure reaching 110 kPa bursts the vessel. Each material also accumulates irreversible heat damage while heater temperature exceeds its safe value. Reaching its heat-dose budget ruins that material.
- A successful hold seals one material automatically. Pressure and heater temperature carry into the next material. Its own damage and hold start at zero; completed seals remain recorded. Seal all three without a failure to win.
- Expected normal successful rounds are 30–90 seconds; this is a validation target, not a hard timeout. A cautious player may take longer. There are no enemies, random disturbances, supplies or hidden difficulty changes.

## Controls and screens

- Phone: the whole right third is the action surface, split horizontally at its midpoint. Upper half is held A / HEAT + PUMP; lower half is held B / VENT. The shared border belongs to B. Two simultaneous contacts may hold A and B together. Safe-area insets may reduce only the outer usable viewport, not create a narrow central button inside either half.
- The left phone stick and TV/keyboard left/right choose the scenario while the menu or result overlay is visible. Directions do nothing during active sealing; they do not silently change the target or add pressure.
- Keyboard/TV: Space, Z, or held Enter/confirm gives A; X or B gives B. Confirm starts from a menu/result. `holdConfirmAsA=true` is required, so Enter is a held action during play rather than a one-frame pressure pulse.
- A and B are independent. Holding both keeps the heater and pump on while the vent is open; at very high heat pressure may still rise. The game must say this explicitly. B alone always lowers positive pressure.
- Pause is a fixed independent button and START/P/Escape; it is not a pressure action. Continue uses that same entry or the overlay's Continue button. Retry is an independent R/select action or result retry button. B in a menu may retain the shared host's sound toggle; in play it only vents.
- Start instructions explain the three steps: heat/pump, release early because heat lingers, and use the vent to stay inside the target. They also explain continuous hold reset and both red failure limits. Start, active play, pause, resume, win, loss and retry must all be reachable through the visible controls.
- Pause freezes plant state, damage, dwell, time and the model's fractional time remainder. Resume cancels stale held controls; release all held controls before a new action. It does not reset physical dwell. While active but quarantined, the plant continues to coast normally: a stale held button must never freeze physics.

## Materials and scenarios

Heater temperature is a normalized HEAT value, not a claimed Celsius simulation. Pressure uses kPa. Heat dose uses HEAT-seconds and is the time integral of temperature above the material's safe heat. Damage does not recover during a material; a fresh material starts with fresh damage.

| Material | Display name | Safe heat | Heat-dose budget |
| --- | --- | ---: | ---: |
| `tin` | TIN / 金属膜 | 68 | 90 |
| `fiber` | FIBER / 纤维层 | 62 | 105 |
| `foil` | FOIL / 薄封膜 | 58 | 120 |

| Scenario | First seal | Second seal | Third seal |
| --- | --- | --- | --- |
| 0 `starter`, STARTER / 起步 | TIN, 22–38 kPa, 6.0 s | FIBER, 46–62 kPa, 6.5 s | FOIL, 70–86 kPa, 7.0 s |
| 1 `swap`, SWAP / 换压 | FIBER, 42–56 kPa, 6.5 s | TIN, 20–34 kPa, 6.5 s | FOIL, 58–72 kPa, 7.0 s |
| 2 `heavy`, HEAVY / 高压 | FOIL, 66–80 kPa, 7.0 s | TIN, 36–50 kPa, 7.0 s | FIBER, 78–92 kPa, 7.5 s |

The band/order differences require both upward and downward pressure transitions. These are three scenarios of one game, not three counted games. The seed is recorded for replay identity but does not randomize these public tasks.

## Deterministic public plant

The plant advances in 50 ms logical ticks. Let `A` and `B` be the admitted held commands, each 0 or 1. With old heat `H` and old pressure `P`, each tick computes:

1. `H1 = clamp(H + (100*A - H)/60, 0, 100)`.
2. `rawP = P + 0.05*(3*A + 0.15*H1 - 5 - 12*B)`.
3. `P1 = clamp(rawP, 0, 110)`.
4. For the material active at the start of this tick, `doseAdd = max(0, H1 - safeHeat)*0.05` and `dose1 = dose + doseAdd`.
5. Resolve burst, then overheat, then continuous hold, then material completion. A failure on a would-be completing tick wins over the seal; burst wins over simultaneous overheat.

Each tick represents the straight pressure segment from its old pressure to its post-update pressure. A safe tick qualifies only when BOTH pressure endpoints are inside the inclusive target band, with no tolerance added to the band. It adds one 50 ms hold tick; every other safe tick resets that uninterrupted hold to zero. An entry tick beginning outside the band earns no hold. Therefore “continuous” means consecutive qualifying public logical ticks whose complete pressure segments stay inside the band. Pressure is clamped at zero, so negative pressure is never stored.

At ordinary release A=0, B=0, the pressure rate is `0.15*H1 - 5`. Post-cooling heat H1 above 33⅓ means pressure still rises even though A is no longer held. The screen's RELEASE RISE / RELEASE FALL / RELEASE FLAT cue uses the exact next-neutral-tick rate `0.15*(heat + (0-heat)/60)-5`, compared with zero; if pressure is zero and that rate is negative, show RELEASE FLAT because the pressure floor prevents a decrease. Neither release nor vent instantly zeroes heater temperature.

## Legible industrial presentation

- Use a restrained industrial panel: baked vector metal/ceramic plates, warm amber heat, cyan vent flow, a clear green target bracket and a red 110 burst line. Static gradients and highlights belong in a small owned atlas; dynamic labels and values remain crisp.
- A large pressure track and numeric pressure readout carry the decision. Display the current band, uninterrupted hold elapsed/required, heat with its safe mark, material damage as a budget fraction, and all three material statuses. Do not imply that damage falls while temperature cools.
- Show heater/pump and vent activity separately, plus stored heat / release trend. A glow must follow actual heat; it must not falsely look cold as soon as A is released. Simultaneous A+B must visibly show both systems active.
- On a successful seal, visibly move to the next target without resetting pressure/heat. On failure, name BURST or OVERHEAT, retain the failed readings and show retry. On win show 3/3 sealed and the three qualified receipts.
- Target canvas is 960×540; important baked-atlas canvas labels use ASCII capitals at least 24 logical px. Chinese explanatory prose can use normal DOM text. Contrast, safe areas, pressure marks and action hints must survive the supported TV and phone aspect ratios.
- Renderer history, animation and particles must be bounded and cannot change rules. A plotted history, if used, must be sampled from actual public states and remain separate from any claim that sparse captures prove continuous dwell.

## Acceptance boundaries

The companion model contract owns exact API/state/clock/input/outcome semantics. The public interface document owns observable fields and independent evidence rules. The three documents need model-author, QA and independent static agreement before production implementation. Parameter reachability and 30–90 second duration remain ordinary-play validation questions until actual controlled runs; algebraic plausibility is not play evidence. No pilot is allowed to inspect future outcomes, search a hidden state copy, warm up invisibly, inject a plant state or skip the start/retry flow.
