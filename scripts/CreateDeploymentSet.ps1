# ============================================================
#  FIT (Fish Inventory Tracking) - Create Production Deployment Set
#  Target Deployment Location: E:\FIT
#  Output: FIT_Deploy_Set\ (folder to overwrite E:\FIT)
#          FIT_Deploy_Set.zip (for easy transfer)
#
#  Features:
#  - Zero source code dependency (no src/, server/src/, node_modules)
#  - Only compiled artifacts and deployment runtime scripts
#  - Safe for overwriting E:\FIT (server\.env is preserved via .env.template)
# ============================================================

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

$DeployDir = Join-Path $ProjectRoot "FIT_Deploy_Set"
$ZipPath   = Join-Path $ProjectRoot "FIT_Deploy_Set.zip"

function Log-Task($msg)  { Write-Host "`n>> $msg" -ForegroundColor Cyan }
function Log-Step($msg)  { Write-Host "   -> $msg" -ForegroundColor Gray }
function Log-OK($msg)    { Write-Host "   OK  $msg" -ForegroundColor Green }
function Log-Warn($msg)  { Write-Host "   !!  $msg" -ForegroundColor Yellow }

# 1. Verify and build frontend & backend
Log-Task "BUILDING PRODUCTION ARTIFACTS"

Log-Step "Building Frontend (npm run build)..."
Set-Location $ProjectRoot
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Frontend build failed"; exit 1 }
Log-OK "Frontend build complete (dist/)"

Log-Step "Building Backend (server/dist)..."
Set-Location (Join-Path $ProjectRoot "server")
npm run build
if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }
Set-Location $ProjectRoot
Log-OK "Backend build complete (server/dist/)"

# 2. Prepare clean deployable output folder
Log-Task "CREATING CLEAN DEPLOYABLE FOLDER"
if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $DeployDir          | Out-Null
New-Item -ItemType Directory -Path "$DeployDir\server" | Out-Null
New-Item -ItemType Directory -Path "$DeployDir\scripts"| Out-Null

# 3. Copy Frontend artifacts
Log-Task "COPYING COMPILED FRONTEND (dist/)"
Copy-Item -Path (Join-Path $ProjectRoot "dist") -Destination $DeployDir -Recurse -Force
Log-OK "Frontend distribution copied to $DeployDir\dist"

# 4. Copy Backend compiled artifacts
Log-Task "COPYING COMPILED BACKEND (server/dist/)"
Copy-Item -Path (Join-Path $ProjectRoot "server\dist") -Destination "$DeployDir\server" -Recurse -Force
Copy-Item -Path (Join-Path $ProjectRoot "server\package.json")      -Destination "$DeployDir\server" -Force
Copy-Item -Path (Join-Path $ProjectRoot "server\package-lock.json") -Destination "$DeployDir\server" -Force
Log-OK "Backend compiled dist and package definitions copied to $DeployDir\server"

# 5. Create .env.template (NEVER overwrite production's existing .env)
Log-Task "CREATING .env.template"
@"
# FIT Production Environment Config
# -------------------------------------------------------
# DO NOT DELETE THIS FILE.
# WhatsApp stats are written here at runtime by the server.
# This template is ONLY used on first deployment (when no
# .env exists). Subsequent deploys preserve the live .env.
# -------------------------------------------------------
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3308
DB_USER=fit_user
DB_PASSWORD=fit_password
DB_NAME=fit_db
WHATSAPP_API_KEY=f530452e37d14cd6954209f690a8c5f1
WHATSAPP_API_HOST=apiwhatsapp.lionsms.com
Max Msg Count=5000
Remaining Msg Count=5000
Total Msg Sent=0
Msg Sent Today=0
Last Sent Date=
"@ | Set-Content -Path "$DeployDir\server\.env.template" -Encoding UTF8
Log-OK ".env.template created in $DeployDir\server"

# 6. Copy Scripts (excluding log files and temp files)
Log-Task "COPYING AUTOMATION SCRIPTS"
$scriptFiles = Get-ChildItem -Path (Join-Path $ProjectRoot "scripts") -File |
    Where-Object { $_.Extension -eq ".ps1" }

foreach ($sf in $scriptFiles) {
    Copy-Item -Path $sf.FullName -Destination "$DeployDir\scripts" -Force
}
Log-OK "PowerShell scripts copied to $DeployDir\scripts (clean of logs)"

# 7. Copy Infrastructure & Startup Launchers
Log-Task "COPYING LAUNCHERS AND INFRASTRUCTURE"
$rootFiles = @(
    "docker-compose.yml",
    "package.json",
    "package-lock.json",
    "deploy-production.ps1",
    "backup-restore.ps1",
    "DEPLOYMENT.md",
    "DEPLOYMENT - NSSM.md",
    "README.md",
    "WhatsAppSharing_Steps.txt",
    "FIT.bat",
    "FIT_Prod_Start.bat",
    "FIT_START_PROD.bat",
    "FIT_Start.bat"
)

