# Repository Separation

Active governance rule for where project code, project state, and reusable
control-plane material live. Re-homed into the active structure from the archived
`autopilot-control-plane-v0.2.0` snapshot.

## Rule

1. **One managed project = one GitHub repo.** A supervised project keeps its own
   repo (for example, `SirRadek/radeq`). Do not create a new repo when one
   already exists; build in it.
2. **Project state lives in the project repo.** Design-lock, plans, brainstorms,
   compare-loop state, baseline screenshots, and the project's own decision-mesh
   nodes go in the project repo (for example, `radeq/docs/autopilot/` or
   `radeq/.autopilot/`). They travel with the code, the owner sees them, and the
   control plane stays clean.
3. **The control-plane repo holds only reusable, cross-project material.**
   `SirRadek/autopilot`'s active root is the ClientOps app; its control-plane
   governance is `docs/autopilot/decision-mesh/` plus reusable tooling
   (`src/lib/`, `.agent/skills-core/`). It carries mesh/routing/role/spend
   policy, prompt and skill libraries, worker tooling, and a **thin per-project
   registry** (a pointer to the project repo plus locked decisions). No project
   dumps.
4. **No untracked scratch in the control-plane root.** Working files go into the
   project repo or a gitignored workspace — never untracked at the control-plane
   root.
5. **Branch convention per repo.** One working branch -> preview -> cutover merge
   to that repo's `main`. Verify `git merge-base HEAD origin/main` before building
   so the branch base actually exists on `main` (recorded
   `pr-targeted-frozen-archive` lesson).

## Boundary note

The former control-plane v0.2.0 tree (Astro + decision mesh + prompt-library +
product-design-os + radeq artifacts) is the frozen `archive/` snapshot. It is
migration source material only and is excluded from the active Decision Mesh
router; it is not an active project or control-plane surface.

## Per-project registry

The control plane keeps a thin registry entry per managed project: the project
repo URL, its active branch, and the locked cross-project decisions that affect
it. The registry points at the project repo; it does not copy project state into
the control plane.
