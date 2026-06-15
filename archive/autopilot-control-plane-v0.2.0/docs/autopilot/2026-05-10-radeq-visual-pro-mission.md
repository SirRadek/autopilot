# Radeq Visual Pro Mission Handoff

Date: 2026-05-10
Supervisor: Autopilot v3
Mode: supervised implementation planning and controlled execution
Primary target: local Radeq web in `C:\Users\sirok\Documents\Autopilot`

## Mission

Move Radeq.cz from a strong technical showcase toward a professional, visually memorable, smooth, responsive portfolio system. The next workstream focuses on visual polish, motion, 3D cat quality, responsive behavior, and finishing real projects that can be shown as proof on the site.

The supervisor may make small low-risk edits directly after verification. Larger changes must be assigned to bots with exact scope, logs, and evidence.

## Autopilot Intake And Research Upgrade

New normal request flow:

1. Capture an intake record from the user request:
   - raw request,
   - desired outcome,
   - deliverable type,
   - affected area,
   - user-visible priority,
   - safety priority,
   - constraints,
   - forbidden actions,
   - external facts needed,
   - local files likely relevant,
   - questions or assumptions,
   - recommended next role.
2. Classify the deliverable as `ANSWER_ONLY`, `RESEARCH_ONLY`, `PLAN_ONLY`, `IMPLEMENTATION_CANDIDATE`, or `REMOTE_MUTATION_CANDIDATE`.
3. Ask clarifying questions only when missing information changes safety, scope, user-visible behavior, acceptance criteria, private data handling, asset licensing, deployment, or other irreversible decisions.
4. Assign priority from `P0` to `P4`:
   - `P0`: secrets, data loss, security, destructive or remote mutation, broken production deployment.
   - `P1`: broken build, tests, core flow, or deploy pipeline.
   - `P2`: requested feature or business-critical user-visible improvement.
   - `P3`: visual polish, motion, performance, accessibility, responsive quality.
   - `P4`: docs, cleanup, prompt maintenance, non-blocking refactor.
5. For implementation candidates, run independent research before coding:
   - GPT-side researcher inspects local files and current docs.
   - Gemini CLI runs only as redacted advisory with `gemini -m auto --skip-trust --approval-mode plan`.
   - Documentation verifier checks current library, CLI, SDK, browser, and cloud facts through Context7 or official docs.
6. Supervisor creates a synthesis with selected approach, rejected alternatives, verified facts, exact scope, likely files, assets or dependencies, tests, risks, and open decisions.
7. Implementation starts only after `WRITE_ALLOWED` names exact files/directories, allowed commands, forbidden actions, and required verification.

For small safe fixes, research may be skipped only when local evidence is enough and the supervisor records why.

## Inputs Already Checked

- Local stack: Astro, React, Tailwind, TypeScript, Vitest, Playwright.
- Local pages: `src/pages/index.astro`, `src/pages/en/index.astro`.
- Content source: `src/data/siteContent.ts`, `src/data/locales.ts`.
- 3D cat source: `src/components/CoreIsland.tsx`.
- Current app verification scripts: `npm run test`, `npm run typecheck`, `npm run build`, `npm run test:e2e`.
- Visual reference inspected: https://process-academy.org/
- GitHub inventory inspected through `gh repo list SirRadek --limit 30`.
- Three.js GLTF/animation loading checked through Context7 for `GLTFLoader`, `DRACOLoader`, `KTX2Loader`, Meshopt support, `AnimationMixer`, and cleanup/resource disposal patterns.
- Private cat reference copied into workspace as `docs/autopilot/reference/private-cat-reference.jpeg`.
- User-approved public derivative created as `public/reference/cat-reference.jpeg`.

## Cat Reference Assets

These images are the visual reference for the future 3D mascot.

- Original local working reference: `docs/autopilot/reference/private-cat-reference.jpeg` is intentionally ignored and not shipped.
- Public/Gemini-approved derivative: `public/reference/cat-reference.jpeg`.

