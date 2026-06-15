# Custom Cat Mascot Design

Date: 2026-05-11
Workspace: `C:\Users\sirok\Documents\Autopilot`
Phase: design/spec only; no runtime implementation in this document

## Purpose

Replace the current low-poly cat mascot with a custom stylized-realistic mascot inspired by the user's ginger cat photo. The goal is to avoid spending more time polishing a blocky temporary asset that will later be thrown away.

The finished mascot should feel like a real playful cat watching a laser pointer: alert, predatory, soft, expressive, and non-intrusive on the website.

## Current Baseline

The current model is `public/models/cat/quaternius-cat.glb`, sourced from Quaternius on Poly Pizza. It is CC0/Public Domain and appropriate for prototyping, but its low-poly silhouette causes the "Minecraft" look.

Current runtime behavior already has useful procedural layers:

- page/platform jumping
- pointer-based facing
- pointer look pose
- petting / cheek-bunt overlay
- procedural orange tabby material

Those behaviors should be preserved as a reusable control layer. The custom asset should be built to fit that control layer, not force a rewrite of the whole interaction system.

## Decision

Use a custom model pipeline, not more polishing of the current model.

Recommended production route:

1. Build a validated proxy rig first.
2. Test the proxy rig in the current Three.js mascot runtime.
3. Only after the rig works, create the final stylized-realistic mesh and skin it to the same rig.
4. Optimize and validate the GLB for static web delivery.

This reduces the risk of sculpting a good-looking cat that later cannot animate cleanly.

## Visual Direction

Target style: stylized realistic / soft anime-realistic.

The mascot should be less blocky and more alive, but should not attempt full photorealism. Realistic fur simulation is too heavy and can look worse on mobile if lighting and motion are not also realistic.

Reference traits from the user's cat photo:

- ginger/orange tabby coloring
- plush, rounded body volume
- rounded face
- large dark expressive eyes
- short triangular ears
- warm soft coat, not hard plastic
- subtle stripes and slightly darker tail/face accents

Avoid:

- blocky cube limbs
- sharp Minecraft-like silhouette
- hyperreal fur simulation
- large center-screen jumps that interrupt reading
- uncanny realistic face with weak animation

## Model Strategy

Preferred route: hand-made Blender model with clean topology.

Acceptable support tools:

- AI-generated concept images for visual exploration only
- Blender sculpting, retopology, UV unwrap, texture painting, baking
- optional commissioned character artist if local production becomes too slow

Avoid relying directly on AI-generated 3D mesh as the final asset unless it is retopologized and rigged cleanly. Procedural animation depends on stable topology, consistent bone names, and predictable deformation.

## Rig Contract

The runtime must be able to find stable named bones or objects. The final GLB should use this contract or provide a mapping file.

Required root and body controls:

- `CatRoot`
- `Center_Of_Mass`
- `Hips`
- `Spine_01`
- `Spine_02`
- `Spine_03`
- `Neck`
- `Head`

Required head/expression controls:

- `Eye_L`
- `Eye_R`
- `Ear_L`
- `Ear_R`
- `Muzzle`

Required tail controls:

- `Tail_01`
- `Tail_02`
- `Tail_03`
- `Tail_04`
- `Tail_05`

Required legs:

- `FrontLeg_L_Upper`
- `FrontLeg_L_Lower`
- `FrontPaw_L`
- `FrontLeg_R_Upper`
- `FrontLeg_R_Lower`
- `FrontPaw_R`
- `BackLeg_L_Upper`
- `BackLeg_L_Lower`
- `BackPaw_L`
- `BackLeg_R_Upper`
- `BackLeg_R_Lower`
- `BackPaw_R`

Optional expression controls:

- `Whiskers_L`
- `Whiskers_R`
- `Blink_L` morph target
- `Blink_R` morph target
- `Squint` morph target

## Runtime Behavior Target

The custom cat should support these states:

- `idle`: breathing, subtle tail movement, occasional blink
- `watching`: head follows mouse, body follows with delay
- `stalk`: crouched, focused, tail tip twitching
- `laser`: intense playful tracking when pointer moves quickly
- `prePounce`: short shoulder/hip wiggle when pointer pauses nearby
- `pounceTease`: small controlled lunge or paw tap, no content-blocking jump
- `petting`: cheek-bunt, body lean, tail lift, soft blink
- `jumping`: existing scroll/platform motion, with better body stretch

Important behavior rule:

The head reacts fastest, spine/body slower, hips and tail with separate delayed motion. This creates a believable cat-like chain instead of a rigid object rotating as one piece.

## Predator / Laser Behavior

