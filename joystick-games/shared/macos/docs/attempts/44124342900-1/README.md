# CF completion QA 44124342900 — attempt 1

Source: 09a656e35b30a81e9662791d774a4b60bc5d6445. Original package source remains 8d647598; QQ evidence remains 6da4d967 / run 44120745068.

The CF ARM job had **zero steps** and was automatically cancelled with the explicit annotation “The job was not acquired by Runner of type hosted even after multiple attempts”. No native app or QA code executed in that job. Provenance, CF Intel verification and evidence export succeeded. This is a hosted runner capacity failure, not a failed game test.

Root authorized one same-source retry of failed jobs after this exact failure. At 16:36:11 UTC, `gh run rerun 44124342900 --failed` returned success; the API then confirmed attempt 2 on the unchanged 09a commit. No packages were rebuilt and QQ was not rerun.

Original run/job/annotations/full log/export manifest and CF Intel/provenance artifacts are retained here. The full immutable export is branch `build-assets/joystick-games-macos-qa-44124342900-attempt-1`. QQ artifact bytes were compared with the already retained run 44120745068 export; all match, with exact paths and hashes in `qq-preserved-byte-identically.json`.

Final delivery must distinguish successful CF Intel/provenance attempt 1 from CF ARM and aggregate export attempt 2 if the retry succeeds. Both CF attempts use QA source 09a; QQ keeps its own source 6da and run 44120745068.
