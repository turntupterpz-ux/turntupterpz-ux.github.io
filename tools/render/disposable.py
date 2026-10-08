# 2g disposable: one pen standing, one lying in front of it (after the supplier photo).
import os, sys, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *

A = args()
reset()

# ------------------------------------------------------------------ the pen (cm)
W, D, H = 1.9, 1.2, 11.0          # width, depth, height
A0, B0 = W / 2, D / 2
N = 3.2                            # cross-section squareness (2 = oval, higher = boxier)
RB, RT = 0.55, 0.9                 # bottom / top rounding
CAP = 1.75                         # mouthpiece height
ZS = H - CAP                       # seam between body and mouthpiece
WIN_TOP, WIN_H, WIN_HW = ZS - 0.07, 2.45, 0.62   # window on the front
WIN_BOT = WIN_TOP - WIN_H
PORT_Z = 0.95                      # USB-C slot near the bottom
SEG = 256


def smoothstep(e0, e1, x):
    t = clamp((x - e0) / (e1 - e0))
    return t * t * (3 - 2 * t)


def rounded_rect(px, pz, cx, cz, hx, hz, r):
    """Signed distance to a rounded rectangle (negative inside)."""
    qx = abs(px - cx) - hx + r
    qz = abs(pz - cz) - hz + r
    out = math.hypot(max(qx, 0), max(qz, 0))
    return out + min(max(qx, qz), 0) - r


def radius(phi, a, b):
    c, s = abs(math.cos(phi)), abs(math.sin(phi))
    return (((c / a) ** N) + ((s / b) ** N)) ** (-1.0 / N) if a > 1e-6 and b > 1e-6 else 0.0


def profile(z):
    """Half width and half depth of the shell at height z."""
    if z < RB:
        inset = RB - math.sqrt(max(RB * RB - (RB - z) ** 2, 0))
        return max(A0 - inset, 0.0), max(B0 - inset, 0.0)
    if z > H - RT:
        t = clamp((z - (H - RT)) / RT)
        s = (1 - t ** 2.4) ** (1 / 2.4)
        return A0 * s, B0 * s
    return A0, B0


def rings():
    zs = []
    for k in range(28):                            # rounded bottom, dense near the tip
        zs.append(RB - RB * math.cos(math.pi / 2 * k / 28))
    z = RB
    while z < H - RT:
        zs.append(z)
        step = 0.025 if (z > WIN_BOT - 0.2 or z < PORT_Z + 0.35) else 0.07
        z += step
    for k in range(70):
        zs.append(H - RT + RT * math.sin(math.pi / 2 * k / 70))
    return zs


MAT_BODY, MAT_CAP, MAT_WIN, MAT_SEAM, MAT_PORT, MAT_RIM, MAT_MOUTH = range(7)


def shell_point(phi, z):
    a, b = profile(z)
    r = radius(phi, a, b)
    x, y = r * math.cos(phi), r * math.sin(phi)
    front = clamp((-y / B0 - 0.35) / 0.4) if B0 else 0   # 1 on the front face
    inward = 0.0
    tag = MAT_CAP if z > ZS + 0.035 else MAT_BODY
    if abs(z - ZS) <= 0.035:                       # seam groove
        inward = max(inward, 0.022)
        tag = MAT_SEAM
    # scooped dish on the mouthpiece front
    zc, rx, rz = H - 0.95, 0.74, 0.6
    q = math.hypot(x / rx, (z - zc) / rz)
    if q < 1 and front > 0:
        e = smoothstep(1.0, 0.8, q)
        g = 0.25 + 0.75 * smoothstep(zc + rz, zc - rz, z)
        inward = max(inward, 0.11 * e * g * front)
    # window, front and back, so light shines through the oil
    back = clamp((y / B0 - 0.35) / 0.4) if B0 else 0
    side = max(front, back)
    d = rounded_rect(x, z, 0, WIN_TOP - WIN_H / 2, WIN_HW, WIN_H / 2, 0.22)
    if side > 0 and d < 0.02 and z < ZS:
        inward = max(inward, 0.035 * smoothstep(0.02, -0.02, d) * side)
        if d < 0:
            tag = MAT_WIN
    # USB-C slot
    d = rounded_rect(x, z, 0, PORT_Z, 0.30, 0.11, 0.11)
    if front > 0 and d < 0.015:
        inward = max(inward, 0.05 * smoothstep(0.015, -0.015, d) * front)
        if d < 0:
            tag = MAT_PORT if d < -0.028 else MAT_RIM
    # mouth opening on top
    mz = 0.0
    if z > H - 0.35:
        q = math.hypot(x / 0.23, y / 0.085)
        if q < 1.15:
            mz = 0.28 * smoothstep(1.15, 0.85, q)
            if q < 0.95:
                tag = MAT_MOUTH
    if r > 1e-6:
        k = max(r - inward, 0.0) / r
        x, y = x * k, y * k
    return (x, y, z - mz), tag


