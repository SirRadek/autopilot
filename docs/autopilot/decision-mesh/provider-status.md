# Provider Status

Provider status is checked before an advisory model run is routed.

Canonical fields:

- `provider`: `openai`, `anthropic`, `google`, `local`, or another explicit provider id.
- `model`: model or CLI route requested.
- `accessLane`: `local`, `subscription_cli`, `subscription_interactive`, `api_key`, `app_connector`, or `self_hosted`.
- `availability`: `unknown`, `checking`, `available`, `degraded`, or `unavailable`.
- `usageLimitStatus`: `unknown`, `within_limit`, `nearing_limit`, `session_limited`, `quota_exhausted`, or `billing_required`.
- `rateLimitStatus`: `unknown`, `clear`, `throttled`, `retry_after`, or `hard_blocked`.
- `capacityStatus`: `unknown`, `normal`, `degraded`, or `capacity_limited`.
- `costClass`: `free`, `included`, `low_paid`, or `high_paid`.
- `paidRouteApproved`: boolean.
- `lastCheckedAt`: ISO timestamp.
- `nextEligibleAt`: ISO timestamp when the provider may be tried again.
- `evidenceRef`: local source pointer for the status evidence.
- `routingReason`: short reason for selecting or blocking the route.

Rules:

- `unknown` availability blocks automated routing.
- `billing_required`, `quota_exhausted`, `hard_blocked`, and `capacity_limited` block the provider unless an approved fallback exists.
- Paid API or self-hosted routes require owner approval before use.
- Subscription CLI access is not API-credit availability.
- A provider CLI error, prompt echo, shell transcript, or timeout is not model output.
- Broad private repo context is allowed only for trusted providers and only after secrets/build/vendor artifacts are excluded.

Current trust weighting:

- Local evidence and tests: primary.
- GPT/Codex repo work: primary implementer, still verified locally.
- Claude: high-trust architecture and security critique when provider output is present.
- Gemini: useful brainstorming and edge-case review, but claims are verified before adoption.
- Other providers: bounded advisory only unless separately approved.
