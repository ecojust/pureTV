# Street vendors: a simit (sesame bread ring) cart and a roasted-chestnut cart, each with the vendor (static figure).
# Origin on the ground below the cart centre; the vendor stands at +z (1 m). Two separate objects so the game can instance each.
exec(compile(open(r"D:\Claude Projeleri Master\oyunlar\dolmus\assets\src\_prelude.py", encoding="utf-8").read(), "_prelude.py", "exec"), globals())

RED = mat("cart_red", "#C0392B", 0.6)
RED2 = mat("cart_red_dark", "#8F2A20", 0.6)
GLASS = mat("glass_blue", "#9FD6E8", 0.2)
STEEL = mat("steel", "#3D4350", 0.6, 0.3)
TIRE = mat("tire", "#2B2B2B", 0.9)
GOLD = mat("simit", "#D9902F", 0.8)
GOLD2 = mat("simit_dark", "#B8741F", 0.8)
WHT = mat("white", "#FFF3E0", 0.7)
SKIN = mat("skin", "#E6B48F", 0.8)
BLUEC = mat("vendor_blue", "#2F5F8F", 0.8)
CREAM = mat("cap", "#F0E6D2", 0.8)
DARK = mat("dark", "#2B2B2B", 0.8)
BROWN = mat("brown", "#4B3A2F", 0.8)
BROWN2 = mat("vendor_brown", "#6B4A32", 0.8)
COAL = mat("coal", "#FF7A2A", 0.5, 0, 0.6)
GRY = mat("grey", "#8A8F99", 0.6, 0.3)
PAPER = mat("paper", "#E8D8B0", 0.8)


def vendor(coat, hat, apron=None):
    p = [gcyl_y(0.26, 0.2, 1.15, (0, 0.575, 1.0), coat, n=8),
         sphere(0.19, V(0, 1.45, 1.0), SKIN, n=8, rings=5),
         gcyl_y(0.2, 0.2, 0.12, (0, 1.62, 1.0), hat, n=8)]
    # arms resting forward on the cart
    for sx in (-1, 1):
        p.append(gbox((sx * 0.27, 1.0, 0.8), (0.09, 0.09, 0.45), coat, bevel=0.01))
    return p


def wheel2(x, z, r=0.32):
    return [gcyl_x(r, 0.1, (x, r, z), TIRE, n=10), gcyl_x(r * 0.45, 0.12, (x, r, z), GRY, n=8)]


# ---------------- simit cart
d = []
d.append(gbox((0, 0.5, 0), (1.7, 0.8, 1.0), RED, bevel=0.03))
d.append(gbox((0, 0.92, 0), (1.74, 0.06, 1.04), RED2, bevel=0.015))                 # counter lip
# glass case with frame and simit rings inside
d.append(gbox((0, 1.3, 0), (1.6, 0.6, 0.9), GLASS, bevel=0.015))
for sx in (-1, 1):
    d.append(gbox((sx * 0.8, 1.3, 0), (0.05, 0.62, 0.92), STEEL))
d.append(gbox((0, 1.62, 0), (1.66, 0.05, 0.96), STEEL))
for i in range(4):
    for j in range(2):
        bpy.ops.mesh.primitive_torus_add(major_radius=0.15, minor_radius=0.05, major_segments=10, minor_segments=5, location=V(-0.6 + i * 0.4, 1.06 + j * 0.1, 0.0))
        t = bpy.context.object; t.data.materials.append(GOLD if (i + j) & 1 else GOLD2); d.append(t)
# drawer + handle
d.append(gbox((0.0, 0.45, -0.52), (0.9, 0.35, 0.04), RED2))
d.append(gbox((0.0, 0.52, -0.55), (0.3, 0.04, 0.04), STEEL))
# push handle and wheels
d.append(gbox((0, 0.85, -0.85), (1.3, 0.05, 0.05), STEEL))
for sx in (-1, 1):
    d.append(gbox((sx * 0.6, 0.65, -0.7), (0.05, 0.05, 0.4), STEEL, ry=0))
d += wheel2(-0.7, -0.6) + wheel2(0.7, -0.6)
d.append(gbox((0, 0.12, 0.35), (1.3, 0.05, 0.05), STEEL)); d.append(gbox((-0.6, 0.15, 0.4), (0.04, 0.3, 0.04), STEEL)); d.append(gbox((0.6, 0.15, 0.4), (0.04, 0.3, 0.04), STEEL))
# umbrella: pole + 8 red/white panels
d.append(gcyl_y(0.05, 0.05, 1.7, (0, 2.5, 0.0), STEEL, n=6))
bpy.ops.mesh.primitive_cone_add(vertices=8, radius1=1.95, radius2=0.0, depth=0.55, location=V(0, 3.25, 0))
um = bpy.context.object; um.data.materials.append(RED); um.data.materials.append(WHT)
for i, poly in enumerate(um.data.polygons):
    poly.material_index = i & 1 if len(poly.vertices) == 3 else 0
d.append(um)
d.append(gcyl_y(0.06, 0.06, 0.12, (0, 3.56, 0), STEEL, n=6))
# a stack of simit hanging on a hook, and the vendor
d.append(gbox((0.7, 1.85, 0.0), (0.04, 0.04, 0.5), STEEL))
d += vendor(BLUEC, CREAM)
simit = jn(d, "simit_cart")

# ---------------- chestnut cart
e = []
e.append(gbox((0, 0.55, 0), (1.7, 0.8, 1.0), BROWN, bevel=0.03))
e.append(gbox((0, 0.97, 0), (1.74, 0.06, 1.04), DARK, bevel=0.015))
# brazier with glowing coals, glass windscreen and chimney
e.append(gbox((0, 1.05, 0.0), (1.2, 0.08, 0.8), DARK))
e.append(gbox((0, 1.1, 0.0), (1.0, 0.04, 0.6), COAL))
for sx in (-1, 1):
    e.append(gbox((sx * 0.52, 1.3, 0), (0.04, 0.45, 0.7), GLASS, bevel=0.01))
e.append(gbox((0, 1.3, -0.33), (1.04, 0.45, 0.04), GLASS, bevel=0.01))
e.append(gcyl_y(0.1, 0.08, 1.4, (0.5, 1.8, -0.2), STEEL, n=8))
e.append(gcyl_y(0.14, 0.14, 0.08, (0.5, 2.55, -0.2), STEEL, n=8))
# paper cones of chestnuts on the counter
for i in range(3):
    c = cyl(0.1, 0.0, 0.3, V(-0.5 + i * 0.12, 1.14 + 0.08, 0.35), PAPER, n=6); e.append(c)
e.append(gbox((-0.4, 1.02, 0.4), (0.4, 0.04, 0.3), PAPER))
e += wheel2(-0.7, -0.6, 0.36) + wheel2(0.7, -0.6, 0.36)
e.append(gbox((0, 0.9, -0.85), (1.3, 0.05, 0.05), STEEL))
e.append(gbox((0.0, 0.2, 0.0), (1.4, 0.06, 0.9), DARK))
e += vendor(BROWN2, DARK)
chestnut = jn(e, "chestnut_cart")
origin_to(simit, (0, 0, 0)); origin_to(chestnut, (0, 0, 0))
chestnut.location = V(3.5, 0, 0)   # beside the first cart for the preview only (the game uses the mesh in its own local space)
