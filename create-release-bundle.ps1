param(
    [string]$OutDir = "release-bundle",
    [string]$ZipName = "FIT-Release.zip"
)

$ErrorActionPreference = "Stop"

Write-Host "Creating Release Bundle..." -ForegroundColor Cyan

# 1. Build frontend
Write-Host "Building Frontend..." -ForegroundColor Yellow
npm install
npm run build

# 2. Build backend
Write-Host "Building Backend..." -ForegroundColor Yellow
Push-Location server
npm install
npm run build
Pop-Location

# 3. Prepare output directory
Write-Host "Preparing Release Directory ($OutDir)..." -ForegroundColor Yellow
if (Test-Path $OutDir) {
    Remove-Item -Recurse -Force $OutDir
}
New-Item -ItemType Directory -Path $OutDir | Out-Null
New-Item -ItemType Directory -Path "$OutDir\server" | Out-Null

# 4. Copy required root files
Write-Host "Copying Root Files..." -ForegroundColor Yellow
$rootItems = @(
    "dist",
    "scripts",
    "deploy-production.ps1",
    "backup-restore.ps1",
    "docker-compose.yml",
    "package.json",
    "package-lock.json",
    "DEPLOYMENT.md",
    "DEPLOYMENT - NSSM.md",
    "README.md",
    "FIT.bat",
    "FIT_Prod_Start.bat",
    "FIT_START_PROD.bat",
    "FIT_Start.bat",
    "Launch_App.ps1",
    "WhatsAppSharing_Steps.txt"
)

foreach ($item in $rootItems) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$OutDir\" -Recurse -Force
    }
}

# 5. Copy required server files
Write-Host "Copying Server Files..." -ForegroundColor Yellow
$serverItems = @(
    "server\dist",
    "server\package.json",
    "server\package-lock.json",
    "server\.env"
)

foreach ($item in $serverItems) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$OutDir\server\" -Recurse -Force
    }
}

# 6. Create Zip Archive
Write-Host "Creating Zip Archive ($ZipName)..." -ForegroundColor Yellow
if (Test-Path $ZipName) {
    Remove-Item -Force $ZipName
}
Compress-Archive -Path "$OutDir\*" -DestinationPath $ZipName -Force

Write-Host "Release Bundle created successfully!" -ForegroundColor Green
Write-Host "Directory: $OutDir"
Write-Host "Zip File : $ZipName"