The user explicitly approved Gemini and public use on 2026-05-10. Use the public derivative for external advisory, public screenshots, or future public routes. Do not expose the original iCloud path or unrelated photo metadata. Do not copy the image into generated textures or trace it into an exact pet replica.

Private ginger cat reference: original local image kept out of Git history for privacy.

Reference traits to preserve as generalized design direction:

- Warm ginger/orange tabby coloring with soft tonal variation.
- Plush medium-length fur impression around torso and cheeks.
- Rounded, sturdy, cozy body silhouette.
- Large dark curious eyes, compact muzzle, upright triangular ears.
- Subtle darker tabby striping on body, legs, and tail.
- Long expressive tail held upward or behind the body.
- White/light whiskers and a gentle alert expression.
- Calm, curious upward gaze toward the viewer.

Do not overfit:

- Do not recreate exact facial markings, stripe placement, eye reflections, body proportions, or the exact photo pose.
- Do not include the bed sheet pattern, sofa texture, room layout, camera angle, or domestic-environment details.
- Do not use the source image as a texture or exact model trace.
- Generated or modeled output should read as an original friendly ginger tabby mascot, not as an identifiable pet replica.

## Accepted Bot Findings

### Visual Direction Analyst

Status: accepted.

Summary:

- Use Process Academy as motion/story inspiration, not as a visual clone.
- Keep Radeq technical and systems-led, but move away from pure dark terminal/cyber cards toward a polished kinetic systems-lab feel.
- Add original Radeq visual assets beyond favicons: route lines, module tiles, proof diagrams, handoff maps, automation nodes, and dashboard fragments.
- Make the hero a strategic system preview, not just terminal UI.
- Treat the cat as optional delight, not the central proof.
- Replace decorative pulse/sweep animation with scroll-led chapters:
  - hero signal path,
  - Style Matrix,
  - proof flow,
  - handoff,
  - contact.
- Motion should explain meaning: route activation, module selection, proof completion, terminal brief formation.
- Keep transitions calm, roughly 300-700 ms, using opacity/transform/filter.
- Desktop may use layered or pinned scenes. Mobile must become stacked chapters with contained visuals.
- Style Matrix needs tablet/mobile rework; current three-column density should become tabs or segmented controls.

Risks:

- Do not copy Process Academy too closely.
- Heavy illustrations, pinned scenes, or WebGL can undermine the speed promise.
- Fixed scroll scenes are fragile on mobile.
- Cat can become gimmicky if it competes with proof.
- Czech text and diacritics need browser verification.

Accepted visual QA gates:

- Create 8-12 original visual assets beyond favicon/3D fallback.
- Verify `/` and `/en/` at 390x844, 768x1024, 1440x1100, and 1920x1080.
- Include mid-scroll chapter screenshots.
- Verify keyboard navigation, Style Matrix, terminal flow, WebGL enable/fallback, reduced motion, console errors, image dimensions, and alt text.

### GitHub Showcase Analyst

Status: accepted.

Read-only inspection:

- `radeq-website`
- `archviz-workbench`
- `autopilot-orchestration`

Priority:

1. `archviz-workbench`
   - Best showcase candidate.
   - Strong niche and clear workflow depth around Archicad, floor-plan generation, dimensions, compliance, and 3D verification.
   - Finish path: sanitized demo from sample brief to floor-plan JSON/SVG/HTML, analysis/compliance report, prompt pack or Comfy export, screenshots/video evidence.

2. `radeq-website`
   - Best showcase host.
   - Astro/React/TypeScript/Cloudflare Pages site with Czech/English routes, tests, D1 lead capture, and demo sections already named for SEO Fix Pack and Webhook Gateway.
   - Finish path: add real project/case-study pages, beginning with Archviz; then inspect `seo-fix-pack` and `webhook-gateway`.

