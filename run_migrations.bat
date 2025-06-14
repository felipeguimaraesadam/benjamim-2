@echo off
echo Ativando ambiente virtual (venv)...
CALL backend\venv\Scripts\activate.bat

IF ERRORLEVEL 1 (
    echo ERRO: Falha ao ativar o ambiente virtual. Verifique se o venv existe em backend\venv
    pause
    exit /b 1
)

echo Executando migrações do Django...
cd backend
python manage.py migrate
cd ..

echo.
echo Migrações concluídas. Pressione qualquer tecla para sair.
pause > nul
