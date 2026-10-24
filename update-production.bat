@echo off
REM =========================================================
REM  FIT - Build, Package & Update Production at E:\FIT
REM =========================================================
setlocal
cd /d "%~dp0"

echo.
echo =========================================================
echo   Updating FIT Production at E:\FIT
echo =========================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\CreateDeploymentSet.ps1" -DeployTo "E:\FIT"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Update failed! Check output above.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Production update complete at E:\FIT.
pause
