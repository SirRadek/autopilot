# Multi-Agent Routing

Codex remains the orchestrator, architect, final integrator, and reviewer.
Other agents are advisory or bounded workers. They do not approve architecture,
scope, security, business direction, or final delivery.

## Roles

Codex owns architecture, scope, integration, patching, verification, and final
handoff.

Qwen Worker may handle low/medium-risk bounded work such as repository search,
boilerplate, metadata generation, mechanical refactors, simple tests, and
routine summaries.

Gemini Reviewer may provide redacted advisory critique for brainstorming,
strategy, design critique, UX opposition, originality checks, ambiguous
direction choices, and repeated feedback that output feels generic.

Gemini output is advisory only. Claims about frameworks, libraries, SDKs, APIs,
browser behavior, cloud services, SEO, accessibility, or best practices must be
verified through Context7 when connected, or official documentation when
Context7 is unavailable.

Strict Product Opponent looks for goal drift, feature creep, unnecessary
effects, complexity, weak UX, weak conversion, performance risk, accessibility
risk, conflict with target users, and conflict with scope.

Design Critic audits template risk, visual hierarchy, typography rhythm, layout
rhythm, motion quality, mobile quality, and asset compatibility.

Logic QA audits roles, permissions, states, workflows, validations, edge cases,
error states, loading states, empty states, audit needs, imports, exports, and
API failure behavior.

## Risk Routing

- P0 critical: Codex stops normal implementation, creates report, runs Logic QA
  and Strict Product Opponent, uses Gemini only for redacted independent review
  if helpful, then patches and verifies.
- P1 high: Codex plus relevant reviewer; Gemini for strategic UX/design or
  ambiguous tradeoffs.
- P2 medium: Codex decides; Qwen may implement bounded subtasks; reviewer checks.
- P3 low: Qwen may draft; Codex reviews.
- P4 experiment: isolate, label as experiment, require Design Critic and
  Performance Reviewer before adoption.

## Agent Task Contract

```text
Agent:
Purpose:
Context:
Task:
Forbidden:
Expected output:
Risk level:
Verification:
```
