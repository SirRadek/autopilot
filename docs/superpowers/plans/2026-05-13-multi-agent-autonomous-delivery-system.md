# Multi-Agent Autonomous Delivery System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a governed, auditable, multi-agent delivery system that starts with architecture, memory, ledgers, gates, and read-only supervision before any autonomous execution is enabled.

**Architecture:** After repository separation, Autopilot is a control-plane repository with Markdown governance, a minimal TypeScript/Vitest typed-contract package, and a static read-only Astro command center. Model the delivery system as governance contracts, architecture records, ledgers, audited workflow rules, pure validators, and read-only reporting before adding any durable workflow engine. Execution engines, remote mutation, and credentials remain locked behind later decision records and explicit approvals.

**Tech Stack:** Markdown docs for phase 0, TypeScript/Vitest for phase-1 governance contracts, Astro static UI and Playwright smoke tests for phase 2, Git for evidence, GitHub/Linear/Vercel/Cloudflare/Docket plugins as supervised context sources, Superpowers process skills. Any execution runtime still requires a separate architecture decision because the Autopilot repository must not become product runtime code.

---

## Phase Rules

- Phase 0 documentation is required before any typed contracts, UI, or execution runtime work.
- Phase 1 typed contracts require and now have a runtime/package decision for pure governance contracts only.
- No delivery-system remote mutation is allowed in this plan.
- No credentials, tokens, database IDs, private issue bodies, or private Docket/Linear/GitHub content may be committed.
- Autopilot is a standalone control-plane project; product projects must live in separate local roots and separate Git repositories.
- The dedicated Autopilot repository split is completed; product runtime files must not be reintroduced into Autopilot.
- Every task must update the affected project work log.
- Every implementation task must state architecture impact.

## Planned File Structure

Create:

- `docs/projects/multi-agent-autonomous-delivery-system/architecture.md`
- `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- `docs/autopilot/delivery-system-governance.md`
- `docs/autopilot/delivery-system-ledgers.md`
- `docs/autopilot/delivery-system-model-policy.md`
- `docs/autopilot/delivery-system-connector-snapshots.md`
- `docs/autopilot/delivery-system-execution-engine-options.md`
- `docs/autopilot/delivery-system-runtime-package-decision.md`
- `docs/autopilot/delivery-system-read-only-ui-decision.md`
- `docs/autopilot/delivery-system-snapshots/2026-05-13-autopilot-read-only-dry-run.md`

Typed-contract files approved by the runtime/package decision:

- `src/data/delivery-system/roles.ts`
- `src/data/delivery-system/gates.ts`
- `src/data/delivery-system/workflows.ts`
- `src/data/delivery-system/ledgers.ts`
- `src/data/delivery-system/modelPolicy.ts`
- `src/lib/delivery-system/governance.ts`
- `src/lib/delivery-system/ledger.ts`
- `tests/delivery-system/governance.test.ts`
- `tests/delivery-system/ledger.test.ts`
- `tests/delivery-system/boundary.test.ts`
- `tests/autopilot-delivery-system.spec.ts`
- `package.json`
- `package-lock.json`
- `astro.config.mjs`
- `playwright.config.ts`
- `tsconfig.json`
- `vitest.config.ts`

Modify:

- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/v3-prompt-pack.md`
- `docs/autopilot/2026-05-10-autopilot-run-log.md`

Read-only UI files approved by the UI architecture decision:

- `src/pages/autopilot.astro`

## Task 1: Project Onboarding And Architecture Baseline

**Files:**
- Create: `docs/projects/multi-agent-autonomous-delivery-system/architecture.md`
- Create: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- Modify: `docs/autopilot/project-architecture-registry.md`
- Modify: `docs/autopilot/2026-05-10-autopilot-run-log.md`

- [x] Add registry row for `multi-agent-autonomous-delivery-system`.
- [x] Write architecture record with system boundary, repository boundary, phase boundaries, plugin usage, data contracts, and forbidden actions.
- [x] Write work-log entry with architecture impact and verification plan.
- [x] Record the governance baseline in the main Autopilot run log.
- [x] Run:

```powershell
rg -n "multi-agent-autonomous-delivery-system|Multi-Agent Autonomous Delivery System" docs
git diff --check
```

Expected: project appears in registry, architecture, work log, spec, plan, and run log; `git diff --check` has no whitespace errors.

Actual: completed on 2026-05-13. The project appears in the registry, architecture record, work log, spec, plan, and run log; `git diff --check` passed with only LF/CRLF normalization warnings.

## Task 1A: Repository Separation Policy

**Files:**
- Create or modify: `docs/autopilot/repository-separation-policy.md`
- Modify: `docs/autopilot/project-architecture-standard.md`
- Modify: `docs/autopilot/project-architecture-registry.md`
- Modify: `docs/projects/*/architecture.md`
- Modify: affected project work logs

- [x] State that Autopilot is a standalone control-plane project.
- [x] State that every product project must have a separate local root and separate remote repository.
- [x] Add `Canonical Local Root`, `Canonical Remote Repo`, and `Separation Status` to the registry model.
- [x] Mark current co-location as `split_required` where applicable.
- [x] Run:

```powershell
rg -n "Repository Separation|split_required|Canonical Remote Repo|Autopilot is a standalone" docs
git diff --check
```

Expected: separation policy and registry fields are present; no whitespace errors.

Actual: completed on 2026-05-13. Repository-boundary search passed; placeholder-token scan returned no matches; `git diff --check` passed with only LF/CRLF normalization warnings on existing files.

## Task 2: Governance And Ledger Documentation

