# Art design — Hex Connection

Original vector atlas and SVG/Android icons: ivory ceramic hexagons, engraved amber horizontal stones and cobalt vertical stones. Physical hex spacing exactly matches axial adjacency; six-sided cursor and goal faces follow the same geometry. Neither a square diagonal nor row wrapping is depicted as adjacency.

The 960×540 game surface places the board left and a fixed goal/selection panel right. The6×6 layout uses radius40, horizontal pitch√3×40 and row pitch60;5×5 uses radius45. Empty-cell indices are25 logical pixels, goal text22, and cursor/last-AI text25. Alphabetic column/row labels explain the row/column keyboard movement. Blue and gold goal faces mark the corresponding coordinate edges. Horizontal and vertical engraved marks distinguish sides without relying only on colour; plum cursor distinguishes selection from either side.

A small black/ivory dot marks the last AI stone; the side panel repeats its coordinate. The last player stone has a small gold dot. The terminal connected route receives six-sided actor-coloured outlines. Empty tiles remain numbered, and no hint or answer route is displayed before a real win. Stone count is not presented as the goal.

All art is generated through the game's own atlas paint functions and hand-authored vectors. No downloaded or generated third-party imagery is used. Custom regions stay above y192 and avoid reserved renderer disc/white/glyph regions. This document describes design intent; actual960×540/1280×720 screenshots, visual acceptance and video review are separate QA artifacts. No physical device claim is made.
