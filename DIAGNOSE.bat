@echo off
setlocal enabledelayedexpansion
title LayoutForge - Diagnostic Check
cd /d "%~dp0"

echo.
echo ============================================
echo   LayoutForge - Diagnostic Check
echo ============================================
echo.

REM Check Node
echo 1. Checking Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo   [FAIL] Node.js is NOT installed
  echo   Action: Install Node.js from https://nodejs.org
  echo.
) else (
  for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODEVER=%%i
  echo   [OK] Node.js is installed: !NODEVER!
  echo.
)

REM Check npm
echo 2. Checking npm...
where npm >nul 2>nul
if errorlevel 1 (
  echo   [FAIL] npm is NOT found
  echo   Action: Reinstall Node.js from https://nodejs.org
  echo.
) else (
  for /f "tokens=*" %%i in ('npm -v 2^>nul') do set NPMVER=%%i
  echo   [OK] npm is installed: !NPMVER!
  echo.
)

REM Check node_modules
echo 3. Checking dependencies...
if not exist "node_modules" (
  echo   [MISSING] node_modules folder not found
  echo   Action: Run npm install
  echo.
  echo   Running npm install now...
  call npm install
  if errorlevel 1 (
    echo.
    echo   [FAIL] npm install failed. See errors above.
    echo   Common fixes:
    echo   - Make sure Node.js is installed from https://nodejs.org
    echo   - Try deleting package-lock.json and running npm install again
    echo   - Check your internet connection
    pause
    exit /b 1
  ) else (
    echo   [OK] npm install completed successfully!
    echo.
  )
) else (
  echo   [OK] node_modules folder exists
  echo.
)

REM Try to start dev server and capture first line
echo 4. Testing if dev server can start...
echo   (This will try for 5 seconds then stop...)
echo.
timeout /t 2 >nul
start /b cmd /c "cd /d "%~dp0" && npm run dev >temp_dev_log.txt 2>&1 && timeout /t 5 >nul"
timeout /t 6 >nul

if exist temp_dev_log.txt (
  echo   === First 20 lines of dev server output ===
  for /f "tokens=*" %%A in ('findstr /n . temp_dev_log.txt ^| findstr /r "^[1-9]:" ^| findstr /r "^[1-9]:" ^| cut -c 1-100') do (
    echo   %%A
  )
  del temp_dev_log.txt
)

echo.
echo ============================================
echo   If everything shows [OK]:
echo   - Run START-HERE.bat
echo   - Wait 20 seconds
echo   - The browser might open, or you might still see "can't connect"
echo   - If "can't connect", look at the LayoutForge Server window and tell me
echo     what it says (take a screenshot if possible)
echo.
echo   If something shows [FAIL]:
echo   - Follow the "Action" listed above
echo   - Then try START-HERE.bat again
echo ============================================
echo.
pause
