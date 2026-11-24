# Shared helpers for the Dolmus vehicle model scripts (run inside Blender through forge_bl.py).
# Everything below is written in GAME coordinates (x right/left, y up, z forward) and mapped to Blender (x, -z, y),
# so the glTF exporter (Blender Z-up -> glTF Y-up) gives back the same axes the game uses.
import bmesh


def V(x, y, z):
    return (x, -z, y)


def gbox(c, s, m, ry=0.0, rx=0.0, bevel=0.0, name=None):
    """Box centred at game point c with game size s=(sx, sy, sz)."""
    o = box(size=(s[0], s[2], s[1]), loc=V(*c), m=m, rot=(rx, 0, ry), bevel=bevel)
    if name:
        o.name = name
    return o


def gcyl_x(r, length, c, m, n=10, r2=None):
    """Cylinder whose axis runs along game x."""
    o = cyl(r, r if r2 is None else r2, length, V(*c), m, n=n, rot=(0, math.pi / 2, 0))
    return o


def gcyl_y(r1, r2, h, c, m, n=8):
    """Vertical cylinder / cone centred at game point c."""
    return cyl(r1, r2, h, V(*c), m, n=n)


def gcyl_z(r, length, c, m, n=10, r2=None):
    o = cyl(r, r if r2 is None else r2, length, V(*c), m, n=n, rot=(math.pi / 2, 0, 0))
    return o


def prof(pts, x0, x1, m, bevel=0.0, name="prof"):
    """Extrude a side profile polygon of (z, y) game points along x from x0 to x1."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    a = [bm.verts.new(V(x0, y, z)) for z, y in pts]
    b = [bm.verts.new(V(x1, y, z)) for z, y in pts]
    bm.faces.new(a)
    bm.faces.new(list(reversed(b)))
    n = len(pts)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([a[j], a[i], b[i], b[j]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new("bevel", "BEVEL")
        md.width = bevel
        md.segments = 1
        md.limit_method = "ANGLE"
    return o


def arch(zc, r, y0, n=7):
    """Half-circle notch (as a list of (z, y) points, rear to front) for a wheel arch."""
    return [(zc - r * math.cos(math.pi * i / n), y0 + r * math.sin(math.pi * i / n)) for i in range(n + 1)]


def apply_mods(o):
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)


def jn(objs, name):
    """Join objects (modifiers applied first so bevels survive); per-object materials are kept as slots."""
    objs = [o for o in objs if o is not None]
    for o in objs:
        apply_mods(o)
    return join(objs, name)


def wheel_obj(r, w, name, tire, rim, hub, n=12, bolts=5):
    """Wheel with the axis along game x, centred on the origin."""
    t = gcyl_x(r, w, (0, 0, 0), tire, n=n)
    # sidewall bulge: slightly narrower, larger cylinder ring would add polygons; keep a rim disc on both faces
    parts = [t]
    for sx in (-1, 1):
        parts.append(gcyl_x(r * 0.62, 0.04, (sx * (w / 2 + 0.005), 0, 0), rim, n=n))
        parts.append(gcyl_x(r * 0.22, 0.06, (sx * (w / 2 + 0.02), 0, 0), hub, n=8))
        for k in range(bolts):
            a = 2 * math.pi * k / bolts
            parts.append(gcyl_x(r * 0.05, 0.05, (sx * (w / 2 + 0.03), r * 0.4 * math.cos(a), r * 0.4 * math.sin(a)), hub, n=5))
    return jn(parts, name)


def origin_to(o, pt):
    """Set the object origin to game point pt without moving the mesh."""
    bpy.context.scene.cursor.location = V(*pt)
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    return o
