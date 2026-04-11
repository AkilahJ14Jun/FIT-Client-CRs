<#
.SYNOPSIS
    FIT (Fish Inventory Tracking) — One-Click Production Deployment Script
    Automates Steps 2–9 of DEPLOYMENT.md on a Windows machine.

.DESCRIPTION
    This script will:
      1. Verify prerequisites (Node.js, Docker, NSSM, Nginx)
      2. Start MySQL via Docker Compose
      3. Install & compile the backend
      4. Build the frontend (Vite production build)
      5. Generate the Nginx config
      6. Register backend + Nginx as Windows Services (NSSM)
      7. Register the WhatsApp fitshare:// protocol (optional)
      8. Configure Windows Firewall rules
      9. Verify the deployment

    Run this script from the project root as Administrator!

.NOTES
    See DEPLOYMENT.md for the full manual walkthrough.
#>

#Requires -RunAsAdministrator
param(
    [string]$InstallRoot = "C:\FIT",
    [string]$NginxRoot   = "C:\nginx",
    [switch]$SkipWhatsApp,
    [switch]$SkipFirewall,
    [switch]$SkipHTTPS,
    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ─── Helpers ─────────────────────────────────────────────────
function Write-Step  { param($Msg) Write-Host "`n━━━ $Msg ━━━" -ForegroundColor Cyan }
function Write-OK    { param($Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Warn  { param($Msg) Write-Host "  ⚠ $Msg" -ForegroundColor Yellow }
function Write-Fail  { param($Msg) Write-Host "  ✗ $Msg" -ForegroundColor Red }

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# ─── Step 0: Pre-flight Checks ──────────────────────────────
Write-Step "Step 0: Pre-flight Checks"

$prereqOK = $true

# Node.js
if (Test-Command "node") {
    $nodeVer = (node --version) -replace 'v', ''
    $nodeMajor = [int]($nodeVer.Split('.')[0])
    if ($nodeMajor -ge 20) { Write-OK "Node.js $nodeVer" }
    else { Write-Fail "Node.js $nodeVer found — v20+ required"; $prereqOK = $false }
} else { Write-Fail "Node.js not found in PATH"; $prereqOK = $false }

# npm
if (Test-Command "npm") { Write-OK "npm $(npm --version)" }
else { Write-Fail "npm not found in PATH"; $prereqOK = $false }

# Docker
if (Test-Command "docker") {
    $dockerRunning = docker info 2>&1
    if ($LASTEXITCODE -eq 0) { Write-OK "Docker Desktop is running" }
    else { Write-Fail "Docker is installed but not running — start Docker Desktop first"; $prereqOK = $false }
} else { Write-Fail "Docker not found in PATH"; $prereqOK = $false }

# NSSM
if (Test-Command "nssm") { Write-OK "NSSM available" }
else { Write-Fail "NSSM not found in PATH — download from https://nssm.cc"; $prereqOK = $false }

# Nginx
if (Test-Path "$NginxRoot\nginx.exe") { Write-OK "Nginx found at $NginxRoot" }
else { Write-Warn "Nginx not found at $NginxRoot — will skip Nginx setup (serve frontend manually)" }

if (-not $prereqOK) {
    Write-Fail "One or more prerequisites missing. Fix the above and retry."
    exit 1
}

# ─── Step 1: Copy Project to Install Root ────────────────────
Write-Step "Step 1: Deploy Project to $InstallRoot"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if ($scriptDir -ne $InstallRoot) {
    if ((Test-Path $InstallRoot) -and -not $Force) {
        Write-Warn "$InstallRoot already exists. Use -Force to overwrite."
    } else {
        Write-Host "  Copying project files to $InstallRoot ..."
        if (Test-Path $InstallRoot) { Remove-Item "$InstallRoot\*" -Recurse -Force -ErrorAction SilentlyContinue }
        New-Item $InstallRoot -ItemType Directory -Force | Out-Null
        # Copy everything except node_modules, .git, dist
        $excludes = @('node_modules', '.git', 'dist')
        Get-ChildItem $scriptDir -Force |
            Where-Object { $_.Name -notin $excludes } |
            ForEach-Object { Copy-Item $_.FullName "$InstallRoot\$($_.Name)" -Recurse -Force }
        Write-OK "Project copied to $InstallRoot"
    }
} else {
    Write-OK "Already running from $InstallRoot — no copy needed"
}

# ─── Step 2: Start MySQL via Docker Compose ──────────────────
Write-Step "Step 2: Start MySQL (Docker Compose)"

Push-Location $InstallRoot
docker compose up -d 2>&1 | Out-Null
Pop-Location

# Wait for MySQL to be ready (max 60s)
Write-Host "  Waiting for MySQL to accept connections ..."
$maxWait = 60; $waited = 0
do {
    $ready = docker exec fit_mysql_db mysqladmin ping -uroot -proot 2>&1
    if ($ready -match "alive") { break }
    Start-Sleep -Seconds 2; $waited += 2
} while ($waited -lt $maxWait)

if ($waited -ge $maxWait) {
    Write-Fail "MySQL did not become ready within ${maxWait}s — check 'docker logs fit_mysql_db'"
    exit 1
}
Write-OK "MySQL is running on port 3308"

# ─── Step 3: Build Backend ───────────────────────────────────
Write-Step "Step 3: Install & Compile Backend"

Push-Location "$InstallRoot\server"

# Create production .env if it doesn't exist
if (-not (Test-Path ".env")) {
    @"
# Backend environment – matches docker-compose.yml credentials
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3308
DB_USER=fit_user
DB_PASSWORD=fit_password
DB_NAME=fit_db
"@ | Set-Content ".env" -Encoding UTF8
    Write-OK "Created server\.env with production defaults"
} else {
    # Ensure NODE_ENV=production is present
    $envContent = Get-Content ".env" -Raw
    if ($envContent -notmatch "NODE_ENV") {
        Add-Content ".env" "`nNODE_ENV=production"
        Write-OK "Added NODE_ENV=production to existing .env"
    }
}

Write-Host "  Installing backend dependencies ..."
npm install --omit=dev 2>&1 | Out-Null
Write-OK "Backend dependencies installed"

Write-Host "  Compiling TypeScript ..."
npx tsc 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "TypeScript compilation failed — check server/src for errors"
    Pop-Location; exit 1
}
Write-OK "Backend compiled to server\dist\"

# Create logs directory
New-Item "$InstallRoot\server\logs" -ItemType Directory -Force | Out-Null
Pop-Location

# ─── Step 4: Build Frontend ─────────────────────────────────
Write-Step "Step 4: Build Frontend (Vite)"

Push-Location $InstallRoot
Write-Host "  Installing frontend dependencies ..."
npm install 2>&1 | Out-Null
Write-Host "  Building production bundle ..."
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Frontend build failed — check for errors above"
    Pop-Location; exit 1
}
Write-OK "Frontend built to dist\"
Pop-Location

# ─── Step 5: Register Backend as Windows Service ────────────
Write-Step "Step 5: Register Backend as Windows Service (NSSM)"

$svcName = "fit-backend"
$svcStatus = nssm status $svcName 2>&1

if ($svcStatus -match "SERVICE_RUNNING") {
    Write-Host "  Stopping existing $svcName service ..."
    nssm stop $svcName 2>&1 | Out-Null
}
if ($svcStatus -notmatch "not.*exist" -and $svcStatus -notmatch "Can't open") {
    Write-Host "  Removing existing $svcName service ..."
    nssm remove $svcName confirm 2>&1 | Out-Null
}

$nodePath = (Get-Command node).Source
nssm install $svcName $nodePath "dist\index.js" 2>&1 | Out-Null
nssm set $svcName AppDirectory "$InstallRoot\server" 2>&1 | Out-Null
nssm set $svcName DisplayName "FIT Backend API" 2>&1 | Out-Null
nssm set $svcName Description "FIT Application Express.js Backend Server" 2>&1 | Out-Null
nssm set $svcName AppStdout "$InstallRoot\server\logs\stdout.log" 2>&1 | Out-Null
nssm set $svcName AppStderr "$InstallRoot\server\logs\stderr.log" 2>&1 | Out-Null
nssm set $svcName AppStdoutCreationDisposition 4 2>&1 | Out-Null  # Append
nssm set $svcName AppStderrCreationDisposition 4 2>&1 | Out-Null  # Append
nssm set $svcName Start SERVICE_AUTO_START 2>&1 | Out-Null

nssm start $svcName 2>&1 | Out-Null
Start-Sleep -Seconds 3

$status = nssm status $svcName 2>&1
if ($status -match "SERVICE_RUNNING") {
    Write-OK "Backend service '$svcName' is running"
} else {
    Write-Fail "Backend service failed to start — check logs at $InstallRoot\server\logs\"
    Write-Host "  Status: $status"
}

# ─── Step 6: Configure & Register Nginx ─────────────────────
Write-Step "Step 6: Configure Nginx as Reverse Proxy"

if (Test-Path "$NginxRoot\nginx.exe") {
    # Stop any running nginx
    $nginxProc = Get-Process nginx -ErrorAction SilentlyContinue
    if ($nginxProc) {
        Push-Location $NginxRoot
        .\nginx.exe -s stop 2>&1 | Out-Null
        Start-Sleep -Seconds 2
        Pop-Location
    }

    # Write production nginx.conf
    $distPath = "$InstallRoot\dist" -replace '\\','/'
    $nginxConf = @"
worker_processes  1;

events {
    worker_connections  1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout  65;

    # Logging
    access_log  logs/access.log;
    error_log   logs/error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server {
        listen       80;
        server_name  localhost;

        # Frontend static files
        location / {
            root   $distPath;
            index  index.html;
            try_files `$uri `$uri/ /index.html;
        }

        # Proxy API requests to backend
        location /api {
            proxy_pass          http://localhost:3001;
            proxy_http_version  1.1;
            proxy_set_header    Host `$host;
            proxy_set_header    X-Real-IP `$remote_addr;
            proxy_set_header    X-Forwarded-For `$proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto `$scheme;

            # Timeouts for long-running requests
            proxy_connect_timeout 60s;
            proxy_send_timeout    60s;
            proxy_read_timeout    60s;
        }

        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
        gzip_min_length 256;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            root   $distPath;
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
"@
    $nginxConf | Set-Content "$NginxRoot\conf\nginx.conf" -Encoding UTF8
    Write-OK "Nginx config written to $NginxRoot\conf\nginx.conf"

    # Test config
    Push-Location $NginxRoot
    $testResult = .\nginx.exe -t 2>&1
    if ($testResult -match "successful") {
        Write-OK "Nginx config test passed"
    } else {
        Write-Warn "Nginx config test may have issues: $testResult"
    }
    Pop-Location

    # Register Nginx as NSSM service
    $nginxSvc = "fit-nginx"
    $nginxSvcStatus = nssm status $nginxSvc 2>&1
    if ($nginxSvcStatus -notmatch "not.*exist" -and $nginxSvcStatus -notmatch "Can't open") {
        nssm stop $nginxSvc 2>&1 | Out-Null
        nssm remove $nginxSvc confirm 2>&1 | Out-Null
    }
    nssm install $nginxSvc "$NginxRoot\nginx.exe" 2>&1 | Out-Null
    nssm set $nginxSvc AppDirectory $NginxRoot 2>&1 | Out-Null
    nssm set $nginxSvc DisplayName "FIT Nginx Reverse Proxy" 2>&1 | Out-Null
    nssm set $nginxSvc Description "Nginx reverse proxy for FIT application" 2>&1 | Out-Null
    nssm set $nginxSvc Start SERVICE_AUTO_START 2>&1 | Out-Null
    nssm start $nginxSvc 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Write-OK "Nginx registered and started as service '$nginxSvc'"
} else {
    Write-Warn "Nginx not found at $NginxRoot — skipping Nginx setup"
    Write-Warn "You'll need to configure a reverse proxy manually or access the backend directly on :3001"
}

# ─── Step 7: Register WhatsApp Protocol ─────────────────────
if (-not $SkipWhatsApp) {
    Write-Step "Step 7: Register WhatsApp fitshare:// Protocol"

    $protocolScript = "$InstallRoot\scripts\FITShareFinal.ps1"
    if (Test-Path $protocolScript) {
        $ProtocolName = "fitshare"
        $PowerShellPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
        $Command = "`"$PowerShellPath`" -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$protocolScript`" `"%1`""

        $RegPath = "HKCU:\Software\Classes\$ProtocolName"
        if (Test-Path $RegPath) { Remove-Item $RegPath -Recurse -Force }
        New-Item $RegPath -Force | Out-Null
        Set-ItemProperty $RegPath "(Default)" "URL:FIT WhatsApp Protocol"
        Set-ItemProperty $RegPath "URL Protocol" ""
        $ShellPath = New-Item "$RegPath\shell\open\command" -Force
        Set-ItemProperty $ShellPath.PSPath "(Default)" $Command

        # Browser auto-launch policies
        $policyValue = '[{"allowed_origins": ["*"], "protocol": "fitshare"}]'
        @("HKLM:\SOFTWARE\Policies\Microsoft\Edge", "HKLM:\SOFTWARE\Policies\Google\Chrome") | ForEach-Object {
            if (!(Test-Path $_)) { New-Item $_ -Force | Out-Null }
            Set-ItemProperty $_ "AutoLaunchProtocolsFromOrigins" $policyValue -Force
        }
        Write-OK "fitshare:// protocol registered (pointing to $protocolScript)"
    } else {
        Write-Warn "FITShareFinal.ps1 not found at $protocolScript — skipping"
    }
} else {
    Write-Host "`n  Skipping WhatsApp protocol registration (-SkipWhatsApp)" -ForegroundColor DarkGray
}

# ─── Step 8: Windows Firewall ───────────────────────────────
if (-not $SkipFirewall) {
    Write-Step "Step 8: Configure Windows Firewall"

    # Remove old rules if they exist, then create new ones
    @("FIT Nginx (HTTP)", "FIT Nginx (HTTPS)") | ForEach-Object {
        Remove-NetFirewallRule -DisplayName $_ -ErrorAction SilentlyContinue 2>&1 | Out-Null
    }

    New-NetFirewallRule -DisplayName "FIT Nginx (HTTP)"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow | Out-Null
    New-NetFirewallRule -DisplayName "FIT Nginx (HTTPS)" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow | Out-Null
    Write-OK "Firewall rules added for ports 80, 443"
} else {
    Write-Host "`n  Skipping firewall configuration (-SkipFirewall)" -ForegroundColor DarkGray
}

# ─── Step 9: MySQL Auto-Start Scheduled Task ────────────────
Write-Step "Step 9: Configure Auto-Start on Boot"

$taskName = "FIT-MySQL"
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false 2>&1 | Out-Null
}
$action  = New-ScheduledTaskAction -Execute "docker" -Argument "compose up -d" -WorkingDirectory $InstallRoot
$trigger = New-ScheduledTaskTrigger -AtStartup
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -RunLevel Highest | Out-Null
Write-OK "Scheduled task '$taskName' registered (starts MySQL on boot)"

# ─── Step 10: Verification ──────────────────────────────────
Write-Step "Step 10: Verify Deployment"

Start-Sleep -Seconds 3

# Check backend API
try {
    $apiResp = Invoke-RestMethod -Uri "http://localhost:3001/api/settings" -TimeoutSec 10
    Write-OK "Backend API responding on :3001"
} catch {
    Write-Fail "Backend API not responding on :3001 — check service logs"
}

# Check Nginx frontend
if (Test-Path "$NginxRoot\nginx.exe") {
    try {
        $frontResp = Invoke-WebRequest -Uri "http://localhost" -TimeoutSec 10 -UseBasicParsing
        if ($frontResp.StatusCode -eq 200) {
            Write-OK "Frontend accessible at http://localhost"
        }
    } catch {
        Write-Warn "Frontend not responding at http://localhost — Nginx may need a moment"
    }
}

# Check Docker
$dockerContainers = docker ps --format "{{.Names}}" 2>&1
if ($dockerContainers -match "fit_mysql_db") {
    Write-OK "MySQL container 'fit_mysql_db' is running"
} else {
    Write-Fail "MySQL container not found"
}

# ─── Summary ────────────────────────────────────────────────
Write-Host "`n" -NoNewline
Write-Host "╔═══════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║      FIT Production Deployment Complete!              ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║  Frontend:  http://localhost                          ║" -ForegroundColor Green
Write-Host "║  API:       http://localhost:3001/api/settings        ║" -ForegroundColor Green
Write-Host "║  MySQL:     localhost:3308                            ║" -ForegroundColor Green
Write-Host "║                                                       ║" -ForegroundColor Green
Write-Host "║  Default Logins:                                      ║" -ForegroundColor Green
Write-Host "║    System Admin / Clasic@104                          ║" -ForegroundColor Green
Write-Host "║    Admin / AS@traders                                 ║" -ForegroundColor Green
Write-Host "║                                                       ║" -ForegroundColor Green
Write-Host "║  ⚠ CHANGE DEFAULT PASSWORDS ON FIRST LOGIN!          ║" -ForegroundColor Yellow
Write-Host "╚═══════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
