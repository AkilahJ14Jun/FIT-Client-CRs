# FIT Development Launcher
# Handles the project path (formerly "AS&Bros", now "AS_Bros").

$ProjectRoot = Get-Location
$BackendDir = Join-Path $ProjectRoot "server"

Write-Host "Checking Database..." -ForegroundColor Cyan
docker compose up -d

Write-Host "`nStarting Backend (Port 3001)..." -ForegroundColor Cyan
# Using Start-Process to keep them in the background but visible or logged
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; npx nodemon src/index.ts" -WindowStyle Normal

Write-Host "Starting Frontend (Vite)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; npx vite" -WindowStyle Normal

Write-Host "`nWaiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`nApplication should be running at:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API: http://localhost:3001/api/settings" -ForegroundColor Green

# Open browser
Start-Process "http://localhost:5173"
