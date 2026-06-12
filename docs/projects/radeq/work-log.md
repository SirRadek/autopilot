# Radeq.cz Website Work Log

## 2026-06-12 GitHub-Only Rollback For Lead Notification Branch

Date: 2026-06-12
Request or trigger: owner asked to keep the latest lead notification and cat-mobile-guard work only on GitHub for now to avoid unnecessary Cloudflare Free-plan usage.
Mode: WRITE_ALLOWED for Cloudflare Worker rollback and local governance records. No product source changes, no DNS change, no mailbox/provider change, no D1 migration, and no additional lead POST test.

Outcome:

- Kept Radeq product commit `731231b` pushed on GitHub branch `codex/radeq-ab-c-preview`.
- Rolled Cloudflare Worker `radeq` back from version `d075d10a-fa6e-4b19-9ede-9a717543edce` to previous version `747d1ab3-ff49-497b-8cb8-917c67d0153d`.
- Rollback message: `Owner requested GitHub-only staging to avoid Cloudflare free-tier usage`.
- The live `radeq.cz` site still serves the approved `/ukazky` implementation, but the lead notification branch is not currently active on Cloudflare production.

Verification:

- `https://radeq.cz/`: 200.
- `https://radeq.cz/ukazky/`: 200.
- `OPTIONS https://radeq.cz/api/leads`: 204 with `POST, OPTIONS`.
- `wrangler deployments list --name radeq` showed the rollback deployment at `2026-06-12T15:42:01.548Z` with 100% traffic on version `747d1ab3-ff49-497b-8cb8-917c67d0153d`.

Cloudflare limit note:

- Official Cloudflare Workers docs list a Workers Free daily request limit of 100,000 requests that resets at 00:00 UTC.
- Official Workers Static Assets billing docs state requests to static assets are free and unlimited, while requests to the Worker script are billed or limited according to Workers pricing.
- Practical policy after this owner decision: keep iterative work on GitHub/PR first, and deploy to Cloudflare only when the owner explicitly asks for a Cloudflare preview or production check.

Rollback:

- To put the GitHub branch back on Cloudflare later, redeploy Radeq product commit `731231b` or newer with the local production `wrangler.toml`.

## 2026-06-12 Lead Email Notification Deploy And Cat Mobile Guard

Date: 2026-06-12
Request or trigger: owner confirmed Fastmail as the final mailbox provider, asked to keep the contact form, start the cat design work, implement form forwarding/notifications, push the product branch, and put the change directly on `radeq.cz`.
Mode: WRITE_ALLOWED for the Radeq product checkout, Cloudflare Worker `radeq`, local governance records, and local git commits/pushes. No DNS MX/SPF/DKIM/DMARC mutation, mailbox provider change, checkout/payment flow, model API, RAG, or replacement 3D model asset was introduced.

Product implementation:

- Added `src/lib/leadNotificationEmail.ts` with a server-side Cloudflare Email Sending message for new stored leads.
- Updated `functions/api/leads.ts` so `/api/leads` sends the notification only after successful D1 storage and keeps the visitor response successful if email sending fails.
- Updated `worker/index.ts`, local ignored `wrangler.toml`, and committed `wrangler.worker.example.toml` to include the `EMAIL` send binding shape.
- Added tests proving notification send on success and fail-soft behavior on email errors.
- Added a mobile lower safe rail for the platform-roaming cat and clamps the final mobile `screenY` so jump interpolation cannot overlap hero text/CTA.
- Added a mobile header E2E assertion that the English language switch remains visible.
- Added `.superpowers/` to `.gitignore`.

Cat design follow-up:

- Added `docs/superpowers/specs/2026-06-12-radeq-cat-mascot-next-design.md`.
- The approved immediate implementation is only mobile overlap protection. Deeper work on a smoother body, texture, behavior logic, or replacement GLB remains a separate asset/design pipeline with license, rig, optimization, reduced-motion, and mobile evidence gates.

Project mesh and architecture impact:

- Updated `domain_email_research`, `lead_capture_pipeline`, mesh edge `domain_email_research -> lead_capture_pipeline`, and rules with `RAD-EMAIL-002`.
- Updated `docs/projects/radeq/architecture.md` so email notifications are now in scope as a fail-soft transactional Worker binding, while Fastmail remains the human mailbox provider.

Deployment outcome:

- Product commit `731231b` was pushed to `codex/radeq-ab-c-preview`.
- Initial `wrangler deploy` failed because an environment `CLOUDFLARE_API_TOKEN` overrode OAuth and lacked Worker service access (`Authentication error [code: 10000]`).
- Retried deploy with that env token removed for the command, using the existing OAuth login with `workers`, `d1`, and `email_sending` permissions.
- Deployed Worker `radeq` with `ASSETS`, `LEADS_DB`, and `EMAIL` bindings. Current deployed Worker version ID: `d075d10a-fa6e-4b19-9ede-9a717543edce`.

Verification:

- `npm.cmd run typecheck`: passed with 0 errors, warnings, or hints.
- `npm.cmd test`: passed, 9 files and 50 tests.
- `npm.cmd run build`: passed, 14 pages generated; existing Vite chunk-size warning remained.
- `DEPLOY_TARGET=github-pages npm.cmd run build`: passed, 14 pages generated; existing Vite chunk-size warning remained.
- `npm.cmd run test:e2e`: passed, 15 Playwright tests.
- `git diff --check`: passed; Git reported only LF-to-CRLF working-copy warnings.
- `npx.cmd wrangler@latest deploy --dry-run`: passed and confirmed `EMAIL`, `LEADS_DB`, and `ASSETS` bindings.
- Public checks after deploy: `https://radeq.cz/` 200, `https://radeq.cz/en/` 200, `https://radeq.cz/ukazky/` 200, `OPTIONS https://radeq.cz/api/leads` 204.
- Synthetic production lead test submitted to `POST https://radeq.cz/api/leads` with `TEST - Codex deploy verification`; API returned 201 and lead ID `lead_mqb2u5q6_b91abd77`.

Risk notes:

- The public API test confirms live D1/API path. Email delivery confirmation still requires checking the Fastmail mailbox `poptavky@radeq.cz` for the test notification because the API intentionally does not expose email delivery state.
- Wrangler Email Sending beta `list` and `settings` commands returned Cloudflare API `Unauthorized [code: 2036]` under OAuth, despite the deploy accepting the `EMAIL` binding. Treat Cloudflare Dashboard mailbox/log checks as the current delivery evidence path.
- Email notification is fail-soft: a future Cloudflare Email Sending failure logs an error and does not lose a stored lead.
- The deeper cat redesign is not implemented in this slice; only mobile overlap containment is live.

Rollback:

- Redeploy previous Worker version `747d1ab3-ff49-497b-8cb8-917c67d0153d`, or revert product commit `731231b` and redeploy Worker `radeq`.

## 2026-06-12 Production Worker Deploy To Radeq.cz

Date: 2026-06-12
Request or trigger: owner explicitly asked to put the approved `/ukazky` implementation directly on `radeq.cz` after reviewing the GitHub/Cloudflare preview direction.
Mode: WRITE_ALLOWED for the Radeq product checkout, Cloudflare Worker `radeq`, Cloudflare Pages project `radeq-cz`, local governance records, and local git commits. No GitHub production merge, GitHub Pages release push, DNS MX/DKIM/SPF/DMARC mutation, mailbox provider change, checkout/payment flow, model API, RAG, or lead data submission was performed.

Deployment outcome:

- Ran a fresh production Astro build.
- Uploaded the static build to Cloudflare Pages project `radeq-cz` first. Branch `new` created preview deployment `https://e7070554.radeq-cz.pages.dev`; branch `profi` created production Pages deployment `https://787534f2.radeq-cz.pages.dev`.
- Verified the Pages production deployment had the new `/ukazky/*` pages, but `https://radeq.cz` still served old content because the apex domain is routed through Worker `radeq`.
- Added a Worker entrypoint in the Radeq repo that routes `/api/leads` to the existing lead handler and serves all other paths from Worker static assets.
- Deployed Worker `radeq` with Cloudflare Workers static assets and existing `LEADS_DB` binding. Current deployed Worker version ID: `747d1ab3-ff49-497b-8cb8-917c67d0153d`.
- Kept the real local `wrangler.toml` ignored so the production D1 database ID is not committed; added a safe example Worker config with a placeholder database ID.

Public verification:

- `https://radeq.cz/`: 200 and new homepage title/content.
- `https://radeq.cz/ukazky/`: 200.
- `https://radeq.cz/ukazky/chatbot/`: 200.
- `https://radeq.cz/ukazky/automatizace/`: 200.
- `https://radeq.cz/ukazky/nabidka-eshop/`: 200.
- `https://radeq.cz/sitemap.xml`: 200 and contains `/ukazky` routes.
- `OPTIONS https://radeq.cz/api/leads`: 204 with `POST, OPTIONS`; no real lead payload was submitted.

Verification:

- `npm.cmd run typecheck`: passed with 0 errors, warnings, or hints.
- `npx.cmd wrangler@latest deploy --dry-run`: passed and confirmed `LEADS_DB` plus `ASSETS` bindings.
- `npm.cmd test`: passed, 9 files and 47 tests.
- `npm.cmd run build`: passed, 14 pages generated; existing Vite chunk-size warning remained.
- `DEPLOY_TARGET=github-pages npm.cmd run build`: passed, 14 pages generated; existing Vite chunk-size warning remained.
- `npm.cmd run test:e2e`: passed, 15 Playwright tests.
- `git diff --check`: passed; Git reported only LF-to-CRLF working-copy warnings.

Risk notes:

- Production currently depends on Worker `radeq`, not only Cloudflare Pages custom domains. The Pages custom domains existed but were pending because the apex domain was still routed through the Worker.
- Future deploy handoffs must name the target explicitly: Worker `radeq` for `radeq.cz`, Pages `radeq-cz` for Pages preview/secondary deployments, and GitHub Pages for PR preview.
- The local ignored `wrangler.toml` contains production binding details and must not be committed.

Rollback:

- Redeploy the previous Worker version from Cloudflare Workers deploy history, or deploy the previous Radeq build to Worker `radeq`. Pages deployment `f0eded6a` remains the previous Cloudflare Pages production build, but it did not control the apex route during this run.

## 2026-06-12 Static Ukazky Implementation

