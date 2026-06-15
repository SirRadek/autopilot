param(
  [string]$BaseUrl = "http://127.0.0.1:3000",
  [string]$PayloadPath = ""
)

if (-not $env:OPPORTUNITY_LIVE_RUN_TOKEN) {
  throw "OPPORTUNITY_LIVE_RUN_TOKEN must be set before running a live web opportunity source."
}

if (-not $PayloadPath) {
  $PayloadPath = Join-Path $PSScriptRoot "fixtures\opportunity-web-source.json"
}

if (-not (Test-Path -LiteralPath $PayloadPath)) {
  throw "Payload file was not found: $PayloadPath"
}

$body = Get-Content -LiteralPath $PayloadPath -Raw
$headers = @{ "x-mesh-service-token" = $env:OPPORTUNITY_LIVE_RUN_TOKEN }

Write-Host "== Live web opportunity source run =="
Invoke-WebRequest -UseBasicParsing -Method POST "$BaseUrl/api/opportunities/live/web-source" `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $body |
  Select-Object StatusCode
