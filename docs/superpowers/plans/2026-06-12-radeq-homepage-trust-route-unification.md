# Radeq Homepage Trust And Route Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Radeq.cz into a tighter small-business website/redesign/audit/repair sales surface, with unified public routes, clear trust proof, privacy-safe measurement, and GitHub-first deployment.

**Architecture:** Keep the current Astro static-site architecture and D1 lead API. Make the homepage and route set simpler before adding more proof examples. Stage all work on GitHub/PR first; deploy to Cloudflare Worker `radeq` only after explicit owner approval.

**Tech Stack:** Astro, React islands, TypeScript, Vitest, Playwright, Cloudflare Worker static assets, Cloudflare D1, optional Cloudflare Email Sending branch.

---

## Advisory And Tooling Evidence

Source proposal: `C:/Users/sirok/Desktop/prompt.txt`.

Decision Mesh route:

- `find_risks` highlighted tool inventory, reasoning strategy, public API, project mesh lifecycle, model output evaluation, model spend, and production mutation risks.
- New governance boundary: GitHub-first staging before Cloudflare deployment.

External advisory attempts:

- Claude Code 2.1.172 is installed. Official Claude Code docs say `fable`, `opus`, `sonnet`, and effort levels are selectable; `max` is the deepest current-session reasoning mode. Fable and Opus health checks passed, but full-context/max advisory runs timed out, then Claude reported session limit until 22:20 Europe/Prague. No usable Claude advisory content was accepted.
- Gemini CLI 0.44.1 is installed. Gemini skills are available locally, but no Gemini MCP servers are configured. Official Gemini docs list `gemini-3.1-pro-preview` and explain CLI `-m gemini-3.1-pro-preview`; in this environment that model timed out even on a health check. Gemini default/auto did return a usable advisory review.
- Codex CLI 0.106.0 is installed but stale for the account model route: explicit `gpt-5` is not supported with this ChatGPT account, and default `gpt-5.5` requires a newer Codex CLI. Do not rely on separate Codex CLI advisory until the CLI is upgraded and a health check passes.

Official source pointers:

- Claude Code model aliases and effort: `https://code.claude.com/docs/en/model-config`
- Gemini 3.1 Pro Preview: `https://ai.google.dev/gemini-api/docs/models/gemini-3.1-pro-preview`
- Gemini 3 in Gemini CLI: `https://geminicli.com/docs/get-started/gemini-3/`
- Codex reasoning guidance: `https://developers.openai.com/cookbook/examples/gpt-5/codex_prompting_guide`
- OpenAI reasoning effort: `https://developers.openai.com/api/docs/guides/reasoning`

## Scope

Build this in phases. Do not combine all public content, measurement, old routes, and mascot work into a single large branch.

In scope:

- Homepage copy and CTA hierarchy.
- Contact form option reduction.
- Public route unification for `/kontakt/`, `/sluzby/`, `/portfolio/`, `/soukromi/`.
- Shared navigation/footer positioning.
- Static proof examples that explain outcomes, not private internals.
- Privacy-safe measurement contract and tests.
- GitHub-first deployment gates.

Out of scope for this plan:

- Cloudflare production deploy.
- DNS changes.
- Mailbox provider changes.
- Checkout/payment.
- LLM/RAG/model-backed chatbot.
- New 3D cat model asset.
- Public AI/agent buzzword positioning.

## File Structure

Radeq product repo: `C:/Users/sirok/Documents/Projects/radeq`

Modify:

- `src/data/siteContent.ts` - homepage copy, nav, CTA labels, service order, pricing copy, terminal project options.
- `src/pages/index.astro` - section order only if needed after content changes.
- `src/pages/en/index.astro` - keep English equivalent coherent; English can lag only if explicitly marked as separate scope.
- `src/pages/sitemap.xml.ts` - add canonical public route paths.
- `src/pages/robots.txt.ts` - verify no stale route assumptions.
- `src/components/CommandHeader.astro` - keep route-aware nav behavior.
- `src/components/ContactTerminal.tsx` - add measurement event hooks only after tests.
- `src/styles/global.css` - focused layout fixes for route pages and CTA hierarchy.
- `tests/i18n-content.test.ts` - content contract tests.
- `tests/smoke.spec.ts` - public flow and mobile tests.

Create:

