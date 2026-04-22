# FIT (Fish Inventory Tracking) — Release Packaging Script
# This script bundles all built artifacts into a standalone folder for production deployment.

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ReleaseRoot = Join-Path $ProjectRoot "FIT_Release_Final"
$ServerFolder = Join-Path $ProjectRoot "server"

Write-Host "Creating Production Deployment Set..." -ForegroundColor Cyan

# 1. Ensure Target Directory is Clean
if (Test-Path $ReleaseRoot) {
    Write-Host "  Cleaning existing release folder..."
    Remove-Item $ReleaseRoot -Recurse -Force
}
New-Item $ReleaseRoot -ItemType Directory | Out-Null

# 2. Build Frontend
Write-Host "  Building Frontend (Vite)..."
$ViteBin = Join-Path $ProjectRoot "node_modules\vite\bin\vite.js"
& "node" "$ViteBin" build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }

# 3. Build Backend
Write-Host "  Building Backend (TypeScript)..."
Set-Location "$ServerFolder"
$TscBin = Join-Path $ServerFolder "node_modules\typescript\bin\tsc"
& "node" "$TscBin"
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }

# 4. Copy Artifacts to Release Folder
Write-Host "  Copying artifacts..."

# Frontend
Copy-Item (Join-Path $ProjectRoot "dist") (Join-Path $ReleaseRoot "dist") -Recurse -Force

# Backend
$TargetServer = New-Item (Join-Path $ReleaseRoot "server") -ItemType Directory
Copy-Item (Join-Path $ServerFolder "dist") $TargetServer -Recurse -Force
Copy-Item (Join-Path $ServerFolder "package.json") $TargetServer -Force
Copy-Item (Join-Path $ServerFolder "package-lock.json") $TargetServer -Force

# Create production .env template
$EnvContent = @"
# FIT Production Environment Config
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3308
DB_USER=fit_user
DB_PASSWORD=fit_password
DB_NAME=fit_db
"@
$EnvContent | Set-Content (Join-Path $TargetServer ".env") -Encoding UTF8

# Infrastructure & Scripts
Copy-Item (Join-Path $ProjectRoot "scripts") $ReleaseRoot -Recurse -Force
Copy-Item (Join-Path $ProjectRoot "docker-compose.yml") $ReleaseRoot -Force
Copy-Item (Join-Path $ProjectRoot "package.json") $ReleaseRoot -Force
Copy-Item (Join-Path $ProjectRoot "package-lock.json") $ReleaseRoot -Force
Copy-Item (Join-Path $ProjectRoot "deploy-production.ps1") $ReleaseRoot -Force
Copy-Item (Join-Path $ProjectRoot "FIT_Prod_Start.bat") $ReleaseRoot -Force
Copy-Item (Join-Path $ProjectRoot "DEPLOYMENT.md") $ReleaseRoot -Force

Write-Host "`nSUCCESS: Deployment Set created at: $ReleaseRoot" -ForegroundColor Green
Write-Host "You can now copy the contents of this folder to E:\FIT on the production machine." -ForegroundColor Yellow
Set-Location $ProjectRoot
