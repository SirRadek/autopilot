# Adapter: safe-refactor (claude)

Implements core skill `safe-refactor` v1.0.0. Tool mapping only — the process and its
limits live in `.agent/skills-core/safe-refactor/SKILL.md`.

- read_scoped_files: use Grep/Glob to locate, then Read the scoped files.
- identify_behavior: summarize current behavior from the code and existing tests.
- minimal_change: edit with Edit; track multi-step work with TodoWrite.
- update_tests: add or adjust tests with Edit/Write.
- run_tests: run the project test command via Bash and report what ran.
- write_output: write `.agent/outputs/safe-refactor-result.json`.

Respect CLAUDE.md and local permissions; use configured MCP tools when available.
