# THCa diamonds: an upright intergrown cluster with loose crystals and shards around it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from crystals import crystal, union, apply_all, rest_matrix, thca_material, tumble, black_flag

A = args()
reset()
rng = random.Random(11)

clear = thca_material("thca_clear", tint=(1.0, 0.99, 0.97), cloud=0.02, absorb=(1.0, 0.9, 0.66), density=0.18)
warm = thca_material("thca_warm", tint=(1.0, 0.98, 0.94), cloud=0.03, absorb=(1.0, 0.9, 0.42), density=0.45)


def bake(ob):
    apply_all(ob)
    bpy.context.view_layer.update()
    ob.data.transform(ob.matrix_world)
    ob.matrix_world = Matrix()
    return ob


# hero cluster: crystals growing up and out of a common base
parts = []
base = crystal("hero", rng, 1.5, 0.9, warm, sides=7, tip=0.12, cuts=3)
base.rotation_euler = (math.radians(90), 0, math.radians(15))
base.location = (0, 0, 0.55)
parts.append(bake(base))
for k, (L, R, tilt, az, off) in enumerate([(3.0, 0.78, 16, 200, (0.0, 0.0)), (2.3, 0.6, 42, 120, (0.45, 0.25)),
                                            (1.7, 0.5, 52, 280, (-0.45, 0.1))]):
    ob = crystal("hero_%d" % k, rng, L, R, warm, sides=6, cuts=1)
    ob.rotation_euler = (math.radians(tilt), 0, math.radians(az))
    up = Matrix.Rotation(math.radians(az), 3, "Z") @ Matrix.Rotation(math.radians(tilt), 3, "X") @ Vector((0, 0, 1))
    ob.location = Vector((off[0], off[1], 0.75)) + up * (L * 0.42)
    parts.append(bake(ob))
hero = union(parts[0], parts[1:])
zmin = min(v.co.z for v in hero.data.vertices)
hero.data.transform(Matrix.Translation((0, 0, -zmin)))

pieces = [(hero, None)]
spots = [((2.6, -1.3), 2.0, 0.5), ((-2.7, -0.9), 1.7, 0.46), ((-1.4, 2.1), 1.4, 0.4),
         ((-0.9, -2.6), 1.0, 0.3), ((1.9, 1.7), 1.0, 0.28), ((0.9, -2.9), 0.75, 0.22), ((-3.2, 1.2), 0.7, 0.2),
         ((0.1, -3.6), 0.34, 0.11), ((2.2, -3.0), 0.3, 0.1), ((-2.0, -2.9), 0.32, 0.1), ((3.4, 0.3), 0.3, 0.09),
         ((-3.6, -1.9), 0.28, 0.09), ((1.4, -1.9), 0.24, 0.08), ((3.0, -2.2), 0.22, 0.07)]
for i, (xy, L, R) in enumerate(spots):
    ob = crystal("c%d" % i, rng, L, R, warm if i % 3 == 0 else clear, sides=rng.choice((5, 6, 6)),
                 bevel=0.012 if L > 0.5 else 0.004, cuts=rng.choice((1, 2, 3)))
    apply_all(ob)
    pieces.append((ob, xy))

rests = [Matrix.Rotation(math.radians(-20), 4, "Z")]
rests[0].translation = (0.1, 0.5, 0)
for k, (ob, xy) in enumerate(pieces[1:]):
    rests.append(rest_matrix(ob, xy, rng.uniform(0, math.tau), pick=k % 2))

spins, heights = [], []
for k in range(len(pieces)):
    axis = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.3, 0.3))).normalized()
    spins.append((axis, rng.uniform(1.4, 2.8) * (1 if k % 2 else -1)))
    heights.append(rng.uniform(3.5, 6))
spins[0] = (Vector((0.3, 1, 0.2)).normalized(), 1.2)


def animate(f):
    for k, (ob, xy) in enumerate(pieces):
        start = 0 if k == 0 else 1 + (k - 1) * 1.0
        dur = 24 if k == 0 else 17
        drift = (xy[0] * 0.35, xy[1] * 0.35) if k else (0, 0)
        ob.matrix_world = tumble(rests[k], f, start, dur, 5 if k == 0 else heights[k], spins[k], drift)


shadow_catcher()
hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")
studio(hdri, key=(-22, -24, 30), key_power=7000, rim=(14, 30, 12), rim_power=9000,
       fill=(30, -22, 12), fill_power=900, target=(0, 0, 1.2), world_strength=0.14, world_rot=120, key_size=26)
no_shadow(bpy.data.objects["rim"])
no_shadow(area_light("glint", (-8, 22, 6), (0, 0, 1), 5000, 6, 6))
no_shadow(area_light("top", (2, 3, 40), (0, 0, 0), 2200, 16, 16))
black_flag("flag_l", (-18, 8, 8), (0, 0, 2), 14, 24)
black_flag("flag_r", (18, 10, 8), (0, 0, 2), 14, 24)
black_flag("flag_b", (0, 24, 10), (0, 0, 2), 16, 10)

CAM_OFF = Vector((0, -30.0, 12.5))
TARGET = Vector((0, 0, 1.0))
cam = camera(TARGET + CAM_OFF, TARGET, lens=80, fstop=5.0, focus=CAM_OFF.length)
animate(FRAMES - 1)
frame_objects(cam, [p[0] for p in pieces], fill=0.8, offset=(0, 0.03))
render(A, animate)
