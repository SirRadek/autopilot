# Autopilot V3 Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Autopilot v3 as a local professional command center for project inventory, agent roles, skill/plugin coverage, documentation verification, and controlled implementation handoffs.

**Architecture:** Keep the current Astro app static-first. Add a separate `/autopilot` route so v3 work does not disturb the existing Radeq public page. Use typed registries for projects, agents, skills, verification gates, and prompts before adding any durable execution engine.

**Tech Stack:** Astro 6, React 19 islands only where needed, Tailwind 4, TypeScript, Vitest, Playwright, Cloudflare Pages/D1 later, GitHub CLI/connector for inventory later, Context7 and official docs for current library facts.

---

## Verified Baseline

- Workspace: `C:\Users\sirok\Documents\Autopilot`
- Current app: Astro/React/Tailwind static site with Cloudflare Pages function for lead capture.
- Current checks passed on 2026-05-10:
  - `npm run test`
  - `npm run typecheck`
  - `npm run build`
- Current build warning: one chunk larger than 500 kB after minification.
- Local workspace is not a Git repository.
- GitHub CLI is authenticated as `SirRadek`.
- Gemini CLI exists at version `0.41.2`.
- Requested Gemini model `gemini-3.1-pro` failed with `ModelNotFoundError`; do not assume it is available.

## Documentation Sources Checked

- Astro docs through Context7: React islands require explicit `client:*` directives; `client:load`, `client:idle`, and `client:visible` control hydration timing.
- Cloudflare Workers/Pages docs through Context7: use Wrangler-generated binding types such as `npx wrangler types` to catch Cloudflare binding mismatches.
- Vercel Workflow public docs search: Workflow DevKit and DurableAgent exist, but `@workflow/ai` is described as experimental in current docs. Treat it as a phase-2 research item, not v3 MVP foundation.

## V3 MVP Scope

Build first:

- `/autopilot` dashboard route.
- Static project inventory seeded from known local/GitHub repositories.
- Skill/plugin registry for Superpowers, GitHub, Cloudflare, Codex Security, Vercel, Context7, Gemini CLI, and local Caveman mode.
- Agent role library with copy-ready prompts.
- Verification gate model: source check, design/spec check, test check, security check, browser check, handoff check.
- Provider-neutral model policy: no Qwen dependency; model/provider names are data, not hardcoded logic.

Do not build yet:

- Autonomous execution loop.
- Background task runner.
- Real GitHub mutation from UI.
- Stored credentials.
- Vercel Workflow or Cloudflare Agent runtime.
- Multi-provider LLM gateway.

## Planned File Structure

Create:

- `src/pages/autopilot.astro` - new v3 dashboard route.
- `src/data/autopilot/projects.ts` - typed project inventory seed.
- `src/data/autopilot/skills.ts` - typed skill/plugin registry.
- `src/data/autopilot/agents.ts` - typed agent role catalog.
- `src/data/autopilot/verification.ts` - verification gates and status model.
- `src/data/autopilot/providers.ts` - provider-neutral model capability policy.
- `src/lib/autopilot/prompts.ts` - pure prompt assembly helpers.
- `src/lib/autopilot/inventory.ts` - pure filtering/grouping helpers.
- `src/components/autopilot/AutopilotShell.astro` - static dashboard layout.
- `src/components/autopilot/ProjectInventory.astro` - project cards/table.
- `src/components/autopilot/SkillRegistry.astro` - skill/plugin matrix.
- `src/components/autopilot/AgentPromptLibrary.astro` - prompt cards.
- `src/components/autopilot/VerificationGates.astro` - gate checklist/status UI.
- `tests/autopilot/inventory.test.ts` - pure inventory tests.
- `tests/autopilot/prompts.test.ts` - prompt assembly tests.
- `docs/autopilot/v3-prompt-pack.md` - copy-ready worker prompts.

Modify:

- `src/styles/global.css` - only if existing design tokens cannot support `/autopilot`.
- `package.json` - only if a new script is needed; prefer existing scripts.
- `playwright.config.ts` - only if `/autopilot` needs a dedicated smoke target.

Avoid:

- Changing `src/pages/index.astro` unless navigation to `/autopilot` is explicitly wanted.
- Reworking existing Radeq page content.
- Adding runtime dependencies before a task proves they are needed.

## Implementation Tasks

### Task 1: Data Contracts First

**Files:**
- Create: `tests/autopilot/inventory.test.ts`
- Create: `tests/autopilot/prompts.test.ts`
- Create later: `src/data/autopilot/*.ts`
- Create later: `src/lib/autopilot/*.ts`

- [ ] Write failing tests for project grouping: local project, GitHub project, deployment target, and priority.
- [ ] Write failing tests for skill registry grouping: process, platform, security, docs, model/provider, compression.
- [ ] Write failing tests for prompt assembly: every prompt includes goal, scope, constraints, verification, output format, and hallucination-control rule.
- [ ] Run `npm run test` and confirm only new tests fail for missing modules.
- [ ] Implement minimal typed data and pure helpers.
- [ ] Run `npm run test` and confirm pass.

### Task 2: Static V3 Dashboard Route

**Files:**
- Create: `src/pages/autopilot.astro`
- Create: `src/components/autopilot/AutopilotShell.astro`
- Create: `src/components/autopilot/ProjectInventory.astro`
- Create: `src/components/autopilot/SkillRegistry.astro`
- Create: `src/components/autopilot/VerificationGates.astro`

- [ ] Build `/autopilot` as static Astro first.
- [ ] Render project inventory from typed data.
- [ ] Render skill/plugin coverage from typed data.
- [ ] Render verification gates from typed data.
- [ ] Keep dashboard useful without client-side JavaScript.
- [ ] Use React only if copying/filtering prompts needs client interactivity.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.

### Task 3: Agent Prompt Library

**Files:**
- Create: `src/components/autopilot/AgentPromptLibrary.astro`
- Create: `docs/autopilot/v3-prompt-pack.md`
- Modify: `src/data/autopilot/agents.ts`
- Modify: `src/lib/autopilot/prompts.ts`

- [ ] Add prompt entries for supervisor, explorer, planner, UI builder, backend integrator, docs verifier, security reviewer, QA verifier, Gemini critic, and execution-engine researcher.
- [ ] Ensure every prompt states no implementation unless explicitly assigned.
- [ ] Ensure every prompt requires source citation for external facts.
- [ ] Ensure every prompt requires exact file paths for codebase claims.
- [ ] Render prompts on `/autopilot`.
- [ ] Export same prompt pack to Markdown.
- [ ] Run `npm run test`.
- [ ] Run `npm run typecheck`.

### Task 4: Verification And Hallucination Controls

**Files:**
- Modify: `src/data/autopilot/verification.ts`
- Modify: `src/components/autopilot/VerificationGates.astro`
- Modify: `docs/autopilot/v3-prompt-pack.md`

- [ ] Define gates: local context, current docs, source citation, test evidence, security review, browser evidence, final handoff.
- [ ] Add gate statuses: `required`, `blocked`, `passed`, `skipped_with_reason`.
- [ ] Add dashboard text that makes skipped checks explicit.
- [ ] Add prompts that force workers to list assumptions separately from facts.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.

### Task 5: Project Inventory Refresh Procedure

**Files:**
- Create: `docs/autopilot/v3-inventory-refresh.md`
- Modify: `src/data/autopilot/projects.ts`

- [ ] Document manual inventory refresh commands:
  - `gh repo list --limit 50`
  - `gh issue list --repo OWNER/REPO --limit 20`
  - `gh pr list --repo OWNER/REPO --limit 20`
- [ ] State that connector/CLI output must be reviewed before updating typed seed data.
- [ ] Keep UI read-only in v3 MVP.
- [ ] Run `npm run typecheck`.

### Task 6: Future Execution Engine Decision Record

**Files:**
- Create: `docs/autopilot/v3-execution-engine-options.md`

- [ ] Compare Vercel Workflow, Cloudflare Workflows/Agents, GitHub Actions, and local Codex automations.
- [ ] Mark Vercel Workflow DurableAgent as experimental until current docs and API signatures are verified again at implementation time.
- [ ] Choose no execution runtime for v3 MVP.
- [ ] Define phase-2 trigger: only add durable execution after the dashboard has stable task, prompt, and verification contracts.

