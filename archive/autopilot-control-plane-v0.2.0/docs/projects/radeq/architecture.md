# Radeq.cz Website Architecture

Last updated: 2026-06-06
Next review: 2026-06-07
Status: active
Slug: `radeq`
Primary repository: `SirRadek/radeq`
Canonical local root: `C:\Users\sirok\Documents\Projects\radeq`
Separation status: `separated`
Visibility: public repository, with private reference assets excluded by policy

## Purpose And Scope

Radeq.cz is a public static website for presenting fast web systems, conversion flows, SEO structures, and lightweight automation work. The current product surface is the Czech route `/`, the English route `/en/`, a static service catalog that promotes one primary shop demo, a compact global theme menu for four visual directions, a light/dark visual mode toggle, optional compatibility demo routes under `/demo/<module>/` and `/en/demo/<module>/`, an optional 3D mascot enhancement, and a Cloudflare D1-backed lead capture endpoint.

Out of scope for the current architecture:

- user accounts or authentication
- payments
- email notification delivery
- autonomous agent execution
- public exposure of private project inventory
- remote mutation from the UI

## System Boundary

In this project:

- Astro static pages and layouts
- React islands for interactive UI
- typed content and style matrix data
- optional Three.js mascot runtime
- Cloudflare Pages Function at `/api/leads`
- Cloudflare D1 schema and local integration gate
- Playwright and Vitest verification

External to this project:

- Cloudflare account configuration and real production D1 database ID
- GitHub repository hosting and GitHub Pages deployment environment
- future email notification provider
- future Autopilot dashboard or project inventory system

## Repository Boundary

Radeq is a product project, not the Autopilot control plane. Its canonical source code belongs in its own local root and remote repository:

```text
C:\Users\sirok\Documents\Projects\radeq
SirRadek/radeq
```

Autopilot may track Radeq through registry rows, architecture mirrors, sanitized snapshots, and work-log summaries. Autopilot must not become the canonical home for Radeq runtime code, migrations, deployment configuration, or assets.

Current state: the local Radeq product checkout exists separately at `C:\Users\sirok\Documents\Projects\radeq`. Cleanup PR `https://github.com/SirRadek/radeq/pull/1` was merged into `new` as `ef7053c`, so legacy Autopilot governance files are no longer present on the Radeq default branch.

## Decision Mesh

Project-specific mesh path:

```text
docs/projects/radeq/decision-mesh/
```

Current mesh coverage:

- static public site boundary
- lead capture and D1 data flow
- optional 3D mascot add-on
- SEO and performance surface
- runtime observability boundary for project-owned logs, deployment evidence, client console symptoms, lead API failures, and performance bottlenecks

This is a control-plane mirror for Radeq architecture evidence. Canonical product runtime code remains in the Radeq repository.

## Runtime Architecture

Static page shell:

- `src/pages/index.astro` renders the Czech route.
- `src/pages/en/index.astro` renders the English route.
- `src/pages/demo/[module].astro` renders Czech interactive demo pages. `/demo/service-landing/` is the only demo promoted from the homepage and is the primary shop-only showcase. `/demo/eshop-offers/`, blog/docs, and team-overview modules remain directly addressable compatibility routes until a separate URL migration removes or redirects them.
- `src/pages/en/demo/[module].astro` renders the English equivalents.
- `src/layouts/BaseLayout.astro` sets global metadata, canonical URLs, alternate links, Open Graph URL metadata, language, global CSS, and `MotionOrchestrator`.
- `src/pages/robots.txt.ts` and `src/pages/sitemap.xml.ts` generate static indexability endpoints from the configured Astro `site` and `base`.

Interactive islands:

- `src/components/StyleVariantToggle.tsx` is hydrated with `client:load` and controls `html[data-style]` globally with four-theme persistence. Its compact Czech/English menu exposes descriptive names while retaining the stable `variant-a` through `variant-d` storage and event contract.
- `src/components/StyleMatrixSimulator.tsx` is hydrated with `client:load` on demo routes, reads typed presets from `src/data/styleMatrix.ts`, and follows the global style switch instead of owning a separate A/B/C/D picker. The primary and compatibility shop routes use `shopOnly`, so A/B/C/D changes presentation while products, filters, comparison, and demo-cart behavior remain fixed.
- `src/components/ThemeModeToggle.tsx` is hydrated with `client:load` and controls `html[data-theme]` with a light-first default and localStorage persistence.
- `src/components/ContactTerminal.tsx` is hydrated with `client:load` and posts lead payloads to `/api/leads`. Its UI contract includes explicit labels and autocomplete metadata, required/optional guidance, inline localized validation, focus transfer to the first invalid field, and live status feedback. The API payload, persistence, and server validation contracts remain unchanged.
- `src/components/MotionOrchestrator.tsx` tracks active sections, pointer motion, scroll state, and reduced-motion state.
- `src/components/CatGuide.astro`, `src/components/StudioProof.astro`, and `src/components/DemoWorlds.astro` provide structurally distinct static homepage proposal compositions for B/C/D. They are selected by `html[data-style]` and kept outside the motion scene section scan while preserving HTML-readable content.
- `src/components/CoreIsland.tsx` dynamically imports Three.js and `GLTFLoader` only after the user enables the 3D mascot, and exposes asset provenance and budget metadata as non-content `data-*` attributes.
- `src/lib/catMascot.ts` owns the mascot asset manifest for source, license, provenance, byte budget, triangle budget, loading strategy, and SEO role.