Date: 2026-06-12
Request or trigger: owner approved the Czech first wave of static public `/ukazky` examples and asked to implement `/ukazky/`, `/ukazky/chatbot/`, `/ukazky/automatizace/`, and `/ukazky/nabidka-eshop/`, while keeping e-mail provider research separate from the static implementation.
Mode: WRITE_ALLOWED for the Radeq product checkout, local governance mesh, work log, architecture mirror, and model-output eval record. No production Cloudflare deploy, GitHub deploy, push, PR, D1, migrations, lead API, package files, checkout/payment flow, model API, RAG, analytics, or provider/DNS configuration was changed.

Product implementation:

- Added typed static showcase content in `src/data/showcaseExamples.ts`.
- Added a typed local decision tree in `src/data/chatbotGuide.ts`.
- Added `src/components/RuleChatbotGuide.tsx` as a React island for visible choice state only. It does not use network calls, backend inference, analytics, localStorage, or hidden submission.
- Added `src/pages/ukazky/index.astro` and `src/pages/ukazky/[example].astro`.
- Made `BaseLayout` and `CommandHeader` tolerate Czech-only pages without false English alternate links.
- Added `/ukazky/` and detail pages to `sitemap.xml.ts`.
- Added showcase styles under `.showcase-*` and `.rule-chatbot*` selectors without new A/B/C/D showcase variant selectors.
- Added Czech header link `Ukázky` after the pages, targeted tests, and initial build were passing.
- Left old `/demo/*` public and separate.

Verification:

- `npm.cmd run typecheck`: passed with 0 errors, warnings, or hints.
- `npm.cmd test`: passed, 9 files and 47 tests.
- `npm.cmd run build`: passed, 14 pages generated including `/ukazky/*`; existing Vite chunk-size warning remained.
- `DEPLOY_TARGET=github-pages npm.cmd run build`: passed, 14 pages generated; existing Vite chunk-size warning remained.
- `npm.cmd run test:e2e`: passed, 15 Playwright tests.
- `git diff --check`: passed; Git reported only LF-to-CRLF working-copy warnings.
- Local dev sanity check at `http://127.0.0.1:4321` verified all four `/ukazky` routes have expected H1 text, no `.style-toggle`, no desktop or 390px mobile horizontal overflow, and chatbot handoff panel appears only after explicit click.

E-mail research:

- Public DNS read-only check found Cloudflare nameservers `anton.ns.cloudflare.com` and `sharon.ns.cloudflare.com`; no public MX, SPF TXT, or `_dmarc` TXT records were returned by `Resolve-DnsName` during this run.
- Current official sources were checked for Cloudflare Email Service, Fastmail, Google Workspace, Microsoft Exchange Online, Zoho Mail, Proton Mail, Resend, Formspree, and Basin.
- Recommendation: use mailbox hosting for human mail and replies as `@radeq.cz`; keep Cloudflare Email Routing as a temporary receive-only forwarding option; use Workers plus Cloudflare Email Service or Resend later for transactional form notifications only.
- No DNS, mailbox, provider, Worker, or form backend configuration was changed.

Project mesh impact:

- Added `public_showcase_examples` and `domain_email_research` nodes.
- Added edges from public showcase examples to static site, offer positioning, SEO/performance, and lead capture.
- Added e-mail research edge to lead capture as future integration.
- Added rules `RAD-SHOWCASE-001` through `RAD-SHOWCASE-003` and `RAD-EMAIL-001`.

Known limitations and owner decisions:

- No commit, push, PR, GitHub Pages preview, or Cloudflare production deploy was performed.
- Owner confirmed Fastmail as the final human mailbox provider for `radeq.cz`.
- Owner confirmed `siroky@radeq.cz`, `info@radeq.cz`, and `poptavky@radeq.cz` work.
- Owner confirmed DMARC should remain `p=none` during initial monitoring.
- Owner approved adding Czech contact-form options for `Jednoduchý chatbot / průvodce`, `Automatizace poptávek`, and `Nabídka / e-shop úprava`.
- English `/ukazky` pages remain out of scope.

Rollback:

- Revert the Radeq product checkout changes in the `/ukazky` files, layout/header/sitemap/style/test updates, and remove the governance mesh/work-log/eval additions if the owner rejects public showcase publishing.

## 2026-06-12 Static Ukazky Implementation Planning

Date: 2026-06-12
Request or trigger: owner asked for a proper implementation plan for the Radeq `/ukazky` direction, with work split across agents and external advisory models, explicit reasoning, plugin/skill usage, logging, evaluation, and stop/owner-decision handling.
Mode: ADVISORY_AND_PLANNING_ONLY. No RadeQ product runtime files, GitHub remote, deployment, workflow, package/dependency files, lead API, D1, migrations, secrets, Cloudflare configuration, payment flow, email provider, model API, or analytics integration were changed.
Skills and tools used:

- `superpowers:brainstorming` to preserve the design approval gate before implementation.
- `superpowers:dispatching-parallel-agents` to split read-only planning into IA, chatbot architecture, security/privacy, and QA workstreams.
- `superpowers:writing-plans` to create a task-by-task implementation plan.
- `build-web-apps:frontend-app-builder` as a planning-only quality frame for frontend/verification expectations; no visual concepting or implementation was started.
- Autopilot Decision Mesh project packet for Radeq-specific rules and stop conditions.
- Claude CLI and Gemini CLI as redacted external advisory reviewers. Gemini hit a capacity/rate-limit path on one run, so only matching low-risk planning observations were adopted.

