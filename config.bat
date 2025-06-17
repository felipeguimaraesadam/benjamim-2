@echo off
pause
echo ==========================================================
echo [SGO] SCRIPT DE CONFIGURACAO DO AMBIENTE DE DESENVOLVIMENTO
echo ==========================================================
echo Este script ira configurar o ambiente e instalar todas as
echo dependencias necessarias para o backend e frontend.
echo.

echo Verificando Python...
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Python nao encontrado. Por favor, instale Python e adicione ao PATH.
    echo.
    pause
)
echo Python encontrado.
echo.

echo Verificando Node.js...
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Node.js nao encontrado. Por favor, instale Node.js e adicione ao PATH.
    echo.
    pause
)
echo Node.js encontrado.
echo.

echo Verificando NPM...
npm --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: NPM nao encontrado. Por favor, instale NPM (geralmente vem com Node.js).
    echo.
    pause
)
echo NPM encontrado.
echo.

echo [PASSO 1 de 2] Configurando o Backend (Python/Django)...
echo Navegando para a pasta backend...
cd backend
IF %ERRORLEVEL% NEQ 0 (
    echo ERRO: Nao foi possivel acessar a pasta 'backend'. Verifique se o script esta na raiz do projeto.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Criando ambiente virtual .venv se nao existir...
IF NOT EXIST .venv (
    echo Criando .venv...
    python -m venv .venv
    IF %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao criar ambiente virtual .venv.
        pause
        exit /b %ERRORLEVEL%
    )
    echo Ambiente virtual .venv criado.
) ELSE (
    echo Ambiente virtual .venv ja existe.
)
echo.
echo Ativando ambiente virtual...
call .venv\Scripts\activate.bat
IF %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao ativar o ambiente virtual.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Instalando dependencias Python...
pip install -r requirements.txt
IF %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao instalar dependencias Python. Verifique requirements.txt e a saida do pip.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Executando migracoes do Django...
python manage.py migrate
IF %ERRORLEVEL% NEQ 0 (
    echo ERRO: Falha ao executar migracoes do Django.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Backend configurado com sucesso.
cd ..
echo Retornou a raiz do projeto.
echo.

echo [PASSO 2 de 2] Configurando o Frontend (React/Vite)...
echo Navegando para a pasta frontend...
cd frontend
IF %ERRORLEVEL% NEQ 0 (
    echo ERRO: Nao foi possivel acessar a pasta 'frontend'.
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo Instalando dependencias Node.js se node_modules nao existir...
IF NOT EXIST node_modules (
    echo Instalando dependencias npm...
    npm install
    IF %ERRORLEVEL% NEQ 0 (
        echo ERRO: Falha ao instalar dependencias Node.js. Verifique package.json e a saida do npm.
        pause
        exit /b %ERRORLEVEL%
    )
    echo Dependencias npm instaladas.
) ELSE (
    echo Pasta node_modules ja existe, pulando npm install.
)
echo.
echo Frontend configurado com sucesso.
cd ..
echo Retornou a raiz do projeto.
echo.

echo.
echo ==========================================================
echo CONFIGURACAO DO AMBIENTE CONCLUIDA COM SUCESSO!
echo ==========================================================
echo.
echo Proximo passo: Execute o script 'start.bat' para iniciar os servidores.
pause
exit /b 0
