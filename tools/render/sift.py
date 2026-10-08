# Static sift: a sandy pile of trichome heads on parchment, sprinkled in from above.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from props import parchment, grain, scatter_on
from crystals import black_flag
from mathutils import noise

A = args()
reset()
rng = random.Random(9)

R, H, SX, SY = 2.5, 1.5, 1.1, 0.95

sift_mat = principled("sift", (0.66, 0.46, 0.22), 0.62, sss=0.25, sss_radius=(0.2, 0.12, 0.05), sss_scale=0.1, sheen=0.25)
nt, ln = nodes(sift_mat)
tc = nt.new("ShaderNodeTexCoord")
vor = nt.new("ShaderNodeTexVoronoi")
vor.inputs["Scale"].default_value = 150
nz = nt.new("ShaderNodeTexNoise")
nz.inputs["Scale"].default_value = 9
nz.inputs["Detail"].default_value = 4
ln.new(tc.outputs["Object"], vor.inputs["Vector"])
ln.new(tc.outputs["Object"], nz.inputs["Vector"])
bump = nt.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.35
bump.inputs["Distance"].default_value = 0.02
ln.new(vor.outputs["Distance"], bump.inputs["Height"])
ln.new(bump.outputs["Normal"], bsdf(sift_mat).inputs["Normal"])
# lighter and darker patches, like real sift
mix = nt.new("ShaderNodeMixRGB")
mix.inputs["Color1"].default_value = (0.58, 0.39, 0.17, 1)
mix.inputs["Color2"].default_value = (0.74, 0.55, 0.29, 1)
ln.new(nz.outputs["Fac"], mix.inputs["Fac"])
ln.new(mix.outputs["Color"], bsdf(sift_mat).inputs["Base Color"])


def height(x, y):
    r = math.hypot(x / SX, y / SY)
    if r >= R:
        return 0.0
    h = H * (1 - (r / R) ** 1.7) ** 1.4
    h += 0.13 * noise.noise(Vector((x * 0.9, y * 0.9, 1.7))) * (1 - r / R)
    h += 0.03 * noise.noise(Vector((x * 4, y * 4, 0.4))) * (1 - r / R)
    return max(h, 0.0)


SEGS, RINGS = 180, 70
verts = [(0, 0, height(0, 0))]
for k in range(1, RINGS + 1):
    r = R * (k / RINGS) ** 0.8
    for i in range(SEGS):
        a = math.tau * i / SEGS
        x, y = r * math.cos(a) * SX, r * math.sin(a) * SY
        verts.append((x, y, height(x, y) if k < RINGS else 0.0))
faces = [(0, 1 + i, 1 + (i + 1) % SEGS) for i in range(SEGS)]
faces += [tuple(1 + v for v in q) for q in grid_faces(RINGS, SEGS)]
mound = mesh_object("mound", verts, faces, [sift_mat], fix_normals=True)

# grains: on the pile, and loose ones spilled on the paper around it
seed_grain = grain("grain", 0.05, sift_mat)
scatter_on(mound, seed_grain, 14000, 0.75, 0.7, seed=4, name="pile")
ring = []
for k in range(2):
    r0, r1, n = (R * 0.92, R * 1.3, 700) if k == 0 else (R * 1.3, R * 1.5, 160)
    vs, fs = [], []
    for i in range(96):
        a = math.tau * i / 96
        for r in (r0, r1):
            vs.append((r * math.cos(a) * SX, r * math.sin(a) * SY, 0.1))
    fs = [(2 * i, 2 * ((i + 1) % 96), 2 * ((i + 1) % 96) + 1, 2 * i + 1) for i in range(96)]
    ob = mesh_object("spill%d" % k, vs, fs, [sift_mat], fix_normals=True)
    scatter_on(ob, seed_grain, n, 0.8, 0.7, seed=7 + k, name="spill")
    ob.show_instancer_for_render = False
    ring.append(ob)

# a sprinkle falling in while the pile builds
N_RAIN = 240
gb = bmesh.new()
bmesh.ops.create_icosphere(gb, subdivisions=1, radius=0.05)
gverts = [v.co.copy() for v in gb.verts]
gfaces = [[v.index for v in f.verts] for f in gb.faces]
gb.free()
rain_v, rain_f = [], []
drops = []
for n in range(N_RAIN):
    a = rng.uniform(0, math.tau)
    r = R * math.sqrt(rng.random()) * 0.85
    x, y = r * math.cos(a) * SX, r * math.sin(a) * SY
    drops.append((x, y, rng.uniform(0, 21), rng.uniform(5, 8), rng.uniform(0.6, 1.3)))
    o = len(rain_v)
    rain_v += [tuple(v) for v in gverts]
    rain_f += [[o + i for i in f] for f in gfaces]
rain = mesh_object("rain", rain_v, rain_f, [sift_mat])

paper = parchment("parchment", 8.4, 18, seed=3)
paper.location.z = 0.045                         # keep every wrinkle above the floor
mound.location.z = 0.05
rain.location.z = 0.05


def grow(f):
    return ease_out(window(f, 0, 27), 2.2)


def animate(f):
    t = grow(f)
    mound.scale = (0.55 + 0.45 * t, 0.55 + 0.45 * t, 0.06 + 0.94 * t)
    for k, ob in enumerate(ring):
        s = 0.7 + 0.3 * ease_out(window(f, 4 + 5 * k, 28), 2)
        ob.scale = (s, s, 1)
    co = []
    for (x, y, start, drop, size) in drops:
        fall = 7.0
        land_t = window(f, start, start + fall)
        sx = 0.55 + 0.45 * t
        px, py = x * sx, y * sx
        surface = height(x, y) * mound.scale.z
        if f < start:
            pz = 100.0                                   # not dropped yet: out of sight
        else:
            pz = surface + drop * (1 - land_t ** 2)
        for v in gverts:
            co += [px + v.x * size, py + v.y * size, pz + v.z * size]
    rain.data.vertices.foreach_set("co", co)
    rain.data.update()


shadow_catcher()
hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")
studio(hdri, key=(-30, -12, 17), key_power=9000, rim=(14, 30, 12), rim_power=6000,
       fill=(30, -22, 12), fill_power=500, target=(0, 0, 0.6), world_strength=0.3, world_rot=120, key_size=9)
no_shadow(bpy.data.objects["rim"])
no_shadow(area_light("top", (0, 4, 40), (0, 0, 0), 1800, 16, 16))

CAM_OFF = Vector((0, -30.0, 17.0))
TARGET = Vector((0, 0, 0.6))
cam = camera(TARGET + CAM_OFF, TARGET, lens=80, fstop=5.6, focus=CAM_OFF.length)
animate(FRAMES - 1)
frame_objects(cam, [paper], fill=0.86, offset=(0, 0.0))
render(A, animate)
