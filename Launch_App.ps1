# FIT Application Launcher
# Starts Database, Backend, and Frontend

$ProjectRoot = Get-Location
$BackendDir = Join-Path $ProjectRoot "server"

Write-Host "--- FIT Application Launcher ---" -ForegroundColor Cyan

# 1. Start Database
Write-Host "Checking Database (Docker)..." -ForegroundColor Yellow
docker compose up -d

# 2. Start Backend
Write-Host "Starting Backend API (Port 3001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendDir'; npm run dev" -WindowStyle Normal

# 3. Start Frontend
Write-Host "Starting Frontend (Vite on Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot'; npm run dev" -WindowStyle Normal

Write-Host "`nWaiting for services to initialize..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "`nApplication should be ready at:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
Write-Host "Backend API: http://localhost:3001/api/settings" -ForegroundColor Green

# Open browser
Start-Process "http://localhost:5173"
