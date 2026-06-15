$ErrorActionPreference = "Stop"

$BaseUrl = if ($env:NEXT_PUBLIC_APP_URL) { $env:NEXT_PUBLIC_APP_URL } else { "http://127.0.0.1:3000" }

if (!$env:MESH_SERVICE_TOKEN) {
  throw "MESH_SERVICE_TOKEN must be set before running the live opportunity source."
}

if (!$env:HLIDAC_STATU_API_TOKEN) {
  throw "HLIDAC_STATU_API_TOKEN must be set before running the Hlídač Státu live source."
}

if ($env:HLIDAC_STATU_COMMERCIAL_APPROVED -ne "true") {
  throw "HLIDAC_STATU_COMMERCIAL_APPROVED must be true before running the Hlídač Státu public procurement search."
}

$body = @{
  page = 1
  query = "web OR cms OR portál OR software OR informační systém OR aplikace"
} | ConvertTo-Json -Compress

Write-Host "== Hlídač Státu live opportunity run =="
Invoke-WebRequest -UseBasicParsing -Method POST "$BaseUrl/api/opportunities/live/hlidac-statu" `
  -Headers @{ "x-mesh-service-token" = $env:MESH_SERVICE_TOKEN } `
  -ContentType "application/json" `
  -Body $body |
  Select-Object StatusCode