**Files:**
- Create: `docs/autopilot/delivery-system-governance.md`
- Create: `docs/autopilot/delivery-system-ledgers.md`
- Create: `docs/autopilot/delivery-system-model-policy.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Define Business, Orchestrator, Architecture, Analysis, Execution, Testing, Review, Copywriting, Governance, Autopilot, and Memory layers.
- [x] Define role permissions and explicit "must not" rules.
- [x] Define decision matrix for blocker, major issue, minor issue, cosmetic issue, and pass.
- [x] Define inline-fix rules, scope-drift flow, architecture-violation flow, and failed-test flow.
- [x] Define decision ledger, issue ledger, analysis output, and gate result schemas.
- [x] Define model policy that treats Qwen2.5-Coder 7B/14B as optional bounded worker candidates, not architecture or governance authorities.
- [x] Run:

```powershell
rg -n "Nobody approves their own work|decision_id|issue_id|gate_result|Qwen2.5" docs/autopilot docs/projects
git diff --check
```

Expected: governance docs contain explicit rules and ledgers; no whitespace errors.

Actual: completed on 2026-05-13. Governance, ledger, and model-policy docs were created in `docs/autopilot/`; searches found the required workflow, ledger, gate, and Qwen policy terms; `git diff --check` passed with only LF/CRLF normalization warnings.

## Task 3: Typed Contract Tests First

Status: completed after `docs/autopilot/delivery-system-runtime-package-decision.md` approved a minimal TypeScript/Vitest package for pure governance contracts.

**Files:**
- Create: `tests/delivery-system/governance.test.ts`
- Create: `tests/delivery-system/ledger.test.ts`
- Create: `tests/delivery-system/boundary.test.ts`

- [x] Write failing tests for role separation: implementers cannot approve their own work, testers cannot change business scope, Autopilot cannot approve delivery.
- [x] Write failing tests for gate decisions: blocker and major issue require rework, minor issue allows inline fix only with evidence, pass allows progression.
- [x] Write failing tests for ledger completeness: decision ledger and issue ledger require all mandatory fields.
- [x] Add boundary tests for non-mutating scripts, source imports, and product runtime paths.
- [x] Run:

```powershell
npm run test -- tests/delivery-system/governance.test.ts tests/delivery-system/ledger.test.ts
```

Expected: fail because delivery-system modules do not exist yet.

Actual: completed on 2026-05-13. Initial red run failed because `src/lib/delivery-system/governance` and `src/lib/delivery-system/ledger` did not exist.

## Task 4: Typed Registries And Pure Helpers

Status: completed for the first pure TypeScript/Vitest governance-contract slice. Typed registries must not reintroduce product runtime code into the control-plane repository.

**Files:**
- Create: `src/data/delivery-system/roles.ts`
- Create: `src/data/delivery-system/gates.ts`
- Create: `src/data/delivery-system/workflows.ts`
- Create: `src/data/delivery-system/ledgers.ts`
- Create: `src/data/delivery-system/modelPolicy.ts`
- Create: `src/lib/delivery-system/governance.ts`
- Create: `src/lib/delivery-system/ledger.ts`
- Create: `src/lib/delivery-system/validation.ts`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Implement typed roles for every layer in the user brief.
- [x] Implement gate definitions for architecture compliance, plan alignment, best practices, acceptance criteria, testing status, security review, and scope validation.
- [x] Implement workflow state transitions for request, analysis, plan, execution, test, review, governance, delivery, monitoring, and memory.
- [x] Implement `evaluateGateSeverity()` and `validateGateResult()`.
- [x] Implement `validateDecisionLedgerEntry()` and `validateIssueLedgerEntry()`.
- [x] Run:

```powershell
npm run test -- tests/delivery-system/governance.test.ts tests/delivery-system/ledger.test.ts
npm run typecheck
```

Expected: tests pass and typecheck exits 0.

Actual: completed on 2026-05-13. `npm run test -- tests/delivery-system/governance.test.ts tests/delivery-system/ledger.test.ts tests/delivery-system/boundary.test.ts` passed 11 tests after review fixes. `npm run typecheck` passed. `npm run verify` passed.

## Task 5: Read-Only Command Center UI

Status: completed after `docs/autopilot/delivery-system-read-only-ui-decision.md` approved a static read-only Astro command center.

**Files:**
- Create or modify: `src/pages/autopilot.astro`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Render layers, roles, gates, workflow states, and model policy from typed data.
- [x] Mark the UI as read-only and non-executing.
- [x] Show current architecture record path, work log path, next review date, and current risks.
- [x] Avoid remote connector calls in the UI.
- [x] Run:

```powershell
npm run typecheck
npm run build
```

Expected: static build succeeds.

Actual: completed on 2026-05-13. `npm run typecheck` passed and `npm run build` built one static page at `/autopilot/index.html`.

## Task 6: Browser And Accessibility Smoke

**Files:**
- Create: `tests/autopilot-delivery-system.spec.ts`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Add Playwright check for `/autopilot`.
- [x] Verify delivery-system heading, governance gates, ledger summary, workflow map, and read-only status are visible.
- [x] Verify no horizontal overflow at mobile and desktop widths.
- [x] Run:

```powershell
npm run test:e2e -- tests/autopilot-delivery-system.spec.ts
```

Expected: new smoke test passes.

Actual: completed on 2026-05-13. First run failed because Playwright Chromium was not installed. `npx playwright install chromium` completed, then `npm run test:e2e` passed 3 Chromium tests.

## Task 7: Connector Snapshot Procedure

**Files:**
- Create: `docs/autopilot/delivery-system-connector-snapshots.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Document GitHub read-only snapshot procedure for repositories, issues, PRs, branches, and CI.
- [x] Document Linear snapshot procedure that requires workspace/team/project identifiers before reading or writing.
- [x] Document Vercel snapshot procedure for projects, deployments, environment names, and logs without exposing secrets.
- [x] Document Cloudflare snapshot procedure for Pages, Workers, D1, and bindings without account IDs or tokens.
- [x] Document Docket as future product knowledge source when callable tools are available.
- [x] State that connector snapshots are reviewed evidence, not automatic source of truth.