3. `autopilot-orchestration`
   - Useful as private process evidence, not public showcase repo.
   - Keep private; extract only sanitized screenshots/process notes into Radeq case studies.

Safety:

- Keep private repos private by default.
- Prefer sanitized case studies or cleaned public demo repos.
- Do not expose API keys, `.env`, D1 lead data, emails, client names, local paths, Archicad project files, private standards, sensitive screenshots, or copyrighted standards text.
- Use synthetic briefs, generated demo assets, `.env.example`, and fake project data.
- Inspect full history and assets before any public release.

### 3D Cat Motion Analyst

Status: accepted.

Current shape:

- `src/components/CoreIsland.tsx` lazy-loads `three`.
- Cat is procedural low-poly primitives.
- Current motion is slow rotation, tail sway, pointerenter scale, and collar color.
- Cat is currently confined to the hero `.core-panel`, which is safer than a full-page overlay.

Recommended direction:

- Keep the Astro/React island and lazy opt-in.
- Replace procedural geometry with a web-optimized rigged `.glb`.
- Use Three.js directly first. Avoid adding `@react-three/fiber`/`drei` for one optional mascot unless complexity grows.
- Split future implementation into:
  - `CoreIsland.tsx` for enable/loading/error UI,
  - `catScene` for renderer, camera, loader, cleanup,
  - `catController` for animation state machine, mouse tracking, petting, scroll descent,
  - `catLayoutSafety` for safe anchors and collision checks.
- Aim for web-realistic quality: PBR textures, rigged head/eyes/tail, idle animation, glossy eyes, whiskers, no runtime fur particles.

Technical docs verified:

- Three.js `GLTFLoader` can load glTF/GLB and can be configured with `DRACOLoader`, `KTX2Loader`, and Meshopt decoder.
- Three.js examples use `AnimationMixer` and animation clips for animated GLTF assets.
- Three.js cleanup guidance supports tracking and disposing loaded scene resources to avoid leaks.

Interaction states:

- `idle/perched`
- `watching`
- `curious`
- `petting`
- `overstimulated`
- `jumping`
- `scroll-descend`
- `reduced-motion/static`

Safety/performance gates:

- Cat canvas should be only as large as its safe zone.
- If a larger background layer is needed, use `pointer-events: none` behind content.
- Before jumps, test cat bounding rect against header, hero copy, CTAs, matrix controls, terminal form, and visible text blocks.
- On mobile, default to no jumping and keep cat inside panel or hidden/still.
- Keep `client:visible` and explicit launch.
- Target optimized `.glb` under roughly 3-5 MB, textures <= 1024/2048, draw calls <= 15, triangles ideally <= 40k.
- Prefer an asset under 2 MB if the quality remains professional.
- Pause render loop when offscreen, tab hidden, or reduced-motion is active.
- Use refs, not React state, for per-frame values.
- Dispose mixer, geometries, materials, texture maps, renderer, decoders, and loaded image resources.
- Keep canvas `aria-hidden` if decorative.

Testing:

- `npm run typecheck`
- `npm run build`
- existing Vitest/Playwright suites
- Lighthouse mobile performance target: 90+ if achievable after visual assets; any lower score needs a specific reason and repair plan.
- `gltf-transform inspect`
- desktop/mobile screenshots before and after enabling cat
- pixel check for nonblank canvas
- pointer tests for head/eye follow and petting
- scroll tests for non-overlap
- reduced-motion test
- slow-network test where the terminal remains usable if cat loading is delayed or fails
- WebGL failure fallback
- axe check after enabling cat

### Gemini Critic

Status: accepted with verification notes.

Redacted Gemini review highlighted:

- 3D cat and scroll-led motion can hurt Core Web Vitals and main-thread responsiveness.
- Avoid scroll hijacking; native scroll behavior must remain intact.
- Czech/English i18n can break motion timing and layout if scroll scenes rely on fixed text height.
- Private GitHub inventory must map into public case studies only through sanitized aliases.
- Reduced-motion, mobile WebGL, slow-network, and Lighthouse gates should be explicit.

