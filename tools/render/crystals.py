# THCa crystal helpers shared by diamonds.py and sauce.py.
import bpy, bmesh, math, random
from mathutils import Vector, Matrix, Quaternion
from common import principled, nodes, bsdf, light_shadows, mesh_object


def crystal_mesh(rng, length, radius, sides=6, tip=0.22, skew=0.3, cuts=2):
    """An elongated prism with pointed, slightly off-centre terminations (convex hull),
    then broken off along a few random planes the way real crystals snap."""
    pts = []
    rot = rng.uniform(0, math.tau)
    radii = [radius * rng.uniform(0.75, 1.2) for _ in range(sides)]
    for k in range(3):
        z = (k / 2 - 0.5) * length
        for i in range(sides):
            a = rot + math.tau * i / sides + rng.uniform(-0.12, 0.12)
            r = radii[i] * rng.uniform(0.93, 1.05) * (1 - 0.1 * abs(z) / length)
            pts.append(Vector((r * math.cos(a), r * math.sin(a), z)))
    for sgn in (1, -1):
        cap = length / 2 + tip * length * rng.uniform(0.5, 1.0)
        off = Vector((rng.uniform(-skew, skew), rng.uniform(-skew, skew), 0)) * radius
        pts.append(off + Vector((0, 0, sgn * cap)))
        # a second, lower point makes an uneven, natural looking tip
        a = rng.uniform(0, math.tau)
        pts.append(Vector((0.45 * radius * math.cos(a), 0.45 * radius * math.sin(a), sgn * (cap - 0.18 * length))))
    for _ in range(cuts):
        n = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-1.2, 1.2))).normalized()
        reach = max(p.dot(n) for p in pts)
        d = reach - rng.uniform(0.12, 0.3) * (length * 0.5 + radius)
        pts = [p - n * (p.dot(n) - d) if p.dot(n) > d else p for p in pts]
    bm = bmesh.new()
    for p in pts:
        bm.verts.new(p)
    bmesh.ops.convex_hull(bm, input=bm.verts)
    bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(4), verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    return bm


def crystal(name, rng, length, radius, mat, bevel=0.025, **kw):
    bm = crystal_mesh(rng, length, radius, **kw)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.materials.append(mat)
    if bevel:
        b = ob.modifiers.new("bevel", "BEVEL")
        b.width = bevel
        b.segments = 2
        b.limit_method = "ANGLE"
        b.angle_limit = math.radians(25)
        b.harden_normals = False
    return ob


def union(target, others):
    """Fuse intergrown crystals into one solid so glass refracts cleanly."""
    for o in others:
        m = target.modifiers.new("u_" + o.name, "BOOLEAN")
        m.operation = "UNION"
        m.solver = "EXACT"
        m.object = o
    bpy.context.view_layer.objects.active = target
    for m in list(target.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    for o in others:
        bpy.data.objects.remove(o, do_unlink=True)
    return target


def black_flag(name, loc, target, w, h):
    """A black card seen only in reflections/refractions: gives glass its dark edges."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (w, h, 1)
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("Z", "Y").to_euler()
    m = principled(name, (0.005, 0.005, 0.005), 0.9)
    ob.data.materials.append(m)
    ob.visible_camera = False
    ob.visible_shadow = False
    ob.visible_diffuse = False
    return ob


def apply_all(ob):
    bpy.context.view_layer.objects.active = ob
    for m in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)


def rest_matrix(ob, loc_xy, yaw, floor=0.0, pick=0):
    """Matrix that sets the object down on one of its broad hull faces."""
    me = ob.data
    bm = bmesh.new()
    for v in me.vertices:
        bm.verts.new(v.co)
    bmesh.ops.convex_hull(bm, input=bm.verts)
    faces = sorted([f for f in bm.faces], key=lambda f: -f.calc_area())
    centroid = sum((v.co for v in me.vertices), Vector()) / len(me.vertices)
    # prefer broad faces the centre of mass sits over
    chosen = faces[min(pick, len(faces) - 1)]
    n = chosen.normal.copy()
    if (chosen.calc_center_median() - centroid).dot(n) < 0:
        n = -n
    bm.free()
    q = n.rotation_difference(Vector((0, 0, -1)))
    q = Quaternion((0, 0, 1), yaw) @ q
    m = q.to_matrix().to_4x4()
    zs = [(m @ v.co).z for v in me.vertices]
    m.translation = Vector((loc_xy[0], loc_xy[1], floor - min(zs)))
    return m


def thca_material(name, tint=(1.0, 0.96, 0.86), cloud=0.06, absorb=(1.0, 0.86, 0.55), density=0.12, rough=0.02):
    """Clear THCa: glassy, faintly yellow, a little cloudy inside, with a wet terp film."""
    m = principled(name, tint, rough, transmission=1.0, ior=1.55, coat=0.6, coat_rough=0.02)
    nt, ln = nodes(m)
    b = bsdf(m)
    # uneven frosting: some faces glassy, some satin
    tc = nt.new("ShaderNodeTexCoord")
    nz = nt.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.6
    nz.inputs["Detail"].default_value = 4
    ln.new(tc.outputs["Object"], nz.inputs["Vector"])
    mr = nt.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = 0.45
    mr.inputs["From Max"].default_value = 0.7
    mr.inputs["To Min"].default_value = rough
    mr.inputs["To Max"].default_value = 0.08
    ln.new(nz.outputs["Fac"], mr.inputs["Value"])
    ln.new(mr.outputs["Result"], b.inputs["Roughness"])
    # growth steps / micro facets
    vor = nt.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 7
    ln.new(tc.outputs["Object"], vor.inputs["Vector"])
    bump = nt.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.12
    bump.inputs["Distance"].default_value = 0.02
    ln.new(vor.outputs["Distance"], bump.inputs["Height"])
    ln.new(bump.outputs["Normal"], b.inputs["Normal"])
    # body colour and haze
    va = nt.new("ShaderNodeVolumeAbsorption")
    va.inputs["Color"].default_value = (*absorb, 1)
    va.inputs["Density"].default_value = density
    vol = va.outputs["Volume"]
    if cloud > 0:
        vs = nt.new("ShaderNodeVolumeScatter")
        vs.inputs["Color"].default_value = (1, 0.97, 0.9, 1)
        vs.inputs["Density"].default_value = cloud
        add = nt.new("ShaderNodeAddShader")
        ln.new(va.outputs["Volume"], add.inputs[0])
        ln.new(vs.outputs["Volume"], add.inputs[1])
        vol = add.outputs["Shader"]
    ln.new(vol, nt["Material Output"].inputs["Volume"])
    light_shadows(m, (1.0, 0.93, 0.78), 0.7)
    return m


def tumble(rest, f, start, dur, height, spin, drift=(0, 0)):
    """Fall from above with a tumble and settle into the rest matrix."""
    from common import window, ease_out
    t = window(f, start, start + dur)
    s = ease_out(t, 2.6)
    rq = rest.to_quaternion()
    sq = Quaternion(spin[0], spin[1]) @ rq
    q = sq.slerp(rq, ease_out(t, 2.2))
    loc = rest.translation + Vector((drift[0] * (1 - s), drift[1] * (1 - s), height * (1 - s)))
    m = q.to_matrix().to_4x4()
    m.translation = loc
    return m
