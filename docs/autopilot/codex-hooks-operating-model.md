# Codex Hooks Operating Model

Date introduced: 2026-06-06
Status: phase-1 report-first local guardrail
Owner: Autopilot Control Plane

## Purpose

Codex lifecycle hooks provide fast deterministic checks around the agent loop.
They extend Decision Mesh, Protective Supervision, and project work logs. They
do not replace those sources, approve work, or create another execution queue.

Official behavior reference:

- https://developers.openai.com/codex/hooks

## Configuration

Project-local configuration:

```text
.codex/hooks.json
```

Shared handler:

```text
.codex/hooks/autopilot-hook.mjs
```

Runtime-only redacted state:

```text
.codex/state/events.jsonl
.codex/state/continuity.json
```

The state directory is ignored by Git. It stores event names, hashed session
and turn identifiers, tool names, risk classifications, result classes, and
input fingerprints. It must not store raw prompts, commands, tool responses,
transcripts, credentials, project logs, or customer data.

## Active Events

- `SessionStart`: inject the control-plane boundary and verify required sources.
- `SubagentStart`: remind workers that their output is a bounded draft.
- `UserPromptSubmit`: flag sensitive input, currentness needs, and external scope.
- `PreToolUse`: report destructive, remote, deployment, credential, cloud, and
  governance surfaces before execution.
- `PostToolUse`: record redacted evidence and flag failed verification.
- `PreCompact`: save a compact continuity record.
- `PostCompact`: require a fresh `AGENTS.md` and Decision Mesh pass.
- `SubagentStop`: record bounded worker completion.
- `Stop`: report unresolved failures and required governance impact checks.

## Enforcement Level

Phase 1 is report-first:

- warnings and model-visible context are allowed
- high-risk activity is classified and recorded in redacted form
- hooks do not automatically approve, deny, rewrite, deploy, push, merge, or
  call external models
- full tests are not run on every lifecycle event
- hook output is evidence, not delivery approval

A future blocking phase requires observed false-positive data, explicit owner
approval, tests for every deny rule, and a rollback path.

## Boundaries

Hooks must not:

- become a second Decision Mesh or progress queue
- copy raw supervised-project logs into Autopilot
- store prompt, command, response, transcript, credential, or customer content
- call Gemini, OpenAI APIs, paid tools, connectors, or deployment systems
- automatically update architecture, work logs, GitHub, or project runtimes
- claim complete enforcement because `PreToolUse` does not intercept every
  possible tool path

## Trust And Startup

Project-local hooks run only after the project `.codex` layer and the exact hook
definition are trusted. Changed command hooks require review again.

After adding or changing hooks:

1. Restart or refresh the Codex session.
2. Review the hook source and command definitions.
3. Trust the exact current hook definitions through the supported Codex hook
   review surface, such as `/hooks` in the CLI.
4. Start a new thread or resume the project.
5. Confirm a `SessionStart` record appears in `.codex/state/events.jsonl`.

Do not use `--dangerously-bypass-hook-trust` as the normal Autopilot path.

## Verification

```powershell
npm.cmd test -- codex-hooks
npm.cmd run mesh:check
npm.cmd run typecheck
git diff --check
```

Runtime verification remains separate from file and test verification. Do not
claim the active Codex App host loaded the hooks until a new or refreshed
trusted session produces lifecycle evidence.
