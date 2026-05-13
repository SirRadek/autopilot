# Multi-Agent Autonomous Delivery System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a governed, auditable, multi-agent delivery system that starts with architecture, memory, ledgers, gates, and read-only supervision before any autonomous execution is enabled.

**Architecture:** Keep the existing Astro repository static-first. Model the delivery system as typed contracts, Markdown architecture records, ledgers, and read-only command-center views before choosing a durable workflow runtime. Execution engines, remote mutation, and credentials remain locked behind later decision records and explicit approvals.

**Tech Stack:** Astro 6, TypeScript, Markdown docs, Vitest for contract tests, Playwright for future dashboard checks, GitHub/Linear/Vercel/Cloudflare/Docket plugins as supervised context sources, Superpowers process skills.

---

## Phase Rules

- Phase 0 and Phase 1 are required before any UI or execution runtime work.
- No remote mutation is allowed in this plan.
- No credentials, tokens, database IDs, private issue bodies, or private Docket/Linear/GitHub content may be committed.
- Autopilot is a standalone control-plane project; product projects must live in separate local roots and separate Git repositories.
- Planning records in the current checkout are transitional until the dedicated Autopilot repository split is completed.
- Every task must update the affected project work log.
- Every implementation task must state architecture impact.

## Planned File Structure

Create:

- `docs/projects/multi-agent-autonomous-delivery-system/architecture.md`
- `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- `docs/autopilot/delivery-system-governance.md`
- `docs/autopilot/delivery-system-ledgers.md`
- `docs/autopilot/delivery-system-model-policy.md`
- `docs/autopilot/delivery-system-execution-engine-options.md`
- `src/data/delivery-system/roles.ts`
- `src/data/delivery-system/gates.ts`
- `src/data/delivery-system/workflows.ts`
- `src/data/delivery-system/ledgers.ts`
- `src/data/delivery-system/modelPolicy.ts`
- `src/lib/delivery-system/governance.ts`
- `src/lib/delivery-system/ledger.ts`
- `tests/delivery-system/governance.test.ts`
- `tests/delivery-system/ledger.test.ts`

Modify:

- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/v3-prompt-pack.md`
- `docs/autopilot/2026-05-10-autopilot-run-log.md`

Later, after typed contracts pass:

- `src/pages/autopilot.astro`
- `src/components/autopilot/DeliverySystemOverview.astro`
- `src/components/autopilot/GovernanceGates.astro`
- `src/components/autopilot/LedgerSummary.astro`
- `src/components/autopilot/WorkflowMap.astro`

## Task 1: Project Onboarding And Architecture Baseline

**Files:**
- Create: `docs/projects/multi-agent-autonomous-delivery-system/architecture.md`
- Create: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- Modify: `docs/autopilot/project-architecture-registry.md`
- Modify: `docs/autopilot/2026-05-10-autopilot-run-log.md`

- [ ] Add registry row for `multi-agent-autonomous-delivery-system`.
- [ ] Write architecture record with system boundary, repository boundary, phase boundaries, plugin usage, data contracts, and forbidden actions.
- [ ] Write work-log entry with architecture impact and verification plan.
- [ ] Record the governance baseline in the main Autopilot run log.
- [ ] Run:

```powershell
rg -n "multi-agent-autonomous-delivery-system|Multi-Agent Autonomous Delivery System" docs
git diff --check
```

Expected: project appears in registry, architecture, work log, spec, plan, and run log; `git diff --check` has no whitespace errors.

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

- [ ] Define Business, Orchestrator, Architecture, Analysis, Execution, Testing, Review, Copywriting, Governance, Autopilot, and Memory layers.
- [ ] Define role permissions and explicit "must not" rules.
- [ ] Define decision matrix for blocker, major issue, minor issue, cosmetic issue, and pass.
- [ ] Define inline-fix rules, scope-drift flow, architecture-violation flow, and failed-test flow.
- [ ] Define decision ledger, issue ledger, analysis output, and gate result schemas.
- [ ] Define model policy that treats Qwen2.5-Coder 7B/14B as optional bounded worker candidates, not architecture or governance authorities.
- [ ] Run:

```powershell
rg -n "Nobody approves their own work|decision_id|issue_id|gate_result|Qwen2.5" docs/autopilot docs/projects
git diff --check
```

Expected: governance docs contain explicit rules and ledgers; no whitespace errors.

## Task 3: Typed Contract Tests First

**Files:**
- Create: `tests/delivery-system/governance.test.ts`
- Create: `tests/delivery-system/ledger.test.ts`
- Create later: `src/data/delivery-system/*.ts`
- Create later: `src/lib/delivery-system/*.ts`

- [ ] Write failing tests for role separation: implementers cannot approve their own work, testers cannot change business scope, Autopilot cannot approve delivery.
- [ ] Write failing tests for gate decisions: blocker and major issue require rework, minor issue allows inline fix only with evidence, pass allows progression.
- [ ] Write failing tests for ledger completeness: decision ledger and issue ledger require all mandatory fields.
- [ ] Run:

```powershell
npm run test -- tests/delivery-system/governance.test.ts tests/delivery-system/ledger.test.ts
```

Expected: fail because delivery-system modules do not exist yet.

## Task 4: Typed Registries And Pure Helpers

