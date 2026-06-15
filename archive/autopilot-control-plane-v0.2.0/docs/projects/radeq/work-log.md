# Radeq.cz Website Work Log

## 2026-06-05 Coin Flip Theme Toggle

Date: 2026-06-05
Request or trigger: user asked to replace the light/dark segmented toggle with a coin-like switch showing sun on one side and moon with stars on the other.
Mode: WRITE_ALLOWED for the RadeQ product preview branch and this Autopilot governance record. No lead API, D1, migrations, workflow files, package files, dependencies, model assets, Cloudflare production configuration, automations, or heartbeats were changed.
Scope: convert `ThemeModeToggle` from two mode buttons to one accessible `role="switch"` button, add CSS-only 3D coin faces for light and dark states, keep mobile header compact, and update smoke coverage for the new interaction.
Architecture impact: no runtime architecture change. Existing `static_public_site`, `seo_performance_surface`, and `runtime_observability_boundary` nodes cover this UI polish. The change is a client-side header control only and does not alter SEO content, route structure, lead capture, or optional 3D mascot behavior.
Verification:

- Baseline before product edits: branch `codex/radeq-ab-c-preview`, commit `f36a81f`, public mobile preview had no horizontal overflow, two theme buttons, canonical metadata intact, and no console messages.
- Product checks passed on commit `ebf2c31`: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27027219371` completed successfully from commit `ebf2c31d0d42fea1bf4d82019569373786848289`.
- Public preview `https://sirradek.github.io/radeq/?v=ebf2c31&probe=theme-coin` was checked at mobile 390x920. The switch exposed `role="switch"`, `aria-checked=false` in light mode, `aria-checked=true` after click, two coin faces, three stars, `data-theme` changed to dark, no horizontal overflow, no console messages, and robots/sitemap stayed reachable.
- Screenshot evidence was written locally as `radeq-theme-coin-ebf2c31-light-mobile.png` and `radeq-theme-coin-ebf2c31-dark-mobile.png` under the Windows temp directory.

Risk notes:

- The known Vite chunk-size warning remains unrelated to this small UI change.
- Full Codex App runtime verification was not claimed; evidence is bounded to local commands and public GitHub Pages Playwright checks.

Rollback:

- Revert product commit `ebf2c31` on `codex/radeq-ab-c-preview`, or redeploy previous accepted preview commit `f36a81f`.

Project mesh impact: work-log record only. No new mesh rule or architecture update was needed.

## 2026-06-05 RadeQ Preview Polish Slice

Date: 2026-06-05
Request or trigger: user approved implementing the refinement plan for the GitHub Pages preview after the prior mobile review and product/design brainstorming.
Mode: WRITE_ALLOWED for the RadeQ product preview branch and this Autopilot governance record. No lead API, D1, migrations, workflow files, package files, dependencies, model assets, Cloudflare production configuration, automations, or heartbeats were changed.
Scope: polish the existing A/B/C/D static proposal compositions without changing the runtime architecture. A gained a clearer recommended start, B gained visible concierge advice, C gained concrete proof artifacts, D gained a mobile-first finder, and global styling was softened with quieter animated background layers and touch/text responsiveness improvements.
Architecture impact: no new RadeQ runtime architecture was introduced. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and `three_d_mascot_addon` nodes still cover the slice. Existing `RAD-DESIGN-001` and `RAD-DESIGN-002` govern variant distinctness and public mobile evidence, so no new mesh node or rule was needed.
Decisions:

- Keep A `Guided Offer Map`, B `Cat Concierge`, C `Studio Proof`, and D `Demo Worlds` as the active proposal directions.
- Add only static, SEO-readable proof and conversion content; keep the mascot and WebGL behavior unchanged as optional progressive enhancement.
- Use CSS-only visual polish for the background and responsive rhythm; do not add image assets, generated media, new dependencies, or model files in this slice.
- Use the existing GitHub Pages workflow by manual `workflow_dispatch` because the preview branch did not auto-deploy on push. No workflow file was edited and no automation was created.
- Treat prior Gemini output as advisory only. The implemented changes were based on the product-focused refinement plan and were verified through local tests and public GitHub Pages evidence.

Verification:

- Baseline before product edits: RadeQ branch `codex/radeq-ab-c-preview`, commit `a649c4a`, public preview `https://sirradek.github.io/radeq/?v=a649c4a`, mobile 390px check with no horizontal overflow, one visible H1/root for default A, canonical/OG URL intact, and no browser console messages.
- Product checks passed on commit `f36a81f`: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27021878462` completed successfully from commit `f36a81fa5f390cfb13d56e14315a55b21d9dbb4b`.
- Public preview `https://sirradek.github.io/radeq/?v=f36a81f&probe=2` was checked at mobile 390x920 for A/B/C/D. Each variant exposed a distinct root, H1, and section signature; the new A recommendation, B advice, C artifacts, and D finder blocks were visible; no horizontal overflow or console messages were observed; canonical/OG metadata plus `robots.txt` and `sitemap.xml` remained intact.
- Screenshot evidence was written locally as `radeq-polish-f36a81f-a-mobile.png`, `radeq-polish-f36a81f-b-mobile.png`, `radeq-polish-f36a81f-c-mobile.png`, and `radeq-polish-f36a81f-d-mobile.png` under the Windows temp directory.

Risk notes:

- The known Vite chunk-size warning remains and was not introduced by this governance record.
- Full Codex App runtime verification was not claimed; evidence is bounded to local test commands and public GitHub Pages Playwright checks.
- Background motion remains visual polish only and must continue to respect reduced-motion behavior in future slices.

Rollback:

- Revert product commit `f36a81f` on `codex/radeq-ab-c-preview`, or redeploy the last accepted preview commit `a649c4a` if the owner rejects this polish slice.

Project mesh impact: work-log record only. No architecture.md change was required because the existing architecture already documents the static proposal components, optional 3D mascot, GitHub Pages preview boundary, and RadeQ/Autopilot repository separation.

## 2026-06-05 Refinement Planning And Gemini Advisory Attempt

Date: 2026-06-05
Request or trigger: user said the current GitHub preview is much better and asked to refine or modernize it, brainstorm with Gemini, and update the project mesh and procedures.
Mode: WRITE_ALLOWED for Autopilot governance records only. No RadeQ product runtime files, GitHub remote, deployment, workflow, package files, lead API, D1, migrations, or model assets were changed.
Scope: plan the next RadeQ design refinement slice from public preview `https://sirradek.github.io/radeq/?v=a649c4a`, preserve the existing A/B/C/D direction structure, and update mesh/procedure memory so future variants cannot regress into palette-only proposals.
Architecture impact: no RadeQ runtime architecture changed. The RadeQ project mesh now explicitly blocks shared-shell A/B/C/D proposal variants and requires public mobile evidence before claiming design refinements are ready.
Decisions:

