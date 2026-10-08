# Live resin sauce: a pool of amber terp sauce with THCa crystals sitting in it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from crystals import crystal, union, apply_all, rest_matrix, thca_material, tumble, black_flag

A = args()
reset()
rng = random.Random(23)

# ------------------------------------------------------------------ the pool
R0, SX, SY, H0, EDGE = 3.1, 1.22, 0.92, 0.42, 0.55
phase = [rng.uniform(0, math.tau) for _ in range(4)]


def outline(t):
    return R0 * (1 + 0.10 * math.sin(2 * t + phase[0]) + 0.07 * math.sin(3 * t + phase[1])
                 + 0.04 * math.sin(5 * t + phase[2]) + 0.025 * math.sin(8 * t + phase[3]))


def pool_mesh():
    SEGS, RINGS = 220, 60
    verts = [(0, 0, H0)]
    # radial positions: dense toward the rim, where the meniscus curves
    rho = [(k / RINGS) ** 0.6 for k in range(1, RINGS + 1)]
    for r in rho:
        for i in range(SEGS):
            t = math.tau * i / SEGS
            R = outline(t)
            x, y = r * R * math.cos(t) * SX, r * R * math.sin(t) * SY
            d = (1 - r) * R                       # distance in from the rim
            h = H0 * math.sqrt(max(0.0, 1 - max(0.0, 1 - d / EDGE) ** 2)) if d < EDGE else H0
            verts.append((x, y, max(h, 0.0)))
    faces = [(0, 1 + i, 1 + (i + 1) % SEGS) for i in range(SEGS)]
    faces += [tuple(1 + v for v in q) for q in grid_faces(len(rho), SEGS)]
    # bottom: flat disc under the rim
    o = 1 + (len(rho) - 1) * SEGS
    c = len(verts)
    verts.append((0, 0, 0))
    for i in range(SEGS):
        faces.append((o + (i + 1) % SEGS, o + i, c))
    return verts, faces


sauce = principled("sauce", (1, 1, 1), 0.0, transmission=1.0, ior=1.5, coat=0.0)
nt, ln = nodes(sauce)
va = nt.new("ShaderNodeVolumeAbsorption")
va.inputs["Color"].default_value = (1.0, 0.76, 0.14, 1)
va.inputs["Density"].default_value = 3.2
ln.new(va.outputs["Volume"], nt["Material Output"].inputs["Volume"])
light_shadows(sauce, (1.0, 0.72, 0.22), 0.7)

v, f = pool_mesh()
pool = mesh_object("pool", v, f, [sauce], fix_normals=True)
for poly in pool.data.polygons:
    if poly.center.z < 1e-4:                       # flat underside: no smoothing into the rim
        poly.use_smooth = False

# ------------------------------------------------------------------ crystals in the sauce
clear = thca_material("thca_clear", tint=(1.0, 0.99, 0.97), cloud=0.02, absorb=(1.0, 0.92, 0.6), density=0.2)
warm = thca_material("thca_warm", tint=(1.0, 0.98, 0.94), cloud=0.03, absorb=(1.0, 0.88, 0.42), density=0.5)


def bake(ob):
    apply_all(ob)
    bpy.context.view_layer.update()
    ob.data.transform(ob.matrix_world)
    ob.matrix_world = Matrix()
    return ob


parts = []
base = crystal("hero", rng, 1.3, 0.75, warm, sides=6, tip=0.1, cuts=3)
base.rotation_euler = (math.radians(90), 0, math.radians(30))
base.location = (0, 0, 0.5)
parts.append(bake(base))
for k, (L, R, tilt, az, off) in enumerate([(2.3, 0.62, 22, 160, (0.0, 0.0)), (1.7, 0.48, 48, 40, (0.4, 0.2)),
                                            (1.3, 0.4, 55, 270, (-0.4, 0.0))]):
    ob = crystal("hero_%d" % k, rng, L, R, warm, sides=6, cuts=1)
    ob.rotation_euler = (math.radians(tilt), 0, math.radians(az))
    up = Matrix.Rotation(math.radians(az), 3, "Z") @ Matrix.Rotation(math.radians(tilt), 3, "X") @ Vector((0, 0, 1))
    ob.location = Vector((off[0], off[1], 0.6)) + up * (L * 0.42)
    parts.append(bake(ob))
