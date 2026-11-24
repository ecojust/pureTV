# Bus / dolmus stop shelter. Origin on the ground at the centre of the roof; length along game z, the back wall at x = -0.75.
# Same footprint as the procedural shelter (roof 1.7 x 3.5 m at y 2.45, back wall 3.0 m long, bench 2.2 m).
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

RED = mat("roof_red", "#E5484D", 0.5)
RED2 = mat("roof_edge", "#B83338", 0.5)
TEAL = mat("glass_teal", "#4D7F8F", 0.25)
TEAL2 = mat("glass_pale", "#6FA3B3", 0.25)
STEEL = mat("steel", "#3D4350", 0.6, 0.3)
WOOD = mat("wood", "#9A6A42", 0.8)
WOOD2 = mat("wood_dark", "#7A5232", 0.8)
WHT = mat("white", "#F2F2EA", 0.7)
BLU = mat("blue_board", "#1F5FAE", 0.6)
BIN = mat("bin", "#2F6B4F", 0.7)
LED = mat("led", "#FFE9A8", 0.4)

d = []
# roof: slab with a lip, slight slope towards the road, gutter
d.append(gbox((-0.05, 2.45, 0), (1.7, 0.10, 3.5), RED, bevel=0.025))
d.append(gbox((0.80, 2.40, 0), (0.06, 0.16, 3.5), RED2, bevel=0.01))        # front lip (road side)
d.append(gbox((-0.86, 2.40, 0), (0.06, 0.14, 3.5), RED2, bevel=0.01))
d.append(gbox((0, 2.36, 1.74), (1.7, 0.14, 0.06), RED2, bevel=0.01))
d.append(gbox((0, 2.36, -1.74), (1.7, 0.14, 0.06), RED2, bevel=0.01))
d.append(gbox((-0.05, 2.30, 0), (1.5, 0.05, 3.2), STEEL))                      # under-frame
# glass back wall in a steel frame (three panes) and a short side panel
for k, z in enumerate((-1.0, 0.0, 1.0)):
    d.append(gbox((-0.75, 1.2, z), (0.05, 1.9, 0.92), TEAL if k != 1 else TEAL2, bevel=0.008))
for z in (-1.5, -0.5, 0.5, 1.5):
    d.append(gbox((-0.75, 1.2, z), (0.09, 2.05, 0.06), STEEL))
d.append(gbox((-0.75, 0.2, 0), (0.09, 0.06, 3.1), STEEL))
d.append(gbox((-0.75, 2.2, 0), (0.09, 0.06, 3.1), STEEL))
d.append(gbox((-0.1, 1.15, 1.52), (1.3, 1.8, 0.04), TEAL, bevel=0.008))
d.append(gbox((-0.1, 2.1, 1.52), (1.3, 0.06, 0.06), STEEL))
# pillars (front, road side)
for z in (-1.55, 1.55):
    d.append(gcyl_y(0.06, 0.06, 2.4, (-0.1 if False else 0.1, 1.2, z), STEEL, n=8))
# bench with legs and a back rail
d.append(gbox((-0.45, 0.50, 0), (0.5, 0.07, 2.2), WOOD, bevel=0.015))
d.append(gbox((-0.55, 0.78, 0), (0.06, 0.4, 2.2), WOOD2, bevel=0.015))
for z in (-0.95, 0.95):
    d.append(gbox((-0.45, 0.25, z), (0.4, 0.5, 0.06), STEEL))
# timetable board and line sign on the back wall (front face, towards the road)
d.append(gbox((-0.70, 1.55, -1.0), (0.04, 0.8, 0.55), BLU, bevel=0.01))
d.append(gbox((-0.67, 1.55, -1.0), (0.02, 0.6, 0.4), WHT))
d.append(gbox((-0.70, 1.45, 1.0), (0.04, 1.0, 0.6), WHT, bevel=0.01))
# light strip under the roof
d.append(gbox((0.0, 2.27, 0), (0.06, 0.03, 2.8), LED))
# litter bin at the end of the bench
d.append(gcyl_y(0.18, 0.16, 0.7, (-0.5, 0.35, -1.5), BIN, n=8))
d.append(gcyl_y(0.19, 0.19, 0.05, (-0.5, 0.72, -1.5), STEEL, n=8))
jn(d, "shelter")
