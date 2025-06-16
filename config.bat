@echo off
echo ==========================================================
echo [SGO] SCRIPT DE CONFIGURACAO DO AMBIENTE DE DESENVOLVIMENTO
echo ==========================================================
echo Este script ira configurar o ambiente e instalar todas as
echo dependencias necessarias para o backend e frontend.
echo.
echo Certifique-se de que Python (adicionado ao PATH) e Node.js
echo (com npm) estao instalados e acessiveis no seu sistema.
echo.
echo Pressione qualquer tecla para iniciar a configuracao...
pause
echo.

echo [PASSO 1 de 3] - Verificando pre-requisitos...
echo Verificando Python...
python --version
IF ERRORLEVEL 1 (
    echo.
    echo ERRO: Python nao parece estar instalado ou nao foi encontrado no PATH.
    echo Por favor, instale Python e adicione-o ao PATH.
    echo.
    pause
    exit /b 1
)
echo Python encontrado.
echo.
echo Verificando Node.js e NPM...
node --version
npm --version
IF ERRORLEVEL 1 (
    echo.
    echo ERRO: Node.js ou NPM nao parecem estar instalados ou nao foram encontrados no PATH.
    echo Por favor, instale Node.js (que inclui NPM).
    echo.
    pause
    exit /b 1
)
echo Node.js e NPM encontrados.
echo.
echo Pre-requisitos verificados. Pressione qualquer tecla para continuar...
pause
echo.


echo [PASSO 2 de 3] - Configurando o Backend (Python/Django)...
echo.
echo Acessando a pasta 'backend'...
cd backend
IF ERRORLEVEL 1 (
    echo ERRO: Nao foi possivel acessar a pasta 'backend'.
    echo Verifique se voce esta executando o script da raiz do projeto.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
echo Dentro da pasta 'backend'.
echo.

echo    ------------------------------------------------------
echo    [Backend Sub-passo 1/4] Criando ambiente virtual 'venv'...
echo    Comando: python -m venv venv
echo    ------------------------------------------------------
python -m venv venv
echo    Exit code da criacao do venv: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO    ERRO CRITICO: Falha ao criar ambiente virtual 'venv'.
    echo    Verifique sua instalacao do Python e se o modulo 'venv' esta disponivel.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO    Ambiente virtual 'venv' criado com sucesso.
ECHO.
echo    Pressione qualquer tecla para continuar...
pause
echo.

echo    ------------------------------------------------------
echo    [Backend Sub-passo 2/4] Ativando ambiente virtual...
echo    Comando: call venv\Scripts\activate.bat
echo    ------------------------------------------------------
call venv\Scripts\activate.bat
echo    Exit code da ativacao do venv: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO    ERRO CRITICO: Falha ao ativar o ambiente virtual 'venv'.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO    Ambiente virtual ativado.
echo    Python em uso (venv):
    where python
echo    Pip em uso (venv):
    where pip
ECHO.
echo    Pressione qualquer tecla para continuar...
pause
echo.

echo    -----------------------------------------------------------
echo    [Backend Sub-passo 3/4] Instalando dependencias Python...
echo    Comando: call venv\Scripts\pip.exe install -r requirements.txt
echo    -----------------------------------------------------------
call venv\Scripts\pip.exe install -r requirements.txt
echo    Exit code da instalacao de dependencias Python: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO    ERRO CRITICO: Falha ao instalar dependencias Python via pip.
    echo    Verifique o arquivo 'requirements.txt' e a saida do pip acima.
    echo    Certifique-se de que o ambiente virtual esta ativo e o pip esta funcionando.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO    Instalacao de dependencias Python concluida com sucesso.
ECHO.
echo    Pressione qualquer tecla para continuar...
pause
echo.

echo    -----------------------------------------------------------
echo    [Backend Sub-passo 4/4] Executando migracoes do banco de dados...
echo    Comando: call venv\Scripts\python.exe manage.py migrate
echo    -----------------------------------------------------------
call venv\Scripts\python.exe manage.py migrate
echo    Exit code da execucao de migracoes: %ERRORLEVEL%
IF %ERRORLEVEL% NEQ 0 (
    echo.
    ECHO    ERRO CRITICO: Falha ao executar migracoes do banco de dados Django.
    echo    Verifique a configuracao do banco de dados e as migracoes existentes.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO    Migracoes do banco de dados concluidas com sucesso.
ECHO.
echo [PASSO 2 de 3] Backend configurado com sucesso!
ECHO.
echo Pressione qualquer tecla para retornar a raiz do projeto e continuar...
pause
cd ..
echo Retornou a raiz do projeto.
echo.

echo [PASSO 3 de 3] - Configurando o Frontend (React/Vite)...
echo.
echo Acessando a pasta 'frontend'...
cd frontend
IF ERRORLEVEL 1 (
    echo ERRO: Nao foi possivel acessar a pasta 'frontend'.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
echo Dentro da pasta 'frontend'.
echo.

echo    -----------------------------------------------------------
echo    [Frontend Sub-passo 1/1] Instalando dependencias Node.js...
echo    Comando: call npm install
echo    -----------------------------------------------------------
call npm install
echo    Exit code da instalacao de dependencias Node.js: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    echo.
    echo    ERRO CRITICO: Falha ao instalar dependencias Node.js com 'npm install'.
    echo    Verifique o 'package.json', a saida do npm e se o Node.js/npm estao instalados corretamente.
    echo.
    pause
    exit /b %ERRORLEVEL%
)
ECHO    Instalacao de dependencias Node.js concluida com sucesso.
ECHO.
echo    Pressione qualquer tecla para concluir a configuracao do frontend...
pause
echo.

echo [PASSO 3 de 3] Frontend configurado com sucesso!
ECHO.
echo Pressione qualquer tecla para retornar a raiz do projeto...
pause
cd ..
echo Retornou a raiz do projeto.
echo.

echo ==========================================================
echo    CONFIGURACAO DO AMBIENTE CONCLUIDA COM SUCESSO!
echo ==========================================================
echo.
echo Proximo passo: Execute o script 'start.bat' para iniciar
echo os servidores de desenvolvimento do backend e frontend.
echo.
pause
exit /b 0
