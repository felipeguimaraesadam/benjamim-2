@echo off
echo Verificando Python e dependencias...

echo Instalando dependencias do projeto a partir de backend/requirements.txt...
python -m pip install -r backend/requirements.txt

IF ERRORLEVEL 1 (
    echo ERRO: Falha ao instalar dependencias. Verifique o arquivo backend/requirements.txt e a conexao com a internet.
    pause
    exit /b 1
)

echo Executando migracoes do Django...
python backend/manage.py migrate

IF ERRORLEVEL 1 (
    echo ERRO: Falha ao executar migracoes. Verifique as configuracoes do Django e o banco de dados.
    pause
    exit /b 1
)

echo.
echo Script de migracoes e instalacao de dependencias concluido com sucesso.
echo Pressione qualquer tecla para sair.
pause > nul