# Original Windows failures: run 44606210717

Source `c5ad63e8c6a0ccfada5f763d1d26afa27f45002e`, attempt 1. Seven failed game jobs were restored through seven individually recorded, read-only evidence workflow requests. No game was rebuilt, re-signed or launched during this investigation. KartRush's successful job is outside this seven-failure review.

All **662 exported Git blobs / 613 original evidence files** matched their immutable Git objects and manifests; no original files are missing. Each game directory preserves the complete original export, source/ref metadata and `restoration.json`. All **14 original mode reports remain failed**.

| Game | Normal mode | Occupied-port mode |
| --- | --- | --- |
| Backroad Rally | Menu focus reaches traction assist but later drifts to speed display; expected-focus timeout | Saves Low and career; focus drifts around livery/choose stage, and final screen returns to title |
| Ponpoko Kart | Race countdown remains 1.3 seconds when the original bounded step ends | Same observed countdown remainder, 1.3 seconds |
| Penguintrack | Actually drives, then fails the requirement for four fresh pause snapshots within three seconds | Same observation guard; available paused model values remain unchanged |
| Last Track | PermissionError reading the native minimum-window PNG | Actually drives and fires; complete vehicle bodies visible, then the same pause-sampling guard fails |
| Dirt Crown | PermissionError reading the connected-menu PNG | Original race countdown remains 0.05 seconds; natural progress is preserved |
| Turbo Kart Rush | Actual course started, countdown remains 1.4 seconds | Same observed countdown remainder, 1.4 seconds |
| Kart Royale | First DOWN expects Controls, but initial focus is page text and final focus is Start | Connected-menu screenshot misses its deadline; a complete PNG is present in the later original artifact |

The `findings.json` files distinguish the last successfully recorded input snapshot from the **later final native diagnostic state**. Ponpoko, Turbo and Dirt did enter their original countdowns: their earlier input snapshots must not be described as permanent menu/intro failures. No game clock, timestep or renderer was altered to produce a pass.

The two PermissionErrors occur where the inherited verifier reads a PNG while the original Windows host writes it asynchronously through an exclusive stream. This is supported by the original stack traces and archived host/verifier source. Kart Royale's missing screenshot has a different recorded error; its later existence is not proof of the same cause or of completion within the original deadline.

For Penguintrack and Last Track's pause cases, the original verifier requires four distinct native timestamps in three seconds. The available before/final records show only three additional controller polls for each Penguintrack mode and one for Last Track, with all declared pause-model fields unchanged. The loop's individual reads were not archived, so this investigation does not invent their precise sample count or change the failed result.

`visual-review.json` lists five images actually opened and inspected, including their SHA256 and Git blob IDs. Last Track's original 1280×720 Windows gameplay screenshot shows intact player and AI bodies, a turret, 56 km/h, ammunition 199 and a readable native controller ID. This is useful visual evidence for the spring correction; it is not a replacement for the failed later runtime check. Other retained images have not all been visually reviewed.

`requests/` records each exact dispatch payload and resulting reader run. `original-job-logs/` preserves all seven original job logs; Penguintrack's initial log-fetch EOF is retained separately. `summary.json` is the compact index. Original reports, snapshots and failures are preserved unchanged for the Windows and game owners' follow-up work.