def build_shell(name, mats):
    zs = rings()
    verts, tags = [], []
    for z in zs:
        for i in range(SEG):
            phi = 2 * math.pi * i / SEG
            p, t = shell_point(phi, z)
            verts.append(p)
            tags.append(t)
    faces = grid_faces(len(zs), SEG)
    face_tags = []
    for f in faces:
        ts = [tags[i] for i in f]
        # priority: special parts win over plain body
        face_tags.append(max(set(ts), key=lambda t: (ts.count(t) >= 2, t)))
    # caps: bottom and top fans
    bottom = len(verts)
    verts.append((0, 0, 0))
    top = len(verts)
    verts.append((0, 0, H - 0.28))
    for i in range(SEG):
        i2 = (i + 1) % SEG
        faces.append((bottom, i2, i))
        face_tags.append(MAT_BODY)
        o = (len(zs) - 1) * SEG
        faces.append((o + i, o + i2, top))
        face_tags.append(MAT_MOUTH)
    return mesh_object(name, verts, faces, mats, face_tags)


def elliptic_cylinder(name, rx, ry, z0, z1, mat, seg=96, dome=0.0, rings_n=24):
    verts, faces = [], []
    zs = [z0 + (z1 - z0) * k / rings_n for k in range(rings_n + 1)]
    profile_s = [1.0] * len(zs)
    if dome > 0:
        for k in range(12):
            t = (k + 1) / 12
            zs.append(z1 + dome * math.sin(math.pi / 2 * t))
            profile_s.append(math.cos(math.pi / 2 * t) if k < 11 else 0.05)
    for z, s in zip(zs, profile_s):
        for i in range(seg):
            p = 2 * math.pi * i / seg
            verts.append((rx * s * math.cos(p), ry * s * math.sin(p), z))
    faces = grid_faces(len(zs), seg)
    b = len(verts)
    verts.append((0, 0, z0))
    t = len(verts)
    verts.append((0, 0, zs[-1]))
    o = (len(zs) - 1) * seg
    for i in range(seg):
        i2 = (i + 1) % seg
        faces.append((b, i2, i))
        faces.append((o + i, o + i2, t))
    return mesh_object(name, verts, faces, [mat])


# ------------------------------------------------------------------ materials
body = principled("body", (0.016, 0.016, 0.018), 0.42, spec=0.5, coat=0.12, coat_rough=0.3)
add_bump(body, scale=900, strength=0.06, detail=2)
cap = principled("cap", (0.010, 0.010, 0.011), 0.12, coat=1.0, coat_rough=0.025)
win = thin_clear("window", (0.97, 0.97, 0.98), 0.015)
seam = principled("seam", (0.55, 0.56, 0.58), 0.25, metal=1.0)
port = principled("port", (0.004, 0.004, 0.004), 0.6)
rim = principled("rim", (0.42, 0.43, 0.45), 0.35, metal=1.0)
mouth = principled("mouth", (0.002, 0.002, 0.002), 0.7)
tank = thin_clear("tank", (0.98, 0.98, 0.98), 0.01)
oil = glass("oil", (1, 1, 1), 0.0, 1.48, absorb=(1.0, 0.70, 0.16), density=1.0, shadow=(1.0, 0.8, 0.4), shadow_amount=0.6)
ceramic = principled("ceramic", (0.93, 0.92, 0.89), 0.5, sss=0.25, sss_radius=(0.1, 0.08, 0.06), sss_scale=0.05)
metal = principled("metal", (0.75, 0.75, 0.77), 0.22, metal=1.0)
rubber = principled("rubber", (0.02, 0.02, 0.02), 0.6)
backlight = bpy.data.materials.new("backlight")
backlight.use_nodes = True
_nt = backlight.node_tree
_nt.nodes.remove(_nt.nodes["Principled BSDF"])
_em = _nt.nodes.new("ShaderNodeEmission")
_em.inputs["Strength"].default_value = 1.6
_em.inputs["Color"].default_value = (1.0, 0.97, 0.9, 1)
_nt.links.new(_em.outputs["Emission"], _nt.nodes["Material Output"].inputs["Surface"])
MATS = [body, cap, win, seam, port, rim, mouth]


