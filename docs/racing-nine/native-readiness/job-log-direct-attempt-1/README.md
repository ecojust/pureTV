# Original failed-step logs recovered without a new workflow

All three `gh run view --job ... --log-failed` commands returned 0. The retained `.log` files are their unmodified stdout, including gh job/step/time prefixes. They are selected failed-step output, **not complete raw unformatted job archives**. The older `originalDownloadedLogSha256` field in each original result JSON hashes that CLI stdout; no log text was redacted or rewritten.

Each `*-identity-verification.json` binds the command output to original GitHub attempt/job/jobs responses, exact run, attempt 1, source commit, workflow and job ID. No workflow was dispatched for this recovery. Earlier direct-download 403 records remain unchanged.

- Mac 03, run 44600439415 / job 135830062813: the actual plan failed on `Limited coverage requires the exact WebGL2 renderer plan`. Subsequent jobs were skipped. This does not test game rendering.
- Mac 02, run 44598305198 / job 135825515665: checkout failed with Git RPC curl 56 / reset by peer, early EOF and exit 128. The Intel helper and games did not execute.
- Pon Android, run 44597115244 / job 135821097274: the retained log includes early boot-period `device offline` and ColorBuffer messages, **followed by successful boot and pm clear**. Those earlier messages do not establish the later failure cause. Actual game initialization subsequently timed out; two logcat reads timed out and the emulator console later refused connection. The cause is unresolved. The game owner's full log and timeline are separately archived under `joystick-games/ponpoko-kart/docs/android-ci-44597115244/`.
