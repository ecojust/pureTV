# Triangle Pegs art direction

Original indigo and ivory solitaire artwork uses a beveled triangular inlay, pearl marbles and dark recessed sockets. Fifteen stable numeric hole labels identify positions even when occupied or empty. The five-row board is rendered from the same public lattice coordinates used by the model.

The cursor uses mint square corner brackets; selected source uses a gold circular ring; valid empty landings use mint circular rings. These have separate shapes and the right-hand legend explains all three. Source and destination remain independently visible. Only current legal jumps from the selected source are marked; the renderer has no solver, future-route hints or state mutations.

The right panel exposes the one-peg goal, cursor/source numbers, available destination labels and total legal jump count. Header/footer and Chinese HUD expose remaining pegs and undo credits. B is labelled CANCEL while a source is active and UNDO otherwise. All logical stage text is at least24pixels.

Four original tiles (board, pearl, socket and medallion) are painted synchronously into one atlas. Gameplay performs sprite batching and simple overlay lines. The SVG and Android vector share a matching15-hole triangle emblem. No third-party imagery is used.

Actual screenshot and video review must be recorded separately; this design document alone claims no completed browser or hardware verification.
