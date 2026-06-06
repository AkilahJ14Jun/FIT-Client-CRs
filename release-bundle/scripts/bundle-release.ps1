# FIT Release Bundler
# This script creates a clean production package for Windows deployment.
# It excludes all node_modules and source code, providing only build artifacts and configuration.

$ScriptDir = Split-Path $MyInvocation.MyCommand.Path -Parent
$ProjectRoot = Split-Path $ScriptDir -Parent
$ReleaseDir = Join-Path $ProjectRoot "FIT_Release_Set"
$ZipPath = Join-Path $ProjectRoot "FIT_Release_Set.zip"

function Log-Task($msg) { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Log-Step($msg) { Write-Host "   -> $msg" -ForegroundColor Gray }
function Log-Success($msg) { Write-Host "`n✅ $msg" -ForegroundColor Green }

Log-Task "STARTING RELEASE BUNDLE PROCESS"

# 1. CLEANING OLD DIRECTORIES
Log-Step "Cleaning old release files..."
if (Test-Path $ReleaseDir) { Remove-Item $ReleaseDir -Recurse -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

# 2. PERFORMING FRESH BUILDS
Log-Task "BUILDING APPLICATION"

Log-Step "Building Frontend (npm run build)..."
Set-Location $ProjectRoot
npm run build 

Log-Step "Building Backend (server/dist)..."
Set-Location (Join-Path $ProjectRoot "server")
npx tsc

# 3. ASSEMBLING THE PACKAGE
Log-Task "ASSEMBLING PACKAGE"

Log-Step "Creating folder structure..."
New-Item -ItemType Directory -Path $ReleaseDir -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $ReleaseDir "server") -Force | Out-Null

Log-Step "Copying Frontend artifacts..."
Copy-Item -Path (Join-Path $ProjectRoot "dist") -Destination $ReleaseDir -Recurse -Force

Log-Step "Copying Backend artifacts..."
Copy-Item -Path (Join-Path $ProjectRoot "server\dist") -Destination (Join-Path $ReleaseDir "server") -Recurse -Force
Copy-Item -Path (Join-Path $ProjectRoot "server\package.json") -Destination (Join-Path $ReleaseDir "server") -Force
Copy-Item -Path (Join-Path $ProjectRoot "server\package-lock.json") -Destination (Join-Path $ReleaseDir "server") -Force
Copy-Item -Path (Join-Path $ProjectRoot "server\.env") -Destination (Join-Path $ReleaseDir "server") -Force

Log-Step "Copying Root configuration & scripts..."
Copy-Item -Path (Join-Path $ProjectRoot "deploy-production.ps1") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "package.json") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "tsconfig.json") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "vite.config.ts") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "docker-compose.yml") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "DEPLOYMENT.md") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "README.md") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "backup-restore.ps1") -Destination $ReleaseDir -Force
Copy-Item -Path (Join-Path $ProjectRoot "scripts") -Destination $ReleaseDir -Recurse -Force

# 4. FINALIZING ZIP
Log-Task "COMPRESSING PACKAGE"
Log-Step "Creating $ZipPath..."
Compress-Archive -Path "$ReleaseDir\*" -DestinationPath $ZipPath -Force

Log-Success "PROCESS COMPLETE!"
Write-Host "Your deployable set is ready at: $ZipPath" -ForegroundColor White
Write-Host "Instructions:" -ForegroundColor Gray
Write-Host "1. Copy FIT_Release_Set.zip to the production PC." -ForegroundColor Gray
Write-Host "2. Unzip to C:\FIT." -ForegroundColor Gray
Write-Host "3. Follow instructions in DEPLOYMENT.md (Step 2 and onwards)." -ForegroundColor Gray
