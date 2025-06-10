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
echo Ambiente virtual 'venv' criado.
pause

echo    - Ativando ambiente virtual...
call venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    echo Erro ao ativar ambiente virtual.
    pause
    exit /b %ERRORLEVEL%
)
echo Ambiente virtual ativado.
echo VENV Python:
where python
echo VENV Pip:
where pip
pause

echo    - Instalando dependencias Python (requirements.txt)...
call venv\Scripts\pip.exe install -r requirements.txt
echo Exit code from pip install: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    echo Erro ao instalar dependencias Python.
    pause
    exit /b %ERRORLEVEL%
)
echo Dependencias Python instaladas.
pause

echo    - Executando migracoes do banco de dados...
call venv\Scripts\python.exe manage.py migrate
echo Exit code from migrate: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    echo Erro ao executar migracoes do banco de dados.
    pause
    exit /b %ERRORLEVEL%
)
echo Migracoes do banco de dados executadas.
pause

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
echo Dependencias do Frontend instaladas.
pause

echo    - Verificando instalacao do @tailwindcss/postcss...
IF NOT EXIST "node_modules\@tailwindcss\postcss\package.json" (
    echo ATENCAO: @tailwindcss/postcss nao foi encontrado em node_modules.
    echo Verifique o log do 'npm install' acima para erros.
    pause
) ELSE (
    echo @tailwindcss/postcss encontrado em node_modules.
)
pause

echo Frontend configurado com sucesso!
cd ..
echo.

echo ==========================================================
echo    CONFIGURACAO CONCLUIDA!
echo    Execute 'start.bat' para iniciar a aplicacao.
echo ==========================================================
pause