- Keep A `Guided Offer Map`, B `Cat Concierge`, C `Studio Proof`, and D `Demo Worlds` as the current accepted proposal baseline.
- Treat the next slice as visual/conversion polish, not a new product architecture or runtime expansion.
- Keep core SEO, offer text, CTAs, and proof content static-readable; mascot and motion remain optional enhancement layers.
- Do not introduce new dependencies, new model assets, workflow changes, lead API changes, D1 changes, or automations in the refinement plan.
- Use Gemini only as redacted advisory input. This attempt did not produce usable RadeQ critique because Gemini repeatedly focused on workspace/governance context or failed the requested output shape, so no product recommendation was adopted from Gemini as source of truth.
- Future Gemini attempts must use the product-focused packet in `prompt-library/02-gemini/radeq-design-brainstorming.md`, not broad Autopilot workspace/governance context.

Recommended next implementation slice:

- Cross-variant polish: soften selected radii, remove remaining visible grid harshness, make animated backgrounds quieter and purpose-led, and tighten first-viewport mobile rhythm so the next section is hinted without crowding CTA text.
- A polish: make the offer map feel more like a guided route with one dominant recommended path, less equal-weight card density, and a clearer "where to start" CTA.
- B polish: make the mascot feel like a useful concierge by pairing problem chips with visible recommendations; keep 3D optional and do not let the mascot compete with buyer proof.
- C polish: turn proof blocks into concrete artifacts such as checklist, demo thumbnail, handoff stack, SEO check, and measurement strip; avoid generic studio claims.
- D polish: make Demo Worlds behave like a mobile-first finder with one active world, compact comparison cues, and direct demo entry points.

Verification plan for the next product slice:

- Before editing: capture RadeQ branch/commit/status, public preview baseline, and exact allowed files.
- After editing: run product typecheck, unit tests, build, GitHub Pages build, e2e, audit, and diff checks when product code changes.
- Public evidence: check GitHub Pages preview on mobile viewport for no horizontal overflow, no console errors, visible distinct roots for A/B/C/D, metadata/indexability intact, and screenshot evidence.
- Rollback: revert the preview branch to the last known good commit `a649c4a` or revert only the refinement commit if the slice lands as a separate commit.

Project mesh impact: added `RAD-DESIGN-001` and `RAD-DESIGN-002` to the RadeQ project mesh.

## 2026-06-05 Structurally Distinct B/C/D Preview

Date: 2026-06-05
Request or trigger: user confirmed that deployed A/B/C/D still shared the same H1, H2, sections, cards, and layout skeleton, then approved implementing distinct B/C/D directions.
Mode: WRITE_ALLOWED for a Radeq product preview slice and GitHub Pages preview delivery. No workflow, package, lead API, D1 schema, migration, Cloudflare config, or model asset change was made.
Scope: keep A as `Guided Offer Map`; add B `Cat Concierge`, C `Studio Proof`, and D `Demo Worlds` as separate static Astro compositions. The style toggle now switches the visible composition, not only color tokens. Mascot usage remains progressive enhancement with no new asset.
Architecture impact: Radeq's homepage proposal surface now has separate static B/C/D composition components selected through `html[data-style]`. Hidden proposal variants are not `section` roots, so they do not pollute the existing motion-scene detector. SEO-readable default content remains static and A remains the default.
Decisions:

- Treat the prior deployed preview as a valid A direction only.
- Resolve stop condition `same layout skeleton` with component-level composition changes, not palette or token changes.
- Use `CatGuide`, `StudioProof`, and `DemoWorlds` as implementation boundaries for B/C/D.
- Keep the current mascot model and make B stage the mascot as a larger guide without replacing assets.
- Keep demo/gallery logic ungated and linked to existing static demo routes.

Verification:

- Baseline before changes on `https://sirradek.github.io/radeq/?baseline=8f99736`: `h1Count=1`, `h2Count=1`, `sectionCount=1`, `sameLayoutSkeleton=true`.
- Added Playwright regression coverage requiring four distinct visible H1 values, four distinct root composition names, and four distinct section signatures across A/B/C/D.
- Product checks passed: `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run build`, `DEPLOY_TARGET=github-pages npm.cmd run build`, `npm.cmd run test:e2e`, `npm.cmd audit --audit-level=high`, and `git diff --check`.
- Preview commit `a649c4a` was pushed to `codex/radeq-ab-c-preview`; GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27004873622` completed successfully.
- Public mobile check against `https://sirradek.github.io/radeq/?v=a649c4a` returned `h1Count=4`, `rootCount=4`, `sectionCount=4`, no horizontal overflow at 390px, canonical/OG URL metadata, robots/sitemap output, and no browser console messages.
- Mobile screenshot evidence was written to the local temp directory as `radeq-github-a-mobile.png`, `radeq-github-b-mobile.png`, `radeq-github-c-mobile.png`, and `radeq-github-d-mobile.png`.

Project mesh impact: no new Radeq mesh node was needed. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and `three_d_mascot_addon` nodes cover this preview slice.

## 2026-06-04 Direction A Hardening

Date: 2026-06-04
Request or trigger: user accepted the Guided Offer Map as Direction A baseline, identified pre-PR hardening gaps, and asked to proceed, with Gemini allowed only as advisory brainstorming.
Mode: WRITE_ALLOWED for a narrow Radeq product hardening slice; Gemini was used as redacted advisory brainstorming only and not as a source of truth.
Scope: keep Direction A as the current preview baseline while adding form `id`/`name` attributes, canonical/Open Graph URL metadata, static `robots.txt` and `sitemap.xml` endpoints, mobile header simplification, and mascot asset provenance/performance metadata. No lead API, D1 schema, deployment workflow, package, dependency, or model replacement change was made.
Architecture impact: Radeq's static public site now has canonical and indexability endpoints generated from Astro `site`/`base`; the contact form has stable frontend field identifiers without changing the lead API contract; the optional mascot has an explicit product-side asset manifest and runtime metadata while remaining user-activated progressive enhancement.
Decisions:

- Treat the current homepage as `Direction A: Guided Offer Map`, not as completed A/B/C/D proposal coverage.
- Keep B/C/D as future structural directions requiring separate scoped implementation.
- Keep core SEO and conversion content outside WebGL/canvas.
- Keep the current mascot asset; record provenance and performance budget instead of replacing it.
- Use Context7 official Astro docs for canonical URL guidance and Gemini only for high-level brainstorm ideas.

Verification:

- Product checks passed in the Radeq checkout: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- Playwright evidence covered desktop hero, mobile header, canonical/OG URL metadata, robots/sitemap output, mascot provenance/budget data attributes, and mobile horizontal overflow.
- Visual evidence files were written under the local temp directory with `radeq-hardening-*` names.
- GitHub Pages preview was published after the user requested mobile-accessible review instead of local preview.
- Deploy run `https://github.com/SirRadek/radeq/actions/runs/26978855790` completed successfully from commit `8f99736`.
- Public mobile check against `https://sirradek.github.io/radeq/` returned HTTP 200, canonical/OG URL metadata, no horizontal overflow at 390px viewport, and no browser console messages.

