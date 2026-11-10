@echo off
setlocal
cd /d "%~dp0"
node build.mjs win
if errorlevel 1 (
  echo Packaging failed. Check the error above.
  pause
  exit /b 1
)
echo Output: %~dp0release
pause
