# Generic sedan for the AI traffic. Two objects: "body" (white-ish, tinted per instance in game) and "detail" (untinted).
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

B0 = mat("body", "#FFFFFF", 0.5)
B1 = mat("body_lo", "#D9D9D9", 0.6)       # skirts, bumpers (still tinted)
B2 = mat("body_hi", "#FFFFFF", 0.45)
BLK = mat("blk", "#16181D", 0.85)
DK = mat("dk", "#262A33", 0.8)
GLS = mat("glass", "#1F2A38", 0.2)
CHR = mat("chrome", "#C9CED8", 0.35, 0.6)
LAMP = mat("lamp", "#FFF4C0", 0.4)
TAIL = mat("tail", "#B01010", 0.5)
AMB = mat("amber", "#E8A030", 0.5)
TIRE = mat("tire", "#16181D", 0.9)
RIM = mat("rim", "#B9BEC8", 0.4, 0.5)
WHT = mat("white", "#F2F2EA", 0.7)

# lower body x +-0.9: rear bottom -> trunk -> hood -> nose; wheel arches r 0.42 at z +-1.35
low = [(-2.15, 0.30), (-2.15, 0.84), (-2.02, 0.90), (-1.10, 0.92), (0.95, 0.92), (1.55, 0.86), (2.05, 0.74), (2.15, 0.64), (2.15, 0.36), (2.10, 0.30)]
low += list(reversed(arch(1.35, 0.42, 0.30)))
low += list(reversed(arch(-1.35, 0.42, 0.30)))
lower = prof(low, -0.9, 0.9, B0, bevel=0.035, name="lower")
cab = [(-1.32, 0.90), (-0.98, 1.37), (-0.90, 1.41), (0.50, 1.41), (0.58, 1.37), (1.02, 0.90)]
cabin = prof(cab, -0.78, 0.78, B2, bevel=0.025, name="cabin")
skirt = gbox((0, 0.40, 0), (1.82, 0.12, 2.1), B1, bevel=0.01)
bump_f = gbox((0, 0.42, 2.17), (1.84, 0.24, 0.12), B1, bevel=0.035)
bump_r = gbox((0, 0.42, -2.17), (1.84, 0.24, 0.12), B1, bevel=0.035)
body = jn([lower, cabin, skirt, bump_f, bump_r], "body")

d = []
# greenhouse glass: sloped side windows and screens
def side_glass(sx):
    pts = [(-1.18, 0.96), (-0.92, 1.33), (0.46, 1.33), (0.90, 0.96)]
    return prof(pts, sx * 0.785, sx * 0.80 if sx > 0 else sx * 0.80, GLS, name="sg") if False else prof(pts, min(sx * 0.775, sx * 0.80), max(sx * 0.775, sx * 0.80), GLS, name="sg")
d += [side_glass(1), side_glass(-1)]
# windscreen / rear window
def slab(p0, p1, thick, w, m):
    (z0, y0), (z1, y1) = p0, p1
    dz, dy = z1 - z0, y1 - y0
    L = math.hypot(dz, dy); nz, ny = dy / L, -dz / L
    pts = [(z0, y0), (z1, y1), (z1 + nz * thick, y1 + ny * thick), (z0 + nz * thick, y0 + ny * thick)]
    return prof(pts, -w / 2, w / 2, m, name="slab")
d.append(slab((1.0, 0.93), (0.60, 1.36), 0.03, 1.50, GLS))
d.append(slab((-0.96, 1.36), (-1.30, 0.93), 0.03, 1.50, GLS))
# door lines + handles
for sx in (-1, 1):
    for z in (0.55, -0.55, -0.1):
        pass
    for z in (0.62, -0.38):
        d.append(gbox((sx * 0.905, 0.62, z), (0.01, 0.42, 0.015), DK))
    d.append(gbox((sx * 0.905, 0.78, 0.12), (0.01, 0.42, 0.015), DK))
    d.append(gbox((sx * 0.915, 0.83, 0.38), (0.02, 0.03, 0.16), CHR))
    d.append(gbox((sx * 0.915, 0.83, -0.62), (0.02, 0.03, 0.16), CHR))
    # mirrors
    d.append(gbox((sx * 0.92, 1.02, 0.78), (0.1, 0.1, 0.14), BLK, bevel=0.015))
# lights
for sx in (-1, 1):
    d.append(gbox((sx * 0.68, 0.66, 2.16), (0.40, 0.16, 0.05), LAMP, bevel=0.01))
    d.append(gbox((sx * 0.68, 0.66, -2.16), (0.40, 0.16, 0.05), TAIL, bevel=0.01))
    d.append(gbox((sx * 0.72, 0.50, 2.17), (0.28, 0.06, 0.04), AMB))
d.append(gbox((0, 0.64, 2.17), (0.7, 0.18, 0.04), BLK))           # grille
d.append(gbox((0, 0.64, 2.195), (0.5, 0.025, 0.02), CHR))
d.append(gbox((0, 0.46, 2.18), (0.45, 0.1, 0.02), WHT))              # plates
d.append(gbox((0, 0.50, -2.18), (0.45, 0.1, 0.02), WHT))
d.append(gbox((0, 0.24, 2.15), (1.7, 0.06, 0.08), BLK))             # lower air dam
# wheel arch liners
for z in (1.35, -1.35):
    for sx in (-1, 1):
        d.append(gbox((sx * 0.70, 0.48, z), (0.25, 0.50, 0.9), BLK))
# wheels (tire + rim, kept light)
for sx in (-1, 1):
    for z in (1.35, -1.35):
        d.append(gcyl_x(0.34, 0.26, (sx * 0.84, 0.34, z), TIRE, n=10))
        d.append(gcyl_x(0.21, 0.02, (sx * 0.975, 0.34, z), RIM, n=8))
detail = jn(d, "detail")