Adopted into this mission:

- Native scrolling requirement.
- Reduced-motion review.
- Mobile WebGL optionality.
- Contact terminal must work if the cat fails or loads slowly.
- Performance budget and Lighthouse target.
- Private/public boundary remains enforced through sanitized case studies.

## Visual Direction

Reference site: Process Academy.

What to learn from it:

- Smooth scroll-led storytelling instead of static stacked sections.
- Layered visual assets moving at different speeds.
- Playful but controlled motion.
- Sections that feel like scenes, not generic cards.
- Clear rhythm between compact educational modules and larger story moments.
- Motion that explains the concept instead of just decorating the page.

How to translate this to Radeq:

- Keep Radeq more technical, sharper, and more premium than Process Academy.
- Use motion as proof of engineering quality: precise timing, stable layout, no cheap parallax spam.
- Make sections feel alive: matrix transitions, proof blocks, selected systems, handoff standard, contact terminal.
- Replace static industrial feel with a more tactile command-system experience.
- Preserve readability and conversion focus.
- Do not implement scroll hijacking. Native browser scrolling must stay predictable on desktop and mobile.

## Required Workstreams

### 1. Radeq.cz Visual And Content Audit

Goal:
Review the current Radeq site and identify all visual, responsive, motion, content, and proof gaps.

Inspect:

- `src/pages/index.astro`
- `src/pages/en/index.astro`
- `src/layouts/BaseLayout.astro`
- `src/styles/global.css`
- `src/data/siteContent.ts`
- `src/data/locales.ts`
- `src/components/*.astro`
- `src/components/*.tsx`
- `tests/i18n-content.test.ts`
- `tests/i18n.spec.ts`
- `tests/smoke.spec.ts`

Output:

- First-viewport audit.
- Section-by-section visual audit.
- Motion opportunity list.
- Mobile/responsive problems.
- Czech/English content parity issues.
- Performance risks.
- Security/privacy risks.
- Recommended small fixes supervisor can do directly.
- Larger fixes to assign to bots.

Acceptance:

- Every visual claim references a file or browser observation.
- Czech and English routes are both considered.
- No implementation starts before the audit is accepted.

### 2. Visual Look, Detail, Motion, Responsiveness

Goal:
Upgrade the site into a professional, smooth, high-detail showcase.

Focus:

- Better first viewport hierarchy.
- More refined typography scale.
- Smoother section transitions.
- Motion with `prefers-reduced-motion` support.
- Responsive layout that does not collapse awkwardly.
- No text overflow.
- No generic card-grid feel.
- Better use of assets already in `docs/autopilot`.
- Better proof presentation for the real projects.

Rules:

- Static layout stays in `.astro`.
- Interactive state stays in `.tsx` islands.
- Every interactive island gets an intentional Astro `client:*` directive.
- Avoid dynamic Tailwind class names that the compiler cannot detect.
- Do not invent new public claims without project evidence.
- Keep both locales synchronized.

Verification:

- `npm run test`
- `npm run typecheck`
- `npm run build`
- `npm run test:e2e`
- Browser review desktop and mobile.
- Screenshot evidence for visual review.
- `prefers-reduced-motion` review proving the page remains complete and navigable.
- Mobile performance review before accepting heavy motion or 3D assets.
- Slow-network review proving the contact terminal still works if the cat asset is delayed or fails.

### 3. 3D Cat Upgrade

Current state:

- `CoreIsland.tsx` creates a low-poly ginger cat with Three.js primitives.
- It loads on demand via `client:visible`.
- It reacts only to pointer enter/leave with scale and collar color.

Target:

- More realistic and emotionally appealing cat.
- Inspired by the local reference image in `docs/autopilot/reference/private-cat-reference.jpeg` and the public derivative in `public/reference/cat-reference.jpeg`.
- Generalized appearance: friendly ginger/orange tabby, plush body, large dark curious eyes, compact muzzle, upright ears, subtle stripes, light whiskers, and expressive tail.
- Reactive to petting.
- Eyes/head follow pointer.
- Continuous spinning is not required and should not be the primary behavior.
- Cat should feel alive through bounded anatomical motion, not constant rotation.
- Cat should be rigged or segmented into controllable body, head, eyes, ears, tail, and paws when feasible.
- Stays in a non-blocking corner or safe background layer.
- Can jump or move only when it does not cover content or controls.
- Slowly descends or shifts in the background during scroll.
- Reduced-motion and no-WebGL fallbacks remain strong.

Research required:

- Best lightweight option for realistic cat asset:
  - generated GLB model,
  - optimized public-domain/licensed asset,
  - or carefully improved procedural Three.js cat if asset licensing blocks.
- Pointer interaction model:
  - hover/pet zone,
  - head tracking,
  - eye tracking,
  - smoothed neck/head rotation,
  - bounded tail and ear responses,
  - tail/ear response,
  - idle animation,
  - click/tap reaction.
- Collision/safe-zone model:
  - never cover nav, CTA, forms, or core reading areas.
  - on mobile, reduce or disable movement.

Hard gates:

- No heavy GLTF without compression and lazy loading.
- No unclear asset license.
- No use of the cat reference as a texture or exact tracing source.
- Use `public/reference/cat-reference.jpeg` for Gemini or public-facing reference workflows.
- No cat implementation whose main visible behavior is just spinning.
- No infinite high-cost animation loop when offscreen.
- Respect `prefers-reduced-motion`.
- Cat must not block interaction.
- Static fallback must still communicate the idea.
- Contact terminal must remain usable if the 3D cat never loads.
- WebGL must be tested on mobile-sized viewport and treated as optional.

Preferred technical direction:

- Use direct Three.js first.
- If a suitable licensed/generated rigged `.glb` is found, use `GLTFLoader` and `AnimationMixer`.
- If a suitable asset is not found, build an improved segmented procedural cat with separate meshes for body, head, eyes, ears, tail, and paws, using smoothed rotations and simple idle clips.
- Pointer tracking should use lerped bone or node orientation with caps so the head and eyes do not snap or rotate unnaturally.
- Petting should use a simplified hit zone or raycast target and trigger a small state transition such as blink, ear twitch, tail curl, or stretch.
- Render loop should run only when visible and needed, pause when tab-hidden/offscreen, and stop for reduced-motion/static fallback.
- Static fallback should be a still cat poster or CSS fallback, never a blank panel.

### 4. GitHub Showcase Project Audit

Goal:
Find which projects should become strong proof blocks on the website and what needs finishing.

Primary repos to inspect first:

1. `radeq-website`
   - Private, TypeScript/Astro/CSS, updated 2026-05-10.
   - Likely source or deployment mirror for the Radeq site.
   - Must be compared with local workspace before assuming either is source of truth.

2. `autopilot-orchestration`
   - Private, updated 2026-05-10.
   - Likely future Autopilot source of truth.
   - Inspect for docs, tasks, orchestration specs, or empty repo state.

3. `archviz-workbench`
   - Private, Python, description: Smart Archicad workflow workbench.
   - Strong visual/business showcase candidate if it has real workflow proof.

Secondary showcase candidates:

- `seo-fix-pack`
- `webhook-gateway`
- `scrapeflow`
- `importguard`
- `db-move-kit`
- `clienthub-mvp`
- `Codex`

Audit output per repo:

- Current purpose.
- README/docs quality.
- Install/run/test status.
- Screenshots or demo potential.
- Missing pieces before public showcase.
- Security/privacy limitations.
- Recommended website proof angle.
- Whether repo should be public, private alias only, or excluded.

Safety:

- Do not paste private repo content into Gemini.
- Use aliases in external prompts.
- Do not mutate remote repos without explicit permission.
- Do not publish private details on the public website.

