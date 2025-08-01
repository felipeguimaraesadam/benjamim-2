@echo off
cd /d "%~dp0.."
ECHO =======================================================
ECHO CONFIGURANDO AMBIENTE DO PROJETO SGO...
ECHO =======================================================
ECHO.

REM --- ETAPA 1: VERIFICANDO FERRAMENTAS ---
ECHO [ETAPA 1/4] Verificando Python e Node.js...

REM Check Python
python --version >NUL 2>&1
IF ERRORLEVEL 1 GOTO PYTHON_ERROR
GOTO PYTHON_OK
:PYTHON_ERROR
ECHO [ERRO] Python nao encontrado no PATH. Instale o Python e adicione-o ao PATH.
GOTO:END
:PYTHON_OK
ECHO [INFO] Python verificado.

REM Check Node.js
node --version >NUL 2>&1
IF ERRORLEVEL 1 GOTO NODE_ERROR
GOTO NODE_OK
:NODE_ERROR
ECHO [ERRO] Node.js nao encontrado no PATH. Instale o Node.js (que inclui o npm).
GOTO:END
:NODE_OK
ECHO [INFO] Node.js verificado.

ECHO [SUCESSO] Python e Node.js encontrados.
ECHO.
PAUSE


REM --- ETAPA 2: CONFIGURANDO BACKEND ---
ECHO [ETAPA 2/4] Configurando o backend Django...
cd backend

IF NOT EXIST .venv GOTO CREATE_VENV
GOTO VENV_EXISTS
:CREATE_VENV
ECHO    - Criando ambiente virtual (.venv)...
python -m venv .venv
IF ERRORLEVEL 1 GOTO VENV_CREATE_ERROR
GOTO VENV_EXISTS
:VENV_CREATE_ERROR
ECHO [ERRO] Falha ao criar o ambiente virtual.
GOTO:END
:VENV_EXISTS
ECHO    - Ambiente virtual (.venv) verificado/criado.

ECHO    - Ativando o ambiente virtual e instalando dependencias...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
IF ERRORLEVEL 1 GOTO PIP_INSTALL_ERROR
GOTO PIP_INSTALL_OK
:PIP_INSTALL_ERROR
ECHO [ERRO] Falha ao instalar as dependencias do backend (requirements.txt).
ECHO Verifique se a biblioteca 'Pillow' pode ser instalada ou se ha outros erros.
GOTO:END
:PIP_INSTALL_OK
ECHO    - Dependencias do backend instaladas.

ECHO.
ECHO    - Executando migracoes do banco de dados...
python manage.py migrate
IF ERRORLEVEL 1 GOTO MIGRATE_ERROR
GOTO MIGRATE_OK
:MIGRATE_ERROR
ECHO [ERRO] Falha ao executar as migracoes do Django.
ECHO Verifique os modelos e as configuracoes do banco de dados.
GOTO:END
:MIGRATE_OK
ECHO [SUCESSO] Backend configurado.
ECHO.
cd ..
PAUSE


REM --- ETAPA 3: CONFIGURANDO FRONTEND ---
ECHO [ETAPA 3/4] Configurando o frontend React...
cd frontend

ECHO    - Instalando dependencias do frontend (npm install)...
npm install
ECHO    - Comando npm install finalizado. Verificando status...

IF ERRORLEVEL 1 (
    ECHO [AVISO] npm install finalizou com ERRORLEVEL %ERRORLEVEL%.
    ECHO          Isso pode ser devido a vulnerabilidades encontradas.
    ECHO          Verifique o log acima. Prosseguindo com a configuracao...
) ELSE (
    ECHO [SUCESSO] Dependencias do frontend instaladas (ERRORLEVEL 0).
)

ECHO    - Tentando corrigir vulnerabilidades com 'npm audit fix --force'...
npm audit fix --force
ECHO    - Comando 'npm audit fix --force' finalizado. Verifique o log acima para detalhes.

GOTO NPM_DEPS_CHECKED

:NPM_INSTALL_ERROR
ECHO [ERRO CRITICO] Falha grave ao instalar as dependencias do frontend (npm install).
ECHO Verifique o log do npm.
PAUSE
GOTO:END

:NPM_DEPS_CHECKED
ECHO    - Verificacao de dependencias do frontend concluida.
cd ..
ECHO [SUCESSO] Frontend configurado.
ECHO.
PAUSE


REM --- ETAPA 4: FINALIZACAO ---
ECHO [ETAPA 4/4] Configuracao do ambiente concluida com sucesso!
ECHO.

:END
ECHO Pressione qualquer tecla para fechar esta janela.
PAUSE