import bpy
import math

# Clear existing objects in the scene
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

# 1. Create Armature
armature_data = bpy.data.armatures.new("StickRigData")
armature_object = bpy.data.objects.new("StickCharacter", armature_data)
bpy.context.scene.collection.objects.link(armature_object)

# Select and make it active
bpy.context.view_layer.objects.active = armature_object
armature_object.select_set(True)

# Set armature display settings
armature_data.display_type = 'STICK'
armature_object.show_in_front = True

# Enter Edit Mode to create bones
bpy.ops.object.mode_set(mode='EDIT')

# Helper to add a bone
def add_bone(name, head, tail, parent_name=None):
    bone = armature_data.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    if parent_name:
        bone.parent = armature_data.edit_bones[parent_name]
    return bone

# Define coordinates for standard T-Stance (X = right/left, Y = depth, Z = height)
# Heights: Hips=1.0, Chest=1.4, Neck=1.6, Head=1.85, Shoulders=1.5, Feet=0.0
add_bone("Hips", (0, 0, 1.0), (0, 0, 1.1))
add_bone("Spine", (0, 0, 1.1), (0, 0, 1.45), "Hips")
add_bone("Head", (0, 0, 1.55), (0, 0, 1.8), "Spine")

# Left Arm (Standard naming: .L)
add_bone("Shoulder.L", (0, 0, 1.45), (0.2, 0, 1.45), "Spine")
add_bone("Elbow.L", (0.2, 0, 1.45), (0.45, 0, 1.45), "Shoulder.L")
add_bone("Hand.L", (0.45, 0, 1.45), (0.6, 0, 1.45), "Elbow.L")

# Right Arm (.R)
add_bone("Shoulder.R", (0, 0, 1.45), (-0.2, 0, 1.45), "Spine")
add_bone("Elbow.R", (-0.2, 0, 1.45), (-0.45, 0, 1.45), "Shoulder.R")
add_bone("Hand.R", (-0.45, 0, 1.45), (-0.6, 0, 1.45), "Elbow.R")

# Left Leg (.L)
add_bone("Hip.L", (0.08, 0, 1.0), (0.08, 0, 0.95), "Hips")
add_bone("Knee.L", (0.08, 0, 0.95), (0.08, 0, 0.5), "Hip.L")
add_bone("Foot.L", (0.08, 0, 0.5), (0.08, 0.1, 0.0), "Knee.L")

# Right Leg (.R)
add_bone("Hip.R", (-0.08, 0, 1.0), (-0.08, 0, 0.95), "Hips")
add_bone("Knee.R", (-0.08, 0, 0.95), (-0.08, 0, 0.5), "Hip.R")
add_bone("Foot.R", (-0.08, 0, 0.5), (-0.08, 0.1, 0.0), "Knee.R")

bpy.ops.object.mode_set(mode='OBJECT')

# 2. Add glowing stick meshes for the bones
# Create a glowing neon material
mat = bpy.data.materials.new(name="NeonGlow")
mat.use_nodes = True
nodes = mat.node_tree.nodes
nodes.clear()
emission = nodes.new(type='ShaderNodeEmission')
emission.inputs['Color'].default_value = (0.0, 0.95, 1.0, 1.0) # Ice Cyan glow
emission.inputs['Strength'].default_value = 8.0
output = nodes.new(type='ShaderNodeOutputMaterial')
mat.node_tree.links.new(emission.outputs['Emission'], output.inputs['Surface'])

# Generate mesh stick geometry parented to armature bones
for bone in armature_data.bones:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=1.0)
    cyl = bpy.context.active_object
    cyl.name = "Mesh_" + bone.name
    cyl.data.materials.append(mat)
    
    # Parent to bone
    cyl.parent = armature_object
    cyl.parent_type = 'BONE'
    cyl.parent_bone = bone.name
    
    # Calculate length and orientation
    b_len = bone.length
    cyl.scale = (1, 1, b_len)
    # Offset cylinder so it sits between joint ends
    cyl.location = (0, 0, b_len / 2)

# Select the armature back
bpy.context.view_layer.objects.active = armature_object

# 3. Animation Generators
# Set frame ranges
bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end = 24

def set_keyframe(bone_name, frame, attribute, value):
    pose_bone = armature_object.pose.bones[bone_name]
    setattr(pose_bone, attribute, value)
    pose_bone.keyframe_insert(data_path=attribute, frame=frame)

