# Catalog macOS source 127d108: retained build failure

Run [44148493011](https://github.com/ecojust/pureTV/actions/runs/44148493011), attempt 1, triptych-02 failed before package creation. The original shared `reuse-source.test.py` fixture used `/var/folders`, while the imported builder resolved its root to `/private/var/folders`. Its relative-path check rejected these equivalent temporary paths.

The four games’ original tests and frozen distribution checks passed. Actual Swift compilation and Foundation execution of ControllerServerTests and GameStorageTests passed. No Mac package or gameplay pass is claimed from this job.

`triptych-02-build/` retains the exact evidence export from commit `c8238f1f5932f01cd12f277371c2c82ca1fd32e9` (export run 44150207878). Its 26-file manifest was independently checked after fetching. The original downloaded job-log hash and any signed-URL redaction count are recorded separately.

`temporary-path-regression/` retains the original Linux reproduction with a symlinked TMPDIR and the executed corrected test script. The only test fix resolves the temporary fixture root; production source symlinks remain rejected. All four tests then passed with both resolved and symlinked temporary paths. This local result does not replace the next actual Mac build/runtime run.