Project mesh impact: no new Radeq mesh node was needed. Existing `static_public_site`, `seo_performance_surface`, `lead_capture_pipeline`, `three_d_mascot_addon`, and `runtime_observability_boundary` nodes cover the hardening slice.

## 2026-05-31 Global Style Switch And Demo Routes

Date: 2026-05-31
Request or trigger: user clarified that A/B/C/D variants should sit in the header next to the light/dark toggle, represent four different global website styles, and that the main page should only describe what can be built with links to separate demo examples.
Mode: WRITE_ALLOWED for Radeq product repository changes, GitHub draft PR update, and GitHub Pages preview deployment; Autopilot control plane records only architecture/work-log evidence.
Scope: revise the existing preview branch so the homepage becomes a static service catalog and interactive matrix previews move to standalone Czech and English demo routes. No production Cloudflare Pages, D1 schema, lead API, auth, payment, or backend change was made.
Files changed in Radeq product repository:

- `src/components/CommandHeader.astro`
- `src/components/ServiceCatalog.astro`
- `src/components/StyleMatrixSimulator.tsx`
- `src/components/StyleVariantToggle.tsx`
- `src/data/siteContent.ts`
- `src/layouts/BaseLayout.astro`
- `src/lib/matrix.ts`
- `src/pages/demo/[module].astro`
- `src/pages/en/demo/[module].astro`
- `src/pages/en/index.astro`
- `src/pages/index.astro`
- `src/styles/global.css`
- `tests/i18n.spec.ts`
- `tests/matrix.test.ts`
- `tests/smoke.spec.ts`

Architecture impact: Radeq's public route structure now separates the SEO-readable homepage service catalog from interactive demo previews. The A/B/C/D selection is a global `html[data-style]` state next to the light/dark `html[data-theme]` toggle, and the demo matrix follows that global style instead of owning a nested picker.
Decisions:

- Keep primary homepage service copy in static HTML and keep demos outside the main route.
- Use `/demo/blog-docs/`, `/demo/service-landing/`, `/demo/admin-dashboard/`, and `/demo/eshop-offers/` plus `/en/demo/...` equivalents for examples.
- Preserve light/dark as an independent visual mode while A/B/C/D changes the website's style language.
- Keep 3D as an optional enhancement; core content, service links, and contact path work without WebGL.
- Use Playwright visual QA as the Browser plugin fallback because Browser/IAB was not callable in this session.

Verification:

- Local checks passed: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, `git diff --check`, and `git diff --cached --check`.
- Playwright visual QA covered desktop homepage A light, homepage D dark, demo route B, and mobile homepage D; mobile horizontal overflow check returned false.
- One local Playwright attempt hit Vite `504 Outdated Optimize Dep` for the dynamic Three.js import; restarting the dev server and rerunning `npm run test:e2e` passed.
- Deployed preview checks returned HTTP 200 for `https://sirradek.github.io/radeq/` and `https://sirradek.github.io/radeq/demo/service-landing/`, with expected service and demo content present.

Delivery:

- Branch: `codex/radeq-ab-c-preview`
- Commit: `8749c11`
- Draft PR: `https://github.com/SirRadek/radeq/pull/2`
- GitHub Pages preview: `https://sirradek.github.io/radeq/`
- Demo preview: `https://sirradek.github.io/radeq/demo/service-landing/`
- Deploy run: `https://github.com/SirRadek/radeq/actions/runs/26722180750`

Project mesh impact: no new Radeq mesh node was needed. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and optional `three_d_mascot_addon` coverage remained valid; architecture documentation was updated for the new route split and global style switch.

## 2026-05-31 A/B/C/D Distinct Proposal Preview

Date: 2026-05-31
Request or trigger: user rejected the earlier variants as too similar and asked for a new look, light/dark switching, four parallel proposal previews, Autopilot mesh routing, Gemini/context documentation checks, and GitHub preview delivery.
Mode: WRITE_ALLOWED for Radeq product repository changes, GitHub draft PR update, and GitHub Pages preview deployment; Autopilot control plane records only architecture/work-log evidence.
Scope: revise the existing preview branch so A/B/C/D are structurally different proposal directions, not palette swaps. No production Cloudflare Pages, D1 schema, lead API, auth, payment, or backend change was made.
Files changed in Radeq product repository:

- `src/components/CommandHeader.astro`
- `src/components/StyleMatrixSimulator.tsx`
- `src/components/ThemeModeToggle.tsx`
- `src/data/siteContent.ts`
- `src/data/styleMatrix.ts`
- `src/layouts/BaseLayout.astro`
- `src/styles/global.css`
- `tests/matrix.test.ts`
- `tests/smoke.spec.ts`

Architecture impact: Radeq's public product surface now includes A/B/C/D proposal previews and a global light/dark visual mode toggle. The preview remains in the Radeq repository and GitHub Pages environment; Autopilot stores only this summary, PR/deploy links, and verification evidence.
Decisions:

- Keep Radeq runtime code in `SirRadek/radeq`, not in the Autopilot repository.
- Treat A as bright editorial trust, B as kinetic motion, C as technical proof, and D as a studio configurator with outcome mapping.
- Default the site to a light visual mode while preserving a dark mode for visitors who prefer it.
- Keep primary copy, CTAs, and SEO-relevant content in HTML; motion, cursor reactions, and 3D remain progressive enhancements.
- Use official Astro and MDN documentation as the current-doc fallback because Context7 was not callable in this session.
- Do not use Gemini as a source of truth because Gemini CLI free model capacity was exhausted during the advisory attempt.

Verification:

- Final local checks passed: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- Playwright visual QA covered desktop A/B/C/D, D dark mode, mobile hero, and mobile D.
- Browser plugin was not available; Playwright screenshots were used as fallback.
- A stale Vite dev server caused one transient `504 Outdated Optimize Dep` failure for the dynamic Three.js import; restarting the dev server and rerunning Playwright passed.
- Deployed preview click-check confirmed four style chips, D renders as `matrix-preview--studio`, and theme switching updates `html[data-theme]` from `light` to `dark`.

Delivery:

- Branch: `codex/radeq-ab-c-preview`
- Commit: `088ab81`
- Draft PR: `https://github.com/SirRadek/radeq/pull/2`
- GitHub Pages preview: `https://sirradek.github.io/radeq/`
- Deploy run: `https://github.com/SirRadek/radeq/actions/runs/26721352175`

Project mesh impact: no new Radeq mesh node was needed. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and optional `three_d_mascot_addon` coverage remained valid.

## 2026-05-30 A/B/C Website Proposal Preview

