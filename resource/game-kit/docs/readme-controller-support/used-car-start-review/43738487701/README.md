# Used Car START path review

This read-only review did not establish a definite production cause for the API29 observer failure and subsequent AVD offline. The raw Android run remains failed. No production, QA, APK or original evidence was changed and no browser test was rerun.

The formal 0.1.4 APK (`7c734034…`) has 39 assets exactly matching current source and the prior passed official-SDK browser smoke report. That browser report passed START-to-race and its gameplay case with no page errors, but used a synthetic native bridge and does not establish Android acceptance. The model, renderer, materials, vehicle models, track and audio files also exactly match the published 0.1.3 APK.

Inspected START uses a rising-edge check and cached input, enters a bounded countdown and preserves existing car specifications. The renderer and track world already exist in the garage; track-id and vehicle-model caches prevent repeated construction on START. The first race view does enable existing world drawing, car visibility, lighting and camera/environment changes, and audio may unlock for the first time. These differences do not identify the failing call. Input snapshots are consumed once per animation frame; diagnostics use peek.

The original wire shows one down, one long_press and one long_release, all acknowledged. It does not show successful scene advancement. The retained log's renderer 3078 crash is explicitly associated with Katniss search, not Used Car's PID 4152 / renderer 4203. Used Car logs 88 skipped frames; menu-stage tile warnings are also retained. No inspected Used Car exception identifies the cause of whole-AVD failure.

`review.json` retains exact APK/source/browser bindings, original test status, START wire events and attributed log excerpts. `source-excerpts.json` stores the exact inspected code and line references. Native lock review and root's new supported-SwiftShader run remain separate evidence.