Lead API:

- `functions/api/leads.ts` handles `POST /api/leads` and `OPTIONS`.
- `src/lib/leads.ts` owns payload creation, validation, field limits, context minimization, and lead IDs.
- `migrations/0001_create_leads.sql` defines the D1 `leads` table and indexes.

## Data Flow

Lead capture flow:

```text
Visitor
  -> ContactTerminal form fields
  -> createLeadPayload()
  -> client-side validateLeadSubmission()
  -> fetch POST /api/leads
  -> functions/api/leads.ts
  -> server-side validateLeadSubmission()
  -> minimizeLeadContext()
  -> LEADS_DB.prepare(...).bind(...).run()
  -> D1 table `leads`
  -> manual export or future dashboard review
```

Required lead fields:

- `name`
- `email`
- `project_type`
- `message`

Privacy minimization:

- `source_path` is stored as same-origin path without query or hash.
- same-origin `referrer` is stored as path only.
- external `referrer` is stored as origin only.
- `honeypot` must remain empty.

## Integrations

GitHub:

- repository remote is `https://github.com/SirRadek/radeq.git`
- default branch is `new`
- current GitHub Actions workflow deploys GitHub Pages on push to `new`

Cloudflare:

- target platform is Cloudflare Pages
- `wrangler.example.toml` defines `pages_build_output_dir = "./dist"`
- D1 binding name is `LEADS_DB`
- local runtime gate uses `npm run cf:pages:dev`

Vercel:

- no current runtime dependency
- Vercel Workflow remains phase-2 research only

Linear and Docket:

- no current runtime or repository integration is implemented

## Deployment And Environments

Local development:

```powershell
npm run dev
```

Static build:

```powershell
npm run build
```

Local Cloudflare Pages and D1 gate:

```powershell
npm run test:leads:cloudflare
npm run build
npm run cf:d1:migrate:local
npm run cf:pages:dev
```

GitHub Pages path behavior:

- `astro.config.mjs` uses `DEPLOY_TARGET=github-pages`
- GitHub Pages build uses site `https://sirradek.github.io`
- GitHub Pages build uses base `/radeq`
- Preview branch `codex/radeq-ab-c-preview` was temporarily allowed to deploy to the `github-pages` environment for draft PR preview `https://github.com/SirRadek/radeq/pull/2`.

Cloudflare Pages path behavior:

- production site is configured as `https://radeq.cz`
- base path is `/`

## Security And Privacy Controls

- No secrets or real D1 database IDs belong in the repository.
- `wrangler.example.toml` is a template only.
- D1 binding is required at runtime; missing binding returns a controlled setup error.
- API responses use JSON, `cache-control: no-store`, and CORS headers for POST/OPTIONS.
- `public/_headers` defines security headers and immutable caching for hashed Astro assets.
- Private original reference assets must not be shipped or sent to external models.
- Public cat reference assets must be approved derivative assets only.
- External model critique must use redacted aliases and no private repo bodies, tokens, customer data, or local account details.

## Verification Gates

Standard local gate:

```powershell
npm run test
npm run typecheck
npm run build
npm run test:e2e
```

Lead pipeline gate:

```powershell
npm run test:leads:cloudflare
npm run build
npm run cf:d1:migrate:local
npm run cf:pages:dev
```

Supplemental checks:

```powershell
node --check scripts/run-local-pages-dev.mjs
git diff --check
```

## Known Gaps And Risks

- Cloudflare lead pipeline proof is local happy-path proof, not remote deployment proof.
- No official `@cloudflare/vitest-pool-workers` or Miniflare coverage exists yet.
- Performance budget checks are not automated.
- Automated accessibility checks for `ContactTerminal` and `StyleMatrixSimulator` are not yet expanded.
- The `/autopilot` dashboard route and typed project inventory do not exist yet.
- GitHub Pages workflow and Cloudflare Pages target coexist, so deployment target must be named explicitly in handoffs.

## Architecture Change Triggers

Update this file when any of these change:

- route structure or public page responsibilities
- React island hydration strategy
- lead payload contract, validation, minimization, or D1 schema
- Cloudflare binding, migration, or deployment process
- GitHub Actions or deployment target behavior
- 3D mascot asset, runtime loader, or performance strategy
- security/privacy policy or external model disclosure rules
- verification gates or acceptance criteria
- project-specific Decision Mesh nodes, edges, rules, or stop conditions
