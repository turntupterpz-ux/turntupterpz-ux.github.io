# Shared Blender scene kit for the product renders.
#
# Every product script builds its objects, then calls studio() and render().
# Units are centimetres. Run with:
#   blender -b -P tools/render/<product>.py -- --out <dir> [--frames 0-31] [--samples 128] [--res 640]
import bpy, bmesh, math, os, sys, argparse
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
FRAMES = 32
ASPECT = [1.0]                   # width / height of the output, set by --aspect


def args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    p = argparse.ArgumentParser()
    p.add_argument("--out", required=True)
    p.add_argument("--frames", default="0-31")
    p.add_argument("--samples", type=int, default=128)
    p.add_argument("--res", type=int, default=640)
    p.add_argument("--hdri", default=os.environ.get("TT_HDRI", ""))
    p.add_argument("--still", action="store_true", help="studio still with a backdrop instead of the cut-out sequence")
    p.add_argument("--aspect", type=float, default=1.0, help="width / height, for stills")
    p.add_argument("--name", default="", help="output file name for stills")
    a = p.parse_args(argv)
    ASPECT[0] = a.aspect
    if "-" in a.frames:
        lo, hi = map(int, a.frames.split("-"))
        a.frame_list = list(range(lo, hi + 1))
    else:
        a.frame_list = [int(x) for x in a.frames.split(",")]
    return a


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = "METRIC"
    sc.unit_settings.scale_length = 0.01
    return sc


# ------------------------------------------------------------------ easing
def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def ease_out(t, p=3):
    t = clamp(t)
    return 1 - (1 - t) ** p


def ease_in_out(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)


def window(f, start, end):
    """0..1 progress of frame f across [start, end]."""
    return clamp((f - start) / float(end - start))


def settle(t, bounce=0.08):
    """Ease-out with one soft overshoot, like an object landing."""
    t = clamp(t)
    return 1 - (1 - t) ** 3 + bounce * math.sin(t * math.pi) * (1 - t)


def lerp(a, b, t):
    return a + (b - a) * t


def lerpv(a, b, t):
    return Vector(a).lerp(Vector(b), t)


# ------------------------------------------------------------------ geometry
def mesh_object(name, verts, faces, mats=None, mat_index=None, smooth=True, fix_normals=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(v) for v in verts], [], faces)
    if fix_normals:
        bm = bmesh.new()
        bm.from_mesh(me)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        bm.to_mesh(me)
        bm.free()
    me.update()
    if smooth:
        for poly in me.polygons:
            poly.use_smooth = True
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for m in mats or []:
        me.materials.append(m)
    if mat_index is not None:
        for poly, idx in zip(me.polygons, mat_index):
            poly.material_index = idx
    return ob


def grid_faces(rows, cols, closed=True):
    """Quad faces for a rows x cols grid of verts, wrapped around the columns."""
    faces = []
    span = cols if closed else cols - 1
    for r in range(rows - 1):
        for c in range(span):
            c2 = (c + 1) % cols
            faces.append((r * cols + c, r * cols + c2, (r + 1) * cols + c2, (r + 1) * cols + c))
    return faces


def add_modifier_smooth(ob, angle=40):
    mod = ob.modifiers.new("smooth", "SMOOTH_BY_ANGLE") if hasattr(bpy.types, "SmoothByAngleModifier") else None
    return mod


def apply_modifiers(ob):
    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    for m in list(ob.modifiers):
        bpy.ops.object.modifier_apply(modifier=m.name)
    ob.select_set(False)


def set_parent(child, parent):
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()


def empty(name, loc=(0, 0, 0)):
    ob = bpy.data.objects.new(name, None)
    ob.location = loc
    bpy.context.scene.collection.objects.link(ob)
    return ob


