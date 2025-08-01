@echo off
cd backend
CALL .venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    ECHO [ERRO] Ambiente virtual nao encontrado em 'backend\.venv'.
    ECHO Execute 'scripts\config.bat' primeiro para configurar o ambiente.
    PAUSE
    EXIT /B 1
)

echo Instalando dependencias do projeto a partir de requirements.txt...
python -m pip install -r requirements.txt

IF ERRORLEVEL 1 (
    echo ERRO: Falha ao instalar dependencias. Verifique o arquivo requirements.txt e a conexao com a internet.
    pause
    exit /b 1
)

echo Executando migracoes do Django...
python manage.py migrate

IF ERRORLEVEL 1 (
    echo ERRO: Falha ao executar migracoes. Verifique as configuracoes do Django e o banco de dados.
    pause
    exit /b 1
)

echo.
echo Script de migracoes e instalacao de dependencias concluido com sucesso.
echo Pressione qualquer tecla para sair.
pause > nul