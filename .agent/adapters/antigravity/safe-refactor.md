# Adapter: safe-refactor (antigravity)

Implements core skill `safe-refactor` v1.0.0. Tool mapping only — the process and its
limits live in `.agent/skills-core/safe-refactor/SKILL.md`.

- read_scoped_files: use project-scoped file access to read the scoped files.
- identify_behavior: summarize current behavior from the code and existing tests.
- minimal_change: edit the scoped files using agy skill conventions.
- update_tests: add or adjust tests for the changed behavior.
- run_tests: run the project test command and report what ran.
- write_output: write artifacts to `.agent/outputs/safe-refactor-result.json`.

Use the MCP servers configured in `~/.gemini/config/mcp_config.json` (e.g. Context7).
