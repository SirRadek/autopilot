# Audit Remediation Safe Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the audit findings that are already decided by the ClientOps CMS Decision Mesh, while deferring policy choices that need owner approval.

**Architecture:** Keep Payload/Postgres as canonical runtime state and the project Decision Mesh as governance. Make audit events append-only through normal Payload access, keep workflow event payloads PII-minimized, enforce stronger replay/collision semantics, and update docs so current state no longer contradicts the merged baseline.

**Tech Stack:** Next.js 16, Payload CMS 3, PostgreSQL, TypeScript, Node test runner, PowerShell, Decision Mesh docs.

---

## Deferred Owner Decisions

These are real audit findings but require an explicit owner decision before implementation:

- Repoint or regenerate the active Decision Mesh MCP router so it no longer returns archived `src/data/delivery-system/*`, `AGENTS.md`, or `docs/autopilot/delivery-system-model-policy.md` as current root files.
- Decide GraphQL policy: disable `/graphql` and `/graphql-playground`, restrict them to admin-only, or keep and test them as an internal Payload surface.
- Decide dependency remediation strategy for current `npm audit` high findings: upgrade Payload/Next/Payload GraphQL/Drizzle chain, accept local-only dev-server risk temporarily, or pin a patched upstream version after compatibility testing.
- Decide whether opportunity purge should always change `opportunity-items.status` to `purged`, or whether `personalDataPurgedAt` remains the canonical purge marker while status preserves the business lifecycle.
- Decide whether public lead rate limiting should be in-process only, reverse-proxy based, or backed by durable storage before production.

## Task 1: Access And Audit Event Invariants

**Files:**
- Modify: `src/access/isAdmin.ts`
- Modify: `src/collections/*.ts`
- Modify: `src/globals/SiteSettings.ts`
- Modify: `src/collections/WorkflowEvents.ts`
- Test: `tests/access.test.ts`

- [ ] **Step 1: Add access helpers**

Add `isAdminOrEditor` and `denyAccess` in `src/access/isAdmin.ts`:

```ts
export const isAdminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(user?.roles?.some((role) => role === 'admin' || role === 'editor'))
}

export const denyAccess: Access = () => false
```

- [ ] **Step 2: Restrict operational collection CRUD**

For ClientOps operational collections and `SiteSettings`, use `isAdminOrEditor` instead of broad `isAuthenticated` for create/update/delete, and use `isAdminOrEditor` for reads where the surface contains internal work, leads, tasks, events, sources, or opportunities.

- [ ] **Step 3: Make workflow events append-only through trusted server code**

In `src/collections/WorkflowEvents.ts`, set:

```ts
access: {
  create: denyAccess,
  read: isAdminOrEditor,
  update: denyAccess,
  delete: denyAccess
}
```

Keep `appendWorkflowEvent()` working through `overrideAccess: true`.

- [ ] **Step 4: Enforce required event envelope fields**

Mark mesh-required fields as `required: true`: `eventId`, `eventType`, `occurredAt`, `correlationId`, `idempotencyKey`, `projectSlug`, `actorType`, `actorId`, `policyVersion`, `source`, `payload`, `result`, and `error`.

- [ ] **Step 5: Add access tests**

