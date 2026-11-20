# Penguintrack original Android package QA isolation

This is a frozen 19-file overlay recipe over the unique parent `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`, not a created Git commit/ref or a new native result. `preflight-final.json` is authoritative; the earlier 22-file recipe and its failed test log are retained as superseded local evidence.

The game, native host, Observer build sources, controller SDK, original input runner and its tests/schema remain at c5. The only game plan edit prepends ordinary UP then DOWN to select Play from either previously observed menu focus. All original 16 steps and all other plan fields are unchanged. The existing six-case DOM check is referenced separately; it does not claim native success.

The runtime workflow and required QA helpers come from d3b9178. The final six suites contain 117 passing tests. Five unchanged suites retain their first actual execution logs; only the reverted original c5 runner suite was rerun. Actionlint passes with shellcheck explicitly disabled. No Android emulator, browser, build, signing, ref creation, or CI dispatch was performed.

Root may materialize the exact files in `executed-overlay/`, verify its diff equals `dispatch-template.json` and fill the new isolated commit. Original APK/Observer identities and the later complete package audit are in `result.json`. No APK is copied into this evidence directory.
