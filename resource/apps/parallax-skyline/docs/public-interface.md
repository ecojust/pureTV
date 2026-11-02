# Parallax Skyline — public interface and evidence

Status: accepted public interface, not execution evidence. Read with the [public design](public-design.md) and [model contract](model-contract.md).

## Shared host integration

Use the existing `resource/game-kit/web/runtime.js` public API: `PureModel.create(seed,level)` and `PureModel.step(state,1/60,input)`, with GameDef render receiving renderer, state and host inputs. GameDef seed741, menu levels COURTYARD/RIVERFRONT/TWIN SPIRES, action labels SUBMIT/UNDO, actions2. Use `holdConfirmAsA=true` so Enter and phone A both use the same documented held-edge semantics; the model ignores aPressed/bPressed pulses. The host's tick/elapsed are separate from the model's admitted calls/elapsed and are never proof of a physical simulation step.

The host supplies x/y/a/b plus cancellation flags/epoch. Up/down selects NEAR/FAR/VIEW; left/right edits that row; A always submits; B always undoes a physical shift. The shared independent pause and retry commands remain available. B during active play does not return to menu or toggle audio. Retry recreates the full model and starts a new observed run; it must not patch only positions or refund a rejected submission inside the old run.

Native phone control uses real held values, pointerup/cancel, focus loss and source session/cancel-sequence changes. The upper and lower halves of the entire right third must prevent text selection and implement A/B. Local and remote sources must both quarantine stale holds across start, pause/resume, disconnect/reconnect, hidden/blur and retry. A cancelled synthetic-neutral host sample must not satisfy the model's true-release gate. Test real release and renewed press rather than only calling a private cancellation helper.

`PureTVQA.snapshot()` is observation-only; it returns actual host phase/paused/level/time, full model state, renderer metrics and connection state. `PureGame.key(name,down)` is the normal public keyboard entry. These interfaces do not authorize state mutation, hidden calls, private solution lookup, route search, precomputed future-state injection, or unreported warmups. A public ordinary pilot may inspect only current visible/public observations and issue normal actions. It must preserve every attempt and outcome.

## Truthful view and layout requirements

Both projection panels remain visible during play and after results. Draw the actual20-cell silhouettes and target outlines from the canonical configuration and actual `views` data; show the designated target and live landmark, with visible/hidden ownership distinguished. Four check indicators represent exactly view0silhouette/view0anchor/view1silhouette/view1anchor. The highlighted camera does not hide a failing second view, change geometry, or limit submission to one view. Show physical NEAR/FAR positions as world units so their different projected movement is understandable.

Always show focus, selectedview, **剩余容错** (`4-failures`), A SUBMIT, B UNDO and whether undo is available. This budget counts allowed incorrect submissions; a successful submission does not consume it. An arrangement that visually matches all checks before A is still active; say ready to submit, not already won. Losing text names exhausted incorrect submissions. Submission receipts are historical; an undone board must not display a previous receipt's match result as the current live arrangement.

Use actual original captures at960×540 and1280×720 to inspect both views, smallest critical text, all focus rows, selectedcamera states, target/live distinction, hidden-landmark example, both outcomes, pause and retry. Essential ASCII canvas labels should be at least24logical pixels; instructions are Chinese DOM. Verify real phone touch regions near edges and midpoint ownership, plus no text selection. Exported video FPS does not establish device FPS.

## Public observations and independent validation

Every ordinary model run records the actual public `create` origin with normalized seed/level. Every ordinary browser/video run begins visibly at menu/start or result/retry with a fresh model. Use explicit runId, channel, selected task, origin kind, source hashes and monotone observation sequence outside the model. Retry starts a distinct runId. Do not equate a model-only create with a visible browser transition.

Complete ordinary model receipts retain **every actual call**: exact dt, recognized raw own-data input values with missing distinct from false, actual before and after model snapshots, and observed sequence. Preserve cancelled/epoch/held fields, physical positions, focus/view, both full projection caches, history, failures, submissions, counters, gates and elapsed. An independent checker uses only the public configuration/formulas and each pair's actually observed before state. It must not import the Model, pilot, renderer/private helper or private witness, and it must not feed calculated after states forward as if observed.

The independent checker can recompute current projection cells/ownership and all four match flags from every actual observed placement, check recorded target tables, validate an actual adjacent command transition, compare immutable prior receipts, and check outcome/budget/undo invariants. It cannot infer a hidden press, real key release, unobserved intermediate move, browser lifecycle, visibility or hardware behavior from a sparse snapshot.

Browser and recording reads are explicitly sparse. Keep their actual timestamps/read windows and source observation indices. Do not invent model call times, input edges, intermediate history states or continuity between endpoints. An apparently unchanged placement does not prove no move+undo occurred between reads. A lone correct final arrangement proves geometric consistency of that snapshot, not ordinary reachability or a complete input history. Missing intervals remain `not-observed` or `review-required`.

Required ordinary evidence includes three fresh wins and three natural four-rejection losses, all through admitted controls. Also visibly demonstrate: a legal front-view-complete but secondary-view-failing arrangement rejected by A; physical near/far shifts with different screen displacement; view switching with positions unchanged; undo after changes to both layers restoring the latest full pair while preserving failed-submission count; pause duration with no model changes; and complete retry identity. These may be separate clearly identified runs, not retroactively merged into one flawless attempt.

Direct synthetic fixtures may test boundary ownership ties, malformed/accessor input, history saturation, correct last-chance submission and terminal immutability. Label them model rule tests, separate from ordinary play. Fresh reference identity is not provable from JSON alone. No force-state fixture may be used as gameplay, reachability, a screenshot or video.

## Review and release gates

Model author, QA author, independent auditor and root review the public rules before implementation. Before first use of every executable/helper, root reads its full current source; imports and syntax checks count as use. Preserve source hashes and all first failures. Ordinary drivers must be reviewable and cannot silently calibrate, run a shadow model, search future routes, conceal failed attempts or mutate observed state.

Candidate UI and dual original-image acceptance precede source freeze/sign. Final acceptance separately binds source/APK assets/signature, actual tests and browser controls, independent public observations with their gaps, measured draw calls/frame costs, original images, actual decoded gameplay video below10,000,000bytes, APK below10,000,000bytes, and the individually pushed master commit. Browser/software-rendered evidence must explicitly say no physicalTV/phone test when none occurred. Do not turn a passing rule test or a sparse final screenshot into a claim of complete gameplay verification.
