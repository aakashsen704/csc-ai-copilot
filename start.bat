@echo off
echo.
echo ======================================
echo   CSC AI Co-Pilot - Quick Start
echo ======================================
echo.

:: Check .env exists
IF NOT EXIST .env (
  copy .env.example .env >nul
  echo ACTION REQUIRED: Open .env and set your ANTHROPIC_API_KEY
  echo Get your key at: https://console.anthropic.com
  echo.
  notepad .env
  pause
)

:: Setup backend
cd backend
IF NOT EXIST .env (
  copy .env.example .env >nul
)

echo Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
  echo ERROR: Backend install failed. Check Node.js is installed.
  pause
  exit /b 1
)
echo Backend ready!
cd ..

:: Setup frontend
echo.
echo Installing frontend dependencies...
cd frontend
call npm install
if %errorlevel% neq 0 (
  echo ERROR: Frontend install failed.
  pause
  exit /b 1
)
echo Frontend ready!
cd ..

echo.
echo ======================================
echo   Launching servers...
echo ======================================
echo.
echo   Backend API  -^> http://localhost:5000
echo   Frontend App -^> http://localhost:3000
echo.

:: Start backend in a new terminal window
start "CSC-Backend" cmd /k "cd /d %~dp0backend && node server.js"

:: Wait for backend to boot
timeout /t 4 /nobreak >nul

:: Start frontend in another new terminal window  
start "CSC-Frontend" cmd /k "cd /d %~dp0frontend && set BROWSER=none && npm start"

echo Servers are starting in two new windows.
echo.
echo Open your browser at: http://localhost:3000
echo.
pause
