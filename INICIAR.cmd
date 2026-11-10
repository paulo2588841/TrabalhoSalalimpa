@echo off
setlocal
cd /d "%~dp0"
where npm.cmd >nul 2>nul
if not errorlevel 1 (
  call npm.cmd run dev -- --open
) else (
  if not exist "%~dp0.tools\package\bin\npm-cli.js" (
    echo Instale Node.js 22.12 ou superior com npm. Depois rode npm install e npm run dev.
    pause
    exit /b 1
  )
  set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0.tools\package\bin\npm-cli.js" run dev -- --open
  ) else (
    echo Instale Node.js 22.12 ou superior com npm. Depois rode npm install e npm run dev.
  )
)
pause
