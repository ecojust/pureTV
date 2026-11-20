# racing-03 first native Mac attempt

Run 44600439415 / attempt 1 / source `06f1ab2b77e45d5fabcbd7233f8d3e9279a9d5c7` completed **failed during plan validation**. The original job 135830062813 reports `Limited coverage requires the exact WebGL2 renderer plan`; subsequent build / verify / export jobs were skipped and there are no game artifacts.

Kart Rush's actual original QA plan accepts WebGL2 plus its real WebGL1 fallback, while this frozen classifier accepted only the single WebGL2 renderer. The local exact-source replay is explicitly separate from the original CI evidence. The original CLI failed-step log and full run/attempt/job/source API binding are in `../job-log-direct-attempt-1/`. Both earlier direct-download failures remain preserved.

The later precise Kart Rush classifier revision has its own source proof and local tests under `../coverage-kart-fallback-validation-attempt-1/`. It does not change this run's failed status, game renderer or QA plan. A newly frozen native run is required before claiming any actual three-game result.
