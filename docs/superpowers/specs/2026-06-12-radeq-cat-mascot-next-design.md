# Radeq Cat Mascot Next Design Slice

Date: 2026-06-12
Status: design direction for review; production hotfix is limited to mobile overlap protection
Project: Radeq.cz

## Owner Input

The owner accepted the current public baseline as a good start, but flagged that the cat mascot needs more design work:

- smoother body and texture
- more believable movement logic
- less accidental overlap with text, especially on mobile
- research of free libraries, assets, model routes, and best practices
- no loss of the current contact form behavior

## Current Decision

Do not rush a new production cat model directly into the live site. The current mascot stays as an optional enhancement while the next mascot pass is designed and tested separately.

The immediate production-safe change is only a mobile containment improvement: on narrow screens the roaming/platform cat must stay in a lower safe rail and cannot jump into hero copy or primary buttons.

## Recommended Approach

Use a staged hybrid approach:

1. Keep the current Three.js runtime and procedural control layer.
2. Improve safe placement, motion constraints, and reduced mobile visual weight first.
3. Prototype a better mascot asset with a validated GLB rig contract.
4. Only after the proxy rig works, replace or deeply polish the visual model.

This avoids spending live-site time on visual polish that may be thrown away if the model cannot animate well.

## Options Considered

### A. Runtime Polish Only

Improve the current model with better scale, lanes, motion smoothing, material tuning, and mobile constraints.

Pros:

- fastest to ship
- lowest deployment risk
- preserves current behavior and tests

Cons:

- cannot fully solve the low-poly body shape
- texture improvements are limited by the current mesh

Use now for hotfix-level work.

### B. Free GLB Replacement Asset

Find a free cat model from a reputable source, then optimize and adapt it.

Pros:

- potentially better silhouette quickly
- no full modeling effort upfront

Cons:

- license evidence is mandatory
- many free models have bad topology, missing rig, too many materials, or unsuitable scale
- may require runtime adapter work

Use only if the asset has a clear license, stable rig or simple hierarchy, and passes a browser budget check.

### C. Custom Ghost Rig Then Final Cat

Create a simple GLB proxy rig with the intended bone/object names, test it in the current runtime, then build the final stylized orange cat on that contract.

Pros:

- highest chance of smooth long-term motion
- keeps behavior and art decoupled
- best fit for a soft stylized mascot inspired by the owner's cat

Cons:

- slower than a hotfix
- needs Blender/asset-pipeline work and acceptance screenshots

Recommended for the real redesign.

## Visual Direction

Target: soft stylized orange cat, not photoreal fur and not low-poly blockiness.

Keep:

- warm orange tabby identity
- rounded body and face
- expressive eyes
- subtle tail and head attention
- playful but non-intrusive behavior

Avoid:

- center-screen jumps over copy or CTAs
- hard plastic material
- tiny legs/torso deformation that reads as broken
- overly realistic fur simulation
- any behavior that makes page content depend on WebGL

## Motion Direction

The cat should behave as a layered attention system:

- head reacts first
- chest/spine follows slower
- hips and tail lag behind
- mobile movement uses lower lanes with smaller visual range
- scroll/platform movement should feel like repositioning, not a constant acrobatic jump
- pointer play should be a tease, not a content blocker

## Asset And Library Direction

Current runtime remains Three.js with GLB/glTF assets.

Asset pipeline direction:

- ship GLB or glTF 2.0, not raw Blender/FBX/OBJ
- inspect and validate with glTF Transform before browser use
- prefer Meshopt-style geometry optimization where compatible
- keep material count low
- keep final optimized mascot under a strict web budget

Free asset sources can be explored, but each candidate needs:

- license screenshot or source URL
- author/source attribution requirement check
- triangle/material/texture count
- rig or hierarchy check
- browser screenshot on desktop and mobile

## Acceptance Gates For Next Implementation

Before a deeper mascot redesign is considered ready:

- desktop and mobile screenshots show no text/CTA overlap
- reduced-motion mode still makes the mascot optional
- WebGL failure does not affect primary content or form use
- no console errors from the mascot runtime
- GLB license and optimization evidence are recorded
- the mascot stays secondary to the homepage offer and contact flow

## Relationship To Current Hotfix

The 2026-06-12 production hotfix may:

- keep the current form
- add fail-soft lead email notifications
- add mobile-safe cat containment
- add tests around those two behaviors

It should not:

- replace the cat model
- add new model dependencies
- introduce AI/LLM behavior
- make the cat part of the form pipeline
- change the site's primary positioning

