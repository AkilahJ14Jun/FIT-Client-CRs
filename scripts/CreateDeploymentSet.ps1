# ============================================================
#  FIT (Fish Inventory Tracking) - Create Production Deployment Set
#  Target Deployment Location: E:\FIT
#  Output: FIT_Deploy_Set\ (folder to overwrite E:\FIT)
#          FIT_Deploy_Set.zip (for easy transfer)
#
#  Features:
#  - Zero source code dependency (no src/, server/src/, node_modules)
#  - Only compiled artifacts and deployment runtime scripts
#  - Safe for overwriting E:\FIT (server\.env is preserved)
#  - Optional -DeployTo parameter to directly update production
# ============================================================

param(
    [string]$DeployTo = "",
    [switch]$SkipBuild
)

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
if (-not $SkipBuild) {
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
} else {
    Log-Task "SKIPPING BUILD (USING EXISTING ARTIFACTS)"
}

# 2. Prepare clean deployable output folder
Log-Task "CREATING CLEAN DEPLOYABLE FOLDER ($DeployDir)"
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
WHATSAPP_API_KEY=631d9a023ac72df2c5e210aa75e049a0b328d7b51497eb8926275900a3f7c750
WHATSAPP_API_HOST=https://waapi.automationclub.in/api/v2/whatsapp-business/messages
WHATSAPP_PHONE_ID=1235162486347376
WHATSAPP_USERNAME=asbrothers75300@gmail.com
WHATSAPP_PASSWORD=Asbrothers@123
WHATSAPP_WEBSITE=https://waapi.automationclub.in
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
docker inspect -f "{{.State.Running}}" fit_mysql_db 2>nul | findstr "true" >nul
if %ERRORLEVEL% EQU 0 (
    echo       MySQL container is already running.
) else (
    docker start fit_mysql_db 2>nul
    if %ERRORLEVEL% NEQ 0 (
        docker compose -f "%APP_ROOT%\docker-compose.yml" up -d
        if %ERRORLEVEL% NEQ 0 (
            echo   ERROR: Docker failed. Is Docker Desktop running?
            pause & exit /b 1
        )
    )
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
    echo       Installing dependencies - first run or update...
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
REM Stop existing node on 3001 if already running
for /f "tokens=5" %%a in (''netstat -aon ^| findstr :3001 ^| findstr LISTENING'') do (
    echo       Stopping existing process on port 3001 PID %%a...
    taskkill /F /PID %%a >nul 2>&1
)
pushd "%SERVER_DIR%"
start "FIT Backend" /b node dist\index.js
popd
echo       Backend started.
echo.

echo Waiting for server to initialize 5 seconds...
timeout /t 5 /nobreak >nul

echo Opening FIT in browser...
start http://localhost:3001

echo.
echo =========================================================
echo   FIT is running at http://localhost:3001
echo   Close this window to stop monitoring.
echo   Server continues running in the background.
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

# 11. Optional Deployment to Target (e.g. E:\FIT)
if ($DeployTo) {
    Log-Task "DEPLOYING DIRECTLY TO TARGET LOCATION: $DeployTo"
    if (-not (Test-Path $DeployTo)) {
        New-Item -ItemType Directory -Path $DeployTo -Force | Out-Null
    }

    # Stop running process on port 3001 if active to release file locks
    $netstat = netstat -aon | Select-String ":3001.*LISTENING"
    if ($netstat) {
        $pidToKill = ($netstat.ToString().Trim() -split '\s+')[-1]
        Log-Step "Stopping running server on port 3001 (PID $pidToKill) to release file locks..."
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }

    # Copy files preserving existing server\.env
    $targetEnv = Join-Path $DeployTo "server\.env"
    $hasExistingEnv = Test-Path $targetEnv
    $tempEnv = $null

    if ($hasExistingEnv) {
        Log-Step "Preserving existing production .env file..."
        $tempEnv = [System.IO.Path]::GetTempFileName()
        Copy-Item -Path $targetEnv -Destination $tempEnv -Force
    }

    Log-Step "Copying deployable files to $DeployTo..."
    Copy-Item -Path "$DeployDir\*" -Destination $DeployTo -Recurse -Force

    if ($hasExistingEnv -and (Test-Path $tempEnv)) {
        Copy-Item -Path $tempEnv -Destination $targetEnv -Force
        Remove-Item $tempEnv -Force -ErrorAction SilentlyContinue
        Log-OK "Production .env file safely restored."
    } elseif (-not (Test-Path $targetEnv)) {
        # First time deploy: copy current root server/.env or template
        $sourceEnv = Join-Path $ProjectRoot "server\.env"
        if (Test-Path $sourceEnv) {
            Copy-Item -Path $sourceEnv -Destination $targetEnv -Force
            Log-OK "Initialized server\.env from project server\.env"
        } else {
            Copy-Item -Path (Join-Path $DeployTo "server\.env.template") -Destination $targetEnv -Force
            Log-OK "Initialized server\.env from template"
        }
    }

    # Verify zero source in target
    if ((Test-Path "$DeployTo\src") -or (Test-Path "$DeployTo\server\src")) {
        Write-Error "Deployment target $DeployTo contains source directories!"
        exit 1
    }
    Log-OK "Verified target $DeployTo has NO source code dependencies"

    # Install backend dependencies if not present
    if (-not (Test-Path "$DeployTo\server\node_modules\express")) {
        Log-Step "Installing backend production dependencies in $DeployTo\server..."
        Push-Location "$DeployTo\server"
        npm install --omit=dev
        Pop-Location
        Log-OK "Backend production dependencies installed"
    } else {
        Log-OK "Backend production dependencies already present"
    }

    Log-OK "Target $DeployTo successfully updated!"
}

# 12. Summary
Log-Task "DEPLOYABLE SET GENERATION COMPLETE"
Write-Host "Folder  : $DeployDir" -ForegroundColor White
Write-Host "Zip File: $ZipPath ($sizeMB MB)" -ForegroundColor White
if ($DeployTo) {
    Write-Host "Deployed: $DeployTo" -ForegroundColor Green
}
Write-Host "`nTo update production at any time:" -ForegroundColor Yellow
Write-Host "Option 1: Overwrite contents of 'E:\FIT' with contents of '$DeployDir'." -ForegroundColor Yellow
Write-Host "Option 2: Run '.\update-production.bat' or '.\scripts\CreateDeploymentSet.ps1 -DeployTo E:\FIT'." -ForegroundColor Yellow
Write-Host "Then run 'E:\FIT\FIT_Start_Production.bat'." -ForegroundColor Yellow
Set-Location $ProjectRoot