hero = union(parts[0], parts[1:])
zmin = min(v.co.z for v in hero.data.vertices)
hero.data.transform(Matrix.Translation((0, 0, -zmin)))

pieces = [(hero, (0.4, 0.3))]
spots = [((-1.9, -0.6), 1.5, 0.45), ((2.3, -0.9), 1.3, 0.4), ((-0.9, 1.4), 1.1, 0.34), ((1.1, -1.7), 0.9, 0.3),
         ((-2.6, 0.9), 0.7, 0.22), ((2.9, 0.8), 0.6, 0.2), ((-0.6, -1.9), 0.45, 0.15), ((0.2, -2.3), 0.3, 0.1),
         ((3.6, -1.6), 0.28, 0.09), ((-3.7, -1.2), 0.3, 0.1)]
for i, (xy, L, R) in enumerate(spots):
    ob = crystal("c%d" % i, rng, L, R, warm if i % 2 else clear, sides=rng.choice((5, 6)),
                 bevel=0.01 if L > 0.5 else 0.004, cuts=rng.choice((1, 2, 3)))
    apply_all(ob)
    pieces.append((ob, xy))

rests = [Matrix.Rotation(math.radians(10), 4, "Z")]
rests[0].translation = (0.4, 0.3, 0)
for k, (ob, xy) in enumerate(pieces[1:]):
    m = rest_matrix(ob, xy, rng.uniform(0, math.tau), pick=k % 2)
    # sunk into the sauce a little
    m.translation.z -= 0.12
    rests.append(m)

spins, heights = [], []
for k in range(len(pieces)):
    axis = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 0.3))).normalized()
    spins.append((axis, rng.uniform(1.4, 2.8) * (1 if k % 2 else -1)))
    heights.append(rng.uniform(7, 12))
spins[0] = (Vector((0.4, 1, 0.1)).normalized(), 1.1)


def animate(f):
    # the sauce lands as a tall blob and slumps out into a pool
    t = ease_out(window(f, 0, 22), 2.4)
    pool.scale = (lerp(0.32, 1.0, t), lerp(0.32, 1.0, t), lerp(3.2, 1.0, t))
    for k, (ob, xy) in enumerate(pieces):
        start = 5 if k == 0 else 7 + (k - 1) * 1.3
        dur = 22 if k == 0 else 16
        drift = (xy[0] * 0.4, xy[1] * 0.4) if k else (0, 0)
        ob.matrix_world = tumble(rests[k], f, start, min(dur, 31 - start), 11 if k == 0 else heights[k], spins[k], drift)


shadow_catcher()
hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")
studio(hdri, key=(-22, -24, 30), key_power=7000, rim=(14, 30, 12), rim_power=9000,
       fill=(30, -22, 12), fill_power=900, target=(0, 0, 0.8), world_strength=0.2, world_rot=120, key_size=26)
no_shadow(bpy.data.objects["rim"])
no_shadow(area_light("glint", (-8, 22, 6), (0, 0, 1), 5000, 6, 6))
no_shadow(area_light("top", (2, 3, 40), (0, 0, 0), 2600, 16, 16))
reflection_card(strength=0.8)
black_flag("flag_l", (-18, 8, 8), (0, 0, 2), 14, 24)
black_flag("flag_r", (18, 10, 8), (0, 0, 2), 14, 24)

CAM_OFF = Vector((0, -30.0, 14.5))
TARGET = Vector((0, 0, 0.6))
cam = camera(TARGET + CAM_OFF, TARGET, lens=80, fstop=5.0, focus=CAM_OFF.length)
animate(FRAMES - 1)
frame_objects(cam, [pool] + [p[0] for p in pieces], fill=0.82, offset=(0, 0.03))
render(A, animate)
