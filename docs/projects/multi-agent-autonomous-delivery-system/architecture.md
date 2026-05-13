# Multi-Agent Autonomous Delivery System Architecture

Last updated: 2026-05-13
Next review: 2026-05-20
Status: phase-0 governance contract
Slug: `multi-agent-autonomous-delivery-system`
Canonical remote repository: `SirRadek/autopilot`
Local workspace: `C:\Users\sirok\Documents\Autopilot`
Separation status: `autopilot_subsystem`
Visibility: Autopilot control-plane subsystem; external/private project details must be redacted

## Purpose And Scope

This project defines a governed autonomous software delivery system. It turns product requests into auditable delivery runs with business review, architecture control, bounded execution, testing, code/security/UX review, governance gates, monitoring, and memory.

The system is not currently an execution runtime. It is a planned architecture and implementation roadmap that must begin with documentation, typed contracts, ledgers, and read-only supervision.

This project is an Autopilot subsystem. It belongs inside the dedicated Autopilot control-plane repository, not inside any product repository.

Out of scope for the current phase:

- autonomous code execution
- remote mutation through GitHub, Linear, Vercel, Cloudflare, Docket, or databases
- stored credentials
- production deployment of a workflow engine
- unreviewed use of private inventory or customer data
- model-specific dependency on Qwen, Gemini, OpenAI, or any single provider

## System Boundary

In this project:

- architecture record and work log
- design spec and implementation plan
- delivery-system governance, ledgers, and model-policy docs
- connector snapshot procedure for reviewed external evidence
- execution-engine options decision record
- governance contracts
- future typed registries for roles, gates, workflows, ledgers, and model policy after an Autopilot runtime/package decision
- future read-only command-center views after a UI architecture decision

External to this project:

- GitHub repositories, PRs, issues, and Actions logs
- Linear issues, cycles, projects, and team data
- Vercel projects, deployments, logs, and workflow runtime
- Cloudflare Pages, Workers, D1, Workflows, Agents, Queues, and Durable Objects
- Docket product/sales knowledge
- Gemini CLI advisory critique
- local or remote model runtimes such as Qwen candidates
- product repositories created or supervised by Autopilot

## Repository Boundary

The multi-agent delivery system is part of Autopilot itself. Its target home is:

```text
C:\Users\sirok\Documents\Autopilot
SirRadek/autopilot
```

Projects created by this system must be separate repositories under their own local roots:

```text
C:\Users\sirok\Documents\Projects\<project-slug>
SirRadek/<project-slug>
```

The delivery system may create project scaffolds, architecture templates, and governance records, but product implementation belongs in the created project's repository.

## Layered Architecture

```text
User / Product Request
  -> Business Layer
  -> Orchestrator Layer
  -> Analysis + Architecture Layer
  -> Execution Layer
  -> Testing Layer
  -> Review Layer
  -> Copywriting + UX Validation
  -> Governance Gates
  -> Merge / Delivery
  -> Autopilot Supervisor
  -> Memory + Optimization + Lessons
```

## Core Responsibilities

Business Layer:

- business goals
- product priorities
- ROI and user value
- scope management
- roadmap alignment

Orchestrator Layer:

- dependency graph
- routing
- parallelization
- merge and rework flow
- cannot approve its own outputs

Architecture Layer:

- boundaries
- modularity
- integration flow
- scalability and maintainability
- security and performance patterns

Analysis Layer:

- impact analysis
- risk analysis
- dependencies
- unknowns
- edge cases

Execution Layer:

- bounded implementation
- isolated workers
- no business or architecture decisions
- no self-approval

Testing Layer:

- unit, integration, regression, E2E, acceptance, performance, and security-impact verification

Review Layer:

- code quality
- security
- architecture compliance
- UX consistency
- scope validation

Copywriting + Content Layer:

- UI text
- technical documentation
- brand voice
- localization
- accessibility language

Governance Layer:

- acceptance criteria
- plan alignment
- architecture compliance
- testing status
- security review
- scope validation

Autopilot Supervisor:

- monitoring
- failure detection
- timeout detection
- investigation
- recovery proposal
- incident evidence
- lessons learned

Memory Layer:

- project memory
- decision memory
- issue memory
- architecture memory
- workflow memory
- lessons memory

## Data Contracts

Detailed contracts are now split into:

- `docs/autopilot/delivery-system-governance.md`
- `docs/autopilot/delivery-system-ledgers.md`
- `docs/autopilot/delivery-system-model-policy.md`

Decision ledger entries must include:

- `decision_id`
- `type`
- `context`
- `decision`
- `reasoning`
- `alternatives`
- `impact`
- `approved_by`
- `related_tasks`

Issue ledger entries must include:

- `issue_id`
- `severity`
- `found_by`
- `related_agent`
- `description`
- `expected`
- `actual`
- `decision`
- `fix_owner`
- `status`
- `lesson_learned`

Gate results must include:

- `status`
- `checked_against`
- `issues`
- `decision_reason`
- `next_action`

Analysis output must include:

- `risks`
- `assumptions`
- `dependencies`
- `edge_cases`
- `unknowns`
- `recommendations`

## Integrations

GitHub:

- read repository and PR/issue/CI context
- future write operations require explicit remote mutation approval

Linear:

- future planning and issue tracking source
- requires workspace/team/project identifiers before tool use

Vercel:

- candidate durable workflow runtime
- all Workflow DevKit facts must be rechecked in official/current docs before implementation

Cloudflare:

- candidate runtime for Workers, Workflows, Agents, Durable Objects, Queues, Pages, and D1
- all product facts must be rechecked in current docs before implementation

Docket:

- future product knowledge and sales context source when callable tools are available

Superpowers:

- required process skills for brainstorming, planning, verification, debugging, review, and controlled agent execution

Gemini CLI:

- redacted advisory critique only
- cannot approve work or replace local evidence

## Security And Governance Controls

- Nobody approves their own work.
- Orchestrator cannot bypass governance gates.
- Testers cannot change business scope.
- Autopilot cannot approve delivery.
- Workers cannot silently change architecture.
- Scope drift triggers merge stop, valid-change separation, out-of-scope reversal, incident logging, and feedback.
- Architecture drift triggers issue logging, delta recording, rework, impact check, and re-review.
- Failed tests trigger failure summary, investigation, fix assignment, rerun, and governance approval.
- Inline fixes require small scope, no architecture change, no business logic change, no redesign, and evidence.

## Verification Gates

Required before implementation:

- project registry row exists
- architecture record is current
- work log is current
- design spec exists
- implementation plan exists
- connector and provider facts are verified when unstable
- no remote mutation is requested without explicit approval

Required before delivery:

- architecture impact recorded
- decision ledger updated when decisions changed
- issue ledger updated when issues were found
- tests and review evidence recorded
- governance gate result recorded
- final handoff references work-log evidence

## Known Gaps And Risks

- No typed registries exist yet.
- No runtime/package decision exists for typed contracts or read-only UI in the post-split Autopilot repository.
- No execution engine has been selected; the phase-0 execution-engine decision record currently defers selection.
- Connector snapshot procedure exists, but it has not been exercised in a full dry run yet.
- No recurring review automation exists yet.
- Docket callable tooling is not available in this session.
- Linear tooling requires workspace identifiers and OAuth connectivity before use.
- Model policy must not assume Qwen availability without local/runtime verification.

## Architecture Change Triggers

Update this file when any of these change:

- layer responsibilities
- role permissions
- gate definitions
- ledger schema
- plugin integration behavior
- execution engine decision
- monitoring/recovery flow
- memory strategy
- model policy
- privacy or remote mutation policy
