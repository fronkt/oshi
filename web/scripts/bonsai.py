"""Procedural bonsai + studio Cycles render (Blender 4.5, Z-up).
Generates the hero scroll-scrub frames in web/public/bonsai/ (bonsai_NNN.webp).

Modes:
  single : -- single <angle> <out.png> <samples> <rx> <ry>
  seq    : -- seq <outdir> <count> <start_deg> <end_deg> <samples> <rx> <ry>   (WebP+alpha)

Shipped hero frames were produced with:
  blender -b -P bonsai.py -- seq <outdir> 36 0 100 56 760 990
then copied to web/public/bonsai/. Requires Blender 4.5+ with an OPTIX/CUDA GPU.
"""
import bpy, bmesh, math, sys, random
from mathutils import Vector, Matrix

random.seed(7)
a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
mode = a[0] if a else "single"
if mode == "seq":
    outdir = a[1]; count = int(a[2]); start = float(a[3]); end = float(a[4])
    samples = int(a[5]) if len(a) > 5 else 56
    res_x = int(a[6]) if len(a) > 6 else 720; res_y = int(a[7]) if len(a) > 7 else 940
    use_dof = False; leaf_base = 700
else:
    angle = float(a[1]) if len(a) > 1 else 0.0
    out = a[2] if len(a) > 2 else "//bonsai.png"
    samples = int(a[3]) if len(a) > 3 else 160
    res_x = int(a[4]) if len(a) > 4 else 900; res_y = int(a[5]) if len(a) > 5 else 1170
    use_dof = True; leaf_base = 900

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
root = bpy.data.objects.new("root", None); scene.collection.objects.link(root)
def link(obj): scene.collection.objects.link(obj); obj.parent = root; return obj

def principled(name, base, rough=0.6, metal=0.0, sss=0.0, sss_color=(0.2,0.4,0.2),
               bump_scale=0.0, bump_freq=18.0, var=None):
    mat = bpy.data.materials.new(name); mat.use_nodes = True
    nt = mat.node_tree; nt.nodes.clear()
    out_n = nt.nodes.new("ShaderNodeOutputMaterial"); bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    def setv(k, v):
        if k in bsdf.inputs: bsdf.inputs[k].default_value = v
    setv("Roughness", rough); setv("Metallic", metal); setv("Subsurface Weight", sss); setv("Subsurface Radius", sss_color)
    if var:
        n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 3.0
        mix = nt.nodes.new("ShaderNodeMixRGB"); mix.inputs[1].default_value=(*base,1); mix.inputs[2].default_value=(*var,1)
        nt.links.new(n.outputs["Fac"], mix.inputs[0]); nt.links.new(mix.outputs[0], bsdf.inputs["Base Color"])
    else:
        setv("Base Color", (*base,1))
    if bump_scale > 0:
        tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value=bump_freq; tex.inputs["Detail"].default_value=8.0
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value=bump_scale
        nt.links.new(tex.outputs["Fac"], bump.inputs["Height"]); nt.links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    nt.links.new(bsdf.outputs["BSDF"], out_n.inputs["Surface"]); return mat

bark = principled("bark", (0.09,0.06,0.04), rough=0.82, bump_scale=0.5, bump_freq=26, var=(0.17,0.12,0.07))
leaf_mat = principled("leaf", (0.085,0.21,0.085), rough=0.38, sss=0.32, sss_color=(0.12,0.34,0.13), var=(0.20,0.42,0.15))
canopy_mat = principled("canopy", (0.03,0.07,0.035), rough=0.8)
pot_mat = principled("pot", (0.05,0.05,0.07), rough=0.26)
soil_mat = principled("soil", (0.02,0.018,0.015), rough=1.0, bump_scale=0.5, bump_freq=30)

def make_branch(name, pts, radii, depth=0.16):
    cu = bpy.data.curves.new(name,"CURVE"); cu.dimensions="3D"; cu.bevel_depth=depth; cu.bevel_resolution=6; cu.resolution_u=6
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(len(pts)-1)
    for i,(co,r) in enumerate(zip(pts,radii)):
        bp=sp.bezier_points[i]; bp.co=co; bp.radius=r; bp.handle_left_type=bp.handle_right_type="AUTO"
    obj=bpy.data.objects.new(name,cu); obj.data.materials.append(bark); return link(obj)

