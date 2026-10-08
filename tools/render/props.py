# Set pieces shared by several products.
import bpy, math, random
from mathutils import Vector, Matrix
from common import mesh_object, grid_faces, principled, nodes, bsdf, add_bump


def lathe(name, profile, mats=None, seg=128, close_bottom=True, close_top=True, wobble=None):
    """Revolve a (radius, z) polyline around Z. wobble(r, z, angle) -> radius offset."""
    verts = []
    for r, z in profile:
        for i in range(seg):
            a = math.tau * i / seg
            rr = r + (wobble(r, z, a) if wobble else 0.0)
            verts.append((rr * math.cos(a), rr * math.sin(a), z))
    faces = grid_faces(len(profile), seg)
    if close_bottom and profile[0][0] > 1e-6:
        c = len(verts)
        verts.append((0, 0, profile[0][1]))
        faces += [(c, (i + 1) % seg, i) for i in range(seg)]
    if close_top and profile[-1][0] > 1e-6:
        c = len(verts)
        verts.append((0, 0, profile[-1][1]))
        o = (len(profile) - 1) * seg
        faces += [(o + i, o + (i + 1) % seg, c) for i in range(seg)]
    return mesh_object(name, verts, faces, mats, fix_normals=True)


def arc(cx, cz, r, a0, a1, n=8):
    """Points on a quarter-round, for rounding lathe profile corners."""
    return [(cx + r * math.cos(a0 + (a1 - a0) * k / n), cz + r * math.sin(a0 + (a1 - a0) * k / n)) for k in range(n + 1)]


def parchment(name="parchment", size=10.5, rot=18, seed=3):
    """A creased, slightly cockled square of parchment paper."""
    rng = random.Random(seed)
    n = 90
    folds = [(Vector((rng.uniform(-1, 1), rng.uniform(-1, 1))).normalized(), rng.uniform(-2, 2)) for _ in range(3)]
    verts = []
    for j in range(n + 1):
        for i in range(n + 1):
            x = (i / n - 0.5) * size
            y = (j / n - 0.5) * size
            z = 0.025 * math.sin(x * 1.3 + 0.7) * math.cos(y * 1.1) + 0.015 * math.sin(x * 3.1 + y * 2.3)
            for nv, c in folds:
                dist = abs(Vector((x, y)).dot(nv) - c)
                z += 0.035 * max(0.0, 1 - dist / 0.35)
            edge = max(abs(x), abs(y)) / (size / 2)
            z += 0.12 * max(0.0, edge - 0.82) ** 2 * 40 * (0.6 + 0.4 * math.sin(x + y))
            verts.append((x, y, z))
    faces = []
    for j in range(n):
        for i in range(n):
            a = j * (n + 1) + i
            faces.append((a, a + 1, a + n + 2, a + n + 1))
    m = principled(name, (0.93, 0.9, 0.83), 0.42, sss=0.3, sss_radius=(0.3, 0.25, 0.2), sss_scale=0.05, sheen=0.3)
    add_bump(m, scale=60, strength=0.05, detail=3)
    ob = mesh_object(name, verts, faces, [m])
    ob.rotation_euler = (0, 0, math.radians(rot))
    # paper is thin: let a little light through
    b = bsdf(m)
    b.inputs["Transmission Weight"].default_value = 0.08
    return ob


def grain(name, radius=0.03, mat=None, subdiv=1):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdiv, radius=radius, location=(0, 0, -50))
    ob = bpy.context.active_object
    ob.name = name
    if mat:
        ob.data.materials.append(mat)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


def scatter_on(emitter, inst, count, size, size_random=0.6, seed=1, name="grains"):
    """Hair-particle instances of `inst` spread over the emitter's faces."""
    mod = emitter.modifiers.new(name, "PARTICLE_SYSTEM")
    ps = mod.particle_system
    st = ps.settings
    st.type = "HAIR"
    st.count = count
    st.hair_length = 1.0
    st.emit_from = "FACE"
    st.distribution = "RAND"
    st.use_emit_random = True
    st.render_type = "OBJECT"
    st.instance_object = inst
    st.particle_size = size
    st.size_random = size_random
    st.use_rotations = True
    st.rotation_mode = "NOR"
    st.rotation_factor_random = 1.0
    st.phase_factor_random = 2.0
    st.use_advanced_hair = True
    ps.seed = seed
    emitter.show_instancer_for_render = True
    return ps
