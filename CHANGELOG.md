# Changelog

All notable changes to the Autopilot control plane are documented here.

## [Unreleased]

### Added

- Business Intelligence operating model
  (`docs/autopilot/business-intelligence-operating-model.md`) with an Opus-led
  decision analyst, a Codex feasibility opponent (draft), a redacted Gemini
  strategic/SEO opponent, and a local Qwen private-data worker.
- Domain-grouped prompt lanes: `07-business/` (strategy, strategic opposition,
  feasibility opposition), `08-design/` (visual build, critique from render),
  `09-analysis/` (impact-risk, independent review), and `10-research/`
  (research synthesis, corpus scan). Each lane pairs a decision-owner with an
  opponent.
- Codex feasibility-opposition consult handoff packet and a `05-evaluation/`
  business-lane eval fixture.
- First-class operating models for the analysis and research layers
  (`analysis-intelligence-operating-model.md`,
  `research-intelligence-operating-model.md`), giving the four expanded domains
  (business, design, analysis, research) governance parity.
- Copywriting layer completing the last model-policy row: a `copywriting`
  task_type, `copywriting-operating-model.md`, and the `11-copywriting/` lane
  (Opus copywriter, Gemini brand-voice variants, Qwen localization).
- Two-axis business/analysis routing (capability plus data-privacy) so real data
  stays with owner-subscription or local models and free-cloud stays redacted.

### Changed

- Recorded the 2026-06-19 model role taxonomy (Opus architect/supervisor/decision
  analyst, Codex worker/logic/technical opponent, Gemini creative/strategic/SEO
  opponent, Qwen local private worker) and linked the business role in the
  delivery-system model policy.
- Reconciled `product-design-os/rules/multi-agent-routing.md` so Opus is
  architect and Codex is implementer/logic/technical opponent, matching the
  2026-06-19 decision.

## [0.2.0] - 2026-06-07

### Added

- Capability-routed Decision Mesh with project-specific mesh boundaries.
- Product & Design OS governance, recipes, pattern and asset registries,
  design-reader utilities, visual QA, taste memory, and source/license rules.
- Versioned prompt library for GPT, Gemini, Claude, Qwen, evaluation, and
  supervisor workflows.
- Local-worker, token-efficiency, model-spend, design-intelligence, graphic
  production, protective-supervision, and observability policies.
- Read-only MCP routing for mesh, product/design, model, worker, and
  supervision decisions.
- Report-first Codex lifecycle hooks with redacted local evidence.
- GitHub issue/PR templates and verification workflow.
- Expanded static Autopilot command center and automated test coverage.

### Changed

- Strengthened repository separation between Autopilot and supervised product
  runtimes.
- Extended architecture records, work logs, project registry, and delivery
  governance.
- Expanded verification to mesh generation, Product & Design OS validation,
  type checking, unit tests, static build, and Playwright checks.

### Security

- Kept remote mutation behind explicit owner approval.
- Added redaction, secret-handling, source-authority, and no-paid-cloud-default
  rules.
- Kept project runtime logs, credentials, and ignored local hook state outside
  the release.