**Files:**
- Create: `src/data/delivery-system/roles.ts`
- Create: `src/data/delivery-system/gates.ts`
- Create: `src/data/delivery-system/workflows.ts`
- Create: `src/data/delivery-system/ledgers.ts`
- Create: `src/data/delivery-system/modelPolicy.ts`
- Create: `src/lib/delivery-system/governance.ts`
- Create: `src/lib/delivery-system/ledger.ts`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Implement typed roles for every layer in the user brief.
- [ ] Implement gate definitions for architecture compliance, plan alignment, best practices, acceptance criteria, testing status, security review, and scope validation.
- [ ] Implement workflow state transitions for request, analysis, plan, execution, test, review, governance, delivery, monitoring, and memory.
- [ ] Implement `evaluateGateSeverity()` and `validateGateResult()`.
- [ ] Implement `validateDecisionLedgerEntry()` and `validateIssueLedgerEntry()`.
- [ ] Run:

```powershell
npm run test -- tests/delivery-system/governance.test.ts tests/delivery-system/ledger.test.ts
npm run typecheck
```

Expected: tests pass and typecheck exits 0.

## Task 5: Read-Only Command Center UI

**Files:**
- Create or modify: `src/pages/autopilot.astro`
- Create: `src/components/autopilot/DeliverySystemOverview.astro`
- Create: `src/components/autopilot/GovernanceGates.astro`
- Create: `src/components/autopilot/LedgerSummary.astro`
- Create: `src/components/autopilot/WorkflowMap.astro`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Render layers, roles, gates, workflow states, and model policy from typed data.
- [ ] Mark the UI as read-only and non-executing.
- [ ] Show current architecture record path, work log path, next review date, and current risks.
- [ ] Avoid remote connector calls in the UI.
- [ ] Run:

```powershell
npm run typecheck
npm run build
```

Expected: static build succeeds.

## Task 6: Browser And Accessibility Smoke

**Files:**
- Create: `tests/autopilot-delivery-system.spec.ts`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Add Playwright check for `/autopilot`.
- [ ] Verify delivery-system heading, governance gates, ledger summary, workflow map, and read-only status are visible.
- [ ] Verify no horizontal overflow at mobile and desktop widths.
- [ ] Run:

```powershell
npm run test:e2e -- tests/autopilot-delivery-system.spec.ts
```

Expected: new smoke test passes.

## Task 7: Connector Snapshot Procedure

**Files:**
- Create: `docs/autopilot/delivery-system-connector-snapshots.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Document GitHub read-only snapshot procedure for repositories, issues, PRs, branches, and CI.
- [ ] Document Linear snapshot procedure that requires workspace/team/project identifiers before reading or writing.
- [ ] Document Vercel snapshot procedure for projects, deployments, environment names, and logs without exposing secrets.
- [ ] Document Cloudflare snapshot procedure for Pages, Workers, D1, and bindings without account IDs or tokens.
- [ ] Document Docket as future product knowledge source when callable tools are available.
- [ ] State that connector snapshots are reviewed evidence, not automatic source of truth.

## Task 8: Execution Engine Decision Record

**Files:**
- Create: `docs/autopilot/delivery-system-execution-engine-options.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Compare Vercel Workflow DevKit, Cloudflare Workflows/Agents/Durable Objects, GitHub Actions, Codex automations, and local queue/state-machine options.
- [ ] Recheck current official docs before recording API, pricing, or stability claims.
- [ ] Score each option on durability, human approval, retries, logs, local development, security, cost, vendor lock-in, and fit with Astro/Cloudflare.
- [ ] Recommend no execution runtime until typed contracts and read-only UI are stable.
- [ ] Define phase-5 trigger criteria for bounded execution MVP.

## Task 9: Governance Integration Into Prompt Pack

**Files:**
- Modify: `docs/autopilot/v3-prompt-pack.md`
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`

- [ ] Add the multi-agent delivery system as an explicit future architecture under Autopilot governance.
- [ ] Add gate that every worker output must include role, mode, scope, architecture impact, ledger impact, tests, and next action.
- [ ] Add rejection rule for self-approval, unlogged issues, missing ledger updates, missing architecture impact, and unverified plugin facts.
- [ ] Run:

```powershell
rg -n "self-approval|ledger impact|architecture impact|multi-agent delivery" docs/autopilot/v3-prompt-pack.md
git diff --check
```

Expected: prompt pack contains governance rules and no whitespace errors.

## Task 10: Full Documentation Gate

**Files:**
- Modify: `docs/projects/multi-agent-autonomous-delivery-system/work-log.md`
- Modify: `docs/autopilot/2026-05-10-autopilot-run-log.md`

- [ ] Run:

```powershell
rg -n "Multi-Agent Autonomous Delivery System|decision_id|issue_id|gate_result|Autopilot monitors|Nobody approves" docs
$tokens = @('TB' + 'D', 'TO' + 'DO', 'fill ' + 'in', 'implement ' + 'later')
rg -n ($tokens -join '|') docs/autopilot docs/projects docs/superpowers/plans/2026-05-13-multi-agent-autonomous-delivery-system.md docs/superpowers/specs/2026-05-13-multi-agent-autonomous-delivery-system-design.md
git diff --check
```

Expected: first search finds all core concepts, placeholder search has no matches, diff check has no whitespace errors.

## Acceptance Criteria

- Multi-agent delivery system has a project architecture record and work log.
- Central registry lists the project, review date, status, runtime surface, and risks.
- Design spec captures layers, roles, governance, workflows, memory, model policy, plugin usage, and phase boundaries.
- Implementation plan is phase-gated and forbids premature autonomous execution.
- Future implementation starts with typed contracts and tests before UI or runtime engine work.
- Prompt pack integration requires architecture impact, ledger impact, and work-log evidence.
- No remote mutation, credentials, or durable execution runtime are added by this planning phase.
