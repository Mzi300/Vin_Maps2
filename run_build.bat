@echo off
rem Navigate to the project directory
cd /d "%~dp0"

rem Install exact dependencies
"C:\Program Files\nodejs\npm.cmd" ci
if errorlevel 1 (
  echo npm ci failed
  exit /b 1
)

rem Build the Vite app (creates ./dist)
"C:\Program Files\nodejs\npm.cmd" run build
if errorlevel 1 (
  echo npm run build failed
  exit /b 1
)

echo Build completed successfully
