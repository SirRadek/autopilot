# Opportunity Retention

Opportunity contact data is short-lived operational evidence.

Default retention:

- Contact and requester data expires 14 days after import.
- Responded, converted, ignored, or blocked items purge contact data immediately when it is no longer needed.
- Audit events keep non-contact evidence only.

Fields that must be purged:

- requester name
- contact email
- contact phone
- raw snippet portions that contain contact data
- normalized payload contact fields
- response draft contact copies

Fields that may remain after purge:

- source key
- source title
- canonical URL
- non-contact fit score and service tags
- row fingerprint
- import run id
- status
- purge timestamp
- review decision metadata
- PII-free workflow event ids

Purge evidence:

- `personalDataPurgedAt` on the item is canonical.
- `opportunity_personal_data_purged` records purge evidence without restating the purged values.
- Failed purge attempts block the item and create operator-visible evidence.

Stop conditions:

- contact data appears in workflow event payloads
- raw snippets are retained after purge when they contain contact data
- advisory model eval records contain contact data
- purge cannot be replayed idempotently
