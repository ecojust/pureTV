# Windows original build retention

A successful build now uploads its original portable ZIP, installer and build manifest even if later installation or runtime checks fail. The build step must actually succeed. The two existing anonymous artifact upload steps retain their names and order so their original API identity remains inspectable.

The exporter binds the requested game, fixed source commit, run attempt, completed producer job, successful build and successful package upload to the unique unexpired artifact and its SHA-256 digest. It verifies original evidence/package manifests, package bytes and the complete frozen Git input closure. Wrong identities or contradictory claims of successful QA remain errors.

`export-manifest.json` reports each game under `packageRetention`:

- `runtime-verified`: the original installation and both runtime reports satisfy every existing acceptance check, and the producer job succeeded.
- `built-unverified`: original build bytes are valid, but an installation/runtime report is missing or failed, or the producer job failed. Reasons are retained explicitly. It never enters `verifiedGames`.
- `no-retained-package`: no original package upload exists, usually because the build failed.

Every result explicitly sets `publicPackageDeliveryComplete: false`. No release, package catalog or game delivery metadata is written by this exporter. Future independent package reuse still needs its own exact original source/package binding and fresh QA.

Files smaller than 100,000,000 bytes enter a separate immutable Git staging tree. Larger package binaries remain unchanged in the original Actions artifact: the manifest records their exact file SHA-256/bytes and artifact ID, digest, source, attempt, producer job, URL and expiry. The original downloaded files are never removed or rewritten. Larger non-package evidence and unexpected downloaded artifacts are rejected. The existing 128,000,000-byte package hard limit is unchanged.

The existing workflow invokes `windows-export.py --directory "$RUNNER_TEMP/export"` after downloading its own artifacts. It reads repository-scoped Actions metadata with the job token; no token or signed download URL enters the record. `windows-reexport.py` retains its original successful-game-only policy.

Validation: 30 exporter boundary tests, 17 existing reexport tests, actionlint, Python parsing and whitespace checks passed. Exact sources and original captured logs are beside [result.json](result.json). Tests use synthetic API/status records and real temporary Git/files; no native game run or network mutation was performed. Previously skipped package uploads cannot be recovered by this change, and an expiring Actions reference is not permanent public delivery.
