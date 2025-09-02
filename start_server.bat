@echo off
setlocal
REM Launch simple static server for the project root.
REM Priority: npx http-server -> python http.server -> PowerShell Start-Process (fallback) -> manual tip.

REM Detect project directory of this script
set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%"

echo Starting local server for GeometricJumper...
echo URL: http://localhost:8080/

REM Try Node http-server first
where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Using npx http-server on port 8080
  npx --yes http-server . -p 8080 -c-1 --cors
  goto :eof
)

REM Try Python 3 http.server
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  for /f "delims=" %%i in ('python -c "import sys;print(sys.version_info.major)"') do set PYMAJOR=%%i
  if "%PYMAJOR%"=="3" (
    echo Using Python 3 http.server on port 8080
    python -m http.server 8080
    goto :eof
  ) else (
    echo Python found but not v3; trying py launcher...
  )
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Using py -3 http.server on port 8080
  py -3 -m http.server 8080
  goto :eof
)

REM Fallback: try PowerShell to open index.html directly (no server)
where powershell >nul 2>nul
if %ERRORLEVEL%==0 (
  echo Could not find Node or Python. Opening index.html directly (no server).
  start "GeometricJumper" powershell -NoProfile -Command "Start-Process 'index.html'"
  goto :eof
)

echo ERROR: No suitable server found. Install Node.js or Python 3.
exit /b 1


