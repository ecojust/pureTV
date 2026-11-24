# One tram car (the game draws two per train). Front = +z, length ~10.6.
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

CRM = mat("cream", "#F4EFE6", 0.55)
RED = mat("red", "#D9343F", 0.5)
RED2 = mat("red_hi", "#E5484D", 0.5)
GRY = mat("grey", "#8A8F99", 0.6)
DG = mat("dgrey", "#555B66", 0.7)
BLK = mat("blk", "#1D2026", 0.85)
GLS = mat("glass", "#27324A", 0.2)
GLS2 = mat("glass2", "#33425E", 0.2)
LAMP = mat("lamp", "#FFF4C0", 0.4)
TAILM = mat("tail", "#B01010", 0.5)
CHR = mat("chrome", "#C9CED8", 0.35, 0.6)
TIRE = mat("tire", "#1D2026", 0.9)
YEL = mat("yellow", "#F2C318", 0.5)
AMB = mat("amber", "#FFB020", 0.5)

shell = [(-5.30, 0.62), (-5.30, 2.82), (-5.18, 2.96), (-4.6, 3.0), (4.6, 3.0), (5.18, 2.96), (5.30, 2.82), (5.30, 0.62)]
body = prof(shell, -1.25, 1.25, CRM, bevel=0.06, name="shell")
band = prof([(-5.34, 0.55), (-5.34, 1.25), (5.34, 1.25), (5.34, 0.55)], -1.27, 1.27, RED, bevel=0.03, name="band")
roof = gbox((0, 3.06, 0), (2.2, 0.14, 10.2), GRY, bevel=0.03)
skirt = gbox((0, 0.50, 0), (2.4, 0.2, 10.4), DG, bevel=0.02)
d = [body, band, roof, skirt]
# window band with pillars and a double door per side
for sx in (-1, 1):
    for z in [-4.55, -3.25, -1.95, 1.25, 2.55, 3.85]:
        d.append(gbox((sx * 1.262, 2.0, z + 0.05), (0.03, 0.92, 1.18), GLS, bevel=0.012))
    d.append(gbox((sx * 1.27, 1.78, -0.5), (0.04, 1.5, 1.5), BLK, bevel=0.012))
    d.append(gbox((sx * 1.285, 1.8, -0.88), (0.03, 1.4, 0.64), GLS2)); d.append(gbox((sx * 1.285, 1.8, -0.12), (0.03, 1.4, 0.64), GLS2))
# cab windscreens and destination displays
for zf in (1, -1):
    d.append(gbox((0, 1.95, zf * 5.32), (2.1, 1.15, 0.04), GLS, bevel=0.02))
    d.append(gbox((0, 2.72, zf * 5.32), (1.2, 0.2, 0.04), AMB))
    d.append(gbox((0, 0.9, zf * 5.33), (2.3, 0.4, 0.04), RED2, bevel=0.02))
    d.append(gbox((0, 0.46, zf * 5.4), (1.4, 0.2, 0.18), BLK, bevel=0.04))
    d.append(gbox((0, 0.64, zf * 5.34), (2.3, 0.08, 0.02), YEL))
for sx in (-1, 1):
    d.append(gbox((sx * 0.8, 0.95, 5.35), (0.34, 0.2, 0.05), LAMP, bevel=0.01))
    d.append(gbox((sx * 0.8, 0.95, -5.35), (0.34, 0.2, 0.05), TAILM, bevel=0.01))
    d.append(gbox((sx * 1.18, 2.0, 5.25), (0.08, 0.35, 0.16), BLK))
# roof equipment: pantograph base and AC boxes
d.append(gbox((0, 3.2, 1.0), (1.4, 0.12, 1.6), DG, bevel=0.03))
d.append(gbox((0, 3.35, 3.0), (1.4, 0.14, 1.2), DG, bevel=0.03))
d.append(gbox((0, 3.35, -3.0), (1.4, 0.14, 1.2), DG, bevel=0.03))
d.append(gbox((0, 3.45, 1.2), (1.1, 0.04, 0.05), CHR))
d.append(gbox((0, 3.35, 1.0), (0.05, 0.3, 0.05), BLK))
# bogies with wheels
for z in (3.4, -3.4):
    d.append(gbox((0, 0.22, z), (2.2, 0.4, 1.8), DG, bevel=0.04))
    for sx in (-1, 1):
        for dz in (-0.55, 0.55):
            d.append(gcyl_x(0.3, 0.12, (sx * 0.9, 0.3, z + dz), TIRE, n=10))
jn(d, "tram")
