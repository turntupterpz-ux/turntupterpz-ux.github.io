# Live rosin: whipped badder in a thick glass jar; the black lid unscrews and sets down beside it.
import os, sys, math, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import *
from props import lathe, arc
from crystals import black_flag
from mathutils import noise

A = args()
reset()
rng = random.Random(5)

# ------------------------------------------------------------------ jar (cm)
RO, RN, RI = 2.2, 2.06, 1.8      # body outside, neck outside, inside
HJ, TB, SH = 2.7, 0.55, 1.9      # height, base thickness, shoulder
FILL = TB + 1.05                 # rosin level

jar_glass = glass("jar_glass", (1, 1, 1), 0.0, 1.5, absorb=(0.97, 0.99, 0.985), density=0.2,
                  shadow=(0.95, 1.0, 0.98), shadow_amount=0.85)
profile = [(0.35, 0.0), (RO - 0.3, 0.0)]
profile += arc(RO - 0.3, 0.3, 0.3, -math.pi / 2, 0, 8)[1:]
profile += [(RO, 0.3 + (SH - 0.3) * k / 10) for k in range(1, 11)]
profile += [(RO - (RO - RN) * (1 - math.cos(math.pi / 2 * k / 6)), SH + 0.16 * math.sin(math.pi / 2 * k / 6)) for k in range(1, 7)]
profile += [(RN, SH + 0.16 + (HJ - 0.125 - SH - 0.16) * k / 6) for k in range(1, 7)]
profile += arc((RN + RI) / 2, HJ - 0.125, (RN - RI) / 2, 0, math.pi, 12)[1:]
profile += [(RI, HJ - 0.125 - (HJ - 0.125 - TB - 0.25) * k / 10) for k in range(1, 11)]
profile += arc(RI - 0.25, TB + 0.25, 0.25, 0, -math.pi / 2, 8)[1:]
profile += [(0.35, TB)]
jar = lathe("jar", profile, [jar_glass], seg=160)
for p in jar.data.polygons:
    if abs(p.normal.z) > 0.999 and (p.center.z < 0.01 or abs(p.center.z - TB) < 0.01):
        p.use_smooth = False

# screw thread on the neck
verts, faces = [], []
TURNS, STEPS, TUBE = 1.6, 260, 0.05
for k in range(STEPS + 1):
    t = k / STEPS
    a = math.tau * TURNS * t
    zc = SH + 0.3 + (HJ - 0.42 - SH - 0.3) * t
    taper = min(1.0, t * 8, (1 - t) * 8)
    c = Vector((RN * math.cos(a), RN * math.sin(a), zc))
    radial = Vector((math.cos(a), math.sin(a), 0))
    for j in range(12):
        b = math.tau * j / 12
        off = radial * (math.cos(b) * TUBE * taper) + Vector((0, 0, math.sin(b) * TUBE * 1.2))
        verts.append(c + off)
faces = grid_faces(STEPS + 1, 12)
faces = [(f[0], f[3], f[2], f[1]) for f in faces]
thread = mesh_object("thread", verts, faces, [jar_glass], fix_normals=True)
thread.parent = jar

# ------------------------------------------------------------------ rosin badder
rosin_mat = principled("rosin", (0.95, 0.67, 0.2), 0.4, sss=0.55, sss_radius=(0.45, 0.28, 0.1),
                       sss_scale=0.25, coat=0.3, coat_rough=0.25, sheen=0.15)
tex, bump = add_bump(rosin_mat, scale=9, strength=0.22, detail=6, distance=0.03)

rp = [(0.3, TB + 0.006), (RI - 0.25, TB + 0.006)]
rp += arc(RI - 0.25, TB + 0.25, 0.244, -math.pi / 2, 0, 8)[1:]
rp += [(RI - 0.006, TB + 0.25 + (FILL - TB - 0.25) * k / 8) for k in range(1, 9)]
rp += [(RI - 0.006 - (RI - 0.3) * (k / 40) ** 0.9, FILL + 0.06) for k in range(1, 41)]
rosin = lathe("rosin", rp, [rosin_mat], seg=200)
peaks = [(Vector((rng.uniform(-1.1, 1.1), rng.uniform(-1.1, 1.1))), rng.uniform(0.12, 0.3), rng.uniform(0.25, 0.5)) for _ in range(7)]
for v in rosin.data.vertices:
    x, y, z = v.co
    r = math.hypot(x, y)
    if z > FILL - 0.02 and r < RI - 0.02:
        a = math.atan2(y, x)
        edge = min(1.0, (RI - r) / 0.35)
        h = 0.2 * (1 - (r / RI) ** 2)                                    # domed middle
        h += 0.07 * math.sin(4 * a + 6 * r) * (r / RI) * edge               # dab-tool swirl
        h += 0.09 * noise.noise(Vector((x * 1.6, y * 1.6, 0.3))) * edge
        for c, ph, pr in peaks:                                            # whipped peaks
            d = (Vector((x, y)) - c).length
            h += ph * math.exp(-(d / pr) ** 2) * edge
        v.co.z = z + h
    elif z > FILL - 0.25 and r > RI - 0.05:
        v.co.z = z + 0.04                                                  # clings to the glass
