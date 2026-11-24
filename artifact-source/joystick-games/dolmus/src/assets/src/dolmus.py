# Dolmus (Istanbul shared minibus): yellow body, dark detail, sliding door and wheel as separate named objects.
# Game axes: x lateral, y up, z forward (front = +z). The side door is on the -x side.
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

Y = mat("yel", "#FFD11F", 0.55)          # main body
Y2 = mat("yel_hi", "#FFE04A", 0.5)       # roof / cabin
Y3 = mat("yel_lo", "#E8B80C", 0.6)       # lower trim / skirts
BLK = mat("blk", "#1D1D1F", 0.8)
DK = mat("dk", "#30343D", 0.8)
GLS = mat("glass", "#27324A", 0.25)
GLS2 = mat("glass2", "#2F3B55", 0.25)
CHR = mat("chrome", "#C9CED8", 0.35, 0.6)
WHT = mat("white", "#F4F4EE", 0.7)
SGN = mat("signbox", "#FFF7E0", 0.7)
TIRE = mat("tire", "#1D1F26", 0.9)
RIM = mat("rim", "#C9CED8", 0.4, 0.5)
RED = mat("red", "#8A1410", 0.6)

# ---- lower body (x +-1.05) with wheel-arch notches, rear -> front along the bottom, then up the nose
low = [(-2.60, 0.46), (-2.60, 1.30), (-2.55, 1.36), (1.95, 1.36), (2.40, 1.22), (2.56, 1.12), (2.62, 1.02), (2.62, 0.56), (2.56, 0.46)]
low += list(reversed(arch(1.65, 0.50, 0.46)))      # front arch (walking rear-ward along the bottom)
low += list(reversed(arch(-1.60, 0.50, 0.46)))
lower = prof(low, -1.05, 1.05, Y, bevel=0.03, name="lower")
# cabin (x +-0.98): vertical rear, flat roof, raked windscreen
cab = [(-2.52, 1.30), (-2.52, 2.18), (-2.44, 2.30), (1.40, 2.33), (1.52, 2.28), (2.15, 1.36), (2.15, 1.30)]
cabin = prof(cab, -0.98, 0.98, Y2, bevel=0.025, name="cabin")
# lower skirt strip (darker yellow) and black belt stripe
skirt = gbox((0, 0.56, 0), (2.12, 0.14, 5.0), Y3, bevel=0.01)
belt = gbox((0, 0.90, 0), (2.13, 0.11, 5.12), BLK)
# roof sign box + vents
signbox = gbox((0, 2.51, 0.6), (1.2, 0.34, 0.5), SGN, bevel=0.03)
vent = gbox((0, 2.38, -1.3), (0.7, 0.07, 0.7), Y3, bevel=0.02)
rib1 = gbox((0.55, 2.355, -0.2), (0.07, 0.04, 3.4), Y3); rib2 = gbox((-0.55, 2.355, -0.2), (0.07, 0.04, 3.4), Y3)

body = [lower, cabin, skirt, signbox, vent, rib1, rib2]

# ---- dark detail (separate object)
d = []
# bumpers
d.append(gbox((0, 0.30, 2.64), (2.18, 0.34, 0.26), DK, bevel=0.04))
d.append(gbox((0, 0.30, -2.64), (2.18, 0.34, 0.26), DK, bevel=0.04))
d.append(gbox((0, 0.14, 2.74), (1.2, 0.06, 0.1), BLK))     # splitter
d.append(belt)
body.remove(belt) if belt in body else None
# grille + badge
d.append(gbox((0, 0.80, 2.61), (1.15, 0.30, 0.04), BLK))
for k in range(4):
    d.append(gbox((0, 0.69 + k * 0.075, 2.635), (1.05, 0.02, 0.02), CHR))
d.append(gbox((0, 0.93, 2.63), (0.2, 0.1, 0.03), CHR, bevel=0.01))
# plates
d.append(gbox((0, 0.50, 2.665), (0.52, 0.12, 0.02), WHT))
d.append(gbox((0, 0.50, -2.665), (0.52, 0.12, 0.02), WHT))
# front headlight housings (the lit lenses are a separate emissive mesh in the game)
for sx in (-1, 1):
    d.append(gbox((sx * 0.82, 0.62, 2.60), (0.46, 0.26, 0.04), BLK, bevel=0.02))
    d.append(gbox((sx * 0.9, 0.7, -2.60), (0.38, 0.28, 0.04), BLK, bevel=0.02))