# ------------------------------------------------------------------ materials
def principled(name, color=(0.8, 0.8, 0.8), rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    names = {
        "ior": "IOR", "transmission": "Transmission Weight", "coat": "Coat Weight",
        "coat_rough": "Coat Roughness", "sss": "Subsurface Weight", "sss_radius": "Subsurface Radius",
        "sss_scale": "Subsurface Scale", "spec": "Specular IOR Level", "sheen": "Sheen Weight",
        "sheen_tint": "Sheen Tint", "aniso": "Anisotropic", "alpha": "Alpha",
    }
    for k, v in kw.items():
        sock = b.inputs[names[k]]
        if isinstance(v, (tuple, list)) and len(v) == 3 and sock.type == "RGBA":
            v = (*v, 1)
        sock.default_value = v
    return m


def nodes(m):
    return m.node_tree.nodes, m.node_tree.links


def bsdf(m):
    return m.node_tree.nodes["Principled BSDF"]


def add_bump(m, scale=40.0, strength=0.08, kind="noise", detail=6.0, distance=0.02, into=("Normal",), coords="Object"):
    """Micro surface texture so nothing looks CG-perfect."""
    nt, ln = nodes(m)
    tc = nt.new("ShaderNodeTexCoord")
    if kind == "noise":
        tex = nt.new("ShaderNodeTexNoise")
        tex.inputs["Scale"].default_value = scale
        tex.inputs["Detail"].default_value = detail
        out = tex.outputs["Fac"]
    else:
        tex = nt.new("ShaderNodeTexVoronoi")
        tex.inputs["Scale"].default_value = scale
        out = tex.outputs["Distance"]
    ln.new(tc.outputs[coords], tex.inputs["Vector"])
    bump = nt.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    bump.inputs["Distance"].default_value = distance
    ln.new(out, bump.inputs["Height"])
    b = bsdf(m)
    for sock in into:
        ln.new(bump.outputs["Normal"], b.inputs[sock])
    return tex, bump


def light_shadows(m, tint=(1, 1, 1), amount=0.75):
    """Glass/oil lets light through its shadow (cheap caustics) instead of a solid black shadow."""
    nt, ln = nodes(m)
    out = nt["Material Output"]
    surf = out.inputs["Surface"].links[0].from_socket
    lp = nt.new("ShaderNodeLightPath")
    tr = nt.new("ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = (*[c * amount for c in tint], 1)
    mix = nt.new("ShaderNodeMixShader")
    ln.new(lp.outputs["Is Shadow Ray"], mix.inputs["Fac"])
    ln.new(surf, mix.inputs[1])
    ln.new(tr.outputs["BSDF"], mix.inputs[2])
    ln.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


def glass(name, color=(1, 1, 1), rough=0.0, ior=1.5, absorb=None, density=0.0, shadow=(1, 1, 1), shadow_amount=0.8):
    m = principled(name, color, rough, transmission=1.0, ior=ior)
    if absorb is not None and density > 0:
        nt, ln = nodes(m)
        va = nt.new("ShaderNodeVolumeAbsorption")
        va.inputs["Color"].default_value = (*absorb, 1)
        va.inputs["Density"].default_value = density
        ln.new(va.outputs["Volume"], nt["Material Output"].inputs["Volume"])
    light_shadows(m, shadow, shadow_amount)
    return m


def thin_clear(name, tint=(1, 1, 1), rough=0.02, ior=1.5):
    """A thin plastic/glass shell: see-through with fresnel reflections, no thick refraction."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt, ln = nodes(m)
    nt.remove(nt["Principled BSDF"])
    out = nt["Material Output"]
    tr = nt.new("ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = (*tint, 1)
    gl = nt.new("ShaderNodeBsdfGlossy")
    gl.inputs["Roughness"].default_value = rough
    fr = nt.new("ShaderNodeFresnel")
    fr.inputs["IOR"].default_value = ior
    mix = nt.new("ShaderNodeMixShader")
    ln.new(fr.outputs["Fac"], mix.inputs["Fac"])
    ln.new(tr.outputs["BSDF"], mix.inputs[1])
    ln.new(gl.outputs["BSDF"], mix.inputs[2])
    ln.new(mix.outputs["Shader"], out.inputs["Surface"])
    return m


# ------------------------------------------------------------------ studio
def camera(loc, target, lens=70, fstop=None, focus=None, shift=(0, 0)):
    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = lens
    cam_data.sensor_width = 36
    cam_data.shift_x, cam_data.shift_y = shift
    cam = bpy.data.objects.new("cam", cam_data)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = loc
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    if fstop:
        cam_data.dof.use_dof = True
        cam_data.dof.aperture_fstop = fstop
        cam_data.dof.focus_distance = focus if focus else d.length
    bpy.context.scene.camera = cam
    return cam


def area_light(name, loc, target, power, size, size_y=None, color=(1, 1, 1), shape="RECTANGLE", spread=None):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = power
    ld.shape = shape
    ld.size = size
    ld.size_y = size_y if size_y else size
    ld.color = color
    if spread is not None:
        ld.spread = math.radians(spread)
    ob = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


def world(hdri, strength=0.6, rot=0.0, tint=(1, 1, 1)):
    w = bpy.data.worlds.new("world")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree.nodes
    ln = w.node_tree.links
    bg = nt["Background"]
    bg.inputs["Strength"].default_value = strength
    if hdri and os.path.exists(hdri):
        tc = nt.new("ShaderNodeTexCoord")
        mp = nt.new("ShaderNodeMapping")
        mp.inputs["Rotation"].default_value = (0, 0, math.radians(rot))
        env = nt.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(hdri)
        mix = nt.new("ShaderNodeMixRGB")
        mix.blend_type = "MULTIPLY"
        mix.inputs["Fac"].default_value = 1
        mix.inputs["Color2"].default_value = (*tint, 1)
        ln.new(tc.outputs["Generated"], mp.inputs["Vector"])
        ln.new(mp.outputs["Vector"], env.inputs["Vector"])
        ln.new(env.outputs["Color"], mix.inputs["Color1"])
        ln.new(mix.outputs["Color"], bg.inputs["Color"])
    else:
        bg.inputs["Color"].default_value = (0.8, 0.8, 0.8, 1)
    return w


def shadow_catcher(size=200):
    bpy.ops.mesh.primitive_plane_add(size=size)
    ob = bpy.context.active_object
    ob.name = "floor"
    ob.is_shadow_catcher = True
    m = principled("floor", (0.8, 0.8, 0.8), 0.6)
    ob.data.materials.append(m)
    # what glass and liquids see beneath them: a clean studio floor instead of the HDRI's own floor
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, -0.004))
    under = bpy.context.active_object
    under.name = "underfloor"
    under.visible_camera = False
    under.visible_shadow = False
    under.data.materials.append(m)
    return ob


def studio(hdri, key=(-28, -22, 34), key_power=9000, rim=(26, 30, 18), rim_power=5000,
           fill=(30, -30, 10), fill_power=1500, target=(0, 0, 3), world_strength=0.55, world_rot=0, key_size=36):
    world(hdri, world_strength, world_rot)
    area_light("key", key, target, key_power, key_size, key_size * 0.7)
    area_light("rim", rim, target, rim_power, 22, 10)
    area_light("fill", fill, target, fill_power, 30, 30)


def render_settings(res=640, samples=128, transparent=True):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.cycles.samples = samples
    sc.cycles.preview_samples = 16
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.015
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPENIMAGEDENOISE"
    sc.cycles.max_bounces = 24
    sc.cycles.diffuse_bounces = 4
    sc.cycles.glossy_bounces = 8
    sc.cycles.transmission_bounces = 24
    sc.cycles.transparent_max_bounces = 24
    sc.cycles.volume_bounces = 2
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    sc.cycles.sample_clamp_indirect = 8
    sc.render.film_transparent = transparent
    sc.render.resolution_x = res
    sc.render.resolution_y = round(res / ASPECT[0])
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGBA" if transparent else "RGB"
    sc.render.image_settings.color_depth = "8"
    sc.render.threads_mode = "AUTO"
    sc.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            sc.view_settings.look = look
            break
        except TypeError:
            pass
    sc.render.use_persistent_data = True
    return sc


def render(a, animate, transparent=True, name="%02d.png"):
    """animate(f) moves everything into place for frame f (0..31), then each frame is written."""
    sc = render_settings(a.res, a.samples, transparent)
    os.makedirs(a.out, exist_ok=True)
    for f in a.frame_list:
        sc.frame_set(f)
        animate(f)
        bpy.context.view_layer.update()
        sc.render.filepath = os.path.join(a.out, name % f if "%" in name else name)
        bpy.ops.render.render(write_still=True)
        print("TT frame", f, "done", flush=True)


def no_shadow(*lights):
    """Lights that only add highlights; their long shadows look wrong on a cut-out."""
    for ob in lights:
        for attr in ("use_shadow",):
            if hasattr(ob.data, attr):
                setattr(ob.data, attr, False)
        if hasattr(ob.data, "cycles") and hasattr(ob.data.cycles, "cast_shadow"):
            ob.data.cycles.cast_shadow = False


def frame_objects(cam, objs, fill=0.8, offset=(0.0, 0.0)):
    """Zoom (focal length) and shift the camera so objs fill `fill` of the square frame."""
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    sc.render.resolution_x = 640
    sc.render.resolution_y = round(640 / ASPECT[0])
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    pts = []
    for o in objs:
        if o.type != "MESH":
            continue
        eo = o.evaluated_get(dg)
        me = eo.to_mesh()
        step = max(1, len(me.vertices) // 3000)
        pts += [o.matrix_world @ me.vertices[i].co for i in range(0, len(me.vertices), step)]
        eo.to_mesh_clear()
    for _ in range(6):
        bpy.context.view_layer.update()
        co = [world_to_camera_view(sc, cam, p) for p in pts]
        xs, ys = [c.x for c in co], [c.y for c in co]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        k = fill / max(w, h)
        # camera shift is measured in widths of the longer side
        kx, ky = (1.0, 1.0 / ASPECT[0]) if ASPECT[0] >= 1 else (ASPECT[0], 1.0)
        cam.data.lens *= k
        cam.data.shift_x += ((max(xs) + min(xs)) / 2 - 0.5 - offset[0]) * k * kx
        cam.data.shift_y += ((max(ys) + min(ys)) / 2 - 0.5 - offset[1]) * k * ky


def reflection_card(loc=(0, 28, 9), size=(70, 26), strength=1.2, lo=0.12, rot_x=80):
    """A big soft gradient seen only in reflections: smooth highlights on glossy liquids."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = "reflection_card"
    ob.scale = (size[0], size[1], 1)
    ob.rotation_euler = (math.radians(rot_x), 0, 0)
    m = bpy.data.materials.new("reflection_card")
    m.use_nodes = True
    nt, ln = m.node_tree.nodes, m.node_tree.links
    nt.remove(nt["Principled BSDF"])
    tc = nt.new("ShaderNodeTexCoord")
    sep = nt.new("ShaderNodeSeparateXYZ")
    ramp = nt.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (lo, lo, lo, 1)
    em = nt.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = strength
    ln.new(tc.outputs["Generated"], sep.inputs["Vector"])
    ln.new(sep.outputs["Y"], ramp.inputs["Fac"])
    ln.new(ramp.outputs["Color"], em.inputs["Color"])
    ln.new(em.outputs["Emission"], nt["Material Output"].inputs["Surface"])
    ob.data.materials.append(m)
    for ray in ("camera", "diffuse", "shadow", "volume_scatter"):
        setattr(ob, "visible_" + ray, False)
    return ob
