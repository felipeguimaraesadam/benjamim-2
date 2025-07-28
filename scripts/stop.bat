@echo off
ECHO =======================================================
ECHO PARANDO SERVIDORES DO PROJETO SGO...
ECHO =======================================================
ECHO.

ECHO [INFO] Parando servidores Django e Vite...

REM Parar processos Python (Django)
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" /fo table /nh ^| findstr python') do (
    ECHO Parando processo Python: %%i
    taskkill /pid %%i /f >nul 2>&1
)

REM Parar processos Node (Vite)
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq node.exe" /fo table /nh ^| findstr node') do (
    ECHO Parando processo Node: %%i
    taskkill /pid %%i /f >nul 2>&1
)

ECHO.
ECHO [SUCESSO] Servidores foram parados.
ECHO.
ECHO Pressione qualquer tecla para fechar.
PAUSE >NUL