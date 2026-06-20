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
| Business | product reasoning, prioritization | strong reasoning model with product context (see Business Intelligence Operating Model) | hidden scope expansion |
| Orchestrator | dependency planning, routing | strong reasoning model | self-approval |
| Architecture | system design, tradeoffs | senior reasoning/coding model | rubber-stamping implementation |
| Analysis | impact and risk discovery (see Analysis Intelligence Operating Model) | reasoning model or specialist reviewer | implementation without approval |
| Execution | bounded code changes | coding model matched to scope | architecture or business decisions |
| Testing | test design and failure analysis | reasoning or testing specialist | changing business scope |
| Review | critique and risk finding | independent reviewer model | reviewing own output |
| Copywriting | language, tone, localization (see Copywriting Operating Model) | language-strong model | product approval |
| Governance | evidence checking | supervisor model plus deterministic checks | approving missing evidence |
| Autopilot Supervisor | monitoring and recovery proposals | supervisor model | product steering or delivery approval |
| Memory | summarization and retrieval | lower-cost summarizer when safe | overwriting source artifacts |

## Reasoning Usage Policy

The default worker layer is local.

Before choosing a model, call the local worker routing policy when the task may be handled by deterministic tools, Qwen2.5-Coder, local summarization, or local verification.

Before choosing any larger context or cloud reasoning path, call the token-efficiency policy when the task can plausibly fit Caveman or compact mode.

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
- `cloud_model_for_routine_worker_loop`
- `frontier_used_for_simple_worker_task`
- `provider_availability_unverified`
- `paid_model_or_credit_required`
- `private_data_not_redacted`
- `model_output_used_as_source_of_truth`

If a task cannot run locally and is not strategic reasoning or independent review, stop and ask for an owner decision. Do not solve routine local-worker work by silently moving it to a cloud/frontier model.

Free/no-cost cloud reasoning is allowed as advisory review when it adds clear value.

Allowed free-cloud advisory uses:

- brainstorming
- architecture second opinion
- design critique
- security critique
- planning critique
- agent validation
- edge-case review
- research synthesis

Required checks:

- provider availability verified
- free tier or no-cost use confirmed
- redacted context only
- Context7 or official documentation verified for technology, framework, library, SDK, API, browser, cloud, SEO, accessibility, and best-practice claims
- Gemini brainstorm claims labeled as ideas until verified
- factual claims verified against local files, tests, Context7, official docs, or controlled browser evidence
- smallest safe model class chosen
- model/tool choice disclosed when it affects risk, cost, or delivery

Free cloud advisory output is never source of truth and never approval evidence by itself.

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

Use free/no-cost cloud advisory models for:

- brainstorming variants
- independent critique
- architecture or security second opinion
- design and UX critique
- agent validation
- research synthesis

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

Stop if provider availability is unverified, if free/no-cost use is unconfirmed, if a routine local-worker task depends on a non-local model, if paid credits are required, or if model choice affects risk without disclosure.

Technology and best-practice recommendations from any advisory model must pass the docs-verification lane before adoption:

1. Query Context7 when it is connected and covers the library, framework, SDK, browser API, cloud API, SEO rule, or accessibility topic.
2. If Context7 is unavailable or does not cover the topic, record the fallback and use official documentation, release notes, local code, tests, or controlled browser evidence.
3. Treat unverified Gemini or free-cloud brainstorm output as a hypothesis, not a plan or source of truth.
4. Stop on `technology_claim_without_context7_or_official_docs` or `gemini_claim_adopted_without_verification`.

## Prompt Library Policy

Reusable prompts live in `prompt-library/` as local Git/Markdown contracts.
They are not copied from leaked system-prompt repositories and they are not
adopted from public prompt packs without review.

Prompt source authority follows this order:

1. Official provider documentation for model-specific behavior.
2. Local Autopilot policy, mesh nodes, tests, and architecture records.
3. Local eval cases and verified outputs.
4. DAIR.AI and GitHub prompt catalogs as inspiration only.
5. Prompt-management tooling documentation as optional future implementation
   reference.

Every reusable prompt must declare model family, task type, version, status,
sources, risk level, expected output, and evals. Provider-specific prompts may
not be reused across GPT, Claude, Gemini, and Qwen without review and eval
evidence.

Prompt changes stop when:

- a leaked system prompt is used
- source authority is missing
- evals are missing
- a model-specific prompt is copied across providers without review
- private data or secrets are embedded in the prompt
- model output is treated as source of truth
- paid prompt-management tooling is required without owner exception

Initial prompt-management remains local and free. Langfuse, Braintrust,
PromptHub, or similar tools may be researched later for versioning, labels,
diffs, rollback, and eval workflows, but runtime adoption requires a separate
architecture decision and cost/privacy review.

## Qwen2.5-Coder Policy

Qwen2.5-Coder 7B and Qwen2.5-Coder 14B are optional bounded worker candidates.

Current local baseline on 2026-05-30:

- `qwen2.5-coder:7b` is installed in Ollama and may be used as the fast local coding worker.
- `qwen2.5-coder:7b-autopilot` is installed in Ollama and may be used for local summaries and handoff drafts.
- `qwen2.5-coder:14b` is the maximum local coding worker target for this computer, but it is not installed yet and must pass install and hardware checks before use.
- The observed machine profile is 32 GB RAM and RTX 4070 Laptop GPU with 8 GB VRAM.

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

Use of Qwen2.5-Coder 14B additionally requires:

- `model_install_confirmed`
- `hardware_budget_verified`
- bounded multi-file scope
- fallback to Qwen 7B or deterministic tools when 14B is unnecessary
- escalation to advisory/free-cloud or human review for architecture, security, or business decisions

## Gemini Policy

Gemini CLI or Gemini models may be used as advisory critique and brainstorming only.

Allowed:

- brainstorming
- architecture second opinion
- UX critique
- security critique
- proposal refinement
- agent validation
- edge-case review

Forbidden:

- file edits without local supervisor scope
- governance approval
- delivery approval
- receiving unredacted private data
- overriding local repository facts
- consuming paid credits or requiring an account upgrade

Gemini output must be treated as external advice and checked against local files, official docs, or connector snapshots.

For technology or best-practice brainstorming, Gemini must be paired with the docs-verification lane. Context7 is preferred when connected; official documentation is the fallback. Gemini may suggest options, tradeoffs, and critique, but those claims cannot enter an implementation plan until verified.

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

The local read-only MCP server exposes `select_local_worker_route` for worker selection. It returns the recommended local worker lane, required checks, stop conditions, and handoff expectations. It does not run Ollama, install models, edit files, or approve work.

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