### Task 7: Browser And Accessibility Smoke

**Files:**
- Modify: `tests/smoke.spec.ts` or create `tests/autopilot-smoke.spec.ts`

- [ ] Add a Playwright smoke check for `/autopilot`.
- [ ] Verify dashboard heading, project inventory, skill registry, agent prompts, and verification gates are visible.
- [ ] Run `npm run test:e2e`.
- [ ] Record screenshots only if visual review is requested.

## Copy-Ready Worker Prompts

### 1. Supervisor Prompt

```text
You are Autopilot v3 supervisor for C:\Users\sirok\Documents\Autopilot.

Goal: coordinate a docs-first implementation of the local /autopilot command center.

Rules:
- Do not implement code unless the current task explicitly assigns implementation.
- Treat local repository evidence as source of truth for codebase claims.
- Treat external library/API facts as untrusted until checked through Context7 or official docs.
- Separate facts, assumptions, and recommendations.
- No Qwen dependency. Provider/model names must remain configurable data.
- Do not initialize Git or commit unless explicitly approved; this workspace is currently not a Git repository.

Output:
- Current task status.
- Files inspected or changed.
- Verification commands run and results.
- Blockers and next smallest action.
```

### 2. Repository Explorer Prompt

```text
You are repository explorer for Autopilot v3.

Inspect only. Do not edit files.

Workspace: C:\Users\sirok\Documents\Autopilot

Find:
- Current framework, scripts, routes, components, tests, functions, docs.
- Existing patterns for Astro components, React islands, typed data, tests, and Cloudflare functions.
- Files most likely affected by the /autopilot dashboard plan.
- Risks from current build output, especially large chunks or over-hydration.

Use:
- rg and rg --files first.
- package.json, src/pages, src/components, src/data, src/lib, tests, functions, docs.

Output:
- Concise map of relevant files.
- Existing conventions to follow.
- Exact risks with file paths.
- No code changes.
```

### 3. Data Contract Worker Prompt

```text
You own only Autopilot v3 typed data and pure helper tests.

Write scope:
- tests/autopilot/inventory.test.ts
- tests/autopilot/prompts.test.ts
- src/data/autopilot/projects.ts
- src/data/autopilot/skills.ts
- src/data/autopilot/agents.ts
- src/data/autopilot/verification.ts
- src/data/autopilot/providers.ts
- src/lib/autopilot/inventory.ts
- src/lib/autopilot/prompts.ts

Do not edit UI files.

Requirements:
- Start with failing Vitest tests.
- Model projects, skills, agents, verification gates, and providers as typed static data.
- Keep functions pure.
- Include no secrets and no live GitHub/API calls.
- Provider model must support future OpenAI, Gemini, local, and other providers without naming Qwen as required.

Verification:
- Run npm run test.
- Run npm run typecheck.

Output:
- Changed files.
- Test result.
- Any data assumptions.
```

### 4. Dashboard UI Worker Prompt

```text
You own only the static /autopilot dashboard UI.

Write scope:
- src/pages/autopilot.astro
- src/components/autopilot/AutopilotShell.astro
- src/components/autopilot/ProjectInventory.astro
- src/components/autopilot/SkillRegistry.astro
- src/components/autopilot/VerificationGates.astro
- src/components/autopilot/AgentPromptLibrary.astro
- src/styles/global.css only if existing tokens are insufficient

Do not edit tests or typed data unless a type mismatch blocks rendering.

Requirements:
- Static Astro first.
- No landing-page marketing treatment.
- Operational dashboard: dense, readable, professional.
- No nested cards inside cards.
- Keep text fitting on mobile and desktop.
- Use existing industrial visual direction without copying the public Radeq page structure.
- Avoid heavy React. Use Astro components unless interactivity is necessary.

Verification:
- Run npm run typecheck.
- Run npm run build.

Output:
- Changed files.
- Screenshot path only if browser verification was run.
- Build/typecheck result.
```

### 5. Documentation Verifier Prompt

