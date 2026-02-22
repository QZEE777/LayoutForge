@echo off
title LayoutForge - Quick Start
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ============================================
echo   LayoutForge - Quick Start
echo ============================================
echo.

REM Verify Node and npm are available
echo Checking Node.js installation...
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] Node.js is installed but not accessible.
  echo This can happen if you just installed it.
  echo.
  echo SOLUTION: Close this window, then:
  echo   1. Restart your PC, OR
  echo   2. Close and reopen Command Prompt/PowerShell completely
  echo   3. Then run this script again
  echo.
  pause
  exit /b 1
)

for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODEVER=%%i
for /f "tokens=*" %%i in ('npm -v 2^>nul') do set NPMVER=%%i

echo [OK] Node.js !NODEVER! and npm !NPMVER! are ready.
echo.

REM Install dependencies if needed
if not exist "node_modules" (
  echo Installing project dependencies... (this may take 1-2 minutes)
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    echo Try running these in a command prompt:
    echo   cd c:\Users\qqfs7\Desktop\layoutforge
    echo   npm install
    echo.
    pause
    exit /b 1
  )
  echo.
) else (
  echo Dependencies already installed, skipping npm install.
  echo.
)

echo Starting the app server...
echo A new window will open with the server. KEEP IT OPEN while you use the app.
echo.
start "LayoutForge Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo Waiting for server to start (15 seconds)...
timeout /t 15 /nobreak >nul

echo.
echo Opening your browser...
start http://localhost:3000

echo.
echo ============================================
echo Two windows should now be open:
echo   1. "LayoutForge Server" - KEEP THIS OPEN
echo   2. Your browser with the LayoutForge app
echo.
echo If the browser shows "can't connect":
echo   - Wait 10 more seconds and refresh (F5)
echo   - Or try: http://127.0.0.1:3000
echo ============================================
echo.
pause