Date: 2026-05-30
Request or trigger: user asked Autopilot to process the Radeq.cz website redesign proposals through to a GitHub preview.
Mode: WRITE_ALLOWED for Radeq product repository changes, GitHub draft PR creation, and GitHub Pages preview deployment; Autopilot control plane records only architecture/work-log evidence.
Scope: update the Radeq product site hero and interactive matrix from year/style labels to A/B/C proposal variants, then revise the first implementation because the variants were too similar and only color-differentiated. No production Cloudflare Pages or D1 runtime change was made.
Files changed in Radeq product repository:

- `package-lock.json`
- `src/components/HeroSection.astro`
- `src/components/StyleMatrixSimulator.tsx`
- `src/data/siteContent.ts`
- `src/data/styleMatrix.ts`
- `src/layouts/BaseLayout.astro`
- `src/lib/matrix.ts`
- `src/styles/global.css`
- `tests/i18n-content.test.ts`
- `tests/i18n.spec.ts`
- `tests/matrix.test.ts`
- `tests/smoke.spec.ts`

Architecture impact: Radeq's public product surface now includes A/B/C proposal previews focused on trust, motion, and technical proof. The preview remains in the Radeq repository and GitHub Pages environment; Autopilot stores only this summary, PR/deploy links, and verification evidence.
Decisions:

- Keep Radeq runtime code in `SirRadek/radeq`, not in the Autopilot repository.
- Use A/B/C proposal variants instead of dated style names.
- Make A/B/C structurally different, not just token/color variants: A is a light editorial trust sheet, B is a kinetic motion-flow route, and C is a proof/workflow board.
- Keep motion as a progressive enhancement with readable content and reduced-motion support.
- Allow only preview branch `codex/radeq-ab-c-preview` to deploy to the `github-pages` environment for this PR preview.
- Keep 3D as optional enhancement; core content and lead path stay HTML-readable.

Verification:

- Baseline before implementation: `npm run typecheck` passed, `npm test` passed with 40 tests, and `npm audit --audit-level=high` reported one existing high-severity `devalue` advisory.
- Security cleanup: `npm audit fix` updated the lockfile and `npm audit --audit-level=high` then reported 0 vulnerabilities.
- Final local checks passed: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, and `git diff --check`.
- Browser plugin was not available; Playwright screenshots were used for desktop, mobile hero, mobile matrix, and deployed GitHub Pages preview checks.
- GitHub Pages preview responded with HTTP 200 and contained the new hero title and `Návrh A/B/C` content.
- Deployed preview click-check confirmed A/B/C render with separate component classes: `matrix-preview--trust`, `matrix-preview--motion`, and `matrix-preview--proof`.

Delivery:

- Branch: `codex/radeq-ab-c-preview`
- Commit: `8b6632d6b3d84eec3cfe6144c9d471898695b8a5`
- Draft PR: `https://github.com/SirRadek/radeq/pull/2`
- GitHub Pages preview: `https://sirradek.github.io/radeq/`
- Deploy run: `https://github.com/SirRadek/radeq/actions/runs/26693079908`

Project mesh impact: no new Radeq mesh node was needed. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and optional `three_d_mascot_addon` coverage remained valid.

## 2026-05-24 Project Mesh Seed

Date: 2026-05-24
Request or trigger: user required every project to have its own Decision Mesh and requested cautious improvement of the existing Autopilot system.
Mode: WRITE_ALLOWED for Autopilot control-plane architecture mirror only.
Scope: create a project-specific Decision Mesh seed for Radeq in the Autopilot architecture records; no Radeq product runtime files were edited.
Files changed:

- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/work-log.md`
- `docs/projects/radeq/decision-mesh/`
- `docs/autopilot/project-architecture-registry.md`

Architecture impact: Radeq now has a control-plane mirror project mesh covering the static public site, lead capture pipeline, optional 3D mascot add-on, and SEO/performance surface.
Decisions:

- Keep Radeq product runtime in the separate Radeq repository.
- Treat Radeq 3D/WebGL as an optional enhancement, not a core content carrier.
- Use the Radeq project mesh as architecture context for future Radeq work until the product repository owns its own architecture records.

Verification:

- Project mesh policy test passed after the Radeq mesh seed was created.
- `npm run verify` passed in the Autopilot control-plane repository after the Radeq project mesh mirror was added.
- `npm audit` reported 0 vulnerabilities.
- `git diff --check` passed with only existing LF/CRLF normalization warnings.

Risks:

- This is an Autopilot mirror mesh, not yet a canonical mesh inside the Radeq product repository.
- Future Radeq implementation must still verify against the actual Radeq checkout and current product files.

Project mesh impact: `docs/projects/radeq/decision-mesh/` was created.

## 2026-05-13 Architecture Registry Onboarding

Date: 2026-05-13
Request or trigger: every project must have written architecture, regular updates, and a work log.
Mode: WRITE_ALLOWED for documentation only.
Scope: add project architecture governance and initial Radeq project architecture evidence.
Files changed:

- `docs/autopilot/project-architecture-standard.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/work-log.md`
- `docs/projects/autopilot-control-plane/architecture.md`
- `docs/projects/autopilot-control-plane/work-log.md`
- `docs/autopilot/v3-prompt-pack.md`
- `docs/autopilot/2026-05-10-autopilot-run-log.md`

Architecture impact: created the first canonical architecture record and work log for the Radeq.cz website.
Decisions:

- Radeq product runtime is tracked separately from Autopilot control-plane process.
- Architecture updates are mandatory when runtime, data flow, deployment, security, integration, or verification gates change.
- Work log entries must include an architecture impact line.

Verification:

- `rg -n "Project Architecture|project architecture|Architecture impact|Project architecture checked|docs/projects|Next review" docs\autopilot docs\projects`: found the standard, registry, project records, prompt-pack gate, and work-log entries.
- `git diff --check`: passed with existing LF-to-CRLF warnings only.
- Placeholder-token scan over the new architecture docs and project records: no matches.

Risks:

- Historical architecture details remain distributed across older docs and run logs.
- Remote Cloudflare production proof is still not represented as completed.

Follow-up:

- Add project architecture records for additional private projects only with redacted aliases.
- Add automated freshness checks later if the `/autopilot` dashboard is implemented.

## 2026-05-13 Strict Repository Separation

Date: 2026-05-13
Request or trigger: user clarified that Autopilot must be separate from Radeq and every other project.
Mode: WRITE_ALLOWED for documentation only.
Scope: mark Radeq as a standalone product project with its own canonical local root and remote repository.
Files changed:

- `docs/projects/radeq/architecture.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/repository-separation-policy.md`

Architecture impact: Radeq is now explicitly documented as a product repository separate from the Autopilot control plane.
Decisions:

- Radeq canonical remote is `SirRadek/radeq`.
- Radeq canonical local root should be `C:\Users\sirok\Documents\Projects\radeq`.
- Autopilot may hold only registry metadata or sanitized mirrors for Radeq.

Verification:

- Repository-boundary search confirmed Radeq is documented as a product repository separate from the Autopilot control plane.
- `git diff --check` passed with only LF/CRLF normalization warnings for existing files `docs/autopilot/2026-05-10-autopilot-run-log.md` and `docs/autopilot/v3-prompt-pack.md`.

Risks:

- Current checkout still contains both product runtime and Autopilot governance docs.

Follow-up:

- Complete physical repo split so Radeq runtime and Autopilot governance no longer share one working tree.

## 2026-05-13 Physical Repository Split

Date: 2026-05-13
Request or trigger: user approved executing the repository split.
Mode: WRITE_ALLOWED with remote GitHub mutation approved by user instruction.
Scope: create a separate local Radeq product checkout and prepare removal of legacy Autopilot governance files from the Radeq repository.
Files changed:

- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/work-log.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/repository-separation-policy.md`

