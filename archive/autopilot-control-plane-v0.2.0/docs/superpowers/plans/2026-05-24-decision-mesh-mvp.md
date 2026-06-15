# Decision Mesh MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first read-only Decision Mesh slice for Autopilot.

**Architecture:** YAML remains the source of truth. TypeScript loads and validates the mesh, derives query results and generated JSON, and the MCP server exposes only compact read-only tools over stdio.

**Tech Stack:** TypeScript, Vitest, YAML, MCP TypeScript SDK, Zod, Astro boundary tests.

---

## File Map

- Create `mesh/nodes/*.yaml`: seed reasoning nodes.
- Create `mesh/edges.yaml`: typed relationships between nodes.
- Create `mesh/rules.yaml`: compact agent-packet rules.
- Create `mesh/schemas/*.schema.json`: node and edge schema references.
- Create `mesh/generated/decision-mesh.json`: deterministic graph artifact.
- Create `src/lib/decision-mesh/types.ts`: public types.
- Create `src/lib/decision-mesh/load.ts`: YAML loading and structural validation.
- Create `src/lib/decision-mesh/query.ts`: scoring and context-building functions.
- Create `src/lib/decision-mesh/graph.ts`: generated JSON conversion.
- Create `src/lib/decision-mesh/index.ts`: public exports.
- Create `mcp/server.ts`: read-only stdio MCP server.
- Create `scripts/generate-decision-mesh.ts`: deterministic artifact generator/checker.
- Create `tests/decision-mesh/*.test.ts`: query and artifact sync coverage.
- Modify `package.json`, `package-lock.json`, `tsconfig.json`, and boundary tests.
- Modify Autopilot architecture/work-log docs and add `AGENTS.md` plus `GEMINI.md`.

## Tasks

### Task 1: Tests First

- [ ] Add Vitest coverage for loader validation, relevant-subgraph routing, compact agent packets, node explanation, required-agent discovery, and generated JSON sync.
- [ ] Run the new tests and confirm they fail because the Decision Mesh module does not exist yet.

### Task 2: Mesh Source

- [ ] Add the seed YAML nodes, edges, rules, and JSON schema files.
- [ ] Include upload, auth, storage, security, frontend UX, public API, checkout, and QA/e2e nodes with `why` fields.

### Task 3: Query Library

- [ ] Implement typed loading from `mesh/`.
- [ ] Implement deterministic graph conversion and query functions.
- [ ] Run the new unit tests until they pass.

### Task 4: MCP Server

- [ ] Add MCP SDK dependencies.
- [ ] Implement `mcp/server.ts` with read-only tools over stdio.
- [ ] Add package scripts for the server and generated artifact checks.

### Task 5: Governance And Instructions

- [ ] Add `AGENTS.md` and `GEMINI.md`.
- [ ] Update architecture docs and work log for the new read-only Decision Mesh surface.
- [ ] Extend boundary tests to cover `mcp/` and `scripts/` without blocking the local generator.

### Task 6: Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run test`.
- [ ] Run `npm run build`.
- [ ] Run `npm run test:e2e`.
- [ ] Inspect `git status` and report changed files.
