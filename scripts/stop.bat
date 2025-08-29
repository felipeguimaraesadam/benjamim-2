@echo off
ECHO =======================================================
ECHO PARANDO SERVIDORES DO PROJETO SGO...
ECHO =======================================================
ECHO.

ECHO [INFO] Parando servidores Django e Vite...

REM Parar o servidor do Backend (Django) se estiver em execucao
ECHO [INFO] Tentando parar o servidor do Backend (se em execucao)...
taskkill /fi "windowtitle eq SGO Backend*" /f >nul 2>&1

REM Parar o servidor do Frontend (Vite) se estiver em execucao
ECHO [INFO] Tentando parar o servidor do Frontend (se em execucao)...
taskkill /fi "windowtitle eq SGO Frontend*" /f >nul 2>&1

ECHO.
ECHO [SUCESSO] Servidores foram parados.
ECHO.
ECHO Pressione qualquer tecla para fechar.
PAUSE >NUL