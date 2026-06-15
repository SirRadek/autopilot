# Live Sources

Live sources are allowed only when terms, allowed hosts, robots policy, run bounds, and retention rules are recorded.

## `reviewed-web-cz-it`

Purpose:

- Collect reviewable CZ/SK IT opportunity evidence from explicitly reviewed web pages.
- Provide the default live path without depending on Hlidac Statu or any single public procurement API.

Runtime:

- Route: `POST /api/opportunities/live/web-source`
- Script: `scripts/run-web-source-opportunities.ps1`
- Default seed source: `reviewed-web-cz-it`
- Default fixture host: `portal.example.cz`

Input modes:

- `items`: pre-normalized rows from a trusted scraper or scrapeflow-compatible runner.
- `urls`: explicit page URLs that the CMS fetches after source and robots gates pass.

Local gates:

- `OPPORTUNITY_LIVE_RUN_TOKEN` must authorize the local live run endpoint.
- Source record must exist, be enabled, and have `sourceType=web`.
- `termsReviewedAt` must be set before any import.
- `robotsReviewedAt` must be set before CMS fetches URLs.
- Every URL host must match `opportunity-sources.allowedHosts`.
- URL count is bounded by `maxUrlsPerRun`.
- Events remain PII-free.

Extraction behavior for URL mode:

- Fetches only explicit URLs; it does not crawl a site.
- Checks `/robots.txt` before fetching a page.
- Extracts title, meta description, visible text snippet, first email, first phone, published timestamp, service tags, and fit score.
- Stores contact data only on `opportunity-items` fields that are covered by purge.
- Does not send responses, create leads, or create project tasks.

Stop conditions:

- Source terms, allowed hosts, or robots review are missing.
- URL host is not allowlisted.
- Robots policy disallows the page.
- Fetch returns non-2xx or unsupported content type.
- Extracted row would lack canonical URL, title, or fingerprint.
- Event payload would contain private contact data.

## `hlidac-statu-vz-it`

Status: disabled parked adapter.

This source is kept for later use but is disabled in seed data, disabled at the route with `410`, and is not required for the default live path.

Provider constraints recorded on 2026-06-14:

- API docs: `https://www.hlidacstatu.cz/api/v1/doc`
- Swagger: `https://api.hlidacstatu.cz/swagger/v2/swagger.json`
- Provider route: `POST /api/opportunities/live/hlidac-statu` currently returns `410` before provider fetch.
- API token is required.
- Swagger states a rate limit of 4 requests per second per client.
- Swagger terms of service point to `https://www.hlidacstatu.cz/texty/provoznipodminky/`.
- Swagger license is `CC BY 3.0 CZ`.
- Public procurement search is treated as commercial-approval gated.

Future gates before any owner-approved re-enable:

- `HLIDAC_STATU_API_TOKEN` must be configured server-side.
- `HLIDAC_STATU_COMMERCIAL_APPROVED=true` must be set after account/license confirmation.
- Source record `hlidac-statu-vz-it` must be enabled manually.
- Allowed canonical opportunity host is `www.hlidacstatu.cz`.
