# Art design — Quadrant Five

Original four-turntable board with ivory recessed plates, white ring-engraved stones and blue diamond-engraved stones. Each3×3 plate has a clear physical gap to its neighbours. Numeric quadrant labels correspond to the side panel's2×2 Q1–Q4 map. Row/column labels remain stable while stones rotate.

Place stage uses a plum single-cell cursor. Rotate stage replaces it with a gold whole-quadrant frame, a large CW/CCW curved arrow and explicit STEP2 instructions. A separate2×2 selector map makes directional navigation unambiguous. The placed stone remains visible during the mandatory rotation stage; no fake animation or preview changes the model. Last-AI marker follows its actual current coordinate through later rotations.

Logical cell spacing60px yields58px stone sprites and23px empty indices. Main instructions fit348px with measured text sizing; counters live in the common HUD. Draw/tie rules are printed in the footer and Chinese instructions. Both circle/diamond engraving and colour identify the sides.

All textures/icons are original Canvas/SVG/Android vectors; no external imagery. Atlas regions avoid reserved core/glyph slots. This is design intent only; actual960/1280 screenshots, ordinary-input recordings and final asset-hash acceptance are separate QA evidence. No physical-device claim.
