REM Change drive
e:

REM Change to front-end location
cd e:\FIT

@echo off
start http://localhost:3001

REM Start front-end
npm run dev

