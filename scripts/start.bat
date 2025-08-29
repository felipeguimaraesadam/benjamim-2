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

cd /d "%~dp0.."
ECHO =======================================================
ECHO INICIANDO SERVIDORES DO PROJETO SGO...
ECHO =======================================================
ECHO.

ECHO [INFO] Verificando ambiente virtual do Backend...
cd backend
IF NOT EXIST ".venv" (
    ECHO [INFO] Ambiente virtual nao encontrado. Criando ambiente virtual...
    python -m venv .venv
    IF ERRORLEVEL 1 (
        ECHO [ERRO] Falha ao criar ambiente virtual. Verifique se o Python esta instalado.
        cd ..
        GOTO:END
    )
    ECHO [INFO] Ambiente virtual criado com sucesso.
    ECHO [INFO] Instalando dependencias...
    call .venv\Scripts\activate.bat
    pip install -r requirements.txt
    IF ERRORLEVEL 1 (
        ECHO [ERRO] Falha ao instalar dependencias.
        cd ..
        GOTO:END
    )
) ELSE (
    ECHO [INFO] Ambiente virtual encontrado.
)

ECHO [INFO] Iniciando servidor do Backend (Django)...
ECHO        Aguarde, uma nova janela sera aberta e minimizada.
cd ..

start "SGO Backend - Django (Ctrl+C para parar)" cmd /c "cd backend && .venv\Scripts\activate.bat && python manage.py runserver && pause"
IF ERRORLEVEL 1 (
    ECHO [ERRO] Nao foi possivel iniciar o servidor do backend.
    GOTO:END
)

ECHO.
ECHO [INFO] Verificando dependencias do Frontend...
cd frontend
IF NOT EXIST "node_modules" (
    ECHO [INFO] Dependencias do frontend nao encontradas. Instalando...
    npm install
    IF ERRORLEVEL 1 (
        ECHO [ERRO] Falha ao instalar dependencias do frontend. Verifique se o Node.js/npm esta instalado.
        cd ..
        GOTO:END
    )
    ECHO [INFO] Dependencias do frontend instaladas com sucesso.
)
cd ..

ECHO [INFO] Iniciando servidor do Frontend (Vite/React)...
ECHO        Aguarde, uma nova janela sera aberta e o navegador devera iniciar automaticamente.

start "SGO Frontend - Vite (Ctrl+C para parar)" cmd /c "cd frontend && npm run dev && pause"
IF ERRORLEVEL 1 (
    ECHO [ERRO] Nao foi possivel iniciar o servidor do frontend.
    GOTO:END
)

ECHO [INFO] Aguardando alguns segundos para o servidor frontend iniciar antes de abrir o navegador...
timeout /t 5 /nobreak > NUL
ECHO [INFO] Abrindo o frontend (http://localhost:5173) no navegador...
start http://localhost:5173

ECHO.
ECHO [SUCESSO] Servidores estao sendo iniciados em janelas separadas.
ECHO          - Backend: http://localhost:8000
ECHO          - Frontend: http://localhost:5173
ECHO.

:END
ECHO Pressione qualquer tecla para fechar esta janela principal.
PAUSE >NUL