# Radeq.cz Website Work Log

## 2026-05-13 Architecture Registry Onboarding

Date: 2026-05-13
Request or trigger: every project must have written architecture, regular updates, and a work log.
Mode: WRITE_ALLOWED for documentation only.
Scope: add project architecture governance and initial Radeq project architecture evidence.
Files changed:

- `docs/autopilot/project-architecture-standard.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/work-log.md`
- `docs/projects/autopilot-control-plane/architecture.md`
- `docs/projects/autopilot-control-plane/work-log.md`
- `docs/autopilot/v3-prompt-pack.md`
- `docs/autopilot/2026-05-10-autopilot-run-log.md`

Architecture impact: created the first canonical architecture record and work log for the Radeq.cz website.
Decisions:

- Radeq product runtime is tracked separately from Autopilot control-plane process.
- Architecture updates are mandatory when runtime, data flow, deployment, security, integration, or verification gates change.
- Work log entries must include an architecture impact line.

Verification:

- `rg -n "Project Architecture|project architecture|Architecture impact|Project architecture checked|docs/projects|Next review" docs\autopilot docs\projects`: found the standard, registry, project records, prompt-pack gate, and work-log entries.
- `git diff --check`: passed with existing LF-to-CRLF warnings only.
- Placeholder-token scan over the new architecture docs and project records: no matches.

Risks:

- Historical architecture details remain distributed across older docs and run logs.
- Remote Cloudflare production proof is still not represented as completed.

Follow-up:

- Add project architecture records for additional private projects only with redacted aliases.
- Add automated freshness checks later if the `/autopilot` dashboard is implemented.

## 2026-05-13 Strict Repository Separation

Date: 2026-05-13
Request or trigger: user clarified that Autopilot must be separate from Radeq and every other project.
Mode: WRITE_ALLOWED for documentation only.
Scope: mark Radeq as a standalone product project with its own canonical local root and remote repository.
Files changed:

- `docs/projects/radeq/architecture.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/repository-separation-policy.md`

Architecture impact: Radeq is now explicitly documented as a product repository separate from the Autopilot control plane.
Decisions:

- Radeq canonical remote is `SirRadek/radeq`.
- Radeq canonical local root should be `C:\Users\sirok\Documents\Projects\radeq`.
- Autopilot may hold only registry metadata or sanitized mirrors for Radeq.

Verification:

- Repository-boundary search confirmed Radeq is documented as a product repository separate from the Autopilot control plane.
- `git diff --check` passed with only LF/CRLF normalization warnings for existing files `docs/autopilot/2026-05-10-autopilot-run-log.md` and `docs/autopilot/v3-prompt-pack.md`.

Risks:

- Current checkout still contains both product runtime and Autopilot governance docs.

Follow-up:

- Complete physical repo split so Radeq runtime and Autopilot governance no longer share one working tree.

## 2026-05-13 Physical Repository Split

Date: 2026-05-13
Request or trigger: user approved executing the repository split.
Mode: WRITE_ALLOWED with remote GitHub mutation approved by user instruction.
Scope: create a separate local Radeq product checkout and prepare removal of legacy Autopilot governance files from the Radeq repository.
Files changed:

- `docs/projects/radeq/architecture.md`
- `docs/projects/radeq/work-log.md`
- `docs/autopilot/project-architecture-registry.md`
- `docs/autopilot/repository-separation-policy.md`

Architecture impact: Radeq now has a separate local product root at `C:\Users\sirok\Documents\Projects\radeq`.
Decisions:

- Radeq remains `SirRadek/radeq`.
- Radeq runtime must not live in the Autopilot repository.
- Legacy Autopilot documentation should be removed from Radeq through a cleanup branch instead of silently deleting it from the default branch.

Verification:

- Radeq cleanup branch `codex/separate-autopilot-docs` was committed and pushed.
- Radeq cleanup PR opened: `https://github.com/SirRadek/radeq/pull/1`.
- After explicit user approval, Radeq cleanup PR `https://github.com/SirRadek/radeq/pull/1` was squash-merged into `new` as `ef7053c`.
- Local Radeq checkout was fast-forwarded to `ef7053c` on branch `new`.
- `rg -n "docs/autopilot|docs\\autopilot|docs/superpowers|docs\\superpowers" . -g '!node_modules/**' -g '!.git/**'` returned no matches on the cleanup branch.
- `git diff --check` passed.
- `npm ci` passed with 0 vulnerabilities.
- `npm test` passed: 7 test files and 40 tests.
- `npm run build` passed and built 2 Astro pages, with an existing chunk-size warning.

Risks:

- Repository separation risk for Radeq is closed. Product runtime risk remains unchanged and should be handled by normal Radeq verification gates.
