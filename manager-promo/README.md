# Temporary native recording job

Dispatch the temporary branch's `job-diagnostics.yml` with `job_id=050-promo`.
The job uses a fresh macOS runner, read-only repository permissions, and uploads
the explicit `evidence/` directory. It never commits, pushes, publishes a release,
installs a client update, or posts to Gitee.

The official 0.4.19 and 0.5.0 DMGs are checked against both their published
SHA256SUMS and reviewed pinned hashes. Bundle versions and executable hashes are
recorded before/after use. Native screenshots, OCR, cursor actions, window bounds,
and timestamps document the real app. Independent public API reads retain the
actual Gitee update catalog, forum post, and replies.

Expected footage: `01-update-0419-to-050.mov` and `02-forum-050.mov`. The two
applications are launched separately; no update installation is represented.
Native screen video is tested for both fixed-duration capture and interruption.
If unavailable, timestamped native PNG frames are preserved instead, clearly
identified in `result.json`. No page content or API responses are simulated.

`actions.json` maps source elapsed times to clicks/hover/screenshots. The
`window-*.json` files contain actual display/window bounds and scales. Full-screen
footage may be cropped to the genuine window for the final edit. Prefer forum
footage followed by a separately labeled earlier-version update check. No private
Manager profile, MCP session, or token files are uploaded.
