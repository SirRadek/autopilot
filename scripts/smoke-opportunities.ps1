$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "http://127.0.0.1:3000" }

if (!$env:OPPORTUNITY_INGEST_TOKEN) {
  throw "OPPORTUNITY_INGEST_TOKEN must be set before checking /api/opportunities/ingest."
}

$fixturePath = Join-Path $PSScriptRoot "fixtures\opportunity-ingest.json"
$body = Get-Content -LiteralPath $fixturePath -Raw

Write-Host "== Opportunity ingest fixture =="
Invoke-WebRequest -UseBasicParsing -Method POST "$BaseUrl/api/opportunities/ingest" `
  -Headers @{ "x-mesh-service-token" = $env:OPPORTUNITY_INGEST_TOKEN } `
  -ContentType "application/json" `
  -Body $body |
  Select-Object StatusCode