rosin.parent = jar

# ------------------------------------------------------------------ lid
RL, LH = 2.25, 0.85
lid_mat = principled("lid", (0.012, 0.012, 0.013), 0.42, coat=0.12, coat_rough=0.3)
add_bump(lid_mat, scale=500, strength=0.04, detail=2)
lp = [(0.35, LH - 0.12), (RL - 0.14, LH - 0.12), (RL - 0.14, 0.05)]
lp += arc(RL - 0.11, 0.03, 0.03, math.pi, 1.5 * math.pi, 4)[1:]
lp += [(RL - 0.03, 0.0)]
lp += arc(RL - 0.03, 0.03, 0.03, -math.pi / 2, 0, 4)[1:]
lp += [(RL, 0.03 + (LH - 0.18 - 0.03) * k / 14) for k in range(1, 15)]
lp += arc(RL - 0.15, LH - 0.15, 0.15, 0, math.pi / 2, 10)[1:]
lp += [(0.35, LH)]


def knurl(r, z, a):
    if r > RL - 0.001 and 0.1 < z < LH - 0.22:
        return -0.022 * (0.5 + 0.5 * math.cos(110 * a)) ** 2
    return 0.0


lid = lathe("lid", lp, [lid_mat], seg=440, wobble=knurl)
for p in lid.data.polygons:
    if abs(p.normal.z) > 0.999:
        p.use_smooth = False
liner_mat = principled("liner", (0.86, 0.85, 0.82), 0.75)
liner = lathe("liner", [(0.3, LH - 0.2), (RL - 0.15, LH - 0.2), (RL - 0.15, LH - 0.121), (0.3, LH - 0.121)], [liner_mat], seg=128)
liner.parent = lid

# ------------------------------------------------------------------ layout + motion
JAR_AT = Vector((-1.3, 0.35, 0))
LID_CLOSED = JAR_AT + Vector((0, 0, SH + 0.1))
LID_REST = Vector((2.45, -0.75, 0))
jar.location = JAR_AT
jar.rotation_euler = (0, 0, math.radians(20))


def animate(f):
    # unscrew: a turn and a half while it rides up the thread
    t1 = ease_in_out(window(f, 0, 12))
    spin = math.radians(540) * t1
    lift = 0.65 * t1
    # then lift away and set down beside the jar, top up
    t2 = window(f, 12, 30)
    e = ease_in_out(t2)
    pos = LID_CLOSED.lerp(LID_REST, e) + Vector((0, 0, lift * (1 - e) + 3.0 * math.sin(math.pi * e) * (1 - 0.15 * e)))
    tilt = math.radians(-24) * math.sin(math.pi * min(1, t2 * 1.1))
    lid.location = pos
    lid.rotation_euler = (0, tilt, spin + math.radians(40) * e)


shadow_catcher()
hdri = A.hdri or os.path.join(HERE, "hdri", "studio_small_09.hdr")
studio(hdri, key=(-22, -24, 30), key_power=6500, rim=(14, 30, 12), rim_power=8000,
       fill=(30, -22, 12), fill_power=1200, target=(0, 0, 1.2), world_strength=0.3, world_rot=120, key_size=30)
no_shadow(bpy.data.objects["rim"])
no_shadow(area_light("top", (0, 4, 40), (0, 0, 0), 2400, 16, 16))
no_shadow(area_light("glint", (-10, 22, 8), (0, 0, 1), 3500, 8, 8))
black_flag("flag_l", (-18, 8, 8), (0, 0, 2), 14, 24)
black_flag("flag_r", (18, 10, 8), (0, 0, 2), 14, 24)

CAM_OFF = Vector((0, -29.0, 19.0))
TARGET = Vector((0.4, 0, 1.2))
cam = camera(TARGET + CAM_OFF, TARGET, lens=80, fstop=5.6, focus=(JAR_AT + Vector((0, 0, 1.5)) - (TARGET + CAM_OFF)).length)
animate(FRAMES - 1)
frame_objects(cam, [jar, lid], fill=0.8, offset=(0, 0.04))
render(A, animate)