Agent workstreams:

- IA/content agent recommended a Czech `/ukazky/` hub plus `/ukazky/chatbot/`, `/ukazky/automatizace/`, and `/ukazky/nabidka-eshop/`, while skipping `/ukazky/firemni-web/`.
- Chatbot architecture agent recommended an Astro SEO page plus a single React island for a local rule-based decision tree, with static TS data and no network/model/storage behavior.
- Security/privacy agent required visible no-model/static-copy disclaimers, no sensitive-data prompts, explicit handoff, no payment/order claims, and no hidden tracking.
- QA agent required Vitest data contracts, Playwright route/SEO/mobile tests, A/B/C/D isolation, homepage CTA preservation, sitemap checks, and GitHub Pages build verification.

External advisory synthesis:

- Claude aligned on owner gates for URL/navigation, decision-tree content, handoff provider, final copy, and preview before merge.
- Gemini aligned on static JSON/rules, explicit handoff, and avoiding AI overclaims, but was treated as lower-confidence due capacity/error behavior and generic output in part of the run.

Plan artifact:

- Added `docs/superpowers/plans/2026-06-12-radeq-static-ukazky.md`.

Selected planning direction:

- Use a typed data layer (`showcaseExamples.ts`) for public-safe static showcase copy.
- Use a separate typed `chatbotGuide.ts` decision tree and `RuleChatbotGuide.tsx` island only for `/ukazky/chatbot/`.
- Use `src/pages/ukazky/index.astro` and `src/pages/ukazky/[example].astro` for SEO-readable pages.
- Keep `/demo/*` as a separate compatibility/review surface unless owner later approves migration or redirects.
- Keep the chatbot static and rule-based. No LLM, RAG, model provider, fetch, localStorage, analytics, or backend inference in this slice.
- Handoff should be explicit and should initially point to the existing contact path. `mailto:`, provider integrations, tracking, API prefill, or email delivery require a separate owner decision.

Required owner gates before product implementation:

- Confirm Czech-only first slice or request bilingual `/en/examples/*`.
- Confirm public discoverability: header `Ukázky` link after pages pass tests, or direct/sitemap-only access.
- Confirm no new email provider or `mailto:` in this slice.
- Confirm old `/demo/*` routes stay public for now.
- Confirm `/ukazky/nabidka-eshop/` is static SEO explanation with optional link to existing demo, not a checkout-like flow.

Verification performed for planning:

- Product repo was inspected read-only and was clean before planning.
- Project mesh packet for Radeq was retrieved and applied to the plan.
- Agent outputs were closed after completion.

Stop condition:

- Do not implement product files until owner approves the plan gates above. If implementation encounters a need for English pages, email/provider setup, analytics, API prefill, redirects, payment, upload, auth, storage, or a model-backed assistant, stop and request owner decision.

## 2026-06-12 Chatbot And Data-Safe Automation Examples Brainstorm

Date: 2026-06-12
Request or trigger: owner corrected the examples strategy: skip `/ukazky/firemni-web` because the public Radeq site itself is the website proof; keep a chatbot/pruvodce example, but do not make it an LLM/RAG chatbot. AI work should be mentioned as adjacent possibilities for light bots and automations, with the public value framed around security, data protection, saving money, and saving time.
Mode: ADVISORY_ONLY. No RadeQ product runtime files, GitHub remote, deployment, workflow, package/dependency files, lead API, D1, migrations, secrets, or Cloudflare configuration were changed.
Inputs:

- Codex GPT route agent: problem-oriented examples are clearer than seven equal demo categories; design should be cross-cutting; storage/warehouse should wait.
- Codex GPT security agent: the helper should be bounded, collect minimal data, warn against sensitive details, and hand off to a human/contact path when needed.
- Claude CLI: do not call a static decision tree an AI assistant; use a guide/questionnaire/configurator framing instead, and keep data security as a practical trust layer rather than an enterprise security route.
- Gemini CLI: a static JSON/rule-based helper can recommend relevant services, examples, and next steps; email handoff should be explicit and user-controlled.
- Decision Mesh: bot/RAG-like surfaces require source boundaries, answer policy, private-data boundaries, fallback, and no ungrounded answers. For this Radeq slice the bot is not a model-backed RAG surface, so the constraints become simpler rule/database boundaries.

Synthesis:

- Supersedes the earlier first-wave recommendation that used `/ukazky/firemni-web`. The homepage is the company-website example.
- Recommended first-wave public examples:
  - `/ukazky/chatbot` as a static chatbot/pruvodce demo: predefined questions, small static knowledge database, rule/decision tree answers, clear "I do not know / contact me" fallback, and optional email handoff.
  - `/ukazky/automatizace` as the practical time/money-saving route: forms, notifications, sheets/CRM handoff, status tracking, manual fallback, and visible error paths.
  - `/ukazky/nabidka-eshop` or `/ukazky/eshop` as an offer/category clarity route, not a promise of a full e-commerce platform.
- Do not launch `/ukazky/design` as a standalone first-wave route. Show design quality through all examples.
- Do not launch `/ukazky/skladovaci_system` unless there is a concrete audience and model scenario; keep it as a later internal-system example.
- Do not make `/ukazky/bezpecnost-dat` the primary demo unless the owner wants a separate trust page. Prefer repeating data-safety language across chatbot, automation, lead form, handoff, and FAQ.

