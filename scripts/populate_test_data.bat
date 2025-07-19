@echo off
echo ========================================
echo    POPULANDO BANCO COM DADOS DE TESTE
echo ========================================
echo.

cd /d "%~dp0.."

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo.
echo Executando script de populacao...
python scripts\populate_test_data.py

echo.
echo Pressione qualquer tecla para continuar...
pause > nul