The final "dravá" mode should be playful and premium, not chaotic.

Core behavior:

- when pointer velocity rises, eyes/head snap toward the target
- body lowers slightly into a stalking crouch
- tail tip flicks faster
- front paws brace asymmetrically
- if pointer stops for a moment, the cat freezes and prepares
- if pointer moves again, the cat relaxes from the pre-pounce

The cat should not constantly jump into the middle of the page. The page content remains primary.

QA attributes to add during implementation:

- `data-cat-hunt-state`
- `data-cat-pointer-speed`
- `data-cat-stalk-intensity`
- `data-cat-pounce-readiness`
- `data-cat-rig-version`
- `data-cat-model-budget`

## Asset Budget

Initial target for the final optimized GLB:

- 8k-18k triangles for the mascot mesh
- 1 main material plus eye material
- 1 base color texture, maximum 2048px before compression
- optional normal/roughness texture, only if visual improvement is clear
- target GLB size under 2 MB for production
- hard warning above 3 MB
- keep draw calls low, ideally 2-4

If the asset misses the budget, optimize before adding more runtime effects.

## Optimization Pipeline

Use glTF Transform for inspection and optimization.

Required checks:

```bash
gltf-transform inspect input.glb
gltf-transform validate input.glb
```

Typical optimization candidates:

```bash
gltf-transform optimize input.glb output.glb --compress meshopt --meshopt-level high
gltf-transform resize input.glb output.glb --width 1024 --height 1024
gltf-transform webp input.glb output.glb --quality 80
gltf-transform prune input.glb output.glb
gltf-transform dedup input.glb output.glb
```

For advanced texture compression, test KTX2/Basis Universal separately and keep a fallback if browser/runtime support causes issues.

Do not optimize blindly. Inspect before and after, then verify in browser.

## Prototype Plan

First prototype: ghost rig.

The ghost rig is a simple Blender/GLB proxy with the final bone names, rough proportions, and simple capsule/primitive body parts. It does not need final art quality.

Acceptance criteria for the ghost rig:

- loads in the existing Three.js runtime
- all required bones/objects are discoverable
- pointer facing works
- head follows pointer
- tail segments can be animated
- front paws can brace/knead
- body can crouch and stretch
- existing jump/platform logic still works
- browser shows no runtime errors

Only after this passes should final sculpting and texture work begin.

## Final Asset Acceptance Gates

Visual:

- recognizably inspired by the user's ginger cat
- no blocky Minecraft silhouette
- rounded, soft body and face
- expressive eyes visible at website scale
- believable cat posture in idle, hunt, pet, and jump states

Rig:

- required bone names or adapter mapping present
- no severe mesh pinching during crouch/stretch
- tail bends in multiple segments
- ears and eyes can express attention

Performance:

- optimized GLB under target budget or explicitly accepted
- no relevant console errors
- no blank canvas state
- first interaction remains responsive
- tested at desktop and at least one mobile viewport

Behavior:

- pointer tracking feels like a cat watching a laser
- hunt mode is playful but not distracting
- pounce tease stays near the cat's lane and does not cover key text/buttons
- petting remains soft and grounded
- reduced-motion mode still avoids animated 3D behavior

## Risks

Main risks:

- custom mesh looks better but is hard to animate
- too-realistic appearance creates uncanny motion
- asset becomes too large for a static landing page
- bone naming mismatch forces runtime rework
- late rig changes invalidate animation code

Mitigation:

- validate ghost rig before final mesh
- keep a strict bone contract
- preserve current procedural control layer
- inspect and optimize every exported GLB
- use stylized-realistic instead of photoreal fur

## Sources And Current Facts

- Current prototype model source: Poly Pizza Quaternius Cat, CC0/Public Domain, `https://poly.pizza/m/qKICY6xla2`.
- glTF Transform documentation supports CLI workflows for `inspect`, `validate`, `optimize`, `meshopt`, `resize`, `webp`, `prune`, and `dedup`: `https://gltf-transform.dev/`.
- Gemini CLI advisory was used on 2026-05-11 as a critique source only. Its recommendation aligned with the ghost-rig-first approach and warned against noisy AI-generated meshes as final rigged production assets.

## Recommendation

Proceed with the custom mascot as a separate asset pipeline:

1. Build ghost rig.
2. Integrate ghost rig with the existing runtime adapter.
3. Verify all procedural states.
4. Create final stylized-realistic cat mesh from the user's photo reference.
5. Skin mesh to the validated rig.
6. Optimize and browser-test.
7. Only then deepen predator/laser behavior.

This is the most likely path to avoid rebuilding the mascot twice.
