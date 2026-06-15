# Routing Policy

Routing chooses the smallest safe route that can produce useful advisory evidence.

Default order:

1. Local repo inspection, tests, static checks, and official docs.
2. GPT/Codex implementation and synthesis in the local workspace.
3. Claude advisory review for architecture, security, privacy, and contradictions.
4. Gemini advisory review for alternative failure modes and broad brainstorming.
5. Other providers only after provider status, privacy, and cost approval checks pass.

Before routing:

- classify whether the task belongs to Autopilot control-plane or a supervised project
- load the project mesh when the task changes project state
- build a bounded, redacted context packet
- record provider status and output expectations
- decide whether paid routes are approved

Fallback rules:

- A failed provider run must be recorded as failed or blocked before another provider is used.
- Missing model output cannot be treated as a weak opinion; it is no output.
- Lower-trust model advice cannot override Claude or local evidence without verification.
- A provider fallback must use a prompt packet with the same scope and redaction constraints.

Stop routing when:

- the project/control-plane boundary is ambiguous
- a provider needs secrets or raw private logs
- no approved route can satisfy the privacy/cost constraints
- the task requires remote mutation and owner approval is missing
