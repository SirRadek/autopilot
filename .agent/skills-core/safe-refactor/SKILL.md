# Skill: Safe Refactor

Vendor-neutral process. Provider adapters under `.agent/adapters/<vendor>/safe-refactor.md`
only map these steps to provider tools — they add no policy of their own.

## When to use

Use when changing behavior-sensitive existing code.

## Required process

1. `read_scoped_files` — read only the files in scope.
2. `identify_behavior` — state the current behavior before changing it.
3. `minimal_change` — make the smallest change that meets the goal.
4. `update_tests` — add or update tests for the changed behavior.
5. `run_tests` — run the tests and record the result.
6. `write_output` — write a structured result to
   `.agent/outputs/safe-refactor-result.json` conforming to `output.schema.json`.

## Never do (forbidden actions)

- `rewrite_unrelated_files` — do not rewrite files outside the scope.
- `change_public_api_without_approval` — do not change a public API without approval.

This is the single source of truth for the process. Adapters must not restate or weaken
it; they only say which tools each step uses for their provider.
