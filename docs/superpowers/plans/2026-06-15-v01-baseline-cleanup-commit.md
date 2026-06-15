# ClientOps CMS v0.1 Baseline Cleanup And Commit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a clean, reviewable v0.1 baseline commit sequence for ClientOps CMS without leaking secrets, staging generated artifacts, or mixing future feature work into the baseline.

**Architecture:** The baseline is split into reversible git commits by responsibility: project skeleton, application source, tests/scripts, and documentation/mesh. The running core remains Payload/Postgres/Next.js; the Decision Mesh remains governance and must not be treated as canonical runtime state.

**Tech Stack:** PowerShell, Git, Next.js 16, Payload CMS 3, PostgreSQL/Docker Compose, Node test runner, Superpowers planning/verification workflows, optional GitHub and Codex Security plugins after local verification.

---

## Advisory Inputs

Claude advisory accepted:

- Use explicit path-based staging, never broad dot staging.
- Run secret and ignored-file checks before every commit.
- Split baseline into logical commits.
- Treat untracked code as the largest immediate risk.

Gemini advisory accepted:

- Keep final baseline verification mandatory.

Gemini advisory rejected for this cleanup:

- Do not implement transactional task claims as part of the cleanup commit.
- Do not implement scheduled opportunity purge as part of the cleanup commit.
- Those are v0.2 feature work and must not be mixed into the v0.1 baseline commit.

## Relevant Skills And Plugins

Use now:

- `superpowers:brainstorming` for approach selection and advisory comparison.
- `superpowers:writing-plans` for this plan.
- `superpowers:verification-before-completion` before claiming any cleanup or commit step is complete.
- `mcp__autopilot_decision_mesh.select_reasoning_model_route` as read-only mesh routing evidence.

Use during execution:

- `superpowers:executing-plans` or `superpowers:subagent-driven-development` to execute this plan task-by-task.
- `superpowers:finishing-a-development-branch` after all local commits and verification pass.
- `github:github` only after the local branch is committed and the user asks to push or open a PR.
- `codex-security:security-diff-scan` only after the baseline diff is stable, or on explicit request, because the current branch diff is broad.

Do not use for this cleanup:

- Cloudflare, Vercel, OpenAI Developers, Canva, Figma, Data Analytics, Sales, Shopify, Hugging Face, NVIDIA, iOS, Android, Game Studio.
- Browser plugin, unless the user asks for visual admin verification or a local UI smoke check.
- Provider API key creation tools.
- Any plugin that mutates a remote service before the local baseline commit exists.

## Stop Conditions

Stop immediately if any of these occur:

- `.env` is not ignored.
- A staged diff contains real API keys, private keys, credentials, cookies, or tokens.
- `src/payload-types.ts`, `.next/`, `node_modules/`, `backups/`, `tsconfig.tsbuildinfo`, or dev logs are staged.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test`, or `npm.cmd run build` fails.
- Docker smoke is required and Docker/Postgres readiness fails.
- A command would discard or overwrite uncommitted work.
- The staged file list differs from the intended commit group.
- Claude/Gemini or another advisory model suggests a change that is not verified against local files.

## Files And Ownership

Project skeleton commit:

- `.gitignore`
- `.env.example`
- `docker-compose.yml`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.mjs`
- `next-env.d.ts`
- `eslint.config.mjs`

Application source commit:

- `src/`
- Excluded by ignore and not staged: `src/payload-types.ts`

Tests and scripts commit:

- `tests/`
- `scripts/`

Documentation and mesh commit:

- `README.md`
- `docs/autopilot/`
- `docs/projects/`
- `docs/superpowers/plans/`
- `docs/superpowers/specs/2026-06-13-autopilot-mesh-usage-limits-design.md`
- `docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md`

Never stage:

- `.env`
- `.env.local`
- `.next/`
- `node_modules/`
- `backups/`
- `dev-server.err.log`
- `dev-server.out.log`
- `src/payload-types.ts`
- `tsconfig.tsbuildinfo`

