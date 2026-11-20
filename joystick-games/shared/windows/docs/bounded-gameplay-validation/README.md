# Bounded Windows gameplay observations

The original Windows run `44615299245` remains failed. Exact reports/final states were checked against both export and evidence manifests; source excerpts are bound to `6c7cb4fdb99dce236b634c842326bae6aed5f232`. No original report was changed.

This QA-only change preserves the game clocks, physics, default quality and ordinary menu/held verification. It changes only Backroad step 32 timeout, adds a Windows-only 600-second released-startup observer to Royale step 11, and adds a Windows-only held-until-original-expectation observer to Turbo step 4. Shared plan defaults remain limited to 240 seconds.

The existing CI lifecycle entrypoint ran 35 synthetic boundary groups successfully (21 existing + 14 new); six Android catalog contracts also passed. Actual Windows source closure selection includes the new test file for all three games. `result.json` binds the executed seven source/plan files. New native verification is pending; no production workflow was dispatched from this work.