# Clean/Setup pose rotations mode to Euler for easy scripting
for pb in armature_object.pose.bones:
    pb.rotation_mode = 'XYZ'

# --- ANIMATION 1: WALK CYCLE (24 Frames) ---
walk_action = bpy.data.actions.new("Walk_Cycle")
armature_object.animation_data_create()
armature_object.animation_data.action = walk_action

# Simple 4-Keyframes stride cycle (0, 6, 12, 18, 24)
for f, leg_offset in [(1, 1), (6, 0), (12, -1), (18, 0), (25, 1)]:
    # Rotate Hip.L / Hip.R
    set_keyframe("Hip.L", f, "rotation_euler", (math.radians(25 * leg_offset), 0, 0))
    set_keyframe("Knee.L", f, "rotation_euler", (math.radians(-30 * abs(leg_offset)), 0, 0))
    
    set_keyframe("Hip.R", f, "rotation_euler", (math.radians(-25 * leg_offset), 0, 0))
    set_keyframe("Knee.R", f, "rotation_euler", (math.radians(-30 * (1 - abs(leg_offset))), 0, 0))
    
    # Swing Arms (opposite to legs)
    set_keyframe("Shoulder.L", f, "rotation_euler", (math.radians(-35 * leg_offset), 0, 0))
    set_keyframe("Shoulder.R", f, "rotation_euler", (math.radians(35 * leg_offset), 0, 0))
    
    # Bob body height slightly
    height_offset = 1.0 - 0.05 * (1 - abs(leg_offset))
    set_keyframe("Hips", f, "location", (0, 0, height_offset - 1.0))

# --- ANIMATION 2: LIGHT PUNCH (J Key - 10 Frames) ---
punch_action = bpy.data.actions.new("Attack_J_Punch")
armature_object.animation_data.action = punch_action

# Frame 1: Stance
set_keyframe("Shoulder.L", 1, "rotation_euler", (0, 0, 0))
set_keyframe("Elbow.L", 1, "rotation_euler", (0, 0, 0))

# Frame 4: Extended Hit Strike
set_keyframe("Shoulder.L", 4, "rotation_euler", (math.radians(90), 0, math.radians(45)))
set_keyframe("Elbow.L", 4, "rotation_euler", (0, 0, 0))  # Fully straight
set_keyframe("Spine", 4, "rotation_euler", (0, 0, math.radians(20))) # Lean torso forward

# Frame 10: Recovered to Idle
set_keyframe("Shoulder.L", 10, "rotation_euler", (0, 0, 0))
set_keyframe("Elbow.L", 10, "rotation_euler", (0, 0, 0))
set_keyframe("Spine", 10, "rotation_euler", (0, 0, 0))

# --- ANIMATION 3: MEDIUM KICK (K Key - 12 Frames) ---
kick_action = bpy.data.actions.new("Attack_K_Kick")
armature_object.animation_data.action = kick_action

# Frame 1: Stance
set_keyframe("Hip.R", 1, "rotation_euler", (0, 0, 0))
set_keyframe("Knee.R", 1, "rotation_euler", (0, 0, 0))

# Frame 3: Chamber (bend knee up)
set_keyframe("Hip.R", 3, "rotation_euler", (math.radians(60), 0, 0))
set_keyframe("Knee.R", 3, "rotation_euler", (math.radians(-90), 0, 0))
set_keyframe("Hips", 3, "location", (0, 0, -0.1))

# Frame 6: Snap Extension
set_keyframe("Hip.R", 6, "rotation_euler", (math.radians(90), 0, 0))
set_keyframe("Knee.R", 6, "rotation_euler", (0, 0, 0)) # Straight Leg
set_keyframe("Spine", 6, "rotation_euler", (math.radians(-20), 0, 0)) # Lean chest back for balance

# Frame 12: Recovery
set_keyframe("Hip.R", 12, "rotation_euler", (0, 0, 0))
set_keyframe("Knee.R", 12, "rotation_euler", (0, 0, 0))
set_keyframe("Spine", 12, "rotation_euler", (0, 0, 0))
set_keyframe("Hips", 12, "location", (0, 0, 0))

print("Neon Stick Character armature, materials, and walking/attack actions built successfully!")