---

### Task 1: Preflight Inventory And Secret Safety

**Files:**
- Read: `.gitignore`
- Read: `.env.example`
- Read: `git status`
- Modify: none

- [ ] **Step 1: Verify ignored sensitive files**

Run:

```powershell
git check-ignore -v .env .env.example src/payload-types.ts tsconfig.tsbuildinfo node_modules .next backups 2>$null
```

Expected:

- `.env` is ignored.
- `.env.example` is unignored by `!.env.example`.
- `src/payload-types.ts` is ignored.
- `tsconfig.tsbuildinfo`, `node_modules`, `.next`, and `backups` are ignored.

- [ ] **Step 2: Verify working tree inventory**

Run:

```powershell
git status --short --ignored=matching
```

Expected:

- Modified specs are visible.
- New baseline files and directories are visible as untracked.
- Ignored runtime/generated files are shown with `!!`, not staged.

- [ ] **Step 3: Run broad secret keyword scan excluding ignored/runtime outputs**

Run:

```powershell
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!backups/**' --glob '!.env' --glob '!src/payload-types.ts' --glob '!tsconfig.tsbuildinfo' "(TOKEN|SECRET|PASSWORD|DATABASE_URL|API_KEY|PRIVATE_KEY|ACCESS_KEY)" .
```

Expected:

- `.env.example` contains example replacement values only.
- `docker-compose.yml` may contain the local dev Postgres password `postgres`.
- Code/docs may reference token names but must not contain real token values.

- [ ] **Step 4: Run high-signal secret pattern scan**

Run:

```powershell
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!backups/**' --glob '!.env' --glob '!package-lock.json' "(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----)" .
```

Expected:

- No real private keys or provider tokens are present.
- Any match must be reviewed before staging.

- [ ] **Step 5: Record preflight result**

If all checks match expectations, continue. If any check does not match, stop and fix the cause before staging anything.

---

### Task 2: Verification Pass 1 Before Staging

**Files:**
- Read: project runtime and tests
- Modify: none

- [ ] **Step 1: Run lint**

Run:

```powershell
npm.cmd run lint
```

Expected:

- Exit code 0.

- [ ] **Step 2: Run typecheck**

Run:

```powershell
npm.cmd run typecheck
```

Expected:

- Exit code 0.

- [ ] **Step 3: Run test suite**

Run:

```powershell
npm.cmd test
```

Expected:

- Exit code 0.
- Current expected test count is 55 passing tests.

- [ ] **Step 4: Run production build**

Run:

```powershell
npm.cmd run build
```

Expected:

- Exit code 0.

---

### Task 3: Optional Docker Runtime Verification

**Files:**
- Read: `docker-compose.yml`
- Read: smoke scripts
- Modify: none

- [ ] **Step 1: Start or verify Postgres**

Run:

```powershell
docker compose up -d --wait
```

Expected:

- Postgres service starts and reports healthy.

- [ ] **Step 2: Check database readiness**

Run:

```powershell
docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops
```

Expected:

- Output includes `accepting connections`.

- [ ] **Step 3: Run ClientOps smoke**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1
```

Expected:

- Health, ready, workflow, and lead checks pass.

- [ ] **Step 4: Run opportunity smoke**

Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-opportunities.ps1
```

Expected:

- Fixture opportunity ingest passes or replays idempotently.

- [ ] **Step 5: If Docker is unavailable**

Do not run destructive Docker cleanup. Run:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/docker-doctor.ps1
```

Expected:

- Diagnostic output identifies the Docker/Postgres blocker.

If Docker cannot be recovered quickly, stop and ask whether to proceed with static-only baseline evidence.

---

### Task 4: Commit 1 - Project Skeleton

**Files:**
- Stage: `.gitignore`, `.env.example`, `docker-compose.yml`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.mjs`, `next-env.d.ts`, `eslint.config.mjs`
- Modify: git index only