### 5. Professional Quality Push

Definition of professional:

- Looks intentional at first glance.
- Motion is smooth and meaningful.
- Mobile is not a second-class version.
- 3D cat feels delightful, not gimmicky.
- Proof projects are real and inspectable internally.
- Copy does not overclaim.
- Build remains fast.
- Accessibility and reduced-motion behavior are respected.
- Every public claim has a source in code, repo, screenshot, or measured output.

If blocked:

- Supervisor reports the blocker immediately.
- Supervisor proposes 2-3 options.
- Small safe fixes can be made directly.
- Risky, large, or unclear work returns to planning or user decision.

## Bot Assignments

### Bot A: Radeq Site Auditor

Mode: `INSPECT_ONLY`

Skills/tools:

- Repository Explorer
- Frontend App Builder review mode
- Browser/Playwright verification if a local server is started

Task:

Audit current local site visual quality, motion, responsiveness, i18n parity, and proof sections.

Output:

- File map.
- Visual findings.
- Responsive findings.
- Motion findings.
- i18n findings.
- Test/browser evidence.
- Small direct-fix list.
- Bot-assigned larger work list.

### Bot B: Motion And Visual Design Lead

Mode: `DRY_RUN`, then `WRITE_ALLOWED` only after design approval

Skills/tools:

- Frontend App Builder
- Image generation for concept references if approved
- Context7 for Astro/React/Tailwind details

Task:

Turn the Process Academy inspiration into a Radeq-specific design and motion direction.

Output:

- Visual system proposal.
- Motion vocabulary.
- Section transition plan.
- Desktop/mobile behavior plan.
- Reduced-motion plan.
- Acceptance criteria.

### Bot C: 3D Cat Specialist

Mode: `DRY_RUN`, then scoped implementation after approval

Skills/tools:

- Three.js docs through Context7 or official docs.
- Frontend performance review.
- Asset licensing check.

Task:

Design and later implement the upgraded cat behavior.

Output:

- Asset strategy.
- Interaction states.
- Safe-zone rules.
- Scroll behavior.
- Performance budget.
- Fallback behavior.
- Test criteria.

### Bot D: GitHub Showcase Analyst

Mode: `INSPECT_ONLY`

Skills/tools:

- GitHub plugin or `gh` CLI.
- Repository Explorer.
- Security Reviewer for private-data boundaries.

Task:

Inspect 2-3 priority repos first and produce a finish-to-showcase backlog.

First targets:

- `radeq-website`
- `autopilot-orchestration`
- `archviz-workbench`

Then evaluate:

- `seo-fix-pack`
- `webhook-gateway`
- `scrapeflow`

Output:

- Repo audit table.
- Missing work.
- Demo/screenshot needs.
- Website proof angle.
- Security/privacy constraints.
- Suggested order.

### Bot E: QA, Performance, Accessibility

Mode: `INSPECT_ONLY` until implementation exists

Skills/tools:

- Playwright
- axe where useful
- Build/typecheck/test verification

Task:

Create and run the quality gate after each implementation slice.

Output:

- Commands run.
- Browser screenshots.
- Mobile/desktop review.
- Motion/reduced-motion review.
- Performance risks.
- Accessibility findings.

### Bot F: Gemini Critic

Mode: `DRY_RUN`, external advisory only

Command pattern:

```powershell
@'
You are external critic for a redacted Radeq visual upgrade mission.
Do not edit files. Do not use tools.
Context aliases:
- public-radeq-page = the current public website experience.
- local-autopilot-workspace = local Astro/React/Tailwind app.
- private-github-inventory = private project repositories, not to be disclosed.
Goal: critique the mission for visual polish, smooth motion, 3D cat interaction, responsive quality, project showcase readiness, and hallucination/security risks.
Return top risks, missing gates, simplifications, and acceptance tests.
'@ | gemini -m auto --skip-trust --approval-mode plan -p "Read stdin and answer only the requested critique. Do not use tools. Do not modify files."
```

