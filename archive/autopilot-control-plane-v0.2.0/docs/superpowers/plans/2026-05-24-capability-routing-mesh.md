# Capability Routing Mesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Autopilot Decision Mesh with capability routing, context economy, model spend policy, and seeded per-project meshes without creating a parallel runtime.

**Architecture:** Keep the current root `mesh/` as the Autopilot operational mesh and add focused nodes/rules for capabilities and context use. Mirror operational policy in typed files under `src/data/delivery-system/`, expose `select_capabilities` through the existing read-only MCP server, and seed minimal project-specific meshes under existing `docs/projects/<slug>/decision-mesh/`. Record that a parallel AI Production Studio remains a future architecture option only after an explicit decision.

**Tech Stack:** TypeScript, Vitest, YAML Decision Mesh, local stdio MCP server.

---

### Task 1: Tests

**Files:**
- Create: `tests/delivery-system/capability-policy.test.ts`
- Create: `tests/delivery-system/context-economy-policy.test.ts`
- Modify: `tests/delivery-system/project-mesh-policy.test.ts`
- Modify: `tests/decision-mesh/query.test.ts`

- [ ] Add failing tests for capability modules, context economy, model spend, project mesh presence, and `selectCapabilities`.
- [ ] Run targeted tests and confirm they fail because the policy modules and query function do not exist yet.

### Task 2: Typed Policy

**Files:**
- Create: `src/data/delivery-system/capabilities.ts`
- Create: `src/data/delivery-system/contextEconomy.ts`
- Create: `src/data/delivery-system/modelSpend.ts`

- [ ] Add provider-neutral capability routing data and a small `selectCapabilityModules` helper.
- [ ] Add context usage and session reset policy data.
- [ ] Add provider-neutral model spend policy data.
- [ ] Run targeted delivery-system tests.

### Task 3: Mesh And MCP

**Files:**
- Add capability and policy nodes under `mesh/nodes/`
- Modify: `mesh/edges.yaml`
- Modify: `mesh/rules.yaml`
- Modify: `src/lib/decision-mesh/types.ts`
- Modify: `src/lib/decision-mesh/query.ts`
- Modify: `src/lib/decision-mesh/index.ts`
- Modify: `mcp/server.ts`

- [ ] Add operational mesh nodes for the service capabilities, context economy, model spend, and capability routing.
- [ ] Add `selectCapabilities` to the query library.
- [ ] Register `select_capabilities` in the existing read-only MCP server.
- [ ] Regenerate `mesh/generated/decision-mesh.json`.
- [ ] Run targeted Decision Mesh tests.

### Task 4: Project Mesh Seeds

**Files:**
- Create project-specific mesh seed files under each existing `docs/projects/<slug>/decision-mesh/`.

- [ ] Seed `autopilot-control-plane`.
- [ ] Seed `multi-agent-autonomous-delivery-system`.
- [ ] Seed `radeq`.
- [ ] Run project mesh policy tests.

### Task 5: Documentation And Verification

**Files:**
- Modify: `AGENTS.md`
- Modify: `GEMINI.md`
- Modify: `docs/autopilot/decision-mesh-mcp-decision.md`
- Modify: `docs/autopilot/delivery-system-model-policy.md`
- Modify: relevant architecture and work-log files under `docs/projects/`

- [ ] Document capability routing, context economy, model spend, and future parallel-system option.
- [ ] Record architecture/work-log impact.
- [ ] Run full verification: `npm run verify`, `npm audit`, and `git diff --check`.