Create `tests/access.test.ts` to verify admin/editor access is allowed, client access is denied for staff-only helpers, and `denyAccess` always returns false.

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm.cmd test -- tests/access.test.ts tests/mesh-contracts.test.ts
```

Expected: command exits 0.

## Task 2: Lead Event PII And Idempotency Collision

**Files:**
- Modify: `src/lib/workflow.ts`
- Modify: `tests/workflow.test.ts`

- [ ] **Step 1: Remove PII from lead task titles and payloads**

Change lead review titles from `Review lead: <type> - <name>` to a non-PII title such as `Review lead: <type> (#<leadId>)`. Keep the actual PII only in the canonical `leads` record.

- [ ] **Step 2: Keep lead workflow event payloads non-contact**

Restrict lead task payloads to non-contact routing metadata: `source`, `lead_id`, `correlation_id`, `idempotency_key`, `project_type`, `priority_reason`, `source_path`, and `next_action`.

- [ ] **Step 3: Redact collision payload values**

Change idempotency collision task title to a non-contact title and replace submitted/current values with a list of mismatched field names. Do not store email, name, company, message, current URL, or other lead values in task/event JSON.

- [ ] **Step 4: Compare the full normalized lead content**

Replace the three-field `leadMatchesExisting()` comparison with normalized comparison across all canonical lead fields stored in the `leads` collection: `name`, `email`, `company`, `projectType`, `audience`, `deadline`, `currentUrl`, `budgetRange`, `message`, `sourcePath`, `referrer`, and `locale`.

- [ ] **Step 5: Add regression tests**

Update `tests/workflow.test.ts` to verify:

- lead review payload does not contain name, email, company, or message
- workflow event payload for a created lead does not contain contact values
- same idempotency key with changed company or budget creates a collision
- collision task/event payload contains field names, not submitted/current contact values

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm.cmd test -- tests/workflow.test.ts
```

Expected: command exits 0.

## Task 3: Manual Override Actor Evidence

**Files:**
- Modify: `src/app/api/workflow/tasks/route.ts`
- Modify: `tests/task-retry.test.ts` or create a route-helper unit if needed

- [ ] **Step 1: Require actorId for manual override API calls**

When `manualOverrideReason` is present, reject missing or blank `actorId` with HTTP 400 before updating the task.

- [ ] **Step 2: Keep worker default only for worker events**

Use `clientops-worker` fallback only for non-human worker mutations. Human override events must use the explicit actor id supplied by the caller.

- [ ] **Step 3: Add test coverage**

If route-level tests are too heavy for this slice, extract a small helper from the route and test that manual override without actor id is rejected while worker mutation fallback remains unchanged.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm.cmd test -- tests/task-retry.test.ts
```

Expected: command exits 0.

## Task 4: Opportunity Purge Contact Redaction

**Files:**
- Modify: `src/lib/opportunities.ts`
- Modify: `tests/opportunities.test.ts`

- [ ] **Step 1: Redact contact data from description on purge**

Add a local helper that removes common email and phone patterns from `description`. Keep non-contact description text where possible.

- [ ] **Step 2: Record description as a cleared or redacted field**

When purge changes the description, include `description` in the purge event `fields` array without restating the old value.

- [ ] **Step 3: Add regression test**

Extend purge tests so an opportunity description containing `jan@example.cz` and `+420 777 111 222` is redacted after purge and the purge event does not include those values.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm.cmd test -- tests/opportunities.test.ts
```

Expected: command exits 0.

## Task 5: Docs And Work-Log Alignment

**Files:**
- Modify: `README.md`
- Modify: `docs/projects/clientops-cms/v0.1-project-index.md`
- Modify: `docs/projects/clientops-cms/work-log.md`
- Modify: `docs/projects/clientops-cms/decision-mesh/README.md`
- Modify: `docs/projects/clientops-cms/decision-mesh/event-contracts.md`

- [ ] **Step 1: Remove completed baseline cleanup from next work**

Replace “Baseline cleanup and commit” with the current remediation priorities that do not require owner decisions.

- [ ] **Step 2: Mark historical plan as historical**

Add a short note in the project index or work log that `2026-06-15-v01-baseline-cleanup-commit.md` is historical baseline planning, not an active unchecked execution list.

- [ ] **Step 3: Clarify stop conditions**

Update project mesh README stop conditions to say these are conditional gates, not claims that every listed failure is currently present.

- [ ] **Step 4: Extend PII rule to all workflow events**

Update event contracts so lead, task, and opportunity workflow events all must avoid contact values unless a future owner-approved exception is documented.

- [ ] **Step 5: Add current remediation work-log entry**

Append a 2026-06-15 entry describing this remediation slice, files touched, verification run, and deferred owner decisions.

## Task 6: Final Verification

**Files:**
- Read: full repo
- Modify: none

- [ ] **Step 1: Run static verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 2: Run safety scans**

Run:

```powershell
git status --short
git diff --check
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!backups/**' --glob '!.env' --glob '!src/payload-types.ts' --glob '!tsconfig.tsbuildinfo' "(TOKEN|SECRET|PASSWORD|DATABASE_URL|API_KEY|PRIVATE_KEY|ACCESS_KEY)" .
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!backups/**' --glob '!.env' --glob '!package-lock.json' "(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----)" .
```

Expected: no whitespace errors, no tracked generated files, no real active secrets.

- [ ] **Step 3: Record unresolved owner decisions**

Final report must list the deferred owner decisions from the top of this plan and must not claim they were fixed.

## Self-Review

Spec coverage:

- Append-only workflow event invariant: Task 1.
- PII-free workflow event payloads: Task 2 and Task 4.
- Full lead idempotency collision: Task 2.
- Manual override actor identity: Task 3.
- Docs/log stale state: Task 5.
- Owner decisions deferred: top section and Task 6.

Placeholder scan:

- No task uses TBD, TODO, fill-in placeholders, or unspecified “add tests” without naming the behavior.

Type consistency:

- Access helpers use Payload `Access`.
- Workflow and opportunity changes stay in existing library surfaces.
- Tests use the existing Node test runner command.
