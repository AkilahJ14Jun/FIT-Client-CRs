@echo off
REM FIT Production Mode Launcher
REM Starts database and backend server from compiled artifacts.

echo Starting FIT Database (MySQL)...
e:
cd E:\FIT
docker compose up -d

echo.
echo Starting FIT Backend API...
cd server
if not exist "node_modules\express\" (
    echo Backend dependencies missing or incomplete. Installing...
    if exist "node_modules\" rmdir /s /q "node_modules"
    npm install --omit=dev
)
start /b node dist/index.js

echo.
echo Waiting for application to initialize...
timeout /t 5 /nobreak > nul

echo Opening FIT Application...
start http://localhost:3001

echo.
echo ==========================================
echo  FIT Application is running in PRODUCTION
echo  (No source code required)
echo ==========================================
echo.
pause
