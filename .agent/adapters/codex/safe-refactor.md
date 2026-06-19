# Adapter: safe-refactor (codex)

Implements core skill `safe-refactor` v1.0.0. Tool mapping only — the process and its
limits live in `.agent/skills-core/safe-refactor/SKILL.md`.

- read_scoped_files: use `rg` to locate, then read the scoped files.
- identify_behavior: summarize current behavior from the code and existing tests.
- minimal_change: edit with `apply_patch`.
- update_tests: add or adjust tests with `apply_patch`.
- run_tests: run the project test command and report what ran.
- write_output: write `.agent/outputs/safe-refactor-result.json`.

Use Context7 for current library/API behavior.