- `src/data/routePages.ts` - static content contract for route pages.
- `src/pages/kontakt.astro` - contact route, same form and contact details.
- `src/pages/sluzby.astro` - service route that mirrors the simplified offer.
- `src/pages/portfolio.astro` - proof/examples route that points to `/ukazky/` and safe examples.
- `src/pages/soukromi.astro` - privacy route for form and measurement.
- `src/lib/measurement.ts` - no-network event naming contract and optional browser dispatch helper.
- `tests/route-pages.spec.ts` - route, sitemap, mobile, and stale-link checks.
- `tests/measurement.test.ts` - event naming and payload minimization tests.

Autopilot governance repo: `C:/Programování/autopilot`

Modify:

- `docs/projects/radeq/work-log.md`
- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/decision-mesh/rules.yaml`
- `model-output-evals/records/`

## Phase 0: Branch And Deployment Guard

**Files:**

- Modify: `C:/Programování/autopilot/docs/projects/radeq/work-log.md`
- Modify: `C:/Programování/autopilot/docs/projects/radeq/decision-mesh/rules.yaml`

- [ ] **Step 1: Confirm repo state**

Run:

```powershell
git -C C:\Users\sirok\Documents\Projects\radeq status --short --branch
git -C C:\Programování\autopilot status --short --branch
```

Expected:

```text
## codex/radeq-ab-c-preview...origin/codex/radeq-ab-c-preview
## codex/autopilot-safe-move-20260612...origin/codex/autopilot-safe-move-20260612
```

- [ ] **Step 2: Add or confirm the deployment rule**

In `docs/projects/radeq/decision-mesh/rules.yaml`, confirm a rule equivalent to:

```yaml
  - id: RAD-DEPLOY-001
    title: GitHub-first staging before Cloudflare deploy
    applies_to:
      - static_public_site
      - lead_capture_pipeline
      - runtime_observability_boundary
    instruction: "Stage Radeq website changes through GitHub branches and PR review first. Do not deploy Cloudflare Worker radeq, Cloudflare Pages radeq-cz, or production-domain changes without explicit owner approval in the current turn."
    severity: blocker
