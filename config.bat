@echo off
pause
echo ==========================================================
echo [SGO] SCRIPT DE CONFIGURACAO DO AMBIENTE DE DESENVOLVIMENTO
echo ==========================================================
echo Este script ira configurar o ambiente e instalar todas as
echo dependencias necessarias para o backend e frontend.
echo.

echo Iniciando verificacao do Python...
python --version > python_version_log.txt 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Python nao parece estar instalado ou nao foi encontrado no PATH.
    echo Verifique o arquivo python_version_log.txt para mais detalhes.
    echo Por favor, instale Python e adicione-o ao PATH.
    echo.
    pause
) ELSE (
    echo Python encontrado. Detalhes em python_version_log.txt
)
echo Verificacao do Python concluida.
echo.

echo Iniciando verificacao do Node.js...
node --version > node_version_log.txt 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: Node.js nao parece estar instalado ou nao foi encontrado no PATH.
    echo Verifique o arquivo node_version_log.txt para mais detalhes.
    echo Por favor, instale Node.js (que inclui NPM).
    echo.
    pause
) ELSE (
    echo Node.js encontrado. Detalhes em node_version_log.txt
)
echo Verificacao do Node.js concluida.
echo.

echo Iniciando verificacao do NPM...
npm --version > npm_version_log.txt 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERRO: NPM nao parece estar instalado ou nao foi encontrado no PATH.
    echo Verifique o arquivo npm_version_log.txt para mais detalhes.
    echo Por favor, instale Node.js (que inclui NPM) e verifique se o NPM esta funcionando.
    echo.
    pause
) ELSE (
    echo NPM encontrado. Detalhes em npm_version_log.txt
)
echo Verificacao do NPM concluida.
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
    echo Running npm install in frontend. This may take a while...
    call npm install > npm_install_log.txt 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        echo.
        echo ERRO CRITICO: Falha ao instalar dependencias Node.js com 'npm install'.
        echo Verifique o 'package.json', a saida do npm em npm_install_log.txt e se o Node.js/npm estao instalados corretamente.
        echo.
        pause
        exit /b %ERRORLEVEL%
    )
    echo npm install completed successfully. Log: npm_install_log.txt
) ELSE (
    echo Pasta node_modules ja existe, pulando npm install. Log de instalacao anterior (se houver): npm_install_log.txt
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
