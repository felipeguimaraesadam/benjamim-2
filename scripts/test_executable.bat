@echo off
setlocal enabledelayedexpansion

REM Test script for SGO_Gestao_Obras executable
echo [INFO] Testing SGO_Gestao_Obras executable...

REM Check if executable exists
if not exist "..\dist_pyinstaller\SGO_Gestao_Obras\SGO_Gestao_Obras.exe" (
    echo [ERROR] Executable not found. Please run build_executable.bat first.
    goto :eof
)

echo [INFO] Executable found. Starting application...
echo [INFO] The application will start on http://localhost:8000
echo [INFO] Press Ctrl+C to stop the application.

REM Navigate to executable directory and run
cd "..\dist_pyinstaller\SGO_Gestao_Obras"
.\SGO_Gestao_Obras.exe

:eof
endlocal