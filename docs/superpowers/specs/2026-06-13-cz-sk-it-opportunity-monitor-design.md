# CZ/SK IT Opportunity Monitor Design

Date: 2026-06-13
Status: approved-for-implementation-scope
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
