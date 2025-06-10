@ECHO OFF
TITLE SGO Application Starter - DEBUG MODE
CLS
ECHO =====================================
ECHO  SGO Application Starter (DEBUG MODE)
ECHO =====================================

ECHO Este script ira iniciar os servidores de Backend (Django) e Frontend (React).
ECHO Certifique-se de que voce ja executou o config.bat para configurar o ambiente.

ECHO Pressione qualquer tecla para iniciar os servidores...
PAUSE

ECHO --- Iniciando servidor Backend (Django)... ---
ECHO Current directory: %CD%
CD backend
ECHO Changed to directory: %CD%
IF NOT "%CD%"=="%~dp0backend\" (
   ECHO ERRO: Nao foi possivel mudar para o diretorio backend.
   GOTO EndScript
)

ECHO Ativando ambiente virtual do backend...
CALL .venv\Scripts\activate.bat
ECHO CALL .venv\Scripts\activate.bat - ERRORLEVEL: %ERRORLEVEL%

ECHO Iniciando Django server (python manage.py runserver)...
START "SGO Backend - Django" /MIN python manage.py runserver --noreload
ECHO START "SGO Backend - Django" /MIN python manage.py runserver --noreload - ERRORLEVEL: %ERRORLEVEL% (Note: START command itself usually returns 0 if syntax is OK)
ECHO Servidor Django iniciado (ou tentando iniciar em uma nova janela minimizada).
ECHO URL Tipica: http://localhost:8000
CD ..
ECHO Changed to directory: %CD%

ECHO =====================================

PAUSE

ECHO --- Iniciando servidor Frontend (React/Vite)... ---
ECHO Current directory: %CD%
CD frontend
ECHO Changed to directory: %CD%
IF NOT "%CD%"=="%~dp0frontend\" (
   ECHO ERRO: Nao foi possivel mudar para o diretorio frontend.
   GOTO EndScript
)

ECHO Verificando frontend/package.json (procurando script 'dev')...
type package.json | findstr /C:"\"dev\":"

ECHO Tentando iniciar Vite com 'npm run dev'...
REM START "SGO Frontend - Vite" /MIN npm run dev
START "SGO Frontend - Vite" /MIN npm run dev
ECHO START "SGO Frontend - Vite" /MIN npm run dev - ERRORLEVEL: %ERRORLEVEL%
ECHO Se o comando acima falhar com "'vite' nao e reconhecido", tente o seguinte no lugar:
ECHO START "SGO Frontend - Vite NPX" /MIN npx vite dev

ECHO Servidor React/Vite iniciado (ou tentando iniciar em uma nova janela minimizada).
ECHO Vite geralmente abre o navegador automaticamente na URL correta (ex: http://localhost:5173).
CD ..
ECHO Changed to directory: %CD%

ECHO =====================================

PAUSE

ECHO Ambos os servidores foram iniciados (ou estao em processo de inicializacao).
ECHO Pode levar alguns momentos para que estejam totalmente prontos.
ECHO Backend (Django) geralmente em: http://localhost:8000
ECHO Frontend (Vite) geralmente em: http://localhost:5173 (e deve abrir no navegador)

ECHO Se o navegador nao abrir automaticamente para o frontend, abra manualmente: http://localhost:5173

:EndScript
ECHO Script start.bat finalizado. Pressione qualquer tecla para fechar esta janela de inicializacao...
PAUSE > nul
