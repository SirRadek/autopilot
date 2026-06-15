# Source Of Truth

- Public form payloads are evidence only until stored as `leads`.
- `leads.status` owns lead lifecycle.
- Public opportunity rows are evidence only until stored as `opportunity-items`.
- `opportunity-items.status` owns opportunity lifecycle.
- `opportunity-items.personalDataExpiresAt` and `opportunity-items.personalDataPurgedAt` own opportunity contact-data retention state.
- `opportunity-reviews` owns human opportunity review decisions.
- Scrapeflow output is non-canonical source evidence until accepted by the CMS ingest endpoint.
- `tasks.state` owns actionable workflow state.
- `workflow-events` owns audit history and must be append-only in normal operation.
- Project mesh owns governance interpretation, policy mapping, routing guidance, and stop conditions.
- Runtime logs remain local runtime evidence; docs store redacted summaries and source pointers only.
- Claude/Gemini/GPT outputs are advisory. They cannot become canonical workflow state without human acceptance or local verification evidence.
- Autopilot root provider usage and model-routing policy lives under `docs/autopilot/decision-mesh/`, not in this project mesh.