Architecture impact: Radeq now has a separate local product root at `C:\Users\sirok\Documents\Projects\radeq`.
Decisions:

- Radeq remains `SirRadek/radeq`.
- Radeq runtime must not live in the Autopilot repository.
- Legacy Autopilot documentation should be removed from Radeq through a cleanup branch instead of silently deleting it from the default branch.

Verification:

- Radeq cleanup branch `codex/separate-autopilot-docs` was committed and pushed.
- Radeq cleanup PR opened: `https://github.com/SirRadek/radeq/pull/1`.
- After explicit user approval, Radeq cleanup PR `https://github.com/SirRadek/radeq/pull/1` was squash-merged into `new` as `ef7053c`.
- Local Radeq checkout was fast-forwarded to `ef7053c` on branch `new`.
- `rg -n "docs/autopilot|docs\\autopilot|docs/superpowers|docs\\superpowers" . -g '!node_modules/**' -g '!.git/**'` returned no matches on the cleanup branch.
- `git diff --check` passed.
- `npm ci` passed with 0 vulnerabilities.
- `npm test` passed: 7 test files and 40 tests.
- `npm run build` passed and built 2 Astro pages, with an existing chunk-size warning.
- Post-merge verification on branch `new` passed again: `npm test` passed 7 test files and 40 tests.
- Post-merge verification on branch `new` passed again: `npm run build` built 2 Astro pages, with the existing chunk-size warning.

Risks:

- Repository separation risk for Radeq is closed. Product runtime risk remains unchanged and should be handled by normal Radeq verification gates.

## 2026-06-04 RadeQ Novel Design Supervisor Prompt

Date: 2026-06-04
Request or trigger: user asked to restart RadeQ.cz novel design exploration from the latest GitHub versions rather than the live site, with stronger separation between design examples and more realistic playful cat-avatar appearance and motion.
Mode: WRITE_ALLOWED for control-plane prompt-library and project work-log records only. No RadeQ runtime files, GitHub remote, deployment, or lead-capture code were changed.
Scope: add `prompt-library/06-supervisor/radeq-novel-design-supervisor.md` as the project-specific prompt layered on top of `prompt-library/06-supervisor/autopilot-supervisor-base.md`.

Architecture impact: RadeQ design restart work now has a reusable supervisor prompt that treats GitHub branches, commits, PRs, previews, project architecture, and project mesh as the primary baseline. The public live site is secondary reference only. The prompt requires four structurally distinct directions, Product & Design OS gates, SEO/performance checks, lead-capture guardrails, and cat-avatar source/license/fallback checks.

Decisions:

- Do not use the live `radeq.cz` site as the primary design baseline for the next exploration.
- Reject palette-only variants and same-layout demo examples.
- Treat the cat avatar as a playful brand asset, not primary content.
- Improve perceived cat realism through motion direction, staging, gaze, tail, body weight, and reduced-motion fallback before adopting heavier assets.
- Preserve RadeQ lead validation, privacy minimization, D1 assumptions, and controlled error responses during design work.
- If Decision Mesh, RadeQ mesh, Context7 or official-doc fallback, and GitHub baseline are verified but `codex_app.read_thread_terminal` is not exposed, continue with degraded local/GitHub planning and block only automation, heartbeat scheduling, thread-terminal evidence, and full Codex App runtime verification claims.

Verification:

- `npm.cmd test -- prompt-library-policy prompt-pack-policy` passed: 2 files, 9 tests.
- `npm.cmd run mesh:check` passed.
- `git diff --check` passed.

## 2026-06-05 RadeQ Distinct Proposal Compositions Accepted

Date: 2026-06-05
Request or trigger: user reported that PR `https://github.com/SirRadek/radeq/pull/2`
and GitHub Pages preview `https://sirradek.github.io/radeq/?v=a649c4a` are much
closer to the desired direction and asked to keep these principles for future
work.
Mode: WRITE_ALLOWED for Autopilot governance memory only. No RadeQ runtime
files, GitHub remote, deployment, workflow, package files, lead API, D1,
migrations, or model assets were changed by this record.
Scope: capture accepted design principles in Product & Design OS taste memory,
recipes, anti-template rules, RadeQ supervisor prompt, and this project work log.

Architecture impact: confirms the current RadeQ design baseline as four named,
structurally distinct homepage proposal compositions: A `Guided Offer Map`, B
`Cat Concierge`, C `Studio Proof`, and D `Demo Worlds`. This is a governance
memory update only because `docs/projects/radeq/architecture.md` already records
the B/C/D component architecture and no runtime code was changed here.

Decisions:

- Keep `Guided Offer Map` as the conversion-safe explanation direction.
- Treat `Cat Concierge`, `Studio Proof`, and `Demo Worlds` as accepted examples
  of distinct composition principles for future marketing/creative web work.
- Use Better-like bold agency principles only as adapted inspiration: large type,
  simple pillars, proof surfaces, demos, handoff evidence, and confident CTA
  rhythm.
- Do not allow future A/B/C/D proposal sets to share one component shell with
  different palettes or tokens.
- Mascot and motion remain useful only when they guide attention, support trust,
  explain demos, or improve buyer confidence without hiding SEO-readable content.

Evidence provided by owner:

- PR: `https://github.com/SirRadek/radeq/pull/2`
- Deploy run: `https://github.com/SirRadek/radeq/actions/runs/27004873622`
- Commit: `a649c4a Add distinct proposal compositions`
- GitHub Pages preview: `https://sirradek.github.io/radeq/?v=a649c4a`
- Reported checks: `npm.cmd test` 41 passed, `npm.cmd run typecheck` 0 errors,
  `npm.cmd run build` passed, GitHub Pages build passed, `npm.cmd run test:e2e`
  8 passed, `npm.cmd audit --audit-level=high` 0 vulnerabilities, and
  `git diff --check` passed.

Verification:

- Autopilot Product & Design OS memory and prompt files updated locally.
- Full Codex App runtime verification was not claimed.

Risks:

- Existing Vite chunk warning above 500 kB remains outside this governance
  capture slice.

## 2026-06-05 Service Range And Variant Layout Refinement