def build_pen(tag):
    root = empty("pen_" + tag)
    parts = [build_shell("shell_" + tag, MATS)]
    parts.append(elliptic_cylinder("tank_" + tag, 0.47, 0.41, WIN_BOT - 0.35, WIN_TOP + 0.02, tank))
    parts.append(elliptic_cylinder("oil_" + tag, 0.455, 0.395, WIN_BOT - 0.33, WIN_TOP - 0.01, oil))
    parts.append(elliptic_cylinder("post_" + tag, 0.15, 0.15, WIN_BOT - 0.35, WIN_TOP - 0.55, ceramic, dome=0.11))
    parts.append(elliptic_cylinder("base_" + tag, 0.48, 0.42, WIN_BOT - 0.6, WIN_BOT + 0.05, metal))
    parts.append(elliptic_cylinder("seal_" + tag, 0.49, 0.43, WIN_TOP - 0.02, ZS + 0.2, rubber))
    glow = mesh_object("glow_" + tag, [(-0.62, 0.47, WIN_BOT - 0.3), (0.62, 0.47, WIN_BOT - 0.3),
                                        (0.62, 0.47, WIN_TOP + 0.1), (-0.62, 0.47, WIN_TOP + 0.1)], [(0, 1, 2, 3)], [backlight])
    for ray in ("diffuse", "glossy", "volume_scatter", "shadow"):
        setattr(glow, "visible_" + ray, False)
    parts.append(glow)
    for p in parts:
        p.parent = root
    return root


standing = build_pen("a")
lying = build_pen("b")

# ------------------------------------------------------------------ layout
# standing pen: upright, front turned a little toward the lying one
STAND_LOC = Vector((1.9, 1.3, 0))
STAND_ROT = math.radians(14)

# lying pen: on its back (front face up), mouthpiece toward the front left
LIE_DIR = Vector((-0.74, -0.67, 0)).normalized()
LIE_BASE = Vector((0.2, 0.0, B0))


def lying_matrix(base, direction, roll=0.0):
    z = direction.normalized()                  # pen axis
    up = Vector((0, 0, 1))
    y = -up                                    # local -y (front) faces up
    x = y.cross(z).normalized()
    y = z.cross(x).normalized()
    m = Matrix((x, y, z)).transposed().to_4x4()
    m = m @ Matrix.Rotation(roll, 4, "Z")
    m.translation = base
    return m


def animate(f):
    # standing pen drops in spinning, lands with a small settle
    t = window(f, 0, 26)
    s = ease_out(t, 3)
    standing.location = STAND_LOC + Vector((0, 0, 7.0 * (1 - s)))
    standing.rotation_euler = (0, 0, STAND_ROT - math.radians(200) * (1 - s))
    # lying pen slides and rolls in, a beat later
    t2 = ease_out(window(f, 6, 31), 3)
    base = LIE_BASE + Vector((-3.5, -1.0, 0)) * (1 - t2) + Vector((0, 0, 2.5 * (1 - t2) ** 2))
    d = Matrix.Rotation(math.radians(-35) * (1 - t2), 3, "Z") @ LIE_DIR
    lying.matrix_world = lying_matrix(base, d, math.radians(-120) * (1 - t2))


hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")


