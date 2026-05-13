# Project Architecture Registry

Date introduced: 2026-05-13

This is the central index for project architecture records and work logs. See `docs/autopilot/project-architecture-standard.md` and `docs/autopilot/repository-separation-policy.md` for the required format and separation rules.

| Project | Slug | Status | Canonical Local Root | Canonical Remote Repo | Separation Status | Runtime Surface | Deployment Surface | Architecture Record | Work Log | Last Architecture Update | Next Review | Current Risks |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Autopilot Control Plane | `autopilot-control-plane` | active process layer | `C:\Users\sirok\Documents\Autopilot` | `SirRadek/autopilot` | `separated` | Governance docs, registry, ledgers, future read-only dashboard | None yet; control-plane deployment deferred | `docs/projects/autopilot-control-plane/architecture.md` | `docs/projects/autopilot-control-plane/work-log.md` | 2026-05-13 | 2026-05-20 | Typed registries and UI route are planned but not implemented; external project inventory is not normalized |
| Radeq.cz Website | `radeq` | active product project | `C:\Users\sirok\Documents\Projects\radeq` | `SirRadek/radeq` | `separated` | Astro static site, React islands, Cloudflare Pages Function, D1 lead store | Cloudflare Pages target, GitHub Pages workflow for branch `new` | `docs/projects/radeq/architecture.md` | `docs/projects/radeq/work-log.md` | 2026-05-13 | 2026-05-20 | Radeq product checkout and default branch are separated from Autopilot; cleanup PR `https://github.com/SirRadek/radeq/pull/1` merged as `ef7053c`; Cloudflare gate is local proof only; performance and a11y budgets need expansion |
| Multi-Agent Autonomous Delivery System | `multi-agent-autonomous-delivery-system` | planned Autopilot subsystem | `C:\Users\sirok\Documents\Autopilot` | `SirRadek/autopilot` | `autopilot_subsystem` | Governance contracts, ledgers, role catalogs, future read-only command center | None yet; execution engine deferred pending decision record | `docs/projects/multi-agent-autonomous-delivery-system/architecture.md` | `docs/projects/multi-agent-autonomous-delivery-system/work-log.md` | 2026-05-13 | 2026-05-20 | No typed registries, UI, connector snapshots, or execution runtime yet; external workflow/model facts require recheck |

## Not Yet Onboarded

Projects mentioned in historical notes or external inventory must be added here before implementation work starts against them.

Current known not-yet-onboarded candidates:

- `autopilot-orchestration`: referenced as private process evidence in older mission notes, not onboarded into this registry.
- Additional private GitHub inventory entries: must be represented with redacted aliases before public or external-model use.
