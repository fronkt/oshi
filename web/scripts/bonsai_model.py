"""Render a real CC0 potted-plant model (Poly Haven) on the Oshi studio rig.

Opens a downloaded Poly Haven .blend (PBR materials intact), normalizes it to a
target height, centers it on a turntable root, and renders with the same lighting
/ camera / AgX / transparent-film setup as the procedural bonsai — so the hero
gets a *photoreal* tree instead of procedural geometry.

Modes (Blender 4.5+, OPTIX/CUDA GPU):
  single : -- single <blend> <angle> <out.png> <samples>
  seq    : -- seq    <blend> <outdir> <count> <start_deg> <end_deg> <samples> <rx> <ry>

Shipped hero frames (web/public/bonsai/bonsai_NNN.webp) were produced with the CC0
"Potted Plant 01" model from Poly Haven (polyhaven.com, CC0) via:
  blender -b -P bonsai_model.py -- seq potted_plant_01_2k.blend <outdir> 36 25 115 110 760 990
Download the model + textures with scripts/fetch_model.py first. See public/bonsai/CREDITS.txt.
"""
import bpy, math, sys
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
mode = a[0]
TARGET_H = 3.15  # normalized model height (matches procedural framing)

if mode == "seq":
    blend = a[1]; outdir = a[2]; count = int(a[3]); start = float(a[4]); end = float(a[5])
    samples = int(a[6]) if len(a) > 6 else 96
    res_x = int(a[7]) if len(a) > 7 else 760; res_y = int(a[8]) if len(a) > 8 else 990
    use_dof = False
else:
    blend = a[1]; angle = float(a[2]); out = a[3]; samples = int(a[4]) if len(a) > 4 else 160
    res_x = 760; res_y = 990; use_dof = True

# --- load the real model -------------------------------------------------
bpy.ops.wm.open_mainfile(filepath=blend)
scene = bpy.context.scene

# strip the asset's own cameras / lights / world; keep only geometry
for o in list(bpy.data.objects):
    if o.type in ("LIGHT", "CAMERA", "LIGHT_PROBE"):
        bpy.data.objects.remove(o, do_unlink=True)

meshes = [o for o in bpy.data.objects if o.type == "MESH"]
if not meshes:
    raise SystemExit("no mesh objects in blend")

# world-space bounding box across all meshes
mn = Vector((1e9, 1e9, 1e9)); mx = Vector((-1e9, -1e9, -1e9))
for o in meshes:
    for corner in o.bound_box:
        w = o.matrix_world @ Vector(corner)
        mn = Vector((min(mn.x, w.x), min(mn.y, w.y), min(mn.z, w.z)))
        mx = Vector((max(mx.x, w.x), max(mx.y, w.y), max(mx.z, w.z)))
cx = (mn.x + mx.x) / 2; cy = (mn.y + mx.y) / 2; height = max(mx.z - mn.z, 1e-4)
scale = TARGET_H / height

# turntable root at the model's base-center; reparent top-level meshes
root = bpy.data.objects.new("root", None)
scene.collection.objects.link(root)
root.location = (cx, cy, mn.z)
for o in meshes:
    if o.parent is None:
        o.parent = root
        o.matrix_parent_inverse = root.matrix_world.inverted()
root.location = (0, 0, 0)         # drop base-center onto the origin
root.scale = (scale, scale, scale)  # normalize height

# --- studio rig (mirrors scripts/bonsai.py) ------------------------------
def area(name, loc, energy, size, color, rot=None):
    l = bpy.data.lights.new(name, "AREA"); l.energy = energy; l.size = size; l.color = color
    o = bpy.data.objects.new(name, l); o.location = loc
    if rot: o.rotation_euler = rot
    scene.collection.objects.link(o); return o

area("key", (4, -4, 6), 2400, 6, (1.0, 0.95, 0.88), (math.radians(52), 0, math.radians(40)))
area("fill", (-5, -3, 3), 520, 9, (0.8, 0.85, 1.0))
area("rim", (-3.5, 4, 4.5), 1300, 5, (1.0, 0.18, 0.44), (math.radians(62), 0, math.radians(205)))

world = bpy.data.worlds.new("w"); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.015, 0.015, 0.022, 1); bg.inputs[1].default_value = 0.18

# shadow-catcher ground at the base
bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0.0))
ground = bpy.context.active_object; ground.is_shadow_catcher = True; ground.parent = root

# camera
cam_data = bpy.data.cameras.new("cam"); cam_data.lens = 85
focus = bpy.data.objects.new("focus", None); focus.location = (0, 0, TARGET_H * 0.5)
scene.collection.objects.link(focus)
cam_data.dof.use_dof = use_dof; cam_data.dof.focus_object = focus; cam_data.dof.aperture_fstop = 3.6
cam = bpy.data.objects.new("cam", cam_data); cam.location = (0.4, -9.0, TARGET_H * 0.62)
scene.collection.objects.link(cam)
tc = cam.constraints.new("TRACK_TO"); tc.target = focus; tc.track_axis = "TRACK_NEGATIVE_Z"; tc.up_axis = "UP_Y"
scene.camera = cam

# render settings
scene.render.engine = "CYCLES"; scene.cycles.samples = samples; scene.cycles.use_denoising = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX", "CUDA", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = backend; prefs.get_devices()
            if any(d.type != "CPU" for d in prefs.devices):
                for d in prefs.devices: d.use = True
                scene.cycles.device = "GPU"; print("GPU backend:", backend); break
        except Exception: continue
except Exception as e:
    print("GPU skip", e)
scene.render.film_transparent = True
scene.render.resolution_x = res_x; scene.render.resolution_y = res_y
scene.view_settings.view_transform = "AgX"

if mode == "seq":
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"; scene.render.image_settings.quality = 82
    for i in range(count):
        ang = start + (end - start) * i / (count - 1)
        root.rotation_euler[2] = math.radians(ang)
        scene.render.filepath = "%s/bonsai_%03d" % (outdir, i)
        bpy.ops.render.render(write_still=True)
        print("FRAME %d/%d ang=%.1f" % (i + 1, count, ang))
    print("SEQ_DONE", outdir)
else:
    root.rotation_euler[2] = math.radians(angle)
    scene.render.image_settings.file_format = "PNG"; scene.render.image_settings.color_mode = "RGBA"
    scene.render.filepath = out
    bpy.ops.render.render(write_still=True); print("RENDERED", out)
