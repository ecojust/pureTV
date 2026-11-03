# Art design — Tile Garden

Original ivory garden tiles and botanical border, with seven independently drawn shape families: ring, square, triangle, diamond, cross, hexagon and leaf. Every tile also carries its family digit, so shape or colour confusion does not prevent matching. Families have consistent digits across layers.

Two-layer levels show separately labelled LOWER/L1 and UPPER/L2 panels side-by-side, with identical cell size and row/column coordinates. No tile face is physically hidden. Active panel header is green; purple square identifies the active cell; gold border identifies the first selected tile even when focus moves to the other panel. A green dot means free, roof means same-cell coverage, and short lateral rails mean both own-layer sides occupied. Blocked tiles retain clear ivory faces and dark family labels.

The6×4 layout uses58px cells in each panel, leaving all28 original tiles publicly readable without superposition. Family digits26px, panel headers24px and coordinates22–23px. Larger levels use64 or78px cells. Global counters occupy a separate bottom strip with measured text widths, and the selected tile repeats family/layer/coordinate there. The one-layer layout uses the spare right panel for the freedom rules.

All atlas paint uses original Canvas paths and supported gradient/ellipse helpers. Tile and shape slots avoid reserved renderer core/glyph regions. SVG/Android icons depict paired leaf tiles, not a level solution. No third-party images used. This design document does not assert actual browser/hardware acceptance; final960/1280 screenshots and encoded video inspection must be recorded separately against exact source hashes.
