# Stop Conditions

Autopilot control-plane work must stop or enter `waiting_owner` when:

- provider availability is `unknown`
- provider run fails and no model output artifact exists
- provider returns only a prompt echo, CLI log, stack trace, or shell transcript
- paid API, paid self-hosted, or additional billing is required without owner approval
- subscription entitlement or authentication is unverified
- context packet contains secrets, `.env` values, raw private logs, database dumps, or contact data
- lower-trust advisory output is about to override local evidence
- project mesh and Autopilot root mesh ownership are conflated
- the Decision Mesh MCP/router returns `archive/**` or legacy v0.2.0 paths as active `must_read` context
- remote mutation is needed and owner approval is missing
- model output would directly change project state without code/test/human acceptance
- advisory records would store raw customer or opportunity contact data

Project work must stop when:

- the supervised project has no project mesh
- the project mesh is not updated after meaningful work
- project runtime logs are copied into Autopilot instead of summarized with source pointers
- product runtime failures are diagnosed as Autopilot provider failures, or the reverse

Opportunity monitor specific stop conditions live in `docs/projects/clientops-cms/decision-mesh/opportunity-monitor.md`.
