@echo off
REM FIT Full Application Launcher
echo Starting Database...
docker compose up -d

echo Starting Backend...
start /b cmd /c "cd server && npm run dev"

echo Starting Frontend...
start http://localhost:5173
npm run dev


