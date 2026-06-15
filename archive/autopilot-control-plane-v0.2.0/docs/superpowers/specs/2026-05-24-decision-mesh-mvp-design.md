# Decision Mesh MVP Design

Date: 2026-05-24
Status: approved for first implementation slice
Project: Autopilot Control Plane

## Purpose

Decision Mesh is a local context router for Autopilot. It stores reasoning nodes and edges as human-readable YAML, exposes compact query results to Codex through a read-only MCP server, and keeps 3D visualization as a later dashboard layer.

The first slice deliberately does not add a 3D viewer. The repo already has a static read-only Astro command center, and the useful first milestone is a verified graph/query/MCP layer.

## Architecture

Source of truth lives in `mesh/`:

- `mesh/nodes/*.yaml` for reasoning nodes
- `mesh/edges.yaml` for relationships
- `mesh/rules.yaml` for compact agent rules
- `mesh/schemas/*.schema.json` for editor and validation reference
- `mesh/generated/decision-mesh.json` as deterministic viewer-ready JSON

TypeScript code lives in `src/lib/decision-mesh/` and stays side-effect-light. File loading is isolated in the loader; scoring, graph conversion, subgraph selection, risk lookup, node explanation, required-agent discovery, and agent-packet building are pure functions.

The MCP server lives in `mcp/server.ts`. It is local-only over stdio, read-only, and uses the query library rather than exposing raw filesystem access.

## MCP Tools

- `get_relevant_subgraph`
- `build_agent_packet`
- `explain_node`
- `find_required_agents`
- `find_risks`

Tools return JSON text. They do not mutate files, call connectors, call the network, read credentials, or inspect product repositories.

## Instructions

`AGENTS.md` tells Codex when to consult the mesh and how to react to stop conditions.

`GEMINI.md` keeps Gemini as advisory-only critique with redacted inputs. Gemini cannot approve work and cannot replace local verification.

## Verification

Required checks:

- Decision mesh loader validates the seed graph.
- Generated JSON stays synchronized with YAML.
- Upload-related tasks return file upload, auth, storage, security, frontend, and QA context.
- Agent packets remain compact and do not expose the full graph.
- Boundary tests cover the new read-only MCP surface.
- Existing typecheck, unit tests, Astro build, and Playwright smoke tests continue to pass.

## Deferred

- 3D viewer with `3d-force-graph`
- SQLite or Neo4j index
- connector-backed context
- remote MCP transport
- any file-mutating MCP tool
