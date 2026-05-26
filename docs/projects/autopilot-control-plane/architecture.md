# Autopilot Control Plane Architecture

Last updated: 2026-05-24
Next review: 2026-05-31
Status: active process layer
Slug: `autopilot-control-plane`
Canonical local root: `C:\Users\sirok\Documents\Autopilot`
Canonical remote repository: `SirRadek/autopilot`
Local workspace: `C:\Users\sirok\Documents\Autopilot`
Separation status: `separated`
Visibility: dedicated control-plane repository, with private inventory redacted when needed

## Purpose And Scope

The Autopilot control plane defines how project work is received, researched, scoped, delegated, verified, logged, and handed off. It is currently a documentation, typed-governance-contract, static read-only command-center, local Decision Mesh, and supervision layer, not an autonomous execution engine.

Autopilot is its own project. It makes, supervises, and audits other projects, but it must not be treated as the same project as Radeq or any other product runtime.

Out of scope for the current architecture:

- autonomous execution loop
- background task runner
- stored credentials
- real GitHub, Cloudflare, Vercel, Linear, or Docket mutation from UI
- multi-provider LLM gateway
- production dashboard runtime with connector mutation

## System Boundary

In this project:

- `docs/autopilot/v3-prompt-pack.md`
- `docs/autopilot/2026-05-10-autopilot-run-log.md`
- `docs/autopilot/project-architecture-standard.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/repository-separation-policy.md`
- per-project architecture records under `docs/projects/`
- minimal TypeScript/Vitest governance-contract package
- typed registries under `src/data/delivery-system/`
- typed capability routing, context economy, and model spend policy under `src/data/delivery-system/`
- pure validators under `src/lib/delivery-system/`
- Decision Mesh YAML/JSON source under `mesh/`
- pure Decision Mesh query library under `src/lib/decision-mesh/`
- local read-only stdio MCP server under `mcp/server.ts`
- project-specific Decision Mesh seed graphs under `docs/projects/*/decision-mesh/`
- deterministic mesh artifact generator under `scripts/generate-decision-mesh.ts`
- static read-only command center at `src/pages/autopilot.astro`
- tests under `tests/delivery-system/`
- Decision Mesh tests under `tests/decision-mesh/`
- local Playwright smoke test at `tests/autopilot-delivery-system.spec.ts`

External to this project:

- GitHub connector and `gh` CLI live repository data
- Linear workspace data
- Docket product knowledge data
- Vercel projects, deployments, and workflow APIs
- Cloudflare account resources
- Gemini CLI advisory critique
- Context7 or official documentation sources
- remote MCP transports or connector-hosted MCP servers
- product runtime source code such as Radeq pages, functions, migrations, and assets

## Repository Boundary

Target local root:

```text
C:\Users\sirok\Documents\Autopilot
```

Target remote repository:

```text
SirRadek/autopilot
```

Autopilot may store registry metadata and sanitized snapshots for product projects, but product code must live in separate repositories such as:

```text
C:\Users\sirok\Documents\Projects\radeq
SirRadek/radeq
```

Current state: the local Autopilot root is separated from the Radeq product checkout and targets the dedicated `SirRadek/autopilot` repository. The previous mixed checkout is preserved as a local backup for recovery and audit.

## Operating Workflow

```text
User request
  -> Supervisor or Intake Triage Bot
  -> intake record
  -> priority and safety classification
  -> local repository inspection
  -> current-fact verification for unstable claims
  -> independent research when implementation risk requires it
  -> synthesis gate
  -> WRITE_ALLOWED decision
  -> scoped worker assignment
  -> verification gates
  -> architecture impact check
  -> work-log update
  -> final handoff
```

Modes:

- `DRY_RUN`: reasoning, planning, and critique only.
- `INSPECT_ONLY`: read local or approved external context, no file edits.
- `WRITE_ALLOWED`: exact files, commands, forbidden actions, and verification are named.
- `REMOTE_MUTATION_APPROVED`: remote mutation is explicitly approved and logged before action.

## Data Model

Current data is Markdown-first with a minimal typed governance mirror:

- prompt pack
- run logs
- project architecture registry
- project architecture records
- project work logs
- plans and specs under `docs/superpowers/`
- typed delivery-system contracts under `src/data/delivery-system/`
- pure delivery-system validators under `src/lib/delivery-system/`
- Decision Mesh YAML nodes, edges, rules, schemas, and generated JSON artifact under `mesh/`
- pure Decision Mesh query helpers under `src/lib/decision-mesh/`
- local stdio MCP tool server under `mcp/server.ts`
- capability routing, context economy, and model spend policy data under `src/data/delivery-system/`
- seeded project-specific Decision Mesh records under `docs/projects/<project-slug>/decision-mesh/`
- Vitest contract tests under `tests/delivery-system/`
- Vitest Decision Mesh tests under `tests/decision-mesh/`
- static `/autopilot` command-center page under `src/pages/`
- Playwright browser smoke test under `tests/`

Planned typed data:

- `src/data/autopilot/projects.ts`
- `src/data/autopilot/skills.ts`
- `src/data/autopilot/agents.ts`
- `src/data/autopilot/verification.ts`
- `src/data/autopilot/providers.ts`
- `src/lib/autopilot/inventory.ts`
- `src/lib/autopilot/prompts.ts`

These planned files do not exist yet.

The current `package.json`, `tsconfig.json`, `vitest.config.ts`, `astro.config.mjs`, and `playwright.config.ts` are approved only for governance-contract validation, local Decision Mesh querying, local read-only MCP serving, and a local static read-only command center. They do not approve connector clients, background jobs, workflow engines, product runtime code, remote mutation, remote MCP transport, or deployment configuration.

Decision Mesh:

- `mesh/` is the human-readable source of truth.
- The root `mesh/` is Autopilot's own operational mesh, not the project mesh for every supervised product.
- Each supervised project must create and maintain its own `docs/projects/<project-slug>/decision-mesh/` during project architecture onboarding.
- `mesh/generated/decision-mesh.json` is derived and must pass `npm run mesh:check`.
- MCP tools return compact JSON context and never approve work.
- MCP exposes `select_capabilities` so work can route through web build, optimization, data, SEO, automation, recovery, document, bot/RAG, and 3D add-on capabilities before planning.
- MCP exposes `build_project_mesh_packet` so supervised project work can query that project's own mesh without treating the root Autopilot mesh as product context.
- Strategic reasoning is modeled as an escalation/review/planning layer; routine worker tasks stay local by default.
- 3D visualization is deferred until the query/MCP layer is stable, and 3D remains a premium add-on capability rather than a default service path.
- A parallel AI Production Studio remains a possible future architecture, but only after an explicit decision defines source-of-truth ownership, interop or migration, and maintenance cost.

## Integrations

GitHub:

- used for read-only repository context unless mutation is explicitly approved
- Autopilot's target remote repository is `SirRadek/autopilot`
- product projects are referenced as external repositories, not as Autopilot-owned source trees

Superpowers:

- provides process skills for planning, verification, debugging, and development discipline

MCP:

- local stdio MCP server exposes read-only Decision Mesh tools for Codex context routing
- no remote MCP transport, connector-backed MCP server, or mutating MCP tool is approved

Vercel:

- Vercel Workflow and DurableAgent are phase-2 research topics only
- no Vercel runtime or workflow is implemented

Linear:

- skill is available, but no Linear architecture registry integration exists yet

Docket:

- no Docket-backed project architecture sync exists yet

Cloudflare:

- relevant for Radeq runtime and D1 lead capture
- no Autopilot control-plane runtime runs on Cloudflare yet

Gemini:

- advisory critique only
- receives redacted context only
- never approves work or overrides local verification

## Security And Privacy Controls

- Private repository names, private issue bodies, customer data, secrets, account identifiers, and local credential state must not be sent to external models.
- External critique must use approved aliases.
- Remote service mutation is forbidden unless explicitly approved and logged.
- `WRITE_ALLOWED` is locked by default.
- Every final handoff must state verification evidence and architecture impact.
- Every project must have a current architecture record before implementation starts.
- Decision Mesh stop conditions require owner decision unless the task explicitly resolves the stop condition.
- Missing project-specific mesh is a stop condition for project implementation work.
- Non-local worker dependency is a stop condition unless the task is strategic reasoning or independent review.
- MCP tools may not read product repositories or credentials.
- Unapproved parallel systems or duplicate sources of truth are stop conditions.

## Verification Gates

Process gates:

- intake triaged
- local context checked
- current docs checked for unstable technical facts
- independent research checked when needed
- synthesis checked
- scope respected
- security reviewed when secrets, remote services, public routes, or execution are involved
- project architecture reviewed or updated
- work log updated
- final handoff checked

Documentation verification:

```powershell
rg -n "Project Architecture" docs
npm run mesh:check
git diff --check
```

Application verification is delegated to the affected project architecture record.

## Known Gaps And Risks

- `/autopilot` static read-only command center exists; it is not an execution console.
- Decision Mesh and local MCP server exist as read-only context routing; they are not approval, execution, connector, or remote mutation surfaces.
- Delivery-system typed governance contracts exist; capability routing, context economy, model spend policy, and current project mesh seeds now exist.
- Project, skill, agent, provider, and verification registries remain planned unless covered by the existing delivery-system contracts.
- Architecture records for external/private projects are not normalized yet.
- Regular review cadence is documented but not automated.
- No recurring Codex automation has been created for weekly architecture review.
- Vercel, Linear, and Docket are not integrated into the architecture registry.
- The TypeScript package and Astro route must stay limited to pure governance validation and static read-only reporting until a later architecture decision changes the boundary.

## Architecture Change Triggers

Update this file when any of these change:

- supervisor workflow or mode rules
- `WRITE_ALLOWED` unlock criteria
- worker role responsibilities
- verification gates
- project architecture standard or registry contract
- GitHub, Linear, Docket, Vercel, Cloudflare, Gemini, or Context7 integration behavior
- `/autopilot` route or typed registry implementation
- Decision Mesh schemas, MCP tools, generated artifact, or mesh usage rules
- privacy, external disclosure, or remote mutation policy
