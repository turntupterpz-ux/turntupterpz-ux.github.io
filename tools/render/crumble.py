# BHO crumble: dry, porous golden chunks tumbling onto a sheet of parchment.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from props import parchment
from crystals import tumble
from mathutils import noise

A = args()
reset()
rng = random.Random(31)

mat = principled("crumble", (0.86, 0.64, 0.2), 0.72, sss=0.3, sss_radius=(0.25, 0.15, 0.05), sss_scale=0.15, sheen=0.2)
nt, ln = nodes(mat)
tc = nt.new("ShaderNodeTexCoord")
vor = nt.new("ShaderNodeTexVoronoi")
vor.feature = "F1"
vor.inputs["Scale"].default_value = 16
nz = nt.new("ShaderNodeTexNoise")
nz.inputs["Scale"].default_value = 70
nz.inputs["Detail"].default_value = 6
ln.new(tc.outputs["Object"], vor.inputs["Vector"])
ln.new(tc.outputs["Object"], nz.inputs["Vector"])
pits = nt.new("ShaderNodeMath")
pits.operation = "POWER"
pits.inputs[1].default_value = 0.5
ln.new(vor.outputs["Distance"], pits.inputs[0])
add = nt.new("ShaderNodeMath")
add.operation = "MULTIPLY_ADD"
add.inputs[1].default_value = 0.25
ln.new(nz.outputs["Fac"], add.inputs[0])
ln.new(pits.outputs["Value"], add.inputs[2])
bump = nt.new("ShaderNodeBump")
bump.inputs["Strength"].default_value = 0.7
bump.inputs["Distance"].default_value = 0.04
ln.new(add.outputs["Value"], bump.inputs["Height"])
ln.new(bump.outputs["Normal"], bsdf(mat).inputs["Normal"])
# pale and deeper gold patches
mix = nt.new("ShaderNodeMixRGB")
mix.inputs["Color1"].default_value = (0.82, 0.5, 0.07, 1)
mix.inputs["Color2"].default_value = (0.95, 0.7, 0.18, 1)
n2 = nt.new("ShaderNodeTexNoise")
n2.inputs["Scale"].default_value = 3
ln.new(tc.outputs["Object"], n2.inputs["Vector"])
ln.new(n2.outputs["Fac"], mix.inputs["Fac"])
ln.new(mix.outputs["Color"], bsdf(mat).inputs["Base Color"])


def chunk(name, size, seed, subdiv):
    """A crumbly lump: a squashed sphere broken up by noise and cell pits, flat underneath."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    off = Vector((seed * 3.1, seed * 1.7, seed * 2.3))
    sx, sy, sz = rng.uniform(0.85, 1.25), rng.uniform(0.7, 1.0), rng.uniform(0.42, 0.58)
    for v in bm.verts:
        p = v.co.copy()
        d = 0.3 * noise.fractal(p * 1.3 + off, 0.6, 2.0, 4)
        dist = noise.voronoi(p * 3.2 + off)[0]
        d -= 0.2 * max(0.0, 0.35 - dist[0])                      # pits
        d -= 0.14 * max(0.0, 1 - (dist[1] - dist[0]) / 0.12)     # cracks between crumbs
        d += 0.1 * math.floor((noise.noise(p * 2.0 - off) + 1) * 2.5) / 5   # broken, stepped faces
        p = p * (1 + d)
        p = Vector((p.x * sx, p.y * sy, p.z * sz))
        if p.z < -0.25:
            p.z = -0.25 + (p.z + 0.25) * 0.15
        v.co = p * size
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    zmin = min(v.co.z for v in me.vertices)
    me.transform(Matrix.Translation((0, 0, -zmin)))
    return ob


PAPER_Z = 0.05
layout = [((0.0, 0.3), 1.55, 5), ((2.2, -0.6), 1.15, 4), ((-2.1, -0.5), 1.05, 4), ((-0.6, -1.9), 0.85, 4),
          ((1.4, 1.7), 0.75, 4), ((0.9, -2.2), 0.45, 3), ((-1.6, 1.6), 0.5, 3), ((2.7, 1.0), 0.32, 3),
          ((-2.9, 0.6), 0.3, 3), ((-1.5, -2.6), 0.26, 3), ((2.2, -2.2), 0.24, 3), ((0.1, -3.0), 0.2, 2),
          ((-0.4, 2.4), 0.22, 2), ((3.1, -1.2), 0.18, 2), ((-3.0, -1.6), 0.2, 2), ((1.0, 2.8), 0.16, 2)]
pieces, rests, spins, heights = [], [], [], []
for i, (xy, size, sub) in enumerate(layout):
    ob = chunk("chunk%d" % i, size, i + 1, sub)
    m = Matrix.Rotation(rng.uniform(0, math.tau), 4, "Z")
    m.translation = (xy[0], xy[1], PAPER_Z - 0.02)
    pieces.append(ob)
    rests.append(m)
    axis = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 0.3))).normalized()
    spins.append((axis, rng.uniform(1.2, 2.6) * (1 if i % 2 else -1)))
    heights.append(rng.uniform(3.5, 6.5))

paper = parchment("parchment", 8.6, -14, seed=8)
paper.location.z = PAPER_Z


def animate(f):
    for k, ob in enumerate(pieces):
        start = 0 if k == 0 else 1 + (k - 1) * 0.9
        dur = 22 if k == 0 else 16
        ob.matrix_world = tumble(rests[k], f, start, min(dur, 31 - start), 5 if k == 0 else heights[k], spins[k],
                                 (rests[k].translation.x * 0.3, rests[k].translation.y * 0.3))


shadow_catcher()
hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")
studio(hdri, key=(-30, -12, 18), key_power=9000, rim=(14, 30, 12), rim_power=6000,
       fill=(30, -22, 12), fill_power=700, target=(0, 0, 0.6), world_strength=0.35, world_rot=120, key_size=10)
no_shadow(bpy.data.objects["rim"])
no_shadow(area_light("top", (0, 4, 40), (0, 0, 0), 1800, 16, 16))

CAM_OFF = Vector((0, -30.0, 17.0))
TARGET = Vector((0, 0, 0.6))
cam = camera(TARGET + CAM_OFF, TARGET, lens=80, fstop=5.6, focus=CAM_OFF.length)
animate(FRAMES - 1)
frame_objects(cam, [paper] + pieces, fill=0.86, offset=(0, 0.0))
render(A, animate)