Actual: completed on 2026-05-13 in `docs/autopilot/delivery-system-connector-snapshots.md`.

## Task 8: Execution Engine Decision Record

**Files:**
- Create: `docs/autopilot/delivery-system-execution-engine-options.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Compare Vercel Workflow DevKit, Cloudflare Workflows/Agents/Durable Objects, GitHub Actions, Codex automations, and local queue/state-machine options.
- [x] Recheck current official docs before recording API, pricing, or stability claims.
- [x] Score each option on durability, human approval, retries, logs, local development, security, cost, vendor lock-in, and fit with Astro/Cloudflare.
- [x] Recommend no execution runtime until typed contracts and read-only UI are stable.
- [x] Define phase-5 trigger criteria for bounded execution MVP.

Actual: completed on 2026-05-13 in `docs/autopilot/delivery-system-execution-engine-options.md`. Official/current docs were checked for Vercel Workflow, Workflow DevKit, Cloudflare Workflows, Durable Objects, Queues, Agents, GitHub Actions, and Codex Automations. No pricing commitment was recorded.

## Task 9: Governance Integration Into Prompt Pack

**Files:**
- Modify: `docs/autopilot/v3-prompt-pack.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [x] Add the multi-agent delivery system as an explicit future architecture under Autopilot governance.
- [x] Add gate that every worker output must include role, mode, scope, architecture impact, ledger impact, tests, and next action.
- [x] Add rejection rule for self-approval, unlogged issues, missing ledger updates, missing architecture impact, and unverified plugin facts.
- [x] Run:

```powershell
rg -n "self-approval|ledger impact|architecture impact|multi-agent delivery" docs/autopilot/v3-prompt-pack.md
git diff --check
```

Expected: prompt pack contains governance rules and no whitespace errors.

Actual: completed on 2026-05-13. Prompt pack now names the multi-agent delivery future architecture, requires ledger-impact handoff evidence, and rejects self-approval, unlogged issues, missing ledger updates, missing architecture impact, and unverified plugin facts.

## Task 10: Full Documentation Gate

**Files:**
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- Modify: `docs/autopilot/2026-05-10-autopilot-run-log.md`

- [x] Run:

```powershell
rg -n "Multi-Agent Autonomous Delivery System|decision_id|issue_id|gate_result|Autopilot monitors|Nobody approves" docs
$tokens = @('TB' + 'D', 'TO' + 'DO', 'fill ' + 'in', 'implement ' + 'later')
rg -n ($tokens -join '|') docs/autopilot docs/projects docs/superpowers/plans/2026-05-13-multi-agent-autonomous-delivery-system.md docs/superpowers/specs/2026-05-13-multi-agent-autonomous-delivery-system-design.md
git diff --check
```

Expected: first search finds all core concepts, placeholder search has no matches, diff check has no whitespace errors.

Actual: completed on 2026-05-13 and refreshed after Tasks 3-6. Required-term search found the multi-agent delivery architecture, ledger schemas, gate result, connector snapshot, execution-engine deferral decision, phase-5 trigger criteria, self-approval rejection, ledger impact, and architecture impact across `docs/`. Placeholder-token scan returned no matches. Product runtime/deployment path scans returned no matches. `git diff --check` passed with only LF/CRLF normalization warnings. Final `npm run verify` passed typecheck, Vitest, Astro build, and Playwright e2e.

## Acceptance Criteria

- Multi-agent delivery system has a project architecture record and work log.
- Central registry lists the project, review date, status, runtime surface, and risks.
- Design spec captures layers, roles, governance, workflows, memory, model policy, plugin usage, and phase boundaries.
- Implementation plan is phase-gated and forbids premature autonomous execution.
- Future implementation starts with typed contracts and tests before UI or runtime engine work.
- Prompt pack integration requires architecture impact, ledger impact, and work-log evidence.
- No remote mutation, credentials, or durable execution runtime are added by this planning phase.
