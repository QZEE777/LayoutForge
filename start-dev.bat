@echo off
cd /d "%~dp0"
echo.
echo LayoutForge - Starting dev server...
echo When you see "Ready" and "Local: http://localhost:3000", open that URL in your browser.
echo Keep this window OPEN while using the app.
echo.
call npm run dev
pause
