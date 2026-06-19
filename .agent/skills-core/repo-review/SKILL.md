# Skill: Repo Review

Vendor-neutral process. Provider adapters under `.agent/adapters/<vendor>/repo-review.md`
only map these steps to provider tools — they add no policy of their own.

## When to use

Use when reviewing a change for correctness, security, and quality.

## Required process

1. `scope_changes` — identify exactly what changed.
2. `read_sources` — read the changed files and their direct dependencies.
3. `assess_quality` — check correctness, security, and project conventions.
4. `prioritize_findings` — rank findings by severity and confidence.
5. `write_output` — write a structured result to
   `.agent/outputs/repo-review-result.json` conforming to `output.schema.json`.

## Never do (forbidden actions)

- `auto_fix_without_approval` — do not apply fixes without approval.
- `approve_own_review` — a reviewer does not approve its own output as final.

This is the single source of truth for the process. Adapters must not restate or weaken
it; they only say which tools each step uses for their provider.
