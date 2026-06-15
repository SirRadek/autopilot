# Agent Handoff Packet Template

Status: template

Use this when one agent output becomes input for another agent.

```md
# Agent Handoff Packet

## Handoff ID

## Source Agent

## Target Agent

## Project

## Mode

DRY_RUN | INSPECT_ONLY | WRITE_ALLOWED | REMOTE_MUTATION_APPROVED

## Goal

## Scope

## Allowed Files Or Surfaces

## Forbidden Actions

## Verified Facts

## Assumptions

## Decisions Already Made

## Open Questions

## Risks

## Stop Conditions

## Required Checks

## Expected Output

## Evidence And Source Pointers

## Progress Impact

## Next Action
```

Do not paste raw agent output as the next prompt. Extract only verified facts,
assumptions, risks, open questions, and the bounded task contract.
