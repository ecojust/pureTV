# Delivery van (single object, vertex-coloured in game). Front = +z, length ~5.6.
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

W0 = mat("white", "#F4F4F0", 0.55)
W1 = mat("white_lo", "#D6D9DF", 0.6)
CH = mat("chassis", "#8A8F99", 0.6)
BLK = mat("blk", "#16181D", 0.85)
GLS = mat("glass", "#27324A", 0.2)
BLUE = mat("blue", "#1D5B8F", 0.5)
RED = mat("red", "#D9343F", 0.5)
LAMP = mat("lamp", "#FFF4C0", 0.4)
TAILM = mat("tail", "#B01010", 0.5)
CHR = mat("chrome", "#C9CED8", 0.35, 0.6)
TIRE = mat("tire", "#16181D", 0.9)
RIM = mat("rim", "#C9CED8", 0.4, 0.5)
YEL = mat("yellow", "#F2C318", 0.5)

# tall cargo box (x +-1.05) behind a cab with a sloped hood (x +-1.0); arches cut into the cab profile
cargo = prof([(-2.80, 0.46), (-2.80, 2.80), (-2.72, 2.90), (0.95, 2.90), (1.02, 2.82), (1.02, 0.46)], -1.05, 1.05, W0, bevel=0.05, name="cargo")
cab_pts = [(0.90, 0.46), (0.90, 2.08), (1.30, 2.08), (1.42, 2.04), (2.15, 1.40), (2.55, 1.28), (2.78, 1.12), (2.86, 0.98), (2.86, 0.56), (2.78, 0.46)]
cab_pts += list(reversed(arch(1.8, 0.50, 0.46)))
cab_pts += list(reversed(arch(-1.7, 0.50, 0.46)))
cab = prof(cab_pts, -1.0, 1.0, W0, bevel=0.04, name="cab")
skirt = gbox((0, 0.55, -0.1), (2.14, 0.22, 5.4), CH, bevel=0.02)
roof_stripe = gbox((0, 2.93, -1.55), (2.1, 0.08, 2.5), BLUE, bevel=0.01)
side_stripe = [gbox((sx * 1.056, 1.55, -0.9), (0.02, 0.5, 3.4), RED) for sx in (-1, 1)]
side_logo = [gbox((sx * 1.062, 1.55, -0.9), (0.015, 0.2, 1.8), W0) for sx in (-1, 1)]
rear_door = gbox((0, 1.7, -2.805), (1.9, 1.9, 0.03), W1, bevel=0.01)
rear_line = gbox((0, 1.7, -2.822), (0.02, 1.9, 0.02), BLK)
bump_r = gbox((0, 0.40, -2.88), (2.1, 0.30, 0.16), BLK, bevel=0.03)
bump_f = gbox((0, 0.36, 2.9), (2.1, 0.34, 0.18), BLK, bevel=0.04)
d = [cargo, cab, skirt, roof_stripe, rear_door, rear_line, bump_r, bump_f] + side_stripe + side_logo


def slab(p0, p1, thick, w, m):
    (z0, y0), (z1, y1) = p0, p1
    dz, dy = z1 - z0, y1 - y0
    L = math.hypot(dz, dy)
    nz, ny = dy / L, -dz / L
    pts = [(z0, y0), (z1, y1), (z1 + nz * thick, y1 + ny * thick), (z0 + nz * thick, y0 + ny * thick)]
    return prof(pts, -w / 2, w / 2, m, name="slab")


d.append(slab((2.12, 1.43), (1.38, 2.04), 0.04, 1.8, GLS))
for sx in (-1, 1):
    d.append(prof([(1.05, 1.52), (1.05, 2.0), (1.32, 2.0), (1.98, 1.50)], min(sx * 0.99, sx * 1.015), max(sx * 0.99, sx * 1.015), GLS, name="sw"))
    d.append(gbox((sx * 0.78, 0.82, 2.88), (0.46, 0.22, 0.05), LAMP, bevel=0.015))
    d.append(gbox((sx * 0.9, 0.9, -2.82), (0.2, 0.5, 0.04), TAILM, bevel=0.01))
    d.append(gbox((sx * 1.12, 1.85, 1.95), (0.06, 0.05, 0.4), BLK))
    d.append(gbox((sx * 1.22, 1.85, 1.95), (0.08, 0.4, 0.2), BLK, bevel=0.015))
d.append(gbox((0, 0.76, 2.88), (1.0, 0.26, 0.05), BLK))
for k in range(3):
    d.append(gbox((0, 0.68 + k * 0.08, 2.9), (0.9, 0.02, 0.02), CHR))
d.append(gbox((0, 0.44, 2.99), (0.5, 0.12, 0.02), W0))
d.append(gbox((0, 0.48, -2.97), (0.5, 0.12, 0.02), W0))
for z in (1.8, -1.7):
    for sx in (-1, 1):
        d.append(gbox((sx * 0.78, 0.66, z), (0.3, 0.7, 1.1), BLK))
for sx in (-1, 1):
    for z in (1.8, -1.7):
        d.append(gcyl_x(0.4, 0.28, (sx * 0.98, 0.4, z), TIRE, n=12))
        d.append(gcyl_x(0.24, 0.03, (sx * 1.125, 0.4, z), RIM, n=8))
for z in (-2.2, -1.0, 0.2):
    d.append(gbox((0, 3.06, z), (1.9, 0.04, 0.05), BLK))
for sx in (-1, 1):
    d.append(gbox((sx * 0.95, 3.04, -1.0), (0.04, 0.04, 2.6), BLK))
d.append(gbox((0, 2.12, 1.1), (0.3, 0.06, 0.2), YEL))
jn(d, "van")
