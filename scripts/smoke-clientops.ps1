$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "http://127.0.0.1:3000" }

Write-Host "== Health =="
Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/health" | Select-Object StatusCode

Write-Host "`n== Ready =="
Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/ready" | Select-Object StatusCode

Write-Host "`n== Workflow tasks =="
if (!$env:MESH_SERVICE_TOKEN) {
  throw "MESH_SERVICE_TOKEN must be set before checking /api/workflow/tasks."
}
$workflowHeaders = @{ "x-mesh-service-token" = $env:MESH_SERVICE_TOKEN }

Invoke-WebRequest -UseBasicParsing "$BaseUrl/api/workflow/tasks" -Headers $workflowHeaders | Select-Object StatusCode

Write-Host "`n== Lead intake =="
$stamp = Get-Date -Format "yyyyMMddHHmmss"
$body = @{
  name = "Runtime Smoke"
  email = "runtime-smoke-$stamp@example.com"
  project_type = "website"
  message = "Smoke test lead"
  source_path = "/kontakt?utm_source=smoke"
  referrer = "https://radeq.cz"
  locale = "cs"
} | ConvertTo-Json -Compress

Invoke-WebRequest -UseBasicParsing -Method POST "$BaseUrl/api/public/leads" -ContentType "application/json" -Body $body |
  Select-Object StatusCode
