# Multi-Agent Autonomous Delivery System Design

Date: 2026-05-13
Status: planning baseline
Source: user-provided architecture brief
Project slug: `multi-agent-autonomous-delivery-system`

## Purpose

The system is a governed autonomous delivery platform, not a coding assistant. Its job is to move product requests through business analysis, architecture, bounded execution, testing, review, governance, delivery, monitoring, memory, and optimization with durable evidence.

The first implementation must be documentation-first and read-only. Autonomous execution is a later phase after contracts, project architecture records, ledgers, and gates are stable.

Autopilot is a separate control-plane project. It can create and supervise other projects, but each created or supervised product must have its own root directory and Git repository.

## Recommended Approach

Use a phased governance-first architecture:

1. **Foundation:** project architecture records, work logs, decision ledger, issue ledger, role catalog, gate catalog, and workflow contracts.
2. **Read-only command center:** typed registries rendered in the existing Astro app, showing project state, gates, ledgers, and run history without executing remote mutations.
3. **Plugin-assisted inventory:** GitHub, Linear, Vercel, Cloudflare, Docket, and local docs can feed reviewed snapshots, but no connector output becomes source of truth without supervisor review.
4. **Execution engine research:** compare Vercel Workflow DevKit, Cloudflare Workflows/Agents/Durable Objects, GitHub Actions, Codex automations, and local queues before implementing durable execution.
5. **Controlled execution MVP:** allow only bounded local tasks with explicit `WRITE_ALLOWED`, separate review, test evidence, and governance gate approval.
6. **Autopilot monitoring:** monitor runs, failures, stale architecture, missed reviews, incidents, and lessons. Autopilot does not own business scope or approve delivery.

Rejected alternatives:

- **Immediate durable workflow engine:** too risky before governance contracts and memory are normalized.
- **Agent-only chat workflow:** not audit-friendly enough and weak for long-term consistency.
- **Remote-first automation through GitHub/Linear/Vercel:** premature because credentials, scope, and rollback policies are not yet modeled.

## System Layers

```text
User / Product Request
  -> Business Layer
  -> Orchestrator Layer
  -> Analysis + Architecture Layer
  -> Execution Layer
  -> Testing Layer
  -> Review Layer
  -> Copywriting + UX Validation
  -> Governance Layer
  -> Merge / Delivery
  -> Autopilot Supervisor
  -> Memory + Optimization + Lessons
```

## Layer Responsibilities

Business Layer:

- translate requests into product outcomes
- validate ROI and user value
- control scope creep
- align work to roadmap and product consistency

Orchestrator Layer:

- break tasks into dependency graph
- route work to bounded agents
- parallelize independent tasks only when write scopes do not overlap
- collect outputs and route to testing, review, or rework
- never approve its own outputs

Architecture Layer:

- own technical boundaries, dependency flow, integration contracts, and maintainability rules
- update project architecture records before changes are delivered
- reject silent architecture changes

Analysis Layer:

- produce risk, assumption, dependency, edge-case, unknown, and recommendation summaries before implementation
- trigger docs verification for current technical facts

Execution Layer:

- implement only assigned bounded scopes
- use model policy by task class, not hardcoded provider dependency
- treat small models such as Qwen Coder candidates as optional micro-workers only after local availability and task suitability are verified

Testing Layer:

- own unit, integration, regression, E2E, acceptance, performance, and security-impact evidence
- never change business scope or approve architecture

Review Layer:

- run code, security, architecture, UX, and scope reviews
- separate reviewer from implementer

Copywriting + Content Layer:

- validate UI text, localization, tone, accessibility wording, CTA clarity, and technical documentation quality

Governance Layer:

- enforce architecture compliance, plan alignment, best practices, acceptance criteria, testing status, security review, and scope validation
- produce structured gate results

Autopilot Supervisor:

- monitor runs, timeout, failures, stale reviews, incidents, and lessons
- investigate and propose recovery
- never own product scope, approve delivery, or bypass governance

Memory Layer:

- maintain project memory, decision memory, lessons memory, architecture memory, and workflow memory
- keep detailed run artifacts out of the main working context

## Required Data Contracts

Decision ledger:

```yaml
decision_id:
type:
context:
decision:
reasoning:
alternatives:
impact:
approved_by:
related_tasks:
```

Issue ledger:

```yaml
issue_id:
severity:
found_by:
related_agent:
description:
expected:
actual:
decision:
fix_owner:
status:
lesson_learned:
```

Gate result:

```yaml
gate_result:
  status:
  checked_against:
  issues:
  decision_reason:
  next_action:
```

Analysis output:

```yaml
analysis:
  risks:
  assumptions:
  dependencies:
  edge_cases:
  unknowns:
  recommendations:
```

## Governance Rules

- Nobody approves their own work.
- Functionality passing tests is necessary but not sufficient.
- Every problem gets logged.
- Architecture has priority over implementation speed.
- Scope changes are explicit and logged.
- Autopilot monitors and recovers; it does not steer product.
- Workers are bounded, isolated, and reviewed independently.
- Inline fixes are allowed only when small, non-architectural, in-scope, and evidenced.

## Plugin And Skill Usage

Superpowers:

- brainstorming, writing-plans, verification-before-completion, systematic-debugging, requesting-code-review, subagent-driven-development when implementation is approved

GitHub:

- repository, PR, issue, branch, and CI context
- no mutation unless explicit remote mutation approval exists

Linear:

- issue, project, cycle, and planning integration after workspace identifiers are confirmed
- no ticket mutation without explicit scope and identifiers

Vercel:

- research durable workflow options through current Vercel Workflow docs before implementation
- no Vercel Workflow runtime in phase 0 or phase 1

Cloudflare:

- compare Workflows, Agents, Durable Objects, Queues, Workers, Pages, and D1 through current docs before runtime selection

Docket:

- future product knowledge source for business context, proposals, and sales/product memory when callable tools are available

Context7 and official docs:

- required for unstable SDK, cloud, model, CLI, and provider facts

Gemini CLI:

- advisory critique only, redacted context only, no tools, no file edits, no authority over local facts

## Phase Boundaries

Phase 0 is documentation and contracts only.

Phase 1 is typed read-only data and tests.

Phase 2 is read-only UI.

Phase 3 is connector/import research and reviewed snapshots.

Phase 4 is execution engine decision record.

Phase 5 is bounded execution MVP.

Phase 6 is monitoring, recovery, learning, and optimization automation.

No phase may start until the previous phase has updated architecture records, work logs, decision ledger, issue ledger, and verification evidence.

## Repository Separation

Autopilot-owned implementation belongs in the Autopilot repository:

```text
C:\Users\sirok\Documents\Autopilot
SirRadek/autopilot
```

Product projects created or supervised by Autopilot belong in separate repositories:

```text
C:\Users\sirok\Documents\Projects\<project-slug>
SirRadek/<project-slug>
```

Autopilot may hold registry metadata, templates, ledgers, governance rules, and sanitized snapshots. Product runtime source, tests, migrations, deployment config, and assets belong in the product repository.
