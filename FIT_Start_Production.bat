@echo off
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
pause