make_branch("trunk", [(0,0,0.30),(0.22,0.05,1.05),(-0.18,0.02,1.85),(0.26,0.06,2.55),(0.05,0,3.0)],
            [1.0,0.72,0.5,0.32,0.18], depth=0.2)
branch_defs = [
    ([(0.0,0.02,1.5),(0.55,0.15,1.85),(1.1,0.25,2.0)], [0.5,0.32,0.18]),
    ([(-0.1,0.0,1.95),(-0.5,0.1,2.3),(-1.0,0.15,2.5)], [0.45,0.28,0.15]),
    ([(0.1,0.05,2.4),(0.5,0.1,2.8),(0.9,0.12,3.05)], [0.4,0.24,0.13]),
    ([(0.0,0.0,2.6),(-0.3,-0.1,3.0),(-0.55,-0.12,3.3)], [0.35,0.2,0.12]),
]
canopies = []
for i,(pts,radii) in enumerate(branch_defs):
    make_branch(f"branch{i}", pts, radii, depth=0.12)
    c = Vector(pts[-1]); ar = random.uniform(0.55,0.72)
    canopies.append((c, (ar, ar*random.uniform(0.85,1.05), ar*0.62)))
canopies.append((Vector((0.25,0.0,3.25)), (0.6,0.62,0.4)))

for c,(ax,ay,az) in canopies:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1.0, location=c)
    sh=bpy.context.active_object; sh.scale=(ax*0.74,ay*0.74,az*0.74); sh.data.materials.append(canopy_mat)
    for p in sh.data.polygons: p.use_smooth=True
    sh.parent=root

LEAF = [Vector(v) for v in [(0,-0.05,0),(0.04,0.0,0.013),(0,0.13,0),(-0.04,0.0,0.013)]]
bm = bmesh.new()
for c,(ax,ay,az) in canopies:
    n_leaves = int(leaf_base * (ax*ay*az)/0.18)
    for _ in range(n_leaves):
        d = Vector((random.gauss(0,1),random.gauss(0,1),random.gauss(0,1)))
        if d.length < 1e-4: continue
        d.normalize(); band = random.uniform(0.80,1.04)
        p = c + Vector((d.x*ax, d.y*ay, d.z*az))*band
        nrm = Vector((d.x/ax, d.y/ay, d.z/az)); nrm.normalize()
        rot = Vector((0,0,1)).rotation_difference(nrm).to_matrix().to_4x4()
        spin = Matrix.Rotation(random.uniform(0,2*math.pi),4,nrm)
        tilt = Matrix.Rotation(random.uniform(-0.5,0.5),4,Vector((1,0,0)))
        M = Matrix.Translation(p) @ spin @ rot @ tilt @ Matrix.Scale(random.uniform(0.75,1.4),4)
        vs = [bm.verts.new(M @ v) for v in LEAF]; bm.faces.new(vs)
fmesh = bpy.data.meshes.new("foliage"); bm.to_mesh(fmesh); bm.free()
for p in fmesh.polygons: p.use_smooth=True
fol = bpy.data.objects.new("foliage", fmesh); fol.data.materials.append(leaf_mat); link(fol)

