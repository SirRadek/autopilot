# Advisory Run Lifecycle

Advisory runs are control-plane evidence. They do not directly change supervised project state.

Lifecycle states:

- `requested`
- `context_pack_prepared`
- `provider_status_checked`
- `route_selected`
- `provider_run_started`
- `provider_run_blocked`
- `artifact_received`
- `output_missing`
- `output_scored`
- `adoption_proposed`
- `adopted`
- `rejected`
- `human_review_required`

Required record fields:

- `runId`
- `task`
- `targetProject`
- `provider`
- `model`
- `accessLane`
- `contextPackRef`
- `redactionSummary`
- `providerStatusRef`
- `startedAt`
- `finishedAt`
- `runStatus`
- `modelOutputPresent`
- `artifactRef`
- `qualityScore`
- `adoptionStatus`
- `adoptionReason`
- `acceptedChanges`
- `rejectedReason`
- `verifier`
- `evidenceRefs`

Adoption rules:

- Adopted advice must cite local evidence, a test, an official/source document, or a human decision.
- Rejected or off-target advice remains useful as failure evidence when the reason is recorded.
- Raw model output must not become a prompt default, code change, project state change, or mesh rule without evaluation.
- Advisory records must not store private raw context, secrets, database dumps, or contact data.

Current evidence from 2026-06-13:

- Claude full-repo advisory succeeded after a retry with read-only tools and produced concrete mesh/code findings.
- Gemini full-repo advisory completed but focused mainly on workflow task API automation risks; its findings were locally verified before adoption.
- One earlier Claude full-context attempt timed out and was treated as a failed provider run, not as advisory content.