Rules:

- Redacted context only.
- Gemini cannot approve work.
- Every Gemini claim must be verified locally or through official docs.

### Bot G: Intake And Priority Triage

Mode: `DRY_RUN`

Skills/tools:

- Superpowers brainstorming for creative or behavior-changing work.
- Local doc inspection when the user references an existing plan or mission.

Task:

Turn normal user input into a scoped work item before research or implementation.

Output:

- Intake record.
- Deliverable type.
- `P0` to `P4` priority.
- Clarifying question decision.
- Assumptions if no question is asked.
- Recommended next bot.

Rules:

- Ask questions only when the missing answer affects safety, scope, visible behavior, acceptance criteria, privacy, licensing, deployment, or irreversible work.
- Do not ask broad discovery questions when a safe assumption is enough.
- Do not start implementation.

### Bot H: GPT Researcher

Mode: `INSPECT_ONLY`

Skills/tools:

- Repository Explorer methods.
- Context7 and official docs for current technical facts.
- Playwright/browser evidence when the supervisor assigns a route.

Task:

Provide local, current-doc-backed research for implementation candidates before the supervisor writes the final plan.

Output:

- Files inspected.
- Current-fact verification table.
- Implementation options.
- Recommended approach.
- Rejected alternatives.
- Risks.
- Verification gates.

Rules:

- Do not edit files.
- Do not invent APIs, files, assets, licenses, or benchmark claims.
- Do not use Gemini output as evidence.

### Bot I: 3D Mascot Specialist

Mode: `DRY_RUN`, then `WRITE_ALLOWED` only after synthesis and approval

Skills/tools:

- Three.js docs through Context7 or official docs.
- Asset licensing check.
- `gltf-transform inspect` or equivalent for GLB assets.
- Playwright for pointer, reduced-motion, fallback, non-overlap, and screenshot checks after implementation.

Task:

Design and later implement the upgraded cat as a realistic-enough static-web mascot.

Output:

- Private-reference interpretation.
- Asset strategy.
- Rig or segment strategy.
- Interaction state machine.
- Safe-zone rules.
- Pointer/head/eye tracking plan.
- Petting response plan.
- Performance budget.
- Fallback behavior.
- Verification checklist.

Rules:

- The cat does not need to spin.
- Use `docs/autopilot/reference/private-cat-reference.jpeg` as local working inspiration.
- Use `public/reference/cat-reference.jpeg` when a Gemini-facing or public-facing reference is needed.
- Do not trace the image, use it as a texture, recreate exact markings, or expose the original local/iCloud path.
- The primary behavior should be head/eye tracking, idle movement, and petting response.
- Use rigged GLB if a suitable licensed optimized asset exists.
- If no asset is acceptable, improve the current procedural approach by separating controllable body parts.
- Reduced-motion, WebGL failure, slow loading, cleanup, and non-overlap tests are mandatory.

## Work Log And Token Accounting

Current tool limitation:

- Exact subagent token usage is not exposed in the available Codex tools.
- The supervisor must still log each bot run and record estimated context size when exact tokens are unavailable.

Required log entry per bot:

```text
Run ID:
Date/time:
Bot role:
Mode:
Prompt source:
Files inspected:
Files changed:
Commands run:
External tools used:
Exact token input:
Exact token output:
Estimated token input if exact unavailable:
Estimated token output if exact unavailable:
Acceptance status:
Findings:
Follow-up:
```

Initial bot run log:

