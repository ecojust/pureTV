# Art design — Sorting Wires

Original electronics workbench style: blue-green perforated board, copper/mint comparator sleeves, ivory endpoint terminals and engraved circuit icon. Horizontal wires flow left-to-right; numbered rows increase downward, matching min-to-upper/max-to-lower comparison. Layers are labelled L1..L5 and highlighted as columns.

Two bars in one layer receive separate−12/+12px offsets. This makes nested or crossing endpoint pairs readable. Only comparator endpoints have large connection dots; dark sleeves interrupt intermediate wire crossings without adding dots. The current endpoint has white corner brackets, pending source a gold ring and valid pending span a dashed preview. Installing from bottom to top still draws the normalized upper/lower endpoints correctly.

The board occupies600×374 logical pixels. Wire labels25px, layer labels26px, input/output bits24px and sidebar labels22–27px remain readable in the960×540 design. Inventory and three check indicators are separate. The last failing input/output is shown in the sidebar; graph end terminals show its bits only when the latest check still matches the current network. Editing retains the sidebar witness with an explicit OLD TEST / EDITED heading and hides stale graph bits.

Custom atlas regions fit within y0..256 and avoid reserved disc/white/glyph slots. Icons show a decorative incomplete two-comparator circuit, not a solution. They are original SVG and Android vectors, with no external images. This document records design intent; actual960/1280 screenshot inspection, browser play and video review are separate final QA evidence. No physical-device acceptance is claimed.