# wheel arch liners and flares
for z in (1.65, -1.60):
    for sx in (-1, 1):
        d.append(gbox((sx * 0.80, 0.60, z), (0.25, 0.66, 1.1), BLK))
        d.append(gbox((sx * 1.075, 0.96, z), (0.03, 0.05, 1.12), DK))      # arch lip
# windows: x side panes, windscreen, rear glass
def side_win(sx, zc, ln=0.85, y0=1.58, h=0.56):
    return gbox((sx * 0.99, y0 + h / 2, zc), (0.025, h, ln), GLS, bevel=0.012)
for zc in (-2.0, -0.85):
    for sx in (-1, 1):
        d.append(side_win(sx, zc))
d.append(side_win(1, 0.3)); d.append(side_win(1, 1.72, 0.8)); d.append(side_win(-1, 1.72, 0.8))
# door opening panel on the -x side (the sliding door covers it when closed)
d.append(gbox((-1.055, 1.2, 0.75), (0.03, 1.5, 1.26), BLK))
# windscreen: thin slab parallel to the rake
def slab(p0, p1, thick, w, m):
    (z0, y0), (z1, y1) = p0, p1
    dz, dy = z1 - z0, y1 - y0
    L = math.hypot(dz, dy); nz, ny = dy / L, -dz / L        # outward normal (up-front)
    pts = [(z0, y0), (z1, y1), (z1 + nz * thick, y1 + ny * thick), (z0 + nz * thick, y0 + ny * thick)]
    return prof(pts, -w / 2, w / 2, m, name="slab")
d.append(slab((2.10, 1.48), (1.62, 2.18), 0.035, 1.78, GLS2))
d.append(gbox((0, 1.88, -2.535), (1.72, 0.55, 0.03), GLS, bevel=0.012))
# wipers
d.append(gbox((-0.35, 1.52, 2.14), (0.7, 0.025, 0.02), BLK, ry=0, rx=0.0))
# mirrors on arms
for sx in (-1, 1):
    d.append(gbox((sx * 1.12, 1.62, 2.0), (0.14, 0.04, 0.04), BLK))
    d.append(gbox((sx * 1.2, 1.66, 1.98), (0.07, 0.3, 0.2), BLK, bevel=0.015))
# door handles + fuel flap
d.append(gbox((1.06, 1.18, 0.95), (0.03, 0.05, 0.22), CHR))
d.append(gbox((1.06, 1.0, -1.0), (0.03, 0.2, 0.18), DK))
# rear ladder / step + tow hook
d.append(gbox((0, 0.58, -2.62), (1.0, 0.04, 0.03), BLK))
detail = jn(d, "detail")

# ---- sliding door (origin at its centre, as the game positions it)
door = [gbox((0, 0, 0), (0.07, 1.55, 1.3), Y, bevel=0.02),
        gbox((-0.04, 0.2, 0), (0.03, 0.55, 1.0), GLS, bevel=0.01),
        gbox((-0.045, -0.12, 0.45), (0.03, 0.05, 0.2), CHR),
        gbox((-0.03, -0.62, 0), (0.05, 0.22, 1.2), Y3),
        gbox((-0.04, -0.15, 0), (0.025, 0.06, 1.28), BLK)]
door = jn(door, "door")

# ---- wheel
wheel = wheel_obj(0.4, 0.3, "wheel", TIRE, RIM, CHR, n=12)

# body gets joined last so the joined object keeps the slot materials
bodyo = jn(body, "body")
# park the wheel and door beside the vehicle for the preview only (the game positions them itself)
door.location = V(-1.07, 1.2, 0.75)
for sx, z in ((1, 1.65), (-1, 1.65), (1, -1.6), (-1, -1.6)):
    w = wheel.copy(); w.data = wheel.data; bpy.context.scene.collection.objects.link(w)
    w.location = V(sx * 1.0, 0.4, z); w.name = "wheel_preview"
wheel.location = V(3.2, 0.4, 0)