def backdrop():
    """Seamless white sweep with soft diagonal light bands, like the supplier shot."""
    verts, faces = [], []
    prof = []
    for k in range(40):                                  # floor -> cove -> wall
        t = k / 39
        if t < 0.4:
            prof.append((lerp(-60, 6, t / 0.4), 0.0))
        elif t < 0.75:
            a = (t - 0.4) / 0.35 * math.pi / 2
            prof.append((6 + 8 * math.sin(a), 8 - 8 * math.cos(a)))
        else:
            prof.append((14, lerp(8, 90, (t - 0.75) / 0.25)))
    xs = [-90, 90]
    for y, z in prof:
        for x in xs:
            verts.append((x, y, z))
    for k in range(len(prof) - 1):
        faces.append((2 * k, 2 * k + 1, 2 * k + 3, 2 * k + 2))
    ob = mesh_object("sweep", verts, faces)
    m = principled("sweep", (0.9, 0.9, 0.9), 0.32, spec=0.35)
    nt, ln = nodes(m)
    tc = nt.new("ShaderNodeTexCoord")
    mp = nt.new("ShaderNodeMapping")
    mp.inputs["Rotation"].default_value = (0, math.radians(40), 0)
    mp.inputs["Scale"].default_value = (0.03, 0.03, 0.03)
    mp.inputs["Location"].default_value = (0.42, 0, 0)
    gr = nt.new("ShaderNodeTexGradient")
    ramp = nt.new("ShaderNodeValToRGB")
    cr = ramp.color_ramp
    stops = [(0.0, 0.78), (0.22, 0.80), (0.235, 0.97), (0.36, 0.86), (0.44, 0.82), (0.452, 1.0),
             (0.56, 0.92), (0.68, 0.80), (0.692, 0.93), (0.82, 0.84), (1.0, 0.80)]
    cr.elements[0].position, cr.elements[0].color = stops[0][0], (stops[0][1],) * 3 + (1,)
    cr.elements[1].position, cr.elements[1].color = stops[-1][0], (stops[-1][1],) * 3 + (1,)
    for pos, v in stops[1:-1]:
        e = cr.elements.new(pos)
        e.color = (v, v, v, 1)
    ln.new(tc.outputs["Object"], mp.inputs["Vector"])
    ln.new(mp.outputs["Vector"], gr.inputs["Vector"])
    ln.new(gr.outputs["Fac"], ramp.inputs["Fac"])
    # the bands only live on the wall; the floor stays clean white
    sep = nt.new("ShaderNodeSeparateXYZ")
    ln.new(tc.outputs["Object"], sep.inputs["Vector"])
    fade = nt.new("ShaderNodeMapRange")
    fade.inputs["From Min"].default_value = -4
    fade.inputs["From Max"].default_value = 8
    ln.new(sep.outputs["Y"], fade.inputs["Value"])
    mix = nt.new("ShaderNodeMixRGB")
    mix.inputs["Color1"].default_value = (0.92, 0.92, 0.92, 1)
    ln.new(fade.outputs["Result"], mix.inputs["Fac"])
    ln.new(ramp.outputs["Color"], mix.inputs["Color2"])
    ln.new(mix.outputs["Color"], bsdf(m).inputs["Base Color"])
    ob.data.materials.append(m)
    return ob


studio(hdri, key=(-26, -24, 26), key_power=4200, rim=(16, 30, 14), rim_power=6500,
       fill=(34, -18, 10), fill_power=900, target=(-2, 0, 4), world_strength=0.55, world_rot=40, key_size=40)
area_light("top", (-2, 2, 40), (-2, 0, 0), 1800, 30, 12)
area_light("back", (-4, 34, 8), (-1, 0, 4), 3500, 30, 20)
no_shadow(bpy.data.objects["rim"], bpy.data.objects["back"])
shells = [o for o in bpy.data.objects if o.name.startswith("shell_")]

if A.still:
    backdrop()
    bpy.data.objects["back"].location = (-4, 12, 9)
    bpy.data.objects["back"].data.energy = 1200
    # the wash only brightens the backdrop (light linking), so the pens keep their black
    sweep = bpy.data.objects["sweep"]
    only_sweep = bpy.data.collections.new("only_sweep")
    bpy.context.scene.collection.children.link(only_sweep)
    only_sweep.objects.link(sweep)
    wash = area_light("wash", (-20, -30, 50), (0, 14, 10), 22000, 70, 70)
    no_shadow(wash)
    wash.light_linking.receiver_collection = only_sweep
    CAM_OFF = Vector((0, -40.0, 4.2))
    TARGET = Vector((-2.4, -1.0, 4.4))
    cam = camera(TARGET + CAM_OFF, TARGET, lens=70, fstop=4.0, focus=CAM_OFF.length)
    animate(FRAMES - 1)
    frame_objects(cam, shells, fill=0.86, offset=(0.03, -0.01))
    A.frame_list = [FRAMES - 1]
    render(A, animate, transparent=False, name=A.name or "disposable-2g-studio.png")
else:
    shadow_catcher()
    CAM_OFF = Vector((0, -33.0, 6.0))
    TARGET = Vector((-2.2, -1.2, 4.6))
    cam = camera(TARGET + CAM_OFF, TARGET, lens=70, fstop=5.6, focus=CAM_OFF.length)
    animate(FRAMES - 1)
    frame_objects(cam, shells, fill=0.84, offset=(0, 0.02))
    render(A, animate)