Positioning:

- Use "chatbot", "pruvodce", or "konfigurator" language for the static demo.
- Mention AI as a possible extension: light AI bots, internal assistants, FAQ helpers, and automation copilots can be added when sources, data boundaries, and human fallback are defined.
- Avoid wording that implies the demo is already model-backed, autonomous, or trained on visitor input.
- Core promise: safer data handling, less manual copying, faster first answers, fewer repeated questions, and lower operational cost.

Acceptance criteria for any implementation:

- The chatbot works without an LLM, RAG service, model API, or private backend inference.
- The visible copy says the helper uses prepared answers/rules and that sensitive information should not be entered.
- No passwords, API keys, client records, contracts, or personal customer data are requested.
- Email/form handoff happens only after explicit user action and shows what will be sent.
- Unknown or sensitive questions produce a bounded fallback rather than invented answers.
- Security copy stays practical: minimization, control, clear handoff, and no unnecessary storage.
- Claims about saved time or money are framed as examples or mechanisms unless backed by real measured evidence.

## 2026-06-12 Examples Route Strategy Brainstorm

Date: 2026-06-12
Request or trigger: owner proposed separate examples routes such as `/ukazky/eshop`, `/ukazky/automatizace`, `/ukazky/web`, `/ukazky/chatbot`, `/ukazky/design`, `/ukazky/workflow`, and `/ukazky/skladovaci_system`, and asked to brainstorm what is most suitable.
Mode: ADVISORY_ONLY. No RadeQ product runtime files, GitHub remote, deployment, workflow, package/dependency files, lead API, D1, migrations, secrets, or Cloudflare configuration were changed.
Inputs:

- Current public preview: `https://sirradek.github.io/radeq/?v=558d228&brainstorm=examples`
- Current product branch: `codex/radeq-ab-c-preview` at `558d228`
- Existing demo infrastructure: `blog-docs`, `service-landing`, `admin-dashboard`, and `eshop-offers`
- Existing content proof themes: website structure, redesign/audit, e-shop offer, automation/data dashboard, chatbot, workflow prototype, design/handoff, web care

Advisory model notes:

- Claude recommended a first wave of `/ukazky/firemni-web`, `/ukazky/eshop`, and conditionally `/ukazky/chatbot` only if a live bounded demo exists. It recommended merging `/ukazky/workflow` into automation, dropping standalone `/ukazky/design`, and deferring storage/warehouse-system positioning.
- GPT route-strategy agent recommended first-wave examples as model outputs from website work: `/ukazky/firemni-web`, a renamed e-shop offer route such as `/ukazky/nabidka-eshop`, a renamed automation route such as `/ukazky/poptavky-data`, and a handoff/documentation route such as `/ukazky/predani-webu`. It recommended deferring chatbot, merging design into web/redesign, merging workflow into data/handoff, and strongly deferring storage system.

Synthesis:

- First wave should not expose seven equal products. It should prove the main website offer first, then adjacent add-ons.
- Recommended first wave:
  - `/ukazky/firemni-web` as the anchor page for complete small-business website delivery.
  - `/ukazky/nabidka-eshop` or `/ukazky/uprava-eshopu` instead of generic `/ukazky/eshop`, to avoid promising a full e-commerce platform.
  - `/ukazky/poptavky-data` or `/ukazky/formulare-data` instead of broad `/ukazky/automatizace`, to keep automation attached to website lead flow.
  - `/ukazky/predani-webu` as proof of sitemap, content map, launch checklist, SEO basics, and handoff.
- Deferred or merged:
  - `/ukazky/chatbot` should wait unless there is a bounded live demo; later use `/ukazky/ai-pomocnik`.
  - `/ukazky/design` should be part of `firemni-web` or a future `redesign-webu`, not a standalone offer for small businesses.
  - `/ukazky/workflow` is too abstract; merge into `poptavky-data` or `predani-webu`.
  - `/ukazky/skladovaci_system` should not launch as a public first-wave route. If used later, rename to `/ukazky/skladovy-system` or better `/ukazky/interni-prehled`, and keep it clearly secondary.

Acceptance criteria for any implementation:

- Examples are labeled as `modelová ukázka`, `bez klientských dat`, or equivalent.
- No fake logos, fake clients, fake metrics, or unsupported outcomes.
- Routes use static, SEO-readable DOM content with sections such as `zadání`, `rozhodnutí`, `výstup`, `předání`, and `co není součástí ukázky`.
- Header navigation does not become an examples/demo menu.
- Homepage primary CTA still routes to the website conversation.
- The public homepage remains fixed to `variant-a`; A/B/C/D demo state stays isolated to demo/review surfaces.

## 2026-06-12 Proof Examples Brainstorm

Date: 2026-06-12
Request or trigger: owner reviewed the latest GitHub Pages preview and said the current clearer homepage is missing examples of work. Owner requested brainstorming with Claude, Gemini, and GPT, comparing the latest version with older variants.
Mode: ADVISORY_ONLY. No RadeQ product runtime files, GitHub remote, deployment, workflow, package/dependency files, lead API, D1, migrations, secrets, or Cloudflare configuration were changed.
Inputs:

