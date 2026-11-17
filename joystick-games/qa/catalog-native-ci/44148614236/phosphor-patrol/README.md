# Phosphor Patrol — preserve original runtime failure and correct QA types

Original Android run: `44148614236`, source
`127d108053297e2ae5f2b6e14aa20550ae97dae4`, attempt 1.
Evidence-only export run: `44150849090`, immutable export commit
`5affc4cbab97c34c5571e6a9fb4533b6ca2c2b47`.
All 43 manifest-listed files are preserved under `original-export/`, with exact
file-set, byte-count and SHA256 verification recorded in `review.json`.

Both original scenarios fail during initial-menu validation, before any SDK
gameplay input. The Android validator required `webglVersion` to be a string
starting with `WebGL 2`; the four Triptych WebGL adapters report the actual
context's API version as the integer `2` (or `1` for WebGL 1). Their actual
renderer remains separately checked against each frozen QA plan.

The failed original runner only recorded the initial snapshot after validation,
so **the failed reports do not retain that Android snapshot**. The diagnosis
combines the original stack traces with the frozen adapter source and the
already-recorded browser observations. Those browser observations are not
represented as Android gameplay success. No screenshot or gameplay video was
captured before this early failure.

The QA-only fix accepts an exact integer 1/2 matching the selected renderer, or
a matching legacy WebGL driver string. It rejects booleans, floats, missing
versions and mismatched renderers, and saves the initial observation before
validation. `qa-only-fix/` preserves the exact revised scripts, four original
browser observation fixtures with source hashes, and the passing 27-test output,
including a regression proving failed validation retains the observation.

No game source, native host, Observer or signed APK was changed by this fix.
Actual Android acceptance must be rerun using the original fixed-certificate
packages from their immutable package export. Neither the failed original run
nor the local contract tests are counted as native gameplay acceptance.
