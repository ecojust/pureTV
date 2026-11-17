# macOS 0.1.0 delivery audit

Both original ZIP/DMG pairs from source 8d647598 / build run 44115155028 were imported without rebuilding or changing package bytes. `import-audit.json` records the downloaded export commit, original package and executable hashes, every frozen Git input and ZIP app-file check, both Mach-O architectures, report sources, exact ACK counts, independent screenshot reviews and every delivered regular file.

CF QA uses source 09a656e / run 44124342900. Provenance and Intel executed successfully in attempt 1; attempt 2 only retried the ARM capacity failure and reran the dependent aggregate export. GitHub mirrored the earlier successful checks with new check IDs, but retained their original execution times and artifact bytes. The audit records original and mirrored IDs. ARM normal, occupied port and Rosetta passed in attempt 2.

QQ evidence remains source 6da4d967 / run 44120745068 / attempt 1; all 70 original QQ evidence files were compared byte-for-byte with that earlier export. No QQ test was rerun for CF completion. The original package source remains separately identified as 8d.

Both Intel environments lost their WebGL context; the exact actual app precision error and three independent probe samples match. Their transport/lifecycle checks passed, while graphics remain explicitly limited. ARM and Rosetta rendered and played the actual apps. Independent reviews inspected 22 original images per game. No physical ESP32 controller or native full-game-completion claim is made.

An alternate standard ARM macos-15 image was researched after the capacity failure, but the original macos-latest job obtained a runner before any alternate patch or dispatch. No alternate workflow was run.
