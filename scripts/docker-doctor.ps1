$ErrorActionPreference = "Continue"

Write-Host "== Docker CLI =="
docker version

Write-Host "`n== Docker Contexts =="
docker context ls

Write-Host "`n== Windows Services =="
Get-Service com.docker.service, vmcompute -ErrorAction SilentlyContinue | Format-Table Name, Status, StartType

Write-Host "`n== WSL =="
wsl.exe -l -v

Write-Host "`n== Docker Pipes =="
[pscustomobject]@{
  DockerDesktopLinuxEngine = Test-Path "\\.\pipe\dockerDesktopLinuxEngine"
  DockerEngine = Test-Path "\\.\pipe\docker_engine"
} | Format-List

Write-Host "`n== Compose =="
docker compose ps

Write-Host "`n== Postgres Port =="
Test-NetConnection 127.0.0.1 -Port 5432
