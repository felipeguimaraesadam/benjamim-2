@echo off
setlocal enabledelayedexpansion

echo [INFO] Starting build process...

REM 1. Navigate to the frontend directory
echo [INFO] Navigating to frontend directory...
cd frontend
if errorlevel 1 (
    echo [ERROR] Failed to navigate to frontend directory.
    goto :eof
)

REM 2. Run npm run build
echo [INFO] Building React frontend (npm run build)...
call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed.
    goto :eof
)
echo [INFO] Frontend build complete.

REM Navigate back to root before defining paths relative to root
cd ..

REM 3. Define paths
set "FRONTEND_BUILD_DIR=frontend\dist"
set "DJANGO_STATIC_DIR_NAME=static_react_build"
set "DJANGO_STATIC_DIR_ROOT=backend\%DJANGO_STATIC_DIR_NAME%"
set "PYINSTALLER_DIST_DIR=dist_pyinstaller"
set "EXECUTABLE_NAME=SGO_Gestao_Obras.exe"

echo [INFO] FRONTEND_BUILD_DIR: %FRONTEND_BUILD_DIR%
echo [INFO] DJANGO_STATIC_DIR_ROOT: %DJANGO_STATIC_DIR_ROOT%

REM 4. Prepare Django static directory
echo [INFO] Preparing Django static directory: %DJANGO_STATIC_DIR_ROOT%
if exist "%DJANGO_STATIC_DIR_ROOT%" (
    echo [INFO] Removing existing %DJANGO_STATIC_DIR_ROOT%...
    rd /s /q "%DJANGO_STATIC_DIR_ROOT%"
    if errorlevel 1 (
        echo [ERROR] Failed to remove %DJANGO_STATIC_DIR_ROOT%. Check permissions or if files are in use.
        goto :eof
    )
)
echo [INFO] Creating empty %DJANGO_STATIC_DIR_ROOT%...
mkdir "%DJANGO_STATIC_DIR_ROOT%"
if errorlevel 1 (
    echo [ERROR] Failed to create %DJANGO_STATIC_DIR_ROOT%.
    goto :eof
)

REM 5. Copy frontend build output to Django static directory
echo [INFO] Copying frontend build output from %FRONTEND_BUILD_DIR% to %DJANGO_STATIC_DIR_ROOT%...
xcopy "%FRONTEND_BUILD_DIR%" "%DJANGO_STATIC_DIR_ROOT%" /s /e /i /y
if errorlevel 1 (
    echo [ERROR] Failed to copy frontend build to Django static directory.
    goto :eof
)
echo [INFO] Frontend assets copied successfully.

REM 6. Navigate to the backend directory
echo [INFO] Navigating to backend directory...
cd backend
if errorlevel 1 (
    echo [ERROR] Failed to navigate to backend directory.
    goto :eof
)

REM 7. Check and setup virtual environment
echo [INFO] Checking virtual environment...
if not exist ".venv" (
    echo [INFO] Virtual environment not found. Creating virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Check if Python is installed.
        cd ..
        goto :eof
    )
    echo [INFO] Virtual environment created successfully.
    echo [INFO] Installing dependencies...
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies.
        cd ..
        goto :eof
    )
) else (
    echo [INFO] Virtual environment found.
)

REM 8. Activate virtual environment and run PyInstaller
echo [INFO] Activating virtual environment and running PyInstaller...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment.
    goto :eof
)

REM Ensure db.sqlite3 is in the backend directory or adjust path if needed.
REM PyInstaller by default includes files in the same directory as the main script (manage.py)
REM The --add-data path is relative to the current directory (backend)
REM The part after the semicolon is the runtime path relative to the app's root.
set "DJANGO_STATIC_DATA_ARG=--add-data=%DJANGO_STATIC_DIR_NAME%;%DJANGO_STATIC_DIR_NAME%"

REM Add other Django apps/project directories as needed if they are not automatically picked up.
REM Common ones are the main project directory (sgo_core) and any app directories (core).
REM PyInstaller typically auto-detects these if they are imported in manage.py or settings.py.
REM We might need to add --collect-all or --add-data for template directories if not served by React.

REM Hidden imports might be needed based on your specific Django setup and dependencies.
REM Example: --hidden-import=django.contrib.admin.apps.AdminConfig
set "HIDDEN_IMPORTS=--hidden-import=django.contrib.staticfiles.apps.StaticFilesConfig --hidden-import=django.contrib.admin.apps.AdminConfig --hidden-import=rest_framework --hidden-import=corsheaders --hidden-import=core.apps.CoreConfig --hidden-import=sgo_core.settings"

REM --onedir is generally more reliable for Django projects.
REM --noconfirm will overwrite output directory without asking.
python -m PyInstaller "..\scripts\SGO_Gestao_Obras.spec" --noconfirm --distpath "..\%PYINSTALLER_DIST_DIR%"

if errorlevel 1 (
    echo [ERROR] PyInstaller failed. Check the output above for details.
    cd ..
    goto :eof
)

echo [INFO] PyInstaller finished successfully.
echo [INFO] Executable and associated files are in: %cd%\..\%PYINSTALLER_DIST_DIR%\%EXECUTABLE_NAME%

REM Copy .env file to the distribution directory
echo [INFO] Copying .env file to distribution directory...
copy /Y ".env" "..\%PYINSTALLER_DIST_DIR%\SGO_Gestao_Obras\"
if errorlevel 1 (
    echo [ERROR] Failed to copy .env file.
    cd ..
    goto :eof
)

REM Navigate back to root
cd ..

echo [INFO] Build process completed.
echo [INFO] To run the application, navigate to %PYINSTALLER_DIST_DIR%\%EXECUTABLE_NAME% and run %EXECUTABLE_NAME%.

:eof
endlocal