Date: 2026-06-05
Request or trigger: user asked to fix the B card layout, change the demo card to an e-shop demo, make A/B/C/D backgrounds less similar, add a small "about / who we are" area, broaden service coverage beyond websites, and verify desktop/tablet as well as mobile.
Mode: WRITE_ALLOWED for the RadeQ product preview branch and this Autopilot governance record. No lead API, D1, migrations, workflow files, package files, dependencies, model assets, Cloudflare production configuration, automations, or heartbeats were changed.
Scope: refine the static GitHub Pages preview on `codex/radeq-ab-c-preview` by changing B `Cat Concierge` cards from overlapping absolute placement to staggered responsive grid, replacing the generic demo world with an e-shop/offer world, differentiating background geometry per A/B/C/D, adding a static about/additional-services section, broadening service catalog copy, and extending smoke coverage.

Architecture impact: no runtime architecture change. Existing `static_public_site`, `seo_performance_surface`, `runtime_observability_boundary`, `lead_capture_pipeline`, and optional `three_d_mascot_addon` nodes cover this slice. The new about/additional-services section is static content and does not add routes, APIs, persistence, dependencies, or asset sources.

Decisions:

- Keep A/B/C/D as the active proposal directions while making the visual language more distinct than repeated geometry.
- Keep the header navigation at its existing density and place "about / who we are" as a static content band instead of adding another nav item.
- Present e-shop and offer comparison as a first-class demo/service path through existing static demo infrastructure.
- Broaden RadeQ service language to include optimization, web refreshes, PC build/selection/setup, and PC/AI/basic software consultations without changing backend behavior.
- Verify public GitHub Pages on desktop, tablet, and mobile before claiming the preview slice is ready.

Verification:

- Product baseline before edits: branch `codex/radeq-ab-c-preview`, commit `ebf2c31`, deploy preview `https://sirradek.github.io/radeq/?v=ebf2c31&baseline=multi-refine`; desktop B had card overlap pairs `[1,3]`, `[1,5]`, `[2,4]`, and `[3,5]`.
- Product checks passed on commit `e0d6137`: `npm run typecheck`, `npm test`, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e`, `npm audit --audit-level=high`, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27028617610` completed successfully from commit `e0d6137ac499fe9322bbb37d3cf9784c988d2422`.
- Public preview `https://sirradek.github.io/radeq/?v=e0d6137&probe=refine-services` was checked at 1440x920, 900x1000, and 390x920. B overlap pairs were empty, no horizontal overflow or console messages were observed, the about section contained PC and AI service copy, and D contained a visible e-shop/offer world.
- Public screenshot evidence was written under the Windows temp directory as `radeq-public-e0d6137-b-*-final2.png`, `radeq-public-e0d6137-about-*-final2.png`, and `radeq-public-e0d6137-d-eshop-*-final2.png` for desktop, tablet, and mobile.

Risk notes:

- The known Vite chunk-size warning remains unrelated to this slice.
- Full Codex App runtime verification was not claimed; evidence is bounded to local commands, GitHub Actions status, and public GitHub Pages Playwright checks.
- The about/additional-services band is intentionally concise; future copy can split services into dedicated pages if the offer grows.

Rollback:

- Revert product commit `e0d6137` on `codex/radeq-ab-c-preview`, or redeploy previous commit `ebf2c31` if the owner rejects this refinement.

Project mesh impact: work-log record only. No new mesh rule or architecture update was needed because the project mesh already requires distinct proposal compositions and public preview evidence.

## 2026-06-06 Interactive E-Shop Demo Completion

Date: 2026-06-06
Request or trigger: user asked to re-check the previous plan and challenged whether the deployed `E-shop / nabídka` destination was an actual e-shop demo. The audit confirmed that commit `e0d6137` only supplied an e-shop route, copy, and generic matrix preview; it did not render products, prices, comparison, or cart behavior.
Mode: WRITE_ALLOWED for the RadeQ product preview branch and this Autopilot governance record. The owner explicitly approved the narrow write expansion for `src/components/StyleMatrixSimulator.tsx`. No API, payment, checkout, persistence, workflow, package, dependency, model asset, automation, or heartbeat change was made.
Scope: replace the generic `eshop-offers` matrix output with a localized, static-readable PC shop demonstration containing three sample products, category filters, two-item comparison, a non-transactional demo cart, and an inquiry CTA. Preserve the existing Czech and English routes and use A/B/C/D only as visual skins for this buyer flow.

Architecture impact: no new runtime architecture or public route. The existing React matrix island now owns bounded local UI state for filters, comparison, and the demo cart. Core product names, prices, specifications, disclaimer, and CTA remain server-rendered HTML. The flow cannot place an order or process payment and does not call an API or store data.

Files changed in the RadeQ product repository:

- `src/components/StyleMatrixSimulator.tsx`
- `src/styles/global.css`
- `tests/smoke.spec.ts`
- `tests/i18n.spec.ts`

Verification:

- Baseline public route `https://sirradek.github.io/radeq/demo/eshop-offers/?v=e0d6137-eshop-audit` contained zero visible product entries, prices, comparison items, or cart actions. The only browser console error was the existing missing `favicon.ico`.
- Product checks passed on commit `2263db9`: `npm run typecheck`, `npm test` with 41 tests, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e` with 10 tests, `npm audit --audit-level=high` with 0 vulnerabilities, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27055553458` completed successfully from commit `2263db928145789e5a11891f147383953a03407c`.
- Public preview `https://sirradek.github.io/radeq/demo/eshop-offers/?v=2263db9` was checked at 1440x920, 900x1000, and 390x920. Each viewport rendered three products, three prices, two comparison entries, a working cart selection, no horizontal overflow, and no console messages. Canonical metadata remained correct; `robots.txt` and `sitemap.xml` returned HTTP 200.
- Public screenshot evidence was written under the Windows temp directory as `radeq-public-2263db9-eshop-desktop.png`, `radeq-public-2263db9-eshop-tablet.png`, and `radeq-public-2263db9-eshop-mobile.png`.
- The deployed `StyleMatrixSimulator` decoded bundle grew from 17,536 to 24,824 bytes. Total initial decoded JavaScript for the demo route increased by about 7.3 KB, approximately 3.3 percent. No dependency was added and the optional Three.js chunk remains separate.

Risk notes:

- Product names, prices, and lead times are explicitly model examples, not live inventory or commercial promises.
- The known Vite chunk-size warning remains tied to the existing optional Three.js surface and was not introduced by this slice.
- Full Codex App runtime verification was not claimed; evidence is bounded to local commands, GitHub Actions, and controlled public GitHub Pages browser checks.

Rollback:

- Revert product commit `2263db9`, or redeploy previous preview commit `e0d6137`.

Project mesh impact: work-log record only. Existing `static_public_site`, `seo_performance_surface`, and `runtime_observability_boundary` nodes cover the change. No new mesh node or rule was needed.

