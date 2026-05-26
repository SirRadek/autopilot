# Delivery System Model Policy

Date introduced: 2026-05-13
Status: phase-0 model policy
Owner: Autopilot Control Plane

This policy defines how models and agent roles may be used in the Multi-Agent Autonomous Delivery System.

The policy is provider-adaptable. No workflow may depend on one model provider, one CLI, or one local runtime unless a decision ledger entry explicitly accepts that dependency.

## Authority Model

Models can produce analysis, code, tests, summaries, critique, and proposals.

Models cannot:

- approve their own work
- override governance gates
- silently change business scope
- silently change architecture
- decide remote mutation without explicit approval
- replace local verification evidence
- become the source of truth for connector data

## Role-To-Model Policy

| Layer | Preferred Capability | Allowed Model Class | Forbidden Use |
| --- | --- | --- | --- |
| Business | product reasoning, prioritization | strong reasoning model with product context | hidden scope expansion |
| Orchestrator | dependency planning, routing | strong reasoning model | self-approval |
| Architecture | system design, tradeoffs | senior reasoning/coding model | rubber-stamping implementation |
| Analysis | impact and risk discovery | reasoning model or specialist reviewer | implementation without approval |
| Execution | bounded code changes | coding model matched to scope | architecture or business decisions |
| Testing | test design and failure analysis | reasoning or testing specialist | changing business scope |
| Review | critique and risk finding | independent reviewer model | reviewing own output |
| Copywriting | language, tone, localization | language-strong model | product approval |
| Governance | evidence checking | supervisor model plus deterministic checks | approving missing evidence |
| Autopilot Supervisor | monitoring and recovery proposals | supervisor model | product steering or delivery approval |
| Memory | summarization and retrieval | lower-cost summarizer when safe | overwriting source artifacts |

## Reasoning Usage Policy

The default worker layer is local.

Local worker default:

- autocomplete
- boilerplate coding
- bounded implementation
- embeddings
- RAG retrieval
- indexing
- automation loops
- routine summarization
- simple utility tasks

Frontier reasoning is a strategic escalation layer, not the default worker.

Use frontier reasoning only for:

- deep research
- architecture review
- security audit
- code review
- agent validation
- strategic planning
- orchestration design
- edge-case reasoning
- cross-domain tradeoff analysis

Do not use frontier reasoning for:

- autocomplete
- boilerplate coding
- embeddings
- routine summarization
- simple tasks
- local automation loops
- unreviewed worker execution

Stop conditions:

- `non_local_worker_dependency`
- `frontier_used_for_simple_worker_task`
- `provider_availability_unverified`

If a task cannot run locally and is not strategic reasoning or independent review, stop and ask for an owner decision. Do not solve routine local-worker work by silently moving it to a cloud/frontier model.

## Model Spend Policy

Model selection is provider-neutral. DeepSeek, Qwen, Gemini, OpenAI, Claude, or any cheaper GPT-class worker may be useful when available, but no workflow may silently depend on one of them.

Use low-cost or local workers for:

- bulk summarization
- SEO drafts
- data cleanup plans
- document reconstruction drafts
- task packet generation
- first-pass code
- classification

Use long-context research models for:

- long-context research
- brainstorming variants
- market research
- document understanding
- broad planning

Use repo execution agents for:

- repository editing
- tests
- bounded refactors
- debugging
- patch workflow

Use frontier reasoning only when:

- risk is high
- requirements are ambiguous
- architecture-level decisions are involved
- security sensitivity is high
- previous attempts failed repeatedly
- final independent review is needed

Stop if provider availability is unverified, if a routine local-worker task depends on a non-local model, or if model choice affects risk without disclosure.

## Qwen2.5-Coder Policy

Qwen2.5-Coder 7B and Qwen2.5-Coder 14B are optional bounded worker candidates.

They may be considered for:

- micro tasks
- small CRUD changes
- DTOs and model files
- isolated utility functions
- small refactors
- isolated bug fixes
- adding focused tests

They must not be used for:

- architecture decisions
- business decisions
- governance approval
- security approval
- broad refactors
- multi-repository changes
- ambiguous scope
- incidents without supervisor review

Use of Qwen2.5-Coder requires:

- local or approved runtime availability verification
- bounded file scope
- independent review
- test evidence
- ledger entry if the model choice affects risk, cost, or delivery time

## Gemini Policy

Gemini CLI or Gemini models may be used as advisory critique only.

Allowed:

- brainstorming
- architecture second opinion
- UX critique
- security critique
- proposal refinement

Forbidden:

- file edits without local supervisor scope
- governance approval
- delivery approval
- receiving unredacted private data
- overriding local repository facts

Gemini output must be treated as external advice and checked against local files, official docs, or connector snapshots.

## Connector And Tool Facts

Model output about current SDKs, cloud APIs, provider pricing, model availability, GitHub state, Linear state, Vercel state, Cloudflare state, or Docket content is unstable.

Before using such claims:

- verify through local files, connector data, Context7, or official docs
- record the source in the handoff
- avoid committing secrets or private account identifiers

## Selection Rules

Choose the smallest safe model class that can complete the bounded task with review.

Escalate to a stronger reasoning model when:

- architecture changes
- security or privacy is involved
- task crosses repositories
- requirements are ambiguous
- tests fail repeatedly
- incident root cause is unclear
- business scope might change

Use deterministic checks when possible:

- tests
- type checks
- linters
- `rg` searches
- schema validation
- file and repository boundary checks

## Handoff Requirements

Every model or worker handoff must state:

- model or tool used, if known
- role
- mode
- allowed scope
- forbidden actions
- input facts
- assumptions
- output files or artifacts
- verification evidence
- risks
- whether ledger updates are required

Missing model/tool disclosure blocks governance approval when model choice affects risk.

## Approval Rules

Approval requires independent evidence:

- implementer output
- tester evidence
- reviewer assessment
- governance gate result
- work-log update

The same model session, role, or worker cannot be both implementer and final approver.
