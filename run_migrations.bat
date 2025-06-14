@echo off
echo Executando migrações do Django...
cd backend
python manage.py migrate
cd ..
echo.
echo Migrações concluídas. Pressione qualquer tecla para sair.
pause > nul
