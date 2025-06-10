@echo off
echo ==========================================================
echo [SGO] SCRIPT DE CONFIGURACAO DO AMBIENTE
echo ==========================================================
echo Este script ira instalar todas as dependencias.
echo Certifique-se de que Python e Node.js estao instalados.
echo.
pause
echo.

echo [PASSO 1 de 2] - Configurando o Backend (Python/Django)...
cd backend
IF ERRORLEVEL 1 (
    echo Erro ao acessar a pasta backend.
    pause
    exit /b %ERRORLEVEL%
)

echo    - Criando ambiente virtual 'venv'...
python -m venv venv
IF ERRORLEVEL 1 (
    echo Erro ao criar ambiente virtual.
    pause
    exit /b %ERRORLEVEL%
)

echo    - Ativando ambiente e instalando dependencias (requirements.txt)...
call venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    echo Erro ao ativar ambiente virtual.
    pause
    exit /b %ERRORLEVEL%
)
pip install -r requirements.txt
IF ERRORLEVEL 1 (
    echo Erro ao instalar dependencias Python.
    pause
    exit /b %ERRORLEVEL%
)

echo    - Executando migracoes do banco de dados...
python manage.py migrate
IF ERRORLEVEL 1 (
    echo Erro ao executar migracoes do banco de dados.
    pause
    exit /b %ERRORLEVEL%
)

echo Backend configurado com sucesso!
cd ..
echo.

echo [PASSO 2 de 2] - Configurando o Frontend (React/Vite)...
cd frontend
IF ERRORLEVEL 1 (
    echo Erro ao acessar a pasta frontend.
    pause
    exit /b %ERRORLEVEL%
)

echo    - Instalando dependencias (npm install)...
call npm install
IF ERRORLEVEL 1 (
    echo Erro ao instalar dependencias Node.js.
    pause
    exit /b %ERRORLEVEL%
)

echo Frontend configurado com sucesso!
cd ..
echo.

echo ==========================================================
echo    CONFIGURACAO CONCLUIDA!
echo    Execute 'start.bat' para iniciar a aplicacao.
echo ==========================================================
pause
