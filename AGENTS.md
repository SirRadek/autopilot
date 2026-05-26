# Autopilot Decision Mesh

Before planning or editing, use the Decision Mesh MCP tools when the task may affect:

- auth
- payments
- database or persistence
- file uploads
- public API routes
- frontend UX
- security
- release or delivery behavior

Use this order:

1. Call `select_capabilities` when the task may touch web builds, optimization, data, SEO, automation, recovery, documents, bots/RAG, or 3D.
2. Call `get_relevant_subgraph`.
3. Call `build_agent_packet` for the active role.
4. If the task belongs to a supervised project, call `build_project_mesh_packet` for that project's mesh before reading product-specific files.
5. Read only files listed in `must_read`, plus directly necessary local context.
6. Do not assume missing context.
7. If the graph reports `stop_conditions`, stop and ask for an owner decision unless the task is explicitly to resolve that stop condition.
8. After changes, record architecture and work-log impact when the change affects Autopilot governance.

Never load the full mesh unless explicitly requested.
Prefer relevant subgraph over full project context.

The mesh is a context router, not an approval authority. Local tests, architecture records, and explicit user decisions remain the source of truth.

## Project Mesh Scope

The root `mesh/` in this repository is Autopilot's own operational mesh. It describes how Autopilot routes, governs, reviews, and reasons about work.

It is not the product mesh for every supervised project.

For each supervised project:

1. During project architecture onboarding, check whether the project has its own mesh at `docs/projects/<project-slug>/decision-mesh/`.
2. If the project mesh does not exist, create it before implementation planning continues.
3. Keep that project mesh scoped to that project's runtime, risks, agents, data flows, integrations, and stop conditions.
4. After every meaningful completed work slice, update the project mesh or record why the work had no mesh impact.
5. Do not reuse Autopilot's operational mesh as the product/project mesh.

Missing project mesh is a stop condition for project implementation work.

## Capability Routing

Autopilot's current implementation path is to extend the existing mesh/MCP/governance layer.

Do not create a parallel AI Production Studio, separate runtime, or duplicate source of truth unless there is an explicit architecture decision with an interop or migration plan.

The future parallel system option remains open, but it is not the current default path.

Use capability routing to keep work bounded:

- web builds: `web_build_mesh`
- optimization: `optimization_mesh`
- data work: `data_mesh`
- SEO: `seo_mesh`
- automation: `automation_mesh`
- recovery/rescue: `recovery_mesh`
- document reconstruction: `document_mesh`
- bots/RAG: `bot_rag_mesh`
- 3D/WebGL: `three_d_experience_addon`

3D is a premium add-on only. Use it when it explains product, process, data, or system state. Do not activate 3D by default, and never hide primary SEO content inside canvas.

## Context Economy Rules

Do not load or request the whole repository by default.

Before planning or editing:

1. Classify the task.
2. Use `select_capabilities`.
3. Use `get_relevant_subgraph`.
4. Build a small agent packet.
5. Read only required local files.
6. Ask only if critical context is missing.

Restart or compress context when the topic changes, the conversation gets long, the task scope changes, output quality drops, or the agent repeats old context.

## Reasoning Model Routing

Use local workers by default for:

- autocomplete
- boilerplate coding
- bounded implementation
- embeddings
- RAG retrieval
- indexing
- automation loops
- routine summarization

Escalate to frontier reasoning only for:

- deep research
- architecture review
- security audit
- code review
- agent validation
- strategic planning
- orchestration design
- edge-case reasoning
- cross-domain tradeoff analysis

If a task depends on a non-local worker and is not strategic reasoning or independent review, stop and ask for an owner decision. Do not route routine worker loops to cloud/frontier models by default.