- [ ] **Step 1: Stage only skeleton files**

Run:

```powershell
git add -- .gitignore .env.example docker-compose.yml package.json package-lock.json tsconfig.json next.config.mjs next-env.d.ts eslint.config.mjs
```

Expected:

- Only skeleton files are staged.

- [ ] **Step 2: Verify staged file list**

Run:

```powershell
git diff --cached --name-only
```

Expected staged files:

```text
.env.example
.gitignore
docker-compose.yml
eslint.config.mjs
next-env.d.ts
next.config.mjs
package-lock.json
package.json
tsconfig.json
```

- [ ] **Step 3: Run staged whitespace check**

Run:

```powershell
git diff --cached --check
```

Expected:

- No output and exit code 0.

- [ ] **Step 4: Inspect staged diff**

Run:

```powershell
git diff --cached
```

Expected:

- Only skeleton/config content.
- No real secrets.

- [ ] **Step 5: Commit skeleton**

Run:

```powershell
git commit -m "chore: add clientops v0.1 project skeleton"
```

Expected:

- Commit succeeds.

---

### Task 5: Commit 2 - Application Source

**Files:**
- Stage: `src/`
- Exclude: `src/payload-types.ts` through `.gitignore`
- Modify: git index only

- [ ] **Step 1: Stage application source**

Run:

```powershell
git add -- src
```

Expected:

- Source files are staged.
- `src/payload-types.ts` remains ignored.

- [ ] **Step 2: Verify generated Payload types are not staged**

Run:

```powershell
git status --short --ignored=matching src/payload-types.ts
git diff --cached --name-only | Select-String -Pattern "src/payload-types.ts"
```

Expected:

- First command shows `!! src/payload-types.ts`.
- Second command prints no match.

- [ ] **Step 3: Verify staged source list**

Run:

```powershell
git diff --cached --name-only
```

Expected:

- Staged files are under `src/`.
- Skeleton files are already committed and should not appear unless changed after Commit 1.

- [ ] **Step 4: Run source-specific verification**

Run:

```powershell
npm.cmd run typecheck
npm.cmd test
```

Expected:

- Both commands exit 0.

- [ ] **Step 5: Inspect staged diff and commit source**

Run:

```powershell
git diff --cached --check
git diff --cached
git commit -m "feat: add clientops cms application source"
```

Expected:

- Whitespace check exits 0.
- Diff contains source only.
- Commit succeeds.

---

### Task 6: Commit 3 - Tests, Fixtures, And Scripts

**Files:**
- Stage: `tests/`, `scripts/`
- Modify: git index only

- [ ] **Step 1: Stage tests and scripts**

Run:

```powershell
git add -- tests scripts
```

Expected:

- Tests, scripts, and fixture JSON files are staged.

- [ ] **Step 2: Verify staged file list**

Run:

```powershell
git diff --cached --name-only
```

Expected:

- Staged files are under `tests/` and `scripts/`.
- No `.env`, logs, build outputs, backups, or generated type files.

- [ ] **Step 3: Run script/test verification**

Run:

```powershell
npm.cmd test
```

Expected:

- Exit code 0.
- Current expected test count is 55 passing tests.

- [ ] **Step 4: Inspect staged diff and commit tests/scripts**

Run:

```powershell
git diff --cached --check
git diff --cached
git commit -m "test: add clientops tests and smoke scripts"
```

Expected:

- Whitespace check exits 0.
- Diff contains tests/scripts only.
- Commit succeeds.

---

### Task 7: Commit 4 - Documentation And Decision Mesh

**Files:**
- Stage: `README.md`, `docs/autopilot/`, `docs/projects/`, `docs/superpowers/plans/`, modified design specs
- Modify: git index only

- [ ] **Step 1: Stage documentation and mesh files**

Run:

```powershell
git add -- README.md docs/autopilot docs/projects docs/superpowers/plans docs/superpowers/specs/2026-06-13-autopilot-mesh-usage-limits-design.md docs/superpowers/specs/2026-06-13-cz-sk-it-opportunity-monitor-design.md
```

Expected:

- Documentation and mesh files are staged.

- [ ] **Step 2: Verify staged docs**

Run:

```powershell
git diff --cached --name-only
```

Expected:

- Staged files are README and `docs/` paths only.

- [ ] **Step 3: Run documentation marker scan**

Run:

```powershell
Select-String -Path README.md,docs\projects\clientops-cms\v0.1-project-index.md,docs\projects\clientops-cms\architecture.md -Pattern 'TBD|TODO|fill in' -CaseSensitive:$false
```

Expected:

- No output.

- [ ] **Step 4: Inspect staged diff and commit docs**

Run:

```powershell
git diff --cached --check
git diff --cached
git commit -m "docs: add clientops v0.1 decision mesh baseline"
```

Expected:

- Whitespace check exits 0.
- Diff contains docs only.
- Commit succeeds.

---

### Task 8: Verification Pass 2 After Commits

**Files:**
- Read: full project
- Modify: none

- [ ] **Step 1: Verify branch status**

Run:

```powershell
git status --short --ignored=matching
```

Expected:

- No unstaged tracked changes unless intentionally deferred.
- Ignored runtime/generated files remain `!!`.

- [ ] **Step 2: Run full verification**

Run:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
```

Expected:

- All commands exit 0.

- [ ] **Step 3: Run Docker smoke if available**

Run:

```powershell
docker compose up -d --wait
docker compose exec -T postgres pg_isready -U postgres -d autopilot_clientops
powershell -ExecutionPolicy Bypass -File scripts/smoke-clientops.ps1
powershell -ExecutionPolicy Bypass -File scripts/smoke-opportunities.ps1
```

Expected:

- Docker/Postgres ready.
- Smoke checks pass.

---

### Task 9: Optional Security And Review Pass

**Files:**
- Read: committed branch diff
- Modify: none unless a verified issue is found and separately planned

- [ ] **Step 1: Decide whether to run full Codex Security diff scan**

Use full `codex-security:security-diff-scan` only if the user wants a full security report before PR/push. The diff is broad, so this can be time-consuming.

Mandatory lightweight alternative:

```powershell
rg -n --glob '!node_modules/**' --glob '!.next/**' --glob '!backups/**' --glob '!.env' --glob '!package-lock.json' "(sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{20,}|-----BEGIN (RSA |OPENSSH |EC |DSA |)PRIVATE KEY-----)" .
```

Expected:

- No real secrets.

- [ ] **Step 2: Optional GitHub plugin use**

Use GitHub plugin only after user asks to push or open a PR. Do not create remote state during cleanup planning.

---

### Task 10: Final Integration Choice

**Files:**
- Read: git branch state
- Modify: none until user chooses

- [ ] **Step 1: Use finishing-a-development-branch workflow**

After all commits and verification pass, invoke `superpowers:finishing-a-development-branch`.

Expected menu:

```text
1. Merge back to base branch locally
2. Push and create a Pull Request
3. Keep the branch as-is
4. Discard this work
```

- [ ] **Step 2: Do not merge or push without explicit user choice**

Expected:

- Local baseline exists.
- Next action is controlled by the user.

## Self-Review

Spec coverage:

- Cleanup and commit planning is covered by Tasks 1-10.
- Triple verification is covered by Tasks 1, 2, 4-8, and 9.
- Skills/plugins inventory is covered in `Relevant Skills And Plugins`.
- Mesh use is read-only and advisory until execution.

Open marker scan:

- This plan has no open-ended implementation steps.

Type and command consistency:

- Commands use PowerShell-compatible paths and `npm.cmd`.
- Git staging uses explicit paths.
- No destructive commands are included.
