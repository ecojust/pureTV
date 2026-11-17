# Art design — Traffic Escape

Original top-down parking scene: blue slate asphalt, warm ivory dashboard, separately numbered vehicles with windows, headlights, wheels and body arrows. Two-cell cars and three-cell trucks use distinct vector atlas bodies. Id0/display1 has red paint, a white forward arrow and rear stripe; target identity is not colour-only.

The6×6 grid is384×384 logical pixels at(65,92), cell size64. Vehicle dimensions correspond to occupied cells, with small gutters for the grid. The gate opens only on the third row's right edge; a marked lane and EXIT arrow continue outside the board. A terminal target is drawn one cell through that gate, matching the exit trigger. Other edges remain solid.

Cyan square identifies the cell cursor; gold outline identifies the entire selected vehicle. Numbers are26px in ivory badges and remain upright on vertical vehicles. Body arrows and the side panel both state the permitted axis. The dashboard shows used/budget slides, three visible undo tickets and current cursor/selected-car mode. Controls switch between A SELECT and A RELEASE. No-refund undo is explicit in the side panel and Chinese instructions.

Custom atlas cells occupy y0..256 and avoid reserved disc,white and glyph regions. Rounded shapes use local Canvas path code plus supported gradient helpers. Icons are hand-authored SVG and Android vectors, with no external artwork. No actual visual/hardware acceptance is implied by this design document; separate QA records must inspect960×540/1280×720 screenshots and recorded play against the final production asset hashes.
