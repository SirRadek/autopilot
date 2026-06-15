# CZ/SK IT Opportunity Monitor Design

Date: 2026-06-13
Status: generic-web-source-live-runner-implemented

## 2026-06-13 Mesh Deployment Decisions

- Deploy through the ClientOps project mesh, not the Autopilot root mesh.
- Keep the first implementation deterministic-only; model summaries and fit reasons are advisory.
- Do not require the Autopilot usage-limit control plane before fixture ingest, CMS review, dedupe, and purge work.
- Do not create leads directly from imported opportunities. Human review converts an opportunity into a lead or linked workflow task.
- Use `OPPORTUNITY_INGEST_TOKEN` for source-row ingest. Do not reuse `MESH_SERVICE_TOKEN`.
- Opportunity workflow events must be PII-free and are audit evidence only.
- `opportunity-items.status`, `personalDataExpiresAt`, and `personalDataPurgedAt` own lifecycle and retention state.
- Live source runs remain blocked until scrapeflow contract, allowed-host validation, fixture ingest, dedupe, and purge tests pass.

## 2026-06-14 Local Fixture Implementation

- Added Payload collections for `opportunity-sources`, `opportunity-runs`, `opportunity-items`, and `opportunity-reviews`.
- Added protected `POST /api/opportunities/ingest` using `OPPORTUNITY_INGEST_TOKEN`.
- Added mesh-authenticated `POST /api/opportunities/purge` using `MESH_SERVICE_TOKEN`.
- Added fixture JSON and `scripts/smoke-opportunities.ps1`.
- Added tests for allowed-host validation, fixture import, idempotent replay, duplicate skip, collision block, PII-free events, and idempotent purge.
- Live source runs remain blocked until a real source is reviewed and fixture smoke is run on the target runtime.

## 2026-06-14 Generic Live Web-Source Implementation

- Added default live source key `reviewed-web-cz-it`.
- Added mesh-token-gated `POST /api/opportunities/live/web-source`.
- The runner accepts either pre-normalized `items` or explicit allowlisted `urls`.
- URL mode checks enabled source, `termsReviewedAt`, `robotsReviewedAt`, allowed hosts, and bounded URL count before fetch.
- HTML pages are mapped into the existing opportunity ingest contract.
- Hlidac Statu remains a disabled optional adapter; it is not required for the default live path.
- Provider/web output is still evidence only; manual review remains required before outreach or lead/project conversion.

## 2026-06-14 Source Date Relevance Update

- `opportunity-items` now stores `sourceStatus`, `sourceUpdatedAt`, and `deadlineAt` separately from `publishedAt`.
- Generic HTML mapping extracts localized CZ/SK/IT dates from labels such as `Datum zadani`, `overeno dne`, `Termin pro podani nabidek`, `Termin pre podanie ponuk`, and `Lehota na predkladanie ponuk`.
- Private demand portals should be filtered by `publishedAt` or `sourceUpdatedAt`, with `discoveredAt` retained as the audit time for relative dates.
- Public procurement portals should be filtered by `deadlineAt`; expired deadlines can be imported only as closed evidence, not actionable opportunities.
- High-priority generic web-source candidates with public date evidence:
  - Webtrh `/poptavky/`
  - ePoptavka `/it-software`
  - Poptavky.cz `/poptavky/it-software`, `/poptavky/webove-aplikace`, `/poptavky/web`
  - 123dopyt.sk `/internet-web-design` and `/verejne-dopyty/it-software`
  - MojeDopyty.sk `/dopyty/pocitace-software`
  - Poptavej.cz `/poptavky/informacni-technologie`
  - AAAPoptavka.cz `/poptavky/software` and `/poptavky/pocitace`
- Secondary generic candidates:
  - Zakazky-pro-firmy.cz `/it-software/`
  - TrhPoptavek.cz `/software`
  - Sluzby.cz web zakazky, but only after strict stale-date filtering because many detail pages are historic.
- Public procurement candidates need source-specific adapters:
  - NEN `nen.nipez.cz/verejne-zakazky`
  - VVZ/NIPEZ `vvz.nipez.cz`
  - UVO `uvo.gov.sk`
  - JOSEPHINE `josephine.proebiz.com`
  - eZakazky.sk
  - TED `ted.europa.eu`
  - Italian procurement portals such as Acquisti in Rete PA/MePA and ANAC-linked notices.
