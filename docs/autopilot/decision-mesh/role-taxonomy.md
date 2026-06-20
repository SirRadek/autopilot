# Role Taxonomy

This makes explicit the decision-owner plus opponents pattern and the two-axis
routing that sit on top of `routing-policy.md` and the `@/lib/lane-selector`
order. It complements, and does not duplicate, `model-governance.md` (the
mechanics: spend, lanes, advisory boundary) and `routing-policy.md` (the route
order).

All roles produce advisory output only. Payload/Postgres and a human decision
remain canonical; nothing here authorizes a model to write canonical state.

## Roles

Provider-neutral roles, named to the current vendor set. Routing still selects by
fit (`routing-policy.md`); these roles describe what each model is asked to own
once selected.

| Role | Model | Owns | Privacy |
| --- | --- | --- | --- |
| Decision owner | Opus (Claude) | architecture, supervision, synthesis to a recommendation, final review and check-off | canonical data in bounds |
| Implementation + technical opponent | Codex (GPT) | bounded implementation, logic and feasibility opposition, edge cases | canonical data in bounds |
| Strategic opponent | Gemini | alternative failure modes, broad brainstorming, originality and SEO/discoverability angle | redacted only |
| Private worker | Qwen (local) | offline bounded work, private-data crunching, retrieval | fully local |

## Pattern

One decision-owner plus opponents from different angles:

- Opus owns the decision and the synthesis; it does not write canonical state and
  does not approve its own work.
- Codex opposes from the technical/logic side; Gemini opposes from the
  strategic/creative side on redacted context.
- The opponent that reviews is never the producer of what it reviews, and the
  human owner approves adoption.

This maps onto `routing-policy.md` steps 3 (Claude advisory) and 4 (Gemini
advisory), and onto the advisory boundary in `model-governance.md`.

## Two-Axis Routing

Routing decisions use two axes, not one:

1. **Capability** — the existing fit order in the lane selector:
   `eligibility -> privacy_fit -> task_fit -> cost_state -> recent_quality -> availability`.
2. **Data privacy** — who may see unredacted data:
   - Canonical, customer, and private data (Payload/Postgres records, contacts,
     leads, secrets) may be processed only by owner-subscription models
     (Opus, Codex) within their boundaries, or by the local worker (Qwen).
   - Free-cloud advisory models (Gemini and others) receive a redacted packet
     only. This reinforces the lane selector's `privacy_fit` gate and the
     advisory-boundary redaction rule (durable `prompt_path` and routing
     metadata only, never the raw prompt or canonical data).

Routing canonical or private data to a free-cloud model is a stop condition; see
`stop-conditions.md`.

## Adoption

Every role's output stays advisory until a documented decision adopts it. The
advisory-to-canonical conversion is the explicit decision event described in
`model-governance.md` (the `CanonicalDecision` contract and the server-only
advisory executor), not any model's own claim.

## Scope Note

ClientOps routes by task fit. The broader domain framings (business, design,
analysis, research, copywriting) explored in the archived control plane remain
migration source material only; they are not active ClientOps lanes unless
ClientOps scope expands and they are re-homed here through a normal adoption
decision.
