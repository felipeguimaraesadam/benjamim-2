@echo off
rem Muda o diretorio para a raiz do projeto (um nivel acima da pasta scripts)
cd /d "%~dp0.."
echo ==========================================================
echo [SGO] CRIACAO DE SUPERUSUARIO DE DESENVOLVIMENTO
echo ==========================================================
echo Este script ira iniciar o processo de criacao de superusuario.
echo Voce sera solicitado a inserir login, senha e outras informacoes.
echo.
pause
echo.

echo Navegando para a pasta backend...
cd backend
IF ERRORLEVEL 1 (
    echo Erro ao acessar a pasta backend.
    pause
    exit /b %ERRORLEVEL%
)
echo.

echo Ativando ambiente virtual...
CALL .venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    ECHO [ERRO] Ambiente virtual nao encontrado em 'backend\.venv'.
    ECHO Execute 'scripts\config.bat' primeiro para configurar o ambiente.
    PAUSE
    EXIT /B 1
)
echo.
echo Iniciando o comando 'createsuperuser'...
echo Por favor, siga as instrucoes no terminal para criar seu superusuario.
python manage.py createsuperuser
echo.

echo ============================================================================
echo Processo de criacao de superusuario finalizado (verifique por erros acima).
echo Se bem-sucedido, voce agora pode usar essas credenciais para fazer login.
echo ============================================================================
pause
cd ..