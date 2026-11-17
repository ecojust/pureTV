# Art and interaction

Original cream paper word cards with green legal-edge frames, gold differing letters, rose cursor and repeated per-letter underlines. Full dictionaries stay visible in a four-column grid, maximum24 cards at138×42 with147×48 pitch. Every English word uses27px glyphs; current/target words32px and separate large panels. Current card '=' and goal card 'G' supplement their tint. Word order is alphabetical, never a disguised route.

The right panel compares the selected candidate one letter per53×43 tile, displays exact difference status, used/allowed steps, remaining undo credits and complete numbered path. Maximum retained path is12 words, shown in two columns over six rows; its latest word has a highlighted strip. No truncation or omitted earlier moves. Underlines denote actual current-to-candidate differences, including invalid choices, and do not reveal future route distances.

Chinese meanings render in the host HUD through selected/current-word text, not through the ASCII canvas atlas. Every dictionary word can be focused to read its public gloss. This avoids asking users to know an external hidden lexicon or painting unsupported Chinese atlas glyphs. Start stays at path index0; target remains visible throughout.

Original Canvas2D paper tile occupies0..128×128 outside reserved runtime atlas regions. SVG/Android vector icon shows abstract changed-letter rungs, not a game solution. Sidebar/footer text fits their declared widths. Actual960×540/1280×720 full-grid and long-path screenshots still need serialized browser review before freeze; parsing/dimensions alone are not acceptance evidence.