bpy.ops.mesh.primitive_cylinder_add(vertices=80, radius=1.12, depth=0.52, location=(0,0,0.06))
pot=bpy.context.active_object; pot.scale=(1.0,0.74,1.0); pot.data.materials.append(pot_mat)
for p in pot.data.polygons: p.use_smooth=True
b1=pot.modifiers.new("bev","BEVEL"); b1.width=0.05; b1.segments=4; pot.parent=root
bpy.ops.mesh.primitive_cylinder_add(vertices=80, radius=1.2, depth=0.1, location=(0,0,0.30))
rimlip=bpy.context.active_object; rimlip.scale=(1.0,0.74,1.0); rimlip.data.materials.append(pot_mat)
for p in rimlip.data.polygons: p.use_smooth=True
b2=rimlip.modifiers.new("bev","BEVEL"); b2.width=0.03; b2.segments=3; rimlip.parent=root
bpy.ops.mesh.primitive_cylinder_add(vertices=80, radius=1.06, depth=0.06, location=(0,0,0.33))
soil=bpy.context.active_object; soil.scale=(1.0,0.74,1.0); soil.data.materials.append(soil_mat); soil.parent=root
for fx,fy in [(0.78,0.46),(-0.78,0.46),(0.78,-0.46),(-0.78,-0.46)]:
    bpy.ops.mesh.primitive_cube_add(size=0.13, location=(fx,fy,-0.18))
    ft=bpy.context.active_object; ft.data.materials.append(pot_mat); ft.parent=root

bpy.ops.mesh.primitive_plane_add(size=40, location=(0,0,-0.26))
ground=bpy.context.active_object; ground.is_shadow_catcher=True; ground.parent=root

def area(name,loc,energy,size,color):
    l=bpy.data.lights.new(name,"AREA"); l.energy=energy; l.size=size; l.color=color
    o=bpy.data.objects.new(name,l); o.location=loc; scene.collection.objects.link(o); return o
key=area("key",(4,-4,6),2200,6,(1.0,0.95,0.88)); key.rotation_euler=(math.radians(52),0,math.radians(40))
area("fill",(-5,-3,3),460,9,(0.8,0.85,1.0))
rim=area("rim",(-3.5,4,4.5),1100,5,(1.0,0.18,0.44)); rim.rotation_euler=(math.radians(62),0,math.radians(205))
world=bpy.data.worlds.new("w"); scene.world=world; world.use_nodes=True
bg=world.node_tree.nodes["Background"]; bg.inputs[0].default_value=(0.015,0.015,0.022,1); bg.inputs[1].default_value=0.2

cam_data=bpy.data.cameras.new("cam"); cam_data.lens=85
focus=bpy.data.objects.new("focus",None); focus.location=(0,0,1.75); scene.collection.objects.link(focus)
cam_data.dof.use_dof=use_dof; cam_data.dof.focus_object=focus; cam_data.dof.aperture_fstop=3.6
cam=bpy.data.objects.new("cam",cam_data); cam.location=(0.4,-9.0,2.0); scene.collection.objects.link(cam)
tc=cam.constraints.new("TRACK_TO"); tc.target=focus; tc.track_axis="TRACK_NEGATIVE_Z"; tc.up_axis="UP_Y"
scene.camera=cam

scene.render.engine="CYCLES"; scene.cycles.samples=samples; scene.cycles.use_denoising=True
try:
    prefs=bpy.context.preferences.addons["cycles"].preferences
    for backend in ("OPTIX","CUDA","HIP","ONEAPI"):
        try:
            prefs.compute_device_type=backend; prefs.get_devices()
            if any(d.type!="CPU" for d in prefs.devices):
                for d in prefs.devices: d.use=True
                scene.cycles.device="GPU"; print(f"GPU backend: {backend}"); break
        except Exception: continue
except Exception as e: print("GPU skip",e)
scene.render.film_transparent=True
scene.render.resolution_x=res_x; scene.render.resolution_y=res_y
scene.view_settings.view_transform="AgX"

if mode == "seq":
    scene.render.image_settings.file_format="WEBP"; scene.render.image_settings.color_mode="RGBA"; scene.render.image_settings.quality=82
    for i in range(count):
        ang = start + (end-start)*i/(count-1)
        root.rotation_euler[2] = math.radians(ang)
        scene.render.filepath = f"{outdir}/bonsai_{i:03d}"
        bpy.ops.render.render(write_still=True)
        print(f"FRAME {i+1}/{count} ang={ang:.1f}")
    print("SEQ_DONE", outdir)
else:
    root.rotation_euler[2]=math.radians(angle)
    scene.render.image_settings.file_format="PNG"; scene.render.image_settings.color_mode="RGBA"
    scene.render.filepath=out
    bpy.ops.render.render(write_still=True); print("RENDERED", out)
