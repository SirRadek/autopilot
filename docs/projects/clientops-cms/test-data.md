# Test Data

## Valid Lead

```json
{
  "name": "Runtime Smoke",
  "email": "runtime-smoke@example.com",
  "project_type": "website",
  "message": "Smoke test lead",
  "source_path": "/kontakt?utm_source=smoke",
  "referrer": "https://radeq.cz",
  "locale": "cs"
}
```

Expected result:

- one `leads` record
- one `lead_review` task
- one `lead_received` or `task_created` workflow event
- response includes `leadId`, `taskId`, and eventually `correlationId`

## Invalid Lead

```json
{
  "name": "",
  "email": "not-an-email",
  "project_type": "",
  "message": "",
  "honeypot": "bot"
}
```

Expected result:

- response status `400`
- no task created
- rejected submission becomes error evidence only after the rejected-event contract is implemented