- Current preview: `https://sirradek.github.io/radeq/?v=558d228&brainstorm=1`
- Current commit: `558d228` on `codex/radeq-ab-c-preview`
- Older comparison points: `a649c4a`, `f36a81f`, and `591e2f8`, which included A/B/C/D proposal variants, `StudioProof`, `DemoWorlds`, shop demo, proof ledger, artifact grid, and handoff strip.

Model notes:

- Claude recommendation: latest version wins on offer clarity, but should regain proof through a static `Co jsem postavil` / work examples section after the approach and before or near pricing. Use before/after, factual scope cards, micro case study, live links only with permission, and process artifacts.
- GPT recommendation: add a compact `Ukázky práce a výstupů` section as proof support, not a new decision path. Keep hero, website path, and pricing first; add example cards for new website, redesign, clearer offer/e-shop, audit, and a small handoff strip.
- Gemini result: both attempts failed to answer the specific preview/work-examples task. The output drifted into generic fractional CTO, AI consulting, newsletter, and workspace-orientation advice, so it was not adopted.

Synthesis:

- Do not return the old A/B/C/D demo-first public homepage.
- Do reintroduce proof format from older versions: artifact grid, proof ledger, process evidence, safe demo cards, and handoff examples.
- Recommended next slice: add a static SEO-readable `Ukázky práce a výstupů` section after pricing and before About, plus optionally change the secondary hero CTA to `Ukázat ukázky výstupů`.
- Example cards should be labeled as `ukázka`, `modelový výstup`, or `bez klientských dat`; avoid fake logos, fake metrics, unsupported client claims, and demo links in the header.
- Acceptance checks for any implementation: homepage primary CTA remains contact, pricing stays before examples, no public style toggle, stored A/B/C/D state does not affect homepage, examples are DOM text, and no fake client evidence is introduced.

## 2026-06-12 GitHub Pages Brainstorm Preview

Date: 2026-06-12
Request or trigger: owner asked to upload the current RadeQ repositioning slice to a development Cloudflare or GitHub target so it can be brainstormed externally.
Mode: WRITE_ALLOWED for the RadeQ GitHub preview branch and Autopilot governance log. No Cloudflare production deploy, D1 binding, workflow file, package/dependency, lead API, migration, or secrets were changed.
Decision: use GitHub Pages rather than Cloudflare because the repository already has a working GitHub Pages workflow, while Cloudflare still has only `wrangler.example.toml` with placeholder D1 ID and no verified dev target.
Published product commit: `558d228710cf844ff8e8382912e822cd122a907d` on `codex/radeq-ab-c-preview`.
PR: `https://github.com/SirRadek/radeq/pull/2`
GitHub Actions run: `https://github.com/SirRadek/radeq/actions/runs/27399901003`
Preview URL: `https://sirradek.github.io/radeq/?v=558d228&brainstorm=1`
Verification:

- Workflow `Deploy to GitHub Pages` completed successfully for `558d228`.
- Public URL returned HTTP 200.
- Public HTML contained the new homepage H1 `Web pro malé firmy, kterému rozumíte vy i vaši zákazníci.`
- Public HTML contained `data-style-source="fixed"` and the pricing section, confirming the deployed artifact is the brainstorm repositioning slice.

Risk notes:

- This overwrites the GitHub Pages preview site with the selected branch artifact. It does not deploy to Cloudflare production or `radeq.cz`.
- Cloudflare remains blocked until a real Pages project, account ID, D1 binding, and rollback path are verified.

## 2026-06-11 Homepage Repositioning Supervisor Run

Date: 2026-06-11
Request or trigger: user asked Codex to act as supervisor, split the RadeQ offer repositioning into agent workstreams, use the Decision Mesh, log/evaluate the work, and improve through review loops.
Mode: WRITE_ALLOWED for the RadeQ product runtime at `C:\Users\sirok\Documents\Projects\radeq` and Autopilot governance records only. No lead API, D1, migrations, workflow files, package/dependency files, secrets, Cloudflare production configuration, GitHub remote push, or deployment mutation was changed.
Product branch: `codex/radeq-ab-c-preview`.
Scope: reposition public `/` and `/en/` homepages from A/B/C/D proposal/demo choice to a fixed complete-website offer for small businesses. The implementation hides the public style variant toggle, removes demo links from the main homepage path, adds a pricing section, separates three primary website paths from five secondary services, keeps demo routes directly addressable, and isolates stored A/B/C/D style state to demo routes.
Agent workstreams:

- Mesh/scope auditor: locked repository boundary, allowed files, stop conditions, and verification commands.
- Content/offer strategist: recommended complete-website hero, audit as paid entry product, CTA hierarchy, pricing, proof, and FAQ direction.
- Frontend/product scout: identified Astro/React route composition, existing A/B/C/D test coupling, and safe component boundaries.
- Design/asset explorer: recommended proof/checklist artifacts over fake logos, heavy assets, or mascot-led positioning.
- QA/SEO/eval planner: defined typecheck, unit, build, GitHub Pages build, E2E, audit, diff, SEO, mobile, and eval evidence gates.
- Code/spec reviewer: found untracked `PricingSection`, mixed secondary services, homepage demo link, and theme hydration timing; all were corrected.
- Post-fix reviewer: found stored demo style still controlling homepage; `BaseLayout` style-source isolation and regression coverage corrected it, then the reviewer confirmed no remaining finding for that issue.

Decisions:

- Public homepage H1/offer: complete websites/redesigns for small businesses.
- Paid entry product: `Audit webu s plánem` / `Website audit with a plan`.
- Primary CTA: `Chci probrat nový web` / `Discuss a new website`, routed to `#terminal`.
- A/B/C/D style matrix remains a demo/review surface only; public homepage is fixed to `variant-a` even when `radeq-style-variant` exists in localStorage.
- Secondary work such as care, quick fixes, forms/data automation, shop-offer adjustments, documents, and AI helpers appears below the primary website path.

Verification:

- `npm.cmd run typecheck` passed after final route-level style isolation.
- `npm.cmd test` passed: 7 files, 41 tests.
- `npm.cmd run test:e2e` passed: 9 Playwright tests, including homepage with stored demo style, demo route variants, mobile overflow, reduced motion, 3D activation, SEO/indexability, and i18n.
- `npm.cmd run build` passed for the static Astro build.
- `$env:DEPLOY_TARGET='github-pages'; npm.cmd run build` passed.
- `npm.cmd audit --audit-level=high` passed with 0 vulnerabilities.
- `git diff --check` passed with only Git CRLF conversion warnings in the working copy.
- Known residual warning: Vite still reports chunks larger than 500 kB after minification. This warning existed in the same Three.js/React-heavy surface class and was not resolved in this scope.

Changed RadeQ product files:

- `src/data/siteContent.ts`
- `src/pages/index.astro`
- `src/pages/en/index.astro`
- `src/components/CommandHeader.astro`
- `src/components/ServiceCatalog.astro`
- `src/components/PricingSection.astro`
- `src/components/ThemeModeToggle.tsx`
- `src/layouts/BaseLayout.astro`
- `src/pages/demo/[module].astro`
- `src/pages/en/demo/[module].astro`
- `src/styles/global.css`
- `tests/i18n-content.test.ts`
- `tests/i18n.spec.ts`
- `tests/smoke.spec.ts`

Governance/eval impact:

- Updated `docs/projects/radeq/architecture.md` to reflect fixed public homepage positioning, audit/CTA lock, no homepage demo-link path, and route-level stored-style isolation.
- Added `model-output-evals/records/2026-06-11-radeq-gpt-supervisor-homepage-repositioning.json` to record the GPT supervisor/subagent output as accepted after review and verification.

Rollback:

- In the RadeQ product repo, revert the uncommitted homepage repositioning changes on `codex/radeq-ab-c-preview` if the owner rejects this direction.
- In Autopilot, revert this work-log entry, the related architecture update, and the eval record if the product slice is abandoned.

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

## 2026-06-11 Owner Correction: Complete Websites Positioning

Date: 2026-06-11
Request or trigger: owner clarified that Radeq should not narrow the public offer to WordPress/WooCommerce; the primary direction is complete websites.
Mode: WRITE_ALLOWED for Autopilot governance records and the Radeq project mesh only. No Radeq product runtime files, GitHub remote, deployment, workflow, package files, lead API, D1, migrations, model assets, automation, or secrets were changed.
Scope: revise the project-mesh offer route, architecture note, and work-log continuity so the direct path reflects complete websites as the primary positioning.

Architecture impact: `docs/projects/radeq/architecture.md` now records the corrected positioning lock: complete websites for small businesses are the selected primary direction. WordPress, WooCommerce, Shopify, SEO, automation, AI helpers, PC support, migrations, and custom development remain secondary or implementation-specific paths until the complete-website offer and CTA hierarchy are clear.

Project mesh impact:

- Updated `docs/projects/radeq/decision-mesh/nodes/offer_positioning_conversion.yaml` from WordPress/WooCommerce repair positioning to complete-website positioning.
- Updated `docs/projects/radeq/decision-mesh/edges.yaml` so lead capture and SEO strategy point to complete-website context.
- Updated `docs/projects/radeq/decision-mesh/rules.yaml` so `RAD-OFFER-001` through `RAD-OFFER-005` protect the corrected direction.

Classification:

- Change request class: C direction change and owner correction.
- Primary goal: qualified complete-website leads, not narrow repair/check leads.
- Target users: small businesses needing a complete website or meaningful rebuild.
- Critical action: start a complete-website conversation through a concrete CTA.
- Open owner decision: paid entry product and exact CTA wording for the complete-website path.

Stop conditions for implementation:

- Do not implement homepage repositioning from the prior WordPress/WooCommerce repair niche.
- Do not lock the under-5000-CZK repair/check package as the first paid product without renewed owner approval.
- Do not edit product runtime until owner approves exact scope, target branch, files, and acceptance checks.

## 2026-06-11 Offer Advisory Brainstorm And Deploy Blocker

Date: 2026-06-11
Request or trigger: owner asked to force a joint advisory brainstorm with Claude, Google/Gemini, and DeepSeek, consider the owner's public-safe background, and optionally publish the current Radeq work to Cloudflare production for outside review.
Mode: WRITE_ALLOWED for Autopilot governance and model-output eval records only. No Radeq product runtime files, GitHub remote, Cloudflare production deployment, workflow, package files, lead API, D1, migrations, model assets, automation, or secrets were changed.
Scope: verify production deploy readiness, run bounded advisory review with available model tools, score usable model output, and preserve only redacted evaluation records.

Deployment status:

- Cloudflare production deploy is blocked. `npx wrangler@latest` is available, but Wrangler could not retrieve account IDs for the logged-in user; it reported expired or insufficient authentication/permissions and suggested re-authentication, `CLOUDFLARE_ACCOUNT_ID`, or account configuration.
- The Radeq product checkout remained clean at `591e2f8` on `codex/radeq-ab-c-preview`.
- The project contains only `wrangler.example.toml` with a placeholder D1 database ID, so production deploy is not safe until the real Cloudflare Pages project, production branch, D1 binding, and account ID are verified.

Advisory model status:

- Claude Code subscription CLI was available. The first prompt attempted to request WebFetch, so it was rejected and retried with a smaller stdin-only packet. The accepted advisory output scored 88 through the model-output route and was recorded as `model-output-evals/records/2026-06-11-radeq-claude-offer-brainstorm.json`.
- Gemini CLI was available. Initial attempts failed on trust/workspace behavior and Google policy checks; the accepted retry used an empty temp directory and a stdin-only packet. The accepted advisory output scored 82 and was recorded as `model-output-evals/records/2026-06-11-radeq-gemini-offer-brainstorm.json`.
- DeepSeek was not available as a local CLI, self-hosted model, or approved API path in this session, so no DeepSeek output was used or simulated.
- Local Qwen through Ollama was available and briefly checked as a no-cost fallback, but the output was weak and was not adopted as strategic guidance.

Advisory synthesis:

- Keep the primary offer centered on complete websites for small firms and sole traders, but sell the buyer's outcome as clarity, calm, and a web the owner understands after handoff.
- Use "digital order" or "digital peace" as a secondary differentiator; do not let it replace the complete-website offer.
- Show talent through Radeq's own execution, model solution demos, clear process artifacts, simple checklists, and educational notes rather than unsupported client case studies.
- Avoid revenue guarantees, top-position SEO promises, broad "complex digital solution" phrasing, and technical acronym-heavy copy.
- Add first paid-product clarity before implementation: main website path, entry consultation or audit path, and optional support/automation path.

Model-output evaluation status:

- `npm.cmd run model-output:validate` passed after adding the advisory eval records: 5 checked files, 3 checked records, 0 errors.
- Targeted tests passed: `npm.cmd test -- tests/delivery-system/model-output-evaluation-policy.test.ts tests/delivery-system/model-output-eval-validation.test.ts` returned 2 files and 12 tests passing.

Recommended next work slice:

- Do not deploy production until Cloudflare account/auth, Pages project name, production branch/domain mapping, D1 binding, and rollback path are verified.
- Implement the homepage repositioning only after owner locks the exact first-screen H1/H2, paid entry product, CTA hierarchy, and allowed files for the Radeq product repository.

## 2026-06-11 Business Positioning Mesh Route

Date: 2026-06-11
Request or trigger: owner asked to process the business/positioning addendum through the project mesh and create a direct path if none existed.
Mode: WRITE_ALLOWED for Autopilot governance records and the Radeq project mesh only. No Radeq product runtime files, GitHub remote, deployment, workflow, package files, lead API, D1, migrations, model assets, automation, or secrets were changed.
Scope: classify the addendum as a product direction change before implementation; add a project-mesh route for primary offer positioning, first paid product, CTA hierarchy, homepage scope, secondary-service containment, and A/B/C/D usage.

Architecture impact: superseded by the later 2026-06-11 owner correction above. This entry initially recorded the addendum's WordPress/WooCommerce repair direction, but that direction is no longer the selected primary positioning. The active contract is complete websites.

Project mesh impact:

- Added `docs/projects/radeq/decision-mesh/nodes/offer_positioning_conversion.yaml`.
- Updated `docs/projects/radeq/decision-mesh/edges.yaml` so the offer route defines the static site purpose, drives lead capture, sets SEO/content strategy, and constrains optional effects.
- Updated `docs/projects/radeq/decision-mesh/rules.yaml` with `RAD-OFFER-001` through `RAD-OFFER-005`.

Classification:

- Project type: public marketing/service website.
- Primary goal at time of this addendum review: qualified repair/check leads for WordPress and WooCommerce technical help. Superseded by owner correction to complete websites.
- Target users at time of this addendum review: small businesses with broken or risky WordPress/WooCommerce sites. Superseded by owner correction to small businesses needing complete websites.
- Critical action at time of this addendum review: request a website/e-shop repair or technical check. Superseded by owner correction to start a complete-website conversation.
- Logic priority: high because offer, risk handling, and lead intake must be clear before visual polish.
- Design priority: medium-high, serving trust and conversion rather than public theme exploration.
- Motion level: optional enhancement only.
- Risk level: high until production target, lead capture, privacy minimization, and abuse controls are resolved.
- Change request class: C direction change, because it narrows the public offer and changes the homepage success criteria.

Stop conditions for implementation:

- Do not edit product runtime until owner approves an implementation scope with exact files and target branch.
- Superseded by owner correction: do not let the homepage read as a broad unrelated portfolio, but do not narrow the primary offer to WordPress/WooCommerce repairs. The active primary direction is complete websites.
- Do not make A/B/C/D the main public decision mechanism unless owner explicitly changes that scope.
- Do not deploy, merge, push, or mutate remote services without explicit owner approval.

Recommended next work slice: owner should approve a scoped product brief for homepage repositioning on the Radeq product branch, after release target and lead-capture deployment constraints are named.

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