## 2026-06-06 Discoverable About Section

Date: 2026-06-06
Request or trigger: owner reported that the existing about/additional-services band still did not read as an actual "O nás" section.
Mode: WRITE_ALLOWED for the approved RadeQ static preview files and this Autopilot governance record. No API, persistence, workflow, package, dependency, model asset, automation, or heartbeat change was made.
Scope: turn the existing lower-page band into a clearly named Czech/English About section, make it reachable from the primary navigation on desktop and mobile, explain the direct one-person collaboration model, and retain the broader optimization, web-update, PC, AI, and software services as a separate subsection.

Architecture impact: none. This is static localized HTML and CSS within the existing `static_public_site` and `seo_performance_surface`. It adds no route, client state, API, persistence, asset, or dependency. The primary navigation remains four items; `O nás / About` replaces the less critical `Průběh / Workflow` link while the workflow section itself remains on the page.

Files changed in the RadeQ product repository:

- `src/data/siteContent.ts`
- `src/pages/index.astro`
- `src/pages/en/index.astro`
- `src/styles/global.css`
- `tests/smoke.spec.ts`
- `tests/i18n.spec.ts`

Verification:

- Baseline commit `2263db9` had no About navigation link, hid the primary navigation at 390 px, and placed the about content several viewports below the first screen without a direct route.
- Product checks passed on commit `417579c`: `npm run typecheck`, `npm test` with 41 tests, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e` with 10 tests, `npm audit --audit-level=high` with 0 vulnerabilities, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27056244226` completed successfully from commit `417579c7caa24054a0a915b7e02f835ad0ec954a`.
- Public preview `https://sirradek.github.io/radeq/?v=417579c&probe=about` was checked at 1440x1100, 820x1180, and 390x920. The About link resolved to `#about`, the section landed 184 px below the viewport top, rendered three collaboration principles, and had no horizontal overflow or console errors. English localization, canonical URLs, `robots.txt`, and `sitemap.xml` were also verified.
- Public screenshot evidence was written under the Windows temp directory as `radeq-about-public-417579c-desktop.png`, `radeq-about-public-417579c-tablet.png`, and `radeq-about-public-417579c-mobile.png`.

Risk notes:

- The known Vite chunk-size warning remains unchanged and unrelated to this static content slice.
- The compact mobile navigation is horizontally scroll-capable if future labels grow; the current four Czech and English links fit without page overflow.
- Full Codex App runtime verification was not claimed. Evidence is limited to local commands, GitHub Actions, and controlled public GitHub Pages browser checks.

Rollback:

- Revert product commit `417579c`, or redeploy previous preview commit `2263db9`.

Project mesh impact: work-log record only. No project mesh or architecture update was needed.

## 2026-06-06 Primary Demo Locked To Shop Showcase

Date: 2026-06-06
Request or trigger: owner clarified that `https://sirradek.github.io/radeq/demo/service-landing/` must contain only the e-shop demonstration. A/B/C/D should change the style of the same shop, not switch the preview to another website or system type.
Mode: WRITE_ALLOWED for the bounded RadeQ demo-route, simulator, style, and test files plus this Autopilot governance record. No API, payment, checkout, persistence, workflow, package, dependency, model asset, automation, or heartbeat change was made.
Scope: make Czech and English `service-landing` routes shop-only, remove the module selector from that surface, preserve the existing three products, filters, comparison, and non-transactional demo cart across all global styles, and keep `eshop-offers` as a compatibility alias rather than creating an unredirected dead URL.

Architecture impact: small route-contract update recorded in `docs/projects/radeq/architecture.md`. `/demo/service-landing/` and its English equivalent are now the primary shop-only showcase. `/demo/eshop-offers/` remains a shop-only compatibility alias. No runtime node, route count, API, persistence surface, or dependency changed.

Files changed in the RadeQ product repository:

- `src/components/StyleMatrixSimulator.tsx`
- `src/pages/demo/[module].astro`
- `src/pages/en/demo/[module].astro`
- `src/styles/global.css`
- `tests/smoke.spec.ts`
- `tests/i18n.spec.ts`

Verification:

- Public baseline on commit `417579c` had title and H1 `Poptávková stránka`, four module-choice buttons, zero products, and a generic trust preview at `/demo/service-landing/`.
- Product checks passed on commit `de67f2c`: `npm run typecheck`, `npm test` with 41 tests, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e` with 10 tests, `npm audit --audit-level=high` with 0 vulnerabilities, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27059897115` completed successfully from commit `de67f2c2e71354df18214411eab7cd89adbf021d`.
- Public preview `https://sirradek.github.io/radeq/demo/service-landing/?v=de67f2c` was checked at 1440x1000, 900x1100, and 390x920 for A/B/C/D. Every combination retained `Focus Mini`, `Creator Pro`, and `Upgrade Kit`, rendered three prices, exposed zero module-choice controls, and had no horizontal overflow or console errors.
- Metadata identified the surface as an e-shop preview, the canonical remained route-correct, and `robots.txt` and `sitemap.xml` returned HTTP 200.
- The compatibility route `/demo/eshop-offers/` rendered the same locked shop surface with its own canonical URL.
- Public screenshot evidence was written under the Windows temp directory as `radeq-shop-public-de67f2c-desktop-variant-d.png`, `radeq-shop-public-de67f2c-tablet-variant-c.png`, and `radeq-shop-public-de67f2c-mobile-variant-a.png`.
- The built `StyleMatrixSimulator` chunk was 24,925 bytes. No dependency or separate client runtime was added.

Risk notes:

- `service-landing` remains a legacy path name although its visible and metadata semantics are now e-shop-only. Renaming or redirecting the URL would require an explicit URL migration map.
- The existing Vite warning for the optional Three.js chunk remains unrelated.
- The frontend UX audit repeated its broad form-label heuristic for existing form styling outside this slice; direct Astro, unit, E2E, and browser checks passed.
- Full Codex App runtime verification was not claimed. Evidence is limited to local commands, GitHub Actions, and controlled public GitHub Pages browser checks.

Rollback:

- Revert product commit `de67f2c`, or redeploy previous preview commit `417579c`.

Project mesh impact: existing `static_public_site`, `seo_performance_surface`, and `runtime_observability_boundary` nodes cover the change. No new project-mesh node or rule was needed.

## 2026-06-06 Expandable Named Theme Menu

Date: 2026-06-06
Request or trigger: owner asked to replace the permanently visible A/B/C/D row with an expandable mini menu labeled `TÉMA / THEMES` and give each direction a meaningful name.
Mode: WRITE_ALLOWED for the bounded RadeQ theme-control, localized data, CSS, and test files plus this Autopilot governance record. No API, payment, persistence, workflow, package, dependency, model asset, automation, or heartbeat change was made.
Scope: preserve the four existing style IDs and persistence contract while replacing the header button row with an accessible dropdown menu, localized names, descriptions, active-state indication, arrow-key navigation, Escape handling, outside-click closing, and responsive overlay positioning.

