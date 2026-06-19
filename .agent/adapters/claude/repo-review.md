# Adapter: repo-review (claude)

Implements core skill `repo-review` v1.0.0. Tool mapping only — the process and its
limits live in `.agent/skills-core/repo-review/SKILL.md`.

- scope_changes: use Bash `git diff` and Grep to see exactly what changed.
- read_sources: Read the changed files and their direct dependencies.
- assess_quality: inspect for correctness, security, and project conventions.
- prioritize_findings: rank findings by severity and confidence; track with TodoWrite.
- write_output: Write `.agent/outputs/repo-review-result.json`.

Respect CLAUDE.md and local permissions; use configured MCP tools when available.
