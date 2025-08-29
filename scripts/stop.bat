@echo off
ECHO =======================================================
ECHO PARANDO SERVIDORES DO PROJETO SGO...
ECHO =======================================================
ECHO.

ECHO [INFO] Parando servidor do Backend (Django) na porta 8000...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr ":8000"') DO (
    IF "%%P" NEQ "0" (
        ECHO [INFO] Matando processo com PID %%P na porta 8000...
        taskkill /PID %%P /F >nul 2>&1
    )
)

ECHO [INFO] Parando servidor do Frontend (Vite) na porta 5173...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr ":5173"') DO (
    IF "%%P" NEQ "0" (
        ECHO [INFO] Matando processo com PID %%P na porta 5173...
        taskkill /PID %%P /F >nul 2>&1
    )
)

ECHO.
ECHO [SUCESSO] Servidores foram parados.
ECHO.
ECHO Pressione qualquer tecla para fechar.
PAUSE >NUL