```text
You verify current external facts for Autopilot v3.

Do not edit source code.

Verify:
- Astro client directives and islands guidance.
- Cloudflare Pages Functions and D1 binding/type guidance.
- GitHub connector/CLI capabilities relevant to project inventory.
- Vercel Workflow/DurableAgent current status and whether it is safe for phase 2.
- Context7 usage expectations for library docs.

Rules:
- Prefer Context7 for library/framework docs.
- Prefer official docs for cloud/provider APIs.
- Include source links.
- Flag any beta/experimental API.
- Do not recommend adding a dependency unless it solves a v3 MVP requirement.

Output:
- Fact table: claim, source, date checked, confidence.
- Risks from unstable APIs.
- Recommendation for v3 MVP versus phase 2.
```

### 6. Security Reviewer Prompt

```text
You are security reviewer for Autopilot v3.

Inspect planned and changed files for:
- Secrets or tokens committed to source.
- Unsafe command execution.
- UI features that imply executing GitHub/Cloudflare actions without approval.
- Untrusted markdown/HTML rendering.
- Data that could expose private repo details on a public route.
- Cloudflare function input validation regressions.

Rules:
- Findings first, ordered by severity.
- Include file paths and line numbers.
- Do not produce vague warnings.
- If no issues, say no actionable security findings and list residual risks.

Verification:
- npm run test when source changes exist.
- npm run typecheck when TypeScript/Astro changes exist.
```

### 7. QA And Browser Prompt

```text
You verify Autopilot v3 end-to-end after implementation.

Target route: /autopilot

Run:
- npm run test
- npm run typecheck
- npm run build
- npm run test:e2e if Playwright coverage exists

Browser checks:
- Desktop viewport.
- Mobile viewport.
- No overlapping text.
- Dashboard sections visible: projects, skills, agents, verification gates.
- No blank React islands.
- Keyboard focus visible on interactive controls.

Output:
- Commands run and pass/fail.
- Browser findings with screenshot paths if captured.
- Remaining risks.
```

### 8. Gemini Critic Prompt

```text
You are external architecture critic for Autopilot v3.

Do not edit files.

Context:
- Local app: Astro/React/Tailwind static-first.
- Goal: /autopilot command center for project inventory, agent prompts, skill registry, verification gates, and future execution engine planning.
- MVP excludes autonomous execution and secrets.
- Requested provider independence; no Qwen dependency.

Review:
- Is the MVP too broad?
- Are boundaries clear enough for agents?
- Where could hallucination or stale docs enter?
- Which task should be removed or delayed?
- What is the strongest first acceptance test?

Output:
- Top 5 risks.
- Recommended simplification.
- One concrete acceptance test.
```

### 9. Execution Engine Research Prompt

```text
You research phase-2 execution engine options for Autopilot v3.

Do not implement.

Compare:
- Vercel Workflow DevKit.
- Cloudflare Workflows/Agents/Durable Objects.
- GitHub Actions.
- Local Codex automations.

Evaluate:
- Durability.
- Human approval gates.
- Local development fit.
- Secret handling.
- Provider/model flexibility.
- Cost and operational complexity.
- API stability as of the current date.

Rules:
- Use official docs or Context7 where available.
- Cite sources.
- Mark beta/experimental features.
- Recommend no runtime if the dashboard contracts are not stable yet.

Output:
- Decision matrix.
- Recommended phase-2 path.
- Explicit reasons not to implement it in v3 MVP.
```

## Acceptance Criteria

- `/autopilot` route exists and is useful without JavaScript.
- Project, skill, agent, provider, and verification data are typed.
- Prompt pack is visible in the app and saved in Markdown.
- All external factual claims in docs have source links or are marked as assumptions.
- No autonomous execution, secrets, or GitHub/Cloudflare mutation is added.
- `npm run test`, `npm run typecheck`, and `npm run build` pass.
- Existing public Radeq page remains unchanged unless explicitly approved.

## Execution Choice Later

When implementation is approved, choose one:

1. Subagent-driven execution: one worker per task, supervisor reviews after each task.
2. Inline execution: one session executes tasks with checkpoints.

Do not start either path without explicit approval.
