@echo off
ECHO =======================================================
ECHO INICIANDO SERVIDORES DO PROJETO SGO...
ECHO =======================================================
ECHO.

ECHO [INFO] Iniciando servidor do Backend (Django)...
ECHO        Aguarde, uma nova janela sera aberta e minimizada.

start "SGO Backend" /min cmd /c "cd backend && .venv\Scripts\activate.bat && python manage.py runserver && pause"
IF ERRORLEVEL 1 (
    ECHO [ERRO] Nao foi possivel iniciar o servidor do backend.
    ECHO Verifique se o ambiente virtual '.venv' existe em 'backend/' e se as dependencias estao instaladas.
    GOTO:END
)

ECHO.
ECHO [INFO] Iniciando servidor do Frontend (Vite/React)...
ECHO        Aguarde, uma nova janela sera aberta e o navegador devera iniciar automaticamente.

start "SGO Frontend" /min cmd /c "cd frontend && npm run dev && pause"
IF ERRORLEVEL 1 (
    ECHO [ERRO] Nao foi possivel iniciar o servidor do frontend.
    ECHO Verifique se a pasta 'node_modules' existe em 'frontend/'.
    GOTO:END
)

ECHO.
ECHO [SUCESSO] Servidores estao sendo iniciados em janelas separadas.
ECHO          - Backend: http://localhost:8000
ECHO          - Frontend: http://localhost:5173
ECHO.

:END
ECHO Pressione qualquer tecla para fechar esta janela principal.
PAUSE >NUL