foreach ($rf in $rootFiles) {
    $fullPath = Join-Path $ProjectRoot $rf
    if (Test-Path $fullPath) {
        Copy-Item -Path $fullPath -Destination $DeployDir -Force
    }
}

# 8. Create master one-click production startup script
Log-Task "CREATING MASTER FIT_Start_Production.bat"
$startBat = '@echo off
REM =========================================================
REM  FIT - Fish Inventory Tracking  |  Production Start
REM  Drop entire folder contents at E:\FIT and run this.
REM =========================================================
setlocal
set "APP_ROOT=%~dp0"
if "%APP_ROOT:~-1%"=="\" set "APP_ROOT=%APP_ROOT:~0,-1%"
set "SERVER_DIR=%APP_ROOT%\server"

echo.
echo =========================================================
echo   FIT Application - Production Startup
echo   Root: %APP_ROOT%
echo =========================================================
echo.

echo [1/4] Starting MySQL Database (Docker)...
docker compose -f "%APP_ROOT%\docker-compose.yml" up -d
if %ERRORLEVEL% NEQ 0 (
    echo   ERROR: Docker failed. Is Docker Desktop running?
    pause & exit /b 1
)
echo       Done.
echo.

echo [2/4] Checking server\.env ...
if not exist "%SERVER_DIR%\.env" (
    echo       First deployment - creating .env from template...
    copy "%SERVER_DIR%\.env.template" "%SERVER_DIR%\.env" >nul
    echo       .env created.
) else (
    echo       Existing .env found - live stats and settings preserved.
)
echo.

echo [3/4] Checking backend dependencies...
if not exist "%SERVER_DIR%\node_modules\express\" (
    echo       Installing dependencies (first run only)...
    if exist "%SERVER_DIR%\node_modules\" rmdir /s /q "%SERVER_DIR%\node_modules"
    pushd "%SERVER_DIR%"
    call npm install --omit=dev
    popd
    if %ERRORLEVEL% NEQ 0 (
        echo   ERROR: npm install failed. Check internet connection.
        pause & exit /b 1
    )
    echo       Done.
) else (
    echo       Dependencies OK.
)
echo.

echo [4/4] Starting FIT Backend (port 3001)...
pushd "%SERVER_DIR%"
start /b node dist\index.js
popd
echo       Backend started.
echo.

echo Waiting for server to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

echo Opening FIT in browser...
start http://localhost:3001

echo.
echo =========================================================
echo   FIT is running at http://localhost:3001
echo   Close this window to stop monitoring.
echo   (The server continues running in the background)
echo =========================================================
echo.
pause'

$startBat | Set-Content -Path "$DeployDir\FIT_Start_Production.bat" -Encoding ASCII
# Also keep a copy at project root for convenience
$startBat | Set-Content -Path (Join-Path $ProjectRoot "FIT_Start_Production.bat") -Encoding ASCII
Log-OK "FIT_Start_Production.bat generated"

# 9. Verify NO source code in deployable set
Log-Task "VERIFYING ZERO SOURCE DEPENDENCY"
$hasSrc = Test-Path "$DeployDir\src"
$hasServerSrc = Test-Path "$DeployDir\server\src"
$hasNodeModules = Test-Path "$DeployDir\node_modules"
$hasServerNodeModules = Test-Path "$DeployDir\server\node_modules"

if ($hasSrc -or $hasServerSrc -or $hasNodeModules -or $hasServerNodeModules) {
    Write-Error "Deployable set contains unwanted source or dependency directories!"
    exit 1
}
Log-OK "Zero source code verified (no src/, no server/src/, no node_modules)"

# 10. Generate ZIP package
Log-Task "COMPRESSING TO ZIP ARCHIVE"
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
Compress-Archive -Path "$DeployDir\*" -DestinationPath $ZipPath -CompressionLevel Optimal -Force
$sizeMB = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Log-OK "Zip archive generated: $ZipPath ($sizeMB MB)"

# 11. Summary
Log-Task "DEPLOYABLE SET GENERATION COMPLETE"
Write-Host "Folder  : $DeployDir" -ForegroundColor White
Write-Host "Zip File: $ZipPath ($sizeMB MB)" -ForegroundColor White
Write-Host "`nTo update production:" -ForegroundColor Yellow
Write-Host "1. Overwrite contents of 'E:\FIT' with contents of 'FIT_Deploy_Set'." -ForegroundColor Yellow
Write-Host "2. Run 'E:\FIT\FIT_Start_Production.bat' (or 'pm2 restart fit-backend')." -ForegroundColor Yellow
Set-Location $ProjectRoot
