@echo off
title Check Node.js
echo.
echo ============================================
echo   Checking if Node.js is installed...
echo ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo   Node.js is NOT installed.
  echo.
  echo   Install it from: https://nodejs.org
  echo   Download the LTS version, run the installer,
  echo   then try START-HERE.bat again.
  echo ============================================
  pause
  exit /b 0
)

for /f "tokens=*" %%i in ('node -v 2^>nul') do set NODEVER=%%i
echo   Node.js is installed: %NODEVER%
echo.
echo   You can run START-HERE.bat to open the app.
echo   If the app still says "can't connect", the problem
echo   is something else - tell the person helping you
echo   what you see in the "LayoutForge Server" window.
echo ============================================
echo.
pause