Theme names:

- Czech: `Jasná mapa`, `Kočičí průvodce`, `Studio důkazů`, `Demo světy`
- English: `Clear Map`, `Cat Guide`, `Proof Studio`, `Demo Worlds`

Architecture impact: small interaction-contract update recorded in `docs/projects/radeq/architecture.md`. `StyleVariantToggle` remains the same client island and continues to write `variant-a` through `variant-d` to the same localStorage key and dispatch the same `radeq:style-change` event. No new runtime surface or dependency was introduced.

Files changed in the RadeQ product repository:

- `src/components/StyleVariantToggle.tsx`
- `src/data/siteContent.ts`
- `src/data/styleMatrix.ts`
- `src/styles/global.css`
- `tests/smoke.spec.ts`
- `tests/i18n.spec.ts`

Verification:

- Public baseline commit `de67f2c` rendered four permanently visible buttons labeled only `A`, `B`, `C`, and `D`. The control measured approximately 148x42 px on desktop.
- Product checks passed on commit `c64331c`: `npm run typecheck`, `npm test` with 41 tests, `npm run build`, `DEPLOY_TARGET=github-pages npm run build`, `npm run test:e2e` with 10 tests, `npm audit --audit-level=high` with 0 vulnerabilities, and `git diff --check`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27062198342` completed successfully from commit `c64331c43177271256dfea395031ecbcee5433dd`.
- Public preview `https://sirradek.github.io/radeq/?v=c64331c` was checked at 1440x1000, 900x1050, and 390x920. The closed control measured about 136 px wide, all four menu items stayed inside the viewport and above page content, and no horizontal overflow or console errors were observed.
- Arrow Down plus Enter selected `Kočičí průvodce`, the choice persisted after reload, and Escape closed the menu and returned focus to the trigger.
- English `/en/` rendered `Themes: Clear Map` with `Clear Map`, `Cat Guide`, `Proof Studio`, and `Demo Worlds`.
- Canonical metadata remained correct; `robots.txt` and `sitemap.xml` returned HTTP 200.
- Public screenshots were written under the Windows temp directory as `radeq-theme-menu-public-c64331c-desktop.png`, `radeq-theme-menu-public-c64331c-tablet.png`, and `radeq-theme-menu-public-c64331c-mobile.png`.
- The minified `StyleVariantToggle` chunk is 2,798 bytes, approximately 1.7 KB larger than the previous four-button control. No dependency was added.

Risk notes:

- The menu overlays page content by design. Responsive stacking and viewport containment are covered by browser checks.
- The frontend UX audit repeated its existing broad form-label heuristic outside this slice; direct accessibility behavior, Astro diagnostics, E2E, and browser checks passed.
- The existing Vite warning for the optional Three.js chunk remains unrelated.
- Full Codex App runtime verification was not claimed. Evidence is limited to local commands, GitHub Actions, and controlled public GitHub Pages browser checks.

Rollback:

- Revert product commit `c64331c`, or redeploy previous preview commit `de67f2c`.

Project mesh impact: existing `static_public_site`, `seo_performance_surface`, and `runtime_observability_boundary` nodes cover the change. No new project-mesh node or rule was needed.

## 2026-06-06 Homepage Readability And Form Semantics

Date: 2026-06-06
Request or trigger: owner asked to improve foreground/background contrast, form readability and semantics, text formatting, and remove homepage links and copy for demos that are no longer part of the active offer.
Mode: WRITE_ALLOWED for the bounded RadeQ homepage components, localized content, global styles, and tests plus this Autopilot governance record. No API, persistence, migration, workflow, package, dependency, model asset, automation, or heartbeat change was made.
Scope: establish readable light/dark theme tokens across A/B/C/D, improve heading and form typography, add explicit form semantics and localized validation feedback, and make `/demo/service-landing/` the only demo linked from Czech and English homepages.

Architecture impact: small public navigation and form-UI contract update recorded in `docs/projects/radeq/architecture.md`. Old demo routes remain directly addressable compatibility routes and remain in the generated sitemap; their deletion or redirect requires a separate URL-migration slice. The lead payload, `/api/leads`, D1 persistence, and server validation contracts are unchanged.

Files changed in the RadeQ product repository:

- `src/components/CatGuide.astro`
- `src/components/ContactTerminal.tsx`
- `src/components/DemoWorlds.astro`
- `src/components/ServiceCatalog.astro`
- `src/components/StudioProof.astro`
- `src/data/siteContent.ts`
- `src/styles/global.css`
- `tests/smoke.spec.ts`
- `tests/i18n.spec.ts`

Verification before delivery:

- `npm run typecheck`: passed with 0 errors, warnings, or hints.
- `npm test`: 7 files and 41 tests passed.
- `npm run build`: passed.
- `DEPLOY_TARGET=github-pages npm run build`: passed.
- `npm run test:e2e`: 10 Playwright tests passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `git diff --check`: passed; Git reported only existing LF-to-CRLF conversion notices.
- Axe scanned the contact section in all eight A/B/C/D and light/dark combinations with 0 violations.
- Local browser checks at desktop and 390 px mobile confirmed one visible H1, no horizontal overflow, localized inline errors, focus transfer to the first invalid field, and no console errors.
- Product commit `591e2f8` was pushed to `codex/radeq-ab-c-preview`.
- GitHub Pages deploy run `https://github.com/SirRadek/radeq/actions/runs/27067691226` completed successfully from commit `591e2f8419683fa133aa84711e86b5471244f815`.
- Public preview `https://sirradek.github.io/radeq/?v=591e2f8` was checked in Czech and English. Czech exposed six homepage demo links, all targeting `/demo/service-landing/`; English exposed no stale demo target. Both locales had one visible H1, no horizontal overflow, and no console warnings or errors.
- Public mobile validation produced four localized inline errors and moved focus to `brief-name` without transmitting form data.
- Public screenshot evidence was written under the Windows temp directory as `radeq-public-591e2f8-form-desktop.png`, `radeq-public-591e2f8-form-mobile-errors.png`, and `radeq-public-591e2f8-dark-hero-desktop.png`.

Risk notes:

- The generated site still contains the old direct demo routes and sitemap entries for compatibility. Homepage navigation and body content no longer link to them.
- The known Vite warning for the optional Three.js chunk remains unchanged and unrelated.
- Full Codex App runtime verification is not claimed. Evidence is limited to deterministic local checks, controlled browser checks, GitHub Actions, and public GitHub Pages verification.

Rollback:

- Revert product commit `591e2f8`, or redeploy baseline commit `c64331c`.

Project mesh impact: no project-mesh topology, edge, rule, or stop-condition change. Existing `static_public_site`, `seo_performance_surface`, `lead_capture_pipeline`, and `runtime_observability_boundary` nodes cover the slice.
