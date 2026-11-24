# City bus: tinted "body" (white, colour per instance) + untinted "detail". Doors are on the -x side (the right side of the vehicle).
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

B0 = mat("body", "#FFFFFF", 0.5)
B1 = mat("body_lo", "#CFCFCF", 0.6)
B2 = mat("body_hi", "#F4F4F4", 0.5)
BLK = mat("blk", "#16181D", 0.85)
DK = mat("dk", "#30343D", 0.8)
GLS = mat("glass", "#1F2A38", 0.2)
GLS2 = mat("glass2", "#26354A", 0.2)
CHR = mat("chrome", "#C9CED8", 0.35, 0.6)
LAMP = mat("lamp", "#FFF4C0", 0.4)
TAIL = mat("tail", "#B01010", 0.5)
AMB = mat("amber", "#FFB020", 0.5)
TIRE = mat("tire", "#16181D", 0.9)
RIM = mat("rim", "#B9BEC8", 0.4, 0.5)
WHT = mat("white", "#F2F2EA", 0.7)
GRY = mat("grey", "#8A8F99", 0.6)

# main shell x +-1.25; arches r 0.62 at z +-3.6 (wheel r 0.5 centred y 0.5)
shell = [(-5.75, 0.50), (-5.75, 2.95), (-5.62, 3.18), (-5.35, 3.22), (5.35, 3.22), (5.58, 3.16), (5.75, 2.72), (5.75, 0.62), (5.62, 0.50)]
shell += list(reversed(arch(3.6, 0.62, 0.50, 8)))
shell += list(reversed(arch(-3.6, 0.62, 0.50, 8)))
lower = prof(shell, -1.25, 1.25, B0, bevel=0.05, name="shell")
skirt = gbox((0, 0.62, 0), (2.54, 0.34, 11.4), B1, bevel=0.02)
roofcap = gbox((0, 3.24, 0), (2.2, 0.08, 10.8), B2, bevel=0.02)
ac1 = gbox((0, 3.38, -1.6), (1.5, 0.22, 2.4), B2, bevel=0.06)
ac2 = gbox((0, 3.36, 2.2), (1.1, 0.18, 1.5), B2, bevel=0.05)
body = jn([lower, skirt, roofcap, ac1, ac2], "body")

d = []


def pane(sx, z0, z1, y0=1.55, y1=2.72, m=GLS):
    return gbox((sx * 1.262, (y0 + y1) / 2, (z0 + z1) / 2), (0.03, y1 - y0, z1 - z0), m, bevel=0.012)


# right (+x) side: continuous windows with pillars
zs = [-5.3, -3.9, -2.5, -1.1, 0.3, 1.7, 3.1]
for a in zs:
    d.append(pane(1, a + 0.06, a + 1.34))
d.append(pane(1, 4.56, 5.30))
# left (-x) side: windows, middle door (z -1.25..0.15) and front door (z 3.95..5.25)
for a in (-5.3, -3.9, -2.5):
    d.append(pane(-1, a + 0.06, a + 1.34))
d.append(pane(-1, 0.25, 1.75)); d.append(pane(-1, 1.85, 3.2)); d.append(pane(-1, 3.3, 3.85))
for z0, z1 in ((-1.25, 0.15), (3.95, 5.25)):
    zc = (z0 + z1) / 2
    d.append(gbox((-1.265, 1.62, zc), (0.03, 2.3, z1 - z0), BLK, bevel=0.012))
    for h in (-1, 1):
        d.append(gbox((-1.285, 1.7, zc + h * (z1 - z0) / 4), (0.03, 2.0, (z1 - z0) / 2 - 0.1), GLS2))
# windscreen and nose
d.append(gbox((0, 2.1, 5.775), (2.2, 1.35, 0.04), GLS, bevel=0.02))
d.append(gbox((0, 2.98, 5.775), (1.7, 0.2, 0.04), AMB))
d.append(gbox((0, 1.20, 5.77), (2.3, 0.62, 0.04), DK))
d.append(gbox((0, 0.26, 5.82), (2.4, 0.34, 0.2), DK, bevel=0.05))
d.append(gbox((0, 0.26, -5.82), (2.4, 0.34, 0.2), DK, bevel=0.05))
for sx in (-1, 1):
    d.append(gbox((sx * 0.95, 0.88, 5.78), (0.42, 0.22, 0.05), LAMP, bevel=0.01))
    d.append(gbox((sx * 0.95, 0.68, 5.78), (0.3, 0.1, 0.04), AMB))
    d.append(gbox((sx * 1.05, 2.0, 5.55), (0.06, 0.04, 0.5), BLK))
    d.append(gbox((sx * 1.4, 2.0, 5.45), (0.1, 0.55, 0.2), BLK, bevel=0.02))
    d.append(gbox((sx * 1.02, 0.95, -5.78), (0.24, 0.5, 0.05), TAIL, bevel=0.01))
    d.append(gbox((sx * 1.02, 1.55, -5.78), (0.24, 0.2, 0.05), TAIL))
d.append(gbox((0, 0.52, 5.80), (0.6, 0.14, 0.02), WHT))
d.append(gbox((0, 0.52, -5.80), (0.6, 0.14, 0.02), WHT))
for k in range(6):
    d.append(gbox((0, 0.95 + k * 0.1, 5.80), (1.2, 0.025, 0.02), CHR))
d.append(gbox((0, 2.1, -5.775), (1.6, 0.9, 0.04), GLS))
for k in range(5):
    d.append(gbox((0, 0.9 + k * 0.17, -5.78), (1.2, 0.05, 0.02), BLK))
d.append(gbox((-0.5, 1.58, 5.8), (0.9, 0.03, 0.02), BLK)); d.append(gbox((0.5, 1.58, 5.8), (0.9, 0.03, 0.02), BLK))
for z in (3.6, -3.6):
    for sx in (-1, 1):
        d.append(gbox((sx * 1.0, 0.70, z), (0.5, 0.72, 1.4), BLK))
for sx in (-1, 1):
    for z in (3.6, -3.6):
        d.append(gcyl_x(0.5, 0.32, (sx * 1.2, 0.5, z), TIRE, n=12))
        d.append(gcyl_x(0.3, 0.03, (sx * 1.37, 0.5, z), RIM, n=10))
        d.append(gcyl_x(0.1, 0.05, (sx * 1.385, 0.5, z), CHR, n=6))
d.append(gbox((0, 3.275, 0.9), (1.0, 0.02, 0.9), GRY))
detail = jn(d, "detail")
