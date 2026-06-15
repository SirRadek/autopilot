# Radeq Style-Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working Radeq.cz conversion showcase with Astro, an interactive Style-Matrix Simulator, progressive 3D Core island, static proof data, and CLI contact terminal.

**Architecture:** Astro remains static-first. React is isolated to the simulator, terminal, and optional WebGL Core. Style switching is implemented through typed data and CSS custom properties, not runtime CSS bundle swaps.

**Tech Stack:** Astro, TypeScript, React, Tailwind CSS, React Three Fiber, Vitest, Playwright smoke checks.

---

## File Structure

- `package.json`: scripts and dependencies.
- `astro.config.mjs`: Astro integrations.
- `tsconfig.json`: strict TypeScript.
- `src/pages/index.astro`: page composition.
- `src/layouts/BaseLayout.astro`: document shell, metadata, `ClientRouter`.
- `src/styles/global.css`: Tailwind import, tokens, matrix runtime variables, responsive system.
- `src/data/*.ts`: typed static content.
- `src/lib/matrix.ts`: pure matrix selection helpers.
- `src/lib/terminal.ts`: safe terminal parser and brief state helpers.
- `src/components/*.astro`: static page sections.
- `src/components/*.tsx`: interactive islands.
- `tests/*.test.ts`: unit tests for pure logic.
- `tests/smoke.spec.ts`: browser smoke test.

## Task 1: Scaffold And Tooling

**Files:**
- Create/modify: project scaffold files.

- [ ] Create Astro project in the current workspace.
- [ ] Add React, Tailwind, R3F, Vitest, Playwright, and Astro check tooling.
- [ ] Add scripts: `dev`, `build`, `preview`, `check`, `test`, `test:e2e`.
- [ ] Verify dependency installation with `npm install`.

## Task 2: Test Matrix Logic First

**Files:**
- Create: `tests/matrix.test.ts`
- Create: `src/lib/matrix.ts`
- Create: `src/data/styleMatrix.ts`

- [ ] Write failing tests for default selection, preset lookup, and token generation.
- [ ] Run unit tests and confirm failure.
- [ ] Implement typed matrix data and helper functions.
- [ ] Run unit tests and confirm pass.

## Task 3: Test Terminal Logic First

**Files:**
- Create: `tests/terminal.test.ts`
- Create: `src/lib/terminal.ts`

- [ ] Write failing tests for whitelisted commands, field assignment, summary generation, and rejected unknown commands.
- [ ] Run unit tests and confirm failure.
- [ ] Implement terminal parser without shell semantics.
- [ ] Run unit tests and confirm pass.

## Task 4: Static Astro Shell

**Files:**
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/pages/index.astro`
- Create: `src/styles/global.css`
- Create: `src/components/CommandHeader.astro`
- Create: `src/components/HeroSection.astro`
- Create: `src/components/AudienceBand.astro`
- Create: `src/components/DemoBlocks.astro`
- Create: `src/components/HandoffStandard.astro`
- Create: `src/components/SelectedSystems.astro`

- [ ] Build semantic static page structure.
- [ ] Add responsive true-black industrial design tokens.
- [ ] Keep core content visible before React loads.
- [ ] Add reduced-motion CSS.

## Task 5: Interactive Islands

**Files:**
- Create: `src/components/StyleMatrixSimulator.tsx`
- Create: `src/components/ContactTerminal.tsx`
- Create: `src/components/CoreIsland.tsx`

- [ ] Build simulator with native buttons and live preview updates.
- [ ] Build terminal with keyboard-safe input and local brief summary.
- [ ] Build R3F Core with `frameloop="demand"`, capped DPR, primitive geometry, and static fallback wrapper.
- [ ] Ensure islands are loaded only where needed.

## Task 6: Verification

**Files:**
- Create: `tests/smoke.spec.ts`

- [ ] Run `npm run test`.
- [ ] Run `npm run check`.
- [ ] Run `npm run build`.
- [ ] Start dev server.
- [ ] Run browser smoke checks.
- [ ] Inspect concept image and implementation screenshot.
- [ ] Record honest verification status and remaining gaps.
