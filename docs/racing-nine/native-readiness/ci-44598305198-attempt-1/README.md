# racing-02 first native Mac attempt

Run 44598305198 / attempt 1 / source `8f283c73f52f857777306eafc88f710262367834` completed **failed**. It was dispatched once by root. Its original build, ARM failures and Intel checkout failure remain unchanged.

The original build export `e1550f1e4e9412ae083fef0a58f464d3cdae429b` contains 201 verified files. All shared checks passed, and Penguintrack / LastTrack original tests and universal builds passed. Dirt Crown failed frozen-dist checking because the original Git checkout omitted Three's module under an ignored build directory; its native build was skipped. The later precise source fix is not part of this original run.

The original ARM export `dbfcf7a815d736d9d6f3c5f1b214a836221908fc` contains 268 verified files / 11,844,197 bytes. Every original report reached a real WebGL2 renderer, then failed actual checks. Penguintrack's three modes failed the complete identity-card check because its diagnostic snapshot omitted the game ID. LastTrack's native mode timed out opening track selection; occupied-port and Rosetta timed out selecting Low. These are actual post-initialization failures, not an Intel graphics exception. Source, original executed QA copies and screenshot hashes were checked; `arm-findings.json` retains exact report paths and test details. Owners are fixing each game's actual diagnostics/navigation in new sources.

The Intel job 135825515665 never ran the helper or game: checkout failed with curl 56 connection reset, early EOF and Git exit 128. Its original failed-step CLI log and exact API identity are in `../job-log-direct-attempt-1/`. No Intel rendering observation was obtained for this run. Export was skipped, and no three-game delivery claim is made.
