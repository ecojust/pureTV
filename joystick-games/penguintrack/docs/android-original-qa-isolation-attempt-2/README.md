# Minimal Penguintrack original Android package QA

Authoritative replacement for attempt 1: exactly three QA files over the original c5 parent. The existing runtime workflow, runner, full runner tests, schema, catalog selection, Observer, controller SDK and all production bytes stay at c5.

The plan only prepends UP then DOWN to select Play, keeping all 16 original steps. The original package verifier had an obsolete flat-assets assertion, while this APK contains 147 nested assets. Its payload construction now reuses the already reviewed frozen GameKit payload function with the original explicit registry/game limits and safe paths; complete signature, original source inventory, manifest, payload byte equality and Observer checks are unchanged. All 156 reconstructed asset names/bytes match the original signed receipt.

The original 39 runner tests passed with these exact runner/schema sources; all original packaging test classes are unchanged, with four new nested/default/path boundaries (20 tests passed). The unchanged c5 workflow runs only these two suites. It passed actionlint with shellcheck explicitly disabled. No new native run, package build/signing, download, Git ref or dispatch occurred. The old workflow retains its original emulator environment; this is not an environment-failure remediation claim.

`dispatch-template.json` and `executed-overlay/` are the complete root materialization request. The earlier attempt-1 19-file recipe is blocked and superseded; its apparent 117-test composite was invalid because the Back installation integration suite imports a newer runner. Its original failing evidence remains intact.
