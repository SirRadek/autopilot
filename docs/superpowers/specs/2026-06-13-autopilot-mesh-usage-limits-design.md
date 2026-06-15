# Autopilot Mesh Usage Limits Design

Date: 2026-06-13
Status: proposal-only

## 2026-06-13 Mesh Deployment Decisions

- Deploy this as Autopilot root control-plane mesh documentation under `docs/autopilot/decision-mesh/`.
- Do not store provider usage/advisory-run records inside ClientOps CMS workflow state.
- Unknown provider status, missing model output, provider timeout, or unapproved paid route blocks the advisory workflow.
- Claude and Gemini outputs remain advisory; GPT/Codex/local repo evidence remains primary for implementation.
- Broad repository context may be used only after secret/build/vendor artifacts are excluded.
- Advisory adoption requires local verification, source pointers, tests, official docs, or human acceptance.
- This control-plane work must not block deterministic ClientOps opportunity ingest/review/purge work.
Scope: Autopilot mesh control plane

## Goal

Define a separate control-plane proposal for model routing, usage-limit awareness, and advisory-output quality gates across the Autopilot mesh.

This work is intentionally separate from the CZ/SK IT Opportunity Monitor. The opportunity monitor may consume advisory model outputs later, but it must not own global model routing, provider limits, or mesh policy.

## Separation From Opportunity Monitor

The opportunity monitor work owns:

- source configuration
- demand portal ingestion
- opportunity storage and review
- short-term local contact retention
- purge-after-response and 14-day expiry behavior
- conversion to lead/task after human action

The Autopilot mesh usage-limits work owns:

- provider availability checks
- session and usage-limit status
- model routing policy
- model quality thresholds
- advisory-output adoption/rejection records
- cost-aware escalation
- control-plane stop conditions

No implementation in the opportunity monitor should depend on completing this mesh proposal.

## Model Routing Goals

- Keep routine work cheap.
- Escalate to stronger models only when quality, risk, or disagreement requires it.
- Track usage limits and provider availability before routing work.
- Treat all model outputs as advisory unless explicitly accepted into project state by code, tests, or human review.
- Avoid paid API routes unless the owner explicitly approves them.

## Proposed Relative Weights

- Codex/GPT: primary workhorse, relative weight `5x`.
- Claude: high-quality architecture/security/review arbiter, relative weight `1x`.
- Gemini/other advisors: low-cost second opinion, relative weight `0.5x`.

These weights are routing preferences, not source-of-truth authority.

## Quality Thresholds

- Routine accepted output requires at least 90% internal quality score.
- Critical architecture, security, legal, privacy, or data-retention decisions require 95-100% confidence from a stronger model or human review.
- If a cheaper model stays above 90% on a task class, reduce stronger-model calls for that class.
- If models materially disagree, route to human review or stronger-model arbitration.

## Usage-Limit Checks

Before a model-advisory run, record:

- provider
- model
- auth mode
- provider availability
- usage-limit status
- rate-limit status
- estimated cost class
- reason for routing

After a model-advisory run, record:

- output artifact presence
- quality score
- confidence score
- adopted or rejected state
- rejection reason when applicable

## Stop Conditions

- Provider availability is unverified.
- Provider returns a session/capacity/rate limit and no alternate approved provider is selected.
- A multi-model advisory flow silently drops an unavailable provider.
- A paid API route is required without owner approval.
- A lower-trust model receives broad private context without explicit scope reduction.
- A model output is treated as source of truth without human or local verification.

## Suggested Future State Fields

- `provider`
- `model`
- `authMode`
- `usageLimitStatus`
- `rateLimitStatus`
- `estimatedCostClass`
- `routingReason`
- `qualityScore`
- `confidenceScore`
- `outputArtifactPresent`
- `adopted`
- `rejectedReason`

## Verification Gates For Future Implementation

Future implementation should be accepted only when:

- Provider status can be recorded without exposing secrets.
- Session/capacity limits become a blocked/waiting state, not a vague failure.
- Advisory output artifacts are checked before downstream adoption.
- Provider fallback is explicit and logged.
- Paid API routing requires owner approval.
- Model-output adoption has an auditable reason.
