# PackageRelease.ps1
# Automates the assembly of the FIT Update Set

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$releaseDir = "$projectRoot\FIT_Release_Set"
$zipFile = "$projectRoot\FIT_Release_Set.zip"

Write-Host "Creating Release Package in $releaseDir ..." -ForegroundColor Cyan

# 1. Cleanup
if (Test-Path $releaseDir) {
    Remove-Item -Path "$releaseDir\*" -Recurse -Force -ErrorAction SilentlyContinue
} else {
    New-Item -Path $releaseDir -ItemType Directory | Out-Null
}
if (Test-Path $zipFile) { Remove-Item -Path $zipFile -Force }

# 2. Copy Frontend
Write-Host "  Copying Frontend build ..."
Copy-Item -Path "$projectRoot\dist" -Destination "$releaseDir\dist" -Recurse -Force

# 3. Copy Backend
Write-Host "  Copying Backend build ..."
New-Item -Path "$releaseDir\server" -ItemType Directory -Force | Out-Null
Copy-Item -Path "$projectRoot\server\dist" -Destination "$releaseDir\server\dist" -Recurse -Force
Copy-Item -Path "$projectRoot\server\package.json" -Destination "$releaseDir\server\package.json" -Force

# 4. Copy Scripts
Write-Host "  Copying automation scripts ..."
Copy-Item -Path "$projectRoot\scripts" -Destination "$releaseDir\scripts" -Recurse -Force

# 5. Copy Root Files
$files = @(
    "deploy-production.ps1",
    "backup-restore.ps1",
    "docker-compose.yml",
    "DEPLOYMENT.md",
    "README.md",
    "ARCHITECTURE.md",
    "FIT_Login_ICON.JPG",
    "FIT.bat",
    "FIT_Start.bat"
)

foreach ($f in $files) {
    if (Test-Path "$projectRoot\$f") {
        Copy-Item -Path "$projectRoot\$f" -Destination "$releaseDir\$f" -Force
    }
}

# 6. Archive
Write-Host "Creating ZIP..." -ForegroundColor Cyan
Compress-Archive -Path "$releaseDir\*" -DestinationPath $zipFile -Force

Write-Host "Complete Release Bundle generated: $zipFile" -ForegroundColor Cyan