```text
Run ID: visual-direction-001
Bot role: Visual Direction Analyst
Mode: INSPECT_ONLY
Status: completed and accepted
Exact token usage: unavailable in current tools
Estimated token input if exact unavailable: not measurable from current supervisor tools
Estimated token output if exact unavailable: not measurable from current supervisor tools
Findings: see Accepted Bot Findings / Visual Direction Analyst
Follow-up: use findings in design-direction task

Run ID: github-showcase-001
Bot role: GitHub Showcase Analyst
Mode: INSPECT_ONLY
Status: completed and accepted
Exact token usage: unavailable in current tools
Estimated token input if exact unavailable: not measurable from current supervisor tools
Estimated token output if exact unavailable: not measurable from current supervisor tools
Findings: see Accepted Bot Findings / GitHub Showcase Analyst
Follow-up: inspect first `archviz-workbench`, then reconcile `radeq-website` with local workspace

Run ID: cat-motion-001
Bot role: 3D Cat Motion Analyst
Mode: INSPECT_ONLY
Status: completed and accepted
Exact token usage: unavailable in current tools
Estimated token input if exact unavailable: not measurable from current supervisor tools
Estimated token output if exact unavailable: not measurable from current supervisor tools
Findings: see Accepted Bot Findings / 3D Cat Motion Analyst
Follow-up: run asset research and design approval before implementation

Run ID: gemini-visual-critic-001
Bot role: Gemini Critic
Mode: DRY_RUN
Status: completed and accepted with verification notes
Exact token usage: unavailable in current tools
Estimated token input if exact unavailable: not measurable from current supervisor tools
Estimated token output if exact unavailable: not measurable from current supervisor tools
Findings: performance, scroll, i18n, private/public, reduced-motion, mobile WebGL gates
Follow-up: gates added to mission; verify locally before implementation
```

## Controlled Execution Update

Run ID: `small-fix-slice-001`
Date/time: 2026-05-10 afternoon Europe/Prague
Mode: supervisor direct implementation after bot audit
Status: completed and verified

Scope:

- Route-locale lead payload metadata.
- Reduced-motion fallback for 3D cat launch.
- Core panel clipping on tablet/desktop.
- Regression tests for the above.

Files changed:

- `src/lib/leads.ts`
- `src/components/ContactTerminal.tsx`
- `src/components/CoreIsland.tsx`
- `src/data/siteContent.ts`
- `src/styles/global.css`
- `tests/terminal.test.ts`
- `tests/smoke.spec.ts`

Red/green evidence:

- Added failing Vitest coverage for route-locale metadata.
- Added failing Playwright coverage for core panel clipping and reduced-motion cat fallback.
- Implemented the scoped fixes.
- Re-ran targeted tests successfully.

Final verification:

- `npm run test`: passed, 4 test files, 16 tests.
- `npm run typecheck`: passed, 0 errors, 0 warnings, 0 hints.
- `npm run build`: passed, 2 pages built.
- `npm run test:e2e`: passed, 4 tests.

External advisory:

- Context7 Playwright docs checked for current reduced-motion emulation and CSS assertions.
- Gemini CLI ran with `gemini -m auto --skip-trust --approval-mode plan` as advisory only.
- Gemini returned PASS for the small fixes, but also emitted an unavailable-tool warning and quota retry note, so local verification remains the source of truth.

## Immediate Execution Order

1. Prepare design direction and motion plan from accepted bot findings.
2. Ask for design approval before large visual implementation.
3. Audit `archviz-workbench` evidence pack and reconcile with public-safe case-study content.
4. Implement next slices:
   - first viewport and global visual system,
   - motion and section transitions,
   - 3D cat upgrade,
   - project showcase sections,
   - final QA/performance/accessibility.
5. Continue logging every bot run and verification result in `docs/autopilot/2026-05-10-autopilot-run-log.md`.

## Acceptance Criteria

- Current Radeq site reviewed in Czech and English.
- Priority GitHub repos audited without private-data leakage.
- Visual direction approved before major implementation.
- Motion works on desktop, mobile, and reduced-motion.
- Cat is delightful, non-blocking, lazy-loaded, and has fallback.
- Showcase projects are backed by real repo evidence.
- Tests/typecheck/build pass after changes.
- Browser screenshots prove desktop/mobile quality.
- Bot work is logged with token accounting fields.
