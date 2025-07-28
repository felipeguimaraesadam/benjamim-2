@echo off
echo ========================================
echo    POPULANDO BANCO COM DADOS DE TESTE
echo ========================================
echo.

cd /d "%~dp0.."

cd backend
CALL .venv\Scripts\activate.bat
IF ERRORLEVEL 1 (
    ECHO [ERRO] Ambiente virtual nao encontrado em 'backend\.venv'.
    ECHO Execute 'scripts\config.bat' primeiro para configurar o ambiente.
    PAUSE
    EXIT /B 1
)

echo.
echo Executando script de populacao...
python ..\scripts\populate_test_data.py

echo.
echo Pressione qualquer tecla para continuar...
pause > nul