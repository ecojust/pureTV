# Blaze Thrust — original Android acceptance and visual review

The original source is `127d108053297e2ae5f2b6e14aa20550ae97dae4`, Android
run `44148596095`, attempt 1. Evidence-only run `44152016854` exported this
completed game's original runtime artifact without rerunning or signing anything.
All 63 exported files were hash-checked; `original-export/` preserves them exactly.

Both normal and occupied-port scenarios passed all 40 original SDK checks. The
ports remained 63485 and 35995 respectively throughout their own sessions, with
222 and 221 acknowledged accepted SDK messages. All 14 native PNGs were manually
reviewed; the complete controller IDs, active menu buttons and game content fit.

The three long-pause captures in each scenario reveal a layout issue: at a
960×540 CSS viewport (1920×1080 screen capture), the final directions/B hint line
is partly clipped by the left sidebar's scroll area. All four pause-menu buttons
remain visible; this finding does not invalidate the recorded SDK checks. A
layout correction is required before final delivery, and these original images
must not be relabeled as evidence for the corrected assets.

`visual-review.json` identifies every inspected image and its hash, records the
exact limitation, and probes both original H.264 recordings. The recordings are
approximately 49 seconds long; their encoded frame rate is not a measurement of
physical-TV performance. No physical television, phone or ESP32 was tested.
