# Original QA-only run 44120745068

Artifact source remains 8d647598 / original build run 44115155028. QA source is 6da4d967. `original-export/` preserves the immutable exported evidence; its manifest hashes were verified locally. No validated package was exported because CF ARM failed its QA predicate.

QQ passed native ARM, occupied-port ARM and Rosetta gameplay/protocol/focus/reconnect/ACK/quit checks. Both Intel runners recorded WebGL context loss (37442), null shader precision in three independent samples, and matching actual application initialization errors; their native transport/lifecycle checks passed with `limited_graphics`, without a gameplay claim.

CF ARM rendered successfully, displayed the complete controller ID, and performed actual turning, movement, shots and pitch aim. It then successfully paused on START (`stage=pause`, `paused=true`, pause count 1, raw START held with cumulative count 2). Pausing deliberately clears/quarantines the game's semantic button cache, so the old QA incorrectly waited for semantic START to stay true. The frozen failed report is retained unchanged; it is not relabeled passed.

The next CF-only QA must observe a new raw START count in the same owner session, fresh cached game polling and the actual target state, then confirm both raw and semantic release. It reuses the unchanged package and preserves QQ's already successful evidence with its original QA source/run, separately from the new CF QA revision.
