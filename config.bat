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
echo Exit code from venv creation: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO ERRO: Falha ao criar ambiente virtual.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO Ambiente virtual criado.
ECHO.
PAUSE

echo    - Ativando ambiente virtual...
call venv\Scripts\activate.bat
echo Exit code from venv activation: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO ERRO: Falha ao ativar ambiente virtual.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO Ambiente virtual ativado.
echo VENV Python:
where python
echo VENV Pip:
where pip
ECHO.
PAUSE

echo    - Instalando dependencias Python (requirements.txt)...
call venv\Scripts\pip.exe install -r requirements.txt
echo Exit code from pip install: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO ERRO: Falha ao instalar dependencias Python. Verifique o requirements.txt e a saida do pip.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO Instalacao de dependencias Python concluida.
ECHO.
PAUSE

echo    - Executando migracoes do banco de dados...
call venv\Scripts\python.exe manage.py migrate
echo Exit code from migrate: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO ERRO: Falha ao executar migracoes do banco de dados.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO Migracoes do banco de dados concluidas.
ECHO.
PAUSE

echo Backend configurado com sucesso!
ECHO.
pause
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
echo Exit code from npm install: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    echo Erro ao instalar dependencias Node.js.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO Instalacao de dependencias Node.js concluida.
ECHO.
PAUSE

echo    - Verificando instalacao do @tailwindcss/postcss...
IF NOT EXIST "node_modules\@tailwindcss\postcss\package.json" (
    echo ATENCAO: @tailwindcss/postcss nao foi encontrado em node_modules.
    echo Verifique o log do 'npm install' acima para erros.
    ECHO.
    pause
) ELSE (
    echo @tailwindcss/postcss encontrado em node_modules.
    ECHO.
    PAUSE
)

echo Frontend configurado com sucesso!
ECHO.
pause
cd ..
echo.

echo ==========================================================
echo    CONFIGURACAO CONCLUIDA!
echo    Execute 'start.bat' para iniciar a aplicacao.
echo ==========================================================
pause
