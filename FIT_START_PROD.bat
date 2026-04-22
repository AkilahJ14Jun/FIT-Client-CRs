@echo off
REM FIT Production Start Script (Root)
REM Runs the application from the consolidated build in e:\FIT

echo Starting FIT Application (Consolidated Root Build)...

REM 1. Ensure the PM2 process is running from the root dist
echo Checking backend service (PM2)...
pm2 describe fit-backend >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting new PM2 process for backend...
    pm2 start server/dist/index.js --name fit-backend
) else (
    echo Backend service found. Restarting to ensure root build is active...
    pm2 restart fit-backend
)

REM 2. Wait for server
timeout /t 3 /nobreak >nul

REM 3. Open browser
echo Opening FIT at http://localhost:3001...
start http://localhost:3001

echo.
echo ===================================================
echo   FIT is now running from the root consolidated build.
echo ===================================================
pause
