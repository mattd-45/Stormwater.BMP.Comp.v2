@echo off
echo Starting local server for Stormwater BMP Comparison...
echo.
cd /d "%~dp0"

where npx >nul 2>&1
if %errorlevel% equ 0 (
  echo Using Node.js (npx serve)...
  echo Open in browser: http://localhost:3000
  echo Press Ctrl+C to stop the server.
  echo.
  npx serve . -l 3000
  goto :eof
)

where python >nul 2>&1
if %errorlevel% equ 0 (
  echo Using Python...
  echo Open in browser: http://localhost:3000
  echo Press Ctrl+C to stop the server.
  echo.
  python -m http.server 3000
  goto :eof
)

echo Neither Node.js nor Python was found in PATH.
echo.
echo Option 1: Install Node.js from https://nodejs.org then run this script again.
echo Option 2: Install Python from https://python.org then run this script again.
echo Option 3: In VS Code, install "Live Server" extension, right-click index.html, "Open with Live Server".
echo.
pause
