# Adapter: repo-review (codex)

Implements core skill `repo-review` v1.0.0. Tool mapping only — the process and its
limits live in `.agent/skills-core/repo-review/SKILL.md`.

- scope_changes: use `git diff` / `rg` to see exactly what changed.
- read_sources: read the changed files and their direct dependencies.
- assess_quality: inspect for correctness, security, and project conventions.
- prioritize_findings: rank findings by severity and confidence.
- write_output: write `.agent/outputs/repo-review-result.json`.

Use Context7 for current library/API behavior.
