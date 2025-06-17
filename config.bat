@echo off
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
IF NOT EXIST .venv (
    ECHO    - Criando ambiente virtual (.venv)...
    python -m venv .venv
    IF ERRORLEVEL 1 (
        ECHO [ERRO] Falha ao criar o ambiente virtual.
        GOTO:END
    )
)
ECHO    - Ativando o ambiente virtual e instalando dependencias...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
IF ERRORLEVEL 1 (
    ECHO [ERRO] Falha ao instalar as dependencias do backend (requirements.txt).
    ECHO Verifique se a biblioteca 'Pillow' pode ser instalada ou se ha outros erros.
    GOTO:END
)
ECHO    - Dependencias do backend instaladas.
ECHO.
ECHO    - Executando migracoes do banco de dados...
python manage.py migrate
IF ERRORLEVEL 1 (
    ECHO [ERRO] Falha ao executar as migracoes do Django.
    ECHO Verifique os modelos e as configuracoes do banco de dados.
    GOTO:END
)
ECHO [SUCESSO] Backend configurado.
ECHO.
cd ..
PAUSE


REM --- ETAPA 3: CONFIGURANDO FRONTEND ---
ECHO [ETAPA 3/4] Configurando o frontend React...
cd frontend
IF NOT EXIST node_modules (
    ECHO    - Instalando dependencias do frontend (npm install)...
    npm install
    IF ERRORLEVEL 1 (
        ECHO [ERRO] Falha ao instalar as dependencias do frontend (npm install).
        GOTO:END
    )
    ECHO [SUCESSO] Dependencias do frontend instaladas.
) ELSE (
    ECHO    - Pasta node_modules ja existe. Pulando 'npm install'.
)
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
