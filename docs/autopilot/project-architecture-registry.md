# Project Architecture Registry

Date introduced: 2026-05-13

This is the central index for project architecture records and work logs. See `docs/autopilot/project-architecture-standard.md` and `docs/autopilot/repository-separation-policy.md` for the required format and separation rules.

| Project | Slug | Status | Canonical Local Root | Canonical Remote Repo | Separation Status | Runtime Surface | Deployment Surface | Architecture Record | Work Log | Last Architecture Update | Next Review | Current Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autopilot Control Plane | `autopilot-control-plane` | active process layer | `C:\Users\sirok\Documents\Autopilot` | `SirRadek/autopilot` | `separated` | Governance docs, registry, ledgers, minimal TypeScript/Vitest governance contracts, Autopilot operational Decision Mesh YAML/JSON context router, local read-only MCP server, static read-only `/autopilot` command center | None yet; control-plane deployment deferred | `docs/projects/autopilot-control-plane/architecture.md` | `docs/projects/autopilot-control-plane/work-log.md` | 2026-05-24 | 2026-05-31 | Delivery-system typed contracts, Autopilot operational Decision Mesh MCP, capability routing, context economy, model spend policy, project mesh seed, and static UI exist; external project inventory normalization is not implemented; package, MCP, and UI must remain read-only and non-executing |
| Radeq.cz Website | `radeq` | active product project | `C:\Users\sirok\Documents\Projects\radeq` | `SirRadek/radeq` | `separated` | Astro static site, React islands, Cloudflare Pages Function, D1 lead store | Cloudflare Pages target, GitHub Pages workflow for branch `new` | `docs/projects/radeq/architecture.md` | `docs/projects/radeq/work-log.md` | 2026-05-24 | 2026-05-31 | Radeq product checkout and default branch are separated from Autopilot; project mesh seed exists; Cloudflare gate is local proof only; performance and a11y budgets need expansion |
| Multi-Agent Autonomous Delivery System | `multi-agent-autonomous-delivery-system` | phase-3 read-only Decision Mesh context router | `C:\Users\sirok\Documents\Autopilot` | `SirRadek/autopilot` | `autopilot_subsystem` | Governance contracts, ledgers, role catalog, workflow rules, typed role/gate/workflow/ledger/model registries, pure validators, Autopilot operational Decision Mesh YAML/JSON context router, connector snapshot procedure, execution-engine option record, static read-only command center | None yet; execution engine explicitly deferred by decision record | `docs/projects/multi-agent-autonomous-delivery-system/architecture.md` | `docs/projects/multi-agent-autonomous-delivery-system/work-log.md` | 2026-05-24 | 2026-05-31 | Typed governance contracts, Autopilot operational Decision Mesh MCP, capability routing, context economy, model spend policy, and project mesh seed exist; no full connector snapshot coverage or execution runtime yet; workflow/model facts require recheck before implementation |

## Not Yet Onboarded

Projects mentioned in historical notes or external inventory must be added here before implementation work starts against them.

Current known not-yet-onboarded candidates:

- `autopilot-orchestration`: referenced as private process evidence in older mission notes, not onboarded into this registry.
- Additional private GitHub inventory entries: must be represented with redacted aliases before public or external-model use.