```

- [ ] **Step 3: Commit the governance guard before product work**

Run:

```powershell
git -C C:\Programování\autopilot add docs/projects/radeq/decision-mesh/rules.yaml docs/projects/radeq/work-log.md
git -C C:\Programování\autopilot commit -m "Record Radeq GitHub-first deployment guard"
git -C C:\Programování\autopilot push origin codex/autopilot-safe-move-20260612
```

Expected:

```text
[codex/autopilot-safe-move-20260612 <sha>] Record Radeq GitHub-first deployment guard
```

## Phase 1: Content Contract And Route Inventory

**Files:**

- Modify: `src/data/siteContent.ts`
- Create: `src/data/routePages.ts`
- Modify: `tests/i18n-content.test.ts`

- [ ] **Step 1: Write the failing content contract test**

Add to `tests/i18n-content.test.ts`:

```ts
it('keeps the Czech homepage focused on four primary website offers', () => {
  expect(siteContent.cs.hero.title).toBe('Web pro malé firmy, kterému rozumíte vy i vaši zákazníci.');
  expect(siteContent.cs.hero.actions).toEqual([
    { href: '#terminal', label: 'Chci probrat web', variant: 'primary' },
    { href: '/ukazky/', label: 'Ukázky práce', variant: 'secondary' },
  ]);
  expect(siteContent.cs.header.navItems.map((item) => item.label)).toEqual([
    'Weby',
    'Ukázky',
    'Ceny',
    'O nás',
    'Poptávka',
  ]);
  expect(siteContent.cs.terminal.projectOptions).toEqual([
    'Nový firemní web',
    'Redesign staršího webu',
    'Audit webu s plánem',
    'Rychlá oprava existujícího webu',
    'Webová péče a rozvoj',
    'Nevím, potřebuji poradit',
  ]);
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```powershell
npm.cmd test -- tests/i18n-content.test.ts
```

Expected: FAIL on current CTA label and project options.

- [ ] **Step 3: Update the Czech content**

In `src/data/siteContent.ts`, update:

```ts
actions: [
  { href: '#terminal', label: 'Chci probrat web', variant: 'primary' },
  { href: '/ukazky/', label: 'Ukázky práce', variant: 'secondary' },
],
```

And reduce `siteContent.cs.terminal.projectOptions` to:

```ts
projectOptions: [
  'Nový firemní web',
  'Redesign staršího webu',
  'Audit webu s plánem',
  'Rychlá oprava existujícího webu',
  'Webová péče a rozvoj',
  'Nevím, potřebuji poradit',
],
```

- [ ] **Step 4: Keep English coherent**

Update `siteContent.en.hero.actions` to:

```ts
actions: [
  { href: '#terminal', label: 'Discuss a website', variant: 'primary' },
  { href: '/ukazky/', label: 'Work examples', variant: 'secondary' },
],
```

Do not add English `/ukazky` content in this task. This link can point to Czech examples until the owner approves English showcase work.

- [ ] **Step 5: Run content tests**

Run:

```powershell
npm.cmd test -- tests/i18n-content.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/data/siteContent.ts tests/i18n-content.test.ts
git commit -m "Tighten homepage offer contract"
```

## Phase 2: Public Route Unification

**Files:**

- Create: `src/data/routePages.ts`
- Create: `src/pages/kontakt.astro`
- Create: `src/pages/sluzby.astro`
- Create: `src/pages/portfolio.astro`
- Create: `src/pages/soukromi.astro`
- Modify: `src/pages/sitemap.xml.ts`
- Create: `tests/route-pages.spec.ts`

- [ ] **Step 1: Write the route E2E contract**

Create `tests/route-pages.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const publicRoutes = [
  { path: '/kontakt/', heading: 'Kontakt' },
  { path: '/sluzby/', heading: 'Služby' },
  { path: '/portfolio/', heading: 'Ukázky práce' },
  { path: '/soukromi/', heading: 'Soukromí a poptávky' },
];

for (const route of publicRoutes) {
  test(`${route.path} uses the current public shell`, async ({ page }) => {
    await page.goto(route.path);
    await expect(page.getByRole('heading', { name: route.heading, level: 1 })).toBeVisible();
    await expect(page.locator('.command-nav')).toBeVisible();
    await expect(page.locator('#terminal')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Chci probrat web' })).toBeVisible();
    await expect(page.locator('main a[href*="/demo/"]')).toHaveCount(0);
  });
}

test('new public routes fit mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of publicRoutes) {
    await page.goto(route.path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow, `${route.path} has horizontal overflow`).toBe(false);
  }
});
```

- [ ] **Step 2: Run the route test and verify it fails**

Run:

```powershell
npm.cmd run test:e2e -- tests/route-pages.spec.ts
```

Expected: FAIL because routes do not exist yet.

- [ ] **Step 3: Create route page data**

Create `src/data/routePages.ts`:

```ts
export const routePages = {
  kontakt: {
    title: 'Kontakt | Radeq.cz',
    description: 'Pošlete stručnou poptávku na nový web, redesign, audit nebo rychlou opravu webu.',
    h1: 'Kontakt',
    lead: 'Napište pár vět. Stačí typ webu, současný stav a co se má zlepšit.',
    points: ['odpověď bez technické mlhy', 'jasný další krok', 'žádný závazek bez domluvy'],
  },
  sluzby: {
    title: 'Služby | Radeq.cz',
    description: 'Nové firemní weby, redesigny, audity, rychlé opravy a webová péče pro malé firmy.',
    h1: 'Služby',
    lead: 'Hlavní nabídka zůstává jednoduchá: web, redesign, audit, oprava a navazující péče.',
    points: ['nový firemní web', 'redesign staršího webu', 'audit webu s plánem', 'rychlá oprava'],
  },
  portfolio: {
    title: 'Ukázky práce | Radeq.cz',
    description: 'Veřejně bezpečné ukázky práce a konceptů bez soukromých klientských dat.',
    h1: 'Ukázky práce',
    lead: 'Místo vymyšlených referencí ukazuji typ výsledku, kontrolu kvality a cestu ke kontaktu.',
    points: ['redesign před a po', 'poptávková cesta', 'lokální služba', 'anatomie tohoto webu'],
  },
  soukromi: {
    title: 'Soukromí a poptávky | Radeq.cz',
    description: 'Jak Radeq.cz zachází s údaji z kontaktního formuláře a měřením webu.',
    h1: 'Soukromí a poptávky',
    lead: 'Formulář sbírá jen údaje potřebné k odpovědi na poptávku. Měření nesmí sbírat zbytečné osobní údaje.',
    points: ['poptávky jsou dobrovolné', 'měření je privacy-safe', 'citlivé údaje do formuláře nepatří'],
  },
} as const;
```

- [ ] **Step 4: Create the four pages**

Each page should import `CommandHeader`, `BaseLayout`, `ContactTerminal`, and `siteContent.cs`. Use this structure for `src/pages/kontakt.astro`, replacing `routePages.kontakt` with the matching key for the other pages:

```astro
---
import CommandHeader from '../components/CommandHeader.astro';
import ContactTerminal from '../components/ContactTerminal';
import BaseLayout from '../layouts/BaseLayout.astro';
import { routePages } from '../data/routePages';
import { siteContent } from '../data/siteContent';

const content = siteContent.cs;
const page = routePages.kontakt;
---

<BaseLayout
  title={page.title}
  description={page.description}
  path="/kontakt/"
  alternatePath=""
  lang={content.layout.lang}
  alternateLabel=""
>
  <CommandHeader content={content.header} currentPath="/kontakt/" alternatePath="" alternateLabel="" />
  <main class="route-page">
    <section class="route-page__hero" aria-labelledby="route-title">
      <p class="section-code">Radeq.cz</p>
      <h1 id="route-title">{page.h1}</h1>
      <p>{page.lead}</p>
      <ul>
        {page.points.map((point) => <li>{point}</li>)}
      </ul>
      <a class="button-primary" href="#terminal">Chci probrat web</a>
    </section>
    <ContactTerminal locale={content.layout.lang} content={content.terminal} client:load />
  </main>
</BaseLayout>
```

- [ ] **Step 5: Add routes to sitemap**

In `src/pages/sitemap.xml.ts`, add:

```ts
const routePagePaths = ['/kontakt/', '/sluzby/', '/portfolio/', '/soukromi/'];
```

And include it in `paths` after `'/en/'`:

```ts
const paths = [
  '/',
  '/en/',
  ...routePagePaths,
  ...showcasePaths,
  ...moduleIds.map((moduleId) => `/demo/${moduleId}/`),
  ...moduleIds.map((moduleId) => `/en/demo/${moduleId}/`),
];
```

- [ ] **Step 6: Run route E2E**

Run:

```powershell
npm.cmd run test:e2e -- tests/route-pages.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/data/routePages.ts src/pages/kontakt.astro src/pages/sluzby.astro src/pages/portfolio.astro src/pages/soukromi.astro src/pages/sitemap.xml.ts tests/route-pages.spec.ts
git commit -m "Add unified public route pages"
```

## Phase 3: Trust Proof And Copy Cleanup

**Files:**

- Modify: `src/data/siteContent.ts`
- Modify: `src/data/showcaseExamples.ts`
- Modify: `tests/showcase-examples.test.ts`
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Add copy no-go tests**

Add to `tests/i18n-content.test.ts`:

```ts
it('keeps homepage copy free of public AI buzzwords and fake metrics', () => {
  const homepageText = JSON.stringify(siteContent.cs).toLowerCase();
  for (const forbidden of ['agentní', 'autonomní', 'pageSpeed 95', 'garantujeme 1,5 s']) {
    expect(homepageText).not.toContain(forbidden.toLowerCase());
  }
});
```

- [ ] **Step 2: Run the test**

Run:

```powershell
npm.cmd test -- tests/i18n-content.test.ts
```

Expected: PASS or FAIL only where real copy cleanup is needed.

- [ ] **Step 3: Move trust proof above broad secondary services**

In `src/pages/index.astro`, keep the order:

```astro
<HeroSection content={content.hero} />
<DemoBlocks content={content.demos} />
<ServiceCatalog content={content.systems} />
<PricingSection content={content.pricing} />
<HandoffStandard content={content.handoff} />
```

If the current order already matches the intent, do not restructure.

- [ ] **Step 4: Tighten demo proof copy**

In `src/data/siteContent.ts`, ensure demo proof names read as outcomes:

```ts
name: 'Redesign: před a po',
name: 'Poptávka bez ručního přepisování',
name: 'Demo web lokální služby',
name: 'Produktová stránka bez checkoutu',
name: 'Anatomie tohoto webu',
```

Use only examples that are true in the repository or explicitly marked as concepts.

- [ ] **Step 5: Run smoke and showcase tests**

Run:

```powershell
npm.cmd test -- tests/i18n-content.test.ts tests/showcase-examples.test.ts
npm.cmd run test:e2e -- tests/smoke.spec.ts tests/showcase-examples.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/data/siteContent.ts src/data/showcaseExamples.ts src/pages/index.astro tests/i18n-content.test.ts tests/showcase-examples.test.ts tests/smoke.spec.ts
git commit -m "Clarify trust proof and homepage copy"
```

## Phase 4: Privacy-Safe Measurement Contract

**Files:**

- Create: `src/lib/measurement.ts`
- Modify: `src/components/ContactTerminal.tsx`
- Modify: `src/components/CommandHeader.astro`
- Modify: `src/components/PricingSection.astro`
- Create: `tests/measurement.test.ts`
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Write the unit test**

Create `tests/measurement.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { createMeasurementEvent, measurementEvents } from '../src/lib/measurement';

describe('measurement event contract', () => {
  it('allows only privacy-safe event names', () => {
    expect(measurementEvents).toEqual([
      'cta_primary_click',
      'showcase_click',
      'form_start',
      'form_submit_success',
      'email_click',
      'phone_click',
      'audit_click',
      'quick_fix_click',
    ]);
  });

  it('strips personal details from payloads', () => {
    expect(
      createMeasurementEvent('form_submit_success', {
        email: 'client@example.com',
        message: 'Private message',
        route: '/kontakt/',
      }),
    ).toEqual({ name: 'form_submit_success', route: '/kontakt/' });
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```powershell
npm.cmd test -- tests/measurement.test.ts
```

Expected: FAIL because `src/lib/measurement.ts` does not exist.

- [ ] **Step 3: Implement the measurement contract**

Create `src/lib/measurement.ts`:

```ts
export const measurementEvents = [
  'cta_primary_click',
  'showcase_click',
  'form_start',
  'form_submit_success',
  'email_click',
  'phone_click',
  'audit_click',
  'quick_fix_click',
] as const;

export type MeasurementEventName = (typeof measurementEvents)[number];

export interface MeasurementEvent {
  name: MeasurementEventName;
  route: string;
}

export function createMeasurementEvent(
  name: MeasurementEventName,
  input: Record<string, unknown>,
): MeasurementEvent {
  return {
    name,
    route: typeof input.route === 'string' ? input.route.slice(0, 160) : '/',
  };
}

export function dispatchMeasurementEvent(name: MeasurementEventName, route = window.location.pathname): void {
  window.dispatchEvent(
    new CustomEvent('radeq:measurement', {
      detail: createMeasurementEvent(name, { route }),
    }),
  );
}
```

- [ ] **Step 4: Add non-network hooks**

In CTA links, add `data-track` attributes first. Do not add analytics network calls in this phase.

Example:

```astro
<a class="header-cta" href="#terminal" data-track="cta_primary_click">{content.cta}</a>
```

In `ContactTerminal.tsx`, dispatch on first field focus and successful submit only:

```ts
import { dispatchMeasurementEvent } from '../lib/measurement';
```

Then add:

```ts
const [hasStarted, setHasStarted] = useState(false);

function markStarted() {
  if (hasStarted) return;
  setHasStarted(true);
  dispatchMeasurementEvent('form_start');
}
```

Call `markStarted()` from the first input `onFocus`.

After successful API response:

```ts
dispatchMeasurementEvent('form_submit_success');
```

- [ ] **Step 5: Run measurement and smoke tests**

Run:

```powershell
npm.cmd test -- tests/measurement.test.ts
npm.cmd run test:e2e -- tests/smoke.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/lib/measurement.ts src/components/ContactTerminal.tsx src/components/CommandHeader.astro src/components/PricingSection.astro tests/measurement.test.ts tests/smoke.spec.ts
git commit -m "Add privacy-safe measurement contract"
```

## Phase 5: GitHub-Only Verification And PR Update

**Files:**

- No product source changes unless tests fail.

- [ ] **Step 1: Run the full local gate**

Run:

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
$env:DEPLOY_TARGET='github-pages'; npm.cmd run build
npm.cmd run test:e2e
git diff --check
```

Expected:

```text
typecheck: 0 errors
vitest: all tests passed
astro build: complete, only known Vite chunk warning allowed
github-pages build: complete
playwright: all tests passed
git diff --check: no whitespace errors
```

- [ ] **Step 2: Push to GitHub only**

Run:

```powershell
git push origin codex/radeq-ab-c-preview
```

Expected: branch updates on GitHub. Do not run `wrangler deploy`.

- [ ] **Step 3: Update PR description**

Use GitHub only. Include:

```md
## What changed
- tightened homepage positioning around websites/redesign/audit/repair
- added unified route pages for /kontakt, /sluzby, /portfolio, /soukromi
- added privacy-safe measurement contract without external analytics

## Verification
- npm.cmd run typecheck
- npm.cmd test
- npm.cmd run build
- DEPLOY_TARGET=github-pages npm.cmd run build
- npm.cmd run test:e2e
- git diff --check

## Not deployed
Cloudflare Worker production was not deployed. Owner approval required.
```

## Phase 6: Cloudflare-Later Deployment Gate

Run this only after the owner explicitly says to deploy to Cloudflare in the current turn.

**Files:**

- Read only: `wrangler.toml`
- Read only: `wrangler.worker.example.toml`

- [ ] **Step 1: Rebuild production dist**

Run:

```powershell
npm.cmd run build
```

Expected: production `dist` built with base `/`.

- [ ] **Step 2: Dry-run Cloudflare Worker**

Run:

```powershell
$env:CLOUDFLARE_API_TOKEN=$null
npx.cmd wrangler@latest deploy --dry-run
```

Expected:

```text
env.LEADS_DB
env.ASSETS
```

If the current branch includes email notification deployment, also expect:

```text
env.EMAIL
```

- [ ] **Step 3: Ask for final deploy confirmation**

Stop and ask:

```text
Dry-run passed. Deploy Worker radeq to live radeq.cz now?
```

- [ ] **Step 4: Deploy only after confirmation**

Run:

```powershell
$env:CLOUDFLARE_API_TOKEN=$null
npx.cmd wrangler@latest deploy
```

- [ ] **Step 5: Verify without unnecessary write traffic**

Run:

```powershell
$urls = @(
  'https://radeq.cz/',
  'https://radeq.cz/kontakt/',
  'https://radeq.cz/sluzby/',
  'https://radeq.cz/portfolio/',
  'https://radeq.cz/soukromi/',
  'https://radeq.cz/ukazky/'
)
foreach ($url in $urls) {
  $res = Invoke-WebRequest -Uri $url -UseBasicParsing
  Write-Output "$url $($res.StatusCode)"
}
$api = Invoke-WebRequest -Uri 'https://radeq.cz/api/leads' -Method Options -UseBasicParsing
Write-Output "https://radeq.cz/api/leads $($api.StatusCode) $($api.Headers['access-control-allow-methods'])"
```

Expected:

```text
all public GETs: 200
OPTIONS /api/leads: 204 POST, OPTIONS
```

Do not POST a production test lead unless the owner explicitly approves a write test.

## Workflow Tuning Plan

Before the next multi-model advisory:

- [ ] **Claude:** Use a smaller advisory packet first. Prefer `claude --model best --fallback-model opus,sonnet --effort high --permission-mode plan`. Use `max` only for bounded packets or after confirming enough session budget.
- [ ] **Gemini:** Run `gemini.cmd --version`, then use interactive `/model` to confirm whether `gemini-3.1-pro-preview` is available. If not, use default Auto and label it as default/auto, not Gemini 3.1.
- [ ] **Gemini skills:** Current Gemini skills are available, but Gemini MCP list is empty. Do not claim Gemini MCP use until configured.
- [ ] **Codex CLI:** Upgrade or repair the CLI before using it as a separate advisory runner. Current `0.106.0` cannot run the default account model route.
- [ ] **Decision Mesh:** Keep using `autopilot_decision_mesh` first for risks, capabilities, and model spend policy.
- [ ] **Model eval:** Record failed provider runs as failed provider runs, not weak advisory output.

## Owner Decisions Before Implementation

1. Confirm whether `/kontakt/`, `/sluzby/`, `/portfolio/`, and `/soukromi/` should be real static pages or redirects into homepage anchors.
2. Confirm final six contact form project options.
3. Confirm whether phone should be public; if yes, provide exact phone formatting.
4. Confirm whether a personal photo should be added now, and provide the approved asset.
5. Confirm whether measurement should stay no-network in phase 1 or use Cloudflare Web Analytics later.
6. Confirm whether English `/ukazky` should be added or Czech examples can remain the only showcase wave.
7. Confirm when Cloudflare deploy is allowed again.

