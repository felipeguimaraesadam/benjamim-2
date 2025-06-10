REM @ECHO OFF
TITLE SGO Project Configuration - DEBUG MODE
CLS
ECHO =====================================
ECHO  SGO Project Configuration Script (DEBUG MODE)
ECHO =====================================

PAUSE

ECHO Verificando dependencias necessarias...

PAUSE

ECHO --- Checking Python ---
python --version
ECHO Python version command executed. ERRORLEVEL: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    ECHO ERRO: Python nao encontrado.
    ECHO Por favor, instale Python (versao 3.x recomendada) e adicione ao PATH.
    GOTO EndScript
)
ECHO Python encontrado.

PAUSE

ECHO --- Checking Node.js ---
node --version
ECHO Node.js version command executed. ERRORLEVEL: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    ECHO ERRO: Node.js nao encontrado.
    ECHO Por favor, instale Node.js (que inclui npm) e adicione ao PATH.
    GOTO EndScript
)
ECHO Node.js encontrado.

PAUSE

ECHO --- Checking npm ---
npm --version
ECHO npm version command executed. ERRORLEVEL: %ERRORLEVEL%
IF ERRORLEVEL 1 (
    ECHO ERRO: npm nao encontrado.
    ECHO Por favor, verifique sua instalacao do Node.js.
    GOTO EndScript
)
ECHO npm encontrado.

ECHO Todas as dependencias basicas foram encontradas.
ECHO =====================================

PAUSE

ECHO --- Configuring Backend ---
ECHO Current directory: %CD%
CD backend
ECHO Changed to directory: %CD%
IF NOT "%CD%"=="%~dp0backend\" (
   ECHO ERRO: Nao foi possivel mudar para o diretorio backend.
   GOTO EndScript
)

PAUSE

ECHO --- Checking/Creating Python venv ---
IF NOT EXIST .venv (
    ECHO Criando ambiente virtual Python em backend\.venv...
    python -m venv .venv
    ECHO python -m venv .venv - ERRORLEVEL: %ERRORLEVEL%
    IF ERRORLEVEL 1 ( ECHO ERRO ao criar ambiente virtual. & CD .. & GOTO EndScript )
) ELSE (
    ECHO Ambiente virtual backend\.venv ja existe.
)

PAUSE

ECHO --- Activating venv and installing Python dependencies ---
CALL .venv\Scripts\activate.bat
ECHO CALL .venv\Scripts\activate.bat - ERRORLEVEL: %ERRORLEVEL% (Note: activate.bat itself doesn't set ERRORLEVEL typically)
pip install -r requirements.txt
ECHO pip install -r requirements.txt - ERRORLEVEL: %ERRORLEVEL%
IF ERRORLEVEL 1 ( ECHO ERRO ao instalar dependencias Python. & CD .. & GOTO EndScript )

PAUSE

ECHO --- Running Django migrations ---
python manage.py migrate
ECHO python manage.py migrate - ERRORLEVEL: %ERRORLEVEL%
IF ERRORLEVEL 1 ( ECHO ERRO ao executar migracoes. & CD .. & GOTO EndScript )
ECHO Ambiente do Backend configurado com sucesso.
CD ..
ECHO Changed to directory: %CD%
ECHO =====================================

PAUSE

ECHO --- Configuring Frontend ---
ECHO Current directory: %CD%
CD frontend
ECHO Changed to directory: %CD%
IF NOT "%CD%"=="%~dp0frontend\" (
   ECHO ERRO: Nao foi possivel mudar para o diretorio frontend.
   GOTO EndScript
)

PAUSE

ECHO --- Installing Node.js dependencies ---
IF NOT EXIST node_modules (
    ECHO Instalando dependencias Node.js (npm install)... Isto pode levar alguns minutos.
    npm install
    ECHO npm install - ERRORLEVEL: %ERRORLEVEL%
    IF ERRORLEVEL 1 ( ECHO ERRO ao instalar dependencias Node.js. & CD .. & GOTO EndScript )
) ELSE (
    ECHO Diretorio node_modules ja existe. Pulando npm install.
)
ECHO Ambiente do Frontend configurado com sucesso.
CD ..
ECHO Changed to directory: %CD%
ECHO =====================================

PAUSE

ECHO Configuracao do projeto SGO concluida com sucesso!
ECHO Voce pode agora usar o script start.bat para iniciar a aplicacao.

:EndScript
ECHO Script config.bat finalizado. Pressione qualquer tecla para sair...
PAUSE > nul