Project: ClientOps CMS

## Goal

Build a local-first monitor for Czech and Slovak demand portals that saves review time by collecting relevant opportunity links, extracting enough public contact context to answer, ranking fit for offered IT services, and deleting personal/contact data after it is no longer needed.

The monitor is for practical commercial opportunity review, not for bulk content replication. It should capture enough to decide and respond, while preserving links and audit evidence.

## Scope

In scope for the first implementation:

- Czech and Slovak demand portals such as Webtrh, ePoptavka, Poptavej, Poptavky.cz, 123dopyt, MojeDopyty, NajDopyt, and similar portals after source review.
- Service categories: IT, websites, web repairs, redesign, design, SEO, automation, consultation, software, CRM/integrations, migrations, installations, PC builds, and support.
- Local short-term storage of contact data needed to answer an opportunity.
- A 14-day retention window for personal/contact data if no response is sent earlier.
- Immediate purge or anonymization of personal/contact data after a response is sent.
- A manual review workflow before any response or lead/project creation.

Out of scope for the first implementation:

- Claude API or Anthropic API key setup.
- Automatic responses to opportunities.
- Scraping behind login, paywalls, anti-bot barriers, or disallowed access patterns.
- Treating model output as canonical state.
- Global Autopilot mesh model-routing, usage-limit tracking, or provider policy work.

## Architecture

Use `scrapeflow` as the source collection runner and ClientOps CMS as canonical storage and review UI.

Flow:

```text
portal source
-> scrapeflow allowlisted fetch/search
-> normalized candidate rows
-> ClientOps CMS ingest endpoint
-> opportunity inbox
-> manual review
-> optional response / lead / project task
-> contact purge after response or 14 days
```

ClientOps CMS owns canonical state, review status, retention status, workflow events, and any conversion to existing lead/project/task flows.

`scrapeflow` owns fetching, source allowlists, bounded reads, parser/source adapters, and normalized output. It should not write directly into `leads`.

## CMS Data Model

Add collections for opportunity work:

- `opportunity-sources`
- `opportunity-runs`
- `opportunity-items`
- `opportunity-reviews`

`opportunity-sources` stores portal configuration:

- `sourceKey`
- `name`
- `country`
- `baseUrl`
- `allowedHosts`
- `sourceType`
- `termsReviewStatus`
- `enabled`
- `manualOnly`
- `fetchLimit`
- `notes`

`opportunity-runs` stores one collection run:

- `source`
- `runId`
- `idempotencyKey`
- `status`
- `startedAt`
- `finishedAt`
- `query`
- `category`
- `rowCount`
- `insertedCount`
- `duplicateCount`
- `blockedCount`
- `error`
- `scrapeflowVersion`
- `configHash`

`opportunity-items` stores the reviewable opportunity:

- `source`
- `run`
- `sourceLabel`
- `rowFingerprint`
- `canonicalUrl`
- `title`
- `rewrittenSummary`
- `serviceCategory`
- `fitScore`
- `fitReasons`
- `status`
- `publishedAt`
- `deadlineAt`
- `location`
- `budgetText`
- `requesterName`
- `requesterInitials`
- `requesterCompany`
- `requesterIco`
- `contactEmail`
- `contactPhone`
- `contactUrl`
- `personalDataExpiresAt`
- `personalDataPurgedAt`
- `rawSnippet`
- `normalizedPayload`
- `workflowTask`
- `notes`

`opportunity-reviews` stores human decisions:

- `opportunity`
- `decision`
- `reviewer`
- `reviewedAt`
- `responseSentAt`
- `linkedLead`
- `linkedProject`
- `linkedTask`
- `notes`

## Status Model

Opportunity item statuses:

- `new`
- `reviewing`
- `interesting`
- `respond`
- `responded`
- `converted`
- `ignored`
- `blocked`
- `expired`
- `purged`

Personal/contact data retention status is represented by `personalDataExpiresAt` and `personalDataPurgedAt`.

## Data Handling And Retention

The system may temporarily store public contact data when needed to answer a demand:

- name
- initials
- company name
- ICO
- email
- phone
- contact URL
- short raw snippet around the opportunity

Retention rule:

- If a response is sent, purge personal/contact fields immediately after recording `responseSentAt`.
- If no response is sent, purge personal/contact fields after 14 days.
- Keep non-personal audit data after purge: source portal, URL, title, service category, rewritten summary, fit score, response status, and date metadata.
- Keep a non-reversible contact hash only if needed to prevent repeated outreach without retaining the address or name.

The purge operation must remove or anonymize:

- `requesterName`
- `requesterInitials`
- `contactEmail`
- `contactPhone`
- contact-bearing `rawSnippet`
- contact-bearing raw payload fields

## Ingestion Contract

Create a protected CMS ingest endpoint for normalized opportunity imports.

Initial endpoint:

```text
POST /api/opportunities/ingest
```

Security and behavior:

- Requires service token or authenticated admin session.
- Rejects requests before side effects if auth, content type, schema, or source allowlist validation fails.
- Requires `idempotencyKey`.
- Replayed import returns the existing run and counts.
- Row identity is `sourceKey + rowFingerprint`.
- `canonicalUrl` is secondary dedupe evidence.
- Payload size is bounded.
- Source host must match the configured allowlist.
- Dedupe collision creates a blocked item/event instead of overwriting.

Expected input:

- source key and run metadata
- normalized rows from `scrapeflow`
- row fingerprint
- canonical URL
- title
- normalized payload
- optional extracted contact fields

## Ranking And Filtering

The first pass uses deterministic scoring before any model critique.

Positive categories:

- IT support
- websites
- web repair
- redesign
- UX/UI/design
- SEO
- content optimization
- automation
- AI/chatbot
- CRM/integration
- data work
- migration
- installation
- PC build
- consultation

Negative signals:

- unrelated construction work
- commodity-only purchase
- job employment offer
- inaccessible login-only detail
- disallowed source terms
- unclear or missing source URL
- suspicious contact data

Fit score should be explainable. Store reasons such as:

- `mentions web redesign`
- `needs SEO`
- `automation/integration fit`
- `IT support request`
- `AI/chatbot possible`
- `near deadline`
- `missing contact`
- `source access blocked`

Model-generated summaries or recommendations are advisory only. They can rewrite the visible description and propose fit reasons, but a human must decide whether to respond.

## UI Expectations

The first CMS UI can remain Payload admin-native.

Useful admin columns:

- title
- source
- serviceCategory
- fitScore
- status
- deadlineAt
- personalDataExpiresAt
- createdAt

Useful actions can initially be status edits:

- mark interesting
- mark respond
- mark ignored
- mark blocked
- mark responded
- purge personal data
- convert to lead/task

## Workflow Events

Create workflow events for:

- opportunity import run started
- opportunity imported
- opportunity duplicate skipped
- opportunity collision blocked
- opportunity review decision
- opportunity response recorded
- opportunity converted
- opportunity personal data purged
- source blocked

Events are audit evidence and do not replace current state fields.

## Verification Gates

Implementation is acceptable when:

- At least one local fixture source imports relevant IT opportunity rows.
- Ingest rejects unauthenticated requests.
- Ingest rejects malformed rows.
- Replaying the same idempotency key returns the existing run.
- Duplicate rows do not create duplicate opportunities.
- Dedupe collisions create blocked evidence.
- Contact fields get `personalDataExpiresAt` set to 14 days after import.
- Marking an item as responded purges personal/contact fields.
- A purge helper can purge expired contact data.
- Tests cover filtering, ingestion, dedupe, response purge, and retention purge.
- No imported item writes directly to `leads` without human action.

## Deployment Plan

Deploy locally first:

- Add CMS collections and library helpers.
- Add protected ingest route.
- Add tests.
- Add seed/example source records.
- Add a local fixture-based smoke script before live source runs.

Live source runs remain manual until source terms, failure rates, and retention behavior are verified.

## Open Decisions

- Which portal should be the first live source after fixture validation.
- Whether live source terms review is recorded manually in CMS or in docs only.
- Whether conversion from opportunity to lead should create a synthetic lead or a task linked only to the opportunity.
