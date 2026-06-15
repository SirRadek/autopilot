# Scrapeflow Contract

Scrapeflow is treated as a producer of normalized source rows. ClientOps CMS remains the canonical store.

Required input controls:

- source id
- source key
- enabled flag
- allowed hosts
- locale
- terms-review status
- run correlation id

Required output fields:

- `sourceKey`
- `sourceRunId`
- `sourceItemId`
- `canonicalUrl`
- `title`
- `description`
- `rawSnippet`
- `rowFingerprint`
- `fitScore`
- `serviceTags`
- `requesterName`
- `contactEmail`
- `contactPhone`
- `publishedAt`
- `discoveredAt`

CMS validation rules:

- `canonicalUrl` host must match a server-side allowlist for the source.
- `rowFingerprint` must be deterministic for the same source row.
- The ingest endpoint must reject rows without source identity, canonical URL, or fingerprint.
- Contact data must be stored only in opportunity item fields that participate in purge.
- Raw source HTML is not stored in ClientOps unless a separate retention decision is approved.

Failure classes:

- `source_terms_blocked`
- `source_fetch_failed`
- `source_schema_mismatch`
- `source_host_not_allowed`
- `opportunity_duplicate`
- `opportunity_collision`
- `opportunity_ingest_unauthorized`
- `opportunity_purge_failed`

Scrapeflow must not receive `MESH_SERVICE_TOKEN`. It uses `OPPORTUNITY_INGEST_TOKEN` and can only call the opportunity ingest surface.
